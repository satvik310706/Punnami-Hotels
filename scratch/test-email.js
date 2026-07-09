const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Load .env manually
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      // Remove surrounding quotes
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const ZOHO_EMAIL = process.env.ZOHO_EMAIL;
const ZOHO_PASSWORD = process.env.ZOHO_PASSWORD;

if (!ZOHO_EMAIL || !ZOHO_PASSWORD) {
  console.error('Error: ZOHO_EMAIL or ZOHO_PASSWORD is not set in .env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.in',
  port: 465,
  secure: true,
  auth: {
    user: ZOHO_EMAIL,
    pass: ZOHO_PASSWORD,
  },
});

const FROM = `"Punnami Hotels" <${ZOHO_EMAIL}>`;
const HOTEL_PHONE = '9542069573';

function baseTemplate(content, preview) {
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

async function sendTestEmails() {
  const publicId = 'PUN-2026-X8Y9Z';
  const guestName = 'Satvik Reddy';
  const guestEmail = 'satvik310706@gmail.com';
  const guestPhone = '+91 95420 69573';
  const roomName = 'Executive Luxury Suite';
  const checkInDate = '12 Jul 2026';
  const checkInTime = '12:00 PM';
  const checkOutDate = '15 Jul 2026';
  const checkOutTime = '11:00 AM';
  const nights = 3;
  const rooms = 1;
  
  const ticketUrl = `https://punnamihotels.com/ticket/${publicId}`;
  const adminPanelUrl = `https://punnamihotels.com/admin/bookings`;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=17.669494,80.881138`;

  // ──── TEST CASE 1: PARTIAL PAYMENT (50% ADVANCE) ────
  const totalAmount1 = '15000';
  const paidAmount1 = '7500';
  const balance1 = 7500;

  const guestHtml1 = `
    <h2 class="heading" style="color: #2E7D32;">Booking Confirmed! 🎉</h2>
    <p class="text">Dear <strong>${guestName}</strong>, your reservation is secured. We look forward to welcoming you to Punnami Hotels.</p>
    
    <div class="badge-container">
      <div class="badge-label">Booking Reference ID</div>
      <div class="badge-value" style="color: #C9A84C;">${publicId}</div>
    </div>

    <!-- Partial Payment Highlight Box -->
    <div style="background-color: #FFF8E1; border: 1px solid #FFE082; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #B78103; letter-spacing: 1px;">⚠️ Partial Advance Payment Completed</p>
      <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: 700; color: #5D4037;">Advance Paid: ₹${Number(paidAmount1).toLocaleString('en-IN')}</p>
      <p style="margin: 0; font-size: 14px; font-weight: 800; color: #B78103; background-color: #FFF3CD; padding: 8px 12px; border-radius: 6px; display: inline-block;">
        Balance Due at Key Pickup Office: ₹${balance1.toLocaleString('en-IN')}
      </p>
    </div>

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
        <td class="details-val" style="font-weight: 700;">₹${Number(totalAmount1).toLocaleString('en-IN')}</td>
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
  `;

  const adminHtml1 = `
    <h2 class="heading" style="color: #1E3A8A;">New Confirmed Booking</h2>
    <p class="text">A new customer booking has been registered in the room inventory database.</p>
    
    <div class="badge-container">
      <div class="badge-label">Booking ID</div>
      <div class="badge-value" style="color: #C9A84C;">${publicId}</div>
    </div>

    <!-- Admin Payment Status Highlight Box -->
    <div style="background-color: #FFF8E1; border: 1px solid #FFE082; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #B78103; letter-spacing: 1px;">⚠️ Partial Advance Paid</p>
      <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: 700; color: #5D4037;">Advance Collected: ₹${Number(paidAmount1).toLocaleString('en-IN')}</p>
      <p style="margin: 0; font-size: 14px; font-weight: 850; color: #D84315; background-color: #FFCCBC; padding: 8px 12px; border-radius: 6px; display: inline-block;">
        Balance Collection Required at Office: ₹${balance1.toLocaleString('en-IN')}
      </p>
    </div>

    <!-- Guest Card -->
    <div style="background-color: #FAF8F5; border: 1px solid #E8DDD0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #8A8278; letter-spacing: 1px;">Guest Contact Info</p>
      <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 700; color: #1C1A17;">${guestName}</p>
      <p style="margin: 0 0 4px 0; font-size: 13px; color: #4A4540;">📧 <a href="mailto:${guestEmail}" style="color: #1C1A17; text-decoration: none; font-weight: 600;">${guestEmail}</a></p>
      <p style="margin: 0; font-size: 13px; color: #4A4540;">📞 <a href="tel:${guestPhone}" style="color: #1C1A17; text-decoration: none; font-weight: 600;">${guestPhone}</a></p>
    </div>

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
        <td class="details-val" style="font-weight: 700;">₹${Number(totalAmount1).toLocaleString('en-IN')}</td>
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
  `;

  console.log('Sending Guest Confirmation email copy to punnamirooms@gmail.com...');
  await transporter.sendMail({
    from: FROM,
    to: 'punnamirooms@gmail.com',
    subject: `[GUEST STAY TICKET] Booking Confirmed – ${publicId} | Punnami Hotels`,
    html: baseTemplate(guestHtml1, `Your room reservation at Punnami Hotels is confirmed! Check-in: ${checkInDate}`),
  });
  console.log('Guest confirmation email copy sent successfully.');

  console.log('Sending Admin Notification email to punnamirooms@gmail.com...');
  await transporter.sendMail({
    from: FROM,
    to: 'punnamirooms@gmail.com',
    subject: `[ADMIN NOTIFICATION] 🔔 New Booking Confirmed – ${publicId} | Punnami Hotels`,
    html: baseTemplate(adminHtml1, `New paid booking from ${guestName} (${roomName}) has been confirmed.`),
  });
  console.log('Admin notification email sent successfully.');
}

sendTestEmails().catch(err => {
  console.error('Failed to send test emails:', err);
});
