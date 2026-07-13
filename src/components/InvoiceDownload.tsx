'use client';

import React, { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';

interface InvoiceDownloadProps {
  booking: {
    publicId: string;
    sequenceId?: string | null;
    checkInDate: string;
    checkOutDate: string;
    totalNights: number;
    roomsBooked: number;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    adultCount: number;
    childCount: number;
    subtotalAmount: number;
    discountAmount: number;
    gstAmount: number;
    gatewayFee: number;
    totalAmount: number;
    paidAmount?: number;
    paymentPercentage?: number;
    status: string;
    createdAt: string;
    slotStart?: string | null;
    slotEnd?: string | null;
    completedPayments?: {
      id: string;
      merchantTransactionId: string;
      gatewayTransactionId: string | null;
      amount: number;
      createdAt: string;
    }[];
    roomType: {
      name: string;
      hotel: {
        name: string;
        address: string | null;
      };
    };
  };
  variant?: 'button' | 'text';
  className?: string;
  label?: string;
}

function formatSlotTime(timeStr?: string | null, fallback = '12:00 PM') {
  if (!timeStr) return fallback;
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return fallback;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch {
    return fallback;
  }
}

function fmtCurr(n: number) {
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return dateStr; }
}

function fmtDateTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return dateStr; }
}

