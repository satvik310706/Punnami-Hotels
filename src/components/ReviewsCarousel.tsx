'use client';

import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const REVIEWS = [
  { 
    name: 'Ravi Kumar', 
    location: 'Hyderabad', 
    rating: 5, 
    text: 'Exceptional stay! The rooms were spotless and the service was outstanding. Will definitely visit again.' 
  },
  { 
    name: 'Priya Sharma', 
    location: 'Vijayawada', 
    rating: 5, 
    text: 'Perfect location, beautiful views, and incredibly comfortable beds. Punnami Southern Residency exceeded all expectations.' 
  },
  { 
    name: 'Arun Reddy', 
    location: 'Rajahmundry', 
    rating: 5, 
    text: 'The breakfast was delicious and the staff were so helpful. Best hotel experience in Bhadrachalam!' 
  },
  {
    name: 'Lakshmi Prasanna',
    location: 'Vizag',
    rating: 5,
    text: 'Very close to the main temple. The rooms are premium and spacious. The staff made us feel at home.'
  },
  {
    name: 'Venkat Rao',
    location: 'Bangalore',
    rating: 5,
    text: 'Excellent room service and hygiene. Perfect for family pilgrimages. The online booking process was super smooth.'
  }
];

export default function ReviewsCarousel() {
  const [active, setActive] = useState(0);

  const next = () => {
    setActive((prev) => (prev + 1) % REVIEWS.length);
  };

  const prev = () => {
    setActive((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length);
  };

  // Auto-play every 6 seconds
  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative max-w-4xl mx-auto px-4 py-8">
      {/* Background quote icon decoration */}
      <div className="absolute top-0 left-12 text-stone-100 dark:text-stone-100/50 pointer-events-none select-none">
        <Quote className="h-24 w-24 opacity-40 rotate-180 fill-current" />
      </div>

      <div className="relative overflow-hidden min-h-[220px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="w-full text-center space-y-6 px-8 md:px-16"
          >
            {/* Rating */}
            <div className="flex justify-center gap-1.5">
              {Array.from({ length: REVIEWS[active].rating }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400 drop-shadow-sm" />
              ))}
            </div>

            {/* Testimonial Text */}
            <p className="text-stone-700 text-lg md:text-xl font-medium italic leading-relaxed max-w-2xl mx-auto">
              "{REVIEWS[active].text}"
            </p>

            {/* Guest Profile Details */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 to-amber-700 text-white flex items-center justify-center font-black text-base shadow-md mb-2">
                {REVIEWS[active].name[0]}
              </div>
              <span className="font-extrabold text-stone-900 text-sm tracking-tight">{REVIEWS[active].name}</span>
              <span className="text-stone-400 text-xs font-semibold">{REVIEWS[active].location}</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Control Buttons */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-2 pointer-events-none">
        <button
          onClick={prev}
          className="p-3 rounded-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 shadow-md transition-all active:scale-95 pointer-events-auto cursor-pointer"
          aria-label="Previous Review"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={next}
          className="p-3 rounded-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 shadow-md transition-all active:scale-95 pointer-events-auto cursor-pointer"
          aria-label="Next Review"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Dot Indicators */}
      <div className="flex justify-center gap-2.5 mt-8">
        {REVIEWS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActive(idx)}
            className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
              idx === active ? 'w-8 bg-amber-600' : 'w-2.5 bg-stone-300 hover:bg-stone-400'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
