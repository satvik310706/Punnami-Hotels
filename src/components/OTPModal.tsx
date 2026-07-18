'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Phone, RefreshCw, CheckCircle } from 'lucide-react';

interface OTPModalProps {
  phone: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function OTPModal({ phone, onSuccess, onClose }: OTPModalProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  async function sendOTP() {
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send OTP');
        return;
      }
      setSent(true);
      setCountdown(60);
      setTimeout(() => inputsRef.current[0]?.focus(), 100);
    } catch {
      setError('Failed to send OTP. Check your connection.');
    } finally {
      setSending(false);
    }
  }

  // Send OTP on mount
  useEffect(() => {
    sendOTP();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);


  function handleInput(i: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[i] = value.slice(-1);
    setOtp(next);
    if (value && i < 5) inputsRef.current[i + 1]?.focus();
    if (next.every((d) => d) && next.join('').length === 6) {
      verifyOTP(next.join(''));
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      verifyOTP(pasted);
    }
  }

  async function verifyOTP(otpValue: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otpValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid OTP');
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => inputsRef.current[0]?.focus(), 100);
        return;
      }
      onSuccess();
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl sm:rounded-2xl w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-100">
          <div>
            <h2 className="font-bold text-stone-900 text-lg">Verify Your Number</h2>
            <p className="text-sm text-stone-500 mt-0.5">OTP sent to +91 {phone}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
            <X className="h-5 w-5 text-stone-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {sending ? (
            <div className="text-center py-4">
              <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-stone-500">Sending OTP via SMS...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 text-sm text-stone-500 bg-amber-50 rounded-xl p-3">
                <Phone className="h-4 w-4 text-amber-600" />
                <span>Enter the 6-digit OTP sent to your mobile</span>
              </div>

              {/* OTP Input */}
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputsRef.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInput(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className={`w-12 h-14 text-center text-2xl font-black rounded-xl border-2 transition-all focus:outline-none ${
                      digit ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-stone-200 text-stone-900'
                    } focus:border-amber-500`}
                    disabled={loading}
                  />
                ))}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 text-center">
                  {error}
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center gap-2 text-amber-600 text-sm">
                  <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </div>
              )}

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-stone-400">Resend OTP in <span className="font-bold text-stone-600">{countdown}s</span></p>
                ) : (
                  <button
                    onClick={sendOTP}
                    className="text-sm font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1.5 mx-auto transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                onClick={() => verifyOTP(otp.join(''))}
                disabled={otp.join('').length !== 6 || loading}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold rounded-xl py-3.5 text-sm transition-colors"
              >
                Verify & Continue
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
