import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
};

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

// Always reuse the existing instance across the entire Node.js/Next.js runtime
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// Unconditionally attach to globalThis in ALL environments (dev AND production)
// to prevent multiple PrismaClient connection pools from spawning on a 1GB database
globalThis.prismaGlobal = prisma;

export default prisma;

