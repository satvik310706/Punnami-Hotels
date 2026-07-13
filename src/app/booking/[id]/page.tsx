import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import PaymentPageClient from './PaymentPageClient';
import BookingVoucher from '@/components/BookingVoucher';

export const metadata: Metadata = {
  title: 'Complete Your Booking',
  description: 'Submit payment proof to confirm your room booking at Punnami Southern Residency.',
  robots: 'noindex',
};

async function getBooking(idStr: string) {
  try {
    const booking = await prisma.booking.findFirst({
      where: { 
        OR: [
          { publicId: idStr },
          { sequenceId: idStr }
        ]
      },
      include: { roomType: { include: { hotel: true } } },
    });
    return booking;
  } catch { return null; }
}

export default async function BookingPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBooking(id);

  if (!booking) {
    notFound();
  }

  const isVoucherStatus = ['CONFIRMED', 'PARTIAL_PAID', 'CANCEL_REQUESTED', 'CANCELLED', 'POSTPONE_REQUESTED', 'POSTPONED', 'REFUNDED'].includes(booking.status);
  if (isVoucherStatus) {
    return (
      <BookingVoucher
        booking={{
          publicId: booking.publicId,
          sequenceId: booking.sequenceId,
          checkInDate: booking.checkInDate.toISOString(),
          checkOutDate: booking.checkOutDate.toISOString(),
          totalNights: booking.totalNights,
          roomsBooked: booking.roomsBooked,
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          guestPhone: booking.guestPhone,
          adultCount: booking.adultCount,
          childCount: booking.childCount,
          status: booking.status,
          createdAt: booking.createdAt.toISOString(),
          subtotalAmount: Number(booking.subtotalAmount),
          discountAmount: Number(booking.discountAmount),
          gstAmount: Number(booking.gstAmount),
          gatewayFee: Number(booking.gatewayFee),
          totalAmount: Number(booking.totalAmount),
          transactionId: booking.transactionId,
          passengers: booking.passengers ? (booking.passengers as any) : undefined,
          cancellationReason: booking.cancellationReason || undefined,
          cancellationFee: booking.cancellationFee ? Number(booking.cancellationFee) : undefined,
          refundAmount: booking.refundAmount ? Number(booking.refundAmount) : undefined,
          postponeReason: booking.postponeReason || undefined,
          postponeNewDate: booking.postponeNewDate ? booking.postponeNewDate.toISOString() : undefined,
          originalCheckInDate: booking.originalCheckInDate ? booking.originalCheckInDate.toISOString() : null,
          originalCheckOutDate: booking.originalCheckOutDate ? booking.originalCheckOutDate.toISOString() : null,
          paidAmount: booking.paidAmount ? Number(booking.paidAmount) : undefined,
          paymentPercentage: booking.paymentPercentage ? Number(booking.paymentPercentage) : undefined,
          roomType: {
            name: booking.roomType.name,
            capacityPerRoom: booking.roomType.capacityPerRoom,
            maxAdults: booking.roomType.maxAdults,
            maxChildren: booking.roomType.maxChildren,
            hotel: {
              name: booking.roomType.hotel.name,
              address: booking.roomType.hotel.address,
              checkInTime: booking.roomType.hotel.checkInTime,
              checkOutTime: booking.roomType.hotel.checkOutTime,
            }
          }
        }}
      />
    );
  }

  if (!['PENDING_PROOF', 'PENDING_CONFIRMATION'].includes(booking.status)) {
    notFound();
  }

  return (
    <PaymentPageClient
      bookingId={booking.sequenceId || booking.publicId}
      initialData={{
        publicId: booking.publicId,
        sequenceId: booking.sequenceId,
        totalAmount: Number(booking.totalAmount),
        gstAmount: Number(booking.gstAmount),
        gatewayFee: Number(booking.gatewayFee),
        subtotal: Number(booking.subtotalAmount),
        expiresAt: booking.expiresAt.toISOString(),
        roomName: booking.roomType.name,
        hotelName: booking.roomType.hotel.name,
        checkInTime: booking.roomType.hotel.checkInTime || '12:00 PM',
        checkOutTime: booking.roomType.hotel.checkOutTime || '11:00 AM',
        paidAmount: booking.paidAmount ? Number(booking.paidAmount) : undefined,
        paymentPercentage: booking.paymentPercentage ? Number(booking.paymentPercentage) : undefined,
      }}
    />
  );
}
