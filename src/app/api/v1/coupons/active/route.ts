import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetIdStr = searchParams.get('target_id');

    const now = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
    });

    const activeCoupons = coupons.filter((c) => {
      // Date range checks
      if (c.validFrom && new Date(c.validFrom) > now) return false;
      if (c.validUntil) {
        const validUntilDate = new Date(c.validUntil);
        if (validUntilDate.getHours() === 0 && validUntilDate.getMinutes() === 0) {
          validUntilDate.setHours(23, 59, 59, 999);
        }
        if (validUntilDate < now) return false;
      }

      // Check usage limits
      if (c.usageLimit !== null && c.usageCount >= c.usageLimit) return false;

      // Room variant target checks
      if (targetIdStr && c.applicableRoomIds) {
        const applicableRoomIds = c.applicableRoomIds.split(',').map((id) => id.trim());
        if (!applicableRoomIds.includes('ALL') && !applicableRoomIds.includes(targetIdStr)) {
          return false;
        }
      }

      return true;
    });

    return NextResponse.json(
      activeCoupons.map((c) => ({
        code: c.code,
        discountType: c.discountType,
        discountValue: Number(c.discountValue),
        minBookingAmt: c.minBookingAmt ? Number(c.minBookingAmt) : null,
        maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
        isWeekendOnly: c.isWeekendOnly,
        isWeekdayOnly: c.isWeekdayOnly,
        applicableRoomIds: c.applicableRoomIds,
      }))
    );
  } catch (err) {
    console.error('[Coupon Active API] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
