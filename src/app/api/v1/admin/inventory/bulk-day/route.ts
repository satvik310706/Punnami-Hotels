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

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    const roomTypes = await prisma.roomType.findMany({
      where: { isActive: true, status: 'PUBLISHED' },
    });

    const isClosed = action === 'CLOSE_ALL';

    for (const rt of roomTypes) {
      const slots = [
        {
          slotStart: '12:00:00',
          slotEnd: '11:00:00',
        },
      ];

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
