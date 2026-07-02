import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { sendOtpSMS } from '@/lib/sms';
import { sendOtpEmail } from '@/lib/zohoMail';

// Shared in-memory OTP store across API modules
declare global {
  var _punnamiOtpStore: Map<string, { otp: string; expiresAt: number; attempts: number }>;
}
if (!global._punnamiOtpStore) {
  global._punnamiOtpStore = new Map();
}
const otpStore = global._punnamiOtpStore;

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

// POST /api/v1/auth/send-otp
export async function POST(req: NextRequest) {
  try {
    const { phone, email } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone.length !== 10) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    // Rate limit: 1 OTP per 60 seconds
    const existing = otpStore.get(normalizedPhone);
    if (existing && Date.now() < existing.expiresAt - 4 * 60 * 1000) {
      return NextResponse.json({ error: 'Please wait before requesting another OTP' }, { status: 429 });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(normalizedPhone, { otp, expiresAt, attempts: 0 });

    // Send SMS
    await sendOtpSMS(normalizedPhone, otp);
    
    // Log OTP for local development testing
    console.log(`\n🔑 [DEV OTP] Generated OTP for +91 ${normalizedPhone}: ${otp}\n`);

    // Send email if provided
    if (email) {
      await sendOtpEmail(email, otp);
    }

    // Clean up expired entries
    for (const [key, val] of otpStore.entries()) {
      if (Date.now() > val.expiresAt) otpStore.delete(key);
    }

    return NextResponse.json({ message: 'OTP sent successfully', expiresIn: 300 });
  } catch (err) {
    console.error('[Auth] Send OTP error:', err);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
