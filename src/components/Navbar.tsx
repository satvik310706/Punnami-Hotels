'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Hotel, Phone } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { useEffect } from 'react';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const checkSession = async () => {
      // 1. Check Admin session
      try {
        const adminRes = await fetch('/api/v1/auth/admin/me');
        if (adminRes.ok) {
          const data = await adminRes.json();
          if (data.authenticated) {
            setIsAdmin(true);
            return;
          }
        }
      } catch {}

      if (typeof window !== 'undefined') {
        const adminAuth = localStorage.getItem('punnami_admin_auth') === 'true';
        setIsAdmin(adminAuth);
        if (adminAuth) return;
      }

      // 2. Check regular User session
      try {
        const userRes = await fetch('/api/v1/auth/me');
        if (userRes.ok) {
          const data = await userRes.json();
          if (data.authenticated && data.user) {
            setUserProfile(data.user);
            return;
          }
        }
      } catch {}
      setUserProfile(null);
    };
    checkSession();
  }, [pathname]);

  // Hide the public navbar in the admin panel
  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  const links = isAdmin 
    ? [
        { href: '/', label: 'Home' },
        { href: '/rooms', label: 'Rooms' },
        { href: '/admin', label: 'Dashboard' },
        { href: '/about', label: 'About' },
        { href: '/contact', label: 'Contact' },
      ]
    : [
        { href: '/', label: 'Home' },
        { href: '/rooms', label: 'Rooms' },
        { 
          href: '/my-bookings', 
          label: userProfile?.fullName 
            ? `My Bookings (${userProfile.fullName.split(' ')[0]})` 
            : 'My Bookings' 
        },
        { href: '/about', label: 'About' },
        { href: '/contact', label: 'Contact' },
      ];

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-12 h-12 bg-stone-950 rounded-xl flex items-center justify-center overflow-hidden shadow-md group-hover:shadow-amber-500/30 transition-all border border-amber-500/20">
              <img src="/logo.png" alt="PSR Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-bold text-stone-900 text-base leading-tight tracking-wide" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '18px' }}>
                Punnami Southern Residency
              </div>
              <div className="text-[9px] text-amber-700 font-semibold uppercase tracking-widest leading-tight">
                Comfort • Care • Convenience
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  pathname === href
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="tel:+919542069573"
              className="flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-amber-700 transition-colors"
            >
              <Phone className="h-4 w-4" />
              +91 95420 69573
            </a>
            <Link
              href="/rooms"
              className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl px-5 py-2 transition-colors shadow-sm"
            >
              Book Now
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {open && (
          <div className="md:hidden py-4 border-t border-stone-200 space-y-1">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  pathname === href ? 'bg-amber-50 text-amber-700' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                {label}
              </Link>
            ))}
            <div className="pt-2 px-4">
              <Link
                href="/rooms"
                onClick={() => setOpen(false)}
                className="block text-center bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl px-5 py-3 transition-colors"
              >
                Book Now
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
