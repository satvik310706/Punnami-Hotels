'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, LayoutDashboard, Sliders, LogOut, Bed, Ticket } from 'lucide-react';

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const isLoginPage = pathname === '/agent/login';

  useEffect(() => {
    const profile = localStorage.getItem('punnami_agent_profile');
    if (profile) {
      setIsAuthenticated(true);
    } else if (!isLoginPage) {
      router.push('/agent/login');
    }
    setCheckingAuth(false);
  }, [pathname, isLoginPage, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/agent/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    localStorage.removeItem('punnami_agent_profile');
    setIsAuthenticated(false);
    router.push('/agent/login');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#050c16] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Render children directly if on login page
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show loading while redirect runs
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050c16] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const menuItems = [
    { href: '/agent/dashboard', label: 'Console Home', icon: LayoutDashboard },
    { href: '/agent/dashboard/bookings', label: 'My bookings', icon: Ticket },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row">
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-[#07111e] text-stone-300 flex flex-col justify-between shrink-0 p-6">
        <div>
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base leading-none" style={{ fontFamily: 'Georgia, serif' }}>Agent Console</h2>
              <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">Punnami Partner</span>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/agent/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isActive ? 'bg-teal-600 text-white shadow-md' : 'hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-4">
          <Link 
            href="/rooms"
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            ← Public Rooms Bookings
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-stone-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Page viewport */}
      <main className="flex-1 overflow-x-hidden min-h-screen">
        {children}
      </main>
    </div>
  );
}
