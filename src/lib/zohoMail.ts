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
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F8F5F0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    a {
      color: #C9A84C;
      text-decoration: none;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(28, 26, 23, 0.06);
    }
    .header {
      background: linear-gradient(135deg, #1C1A17 0%, #2D2A24 100%);
      padding: 32px 40px;
      text-align: center;
      border-bottom: 3px solid #C9A84C;
    }
    .brand-title {
      font-family: "Georgia", serif;
      font-size: 28px;
      font-weight: 700;
      color: #C9A84C;
      letter-spacing: 3px;
      margin: 0;
    }
    .brand-subtitle {
      color: #E8DDD0;
      font-size: 11px;
      margin-top: 6px;
      letter-spacing: 4px;
      text-transform: uppercase;
    }
    .body {
      padding: 40px;
      background-color: #FFFFFF;
    }
    .heading {
      color: #1C1A17;
      font-family: "Georgia", serif;
      font-size: 24px;
      margin: 0 0 16px 0;
      font-weight: 700;
    }
    .text {
      color: #4A4540;
      font-size: 15px;
      line-height: 1.6;
      margin: 0 0 24px 0;
    }
    .badge-container {
      background: #FDFBF7;
      border: 1px solid #E8DDD0;
      border-radius: 12px;
      padding: 18px 24px;
      margin-bottom: 24px;
      display: table;
      width: 100%;
      box-sizing: border-box;
    }
    .badge-label {
      color: #8A8278;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .badge-value {
      color: #1C1A17;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 1px;
    }
    .details-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      border: 1px solid #E8DDD0;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 28px;
    }
    .details-table td {
      padding: 14px 20px;
      font-size: 14px;
      border-bottom: 1px solid #E8DDD0;
      color: #1C1A17;
    }
    .details-table tr:last-child td {
      border-bottom: none;
    }
    .details-label {
      color: #8A8278;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 11px;
      width: 35%;
      background-color: #FAF8F5;
    }
    .details-val {
      font-weight: 600;
    }
    .btn-container {
      text-align: center;
      margin: 28px 0;
    }
    .btn {
      display: inline-block;
      background-color: #C9A84C;
      color: #1C1A17 !important;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
      padding: 15px 36px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(201, 168, 76, 0.2);
      transition: all 0.2s ease;
    }
    .secondary-btn {
      display: inline-block;
      background-color: #1C1A17;
      color: #C9A84C !important;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 10px;
      margin-left: 10px;
      border: 1px solid #C9A84C;
    }
    .notice {
      background-color: #FAF8F5;
      border-left: 4px solid #C9A84C;
      border-radius: 0 8px 8px 0;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .notice-title {
      font-size: 13px;
      font-weight: 700;
      color: #1C1A17;
      margin: 0 0 4px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .notice-body {
      font-size: 13px;
      color: #6E6861;
      margin: 0;
      line-height: 1.5;
    }
    .footer {
      background-color: #1C1A17;
      padding: 32px 40px;
      text-align: center;
      border-top: 1px solid #2D2A24;
    }
    .footer-text {
      color: #E8DDD0;
      font-size: 12px;
      line-height: 1.8;
      letter-spacing: 1px;
    }
    .footer-sub {
      color: #A29A90;
      font-size: 11px;
      margin-top: 12px;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;">${preview}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F5F0; padding: 32px 16px;">
    <tr>
      <td align="center">
        <div class="email-container">
          <!-- Header -->
          <div class="header">
            <div class="brand-title">PUNNAMI HOTELS</div>
            <div class="brand-subtitle">Luxury & Comfort</div>
          </div>
          <!-- Body -->
          <div class="body">
            ${content}
          </div>
          <!-- Footer -->
          <div class="footer">
            <div class="footer-text">
              Punnami Hotels &nbsp;|&nbsp; 
              <a href="https://punnamihotels.com" style="color: #C9A84C; text-decoration: none; font-weight: 700;">punnamihotels.com</a> &nbsp;|&nbsp; 
              <a href="tel:${HOTEL_PHONE}" style="color: #E8DDD0; text-decoration: none; font-weight: 600;">${HOTEL_PHONE}</a>
            </div>
            <div class="footer-sub">
              This is an automated operational transmission. Please do not reply directly.
            </div>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendEmail({
  to,
  subject,
  html,
  preview,
  cc,
}: {
  to: string;
  subject: string;
  html: string;
  preview?: string;
  cc?: string;
}): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: FROM,
      to,
      cc,
      subject,
      html: baseTemplate(html, preview || subject),
    });
    console.log(`[Email] Sent "${subject}" to ${to}${cc ? ` (CC: ${cc})` : ''}`);
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
    subject: 'Your Verification Code – Punnami Hotels',
    preview: `Your administrative access code is ${otp}`,
    html: `
      <h2 class="heading">Security Verification</h2>
      <p class="text">You are requesting administrative entry into the Punnami Hotels management console. Please use the secure verification code below to authorize your session.</p>
      
      <div class="badge-container" style="text-align: center; padding: 30px;">
        <div class="badge-label">One-Time Password (OTP)</div>
        <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1C1A17; font-family: monospace;">${otp}</div>
      </div>
      
      <div class="notice">
        <p class="notice-title">Security Note</p>
        <p class="notice-body">This code is valid for exactly 10 minutes and can only be used once. If you did not initiate this authorization, please review your dashboard security immediately.</p>
      </div>
    `,
  });
}

