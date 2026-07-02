import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { cleanupExpiredBookings } from '@/lib/booking-cleanup';

function normalizeTime(timeStr: string) {
  if (!timeStr) return '12:00:00';
  const parts = timeStr.split(':');
  if (parts.length === 2) return `${timeStr}:00`;
  return timeStr;
}

// GET /api/v1/rooms — Public room type listing with search/filter
export async function GET(req: NextRequest) {
  try {
    // Run cleanup of expired pending bookings first to release locked inventory in real-time
    try {
      await cleanupExpiredBookings();
    } catch (cleanupErr) {
      console.error('[Rooms List API] Expired bookings cleanup failed:', cleanupErr);
    }

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const size = Math.min(20, parseInt(searchParams.get('size') || '12'));
    const q = searchParams.get('q')?.trim() || '';
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '99999');
    const capacity = parseInt(searchParams.get('capacity') || searchParams.get('guests') || '0');
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');

    const where: any = {
      status: 'PUBLISHED',
      isActive: true,
    };

    if (q) {
      where.name = { contains: q, mode: 'insensitive' };
    }
    if (minPrice > 0 || maxPrice < 99999) {
      where.weekdayPrice = { gte: minPrice, lte: maxPrice };
    }
    if (capacity > 0) {
      where.maxAdults = { gte: capacity };
    }

    const includeObj: any = {
      hotel: {
        select: { name: true, address: true, slug: true, checkInTime: true, checkOutTime: true },
      },
    };

    const checkInDate = checkIn ? new Date(checkIn) : null;
    const checkOutDate = checkOut ? new Date(checkOut) : null;

    if (checkInDate && checkOutDate) {
      includeObj.inventories = {
        where: {
          date: { gte: checkInDate, lte: checkOutDate },
        },
      };
    }

    // Fetch matching room types and their relevant inventories in ONE query!
    const allRoomTypes = await prisma.roomType.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { orderPriority: 'asc' }, { createdAt: 'desc' }],
      include: includeObj,
    });

    let filteredRooms = allRoomTypes;

    // Apply strict date availability check if dates are provided
    if (checkIn && checkOut && filteredRooms.length > 0) {
      // Generate dates range as strings
      const dates: string[] = [];
      const current = new Date(checkInDate!);
      const checkOutTime = checkOutDate!.getTime();
      if (checkInDate!.getTime() === checkOutTime) {
        dates.push(checkIn);
      } else {
        while (current.getTime() < checkOutTime) {
          dates.push(current.toISOString().split('T')[0]);
          current.setUTCDate(current.getUTCDate() + 1);
        }
      }

      // Build a fast O(1) lookup Map for inventories from the pre-loaded relation
      const inventoryMap = new Map<string, any>();
      for (const room of filteredRooms) {
        const relationInventories = (room as any).inventories || [];
        for (const inv of relationInventories) {
          const dateStr = inv.date.toISOString().split('T')[0];
          const key = `${inv.roomTypeId}_${dateStr}_${inv.slotStart}_${inv.slotEnd}`;
          inventoryMap.set(key, inv);
        }
      }

      // Filter room types based on actual custom slot inventory availability
      filteredRooms = filteredRooms.filter((room: any) => {
        // Define all slots for this room category
        const slotsList: { title: string; slotStart: string; slotEnd: string; totalRooms: number }[] = [];
        slotsList.push({
          title: 'Standard Stay',
          slotStart: normalizeTime(room.hotel?.checkInTime || '12:00:00'),
          slotEnd: normalizeTime(room.hotel?.checkOutTime || '11:00:00'),
          totalRooms: room.totalInventory,
        });

        const customSlots = room.bookingSlots || [];
        if (Array.isArray(customSlots)) {
          customSlots.forEach((s: any) => {
            slotsList.push({
              title: s.title,
              slotStart: normalizeTime(s.slotStart || s.slot_start || '12:00:00'),
              slotEnd: normalizeTime(s.slotEnd || s.slot_end || '11:00:00'),
              totalRooms: Number(s.totalRooms || s.total_rooms || room.totalInventory),
            });
          });
        }

        // For this room category to be available, there must be AT LEAST one slot
        // that is available on EVERY single day of the stay range.
        const hasAnyAvailableSlot = slotsList.some((slot) => {
          const sStart = slot.slotStart;
          const sEnd = slot.slotEnd;

          // Check if this slot is available on all dates in the query range
          return dates.every((dateStr) => {
            const key = `${room.id}_${dateStr}_${sStart}_${sEnd}`;
            const invRecord = inventoryMap.get(key);

            if (invRecord) {
              const total = invRecord.totalRooms;
              const booked = invRecord.bookedRooms;
              const reserved = invRecord.reservedRooms;
              const isClosed = invRecord.isClosed;

              // Check closure and capacity
              if (isClosed || (total - booked - reserved) <= 0) {
                return false;
              }
            }
            return true;
          });
        });

        return hasAnyAvailableSlot;
      });
    }

    // Paginate in-memory after filtering for 100% correct count
    const total = filteredRooms.length;
    const paginatedItems = filteredRooms.slice((page - 1) * size, page * size);

    return NextResponse.json({
      items: paginatedItems.map((r) => ({
        ...r,
        id: r.id.toString(),
        hotelId: r.hotelId.toString(),
        weekdayPrice: Number(r.weekdayPrice),
        weekendPrice: Number(r.weekendPrice),
      })),
      total,
      page,
      size,
      pages: Math.ceil(total / size),
    });
  } catch (err) {
    console.error('[Rooms API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}
