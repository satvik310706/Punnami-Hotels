'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Clock, AlertCircle, RefreshCw, CreditCard, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface BookingData {
  publicId: string;
  sequenceId?: string | null;
  totalAmount: number;
  gstAmount: number;
  subtotal: number;
  expiresAt: string;
  roomName: string;
  hotelName: string;
  checkInTime: string;
  checkOutTime: string;
  paidAmount?: number;
  paymentPercentage?: number;
}

interface PaymentPageClientProps {
  bookingId: string;
  initialData: BookingData | null;
}

export default function PaymentPageClient({ bookingId, initialData }: PaymentPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlStatus = searchParams.get('status'); // success, failed, verifying

  const [booking] = useState<BookingData | null>(initialData);
  const [status, setStatus] = useState<'idle' | 'redirecting' | 'verifying' | 'failed'>(
    urlStatus === 'verifying' ? 'verifying' : urlStatus === 'failed' ? 'failed' : 'idle'
  );
  const [error, setError] = useState('');

  // Auto-verify status changes if redirected back with success
  useEffect(() => {
    if (urlStatus === 'success') {
      router.push(`/booking/${bookingId}?download=true`);
    }
  }, [urlStatus, bookingId, router]);

  // Real-time polling reconciliation in verifying state
  useEffect(() => {
    if (status !== 'verifying') return;

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/v1/payment/verify?bookingId=${bookingId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'COMPLETED') {
            clearInterval(interval);
            router.push(`/booking/${bookingId}?download=true`);
            return;
          } else if (data.status === 'FAILED') {
            clearInterval(interval);
            setStatus('failed');
            return;
          }
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
      }

      // Expiry fallback (timeout after 2 minutes)
      if (attempts > 24) {
        clearInterval(interval);
        setStatus('failed');
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [status, bookingId, router]);

  const handlePaymentInitiate = async () => {
    setError('');
    setStatus('redirecting');
    try {
      const res = await fetch('/api/v1/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to initiate secure checkout session. Please try again.');
        setStatus('failed');
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Checkout redirect link not found.');
        setStatus('failed');
      }
    } catch {
      setError('Something went wrong. Please check your internet connection and try again.');
      setStatus('failed');
    }
  };

  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  // Live countdown driven by server-supplied expiresAt
  useEffect(() => {
    if (!booking?.expiresAt) return;
    const target = new Date(booking.expiresAt).getTime();

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('00:00');
        return;
      }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [booking?.expiresAt]);

  if (!booking) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-500">Loading reservation details...</p>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-stone-50 py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-red-200 p-8 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Reservation Expired
          </h1>
          <p className="text-stone-500 text-sm leading-relaxed">
            Your 5-minute hold has expired and this reservation has been automatically released. Please go back and start a new booking.
          </p>
          <button
            onClick={() => router.push('/rooms')}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl py-4 text-sm uppercase tracking-wider transition-all cursor-pointer"
          >
            Browse Rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200 p-8 shadow-xl space-y-6">
        
        {/* Branding & Title */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full text-xs font-bold text-amber-800 uppercase tracking-widest mb-3">
            <ShieldCheck className="h-4 w-4" /> Secure Gateway Checkout
          </div>
          <h1 className="text-3xl font-bold text-stone-900 leading-tight" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            {status === 'verifying' ? 'Verifying Payment' : 'Complete Booking'}
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            {status === 'verifying'
              ? 'Checking status with payment provider...'
              : 'Secure online payment for your stay'}
          </p>
        </div>

        {/* State Machine Rendering */}
        {status === 'redirecting' ? (
          <div className="py-12 text-center space-y-4">
            <RefreshCw className="h-12 w-12 text-amber-600 animate-spin mx-auto" />
            <p className="text-stone-600 font-semibold text-sm">Redirecting to PhonePe payment gateway...</p>
            <p className="text-stone-400 text-xs leading-relaxed">Please do not refresh this page or click the back button.</p>
          </div>
        ) : status === 'verifying' ? (
          <div className="py-12 text-center space-y-4">
            <RefreshCw className="h-12 w-12 text-amber-600 animate-spin mx-auto" />
            <p className="text-stone-600 font-semibold text-sm">Validating transaction status...</p>
            <p className="text-stone-450 text-xs leading-relaxed">If you completed your payment on the app, please wait. Your stay ticket is loading.</p>
          </div>
        ) : (
          <>
            {/* Status Hold Notice with Live Countdown */}
            <div className={`flex items-center justify-between gap-3 rounded-2xl p-4 border shadow-sm ${timeLeft && parseInt(timeLeft.split(':')[0]) === 0 && parseInt(timeLeft.split(':')[1]) <= 60 ? 'bg-red-50/80 border-red-200 text-red-900' : 'bg-amber-50/50 border-amber-200/60 text-amber-900'}`}>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 shrink-0 text-amber-600 animate-pulse" />
                <span className="font-bold text-[11px] uppercase tracking-wider">Room Hold Active — Confirms on Payment</span>
              </div>
              {timeLeft && (
                <span className={`font-black text-sm tabular-nums shrink-0 ${parseInt(timeLeft.split(':')[0]) === 0 ? 'text-red-600' : 'text-amber-700'}`}>
                  {timeLeft}
                </span>
              )}
            </div>

            {/* Error Notification */}
            {(error || status === 'failed') && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-800 leading-relaxed">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                <div className="space-y-1">
                  <span className="font-black uppercase tracking-wider">Payment Action Required</span>
                  <p>{error || "We couldn't verify your payment. If money was debited, it will be automatically refunded within 2-3 business days. Please try again."}</p>
                </div>
              </div>
            )}

            {/* Booking Details Summary Card */}
            <div className="bg-stone-50 rounded-2xl p-5 border border-stone-150 space-y-3">
              <h2 className="font-bold text-xs uppercase tracking-wider text-stone-500 mb-2">Stay Reservation Details</h2>
              <div className="space-y-2.5 text-sm leading-none">
                <div className="flex justify-between items-center"><span className="text-stone-450">Booking ID</span><span className="font-bold text-stone-800 tracking-tight">{booking.sequenceId || booking.publicId}</span></div>
                <div className="flex justify-between items-center"><span className="text-stone-450">Hotel</span><span className="font-semibold text-stone-700">{booking.hotelName}</span></div>
                <div className="flex justify-between items-center"><span className="text-stone-450">Room Type</span><span className="font-semibold text-stone-700">{booking.roomName}</span></div>
                <div className="border-t border-stone-200/60 pt-3 mt-1.5 space-y-2">
                  <div className="flex justify-between items-center"><span className="text-stone-450">Subtotal</span><span className="font-semibold text-stone-700">₹{booking.subtotal?.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between items-center"><span className="text-stone-450">GST</span><span className="font-semibold text-stone-700">₹{booking.gstAmount?.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-stone-450 font-bold">Total Stay Cost</span>
                    <span className="font-bold text-stone-700">₹{booking.totalAmount?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                {booking.paymentPercentage && booking.paymentPercentage < 100 ? (
                  <div className="border-t border-amber-200 bg-amber-50/40 rounded-xl p-3 space-y-2 mt-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-amber-800 font-bold uppercase tracking-wider">Payment Selected</span>
                      <span className="font-extrabold text-amber-900">{booking.paymentPercentage}% Advance</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-amber-200/50 pt-2">
                      <span className="font-extrabold text-stone-900 text-xs uppercase">Amount Payable Now</span>
                      <span className="font-black text-lg text-amber-800">₹{booking.paidAmount?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-stone-500 pt-1">
                      <span>Balance at Check-in</span>
                      <span className="font-semibold">₹{((booking.totalAmount || 0) - (booking.paidAmount || 0)).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-stone-200/65 pt-2 flex justify-between items-center">
                    <span className="font-extrabold text-stone-900 text-sm uppercase">Total Amount</span>
                    <span className="font-black text-xl text-amber-800">₹{booking.totalAmount?.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pay Button CTA */}
            <button
              onClick={handlePaymentInitiate}
              className="w-full bg-[#5f259f] hover:bg-[#4a1d7d] text-white font-black rounded-2xl py-4 text-sm uppercase tracking-wider shadow-md hover:shadow-purple-900/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.98]"
            >
              <div className="bg-white p-0.5 rounded-full flex items-center justify-center">
                <svg fill="#5f259f" role="img" viewBox="0 0 24 24" className="h-4.5 w-4.5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.206 9.941h2.949v4.692c-.402.201-.938.268-1.34.268-1.072 0-1.609-.536-1.609-1.743V9.941zm13.47 4.816c-1.523 6.449-7.985 10.442-14.433 8.919C2.794 22.154-1.199 15.691.324 9.243 1.847 2.794 8.309-1.199 14.757.324c6.449 1.523 10.442 7.985 8.919 14.433zm-6.231-5.888a.887.887 0 0 0-.871-.871h-1.609l-3.686-4.222c-.335-.402-.871-.536-1.407-.402l-1.274.401c-.201.067-.268.335-.134.469l4.021 3.82H6.386c-.201 0-.335.134-.335.335v.67c0 .469.402.871.871.871h.938v3.217c0 2.413 1.273 3.82 3.418 3.82.67 0 1.206-.067 1.877-.335v2.145c0 .603.469 1.072 1.072 1.072h.938a.432.432 0 0 0 .402-.402V9.874h1.542c.201 0 .335-.134.335-.335v-.67z"/>
                </svg>
              </div>
              {status === 'failed' 
                ? 'Retry Payment' 
                : `Pay ₹${(booking.paidAmount || booking.totalAmount).toLocaleString('en-IN')} via PhonePe`}
            </button>

            <div className="flex items-center justify-center gap-2.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Powered by PhonePe Merchant Services
            </div>
          </>
        )}
      </div>
    </div>
  );
}
