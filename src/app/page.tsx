import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import {
  Wifi, Wind, Car, Flame, Tv, UtensilsCrossed,
  MapPin, ArrowRight, BedDouble,
  Coffee, Bath, Waves, Dumbbell, Shirt,
  HeartPulse, Zap, CheckSquare, Bell,
  Shield, Clock, Phone,
} from 'lucide-react';
import SearchWidget from '@/components/SearchWidget';
import RoomCard from '@/components/RoomCard';
import HeroCarousel from '@/components/HeroCarousel';
import ScrollReveal from '@/components/ScrollReveal';
import ReviewsCarousel from '@/components/ReviewsCarousel';
import prisma from '@/lib/db';

export const metadata: Metadata = {
  title: 'Punnami Southern Residency | Luxury Stay in Bhadrachalam',
  description:
    'Book premium rooms at Punnami Southern Residency — seamless booking, modern amenities, and a comfortable stay in the heart of Bhadrachalam.',
};

export const revalidate = 3600;

const AMENITIES = [
  { icon: Wifi,            label: 'High-Speed Wi-Fi'   },
  { icon: Wind,            label: 'Air Conditioning'    },
  { icon: Flame,           label: '24/7 Hot Water'      },
  { icon: Tv,              label: 'Smart TV'            },
  { icon: UtensilsCrossed, label: 'In-Room Dining'      },
  { icon: Car,             label: 'Free Parking'        },
  { icon: Coffee,          label: 'Room Service'        },
  { icon: Bath,            label: 'Premium Toiletries'  },
];

const MARQUEE_ITEMS = [
  { name: 'Wi-Fi',                   icon: Wifi            },
  { name: 'Air Conditioning',        icon: Wind            },
  { name: '24/7 Hot Water',          icon: Flame           },
  { name: 'Smart TV',                icon: Tv              },
  { name: 'In-Room Dining',          icon: UtensilsCrossed },
  { name: 'Room Service',            icon: Bell            },
  { name: 'Free Parking',            icon: Car             },
  { name: 'Swimming Pool',           icon: Waves           },
  { name: 'Gym / Fitness',           icon: Dumbbell        },
  { name: 'Laundry Service',         icon: Shirt           },
  { name: 'Doctor on Call',          icon: HeartPulse      },
  { name: 'Complimentary Breakfast', icon: Coffee          },
  { name: 'Power Backup',            icon: Zap             },
  { name: 'Daily Housekeeping',      icon: CheckSquare     },
];

