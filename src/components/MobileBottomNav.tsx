'use client';

import Link from 'next/link';
import { Home, Hotel, Ticket, Info, Phone } from 'lucide-react';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { name: 'Home',       href: '/',        icon: Home   },
  { name: 'Rooms',      href: '/rooms',   icon: Hotel  },
  { name: 'Booking',    href: '/bookings',icon: Ticket },
  { name: 'About',      href: '/about',   icon: Info   },
  { name: 'Contact',    href: '/contact', icon: Phone  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Hide on admin/agent routes
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/agent')) return null;

  // Hide on room details pages to prevent overlapping the sticky Book CTA bar
  if (pathname?.startsWith('/rooms/') && pathname.split('/').length > 2) return null;

  return (
    <nav
      aria-label="Mobile navigation"
      className="mobile-bottom-nav print:hidden fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(231,229,228,0.8)',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.05)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 6px)',
      }}
    >
      <div className="grid grid-cols-5 items-stretch gap-0 px-1 pt-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname?.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                relative flex flex-col items-center justify-center gap-[3px]
                min-h-[3.25rem] px-1 py-1 rounded-xl
                transition-colors duration-150
                ${isActive
                  ? 'text-amber-600'
                  : 'text-stone-400 hover:text-stone-700'
                }
              `}
            >
              {/* Active indicator pill */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-amber-500"
                  aria-hidden
                />
              )}

              <Icon
                className={`h-5 w-5 transition-transform duration-150 ${isActive ? 'scale-110' : 'scale-100'}`}
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              <span
                className={`text-[9.5px] font-semibold leading-none tracking-tight ${
                  isActive ? 'text-amber-600' : 'text-stone-400'
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
