import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getPhonePeClient } from '@/lib/phonepe';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);
    const responsePayload = payload.response;

    if (!responsePayload) {
      return NextResponse.json({ error: 'Missing response payload' }, { status: 400 });
    }

    const decoded = JSON.parse(Buffer.from(responsePayload, 'base64').toString('utf-8'));
    const { code, success, data } = decoded;
    const merchantTransactionId = data?.merchantTransactionId;
    let phonePeTransactionId = data?.transactionId || null;

    if (!merchantTransactionId) {
      return NextResponse.json({ error: 'Missing transaction id' }, { status: 400 });
    }

    let paymentRecord = await prisma.payment.findUnique({
      where: { merchantTransactionId }
    });

    let bookingId: bigint;

    // Webhook Recovery Flow (Race condition resiliency)
    if (!paymentRecord) {
      const pendingBooking = await prisma.booking.findFirst({
        where: {
          status: { in: ['PENDING_PROOF', 'PENDING_CONFIRMATION'] }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!pendingBooking) {
        return NextResponse.json({ error: 'Booking context not resolved' }, { status: 404 });
      }

      paymentRecord = await prisma.payment.create({
        data: {
          bookingId: pendingBooking.id,
          merchantTransactionId,
          amount: data.amount / 100,
          status: 'PENDING'
        }
      });
      bookingId = pendingBooking.id;
    } else {
      bookingId = paymentRecord.bookingId;
    }

    const client = getPhonePeClient();
    let verifiedSuccess = false;

    // 1. Verify signatures via SDK if callback credentials exist
    const authHeader = req.headers.get('Authorization') || '';
    const cbUser = process.env.PHONEPE_CALLBACK_USERNAME;
    const cbPass = process.env.PHONEPE_CALLBACK_PASSWORD;

    if (cbUser && cbPass && authHeader) {
      try {
        const cbVal = client.validateCallback(cbUser, cbPass, authHeader, rawBody);
        if (cbVal?.payload?.state === 'COMPLETED') {
          verifiedSuccess = true;
          phonePeTransactionId = cbVal.payload.orderId || phonePeTransactionId;
        }
      } catch (err) {
        console.error('Webhook signature validation failed:', err);
      }
    }

    // 2. Direct S2S status lookup check fallback
    if (!verifiedSuccess && code === 'PAYMENT_SUCCESS' && success) {
      try {
        const verifyResult = await client.getOrderStatus(merchantTransactionId);
        if (verifyResult?.state === 'COMPLETED') {
          verifiedSuccess = true;
          if (verifyResult.paymentDetails?.[0]) {
            phonePeTransactionId = verifyResult.paymentDetails[0].transactionId || phonePeTransactionId;
          }
        }
      } catch (err) {
        console.error('Webhook direct verification API check failed:', err);
      }
    }

    if (verifiedSuccess) {
      await prisma.$transaction(async (tx) => {
        const lockedBookings = await tx.$queryRaw<{ id: bigint; status: string }[]>`
          SELECT id, status FROM "Booking" WHERE id = ${bookingId} FOR UPDATE
        `;
        const currentBooking = lockedBookings[0];

        if (currentBooking && currentBooking.status !== 'CONFIRMED') {
          if (currentBooking.status === 'PARTIAL_PAID') {
            const b = await tx.booking.findUnique({
              where: { id: bookingId },
              select: { totalAmount: true }
            });
            await tx.booking.update({
              where: { id: bookingId },
              data: {
                status: 'CONFIRMED',
                paymentPercentage: 100,
                paidAmount: b?.totalAmount || 0,
                transactionId: phonePeTransactionId
              }
            });
          } else {
            const b = await tx.booking.findUnique({
              where: { id: bookingId },
              select: { paymentPercentage: true }
            });
            const paymentPercentage = b?.paymentPercentage ? Number(b.paymentPercentage) : 100;
            const targetStatus = paymentPercentage < 100 ? 'PARTIAL_PAID' : 'CONFIRMED';

            await tx.booking.update({
              where: { id: bookingId },
              data: {
                status: targetStatus,
                transactionId: phonePeTransactionId
              }
            });
          }

          await tx.payment.update({
            where: { merchantTransactionId },
            data: {
              status: 'COMPLETED',
              providerResponse: JSON.stringify(decoded)
            }
          });
        }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Verification failed' });
  } catch (error) {
    console.error('Webhook handling error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
