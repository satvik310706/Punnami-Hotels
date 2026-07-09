// Just simulate the exact same Prisma queries and logic!
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { startOfMonth, endOfMonth, eachDayOfInterval } = require('date-fns');

async function main() {
  const year = 2026;
  const month = 7;
  const baseDate = new Date(year, month - 1, 1);
  const start = startOfMonth(baseDate);
  const end = endOfMonth(baseDate);

  console.log('Query start date local:', start.toString());
  console.log('Query start date UTC:', start.toISOString());
  console.log('Query end date local:', end.toString());
  console.log('Query end date UTC:', end.toISOString());

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
        hotel: { select: { checkInTime: true, checkOutTime: true } }
      },
    }),
  ]);

  console.log('\nRoom types fetched count:', roomTypes.length);
  console.log('Inventories fetched count:', inventories.length);

  const days = eachDayOfInterval({ start, end });
  console.log('Total days generated:', days.length);

  // Let's print day index 8 (which is July 9th)
  const day9 = days.find(d => d.getDate() === 9);
  if (day9) {
    const y = day9.getFullYear();
    const m = String(day9.getMonth() + 1).padStart(2, '0');
    const d = String(day9.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    console.log('\nDay 9 dateStr:', dateStr);
    console.log('Day 9 local string:', day9.toString());
    console.log('Day 9 ISO string:', day9.toISOString());

    // Check if any inventory date matches dateStr
    const matchedInvs = inventories.filter(inv => {
      const invDateStr = inv.date.toISOString().split('T')[0];
      return invDateStr === dateStr;
    });

    console.log('Total database inventories on this day in query results:', matchedInvs.length);
    for (const inv of matchedInvs) {
      console.log({
        id: inv.id.toString(),
        roomTypeId: inv.roomTypeId.toString(),
        date: inv.date.toISOString(),
        isClosed: inv.isClosed,
        totalRooms: inv.totalRooms,
      });
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
