import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/v1/admin/rooms/[id] — Fetch single room type details
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const room = await prisma.roomType.findUnique({
      where: { id: BigInt(id) },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room variant not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...room,
      id: room.id.toString(),
      hotelId: room.hotelId.toString(),
      weekdayPrice: Number(room.weekdayPrice),
      weekendPrice: Number(room.weekendPrice),
    });
  } catch (err) {
    console.error('[Admin Room Detail API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch room details' }, { status: 500 });
  }
}

// PUT /api/v1/admin/rooms/[id] — Update room type details
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();

    const existing = await prisma.roomType.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Room variant not found' }, { status: 404 });
    }

    // If slug is modified, check uniqueness
    if (data.slug && data.slug !== existing.slug) {
      const slugCheck = await prisma.roomType.findUnique({
        where: { slug: data.slug },
      });
      if (slugCheck) {
        return NextResponse.json({ error: 'Slug is already in use. Please select a unique slug.' }, { status: 400 });
      }
    }

    // Collect fields to update
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.coverImageUrl !== undefined) updateData.coverImageUrl = data.coverImageUrl;
    if (data.galleryImages !== undefined) updateData.galleryImages = data.galleryImages;
    if (data.facilities !== undefined) updateData.facilities = data.facilities;
    if (data.highlights !== undefined) updateData.highlights = data.highlights;
    if (data.faqs !== undefined) updateData.faqs = data.faqs;
    if (data.policies !== undefined) updateData.policies = data.policies;
    if (data.weekdayPrice !== undefined) updateData.weekdayPrice = Number(data.weekdayPrice);
    if (data.weekendPrice !== undefined) updateData.weekendPrice = Number(data.weekendPrice);
    if (data.capacityPerRoom !== undefined) updateData.capacityPerRoom = Number(data.capacityPerRoom);
    if (data.maxAdults !== undefined) updateData.maxAdults = Number(data.maxAdults);
    if (data.maxChildren !== undefined) updateData.maxChildren = Number(data.maxChildren);
    if (data.totalInventory !== undefined) updateData.totalInventory = Number(data.totalInventory);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.orderPriority !== undefined) updateData.orderPriority = Number(data.orderPriority);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.bookingSlots !== undefined) updateData.bookingSlots = data.bookingSlots;

    const updated = await prisma.roomType.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Room variant updated successfully',
      id: updated.id.toString(),
    });
  } catch (err) {
    console.error('[Admin Room Update API] Error:', err);
    return NextResponse.json({ error: 'Failed to update room variant' }, { status: 500 });
  }
}

// DELETE /api/v1/admin/rooms/[id] — Delete room type category
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existing = await prisma.roomType.findUnique({
      where: { id: BigInt(id) },
      include: { bookings: { select: { id: true, status: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Room variant not found' }, { status: 404 });
    }

    // Prevent deletion if there are ACTIVE bookings
    const activeBookings = existing.bookings.filter(b => !['CANCELLED', 'REJECTED', 'REFUNDED'].includes(b.status));
    if (activeBookings.length > 0) {
      return NextResponse.json({ error: 'Cannot delete room variant: It has ACTIVE bookings associated with it. Please cancel them or change the room status to ARCHIVED instead.' }, { status: 400 });
    }

    // If we reach here, any existing bookings are cancelled/rejected.
    // We must hard-delete them and their payments to satisfy foreign key constraints.
    if (existing.bookings.length > 0) {
      const bookingIds = existing.bookings.map(b => b.id);
      
      // Delete associated payments
      await prisma.payment.deleteMany({
        where: { bookingId: { in: bookingIds } }
      });
      
      // Delete bookings
      await prisma.booking.deleteMany({
        where: { roomTypeId: BigInt(id) }
      });
    }

    // Delete related inventory rows first to prevent foreign key errors
    await prisma.roomInventory.deleteMany({
      where: { roomTypeId: BigInt(id) },
    });

    // Delete the room type
    await prisma.roomType.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({ message: 'Room variant and related inventory logs deleted successfully' });
  } catch (err) {
    console.error('[Admin Room Delete API] Error:', err);
    return NextResponse.json({ error: 'Failed to delete room variant' }, { status: 500 });
  }
}
