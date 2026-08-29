'use client';

interface InlineLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export default function InlineLoader({ size = 'md', label, className = '' }: InlineLoaderProps) {
  const sizes = {
    sm: { outer: 'w-6 h-6', border: 'border-2', dot: 'w-1.5 h-1.5', text: 'text-[10px]' },
    md: { outer: 'w-9 h-9', border: 'border-2', dot: 'w-2 h-2', text: 'text-xs' },
    lg: { outer: 'w-12 h-12', border: 'border-[3px]', dot: 'w-2.5 h-2.5', text: 'text-xs' },
  };
  const s = sizes[size];

  return (
    <div className={`flex flex-col items-center justify-center gap-2.5 select-none ${className}`}>
      <div className={`relative ${s.outer} flex items-center justify-center`}>
        {/* Outer subtle ring */}
        <div className={`absolute inset-0 rounded-full ${s.border} border-amber-200/50`} />
        {/* Spinning indicator */}
        <div className={`absolute inset-0 rounded-full ${s.border} border-transparent border-t-amber-600 border-r-amber-500/50 animate-spin`} />
        {/* Center dot */}
        <div className={`${s.dot} rounded-full bg-amber-600 animate-pulse`} />
      </div>

      {label && (
        <p className={`${s.text} text-stone-500 uppercase tracking-widest font-bold`}>
          {label}
        </p>
      )}
    </div>
  );
}