function generateInvoiceHTML(booking: InvoiceDownloadProps['booking']): string {
  const checkIn = fmtDate(booking.checkInDate);
  const checkOut = fmtDate(booking.checkOutDate);
  const checkInTime = formatSlotTime(booking.slotStart, '12:00 PM');
  const checkOutTime = formatSlotTime(booking.slotEnd, '11:00 AM');
  const bookingDate = fmtDateTime(booking.createdAt);
  const invoiceNo = booking.sequenceId || booking.publicId.substring(0, 12).toUpperCase();
  const balanceDue = booking.totalAmount - (booking.paidAmount ?? booking.totalAmount);
  const isPartial = booking.status === 'PARTIAL_PAID';

  const paymentsRows = (booking.completedPayments ?? []).map((p, i) => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#374151;">${i + 1}. Payment (${fmtCurr(p.amount)})</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#374151;font-family:monospace;">${p.merchantTransactionId}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#374151;font-family:monospace;">${p.gatewayTransactionId || '—'}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#059669;font-weight:700;text-align:right;">${fmtCurr(p.amount)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Invoice ${invoiceNo}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111827; background: #ffffff; }
  .page { max-width: 820px; margin: 0 auto; background: #fff; }
  /* GOLD TOP BAR */
  .gold-bar { height: 8px; background: linear-gradient(90deg, #b45309, #d97706, #92400e); }
  /* BANNER IMAGE */
  .banner { width: 100%; display: block; height: auto; }
  /* HEADER */
  .header { padding: 24px 32px; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f59e0b; background: #fffbeb; }
  .logo-area { display: flex; align-items: center; gap: 14px; }
  .logo { width: 52px; height: 52px; background: #1c1917; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .logo img { width: 100%; height: 100%; object-fit: contain; }
  .hotel-name { font-size: 20px; font-weight: 900; color: #1c1917; letter-spacing: -0.5px; }
  .hotel-addr { font-size: 10px; color: #78716c; margin-top: 3px; max-width: 280px; line-height: 1.5; }
  .invoice-meta { text-align: right; }
  .invoice-title { font-size: 22px; font-weight: 900; color: #92400e; letter-spacing: 1px; text-transform: uppercase; }
  .invoice-number { font-size: 12px; color: #78716c; margin-top: 4px; }
  .invoice-date { font-size: 11px; color: #78716c; margin-top: 2px; }
  .invoice-status { display: inline-block; margin-top: 8px; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
  .status-paid { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
  .status-partial { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
  /* BILLING */
  .billing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border-bottom: 1px solid #e5e7eb; }
  .billing-col { padding: 20px 32px; }
  .billing-col:first-child { border-right: 1px solid #e5e7eb; }
  .billing-label { font-size: 9px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .billing-name { font-size: 15px; font-weight: 800; color: #111827; }
  .billing-detail { font-size: 11px; color: #6b7280; margin-top: 3px; }
  /* STAY SUMMARY */
  .section-title { font-size: 11px; font-weight: 800; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; padding: 12px 32px 8px; border-bottom: 1px solid #f3f4f6; background: #f9fafb; }
  .stay-grid { display: grid; grid-template-columns: repeat(4, 1fr); border-bottom: 1px solid #e5e7eb; }
  .stay-cell { padding: 14px 16px; border-right: 1px solid #f3f4f6; text-align: center; }
  .stay-cell:last-child { border-right: none; }
  .stay-cell-label { font-size: 9px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .stay-cell-value { font-size: 13px; font-weight: 900; color: #111827; }
  /* ITEMS TABLE */
  .items-table { width: 100%; border-collapse: collapse; }
  .items-table th { padding: 10px 16px; background: #1c1917; color: #fbbf24; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
  .items-table th.amount-col { text-align: right; }
  .items-table td { padding: 12px 16px; border-bottom: 1px solid #f3f4f6; font-size: 12px; color: #374151; vertical-align: top; }
  .items-table td.amount-col { text-align: right; }
  .items-table tr:last-child td { border-bottom: none; }
  /* TOTALS */
  .totals-section { display: flex; justify-content: flex-end; border-top: 2px solid #e5e7eb; }
  .totals-box { width: 320px; padding: 20px 32px; }
  .total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 12px; }
  .total-row-label { color: #6b7280; }
  .total-row-value { font-weight: 700; color: #111827; }
  .total-row.discount .total-row-value { color: #059669; }
  .total-divider { height: 1px; background: #e5e7eb; margin: 10px 0; }
  .grand-total-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #1c1917; border-radius: 10px; margin-top: 10px; }
  .grand-total-label { font-size: 12px; font-weight: 800; color: #d6d3d1; text-transform: uppercase; }
  .grand-total-value { font-size: 20px; font-weight: 900; color: #f59e0b; }
  .paid-row { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding: 8px 12px; background: #d1fae5; border-radius: 8px; }
  .paid-label { font-size: 11px; font-weight: 800; color: #065f46; }
  .paid-value { font-size: 13px; font-weight: 900; color: #059669; }
  .balance-row { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding: 8px 12px; background: #fef3c7; border-radius: 8px; }
  .balance-label { font-size: 11px; font-weight: 800; color: #92400e; }
  .balance-value { font-size: 13px; font-weight: 900; color: #d97706; }
  /* PAYMENTS TABLE */
  .payments-table { width: 100%; border-collapse: collapse; }
  .payments-table th { padding: 8px 10px; background: #f3f4f6; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; text-align: left; border-bottom: 2px solid #e5e7eb; }
  .payments-table th:last-child { text-align: right; }
  /* TERMS */
  .terms { padding: 16px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
  .terms-title { font-size: 10px; font-weight: 800; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .terms-list { list-style: disc; padding-left: 16px; }
  .terms-list li { font-size: 10px; color: #6b7280; margin-bottom: 4px; line-height: 1.5; }
  /* FOOTER */
  .footer { padding: 16px 32px; display: flex; justify-content: space-between; align-items: center; background: #1c1917; }
  .footer-text { font-size: 10px; color: #d6d3d1; }
  .footer-contact { font-size: 10px; color: #9ca3af; text-align: right; }
  .gst-note { font-size: 9px; color: #9ca3af; margin-top: 2px; }
  /* FLOATING BAR */
  .floating-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; border-top: 1px solid #e5e7eb; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; z-index: 1000; box-shadow: 0 -4px 6px -1px rgba(0,0,0,0.05); }
  .floating-text { font-size: 13px; font-weight: 600; color: #4b5563; }
  .floating-actions { display: flex; gap: 12px; }
  .btn-close { padding: 10px 20px; border: 1px solid #d1d5db; background: #f3f4f6; color: #374151; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
  .btn-close:hover { background: #e5e7eb; }
  .btn-print { padding: 10px 20px; border: none; background: #047857; color: #fff; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .btn-print:hover { background: #065f46; }
  
  @media print {
    @page { size: A4 portrait; margin: 10mm; }
    .no-print { display: none !important; }
    body { background: #fff; }
    .page { margin: 0; padding: 0; max-width: 100%; box-shadow: none; margin-bottom: 0 !important; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  }
</style>
</head>
<body style="background: #f3f4f6;">
<div class="page" style="margin-bottom: 80px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin-top: 20px;">
  <!-- Gold Top Bar -->
  <div class="gold-bar"></div>

  <!-- Hotel Banner -->
  <img class="banner" src="/hotel-banner.jpg" alt="Punnami Southern Residency" onerror="this.style.display='none'" />

  <!-- Header -->
  <div class="header">
    <div class="logo-area">
      <div class="logo">
        <img src="/logo.png" alt="Logo" />
      </div>
      <div>
        <div class="hotel-name">${booking.roomType.hotel.name}</div>
        <div class="hotel-addr">Punnami Southern Residency, Shilpinagar, 10-1-34,<br/>Ramalayam Road, beside Sri Kodanda Ramalayam Swamy Temple,<br/>Bhadrachalam, Telangana – 507111</div>
        <div class="hotel-addr" style="margin-top:4px;">📞 9505155166 | 9912221274 | 9849848938 | 9951369573</div>
      </div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-title">Tax Invoice</div>
      <div class="invoice-number">Invoice No: <strong>${invoiceNo}</strong></div>
      <div class="invoice-date">Booking Date: ${bookingDate}</div>
      <span class="invoice-status ${isPartial ? 'status-partial' : 'status-paid'}">${isPartial ? `Partially Paid (${booking.paymentPercentage ?? 0}%)` : 'Paid in Full'}</span>
    </div>
  </div>

  <!-- Billing Info -->
  <div class="billing-grid">
    <div class="billing-col">
      <div class="billing-label">Billed To (Guest)</div>
      <div class="billing-name">${booking.guestName}</div>
      <div class="billing-detail">📞 ${booking.guestPhone}</div>
      ${booking.guestEmail ? `<div class="billing-detail">✉ ${booking.guestEmail}</div>` : ''}
    </div>
    <div class="billing-col" style="text-align:right;">
      <div class="billing-label">Billed By (Hotel)</div>
      <div class="billing-name" style="font-size:13px;">Punnami Southern Residency</div>
      <div class="billing-detail">GSTIN: Not Applicable</div>
      <div class="billing-detail">Bhadrachalam, Telangana</div>
    </div>
  </div>

  <!-- Stay Summary Bar -->
  <div class="section-title">Stay Details</div>
  <div class="stay-grid">
    <div class="stay-cell">
      <div class="stay-cell-label">Check-In</div>
      <div class="stay-cell-value" style="font-size:11px;">${checkIn}</div>
      <div style="font-size:10px;color:#d97706;font-weight:700;">${checkInTime}</div>
    </div>
    <div class="stay-cell">
      <div class="stay-cell-label">Check-Out</div>
      <div class="stay-cell-value" style="font-size:11px;">${checkOut}</div>
      <div style="font-size:10px;color:#d97706;font-weight:700;">${checkOutTime}</div>
    </div>
    <div class="stay-cell">
      <div class="stay-cell-label">Nights</div>
      <div class="stay-cell-value">${booking.totalNights}</div>
    </div>
    <div class="stay-cell">
      <div class="stay-cell-label">Guests</div>
      <div class="stay-cell-value">${booking.adultCount}A${booking.childCount > 0 ? ' + ' + booking.childCount + 'C' : ''}</div>
    </div>
  </div>

  <!-- Line Items -->
  <div class="section-title">Invoice Line Items</div>
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:32px">#</th>
        <th>Description</th>
        <th class="amount-col">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="color:#9ca3af;font-size:11px;">1</td>
        <td>
          <strong>${booking.roomType.name}</strong><br/>
          <span style="font-size:10px;color:#6b7280;">${booking.roomsBooked} Room(s) &times; ${booking.totalNights} Night(s) &nbsp;&mdash;&nbsp; Check-In: ${checkIn} @ ${checkInTime} &nbsp;&rarr;&nbsp; Check-Out: ${checkOut} @ ${checkOutTime}</span>
        </td>
        <td class="amount-col" style="font-weight:700;">${fmtCurr(booking.subtotalAmount)}</td>
      </tr>
      ${Number(booking.discountAmount) > 0 ? `
      <tr>
        <td style="color:#9ca3af;font-size:11px;">2</td>
        <td><strong>Special Discount</strong><br/><span style="font-size:10px;color:#6b7280;">Promotional discount applied at booking</span></td>
        <td class="amount-col" style="font-weight:800;color:#059669;">-${fmtCurr(booking.discountAmount)}</td>
      </tr>` : ''}
      <tr>
        <td style="color:#9ca3af;font-size:11px;">${Number(booking.discountAmount) > 0 ? 3 : 2}</td>
        <td><strong>GST / Taxes &amp; Service Charges</strong><br/><span style="font-size:10px;color:#6b7280;">As applicable on hotel accommodation services</span></td>
        <td class="amount-col" style="font-weight:700;">${fmtCurr(booking.gstAmount)}</td>
      </tr>
      ${Number(booking.gatewayFee) > 0 ? `
      <tr>
        <td style="color:#9ca3af;font-size:11px;">${Number(booking.discountAmount) > 0 ? 4 : 3}</td>
        <td><strong>Payment Gateway Processing Fee</strong><br/><span style="font-size:10px;color:#6b7280;">PhonePe payment gateway convenience fee</span></td>
        <td class="amount-col" style="font-weight:700;">${fmtCurr(booking.gatewayFee)}</td>
      </tr>` : ''}
    </tbody>
  </table>

  <!-- Totals Section -->
  <div class="totals-section">
    <div class="totals-box">
      <div class="total-row">
        <span class="total-row-label">Room Tariff Subtotal</span>
        <span class="total-row-value">${fmtCurr(booking.subtotalAmount)}</span>
      </div>
      ${Number(booking.discountAmount) > 0 ? `
      <div class="total-row discount">
        <span class="total-row-label">Discount Applied</span>
        <span class="total-row-value">-${fmtCurr(booking.discountAmount)}</span>
      </div>` : ''}
      <div class="total-row">
        <span class="total-row-label">GST & Taxes</span>
        <span class="total-row-value">${fmtCurr(booking.gstAmount)}</span>
      </div>
      ${Number(booking.gatewayFee) > 0 ? `
      <div class="total-row">
        <span class="total-row-label">Gateway Fee</span>
        <span class="total-row-value">${fmtCurr(booking.gatewayFee)}</span>
      </div>` : ''}
      <div class="total-divider"></div>
      <div class="grand-total-row">
        <span class="grand-total-label">Grand Total</span>
        <span class="grand-total-value">${fmtCurr(booking.totalAmount)}</span>
      </div>
      ${isPartial ? `
      <div class="paid-row">
        <span class="paid-label">Amount Paid (${booking.paymentPercentage ?? 0}%)</span>
        <span class="paid-value">${fmtCurr(booking.paidAmount ?? 0)}</span>
      </div>
      <div class="balance-row">
        <span class="balance-label">Balance Due at Check-In</span>
        <span class="balance-value">${fmtCurr(balanceDue)}</span>
      </div>` : `
      <div class="paid-row">
        <span class="paid-label">✓ Paid in Full</span>
        <span class="paid-value">${fmtCurr(booking.totalAmount)}</span>
      </div>`}
    </div>
  </div>

  <!-- Payments Log -->
  ${(booking.completedPayments ?? []).length > 0 ? `
  <div class="section-title">Payment Transaction Log</div>
  <div style="padding: 0 32px 20px;">
    <table class="payments-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Merchant Transaction ID</th>
          <th>Gateway Ref</th>
          <th style="text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>${paymentsRows}</tbody>
    </table>
  </div>` : ''}

  <!-- Terms -->
  <div class="terms">
    <div class="terms-title">Terms & Conditions</div>
    <ul class="terms-list">
      <li>Valid photo ID (Aadhaar, Passport, Driving License) is mandatory for all adult guests at check-in.</li>
      <li>Standard check-in is at 12:00 PM. Check-out is at 11:00 AM. Early check-in/late check-out subject to availability.</li>
      <li>Cancellation charges of 100% apply. Cancellation requests must be made at least 4 days before check-in.</li>
      <li>Please visit the registration office for key pickup before heading to your room.</li>
      <li>This is a computer-generated invoice and does not require a physical signature.</li>
    </ul>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-text">
      <strong style="color:#f59e0b;">Punnami Southern Residency</strong><br/>
      Bhadrachalam, Telangana – 507111<br/>
      <span class="gst-note">This is an official tax invoice generated by the hotel's booking system.</span>
    </div>
    <div class="footer-contact">
      <div style="color:#d6d3d1;">📞 9505155166 | 9912221274</div>
      <div style="color:#d6d3d1;">9849848938 | 9951369573</div>
      <div style="color:#9ca3af;margin-top:2px;">✉ info@punnamihotels.com</div>
    </div>
  </div>
  <div style="height:6px;background:linear-gradient(90deg,#b45309,#d97706,#92400e);">  </div>
</div>

<!-- Floating Action Bar -->
<div class="no-print floating-bar">
  <div class="floating-text">⚓ Thank you for choosing Punnami Southern Residency! ⚓</div>
  <div class="floating-actions">
    <button class="btn-close" onclick="window.close()">
      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
      CLOSE
    </button>
    <button class="btn-print" onclick="window.print()">
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
      PRINT / SAVE PDF
    </button>
  </div>
</div>

</body>
</html>`;
}

export default function InvoiceDownload({ booking, variant = 'button', className, label }: InvoiceDownloadProps) {
  const [loading, setLoading] = useState(false);

  const handleDownloadInvoice = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const html = generateInvoiceHTML(booking);
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
        win.document.title = `Invoice-${booking.sequenceId || booking.publicId}`;
      } else {
        alert('Please allow popups to view the invoice');
      }
    } catch (err) {
      console.error('Error opening invoice:', err);
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'text') {
    return (
      <button
        onClick={handleDownloadInvoice}
        disabled={loading}
        className={className || 'text-amber-700 hover:text-amber-900 font-bold text-xs underline cursor-pointer'}
      >
        {loading ? 'Generating...' : (label || 'Download Invoice')}
      </button>
    );
  }

  return (
    <button
      onClick={handleDownloadInvoice}
      disabled={loading}
      className={className || 'flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100/50 shadow-sm rounded-xl cursor-pointer transition-all'}
    >
      {loading ? (
        <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span>Generating...</span></>
      ) : (
        <><FileText className="h-3.5 w-3.5" /><span>{label || 'Download Invoice'}</span></>
      )}
    </button>
  );
}
