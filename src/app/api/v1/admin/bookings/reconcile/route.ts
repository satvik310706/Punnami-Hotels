import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getPhonePeClient } from '@/lib/phonepe';
import { jwtVerify } from 'jose';
import { sendBookingConfirmationEmail, sendAdminBookingConfirmationEmail } from '@/lib/zohoMail';
import { sendRoomConfirmationSMS } from '@/lib/sms';
import { formatDate } from '@/lib/utils';
import { broadcastRoomInventoryUpdate } from '@/lib/sse';
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

export async function POST(req: NextRequest) {
  try {
    const adminToken = req.cookies.get('punnami_admin_token')?.value;
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    const { payload } = await jwtVerify(adminToken, secret);
    if (!payload || (payload as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 401 });
    }

    const pendingBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['PENDING_PROOF', 'PENDING_CONFIRMATION', 'PARTIAL_PAID', 'EXPIRED'] as any[] },
        payments: { some: { status: { in: ['PENDING', 'FAILED'] } } },
      },
      include: {
        payments: { where: { status: { in: ['PENDING', 'FAILED'] } }, orderBy: { createdAt: 'desc' } },
        roomType: { include: { hotel: true } },
      },
    });

    const client = getPhonePeClient();
    const results: { bookingId: string; action: string; status: string }[] = [];

    for (const booking of pendingBookings) {
      const payment = booking.payments[0];
      if (!payment) continue;

      try {
        const pgStatus = await client.getOrderStatus(payment.merchantTransactionId);
        const pgState = pgStatus?.state?.toUpperCase();

        if (pgState === 'COMPLETED') {
          const transactionId = pgStatus.paymentDetails?.[0]?.transactionId || null;

          await prisma.$transaction(async (tx) => {
            const lockedRows = await tx.$queryRaw<{ id: bigint; status: string }[]>`
              SELECT id, status FROM "Booking" WHERE id = ${booking.id} FOR UPDATE
            `;
            const cur = lockedRows[0];
            if (!cur || cur.status === 'CONFIRMED') return;

            const paymentPercentage = booking.paymentPercentage ? Number(booking.paymentPercentage) : 100;
            let newStatus: string;
            const updateData: any = { transactionId };

            if (cur.status === 'PARTIAL_PAID') {
              newStatus = 'CONFIRMED';
              updateData.status = 'CONFIRMED';
              updateData.paymentPercentage = 100;
              updateData.paidAmount = booking.totalAmount;
            } else {
              newStatus = paymentPercentage < 100 ? 'PARTIAL_PAID' : 'CONFIRMED';
              updateData.status = newStatus;

              const dateRange: Date[] = [];
              const c = new Date(booking.checkInDate);
              const endMs = new Date(booking.checkOutDate).getTime();
              if (booking.checkInDate.getTime() === endMs) {
                dateRange.push(new Date(booking.checkInDate));
              } else {
                while (c.getTime() < endMs) {
                  dateRange.push(new Date(c));
                  c.setUTCDate(c.getUTCDate() + 1);
                }
              }
              for (const date of dateRange) {
                if (cur.status === 'EXPIRED') {
                  // Inventory was already released from hold, so only increment booked
                  await tx.roomInventory.updateMany({
                    where: { roomTypeId: booking.roomTypeId, date, slotStart: booking.slotStart, slotEnd: booking.slotEnd },
                    data: { bookedRooms: { increment: booking.roomsBooked } },
                  });
                } else {
                  // Transition from reserved to booked
                  await tx.roomInventory.updateMany({
                    where: { roomTypeId: booking.roomTypeId, date, slotStart: booking.slotStart, slotEnd: booking.slotEnd },
                    data: { reservedRooms: { decrement: booking.roomsBooked }, bookedRooms: { increment: booking.roomsBooked } },
                  });
                }
              }
            }

            await tx.booking.update({ where: { id: booking.id }, data: updateData });
            await tx.payment.update({
              where: { id: payment.id },
              data: { status: 'COMPLETED', providerResponse: JSON.stringify(pgStatus) },
            });
            await assignSequentialId(tx, booking.id);
          });

          const freshBooking = await prisma.booking.findUnique({
            where: { id: booking.id },
            include: { roomType: { include: { hotel: true } } },
          });
          if (freshBooking) {
            const hotel = freshBooking.roomType.hotel as { name: string };
            const displayId = freshBooking.sequenceId || freshBooking.publicId;
            const slotIn = formatSlotTime(freshBooking.slotStart, '12:00 PM');
            const slotOut = formatSlotTime(freshBooking.slotEnd, '11:00 AM');

            const dateRange: Date[] = [];
            const c = new Date(freshBooking.checkInDate);
            const endMs = new Date(freshBooking.checkOutDate).getTime();
            if (freshBooking.checkInDate.getTime() === endMs) {
              dateRange.push(new Date(freshBooking.checkInDate));
            } else {
              while (c.getTime() < endMs) {
                dateRange.push(new Date(c));
                c.setUTCDate(c.getUTCDate() + 1);
              }
            }
            for (const date of dateRange) {
              broadcastRoomInventoryUpdate(freshBooking.roomTypeId, date, freshBooking.slotStart, freshBooking.slotEnd);
            }

            try {
              await sendRoomConfirmationSMS({
                customerName: freshBooking.guestName, customerPhone: freshBooking.guestPhone,
                publicId: displayId, hotelName: hotel.name, roomName: freshBooking.roomType.name,
                checkInDate: formatDate(freshBooking.checkInDate), checkInTime: slotIn,
                checkOutDate: formatDate(freshBooking.checkOutDate), checkOutTime: slotOut,
                paidAmount: `\u20b9${Number(freshBooking.paidAmount || freshBooking.totalAmount).toLocaleString('en-IN')}`,
                totalAmount: `\u20b9${Number(freshBooking.totalAmount).toLocaleString('en-IN')}`,
              });
            } catch (e) { console.error('[Reconcile] SMS failed for', booking.publicId, e); }

            if (freshBooking.guestEmail) {
              try {
                await sendBookingConfirmationEmail({
                  guestEmail: freshBooking.guestEmail, guestName: freshBooking.guestName,
                  publicId: displayId, roomName: freshBooking.roomType.name,
                  checkInDate: formatDate(freshBooking.checkInDate), checkInTime: slotIn,
                  checkOutDate: formatDate(freshBooking.checkOutDate), checkOutTime: slotOut,
                  nights: freshBooking.totalNights, rooms: freshBooking.roomsBooked,
                  paidAmount: (freshBooking.paidAmount || freshBooking.totalAmount).toString(),
                  totalAmount: freshBooking.totalAmount.toString(),
                });
              } catch (e) { console.error('[Reconcile] Guest email failed for', booking.publicId, e); }
            }

            try {
              await sendAdminBookingConfirmationEmail({
                guestName: freshBooking.guestName, guestEmail: freshBooking.guestEmail,
                guestPhone: freshBooking.guestPhone, publicId: displayId,
                roomName: freshBooking.roomType.name,
                checkInDate: formatDate(freshBooking.checkInDate), checkInTime: slotIn,
                checkOutDate: formatDate(freshBooking.checkOutDate), checkOutTime: slotOut,
                nights: freshBooking.totalNights, rooms: freshBooking.roomsBooked,
                paidAmount: (freshBooking.paidAmount || freshBooking.totalAmount).toString(),
                totalAmount: freshBooking.totalAmount.toString(),
              });
            } catch (e) { console.error('[Reconcile] Admin email failed for', booking.publicId, e); }
          }

          results.push({ bookingId: booking.publicId, action: 'FIXED', status: 'CONFIRMED_OR_PARTIAL_PAID' });
        } else if (pgState === 'FAILED' || pgState === 'CANCELLED') {
          // Release reserved inventory if booking was still pending hold
          if (booking.status === 'PENDING_PROOF' || booking.status === 'PENDING_CONFIRMATION') {
            const dateRange: Date[] = [];
            const c = new Date(booking.checkInDate);
            const endMs = new Date(booking.checkOutDate).getTime();
            if (booking.checkInDate.getTime() === endMs) {
              dateRange.push(new Date(booking.checkInDate));
            } else {
              while (c.getTime() < endMs) {
                dateRange.push(new Date(c));
                c.setUTCDate(c.getUTCDate() + 1);
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
              data: { status: 'EXPIRED' },
            });
          }

          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'FAILED', providerResponse: JSON.stringify(pgStatus) },
          });
          results.push({ bookingId: booking.publicId, action: 'PAYMENT_FAILED', status: pgState });
        } else {
          results.push({ bookingId: booking.publicId, action: 'STILL_PENDING', status: pgState || 'UNKNOWN' });
        }
      } catch (err) {
        console.error('[Reconcile] Error for booking', booking.publicId, err);
        results.push({ bookingId: booking.publicId, action: 'ERROR', status: 'CHECK_FAILED' });
      }
    }

    return NextResponse.json({ success: true, checked: pendingBookings.length, results });
  } catch (err: any) {
    console.error('[Reconcile] Fatal error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
