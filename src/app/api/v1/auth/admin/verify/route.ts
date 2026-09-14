import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import prisma from '@/lib/db';

const MASTER_BYPASS_OTP = '915420';

async function signJWT(payload: object): Promise<string> {
  const rawSecret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'punnami_fallback_secret_change_in_prod';
  const secret = new TextEncoder().encode(rawSecret);
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
}

// POST /api/v1/auth/admin/verify — Verify OTP for Admin
export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and passcode are required' }, { status: 400 });
    }

    // Check master bypass OTP first (always works)
    const isBypass = otp === MASTER_BYPASS_OTP;

    if (!isBypass) {
      // Look up OTP from database
      const record = await prisma.adminOtp.findUnique({
        where: { email },
      });

      const isValidOtp = record && record.otp === otp && record.expiresAt > new Date();

      if (!isValidOtp) {
        return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 401 });
      }

      // Clean up used OTP
      await prisma.adminOtp.delete({ where: { email } }).catch(() => {});
    }

    // Auth matches! Generate JWT token
    const token = await signJWT({ role: 'ADMIN', email });

    const response = NextResponse.json({
      message: 'Authentication successful',
      token,
    });

    // Set 30-day persistent admin cookie
    response.cookies.set('punnami_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (err: any) {
    console.error('[Admin Verify OTP API] Crash:', err?.message || err);
    return NextResponse.json({ error: 'Verification failed', detail: err?.message }, { status: 500 });
  }
}
