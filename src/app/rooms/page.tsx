import { Metadata } from 'next';
import { Suspense } from 'react';
import RoomsListClient from './RoomsListClient';
import prisma from '@/lib/db';
import { cleanupExpiredBookings } from '@/lib/booking-cleanup';

export const metadata: Metadata = {
  title: 'Browse Rooms',
  description: 'Explore all premium rooms at Punnami Southern Residency. Filter by date, price, and capacity to find your perfect stay.',
};

export const revalidate = 3600;

function normalizeTime(timeStr: string) {
  if (!timeStr) return '12:00:00';
  const parts = timeStr.split(':');
  if (parts.length === 2) return `${timeStr}:00`;
  return timeStr;
}

async function getRoomsWithInventory(checkIn?: string, checkOut?: string) {
  try {
    // Run cleanup of expired pending bookings asynchronously to release locked inventory in real-time
    cleanupExpiredBookings().catch((cleanupErr) => {
      console.error('[Rooms page SSR] Expired bookings cleanup failed:', cleanupErr);
    });

    const includeObj: any = {
      hotel: {
        select: { name: true, address: true, checkInTime: true, checkOutTime: true },
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

    const rooms = await prisma.roomType.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ isFeatured: 'desc' }, { orderPriority: 'asc' }],
      include: includeObj,
    });

    const parsedRooms = rooms.map((r: any) => ({
      id: r.id.toString(),
      slug: r.slug,
      name: r.name,
      isActive: r.isActive,
      coverImageUrl: r.coverImageUrl,
      isFeatured: r.isFeatured,
      weekdayPrice: Number(r.weekdayPrice),
      weekendPrice: Number(r.weekendPrice),
      maxAdults: r.maxAdults,
      totalInventory: r.totalInventory,
      facilities: r.facilities,
      bookingSlots: r.bookingSlots,
      hotelId: r.hotelId.toString(),
      hotel: {
        name: r.hotel.name,
        address: r.hotel.address,
        checkInTime: r.hotel.checkInTime,
        checkOutTime: r.hotel.checkOutTime,
      },
    }));

    if (!checkIn || !checkOut) {
      return { allRooms: parsedRooms, availableRooms: parsedRooms };
    }

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
    for (const room of rooms) {
      const relationInventories = (room as any).inventories || [];
      for (const inv of relationInventories) {
        const dateStr = inv.date.toISOString().split('T')[0];
        const key = `${inv.roomTypeId}_${dateStr}_${inv.slotStart}_${inv.slotEnd}`;
        inventoryMap.set(key, inv);
      }
    }

    const availableRooms = parsedRooms.filter((room: any) => {
      const slotsList: { title: string; slotStart: string; slotEnd: string; totalRooms: number }[] = [];
      const customSlots = room.bookingSlots || [];
      if (Array.isArray(customSlots)) {
        customSlots.forEach((s: any) => {
          slotsList.push({
            title: s.title || 'Custom Slot',
            slotStart: normalizeTime(s.slotStart || s.slot_start || '12:00:00'),
            slotEnd: normalizeTime(s.slotEnd || s.slot_end || '11:00:00'),
            totalRooms: Number(s.totalRooms || s.total_rooms || room.totalInventory),
          });
        });
      }

      const hasAnyAvailableSlot = slotsList.some((slot) => {
        const sStart = slot.slotStart;
        const sEnd = slot.slotEnd;

        return dates.every((dateStr) => {
          const key = `${room.id}_${dateStr}_${sStart}_${sEnd}`;
          const invRecord = inventoryMap.get(key);

          if (invRecord) {
            const total = invRecord.totalRooms;
            const booked = invRecord.bookedRooms;
            const reserved = invRecord.reservedRooms;
            const isClosed = invRecord.isClosed;

            if (isClosed || (total - booked - reserved) <= 0) {
              return false;
            }
          } else {
            // Block by default if there's no pre-registered inventory in DB
            return false;
          }
          return true;
        });
      });

      return hasAnyAvailableSlot;
    });

    return { allRooms: parsedRooms, availableRooms };
  } catch (err) {
    console.error('Error loading rooms page database data:', err);
    return { allRooms: [], availableRooms: [] };
  }
}

interface RoomsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function RoomsPage({ searchParams }: RoomsPageProps) {
  const params = await searchParams;
  const checkIn = params.checkIn;
  const checkOut = params.checkOut;

  const { allRooms, availableRooms } = await getRoomsWithInventory(checkIn, checkOut);

  const initialData = {
    items: availableRooms,
    total: availableRooms.length,
    page: 1,
    size: availableRooms.length,
    pages: 1,
  };

  return (
    <Suspense>
      <RoomsListClient
        initialData={initialData}
        initialParams={params}
        allRooms={allRooms}
      />
    </Suspense>
  );
}
