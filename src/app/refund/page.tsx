import { Metadata } from 'next';
import { Wallet, CheckCircle2, Clock, HelpCircle, FileX, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Refund Policy | Punnami Southern Residency',
  description: 'Refund guidelines, cancellation policy, and timelines for stays at Punnami Southern Residency.',
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
            Cancellation & Refund Policy
          </h1>
          <div className="w-24 h-1 bg-amber-600 mx-auto rounded-full mb-6"></div>
          <p className="text-stone-300 max-w-2xl mx-auto text-lg leading-relaxed">
            This policy outlines the parameters, cancellation rules, and processing timelines for stay bookings operated under lease by Telangana Godavari Boat Tourism.
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
                  <FileX className="h-4 w-4 text-amber-700" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 m-0" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  1. Room Stay Cancellation & Refund Rules
                </h2>
              </div>
              <div className="pl-11">
                <div className="text-base text-stone-600 bg-stone-50 p-6 rounded-2xl border border-stone-100 space-y-4">
                  <p>
                    All stay bookings at Punnami Southern Residency (operated under lease by <strong>Telangana Godavari Boat Tourism</strong>) are governed by the following refund parameters:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>50% Advance Bookings:</strong> If you paid a 50% advance amount to secure your reservation, the advance is completely <strong>non-refundable</strong> under any cancellation window.
                    </li>
                    <li>
                      <strong>100% Full Payment Bookings:</strong>
                      <ul className="list-circle pl-5 mt-1 space-y-1">
                        <li>
                          If cancelled <strong>4 or more days before the scheduled check-in date</strong>: You are eligible for a <strong>50% refund</strong> of the total booking value.
                        </li>
                        <li>
                          If cancelled <strong>less than 4 days before the check-in date</strong> (or in case of a no-show): The booking is completely <strong>non-refundable</strong>.
                        </li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-amber-700" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 m-0" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  2. Rescheduling Policy (Postponement / Preponement)
                </h2>
              </div>
              <div className="pl-11">
                <p className="text-base text-stone-600 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                  Rescheduling requests (to postpone or prepone stay dates) can only be submitted <strong>4 or more days before the scheduled check-in date</strong>. Any rescheduling requests submitted within 4 days of check-in cannot be entertained and will be subject to standard cancellation rules.
                </p>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <HelpCircle className="h-4 w-4 text-amber-700" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 m-0" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  3. Failed Online Payments
                </h2>
              </div>
              <div className="pl-11">
                <p className="text-base text-stone-600 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                  In the event of a transaction failure where funds are debited from your bank account/card but the booking confirmation/stay ticket fails to generate on our site, the gateway provider (PhonePe) will automatically reconcile the transaction. The debited money will be refunded directly back to your original source account (UPI, Card, or Bank Account) within <strong>2 to 3 business days</strong>.
                </p>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-4 w-4 text-amber-700" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 m-0" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  4. Refund Processing & Mode of Payment
                </h2>
              </div>
              <div className="pl-11">
                <p className="text-base text-stone-600 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                  All eligible refunds (e.g. duplicate payment or cancellation of a 100% prepaid booking 4+ days prior) will be credited directly back to the original source account (UPI, credit/debit card, or net banking) used during checkout. Refund transactions are initiated within 48 hours of verification and take <strong>5 to 7 business days</strong> to reflect in your account.
                </p>
              </div>
            </section>

            <section className="border-t border-stone-200 pt-6">
              <p className="text-xs text-stone-500 italic">
                For any help regarding cancellations, duplicate payments, or refund status, please email us at <strong>info@punnamihotels.com</strong> or call <strong>+91 95420 69573</strong>.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
