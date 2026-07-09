import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const globalAny = global as any;
const adminStore = globalAny._punnamiAdminOtpStore;

async function signJWT(payload: object): Promise<string> {
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
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

    const saved = adminStore.get(email);

    const isValidOtp = saved && saved.otp === otp && Date.now() < saved.expires;

    if (!isValidOtp) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 401 });
    }

    // Auth matches! Generate JWT token
    const token = await signJWT({ role: 'ADMIN', email });

    // Clean up store
    adminStore.delete(email);

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
  } catch (err) {
    console.error('[Admin Verify OTP API] Error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 550 });
  }
}
