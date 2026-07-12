'use client';

import React, { useEffect, useState } from 'react';

export default function Loading() {
  const [loadingText, setLoadingText] = useState('Preparing your stay');
  const texts = ['Preparing your stay', 'Arranging luxury comfort', 'Curating your experience', 'Almost there'];

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % texts.length;
      setLoadingText(texts[index]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FAF8F5] select-none animate-in fade-in duration-500">
      {/* Premium ambient glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.03)_0%,transparent_70%)] pointer-events-none" />
      
      {/* Decorative luxury corners */}
      <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-amber-600/20 pointer-events-none hidden sm:block" />
      <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-amber-600/20 pointer-events-none hidden sm:block" />
      <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-amber-600/20 pointer-events-none hidden sm:block" />
      <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-amber-600/20 pointer-events-none hidden sm:block" />

      {/* Main Container */}
      <div className="flex flex-col items-center max-w-md w-full px-6 text-center z-10">
        
        {/* Visual Crest / Luxury Monogram */}
        <div className="relative mb-10 select-none scale-90 sm:scale-100">
          {/* Subtle pulse background aura */}
          <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-2xl animate-pulse" />

          {/* Outer Ring - Rotating very slowly */}
          <div className="absolute inset-0 rounded-full border border-amber-600/20 scale-[1.15]" />
          <div className="absolute inset-0 rounded-full border-t border-amber-500 scale-[1.15] animate-[spin_8s_linear_infinite]" />

          {/* Logo container */}
          <div className="w-32 h-32 rounded-full bg-stone-950 flex items-center justify-center overflow-hidden border border-amber-500/30 shadow-2xl relative">
            <img src="/logo.png" alt="Punnami Southern Residency Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Brand Name */}
        <h2 
          className="text-xl sm:text-2xl font-semibold text-stone-800 tracking-[0.15em] uppercase mb-4 text-center"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Punnami Southern Residency
        </h2>

        {/* Dynamic Loading Message */}
        <div className="relative h-6 flex items-center justify-center overflow-hidden mb-6">
          <p 
            key={loadingText}
            className="text-amber-700/70 text-[11px] sm:text-xs font-bold tracking-[0.25em] uppercase animate-in slide-in-from-bottom-2 fade-in duration-500"
          >
            {loadingText}
          </p>
        </div>

        {/* Sleek Line Progress Bar */}
        <div className="w-32 sm:w-40 h-[2px] bg-stone-200/60 rounded-full overflow-hidden relative">
          <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-amber-500 to-amber-700 rounded-full animate-[progress_1.8s_ease-in-out_infinite]" />
        </div>

      </div>

      {/* Progress CSS handled in globals.css */}
    </div>
  );
}
