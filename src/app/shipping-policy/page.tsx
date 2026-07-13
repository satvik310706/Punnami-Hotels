import { Metadata } from 'next';
import { Send, MapPin, Inbox, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy | Punnami Southern Residency',
  description: 'Shipping, fulfillment, and digital delivery policies for Punnami Southern Residency.',
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Premium Hero Header */}
      <div className="bg-stone-900 relative pb-32 pt-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-600 via-stone-900 to-stone-900"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="w-16 h-16 mx-auto bg-stone-800/80 rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-stone-700/50">
            <Send className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Shipping & Delivery Policy
          </h1>
          <div className="w-24 h-1 bg-amber-600 mx-auto rounded-full mb-6"></div>
          <p className="text-stone-300 max-w-2xl mx-auto text-lg leading-relaxed">
            Fulfillment terms and service delivery protocols for reservations booked at Punnami Southern Residency (operated under lease by <strong>Telangana Godavari Boat Tourism</strong> | Proprietor: Mr. Nalla Saibabu | GSTIN: 36AWFPN4986M2ZO).
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
                  <ShieldCheck className="h-4 w-4 text-amber-700" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 m-0" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  1. Shipping of Physical Goods
                </h2>
              </div>
              <div className="pl-11">
                <p className="text-base text-stone-600 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                  Punnami Southern Residency operates strictly as a hospitality lodging and service provider. We do not sell or ship physical products, merchandise, or tangible goods. Consequently, physical shipping services, delivery couriers, tracking codes, and shipping charges are <strong>not applicable</strong> to any transactions conducted on our site.
                </p>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Inbox className="h-4 w-4 text-amber-700" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 m-0" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  2. Digital Ticket Delivery
                </h2>
              </div>
              <div className="pl-11">
                <p className="text-base text-stone-600 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                  Upon a successful online payment transaction through our secure PhonePe gateway, your reservation is verified instantly. A booking confirmation receipt and a digital stay ticket are delivered <strong>immediately</strong> (typically within 1 to 5 minutes) to the email address you provided during the booking process.
                </p>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-amber-700" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 m-0" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  3. Service Fulfillment Location
                </h2>
              </div>
              <div className="pl-11">
                <p className="text-base text-stone-600 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                  The actual physical stay service is rendered on the dates specified in your booking stay ticket, directly at our lodge property located at:
                  <br />
                  <strong className="text-stone-900 block mt-2 text-base">
                    Punnami southern residency, Shilpinagar, 10-1-34, Ramalayam Road, beside Kodanda, Bhadrachalam, BHADRACHALAM, Telangana 507111
                  </strong>
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
