import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/v1/admin/rooms — List all room types for the admin panel
export async function GET(req: NextRequest) {
  try {
    const rooms = await prisma.roomType.findMany({
      orderBy: [{ orderPriority: 'asc' }, { createdAt: 'desc' }],
      include: { hotel: { select: { name: true } } },
    });

    return NextResponse.json(
      rooms.map((r) => ({
        ...r,
        id: r.id.toString(),
        hotelId: r.hotelId.toString(),
        weekdayPrice: Number(r.weekdayPrice),
        weekendPrice: Number(r.weekendPrice),
      }))
    );
  } catch (err) {
    console.error('[Admin Rooms List API] Error:', err);
    return NextResponse.json({ error: 'Failed to list rooms' }, { status: 500 });
  }
}

// POST /api/v1/admin/rooms — Create a new room type
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Find default hotel
    let hotel = await prisma.hotel.findFirst({
      where: { slug: 'punnami-hotels' },
    });

    if (!hotel) {
      hotel = await prisma.hotel.create({
        data: {
          name: 'Punnami Hotels',
          slug: 'punnami-hotels',
        },
      });
    }

    const {
      name,
      slug,
      description,
      coverImageUrl,
      galleryImages,
      facilities,
      highlights,
      faqs,
      policies,
      weekdayPrice,
      weekendPrice,
      capacityPerRoom,
      maxAdults,
      maxChildren,
      totalInventory,
      isActive,
      isFeatured,
      orderPriority,
      status,
      bookingSlots,
    } = data;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Check unique slug
    const existing = await prisma.roomType.findUnique({
      where: { slug },
    });
    if (existing) {
      return NextResponse.json({ error: 'Slug must be unique. This slug is already in use.' }, { status: 400 });
    }

    const created = await prisma.roomType.create({
      data: {
        hotelId: hotel.id,
        name,
        slug,
        description,
        coverImageUrl,
        galleryImages: galleryImages || [],
        facilities: facilities || [],
        highlights: highlights || [],
        faqs: faqs || [],
        policies: policies || [],
        weekdayPrice: Number(weekdayPrice || 0),
        weekendPrice: Number(weekendPrice || 0),
        capacityPerRoom: Number(capacityPerRoom || 2),
        maxAdults: Number(maxAdults || 2),
        maxChildren: Number(maxChildren || 0),
        totalInventory: Number(totalInventory || 1),
        isActive: isActive !== undefined ? isActive : true,
        isFeatured: isFeatured !== undefined ? isFeatured : false,
        orderPriority: Number(orderPriority || 0),
        status: status || 'DRAFT',
        bookingSlots: bookingSlots || [],
      },
    });

    return NextResponse.json({
      message: 'Room created successfully',
      id: created.id.toString(),
      slug: created.slug,
    });
  } catch (err) {
    console.error('[Admin Room Create API] Error:', err);
    return NextResponse.json({ error: 'Failed to create room category' }, { status: 500 });
  }
}
