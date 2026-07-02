'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Mail, Lock, ArrowRight, AlertCircle, EyeOff, Eye, Loader2 } from 'lucide-react';

export default function AgentLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setApiError('Please fill out all fields.');
      return;
    }

    setApiError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/agent/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        // Save locally
        localStorage.setItem('punnami_agent_profile', JSON.stringify(data.agent));
        router.push('/agent/dashboard');
        router.refresh();
      } else {
        setApiError(data.error || 'Invalid credentials or suspended account.');
      }
    } catch {
      setApiError('Failed to establish server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050c16] flex items-center justify-center px-4 py-12">
      {/* Glowing radial background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(20,184,166,0.18),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.12),transparent_55%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-indigo-500/8 blur-[130px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-500/25 to-indigo-500/10 border border-teal-500/30 shadow-[0_0_35px_rgba(20,184,166,0.25)]">
            <span className="absolute inset-0 rounded-2xl bg-teal-400/20 blur-md animate-pulse pointer-events-none" />
            <Briefcase className="h-7 w-7 text-teal-400 relative z-10" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase sm:text-4xl bg-gradient-to-r from-white via-white to-teal-300 bg-clip-text text-transparent">
            Agent Portal
          </h1>
          <p className="mt-2 text-xs font-medium uppercase tracking-widest text-teal-400/60">
            Secure Access Gateway
          </p>
        </div>

        {/* Translucent Glassmorphic Card */}
        <div className="relative rounded-3xl border border-white/[0.08] bg-[#07111e]/60 p-8 backdrop-blur-3xl shadow-[0_32px_80px_rgba(0,0,0,0.75)] overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-teal-400/40 to-transparent" />
          
          <form onSubmit={handleLoginSubmit} className="space-y-6 relative z-10">
            <div>
              <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-widest text-teal-400/70">
                Agent Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-teal-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent@example.com"
                  className="w-full rounded-2xl border border-white/10 bg-black/45 py-3.5 pl-12 pr-4 text-sm text-white placeholder-white/20 outline-none transition-all duration-300 focus:border-teal-400 focus:bg-black/60 focus:ring-4 focus:ring-teal-400/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-widest text-teal-400/70">
                Secure Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-teal-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/10 bg-black/45 py-3.5 pl-12 pr-12 text-sm text-white placeholder-white/20 outline-none transition-all duration-300 focus:border-teal-400 focus:bg-black/60 focus:ring-4 focus:ring-teal-400/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-teal-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {apiError && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3.5 text-sm text-red-300">
                <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-red-400" />
                <span>{apiError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative mt-8 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-teal-400 to-[#10b981] hover:from-teal-350 hover:to-[#059669] py-4 text-sm font-black uppercase tracking-wider text-black shadow-[0_8px_30px_rgba(20,184,166,0.3)] transition-all hover:shadow-[0_12px_40px_rgba(20,184,166,0.5)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Entering Console...</span>
                </>
              ) : (
                <>
                  <span>Access Agent Console</span>
                  <ArrowRight className="h-4.5 w-4.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
