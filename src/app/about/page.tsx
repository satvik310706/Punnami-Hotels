import { Metadata } from 'next';
import Image from 'next/image';
import { Star, Award, ShieldCheck, HeartHandshake } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | Punnami Southern Residency',
  description: 'Learn about Punnami Southern Residency in Bhadrachalam — our journey, values, and commitment to providing premium comfort.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="relative py-24 bg-gradient-to-br from-stone-900 to-stone-800 text-white overflow-hidden text-center">
        <div className="absolute inset-0 opacity-20">
          <Image
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200"
            alt="Punnami Southern Residency"
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3">Our Legacy</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            About Punnami Southern Residency
          </h1>
          <p className="text-stone-300 max-w-xl mx-auto text-sm leading-relaxed">
            Nestled in the spiritual town of Bhadrachalam, we blend modern comfort with traditional hospitality.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-4xl mx-auto px-4 py-16 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold text-stone-900 mb-4" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              Our Story
            </h2>
            <p className="text-stone-600 text-sm leading-relaxed mb-4">
              Punnami Southern Residency was founded on a simple principle: to offer travelers, pilgrims, and families visiting Bhadrachalam a luxurious, tranquil, and comforting home away from home.
            </p>
            <p className="text-stone-600 text-sm leading-relaxed mb-4">
              We focus on premium room options, instant booking confirmation, and highly personalized service so that our guests can focus entirely on their visit or spiritual journey.
            </p>
            <p className="text-stone-600 text-sm leading-relaxed">
              Today, Punnami Southern Residency is operated under lease by <strong>Telangana Godavari Boat Tourism</strong> (Proprietor: Mr. Nalla Saibabu | GSTIN: 36AWFPN4986M2ZO). Under this stewardship, we continue to bring the highest standards of safety, cleanliness, and comfort to Bhadrachalam.
            </p>
          </div>
          <div className="relative h-72 rounded-2xl overflow-hidden shadow-lg border border-stone-200">
            <Image
              src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"
              alt="About Punnami Southern Residency"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>

        {/* Core Values */}
        <div>
          <h2 className="text-3xl font-bold text-stone-900 mb-8 text-center" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Our Core Values
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, title: 'Uncompromising Safety', desc: 'Secure environment with checked government ID logs and standard protocols.' },
              { icon: Award, title: 'Premium Comfort', desc: 'Fully A/C rooms, high-speed Wi-Fi, and top-tier custom room configurations.' },
              { icon: HeartHandshake, title: 'Exceptional Service', desc: '24/7 dedicated support staff to assist with temple coordinates and local tours.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm text-center">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mx-auto mb-4">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-stone-850 mb-2">{title}</h3>
                <p className="text-xs text-stone-650 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
