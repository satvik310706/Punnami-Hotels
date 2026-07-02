'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CheckCircle, Clock, Upload, X, QrCode, AlertCircle, RefreshCw, Camera, PhoneCall } from 'lucide-react';

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
  checkInDate?: string;
  checkOutDate?: string;
}

interface PaymentPageClientProps {
  bookingId: string;
  initialData: BookingData | null;
}

export default function PaymentPageClient({ bookingId, initialData }: PaymentPageClientProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [booking, setBooking] = useState<BookingData | null>(initialData);
  const [transactionId, setTransactionId] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function handleFileSelect(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }
    setProofFile(file);
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => setProofPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!transactionId.trim() && !proofFile) {
      setError('Please enter your transaction ID or upload a payment screenshot');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (transactionId.trim()) formData.append('transactionId', transactionId.trim());
      if (proofFile) formData.append('proofImage', proofFile);

      const res = await fetch(`/api/v1/bookings/${bookingId}/submit-proof`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Submission failed. Please try again.');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-stone-150">
          <div className="w-20 h-20 bg-green-150 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle className="h-10 w-10 text-green-600 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-3" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Payment Proof Submitted!
          </h1>
          <p className="text-stone-500 mb-6 leading-relaxed text-sm">
            Thank you! We've received your payment details and notified our management. We'll verify and confirm your booking shortly.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 text-center">
            <h3 className="text-amber-850 font-bold text-xs uppercase tracking-widest mb-1">Booking ID</h3>
            <div className="text-2xl font-black text-amber-850 mb-4 tracking-tight">{bookingId}</div>

            <div className="border-t border-amber-200/50 pt-4">
              <h4 className="text-amber-900 font-bold text-xs uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
                <PhoneCall className="h-3.5 w-3.5 text-amber-600 animate-bounce" /> Speed Up Confirmation
              </h4>
              <p className="text-xs text-stone-600 mb-4 leading-relaxed">
                Click below to call the owner/front desk immediately with your Booking ID to get instant approval!
              </p>
              <a
                href="tel:+919542069573"
                className="inline-flex items-center justify-center gap-2 w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-amber-600/30 transition-all cursor-pointer"
              >
                <PhoneCall className="h-4 w-4" /> Call Owner Now (+91 95420 69573)
              </a>
            </div>
          </div>

          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
            Receipt will be sent via SMS & Email on confirmation
          </p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-500">Loading booking details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-stone-900 mb-2" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Complete Your Booking
          </h1>
          <p className="text-stone-500">Scan the QR code and submit your payment proof below</p>
        </div>

        {/* Status Held Notice */}
        <div className="flex items-center justify-center gap-3 rounded-2xl p-4 border-2 bg-amber-50 border-amber-200 text-amber-700 shadow-sm animate-pulse">
          <Clock className="h-5 w-5 shrink-0" />
          <span className="font-bold text-xs uppercase tracking-wider">Room Hold Active — Awaiting payment verification</span>
        </div>

        {/* Booking Summary */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <h2 className="font-bold text-stone-900 mb-4">Booking Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-stone-500">Booking ID</span><span className="font-bold text-amber-700">{bookingId}</span></div>
            <div className="flex justify-between"><span className="text-stone-500">Room</span><span className="font-semibold text-stone-700">{booking.roomName}</span></div>
            <div className="flex justify-between"><span className="text-stone-500">Hotel</span><span className="font-semibold text-stone-700">{booking.hotelName}</span></div>
            <div className="border-t border-stone-100 pt-2 mt-2">
              <div className="flex justify-between"><span className="text-stone-500">Subtotal</span><span className="font-semibold">₹{booking.subtotal?.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">GST</span><span className="font-semibold">₹{booking.gstAmount?.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between mt-2 pt-2 border-t border-stone-100">
                <span className="font-bold text-stone-900 text-base">Total</span>
                <span className="font-black text-xl text-amber-700">₹{booking.totalAmount?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm text-center">
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider mb-4">
            <QrCode className="h-3.5 w-3.5" />
            Pay via PhonePe
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Scan to Pay ₹{booking.totalAmount?.toLocaleString('en-IN')}
          </h2>
          <p className="text-stone-500 text-sm mb-6">Open PhonePe and scan the QR code below to make your payment</p>

          {/* QR Code Display */}
          <div className="relative w-64 mx-auto bg-white rounded-2xl flex flex-col items-center justify-center overflow-hidden border border-stone-250 shadow-md mb-4 p-3 hover:shadow-lg transition-all duration-300">
            <img src="/payment-qr.png" alt="PhonePe QR Code - Nalla Nagamani" className="w-full h-auto max-h-80 object-contain rounded-xl" />
            <p className="text-[11px] text-stone-500 font-bold uppercase tracking-wider mt-3">
              Account Name: Nalla Nagamani
            </p>
          </div>

          <p className="text-xs text-stone-400">
            Pay exactly <span className="font-bold text-stone-700">₹{booking.totalAmount?.toLocaleString('en-IN')}</span> to complete your booking
          </p>
        </div>

        {/* Upload Proof */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <h2 className="font-bold text-stone-900 mb-1">Submit Payment Proof / ID</h2>
          <p className="text-sm text-stone-500 mb-5">After payment, enter your transaction ID OR upload a screenshot of the payment confirmation/guest ID.</p>

          {/* Transaction ID */}
          <div className="mb-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">Transaction ID / UTR or Guest ID Number</label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. 427261872637 or Aadhaar ID number"
              className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-amber-500 transition-colors tracking-wider"
            />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-xs font-semibold text-stone-400 uppercase">or</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          {/* File Upload */}
          {proofPreview ? (
            <div className="relative rounded-2xl overflow-hidden border-2 border-amber-400">
              <img src={proofPreview} alt="Payment proof" className="w-full max-h-64 object-contain bg-stone-50" />
              <button
                onClick={() => { setProofFile(null); setProofPreview(null); }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-2xl p-8 text-center cursor-pointer transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleFileSelect(file);
              }}
            >
              <Camera className="h-10 w-10 text-stone-400 mx-auto mb-3" />
              <p className="font-semibold text-stone-700 text-sm mb-1">Take Photo / Upload Screenshot</p>
              <p className="text-xs text-stone-450">PNG, JPG up to 5MB · Drag & drop or tap to browse</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || (!transactionId.trim() && !proofFile)}
            className="w-full mt-5 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-black rounded-xl py-4 text-base transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Submit Payment Proof
              </>
            )}
          </button>

          <p className="text-center text-xs text-stone-400 mt-3">
            ⏱️ Our team will verify and confirm your booking within 30 minutes
          </p>
        </div>
      </div>
    </div>
  );
}
