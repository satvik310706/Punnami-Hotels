'use client';

import { motion } from 'framer-motion';

export default function ScrollIndicator() {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 cursor-pointer">
      <motion.div
        className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-1"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Smooth sliding wheel dot */}
        <motion.div
          className="w-1 h-2 bg-amber-400 rounded-full"
          animate={{ y: [0, 16, 0], opacity: [1, 0, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
      <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-white/50">Scroll</span>
    </div>
  );
}
