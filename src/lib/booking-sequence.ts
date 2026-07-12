import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

export function generateRoomAcronym(roomName: string): string {
  if (!roomName) return 'RM';
  
  // Extract the first letter of each word
  // e.g., "Executive Twin Room" -> "ETR", "Premium Deluxe Room" -> "PDR"
  const acronym = roomName
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
    
  // If it's a single word room, take first 3 letters
  if (acronym.length === 1) {
    return roomName.substring(0, 3).toUpperCase();
  }
  
  return acronym;
}

export async function assignSequentialId(tx: any, bookingId: bigint): Promise<string | null> {
  // Fetch booking with roomType to get the name
  const booking = await tx.booking.findUnique({
    where: { id: bookingId },
    include: { roomType: true }
  });

  if (!booking) return null;
  
  // If it already has a sequenceId, don't overwrite it
  if (booking.sequenceId) return booking.sequenceId;

  const acronym = generateRoomAcronym(booking.roomType.name);
  const dateStr = format(booking.createdAt, 'yyyyMMdd');
  const prefix = `HTL-${dateStr}-${acronym}-`;

  // Find the highest sequence number currently assigned for this room type
  // This uses a locking query to prevent race conditions
  const latestBookingWithSeq = await tx.booking.findFirst({
    where: {
      roomTypeId: booking.roomTypeId,
      sequenceId: { not: null },
    },
    orderBy: {
      id: 'desc' // Assuming newer bookings have higher IDs
    },
    select: { sequenceId: true }
  });

  let nextSeqNumber = 1;

  if (latestBookingWithSeq && latestBookingWithSeq.sequenceId) {
    // Extract the sequential part (last 4 characters)
    const seqPart = latestBookingWithSeq.sequenceId.split('-').pop();
    if (seqPart && !isNaN(Number(seqPart))) {
      nextSeqNumber = parseInt(seqPart, 10) + 1;
    }
  }

  const sequenceId = `${prefix}${nextSeqNumber.toString().padStart(4, '0')}`;

  // Update the booking
  await tx.booking.update({
    where: { id: bookingId },
    data: { sequenceId }
  });

  return sequenceId;
}
