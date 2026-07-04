'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Clock, AlertCircle, RefreshCw, CreditCard, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface BookingData {
  publicId: string;
  totalAmount: number;
  gstAmount: number;
  subtotal: number;
  expiresAt: string;
  roomName: string;
  hotelName: string;
  checkInTime: string;
  checkOutTime: string;
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
      router.refresh();
    }
  }, [urlStatus, router]);

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
            router.refresh();
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
            <p className="text-stone-400 text-xs leading-relaxed">If you completed your payment on the app, please wait. Your voucher is loading.</p>
          </div>
        ) : (
          <>
            {/* Status Hold Notice */}
            <div className="flex items-center justify-center gap-3 rounded-2xl p-4 border bg-amber-50/50 border-amber-200/60 text-amber-900 shadow-sm">
              <Clock className="h-5 w-5 shrink-0 text-amber-600 animate-pulse" />
              <span className="font-bold text-[11px] uppercase tracking-wider">Room Hold Active — Confirms on Payment</span>
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
                <div className="flex justify-between items-center"><span className="text-stone-450">Booking ID</span><span className="font-bold text-stone-800 tracking-tight">{booking.publicId}</span></div>
                <div className="flex justify-between items-center"><span className="text-stone-450">Hotel</span><span className="font-semibold text-stone-700">{booking.hotelName}</span></div>
                <div className="flex justify-between items-center"><span className="text-stone-450">Room Type</span><span className="font-semibold text-stone-700">{booking.roomName}</span></div>
                <div className="border-t border-stone-200/60 pt-3 mt-1.5 space-y-2">
                  <div className="flex justify-between items-center"><span className="text-stone-450">Subtotal</span><span className="font-semibold text-stone-700">₹{booking.subtotal?.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between items-center"><span className="text-stone-450">GST</span><span className="font-semibold text-stone-700">₹{booking.gstAmount?.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between items-center mt-2.5 pt-3 border-t border-stone-200/65">
                    <span className="font-extrabold text-stone-900 text-sm uppercase">Total Amount</span>
                    <span className="font-black text-xl text-amber-800">₹{booking.totalAmount?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pay Button CTA */}
            <button
              onClick={handlePaymentInitiate}
              className="w-full bg-amber-800 hover:bg-amber-900 text-white font-extrabold rounded-2xl py-4 text-sm uppercase tracking-wider shadow-md hover:shadow-amber-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="h-4 w-4" />
              {status === 'failed' ? 'Retry Payment' : 'Pay via PhonePe Gateway'}
              <ArrowRight className="h-4 w-4" />
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
