import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generatePublicId } from '@/lib/utils';
import { calculateStayTotal, calculateGST } from '@/lib/utils';
import { jwtVerify } from 'jose';
import { broadcastRoomInventoryUpdate } from '@/lib/sse';
import { cleanupExpiredBookings } from '@/lib/booking-cleanup';

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
    } = body;

    if (!roomTypeId || !checkInDate || !checkOutDate || !guestName || !guestPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
    });

    if (!roomType) {
      return NextResponse.json({ error: 'Room variant not found or unavailable' }, { status: 404 });
    }

    if (!isAdmin && rooms > roomType.totalInventory) {
      return NextResponse.json({ error: 'Requested rooms exceed available inventory' }, { status: 400 });
    }

    // Check inventory availability date by date
    const dateRange: Date[] = [];
    const current = new Date(checkIn);
    const checkOutTime = checkOut.getTime();
    if (checkIn.getTime() === checkOutTime) {
      dateRange.push(new Date(checkIn));
    } else {
      while (current.getTime() < checkOutTime) {
        dateRange.push(new Date(current));
        current.setUTCDate(current.getUTCDate() + 1);
      }
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
          return sS && sE && sS.slice(0, 5) === slotStart.slice(0, 5) && sE.slice(0, 5) === slotEnd.slice(0, 5);
        });
        const defaultSlotCapacity =
          slotConfig?.totalRooms ?? slotConfig?.total_rooms ?? roomType.totalInventory;

        // Step 1 — Ensure row exists (handles non-opened inventory dates gracefully)
        await tx.roomInventory.upsert({
          where: {
            roomTypeId_date_slotStart_slotEnd: {
              roomTypeId: BigInt(roomTypeId),
              date,
              slotStart,
              slotEnd,
            },
          },
          update: {}, // no-op — just guarantee the row is present
          create: {
            roomTypeId: BigInt(roomTypeId),
            date,
            slotStart,
            slotEnd,
            totalRooms: defaultSlotCapacity,
            bookedRooms: 0,
            reservedRooms: 0,
          },
        });

        // Step 2 — Acquire an exclusive row-level lock (SELECT FOR UPDATE)
        // Any other concurrent transaction trying to lock the same row will
        // block here until we commit — preventing all race conditions.
        // Format date parameter timezone-neutrally as string YYYY-MM-DD to avoid database-level timezone offset shifts.
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
            AND "slotStart" = ${slotStart}
            AND "slotEnd" = ${slotEnd}
          FOR UPDATE
        `;

        const inv = lockedRows[0];
        if (!inv) throw new Error(`Inventory record missing for ${date.toISOString().slice(0, 10)}`);

        // Step 3 — Check availability with fresh locked data
        if (!isAdmin && inv.isClosed) {
          throw new Error(`Room is closed on ${date.toISOString().slice(0, 10)}`);
        }
        const available = inv.totalRooms - inv.bookedRooms - inv.reservedRooms;
        if (!isAdmin && available < rooms) {
          throw new Error(`Only ${available} room(s) available on ${date.toISOString().slice(0, 10)}`);
        }

        // Step 4 — Atomically increment counts
        await tx.roomInventory.update({
          where: { id: inv.id },
          data: isAdmin
            ? { bookedRooms: { increment: rooms } }
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
      const totalAmount = Math.max(0, taxableAmount + gstAmount - commissionVal);

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours TTL
      const publicId = generatePublicId();

      // Upsert User profile details
      const normalizedPhone = guestPhone.replace(/\D/g, '').slice(-10);
      if (normalizedPhone.length === 10) {
        await tx.user.upsert({
          where: { phone: normalizedPhone },
          update: {
            fullName: guestName,
            email: guestEmail || undefined,
          },
          create: {
            phone: normalizedPhone,
            fullName: guestName,
            email: guestEmail || undefined,
            role: 'USER',
            accountStatus: 'ACTIVE',
          },
        });
      }

      const newBooking = await tx.booking.create({
        data: {
          publicId,
          roomTypeId: BigInt(roomTypeId),
          checkInDate: checkIn,
          checkOutDate: checkOut,
          slotStart,
          slotEnd,
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
          gatewayFee: 0,
          totalAmount,
          agentId,
          agentCommission: commissionVal,
          status: isAdmin ? 'CONFIRMED' : 'PENDING_PROOF',
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

      return newBooking;
    }, {
      timeout: 30000,
    });

    // Broadcast availability update to SSE clients
    for (const date of dateRange) {
      broadcastRoomInventoryUpdate(BigInt(roomTypeId), date, slotStart, slotEnd);
    }

    return NextResponse.json({
      bookingId: booking.id.toString(),
      publicId: booking.publicId,
      totalAmount: Number(booking.totalAmount),
      gstAmount: Number(booking.gstAmount),
      subtotal: Number(booking.subtotalAmount),
      agentCommission: Number(booking.agentCommission),
      expiresAt: booking.expiresAt,
      roomName: booking.roomType.name,
      hotelName: booking.roomType.hotel.name,
      checkInTime: booking.roomType.hotel.checkInTime,
      checkOutTime: booking.roomType.hotel.checkOutTime,
    });
  } catch (err: any) {
    console.error('[Checkout API] Error:', err);
    if (err.message?.includes('closed') || err.message?.includes('available')) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: 'Checkout reservation failed' }, { status: 500 });
  }
}
