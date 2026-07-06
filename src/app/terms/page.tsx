import { Metadata } from 'next';
import { FileText, CalendarClock, UserCheck, AlertCircle, Building2, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Punnami Southern Residency',
  description: 'Terms and conditions for room bookings and usage of Punnami Southern Residency.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Premium Hero Header */}
      <div className="bg-stone-900 relative pb-32 pt-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-600 via-stone-900 to-stone-900"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="w-16 h-16 mx-auto bg-stone-800/80 rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-stone-700/50">
            <FileText className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Terms & Conditions
          </h1>
          <div className="w-24 h-1 bg-amber-600 mx-auto rounded-full mb-6"></div>
          <p className="text-stone-300 max-w-2xl mx-auto text-lg leading-relaxed">
            Welcome to Punnami Southern Residency. These Terms & Conditions govern your reservations, stay, and utilization of our online booking services.
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
                  <Building2 className="h-4 w-4 text-amber-700" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 m-0" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  1. Company & Brand Information
                </h2>
              </div>
              <div className="pl-11">
                <p className="text-base text-stone-600 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                  The brand website <strong>Punnami Southern Residency</strong> (referred to as "Hotel", "We", "Us", or "Our" or "PSR Residency") is owned, managed, and operated by the registered legal business entity <strong>Telangana Boat Tourism</strong> (Proprietor: Sri Nalla Saibabu). All online booking services, stay operations, and digital payments are processed under this legal entity.
                </p>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <CalendarClock className="h-4 w-4 text-amber-700" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 m-0" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  2. Booking and Reservation Conditions
                </h2>
              </div>
              <div className="pl-11">
                <div className="text-base text-stone-600 bg-stone-50 p-6 rounded-2xl border border-stone-100 space-y-3">
                  <p>
                    All stay reservations are subject to room availability. A room is temporarily held for up to 30 minutes during the checkout process.
                  </p>
                  <p>
                    Your booking is strictly confirmed only when the full payment (or selected advance amount) is successfully processed through our integrated online payment gateway (PhonePe). Upon successful payment, a digital booking voucher/stay ticket is automatically generated and sent to your registered email and mobile number.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <UserCheck className="h-4 w-4 text-amber-700" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 m-0" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  3. Check-in and Guest Identification
                </h2>
              </div>
              <div className="pl-11">
                <p className="text-base text-stone-600 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                  For safety and security reasons, guests must present a valid government-issued photo identity proof (Aadhaar Card, Passport, or Voter ID) matching the names in the passenger manifest during physical check-in at the property. PAN Card is not accepted as address proof.
                </p>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-4 w-4 text-amber-700" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 m-0" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  4. Damages, Liability, and Code of Conduct
                </h2>
              </div>
              <div className="pl-11">
                <p className="text-base text-stone-600 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                  We maintain a clean, family-friendly atmosphere. Guests are expected to maintain social decency and quiet hours. Any damage caused to hotel property, furniture, or fittings during the stay will be charged directly to the primary guest before checkout.
                </p>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <HelpCircle className="h-4 w-4 text-amber-700" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 m-0" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  5. Governing Jurisdiction
                </h2>
              </div>
              <div className="pl-11">
                <p className="text-base text-stone-600 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                  These terms are governed by and construed in accordance with the laws of India. Any disputes arising in connection with reservations or stays at Punnami Southern Residency shall be subject to the exclusive jurisdiction of the courts located in Bhadrachalam, Telangana.
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
