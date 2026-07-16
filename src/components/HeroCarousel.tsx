'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=75',
    alt: 'Punnami Southern Residency Grand Entrance',
  },
  {
    url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=75',
    alt: 'Luxury Lobby and Lounge',
  },
  {
    url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=75',
    alt: 'Deluxe Suite Interior',
  },
  {
    url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=75',
    alt: 'Scenic Bedroom with View',
  },
];

// Preload the next image so transitions are instant
function preloadImage(src: string) {
  if (typeof window === 'undefined') return;
  const img = new window.Image();
  img.src = src;
}

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);

  const advance = useCallback(() => {
    setIndex((prev) => {
      const next = (prev + 1) % IMAGES.length;
      // Pre-warm the image after that
      preloadImage(IMAGES[(next + 1) % IMAGES.length].url);
      return next;
    });
  }, []);

  useEffect(() => {
    // Preload second image immediately
    preloadImage(IMAGES[1].url);
    const timer = setInterval(advance, 6500);
    return () => clearInterval(timer);
  }, [advance]);

  return (
    <div className="absolute inset-0 z-0">
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          // GPU-accelerated positioning
          className="absolute inset-0 hero-carousel-img"
        >
          {/* Ken Burns zoom — single CSS animation for performance */}
          <div
            className="absolute inset-0 ken-burns-container"
            style={{
              transformOrigin: index % 2 === 0 ? 'center center' : '60% 40%',
            }}
          >
            <Image
              src={IMAGES[index].url}
              alt={IMAGES[index].alt}
              fill
              priority={index === 0}
              className="object-cover"
              sizes="100vw"
              quality={75}
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Multi-layer gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/85 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-amber-950/20 to-transparent pointer-events-none" />

      {/* Slide indicators */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {IMAGES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setIndex(idx)}
            className={`h-px rounded-full transition-all duration-500 ease-out ${
              idx === index ? 'w-8 bg-amber-400' : 'w-4 bg-white/25 hover:bg-white/45'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
