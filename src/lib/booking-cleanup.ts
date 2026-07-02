import prisma from './db';
import { broadcastRoomInventoryUpdate } from './sse';

/**
 * Transactionally releases inventory reservations for all expired PENDING_PROOF bookings,
 * updating their status to EXPIRED.
 */
export async function cleanupExpiredBookings() {
  try {
    const now = new Date();
    
    // Find all pending proof bookings that have expired
    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: 'PENDING_PROOF',
        expiresAt: { lt: now },
      },
    });

    if (expiredBookings.length === 0) {
      return { count: 0 };
    }

    console.log(`[Inventory Cleanup] Found ${expiredBookings.length} expired pending bookings. Releasing...`);

    const broadcasts: { roomTypeId: bigint; date: Date; slotStart: string; slotEnd: string }[] = [];

    // Run cleanup inside a transaction to ensure database consistency
    await prisma.$transaction(async (tx) => {
      for (const booking of expiredBookings) {
        // Calculate date range timezone-neutrally using UTC boundaries
        const dateRange: Date[] = [];
        const current = new Date(booking.checkInDate);
        const checkOutTime = new Date(booking.checkOutDate).getTime();

        if (booking.checkInDate.getTime() === checkOutTime) {
          dateRange.push(new Date(booking.checkInDate));
        } else {
          while (current.getTime() < checkOutTime) {
            dateRange.push(new Date(current));
            current.setUTCDate(current.getUTCDate() + 1);
          }
        }

        // Release the reservation count date-by-date
        for (const date of dateRange) {
          await tx.roomInventory.updateMany({
            where: {
              roomTypeId: booking.roomTypeId,
              date,
              slotStart: booking.slotStart,
              slotEnd: booking.slotEnd,
            },
            data: {
              reservedRooms: {
                decrement: booking.roomsBooked,
              },
            },
          });

          broadcasts.push({
            roomTypeId: booking.roomTypeId,
            date,
            slotStart: booking.slotStart,
            slotEnd: booking.slotEnd,
          });
        }

        // Mark booking as EXPIRED
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: 'EXPIRED' },
        });
      }
    });

    // Run broadcasts after commit
    for (const b of broadcasts) {
      try {
        await broadcastRoomInventoryUpdate(b.roomTypeId, b.date, b.slotStart, b.slotEnd);
      } catch (err) {
        console.error('[Inventory Cleanup] Broadcast error:', err);
      }
    }

    return { count: expiredBookings.length };
  } catch (err) {
    console.error('[Inventory Cleanup] Error occurred during cleanup:', err);
    throw err;
  }
}
