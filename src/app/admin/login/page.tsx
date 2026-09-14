'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, EyeOff, Eye, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // OTP inputs
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setApiError('Please fill out all fields.');
      return;
    }

    setApiError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        setStep(2);
      } else {
        setApiError(data.error || 'Invalid credentials or unauthorized access.');
      }
    } catch {
      setApiError('Failed to establish server connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter' && !otp.some(d => !d)) {
      verifyOtp();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pasteData.length; i++) {
      newOtp[i] = pasteData[i];
    }
    setOtp(newOtp);

    // Focus the next empty input or the last one
    const nextIndex = Math.min(pasteData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const verifyOtp = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setApiError('Please enter all 6 digits.');
      return;
    }

    setApiError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: fullOtp }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('punnami_admin_auth', 'true');
        localStorage.setItem('punnami_admin_token', data.token);
        router.push('/admin');
      } else {
        setApiError(data.error || 'Invalid or expired verification code.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setApiError('Verification request failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const res = await fetch('/api/v1/auth/admin/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            router.push('/admin');
          }
        }
      } catch {}
    };
    checkActiveSession();
  }, [router]);

  useEffect(() => {
    if (step === 2) {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#04060a] flex items-center justify-center px-4 py-12">
      {/* Cyber Mesh Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.18),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.12),transparent_55%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-violet-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-indigo-500/8 blur-[130px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-500/25 to-indigo-500/10 border border-violet-500/30 shadow-[0_0_35px_rgba(139,92,246,0.25)]">
            <span className="absolute inset-0 rounded-2xl bg-violet-400/20 blur-md animate-pulse pointer-events-none" />
            <ShieldAlert className="h-7 w-7 text-violet-400 relative z-10" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase sm:text-4xl bg-gradient-to-r from-white via-white to-violet-300 bg-clip-text text-transparent">
            Administration Portal
          </h1>
          <p className="mt-2 text-xs font-medium uppercase tracking-widest text-violet-400/60">
            Secure Access Console
          </p>
        </div>

        <div className="relative rounded-3xl border border-white/[0.08] bg-[#090b14]/65 p-8 backdrop-blur-3xl shadow-[0_32px_80px_rgba(0,0,0,0.85)] overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />

          {step === 1 ? (
            <form onSubmit={handleLoginSubmit} className="space-y-6 relative z-10">
              <div>
                <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-widest text-violet-400/70">
                  Administrator Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-violet-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@punnamihotels.com"
                    className="w-full rounded-2xl border border-white/10 bg-black/45 py-3.5 pl-12 pr-4 text-sm text-white placeholder-white/20 outline-none transition-all duration-300 focus:border-violet-400 focus:bg-black/60 focus:ring-4 focus:ring-violet-400/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-widest text-violet-400/70">
                  Secure Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-violet-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-white/10 bg-black/45 py-3.5 pl-12 pr-12 text-sm text-white placeholder-white/20 outline-none transition-all duration-300 focus:border-violet-400 focus:bg-black/60 focus:ring-4 focus:ring-violet-400/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-violet-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              {apiError && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3.5 text-xs text-red-300">
                  <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-red-400" />
                  <span>{apiError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="relative mt-8 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-550 py-4 text-sm font-black uppercase tracking-wider text-white shadow-[0_8px_30px_rgba(99,102,241,0.35)] transition-all hover:shadow-[0_12px_40px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                    <span>Generating OTP Code...</span>
                  </>
                ) : (
                  <>
                    <span>Authorize Administrator</span>
                    <ArrowRight className="h-4.5 w-4.5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6 relative z-10">
              {successMessage && (
                <div className="flex items-start gap-3 rounded-2xl bg-emerald-500/10 p-4 border border-emerald-500/20">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5 animate-bounce" />
                  <p className="text-sm text-emerald-200 font-medium">{successMessage}</p>
                </div>
              )}

              <div>
                <label className="mb-4 block text-center text-xs font-extrabold uppercase tracking-widest text-violet-400/80">
                  Verification Code Sent
                </label>
                <div className="flex justify-center gap-2">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                      className="h-14 w-12 rounded-2xl border border-white/10 bg-black/45 text-center text-2xl font-black text-white outline-none transition-all duration-300 focus:border-violet-400 focus:bg-black/60 focus:ring-4 focus:ring-violet-400/15 shadow-lg"
                    />
                  ))}
                </div>
              </div>

              {apiError && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3.5 text-xs text-red-300">
                  <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-red-400" />
                  <span>{apiError}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="w-1/3 rounded-2xl border border-white/10 bg-white/5 py-4 text-xs font-bold text-white/80 hover:text-white transition-all hover:bg-white/10"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={loading || otp.some(d => !d)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-550 py-4 text-sm font-black uppercase tracking-wider text-white shadow-[0_8px_30px_rgba(99,102,241,0.3)] transition-all hover:shadow-[0_12px_40px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  ) : (
                    <span>Verify OTP</span>
                  )}
                </button>
              </div>


            </div>
          )}
        </div>
      </div>
    </div>
  );
}
