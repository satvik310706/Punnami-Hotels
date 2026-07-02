import { NextRequest, NextResponse } from 'next/server';
import { sendRoomConfirmationSMS } from '@/lib/sms';
import { sendBookingConfirmationEmail } from '@/lib/zohoMail';

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
      email === 'admin@punnamihotels.com' && 
      (password === 'admin123' || password === 'cwABmQ7wbVkn');

    if (!isValidAdmin) {
      return NextResponse.json({ error: 'Invalid administrator credentials' }, { status: 401 });
    }

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    adminStore.set(email, { otp, expires });
    console.log(`[Admin Login OTP] Generated OTP for ${email}: ${otp}`);

    // Optionally send real SMS notification to admin phone or email
    try {
      // Let's send a quick SMS to the admin contact phone if configured
      const adminPhone = process.env.ADMIN_CONTACT_PHONE || '9542069573';
      await sendRoomConfirmationSMS({
        customerName: 'Administrator',
        customerPhone: adminPhone,
        publicId: 'SECURE-GATEWAY',
        hotelName: 'Admin Verification Console',
        roomName: 'OTP Code Token',
        checkInDate: otp, // Hack MSG91 template fields to deliver OTP safely
        checkInTime: 'N/A',
        checkOutDate: 'N/A',
        checkOutTime: 'N/A',
        paidAmount: '0',
        totalAmount: '0',
      });
    } catch (e) {
      console.warn('Failed to send Admin OTP SMS, fallback to console log:', e);
    }

    return NextResponse.json({
      message: 'Secure authorization code generated and dispatched.',
      email,
    });
  } catch (err) {
    console.error('[Admin Login API] Error:', err);
    return NextResponse.json({ error: 'Login initiation failed' }, { status: 500 });
  }
}
