import { NextRequest, NextResponse } from 'next/server';
import { sendOtpEmail } from '@/lib/zohoMail';

// Global memory store for admin OTP code
const globalAny = global as any;
if (!globalAny._punnamiAdminOtpStore) {
  globalAny._punnamiAdminOtpStore = new Map<string, { otp: string; expires: number }>();
}
const adminStore = globalAny._punnamiAdminOtpStore;

// POST /api/v1/auth/admin/login — Request Admin authorization
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const isValidAdmin = 
      email === 'punnamirooms@gmail.com' && 
      password === 'Punnami@2026';

    if (!isValidAdmin) {
      return NextResponse.json({ error: 'Invalid administrator credentials' }, { status: 401 });
    }

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    adminStore.set(email, { otp, expires });
    console.log(`[Admin Login OTP] Generated OTP for ${email}: ${otp}`);

    // Send real OTP email to the admin
    try {
      await sendOtpEmail(email, otp);
    } catch (e) {
      console.error('Failed to send Admin OTP email:', e);
    }

    return NextResponse.json({
      message: 'Secure authorization code generated and dispatched via email.',
      email,
    });
  } catch (err) {
    console.error('[Admin Login API] Error:', err);
    return NextResponse.json({ error: 'Login initiation failed' }, { status: 500 });
  }
}
