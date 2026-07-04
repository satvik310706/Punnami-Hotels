import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getPhonePeClient } from '@/lib/phonepe';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get('bookingId');

  if (!bookingId) {
    return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { publicId: bookingId },
      select: { id: true, publicId: true, status: true }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status === 'CONFIRMED') {
      return NextResponse.json({ status: 'COMPLETED' });
    }

    const paymentRecord = await prisma.payment.findFirst({
      where: { bookingId: booking.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!paymentRecord) {
      return NextResponse.json({ status: 'PENDING' });
    }

    const client = getPhonePeClient();
    const statusResult = await client.getOrderStatus(paymentRecord.merchantTransactionId);
    const pgState = statusResult?.state?.toUpperCase();

    if (pgState === 'COMPLETED') {
      const transactionId = statusResult.paymentDetails?.[0]?.transactionId || null;

      // Transactional status update
      await prisma.$transaction(async (tx) => {
        const lockedBookings = await tx.$queryRaw<{ id: bigint; status: string }[]>`
          SELECT id, status FROM "Booking" WHERE id = ${booking.id} FOR UPDATE
        `;
        const currentBooking = lockedBookings[0];

        if (currentBooking && currentBooking.status !== 'CONFIRMED') {
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              status: 'CONFIRMED',
              transactionId: transactionId
            }
          });

          await tx.payment.update({
            where: { merchantTransactionId: paymentRecord.merchantTransactionId },
            data: {
              status: 'COMPLETED',
              providerResponse: JSON.stringify(statusResult)
            }
          });
        }
      });

      return NextResponse.json({ status: 'COMPLETED' });
    } else if (pgState === 'FAILED' || pgState === 'CANCELLED') {
      await prisma.payment.update({
        where: { merchantTransactionId: paymentRecord.merchantTransactionId },
        data: {
          status: 'FAILED',
          providerResponse: JSON.stringify(statusResult)
        }
      });
      return NextResponse.json({ status: 'FAILED' });
    }

    return NextResponse.json({ status: 'PENDING' });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
