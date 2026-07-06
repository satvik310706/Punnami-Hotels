'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Wifi, Wind, Car, Flame, Tv, UtensilsCrossed, CheckCircle2, Star, MapPin,
  Clock, Users, BedDouble, CalendarDays, ChevronLeft, ChevronRight, X,
  ChevronDown, Shield, Sparkles, Minus, Plus,
} from 'lucide-react';
import { format, addDays, addMonths } from 'date-fns';
import { getTodayIST } from '@/lib/ist';
import { calculateStayTotal, calculateGST, formatCurrency } from '@/lib/utils';
import OTPModal from '@/components/OTPModal';
import CustomDatePicker from '@/components/CustomDatePicker';
import CustomSelect from '@/components/CustomSelect';
import { ReconnectingEventSource } from '@/lib/ReconnectingEventSource';
import CheckoutPassengerModal from '@/components/CheckoutPassengerModal';
import { CheckoutPendingCheck } from '@/components/CheckoutPendingCheck';

const FACILITY_ICONS: Record<string, React.ElementType> = {
  'wi-fi': Wifi, 'wifi': Wifi, 'a/c': Wind, 'ac': Wind,
  'hot water': Flame, 'tv': Tv, 'restaurant': UtensilsCrossed,
  'meals': UtensilsCrossed, 'parking': Car, 'car parking': Car,
};

function getFacilityIcon(name: string): React.ElementType {
  return FACILITY_ICONS[name.toLowerCase().trim()] || CheckCircle2;
}

interface RoomDetailClientProps {
  room: any;
  initialCheckIn?: string;
  initialCheckOut?: string;
}

