/**
 * Zoho Mail SMTP Service — Punnami Hotels
 * Uses nodemailer with Zoho India SMTP (smtp.zoho.in:465)
 */

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.in',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_EMAIL!,
    pass: process.env.ZOHO_PASSWORD!,
  },
});

const FROM = `"Punnami Hotels" <${process.env.ZOHO_EMAIL}>`;
const BRAND_COLOR = '#C9A84C';
const HOTEL_PHONE = '9542069573';

function baseTemplate(content: string, preview: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Punnami Hotels</title>
  <meta name="x-apple-disable-message-reformatting"/>
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${preview}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1C1A17 0%,#2D2A24 100%);padding:32px 40px;text-align:center;">
            <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#C9A84C;letter-spacing:2px;">PUNNAMI HOTELS</div>
            <div style="color:#E8DDD0;font-size:13px;margin-top:6px;letter-spacing:3px;text-transform:uppercase;">Luxury & Comfort</div>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:40px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#1C1A17;padding:24px 40px;text-align:center;">
            <div style="color:#E8DDD0;font-size:12px;line-height:1.8;">
              Punnami Hotels &nbsp;|&nbsp; punnamihotels.com &nbsp;|&nbsp; ${HOTEL_PHONE}
            </div>
            <div style="color:#8a8278;font-size:11px;margin-top:8px;">
              This is an automated email. Please do not reply to this email.
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendEmail({
  to,
  subject,
  html,
  preview,
}: {
  to: string;
  subject: string;
  html: string;
  preview?: string;
}): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: FROM,
      to,
      subject,
      html: baseTemplate(html, preview || subject),
    });
    console.log(`[Email] Sent "${subject}" to ${to}`);
    return true;
  } catch (err) {
    console.error(`[Email] Failed to send "${subject}" to ${to}:`, err);
    return false;
  }
}

// ─── OTP Email ──────────────────────────────────────────────────────────────

export async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'Your OTP – Punnami Hotels',
    preview: `Your Punnami Hotels login OTP is ${otp}`,
    html: `
      <h2 style="color:#1C1A17;font-family:Georgia,serif;font-size:24px;margin:0 0 16px;">Your Login OTP</h2>
      <p style="color:#4a4540;font-size:15px;line-height:1.6;margin:0 0 24px;">Use the following One-Time Password to sign in to Punnami Hotels. This OTP is valid for <strong>5 minutes</strong>.</p>
      <div style="background:#F5F0E8;border:2px dashed #C9A84C;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
        <div style="font-size:40px;font-weight:800;letter-spacing:12px;color:#1C1A17;">${otp}</div>
      </div>
      <p style="color:#8a8278;font-size:13px;margin:0;">If you didn't request this OTP, please ignore this email.</p>
    `,
  });
}

// ─── Booking Confirmation Email ──────────────────────────────────────────────

export async function sendBookingConfirmationEmail({
  guestEmail,
  guestName,
  publicId,
  roomName,
  checkInDate,
  checkInTime,
  checkOutDate,
  checkOutTime,
  nights,
  rooms,
  totalAmount,
  paidAmount,
}: {
  guestEmail: string;
  guestName: string;
  publicId: string;
  roomName: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  nights: number;
  rooms: number;
  totalAmount: string;
  paidAmount: string;
}): Promise<boolean> {
  const ticketUrl = `https://punnamihotels.com/ticket/${publicId}`;
  return sendEmail({
    to: guestEmail,
    subject: `Booking Confirmed – ${publicId} | Punnami Hotels`,
    preview: `Your booking at Punnami Hotels is confirmed! Check-in: ${checkInDate}`,
    html: `
      <h2 style="color:#1C1A17;font-family:Georgia,serif;font-size:24px;margin:0 0 8px;">Booking Confirmed! 🎉</h2>
      <p style="color:#4a4540;font-size:15px;margin:0 0 24px;">Dear <strong>${guestName}</strong>, your room booking at Punnami Hotels is confirmed. We look forward to welcoming you!</p>
      
      <!-- Booking ID Banner -->
      <div style="background:linear-gradient(135deg,#1C1A17,#2D2A24);border-radius:12px;padding:16px 24px;margin:0 0 24px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="color:#8a8278;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Booking ID</div>
          <div style="color:#C9A84C;font-size:22px;font-weight:800;letter-spacing:2px;">${publicId}</div>
        </div>
      </div>

      <!-- Details Table -->
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8DDD0;border-radius:12px;overflow:hidden;margin:0 0 24px;">
        <tr style="background:#F5F0E8;">
          <td style="padding:12px 20px;color:#8a8278;font-size:12px;text-transform:uppercase;letter-spacing:1px;width:40%;">Room</td>
          <td style="padding:12px 20px;color:#1C1A17;font-size:15px;font-weight:600;">${roomName}</td>
        </tr>
        <tr>
          <td style="padding:12px 20px;color:#8a8278;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Check-in</td>
          <td style="padding:12px 20px;color:#1C1A17;font-size:15px;font-weight:600;">${checkInDate} at ${checkInTime}</td>
        </tr>
        <tr style="background:#F5F0E8;">
          <td style="padding:12px 20px;color:#8a8278;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Check-out</td>
          <td style="padding:12px 20px;color:#1C1A17;font-size:15px;font-weight:600;">${checkOutDate} at ${checkOutTime}</td>
        </tr>
        <tr>
          <td style="padding:12px 20px;color:#8a8278;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Duration</td>
          <td style="padding:12px 20px;color:#1C1A17;font-size:15px;font-weight:600;">${nights} Night${nights > 1 ? 's' : ''}, ${rooms} Room${rooms > 1 ? 's' : ''}</td>
        </tr>
        <tr style="background:#F5F0E8;">
          <td style="padding:12px 20px;color:#8a8278;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Amount Paid</td>
          <td style="padding:12px 20px;color:#2D5A27;font-size:15px;font-weight:800;">₹${paidAmount}</td>
        </tr>
        <tr>
          <td style="padding:12px 20px;color:#8a8278;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Total Amount</td>
          <td style="padding:12px 20px;color:#1C1A17;font-size:15px;font-weight:600;">₹${totalAmount}</td>
        </tr>
      </table>

      <!-- Download Ticket CTA -->
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${ticketUrl}" target="_blank" style="display:inline-block;background:#C9A84C;border-radius:10px;color:#1C1A17;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:800;padding:16px 40px;text-decoration:none;">Download Ticket</a>
      </div>

      <p style="color:#4a4540;font-size:14px;line-height:1.6;margin:0 0 8px;">📌 <strong>Important:</strong> Please carry a printed copy of your ticket when you arrive.</p>
      <p style="color:#4a4540;font-size:14px;line-height:1.6;margin:0;">For support, call us at <strong>${HOTEL_PHONE}</strong></p>
    `,
  });
}

