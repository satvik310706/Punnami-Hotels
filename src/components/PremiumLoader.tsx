'use client';

export default function PremiumLoader() {
  return (
    <div className="fixed inset-0 bg-[#1C1A17] z-[9999] flex flex-col items-center justify-center overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Rotating mandala/glowing ring wrapper */}
      <div className="relative w-20 h-20 mb-5">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 rounded-full border border-amber-500/20 animate-[spin_8s_linear_infinite]" />
        
        {/* Middle segmented loader ring */}
        <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-amber-500 border-r-amber-500 animate-[spin_1.5s_linear_infinite_reverse]" />

        {/* Inner pulsing center */}
        <div className="absolute inset-5 flex items-center justify-center animate-pulse">
          <div className="w-6 h-6 rounded-full border border-amber-500/40 flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
          </div>
        </div>
      </div>

      {/* Brand text */}
      <div className="text-center animate-in fade-in duration-500">
        <h2 
          className="text-amber-500 font-bold text-lg uppercase tracking-widest leading-none mb-1.5"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', letterSpacing: '0.25em' }}
        >
          Punnami Hotels
        </h2>
        <p className="text-stone-500 text-[10px] uppercase tracking-[0.3em] font-semibold">
          Luxury & Comfort
        </p>
      </div>
    </div>
  );
}

