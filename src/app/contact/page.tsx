import { Metadata } from 'next';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import ContactForm from '@/components/ContactForm';
export const metadata: Metadata = {
  title: 'Contact Us | Punnami Southern Residency',
  description: 'Get in touch with Punnami Southern Residency. Contact details, address, maps location, and booking assistance.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="relative py-24 bg-gradient-to-br from-stone-900 to-stone-800 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3">Get in Touch</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Contact Us
          </h1>
          <p className="text-stone-300 max-w-xl mx-auto text-sm leading-relaxed">
            Have questions about booking, policies, or amenities? We are here to help 24/7.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Info */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Contact Information
          </h2>
          <p className="text-stone-600 text-sm leading-relaxed">
            Reach out to our customer support or visit our lodging directly. Punnami Southern Residency is owned and operated by <strong>Telangana Boat Tourism</strong> (Proprietor: Mr. Nalla Saibabu).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm flex gap-3">
              <Phone className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Call Us</div>
                <a href="tel:+919542069573" className="font-semibold text-stone-800 text-sm hover:text-amber-700 transition-colors">
                  +91 95420 69573
                </a>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm flex gap-3">
              <Mail className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Email Us</div>
                <a href="mailto:info@punnamihotels.com" className="font-semibold text-stone-800 text-sm hover:text-amber-700 transition-colors">
                  info@punnamihotels.com
                </a>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm flex gap-3 sm:col-span-2">
              <MapPin className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Address</div>
                <p className="text-sm font-semibold text-stone-800">
                  Punnami Southern Residency, Shilpi Nagar, Bhadrachalam, Telangana, 507111
                </p>
              </div>
            </div>
          </div>

          <div className="bg-stone-900 text-white rounded-2xl p-6 shadow-md flex items-start gap-4">
            <Clock className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-amber-500 mb-1">Check-in Timings</h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Standard Check-in is at <span className="text-white font-bold">12:00 PM</span>.<br />
                Standard Check-out is at <span className="text-white font-bold">11:00 AM</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Map Placeholder or Form */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-stone-950 mb-4" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Send Us a Message
          </h2>
          <ContactForm />
        </div>
      </section>

      {/* Google Maps Embed Section */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-md p-2">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3801.591537172071!2d80.88113787517149!3d17.669494583266612!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTfCsDQwJzEwLjIiTiA4MMKwNTMnMDEuNCJF!5e0!3m2!1sen!2sin!4v1783320394235!5m2!1sen!2sin" 
            width="100%" 
            height="400" 
            style={{ border: 0 }} 
            allowFullScreen={true} 
            loading="lazy" 
            referrerPolicy="strict-origin-when-cross-origin"
            className="rounded-2xl"
          ></iframe>
        </div>
      </section>
    </div>
  );
}
