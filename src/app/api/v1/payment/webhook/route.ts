import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getPhonePeClient } from '@/lib/phonepe';
import { broadcastRoomInventoryUpdate } from '@/lib/sse';
import { formatDate } from '@/lib/utils';
import { sendRoomConfirmationSMS } from '@/lib/sms';
import { sendBookingConfirmationEmail, sendAdminBookingConfirmationEmail } from '@/lib/zohoMail';
import { assignSequentialId } from '@/lib/booking-sequence';

function formatSlotTime(timeStr?: string | null, fallback: string = '12:00 PM') {
  if (!timeStr) return fallback;
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return fallback;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours.toString().padStart(2, '0')}:${displayMinutes} ${period}`;
  } catch {
    return fallback;
  }
}

/**
 * PhonePe S2S (Server-to-Server) Webhook — v2 Business API
 *
 * PhonePe sends a POST with a JSON body. The Authorization header contains
 * a SHA-256 HMAC used by the SDK's validateCallback to verify authenticity.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let parsedBody: any;

    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const client = getPhonePeClient();
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
    const cbUser = process.env.PHONEPE_CALLBACK_USERNAME;
    const cbPass = process.env.PHONEPE_CALLBACK_PASSWORD;

    let merchantOrderId: string | null = null;
    let phonePeTransactionId: string | null = null;
    let verifiedSuccess = false;

    // ── Path 1: Validate using SDK (requires callback credentials configured in PhonePe dashboard) ──
    if (cbUser && cbPass && authHeader) {
      try {
        const cbVal = client.validateCallback(cbUser, cbPass, authHeader, rawBody);
        const state = cbVal?.payload?.state?.toUpperCase();
        if (state === 'COMPLETED') {
          verifiedSuccess = true;
          merchantOrderId = cbVal.payload.orderId || cbVal.payload.merchantOrderId || null;
          phonePeTransactionId = cbVal.payload.paymentDetails?.[0]?.transactionId || null;
        } else {
          return NextResponse.json({ success: true, message: 'Acknowledged non-COMPLETED state' });
        }
      } catch (err) {
        console.error('[Webhook] SDK validateCallback failed:', err);
        return NextResponse.json({ error: 'Invalid callback signature' }, { status: 401 });
      }
    } else {
      // ── Path 2: No credentials configured — verify via API ──
      const payload = parsedBody?.payload;
      const bodyType: string = (parsedBody?.type || '').toUpperCase();

      merchantOrderId = payload?.orderId || payload?.merchantOrderId || null;

      if (!merchantOrderId) {
        console.warn('[Webhook] Could not extract orderId from body:', JSON.stringify(parsedBody).slice(0, 200));
        return NextResponse.json({ error: 'Missing orderId in webhook body' }, { status: 400 });
      }

      if (bodyType.includes('COMPLETED') || bodyType.includes('SUCCESS')) {
        try {
          const verifyResult = await client.getOrderStatus(merchantOrderId);
          const pgState = verifyResult?.state?.toUpperCase();
          if (pgState === 'COMPLETED') {
            verifiedSuccess = true;
            phonePeTransactionId = verifyResult.paymentDetails?.[0]?.transactionId || null;
          }
        } catch (err) {
          console.error('[Webhook] getOrderStatus verification failed:', err);
          return NextResponse.json({ success: false, message: 'Verification call failed' }, { status: 502 });
        }
      } else {
        return NextResponse.json({ success: true, message: 'Acknowledged non-success webhook' });
      }
    }

    if (!verifiedSuccess || !merchantOrderId) {
      return NextResponse.json({ success: false, message: 'Payment not COMPLETED or orderId missing' });
    }

    // Find the payment record
    const paymentRecord = await prisma.payment.findFirst({
      where: { merchantTransactionId: merchantOrderId },
    });

    if (!paymentRecord) {
      console.warn('[Webhook] No payment record found for orderId:', merchantOrderId);
      return NextResponse.json({ success: true, message: 'Payment record not found yet — will reconcile' });
    }

    const bookingId = paymentRecord.bookingId;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { roomType: { include: { hotel: true } } },
    });

    if (!booking || booking.status === 'CONFIRMED') {
      return NextResponse.json({ success: true, message: 'Booking already confirmed or not found' });
    }

    // Transactionally update booking + payment status and transition inventory
    await prisma.$transaction(async (tx) => {
      const lockedRows = await tx.$queryRaw<{ id: bigint; status: string; paymentPercentage: string | null }[]>`
        SELECT id, status, "paymentPercentage" FROM "Booking" WHERE id = ${bookingId} FOR UPDATE
      `;
      const currentBooking = lockedRows[0];

      if (!currentBooking || currentBooking.status === 'CONFIRMED') {
        return;
      }

      const paymentPercentage = currentBooking.paymentPercentage
        ? Number(currentBooking.paymentPercentage)
        : 100;

      let newStatus: string;
      let extraData: Record<string, any> = { transactionId: phonePeTransactionId };

      if (currentBooking.status === 'PARTIAL_PAID') {
        newStatus = 'CONFIRMED';
        extraData = { ...extraData, paymentPercentage: 100, paidAmount: booking.totalAmount };
      } else {
        newStatus = paymentPercentage < 100 ? 'PARTIAL_PAID' : 'CONFIRMED';

        // Transition inventory: reservedRooms -> bookedRooms
        const dateRange: Date[] = [];
        const current = new Date(booking.checkInDate);
        const checkOutTime = new Date(booking.checkOutDate).getTime();
        if (booking.checkInDate.getTime() === checkOutTime) {
          dateRange.push(new Date(booking.checkInDate));
        } else {
          while (current.getTime() < checkOutTime) {
            dateRange.push(new Date(current));
            current.setUTCDate(current.getUTCDate() + 1);
          }
        }

        for (const date of dateRange) {
          if (currentBooking.status === 'EXPIRED') {
            await tx.roomInventory.updateMany({
              where: {
                roomTypeId: booking.roomTypeId,
                date,
                slotStart: booking.slotStart,
                slotEnd: booking.slotEnd,
              },
              data: {
                bookedRooms: { increment: booking.roomsBooked },
              },
            });
          } else {
            await tx.roomInventory.updateMany({
              where: {
                roomTypeId: booking.roomTypeId,
                date,
                slotStart: booking.slotStart,
                slotEnd: booking.slotEnd,
              },
              data: {
                reservedRooms: { decrement: booking.roomsBooked },
                bookedRooms: { increment: booking.roomsBooked },
              },
            });
          }
        }
      }

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: newStatus as any, ...extraData },
      });

      await tx.payment.update({
        where: { id: paymentRecord.id },
        data: {
          status: 'COMPLETED',
          providerResponse: JSON.stringify({ merchantOrderId, phonePeTransactionId }),
        },
      });

      await assignSequentialId(tx, bookingId);
    });

    const freshBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { roomType: { include: { hotel: true } } }
    });
    const activeBooking = freshBooking || booking;
    const displayId = activeBooking.sequenceId || activeBooking.publicId;

    // Send confirmation notifications (best-effort, non-blocking)
    const hotel = activeBooking.roomType.hotel as { name: string };
    const slotCheckInTime = formatSlotTime(activeBooking.slotStart, '12:00 PM');
    const slotCheckOutTime = formatSlotTime(activeBooking.slotEnd, '11:00 AM');
    try {
      await sendRoomConfirmationSMS({
        customerName: activeBooking.guestName,
        customerPhone: activeBooking.guestPhone,
        publicId: displayId,
        hotelName: hotel.name,
        roomName: activeBooking.roomType.name,
        checkInDate: formatDate(activeBooking.checkInDate),
        checkInTime: slotCheckInTime,
        checkOutDate: formatDate(activeBooking.checkOutDate),
        checkOutTime: slotCheckOutTime,
        paidAmount: `₹${Number(activeBooking.paidAmount || activeBooking.totalAmount).toLocaleString('en-IN')}`,
        totalAmount: `₹${Number(activeBooking.totalAmount).toLocaleString('en-IN')}`,
      });
    } catch (smsErr) {
      console.error('[Webhook] SMS send failed:', smsErr);
    }
    try {
      await sendBookingConfirmationEmail({
        guestEmail: activeBooking.guestEmail,
        guestName: activeBooking.guestName,
        publicId: displayId,
        roomName: activeBooking.roomType.name,
        checkInDate: formatDate(activeBooking.checkInDate),
        checkInTime: slotCheckInTime,
        checkOutDate: formatDate(activeBooking.checkOutDate),
        checkOutTime: slotCheckOutTime,
        nights: activeBooking.totalNights,
        rooms: activeBooking.roomsBooked,
        paidAmount: (activeBooking.paidAmount || activeBooking.totalAmount).toString(),
        totalAmount: activeBooking.totalAmount.toString(),
      });
    } catch (mailErr) {
      console.error('[Webhook] Email send failed:', mailErr);
    }
    try {
      await sendAdminBookingConfirmationEmail({
        guestName: activeBooking.guestName,
        guestEmail: activeBooking.guestEmail,
        guestPhone: activeBooking.guestPhone,
        publicId: displayId,
        roomName: activeBooking.roomType.name,
        checkInDate: formatDate(activeBooking.checkInDate),
        checkInTime: slotCheckInTime,
        checkOutDate: formatDate(activeBooking.checkOutDate),
        checkOutTime: slotCheckOutTime,
        nights: activeBooking.totalNights,
        rooms: activeBooking.roomsBooked,
        paidAmount: (activeBooking.paidAmount || activeBooking.totalAmount).toString(),
        totalAmount: activeBooking.totalAmount.toString(),
      });
    } catch (adminMailErr) {
      console.error('[Webhook] Admin Email send failed:', adminMailErr);
    }

    // Broadcast inventory updates to SSE clients
    const dateRange: Date[] = [];
    const current = new Date(booking.checkInDate);
    const checkOutTime = new Date(booking.checkOutDate).getTime();
    if (booking.checkInDate.getTime() === checkOutTime) {
      dateRange.push(new Date(booking.checkInDate));
    } else {
      while (current.getTime() < checkOutTime) {
        dateRange.push(new Date(current));
        current.setUTCDate(current.getUTCDate() + 1);
      }
    }
    for (const date of dateRange) {
      broadcastRoomInventoryUpdate(booking.roomTypeId, date, booking.slotStart, booking.slotEnd);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Webhook] Unhandled error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