export default function RoomDetailClient({ room, initialCheckIn, initialCheckOut }: RoomDetailClientProps) {
  const router = useRouter();
  const today = getTodayIST();
  const tomorrow = addDays(today, 1);

  const [checkIn, setCheckIn] = useState<Date>(
    initialCheckIn ? new Date(initialCheckIn + 'T00:00:00') : today
  );
  const [checkOut, setCheckOut] = useState<Date>(
    initialCheckOut ? new Date(initialCheckOut + 'T00:00:00') : tomorrow
  );
  
  const [adults, setAdults] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const roomsCount = useMemo(() => {
    const roomsForAdults = Math.ceil(adults / (room.capacityPerRoom || 3));
    const roomsForChildren = room.maxChildren > 0 ? Math.ceil(childrenCount / room.maxChildren) : 0;
    return Math.max(1, Math.max(roomsForAdults, roomsForChildren));
  }, [adults, childrenCount, room.capacityPerRoom, room.maxChildren]);
  const rooms = roomsCount;

  const [activeImg, setActiveImg] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showOTP, setShowOTP] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginError, setLoginError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [agentProfile, setAgentProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      // 1. Check Admin session
      try {
        const adminRes = await fetch('/api/v1/auth/admin/me');
        if (adminRes.ok) {
          const data = await adminRes.json();
          if (data.authenticated) {
            setIsAdmin(true);
            localStorage.setItem('punnami_admin_auth', 'true');
            return;
          }
        }
      } catch {}
      
      const adminAuth = localStorage.getItem('punnami_admin_auth') === 'true';
      setIsAdmin(adminAuth);
      if (adminAuth) return;

      // 2. Check User session
      try {
        const userRes = await fetch('/api/v1/auth/me');
        if (userRes.ok) {
          const data = await userRes.json();
          if (data.authenticated && data.user) {
            setIsUserLoggedIn(true);
            setGuestName(data.user.fullName || '');
            setGuestPhone(data.user.phone || '');
            setGuestEmail(data.user.email || '');
            localStorage.setItem('punnami_user_phone', data.user.phone);
          }
        }
      } catch {}
    };
    checkSession();
  }, []);

  // Time helper/normalizer
  const normalizeTime = (timeStr: string) => {
    if (!timeStr) return '12:00:00';
    const parts = timeStr.split(':');
    if (parts.length === 2) return `${timeStr}:00`;
    return timeStr;
  };

  // Define Timing slots matching ts-tours
  const slots = useMemo(() => {
    const combined: { title: string; slotStart: string; slotEnd: string; totalRooms: number; priceWeekday?: number | null; priceWeekend?: number | null }[] = [];
    combined.push({
      title: 'Standard Stay',
      slotStart: normalizeTime(room.hotel?.checkInTime || '12:00:00'),
      slotEnd: normalizeTime(room.hotel?.checkOutTime || '11:00:00'),
      totalRooms: room.totalInventory || 5,
      priceWeekday: null,
      priceWeekend: null,
    });
    const customSlots = room.bookingSlots || room.booking_slots;
    if (Array.isArray(customSlots)) {
      customSlots.forEach((s: any) => {
        combined.push({
          title: s.title,
          slotStart: normalizeTime(s.slotStart || s.slot_start),
          slotEnd: normalizeTime(s.slotEnd || s.slot_end),
          totalRooms: Number(s.totalRooms || s.total_rooms || room.totalInventory || 5),
          priceWeekday: s.priceWeekday !== undefined ? s.priceWeekday : (s.price_weekday !== undefined ? s.price_weekday : null),
          priceWeekend: s.priceWeekend !== undefined ? s.priceWeekend : (s.price_weekend !== undefined ? s.price_weekend : null),
        });
      });
    }
    return combined;
  }, [room.hotel, room.bookingSlots, room.totalInventory]);

  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);

  // Real-time Availability & Price Overrides State mapped by date_slotStart_slotEnd
  const [availability, setAvailability] = useState<Record<string, { totalRooms: number; bookedRooms: number; reservedRooms: number; isClosed: boolean; priceOverride: number | null }>>({});

  const fetchAvailability = async (monthStr: string) => {
    try {
      const res = await fetch(`/api/v1/rooms/${room.slug}/availability?month=${monthStr}`);
      if (res.ok) {
        const data = await res.json();
        const datesList = data.dates || [];
        setAvailability((prev) => {
          const next = { ...prev };
          datesList.forEach((d: any) => {
            const slotStart = normalizeTime(d.slotStart);
            const slotEnd = normalizeTime(d.slotEnd);
            const key = `${d.date}_${slotStart}_${slotEnd}`;
            next[key] = {
              totalRooms: d.totalRooms,
              bookedRooms: d.bookedRooms,
              reservedRooms: d.reservedRooms,
              isClosed: d.isClosed,
              priceOverride: d.priceOverride,
            };
          });
          return next;
        });
      }
    } catch (e) {
      console.error('Failed to fetch room availability', e);
    }
  };

  useEffect(() => {
    fetchAvailability(format(new Date(), 'yyyy-MM'));
    fetchAvailability(format(addMonths(new Date(), 1), 'yyyy-MM'));
  }, [room.slug]);

  useEffect(() => {
    const es = new ReconnectingEventSource(`/api/v1/stream/rooms/${room.id}`);

    es.addEventListener('INVENTORY_UPDATE', (e: any) => {
      try {
        const payload = JSON.parse(e.data);
        if (String(payload.roomTypeId) === String(room.id)) {
          const { travel_date, available, booked, reserved, is_closed, priceOverride, slot_start, slot_end } = payload;
          const sStart = normalizeTime(slot_start);
          const sEnd = normalizeTime(slot_end);
          const key = `${travel_date}_${sStart}_${sEnd}`;
          setAvailability((prev) => ({
            ...prev,
            [key]: {
              totalRooms: (available + booked + reserved),
              bookedRooms: booked,
              reservedRooms: reserved,
              isClosed: is_closed,
              priceOverride: priceOverride !== undefined ? priceOverride : null,
            },
          }));
        }
      } catch (err) {
        console.error('[SSE] Failed to parse room update payload', err);
      }
    });

    es.addEventListener('BULK_REFRESH', () => {
      fetchAvailability(format(new Date(), 'yyyy-MM'));
      fetchAvailability(format(addMonths(new Date(), 1), 'yyyy-MM'));
    });

    return () => {
      es.close();
    };
  }, [room.id, room.slug]);

  const currentSlot = slots[selectedSlotIndex] || slots[0];

  const closedDatesSet = useMemo(() => {
    const closed = new Set<string>();
    if (!currentSlot) return closed;
    const startStr = currentSlot.slotStart;
    const endStr = currentSlot.slotEnd;
    for (const [key, info] of Object.entries(availability)) {
      if (key.endsWith(`_${startStr}_${endStr}`)) {
        const dateStr = key.split('_')[0];
        if (info.isClosed || (info.bookedRooms + info.reservedRooms) >= info.totalRooms) {
          closed.add(dateStr);
        }
      }
    }
    return closed;
  }, [availability, selectedSlotIndex, slots, currentSlot]);

  useEffect(() => {
    const prof = localStorage.getItem('punnami_agent_profile');
    if (prof) {
      setAgentProfile(JSON.parse(prof));
    }
  }, []);

  // Mobile Booking Drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const galleries: string[] = [];
  if (room.coverImageUrl) galleries.push(room.coverImageUrl);
  if (Array.isArray(room.galleryImages)) {
    room.galleryImages.forEach((g: any) => {
      const url = typeof g === 'string' ? g : g?.url;
      if (url && !galleries.includes(url)) galleries.push(url);
    });
  }
  if (galleries.length === 0) {
    galleries.push('https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200');
  }

  const facilities = Array.isArray(room.facilities) ? room.facilities as string[] : [];
  const faqs = Array.isArray(room.faqs) ? room.faqs : [];
  const policies = Array.isArray(room.policies) ? room.policies : (
    Array.isArray(room.hotel?.policies) ? room.hotel.policies : []
  );
  const highlights = Array.isArray(room.highlights) ? room.highlights : [];

  const maxAvailableForSelectedSlot = useMemo(() => {
    const slot = slots[selectedSlotIndex] || slots[0];
    const sStart = slot ? normalizeTime(slot.slotStart) : '12:00:00';
    const sEnd = slot ? normalizeTime(slot.slotEnd) : '11:00:00';
    
    // Find slot config to get default capacity
    const slotConfig = (room.bookingSlots || room.booking_slots || []).find(
      (s: any) => normalizeTime(s.slotStart || s.slot_start) === sStart && normalizeTime(s.slotEnd || s.slot_end) === sEnd
    );
    const defaultCapacity = slotConfig?.totalRooms ?? slotConfig?.total_rooms ?? room.totalInventory ?? 5;

    if (isAdmin) {
      // Admin is not constrained by daily booked/reserved inventory but is capped by physical room capacity
      return defaultCapacity;
    }
    
    // Check if we have overrides for the date range
    const current = new Date(checkIn);
    let limit = new Date(checkOut);
    if (checkIn.getTime() === checkOut.getTime()) {
      limit = addDays(checkIn, 1);
    }
    
    let minCapacity = defaultCapacity;
    while (current < limit) {
      const dateStr = format(current, 'yyyy-MM-dd');
      const invKey = `${dateStr}_${sStart}_${sEnd}`;
      const inv = availability[invKey];
      if (inv) {
        const avail = inv.totalRooms - inv.bookedRooms - inv.reservedRooms;
        if (avail < minCapacity) {
          minCapacity = avail;
        }
      } else {
        if (defaultCapacity < minCapacity) {
          minCapacity = defaultCapacity;
        }
      }
      current.setDate(current.getDate() + 1);
    }
    return Math.max(0, minCapacity);
  }, [checkIn, checkOut, selectedSlotIndex, slots, availability, room, isAdmin]);

  useEffect(() => {
    const capacity = room.capacityPerRoom || 3;
    const maxAdultsAllowed = maxAvailableForSelectedSlot * capacity;
    if (adults > maxAdultsAllowed && maxAvailableForSelectedSlot > 0) {
      setAdults(maxAdultsAllowed);
    }
  }, [maxAvailableForSelectedSlot, adults, room.capacityPerRoom]);

  useEffect(() => {
    const maxChildrenAllowed = maxAvailableForSelectedSlot * (room.maxChildren || 2);
    if (childrenCount > maxChildrenAllowed && maxAvailableForSelectedSlot > 0) {
      setChildrenCount(maxChildrenAllowed);
    }
  }, [maxAvailableForSelectedSlot, childrenCount, room.maxChildren]);

  const pricing = useMemo(() => {
    let subtotal = 0;
    const current = new Date(checkIn);
    const breakdown = [];

    // Support same-day day-use stays
    let limit = new Date(checkOut);
    if (checkIn.getTime() === checkOut.getTime()) {
      limit = addDays(checkIn, 1);
    }

    while (current < limit) {
      const dateStr = format(current, 'yyyy-MM-dd');
      const isWeekendDay = current.getDay() === 0 || current.getDay() === 6;
      
      const slot = slots[selectedSlotIndex] || slots[0];
      const sStart = slot ? normalizeTime(slot.slotStart) : '12:00:00';
      const sEnd = slot ? normalizeTime(slot.slotEnd) : '11:00:00';
      const invKey = `${dateStr}_${sStart}_${sEnd}`;
      
      const inv = availability[invKey];
      // Resolve custom slot base prices
      const slotWeekdayPrice = slot?.priceWeekday ?? room.weekdayPrice;
      const slotWeekendPrice = slot?.priceWeekend ?? room.weekendPrice;
      const basePrice = isWeekendDay ? Number(slotWeekendPrice) : Number(slotWeekdayPrice);
      const price = inv && inv.priceOverride !== null ? inv.priceOverride : basePrice;

      breakdown.push({
        date: dateStr,
        price: price * rooms,
        isWeekend: isWeekendDay,
      });
      subtotal += price * rooms;
      current.setDate(current.getDate() + 1);
    }

    const gst = calculateGST(subtotal);

    let agentDiscount = 0;
    if (agentProfile) {
      const pct = Number(agentProfile.commissionPercentage || 0);
      const fixed = Number(agentProfile.commissionFixedAmount || 0);
      if (agentProfile.commissionType === 'FIXED') {
        agentDiscount = fixed;
      } else {
        agentDiscount = Math.round((subtotal * pct) / 100);
      }
    }

    const total = Math.max(0, subtotal + gst - agentDiscount);
    return { subtotal, gst, total, nights: breakdown.length, breakdown, agentDiscount };
  }, [checkIn, checkOut, rooms, room.weekdayPrice, room.weekendPrice, agentProfile, availability, selectedSlotIndex, slots]);

  const executeCheckout = async (passengersList?: any[], quickBookingVal?: boolean, paymentPercentage?: number) => {
    setBookingLoading(true);
    try {
      const slot = slots[selectedSlotIndex] || slots[0];
      const res = await fetch('/api/v1/bookings/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomTypeId: room.id,
          checkInDate: format(checkIn, 'yyyy-MM-dd'),
          checkOutDate: format(checkOut, 'yyyy-MM-dd'),
          slotStart: slot ? normalizeTime(slot.slotStart) : '12:00:00',
          slotEnd: slot ? normalizeTime(slot.slotEnd) : '11:00:00',
          rooms: roomsCount,
          guestName,
          guestPhone,
          guestEmail,
          adultCount: adults,
          childCount: childrenCount,
          passengers: passengersList,
          quickBooking: quickBookingVal,
          isAdmin,
          paymentPercentage,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBookingError(data.error || 'Booking failed. Please try again.');
        return;
      }
      router.push(`/booking/${data.publicId}`);
    } catch {
      setBookingError('Something went wrong. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBookingClick = () => {
    if (nights <= 0) return;
    if (!isAdmin && !isUserLoggedIn) {
      setLoginPhone('');
      setLoginError('');
      setShowLoginModal(true);
      return;
    }
    setIsMobileDrawerOpen(false);
    setShowPassengerModal(true);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = loginPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setLoginError('Please enter a valid 10-digit phone number');
      return;
    }
    setLoginError('');
    setBookingLoading(true);
    try {
      const res = await fetch('/api/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Failed to send OTP');
        return;
      }
      setGuestPhone(cleanPhone);
      setShowLoginModal(false);
      setShowOTP(true);
    } catch {
      setLoginError('Failed to send OTP. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleOTPSuccess = async () => {
    setShowOTP(false);
    setIsMobileDrawerOpen(false);
    localStorage.setItem('punnami_user_phone', guestPhone);
    setIsUserLoggedIn(true);

    try {
      const userRes = await fetch('/api/v1/auth/me');
      if (userRes.ok) {
        const data = await userRes.json();
        if (data.authenticated && data.user) {
          setGuestName(data.user.fullName || '');
          setGuestPhone(data.user.phone || '');
          setGuestEmail(data.user.email || '');
        }
      }
    } catch {}

    setShowPassengerModal(true);
  };

  const handlePassengerSubmit = async (passengersList: any[], quickVal: boolean, paymentPercentage: number) => {
    setShowPassengerModal(false);
    await executeCheckout(passengersList, quickVal, paymentPercentage);
  };

  const nights = pricing.nights;
  const reviewScore = (4.5 + (parseInt(room.id) % 5) * 0.1).toFixed(1);

  // Common Booking Inputs Component (to prevent duplicate definitions)
  const renderBookingForm = () => {
    const slot = slots[selectedSlotIndex] || slots[0];
    const sStart = slot ? normalizeTime(slot.slotStart) : '12:00:00';
    const sEnd = slot ? normalizeTime(slot.slotEnd) : '11:00:00';
    const isOvernight = sStart > sEnd || slot?.title.toLowerCase().includes('overnight') || slot?.title.toLowerCase().includes('night') || slot?.title.toLowerCase().includes('24');

    return (
      <div className="space-y-4">
        {/* Dates */}
        <div className="grid grid-cols-2 gap-2">
          <CustomDatePicker
            selected={checkIn}
            onChange={(d) => {
              setCheckIn(d);
              if (isOvernight) {
                if (checkOut <= d) setCheckOut(addDays(d, 1));
              } else {
                setCheckOut(d);
              }
            }}
            label="Check-in"
            closedDates={closedDatesSet}
            onMonthChange={(m) => fetchAvailability(m)}
            align="left"
          />
          {isOvernight ? (
            <CustomDatePicker
              selected={checkOut}
              onChange={(d) => setCheckOut(d)}
              minDate={addDays(checkIn, 1)}
              label="Check-out"
              closedDates={closedDatesSet}
              onMonthChange={(m) => fetchAvailability(m)}
              align="right"
            />
          ) : (
            <div className="flex flex-col">
              <span className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Check-out</span>
              <div className="w-full flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-bold text-stone-500 cursor-not-allowed">
                Same Day Stay
              </div>
            </div>
          )}
        </div>

        {/* Timing Slot selector */}
        {slots.length >= 1 && (
          <CustomSelect
            value={selectedSlotIndex}
            onChange={(val) => {
              const idx = Number(val);
              setSelectedSlotIndex(idx);
              const targetSlot = slots[idx];
              const slotOvernight = targetSlot ? normalizeTime(targetSlot.slotStart) > normalizeTime(targetSlot.slotEnd) : true;
              if (slotOvernight) {
                setCheckOut(addDays(checkIn, 1));
              } else {
                setCheckOut(checkIn);
              }
            }}
            options={slots.map((s, idx) => ({
              value: idx,
              label: `${s.title} (${s.slotStart.slice(0, 5)} - ${s.slotEnd.slice(0, 5)}) - Max: ${s.totalRooms ?? room.totalInventory} Rooms`,
            }))}
            label="Timing Slot"
          />
        )}

        {maxAvailableForSelectedSlot === 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-750 font-bold">
            ⚠️ Slot sold out or blocked on these dates. Please try another timing slot or check-in date.
          </div>
        )}

        {/* Guests Counters */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Adults Counter */}
            <div>
              <span className="block text-[10px] font-bold text-stone-400 uppercase mb-1.5">Adults</span>
              <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-3 py-1.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setAdults((v) => Math.max(1, v - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:text-amber-700 hover:bg-stone-50 active:scale-95 transition cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-sm font-black text-stone-800">{adults}</span>
                <button
                  type="button"
                  onClick={() => setAdults((v) => Math.min((maxAvailableForSelectedSlot || 5) * room.maxAdults, v + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:text-amber-700 hover:bg-stone-50 active:scale-95 transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Children Counter */}
            <div>
              <span className="block text-[10px] font-bold text-stone-400 uppercase mb-1.5">Children (Ages 0 - 10)</span>
              <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-3 py-1.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setChildrenCount((v) => Math.max(0, v - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:text-amber-700 hover:bg-stone-50 active:scale-95 transition cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-sm font-black text-stone-800">{childrenCount}</span>
                <button
                  type="button"
                  onClick={() => setChildrenCount((v) => Math.min((maxAvailableForSelectedSlot || 5) * room.maxChildren, v + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:text-amber-700 hover:bg-stone-50 active:scale-95 transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] font-bold mt-1">
            <span className="text-stone-400">
              {room.capacityPerRoom} Guests/Room Capacity
            </span>
            <span className="text-amber-750">
              Requires {roomsCount} Room{roomsCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>

      {/* Price Breakdown */}
      {nights > 0 && (
        <div className="bg-stone-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-stone-500">₹{room.weekdayPrice.toLocaleString('en-IN')} × {nights} night{nights > 1 ? 's' : ''} × {rooms} room{rooms > 1 ? 's' : ''}</span>
            <span className="font-semibold text-stone-700">{formatCurrency(pricing.subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-stone-500">GST (12%)</span>
            <span className="font-semibold text-stone-700">{formatCurrency(pricing.gst)}</span>
          </div>
          {pricing.agentDiscount > 0 && (
            <div className="flex justify-between text-xs text-teal-650 font-bold">
              <span>Agent Margin Retained</span>
              <span>-{formatCurrency(pricing.agentDiscount)}</span>
            </div>
          )}
          <div className="border-t border-stone-200 pt-2 flex justify-between">
            <span className="font-bold text-stone-900 text-xs">Total Amount</span>
            <span className="font-black text-sm text-amber-700">{formatCurrency(pricing.total)}</span>
          </div>
        </div>
      )}

      {bookingError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-750 font-bold">
          {bookingError}
        </div>
      )}

      {/* Book Button */}
      <button
        onClick={handleBookingClick}
        disabled={bookingLoading || nights <= 0}
        className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-black rounded-xl py-3.5 text-sm transition-colors shadow-lg hover:shadow-amber-600/30 cursor-pointer"
      >
        {bookingLoading
          ? 'Processing...'
          : !isUserLoggedIn && !isAdmin
          ? 'Login to Book'
          : `Book Now – ${formatCurrency(pricing.total)}`}
      </button>

      <p className="text-center text-[10px] text-stone-400 font-bold uppercase tracking-wider">
        No payment charged yet — you'll pay after verification
      </p>
    </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-20 lg:pb-10">
      {/* Gallery Hero */}
      <div className="relative bg-stone-900 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className={`grid ${galleries.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-0.5 h-[50vh] md:h-[65vh]`}>
            {/* Main image */}
            <div
              className="relative overflow-hidden cursor-pointer group col-span-1"
              onClick={() => setShowGallery(true)}
            >
              <Image
                src={galleries[activeImg] || galleries[0]}
                alt={room.name}
                fill
                priority
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes={galleries.length === 1 ? '100vw' : '(max-width: 768px) 100vw, 50vw'}
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
              <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white text-xs rounded-lg px-3 py-1.5 font-semibold">
                {activeImg + 1} / {galleries.length} photo{galleries.length > 1 ? 's' : ''}
              </div>
            </div>
            {/* Thumbnail grid */}
            {galleries.length > 1 && (
              <div className={`hidden md:grid gap-0.5 ${galleries.length === 2 ? 'grid-cols-1' : 'grid-rows-2'}`}>
                {galleries.slice(1, 3).map((img, i) => (
                  <div
                    key={i}
                    className="relative overflow-hidden cursor-pointer group"
                    onClick={() => { setActiveImg(i + 1); setShowGallery(true); }}
                  >
                    <Image src={img} alt={`${room.name} ${i + 2}`} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="25vw" />
                    {i === 1 && galleries.length > 3 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">+{galleries.length - 3} more</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {showGallery && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
          <button onClick={() => setShowGallery(false)} className="absolute top-4 right-4 text-white hover:text-amber-400 transition-colors">
            <X className="h-8 w-8" />
          </button>
          <button onClick={() => setActiveImg((p) => (p - 1 + galleries.length) % galleries.length)} className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-amber-400 transition-colors">
            <ChevronLeft className="h-10 w-10" />
          </button>
          <div className="relative w-full max-w-4xl h-[80vh] px-16">
            <Image src={galleries[activeImg]} alt="" fill className="object-contain" sizes="100vw" />
          </div>
          <button onClick={() => setActiveImg((p) => (p + 1) % galleries.length)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-amber-400 transition-colors">
            <ChevronRight className="h-10 w-10" />
          </button>
          {/* Thumbnails */}
          <div className="absolute bottom-4 left-0 right-0 flex gap-2 justify-center overflow-x-auto px-4">
            {galleries.map((img, i) => (
              <button key={i} onClick={() => setActiveImg(i)} className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${i === activeImg ? 'border-amber-400' : 'border-transparent'}`}>
                <Image src={img} alt="" fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Room Details */}
          <div className="lg:col-span-2 space-y-10">
            {/* Title block */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                {room.isFeatured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-bold">
                    <Sparkles className="h-3 w-3" /> Featured Room
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-2"
                style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                {room.name}
              </h1>
              <p className="text-sm font-semibold text-amber-700 mb-3">{room.hotel.name}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-amber-600" />
                  {room.hotel.address || 'Bhadrachalam, Telangana'}
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-stone-700">{reviewScore}</span>
                  <span className="text-stone-400">· Verified guests</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-amber-600" />
                  Up to {room.maxAdults} adults
                </div>
                <div className="flex items-center gap-1.5">
                  <BedDouble className="h-4 w-4 text-amber-600" />
                  {room.totalInventory} room{room.totalInventory > 1 ? 's' : ''} available
                </div>
              </div>
            </div>

            {/* Check-in/out strip */}
            <div className="flex flex-wrap gap-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="font-semibold text-stone-700">Check-in:</span>
                <span className="text-stone-600">{room.hotel.checkInTime || '12:00 PM'}</span>
              </div>
              <div className="w-px bg-amber-200 hidden sm:block" />
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="font-semibold text-stone-700">Check-out:</span>
                <span className="text-stone-600">{room.hotel.checkOutTime || '11:00 AM'}</span>
              </div>
            </div>

            {/* Description */}
            {room.description && (
              <div>
                <h2 className="text-2xl font-bold text-stone-900 mb-3" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>About This Room</h2>
                <div className="prose prose-stone max-w-none text-stone-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: room.description }}
                />
              </div>
            )}

            {/* Highlights */}
            {highlights.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-stone-900 mb-4" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>Highlights</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {highlights.map((h: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-4 border border-stone-100 shadow-sm">
                      <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-lg">{h.icon || '✨'}</div>
                      <span className="font-semibold text-stone-700 text-sm">{h.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Facilities */}
            {facilities.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-stone-900 mb-4" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>Amenities & Facilities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {facilities.map((f) => {
                    const Icon = getFacilityIcon(f);
                    return (
                      <div key={f} className="flex items-center gap-2 bg-white rounded-xl p-3 border border-stone-100 text-sm font-medium text-stone-600">
                        <Icon className="h-4 w-4 text-amber-600 shrink-0" />
                        {f}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Policies */}
            {policies.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-stone-900 mb-4" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>Policies</h2>
                <div className="space-y-3">
                  {policies.map((p: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-stone-100">
                      <Shield className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        {p.title && <div className="font-semibold text-stone-800 text-sm mb-1">{p.title}</div>}
                        <div className="text-stone-500 text-sm leading-relaxed">{p.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQs */}
            {faqs.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-stone-900 mb-4" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>Frequently Asked Questions</h2>
                <div className="space-y-2">
                  {faqs.map((faq: any, i: number) => (
                    <div key={i} className="border border-stone-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-stone-50 transition-colors"
                      >
                        <span className="font-semibold text-stone-800 text-sm pr-4">{faq.question}</span>
                        <ChevronDown className={`h-4 w-4 text-stone-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                      </button>
                      {openFaq === i && (
                        <div className="px-4 pb-4 bg-stone-50 text-sm text-stone-600 leading-relaxed">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Booking Sidebar (Desktop-only) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-20">
              <div className="bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
                {/* Price header */}
                <div className="bg-gradient-to-br from-stone-900 to-stone-800 p-6">
                  <div className="text-stone-400 text-xs uppercase tracking-wider mb-1">Starting from</div>
                  <div className="text-3xl font-black text-white">
                    ₹{room.weekdayPrice.toLocaleString('en-IN')}
                    <span className="text-sm font-normal text-stone-300 ml-1">/night</span>
                  </div>
                  {room.weekendPrice > room.weekdayPrice && (
                    <div className="text-xs text-amber-400 mt-1">
                      Weekend: ₹{room.weekendPrice.toLocaleString('en-IN')}/night
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {renderBookingForm()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar on Mobile */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-stone-200/85 px-6 py-4 flex items-center justify-between gap-4 z-40 lg:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">
            {nights > 0 ? 'Total Computed Price' : 'Starting from'}
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-amber-700 tracking-tight">
              ₹{(nights > 0 ? pricing.total : room.weekdayPrice).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-bold text-stone-400 uppercase">
              {nights > 0 ? `(${nights} nights)` : '/night'}
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="flex-1 max-w-[200px] bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl py-3 text-xs uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer shadow-md"
        >
          Book Room
        </button>
      </div>

      {/* Mobile Booking Drawer Modal */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center lg:hidden animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setIsMobileDrawerOpen(false)} />
          
          <div className="relative w-full max-h-[85vh] bg-white rounded-t-3xl overflow-hidden shadow-2xl flex flex-col z-10 animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="px-6 py-4 border-b border-stone-150 flex items-center justify-between bg-stone-50 shrink-0">
              <div>
                <h3 className="font-bold text-stone-900" style={{ fontFamily: 'Georgia, serif' }}>Configure Booking</h3>
                <p className="text-xs text-stone-400 mt-0.5">{room.name}</p>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-2 hover:bg-stone-100 rounded-full text-stone-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1 pb-12">
              {renderBookingForm()}
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-stone-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-stone-100 bg-stone-50">
              <div>
                <h2 className="font-bold text-stone-900 text-lg">Login to Book Stay</h2>
                <p className="text-xs text-stone-500 mt-0.5">Please verify your mobile number to continue</p>
              </div>
              <button 
                onClick={() => setShowLoginModal(false)} 
                className="p-2 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-5 w-5 text-stone-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full border-2 border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors font-bold text-stone-850"
                  disabled={bookingLoading}
                />
              </div>

              {loginError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-750 font-bold text-center">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loginPhone.length !== 10 || bookingLoading}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-black rounded-xl py-3.5 text-sm transition-colors cursor-pointer"
              >
                {bookingLoading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {showOTP && (
        <OTPModal
          phone={guestPhone}
          onSuccess={handleOTPSuccess}
          onClose={() => setShowOTP(false)}
        />
      )}

      {/* Checkout Passenger Modal */}
      <CheckoutPassengerModal
        isOpen={showPassengerModal}
        onClose={() => setShowPassengerModal(false)}
        onSubmit={handlePassengerSubmit}
        adults={adults}
        children={childrenCount}
        isProcessing={bookingLoading}
        guestName={guestName}
        guestPhone={guestPhone}
        totalAmount={pricing.total}
      />

      {/* Checkout Pending Check Modal */}
      <CheckoutPendingCheck />
    </div>
  );
}
