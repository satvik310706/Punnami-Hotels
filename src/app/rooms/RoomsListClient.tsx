'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X, Grid3X3, List } from 'lucide-react';
import RoomCard from '@/components/RoomCard';
import SearchWidget from '@/components/SearchWidget';
import CustomSelect from '@/components/CustomSelect';

interface Room {
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
}

interface Props {
  initialData: {
    items: Room[];
    total: number;
    page: number;
    size: number;
    pages: number;
  };
  initialParams: Record<string, string | undefined>;
  allRooms: Room[];
}

export default function RoomsListClient({ initialData, initialParams, allRooms }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const [query, setQuery] = useState(initialParams.q || '');
  const [minPrice, setMinPrice] = useState(initialParams.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(initialParams.maxPrice || '');
  const [capacity, setCapacity] = useState(initialParams.capacity || initialParams.guests || '');
  const [checkIn, setCheckIn] = useState(initialParams.checkIn || '');
  const [checkOut, setCheckOut] = useState(initialParams.checkOut || '');

  const [availability, setAvailability] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    allRooms.forEach((r) => { map[r.id] = true; });
    if (initialParams.checkIn && initialParams.checkOut) {
      const availableIds = new Set(initialData.items.map((r) => r.id));
      allRooms.forEach((r) => { map[r.id] = availableIds.has(r.id); });
    }
    return map;
  });
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const prevDatesRef = useRef({ checkIn: initialParams.checkIn || '', checkOut: initialParams.checkOut || '' });

  const fetchAvailability = useCallback(async (ci: string, co: string) => {
    if (!ci || !co) {
      const map: Record<string, boolean> = {};
      allRooms.forEach((r) => { map[r.id] = true; });
      setAvailability(map);
      return;
    }
    setAvailabilityLoading(true);
    try {
      const qs = new URLSearchParams({ checkIn: ci, checkOut: co, size: '9999' }).toString();
      const res = await fetch(`/api/v1/rooms?${qs}`);
      if (res.ok) {
        const json = await res.json();
        const availableIds = new Set((json.items as Room[]).map((r) => r.id));
        const map: Record<string, boolean> = {};
        allRooms.forEach((r) => { map[r.id] = availableIds.has(r.id); });
        setAvailability(map);
      }
    } finally {
      setAvailabilityLoading(false);
    }
  }, [allRooms]);

  useEffect(() => {
    const urlCheckIn = searchParams.get('checkIn') || '';
    const urlCheckOut = searchParams.get('checkOut') || '';
    const urlGuests = searchParams.get('guests') || searchParams.get('capacity') || '';
    if (urlCheckIn) setCheckIn(urlCheckIn);
    if (urlCheckOut) setCheckOut(urlCheckOut);
    if (urlGuests) setCapacity(urlGuests);

    if (
      urlCheckIn !== prevDatesRef.current.checkIn ||
      urlCheckOut !== prevDatesRef.current.checkOut
    ) {
      prevDatesRef.current = { checkIn: urlCheckIn, checkOut: urlCheckOut };
      fetchAvailability(urlCheckIn, urlCheckOut);
    }
  }, [searchParams, fetchAvailability]);

  const filteredRooms = useMemo(() => {
    const qLower = query.toLowerCase().trim();
    const min = minPrice ? parseFloat(minPrice) : 0;
    const max = maxPrice ? parseFloat(maxPrice) : Infinity;
    const cap = capacity ? parseInt(capacity) : 0;
    const datesSelected = checkIn && checkOut;

    return allRooms.filter((room) => {
      if (qLower && !room.name.toLowerCase().includes(qLower)) return false;
      if (room.weekdayPrice < min || room.weekdayPrice > max) return false;
      if (cap > 0 && room.maxAdults < cap) return false;
      if (datesSelected && availability[room.id] === false) return false;
      return true;
    });
  }, [allRooms, query, minPrice, maxPrice, capacity, checkIn, checkOut, availability]);

  const hasFilters = query || minPrice || maxPrice || capacity || checkIn || checkOut;

  const clearFilters = () => {
    setQuery('');
    setMinPrice('');
    setMaxPrice('');
    setCapacity('');
    setCheckIn('');
    setCheckOut('');
    router.push('/rooms', { scroll: false });
    prevDatesRef.current = { checkIn: '', checkOut: '' };
    const map: Record<string, boolean> = {};
    allRooms.forEach((r) => { map[r.id] = true; });
    setAvailability(map);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="relative z-30 bg-gradient-to-br from-stone-900 to-stone-800 py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3 text-center">
            Punnami Southern Residency
          </p>
          <h1
            className="text-4xl md:text-5xl font-bold text-white text-center mb-8"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            Our Premium Rooms
          </h1>
          <SearchWidget compact />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search rooms..."
                className="w-full pl-10 pr-4 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 transition-colors bg-white"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-stone-400" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors ${
                showFilters ? 'bg-amber-600 border-amber-600 text-white' : 'border-stone-200 bg-white text-stone-600 hover:border-amber-500'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>

            {hasFilters && (
              <button onClick={clearFilters} className="text-sm text-stone-500 hover:text-amber-700 font-medium flex items-center gap-1">
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {availabilityLoading ? (
              <span className="text-sm text-amber-600 font-semibold flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin inline-block" />
                Checking availability…
              </span>
            ) : (
              <span className="text-sm text-stone-500">
                {filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''} found
              </span>
            )}
            <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => setView('grid')}
                className={`p-2.5 transition-colors ${view === 'grid' ? 'bg-amber-600 text-white' : 'text-stone-500 hover:text-stone-700'}`}
                aria-label="Grid view"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2.5 transition-colors ${view === 'list' ? 'bg-amber-600 text-white' : 'text-stone-500 hover:text-stone-700'}`}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Min Price (₹/night)</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="w-full border-2 border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Max Price (₹/night)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Any"
                className="w-full border-2 border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Min Guests</label>
              <CustomSelect
                label=""
                value={capacity}
                onChange={(val) => setCapacity(val.toString())}
                options={[
                  { value: '', label: 'Any' },
                  ...[1, 2, 3, 4, 5, 6].map((n) => ({ value: n.toString(), label: `${n}+ guests` })),
                ]}
              />
            </div>
          </div>
        )}

        {filteredRooms.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-stone-950 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg border border-amber-500/20 mx-auto mb-6">
              <img src="/logo.png" alt="PSR Logo" className="w-full h-full object-contain" />
            </div>
            <h3 className="text-2xl font-bold text-stone-700 mb-2">No Rooms Found</h3>
            <p className="text-stone-500 mb-6">Try adjusting your filters or search query.</p>
            <button onClick={clearFilters} className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl px-6 py-3 transition-colors">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className={`grid gap-6 ${view === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filteredRooms.map((room, idx) => (
              <RoomCard key={room.id} room={room} priority={idx < 3} checkIn={checkIn} checkOut={checkOut} view={view} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
