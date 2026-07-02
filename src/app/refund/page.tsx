import { Metadata } from 'next';
import { Wallet, CheckCircle2, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Refund Policy | Punnami Southern Residency',
  description: 'Refund guidelines and timelines for cancellations at Punnami Southern Residency.',
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Premium Hero Header */}
      <div className="bg-stone-900 relative pb-32 pt-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-600 via-stone-900 to-stone-900"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="w-16 h-16 mx-auto bg-stone-800/80 rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-stone-700/50">
            <Wallet className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Refund Policy
          </h1>
          <div className="w-24 h-1 bg-amber-600 mx-auto rounded-full mb-6"></div>
          <p className="text-stone-300 max-w-2xl mx-auto text-lg">
            This policy details the guidelines, modes, and timelines for processed refunds at Punnami Southern Residency.
          </p>
        </div>
      </div>

      {/* Content Card overlapping header */}
      <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-20">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl border border-stone-200">
          <div className="prose prose-stone prose-lg max-w-none text-stone-600 space-y-8 leading-relaxed">
            
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-amber-700" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 m-0" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  1. Eligibility
                </h2>
              </div>
              <div className="pl-11">
                <p className="text-base text-stone-600 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                  Refunds are eligible only for bookings cancelled according to our cancellation policies. Bookings cancelled within 24 hours of check-in time are non-refundable.
                </p>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-amber-700" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 m-0" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  2. Processing Time
                </h2>
              </div>
              <div className="pl-11">
                <p className="text-base text-stone-600 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                  Eligible refunds are processed directly to the source account (bank account/UPI) within <strong className="text-stone-900">5 to 7 working days</strong> from the cancellation approval.
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
