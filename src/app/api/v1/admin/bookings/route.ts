import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/v1/admin/bookings — Fetch all bookings for admin review
export async function GET(req: NextRequest) {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        roomType: {
          select: { 
            name: true, 
            coverImageUrl: true,
            hotel: { select: { name: true } }
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return NextResponse.json(
      bookings.map((b) => {
        const latestPayment = b.payments?.[0] ?? null;
        return {
          ...b,
          id: b.id.toString(),
          roomTypeId: b.roomTypeId.toString(),
          subtotalAmount: Number(b.subtotalAmount),
          discountAmount: Number(b.discountAmount),
          gstAmount: Number(b.gstAmount),
          totalAmount: Number(b.totalAmount),
          cancellationFee: b.cancellationFee ? Number(b.cancellationFee) : null,
          refundAmount: b.refundAmount ? Number(b.refundAmount) : null,
          paidAmount: b.paidAmount ? Number(b.paidAmount) : null,
          paymentPercentage: b.paymentPercentage ? Number(b.paymentPercentage) : null,
          // PhonePe gateway txn ID — prefer the one stored directly on the booking,
          // fallback to the Payment record's merchantTransactionId if booking.transactionId is null
          gatewayTransactionId: b.transactionId || null,
          merchantTransactionId: latestPayment?.merchantTransactionId || null,
          payments: undefined, // don't expose raw payment objects to frontend
        };
      })
    );
  } catch (err) {
    console.error('[Admin Get Bookings API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
