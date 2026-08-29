import prisma from '../src/lib/db';

async function main() {
  const roomTypes = await prisma.roomType.findMany({
    select: { id: true, name: true, slug: true, bookingSlots: true, totalInventory: true, weekdayPrice: true, weekendPrice: true }
  });
  console.log('RoomTypes:', JSON.stringify(roomTypes, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));

  const inventories = await prisma.roomInventory.findMany({
    take: 20,
    orderBy: { date: 'desc' }
  });
  console.log('Inventories:', JSON.stringify(inventories, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
