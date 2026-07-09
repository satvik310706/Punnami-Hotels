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
        select: { 
          id: true, 
          name: true, 
          totalInventory: true, 
          bookingSlots: true,
          weekdayPrice: true,
          weekendPrice: true,
          hotel: {
            select: {
              checkInTime: true,
              checkOutTime: true,
            }
          }
        },
      }),
    ]);

    const days = eachDayOfInterval({ start, end });
    
    // Map dates to grid items
    const calendarData = days.map((day) => {
      // Construct date string using local date parts to prevent timezone offsets from shifting the date
      const y = day.getFullYear();
      const m = String(day.getMonth() + 1).padStart(2, '0');
      const d = String(day.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      
      const dayInventories: any[] = [];
      
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

        const standardSlotStart = normalizeTime((rt as any).hotel?.checkInTime || '12:00:00');
        const standardSlotEnd = normalizeTime((rt as any).hotel?.checkOutTime || '11:00:00');

        // Build slots list
        const slots: { title: string; slotStart: string; slotEnd: string }[] = [];

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

          // Resolve slot pricing configuration
          const customSlotConfig = Array.isArray(rt.bookingSlots)
            ? (rt.bookingSlots as any[]).find((s: any) => {
                const sS = s.slotStart || s.slot_start;
                const sE = s.slotEnd || s.slot_end;
                return sS && sE && sS.slice(0, 5) === slot.slotStart.slice(0, 5) && sE.slice(0, 5) === slot.slotEnd.slice(0, 5);
              })
            : null;

          const defaultWeekdayPrice = customSlotConfig?.priceWeekday ?? customSlotConfig?.price_weekday ?? Number(rt.weekdayPrice);
          const defaultWeekendPrice = customSlotConfig?.priceWeekend ?? customSlotConfig?.price_weekend ?? Number(rt.weekendPrice);

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
            defaultWeekdayPrice,
            defaultWeekendPrice,
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
      roomTypes: roomTypes.map((rt) => {
        const checkInTime = rt.hotel?.checkInTime || '12:00:00';
        const checkOutTime = rt.hotel?.checkOutTime || '11:00:00';
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
        return {
          id: rt.id.toString(),
          name: rt.name,
          bookingSlots: rt.bookingSlots,
          standardSlotStart: normalizeTime(checkInTime),
          standardSlotEnd: normalizeTime(checkOutTime),
        };
      }),
    });
  } catch (err) {
    console.error('[Admin Calendar Inventory API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch calendar inventory' }, { status: 500 });
  }
}
