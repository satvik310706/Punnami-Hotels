import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/v1/bookings/lookup?id=HTL-XXXXXXXXXXXX
// No authentication required — public endpoint for ticket lookup by booking public ID
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get('id')?.trim().toUpperCase();

    if (!publicId) {
      return NextResponse.json({ error: 'Booking ID is required.' }, { status: 400 });
    }

    const bookingRaw = await prisma.booking.findUnique({
      where: { publicId },
      include: {
        roomType: {
          select: {
            name: true,
            coverImageUrl: true,
            hotel: {
              select: {
                name: true,
                address: true,
                checkInTime: true,
                checkOutTime: true,
              },
            },
          },
        },
      },
    });

    if (!bookingRaw) {
      return NextResponse.json({ error: 'No booking found with this ID. Please check and try again.' }, { status: 404 });
    }

    const booking = bookingRaw as any;

    // Compute days until check-in
    const checkInDate = new Date(booking.checkInDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const canRequestChanges = daysUntilCheckIn >= 4 && ['CONFIRMED', 'PARTIAL_PAID'].includes(booking.status);

    // Payment info
    const totalAmount = Number(booking.totalAmount);
    const paidAmount = Number(booking.paidAmount ?? totalAmount);
    const remainingBalance = Math.max(0, totalAmount - paidAmount);
    const paymentPct = Number(booking.paymentPercentage ?? 100);

    // Cancellation policy based on payment
    const cancellationPolicy = paymentPct < 100
      ? '50% advance paid is non-refundable. No refund upon cancellation.'
      : '50% refund if cancelled 4+ days before check-in. Contact admin to process.';

    return NextResponse.json({
      publicId: booking.publicId,
      status: booking.status,
      checkInDate: booking.checkInDate.toISOString(),
      checkOutDate: booking.checkOutDate.toISOString(),
      totalNights: booking.totalNights,
      roomsBooked: booking.roomsBooked,
      slotStart: booking.slotStart,
      slotEnd: booking.slotEnd,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      adultCount: booking.adultCount,
      childCount: booking.childCount,
      passengers: booking.passengers,
      subtotalAmount: Number(booking.subtotalAmount),
      gstAmount: Number(booking.gstAmount),
      totalAmount,
      paidAmount,
      remainingBalance,
      paymentPercentage: paymentPct,
      cancellationPolicy,
      canRequestChanges,
      daysUntilCheckIn,
      postponeReason: booking.postponeReason,
      postponeNewDate: booking.postponeNewDate?.toISOString() ?? null,
      cancellationReason: booking.cancellationReason,
      cancellationFee: booking.cancellationFee ? Number(booking.cancellationFee) : null,
      refundAmount: booking.refundAmount ? Number(booking.refundAmount) : null,
      createdAt: booking.createdAt.toISOString(),
      roomType: {
        name: booking.roomType?.name || 'Room Variant',
        coverImageUrl: booking.roomType?.coverImageUrl || null,
      },
      hotel: {
        name: booking.roomType?.hotel?.name || 'Punnami Southern Residency',
        address: booking.roomType?.hotel?.address || 'Shilpi Nagar, Bhadrachalam',
        checkInTime: booking.roomType?.hotel?.checkInTime || '12:00',
        checkOutTime: booking.roomType?.hotel?.checkOutTime || '11:00',
        phone: '+91 95420 69573',
        email: 'telanganaboattourism@gmail.com',
      },
    });
  } catch (err) {
    console.error('[Booking Lookup API] Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve booking. Please try again.' }, { status: 500 });
  }
}
