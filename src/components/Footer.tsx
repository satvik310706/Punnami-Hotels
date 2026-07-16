'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, Mail, MapPin, Facebook, Instagram, Heart } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  if (pathname && (pathname.startsWith('/admin') || pathname.startsWith('/agent'))) {
    return null;
  }

  return (
    <footer className="bg-stone-900 text-stone-300 pb-20 md:pb-0">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-8 lg:px-16 py-8 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-10">
          {/* Brand */}
          <div className="lg:col-span-3">
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
              <a href="#" aria-label="Facebook" className="w-9 h-9 bg-stone-800 hover:bg-amber-600 rounded-lg flex items-center justify-center transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Instagram" className="w-9 h-9 bg-stone-800 hover:bg-amber-600 rounded-lg flex items-center justify-center transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links & Policies (Side by Side on mobile, taking lg:col-span-4 on desktop) */}
          <div className="grid grid-cols-2 gap-4 lg:col-span-4 md:col-span-2">
            {/* Quick Links */}
            <div>
              <h3 className="text-white font-bold text-[13px] sm:text-sm uppercase tracking-wider mb-2 sm:mb-4">Quick Links</h3>
              <ul className="space-y-1.5 sm:space-y-2.5">
                {[
                  { href: '/', label: 'Home' },
                  { href: '/rooms', label: 'Rooms' },
                  { href: '/contact', label: 'Contact Us' },
                  { href: '/bookings', label: 'My Bookings' },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-stone-400 hover:text-amber-400 transition-colors text-[12px] sm:text-xs font-medium">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Policies */}
            <div>
              <h3 className="text-white font-bold text-[13px] sm:text-sm uppercase tracking-wider mb-2 sm:mb-4">Policies</h3>
              <ul className="space-y-1.5 sm:space-y-2.5">
                {[
                  { href: '/terms', label: 'Terms & Conditions' },
                  { href: '/privacy', label: 'Privacy Policy' },
                  { href: '/refund', label: 'Refund & Cancellation' },
                  { href: '/shipping-policy', label: 'Shipping & Delivery' },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-stone-400 hover:text-amber-400 transition-colors text-[12px] sm:text-xs font-medium">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact */}
          <div className="md:col-span-2 lg:col-span-2">
            <h3 className="text-white font-bold text-[13px] sm:text-sm uppercase tracking-wider mb-2 sm:mb-4">Contact Us</h3>
            <ul className="space-y-3 sm:space-y-4">
              <li className="flex items-start gap-2 sm:gap-3 text-[13px] sm:text-sm">
                <MapPin className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <span className="text-stone-400 leading-normal text-[12px] sm:text-xs">
                  Punnami southern residency, Shilpinagar, 10-1-34, <br />
                  Ramalayam Road, beside Kodanda, <br />
                  Bhadrachalam, Telangana 507111
                </span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3 text-[13px] sm:text-sm">
                <Phone className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1.5 text-stone-400 font-medium text-[12px] sm:text-xs">
                  <a href="tel:+919505155166" className="py-1 hover:text-amber-400 transition-colors block">+91 95051 55166</a>
                  <a href="tel:+919542069573" className="py-1 hover:text-amber-400 transition-colors block">+91 95420 69573</a>
                </div>
              </li>
              <li className="flex items-center gap-2 sm:gap-3 text-[13px] sm:text-sm">
                <Mail className="h-4 w-4 text-amber-500 shrink-0" />
                <a href="mailto:info@punnamihotels.com" className="text-stone-400 hover:text-amber-400 transition-colors text-[12px] sm:text-xs">
                  info@punnamihotels.com
                </a>
              </li>
            </ul>
          </div>

          {/* Map Embed */}
          <div className="md:col-span-2 lg:col-span-3">
            <h3 className="text-white font-bold text-[13px] sm:text-sm uppercase tracking-wider mb-2 sm:mb-4">Locate Us</h3>
            <a 
              href="https://maps.app.goo.gl/NsFCq6zSKECAR3xj8" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full h-48 rounded-2xl overflow-hidden border border-stone-800 hover:border-amber-500/40 shadow-lg shadow-black/25 group relative bg-stone-950 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7603.2090375755115!2d80.8792299919917!3d17.668880383068224!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a36a9a06e5e9d51%3A0xd8a0ae3401b032b3!2sPUNNAMI%20HOTELS!5e0!3m2!1sen!2sin!4v1783932497024!5m2!1sen!2sin"
                width="100%"
                height="100%"
                title="Google Maps Location Embed"
                style={{ border: 0, filter: 'grayscale(0.2) contrast(1.1) brightness(0.95)' }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                className="transition-all duration-500 group-hover:filter-none absolute inset-0 pointer-events-none"
              />
              <div className="absolute bottom-2.5 right-2.5 bg-stone-900/95 text-[9px] text-amber-500 font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity duration-300 border border-stone-750 flex items-center gap-1.5 shadow-md">
                <MapPin className="h-3 w-3" /> Navigate
              </div>
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 pt-5 sm:mt-12 sm:pt-8 border-t border-stone-800 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-stone-400">
          <div>
            <p>© 2026 Punnami Southern Residency. All rights reserved.</p>
            <p className="text-[10px] text-stone-300 mt-1 max-w-md">
              Punnami Southern Residency is operated under lease by <strong>Telangana Godavari Boat Tourism</strong> (Proprietor: Nalla Saibabu | GSTIN: 36AWFPN4986M2ZO).
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/admin" className="hover:text-amber-400 transition-colors">Admin Portal</Link>
            <Link href="/agent/login" className="hover:text-amber-400 transition-colors">Agent Portal</Link>
          </div>
          <p className="flex items-center gap-1">
            Made with <Heart className="h-3 w-3 fill-red-500 text-red-500 shrink-0" /> by{' '}
            <a href="https://wa.me/918886154275" target="_blank" rel="noopener noreferrer" className="text-white font-bold hover:text-amber-400 transition-colors">Satvik</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
