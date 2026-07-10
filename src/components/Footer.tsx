'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Hotel, Phone, Mail, MapPin, Facebook, Instagram } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  if (pathname && (pathname.startsWith('/admin') || pathname.startsWith('/agent'))) {
    return null;
  }

  return (
    <footer className="bg-stone-900 text-stone-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
              <div className="w-12 h-12 bg-stone-950 rounded-xl flex items-center justify-center overflow-hidden border border-amber-500/20 shadow-md">
                <img src="/logo.png" alt="PSR Logo" width={48} height={48} className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="text-white font-bold text-lg leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
                  Punnami Southern Residency
                </div>
                <div className="text-amber-500 text-[10px] uppercase tracking-widest leading-tight">Comfort • Care • Convenience</div>
              </div>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed mb-3 sm:mb-4">
              Experience unmatched hospitality at Punnami Southern Residency. Your comfort is our commitment.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 bg-stone-800 hover:bg-amber-600 rounded-lg flex items-center justify-center transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-stone-800 hover:bg-amber-600 rounded-lg flex items-center justify-center transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links & Policies (Side by Side on Mobile) */}
          <div className="grid grid-cols-2 gap-4 sm:gap-8 md:col-span-1 lg:col-span-2">
            <div>
              <h3 className="text-white font-bold text-[13px] sm:text-sm uppercase tracking-wider mb-2 sm:mb-4">Quick Links</h3>
              <ul className="space-y-1.5 sm:space-y-2.5">
                {[
                  { href: '/', label: 'Home' },
                  { href: '/rooms', label: 'Browse Rooms' },
                  { href: '/about', label: 'About Us' },
                  { href: '/contact', label: 'Contact' },
                  { href: '/my-bookings', label: 'My Bookings' },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-[13px] sm:text-sm hover:text-amber-400 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold text-[13px] sm:text-sm uppercase tracking-wider mb-2 sm:mb-4">Policies</h3>
              <ul className="space-y-1.5 sm:space-y-2.5">
                {[
                  { href: '/cancellation', label: 'Cancellation Policy' },
                  { href: '/privacy', label: 'Privacy Policy' },
                  { href: '/terms', label: 'Terms & Conditions' },
                  { href: '/refund', label: 'Refund Policy' },
                  { href: '/shipping-policy', label: 'Shipping & Delivery' },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-[13px] sm:text-sm hover:text-amber-400 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact */}
          <div className="lg:col-span-1">
            <h3 className="text-white font-bold text-[13px] sm:text-sm uppercase tracking-wider mb-2 sm:mb-4">Contact Us</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li className="flex items-start gap-2 sm:gap-3 text-[13px] sm:text-sm">
                <MapPin className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <span className="text-stone-400">Punnami Southern Residency, <br />Shilpi Nagar, Bhadrachalam</span>
              </li>
              <li className="flex items-center gap-2 sm:gap-3 text-[13px] sm:text-sm">
                <Phone className="h-4 w-4 text-amber-500 shrink-0" />
                <a href="tel:+919542069573" className="text-stone-400 hover:text-amber-400 transition-colors">
                  +91 95420 69573
                </a>
              </li>
              <li className="flex items-center gap-2 sm:gap-3 text-[13px] sm:text-sm">
                <Mail className="h-4 w-4 text-amber-500 shrink-0" />
                <a href="mailto:info@punnamihotels.com" className="text-stone-400 hover:text-amber-400 transition-colors">
                  info@punnamihotels.com
                </a>
              </li>
            </ul>
            <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-stone-800 rounded-xl">
              <p className="text-xs text-stone-400">
                <span className="text-white font-semibold">Check-in:</span> 12:00 PM<br />
                <span className="text-white font-semibold">Check-out:</span> 11:00 AM
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 pt-5 sm:mt-12 sm:pt-8 border-t border-stone-800 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-stone-500">
          <div>
            <p>© 2026 Punnami Southern Residency. All rights reserved.</p>
            <p className="text-[10px] text-stone-600 mt-1 max-w-md">
              Punnami Southern Residency is operated under lease by <strong>Telangana Godavari Boat Tourism</strong> (Proprietor: Nalla Saibabu | GSTIN: 36AWFPN4986M2ZO).
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/admin" className="hover:text-amber-400 transition-colors">Admin Portal</Link>
            <Link href="/agent/login" className="hover:text-amber-400 transition-colors">Agent Portal</Link>
          </div>
          <p>
            Made with <span className="text-red-500">❤️</span> by <a href="https://wa.me/918886154275" target="_blank" rel="noopener noreferrer" className="text-white font-bold hover:text-amber-400 transition-colors">Satvik</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
