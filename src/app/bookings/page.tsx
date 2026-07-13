'use client';

import { useState, useRef } from 'react';
import {
  Search, Ticket, Calendar, Clock, Users, MapPin,
  CheckCircle2, AlertCircle, XCircle, Loader2,
  CreditCard, Printer, Phone, Mail, MessageCircle,
  RefreshCw, IndianRupee, ShieldCheck, ArrowRight,
  ChevronRight, Hotel
} from 'lucide-react';
import { format } from 'date-fns';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BookingLookup {
  publicId: string;
  sequenceId: string | null;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  totalNights: number;
  roomsBooked: number;
  slotStart: string;
  slotEnd: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  adultCount: number;
  childCount: number;
  passengers: any[];
  subtotalAmount: number;
  gstAmount: number;
  gatewayFee: number;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  paymentPercentage: number;
  cancellationPolicy: string;
  canRequestChanges: boolean;
  daysUntilCheckIn: number;
  postponeReason: string | null;
  postponeNewDate: string | null;
  cancellationReason: string | null;
  cancellationFee: number | null;
  refundAmount: number | null;
  createdAt: string;
  roomType: { name: string; coverImageUrl: string | null };
  hotel: {
    name: string;
    address: string;
    checkInTime: string;
    checkOutTime: string;
    phone: string;
    email: string;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ADMIN_WHATSAPP = '919542069573';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string) {
  return format(new Date(iso), 'd MMM yyyy');
}

function getStatusConfig(status: string) {
  switch (status.toUpperCase()) {
    case 'CONFIRMED':
      return { label: 'Confirmed', color: 'bg-emerald-500', text: 'text-emerald-50', ring: 'ring-emerald-400', icon: CheckCircle2 };
    case 'PARTIAL_PAID':
      return { label: 'Advance Paid', color: 'bg-amber-500', text: 'text-amber-50', ring: 'ring-amber-400', icon: Clock };
    case 'PENDING':
    case 'PENDING_PROOF':
      return { label: 'Pending Payment', color: 'bg-blue-500', text: 'text-blue-50', ring: 'ring-blue-400', icon: AlertCircle };
    case 'CANCEL_REQUESTED':
      return { label: 'Cancel Requested', color: 'bg-orange-500', text: 'text-orange-50', ring: 'ring-orange-400', icon: RefreshCw };
    case 'POSTPONE_REQUESTED':
      return { label: 'Reschedule Requested', color: 'bg-purple-500', text: 'text-purple-50', ring: 'ring-purple-400', icon: Calendar };
    case 'CANCELLED':
      return { label: 'Cancelled', color: 'bg-red-600', text: 'text-red-50', ring: 'ring-red-500', icon: XCircle };
    case 'REFUNDED':
      return { label: 'Refunded', color: 'bg-slate-500', text: 'text-slate-50', ring: 'ring-slate-400', icon: CheckCircle2 };
    default:
      return { label: status, color: 'bg-stone-500', text: 'text-stone-50', ring: 'ring-stone-400', icon: Ticket };
  }
}

// ── Cancel Modal ───────────────────────────────────────────────────────────────

function CancelModal({
  booking,
  onClose,
  onSuccess,
}: {
  booking: BookingLookup;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFullyPaid = booking.paymentPercentage >= 100;
  const refundInfo = isFullyPaid
    ? '50% of the total amount will be refunded after admin approval.'
    : 'Your 50% advance payment is non-refundable.';

  const handleSubmit = async () => {
    if (reason.trim().length < 5) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/bookings/${booking.publicId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');

      // Open WhatsApp simultaneously — exact ts-tours pattern
      const displayId = booking.sequenceId || booking.publicId;
      const msg = `Hello Punnami Southern Residency, I would like to request a cancellation for:\n\nBooking ID: ${displayId}\nRoom: ${booking.roomType.name}\nCheck-in: ${formatDate(booking.checkInDate)}\nCheck-out: ${formatDate(booking.checkOutDate)}\nTotal: ${formatINR(booking.totalAmount)}\nPayment Type: ${isFullyPaid ? '100% Full Payment' : '50% Advance'}\nRefund Expected: ${isFullyPaid ? formatINR(booking.totalAmount * 0.5) : 'None (non-refundable advance)'}\nReason: ${reason}`;
      window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit cancellation request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="text-lg font-black text-stone-900">Request Cancellation</h3>
        </div>

        <p className="text-xs text-stone-500 leading-relaxed mb-4">
          Cancellation request for <span className="font-bold text-stone-700">{booking.roomType.name}</span> — Check-in {formatDate(booking.checkInDate)}
        </p>

        {/* Policy notice */}
        <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed mb-4 ${isFullyPaid ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
          <span className="font-extrabold flex items-center gap-1.5 mb-1.5">
            <AlertCircle className="h-4 w-4 shrink-0" /> Cancellation Policy
          </span>
          <ul className="space-y-1 font-semibold">
            {isFullyPaid ? (
              <>
                <li>✓ 50% refund will be processed after admin approval</li>
                <li>✓ Refund credited to original payment source within 5–7 business days</li>
                <li>⚠ Only valid if check-in is more than 4 days away</li>
              </>
            ) : (
              <>
                <li>✗ 50% advance is <strong>non-refundable</strong></li>
                <li>⚠ No refund will be processed for advance payments</li>
              </>
            )}
          </ul>
          <div className={`mt-2 text-[11px] font-black px-2 py-1.5 rounded-xl border ${isFullyPaid ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-red-100 border-red-300 text-red-800'}`}>
            {refundInfo}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5">
            Reason for Cancellation *
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Please state the reason for your cancellation request (minimum 5 characters)..."
            rows={3}
            className="w-full rounded-2xl border border-stone-200 p-3.5 text-xs text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all resize-none"
          />
        </div>

        <div className="p-3 bg-green-50 border border-green-200 rounded-2xl mb-4 text-xs text-green-800">
          <div className="flex items-center gap-2 font-bold mb-1">
            <MessageCircle className="h-3.5 w-3.5" /> After Submitting
          </div>
          <p className="font-semibold leading-relaxed">Your request will be recorded and WhatsApp will open to notify our admin instantly.</p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white border border-stone-200 rounded-2xl text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Go Back
          </button>
          <button
            type="button"
            disabled={submitting || reason.trim().length < 5}
            onClick={handleSubmit}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-2xl text-xs font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
              : <><MessageCircle className="h-4 w-4" /> Submit & WhatsApp Admin</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reschedule Modal ──────────────────────────────────────────────────────────

function RescheduleModal({
  booking,
  onClose,
  onSuccess,
}: {
  booking: BookingLookup;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [newDate, setNewDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  const handleSubmit = async () => {
    if (!newDate || reason.trim().length < 5) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/bookings/${booking.publicId}/postpone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newDate, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');

      // Open WhatsApp simultaneously — exact ts-tours pattern
      const formattedCurrentDate = formatDate(booking.checkInDate);
      const formattedNewDate = formatDate(newDate);
      const msg = `Hello Punnami Southern Residency, I would like to request a reschedule for:\n\nBooking ID: ${booking.publicId}\nRoom: ${booking.roomType.name}\nCurrent Check-in: ${formattedCurrentDate}\nCurrent Check-out: ${formatDate(booking.checkOutDate)}\nRequested New Check-in: ${formattedNewDate}\nGuest: ${booking.guestName}\nReason: ${reason}`;
      window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit reschedule request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center">
            <Calendar className="h-5 w-5 text-indigo-600" />
          </div>
          <h3 className="text-lg font-black text-stone-900">Request Reschedule</h3>
        </div>

        <p className="text-xs text-stone-500 leading-relaxed mb-4">
          Reschedule <span className="font-bold text-stone-700">{booking.roomType.name}</span> — currently checked in {formatDate(booking.checkInDate)}
        </p>

        <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-850 text-xs leading-relaxed mb-4">
          <span className="font-extrabold flex items-center gap-1.5 mb-1.5 text-indigo-900">
            <Calendar className="h-4 w-4 shrink-0" /> Reschedule Terms
          </span>
          <ul className="space-y-1 font-semibold text-indigo-800">
            <li>✓ Subject to room availability on requested date</li>
            <li>✓ Admin will confirm new dates upon approval</li>
            <li>⚠ Must be requested 4+ days before check-in</li>
          </ul>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5">
              Proposed New Check-in Date *
            </label>
            <input
              type="date"
              value={newDate}
              min={minDate}
              onChange={e => setNewDate(e.target.value)}
              className="w-full rounded-2xl border border-stone-200 p-3.5 text-xs text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all bg-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5">
              Reason for Reschedule *
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Please state the reason for your reschedule request (minimum 5 characters)..."
              rows={3}
              className="w-full rounded-2xl border border-stone-200 p-3.5 text-xs text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all resize-none"
            />
          </div>
        </div>

        <div className="p-3 bg-green-50 border border-green-200 rounded-2xl mb-4 text-xs text-green-800">
          <div className="flex items-center gap-2 font-bold mb-1">
            <MessageCircle className="h-3.5 w-3.5" /> After Submitting
          </div>
          <p className="font-semibold leading-relaxed">Your request will be recorded and WhatsApp will open to notify our admin instantly.</p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white border border-stone-200 rounded-2xl text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Go Back
          </button>
          <button
            type="button"
            disabled={submitting || !newDate || reason.trim().length < 5}
            onClick={handleSubmit}
            className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
              : <><MessageCircle className="h-4 w-4" /> Submit & WhatsApp Admin</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Booking Ticket Component ─────────────────────────────────────────────

function BookingTicket({ booking, onRefresh }: { booking: BookingLookup; onRefresh: () => void }) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [payingBalance, setPayingBalance] = useState(false);

  const statusCfg = getStatusConfig(booking.status);
  const StatusIcon = statusCfg.icon;
  const isFullyPaid = booking.paymentPercentage >= 100;
  const progressPct = Math.min(100, Math.round((booking.paidAmount / booking.totalAmount) * 100));
  const isActive = ['CONFIRMED', 'PARTIAL_PAID'].includes(booking.status);
  const hasPendingRequest = ['CANCEL_REQUESTED', 'POSTPONE_REQUESTED'].includes(booking.status);

  const handlePayBalance = async () => {
    setPayingBalance(true);
    try {
      const res = await fetch('/api/v1/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.publicId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to initiate payment. Please try again.');
        setPayingBalance(false);
      }
    } catch {
      alert('Payment initiation failed. Please try again.');
      setPayingBalance(false);
    }
  };

  return (
    <>
      {/* ── Ticket Card ─────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header strip */}
        <div className="bg-stone-950 rounded-3xl p-5 sm:p-7 text-white relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-amber-500/10 pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-amber-500/5 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Hotel className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                    {booking.hotel.name}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {booking.roomType.name}
                </h2>
                <p className="text-stone-400 text-xs font-semibold mt-1 flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" />
                  {booking.hotel.address}
                </p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ring-1 ${statusCfg.color} ${statusCfg.text} ${statusCfg.ring}`}>
                <StatusIcon className="h-3.5 w-3.5" />
                {statusCfg.label}
              </div>
            </div>

            {/* Dates row */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-8">
              <div>
                <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-0.5">Check-in</p>
                <p className="text-base font-black text-white">{formatDate(booking.checkInDate)}</p>
                <p className="text-xs text-amber-400 font-semibold">{booking.hotel.checkInTime || booking.slotStart}</p>
              </div>
              <div className="text-stone-600">
                <ChevronRight className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-0.5">Check-out</p>
                <p className="text-base font-black text-white">{formatDate(booking.checkOutDate)}</p>
                <p className="text-xs text-amber-400 font-semibold">{booking.hotel.checkOutTime || booking.slotEnd}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-0.5">Duration</p>
                <p className="text-base font-black text-white">{booking.totalNights} {booking.totalNights === 1 ? 'Night' : 'Nights'}</p>
                <p className="text-xs text-stone-400 font-semibold">{booking.roomsBooked} Room{booking.roomsBooked > 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Booking ID */}
            <div className="mt-4 pt-4 border-t border-stone-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Booking ID</p>
                <p className="text-sm font-black text-amber-400 font-mono tracking-widest">{booking.sequenceId || booking.publicId}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Booked On</p>
                <p className="text-xs font-semibold text-stone-300">{formatDate(booking.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts for pending requests */}
        {booking.status === 'CANCEL_REQUESTED' && (
          <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-orange-900 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-orange-600 mt-0.5" />
              <div>
                <p className="font-extrabold">Cancellation Request Pending</p>
                <p className="text-[11px] text-orange-700 font-semibold mt-1 leading-relaxed">
                  Your cancellation request has been submitted via WhatsApp. Our admin is reviewing it and will process it based on the policy. Please check your WhatsApp for updates.
                </p>
                {booking.cancellationReason && (
                  <p className="text-[11px] text-orange-600 italic mt-1">Reason: "{booking.cancellationReason}"</p>
                )}
              </div>
            </div>
          </div>
        )}

        {booking.status === 'POSTPONE_REQUESTED' && (
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs">
            <div className="flex items-start gap-2.5">
              <Calendar className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
              <div>
                <p className="font-extrabold text-indigo-900">Reschedule Request Pending</p>
                {booking.postponeNewDate && (
                  <p className="text-[11px] text-indigo-700 font-semibold mt-1 leading-relaxed">
                    Requested new check-in: <strong className="font-black">{formatDate(booking.postponeNewDate)}</strong>
                  </p>
                )}
                {booking.postponeReason && (
                  <p className="text-[11px] text-indigo-600 italic mt-1">Reason: "{booking.postponeReason}"</p>
                )}
                <p className="text-[11px] text-indigo-700 font-semibold mt-1">Your WhatsApp message has been sent to admin for approval.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Main ticket info ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Guest & Passengers */}
            <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm">
              <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Users className="h-4 w-4" /> Guest Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-0.5">Lead Guest</p>
                  <p className="font-black text-stone-800">{booking.guestName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-0.5">Phone</p>
                  <p className="font-bold text-stone-700">{booking.guestPhone}</p>
                </div>
                {booking.guestEmail && (
                  <div className="sm:col-span-2">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-0.5">Email</p>
                    <p className="font-bold text-stone-700">{booking.guestEmail}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-0.5">Guests</p>
                  <p className="font-bold text-stone-700">
                    {booking.adultCount} Adult{booking.adultCount !== 1 ? 's' : ''}
                    {booking.childCount > 0 && `, ${booking.childCount} Child${booking.childCount !== 1 ? 'ren' : ''}`}
                  </p>
                </div>
              </div>

              {/* Passengers */}
              {booking.passengers && booking.passengers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Passenger Manifest</p>
                  {(booking.passengers as any[]).map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-100">
                      <div className="w-9 h-9 rounded-xl bg-stone-200 text-stone-600 flex items-center justify-center font-black text-xs shrink-0">
                        {(p.fullName || p.full_name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-stone-800 text-xs truncate">
                          {p.fullName || p.full_name}
                          {i === 0 && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-extrabold uppercase ml-1.5">Lead</span>}
                        </p>
                        <p className="text-[10px] text-stone-400 font-semibold mt-0.5">
                          Age {p.age} {p.gender ? `• ${p.gender}` : ''}
                        </p>
                      </div>
                      {p.aadhaar && (
                        <p className="text-[10px] text-stone-400 font-mono shrink-0">
                          ••••{p.aadhaar.slice(-4)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Check-in information */}
            <div className="bg-stone-50 rounded-3xl p-5 border border-stone-100">
              <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Property Details
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2 text-stone-600 font-semibold">
                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
                  <span>{booking.hotel.address}</span>
                </div>
                <div className="flex items-center gap-2 text-stone-600 font-semibold">
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                  <span>Check-in from {booking.hotel.checkInTime || booking.slotStart} · Check-out by {booking.hotel.checkOutTime || booking.slotEnd}</span>
                </div>
                {booking.hotel.phone && (
                  <a href={`tel:${booking.hotel.phone}`} className="flex items-center gap-2 text-amber-700 font-semibold hover:underline">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{booking.hotel.phone}</span>
                  </a>
                )}
                {booking.hotel.email && (
                  <a href={`mailto:${booking.hotel.email}`} className="flex items-center gap-2 text-amber-700 font-semibold hover:underline">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{booking.hotel.email}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Cancel / Reschedule buttons */}
            {isActive && !hasPendingRequest && (
              <div className="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm">
                <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest mb-1">Manage Booking</h3>
                {booking.canRequestChanges ? (
                  <>
                    <p className="text-[11px] text-stone-400 font-semibold mb-4 leading-relaxed">
                      You can request changes since check-in is <strong className="text-stone-600">{booking.daysUntilCheckIn} days</strong> away (must be 4+ days).
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setShowRescheduleModal(true)}
                        className="flex items-center justify-center gap-2 p-3 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-2xl text-xs font-bold hover:bg-indigo-100 transition-colors"
                      >
                        <Calendar className="h-4 w-4" />
                        Reschedule
                      </button>
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="flex items-center justify-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold hover:bg-red-100 transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                        Cancel Booking
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs">
                    <p className="font-bold text-stone-600 mb-1 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-stone-400" /> Changes Unavailable
                    </p>
                    <p className="text-stone-500 font-semibold leading-relaxed">
                      {booking.daysUntilCheckIn < 0
                        ? 'Your stay has already begun or passed.'
                        : `Check-in is in ${booking.daysUntilCheckIn} day(s). Changes can only be requested 4+ days before check-in.`}
                    </p>
                    <a
                      href={`https://wa.me/${ADMIN_WHATSAPP}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-green-700 font-bold hover:underline"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Contact Admin on WhatsApp
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Sidebar — Payment Summary ── */}
          <div className="space-y-5">
            <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm">
              <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Payment Summary
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-stone-500 font-semibold">
                  <span>Room Tariff</span>
                  <span className="font-bold text-stone-700">{formatINR(booking.subtotalAmount)}</span>
                </div>
                <div className="flex justify-between text-stone-500 font-semibold">
                  <span>GST & Taxes</span>
                  <span className="font-bold text-stone-700">{formatINR(booking.gstAmount)}</span>
                </div>
                {booking.gatewayFee > 0 && (
                  <div className="flex justify-between text-stone-500 font-semibold">
                    <span>Gateway Charges</span>
                    <span className="font-bold text-stone-700">{formatINR(booking.gatewayFee)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2.5 border-t border-stone-100">
                  <span className="font-extrabold text-stone-800 text-sm">Grand Total</span>
                  <span className="text-base font-black text-stone-900">{formatINR(booking.totalAmount)}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-5 pt-4 border-t border-stone-100">
                <div className="flex justify-between text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">
                  <span>Payment Progress</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${progressPct}%`,
                      background: progressPct >= 100
                        ? 'linear-gradient(90deg, #10b981, #059669)'
                        : 'linear-gradient(90deg, #f59e0b, #d97706)',
                    }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="bg-emerald-50 rounded-xl p-2.5 text-center border border-emerald-100">
                    <p className="text-[10px] text-emerald-600 font-black uppercase">Paid</p>
                    <p className="font-black text-emerald-800 text-xs mt-0.5">{formatINR(booking.paidAmount)}</p>
                  </div>
                  <div className={`rounded-xl p-2.5 text-center border ${booking.remainingBalance > 0 ? 'bg-amber-50 border-amber-100' : 'bg-stone-50 border-stone-100'}`}>
                    <p className={`text-[10px] font-black uppercase ${booking.remainingBalance > 0 ? 'text-amber-600' : 'text-stone-400'}`}>Balance</p>
                    <p className={`font-black text-xs mt-0.5 ${booking.remainingBalance > 0 ? 'text-amber-800' : 'text-stone-400'}`}>
                      {booking.remainingBalance > 0 ? formatINR(booking.remainingBalance) : 'Nil'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pay remaining button */}
              {booking.remainingBalance > 0 && isActive && !hasPendingRequest && (
                <div className="mt-4 pt-4 border-t border-stone-100">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest text-center mb-3">
                    Pay Remaining Balance
                  </p>
                  <button
                    onClick={handlePayBalance}
                    disabled={payingBalance}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#5f259f] text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-[#4a1d7d] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-purple-900/20"
                  >
                    {payingBalance ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Opening PhonePe...</>
                    ) : (
                      <>
                        <div className="bg-white p-0.5 rounded-full flex items-center justify-center">
                          <svg fill="#5f259f" role="img" viewBox="0 0 24 24" className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10.206 9.941h2.949v4.692c-.402.201-.938.268-1.34.268-1.072 0-1.609-.536-1.609-1.743V9.941zm13.47 4.816c-1.523 6.449-7.985 10.442-14.433 8.919C2.794 22.154-1.199 15.691.324 9.243 1.847 2.794 8.309-1.199 14.757.324c6.449 1.523 10.442 7.985 8.919 14.433zm-6.231-5.888a.887.887 0 0 0-.871-.871h-1.609l-3.686-4.222c-.335-.402-.871-.536-1.407-.402l-1.274.401c-.201.067-.268.335-.134.469l4.021 3.82H6.386c-.201 0-.335.134-.335.335v.67c0 .469.402.871.871.871h.938v3.217c0 2.413 1.273 3.82 3.418 3.82.67 0 1.206-.067 1.877-.335v2.145c0 .603.469 1.072 1.072 1.072h.938a.432.432 0 0 0 .402-.402V9.874h1.542c.201 0 .335-.134.335-.335v-.67z"/>
                          </svg>
                        </div>
                        Pay {formatINR(booking.remainingBalance)} via PhonePe
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-stone-400 font-semibold text-center mt-2">
                    Or pay remaining at the hotel during check-in
                  </p>
                </div>
              )}

              {/* Fully paid badge */}
              {booking.remainingBalance === 0 && (
                <div className="mt-4 pt-4 border-t border-stone-100">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-2.5 rounded-2xl text-xs font-bold border border-emerald-200">
                    <ShieldCheck className="h-4 w-4" /> Fully Paid — Verified Ticket
                  </div>
                </div>
              )}
            </div>

            {/* Policy reminder */}
            <div className="bg-stone-900 rounded-3xl p-5 text-white">
              <h4 className="font-black text-xs uppercase tracking-widest mb-2 text-amber-400">Cancellation Policy</h4>
              <p className="text-[11px] text-stone-300 font-semibold leading-relaxed mb-3">
                {booking.cancellationPolicy}
              </p>
              <a
                href={`https://wa.me/${ADMIN_WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold py-2.5 px-4 rounded-2xl transition-colors"
              >
                <MessageCircle className="h-4 w-4 text-green-400" />
                Contact Admin on WhatsApp
              </a>
            </div>

            {/* Print button */}
            <button
              onClick={() => window.print()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-stone-200 text-stone-700 rounded-2xl text-xs font-bold hover:bg-stone-50 transition-colors"
            >
              <Printer className="h-4 w-4" /> Print This Ticket
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCancelModal && (
        <CancelModal
          booking={booking}
          onClose={() => setShowCancelModal(false)}
          onSuccess={() => {
            setShowCancelModal(false);
            onRefresh();
          }}
        />
      )}
      {showRescheduleModal && (
        <RescheduleModal
          booking={booking}
          onClose={() => setShowRescheduleModal(false)}
          onSuccess={() => {
            setShowRescheduleModal(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BookingsPage() {
  const [bookingId, setBookingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<BookingLookup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (id?: string) => {
    const searchId = (id ?? bookingId).trim().toUpperCase();
    if (!searchId) return;
    setLoading(true);
    setError(null);
    setBooking(null);
    try {
      const res = await fetch(`/api/v1/bookings/lookup?id=${encodeURIComponent(searchId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking not found.');
      setBooking(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <title>My Bookings | Punnami Southern Residency</title>
      <meta name="description" content="View, manage, cancel, or reschedule your room stay bookings at Punnami Southern Residency." />
      {/* Hero search area */}
      <div className="bg-stone-950 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Ticket className="h-5 w-5 text-amber-400" />
            <span className="text-amber-400 text-xs font-black uppercase tracking-widest">Booking Tracker</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
            Find Your Booking
          </h1>
          <p className="text-stone-400 text-sm font-semibold mb-8">
            Enter your Booking ID from your confirmation email to view ticket details, pay balance, or manage your stay.
          </p>

          {/* Search box */}
          <div className="flex gap-2 max-w-lg mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={bookingId}
                onChange={e => setBookingId(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="HTL-XXXXXXXXXXXX"
                id="booking-id-input"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-stone-500 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={loading || !bookingId.trim()}
              id="search-booking-btn"
              className="flex items-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-2xl text-sm font-black transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.97] shadow-md shadow-amber-500/30"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="hidden sm:inline">Find</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Error */}
        {error && (
          <div className="max-w-lg mx-auto p-5 rounded-3xl bg-white border border-red-200 text-center shadow-sm">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <p className="font-black text-stone-800 mb-1">Booking Not Found</p>
            <p className="text-xs text-stone-500 font-semibold leading-relaxed">{error}</p>
            <p className="text-xs text-stone-400 font-semibold mt-2">
              Check the Booking ID in your confirmation email and try again.
            </p>
          </div>
        )}

        {/* Empty / intro state */}
        {!loading && !booking && !error && (
          <div className="max-w-lg mx-auto text-center py-8">
            <div className="w-16 h-16 bg-amber-50 border-2 border-amber-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Ticket className="h-8 w-8 text-amber-500" />
            </div>
            <p className="font-black text-stone-700 mb-2">Enter Your Booking ID</p>
            <p className="text-xs text-stone-400 font-semibold leading-relaxed mb-4">
              Your Booking ID was sent to your email address after completing payment. It looks like <strong className="font-black text-stone-600">HTL-XXXXXXXXXXXX</strong>.
            </p>
            <div className="space-y-2 text-left bg-white rounded-2xl border border-stone-100 p-4 shadow-sm">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">With your Booking ID you can:</p>
              {[
                ['View full booking details & ticket', CheckCircle2],
                ['Pay remaining balance online via PhonePe', CreditCard],
                ['Request reschedule or cancellation', Calendar],
                ['Print or save your ticket', Printer],
              ].map(([text, Icon]: any) => (
                <div key={text} className="flex items-center gap-2.5 text-xs text-stone-600 font-semibold">
                  <Icon className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Booking ticket */}
        {booking && (
          <BookingTicket
            booking={booking}
            onRefresh={() => handleSearch(booking.publicId)}
          />
        )}
      </div>
    </div>
  );
}
