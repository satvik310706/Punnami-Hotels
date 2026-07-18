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

// GET handler: Handles user navigation/redirect back from PhonePe
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get('bookingId');
  const originUrl = new URL(req.url).origin;
  const appUrl = originUrl.includes('localhost') ? originUrl : (process.env.NEXT_PUBLIC_SITE_URL || originUrl);

  if (!bookingId) {
    return NextResponse.redirect(`${appUrl}/rooms`, { status: 303 });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { publicId: bookingId },
      include: { roomType: { include: { hotel: true } } },
    });

    if (!booking) {
      return NextResponse.redirect(`${appUrl}/rooms?status=error&msg=NotFound`, { status: 303 });
    }

    if (booking.status === 'CONFIRMED') {
      return NextResponse.redirect(`${appUrl}/booking/${booking.publicId}?status=success`, { status: 303 });
    }

    const paymentRecord = await prisma.payment.findFirst({
      where: { bookingId: booking.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!paymentRecord) {
      return NextResponse.redirect(`${appUrl}/booking/${booking.publicId}?status=verifying`, { status: 303 });
    }

    if (paymentRecord.status === 'COMPLETED') {
      return NextResponse.redirect(`${appUrl}/booking/${booking.publicId}?status=success`, { status: 303 });
    }

    const client = getPhonePeClient();
    const statusResult = await client.getOrderStatus(paymentRecord.merchantTransactionId);
    const pgState = statusResult?.state?.toUpperCase();

    if (pgState === 'COMPLETED') {
      const transactionId = statusResult.paymentDetails?.[0]?.transactionId || null;

      // Wrap in transactional row-lock update
      await prisma.$transaction(async (tx) => {
        const lockedBookings = await tx.$queryRaw<{ id: bigint; status: string }[]>`
          SELECT id, status FROM "Booking" WHERE id = ${booking.id} FOR UPDATE
        `;
        const currentBooking = lockedBookings[0];

        if (currentBooking && currentBooking.status !== 'CONFIRMED') {
          let targetStatus = currentBooking.status;
          const updateData: any = { transactionId };

          if (currentBooking.status === 'PARTIAL_PAID') {
            targetStatus = 'CONFIRMED';
            updateData.status = 'CONFIRMED';
            updateData.paymentPercentage = 100;
            updateData.paidAmount = booking.totalAmount;
          } else {
            const paymentPercentage = booking.paymentPercentage ? Number(booking.paymentPercentage) : 100;
            targetStatus = paymentPercentage < 100 ? 'PARTIAL_PAID' : 'CONFIRMED';
            updateData.status = targetStatus;

            // Transition inventory from reserved (hold) to booked
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

          await tx.booking.update({
            where: { id: booking.id },
            data: updateData,
          });

          await tx.payment.update({
            where: { merchantTransactionId: paymentRecord.merchantTransactionId },
            data: {
              status: 'COMPLETED',
              providerResponse: JSON.stringify(statusResult)
            }
          });
          
          await assignSequentialId(tx, booking.id);
        }
      });
      
      const freshBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
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
        console.error('[Callback Approve] SMS send failed:', smsErr);
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
        console.error('[Callback Approve] Email send failed:', mailErr);
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
        console.error('[Callback Approve] Admin Email send failed:', adminMailErr);
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

      return NextResponse.redirect(`${appUrl}/booking/${booking.publicId}?status=success`, { status: 303 });
    } else if (pgState === 'FAILED' || pgState === 'CANCELLED') {
      await prisma.payment.update({
        where: { merchantTransactionId: paymentRecord.merchantTransactionId },
        data: {
          status: 'FAILED',
          providerResponse: JSON.stringify(statusResult)
        }
      });

      return NextResponse.redirect(`${appUrl}/booking/${booking.publicId}?status=failed`, { status: 303 });
    }

    return NextResponse.redirect(`${appUrl}/booking/${booking.publicId}?status=verifying`, { status: 303 });
  } catch (error) {
    console.error('Redirection verification error:', error);
    return NextResponse.redirect(`${appUrl}/booking/${bookingId}?status=verifying`, { status: 303 });
  }
}

// POST handler: Handles browser-redirect POST callbacks from PhonePe
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get('bookingId');
  const originUrl = new URL(req.url).origin;
  const appUrl = originUrl.includes('localhost') ? originUrl : (process.env.NEXT_PUBLIC_SITE_URL || originUrl);

  if (!bookingId) {
    return NextResponse.redirect(`${appUrl}/rooms`, { status: 303 });
  }

  try {
    const formData = await req.formData();
    const responseBody = formData.get('response') as string;

    if (!responseBody) {
      return NextResponse.redirect(`${appUrl}/booking/${bookingId}?status=failed&msg=NoResponse`, { status: 303 });
    }

    // Decode Base64 response
    const decodedBuffer = Buffer.from(responseBody, 'base64');
    const decodedJson = JSON.parse(decodedBuffer.toString('utf-8'));

    const { code, success, data } = decodedJson;
    const merchantTransactionId = data?.merchantTransactionId;
    let phonePeTransactionId = data?.transactionId || null;

    const booking = await prisma.booking.findUnique({
      where: { publicId: bookingId },
      include: { roomType: { include: { hotel: true } } },
    });

    if (!booking) {
      return NextResponse.redirect(`${appUrl}/rooms?status=error&msg=NotFound`, { status: 303 });
    }

    if (booking.status === 'CONFIRMED') {
      return NextResponse.redirect(`${appUrl}/booking/${booking.publicId}?status=success`, { status: 303 });
    }

    let verifiedState: 'COMPLETED' | 'FAILED' | 'PENDING' = 'PENDING';

    if (code === 'PAYMENT_SUCCESS' && success) {
      try {
        const client = getPhonePeClient();
        const verifyResult = await client.getOrderStatus(merchantTransactionId);
        const state = verifyResult?.state?.toUpperCase();

        if (state === 'COMPLETED') {
          verifiedState = 'COMPLETED';
          if (verifyResult.paymentDetails && verifyResult.paymentDetails.length > 0) {
            phonePeTransactionId = verifyResult.paymentDetails[0].transactionId || phonePeTransactionId;
          }
        } else if (state === 'FAILED' || state === 'CANCELLED' || state === 'PAYMENT_CANCELLED') {
          verifiedState = 'FAILED';
        }
      } catch (err) {
        console.error('PhonePe SDK status verification failed inside POST callback. Falling back to payload.', err);
        if (code === 'PAYMENT_SUCCESS') {
          verifiedState = 'COMPLETED';
        }
      }
    } else if (code === 'PAYMENT_ERROR' || success === false) {
      verifiedState = 'FAILED';
    }

    if (verifiedState === 'COMPLETED') {
      // Wrap in transactional row-lock update
      await prisma.$transaction(async (tx) => {
        const lockedBookings = await tx.$queryRaw<{ id: bigint; status: string }[]>`
          SELECT id, status FROM "Booking" WHERE id = ${booking.id} FOR UPDATE
        `;
        const currentBooking = lockedBookings[0];

        if (currentBooking && currentBooking.status !== 'CONFIRMED') {
          let targetStatus = currentBooking.status;
          const updateData: any = { transactionId: phonePeTransactionId };

          if (currentBooking.status === 'PARTIAL_PAID') {
            targetStatus = 'CONFIRMED';
            updateData.status = 'CONFIRMED';
            updateData.paymentPercentage = 100;
            updateData.paidAmount = booking.totalAmount;
          } else {
            const paymentPercentage = booking.paymentPercentage ? Number(booking.paymentPercentage) : 100;
            targetStatus = paymentPercentage < 100 ? 'PARTIAL_PAID' : 'CONFIRMED';
            updateData.status = targetStatus;

            // Transition inventory from reserved to booked
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

          await tx.booking.update({
            where: { id: booking.id },
            data: updateData,
          });

          await tx.payment.upsert({
            where: { merchantTransactionId },
            update: { status: 'COMPLETED', providerResponse: JSON.stringify(decodedJson) },
            create: {
              bookingId: booking.id,
              merchantTransactionId,
              amount: Number(booking.paidAmount || booking.totalAmount),
              status: 'COMPLETED',
              providerResponse: JSON.stringify(decodedJson)
            }
          });
        }
      });

      // Send confirmation notifications (best-effort, non-blocking)
      const freshBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: { roomType: { include: { hotel: true } } }
      });
      const activeBooking = freshBooking || booking;
      const displayId = activeBooking.sequenceId || activeBooking.publicId;
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
        console.error('[Callback Approve] SMS send failed:', smsErr);
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
        console.error('[Callback Approve] Email send failed:', mailErr);
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
        console.error('[Callback Approve] Admin Email send failed:', adminMailErr);
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

      return NextResponse.redirect(`${appUrl}/booking/${booking.publicId}?status=success`, { status: 303 });
    } else if (verifiedState === 'FAILED') {
      if (merchantTransactionId) {
        await prisma.payment.upsert({
          where: { merchantTransactionId },
          update: { status: 'FAILED', providerResponse: JSON.stringify(decodedJson) },
          create: {
            bookingId: booking.id,
            merchantTransactionId,
            amount: Number(booking.paidAmount || booking.totalAmount),
            status: 'FAILED',
            providerResponse: JSON.stringify(decodedJson)
          }
        });
      }
      return NextResponse.redirect(`${appUrl}/booking/${booking.publicId}?status=failed`, { status: 303 });
    }

    return NextResponse.redirect(`${appUrl}/booking/${booking.publicId}?status=verifying`, { status: 303 });
  } catch (error) {
    console.error('POST Callback: Error processing PhonePe redirect POST payload:', error);
    return NextResponse.redirect(`${appUrl}/booking/${bookingId}?status=verifying`, { status: 303 });
  }
}
