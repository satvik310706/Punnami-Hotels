import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { sendRoomConfirmationSMS } from '@/lib/sms';
import { sendBookingConfirmationEmail, sendAdminBookingConfirmationEmail } from '@/lib/zohoMail';
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

// POST /api/v1/admin/bookings/[id] — Approve or Reject a booking
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, postponeNewDate } = body; // "APPROVE" | "REJECT" ...

    if (!action || !['APPROVE', 'REJECT', 'APPROVE_CANCEL', 'REJECT_CANCEL', 'APPROVE_POSTPONE', 'REJECT_POSTPONE', 'MARK_REFUNDED'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { publicId: id },
      include: { roomType: { include: { hotel: true } } },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      // Confirm booking — move reserved rooms to booked rooms
      await prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { publicId: id },
          data: { status: 'CONFIRMED' },
        });

        // Move reservedRooms → bookedRooms for each date in range
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
              bookedRooms:   { increment: booking.roomsBooked },
            },
          });
        }
        
        await assignSequentialId(tx, booking.id);
      });

      const freshBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: { roomType: { include: { hotel: true } } }
      });
      const activeBooking = freshBooking || booking;
      const displayId = activeBooking.sequenceId || activeBooking.publicId;

      // Send confirmation notifications (best-effort, non-blocking)
      const hotel = activeBooking.roomType.hotel as { name: string };
      const checkInTime = formatSlotTime(activeBooking.slotStart, '12:00 PM');
      const checkOutTime = formatSlotTime(activeBooking.slotEnd, '11:00 AM');
      try {
        await sendRoomConfirmationSMS({
          customerName: activeBooking.guestName,
          customerPhone: activeBooking.guestPhone,
          publicId: displayId,
          hotelName: hotel.name,
          roomName: activeBooking.roomType.name,
          checkInDate: formatDate(activeBooking.checkInDate),
          checkInTime: checkInTime,
          checkOutDate: formatDate(activeBooking.checkOutDate),
          checkOutTime: checkOutTime,
          paidAmount: `₹${Number(activeBooking.paidAmount || activeBooking.totalAmount).toLocaleString('en-IN')}`,
          totalAmount: `₹${Number(activeBooking.totalAmount).toLocaleString('en-IN')}`,
        });
      } catch (smsErr) {
        console.error('[Admin Approve] SMS send failed:', smsErr);
      }
      try {
        await sendBookingConfirmationEmail({
          guestEmail: activeBooking.guestEmail,
          guestName: activeBooking.guestName,
          publicId: displayId,
          roomName: activeBooking.roomType.name,
          checkInDate: formatDate(activeBooking.checkInDate),
          checkInTime: checkInTime,
          checkOutDate: formatDate(activeBooking.checkOutDate),
          checkOutTime: checkOutTime,
          nights: activeBooking.totalNights,
          rooms: activeBooking.roomsBooked,
          paidAmount: (activeBooking.paidAmount || activeBooking.totalAmount).toString(),
          totalAmount: activeBooking.totalAmount.toString(),
        });
      } catch (mailErr) {
        console.error('[Admin Approve] Email send failed:', mailErr);
      }
      try {
        await sendAdminBookingConfirmationEmail({
          guestName: activeBooking.guestName,
          guestEmail: activeBooking.guestEmail,
          guestPhone: activeBooking.guestPhone,
          publicId: displayId,
          roomName: activeBooking.roomType.name,
          checkInDate: formatDate(activeBooking.checkInDate),
          checkInTime: checkInTime,
          checkOutDate: formatDate(activeBooking.checkOutDate),
          checkOutTime: checkOutTime,
          nights: activeBooking.totalNights,
          rooms: activeBooking.roomsBooked,
          paidAmount: (activeBooking.paidAmount || activeBooking.totalAmount).toString(),
          totalAmount: activeBooking.totalAmount.toString(),
        });
      } catch (adminMailErr) {
        console.error('[Admin Approve] Admin Email send failed:', adminMailErr);
      }

      return NextResponse.json({ message: 'Booking approved and confirmed successfully.', status: 'CONFIRMED' });

    } else if (action === 'REJECT') {
      // Reject booking — release reserved inventory and mark as REJECTED
      await prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { publicId: id },
          data: { status: 'REJECTED' },
        });

        // Release any reserved (held, unpaid) inventory
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
            },
          });
          broadcastRoomInventoryUpdate(booking.roomTypeId, date, booking.slotStart, booking.slotEnd);
        }
      });

      return NextResponse.json({ message: 'Booking rejected and inventory released.', status: 'REJECTED' });

    } else if (action === 'MARK_REFUNDED') {
      await prisma.booking.update({
        where: { publicId: id },
        data: { status: 'REFUNDED' },
      });
      return NextResponse.json({ message: 'Booking marked as refunded successfully', status: 'REFUNDED' });
    } else if (action === 'APPROVE_CANCEL') {
      await prisma.booking.update({
        where: { publicId: id },
        data: { status: 'CANCELLED' },
      });

      // Release confirmed booked inventory
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
        await prisma.roomInventory.updateMany({
          where: {
            roomTypeId: booking.roomTypeId,
            date,
            slotStart: booking.slotStart,
            slotEnd: booking.slotEnd,
          },
          data: {
            bookedRooms: { decrement: booking.roomsBooked },
            ...(booking.source === 'ADMIN' ? { totalRooms: { decrement: booking.roomsBooked } } : {}),
          },
        });
      }

      // Broadcast inventory updates to SSE clients
      for (const date of dateRange) {
        broadcastRoomInventoryUpdate(booking.roomTypeId, date, booking.slotStart, booking.slotEnd);
      }

      return NextResponse.json({ message: 'Cancellation approved and inventory released successfully', status: 'CANCELLED' });
    } else if (action === 'REJECT_CANCEL') {
      const targetStatus = booking.paymentPercentage && Number(booking.paymentPercentage) < 100 ? 'PARTIAL_PAID' : 'CONFIRMED';
      await prisma.booking.update({
        where: { publicId: id },
        data: { status: targetStatus },
      });

      return NextResponse.json({ message: `Cancellation request rejected. Booking restored to ${targetStatus} status`, status: targetStatus });
    } else if (action === 'APPROVE_POSTPONE') {
      let targetNewDate = booking.postponeNewDate;
      if (postponeNewDate) {
        targetNewDate = new Date(postponeNewDate);
        await prisma.booking.update({
          where: { publicId: id },
          data: { postponeNewDate: targetNewDate },
        });
      }

      if (!targetNewDate) {
        return NextResponse.json({ error: 'No postponed date requested.' }, { status: 400 });
      }

      // Guard: new check-in must be tomorrow or later (cannot reschedule to today/past)
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      const newCheckInCandidate = new Date(targetNewDate);
      newCheckInCandidate.setUTCHours(0, 0, 0, 0);
      if (newCheckInCandidate <= todayStart) {
        return NextResponse.json({ error: 'New check-in date must be tomorrow or later. You cannot reschedule to today or a past date.' }, { status: 400 });
      }

      const newCheckIn = new Date(targetNewDate);
      const newCheckOut = new Date(newCheckIn);
      newCheckOut.setUTCDate(newCheckOut.getUTCDate() + booking.totalNights);

      // Check room inventory for the new dates
      const newDateRange: Date[] = [];
      const newCurrent = new Date(newCheckIn);
      const newCheckOutTime = newCheckOut.getTime();
      if (newCheckIn.getTime() === newCheckOutTime) {
        newDateRange.push(new Date(newCheckIn));
      } else {
        while (newCurrent.getTime() < newCheckOutTime) {
          newDateRange.push(new Date(newCurrent));
          newCurrent.setUTCDate(newCurrent.getUTCDate() + 1);
        }
      }

      // Transaction verification
      for (const date of newDateRange) {
        const inv = await prisma.roomInventory.findUnique({
          where: {
            roomTypeId_date_slotStart_slotEnd: {
              roomTypeId: booking.roomTypeId,
              date,
              slotStart: booking.slotStart,
              slotEnd: booking.slotEnd,
            },
          },
        });

        const totalRooms = inv ? inv.totalRooms : booking.roomType.totalInventory;
        const bookedRooms = inv ? inv.bookedRooms : 0;
        const availableRooms = totalRooms - bookedRooms;

        if (availableRooms < booking.roomsBooked) {
          return NextResponse.json({ error: `Not enough rooms available for rescheduled check-in date: ${formatDate(date)}` }, { status: 409 });
        }
      }

      // Release old confirmed booked inventory
      const oldDateRange: Date[] = [];
      const oldCurrent = new Date(booking.checkInDate);
      const oldCheckOutTime = new Date(booking.checkOutDate).getTime();
      if (booking.checkInDate.getTime() === oldCheckOutTime) {
        oldDateRange.push(new Date(booking.checkInDate));
      } else {
        while (oldCurrent.getTime() < oldCheckOutTime) {
          oldDateRange.push(new Date(oldCurrent));
          oldCurrent.setUTCDate(oldCurrent.getUTCDate() + 1);
        }
      }

      for (const date of oldDateRange) {
        await prisma.roomInventory.updateMany({
          where: {
            roomTypeId: booking.roomTypeId,
            date,
            slotStart: booking.slotStart,
            slotEnd: booking.slotEnd,
          },
          data: { 
            bookedRooms: { decrement: booking.roomsBooked },
            ...(booking.source === 'ADMIN' ? { totalRooms: { decrement: booking.roomsBooked } } : {}),
          },
        });
      }

      for (const date of oldDateRange) {
        broadcastRoomInventoryUpdate(booking.roomTypeId, date, booking.slotStart, booking.slotEnd);
      }

      // Reserve new room inventory
      for (const date of newDateRange) {
        await prisma.roomInventory.upsert({
          where: {
            roomTypeId_date_slotStart_slotEnd: {
              roomTypeId: booking.roomTypeId,
              date,
              slotStart: booking.slotStart,
              slotEnd: booking.slotEnd,
            },
          },
          create: {
            roomTypeId: booking.roomTypeId,
            date,
            slotStart: booking.slotStart,
            slotEnd: booking.slotEnd,
            totalRooms: booking.roomType.totalInventory + (booking.source === 'ADMIN' ? booking.roomsBooked : 0),
            bookedRooms: booking.roomsBooked,
          },
          update: {
            bookedRooms: { increment: booking.roomsBooked },
            ...(booking.source === 'ADMIN' ? { totalRooms: { increment: booking.roomsBooked } } : {}),
          },
        });
      }

      await prisma.booking.update({
        where: { publicId: id },
        data: {
          status: 'POSTPONED',
          checkInDate: newCheckIn,
          checkOutDate: newCheckOut,
          // On first reschedule only — preserve original dates for ticket history
          ...(!booking.originalCheckInDate && {
            originalCheckInDate: booking.checkInDate,
            originalCheckOutDate: booking.checkOutDate,
          }),
        },
      });

      for (const date of newDateRange) {
        broadcastRoomInventoryUpdate(booking.roomTypeId, date, booking.slotStart, booking.slotEnd);
      }

      return NextResponse.json({ message: 'Postponement approved and booking travel dates updated successfully', status: 'POSTPONED' });
    } else if (action === 'REJECT_POSTPONE') {
      const targetStatus = booking.paymentPercentage && Number(booking.paymentPercentage) < 100 ? 'PARTIAL_PAID' : 'CONFIRMED';
      await prisma.booking.update({
        where: { publicId: id },
        data: { status: targetStatus },
      });

      return NextResponse.json({ message: `Postponement request rejected. Booking restored to ${targetStatus} status`, status: targetStatus });
    } else {
      return NextResponse.json({ error: 'Action not supported or invalid.' }, { status: 400 });
    }
  } catch (err) {
    console.error('[Admin Booking API] Error:', err);
    return NextResponse.json({ error: 'Action failed. Please try again.' }, { status: 500 });
  }
}
