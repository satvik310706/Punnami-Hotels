import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { cleanupExpiredBookings } from '@/lib/booking-cleanup';

// GET /api/v1/admin/bookings — Fetch all bookings for admin review
export async function GET(req: NextRequest) {
  try {
    // Proactively clean up expired reservations
    cleanupExpiredBookings().catch((err) => {
      console.error('[Admin Bookings] Cleanup error:', err);
    });

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
        },
      },
    });

    return NextResponse.json(
      bookings.map((b) => {
        const latestPayment = b.payments?.[0] ?? null;
        const completedPayment = b.payments.find((p) => p.status === 'COMPLETED') ?? null;
        const { payments, ...bookingData } = b;

        let resolvedGatewayTxnId = b.transactionId || null;
        if (!resolvedGatewayTxnId && latestPayment?.providerResponse) {
          try {
            const resp = JSON.parse(latestPayment.providerResponse);
            resolvedGatewayTxnId = resp.data?.transactionId || resp.paymentDetails?.[0]?.transactionId || null;
          } catch {}
        }

        return {
          ...bookingData,
          id: b.id.toString(),
          roomTypeId: b.roomTypeId.toString(),
          subtotalAmount: Number(b.subtotalAmount),
          discountAmount: Number(b.discountAmount),
          gstAmount: Number(b.gstAmount),
          gatewayFee: Number(b.gatewayFee),
          totalAmount: Number(b.totalAmount),
          cancellationFee: b.cancellationFee ? Number(b.cancellationFee) : null,
          refundAmount: b.refundAmount ? Number(b.refundAmount) : null,
          paidAmount: b.paidAmount ? Number(b.paidAmount) : null,
          paymentPercentage: b.paymentPercentage ? Number(b.paymentPercentage) : null,
          gatewayTransactionId: resolvedGatewayTxnId || latestPayment?.merchantTransactionId || null,
          merchantTransactionId: latestPayment?.merchantTransactionId || null,
          paymentStatus: latestPayment?.status || (b.status === 'CONFIRMED' ? 'COMPLETED' : 'PENDING'),
          completedPayments: b.payments.filter((p) => p.status === 'COMPLETED').map((p) => {
            let pgTxnId = p.merchantTransactionId;
            try {
              if (p.providerResponse) {
                const resp = JSON.parse(p.providerResponse);
                pgTxnId = resp.data?.transactionId || resp.paymentDetails?.[0]?.transactionId || p.merchantTransactionId;
              }
            } catch {}
            return {
              id: p.id.toString(),
              merchantTransactionId: p.merchantTransactionId,
              gatewayTransactionId: pgTxnId,
              amount: Number(p.amount),
              createdAt: p.createdAt.toISOString(),
            };
          }),
        };
      })
    );
  } catch (err) {
    console.error('[Admin Get Bookings API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
