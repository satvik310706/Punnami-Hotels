const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Querying room types:');
  const roomTypes = await prisma.roomType.findMany({
    select: { id: true, name: true }
  });
  console.log(roomTypes.map(r => ({ id: r.id.toString(), name: r.name })));

  console.log('\nQuerying all inventories with overrides or closures in July 2026:');
  const inventories = await prisma.roomInventory.findMany({
    where: {
      date: {
        gte: new Date('2026-07-01T00:00:00.000Z'),
        lte: new Date('2026-07-31T23:59:59.000Z')
      }
    },
    orderBy: [{ roomTypeId: 'asc' }, { date: 'asc' }]
  });

  console.log(`Found ${inventories.length} inventory records in July 2026:`);
  for (const inv of inventories) {
    console.log({
      id: inv.id.toString(),
      roomTypeId: inv.roomTypeId.toString(),
      date: inv.date.toISOString().split('T')[0],
      slotStart: inv.slotStart,
      slotEnd: inv.slotEnd,
      totalRooms: inv.totalRooms,
      bookedRooms: inv.bookedRooms,
      reservedRooms: inv.reservedRooms,
      isClosed: inv.isClosed,
      priceOverride: inv.priceOverride?.toString(),
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
