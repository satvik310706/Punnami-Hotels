import { NextRequest, NextResponse } from 'next/server';
import { sendOtpEmail } from '@/lib/zohoMail';
import prisma from '@/lib/db';

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
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database (works across all serverless instances)
    await prisma.adminOtp.upsert({
      where: { email },
      update: { otp, expiresAt },
      create: { email, otp, expiresAt },
    });

    console.log(`[Admin Login] Generated OTP for ${email}`);

    // Send OTP via email (best-effort)
    try {
      await sendOtpEmail(email, otp);
    } catch (e) {
      console.error('[Admin Login] Failed to send OTP email:', e);
      // Still return success — admin can use bypass if email fails
    }

    return NextResponse.json({
      message: 'Secure authorization code sent to your email.',
      email,
    });
  } catch (err) {
    console.error('[Admin Login API] Error:', err);
    return NextResponse.json({ error: 'Login initiation failed' }, { status: 500 });
  }
}
