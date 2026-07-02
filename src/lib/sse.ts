import prisma from './db';
import { nowIST } from './ist';

type SSEClient = (message: string) => void;

class SSEManager {
  // Maps roomTypeId to a set of client callback functions
  private clients = new Map<string, Set<SSEClient>>();

  addClient(roomTypeId: string, client: SSEClient) {
    if (!this.clients.has(roomTypeId)) {
      this.clients.set(roomTypeId, new Set());
    }
    this.clients.get(roomTypeId)!.add(client);
  }

  removeClient(roomTypeId: string, client: SSEClient) {
    const roomClients = this.clients.get(roomTypeId);
    if (roomClients) {
      roomClients.delete(client);
      if (roomClients.size === 0) {
        this.clients.delete(roomTypeId);
      }
    }
  }

  broadcast(roomTypeId: string, eventName: string, data: any) {
    const roomClients = this.clients.get(roomTypeId);
    if (!roomClients) return;

    const payload = JSON.stringify({
      version: Date.now(),
      timestamp: nowIST().toISOString(),
      roomTypeId,
      ...data,
    });

    const message = `event: ${eventName}\ndata: ${payload}\n\n`;

    for (const client of roomClients) {
      try {
        client(message);
      } catch (err) {
        // Safe fail
      }
    }
  }
}

// Prevent multiple instances of SSEManager in development (HMR)
const globalForSSE = globalThis as unknown as { sseManager: SSEManager | undefined };
export const sseManager = globalForSSE.sseManager ?? new SSEManager();
if (process.env.NODE_ENV !== 'production') globalForSSE.sseManager = sseManager;

export async function broadcastRoomInventoryUpdate(roomTypeId: bigint, date: Date, slotStart?: string, slotEnd?: string) {
  try {
    const dateObj = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
      select: { totalInventory: true },
    });
    if (!roomType) return;

    let inventories = [];
    if (slotStart && slotEnd) {
      const inventory = await prisma.roomInventory.findUnique({
        where: {
          roomTypeId_date_slotStart_slotEnd: {
            roomTypeId,
            date: dateObj,
            slotStart,
            slotEnd,
          },
        },
      });
      if (inventory) {
        inventories.push(inventory);
      }
    } else {
      inventories = await prisma.roomInventory.findMany({
        where: { roomTypeId, date: dateObj },
      });
    }

    if (inventories.length === 0) {
      const available = roomType.totalInventory;
      sseManager.broadcast(roomTypeId.toString(), 'INVENTORY_UPDATE', {
        travel_date: dateObj.toISOString().split('T')[0],
        slot_start: slotStart ?? '12:00:00',
        slot_end: slotEnd ?? '11:00:00',
        available,
        booked: 0,
        reserved: 0,
        is_closed: false,
        priceOverride: null,
      });
      return;
    }

    for (const inventory of inventories) {
      const totalRooms = inventory.totalRooms;
      const bookedRooms = inventory.bookedRooms;
      const reservedRooms = inventory.reservedRooms;
      const isClosed = inventory.isClosed;
      const priceOverride = inventory.priceOverride ? Number(inventory.priceOverride) : null;

      const available = Math.max(0, totalRooms - (bookedRooms + reservedRooms));

      sseManager.broadcast(roomTypeId.toString(), 'INVENTORY_UPDATE', {
        travel_date: dateObj.toISOString().split('T')[0],
        slot_start: inventory.slotStart,
        slot_end: inventory.slotEnd,
        available,
        booked: bookedRooms,
        reserved: reservedRooms,
        is_closed: isClosed,
        priceOverride,
      });
    }
  } catch (err) {
    console.error('Failed to broadcast room inventory update:', err);
  }
}

export function broadcastRoomBulkRefresh(roomTypeId: bigint) {
  try {
    sseManager.broadcast(roomTypeId.toString(), 'BULK_REFRESH', {
      roomTypeId: roomTypeId.toString(),
    });
  } catch (err) {
    console.error('Failed to broadcast room bulk refresh:', err);
  }
}
