import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { jwtVerify } from 'jose';

async function checkAdmin(req: NextRequest) {
  const adminToken = req.cookies.get('punnami_admin_token')?.value;
  if (!adminToken) return false;
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    const { payload } = await jwtVerify(adminToken, secret);
    return payload && (payload as any).role === 'ADMIN';
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const coupons = await prisma.coupon.findMany({
      where: {
        deletedAt: null,
        ...(search && {
          code: {
            contains: search,
            mode: 'insensitive',
          },
        }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const serializedCoupons = coupons.map((c) => ({
      ...c,
      id: c.id.toString(),
      discountValue: Number(c.discountValue),
      maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
      minBookingAmt: c.minBookingAmt ? Number(c.minBookingAmt) : null,
    }));

    return NextResponse.json(serializedCoupons);
  } catch (err) {
    console.error('[Admin Coupons GET] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 401 });
    }

    const body = await req.json();
    const {
      code,
      discountType,
      discountValue,
      maxDiscount,
      minBookingAmt,
      usageLimit,
      validFrom,
      validUntil,
      isActive,
      isWeekendOnly,
      isWeekdayOnly,
      applicableRoomIds,
    } = body;

    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json({ error: 'Missing required coupon fields' }, { status: 400 });
    }

    const codeUpper = code.toUpperCase().trim();

    const existing = await prisma.coupon.findFirst({
      where: {
        code: codeUpper,
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: codeUpper,
        discountType,
        discountValue: Number(discountValue),
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        minBookingAmt: minBookingAmt ? Number(minBookingAmt) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive: isActive !== undefined ? isActive : true,
        isWeekendOnly: !!isWeekendOnly,
        isWeekdayOnly: !!isWeekdayOnly,
        applicableRoomIds: applicableRoomIds || null,
      },
    });

    return NextResponse.json({
      ...coupon,
      id: coupon.id.toString(),
      discountValue: Number(coupon.discountValue),
      maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
      minBookingAmt: coupon.minBookingAmt ? Number(coupon.minBookingAmt) : null,
    }, { status: 201 });
  } catch (err) {
    console.error('[Admin Coupons POST] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
