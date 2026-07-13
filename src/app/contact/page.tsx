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
            Reach out to our customer support or visit our lodging directly. Punnami Southern Residency is operated under lease by <strong>Telangana Godavari Boat Tourism</strong> (Proprietor: Mr. Nalla Saibabu | GSTIN: 36AWFPN4986M2ZO).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm flex gap-3">
              <Phone className="h-5 w-5 text-amber-600 shrink-0 mt-1" />
              <div>
                <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Call Us (24/7 Help Desk)</div>
                <div className="flex flex-col gap-2 font-semibold text-stone-800 text-sm">
                  <a href="tel:+919505155166" className="hover:text-amber-700 transition-colors">+91 95051 55166</a>
                  <a href="tel:+919951369573" className="hover:text-amber-700 transition-colors">+91 99513 69573</a>
                  <a href="tel:+919912221274" className="hover:text-amber-700 transition-colors">+91 99122 21274</a>
                  <a href="tel:+919849848938" className="hover:text-amber-700 transition-colors">+91 98498 48938</a>
                </div>
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
                <p className="text-sm font-semibold text-stone-800 leading-normal">
                  Punnami southern residency, Shilpinagar, 10-1-34, <br />
                  Ramalayam Road, beside Kodanda, <br />
                  Bhadrachalam, Telangana 507111
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
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xl grid grid-cols-1 lg:grid-cols-3 gap-0">
          {/* Map Sidebar / Info Card */}
          <div className="p-6 sm:p-8 bg-stone-900 text-white flex flex-col justify-between lg:col-span-1 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-6">
                <MapPin className="h-3.5 w-3.5" /> Location Guide
              </div>
              <h3 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                Find Your Way
              </h3>
              <p className="text-stone-400 text-xs font-semibold leading-relaxed mb-6">
                Conveniently located at Ramalayam Road, beside Kodanda, Shilpinagar, Bhadrachalam. Easily accessible from major temple pilgrimage routes.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div>
                    <h4 className="text-[11px] font-black text-stone-200 uppercase tracking-wider">Sri Sita Ramachandra Swamy Temple</h4>
                    <p className="text-[10px] text-stone-400 font-semibold">900m away (3 mins drive / 10 mins walk)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div>
                    <h4 className="text-[11px] font-black text-stone-200 uppercase tracking-wider">Godavari River Ghats</h4>
                    <p className="text-[10px] text-stone-400 font-semibold">300m away (Short walk to the sacred river banks)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div>
                    <h4 className="text-[11px] font-black text-stone-200 uppercase tracking-wider">Bhadrachalam Bus Station</h4>
                    <p className="text-[10px] text-stone-400 font-semibold">1.2 km away (Easy local auto-rickshaw availability)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 sm:pt-4">
              <a
                href="https://maps.app.goo.gl/NsFCq6zSKECAR3xj8"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-wider rounded-xl py-3.5 transition shadow-lg shadow-amber-900/20"
              >
                <span>Open in Google Maps</span>
              </a>
            </div>
          </div>

          {/* Map Frame */}
          <div className="lg:col-span-2 relative min-h-[300px] lg:min-h-[450px]">
            {/* Mobile-only overlay to prevent gesture interception and allow page scroll */}
            <a 
              href="https://maps.app.goo.gl/NsFCq6zSKECAR3xj8" 
              target="_blank" 
              rel="noopener noreferrer"
              className="absolute inset-0 z-10 lg:hidden block cursor-pointer"
              aria-label="Open in Google Maps"
            />
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7603.2090375755115!2d80.8792299919917!3d17.668880383068224!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a36a9a06e5e9d51%3A0xd8a0ae3401b032b3!2sPUNNAMI%20HOTELS!5e0!3m2!1sen!2sin!4v1783932497024!5m2!1sen!2sin" 
              width="100%" 
              height="100%" 
              style={{ border: 0, minHeight: '300px' }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="strict-origin-when-cross-origin"
              className="w-full h-full object-cover pointer-events-none lg:pointer-events-auto"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
