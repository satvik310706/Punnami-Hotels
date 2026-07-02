const { PrismaClient } = require('@prisma/client');
const assert = require('assert');

const prisma = new PrismaClient();

async function run() {
  console.log('Running Concurrency & Load Stress Test...\n');

  // Find a valid RoomType to run the test against
  const roomType = await prisma.roomType.findFirst({
    where: { status: 'PUBLISHED', isActive: true }
  });

  if (!roomType) {
    console.error('[ERROR] No published RoomType found in the database. Cannot run concurrency test.');
    process.exit(1);
  }

  const roomTypeId = roomType.id;
  const testDate = new Date('2026-09-01T00:00:00.000Z');
  const slotStart = '12:00:00';
  const slotEnd = '11:00:00';

  console.log(`Using RoomType ID: ${roomTypeId} ("${roomType.name}") for stress test`);

  // Initialize/reset the inventory for the test date
  await prisma.roomInventory.upsert({
    where: {
      roomTypeId_date_slotStart_slotEnd: {
        roomTypeId,
        date: testDate,
        slotStart,
        slotEnd
      }
    },
    update: {
      totalRooms: 1,
      bookedRooms: 0,
      reservedRooms: 0,
      isClosed: false
    },
    create: {
      roomTypeId,
      date: testDate,
      slotStart,
      slotEnd,
      totalRooms: 1,
      bookedRooms: 0,
      reservedRooms: 0,
      isClosed: false
    }
  });

  console.log('Successfully set test room inventory to: totalRooms = 1, bookedRooms = 0, reservedRooms = 0');

  // Spawn 10 concurrent checkout transactions
  const concurrencyCount = 10;
  const promises = [];

  console.log(`Firing ${concurrencyCount} concurrent checkout transactions simultaneously...`);

  for (let i = 0; i < concurrencyCount; i++) {
    promises.push(
      prisma.$transaction(async (tx) => {
        // Step 1: Acquire exclusive row-level lock (SELECT FOR UPDATE)
        const dateStr = testDate.toISOString().split('T')[0];
        const lockedRows = await tx.$queryRaw`
          SELECT id, "totalRooms", "bookedRooms", "reservedRooms", "isClosed"
          FROM "RoomInventory"
          WHERE "roomTypeId" = ${roomTypeId}
            AND date = ${dateStr}::date
            AND "slotStart" = ${slotStart}
            AND "slotEnd" = ${slotEnd}
          FOR UPDATE
        `;

        const inv = lockedRows[0];
        if (!inv) throw new Error('Inventory missing');

        if (inv.isClosed) throw new Error('Room is closed');

        // Step 2: Check capacity
        const available = inv.totalRooms - inv.bookedRooms - inv.reservedRooms;
        if (available < 1) {
          throw new Error('No capacity');
        }

        // Step 3: Atomic update
        await tx.roomInventory.update({
          where: { id: inv.id },
          data: { reservedRooms: { increment: 1 } }
        });

        // Step 4: Create booking mock
        const newBooking = await tx.booking.create({
          data: {
            publicId: `TEST-STRESS-${i}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            roomTypeId,
            checkInDate: testDate,
            checkOutDate: testDate,
            slotStart,
            slotEnd,
            totalNights: 1,
            roomsBooked: 1,
            guestName: `Stress User ${i}`,
            guestEmail: `stress${i}@test.com`,
            guestPhone: '9999999999',
            subtotalAmount: 1000,
            discountAmount: 0,
            gstAmount: 120,
            totalAmount: 1120,
            status: 'PENDING_PROOF',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours TTL
          }
        });

        return newBooking;
      })
    );
  }

  const results = await Promise.allSettled(promises);

  const successes = results.filter(r => r.status === 'fulfilled');
  const failures = results.filter(r => r.status === 'rejected');

  console.log('\n--- Stress Test Results ---');
  console.log(`Successes: ${successes.length}`);
  console.log(`Failures: ${failures.length}`);

  // Assertions
  try {
    assert.strictEqual(successes.length, 1, 'Exactly ONE transaction should succeed');
    assert.strictEqual(failures.length, concurrencyCount - 1, `Exactly ${concurrencyCount - 1} transactions should fail`);
    
    // Verify final state in DB
    const finalInv = await prisma.roomInventory.findUnique({
      where: {
        roomTypeId_date_slotStart_slotEnd: {
          roomTypeId,
          date: testDate,
          slotStart,
          slotEnd
        }
      }
    });

    assert.strictEqual(finalInv.reservedRooms, 1, 'reservedRooms must equal 1 in database');
    console.log('\n[PASS] Concurrency & Load Stress Test Passed successfully! 🚀');
  } catch (err) {
    console.error('\n[FAIL] Assertion failed during stress test:');
    console.error(err.message);
    process.exit(1);
  } finally {
    // Cleanup stress test records
    console.log('\nCleaning up stress test records...');
    await prisma.booking.deleteMany({
      where: { publicId: { startsWith: 'TEST-STRESS-' } }
    });
    await prisma.roomInventory.deleteMany({
      where: {
        roomTypeId,
        date: testDate,
        slotStart,
        slotEnd
      }
    });
    await prisma.$disconnect();
    console.log('Cleanup completed.');
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
