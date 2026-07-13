'use client';

import React, { useState } from 'react';
import { Calendar, User, Phone, Mail, Ticket, CreditCard, ShieldCheck, MapPin, Printer, ArrowLeft, Home, Sparkles, Users, AlertTriangle, CalendarClock, MessageSquare, RefreshCw, X, XCircle, Loader2, Star, Download, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import CustomDatePicker from '@/components/CustomDatePicker';

function formatSlotTime(timeStr?: string | null, fallback: string = '12:00 PM') {
  if (!timeStr) return fallback;
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return fallback;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours.toString().padStart(2, '0')}:${displayMinutes} ${period}`;
  } catch {
    return fallback;
  }
}

interface BookingVoucherProps {
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
    status: string;
    createdAt: string;
    slotStart?: string;
    slotEnd?: string;
    transactionId?: string | null;
    cancellationReason?: string;
    cancellationFee?: number;
    refundAmount?: number;
    postponeReason?: string;
    postponeNewDate?: string;
    originalCheckInDate?: string | null;
    originalCheckOutDate?: string | null;
    paidAmount?: number;
    paymentPercentage?: number;
    passengers?: {
      fullName: string;
      age: number;
      gender: string;
      aadhaar?: string;
      phone?: string;
      isPrimary?: boolean;
    }[];
    completedPayments?: {
      id: string;
      merchantTransactionId: string;
      gatewayTransactionId: string | null;
      amount: number;
      createdAt: string;
    }[];
    roomType: {
      name: string;
      capacityPerRoom: number;
      maxAdults: number;
      maxChildren: number;
      hotel: {
        name: string;
        address: string | null;
        checkInTime: string | null;
        checkOutTime: string | null;
      };
    };
  };
}

export default function BookingVoucher({ booking }: BookingVoucherProps) {
  const router = useRouter();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPostponeModal, setShowPostponeModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const printVal = params.get('print');
    if (printVal === 'ticket' || printVal === 'true') {
      setTimeout(() => {
        window.print();
      }, 500);
      const url = new URL(window.location.href);
      url.searchParams.delete('print');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);
  
  const [cancelReason, setCancelReason] = useState('');
  const [postponeReason, setPostponeReason] = useState('');
  const [postponeDate, setPostponeDate] = useState<Date>(() => {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    tom.setHours(0, 0, 0, 0);
    return tom;
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [payingBalance, setPayingBalance] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const checkInDateObj = new Date(booking.checkInDate);
  const todayObj = new Date();
  todayObj.setHours(0, 0, 0, 0);
  const daysUntilCheckIn = Math.ceil((checkInDateObj.getTime() - todayObj.getTime()) / (1000 * 60 * 60 * 24));
  const isActive = ['CONFIRMED', 'PARTIAL_PAID'].includes(booking.status);
  const hasPendingRequest = ['CANCEL_REQUESTED', 'POSTPONE_REQUESTED'].includes(booking.status);
  const canRequestChanges = daysUntilCheckIn >= 4 && isActive;

  const handlePayBalance = async () => {
    setPayingBalance(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/v1/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.publicId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to initiate payment. Please try again.');
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        setErrorMsg('Failed to initiate payment.');
      }
    } catch {
      setErrorMsg('Failed to connect to payment gateway. Please check connection.');
    } finally {
      setPayingBalance(false);
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cancelReason.trim().length < 5) {
      setErrorMsg('Please enter a valid reason (min 5 characters).');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/v1/bookings/${booking.publicId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to submit cancellation request.');
      } else {
        setShowCancelModal(false);
        const isFullyPaid = booking.status !== 'PARTIAL_PAID';
        const formattedCheckIn = format(new Date(booking.checkInDate), 'd MMM yyyy');
        const formattedCheckOut = format(new Date(booking.checkOutDate), 'd MMM yyyy');
        const msg = `Hello Punnami Southern Residency, I would like to request a cancellation for:\n\nBooking ID: ${booking.publicId}\nRoom: ${booking.roomType.name}\nCheck-in: ${formattedCheckIn}\nCheck-out: ${formattedCheckOut}\nTotal: ₹${booking.totalAmount.toLocaleString('en-IN')}\nPayment Type: ${isFullyPaid ? '100% Full Payment' : '50% Advance'}\nRefund Expected: ${isFullyPaid ? `₹${(booking.totalAmount * 0.5).toLocaleString('en-IN')}` : 'None (non-refundable advance)'}\nReason: ${cancelReason}`;
        window.open(`https://wa.me/919542069573?text=${encodeURIComponent(msg)}`, '_blank');
        router.refresh();
      }
    } catch {
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostponeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postponeDate) {
      setErrorMsg('Please select a new check-in date.');
      return;
    }
    if (postponeReason.trim().length < 5) {
      setErrorMsg('Please enter a valid reason (min 5 characters).');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const dateStr = format(postponeDate, 'yyyy-MM-dd');
      const res = await fetch(`/api/v1/bookings/${booking.publicId}/postpone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newDate: dateStr, reason: postponeReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to submit postpone request.');
      } else {
        setShowPostponeModal(false);
        const formattedCurrentDate = format(new Date(booking.checkInDate), 'd MMM yyyy');
        const formattedNewDate = format(new Date(dateStr), 'd MMM yyyy');
        const msg = `Hello Punnami Southern Residency, I would like to request a reschedule for:\n\nBooking ID: ${booking.publicId}\nRoom: ${booking.roomType.name}\nCurrent Check-in: ${formattedCurrentDate}\nCurrent Check-out: ${format(new Date(booking.checkOutDate), 'd MMM yyyy')}\nRequested New Check-in: ${formattedNewDate}\nGuest: ${booking.guestName}\nReason: ${postponeReason}`;
        window.open(`https://wa.me/919542069573?text=${encodeURIComponent(msg)}`, '_blank');
        router.refresh();
      }
    } catch {
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = () => {
    window.print();
  };

  const checkInTime = formatSlotTime(booking.slotStart, '12:00 PM');
  const checkOutTime = formatSlotTime(booking.slotEnd, '11:00 AM');
  const checkInDateFormatted = format(new Date(booking.checkInDate), 'dd MMMM yyyy');
  const checkOutDateFormatted = format(new Date(booking.checkOutDate), 'dd MMMM yyyy');
  const bookingDateFormatted = format(new Date(booking.createdAt), 'dd MMM yyyy, hh:mm a');

  return (
    <div className="min-h-screen bg-stone-100 py-8 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white">
      
      {/* Dynamic CSS styles to ensure pixel-perfect background colors and grid rendering on printed sheets */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 3mm 5mm 3mm 5mm !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body {
            background: #ffffff !important;
            padding: 0 !important;
            zoom: 78% !important;
          }
          .ticket-wrap {
            border: 2px solid #78350f !important;
            box-shadow: none !important;
            border-radius: 16px !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-banner-container {
            background-color: transparent !important;
            background: none !important;
          }
          .print-banner-container img {
            max-width: 100% !important;
            width: 100% !important;
            height: auto !important;
            border-radius: 0 !important;
            margin: 0 !important;
            display: block !important;
            box-shadow: none !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          /* Grid detail items printed side by side with compact margins */
          .ticket-wrap .p-8 {
            padding: 8px 12px !important;
          }
          .ticket-wrap .p-5 {
            padding: 4px 6px !important;
          }
          .ticket-wrap .grid {
            gap: 6px !important;
          }
          .ticket-grid-summary {
            display: flex !important;
            flex-direction: row !important;
            gap: 16px !important;
            border-bottom: 1px solid #e7e5e4 !important;
          }
          .ticket-grid-summary > * {
            flex: 1 !important;
            margin-top: 0 !important;
          }
          .ticket-grid-summary h3 {
            margin-bottom: 4px !important;
            padding-bottom: 2px !important;
          }
          .ticket-grid-summary .space-y-4 > *, .ticket-grid-summary .space-y-3 > * {
            margin-top: 2px !important;
            font-size: 10.5px !important;
          }
          /* Guidelines bullet points formatting */
          .guidelines-wrap {
            padding: 8px 12px !important;
            background-color: #fafaf9 !important;
          }
          .guidelines-wrap h3 {
            margin-bottom: 4px !important;
            padding-bottom: 2px !important;
          }
          .guidelines-list li {
            font-size: 8.5px !important;
            margin-bottom: 2px !important;
            line-height: 1.2 !important;
          }
          /* Clickable map button styled beautifully on print just like ts-tours */
          .ticket-map-btn {
            display: inline-flex !important;
            background: #e0f2fe !important;
            color: #0369a1 !important;
            border: 1px solid #bae6fd !important;
            padding: 4px 8px !important;
            border-radius: 6px !important;
            font-size: 9px !important;
            font-weight: 800 !important;
            text-decoration: none !important;
            box-shadow: none !important;
            align-items: center !important;
            gap: 4px !important;
          }
          .ticket-map-btn svg {
            color: #0369a1 !important;
            width: 10px !important;
            height: 10px !important;
          }
          .footer-wrap {
            padding: 6px !important;
            font-size: 7.5px !important;
          }
          .footer-wrap img {
            height: 12px !important;
            margin-bottom: 2px !important;
            display: block !important;
          }
          .footer-wrap p {
            margin-top: 1px !important;
            font-size: 7px !important;
            line-height: 1.15 !important;
          }
          .print-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}} />

      {/* Navigation actions - Hidden during print */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
        <button
          onClick={() => router.push('/bookings')}
          className="flex items-center gap-2 text-stone-600 hover:text-stone-900 font-bold text-sm bg-white px-4 py-2.5 rounded-xl border border-stone-200 shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Bookings</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900 font-bold text-sm bg-white px-4 py-2.5 rounded-xl border border-stone-200 shadow-sm transition-all cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download Ticket</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Voucher Container */}
      <div id="stay-ticket-container" className="max-w-4xl mx-auto bg-white border border-stone-200 rounded-3xl shadow-xl overflow-hidden print:border print:border-stone-200 print:shadow-none print:rounded-3xl ticket-wrap">
        
        {/* Decorative Golden Ribbon */}
        <div className="h-2.5 bg-gradient-to-r from-amber-400 via-amber-600 to-amber-700 w-full" />

        {/* Hotel Banner Image — shown as full image, no crop */}
        <div className="w-full bg-stone-900 print-banner-container">
          <img
            src="/hotel-banner.jpg"
            alt="Punnami Southern Residency - Best Stay in Bhadrachalam"
            className="w-full block"
            style={{ display: 'block', width: '100%', height: 'auto' }}
          />
        </div>

        {/* ========================================================================= */}
        {/* STAY TICKET */}
        {/* ========================================================================= */}
        <div>
            {/* Voucher Header */}
            <div className="p-8 border-b border-stone-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-stone-50/70">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-stone-900 rounded-2xl flex items-center justify-center shrink-0 p-1 border border-stone-200 shadow-inner">
                  <img src="/logo.png" alt="PSR Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-amber-700 font-black tracking-widest text-[10px] uppercase mb-0.5">
                    <Sparkles className="h-3 w-3 text-amber-600 fill-amber-600" />
                    <span>Booking Voucher & Tax Invoice</span>
                  </div>
                  <h1 className="text-2xl font-black text-stone-900 tracking-tight leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
                    {booking.roomType.hotel.name}
                  </h1>
                  <p className="text-stone-500 text-xs mt-1.5 flex items-center gap-1 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>Punnami southern residency, Shilpinagar, 10-1-34, Ramalayam Road, beside Kodanda, Bhadrachalam, BHADRACHALAM, Telangana 507111</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0 self-stretch sm:self-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-stone-150">
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Stay Status</span>
                {booking.status === 'CONFIRMED' && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-3.5 py-1.5 text-xs font-black uppercase tracking-wider shadow-sm">
                    <ShieldCheck className="h-4 w-4 fill-emerald-100" /> Fully Confirmed
                  </span>
                )}
                {booking.status === 'PARTIAL_PAID' && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-750 rounded-full px-3.5 py-1.5 text-xs font-black uppercase tracking-wider shadow-sm">
                    <ShieldCheck className="h-4 w-4 fill-amber-100" /> Confirmed (Partly Paid)
                  </span>
                )}
                {booking.status === 'CANCEL_REQUESTED' && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-3.5 py-1.5 text-xs font-black uppercase tracking-wider shadow-sm">
                    <Calendar className="h-4 w-4 fill-amber-100 animate-pulse" /> Cancellation Pending
                  </span>
                )}
                {booking.status === 'CANCELLED' && (
                  <span className="inline-flex items-center gap-1 bg-red-50 border border-red-200 text-red-700 rounded-full px-3.5 py-1.5 text-xs font-black uppercase tracking-wider shadow-sm">
                    <XCircle className="h-4 w-4 fill-red-100" /> Cancelled
                  </span>
                )}
                {booking.status === 'POSTPONE_REQUESTED' && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-3.5 py-1.5 text-xs font-black uppercase tracking-wider shadow-sm">
                    <Calendar className="h-4 w-4 fill-amber-100 animate-pulse" /> Reschedule Pending
                  </span>
                )}
                {booking.status === 'POSTPONED' && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-3.5 py-1.5 text-xs font-black uppercase tracking-wider shadow-sm">
                    <ShieldCheck className="h-4 w-4 fill-blue-100" /> Rescheduled
                  </span>
                )}
                {booking.status === 'REFUNDED' && (
                  <span className="inline-flex items-center gap-1 bg-stone-100 border border-stone-200 text-stone-700 rounded-full px-3.5 py-1.5 text-xs font-black uppercase tracking-wider shadow-sm">
                    <XCircle className="h-4 w-4 fill-stone-200" /> Refunded
                  </span>
                )}
              </div>
            </div>

            {/* Ticket Grid info */}
            <div className="grid grid-cols-2 md:grid-cols-4 border-b border-stone-150 text-center bg-stone-50/20">
              <div className="p-5 border-r border-stone-150">
                <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 mb-1">Booking Reference</p>
                <p className="font-extrabold text-stone-850 text-sm tracking-wide">{booking.sequenceId || booking.publicId}</p>
              </div>
              <div className="p-5 border-r border-stone-150">
                <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 mb-1">Booking Date</p>
                <p className="font-semibold text-stone-750 text-xs">{bookingDateFormatted}</p>
              </div>
              <div className="p-5 border-r border-stone-150">
                <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 mb-1">Room Category</p>
                <p className="font-extrabold text-stone-850 text-xs tracking-tight">{booking.roomsBooked} x {booking.roomType.name}</p>
              </div>
              <div className="p-5">
                <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 mb-1">Duration of Stay</p>
                <p className="font-extrabold text-stone-850 text-sm">{booking.totalNights} Night{booking.totalNights > 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Check-In & Check-Out Card */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-stone-150">
              <div className="bg-stone-50/50 border border-stone-200 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-600/10 text-amber-700 rounded-xl flex items-center justify-center shrink-0 print:border print:border-amber-100">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 mb-0.5">Check-In Date & Time</p>
                  {booking.status === 'POSTPONED' && booking.originalCheckInDate ? (
                    <>
                      <p className="text-stone-400 line-through text-xs font-semibold">
                        {format(new Date(booking.originalCheckInDate), 'dd MMMM yyyy')} @ {checkInTime}
                      </p>
                      <h4 className="font-black text-amber-700 text-base leading-tight">
                        {checkInDateFormatted} @ {checkInTime}
                      </h4>
                      <p className="text-[10px] font-bold text-amber-600 mt-0.5">↑ Rescheduled Date & Time</p>
                    </>
                  ) : (
                    <h4 className="font-black text-stone-800 text-base leading-tight">
                      {checkInDateFormatted} <span className="text-amber-700 font-extrabold">@ {checkInTime}</span>
                    </h4>
                  )}
                </div>
              </div>

              <div className="bg-stone-50/50 border border-stone-200 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-600/10 text-amber-700 rounded-xl flex items-center justify-center shrink-0 print:border print:border-amber-100">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 mb-0.5">Check-Out Date & Time</p>
                  {booking.status === 'POSTPONED' && booking.originalCheckOutDate ? (
                    <>
                      <p className="text-stone-400 line-through text-xs font-semibold">
                        {format(new Date(booking.originalCheckOutDate), 'dd MMMM yyyy')} @ {checkOutTime}
                      </p>
                      <h4 className="font-black text-amber-700 text-base leading-tight">
                        {checkOutDateFormatted} @ {checkOutTime}
                      </h4>
                      <p className="text-[10px] font-bold text-amber-600 mt-0.5">↑ Rescheduled Date & Time</p>
                    </>
                  ) : (
                    <h4 className="font-black text-stone-800 text-base leading-tight">
                      {checkOutDateFormatted} <span className="text-amber-700 font-extrabold">@ {checkOutTime}</span>
                    </h4>
                  )}
                </div>
              </div>
            </div>

            {/* Office Location & Key Pickup Card */}
            <div className="mx-8 mb-4 mt-2 bg-gradient-to-br from-amber-50/70 to-stone-50 border border-amber-200 rounded-2xl p-6 shadow-sm print-card">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 print:hidden">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5.5 w-5.5 text-amber-700 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-extrabold text-stone-900 text-sm tracking-tight">
                       Required: Key Pickup & Registration Office
                    </h3>
                    <p className="text-stone-500 text-xs mt-1 font-medium leading-relaxed">
                      Before heading to your room, you must visit our primary registration office to complete guest onboarding, verify photo IDs, and collect your room keys.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="w-full bg-stone-50 border border-stone-150 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
                    <MapPin className="h-5 w-5 text-amber-700" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-stone-900 text-xs uppercase tracking-wider mb-1">Registration & Key Pickup Office Address</h4>
                    <p className="text-xs text-stone-600 font-bold leading-normal">
                      Punnami Southern Residency, Shilpinagar, 10-1-34, Ramalayam Road,<br />
                      beside Sri Kodanda Ramalayam Swamy Temple, Bhadrachalam, Telangana - 507111.
                    </p>
                    <p className="text-xs text-amber-900 font-extrabold mt-1.5 flex flex-wrap items-center gap-1">
                      <span>Contact:</span>
                      <a href="tel:+919505155166" className="text-amber-805 hover:underline">+91 95051 55166</a>
                      <span>,</span>
                      <a href="tel:+919542069573" className="text-amber-805 hover:underline">+91 95420 69573</a>
                    </p>
                  </div>
                </div>
                <a
                  href="https://maps.app.goo.gl/NsFCq6zSKECAR3xj8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-stone-900 hover:bg-stone-800 text-amber-500 hover:text-amber-400 font-extrabold text-xs px-4 py-2.5 rounded-xl border border-stone-800 transition-all shadow-sm shrink-0 flex items-center justify-center gap-1.5 cursor-pointer ticket-map-btn"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Navigate on Google Maps</span>
                </a>
              </div>
            </div>

            {/* Guest & Pricing Summary Grid */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-stone-150 print-card ticket-grid-summary">
              {/* Guest and Stay Profile */}
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-stone-500 border-b border-stone-150 pb-2 flex items-center gap-2">
                  <User className="h-4.5 w-4.5 text-stone-500" />
                  <span>Guest & Stay Information</span>
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-stone-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase font-black">Lead Passenger</p>
                      <p className="text-sm font-bold text-stone-800">{booking.guestName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-stone-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase font-black">Registered Contact</p>
                      <p className="text-sm font-bold text-stone-800">{booking.guestPhone}</p>
                    </div>
                  </div>
                  {booking.guestEmail && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-stone-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-stone-400 uppercase font-black">Email Address</p>
                        <p className="text-sm font-bold text-stone-850 break-all">{booking.guestEmail}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Ticket className="h-4 w-4 text-stone-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase font-black">Selected Category</p>
                      <p className="text-sm font-bold text-stone-850">{booking.roomType.name}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing & Ledger */}
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-stone-500 border-b border-stone-150 pb-2">
                  Booking Payment Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500 font-semibold">Room Tariff Base Total</span>
                    <span className="text-stone-800 font-bold">{formatCurrency(booking.subtotalAmount)}</span>
                  </div>
                  
                  {Number(booking.discountAmount) > 0 && (
                    <div className="flex justify-between text-sm text-green-700 font-bold">
                      <span>Special Discount Applied</span>
                      <span>-{formatCurrency(booking.discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500 font-semibold">GST Taxes & Fees</span>
                    <span className="text-stone-800 font-bold">{formatCurrency(booking.gstAmount)}</span>
                  </div>

                  {Number(booking.gatewayFee) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500 font-semibold">Payment Gateway Charges</span>
                      <span className="text-stone-800 font-bold">{formatCurrency(booking.gatewayFee)}</span>
                    </div>
                  )}

                  <div className="border-t border-stone-200 pt-3 flex justify-between items-center">
                    <span className="font-extrabold text-stone-900 text-sm">Paid Total Amount</span>
                    <span className="font-black text-amber-700 text-xl">{formatCurrency(booking.totalAmount)}</span>
                  </div>

                   {booking.completedPayments && booking.completedPayments.length > 0 ? (
                    <div className="border-t border-stone-150 pt-3 mt-3 space-y-2">
                      <p className="text-[10px] text-stone-400 font-black uppercase tracking-wider">Completed Transactions Log</p>
                      <div className="space-y-2">
                        {booking.completedPayments.map((p, idx) => (
                          <div key={p.id || idx} className="bg-stone-50/70 border border-stone-200 rounded-xl p-3 flex flex-col gap-1 text-[11px] font-bold text-stone-750">
                            <div className="flex justify-between text-stone-850">
                              <span>Payment #{idx + 1} ({formatCurrency(p.amount)})</span>
                              <span className="text-emerald-700 font-extrabold uppercase text-[9px]">✓ Success</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-2 text-[10px] text-stone-500 font-medium">
                              <div>Merchant Ref:</div>
                              <div className="text-stone-750 text-right font-mono truncate select-all">{p.merchantTransactionId}</div>
                              <div>Gateway Ref:</div>
                              <div className="text-stone-750 text-right font-mono truncate select-all">{p.gatewayTransactionId || '—'}</div>
                              <div>Date:</div>
                              <div className="text-stone-700 text-right">{format(new Date(p.createdAt), 'dd MMM yyyy, hh:mm a')}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : booking.transactionId ? (
                    <div className="flex justify-between text-[11px] pt-1">
                      <span className="text-stone-500 font-bold uppercase tracking-wider">Transaction ID</span>
                      <span className="text-stone-750 font-mono font-bold">{booking.transactionId}</span>
                    </div>
                  ) : null}

                  {booking.status === 'PARTIAL_PAID' && (
                    <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 text-center mt-4 space-y-1">
                      <p className="text-[10px] text-amber-700 font-black uppercase tracking-wider">Payment Status: PARTIALLY PAID</p>
                      <p className="text-[11px] text-stone-750 font-bold">
                        Paid Advance: {formatCurrency(booking.paidAmount ?? 0)} ({booking.paymentPercentage}% of Total)
                      </p>
                      <p className="text-[11px] text-amber-950 font-extrabold bg-amber-100/50 py-1 rounded-lg">
                        Due at Check-In: {formatCurrency(booking.totalAmount - (booking.paidAmount ?? 0))}
                      </p>
                    </div>
                  )}

                  {['CONFIRMED', 'CANCEL_REQUESTED', 'POSTPONE_REQUESTED'].includes(booking.status) && booking.status !== 'PARTIAL_PAID' && (
                    <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 text-center mt-4">
                      <p className="text-[10px] text-emerald-700 font-black uppercase tracking-wider">Payment Status: PAID IN FULL</p>
                      <p className="text-[9px] text-emerald-600 mt-0.5 font-medium">Verified through PhonePe gateway transaction check.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Guest details if passengers array exists */}
            {booking.passengers && booking.passengers.length > 0 && (
              <div className="p-8 border-b border-stone-150 print-card">
                <h3 className="text-xs font-black uppercase tracking-widest text-stone-500 border-b border-stone-150 pb-2 mb-4 flex items-center gap-2">
                  <Users className="h-4.5 w-4.5 text-stone-500" />
                  <span>Verified Guest Manifest</span>
                </h3>
                <div className="overflow-x-auto rounded-xl border border-stone-200 bg-stone-50/30">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-stone-100 border-b border-stone-200 font-extrabold text-stone-750">
                        <th className="p-3">Sr. No.</th>
                        <th className="p-3">Guest Name</th>
                        <th className="p-3 text-center">Age</th>
                        <th className="p-3">Gender</th>
                        <th className="p-3">Aadhaar (Masked)</th>
                        <th className="p-3">Contact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-150">
                      {booking.passengers.map((p, idx) => {
                        const isChild = idx >= booking.adultCount;
                        let maskedAadhaar = 'N/A';
                        if (p.aadhaar && p.aadhaar.trim().length === 12) {
                          maskedAadhaar = `XXXX-XXXX-${p.aadhaar.slice(-4)}`;
                        } else if (isChild) {
                          maskedAadhaar = 'Not Required';
                        }
                        return (
                          <tr key={idx} className="font-semibold text-stone-750 hover:bg-stone-50/50">
                            <td className="p-3 font-bold text-stone-400">{idx + 1}</td>
                            <td className="p-3 text-stone-900 font-bold">
                              {p.fullName}
                              {idx === 0 && (
                                <span className="ml-1.5 rounded bg-amber-100 px-1 py-0.5 text-[9px] text-amber-700 uppercase font-bold">Lead</span>
                              )}
                            </td>
                            <td className="p-3 text-center">{p.age} Yrs</td>
                            <td className="p-3 capitalize">{p.gender?.toLowerCase() || 'N/A'}</td>
                            <td className="p-3 font-mono text-stone-600">{maskedAadhaar}</td>
                            <td className="p-3 text-stone-600">{p.phone || (idx === 0 ? booking.guestPhone : '—')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

        {/* cancellation message summary card if cancelled */}
        {['CANCELLED', 'REFUNDED'].includes(booking.status) && (
          <div className="m-8 p-5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4 print-card">
            <XCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-red-800 text-sm">Stay Cancellation Notice</h4>
              <p className="text-xs text-stone-600 leading-normal mt-1">
                This reservation has been cancelled. In accordance with stay terms, a 100% cancellation charge applies.
                {booking.cancellationFee !== undefined && (
                  <span className="block mt-2 font-bold text-red-950">
                    Cancellation Charge: {formatCurrency(booking.cancellationFee)} | Refund Amount: {formatCurrency(booking.refundAmount || 0)}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* rescheduling notice card if rescheduled */}
        {booking.status === 'POSTPONED' && (
          <div className="m-8 p-5 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-4 print-card">
            <ShieldCheck className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-blue-800 text-sm">Rescheduled Stay Notice</h4>
              <p className="text-xs text-stone-600 leading-normal mt-1">
                Your check-in and check-out dates have been updated in our hotel reservation system. The revised stay coordinates are officially confirmed above.
              </p>
            </div>
          </div>
        )}

        {/* Stays Cancellation / Modification Actions Section - Hidden during print */}
        {['CONFIRMED', 'PARTIAL_PAID', 'CANCEL_REQUESTED', 'POSTPONE_REQUESTED'].includes(booking.status) && (
          <div className="p-8 border-b border-stone-150 bg-stone-50/30 print:hidden">
            <h3 className="text-xs font-black uppercase tracking-widest text-stone-500 border-b border-stone-150 pb-2 mb-4 flex items-center gap-2">
              <CalendarClock className="h-4.5 w-4.5 text-stone-500" />
              <span>Modify Stay or Request Cancellation</span>
            </h3>
            
            {['CONFIRMED', 'PARTIAL_PAID'].includes(booking.status) ? (
              <div className="flex flex-col gap-4">
                {booking.status === 'PARTIAL_PAID' && (
                  <button
                    onClick={handlePayBalance}
                    disabled={payingBalance}
                    className="w-full bg-[#5f259f] hover:bg-[#4a1d7d] disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-black rounded-2xl py-4 px-6 text-sm transition-all shadow-lg flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.98]"
                  >
                    {payingBalance ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Redirecting to PhonePe PG...</span>
                      </>
                    ) : (
                      <>
                        <div className="bg-white p-0.5 rounded-full flex items-center justify-center shrink-0">
                          <svg fill="#5f259f" role="img" viewBox="0 0 24 24" className="h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10.206 9.941h2.949v4.692c-.402.201-.938.268-1.34.268-1.072 0-1.609-.536-1.609-1.743V9.941zm13.47 4.816c-1.523 6.449-7.985 10.442-14.433 8.919C2.794 22.154-1.199 15.691.324 9.243 1.847 2.794 8.309-1.199 14.757.324c6.449 1.523 10.442 7.985 8.919 14.433zm-6.231-5.888a.887.887 0 0 0-.871-.871h-1.609l-3.686-4.222c-.335-.402-.871-.536-1.407-.402l-1.274.401c-.201.067-.268.335-.134.469l4.021 3.82H6.386c-.201 0-.335.134-.335.335v.67c0 .469.402.871.871.871h.938v3.217c0 2.413 1.273 3.82 3.418 3.82.67 0 1.206-.067 1.877-.335v2.145c0 .603.469 1.072 1.072 1.072h.938a.432.432 0 0 0 .402-.402V9.874h1.542c.201 0 .335-.134.335-.335v-.67z"/>
                          </svg>
                        </div>
                        <span className="text-center">Pay Remaining Balance Online (₹{(booking.totalAmount - (booking.paidAmount || 0)).toLocaleString('en-IN')}) via PhonePe</span>
                      </>
                    )}
                  </button>
                )}
                
                {canRequestChanges ? (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="flex-1 bg-white hover:bg-red-50 text-red-700 hover:text-red-850 border-2 border-red-200 hover:border-red-300 font-extrabold text-sm px-6 py-3.5 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <XCircle className="h-4.5 w-4.5" />
                      <span>Request Cancellation</span>
                    </button>
                    <button
                      onClick={() => setShowPostponeModal(true)}
                      className="flex-1 bg-white hover:bg-amber-50 text-amber-700 hover:text-amber-850 border-2 border-amber-200 hover:border-amber-300 font-extrabold text-sm px-6 py-3.5 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <RefreshCw className="h-4.5 w-4.5" />
                      <span>Reschedule Booking (Postpone)</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 text-xs shadow-sm">
                    <p className="font-extrabold text-stone-700 mb-1.5 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-stone-500" /> Rescheduling & Cancellation Unavailable
                    </p>
                    <p className="text-stone-500 font-semibold leading-relaxed">
                      {daysUntilCheckIn < 0
                        ? 'Your stay has already begun or passed.'
                        : `Check-in is in ${daysUntilCheckIn} day(s). Changes can only be requested 4 or more days before check-in.`}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="font-extrabold text-stone-900 text-sm">
                    {booking.status === 'CANCEL_REQUESTED' ? 'Cancellation Request Pending' : 'Reschedule Request Pending'}
                  </p>
                  <p className="text-stone-500 text-xs mt-1">
                    Your request has been saved in our system and is awaiting admin approval.
                  </p>
                </div>
                <a
                  href={`https://wa.me/919542069573?text=Hello%20Punnami%20Hotels%2C%20I%20have%20submitted%20a%20${booking.status === 'CANCEL_REQUESTED' ? 'cancellation' : 'reschedule'}%20request%20for%20my%20booking%20${booking.publicId}.%20Please%20verify%20and%20approve%20it.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl flex items-center gap-1.5 transition-all shadow-md shrink-0"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Follow Up on WhatsApp</span>
                </a>
              </div>
            )}
            {/* Google Review Call to Action Card - Hidden during print */}
            <div className="mt-6 p-6 bg-gradient-to-br from-amber-50 to-stone-50 border border-amber-250/70 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 print:hidden shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100/50 rounded-2xl flex items-center justify-center shrink-0 border border-amber-200">
                  <Star className="h-6 w-6 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-900 text-sm">Loved Your Stay Experience?</h4>
                  <p className="text-xs text-stone-500 mt-1 font-medium leading-relaxed max-w-lg">
                    We strive to deliver the best hospitality at Punnami Southern Residency. If you liked our service, please spare a minute to write us a Google review!
                  </p>
                </div>
              </div>
              <a
                href="https://g.page/r/CbMysAE0rqDYEAI/review"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl flex items-center gap-1.5 transition-all shadow-md shrink-0 active:scale-[0.98] cursor-pointer"
              >
                <Star className="h-4 w-4 fill-white" />
                <span>Write a Google Review</span>
              </a>
            </div>
          </div>
        )}

        {/* Boarding Pass Tear-off Line */}
        <div className="relative my-2 print:hidden print-card">
          <div className="absolute left-0 right-0 border-t-2 border-dashed border-stone-300 top-1/2 -translate-y-1/2" />
          <div className="relative flex justify-between px-8">
            <div className="w-6 h-6 bg-stone-100 rounded-full border border-stone-200 -ml-11 print:bg-white print:border-none" />
            <span className="bg-white px-4 text-[10px] font-bold text-stone-400 tracking-widest uppercase relative z-10 print:hidden">Terms & Guidelines Stub</span>
            <div className="w-6 h-6 bg-stone-100 rounded-full border border-stone-200 -mr-11 print:bg-white print:border-none" />
          </div>
        </div>

        {/* Stay Guidelines / Policies */}
        <div className="p-8 bg-stone-50/50 print-card guidelines-wrap">
          <h3 className="text-xs font-black uppercase tracking-widest text-stone-500 border-b border-stone-150 pb-2 mb-4">Check-in Guidelines & Policies</h3>
          <ul className="space-y-3 text-xs text-stone-600 leading-relaxed list-disc pl-4 font-medium guidelines-list">
            <li><strong>Photo Identification:</strong> A valid physical photo ID (Aadhar Card, Passport, Driving License or Voter ID) must be presented by all adult guests at the time of check-in.</li>
            <li><strong>Occupancy Limits:</strong> Check-in is capped based on the standard capacity of the room (max {booking.roomType.maxAdults} adults and {booking.roomType.maxChildren} children per room category).</li>
            <li><strong>Check-in & Check-out:</strong> Standard Check-In is at 12:00 PM. Check-Out is at 11:00 AM. Early check-in or late check-out is subject to availability and may incur custom hotel charges.</li>
            <li><strong>Hotel Booking Ticket:</strong> Please carry a digital copy or printed slip of this hotel stay ticket to present to check-in reception staff.</li>
          </ul>
        </div>

        {/* Voucher Footer */}
        <div className="bg-stone-900 text-stone-400 p-5 text-center text-xs border-t border-stone-800 print-card footer-wrap flex flex-col items-center gap-1.5">
          <img src="/logo.png" alt="PSR Logo" className="h-6 w-auto object-contain block mx-auto mb-0.5" />
          <p className="font-bold text-stone-300">Thank you for choosing Punnami Southern Residency Bhadrachalam</p>
          <p className="text-[10px] mt-0.5 text-stone-500">For support, call us at +91 95051 55166, +91 95420 69573 or email info@punnamihotels.com. This is an officially generated digital hotel booking ticket.</p>
        </div>

      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="bg-stone-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span>Request Booking Cancellation</span>
              </h3>
              <button onClick={() => { setShowCancelModal(false); setErrorMsg(''); }} className="p-1 hover:bg-stone-800 rounded-lg text-white/70 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCancelSubmit} className="p-6 space-y-4">
              <p className="text-xs text-stone-500 leading-relaxed bg-stone-50 border border-stone-200 p-3.5 rounded-xl font-medium">
                <strong>Cancellation Policy:</strong> Cancellations must be requested 4 days or more before check-in. Room bookings are non-refundable (cancellation incurs a 100% charge).
              </p>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-stone-400 mb-1.5">Reason for Cancellation</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  placeholder="Describe the reason for cancellation (min 5 characters)..."
                  className="w-full p-3 border-2 border-stone-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 font-medium"
                  required
                />
              </div>

              {errorMsg && <p className="text-xs text-red-500 font-bold">{errorMsg}</p>}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCancelModal(false); setErrorMsg(''); }}
                  className="px-4 py-2 border-2 border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-black rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-5 py-2 text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  <span>Submit & Open WhatsApp</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Postpone Modal */}
      {showPostponeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-150 relative overflow-visible">
            <div className="bg-stone-900 px-6 py-4 text-white flex items-center justify-between rounded-t-[24px]">
              <h3 className="text-base font-bold flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-amber-500" />
                <span>Reschedule Booking</span>
              </h3>
              <button onClick={() => { setShowPostponeModal(false); setErrorMsg(''); }} className="p-1 hover:bg-stone-800 rounded-lg text-white/70 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handlePostponeSubmit} className="p-6 space-y-4">
              <p className="text-xs text-stone-500 leading-relaxed bg-stone-50 border border-stone-200 p-3.5 rounded-xl font-medium">
                <strong>Reschedule Policy:</strong> Postponement requests must be submitted 7 days or more before check-in. Subject to room availability on proposed dates.
              </p>

              <div>
                <CustomDatePicker
                  selected={postponeDate}
                  onChange={(date) => setPostponeDate(date)}
                  minDate={(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return today;
                  })()}
                  label="Proposed New Check-In Date"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-stone-400 mb-1.5">Reason for Rescheduling</label>
                <textarea
                  value={postponeReason}
                  onChange={(e) => setPostponeReason(e.target.value)}
                  rows={3}
                  placeholder="Describe the reason for rescheduling (min 5 characters)..."
                  className="w-full p-3 border-2 border-stone-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 font-medium"
                  required
                />
              </div>

              {errorMsg && <p className="text-xs text-red-500 font-bold">{errorMsg}</p>}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setShowPostponeModal(false); setErrorMsg(''); }}
                  className="px-4 py-2 border-2 border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-black rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white px-5 py-2 text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  <span>Submit & Open WhatsApp</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
