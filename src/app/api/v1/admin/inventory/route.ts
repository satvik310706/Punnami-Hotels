import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { broadcastRoomInventoryUpdate } from '@/lib/sse';

// POST /api/v1/admin/inventory — Close or open room bookings for a date range (and optionally change room counts / price overrides)
export async function POST(req: NextRequest) {
  try {
    const { roomTypeId, startDate, endDate, slotStart = '12:00:00', slotEnd = '11:00:00', isClosed, totalRooms, priceOverride } = await req.json();

    if (!roomTypeId || !startDate || !endDate || isClosed === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const parseUTCDate = (dateStr: string) => {
      const [yearVal, monthVal, dayVal] = dateStr.split('-').map(Number);
      return new Date(Date.UTC(yearVal, monthVal - 1, dayVal));
    };

    const start = parseUTCDate(startDate);
    const end = parseUTCDate(endDate);
    const roomType = await prisma.roomType.findUnique({
      where: { id: BigInt(roomTypeId) },
    });

    if (!roomType) {
      return NextResponse.json({ error: 'Room type not found' }, { status: 404 });
    }

    const parsedPriceOverride = 
      priceOverride !== null && priceOverride !== undefined && priceOverride !== '' 
        ? Number(priceOverride) 
        : null;

    const dateRange: Date[] = [];
    const current = new Date(start);
    while (current.getTime() <= end.getTime()) {
      dateRange.push(new Date(current));
      current.setUTCDate(current.getUTCDate() + 1);
    }

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

    const customSlots = (roomType.bookingSlots || []) as any[];
    const slotsToApply: { slotStart: string; slotEnd: string; totalRooms: number }[] = [];

    if (slotStart === 'ALL' && slotEnd === 'ALL') {
      customSlots.forEach((s) => {
        slotsToApply.push({
          slotStart: s.slotStart || s.slot_start || '12:00:00',
          slotEnd: s.slotEnd || s.slot_end || '11:00:00',
          totalRooms: Number(s.totalRooms || s.total_rooms || roomType.totalInventory),
        });
      });
    } else {
      const slotConfig = customSlots.find(
        (s) => normalizeTime(s.slotStart || s.slot_start) === slotStart && normalizeTime(s.slotEnd || s.slot_end) === slotEnd
      );
      slotsToApply.push({
        slotStart,
        slotEnd,
        totalRooms: Number(slotConfig?.totalRooms ?? slotConfig?.total_rooms ?? roomType.totalInventory),
      });
    }

    // Upsert inventory blocks
    for (const date of dateRange) {
      for (const targetSlot of slotsToApply) {
        await prisma.roomInventory.upsert({
          where: {
            roomTypeId_date_slotStart_slotEnd: {
              roomTypeId: BigInt(roomTypeId),
              date,
              slotStart: targetSlot.slotStart,
              slotEnd: targetSlot.slotEnd,
            },
          },
          update: { 
            isClosed,
            ...(totalRooms !== undefined && totalRooms !== null && { totalRooms: Number(totalRooms) }),
            priceOverride: parsedPriceOverride,
          },
          create: {
            roomTypeId: BigInt(roomTypeId),
            date,
            slotStart: targetSlot.slotStart,
            slotEnd: targetSlot.slotEnd,
            totalRooms: (totalRooms !== undefined && totalRooms !== null) ? Number(totalRooms) : targetSlot.totalRooms,
            bookedRooms: 0,
            reservedRooms: 0,
            isClosed,
            priceOverride: parsedPriceOverride,
          },
        });
      }
    }

    // Broadcast inventory updates to SSE clients
    for (const date of dateRange) {
      for (const targetSlot of slotsToApply) {
        broadcastRoomInventoryUpdate(BigInt(roomTypeId), date, targetSlot.slotStart, targetSlot.slotEnd);
      }
    }

    return NextResponse.json({ message: `Room inventory configuration applied successfully` });
  } catch (err) {
    console.error('[Admin Inventory API] Error:', err);
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}
