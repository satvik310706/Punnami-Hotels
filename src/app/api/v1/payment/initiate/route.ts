import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getPhonePeClient, StandardCheckoutPayRequest, PrefillUserLoginDetails } from '@/lib/phonepe';

export async function POST(req: NextRequest) {
  try {
    const { bookingId } = await req.json();
    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { publicId: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status === 'CONFIRMED') {
      return NextResponse.json({ error: 'Booking is already confirmed' }, { status: 400 });
    }

    let paymentAmount = Number(booking.totalAmount);
    if (booking.status === 'PARTIAL_PAID') {
      const paid = booking.paidAmount ? Number(booking.paidAmount) : 0;
      paymentAmount = Number(booking.totalAmount) - paid;
    } else {
      paymentAmount = booking.paidAmount ? Number(booking.paidAmount) : Number(booking.totalAmount);
    }
    const amountInPaise = Math.round(paymentAmount * 100);
    const merchantTransactionId = `TXN-PUN-${booking.publicId}-${Date.now()}`;
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.punnamihotels.com').replace(/\/+$/, '');
    const redirectUrl = `${siteUrl}/api/v1/payment/callback?bookingId=${booking.publicId}`;

    const client = getPhonePeClient();
    const userPhone = booking.guestPhone?.replace(/[^0-9]/g, '').slice(-10);
    const isValidPhone = userPhone && /^[6-9]\d{9}$/.test(userPhone);

    const builder = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantTransactionId)
      .amount(amountInPaise)
      .redirectUrl(redirectUrl)
      .expireAfter(900); // 15 minutes timeout


    if (isValidPhone) {
      const prefillDetails = PrefillUserLoginDetails.builder().phoneNumber(userPhone).build();
      builder.prefillUserLoginDetails(prefillDetails);
    }

    const payRequest = builder.build();


    const result = await client.pay(payRequest);

    if (result && result.redirectUrl) {
      // CRITICAL: Await DB write to prevent race conditions with webhook triggers
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          merchantTransactionId,
          amount: paymentAmount,
          status: 'PENDING',
        }
      });

      return NextResponse.json({ url: result.redirectUrl });
    }
    
    return NextResponse.json({ error: 'Failed to initiate checkout with gateway' }, { status: 502 });
  } catch (error: any) {
    console.error('Payment initiation error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
