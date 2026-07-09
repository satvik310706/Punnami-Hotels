const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rooms = await prisma.roomType.findMany();
  console.log('Room Galleries:');
  rooms.forEach(x => {
    console.log({
      id: x.id.toString(),
      name: x.name,
      coverImageUrl: x.coverImageUrl,
      galleryImages: x.galleryImages
    });
  });
}

main().finally(() => prisma.$disconnect());