// ─── Booking Confirmation Email (Guest Copy) ─────────────────────────────────

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
  const ticketUrl = `https://punnamihotels.com/booking/${publicId}`;
  const mapUrl = `https://maps.app.goo.gl/NsFCq6zSKECAR3xj8`;

  const total = Number(totalAmount);
  const paid = Number(paidAmount);
  const balance = total - paid;
  const isPartial = balance > 0;

  const paymentDetailsBox = isPartial
    ? `
      <div style="background-color: #FFF8E1; border: 1px solid #FFE082; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #B78103; letter-spacing: 1px;">⚠️ Partial Advance Payment Completed</p>
        <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: 700; color: #5D4037;">Advance Paid: ₹${paid.toLocaleString('en-IN')}</p>
        <p style="margin: 0; font-size: 14px; font-weight: 800; color: #B78103; background-color: #FFF3CD; padding: 8px 12px; border-radius: 6px; display: inline-block;">
          Balance Due at Key Pickup Office: ₹${balance.toLocaleString('en-IN')}
        </p>
      </div>
    `
    : `
      <div style="background-color: #E8F5E9; border: 1px solid #C8E6C9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #2E7D32; letter-spacing: 1px;">✓ Paid in Full</p>
        <p style="margin: 0; font-size: 14px; font-weight: 700; color: #1B5E20;">Total Amount Paid: ₹${paid.toLocaleString('en-IN')}</p>
      </div>
    `;

  return sendEmail({
    to: guestEmail,
    subject: `Booking Confirmed – ${publicId} | Punnami Hotels`,
    preview: `Your room reservation at Punnami Hotels is confirmed! Check-in: ${checkInDate}`,
    html: `
      <h2 class="heading" style="color: #2E7D32;">Booking Confirmed! 🎉</h2>
      <p class="text">Dear <strong>${guestName}</strong>, your reservation is secured. We look forward to welcoming you to Punnami Hotels.</p>
      
      <div class="badge-container">
        <div class="badge-label">Booking Reference ID</div>
        <div class="badge-value" style="color: #C9A84C;">${publicId}</div>
      </div>

      ${paymentDetailsBox}

      <!-- Stay Details -->
      <table class="details-table" cellpadding="0" cellspacing="0">
        <tr>
          <td class="details-label">Room Type</td>
          <td class="details-val">${roomName}</td>
        </tr>
        <tr>
          <td class="details-label">Check-in</td>
          <td class="details-val">${checkInDate} &nbsp;(${checkInTime})</td>
        </tr>
        <tr>
          <td class="details-label">Check-out</td>
          <td class="details-val">${checkOutDate} &nbsp;(${checkOutTime})</td>
        </tr>
        <tr>
          <td class="details-label">Duration</td>
          <td class="details-val">${nights} Night${nights > 1 ? 's' : ''} &nbsp;/&nbsp; ${rooms} Room${rooms > 1 ? 's' : ''}</td>
        </tr>
        <tr>
          <td class="details-label">Total Cost</td>
          <td class="details-val" style="font-weight: 700;">₹${total.toLocaleString('en-IN')}</td>
        </tr>
      </table>

      <!-- Key Pickup & Registration Location Office -->
      <div style="background-color: #FAF8F5; border: 1px solid #E8DDD0; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
        <p style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #C9A84C; letter-spacing: 1.5px;">📍 Required: Key Pickup & Registration Office</p>
        <p style="margin: 0 0 16px 0; font-size: 13px; color: #4A4540; line-height: 1.5;">
          <strong>Important:</strong> Before proceeding to your room, please visit our main office to complete registration paperwork, verify government-issued photo IDs, and collect your room keys.
        </p>
        <div style="text-align: left;">
          <a href="${mapUrl}" target="_blank" style="display: inline-block; background-color: #1C1A17; color: #C9A84C !important; font-size: 13px; font-weight: 700; text-decoration: none; padding: 10px 20px; border-radius: 8px; border: 1px solid #C9A84C;">
            Navigate via Google Maps →
          </a>
        </div>
      </div>

      <div class="btn-container">
        <a href="${ticketUrl}" class="btn" target="_blank">Download Stay Ticket</a>
      </div>

      <div class="notice">
        <p class="notice-title">Arrival Requirements</p>
        <p class="notice-body">Please keep a digital or printed copy of this stay ticket handy. All checking-in guests must show a valid government photo ID at the registration office.</p>
      </div>

      <p class="text" style="font-size: 13px; color: #8A8278; margin-top: 30px;">
        Need assistance, directions, or custom travel help? Feel free to contact our reservations office at 
        <a href="tel:${HOTEL_PHONE}" style="color: #1C1A17; text-decoration: none; font-weight: 700;">${HOTEL_PHONE}</a>.
      </p>
    `,
  });
}

