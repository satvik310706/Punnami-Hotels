import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { jwtVerify } from 'jose';

async function verifyToken(token: string): Promise<string | null> {
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    return (payload as any).phone || null;
  } catch {
    return null;
  }
}

// GET /api/v1/bookings/my-bookings — Fetch bookings matching customer phone from JWT (Bearer or Cookie)
export async function GET(req: NextRequest) {
  try {
    let token = '';
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = req.cookies.get('punnami_token')?.value || '';
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const phone = await verifyToken(token);

    if (!phone) {
      return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: { guestPhone: phone },
      orderBy: { createdAt: 'desc' },
      include: {
        roomType: {
          select: { name: true, coverImageUrl: true },
        },
      },
    });

    return NextResponse.json(
      bookings.map((b) => {
        const { aadharEncrypted, aadharHash, aadharImageUrl, ...publicBooking } = b;
        return {
          ...publicBooking,
          id: b.id.toString(),
          roomTypeId: b.roomTypeId.toString(),
          totalAmount: Number(b.totalAmount),
          subtotalAmount: Number(b.subtotalAmount),
          discountAmount: Number(b.discountAmount),
          gstAmount: Number(b.gstAmount),
        };
      })
    );
  } catch (err) {
    console.error('[My Bookings API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch your bookings' }, { status: 500 });
  }
}
