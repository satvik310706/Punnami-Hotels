import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/v1/admin/rooms/[id]/future-bookings — Get active future bookings for a room category
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const bookings = await prisma.booking.findMany({
      where: {
        roomTypeId: BigInt(id),
        checkInDate: { gte: now },
        status: { in: ['CONFIRMED', 'PENDING_PROOF', 'PENDING_CONFIRMATION'] },
      },
      select: {
        publicId: true,
        guestName: true,
        guestPhone: true,
        checkInDate: true,
        checkOutDate: true,
      },
      orderBy: { checkInDate: 'asc' },
    });

    return NextResponse.json(
      bookings.map((b) => ({
        id: b.publicId,
        publicId: b.publicId,
        guest_name: b.guestName,
        guest_phone: b.guestPhone,
        check_in: b.checkInDate.toISOString().split('T')[0],
        check_out: b.checkOutDate.toISOString().split('T')[0],
      }))
    );
  } catch (err) {
    console.error('[Admin Room Future Bookings API] Error:', err);
    return NextResponse.json({ error: 'Failed to check future bookings' }, { status: 500 });
  }
}
