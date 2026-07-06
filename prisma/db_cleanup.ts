import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Database Cleanup Started ---');
  
  // 1. Delete all bookings
  const deletedBookings = await prisma.booking.deleteMany({});
  console.log(`Deleted Bookings: ${deletedBookings.count}`);
  
  // 2. Delete all payments
  const deletedPayments = await prisma.payment.deleteMany({});
  console.log(`Deleted Payments: ${deletedPayments.count}`);

  // 3. Reset Room Inventory reserved/booked counts to 0
  const resetInventories = await prisma.roomInventory.updateMany({
    data: {
      bookedRooms: 0,
      reservedRooms: 0,
    }
  });
  console.log(`Reset Inventories: ${resetInventories.count}`);

  console.log('--- Database Cleanup Finished ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
