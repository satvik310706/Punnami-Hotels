'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays, Users, Search, ChevronDown } from 'lucide-react';
import { format, addDays, isAfter, isBefore, parseISO } from 'date-fns';
import { getTodayIST } from '@/lib/ist';
import CustomDatePicker from '@/components/CustomDatePicker';

interface SearchWidgetProps {
  compact?: boolean;
}

export default function SearchWidget({ compact = false }: SearchWidgetProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = getTodayIST();
  const tomorrow = addDays(today, 1);

  const urlCheckIn = searchParams.get('checkIn');
  const urlCheckOut = searchParams.get('checkOut');
  const urlGuests = searchParams.get('guests');

  const [checkIn, setCheckIn] = useState<Date>(urlCheckIn ? parseISO(urlCheckIn) : today);
  const [checkOut, setCheckOut] = useState<Date>(urlCheckOut ? parseISO(urlCheckOut) : tomorrow);
  const [guests, setGuests] = useState(urlGuests ? parseInt(urlGuests, 10) : 2);
  const [showGuests, setShowGuests] = useState(false);

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams({
      checkIn: format(checkIn, 'yyyy-MM-dd'),
      checkOut: format(checkOut, 'yyyy-MM-dd'),
      guests: guests.toString(),
    });
    router.push(`/rooms?${params.toString()}`);
  }, [checkIn, checkOut, guests, router]);

  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 ${compact ? 'p-4' : 'p-6 md:p-8'}`}>
      {!compact && (
        <p className="text-sm font-semibold text-amber-700 uppercase tracking-widest mb-4">
          Find Your Perfect Room
        </p>
      )}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {/* Check-in */}
        <div className="col-span-1">
          <CustomDatePicker
            selected={checkIn}
            onChange={(d) => {
              setCheckIn(d);
              if (!isAfter(checkOut, d)) setCheckOut(addDays(d, 1));
            }}
            label="Check-in"
            align="left"
          />
        </div>

        {/* Check-out */}
        <div className="col-span-1">
          <CustomDatePicker
            selected={checkOut}
            onChange={(d) => setCheckOut(d)}
            minDate={addDays(checkIn, 1)}
            label="Check-out"
            badge={nights > 0 ? `${nights} Night${nights > 1 ? 's' : ''}` : undefined}
            align="right"
          />
        </div>

        {/* Guests */}
        <div className="col-span-2 md:col-span-1 relative">
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-amber-600" />
            Guests
          </label>
          <button
            onClick={() => setShowGuests(!showGuests)}
            className="w-full border-2 border-stone-200 bg-white rounded-xl px-3.5 py-3 text-stone-800 font-semibold text-sm focus:outline-none focus:border-amber-500 transition-colors text-left flex items-center justify-between shadow-sm"
          >
            <span>{guests} Guest{guests !== 1 ? 's' : ''}</span>
            <ChevronDown className={`h-4 w-4 text-stone-400 transition-transform ${showGuests ? 'rotate-180' : ''}`} />
          </button>
          {showGuests && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-stone-200 p-4 z-50">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-700">Guests</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    className="w-8 h-8 rounded-full border border-stone-300 flex items-center justify-center font-bold text-stone-600 hover:border-amber-500 hover:text-amber-600 transition-colors"
                  >-</button>
                  <span className="w-6 text-center font-bold">{guests}</span>
                  <button
                    onClick={() => setGuests(Math.min(10, guests + 1))}
                    className="w-8 h-8 rounded-full border border-stone-300 flex items-center justify-center font-bold text-stone-600 hover:border-amber-500 hover:text-amber-600 transition-colors"
                  >+</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Button */}
        <div className="col-span-2 md:col-span-1 flex items-end">
          <button
            onClick={handleSearch}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold rounded-xl px-6 py-3.5 flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Search className="h-4 w-4" />
            Search Rooms
          </button>
        </div>
      </div>
    </div>
  );
}
