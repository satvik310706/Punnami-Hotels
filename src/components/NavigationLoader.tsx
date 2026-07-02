'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  // Clear loading state when route changes
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  // Intercept all link clicks to show loader
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Find the closest anchor tag in case they clicked an icon/span inside the link
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor && anchor.href) {
        try {
          const url = new URL(anchor.href);
          const isExternal = url.origin !== window.location.origin;
          const isSamePage = url.pathname === window.location.pathname && url.search === window.location.search;
          const isTargetBlank = anchor.target === '_blank';
          const isDownload = anchor.hasAttribute('download');
          const isHashLink = url.hash.length > 0 && isSamePage;
          const isTelOrMail = url.protocol === 'tel:' || url.protocol === 'mailto:';

          if (!isExternal && !isSamePage && !isTargetBlank && !isDownload && !isHashLink && !isTelOrMail) {
            setIsNavigating(true);
          }
        } catch (err) {
          // Ignore invalid URLs
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  if (!isNavigating) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-stone-900/20 backdrop-blur-[2px] flex items-center justify-center">
      <div className="bg-white/95 px-6 py-4.5 rounded-2xl shadow-2xl flex items-center gap-4 border border-amber-500/30 animate-in fade-in zoom-in-95 duration-200">
        <div className="relative flex items-center justify-center w-12 h-12">
          {/* Spinner Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-amber-100/50" />
          <div className="absolute inset-0 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
          {/* Centered Logo */}
          <div className="absolute inset-1 rounded-full bg-stone-950 overflow-hidden flex items-center justify-center border border-amber-500/10">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-0.5" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-black text-stone-800 tracking-wide uppercase">Punnami Southern Residency</span>
          <span className="text-[10px] font-bold text-amber-700/80 tracking-widest uppercase mt-0.5">Loading Page...</span>
        </div>
      </div>
    </div>
  );
}
