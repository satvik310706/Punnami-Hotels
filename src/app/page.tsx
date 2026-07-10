import { Metadata } from 'next';
import Link from 'next/link';
import { Wifi, Wind, Car, Flame, Tv, UtensilsCrossed, Shield, Star, MapPin, Clock, CheckCircle, ArrowRight, Sparkles, BedDouble, Coffee, Bath, Waves, Dumbbell, Shirt, HeartPulse, Zap, CheckSquare, Bell } from 'lucide-react';
import SearchWidget from '@/components/SearchWidget';
import RoomCard from '@/components/RoomCard';
import ScrollIndicator from '@/components/ScrollIndicator';
import HeroCarousel from '@/components/HeroCarousel';
import ScrollReveal from '@/components/ScrollReveal';
import prisma from '@/lib/db';
import ReviewsCarousel from '@/components/ReviewsCarousel';

export const metadata: Metadata = {
  title: 'Punnami Southern Residency | Luxury Stay in Bhadrachalam',
  description: 'Book premium rooms at Punnami Southern Residency — seamless booking, modern amenities, and a comfortable stay in the heart of Bhadrachalam.',
};

export const revalidate = 3600;

const AMENITIES = [
  { icon: Wifi, label: 'High-Speed Wi-Fi' },
  { icon: Wind, label: 'Air Conditioning' },
  { icon: Flame, label: '24/7 Hot Water' },
  { icon: Tv, label: 'Smart TV' },
  { icon: UtensilsCrossed, label: 'In-Room Dining' },
  { icon: Car, label: 'Free Parking' },
  { icon: Coffee, label: 'Room Service' },
  { icon: Bath, label: 'Premium Toiletries' },
];

const REVIEWS = [
  { name: 'Ravi Kumar', location: 'Hyderabad', rating: 5, text: 'Exceptional stay! The rooms were spotless and the service was outstanding. Will definitely visit again.' },
  { name: 'Priya Sharma', location: 'Vijayawada', rating: 5, text: 'Perfect location, beautiful views, and incredibly comfortable beds. Punnami Southern Residency exceeded all expectations.' },
  { name: 'Arun Reddy', location: 'Rajahmundry', rating: 5, text: 'The breakfast was delicious and the staff were so helpful. Best hotel experience in Bhadrachalam!' },
];

