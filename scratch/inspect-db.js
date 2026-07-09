const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const publicId = 'HTL-20260709-P7SJE';
  console.log('Querying booking:', publicId);
  const booking = await prisma.booking.findUnique({
    where: { publicId },
    include: { roomType: true }
  });

  if (!booking) {
    console.error('Booking not found!');
    return;
  }

  console.log('Booking details:', {
    id: booking.id.toString(),
    publicId: booking.publicId,
    status: booking.status,
    roomTypeId: booking.roomTypeId.toString(),
    roomTypeName: booking.roomType.name,
    checkInDate: booking.checkInDate,
    checkOutDate: booking.checkOutDate,
    slotStart: booking.slotStart,
    slotEnd: booking.slotEnd,
    roomsBooked: booking.roomsBooked,
    paidAmount: booking.paidAmount?.toString(),
    totalAmount: booking.totalAmount.toString(),
  });

  console.log('\nQuerying room inventory for date range around:', booking.checkInDate);
  const inventories = await prisma.roomInventory.findMany({
    where: {
      roomTypeId: booking.roomTypeId,
    },
    orderBy: { date: 'asc' }
  });

  console.log('Total inventory records found for this room type:', inventories.length);
  for (const inv of inventories) {
    console.log({
      id: inv.id.toString(),
      date: inv.date.toISOString().split('T')[0],
      slotStart: inv.slotStart,
      slotEnd: inv.slotEnd,
      totalRooms: inv.totalRooms,
      bookedRooms: inv.bookedRooms,
      reservedRooms: inv.reservedRooms,
      isClosed: inv.isClosed,
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
