'use client';

import { motion } from 'framer-motion';

interface InlineLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export default function InlineLoader({ size = 'md', label, className = '' }: InlineLoaderProps) {
  const sizes = {
    sm: { outer: 'w-7 h-7', inner: 'w-4 h-4', dot: 'w-1.5 h-1.5', text: 'text-[10px]' },
    md: { outer: 'w-10 h-10', inner: 'w-6 h-6', dot: 'w-2 h-2', text: 'text-xs' },
    lg: { outer: 'w-14 h-14', inner: 'w-9 h-9', dot: 'w-2.5 h-2.5', text: 'text-xs' },
  };
  const s = sizes[size];

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      {/* Ring loader */}
      <div className={`relative ${s.outer} flex items-center justify-center`}>
        {/* Outer slow ring */}
        <motion.div
          className={`absolute inset-0 rounded-full border border-amber-400/30`}
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />
        {/* Main spinning arc */}
        <motion.div
          className={`absolute inset-0 rounded-full border-t-2 border-r border-amber-500/80`}
          style={{ borderColor: 'transparent', borderTopColor: '#C9A84C', borderRightColor: 'rgba(201,168,76,0.3)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        />
        {/* Inner pulsing dot */}
        <motion.div
          className={`${s.dot} rounded-full bg-amber-500`}
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Optional label */}
      {label && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className={`${s.text} text-stone-400 uppercase tracking-widest font-semibold`}
        >
          {label}
        </motion.p>
      )}
    </div>
  );
}
