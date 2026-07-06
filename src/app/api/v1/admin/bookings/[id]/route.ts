import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { sendRoomConfirmationSMS } from '@/lib/sms';
import { sendBookingConfirmationEmail } from '@/lib/zohoMail';
import { formatDate } from '@/lib/utils';
import { broadcastRoomInventoryUpdate } from '@/lib/sse';

// POST /api/v1/admin/bookings/[id] — Approve or Reject a booking
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, postponeNewDate } = body; // "APPROVE" | "REJECT" ...

    if (!action || !['APPROVE_CANCEL', 'REJECT_CANCEL', 'APPROVE_POSTPONE', 'REJECT_POSTPONE', 'MARK_REFUNDED'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { publicId: id },
      include: { roomType: { include: { hotel: true } } },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (action === 'MARK_REFUNDED') {
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
          data: { bookedRooms: { decrement: booking.roomsBooked } },
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
            totalRooms: booking.roomType.totalInventory,
            bookedRooms: booking.roomsBooked,
          },
          update: {
            bookedRooms: { increment: booking.roomsBooked },
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
