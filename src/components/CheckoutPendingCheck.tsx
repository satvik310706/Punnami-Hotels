'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, AlertTriangle, ArrowRight, X } from 'lucide-react';

export function CheckoutPendingCheck() {
  const [showModal, setShowModal] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkPendingBooking = async () => {
      try {
        const res = await fetch('/api/v1/bookings/my-bookings');
        if (!res.ok) return; // Ignore if unauthorized/not logged in

        const bookings = await res.json();
        if (!Array.isArray(bookings) || bookings.length === 0) return;

        const latest = bookings[0];
        if (latest.status !== 'PENDING_PROOF') return;

        const createdAt = new Date(latest.createdAt);
        const diffMinutes = (new Date().getTime() - createdAt.getTime()) / (1000 * 60);

        // If booking is pending and created in the last 15 minutes
        if (diffMinutes < 15) {
          setPendingBooking(latest);
          setShowModal(true);
        }
      } catch (err) {
        console.error('Pending checkout check error:', err);
      }
    };

    checkPendingBooking();
  }, []);

  if (!showModal || !pendingBooking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-5 border border-stone-200 shadow-2xl relative">
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600">
          <Clock className="h-7 w-7 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-stone-900 leading-tight">⚠️ Pending Reservation Detected</h3>
          <p className="text-stone-500 text-xs leading-relaxed">
            You have an active booking attempt (Booking ID: <span className="font-extrabold text-stone-700">{pendingBooking.publicId}</span>) that is awaiting payment. 
            If you completed payment in your PhonePe app, please verify it now to secure your rooms.
          </p>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => router.push(`/booking/${pendingBooking.publicId}?status=verifying`)}
            className="w-full py-3.5 bg-amber-800 hover:bg-amber-900 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Verify Payment & Confirm Booking
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowModal(false)}
            className="w-full py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            Start a New Booking
          </button>
        </div>
      </div>
    </div>
  );
}
