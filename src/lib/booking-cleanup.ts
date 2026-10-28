import prisma from './db';
import { broadcastRoomInventoryUpdate } from './sse';

// Concurrency lock and cooldown to prevent concurrent database storms
let isCleanupRunning = false;
let lastCleanupTimestamp = 0;
const CLEANUP_COOLDOWN_MS = 60 * 1000; // Run at most once every 60 seconds

/**
 * Transactionally releases inventory reservations for all expired PENDING_PROOF bookings.
 * Protected by an in-memory mutex and cooldown to prevent database OOM crashes.
 */
export async function cleanupExpiredBookings(force = false) {
  const nowTime = Date.now();

  // Guard against concurrent executions and too frequent executions
  if (!force && (isCleanupRunning || (nowTime - lastCleanupTimestamp < CLEANUP_COOLDOWN_MS))) {
    return { count: 0, skipped: true };
  }

  isCleanupRunning = true;

  try {
    const now = new Date();
    
    // Select only the minimal fields needed to release inventory (limits memory usage)
    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: 'PENDING_PROOF',
        expiresAt: { lt: now },
      },
      select: {
        id: true,
        roomTypeId: true,
        checkInDate: true,
        checkOutDate: true,
        slotStart: true,
        slotEnd: true,
        roomsBooked: true,
      },
      take: 50, // Batch limit to protect DB transaction memory
    });

    if (expiredBookings.length === 0) {
      lastCleanupTimestamp = Date.now();
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

        // Release the reservation count date-by-date (ensure reservedRooms never goes below 0)
        for (const date of dateRange) {
          await tx.$executeRaw`
            UPDATE "RoomInventory"
            SET "reservedRooms" = GREATEST(0, "reservedRooms" - ${booking.roomsBooked})
            WHERE "roomTypeId" = ${booking.roomTypeId}
              AND "date" = ${date}
              AND "slotStart" = ${booking.slotStart}
              AND "slotEnd" = ${booking.slotEnd}
          `;

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

    lastCleanupTimestamp = Date.now();

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
    return { count: 0, error: err };
  } finally {
    isCleanupRunning = false;
  }
}

