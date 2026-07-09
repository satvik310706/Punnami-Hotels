import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { broadcastRoomInventoryUpdate } from '@/lib/sse';

// POST /api/v1/admin/inventory/bulk-day — Apply bulk actions to all room types on a specific date
export async function POST(req: NextRequest) {
  try {
    const { date, action } = await req.json();

    if (!date || !action || !['CLOSE_ALL', 'OPEN_ALL'].includes(action)) {
      return NextResponse.json({ error: 'Missing date or invalid action' }, { status: 450 });
    }

    // Parse the date timezone-neutrally as UTC midnight to match DB Date format
    const [yearVal, monthVal, dayVal] = date.split('-').map(Number);
    const dateObj = new Date(Date.UTC(yearVal, monthVal - 1, dayVal));

    const roomTypes = await prisma.roomType.findMany({
      where: { isActive: true, status: 'PUBLISHED' },
      include: {
        hotel: {
          select: { checkInTime: true, checkOutTime: true }
        }
      }
    });

    const isClosed = action === 'CLOSE_ALL';

    for (const rt of roomTypes) {
      const normalizeTime = (timeStr: string) => {
        if (!timeStr) return '12:00:00';
        if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr;
        if (/^\d{2}:\d{2}$/.test(timeStr)) return `${timeStr}:00`;
        const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (match) {
          let hours = parseInt(match[1], 10);
          const minutes = match[2];
          const ampm = match[3].toUpperCase();
          if (ampm === 'PM' && hours < 12) hours += 12;
          if (ampm === 'AM' && hours === 12) hours = 0;
          return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
        }
        return timeStr;
      };

      const standardSlotStart = normalizeTime(rt.hotel?.checkInTime || '12:00:00');
      const standardSlotEnd = normalizeTime(rt.hotel?.checkOutTime || '11:00:00');

      const slots: { slotStart: string; slotEnd: string }[] = [];

      const customSlots = rt.bookingSlots as any;
      if (Array.isArray(customSlots)) {
        customSlots.forEach((s: any) => {
          slots.push({
            slotStart: s.slotStart || s.slot_start || '12:00:00',
            slotEnd: s.slotEnd || s.slot_end || '11:00:00',
          });
        });
      }

      for (const slot of slots) {
        await prisma.roomInventory.upsert({
          where: {
            roomTypeId_date_slotStart_slotEnd: {
              roomTypeId: rt.id,
              date: dateObj,
              slotStart: slot.slotStart,
              slotEnd: slot.slotEnd,
            },
          },
          update: { isClosed },
          create: {
            roomTypeId: rt.id,
            date: dateObj,
            slotStart: slot.slotStart,
            slotEnd: slot.slotEnd,
            totalRooms: rt.totalInventory,
            bookedRooms: 0,
            reservedRooms: 0,
            isClosed,
          },
        });

        // Broadcast update for this room variant
        broadcastRoomInventoryUpdate(rt.id, dateObj, slot.slotStart, slot.slotEnd);
      }
    }

    return NextResponse.json({
      message: `All room categories are now ${isClosed ? 'closed' : 'open'} for bookings on ${date}`,
    });
  } catch (err) {
    console.error('[Admin Bulk Day API] Error:', err);
    return NextResponse.json({ error: 'Failed to apply bulk action' }, { status: 500 });
  }
}
