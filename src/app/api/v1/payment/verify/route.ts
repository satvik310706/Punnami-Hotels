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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get('bookingId');

  if (!bookingId) {
    return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { publicId: bookingId },
      include: { roomType: { include: { hotel: true } } }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status === 'CONFIRMED') {
      return NextResponse.json({ status: 'COMPLETED' });
    }

    const paymentRecord = await prisma.payment.findFirst({
      where: { bookingId: booking.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!paymentRecord) {
      return NextResponse.json({ status: 'PENDING' });
    }

    const client = getPhonePeClient();
    const statusResult = await client.getOrderStatus(paymentRecord.merchantTransactionId);
    const pgState = statusResult?.state?.toUpperCase();

    if (pgState === 'COMPLETED') {
      const transactionId = statusResult.paymentDetails?.[0]?.transactionId || null;

      // Transactional status update
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
            where: { id: booking.id },
            data: updateData
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
        console.error('[Verify Approve] SMS send failed:', smsErr);
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
        console.error('[Verify Approve] Email send failed:', mailErr);
      }
      try {
        await sendAdminBookingConfirmationEmail({
          adminEmail: process.env.ADMIN_EMAIL || 'punnamirooms@gmail.com',
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
        console.error('[Verify Approve] Admin Email send failed:', adminMailErr);
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

      return NextResponse.json({ status: 'COMPLETED' });
    } else if (pgState === 'FAILED' || pgState === 'CANCELLED') {
      await prisma.payment.update({
        where: { merchantTransactionId: paymentRecord.merchantTransactionId },
        data: {
          status: 'FAILED',
          providerResponse: JSON.stringify(statusResult)
        }
      });

      // If hold has expired or was pending, release reserved inventory so it is not still counted
      if ((!booking.expiresAt || new Date() > new Date(booking.expiresAt)) && 
          (booking.status === 'PENDING_PROOF' || booking.status === 'PENDING_CONFIRMATION')) {
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
          await prisma.$executeRaw`
            UPDATE "RoomInventory"
            SET "reservedRooms" = GREATEST(0, "reservedRooms" - ${booking.roomsBooked})
            WHERE "roomTypeId" = ${booking.roomTypeId}
              AND "date" = ${date}
              AND "slotStart" = ${booking.slotStart}
              AND "slotEnd" = ${booking.slotEnd}
          `;
          broadcastRoomInventoryUpdate(booking.roomTypeId, date, booking.slotStart, booking.slotEnd);
        }
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: 'EXPIRED' }
        });
      }

      return NextResponse.json({ status: 'FAILED' });
    }

    return NextResponse.json({ status: 'PENDING' });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
