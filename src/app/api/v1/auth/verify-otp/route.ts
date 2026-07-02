import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import prisma from '@/lib/db';

const otpStore = new Map<string, { otp: string; expiresAt: number; attempts: number }>();

// Expose the store for the send-otp route (shared in real app via Redis)
// For MVP we use module-level map with re-export hack
declare global {
  var _punnamiOtpStore: Map<string, { otp: string; expiresAt: number; attempts: number }>;
}
if (!global._punnamiOtpStore) {
  global._punnamiOtpStore = new Map();
}
const store = global._punnamiOtpStore;

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

async function signJWT(payload: object): Promise<string> {
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
}

// POST /api/v1/auth/verify-otp
export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);
    const stored = store.get(normalizedPhone);

    if (!stored) {
      return NextResponse.json({ error: 'OTP expired or not found. Please request a new OTP.' }, { status: 400 });
    }

    if (Date.now() > stored.expiresAt) {
      store.delete(normalizedPhone);
      return NextResponse.json({ error: 'OTP has expired. Please request a new OTP.' }, { status: 400 });
    }

    if (stored.attempts >= 5) {
      store.delete(normalizedPhone);
      return NextResponse.json({ error: 'Too many failed attempts. Please request a new OTP.' }, { status: 400 });
    }

    if (stored.otp !== otp) {
      stored.attempts += 1;
      return NextResponse.json({ error: `Incorrect OTP. ${5 - stored.attempts} attempts remaining.` }, { status: 400 });
    }

    // OTP valid — consume it
    store.delete(normalizedPhone);

    // Find or create user
    let user = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (!user) {
      user = await prisma.user.create({
        data: { phone: normalizedPhone },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    // Generate JWT
    const token = await signJWT({
      sub: user.id.toString(),
      phone: user.phone,
      role: user.role,
    });

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id.toString(),
        phone: user.phone,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set('punnami_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[Auth] Verify OTP error:', err);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
