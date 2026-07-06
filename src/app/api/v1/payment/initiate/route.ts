import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getPhonePeClient } from '@/lib/phonepe';
import { StandardCheckoutPayRequest, PrefillUserLoginDetails } from '@phonepe-pg/pg-sdk-node';

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
    const originUrl = req.headers.get('origin') || new URL(req.url).origin;
    const appUrl = originUrl.includes('localhost') ? originUrl : (process.env.NEXT_PUBLIC_SITE_URL || originUrl);

    const client = getPhonePeClient();
    const userPhone = booking.guestPhone?.replace(/[^0-9]/g, '').slice(-10) || '9999999999';

    const prefillDetails = PrefillUserLoginDetails.builder().phoneNumber(userPhone).build();
    const payRequest = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantTransactionId)
      .amount(amountInPaise)
      .redirectUrl(`${appUrl}/api/v1/payment/callback?bookingId=${booking.publicId}`)
      .prefillUserLoginDetails(prefillDetails)
      .expireAfter(900) // 15 minutes timeout (inactivity lock protection)
      .build();

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
