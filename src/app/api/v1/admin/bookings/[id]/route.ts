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
    const { action } = body; // "APPROVE" | "REJECT"

    if (!action || !['APPROVE', 'REJECT', 'APPROVE_CANCEL', 'REJECT_CANCEL', 'APPROVE_POSTPONE', 'REJECT_POSTPONE'].includes(action)) {
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
      // 1. Update booking status
      const updatedBooking = await prisma.booking.update({
        where: { publicId: id },
        data: { status: 'CONFIRMED' },
      });

      // 2. Atomically confirm inventory (move from reserved to booked)
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
            reservedRooms: { decrement: booking.roomsBooked },
            bookedRooms: { increment: booking.roomsBooked },
          },
        });
      }

      // Broadcast inventory updates to SSE clients
      for (const date of dateRange) {
        broadcastRoomInventoryUpdate(booking.roomTypeId, date, booking.slotStart, booking.slotEnd);
      }

      // 3. Send SMS notification (MSG91)
      const checkInDateStr = formatDate(booking.checkInDate);
      const checkOutDateStr = formatDate(booking.checkOutDate);
      const checkInTimeStr = booking.roomType.hotel.checkInTime || '12:00 PM';
      const checkOutTimeStr = booking.roomType.hotel.checkOutTime || '11:00 AM';

      await sendRoomConfirmationSMS({
        customerName: booking.guestName,
        customerPhone: booking.guestPhone,
        publicId: booking.publicId,
        hotelName: booking.roomType.hotel.name,
        roomName: booking.roomType.name,
        checkInDate: checkInDateStr,
        checkInTime: checkInTimeStr,
        checkOutDate: checkOutDateStr,
        checkOutTime: checkOutTimeStr,
        paidAmount: Number(booking.totalAmount).toFixed(0),
        totalAmount: Number(booking.totalAmount).toFixed(0),
      });

      // 4. Send Email notification (Zoho SMTP)
      if (booking.guestEmail) {
        await sendBookingConfirmationEmail({
          guestEmail: booking.guestEmail,
          guestName: booking.guestName,
          publicId: booking.publicId,
          roomName: booking.roomType.name,
          checkInDate: checkInDateStr,
          checkInTime: checkInTimeStr,
          checkOutDate: checkOutDateStr,
          checkOutTime: checkOutTimeStr,
          nights: booking.totalNights,
          rooms: booking.roomsBooked,
          totalAmount: Number(booking.totalAmount).toFixed(0),
          paidAmount: Number(booking.totalAmount).toFixed(0),
        });
      }

      return NextResponse.json({ message: 'Booking confirmed and notifications sent successfully', status: 'CONFIRMED' });
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
      await prisma.booking.update({
        where: { publicId: id },
        data: { status: 'CONFIRMED' },
      });

      return NextResponse.json({ message: 'Cancellation request rejected. Booking restored to Confirmed status', status: 'CONFIRMED' });
    } else if (action === 'APPROVE_POSTPONE') {
      if (!booking.postponeNewDate) {
        return NextResponse.json({ error: 'No postponed date requested.' }, { status: 400 });
      }

      const newCheckIn = new Date(booking.postponeNewDate);
      const newCheckOut = new Date(newCheckIn);
      newCheckOut.setUTCDate(newCheckOut.getUTCDate() + booking.totalNights);

      // Release old confirmed inventory
      const oldDateRange: Date[] = [];
      const currentOld = new Date(booking.checkInDate);
      const oldCheckOutTime = new Date(booking.checkOutDate).getTime();
      if (booking.checkInDate.getTime() === oldCheckOutTime) {
        oldDateRange.push(new Date(booking.checkInDate));
      } else {
        while (currentOld.getTime() < oldCheckOutTime) {
          oldDateRange.push(new Date(currentOld));
          currentOld.setUTCDate(currentOld.getUTCDate() + 1);
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
          },
        });
      }

      for (const date of oldDateRange) {
        broadcastRoomInventoryUpdate(booking.roomTypeId, date, booking.slotStart, booking.slotEnd);
      }

      // Book new inventory
      const newDateRange: Date[] = [];
      const currentNew = new Date(newCheckIn);
      const newCheckOutTime = newCheckOut.getTime();
      if (newCheckIn.getTime() === newCheckOutTime) {
        newDateRange.push(new Date(newCheckIn));
      } else {
        while (currentNew.getTime() < newCheckOutTime) {
          newDateRange.push(new Date(currentNew));
          currentNew.setUTCDate(currentNew.getUTCDate() + 1);
        }
      }

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

        if (inv) {
          await prisma.roomInventory.update({
            where: { id: inv.id },
            data: { bookedRooms: { increment: booking.roomsBooked } },
          });
        } else {
          await prisma.roomInventory.create({
            data: {
              roomTypeId: booking.roomTypeId,
              date,
              slotStart: booking.slotStart,
              slotEnd: booking.slotEnd,
              totalRooms: booking.roomType.totalInventory,
              bookedRooms: booking.roomsBooked,
              reservedRooms: 0,
            },
          });
        }
      }

      await prisma.booking.update({
        where: { publicId: id },
        data: {
          status: 'POSTPONED',
          checkInDate: newCheckIn,
          checkOutDate: newCheckOut,
        },
      });

      for (const date of newDateRange) {
        broadcastRoomInventoryUpdate(booking.roomTypeId, date, booking.slotStart, booking.slotEnd);
      }

      return NextResponse.json({ message: 'Postponement approved and booking travel dates updated successfully', status: 'POSTPONED' });
    } else if (action === 'REJECT_POSTPONE') {
      await prisma.booking.update({
        where: { publicId: id },
        data: { status: 'CONFIRMED' },
      });

      return NextResponse.json({ message: 'Postponement request rejected. Booking restored to Confirmed status', status: 'CONFIRMED' });
    } else {
      // Action is REJECT
      const updatedBooking = await prisma.booking.update({
        where: { publicId: id },
        data: { status: 'REJECTED' },
      });

      // Release inventory reservations
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
          data: { reservedRooms: { decrement: booking.roomsBooked } },
        });
      }

      // Broadcast inventory updates to SSE clients
      for (const date of dateRange) {
        broadcastRoomInventoryUpdate(booking.roomTypeId, date, booking.slotStart, booking.slotEnd);
      }

      return NextResponse.json({ message: 'Booking rejected and inventory released successfully', status: 'REJECTED' });
    }
  } catch (err) {
    console.error('[Admin Booking API] Error:', err);
    return NextResponse.json({ error: 'Action failed. Please try again.' }, { status: 500 });
  }
}
