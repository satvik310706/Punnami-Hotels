const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Migrating Booking slots to 24-hour format...');
  
  // Find bookings with 12:00 PM:00 or 11:00 AM:00
  const bookings = await prisma.booking.findMany();
  for (const b of bookings) {
    let updateNeeded = false;
    let newSlotStart = b.slotStart;
    let newSlotEnd = b.slotEnd;
    
    if (b.slotStart === '12:00 PM:00' || b.slotStart === '12:00 PM') {
      newSlotStart = '12:00:00';
      updateNeeded = true;
    }
    if (b.slotEnd === '11:00 AM:00' || b.slotEnd === '11:00 AM') {
      newSlotEnd = '11:00:00';
      updateNeeded = true;
    }
    
    if (updateNeeded) {
      console.log(`Updating booking ${b.publicId}: slotStart: ${b.slotStart} -> ${newSlotStart}, slotEnd: ${b.slotEnd} -> ${newSlotEnd}`);
      await prisma.booking.update({
        where: { id: b.id },
        data: { slotStart: newSlotStart, slotEnd: newSlotEnd }
      });
    }
  }

  console.log('Migrating RoomInventory slots to 24-hour format...');
  const inventories = await prisma.roomInventory.findMany();
  for (const inv of inventories) {
    let updateNeeded = false;
    let newSlotStart = inv.slotStart;
    let newSlotEnd = inv.slotEnd;
    
    if (inv.slotStart === '12:00 PM:00' || inv.slotStart === '12:00 PM') {
      newSlotStart = '12:00:00';
      updateNeeded = true;
    }
    if (inv.slotEnd === '11:00 AM:00' || inv.slotEnd === '11:00 AM') {
      newSlotEnd = '11:00:00';
      updateNeeded = true;
    }
    
    if (updateNeeded) {
      console.log(`Updating inventory row ${inv.id}: ${inv.slotStart} -> ${newSlotStart}, ${inv.slotEnd} -> ${newSlotEnd}`);
      
      // Since it's a unique constraint, let's delete the old one or update it if there is no conflict.
      const conflict = await prisma.roomInventory.findUnique({
        where: {
          roomTypeId_date_slotStart_slotEnd: {
            roomTypeId: inv.roomTypeId,
            date: inv.date,
            slotStart: newSlotStart,
            slotEnd: newSlotEnd
          }
        }
      });
      
      if (conflict) {
        console.log(`Conflict found for inventory ID ${conflict.id}, merging...`);
        // Merge bookedRooms / reservedRooms
        await prisma.roomInventory.update({
          where: { id: conflict.id },
          data: {
            bookedRooms: conflict.bookedRooms + inv.bookedRooms,
            reservedRooms: conflict.reservedRooms + inv.reservedRooms,
          }
        });
        // Delete the duplicate old inventory
        await prisma.roomInventory.delete({ where: { id: inv.id } });
      } else {
        await prisma.roomInventory.update({
          where: { id: inv.id },
          data: { slotStart: newSlotStart, slotEnd: newSlotEnd }
        });
      }
    }
  }
  
  console.log('Migration finished successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
