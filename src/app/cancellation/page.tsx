import { Metadata } from 'next';
import { FileX, ShieldCheck, Mail, Phone, CalendarRange } from 'lucide-react';

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
          <p className="text-stone-300 max-w-2xl mx-auto text-lg leading-relaxed">
            Clear and transparent guidelines for modifying or canceling your stay with Punnami Southern Residency (operated by Telangana Godavari Boat Tourism).
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
                  Timelines & Charges
                </h2>
              </div>
              <div className="pl-11 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                <div className="flex items-start gap-3">
                  <FileX className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-stone-900 block text-base mb-1">Strict Non-Refundable Policy</strong>
                    <span className="text-sm leading-relaxed block text-stone-600">
                      All room bookings confirmed at Punnami Southern Residency (operated by Telangana Godavari Boat Tourism) are <strong>strictly non-refundable</strong>. Once your booking is confirmed, no refunds will be issued under any circumstances, including cancellations or early departures. A 100% cancellation charge applies to all cancelled reservations.
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="font-bold text-amber-700">2</span>
                </div>
                <h2 className="text-2xl font-bold text-stone-900 m-0" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  Stay Postponements (Rescheduling)
                </h2>
              </div>
              <div className="pl-11 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                <div className="flex items-start gap-3">
                  <CalendarRange className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-stone-900 block text-base mb-1">Rescheduling Windows</strong>
                    <span className="text-sm leading-relaxed block">
                      Guests can request a postponement of travel dates by contacting support. 
                      Rescheduling requests must be submitted at least <strong>7 days prior</strong> to the original check-in date. Requests received inside the 7-day window are blocked to protect seasonal room inventory.
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="font-bold text-amber-700">3</span>
                </div>
                <h2 className="text-2xl font-bold text-stone-900 m-0" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  How to Initiate Cancellation / Modifications
                </h2>
              </div>
              <div className="pl-11">
                <div className="text-base text-stone-600 space-y-4">
                  <p>
                    To modify dates or cancel a stay, guests can contact our support desk directly:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div className="border border-stone-200 rounded-xl p-4 flex items-center gap-3 bg-stone-50/50">
                      <Phone className="h-5 w-5 text-amber-600" />
                      <div>
                        <div className="text-xs text-stone-400 font-bold uppercase">Call Support</div>
                        <a href="tel:+919542069573" className="font-bold text-stone-800 text-sm hover:underline">+91 95420 69573</a>
                      </div>
                    </div>
                    <div className="border border-stone-200 rounded-xl p-4 flex items-center gap-3 bg-stone-50/50">
                      <Mail className="h-5 w-5 text-amber-600" />
                      <div>
                        <div className="text-xs text-stone-400 font-bold uppercase">Email Support</div>
                        <a href="mailto:info@punnamihotels.com" className="font-bold text-stone-800 text-sm hover:underline">info@punnamihotels.com</a>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-stone-400 pt-2 leading-relaxed">
                    * Please specify your Booking ID (e.g. HTL-XXXXXXXXXXXXX) in your email or have it ready when calling to ensure fast processing.
                  </p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
