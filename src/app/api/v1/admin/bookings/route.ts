import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/v1/admin/bookings — Fetch all bookings for admin review
export async function GET(req: NextRequest) {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        roomType: {
          select: { name: true, coverImageUrl: true },
        },
      },
    });

    return NextResponse.json(
      bookings.map((b) => ({
        ...b,
        id: b.id.toString(),
        roomTypeId: b.roomTypeId.toString(),
        subtotalAmount: Number(b.subtotalAmount),
        discountAmount: Number(b.discountAmount),
        gstAmount: Number(b.gstAmount),
        totalAmount: Number(b.totalAmount),
        cancellationFee: b.cancellationFee ? Number(b.cancellationFee) : null,
        refundAmount: b.refundAmount ? Number(b.refundAmount) : null,
      }))
    );
  } catch (err) {
    console.error('[Admin Get Bookings API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
