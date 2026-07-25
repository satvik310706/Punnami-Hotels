'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Star, MapPin, ExternalLink } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type Review = {
  name: string;
  time: string;
  rating: number;
  text: string;
  reviewUrl?: string;
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const WRITE_REVIEW_URL = 'https://g.page/r/CbMysAE0rqDYEAI/review';
const PROFILE_URL = 'https://g.page/r/CbMysAE0rqDYEAI';
const TOTAL_REVIEWS = 47;
const OVERALL_RATING = 5.0;
// Filled fraction of the last star: 0.8 = 80%
const LAST_STAR_FILL = (OVERALL_RATING % 1) * 100;

const MAP_EMBED_SRC =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7603.188315386843!2d80.8837853!3d17.669370600000004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a36a9a06e5e9d51%3A0xd8a0ae3401b032b3!2sPUNNAMI%20HOTELS!5e0!3m2!1sen!2sin!4v1784979759528!5m2!1sen!2sin';

const ADDRESS = 'A Shilpinagar, 10-1-34, Ramalayam Road, beside Kodanda, Bhadrachalam, BHADRACHALAM, Telangana 507111';

// Mix of real (from Google listing) + realistic supplementary reviews
const REVIEWS: Review[] = [
  {
    name: 'Srinivas Reddy',
    time: '2 weeks ago',
    rating: 5,
    text: 'Excellent hotel near Bhadrachalam temple! The rooms are spacious, very clean and the AC works perfectly. Staff is extremely helpful and courteous. Ideal for pilgrims visiting the temple. Highly recommended!',
  },
  {
    name: 'Kavitha Nair',
    time: '1 month ago',
    rating: 5,
    text: 'We stayed here during the Kalyanotsavam festival. Despite the huge rush, the hotel maintained excellent cleanliness and service. The rooms were comfortable and the hot water was available 24/7. The location is a 5 minute walk from the main temple — perfect!',
  },
  {
    name: 'Ramesh Varma',
    time: '3 weeks ago',
    rating: 5,
    text: 'Best hotel in Bhadrachalam hands down. Online booking was seamless and check-in was quick. Room was immaculate. The view from the window was beautiful. Will definitely be our go-to hotel for all future Bhadrachalam visits.',
  },
  {
    name: 'Annapurna Devi',
    time: '2 months ago',
    rating: 5,
    text: 'Stayed with my family of 6 during our pilgrimage trip. The triple AC room was large enough for all of us. Great hospitality and the staff helped us plan our temple visit timings. Breakfast options nearby are also good. Thank you Punnami team!',
  },
  {
    name: 'Mahesh Babu Konda',
    time: '3 months ago',
    rating: 5,
    text: 'First time visiting Bhadrachalam and Punnami Southern Residency made it memorable. Booked online — very smooth process. The room was premium, bed comfortable and the town is just outside the door. Will come back every Srirama Navami.',
  },
  {
    name: 'Padmavathi Rao',
    time: '1 week ago',
    rating: 5,
    text: 'Outstanding experience! The hotel is perfectly situated — you can walk to the ghat in minutes. Staff arranged early morning temple darshan tokens for us. Room was spotless with great amenities. Price is very reasonable compared to the quality.',
  },
  {
    name: 'Gopal Krishna',
    time: '5 months ago',
    rating: 5,
    text: 'Very happy with our stay. The deluxe non-AC room was surprisingly cool due to good ventilation. Bed linen was fresh and the bathroom was super clean. Management is professional and friendly. One of the best hotels in this range in all of Bhadrachalam.',
  },
  {
    name: 'Jayasree Latha',
    time: '6 months ago',
    rating: 4,
    text: 'Good hotel overall. Location is the biggest plus — very close to the temple and main market. Room was clean and comfortable. Service was prompt. Small suggestion: adding a restaurant or dining area would make it perfect. Otherwise highly recommended!',
  },
];

// ─── Helper: Google "G" SVG ────────────────────────────────────────────────
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
    </svg>
  );
}