// ─── Admin Notification Email ────────────────────────────────────────────────

export async function sendAdminPaymentProofEmail({
  publicId,
  guestName,
  guestPhone,
  roomName,
  checkInDate,
  checkOutDate,
  totalAmount,
  transactionId,
  proofImageUrl,
}: {
  publicId: string;
  guestName: string;
  guestPhone: string;
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: string;
  transactionId?: string;
  proofImageUrl?: string;
}): Promise<boolean> {
  const adminUrl = `https://punnamihotels.com/admin/bookings/${publicId}`;
  return sendEmail({
    to: process.env.ZOHO_EMAIL!,
    subject: `⚡ New Payment Proof – ${publicId} | Action Required`,
    preview: `${guestName} has submitted payment proof for booking ${publicId}`,
    html: `
      <h2 style="color:#1C1A17;font-family:Georgia,serif;font-size:22px;margin:0 0 16px;">New Payment Proof Received</h2>
      <p style="color:#4a4540;font-size:15px;margin:0 0 24px;">A guest has submitted payment proof. Please verify and <strong>approve or reject</strong> within 30 minutes before the booking auto-expires.</p>
      
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8DDD0;border-radius:12px;overflow:hidden;margin:0 0 24px;">
        <tr style="background:#F5F0E8;"><td style="padding:12px 20px;color:#8a8278;font-size:12px;text-transform:uppercase;letter-spacing:1px;width:40%;">Booking ID</td><td style="padding:12px 20px;color:#C9A84C;font-size:15px;font-weight:800;">${publicId}</td></tr>
        <tr><td style="padding:12px 20px;color:#8a8278;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Guest Name</td><td style="padding:12px 20px;color:#1C1A17;font-size:15px;font-weight:600;">${guestName}</td></tr>
        <tr style="background:#F5F0E8;"><td style="padding:12px 20px;color:#8a8278;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Phone</td><td style="padding:12px 20px;color:#1C1A17;font-size:15px;font-weight:600;">${guestPhone}</td></tr>
        <tr><td style="padding:12px 20px;color:#8a8278;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Room</td><td style="padding:12px 20px;color:#1C1A17;font-size:15px;font-weight:600;">${roomName}</td></tr>
        <tr style="background:#F5F0E8;"><td style="padding:12px 20px;color:#8a8278;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Check-in</td><td style="padding:12px 20px;color:#1C1A17;font-size:15px;font-weight:600;">${checkInDate}</td></tr>
        <tr><td style="padding:12px 20px;color:#8a8278;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Check-out</td><td style="padding:12px 20px;color:#1C1A17;font-size:15px;font-weight:600;">${checkOutDate}</td></tr>
        <tr style="background:#F5F0E8;"><td style="padding:12px 20px;color:#8a8278;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Amount</td><td style="padding:12px 20px;color:#2D5A27;font-size:15px;font-weight:800;">₹${totalAmount}</td></tr>
        ${transactionId ? `<tr><td style="padding:12px 20px;color:#8a8278;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Transaction ID</td><td style="padding:12px 20px;color:#1C1A17;font-size:15px;font-weight:600;">${transactionId}</td></tr>` : ''}
        ${proofImageUrl ? `<tr style="background:#F5F0E8;"><td style="padding:12px 20px;color:#8a8278;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Payment Screenshot</td><td style="padding:12px 20px;"><a href="${proofImageUrl}" target="_blank" style="color:#C9A84C;font-weight:600;">View Screenshot →</a></td></tr>` : ''}
      </table>

      <div style="text-align:center;">
        <a href="${adminUrl}" target="_blank" style="display:inline-block;background:#C9A84C;border-radius:10px;color:#1C1A17;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:800;padding:16px 40px;text-decoration:none;">Review in Admin Panel</a>
      </div>
    `,
  });
}