async function getFeaturedRooms() {
  try {
    const rooms = await prisma.roomType.findMany({
      where: { status: 'PUBLISHED', isFeatured: true },
      take: 3,
      orderBy: { orderPriority: 'asc' },
      include: { hotel: { select: { name: true, address: true } } },
    });
    return rooms;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featuredRooms = await getFeaturedRooms();

  return (
    <div className="flex w-full flex-col overflow-x-clip bg-stone-50">
      {/* ─── Sticky Hero Section (Textbook Effect) ───────────────────────── */}
      <section className="sticky top-16 w-full overflow-visible bg-stone-900 h-[calc(100svh-64px)] flex flex-col">
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">
          {/* Background Carousel */}
          <HeroCarousel />

          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6 sm:py-16 md:py-20 flex flex-col justify-center h-full">
            <ScrollReveal delay={100} className="text-center mb-4 sm:mb-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm border border-amber-400/30 rounded-full px-3 py-1 mb-3 sm:mb-6">
                <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400" />
                <span className="text-amber-300 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Premium Stay</span>
              </div>

              <h1 className="text-3xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-2 sm:mb-4 leading-none"
                style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                Punnami Southern Residency
              </h1>
              <p className="text-sm sm:text-xl md:text-2xl text-stone-200 max-w-2xl mx-auto leading-relaxed mb-2"
                style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontStyle: 'italic' }}>
                Where Every Stay Becomes a Memory
              </p>
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-stone-300 text-xs sm:text-sm">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
                <span>Bhadrachalam, Telangana, India</span>
              </div>
            </ScrollReveal>

            {/* Search Widget */}
            <ScrollReveal delay={200} className="max-w-4xl mx-auto w-full">
              <SearchWidget />
            </ScrollReveal>

            {/* Quick stats (hidden on very small screens to prevent overflow) */}
            <ScrollReveal delay={300} className="hidden xs:flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-4 sm:mt-8 text-white">
              {[
                { value: '500+', label: 'Happy Guests' },
                { value: '4.8★', label: 'Rating' },
                { value: '24/7', label: 'Support' },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="text-xl sm:text-2xl font-black text-amber-400">{value}</div>
                  <div className="text-[10px] sm:text-xs text-stone-300 uppercase tracking-wider">{label}</div>
                </div>
              ))}
            </ScrollReveal>
          </div>
        </div>

        {/* ─── Welcome Strip Marquee ────────────────────────────────────────── */}
        <div className="bg-amber-600 py-3.5 relative z-20 shadow-lg shrink-0 w-full overflow-hidden">
          <style>{`
            @keyframes marquee {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee-loop {
              display: flex;
              width: max-content;
              animation: marquee 40s linear infinite;
            }
          `}</style>
          {(() => {
            const marqueeItems = [
              { name: 'Wi-Fi', icon: Wifi },
              { name: 'Air Conditioning', icon: Wind },
              { name: '24/7 Hot Water', icon: Flame },
              { name: 'Smart TV', icon: Tv },
              { name: 'In-Room Dining', icon: UtensilsCrossed },
              { name: 'Room Service', icon: Bell },
              { name: 'Free Parking', icon: Car },
              { name: 'Meals', icon: Coffee },
              { name: 'Swimming Pool', icon: Waves },
              { name: 'Gym / Fitness', icon: Dumbbell },
              { name: 'Laundry Service', icon: Shirt },
              { name: 'Doctor on Call', icon: HeartPulse },
              { name: 'Complimentary Breakfast', icon: Coffee },
              { name: 'Power Backup', icon: Zap },
              { name: 'Daily Housekeeping', icon: CheckSquare }
            ];

            return (
              <div className="flex overflow-hidden select-none">
                <div className="animate-marquee-loop flex items-center gap-12 text-white text-[11px] sm:text-xs font-black uppercase tracking-widest whitespace-nowrap">
                  {marqueeItems.map((item, i) => {
                    const IconComp = item.icon;
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <IconComp className="h-4 w-4 text-amber-200" />
                        <span>{item.name}</span>
                      </div>
                    );
                  })}
                  {/* Duplicate for seamless infinite loop */}
                  {marqueeItems.map((item, i) => {
                    const IconComp = item.icon;
                    return (
                      <div key={`dup-${i}`} className="flex items-center gap-2">
                        <IconComp className="h-4 w-4 text-amber-200" />
                        <span>{item.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ─── Content that slides over the Hero ────────────────────────────── */}
      <div className="relative z-20 bg-stone-50">

      {/* ─── Featured Rooms ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <ScrollReveal className="text-center mb-16">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-3">Handpicked For You</p>
          <h2 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Featured Rooms
          </h2>
          <p className="text-stone-500 max-w-xl mx-auto">
            Discover our most loved rooms — each thoughtfully designed for your comfort and relaxation.
          </p>
        </ScrollReveal>

        {featuredRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {featuredRooms.map((room, idx) => (
              <ScrollReveal key={room.id.toString()} delay={idx * 150}>
                <RoomCard
                  priority={idx === 0}
                  room={{
                    ...room,
                    id: room.id.toString(),
                    weekdayPrice: Number(room.weekdayPrice),
                    weekendPrice: Number(room.weekendPrice),
                    bookingSlots: (room.bookingSlots as any[] | null) ?? undefined,
                  }}
                />
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-stone-100 animate-pulse h-80" />
            ))}
          </div>
        )}

        <ScrollReveal className="text-center">
          <Link
            href="/rooms"
            className="inline-flex items-center gap-2 bg-stone-900 hover:bg-amber-700 text-white font-bold rounded-xl px-8 py-4 transition-colors shadow-lg hover:shadow-amber-700/20"
          >
            View All Rooms
            <ArrowRight className="h-4 w-4" />
          </Link>
        </ScrollReveal>
      </section>

      {/* ─── Amenities Section ──────────────────────────────────────────────── */}
      <section className="py-24 bg-stone-900 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center mb-16">
            <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3">Everything You Need</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4"
              style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              World-Class Amenities
            </h2>
            <p className="text-stone-400 max-w-xl mx-auto">
              Every detail has been thoughtfully curated to make your stay exceptional.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {AMENITIES.map(({ icon: Icon, label }, idx) => (
              <ScrollReveal key={label} delay={idx * 50}>
                <div className="bg-stone-800 hover:bg-stone-700 rounded-2xl p-6 text-center transition-colors group h-full">
                  <div className="w-12 h-12 bg-amber-600/20 group-hover:bg-amber-600 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors">
                    <Icon className="h-6 w-6 text-amber-400 group-hover:text-white transition-colors" />
                  </div>
                  <div className="text-sm font-semibold text-stone-200">{label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ───────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-amber-50 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-3">Simple & Fast</p>
            <h2 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4"
              style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              How Booking Works
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-px bg-amber-200" />
            {[
              { step: '01', title: 'Choose Your Room', desc: 'Browse our rooms, check availability for your dates, and select the perfect room for your stay.' },
              { step: '02', title: 'Pay Online Securely', desc: 'Complete your booking using the integrated PhonePe Payment Gateway via UPI, cards, or net banking.' },
              { step: '03', title: 'Instant Confirmation', desc: 'Your stay ticket is generated immediately with your payment details and transaction ID.' },
            ].map(({ step, title, desc }, idx) => (
              <ScrollReveal key={step} delay={idx * 200} className="text-center relative">
                <div className="w-16 h-16 bg-amber-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-black shadow-lg shadow-amber-600/20">
                  {step}
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-2"
                  style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  {title}
                </h3>
                <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Reviews ────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <ScrollReveal className="text-center mb-16">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-3">Guest Experiences</p>
          <h2 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            What Our Guests Say
          </h2>
        </ScrollReveal>

        <ReviewsCarousel />
      </section>

      {/* ─── CTA Banner ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 overflow-hidden">
        <ScrollReveal className="max-w-3xl mx-auto px-4 text-center">
          <BedDouble className="h-10 w-10 text-amber-400 mx-auto mb-4" />
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Ready for Your Perfect Stay?
          </h2>
          <p className="text-stone-300 mb-8 leading-relaxed">
            Book your room today and experience the finest hospitality at Punnami Southern Residency.
          </p>
          <Link
            href="/rooms"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-900 font-black rounded-2xl px-10 py-4 text-lg transition-all hover:-translate-y-0.5 shadow-xl hover:shadow-amber-500/30"
          >
            Book Your Room Now
            <ArrowRight className="h-5 w-5" />
          </Link>
        </ScrollReveal>
      </section>
      </div>
    </div>
  );
}
