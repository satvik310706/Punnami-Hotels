import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

// GET /api/v1/admin/inventory/calendar — Fetch inventory rows for a specific month
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const yearStr = searchParams.get('year');
    const monthStr = searchParams.get('month');

    if (!yearStr || !monthStr) {
      return NextResponse.json({ error: 'Year and month are required' }, { status: 400 });
    }

    const year = parseInt(yearStr);
    const month = parseInt(monthStr); // 1-indexed

    // Calculate dates interval
    const baseDate = new Date(year, month - 1, 1);
    const start = startOfMonth(baseDate);
    const end = endOfMonth(baseDate);

    const [inventories, roomTypes] = await Promise.all([
      prisma.roomInventory.findMany({
        where: {
          date: { gte: start, lte: end },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.roomType.findMany({
        where: { isActive: true, status: 'PUBLISHED' },
        select: { id: true, name: true, totalInventory: true, bookingSlots: true },
      }),
    ]);

    const days = eachDayOfInterval({ start, end });
    
    // Map dates to grid items
    const calendarData = days.map((day) => {
      const dateStr = day.toISOString().split('T')[0];
      
      const dayInventories: any[] = [];
      
      for (const rt of roomTypes) {
        // Build slots list
        const slots = [
          {
            title: 'Standard Stay',
            slotStart: '12:00:00',
            slotEnd: '11:00:00',
          },
        ];

        const customSlots = rt.bookingSlots as any;
        if (Array.isArray(customSlots)) {
          customSlots.forEach((s: any) => {
            slots.push({
              title: s.title || 'Custom Slot',
              slotStart: s.slotStart || s.slot_start || '12:00:00',
              slotEnd: s.slotEnd || s.slot_end || '11:00:00',
            });
          });
        }

        for (const slot of slots) {
          const inv = inventories.find(
            (i) =>
              i.roomTypeId === rt.id &&
              i.date.toISOString().split('T')[0] === dateStr &&
              i.slotStart === slot.slotStart &&
              i.slotEnd === slot.slotEnd
          );

          dayInventories.push({
            roomTypeId: rt.id.toString(),
            roomTypeName: rt.name,
            slotTitle: slot.title,
            slotStart: slot.slotStart,
            slotEnd: slot.slotEnd,
            date: dateStr,
            totalRooms: inv ? inv.totalRooms : rt.totalInventory,
            bookedRooms: inv ? inv.bookedRooms : 0,
            reservedRooms: inv ? inv.reservedRooms : 0,
            isClosed: inv ? inv.isClosed : false,
            hasOverride: !!inv,
            id: inv ? inv.id.toString() : null,
            priceOverride: inv && inv.priceOverride !== null ? Number(inv.priceOverride) : null,
          });
        }
      }

      return {
        date: dateStr,
        dayOfMonth: day.getDate(),
        inventories: dayInventories,
      };
    });

    return NextResponse.json({
      calendarData,
      roomTypes: roomTypes.map((rt) => ({
        id: rt.id.toString(),
        name: rt.name,
        bookingSlots: rt.bookingSlots,
      })),
    });
  } catch (err) {
    console.error('[Admin Calendar Inventory API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch calendar inventory' }, { status: 500 });
  }
}
