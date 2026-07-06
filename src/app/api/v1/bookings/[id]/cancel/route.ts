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

    if (!['CONFIRMED', 'PARTIAL_PAID'].includes(booking.status)) {
      return NextResponse.json({ error: 'Only confirmed or partially paid bookings can be cancelled.' }, { status: 400 });
    }

    // Enforce 4-day cancellation restriction (checkInDate >= today + 4 days)
    const checkIn = new Date(booking.checkInDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limitDate = new Date(today);
    limitDate.setDate(limitDate.getDate() + 4);

    if (checkIn < limitDate) {
      return NextResponse.json({ error: 'Cancellation is unavailable within 4 days of check-in.' }, { status: 400 });
    }

    // For room bookings in ts-tours, cancellation incurs 100% charge
    const cancellationFee = Number(booking.totalAmount);
    const refundAmount = 0;

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
