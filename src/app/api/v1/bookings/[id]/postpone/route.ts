import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { newDate, reason } = body;

    if (!newDate) {
      return NextResponse.json({ error: 'Please select a valid new travel date.' }, { status: 400 });
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json({ error: 'Please provide a valid reason (minimum 5 characters).' }, { status: 400 });
    }

    const proposedDate = new Date(newDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (proposedDate <= today) {
      return NextResponse.json({ error: 'Proposed travel date must be in the future.' }, { status: 400 });
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
      return NextResponse.json({ error: 'Only confirmed or partially paid bookings can be postponed.' }, { status: 400 });
    }

    // Enforce 7-day postpone restriction (checkInDate >= today + 7 days)
    const checkIn = new Date(booking.checkInDate);
    const limitDate = new Date(today);
    limitDate.setDate(limitDate.getDate() + 7);

    if (checkIn < limitDate) {
      return NextResponse.json({ error: 'Postponement is unavailable within 7 days of check-in.' }, { status: 400 });
    }

    const updated = await prisma.booking.update({
      where: { publicId: id },
      data: {
        status: 'POSTPONE_REQUESTED',
        postponeReason: reason,
        postponeNewDate: proposedDate,
      },
    });

    return NextResponse.json({
      status: 'success',
      message: 'Postponement request submitted successfully.',
    });
  } catch (err) {
    console.error('[Booking Postpone Request API] Error:', err);
    return NextResponse.json({ error: 'Failed to process postponement request.' }, { status: 500 });
  }
}
