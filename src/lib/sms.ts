/**
 * MSG91 SMS Service — Punnami Hotels
 * Uses the Flow API exactly like ts-tours sms_service.py
 */

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY!;
const MSG91_API_URL = 'https://control.msg91.com/api/v5/flow';

const TEMPLATES = {
  PUNNAMI_OTP: process.env.MSG91_OTP_TEMPLATE_ID!,
  PUNNAMI_ROOM_CONFIRM: process.env.MSG91_CHECKIN_CONFIRM_TEMPLATE_ID!,
  PUNNAMI_ROOM_REMINDER: process.env.MSG91_BOOKING_REMINDER_TEMPLATE_ID!,
};

function normalizePhone(mobile: string): string {
  const cleaned = mobile.replace(/\D/g, '');
  if (cleaned.length === 10) return '91' + cleaned;
  if (!cleaned.startsWith('91')) return '91' + cleaned.slice(-10);
  return cleaned;
}

async function sendMsg91SMS(mobile: string, templateId: string, variables: Record<string, string>): Promise<boolean> {
  if (!MSG91_AUTH_KEY) {
    console.warn('[SMS] MSG91_AUTH_KEY not configured. SMS not sent.');
    return false;
  }
  if (!templateId) {
    console.warn('[SMS] Template ID not configured. SMS not sent.');
    return false;
  }

  const mobileStr = normalizePhone(mobile);
  const payload = {
    template_id: templateId,
    short_url: '0',
    recipients: [{ mobiles: mobileStr, ...variables }],
  };

  try {
    const res = await fetch(MSG91_API_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authkey: MSG91_AUTH_KEY,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    console.log(`[SMS] Sent to ${mobileStr}:`, data);
    return res.ok;
  } catch (err) {
    console.error(`[SMS] Failed to send to ${mobileStr}:`, err);
    return false;
  }
}

// ─── OTP ────────────────────────────────────────────────────────────────────

export async function sendOtpSMS(phone: string, otp: string): Promise<boolean> {
  return sendMsg91SMS(phone, TEMPLATES.PUNNAMI_OTP, {
    var1: otp,
    var2: '5', // expiry minutes
  });
}

// ─── Room Booking Confirmation ───────────────────────────────────────────────

export async function sendRoomConfirmationSMS({
  customerName,
  customerPhone,
  publicId,
  hotelName,
  roomName,
  checkInDate,
  checkInTime,
  checkOutDate,
  checkOutTime,
  paidAmount,
  totalAmount,
}: {
  customerName: string;
  customerPhone: string;
  publicId: string;
  hotelName: string;
  roomName: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  paidAmount: string;
  totalAmount: string;
}): Promise<boolean> {
  return sendMsg91SMS(customerPhone, TEMPLATES.PUNNAMI_ROOM_CONFIRM, {
    var1: customerName.split(' ')[0], // First name only (DLT/ts-tours style)
    var2: publicId,
    var3: hotelName.slice(0, 30),
    var4: roomName.slice(0, 30),
    var5: checkInDate,
    var6: checkInTime,
    var7: checkOutDate,
    var8: checkOutTime,
    var9: paidAmount,
    var10: totalAmount,
    var11: publicId,
  });
}

// ─── Check-in Reminder (6 hours before check-in) ────────────────────────────

export async function sendCheckInReminderSMS({
  customerName,
  customerPhone,
  publicId,
  hotelName,
  checkInDetail,
  hotelPhone,
}: {
  customerName: string;
  customerPhone: string;
  publicId: string;
  hotelName: string;
  checkInDetail: string; // e.g. "01 Jan 2026 at 12:00 PM"
  hotelPhone: string;
}): Promise<boolean> {
  return sendMsg91SMS(customerPhone, TEMPLATES.PUNNAMI_ROOM_REMINDER, {
    var1: customerName.split(' ')[0],
    var2: publicId,
    var3: hotelName.slice(0, 30),
    var4: checkInDetail,
    var5: hotelPhone || '9542069573',
    var6: publicId,
  });
}