const PILLARS = [
  {
    icon: Shield,
    title: 'Trusted Comfort',
    desc: 'Each room is meticulously maintained to the highest standards of cleanliness and comfort.',
  },
  {
    icon: MapPin,
    title: 'Prime Location',
    desc: 'Perfectly situated near the Bhadrachalam Temple for both pilgrims and leisure travelers.',
  },
  {
    icon: Clock,
    title: 'Always Available',
    desc: 'Round-the-clock support, room service, and secure premises — every hour of your stay.',
  },
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
    // NOTE: NO -mt-16 here. The transparent navbar already pulls up via sticky positioning.
    // We let the hero section start at the very top with its own padding-top for content.
    <div className="flex w-full flex-col overflow-x-clip">

      {/* ═══════════════════════════════════════════════════════
          HERO — Full viewport height, NOT sticky.
          The navbar is sticky; the hero is normal flow.
          This completely prevents the three-pillars overlap bug.
      ════════════════════════════════════════════════════════ */}
      <section className="relative w-full min-h-[100dvh] bg-stone-950 flex flex-col -mt-16 z-20">
        {/* Background carousel — absolutely fills the section */}
        <div className="absolute inset-0 overflow-hidden">
          <HeroCarousel />
        </div>

        {/* Hero content — flex-1 so it grows to fill, pushes marquee to bottom */}
        <div className="relative z-30 flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-8 sm:pb-12">

          {/* Mobile Call-To-Action (Only visible on Mobile) */}
          {(() => {
            const firstRoomSlug = featuredRooms[0]?.slug || '2-beds-ac-deluxe-room';
            const firstRoomLink = `/rooms/${firstRoomSlug}`;
            
            return (
              <div className="flex sm:hidden flex-col items-center gap-2 mb-6 w-full max-w-[290px] animate-hero-fade-up" style={{ animationDelay: '0.05s' }}>
                <a 
                  href="tel:+919505155166" 
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <Phone className="h-4 w-4 fill-stone-950 stroke-none animate-pulse" />
                  <span>Call &amp; Book: 95051 55166</span>
                </a>
                <Link 
                  href={firstRoomLink}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-stone-900 font-extrabold text-sm border border-stone-200 backdrop-blur-md active:scale-95 transition-all shadow-md"
                >
                  <span>Book Online Now</span>
                  <ArrowRight className="h-4 w-4 text-amber-600" />
                </Link>
              </div>
            );
          })()}

          {/* Badge */}
          <div
            className="inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 mb-5 sm:mb-7 border border-white/10 animate-hero-fade-up"
            style={{ animationDelay: '0.1s', backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.05)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <span
              className="text-white/65 text-[10px] sm:text-[11px] font-medium uppercase"
              style={{ letterSpacing: '0.22em' }}
            >
              Bhadrachalam&apos;s Premier Stay
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-white leading-[1.08] tracking-tight max-w-4xl mb-4 sm:mb-5 animate-hero-fade-up"
            style={{
              fontFamily: 'var(--font-cormorant), Georgia, serif',
              fontSize: 'clamp(2.1rem, 5vw, 4.5rem)',
              fontWeight: 300,
              animationDelay: '0.22s',
            }}
          >
            Punnami Southern
            <br className="hidden sm:block" />
            <em style={{ fontStyle: 'italic', color: 'rgba(254,243,199,0.92)' }}>
              {' '}Residency
            </em>
          </h1>

          {/* Gold divider */}
          <div
            className="w-10 h-px bg-amber-500/60 mb-3 sm:mb-4 animate-hero-fade-in"
            style={{ animationDelay: '0.38s' }}
          />

          {/* Tagline */}
          <p
            className="text-stone-400/90 text-base sm:text-lg lg:text-xl max-w-md leading-relaxed mb-3 animate-hero-fade-up"
            style={{
              fontFamily: 'var(--font-cormorant), Georgia, serif',
              fontStyle: 'italic',
              animationDelay: '0.32s',
            }}
          >
            Where Every Stay Becomes a Memory
          </p>

          {/* Location */}
          <div
            className="flex items-center gap-2 text-stone-500 text-xs sm:text-sm mb-6 sm:mb-8 animate-hero-fade-in"
            style={{ letterSpacing: '0.09em', animationDelay: '0.42s' }}
          >
            <MapPin className="h-3.5 w-3.5 text-amber-500/60 shrink-0" />
            <span>Bhadrachalam, Telangana, India</span>
          </div>

          {/* Search widget */}
          <div
            className="w-full max-w-4xl mx-auto animate-hero-fade-up relative z-30"
            style={{ animationDelay: '0.5s' }}
          >
            <Suspense fallback={
              <div className="w-full h-24 bg-stone-900/60 backdrop-blur-md rounded-2xl animate-pulse border border-white/15 flex items-center justify-center">
                <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest">Loading Search Panel...</span>
              </div>
            }>
              <SearchWidget />
            </Suspense>
          </div>

          {/* Stats — visible on all screens but compact on mobile */}
          <div
            className="flex items-center mt-6 sm:mt-8 divide-x divide-white/10 animate-hero-fade-in"
            style={{ animationDelay: '0.72s' }}
          >
            {[
              { value: '500+', label: 'Happy Guests' },
              { value: '4.8',  label: 'Star Rating'  },
              { value: '24/7', label: 'Support'       },
            ].map(({ value, label }) => (
              <div key={label} className="px-3 sm:px-8 lg:px-12 text-center first:pl-0 last:pr-0">
                <div
                  className="text-2xl sm:text-3xl lg:text-4xl font-light text-amber-300/85"
                  style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
                >
                  {value}
                </div>
                <div
                  className="text-[9px] sm:text-[10px] text-stone-300 font-bold uppercase mt-1"
                  style={{ letterSpacing: '0.18em' }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator — desktop only */}
        <div
          className="absolute bottom-16 left-8 sm:left-12 z-20 flex-col items-center gap-2.5 hidden sm:flex animate-hero-fade-in"
          style={{ animationDelay: '1.1s' }}
        >
          <div
            className="text-[9px] text-white/25 uppercase"
            style={{ letterSpacing: '0.25em', writingMode: 'vertical-rl' }}
          >
            Scroll
          </div>
          <div className="w-px h-12 bg-white/15 relative overflow-hidden">
            <div className="absolute inset-0 animate-scroll-line bg-amber-400/60" />
          </div>
        </div>

        {/* Amenities marquee strip — anchored at very bottom of hero */}
        <div className="relative z-20 bg-stone-950/90 border-t border-stone-800/50 py-3.5 shrink-0 w-full overflow-hidden">
          <div className="flex overflow-hidden select-none">
            <div
              className="animate-marquee flex items-center gap-14 text-[10px] sm:text-[11px] font-medium uppercase whitespace-nowrap"
              style={{ letterSpacing: '0.14em' }}
            >
              {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => {
                const Icon = item.icon;
                return (
                   <div key={i} className="flex items-center gap-2.5 text-stone-200">
                     <Icon className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                     <span>{item.name}</span>
                   </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          WHITE CONTENT — Starts cleanly AFTER the hero.
          NO negative margins. NO z-index overlaps.
      ════════════════════════════════════════════════════════ */}
      <div className="relative z-10 bg-white">

        {/* ─── Three Pillars ───────────────────────────────────────── */}
        <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white">
          <div className="max-w-7xl mx-auto">
            {/* Section label */}
            <ScrollReveal className="text-center mb-12 sm:mb-14">
              <p
                className="text-xs font-medium text-amber-600 uppercase mb-2"
                style={{ letterSpacing: '0.22em' }}
              >
                Why Choose Us
              </p>
              <h2
                className="text-stone-900 text-3xl md:text-4xl lg:text-5xl font-light leading-tight"
                style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontWeight: 300 }}
              >
                Our Promise to You
              </h2>
              <div className="w-8 h-px bg-amber-500/60 mx-auto mt-4" />
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {PILLARS.map(({ icon: Icon, title, desc }, i) => (
                <ScrollReveal key={title} delay={i * 120}>
                  <div className="group relative bg-white hover:bg-amber-50/30 border border-stone-200/80 hover:border-amber-300/50 rounded-3xl p-8 sm:p-10 shadow-sm hover:shadow-xl hover:shadow-amber-500/[0.04] transition-all duration-500 ease-out hover:-translate-y-1.5 overflow-hidden cursor-default">
                    {/* Subtle glowing radial gradient */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.07),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    {/* Editorial background numerals */}
                    <div
                      className="absolute right-6 top-4 text-7xl select-none font-light text-amber-200/20 group-hover:text-amber-300/30 transition-colors duration-500"
                      style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontStyle: 'italic' }}
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, '0')}
                    </div>

                    <div className="flex flex-col gap-6 relative z-10">
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100/80 flex items-center justify-center shrink-0 shadow-sm group-hover:bg-amber-100/60 group-hover:border-amber-200 transition-all duration-500 group-hover:scale-105">
                        <Icon className="h-6 w-6 text-amber-600 group-hover:rotate-[8deg] transition-transform duration-500" />
                      </div>

                      <div className="space-y-3">
                        <h3
                          className="text-stone-900 text-2xl font-light tracking-tight group-hover:text-amber-800 transition-colors duration-300"
                          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
                        >
                          {title}
                        </h3>
                        <p className="text-stone-600 text-sm leading-relaxed font-light">{desc}</p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Featured Rooms ──────────────────────────────────────── */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-stone-50/60">
          <div className="max-w-7xl mx-auto">
            <ScrollReveal className="mb-14 sm:mb-18">
              <p
                className="text-xs font-medium text-amber-600 uppercase mb-4"
                style={{ letterSpacing: '0.22em' }}
              >
                Handpicked For You
              </p>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                <div>
                  <h2
                    className="text-stone-900 text-4xl md:text-5xl lg:text-6xl font-light leading-tight mb-3"
                    style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontWeight: 300 }}
                  >
                    Featured Rooms
                  </h2>
                  <div className="w-10 h-px bg-amber-500/60" />
                </div>
                <p className="text-stone-600 text-sm leading-relaxed max-w-sm">
                  Our most loved rooms, each designed with care for your comfort and relaxation.
                </p>
              </div>
            </ScrollReveal>

            {featuredRooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
                {featuredRooms.map((room, idx) => (
                  <ScrollReveal key={room.id.toString()} delay={idx * 120}>
                    <RoomCard
                      priority={false}
                      room={{
                        id: room.id.toString(),
                        slug: room.slug,
                        name: room.name,
                        coverImageUrl: room.coverImageUrl,
                        isFeatured: room.isFeatured,
                        isActive: room.isActive,
                        weekdayPrice: Number(room.weekdayPrice),
                        weekendPrice: Number(room.weekendPrice),
                        maxAdults: room.maxAdults,
                        totalInventory: room.totalInventory,
                        facilities: room.facilities,
                        bookingSlots: (room.bookingSlots as any[] | null) ?? undefined,
                        hotel: room.hotel,
                      }}
                    />
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl bg-stone-200/60 animate-pulse h-80" />
                ))}
              </div>
            )}

            <ScrollReveal className="flex justify-center">
              <Link
                href="/rooms"
                className="group inline-flex items-center gap-2.5 border border-stone-300 hover:border-amber-400 text-stone-600 hover:text-stone-900 font-medium rounded-2xl px-8 py-3.5 transition-all duration-300 text-sm bg-white hover:bg-amber-50/50"
                style={{ letterSpacing: '0.04em' }}
              >
                View All Rooms
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </ScrollReveal>
          </div>
        </section>

        {/* ─── Amenities ───────────────────────────────────────────── */}
        <section className="py-20 sm:py-28 border-y border-stone-100 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal className="text-center mb-14 sm:mb-18">
              <p
                className="text-xs font-medium text-amber-600 uppercase mb-4"
                style={{ letterSpacing: '0.22em' }}
              >
                Everything You Need
              </p>
              <h2
                className="text-stone-900 text-4xl md:text-5xl lg:text-6xl font-light leading-tight mb-3"
                style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontWeight: 300 }}
              >
                World-Class Amenities
              </h2>
              <div className="w-10 h-px bg-amber-500/60 mx-auto mb-5" />
              <p className="text-stone-600 max-w-lg mx-auto text-sm leading-relaxed">
                Every detail has been thoughtfully curated to make your stay exceptional.
              </p>
            </ScrollReveal>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {AMENITIES.map(({ icon: Icon, label }, idx) => (
                <ScrollReveal key={label} delay={idx * 55}>
                  <div className="group relative border border-stone-200/80 hover:border-amber-300/70 rounded-2xl p-5 sm:p-6 text-center transition-all duration-300 bg-white hover:bg-amber-50/40 cursor-default overflow-hidden shadow-sm hover:shadow-md">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl bg-gradient-to-br from-amber-50/60 via-transparent to-transparent" />
                    <div className="relative">
                      <div className="w-11 h-11 rounded-xl bg-amber-500/[0.04] group-hover:bg-amber-500/[0.12] border border-amber-500/10 group-hover:border-amber-500/20 flex items-center justify-center mx-auto mb-3.5 transition-all duration-300 group-hover:scale-105">
                        <Icon className="h-5 w-5 text-amber-600/75 group-hover:text-amber-600 transition-colors duration-300" />
                      </div>
                      <div
                        className="text-sm font-medium text-stone-600 group-hover:text-amber-900 transition-colors duration-300"
                        style={{ letterSpacing: '0.01em' }}
                      >
                        {label}
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works ────────────────────────────────────────── */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-stone-50/60 overflow-hidden">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal className="text-center mb-14 sm:mb-18">
              <p
                className="text-xs font-medium text-amber-600 uppercase mb-4"
                style={{ letterSpacing: '0.22em' }}
              >
                Simple &amp; Fast
              </p>
              <h2
                className="text-stone-900 text-4xl md:text-5xl lg:text-6xl font-light leading-tight"
                style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontWeight: 300 }}
              >
                How Booking Works
              </h2>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 relative">
              <div className="hidden md:block absolute top-7 left-[calc(33.33%+1rem)] right-[calc(33.33%+1rem)] h-px bg-gradient-to-r from-stone-200 via-amber-300/40 to-stone-200" />

              {[
                {
                  step: '01',
                  title: 'Choose Your Room',
                  desc: 'Browse our rooms, check availability for your dates, and select the perfect room for your stay.',
                },
                {
                  step: '02',
                  title: 'Pay Online Securely',
                  desc: 'Complete your booking using the integrated PhonePe payment gateway — UPI, cards, or net banking.',
                },
                {
                  step: '03',
                  title: 'Instant Confirmation',
                  desc: 'Your stay ticket is generated immediately with payment details and a unique transaction ID.',
                },
              ].map(({ step, title, desc }, idx) => (
                <ScrollReveal key={step} delay={idx * 180} className="relative text-center md:text-left">
                  <div className="inline-flex items-center justify-center md:items-start flex-col gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center">
                      <span
                        className="text-2xl font-light text-amber-600"
                        style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', letterSpacing: '-0.02em' }}
                      >
                        {step}
                      </span>
                    </div>
                    <div>
                      <h3
                        className="text-stone-900 text-xl mb-2"
                        style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontWeight: 500 }}
                      >
                        {title}
                      </h3>
                      <p className="text-stone-600 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Guest Reviews ───────────────────────────────────────── */}
        <section className="py-20 sm:py-28 border-t border-stone-100 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal className="text-center mb-14 sm:mb-18">
              <p
                className="text-xs font-medium text-amber-600 uppercase mb-4"
                style={{ letterSpacing: '0.22em' }}
              >
                Guest Experiences
              </p>
              <h2
                className="text-stone-900 text-4xl md:text-5xl lg:text-6xl font-light leading-tight mb-3"
                style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontWeight: 300 }}
              >
                What Our Guests Say
              </h2>
              <div className="w-10 h-px bg-amber-500/60 mx-auto" />
            </ScrollReveal>
            <ReviewsCarousel />
          </div>
        </section>

        {/* ─── CTA Banner ──────────────────────────────────────────── */}
        <section className="relative py-28 sm:py-36 overflow-hidden bg-stone-100 border-t border-stone-200/60">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_60%,rgba(245,158,11,0.06),transparent)]" />
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(180,83,9,1) 1px, transparent 1px), linear-gradient(90deg, rgba(180,83,9,1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />

          <ScrollReveal className="relative max-w-3xl mx-auto px-4 text-center">
            <BedDouble className="h-9 w-9 text-amber-600/80 mx-auto mb-8" />
            <h2
              className="text-stone-900 text-4xl md:text-5xl lg:text-6xl font-light leading-tight mb-5"
              style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontWeight: 300 }}
            >
              Ready for Your
              <em style={{ fontStyle: 'italic', color: 'var(--color-brand-gold)' }}> Perfect Stay?</em>
            </h2>
            <p className="text-stone-600 mb-10 leading-relaxed text-sm sm:text-base max-w-xl mx-auto">
              Book your room today and experience the finest hospitality at Punnami Southern Residency.
            </p>
            <Link
              href="/rooms"
              className="btn-shimmer group inline-flex items-center gap-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-2xl px-10 py-4 text-base transition-all duration-200 shadow-xl shadow-amber-500/10 hover:shadow-amber-500/25 hover:-translate-y-px active:translate-y-0"
              style={{ letterSpacing: '0.04em' }}
            >
              Book Your Room Now
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </ScrollReveal>
        </section>

      </div>
    </div>
  );
}
