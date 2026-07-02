'use client';

import { motion } from 'framer-motion';

export default function PremiumLoader() {
  return (
    <div className="fixed inset-0 bg-[#1C1A17] z-[9999] flex flex-col items-center justify-center overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Rotating mandala/glowing ring wrapper */}
      <div className="relative w-24 h-24 mb-6">
        {/* Outer glowing ring */}
        <motion.div
          className="absolute inset-0 rounded-full border border-amber-500/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Middle segmented loader ring */}
        <motion.div
          className="absolute inset-2 rounded-full border-t-2 border-r-2 border-amber-500"
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />

        {/* Inner rotating flower/mandala geometry */}
        <motion.div 
          className="absolute inset-6 flex items-center justify-center"
          animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-8 h-8 rounded-full border border-amber-500/40 relative flex items-center justify-center">
            <div className="w-3 h-3 bg-amber-500 rounded-full" />
          </div>
        </motion.div>
      </div>

      {/* Brand text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-center"
      >
        <h2 
          className="text-amber-500 font-bold text-xl uppercase tracking-widest leading-none mb-1.5"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', letterSpacing: '0.25em' }}
        >
          Punnami Hotels
        </h2>
        <p className="text-stone-500 text-[10px] uppercase tracking-[0.3em] font-semibold">
          Luxury & Comfort
        </p>
      </motion.div>
    </div>
  );
}
