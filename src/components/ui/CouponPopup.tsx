'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Info, BadgePercent } from 'lucide-react';
import { useModalStore } from '@/hooks/useModalStore';

interface CouponPopupProps {
  targetId: string;
  checkInDate?: Date;
}

const Coin = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="#FFD700" stroke="#D97706" strokeWidth="4"/>
    <circle cx="50" cy="50" r="35" fill="#FBBF24" stroke="#D97706" strokeWidth="2"/>
    <text x="50" y="66" fontSize="42" fill="#B45309" textAnchor="middle" fontWeight="black">₹</text>
  </svg>
);

const Sparkle = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M25 0C25 0 28 18 50 25C50 25 28 32 25 50C25 50 22 32 0 25C0 25 22 18 25 0Z" fill="white"/>
  </svg>
);

interface Coupon {
  code: string;
  discountType: 'FLAT' | 'PERCENTAGE';
  discountValue: number;
  minBookingAmt: number | null;
  maxDiscount: number | null;
  isWeekendOnly: boolean;
  isWeekdayOnly: boolean;
  applicableRoomIds: string | null;
}

export default function CouponPopup({ targetId, checkInDate }: CouponPopupProps) {
  const { showAlert } = useModalStore();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch(`/api/v1/coupons/active?target_id=${targetId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setCoupons(data);
            // Show popup after a small delay on entry
            setTimeout(() => setIsOpen(true), 1500);
          }
        }
      } catch (err) {
        console.error('Failed to fetch coupons', err);
      }
    };
    fetchCoupons();
  }, [targetId]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    
    // Dispatch custom event to auto-fill the coupon code input
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('apply-coupon', { detail: { code } }));
      localStorage.setItem('pending_coupon', code);
    }
    
    setTimeout(() => {
      setCopiedCode(null);
      setIsOpen(false);
    }, 1200);
  };

  if (!isOpen || coupons.length === 0) return null;

  const c = coupons[0];

  const checkInDay = checkInDate ? (checkInDate instanceof Date ? checkInDate.getDay() : new Date(checkInDate).getDay()) : null;
  const isWeekend = checkInDay === 0 || checkInDay === 6;
  const isWeekday = checkInDay !== null && !isNaN(checkInDay) && checkInDay !== 0 && checkInDay !== 6;

  const isCurrentlyApplicable = c.isWeekendOnly 
    ? isWeekend 
    : c.isWeekdayOnly 
    ? isWeekday 
    : true;

  if (!isCurrentlyApplicable) return null;

  const roundedDiscount = Math.round(c.discountValue);
  const discountText = c.discountType === 'PERCENTAGE' 
    ? `${roundedDiscount}% OFF` 
    : `₹${roundedDiscount} OFF`;
    
  let rulesText = '';
  if (c.minBookingAmt) {
    rulesText = `On orders above ₹${c.minBookingAmt}`;
  } else {
    rulesText = 'Valid on this booking';
  }

  // Weekday/weekend constraints text for details
  const timeConstraintsText = c.isWeekendOnly 
    ? 'Valid for weekend stays (Sat & Sun) only.' 
    : c.isWeekdayOnly 
    ? 'Valid for weekday stays (Mon to Fri) only.' 
    : '';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-stone-900/60 backdrop-blur-md p-4 overflow-hidden"
        >
          {/* Main Wrapper for Popup + Floating Elements */}
          <div className="relative w-full max-w-md">
            
            {/* Floating Coins */}
            <motion.div initial={{ y: 50, x: -20, opacity: 0, scale: 0 }} animate={{ y: -60, x: -50, opacity: 1, scale: 1, rotate: -15 }} transition={{ delay: 0.1, type: "spring" }} className="absolute -left-4 top-0 z-20 w-12 h-12 sm:w-16 sm:h-16 pointer-events-none drop-shadow-xl hidden sm:block">
              <Coin />
            </motion.div>
            <motion.div initial={{ y: 50, x: 20, opacity: 0, scale: 0 }} animate={{ y: -60, x: 20, opacity: 1, scale: 1.2, rotate: 25 }} transition={{ delay: 0.2, type: "spring" }} className="absolute -right-4 sm:-right-8 top-10 z-20 w-16 h-16 sm:w-24 sm:h-24 pointer-events-none drop-shadow-xl hidden sm:block">
              <Coin />
            </motion.div>
            <motion.div initial={{ y: 50, x: -20, opacity: 0, scale: 0 }} animate={{ y: 40, x: -60, opacity: 1, scale: 0.9, rotate: -40 }} transition={{ delay: 0.3, type: "spring" }} className="absolute -left-6 sm:-left-12 top-20 z-20 w-10 h-10 sm:w-14 sm:h-14 pointer-events-none drop-shadow-xl hidden sm:block">
              <Coin />
            </motion.div>
            <motion.div initial={{ y: 50, x: 20, opacity: 0, scale: 0 }} animate={{ y: 80, x: 60, opacity: 1, scale: 1, rotate: 15 }} transition={{ delay: 0.4, type: "spring" }} className="absolute -right-4 sm:-right-6 top-32 z-20 w-14 h-14 sm:w-20 sm:h-20 pointer-events-none drop-shadow-xl hidden sm:block">
              <Coin />
            </motion.div>

            {/* Sparkles */}
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute -left-16 top-10 z-10 w-6 h-6 hidden sm:block">
              <Sparkle />
            </motion.div>
            <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} className="absolute -right-12 -top-4 z-10 w-8 h-8 hidden sm:block">
              <Sparkle />
            </motion.div>

            <motion.div
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="relative w-full drop-shadow-2xl"
            >
              {/* Ticket Top Area (Amber/Orange Theme) */}
              <div className="relative bg-gradient-to-br from-amber-500 to-amber-600 px-6 py-10 text-center text-white rounded-t-3xl overflow-hidden animate-pulse-slow"
                   style={{
                     maskImage: 'radial-gradient(circle at bottom, transparent 10px, black 11px)',
                     maskSize: '24px 100%',
                     maskPosition: 'bottom',
                   }}>
                
                <div className="relative z-10 flex flex-col items-center mt-4">
                  <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-yellow-200 drop-shadow-sm">
                    ✨ SPECIAL OFFER ✨
                  </h3>
                  <div className="text-5xl sm:text-[4.5rem] font-black tracking-tighter drop-shadow-lg leading-[1.1] whitespace-nowrap">
                    {discountText}
                  </div>
                  <p className="mt-3 text-xs sm:text-sm font-bold tracking-wider text-amber-50 uppercase drop-shadow-md bg-black/10 px-3 py-1.5 rounded-full inline-block">
                    {rulesText}
                  </p>
                </div>
              </div>

              {/* Ticket Bottom Area (White) */}
              <div className="relative bg-white px-5 py-6 sm:px-8 sm:py-8 text-center rounded-b-3xl">
                {/* Dashed tear line */}
                <div className="absolute top-0 left-6 right-6 h-[2px] border-t-2 border-dashed border-stone-200 -mt-[1px]"></div>
                
                <div className="mb-6 space-y-3">
                  {isCurrentlyApplicable ? (
                    <div className="flex items-center gap-4 rounded-2xl bg-green-50/50 border border-green-100 px-5 py-3 text-left shadow-sm animate-fade-in">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 shadow-inner">
                        <Check className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-bold text-stone-700">Verified and applicable for your current booking.</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 rounded-2xl bg-rose-50 border border-rose-100 px-5 py-3 text-left shadow-sm animate-fade-in">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 shadow-inner">
                        <X className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-bold text-rose-700">Not applicable for your selected stay dates.</p>
                    </div>
                  )}
                  
                  {timeConstraintsText && (
                    <div className="flex items-center gap-4 rounded-2xl bg-stone-50 border border-stone-100 px-5 py-3 text-left shadow-sm">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-inner">
                        <BadgePercent className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-bold text-stone-700">{timeConstraintsText}</p>
                    </div>
                  )}

                  {c.maxDiscount && (
                    <div className="flex items-center gap-4 rounded-2xl bg-stone-50 border border-stone-100 px-5 py-3 text-left shadow-sm">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 shadow-inner">
                        <Info className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-bold text-stone-700">Maximum discount capped at ₹{c.maxDiscount}.</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleCopy(c.code)}
                  disabled={!isCurrentlyApplicable}
                  className={`group relative flex w-full items-center justify-center gap-2 sm:gap-3 overflow-hidden rounded-full px-4 py-4 sm:px-6 sm:py-5 font-black text-white text-base sm:text-lg transition-all ${
                    isCurrentlyApplicable 
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-[0_8px_20px_rgba(245,158,11,0.4)] hover:from-amber-600 hover:to-amber-700 hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(245,158,11,0.5)] active:translate-y-0 cursor-pointer' 
                      : 'bg-stone-300 cursor-not-allowed shadow-none'
                  }`}
                >
                  {isCurrentlyApplicable && (
                    <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-150%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(150%)]">
                      <div className="relative h-full w-8 bg-white/20" />
                    </div>
                  )}
                  {copiedCode === c.code ? (
                    <>
                      <Check className="h-6 w-6 text-white" />
                      <span>Code Copied!</span>
                    </>
                  ) : !isCurrentlyApplicable ? (
                    <span>Invalid Dates Selection</span>
                  ) : (
                    <>
                      <span>Copy Code & Book</span>
                    </>
                  )}
                </button>
              </div>

              {/* Close Button */}
              <div className="absolute -bottom-14 left-0 right-0 flex justify-center">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-white backdrop-blur-md transition-transform hover:scale-110"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
