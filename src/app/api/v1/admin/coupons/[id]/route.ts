import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { jwtVerify } from 'jose';

interface RouteContext {
  params: Promise<{ id: string }>;
}

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

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const isAdmin = await checkAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 401 });
    }

    const { id } = await context.params;
    const coupon = await prisma.coupon.findFirst({
      where: {
        id: BigInt(id),
        deletedAt: null,
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...coupon,
      id: coupon.id.toString(),
      discountValue: Number(coupon.discountValue),
      maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
      minBookingAmt: coupon.minBookingAmt ? Number(coupon.minBookingAmt) : null,
    });
  } catch (err) {
    console.error('[Admin Coupons GET Single] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const isAdmin = await checkAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 401 });
    }

    const { id } = await context.params;
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

    const coupon = await prisma.coupon.findFirst({
      where: {
        id: BigInt(id),
        deletedAt: null,
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    let codeUpper = coupon.code;
    if (code) {
      codeUpper = code.toUpperCase().trim();
      if (codeUpper !== coupon.code) {
        const duplicate = await prisma.coupon.findFirst({
          where: {
            code: codeUpper,
            deletedAt: null,
          },
        });
        if (duplicate) {
          return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
        }
      }
    }

    const updated = await prisma.coupon.update({
      where: { id: coupon.id },
      data: {
        code: codeUpper,
        discountType: discountType !== undefined ? discountType : coupon.discountType,
        discountValue: discountValue !== undefined ? Number(discountValue) : coupon.discountValue,
        maxDiscount: maxDiscount !== undefined ? (maxDiscount ? Number(maxDiscount) : null) : coupon.maxDiscount,
        minBookingAmt: minBookingAmt !== undefined ? (minBookingAmt ? Number(minBookingAmt) : null) : coupon.minBookingAmt,
        usageLimit: usageLimit !== undefined ? (usageLimit ? parseInt(usageLimit) : null) : coupon.usageLimit,
        validFrom: validFrom !== undefined ? (validFrom ? new Date(validFrom) : null) : coupon.validFrom,
        validUntil: validUntil !== undefined ? (validUntil ? new Date(validUntil) : null) : coupon.validUntil,
        isActive: isActive !== undefined ? isActive : coupon.isActive,
        isWeekendOnly: isWeekendOnly !== undefined ? !!isWeekendOnly : coupon.isWeekendOnly,
        isWeekdayOnly: isWeekdayOnly !== undefined ? !!isWeekdayOnly : coupon.isWeekdayOnly,
        applicableRoomIds: applicableRoomIds !== undefined ? applicableRoomIds : coupon.applicableRoomIds,
      },
    });

    return NextResponse.json({
      ...updated,
      id: updated.id.toString(),
      discountValue: Number(updated.discountValue),
      maxDiscount: updated.maxDiscount ? Number(updated.maxDiscount) : null,
      minBookingAmt: updated.minBookingAmt ? Number(updated.minBookingAmt) : null,
    });
  } catch (err) {
    console.error('[Admin Coupons PUT] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const isAdmin = await checkAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 401 });
    }

    const { id } = await context.params;
    const coupon = await prisma.coupon.findFirst({
      where: {
        id: BigInt(id),
        deletedAt: null,
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    await prisma.coupon.update({
      where: { id: coupon.id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('[Admin Coupons DELETE] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
