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

    const start = new Date(startDate);
    const end = new Date(endDate);
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
    while (current <= end) {
      dateRange.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    // Upsert inventory blocks
    for (const date of dateRange) {
      await prisma.roomInventory.upsert({
        where: {
          roomTypeId_date_slotStart_slotEnd: {
            roomTypeId: BigInt(roomTypeId),
            date,
            slotStart,
            slotEnd,
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
          slotStart,
          slotEnd,
          totalRooms: (totalRooms !== undefined && totalRooms !== null) ? Number(totalRooms) : roomType.totalInventory,
          bookedRooms: 0,
          reservedRooms: 0,
          isClosed,
          priceOverride: parsedPriceOverride,
        },
      });
    }

    // Broadcast inventory updates to SSE clients
    for (const date of dateRange) {
      broadcastRoomInventoryUpdate(BigInt(roomTypeId), date, slotStart, slotEnd);
    }

    return NextResponse.json({ message: `Room inventory configuration applied successfully` });
  } catch (err) {
    console.error('[Admin Inventory API] Error:', err);
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}
