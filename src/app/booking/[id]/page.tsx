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

async function getBooking(publicId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { publicId },
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

  if (booking.status === 'CONFIRMED') {
    const { aadharEncrypted, aadharHash, aadharImageUrl, ...publicBooking } = booking;
    return (
      <BookingVoucher
        booking={{
          ...publicBooking,
          checkInDate: booking.checkInDate.toISOString(),
          checkOutDate: booking.checkOutDate.toISOString(),
          createdAt: booking.createdAt.toISOString(),
          subtotalAmount: Number(booking.subtotalAmount),
          discountAmount: Number(booking.discountAmount),
          gstAmount: Number(booking.gstAmount),
          totalAmount: Number(booking.totalAmount),
          roomType: {
            ...booking.roomType,
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
      bookingId={id}
      initialData={{
        publicId: booking.publicId,
        totalAmount: Number(booking.totalAmount),
        gstAmount: Number(booking.gstAmount),
        subtotal: Number(booking.subtotalAmount),
        expiresAt: booking.expiresAt.toISOString(),
        roomName: booking.roomType.name,
        hotelName: booking.roomType.hotel.name,
        checkInTime: booking.roomType.hotel.checkInTime || '12:00 PM',
        checkOutTime: booking.roomType.hotel.checkOutTime || '11:00 AM',
      }}
    />
  );
}
