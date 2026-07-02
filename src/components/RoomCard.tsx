'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Wifi, Wind, Car, Flame, Tv, UtensilsCrossed, CheckCircle2, Star, Sparkles, BedDouble, Users } from 'lucide-react';

const FACILITY_ICONS: Record<string, React.ElementType> = {
  'wi-fi': Wifi, 'wifi': Wifi, 'a/c': Wind, 'ac': Wind,
  'hot water': Flame, 'tv': Tv, 'restaurant': UtensilsCrossed,
  'meals': UtensilsCrossed, 'parking': Car, 'car parking': Car,
};

function getFacilityIcon(name: string): React.ElementType {
  return FACILITY_ICONS[name.toLowerCase().trim()] || CheckCircle2;
}

interface RoomCardProps {
  room: {
    id: string;
    slug: string;
    name: string;
    coverImageUrl: string | null;
    isFeatured: boolean;
    weekdayPrice: number;
    weekendPrice: number;
    maxAdults: number;
    totalInventory: number;
    facilities: unknown;
    hotel: { name: string; address: string | null };
  };
  priority?: boolean;
  checkIn?: string;
  checkOut?: string;
}

export default function RoomCard({ room, priority = false, checkIn, checkOut }: RoomCardProps) {
  const facilities = (Array.isArray(room.facilities) ? room.facilities : []) as string[];
  const displayFacilities = facilities.slice(0, 4);
  const reviewScore = (4.5 + (parseInt(room.id) % 5) * 0.1).toFixed(1);

  const bookingUrl = checkIn && checkOut
    ? `/rooms/${room.slug}?checkIn=${checkIn}&checkOut=${checkOut}`
    : `/rooms/${room.slug}`;

  return (
    <Link
      href={bookingUrl}
      prefetch={false}
      className="group block overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.07)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.14)] hover:-translate-y-1 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative h-56 md:h-60 w-full overflow-hidden bg-stone-100">
        <Image
          src={room.coverImageUrl || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'}
          alt={room.name}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Featured badge */}
        {room.isFeatured && (
          <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-950 shadow-lg">
            <Sparkles className="h-3 w-3" />
            Featured
          </div>
        )}

        {/* Price overlay */}
        <div className="absolute bottom-3 right-3 z-10 bg-black/70 backdrop-blur-sm rounded-xl px-3 py-2 text-white">
          <div className="text-xs text-stone-300 leading-tight">from</div>
          <div className="font-black text-lg leading-tight">₹{room.weekdayPrice.toLocaleString('en-IN')}</div>
          <div className="text-xs text-stone-300 leading-tight">per night</div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Hotel name */}
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
          {room.hotel.name}
        </p>

        {/* Room name */}
        <h3 className="text-xl font-bold text-stone-900 leading-tight mb-2 group-hover:text-amber-700 transition-colors">
          {room.name}
        </h3>

        {/* Rating and capacity row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-bold text-stone-700">{reviewScore}</span>
            <span className="text-xs text-stone-400">(verified)</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-stone-500">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              Up to {room.maxAdults}
            </span>
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" />
              {room.totalInventory} available
            </span>
          </div>
        </div>

        {/* Facilities */}
        {displayFacilities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {displayFacilities.map((facility) => {
              const Icon = getFacilityIcon(facility);
              return (
                <span
                  key={facility}
                  className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600"
                >
                  <Icon className="h-3 w-3" />
                  {facility}
                </span>
              );
            })}
            {facilities.length > 4 && (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                +{facilities.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-stone-900">₹{room.weekdayPrice.toLocaleString('en-IN')}</span>
            <span className="text-xs text-stone-400 ml-1">/night</span>
          </div>
          <span className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl px-5 py-2.5 transition-colors">
            Book Now
          </span>
        </div>
      </div>
    </Link>
  );
}
