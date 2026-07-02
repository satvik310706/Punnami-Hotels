import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';

async function verifyToken(token: string): Promise<{ sub: string; phone: string; role: string } | null> {
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    return {
      sub: (payload as any).sub,
      phone: (payload as any).phone,
      role: (payload as any).role,
    };
  } catch {
    return null;
  }
}

// GET /api/v1/auth/me — Verify active user session token cookie
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('punnami_token')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false, error: 'Session token missing' }, { status: 401 });
    }

    const tokenPayload = await verifyToken(token);

    if (!tokenPayload) {
      return NextResponse.json({ authenticated: false, error: 'Invalid session' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { phone: tokenPayload.phone },
      select: {
        id: true,
        phone: true,
        fullName: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ authenticated: false, error: 'User not found' }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id.toString(),
        phone: user.phone,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[User Auth Check API] Error:', err);
    return NextResponse.json({ authenticated: false, error: 'Failed verification' }, { status: 500 });
  }
}
