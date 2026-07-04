import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getPhonePeClient } from '@/lib/phonepe';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get('bookingId');
  const originUrl = new URL(req.url).origin;
  const appUrl = originUrl.includes('localhost') ? originUrl : (process.env.NEXT_PUBLIC_SITE_URL || originUrl);

  if (!bookingId) {
    return NextResponse.redirect(`${appUrl}/rooms`, { status: 303 });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { publicId: bookingId },
      select: { id: true, publicId: true, status: true }
    });

    if (!booking) {
      return NextResponse.redirect(`${appUrl}/rooms?status=error&msg=NotFound`, { status: 303 });
    }

    if (booking.status === 'CONFIRMED') {
      return NextResponse.redirect(`${appUrl}/booking/${booking.publicId}?status=success`, { status: 303 });
    }

    const paymentRecord = await prisma.payment.findFirst({
      where: { bookingId: booking.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!paymentRecord) {
      return NextResponse.redirect(`${appUrl}/booking/${booking.publicId}?status=verifying`, { status: 303 });
    }

    const client = getPhonePeClient();
    const statusResult = await client.getOrderStatus(paymentRecord.merchantTransactionId);
    const pgState = statusResult?.state?.toUpperCase();

    if (pgState === 'COMPLETED') {
      const transactionId = statusResult.paymentDetails?.[0]?.transactionId || null;

      // Wrap in transactional row-lock update
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

      return NextResponse.redirect(`${appUrl}/booking/${booking.publicId}?status=success`, { status: 303 });
    } else if (pgState === 'FAILED' || pgState === 'CANCELLED') {
      // Keep booking.status as PENDING_PROOF so the user can retry checkout
      await prisma.payment.update({
        where: { merchantTransactionId: paymentRecord.merchantTransactionId },
        data: {
          status: 'FAILED',
          providerResponse: JSON.stringify(statusResult)
        }
      });

      return NextResponse.redirect(`${appUrl}/booking/${booking.publicId}?status=failed`, { status: 303 });
    }

    return NextResponse.redirect(`${appUrl}/booking/${booking.publicId}?status=verifying`, { status: 303 });
  } catch (error) {
    console.error('Redirection verification error:', error);
    return NextResponse.redirect(`${appUrl}/booking/${bookingId}?status=verifying`, { status: 303 });
  }
}
