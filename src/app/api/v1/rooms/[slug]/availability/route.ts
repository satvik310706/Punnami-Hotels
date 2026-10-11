import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { cleanupExpiredBookings } from '@/lib/booking-cleanup';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Proactively clean up any expired reservations so room availability is accurate
    cleanupExpiredBookings().catch((err) => {
      console.error('[Availability API] Background cleanup error:', err);
    });

    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const monthStr = searchParams.get('month'); // e.g. "2026-06" or empty for next 6 months

    const roomType = await prisma.roomType.findUnique({
      where: { slug, status: 'PUBLISHED', isActive: true },
    });

    if (!roomType) {
      return NextResponse.json({ error: 'Room type not found' }, { status: 404 });
    }

    let start: Date;
    let end: Date;

    if (monthStr) {
      const [year, month] = monthStr.split('-').map(Number);
      start = startOfMonth(new Date(year, month - 1, 1));
      end = endOfMonth(new Date(year, month - 1, 1));
    } else {
      start = startOfMonth(new Date());
      end = endOfMonth(addMonths(new Date(), 6));
    }

    const inventories = await prisma.roomInventory.findMany({
      where: {
        roomTypeId: roomType.id,
        date: { gte: start, lte: end },
      },
      orderBy: { date: 'asc' },
    });

    // We also want to generate/fill default values for dates that don't have overrides in DB.
    // The client can use these inventories to see which dates are blocked (isClosed: true or bookedRooms >= totalRooms)
    // and what the custom price is for each day.
    const dates = inventories.map((inv) => ({
      date: inv.date.toISOString().split('T')[0],
      slotStart: inv.slotStart,
      slotEnd: inv.slotEnd,
      totalRooms: inv.totalRooms,
      bookedRooms: inv.bookedRooms,
      reservedRooms: inv.reservedRooms,
      isClosed: inv.isClosed,
      priceOverride: inv.priceOverride ? Number(inv.priceOverride) : null,
      available: Math.max(0, inv.totalRooms - inv.bookedRooms - inv.reservedRooms),
    }));

    return NextResponse.json({
      roomTypeId: roomType.id.toString(),
      slug: roomType.slug,
      defaultWeekdayPrice: Number(roomType.weekdayPrice),
      defaultWeekendPrice: Number(roomType.weekendPrice),
      defaultTotalInventory: roomType.totalInventory,
      dates,
    });
  } catch (err) {
    console.error('[Room Availability API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch room availability' }, { status: 500 });
  }
}
