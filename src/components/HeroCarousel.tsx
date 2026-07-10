'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920&q=80',
    alt: 'Punnami Hotels Grand Entrance',
  },
  {
    url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80',
    alt: 'Luxury Lobby Lounge',
  },
  {
    url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1920&q=80',
    alt: 'Deluxe Suite Comforts',
  },
  {
    url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1920&q=80',
    alt: 'Scenic Bedside View',
  },
];

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 0.5, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src={IMAGES[index].url}
            alt={IMAGES[index].alt}
            fill
            priority={index === 0}
            className="object-cover"
            sizes="100vw"
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/75" />
      
      {/* Slide indicators */}
      <div className="absolute bottom-10 right-10 z-20 flex gap-2">
        {IMAGES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === index ? 'w-6 bg-amber-500' : 'w-1.5 bg-white/40'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
