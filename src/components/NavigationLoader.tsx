'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear loading state and complete progress when route changes
  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept valid internal link clicks to start progress bar smoothly
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
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
            setProgress(30);

            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
              setProgress((prev) => {
                if (prev >= 85) {
                  if (timerRef.current) clearInterval(timerRef.current);
                  return 85;
                }
                return prev + Math.floor(Math.random() * 15 + 5);
              });
            }, 180);
          }
        } catch {
          // Ignore invalid URLs
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!isNavigating && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[999999] pointer-events-none h-1 bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}

