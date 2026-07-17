import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generatePublicId } from '@/lib/utils';
import { calculateStayTotal, calculateGST, calculateGatewayFee } from '@/lib/utils';
import { jwtVerify } from 'jose';
import { broadcastRoomInventoryUpdate } from '@/lib/sse';
import { cleanupExpiredBookings } from '@/lib/booking-cleanup';
import { getTodayISTUTC, isAfter6amIST } from '@/lib/ist';
import { assignSequentialId } from '@/lib/booking-sequence';

// Verhoeff Checksum Algorithm matrices for Aadhaar validation
const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];
const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

function isValidAadhaarBackend(num: string): boolean {
  if (!num || num.length !== 12 || !/^\d{12}$/.test(num)) return false;
  if (num[0] === '0' || num[0] === '1') return false;
  let c = 0;
  const digits = num.split('').map(Number).reverse();
  for (let i = 0; i < digits.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][digits[i]]];
  }
  return c === 0;
}

// POST /api/v1/bookings/checkout — Reserve room inventory and create pending stay booking (with agent discount integrations)
export async function POST(req: NextRequest) {
  try {
    // Run cleanup of expired pending bookings first to release locked inventory in real-time
    try {
      await cleanupExpiredBookings();
    } catch (cleanupErr) {
      console.error('[Checkout API] Expired bookings cleanup failed:', cleanupErr);
    }

    const body = await req.json();
    const {
      roomTypeId,
      checkInDate,
      checkOutDate,
      slotStart = '12:00:00',
      slotEnd = '11:00:00',
      rooms = 1,
      guestName,
      guestEmail,
      guestPhone,
      adultCount = 1,
      childCount = 0,
      couponCode,
      isAdmin = false,
      passengers = [],
      quickBooking = false,
      paymentPercentage = 100,
    } = body;

    if (!roomTypeId || !checkInDate || !checkOutDate || !guestName || !guestPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const normalizeTime = (timeStr: string) => {
      if (!timeStr) return '12:00:00';
      if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr;
      if (/^\d{2}:\d{2}$/.test(timeStr)) return `${timeStr}:00`;
      const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (match) {
        let hours = parseInt(match[1], 10);
        const minutes = match[2];
        const ampm = match[3].toUpperCase();
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
      }
      return timeStr;
    };

    const normalizedSlotStart = normalizeTime(slotStart);
    const normalizedSlotEnd = normalizeTime(slotEnd);

    if (!isAdmin && (typeof paymentPercentage !== 'number' || paymentPercentage < 50 || paymentPercentage > 100)) {
      return NextResponse.json({ error: 'Payment percentage must be either 50% or 100%' }, { status: 400 });
    }

    // Aadhaar and guest count validation for non-admin checkouts
    if (!isAdmin) {
      if (passengers.length === 0) {
        return NextResponse.json({ error: 'Passenger manifest details are required' }, { status: 400 });
      }

      for (let i = 0; i < passengers.length; i++) {
        const p = passengers[i];
        const isChild = i >= adultCount;

        if (!p.fullName || p.fullName.trim() === '') {
          return NextResponse.json({ error: `Passenger name for card ${i + 1} is required` }, { status: 400 });
        }

        // Validate age limits
        if (typeof p.age !== 'number' || (isChild ? (p.age > 10 || p.age < 0) : p.age < 11)) {
          return NextResponse.json({ error: `Invalid age for passenger ${p.fullName}. Children must be 0-10, adults 11+.` }, { status: 400 });
        }

        // Skip other placeholders in Quick Booking mode
        if (quickBooking && i > 0) {
          continue;
        }

        // Aadhaar validation
        if (!isChild) {
          if (!p.aadhaar || !isValidAadhaarBackend(p.aadhaar)) {
            return NextResponse.json({ error: `Invalid Aadhaar number for guest: ${p.fullName}` }, { status: 400 });
          }
        } else if (p.aadhaar && p.aadhaar.trim().length > 0) {
          if (!isValidAadhaarBackend(p.aadhaar)) {
            return NextResponse.json({ error: `Invalid Aadhaar number for guest: ${p.fullName}` }, { status: 400 });
          }
        }
      }
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkOut < checkIn) {
      return NextResponse.json({ error: 'Check-out cannot be before check-in' }, { status: 400 });
    }

    // Reject today's check-in if it's already past 6:00 AM IST (non-admin only)
    if (!isAdmin) {
      const todayIST = getTodayISTUTC();
      const checkInUTC = new Date(Date.UTC(checkIn.getUTCFullYear(), checkIn.getUTCMonth(), checkIn.getUTCDate()));

      if (checkInUTC.getTime() === todayIST.getTime() && isAfter6amIST()) {
        return NextResponse.json(
          { error: 'Check-in for today is closed after 6:00 AM IST. Please select tomorrow or a future date.' },
          { status: 400 }
        );
      }
    }

    // Check if logged in as agent via cookies
    let agentId: bigint | null = null;
    const agentToken = req.cookies.get('punnami_agent_token')?.value;
    if (agentToken) {
      try {
        const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
        const { payload } = await jwtVerify(agentToken, secret);
        if (payload && (payload as any).role === 'AGENT') {
          const dbAgent = await prisma.user.findUnique({
            where: { id: BigInt((payload as any).sub) },
          });
          if (dbAgent && dbAgent.accountStatus === 'ACTIVE') {
            agentId = dbAgent.id;
          }
        }
      } catch (err) {
        console.warn('Agent check failed during checkout:', err);
      }
    }

    // Fetch room type
    const roomType = await prisma.roomType.findUnique({
      where: { id: BigInt(roomTypeId), status: 'PUBLISHED', isActive: true },
      include: { hotel: true },
    });

    if (!roomType) {
      return NextResponse.json({ error: 'Room variant not found or unavailable' }, { status: 404 });
    }

    if (!isAdmin && rooms > roomType.totalInventory) {
      return NextResponse.json({ error: 'Requested rooms exceed available inventory' }, { status: 400 });
    }

    const slotConfig = (roomType.bookingSlots as any[])?.find((s: any) => {
      const sS = s.slotStart || s.slot_start;
      const sE = s.slotEnd || s.slot_end;
      return sS && sE && sS.slice(0, 5) === normalizedSlotStart.slice(0, 5) && sE.slice(0, 5) === normalizedSlotEnd.slice(0, 5);
    });

    const isOvernight = normalizedSlotStart > normalizedSlotEnd || 
      (slotConfig?.title || '').toLowerCase().includes('overnight') || 
      (slotConfig?.title || '').toLowerCase().includes('night') || 
      (slotConfig?.title || '').toLowerCase().includes('24');

    // Check inventory availability date by date
    const dateRange: Date[] = [];
    const current = new Date(checkIn);
    
    let limit = new Date(checkOut);
    if (!isOvernight) {
      limit = new Date(limit.getTime() + 24 * 60 * 60 * 1000); // add 1 day (inclusive for day stays)
    } else {
      if (checkIn.getTime() === checkOut.getTime()) {
        limit = new Date(limit.getTime() + 24 * 60 * 60 * 1000); // fallback protection
      }
    }

    const checkOutTime = limit.getTime();
    while (current.getTime() < checkOutTime) {
      dateRange.push(new Date(current));
      current.setUTCDate(current.getUTCDate() + 1);
    }

    const booking = await prisma.$transaction(async (tx) => {

      let subtotal = 0;

      // ──────────────────────────────────────────────────────────────────────
      // CONCURRENCY-SAFE: For each date, we:
      //   1. Upsert to ensure the inventory row exists (handles new/unopened dates)
      //   2. SELECT FOR UPDATE to exclusively lock the row
      //   3. Read FRESH values from the locked row and check capacity
      //   4. If OK, increment bookedRooms / reservedRooms atomically
      // This guarantees that 330 simultaneous requests are serialised and only
      // the first N (where N = remaining capacity) succeed.
      // ──────────────────────────────────────────────────────────────────────
      for (const date of dateRange) {
        const slotConfig = (roomType.bookingSlots as any[])?.find((s: any) => {
          const sS = s.slotStart || s.slot_start;
          const sE = s.slotEnd || s.slot_end;
          return sS && sE && sS.slice(0, 5) === normalizedSlotStart.slice(0, 5) && sE.slice(0, 5) === normalizedSlotEnd.slice(0, 5);
        });
        const defaultSlotCapacity =
          slotConfig?.totalRooms ?? slotConfig?.total_rooms ?? roomType.totalInventory;

        // Step 1 — Ensure row exists (handles non-opened inventory dates gracefully)
        await tx.roomInventory.upsert({
          where: {
            roomTypeId_date_slotStart_slotEnd: {
              roomTypeId: BigInt(roomTypeId),
              date,
              slotStart: normalizedSlotStart,
              slotEnd: normalizedSlotEnd,
            },
          },
          update: {}, // no-op — just guarantee the row is present
          create: {
            roomTypeId: BigInt(roomTypeId),
            date,
            slotStart: normalizedSlotStart,
            slotEnd: normalizedSlotEnd,
            totalRooms: 0,
            bookedRooms: 0,
            reservedRooms: 0,
            isClosed: true,
          },
        });

        // Step 2 — Acquire an exclusive row-level lock (SELECT FOR UPDATE) for the specific slot
        const dateStr = date.toISOString().split('T')[0];
        const lockedRows = await tx.$queryRaw<{
          id: bigint;
          totalRooms: number;
          bookedRooms: number;
          reservedRooms: number;
          isClosed: boolean;
          priceOverride: string | null;
        }[]>`
          SELECT id, "totalRooms", "bookedRooms", "reservedRooms", "isClosed", "priceOverride"
          FROM "RoomInventory"
          WHERE "roomTypeId" = ${BigInt(roomTypeId)}
            AND date = ${dateStr}::date
            AND "slotStart" = ${normalizedSlotStart}
            AND "slotEnd" = ${normalizedSlotEnd}
          FOR UPDATE
        `;

        const inv = lockedRows[0];
        if (!inv) throw new Error(`Inventory record missing for ${date.toISOString().slice(0, 10)}`);

        // Step 3 — Check availability with fresh locked data
        const available = inv.totalRooms - inv.bookedRooms - inv.reservedRooms;
        if (!isAdmin) {
          if (inv.isClosed) {
            throw new Error(`Room is closed on ${date.toISOString().slice(0, 10)}`);
          }
          if (available < rooms) {
            throw new Error(`Only ${available} room(s) available on ${date.toISOString().slice(0, 10)}`);
          }
        }

        // Step 4 — Atomically increment counts for the specific slot
        await tx.roomInventory.update({
          where: { id: inv.id },
          data: isAdmin
            ? { 
                bookedRooms: { increment: rooms },
                totalRooms: { increment: rooms } // Overbooking creates virtual capacity
              }
            : { reservedRooms: { increment: rooms } },
        });

        // Pricing calculation
        const isWeekendDay = date.getUTCDay() === 0 || date.getUTCDay() === 6;
        const slotWeekdayPrice = slotConfig?.priceWeekday ?? slotConfig?.price_weekday ?? roomType.weekdayPrice;
        const slotWeekendPrice = slotConfig?.priceWeekend ?? slotConfig?.price_weekend ?? roomType.weekendPrice;
        const basePrice = isWeekendDay ? Number(slotWeekendPrice) : Number(slotWeekdayPrice);
        const dayPrice = inv.priceOverride !== null && inv.priceOverride !== undefined
          ? Number(inv.priceOverride)
          : basePrice;

        subtotal += dayPrice * rooms;
      }

      const nights = Math.max(1, dateRange.length);

      let discountAmount = 0;
      let commissionVal = 0;

      // Validate and apply coupon if provided
      if (couponCode) {
        const codeUpper = couponCode.toUpperCase().trim();
        const coupon = await tx.coupon.findFirst({
          where: {
            code: codeUpper,
            deletedAt: null,
            isActive: true,
          },
        });

        if (coupon) {
          // Perform basic checks
          const now = new Date();
          let isCouponValid = true;
          if (coupon.validFrom && new Date(coupon.validFrom) > now) isCouponValid = false;
          if (coupon.validUntil) {
            const validUntilDate = new Date(coupon.validUntil);
            if (validUntilDate.getHours() === 0 && validUntilDate.getMinutes() === 0) {
              validUntilDate.setHours(23, 59, 59, 999);
            }
            if (validUntilDate < now) isCouponValid = false;
          }
          if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) isCouponValid = false;
          if (coupon.minBookingAmt !== null && subtotal < Number(coupon.minBookingAmt)) isCouponValid = false;

          // Weekend/weekday check
          if (isCouponValid) {
            const dayOfWeek = checkIn.getDay(); // 0 = Sun, 6 = Sat, 1-5 = Mon-Fri
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            if (coupon.isWeekendOnly && !isWeekend) isCouponValid = false;
            if (coupon.isWeekdayOnly && isWeekend) isCouponValid = false;
          }

          // Room applicability check
          if (isCouponValid && coupon.applicableRoomIds) {
            const applicableIds = coupon.applicableRoomIds.split(',').map(id => id.trim());
            if (!applicableIds.includes('ALL') && !applicableIds.includes(String(roomTypeId))) {
              isCouponValid = false;
            }
          }

          if (isCouponValid) {
            const val = Number(coupon.discountValue);
            if (coupon.discountType === 'FLAT') {
              discountAmount = Math.min(val, subtotal);
            } else if (coupon.discountType === 'PERCENTAGE') {
              let pctDiscount = subtotal * (val / 100);
              if (coupon.maxDiscount !== null) {
                pctDiscount = Math.min(pctDiscount, Number(coupon.maxDiscount));
              }
              discountAmount = pctDiscount;
            }
            discountAmount = Math.round(discountAmount);

            // Increment usage count of the coupon
            await tx.coupon.update({
              where: { id: coupon.id },
              data: { usageCount: { increment: 1 } },
            });
          } else {
            throw new Error('Provided coupon code criteria not met or coupon invalid');
          }
        } else {
          throw new Error('Provided coupon code is not found or invalid');
        }
      }

      // Calculate agent commission if booked by active agent
      if (agentId) {
        const dbAgent = await tx.user.findUnique({ where: { id: agentId } });
        if (dbAgent) {
          const pct = Number(dbAgent.commissionPercentage);
          const fixed = Number(dbAgent.commissionFixedAmount);
          if (dbAgent.commissionType === 'FIXED') {
            commissionVal = fixed;
          } else {
            commissionVal = Math.round((subtotal * pct) / 100);
          }
        }
      }

      const taxableAmount = subtotal - discountAmount;
      const gstAmount = calculateGST(taxableAmount);
      const gatewayFee = calculateGatewayFee(taxableAmount, gstAmount);
      const totalAmount = Math.max(0, taxableAmount + gstAmount + gatewayFee - commissionVal);

      const expiresAt = isAdmin 
        ? new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours for admin
        : new Date(Date.now() + 5 * 60 * 1000);     // 5 minutes for public online checkout
      const publicId = generatePublicId();

      // Guest info is stored on the booking record itself — no user account created

      const adminTxnId = isAdmin 
        ? `ADMIN-${publicId}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
        : null;

      const newBooking = await tx.booking.create({
        data: {
          publicId,
          roomTypeId: BigInt(roomTypeId),
          checkInDate: checkIn,
          checkOutDate: checkOut,
          slotStart: normalizedSlotStart,
          slotEnd: normalizedSlotEnd,
          totalNights: nights,
          roomsBooked: rooms,
          guestName,
          guestEmail: guestEmail || '',
          guestPhone,
          adultCount,
          childCount,
          subtotalAmount: subtotal,
          couponCode: couponCode || null,
          discountAmount,
          gstAmount,
          gatewayFee,
          totalAmount,
          paidAmount: isAdmin ? totalAmount : (Number(totalAmount) * (paymentPercentage / 100)),
          paymentPercentage: isAdmin ? 100 : paymentPercentage,
          agentId,
          agentCommission: commissionVal,
          status: isAdmin ? 'CONFIRMED' : 'PENDING_PROOF',
          source: isAdmin ? 'ADMIN' : 'PUBLIC',
          transactionId: adminTxnId,
          expiresAt,
          aadharEncrypted: passengers[0]?.aadhaar || null,
          passengers: passengers as any,
        },
        include: {
          roomType: {
            include: { hotel: true },
          },
        },
      });

      if (isAdmin && adminTxnId) {
        await tx.payment.create({
          data: {
            bookingId: newBooking.id,
            merchantTransactionId: adminTxnId,
            amount: Number(newBooking.totalAmount),
            status: 'COMPLETED',
            providerResponse: JSON.stringify({ note: 'Admin Direct Booking' })
          }
        });
      }
      
      if (isAdmin) {
        await assignSequentialId(tx, newBooking.id);
      }

      const freshBooking = await tx.booking.findUnique({ where: { id: newBooking.id } });
      return freshBooking || newBooking;
    }, {
      timeout: 30000,
    });

    // Broadcast availability update to SSE clients
    for (const date of dateRange) {
      broadcastRoomInventoryUpdate(BigInt(roomTypeId), date, normalizedSlotStart, normalizedSlotEnd);
    }

    return NextResponse.json({
      bookingId: booking.id.toString(),
      publicId: booking.sequenceId || booking.publicId,
      originalPublicId: booking.publicId,
      totalAmount: Number(booking.totalAmount),
      paidAmount: Number(booking.paidAmount ?? booking.totalAmount),
      paymentPercentage: Number(booking.paymentPercentage ?? 100),
      gstAmount: Number(booking.gstAmount),
      subtotal: Number(booking.subtotalAmount),
      agentCommission: Number(booking.agentCommission),
      expiresAt: booking.expiresAt,
      roomName: roomType.name,
      hotelName: roomType.hotel.name,
      checkInTime: roomType.hotel.checkInTime,
      checkOutTime: roomType.hotel.checkOutTime,
    });
  } catch (err: any) {
    console.error('[Checkout API] Error:', err);
    if (err.message?.includes('closed') || err.message?.includes('available')) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: 'Checkout reservation failed' }, { status: 500 });
  }
}
