'use client';

import Link from 'next/link';
import { Home, Hotel, Ticket, Info, Phone } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Hide on admin/agent routes
  if (pathname && (pathname.startsWith('/admin') || pathname.startsWith('/agent'))) {
    return null;
  }

  // Hide on room details pages (e.g. /rooms/executive-twin-room) to prevent overlapping with the sticky Book Room CTA bar
  const isRoomDetailsPage = pathname && pathname.startsWith('/rooms/') && pathname.split('/').length > 2;
  if (isRoomDetailsPage) {
    return null;
  }

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Rooms', href: '/rooms', icon: Hotel },
    { name: 'My Booking', href: '/bookings', icon: Ticket },
    { name: 'About', href: '/about', icon: Info },
    { name: 'Contact', href: '/contact', icon: Phone },
  ];

  return (
    <div className="print:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200/80 bg-white/95 pb-[calc(env(safe-area-inset-bottom)_+_0.45rem)] pt-1.5 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] backdrop-blur-md md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 items-center gap-1 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex min-h-[3.2rem] min-w-0 flex-col items-center justify-center rounded-xl px-0.5 py-1 transition-all duration-200 ${
                isActive
                  ? 'bg-amber-50 text-amber-700 font-bold shadow-[inset_0_0_0_1px_rgba(180,83,9,0.08)]'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <Icon className={`mb-1 h-5 w-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="w-full text-center text-[9px] font-bold leading-none tracking-tight">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
