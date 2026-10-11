import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { jwtVerify } from 'jose';
import { assignSequentialId } from '@/lib/booking-sequence';
import { sendBookingConfirmationEmail, sendAdminBookingConfirmationEmail } from '@/lib/zohoMail';
import { sendRoomConfirmationSMS } from '@/lib/sms';
import { formatDate } from '@/lib/utils';
import { broadcastRoomInventoryUpdate } from '@/lib/sse';

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

// POST /api/v1/admin/bookings/[id]/record-payment
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; // publicId
    
    // 1. Verify admin session
    const adminToken = req.cookies.get('punnami_admin_token')?.value;
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    const { payload } = await jwtVerify(adminToken, secret);
    if (!payload || (payload as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 401 });
    }

    const body = await req.json();
    const { amount, paymentMethod, collectedBy } = body;

    if (!paymentMethod || !['CASH', 'BANK_TRANSFER', 'UPI'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method. Supported: CASH, BANK_TRANSFER, UPI' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { publicId: id },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const currentPaid = Number(booking.paidAmount || 0);
    const total = Number(booking.totalAmount);
    const remaining = total - currentPaid;

    if (remaining <= 0.01) {
      return NextResponse.json({ error: 'No remaining balance to record payment for' }, { status: 400 });
    }

    const recordAmount = amount !== undefined && amount !== null ? Number(amount) : remaining;
    if (recordAmount > remaining + 0.01) {
      return NextResponse.json({ error: `Amount ₹${recordAmount} exceeds remaining balance ₹${remaining}` }, { status: 400 });
    }

    const finalRecordAmount = Math.min(recordAmount, remaining);

    // Transactionally record payment and update booking
    await prisma.$transaction(async (tx) => {
      // Re-fetch with row lock to avoid race conditions
      const lockedRows = await tx.$queryRaw<any[]>`
        SELECT id, status, "roomsBooked", "roomTypeId", "checkInDate", "checkOutDate", "slotStart", "slotEnd", "paidAmount", "totalAmount"
        FROM "Booking"
        WHERE id = ${booking.id}
        FOR UPDATE
      `;
      const currentBooking = lockedRows[0];
      if (!currentBooking) {
        throw new Error('Booking not found inside transaction');
      }

      const dbPaid = Number(currentBooking.paidAmount || 0);
      const dbTotal = Number(currentBooking.totalAmount);
      const nextPaid = Math.min(dbTotal, dbPaid + finalRecordAmount);
      const nextPercentage = Math.round((nextPaid / dbTotal) * 100);

      const previousStatus = currentBooking.status;
      const isTransitioningFromPending = ['PENDING_PROOF', 'PENDING_CONFIRMATION'].includes(previousStatus);

      let newStatus = previousStatus;
      if (nextPaid >= dbTotal - 0.01) {
        newStatus = 'CONFIRMED';
      } else {
        newStatus = 'PARTIAL_PAID';
      }

      // If transitioning from pending, transition inventory reservedRooms -> bookedRooms
      if (isTransitioningFromPending) {
        const dateRange: Date[] = [];
        const current = new Date(currentBooking.checkInDate);
        const checkOutTime = new Date(currentBooking.checkOutDate).getTime();
        if (currentBooking.checkInDate.getTime() === checkOutTime) {
          dateRange.push(new Date(currentBooking.checkInDate));
        } else {
          while (current.getTime() < checkOutTime) {
            dateRange.push(new Date(current));
            current.setUTCDate(current.getUTCDate() + 1);
          }
        }

        for (const date of dateRange) {
          await tx.roomInventory.updateMany({
            where: {
              roomTypeId: currentBooking.roomTypeId,
              date,
              slotStart: currentBooking.slotStart,
              slotEnd: currentBooking.slotEnd,
            },
            data: {
              reservedRooms: { decrement: currentBooking.roomsBooked },
              bookedRooms: { increment: currentBooking.roomsBooked },
            },
          });
        }
      }

      // Create Payment entry
      const pgTxnId = `MANUAL_${id.substring(4)}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          merchantTransactionId: pgTxnId,
          amount: finalRecordAmount,
          status: 'COMPLETED',
          providerResponse: JSON.stringify({
            paymentDetails: [{ transactionId: paymentMethod }],
            collectedBy: collectedBy || `Admin: ${(payload as any).email}`,
            paymentMethod,
          }),
        },
      });

      // Update Booking status, paidAmount, and paymentPercentage
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: newStatus as any,
          paidAmount: nextPaid,
          paymentPercentage: nextPercentage,
        },
      });

      // If transitioning to CONFIRMED or PARTIAL_PAID, assign sequenceId
      if (['CONFIRMED', 'PARTIAL_PAID'].includes(newStatus) && !['CONFIRMED', 'PARTIAL_PAID'].includes(previousStatus)) {
        await assignSequentialId(tx, booking.id);
      }
    });

    const updatedBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: { roomType: { include: { hotel: true } } },
    });

    // Send confirmation/partial-payment notifications
    if (updatedBooking) {
      const hotel = updatedBooking.roomType.hotel as { name: string };
      const displayId = updatedBooking.sequenceId || updatedBooking.publicId;
      const slotCheckInTime = formatSlotTime(updatedBooking.slotStart, '12:00 PM');
      const slotCheckOutTime = formatSlotTime(updatedBooking.slotEnd, '11:00 AM');

      // Broadcast SSE inventory update
      const dateRange: Date[] = [];
      const current = new Date(updatedBooking.checkInDate);
      const checkOutTimeMs = new Date(updatedBooking.checkOutDate).getTime();
      if (updatedBooking.checkInDate.getTime() === checkOutTimeMs) {
        dateRange.push(new Date(updatedBooking.checkInDate));
      } else {
        while (current.getTime() < checkOutTimeMs) {
          dateRange.push(new Date(current));
          current.setUTCDate(current.getUTCDate() + 1);
        }
      }
      for (const date of dateRange) {
        broadcastRoomInventoryUpdate(updatedBooking.roomTypeId, date, updatedBooking.slotStart, updatedBooking.slotEnd);
      }

      try {
        await sendRoomConfirmationSMS({
          customerName: updatedBooking.guestName,
          customerPhone: updatedBooking.guestPhone,
          publicId: displayId,
          hotelName: hotel.name,
          roomName: updatedBooking.roomType.name,
          checkInDate: formatDate(updatedBooking.checkInDate),
          checkInTime: slotCheckInTime,
          checkOutDate: formatDate(updatedBooking.checkOutDate),
          checkOutTime: slotCheckOutTime,
          paidAmount: `₹${Number(updatedBooking.paidAmount || updatedBooking.totalAmount).toLocaleString('en-IN')}`,
          totalAmount: `₹${Number(updatedBooking.totalAmount).toLocaleString('en-IN')}`,
        });
      } catch (smsErr) {
        console.error('[Record Payment] SMS send failed:', smsErr);
      }
      if (updatedBooking.guestEmail) {
        try {
          await sendBookingConfirmationEmail({
            guestEmail: updatedBooking.guestEmail,
            guestName: updatedBooking.guestName,
            publicId: displayId,
            roomName: updatedBooking.roomType.name,
            checkInDate: formatDate(updatedBooking.checkInDate),
            checkInTime: slotCheckInTime,
            checkOutDate: formatDate(updatedBooking.checkOutDate),
            checkOutTime: slotCheckOutTime,
            nights: updatedBooking.totalNights,
            rooms: updatedBooking.roomsBooked,
            paidAmount: (updatedBooking.paidAmount || updatedBooking.totalAmount).toString(),
            totalAmount: updatedBooking.totalAmount.toString(),
          });
        } catch (mailErr) {
          console.error('[Record Payment] Guest email send failed:', mailErr);
        }
      }
      try {
        await sendAdminBookingConfirmationEmail({
          guestName: updatedBooking.guestName,
          guestEmail: updatedBooking.guestEmail,
          guestPhone: updatedBooking.guestPhone,
          publicId: displayId,
          roomName: updatedBooking.roomType.name,
          checkInDate: formatDate(updatedBooking.checkInDate),
          checkInTime: slotCheckInTime,
          checkOutDate: formatDate(updatedBooking.checkOutDate),
          checkOutTime: slotCheckOutTime,
          nights: updatedBooking.totalNights,
          rooms: updatedBooking.roomsBooked,
          paidAmount: (updatedBooking.paidAmount || updatedBooking.totalAmount).toString(),
          totalAmount: updatedBooking.totalAmount.toString(),
        });
      } catch (adminMailErr) {
        console.error('[Record Payment] Admin email send failed:', adminMailErr);
      }
    }

    return NextResponse.json({ success: true, message: 'Payment recorded successfully' });
  } catch (err: any) {
    console.error('[Admin Record Payment API] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to record payment' }, { status: 500 });
  }
}