// ─── Booking Confirmation Email (Admin Notification Copy) ───────────────────

export async function sendAdminBookingConfirmationEmail({
  guestName,
  guestEmail,
  guestPhone,
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
  adminEmail,
}: {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
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
  adminEmail?: string;
}): Promise<boolean> {
  const adminPanelUrl = `https://punnamihotels.com/admin/bookings`;
  const ticketUrl = `https://punnamihotels.com/booking/${publicId}`;
  const mapUrl = `https://maps.app.goo.gl/NsFCq6zSKECAR3xj8`;

  const total = Number(totalAmount);
  const paid = Number(paidAmount);
  const balance = total - paid;
  const isPartial = balance > 0;

  const adminPaymentStatusBox = isPartial
    ? `
      <div style="background-color: #FFF8E1; border: 1px solid #FFE082; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #B78103; letter-spacing: 1px;">⚠️ Partial Advance Paid</p>
        <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: 700; color: #5D4037;">Advance Collected: ₹${paid.toLocaleString('en-IN')}</p>
        <p style="margin: 0; font-size: 14px; font-weight: 850; color: #D84315; background-color: #FFCCBC; padding: 8px 12px; border-radius: 6px; display: inline-block;">
          Balance Collection Required at Office: ₹${balance.toLocaleString('en-IN')}
        </p>
      </div>
    `
    : `
      <div style="background-color: #E8F5E9; border: 1px solid #C8E6C9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #2E7D32; letter-spacing: 1px;">✓ Fully Paid</p>
        <p style="margin: 0; font-size: 14px; font-weight: 700; color: #1B5E20;">Total Received: ₹${paid.toLocaleString('en-IN')}</p>
      </div>
    `;

  return sendEmail({
    to: adminEmail || 'punnamirooms@gmail.com',
    subject: `🔔 New Booking Confirmed – ${publicId} | Punnami Hotels`,
    preview: `New paid booking from ${guestName} (${roomName}) has been confirmed.`,
    html: `
      <h2 class="heading" style="color: #1E3A8A;">New Confirmed Booking</h2>
      <p class="text">A new customer booking has been registered in the room inventory database.</p>
      
      <div class="badge-container">
        <div class="badge-label">Booking ID</div>
        <div class="badge-value" style="color: #C9A84C;">${publicId}</div>
      </div>

      ${adminPaymentStatusBox}

      <!-- Guest Card -->
      <div style="background-color: #FAF8F5; border: 1px solid #E8DDD0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #8A8278; letter-spacing: 1px;">Guest Contact Info</p>
        <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 700; color: #1C1A17;">${guestName}</p>
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #4A4540;">📧 <a href="mailto:${guestEmail}" style="color: #1C1A17; text-decoration: none; font-weight: 600;">${guestEmail}</a></p>
        <p style="margin: 0; font-size: 13px; color: #4A4540;">📞 <a href="tel:${guestPhone}" style="color: #1C1A17; text-decoration: none; font-weight: 600;">${guestPhone}</a></p>
      </div>

      <!-- Details Table -->
      <table class="details-table" cellpadding="0" cellspacing="0">
        <tr>
          <td class="details-label">Room Type</td>
          <td class="details-val">${roomName}</td>
        </tr>
        <tr>
          <td class="details-label">Dates</td>
          <td class="details-val">${checkInDate} &nbsp;to&nbsp; ${checkOutDate}</td>
        </tr>
        <tr>
          <td class="details-label">Nights / Rooms</td>
          <td class="details-val">${nights} Night${nights > 1 ? 's' : ''} &nbsp;/&nbsp; ${rooms} Room${rooms > 1 ? 's' : ''}</td>
        </tr>
        <tr>
          <td class="details-label">Total Cost</td>
          <td class="details-val" style="font-weight: 700;">₹${total.toLocaleString('en-IN')}</td>
        </tr>
      </table>

      <!-- Key Pickup & Registration Location Office -->
      <div style="background-color: #FAF8F5; border: 1px solid #E8DDD0; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
        <p style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #C9A84C; letter-spacing: 1.5px;">📍 Key Pickup & Registration Location</p>
        <p style="margin: 0 0 12px 0; font-size: 13px; color: #4A4540; line-height: 1.5;">
          Guest is instructed to visit the office at the following location to complete onboarding and collect keys.
        </p>
        <a href="${mapUrl}" target="_blank" style="display: inline-block; background-color: #1C1A17; color: #C9A84C !important; font-size: 13px; font-weight: 700; text-decoration: none; padding: 10px 20px; border-radius: 8px; border: 1px solid #C9A84C;">
          Navigate via Google Maps →
        </a>
      </div>

      <div class="btn-container" style="text-align: left;">
        <a href="${adminPanelUrl}" class="btn" target="_blank" style="background-color: #1C1A17; color: #C9A84C !important; border: 1px solid #C9A84C;">View Admin Bookings</a>
        <a href="${ticketUrl}" class="secondary-btn" target="_blank" style="background-color: #FAF8F5; color: #1C1A17 !important; border: 1px solid #E8DDD0;">View Guest Ticket</a>
      </div>
    `,
  });
}

