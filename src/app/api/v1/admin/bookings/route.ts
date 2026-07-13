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
          where: { status: 'COMPLETED' },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return NextResponse.json(
      bookings.map((b) => {
        const latestPayment = b.payments?.[0] ?? null;
        const { payments, ...bookingData } = b;
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
          // PhonePe gateway txn ID — prefer the one stored directly on the booking,
          // fallback to the Payment record's merchantTransactionId if booking.transactionId is null
          gatewayTransactionId: b.transactionId || null,
          merchantTransactionId: latestPayment?.merchantTransactionId || null,
          completedPayments: b.payments.map((p) => {
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
