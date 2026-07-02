import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { uploadImage } from '@/lib/cloudinary';
import { sendAdminPaymentProofEmail } from '@/lib/zohoMail';
import { formatDate } from '@/lib/utils';
import { broadcastRoomInventoryUpdate } from '@/lib/sse';

// POST /api/v1/bookings/[id]/submit-proof — User uploads payment screenshot or transaction ID
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const formData = await req.formData();

    const transactionId = formData.get('transactionId') as string | null;
    const proofFile = formData.get('proofImage') as File | null;

    if (!transactionId && !proofFile) {
      return NextResponse.json({ error: 'Please provide a transaction ID or screenshot' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { publicId: id },
      include: { roomType: { include: { hotel: true } } },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status !== 'PENDING_PROOF') {
      return NextResponse.json({ error: 'Booking is no longer accepting payment proof' }, { status: 409 });
    }

    let proofImageUrl: string | null = null;

    // Upload proof image to Cloudinary
    if (proofFile) {
      const arrayBuffer = await proofFile.arrayBuffer();
      const base64 = `data:${proofFile.type};base64,${Buffer.from(arrayBuffer).toString('base64')}`;
      const { url } = await uploadImage(base64, 'payment-proofs', `proof-${id}`);
      proofImageUrl = url;
    }

    // Update booking status to PENDING_CONFIRMATION
    const updatedBooking = await prisma.booking.update({
      where: { publicId: id },
      data: {
        status: 'PENDING_CONFIRMATION',
        transactionId: transactionId || null,
        paymentProofUrl: proofImageUrl,
      },
    });

    // Notify admin via email
    await sendAdminPaymentProofEmail({
      publicId: booking.publicId,
      guestName: booking.guestName,
      guestPhone: booking.guestPhone,
      roomName: booking.roomType.name,
      checkInDate: formatDate(booking.checkInDate),
      checkOutDate: formatDate(booking.checkOutDate),
      totalAmount: Number(booking.totalAmount).toFixed(0),
      transactionId: transactionId || undefined,
      proofImageUrl: proofImageUrl || undefined,
    });

    return NextResponse.json({
      message: 'Payment proof submitted successfully. We will confirm your booking shortly.',
      status: updatedBooking.status,
    });
  } catch (err) {
    console.error('[Submit Proof API] Error:', err);
    return NextResponse.json({ error: 'Failed to submit payment proof' }, { status: 500 });
  }
}

async function releaseInventory(booking: any) {
  const dateRange: Date[] = [];
  const current = new Date(booking.checkInDate);
  const checkOutTime = new Date(booking.checkOutDate).getTime();
  if (booking.checkInDate.getTime() === checkOutTime) {
    dateRange.push(new Date(booking.checkInDate));
  } else {
    while (current.getTime() < checkOutTime) {
      dateRange.push(new Date(current));
      current.setUTCDate(current.getUTCDate() + 1);
    }
  }

  for (const date of dateRange) {
    await prisma.roomInventory.updateMany({
      where: {
        roomTypeId: booking.roomTypeId,
        date,
        slotStart: booking.slotStart,
        slotEnd: booking.slotEnd,
      },
      data: { reservedRooms: { decrement: booking.roomsBooked } },
    });
  }

  // Broadcast updates
  for (const date of dateRange) {
    broadcastRoomInventoryUpdate(booking.roomTypeId, date, booking.slotStart, booking.slotEnd);
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: 'EXPIRED' },
  });
}
