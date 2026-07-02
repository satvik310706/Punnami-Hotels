import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/v1/rooms/[slug] — Public room detail page
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const room = await prisma.roomType.findUnique({
      where: { slug, status: 'PUBLISHED', isActive: true },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            mapUrl: true,
            checkInTime: true,
            checkOutTime: true,
            coverImageUrl: true,
            facilities: true,
            policies: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...room,
      id: room.id.toString(),
      hotelId: room.hotelId.toString(),
      weekdayPrice: Number(room.weekdayPrice),
      weekendPrice: Number(room.weekendPrice),
      hotel: {
        ...room.hotel,
        id: room.hotel.id.toString(),
      },
    });
  } catch (err) {
    console.error('[Room Detail API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch room details' }, { status: 500 });
  }
}