// ─── Admin Payment Proof Email ──────────────────────────────────────────────

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
  const adminUrl = `https://punnamihotels.com/admin/bookings`;
  return sendEmail({
    to: 'punnamirooms@gmail.com',
    subject: `⚡ New Payment Proof – ${publicId} | Action Required`,
    preview: `${guestName} has submitted payment proof for booking ${publicId}`,
    html: `
      <h2 class="heading" style="color: #E65100;">Action Required: Verification</h2>
      <p class="text">A guest has uploaded offline payment proof for booking <strong>${publicId}</strong>. Please review this submission and update the room booking status within the next 30 minutes.</p>
      
      <table class="details-table" cellpadding="0" cellspacing="0">
        <tr><td class="details-label">Booking ID</td><td class="details-val" style="color: #C9A84C;">${publicId}</td></tr>
        <tr><td class="details-label">Guest Name</td><td class="details-val">${guestName}</td></tr>
        <tr><td class="details-label">Phone</td><td class="details-val">${guestPhone}</td></tr>
        <tr><td class="details-label">Room Type</td><td class="details-val">${roomName}</td></tr>
        <tr><td class="details-label">Check-in</td><td class="details-val">${checkInDate}</td></tr>
        <tr><td class="details-label">Check-out</td><td class="details-val">${checkOutDate}</td></tr>
        <tr><td class="details-label">Amount Due</td><td class="details-val" style="color: #E65100; font-weight: 800;">₹${Number(totalAmount).toLocaleString('en-IN')}</td></tr>
        ${transactionId ? `<tr><td class="details-label">Reference ID</td><td class="details-val">${transactionId}</td></tr>` : ''}
        ${proofImageUrl ? `<tr><td class="details-label">Screenshot</td><td class="details-val"><a href="${proofImageUrl}" target="_blank" style="color: #C9A84C; font-weight: 700; text-decoration: underline;">View Screenshot Image →</a></td></tr>` : ''}
      </table>

      <div class="btn-container">
        <a href="${adminUrl}" class="btn" target="_blank">Open Verification Panel</a>
      </div>
    `,
  });
}
