import { Metadata } from 'next';
import { FileX, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cancellation Policy | Punnami Southern Residency',
  description: 'Cancellation and modification policies for Punnami Southern Residency.',
};

export default function CancellationPolicy() {
  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Premium Hero Header */}
      <div className="bg-stone-900 relative pb-32 pt-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-600 via-stone-900 to-stone-900"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="w-16 h-16 mx-auto bg-stone-800/80 rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-stone-700/50">
            <FileX className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Cancellation Policy
          </h1>
          <div className="w-24 h-1 bg-amber-600 mx-auto rounded-full mb-6"></div>
          <p className="text-stone-300 max-w-2xl mx-auto text-lg">
            Clear, transparent guidelines for modifying or canceling your stay with Punnami Southern Residency.
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
                  <span className="font-bold text-amber-700">1</span>
                </div>
                <h2 className="text-2xl font-bold text-stone-900 m-0" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  Deadlines & Charges
                </h2>
              </div>
              <div className="pl-11 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                <ul className="space-y-4 m-0">
                  <li className="flex items-start gap-3">
                    <ShieldCheck className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-stone-900 block text-base mb-1">24 Hours or More Before Check-in</strong>
                      <span className="text-sm">Full refund (100% of paid booking amount will be refunded directly to original source).</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <FileX className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-stone-900 block text-base mb-1">Within 24 Hours of Check-in</strong>
                      <span className="text-sm">No refund (100% cancellation charge applies).</span>
                    </div>
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="font-bold text-amber-700">2</span>
                </div>
                <h2 className="text-2xl font-bold text-stone-900 m-0" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  How to Cancel
                </h2>
              </div>
              <div className="pl-11">
                <p className="text-base text-stone-600">
                  To request a cancellation, please call our support desk immediately at <strong className="text-stone-900">+91 95420 69573</strong> or write to <strong className="text-stone-900">info@punnamihotels.com</strong> with your Booking ID.
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
