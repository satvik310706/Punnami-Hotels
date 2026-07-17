import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, bookingAmount, targetId, travelDate } = body;

    if (!code || bookingAmount === undefined || !targetId) {
      return NextResponse.json({ error: 'Missing validation parameters' }, { status: 400 });
    }

    const codeUpper = code.toUpperCase().trim();
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: codeUpper,
        deletedAt: null,
      },
    });

    if (!coupon) {
      return NextResponse.json({ valid: false, reason: 'Coupon code not found or invalid' });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ valid: false, reason: 'Coupon is currently inactive' });
    }

    const now = new Date();
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      return NextResponse.json({ valid: false, reason: 'Coupon is not yet active' });
    }

    if (coupon.validUntil) {
      const validUntilDate = new Date(coupon.validUntil);
      // If validUntil is set to midnight, extend to 23:59:59
      if (validUntilDate.getHours() === 0 && validUntilDate.getMinutes() === 0) {
        validUntilDate.setHours(23, 59, 59, 999);
      }
      if (validUntilDate < now) {
        return NextResponse.json({ valid: false, reason: 'Coupon has expired' });
      }
    }

    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, reason: 'Coupon usage limit reached' });
    }

    if (coupon.minBookingAmt !== null && Number(bookingAmount) < Number(coupon.minBookingAmt)) {
      return NextResponse.json({
        valid: false,
        reason: `Minimum booking subtotal of ₹${Number(coupon.minBookingAmt)} required`,
      });
    }

    // Weekday/Weekend check based on travelDate (check-in date)
    if (travelDate) {
      const travelDateObj = new Date(travelDate);
      const dayOfWeek = travelDateObj.getDay(); // 0 = Sunday, 6 = Saturday, 1-5 = Mon-Fri
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (coupon.isWeekendOnly && !isWeekend) {
        return NextResponse.json({ valid: false, reason: 'This coupon is only valid for weekend stays (Saturday & Sunday)' });
      }

      if (coupon.isWeekdayOnly && isWeekend) {
        return NextResponse.json({ valid: false, reason: 'This coupon is only valid for weekday stays (Monday to Friday)' });
      }
    }

    // Room applicability check
    if (coupon.applicableRoomIds) {
      const applicableIds = coupon.applicableRoomIds.split(',').map(id => id.trim());
      if (!applicableIds.includes('ALL') && !applicableIds.includes(String(targetId))) {
        return NextResponse.json({ valid: false, reason: 'Coupon is not applicable for this room variant' });
      }
    }

    // Calculate discount amount
    let discount = 0;
    const value = Number(coupon.discountValue);
    const subtotal = Number(bookingAmount);

    if (coupon.discountType === 'FLAT') {
      discount = Math.min(value, subtotal);
    } else if (coupon.discountType === 'PERCENTAGE') {
      discount = subtotal * (value / 100);
      if (coupon.maxDiscount !== null) {
        discount = Math.min(discount, Number(coupon.maxDiscount));
      }
    }

    return NextResponse.json({
      valid: true,
      discountAmount: Math.round(discount),
      discountedSubtotal: Math.max(0, Math.round(subtotal - discount)),
    });
  } catch (err) {
    console.error('[Coupon Validate API] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
