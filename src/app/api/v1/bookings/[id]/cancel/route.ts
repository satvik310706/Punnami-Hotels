import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { reason } = body;

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json({ error: 'Please provide a valid reason (minimum 5 characters).' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { publicId: id },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    if (['CANCELLED', 'CANCEL_REQUESTED', 'POSTPONE_REQUESTED', 'POSTPONED', 'REFUNDED'].includes(booking.status)) {
      return NextResponse.json({ error: 'Booking is already cancelled, postponed, or has a pending request.' }, { status: 400 });
    }

    if (booking.status !== 'CONFIRMED') {
      return NextResponse.json({ error: 'Only confirmed bookings can be cancelled.' }, { status: 400 });
    }

    // Enforce 24-hour limit before check-in date
    const checkIn = new Date(booking.checkInDate);
    const now = new Date();
    const diffMs = checkIn.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    let cancellationFee = 0;
    let refundAmount = Number(booking.totalAmount);

    if (diffHours < 24) {
      // 100% cancellation charge applies
      cancellationFee = Number(booking.totalAmount);
      refundAmount = 0;
    }

    const updated = await prisma.booking.update({
      where: { publicId: id },
      data: {
        status: 'CANCEL_REQUESTED',
        cancellationReason: reason,
        cancellationFee,
        refundAmount,
      },
    });

    return NextResponse.json({
      status: 'success',
      message: 'Cancellation request submitted successfully.',
      cancellationFee,
      refundAmount,
    });
  } catch (err) {
    console.error('[Booking Cancel Request API] Error:', err);
    return NextResponse.json({ error: 'Failed to process cancellation request.' }, { status: 500 });
  }
}