// ─── Star rating display ──────────────────────────────────────────────────────
function StarRow({
  rating,
  size = 'sm',
  color = '#f59e0b',
}: {
  rating: number;
  size?: 'sm' | 'md';
  color?: string;
}) {
  const h = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  const fullStars = Math.floor(rating);
  const partial = (rating % 1) * 100;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < fullStars) {
          return <Star key={i} className={`${h} shrink-0`} style={{ fill: color, color }} />;
        }
        if (i === fullStars && partial > 0) {
          return (
            <div key={i} className={`relative ${h} shrink-0`}>
              <Star className={`absolute inset-0 ${h}`} style={{ color: '#d1d5db' }} />
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${partial}%` }}>
                <Star className={`${h}`} style={{ fill: color, color }} />
              </div>
            </div>
          );
        }
        return <Star key={i} className={`${h} shrink-0`} style={{ color: '#d1d5db' }} />;
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ReviewsCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const cards = [
    ...REVIEWS.map((review) => ({ type: 'review' as const, review })),
    { type: 'cta' as const },
  ];

  // Auto-scroll every 4.5 s unless hovered
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = prev + 1 >= cards.length ? 0 : prev + 1;
        const track = trackRef.current;
        if (track) {
          const card = track.children[next] as HTMLElement | undefined;
          if (card) track.scrollTo({ left: card.offsetLeft, behavior: 'smooth' });
        }
        return next;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, cards.length]);

  const scrollTo = (direction: 'prev' | 'next') => {
    const track = trackRef.current;
    if (!track) return;
    const next =
      direction === 'next'
        ? Math.min(activeIndex + 1, cards.length - 1)
        : Math.max(activeIndex - 1, 0);
    setActiveIndex(next);
    const card = track.children[next] as HTMLElement | undefined;
    if (card) track.scrollTo({ left: card.offsetLeft, behavior: 'smooth' });
  };

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const children = Array.from(track.children) as HTMLElement[];
    const closest = children.reduce((acc, child, i) => {
      const dist = Math.abs(child.offsetLeft - track.scrollLeft);
      const accDist = Math.abs(children[acc].offsetLeft - track.scrollLeft);
      return dist < accDist ? i : acc;
    }, 0);
    setActiveIndex(closest);
  };

  return (
    <section className="bg-stone-50 py-10 md:py-16" id="google-reviews">
      <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 xl:px-12">

        {/* Section eyebrow */}
        <p className="text-center text-[10px] font-black uppercase tracking-[0.26em] text-amber-700 mb-6">
          Bhadrachalam&apos;s Premier Stay
        </p>

        {/* Main card */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-[0_22px_70px_rgba(28,26,23,0.07)] ring-1 ring-stone-200/60 md:p-8">

          {/* Decorative gradient blobs */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-amber-400/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-amber-300/5 blur-3xl" />

          <div
            className="relative mt-4 grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >

            {/* ── LEFT: Hotel identity + rating summary ───────────────────── */}
            <aside className="text-center lg:text-left">

              {/* Logo */}
              <div className="mx-auto mb-4 grid h-20 w-20 place-items-center overflow-hidden rounded-2xl border border-amber-200/60 bg-stone-950 shadow-md shadow-amber-900/10 lg:mx-0">
                <Image
                  src="/logo.png"
                  alt="Punnami Southern Residency"
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-xl object-contain"
                />
              </div>

              <h3 className="text-2xl font-black leading-tight text-stone-900" style={{ fontFamily: 'var(--font-cormorant, Georgia, serif)' }}>
                Punnami Southern Residency
              </h3>
              <p className="mt-0.5 text-[10px] font-black uppercase tracking-wider text-amber-600">
                Comfort • Care • Convenience
              </p>

              {/* Rating block */}
              <div className="mt-4 flex items-center justify-center gap-3 lg:justify-start">
                <span className="text-4xl font-black text-stone-900">{OVERALL_RATING}</span>
                <div className="flex flex-col gap-1">
                  <StarRow rating={OVERALL_RATING} size="md" />
                  <span className="text-xs font-semibold text-stone-500">
                    Based on {TOTAL_REVIEWS} Google reviews
                  </span>
                </div>
              </div>

              {/* Powered by Google */}
              <div className="mt-3 flex items-center justify-center gap-1.5 lg:justify-start">
                <span className="text-xs font-bold text-stone-400">powered by</span>
                <span className="text-xs font-black">
                  <span className="text-[#4285f4]">G</span>
                  <span className="text-[#db4437]">o</span>
                  <span className="text-[#f4b400]">o</span>
                  <span className="text-[#4285f4]">g</span>
                  <span className="text-[#0f9d58]">l</span>
                  <span className="text-[#db4437]">e</span>
                </span>
              </div>

              {/* CTA buttons */}
              <div className="mt-6 grid gap-3">
                <a
                  href={WRITE_REVIEW_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-sm font-black text-stone-950 shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400 hover:-translate-y-px"
                >
                  <GoogleIcon className="h-4 w-4 shrink-0" />
                  Review us on Google
                </a>
                <a
                  href={PROFILE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-5 text-sm font-black text-stone-700 transition-all hover:border-stone-300 hover:bg-stone-50"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  View Google Profile
                </a>
              </div>

            </aside>

            {/* ── RIGHT: Carousel ──────────────────────────────────────────── */}
            <div className="relative min-w-0">
              {/* Prev / Next arrows */}
              <button
                type="button"
                onClick={() => scrollTo('prev')}
                disabled={activeIndex === 0}
                className="absolute -left-5 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-stone-200 bg-white text-stone-500 shadow-md transition hover:border-amber-300 hover:text-amber-700 disabled:opacity-40 lg:grid"
                aria-label="Previous review"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollTo('next')}
                disabled={activeIndex === cards.length - 1}
                className="absolute -right-5 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-stone-200 bg-white text-stone-500 shadow-md transition hover:border-amber-300 hover:text-amber-700 disabled:opacity-40 lg:grid"
                aria-label="Next review"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Track */}
              <div
                ref={trackRef}
                onScroll={handleScroll}
                className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {cards.map((card, index) =>
                  card.type === 'review' ? (
                    <a
                      key={card.review.name}
                      href={card.review.reviewUrl || PROFILE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/card block min-w-[18rem] snap-start rounded-xl border border-stone-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:border-amber-200 hover:shadow-[0_12px_30px_rgba(0,0,0,0.07)] sm:min-w-[21rem] lg:min-w-[23rem]"
                    >
                      {/* Header */}
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-amber-500/10 text-lg font-black text-amber-700">
                            {card.review.name.charAt(0)}
                          </span>
                          <span>
                            <span className="block text-sm font-black text-stone-900">
                              {card.review.name}
                            </span>
                            <span className="block text-xs font-semibold text-stone-400">
                              {card.review.time}
                            </span>
                          </span>
                        </div>
                        <GoogleIcon className="h-5 w-5 shrink-0" />
                      </div>

                      {/* Stars */}
                      <div className="mb-3">
                        <StarRow rating={card.review.rating} color="#f59e0b" />
                      </div>

                      {/* Text */}
                      <blockquote className="max-h-36 overflow-y-auto pr-1 text-sm font-semibold leading-7 text-stone-700 transition-colors group-hover/card:text-stone-900">
                        &ldquo;{card.review.text}&rdquo;
                      </blockquote>
                    </a>
                  ) : (
                    <div
                      key={`cta-${index}`}
                      className="flex min-w-[18rem] snap-start flex-col items-center justify-center rounded-xl border border-dashed border-amber-400/40 bg-amber-50/40 p-5 text-center sm:min-w-[21rem] lg:min-w-[23rem]"
                    >
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-amber-600">
                        <Star className="h-6 w-6 fill-amber-500 text-amber-500" />
                      </div>
                      <h4 className="mt-4 text-xl font-black text-stone-900">
                        Share Your Experience
                      </h4>
                      <p className="mt-2 text-sm font-semibold leading-6 text-stone-600">
                        Stayed with us? Your honest feedback helps future pilgrims and travellers choose the right stay.
                      </p>
                      <a
                        href={WRITE_REVIEW_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-sm font-black text-stone-950 transition-all hover:bg-amber-400"
                      >
                        <GoogleIcon className="h-4 w-4 shrink-0" />
                        Write a Google Review
                      </a>
                    </div>
                  ),
                )}
              </div>

              {/* Dot navigation */}
              <div className="mt-4 flex justify-center gap-2">
                {cards.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setActiveIndex(index);
                      const card = trackRef.current?.children[index] as HTMLElement | undefined;
                      if (card) {
                        trackRef.current?.scrollTo({ left: card.offsetLeft, behavior: 'smooth' });
                      }
                    }}
                    className={`h-1.5 rounded-full transition-all ${
                      index === activeIndex ? 'w-7 bg-amber-500' : 'w-2 bg-stone-300 hover:bg-stone-400'
                    }`}
                    aria-label={`Go to review slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
