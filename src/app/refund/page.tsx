import { Metadata } from 'next';
import { Wallet, CheckCircle2, Clock, HelpCircle, FileX } from 'lucide-react';

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
          <p className="text-stone-300 max-w-2xl mx-auto text-lg leading-relaxed">
            This policy outlines the parameters, modes of payment, and processing timelines for customer transactions managed by Telangana Boat Tourism.
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
                  <FileX className="h-4 w-4 text-red-700" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 m-0" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  1. Strict Non-Refundable Policy
                </h2>
              </div>
              <div className="pl-11">
                <p className="text-base text-stone-600 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                  All room stays booked at Punnami Southern Residency (operated by Telangana Boat Tourism) are <strong>strictly non-refundable</strong>. Once a reservation is paid for and confirmed, payments cannot be refunded, returned, or credited back to the customer under any circumstances, including cancellations, booking modifications, or guest no-shows.
                </p>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <HelpCircle className="h-4 w-4 text-amber-700" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 m-0" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  2. Failed Online Payments
                </h2>
              </div>
              <div className="pl-11">
                <p className="text-base text-stone-600 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                  In the event of a transaction failure where funds are debited from your bank account/card but the booking confirmation/voucher fails to generate on our site, the gateway provider (PhonePe) will automatically reconcile the transaction. The debited money will be refunded directly back to your original source account (UPI, Card, or Bank Account) within <strong>2 to 3 business days</strong>.
                </p>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-amber-700" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 m-0" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  3. Duplicate Stay Bookings
                </h2>
              </div>
              <div className="pl-11">
                <p className="text-base text-stone-600 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                  If you have made a duplicate booking by mistake for the same stay dates and room type, please contact our support team immediately at <strong>info@punnamihotels.com</strong> or call <strong>+91 95420 69573</strong>. Following verification, any approved exceptions will be refunded to the original payment source within <strong>5 to 7 working days</strong>.
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
