import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { broadcastRoomInventoryUpdate } from '@/lib/sse';

// POST /api/v1/admin/inventory/update-day — Upsert custom room inventory configuration (with price overrides) for a single date
export async function POST(req: NextRequest) {
  try {
    const { roomTypeId, date, slotStart = '12:00:00', slotEnd = '11:00:00', totalRooms, isClosed, priceOverride } = await req.json();

    if (!roomTypeId || !date || totalRooms === undefined || isClosed === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Parse the date timezone-neutrally as UTC midnight to match DB Date format
    const [yearVal, monthVal, dayVal] = date.split('-').map(Number);
    const dateObj = new Date(Date.UTC(yearVal, monthVal - 1, dayVal));

    const roomType = await prisma.roomType.findUnique({
      where: { id: BigInt(roomTypeId) },
    });

    if (!roomType) {
      return NextResponse.json({ error: 'Room variant not found' }, { status: 404 });
    }

    const parsedPriceOverride = 
      priceOverride !== null && priceOverride !== undefined && priceOverride !== '' 
        ? Number(priceOverride) 
        : null;

    // Upsert database row
    const upserted = await prisma.roomInventory.upsert({
      where: {
        roomTypeId_date_slotStart_slotEnd: {
          roomTypeId: BigInt(roomTypeId),
          date: dateObj,
          slotStart,
          slotEnd,
        },
      },
      update: {
        totalRooms: Number(totalRooms),
        isClosed,
        priceOverride: parsedPriceOverride,
      },
      create: {
        roomTypeId: BigInt(roomTypeId),
        date: dateObj,
        slotStart,
        slotEnd,
        totalRooms: Number(totalRooms),
        bookedRooms: 0,
        reservedRooms: 0,
        isClosed,
        priceOverride: parsedPriceOverride,
      },
    });

    // Broadcast inventory update via SSE
    await broadcastRoomInventoryUpdate(BigInt(roomTypeId), dateObj, slotStart, slotEnd);

    return NextResponse.json({
      message: 'Room inventory configuration saved',
      id: upserted.id.toString(),
    });
  } catch (err) {
    console.error('[Admin Update Day Inventory API] Error:', err);
    return NextResponse.json({ error: 'Failed to save inventory configuration' }, { status: 500 });
  }
}
