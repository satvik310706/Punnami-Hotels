'use client';

import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const REVIEWS = [
  {
    name: 'Ravi Kumar',
    location: 'Hyderabad',
    rating: 5,
    text: 'Exceptional stay! The rooms were spotless and the service was outstanding. Will definitely visit again.',
  },
  {
    name: 'Priya Sharma',
    location: 'Vijayawada',
    rating: 5,
    text: 'Perfect location, beautiful views, and incredibly comfortable beds. Punnami Southern Residency exceeded all expectations.',
  },
  {
    name: 'Arun Reddy',
    location: 'Rajahmundry',
    rating: 5,
    text: 'The breakfast was delicious and the staff were so helpful. Best hotel experience in Bhadrachalam!',
  },
  {
    name: 'Lakshmi Prasanna',
    location: 'Vizag',
    rating: 5,
    text: 'Very close to the main temple. The rooms are premium and spacious. The staff made us feel at home.',
  },
  {
    name: 'Venkat Rao',
    location: 'Bangalore',
    rating: 5,
    text: 'Excellent room service and hygiene. Perfect for family pilgrimages. The online booking process was super smooth.',
  },
];

export default function ReviewsCarousel() {
  const [active, setActive] = useState(0);

  const next = () => setActive((prev) => (prev + 1) % REVIEWS.length);
  const prev = () => setActive((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length);

  useEffect(() => {
    const timer = setInterval(next, 6500);
    return () => clearInterval(timer);
  }, []);

  const review = REVIEWS[active];

  return (
    <div className="relative max-w-3xl mx-auto px-4 sm:px-0">
      {/* Large decorative quote mark */}
      <div
        className="absolute -top-4 -left-2 sm:-left-8 text-amber-300/10 select-none pointer-events-none"
        style={{ fontFamily: 'Georgia, serif', fontSize: '10rem', lineHeight: 1, fontStyle: 'italic' }}
        aria-hidden
      >
        &ldquo;
      </div>

      {/* Slide area */}
      <div className="relative overflow-hidden min-h-[240px] sm:min-h-[220px] flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-full text-center px-4 sm:px-12"
          >
            {/* Stars */}
            <div className="flex justify-center gap-1 mb-6">
              {Array.from({ length: review.rating }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>

            {/* Review text */}
            <p
              className="text-stone-700 text-xl sm:text-2xl leading-relaxed mb-8 font-light"
              style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontStyle: 'italic' }}
            >
              &ldquo;{review.text}&rdquo;
            </p>

            {/* Reviewer */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-amber-900/50">
                {review.name[0]}
              </div>
              <div>
                <div className="text-stone-900 font-medium text-sm tracking-wide">{review.name}</div>
                <div className="text-stone-500 text-xs mt-0.5" style={{ letterSpacing: '0.1em' }}>{review.location}</div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Prev / Next arrows */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between pointer-events-none">
        <button
          onClick={prev}
          className="p-2.5 rounded-full border border-stone-200 bg-white text-stone-500 hover:border-amber-300 hover:text-amber-700 transition-all duration-200 pointer-events-auto shadow-sm"
          aria-label="Previous review"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={next}
          className="p-2.5 rounded-full border border-stone-200 bg-white text-stone-500 hover:border-amber-300 hover:text-amber-700 transition-all duration-200 pointer-events-auto shadow-sm"
          aria-label="Next review"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-10">
        {REVIEWS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActive(idx)}
            className={`h-px rounded-full transition-all duration-400 ${
              idx === active ? 'w-8 bg-amber-500' : 'w-4 bg-stone-300 hover:bg-stone-400'
            }`}
            aria-label={`Go to review ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
