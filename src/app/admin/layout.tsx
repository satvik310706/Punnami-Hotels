'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  KeyRound, LayoutDashboard, Sliders, LogOut, Bed, Calendar, Users, Menu, X, AlertTriangle 
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await fetch('/api/v1/auth/admin/me');
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(true);
        } else {
          router.push('/admin/login');
        }
      } catch {
        router.push('/admin/login');
      } finally {
        setCheckingAuth(false);
      }
    };
    verifySession();
  }, [pathname, isLoginPage, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/admin/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Backend logout failed:', err);
    }
    localStorage.removeItem('punnami_admin_auth');
    localStorage.removeItem('punnami_admin_token');
    setIsAuthenticated(false);
    router.push('/admin/login');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If on login page, render children directly without dashboard framework wrapper
  if (isLoginPage) {
    return <>{children}</>;
  }

  // If not authenticated and not on login page, show loading while redirect triggers
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/rooms', label: 'Room Categories', icon: Bed },
    { href: '/admin/inventory', label: 'Inventory Grid', icon: Sliders },
    { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
    { href: '/admin/cancellations', label: 'Cancellations', icon: AlertTriangle },
    { href: '/admin/postpones', label: 'Postponements', icon: Calendar },
    { href: '/admin/agents', label: 'Travel Agents', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row relative">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-stone-900 text-white p-4 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
            <KeyRound className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm leading-none" style={{ fontFamily: 'Georgia, serif' }}>Admin Control</h2>
            <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider">Punnami</span>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-stone-800 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <aside className={`
        fixed md:sticky inset-y-0 left-0 md:top-0 md:h-screen z-50 w-64 bg-stone-900 text-stone-300 flex flex-col justify-between shrink-0 p-6 
        transition-transform duration-300 ease-in-out md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-amber-600 rounded-xl flex items-center justify-center">
              <KeyRound className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base leading-none" style={{ fontFamily: 'Georgia, serif' }}>Admin Control</h2>
              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Punnami Southern Residency</span>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isActive ? 'bg-amber-600 text-white shadow-md' : 'hover:bg-stone-850 hover:text-white'
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
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:bg-stone-850 hover:text-white transition-colors"
          >
            ← Public Website
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-stone-400 hover:bg-stone-850 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Page viewport */}
      <main className="flex-1 overflow-x-hidden min-h-[calc(100vh-64px)] md:min-h-screen relative bg-stone-50">
        {children}
      </main>
    </div>
  );
}
