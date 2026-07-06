'use client';

import React, { useState } from 'react';
import { Ticket, Calendar, Phone, Mail, User, ShieldCheck, MapPin, Printer, ArrowLeft, Home, Sparkles, Users, AlertTriangle, CalendarClock, MessageSquare, RefreshCw, X, XCircle, CreditCard, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface BookingVoucherProps {
  booking: {
    publicId: string;
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
    totalAmount: number;
    status: string;
    createdAt: string;
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
  
  const [cancelReason, setCancelReason] = useState('');
  const [postponeReason, setPostponeReason] = useState('');
  const [postponeDate, setPostponeDate] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [payingBalance, setPayingBalance] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
        window.open(`https://wa.me/919542069573?text=Hello%20Punnami%20Hotels%2C%20I%20have%20submitted%20a%20cancellation%20request%20for%20my%20booking%20${booking.publicId}.%20Please%20approve%20it.`, '_blank');
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
      const res = await fetch(`/api/v1/bookings/${booking.publicId}/postpone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newDate: postponeDate, reason: postponeReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to submit postpone request.');
      } else {
        setShowPostponeModal(false);
        window.open(`https://wa.me/919542069573?text=Hello%20Punnami%20Hotels%2C%20I%20have%20submitted%20a%20postponement%20request%20for%20my%20booking%20${booking.publicId}%20to%20start%20on%20${postponeDate}.%20Please%20verify%20and%20approve%20it.`, '_blank');
        router.refresh();
      }
    } catch {
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

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
            margin: 8mm 10mm 8mm 10mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:bg-white {
            background-color: #ffffff !important;
          }
          .print\\:border-stone-200 {
            border-color: #e7e5e4 !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
            filter: none !important;
          }
          .print\\:rounded-2xl {
            border-radius: 1rem !important;
          }
          .print\\:rounded-3xl {
            border-radius: 1.5rem !important;
          }
          .print-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}} />

      {/* Navigation actions - Hidden during print */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <button
          onClick={() => router.push('/my-bookings')}
          className="flex items-center gap-2 text-stone-600 hover:text-stone-900 font-bold text-sm bg-white px-4 py-2.5 rounded-xl border border-stone-200 shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>My Bookings</span>
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900 font-bold text-sm bg-white px-4 py-2.5 rounded-xl border border-stone-200 shadow-sm transition-all cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Main Voucher Container */}
      <div className="max-w-4xl mx-auto bg-white border border-stone-200 rounded-3xl shadow-xl overflow-hidden print:border print:border-stone-200 print:shadow-none print:rounded-3xl">
        
        {/* Decorative Golden Ribbon */}
        <div className="h-2.5 bg-gradient-to-r from-amber-400 via-amber-600 to-amber-700 w-full" />

        {/* Voucher Header */}
        <div className="p-8 border-b border-stone-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-stone-50/70">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-stone-900 rounded-2xl flex items-center justify-center shrink-0 p-1 border border-stone-200 shadow-inner">
              <img src="/logo.png" alt="PSR Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-amber-700 font-black tracking-widest text-[10px] uppercase mb-0.5">
                <Sparkles className="h-3 w-3 text-amber-600 fill-amber-600" />
                <span>Official Hotel Stay Ticket</span>
              </div>
              <h1 className="text-2xl font-black text-stone-900 tracking-tight leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
                {booking.roomType.hotel.name}
              </h1>
              <p className="text-stone-500 text-xs mt-1.5 flex items-center gap-1 font-medium">
                <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span>{booking.roomType.hotel.address}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0 self-stretch sm:self-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-stone-150">
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Booking Status</span>
            {booking.status === 'CONFIRMED' && (
              <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-3.5 py-1.5 text-xs font-black uppercase tracking-wider shadow-sm">
                <ShieldCheck className="h-4 w-4 fill-emerald-100" /> Confirmed
              </span>
            )}
            {booking.status === 'PARTIAL_PAID' && (
              <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-3.5 py-1.5 text-xs font-black uppercase tracking-wider shadow-sm">
                <ShieldCheck className="h-4 w-4 fill-amber-100" /> Partially Paid
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
            <p className="font-extrabold text-stone-850 text-sm tracking-wide">{booking.publicId}</p>
          </div>
          <div className="p-5 border-r border-stone-150">
            <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 mb-1">Booking Date</p>
            <p className="font-semibold text-stone-750 text-xs">{bookingDateFormatted}</p>
          </div>
          <div className="p-5 border-r border-stone-150">
            <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 mb-1">Rooms Booked</p>
            <p className="font-extrabold text-stone-850 text-sm">{booking.roomsBooked} Category Room{booking.roomsBooked > 1 ? 's' : ''}</p>
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
              <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 mb-0.5">Check-In Date</p>
              {booking.status === 'POSTPONED' && booking.originalCheckInDate ? (
                <>
                  <p className="text-stone-400 line-through text-sm font-semibold">
                    {format(new Date(booking.originalCheckInDate), 'dd MMMM yyyy')}
                  </p>
                  <h4 className="font-black text-amber-700 text-lg leading-tight">{checkInDateFormatted}</h4>
                  <p className="text-[10px] font-bold text-amber-600 mt-0.5">↑ Rescheduled Date</p>
                </>
              ) : (
                <h4 className="font-black text-stone-800 text-lg leading-tight">{checkInDateFormatted}</h4>
              )}
              <p className="text-stone-500 text-xs mt-1 font-semibold">Standard Check-In Time: {booking.roomType.hotel.checkInTime || '12:00 PM'}</p>
            </div>
          </div>

          <div className="bg-stone-50/50 border border-stone-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-600/10 text-amber-700 rounded-xl flex items-center justify-center shrink-0 print:border print:border-amber-100">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 mb-0.5">Check-Out Date</p>
              {booking.status === 'POSTPONED' && booking.originalCheckOutDate ? (
                <>
                  <p className="text-stone-400 line-through text-sm font-semibold">
                    {format(new Date(booking.originalCheckOutDate), 'dd MMMM yyyy')}
                  </p>
                  <h4 className="font-black text-amber-700 text-lg leading-tight">{checkOutDateFormatted}</h4>
                  <p className="text-[10px] font-bold text-amber-600 mt-0.5">↑ Rescheduled Date</p>
                </>
              ) : (
                <h4 className="font-black text-stone-800 text-lg leading-tight">{checkOutDateFormatted}</h4>
              )}
              <p className="text-stone-500 text-xs mt-1 font-semibold">Standard Check-Out Time: {booking.roomType.hotel.checkOutTime || '11:00 AM'}</p>
            </div>
          </div>
        </div>

        {/* Main Details Section */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-stone-150">
          {/* Guest and Stay Profile */}
          <div className="space-y-6 print-card">
            <h3 className="text-xs font-black uppercase tracking-widest text-stone-450 border-b border-stone-150 pb-2 flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-stone-450" />
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
                    <p className="text-sm font-bold text-stone-800">{booking.guestEmail}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Ticket className="h-4 w-4 text-stone-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-stone-400 uppercase font-black">Selected Category</p>
                  <p className="text-sm font-bold text-stone-800">{booking.roomType.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Ledger */}
          <div className="space-y-6 print-card">
            <h3 className="text-xs font-black uppercase tracking-widest text-stone-450 border-b border-stone-150 pb-2">Booking Payment Summary</h3>
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

              <div className="border-t border-stone-200 pt-3 flex justify-between items-center">
                <span className="font-extrabold text-stone-900 text-sm">Paid Total Amount</span>
                <span className="font-black text-amber-700 text-xl">{formatCurrency(booking.totalAmount)}</span>
              </div>

              {booking.transactionId && (
                <div className="flex justify-between text-[11px] pt-1">
                  <span className="text-stone-400 font-bold uppercase tracking-wider">Transaction ID</span>
                  <span className="text-stone-750 font-mono font-bold">{booking.transactionId}</span>
                </div>
              )}

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

              {['CANCELLED', 'REFUNDED'].includes(booking.status) && (
                <div className="bg-red-50/50 border border-red-200 rounded-xl p-3.5 text-center mt-4">
                  <p className="text-[10px] text-red-700 font-black uppercase tracking-wider">Booking Status: CANCELLED</p>
                  {booking.cancellationFee !== undefined && (
                    <p className="text-xs text-red-800 mt-1 font-bold">
                      Cancellation Fee: {formatCurrency(booking.cancellationFee)} <br/>
                      Eligible Refund: {formatCurrency(booking.refundAmount || 0)}
                    </p>
                  )}
                  <p className="text-[9px] text-red-600 mt-1 font-medium">Refund is processed to your original payment account.</p>
                </div>
              )}

              {booking.status === 'POSTPONED' && (
                <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3.5 text-center mt-4">
                  <p className="text-[10px] text-blue-700 font-black uppercase tracking-wider">Booking Status: RESCHEDULED</p>
                  <p className="text-[9px] text-blue-600 mt-0.5 font-medium">Check-in dates updated. New voucher is confirmed.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Passenger Manifest Table */}
        {booking.passengers && booking.passengers.length > 0 && (
          <div className="p-8 border-b border-stone-150 print-card">
            <h3 className="text-xs font-black uppercase tracking-widest text-stone-450 border-b border-stone-150 pb-2 mb-4 flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-stone-450" />
              <span>Verified Guest Details</span>
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

        {/* Stays Cancellation / Modification Actions Section - Hidden during print */}
        {['CONFIRMED', 'PARTIAL_PAID', 'CANCEL_REQUESTED', 'POSTPONE_REQUESTED'].includes(booking.status) && (
          <div className="p-8 border-b border-stone-150 bg-stone-50/30 print:hidden">
            <h3 className="text-xs font-black uppercase tracking-widest text-stone-450 border-b border-stone-150 pb-2 mb-4 flex items-center gap-2">
              <CalendarClock className="h-4.5 w-4.5 text-stone-450" />
              <span>Modify Stay or Request Cancellation</span>
            </h3>
            
            {['CONFIRMED', 'PARTIAL_PAID'].includes(booking.status) ? (
              <div className="flex flex-col gap-4">
                {booking.status === 'PARTIAL_PAID' && (
                  <button
                    onClick={handlePayBalance}
                    disabled={payingBalance}
                    className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-black rounded-2xl py-4 text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                  >
                    {payingBalance ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Redirecting to PhonePe PG...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4.5 w-4.5" />
                        <span>Pay Remaining Balance Online (₹{(booking.totalAmount - (booking.paidAmount || 0)).toLocaleString('en-IN')})</span>
                      </>
                    )}
                  </button>
                )}
                
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
          </div>
        )}

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
            <div className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="bg-stone-900 px-6 py-4 text-white flex items-center justify-between">
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
                  <label className="block text-xs font-black uppercase tracking-wider text-stone-400 mb-1.5">Proposed New Check-In Date</label>
                  <input
                    type="date"
                    value={postponeDate}
                    onChange={(e) => setPostponeDate(e.target.value)}
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // from tomorrow onwards
                    className="w-full p-3 border-2 border-stone-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 font-bold"
                    required
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

        {/* Boarding Pass Tear-off Line */}
        <div className="relative my-2 print:my-4 print-card">
          <div className="absolute left-0 right-0 border-t-2 border-dashed border-stone-300 top-1/2 -translate-y-1/2" />
          <div className="relative flex justify-between px-8">
            <div className="w-6 h-6 bg-stone-100 rounded-full border border-stone-200 -ml-11 print:bg-white print:border-none" />
            <span className="bg-white px-4 text-[10px] font-bold text-stone-400 tracking-widest uppercase relative z-10 print:hidden">Terms & Guidelines Stub</span>
            <div className="w-6 h-6 bg-stone-100 rounded-full border border-stone-200 -mr-11 print:bg-white print:border-none" />
          </div>
        </div>

        {/* Stay Guidelines / Policies */}
        <div className="p-8 bg-stone-50/50 print-card">
          <h3 className="text-xs font-black uppercase tracking-widest text-stone-450 border-b border-stone-150 pb-2 mb-4">Check-in Guidelines & Policies</h3>
          <ul className="space-y-3 text-xs text-stone-600 leading-relaxed list-disc pl-4 font-medium">
            <li><strong>Photo Identification:</strong> A valid physical photo ID (Aadhar Card, Passport, Driving License or Voter ID) must be presented by all adult guests at the time of check-in.</li>
            <li><strong>Occupancy Limits:</strong> Check-in is capped based on the standard capacity of the room (max {booking.roomType.maxAdults} adults and {booking.roomType.maxChildren} children per room category).</li>
            <li><strong>Check-in & Check-out:</strong> Standard Check-In is at 12:00 PM. Check-Out is at 11:00 AM. Early check-in or late check-out is subject to availability and may incur custom hotel charges.</li>
            <li><strong>Hotel Booking Ticket:</strong> Please carry a digital copy or printed slip of this hotel stay ticket to present to check-in reception staff.</li>
          </ul>
        </div>

        {/* Voucher Footer */}
        <div className="bg-stone-900 text-stone-400 p-6 text-center text-xs border-t border-stone-800 print-card">
          <p className="font-bold text-stone-300">Thank you for choosing Punnami Southern Residency Bhadrachalam</p>
          <p className="text-[10px] mt-1 text-stone-500">For support, call us or email support@punnamihotels.com. This is an officially generated digital hotel booking ticket.</p>
        </div>

      </div>
    </div>
  );
}
