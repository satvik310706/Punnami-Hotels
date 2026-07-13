'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Ticket, Home, Hotel, Info, LayoutDashboard, X, Menu, Star, Ship } from 'lucide-react';

// Icon + description lookup for each nav link
const NAV_META: Record<string, { icon: React.ElementType; desc: string }> = {
  home:         { icon: Home,            desc: 'Return to start page'    },
  rooms:        { icon: Hotel,           desc: 'Browse our luxury stays'  },
  papikondalu:  { icon: Ship,            desc: 'Boat tours & stays'       },
  dashboard:    { icon: LayoutDashboard, desc: 'Admin control panel'      },
  about:        { icon: Info,            desc: 'Our legacy & values'      },
  contact:      { icon: Phone,           desc: 'Locate us & get in touch' },
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Admin session check
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/v1/auth/admin/me');
        if (res.ok) {
          const d = await res.json();
          if (d.authenticated) {
            setIsAdmin(true);
            localStorage.setItem('punnami_admin_auth', 'true');
            return;
          }
        }
      } catch {}
      setIsAdmin(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('punnami_admin_auth');
      }
    };
    check();
  }, [pathname]);

  // Lock body scroll when mobile menu is open — use data attribute to avoid hydration mismatch
  useEffect(() => {
    const html = document.documentElement;
    if (open) {
      html.setAttribute('data-menu-open', '1');
      html.style.overflow = 'hidden';
    } else {
      html.removeAttribute('data-menu-open');
      html.style.overflow = '';
    }
    return () => {
      html.removeAttribute('data-menu-open');
      html.style.overflow = '';
    };
  }, [open]);

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Hide on admin / agent pages
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/agent')) return null;

  const isHeroPage = pathname === '/';
  const isTransparent = isHeroPage && !scrolled && !open;

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
        { href: 'https://www.tsboattourism.org/stays', label: 'Papikondalu' },
        { href: '/about', label: 'About' },
        { href: '/contact', label: 'Contact' },
      ];

  // Hamburger line colour
  const barColor = isTransparent ? 'bg-white' : 'bg-stone-700';

  return (
    <>
      {/* ═══════════════════════════════════════════════
          MAIN NAVBAR (sticky)
      ═══════════════════════════════════════════════ */}
      <nav
        className={`print:hidden sticky top-0 z-50 transition-all duration-500 ease-in-out ${
          isTransparent
            ? 'bg-transparent border-b border-transparent'
            : 'bg-white/97 backdrop-blur-2xl border-b border-stone-200/70 shadow-[0_1px_20px_rgba(0,0,0,0.06)]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ── */}
            <Link href="/" className="flex items-center gap-3 group shrink-0">
              <div
                className={`w-10 h-10 rounded-xl overflow-hidden transition-all duration-300 ring-1 ${
                  isTransparent
                    ? 'ring-white/15 group-hover:ring-amber-400/40'
                    : 'ring-stone-200/80 group-hover:ring-amber-400/50'
                }`}
              >
                <img src="/logo.png" alt="PSR" className="w-full h-full object-contain" />
              </div>
              <div className="leading-tight min-w-0">
                <div
                  className={`text-[15px] sm:text-[17px] font-medium tracking-wide transition-colors truncate ${
                    isTransparent ? 'text-white' : 'text-stone-900'
                  }`}
                  style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', letterSpacing: '0.025em' }}
                >
                  Punnami Southern Residency
                </div>
                <div className="hidden sm:block text-[8.5px] font-medium uppercase text-amber-600/80 mt-px" style={{ letterSpacing: '0.18em' }}>
                  Comfort &bull; Care &bull; Convenience
                </div>
              </div>
            </Link>

            {/* ── Desktop Nav Links ── */}
            <div className="hidden lg:flex items-center lg:gap-0.5 xl:gap-1">
              {links.map(({ href, label }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`whitespace-nowrap relative px-2.5 xl:px-4 py-2.5 text-xs xl:text-sm font-normal tracking-wide transition-colors duration-200 group ${
                      isActive
                        ? isTransparent ? 'text-amber-300' : 'text-amber-600'
                        : isTransparent
                        ? 'text-white/65 hover:text-white'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                    style={{ letterSpacing: '0.04em' }}
                  >
                    {label}
                    <span
                      className={`absolute bottom-1.5 left-4 right-4 h-px bg-amber-400 origin-left transition-transform duration-300 ease-out ${
                        isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      }`}
                    />
                  </Link>
                );
              })}
            </div>

            {/* ── Desktop Right Actions ── */}
            <div className="hidden lg:flex items-center lg:gap-2.5 xl:gap-4 shrink-0">
              <div className="relative group/phone">
                <button
                  className={`whitespace-nowrap flex items-center gap-1.5 text-xs xl:text-[13px] transition-colors duration-200 font-medium cursor-pointer ${
                    isTransparent ? 'text-white/50 hover:text-white/90' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>+91 95051 55166</span>
                </button>
                <div className={`absolute top-full left-0 mt-2 w-48 rounded-2xl shadow-xl py-3.5 px-4 flex flex-col gap-2.5 opacity-0 invisible group-hover/phone:opacity-100 group-hover/phone:visible transition-all duration-300 z-50 transform translate-y-1 group-hover/phone:translate-y-0 border ${
                  isTransparent 
                    ? 'bg-stone-950/90 backdrop-blur-xl border-stone-800/80 shadow-black/40 text-stone-300' 
                    : 'bg-white/95 backdrop-blur-xl border-stone-200/80 shadow-stone-200/50 text-stone-700'
                }`}>
                  <p className={`text-[9px] font-black uppercase tracking-wider mb-0.5 border-b pb-1 ${
                    isTransparent ? 'text-stone-500 border-stone-800' : 'text-stone-400 border-stone-100'
                  }`}>Stay Help Desk</p>
                  <a href="tel:+919505155166" className={`font-bold text-xs transition-colors flex items-center gap-2 ${
                    isTransparent ? 'text-stone-200 hover:text-amber-450' : 'text-stone-750 hover:text-amber-600'
                  }`}>
                    <Phone className="h-3.5 w-3.5 opacity-70 shrink-0" />
                    <span>+91 95051 55166</span>
                  </a>
                  <a href="tel:+919951369573" className={`font-bold text-xs transition-colors flex items-center gap-2 ${
                    isTransparent ? 'text-stone-200 hover:text-amber-450' : 'text-stone-750 hover:text-amber-600'
                  }`}>
                    <Phone className="h-3.5 w-3.5 opacity-70 shrink-0" />
                    <span>+91 99513 69573</span>
                  </a>
                  <a href="tel:+919912221274" className={`font-bold text-xs transition-colors flex items-center gap-2 ${
                    isTransparent ? 'text-stone-200 hover:text-amber-450' : 'text-stone-750 hover:text-amber-600'
                  }`}>
                    <Phone className="h-3.5 w-3.5 opacity-70 shrink-0" />
                    <span>+91 99122 21274</span>
                  </a>
                  <a href="tel:+919849848938" className={`font-bold text-xs transition-colors flex items-center gap-2 ${
                    isTransparent ? 'text-stone-200 hover:text-amber-450' : 'text-stone-750 hover:text-amber-600'
                  }`}>
                    <Phone className="h-3.5 w-3.5 opacity-70 shrink-0" />
                    <span>+91 98498 48938</span>
                  </a>
                </div>
              </div>

              <Link
                href="/bookings"
                className={`whitespace-nowrap flex items-center gap-1.5 text-xs xl:text-[13px] px-2.5 py-1.5 xl:px-4 xl:py-2 rounded-xl border transition-all duration-200 ${
                  pathname === '/bookings'
                    ? 'text-amber-700 border-amber-400/40 bg-amber-50'
                    : isTransparent
                    ? 'text-white/60 border-white/15 hover:border-white/35 hover:text-white'
                    : 'text-stone-600 border-stone-300/80 hover:border-stone-400 hover:text-stone-900'
                }`}
              >
                <Ticket className="h-3.5 w-3.5" />
                My Booking
              </Link>

              <a
                href="https://g.page/r/CbMysAE0rqDYEAI/review"
                target="_blank"
                rel="noopener noreferrer"
                className={`whitespace-nowrap flex items-center gap-1.5 text-xs xl:text-[13px] px-2.5 py-1.5 xl:px-4 xl:py-2 rounded-xl border transition-all duration-200 ${
                  isTransparent
                    ? 'text-amber-400 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/15'
                    : 'text-amber-800 border-amber-200 bg-amber-50/50 hover:bg-amber-100/50 hover:border-amber-300'
                }`}
              >
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span>Write a Review</span>
              </a>

              <Link
                href="/rooms"
                className="whitespace-nowrap btn-shimmer text-xs xl:text-[13px] font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl px-4 py-2 xl:px-5 xl:py-2.5 transition-all duration-200 shadow-lg shadow-amber-500/20 hover:shadow-amber-400/35 hover:-translate-y-px active:translate-y-0"
                style={{ letterSpacing: '0.03em' }}
              >
                Book Now
              </Link>
            </div>

            {/* ── Mobile Hamburger / Close Button ── */}
            <button
              onClick={() => setOpen(!open)}
              className={`lg:hidden flex flex-col items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 focus:outline-none ${
                open
                  ? 'bg-stone-100 text-stone-700'
                  : isTransparent
                  ? 'bg-white/10 hover:bg-white/20'
                  : 'bg-stone-100/60 hover:bg-stone-100'
              }`}
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {open ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <X className="h-5 w-5 text-stone-700" strokeWidth={2} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="open"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="flex flex-col gap-[5px] items-end"
                  >
                    <span className={`block w-5 h-0.5 rounded-full ${barColor}`} />
                    <span className={`block w-3.5 h-0.5 rounded-full ${barColor}`} />
                    <span className={`block w-5 h-0.5 rounded-full ${barColor}`} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════
          MOBILE DROPDOWN MENU
      ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop — click to close */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-30 bg-stone-900/50 backdrop-blur-[3px]"
            />

            {/* Slide-down card */}
            <motion.div
              key="menu"
              initial={{ y: -24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -24, opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="lg:hidden fixed top-16 left-3 right-3 z-40 bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden border border-stone-100/80"
            >
              {/* Gold top accent bar */}
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

              <div className="px-4 pt-5 pb-6 flex flex-col gap-4">

                {/* Nav Links */}
                <nav className="flex flex-col gap-1">
                  {links.map(({ href, label }, i) => {
                    const isActive = pathname === href;
                    const meta = NAV_META[label.toLowerCase()] ?? NAV_META.about;
                    const Icon = meta.icon;

                    return (
                      <motion.div
                        key={href}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.22, delay: i * 0.04, ease: 'easeOut' }}
                      >
                        <Link
                          href={href}
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl transition-all duration-150 ${
                            isActive
                              ? 'bg-amber-50 text-amber-700'
                              : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900'
                          }`}
                        >
                          {/* Icon pill */}
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                              isActive
                                ? 'bg-amber-100/60 border-amber-200/50 text-amber-600'
                                : 'bg-stone-50 border-stone-100 text-stone-400'
                            }`}
                          >
                            <Icon className="h-4 w-4" strokeWidth={isActive ? 2.5 : 1.75} />
                          </div>

                          {/* Label + sub-description */}
                          <div className="flex-1 min-w-0">
                            <div className={`text-[14px] font-semibold leading-tight ${isActive ? 'text-amber-700' : 'text-stone-800'}`}>
                              {label}
                            </div>
                            <div className="text-[11px] text-stone-400 mt-0.5 font-normal">
                              {meta.desc}
                            </div>
                          </div>

                          {/* Active dot */}
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                 {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />

                {/* Write a Review Button on Mobile */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: 0.16 }}
                  className="mb-1"
                >
                  <a
                    href="https://g.page/r/CbMysAE0rqDYEAI/review"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className="w-full flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100/70 text-amber-850 border border-amber-250 font-extrabold py-3.5 rounded-xl text-[13px] transition-colors shadow-sm"
                  >
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    <span>Write a Google Review</span>
                  </a>
                </motion.div>

                {/* CTA Row */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: 0.18 }}
                  className="flex items-center gap-3"
                >
                  <a
                    href="tel:+919505155166"
                    className="flex items-center gap-2 text-stone-500 hover:text-stone-800 text-[13px] font-medium transition-colors px-3 py-2.5 rounded-xl hover:bg-stone-50 flex-1 justify-center border border-stone-100"
                  >
                    <Phone className="h-3.5 w-3.5 text-amber-600/70 shrink-0" />
                    <span>95051 55166</span>
                  </a>
                  <Link
                    href="/rooms"
                    onClick={() => setOpen(false)}
                    className="btn-shimmer flex-1 text-center bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold py-2.5 rounded-xl text-[14px] transition-colors duration-200 shadow-md shadow-amber-500/15"
                    style={{ letterSpacing: '0.03em' }}
                  >
                    Book Now
                  </Link>
                </motion.div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
