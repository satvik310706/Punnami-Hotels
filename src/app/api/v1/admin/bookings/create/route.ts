import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { jwtVerify } from 'jose';
import { assignSequentialId } from '@/lib/booking-sequence';
import { format, addDays } from 'date-fns';

function formatSlotTime(timeStr?: string | null, fallback: string = '12:00 PM') {
  if (!timeStr) return fallback;
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return fallback;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours.toString().padStart(2, '0')}:${displayMinutes} ${period}`;
  } catch {
    return fallback;
  }
}

function normalizeTime(t?: string | null) {
  if (!t) return '12:00:00';
  const parts = t.split(':');
  if (parts.length === 2) return `${parts[0]}:${parts[1]}:00`;
  if (parts.length === 3) return t;
  return '12:00:00';
}

// POST /api/v1/admin/bookings/create
export async function POST(req: NextRequest) {
  try {
    // 1. Verify admin session
    const adminToken = req.cookies.get('punnami_admin_token')?.value;
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    const { payload } = await jwtVerify(adminToken, secret);
    if (!payload || (payload as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 401 });
    }

    const body = await req.json();
    const {
      roomTypeId,
      checkInDate,
      checkOutDate,
      slotStart,
      slotEnd,
      adultCount = 1,
      childCount = 0,
      guestName,
      guestPhone,
      guestEmail = '',
      amountPaid,
      paymentMethod = 'CASH',
    } = body;

    if (!roomTypeId || !checkInDate || !checkOutDate || !guestName || !guestPhone) {
      return NextResponse.json({ error: 'Missing required booking fields.' }, { status: 400 });
    }

    const roomType = await prisma.roomType.findUnique({
      where: { id: BigInt(roomTypeId) },
    });

    if (!roomType) {
      return NextResponse.json({ error: 'Room type not found' }, { status: 404 });
    }

    const checkIn = new Date(checkInDate + 'T00:00:00');
    const checkOut = new Date(checkOutDate + 'T00:00:00');
    if (checkOut < checkIn) {
      return NextResponse.json({ error: 'Check-out date cannot be before check-in date' }, { status: 400 });
    }

    // Determine timing slot configs to compute required rooms count and pricing
    const targetSlotStart = normalizeTime(slotStart);
    const targetSlotEnd = normalizeTime(slotEnd);
    const isOvernight = targetSlotStart > targetSlotEnd;

    const customSlots = (roomType.bookingSlots || []) as any[];
    const slotConfig = customSlots.find(
      (s) => normalizeTime(s.slotStart || s.slot_start) === targetSlotStart && normalizeTime(s.slotEnd || s.slot_end) === targetSlotEnd
    );

    let limit = new Date(checkOut);
    if (checkIn.getTime() === checkOut.getTime()) {
      limit = addDays(checkIn, 1);
    }

    // Calculate nights
    const stayDates: Date[] = [];
    const current = new Date(checkIn);
    while (current < limit) {
      stayDates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    const totalNights = stayDates.length;

    // Calculate required rooms based on passenger occupancy
    const roomsCount = Math.max(1, Math.ceil(adultCount / (roomType.capacityPerRoom || 3)));

    // Calculate pricing (using base slot prices or room category prices)
    let subtotal = 0;
    for (const d of stayDates) {
      const isWeekendDay = d.getDay() === 0 || d.getDay() === 6;
      // Get base price for the slot or category
      const slotWeekdayPrice = slotConfig?.priceWeekday ?? slotConfig?.price_weekday ?? roomType.weekdayPrice;
      const slotWeekendPrice = slotConfig?.priceWeekend ?? slotConfig?.price_weekend ?? roomType.weekendPrice;
      const pricePerRoom = isWeekendDay ? Number(slotWeekendPrice) : Number(slotWeekdayPrice);
      subtotal += pricePerRoom * roomsCount;
    }

    const gst = Math.round(subtotal * 0.05);
    const gatewayFee = Math.round((subtotal + gst) * 0.01);
    const totalAmount = subtotal + gst + gatewayFee;

    const finalPaidAmount = (amountPaid === null || amountPaid === undefined) ? totalAmount : Math.min(Number(amountPaid), totalAmount);
    const paymentPercentage = Math.round((finalPaidAmount / totalAmount) * 100);
    const bookingStatus = finalPaidAmount >= totalAmount - 0.01 ? 'CONFIRMED' : 'PARTIAL_PAID';

    // Generate unique publicId
    const dateStr = format(new Date(), 'yyyyMMdd');
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const publicId = `HTL-${dateStr}-${randomHex}`;

    let createdBookingId: bigint;

    // Run transaction
    await prisma.$transaction(async (tx) => {
      // 1. Check and allocate inventory directly, auto-scaling capacity if needed
      for (const d of stayDates) {
        const inv = await tx.roomInventory.findUnique({
          where: {
            roomTypeId_date_slotStart_slotEnd: {
              roomTypeId: roomType.id,
              date: d,
              slotStart: targetSlotStart,
              slotEnd: targetSlotEnd,
            },
          },
        });

        const defaultSlotCapacity = Number(slotConfig?.totalRooms ?? slotConfig?.total_rooms ?? roomType.totalInventory);

        if (inv) {
          // Admin booking always adds capacity on top of existing capacity
          await tx.roomInventory.update({
            where: { id: inv.id },
            data: {
              totalRooms: { increment: roomsCount },
              bookedRooms: { increment: roomsCount },
            },
          });
        } else {
          // Create new inventory with default capacity + admin rooms
          await tx.roomInventory.create({
            data: {
              roomTypeId: roomType.id,
              date: d,
              slotStart: targetSlotStart,
              slotEnd: targetSlotEnd,
              totalRooms: defaultSlotCapacity + roomsCount,
              bookedRooms: roomsCount,
              reservedRooms: 0,
              isClosed: false,
            },
          });
        }
      }

      // 2. Create the Booking record
      const booking = await tx.booking.create({
        data: {
          publicId,
          roomTypeId: roomType.id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          slotStart: targetSlotStart,
          slotEnd: targetSlotEnd,
          totalNights,
          roomsBooked: roomsCount,
          guestName,
          guestPhone,
          guestEmail,
          adultCount,
          childCount,
          subtotalAmount: subtotal,
          discountAmount: 0,
          gstAmount: gst,
          gatewayFee,
          totalAmount,
          paidAmount: finalPaidAmount,
          paymentPercentage,
          status: bookingStatus as any,
          source: 'ADMIN',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Admin stays do not expire
        },
      });

      createdBookingId = booking.id;

      // 3. Create Payment record if initial payment recorded
      if (finalPaidAmount > 0) {
        const pgTxnId = `MANUAL_CREATE_${publicId.substring(4)}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        await tx.payment.create({
          data: {
            bookingId: booking.id,
            merchantTransactionId: pgTxnId,
            amount: finalPaidAmount,
            status: 'COMPLETED',
            providerResponse: JSON.stringify({
              paymentDetails: [{ transactionId: paymentMethod }],
              collectedBy: `Admin Direct Create: ${(payload as any).email}`,
              paymentMethod,
            }),
          },
        });
      }

      // 4. Assign sequenceId
      if (bookingStatus === 'CONFIRMED') {
        await assignSequentialId(tx, booking.id);
      }
    });

    return NextResponse.json({ success: true, message: 'Booking created successfully', publicId });
  } catch (err: any) {
    console.error('[Admin Direct Create Booking API] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create booking' }, { status: 500 });
  }
}
