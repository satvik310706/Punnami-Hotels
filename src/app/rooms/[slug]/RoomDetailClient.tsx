'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Wifi, Wind, Car, Flame, Tv, UtensilsCrossed, CheckCircle2, Star, MapPin,
  Clock, Users, BedDouble, CalendarDays, ChevronLeft, ChevronRight, X,
  ChevronDown, Shield, Sparkles, Minus, Plus, Calendar,
} from 'lucide-react';
import { format, addDays, addMonths } from 'date-fns';
import { getTodayIST, isAfter6amIST } from '@/lib/ist';
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
  // If it's already past 6 AM IST, the earliest valid check-in is tomorrow
  const earliestCheckIn = isAfter6amIST() ? tomorrow : today;

  const [checkIn, setCheckIn] = useState<Date>(
    initialCheckIn ? new Date(initialCheckIn + 'T00:00:00') : earliestCheckIn
  );
  const [checkOut, setCheckOut] = useState<Date>(
    initialCheckOut ? new Date(initialCheckOut + 'T00:00:00') : addDays(earliestCheckIn, 1)
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
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showOTP, setShowOTP] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginError, setLoginError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [isRedirectingToPayment, setIsRedirectingToPayment] = useState(false);
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

  // Time helper/normalizer (converts 12-hour AM/PM and other inputs to standard HH:mm:ss 24-hour time)
  const normalizeTime = (timeStr: string) => {
    if (!timeStr) return '12:00:00';
    
    // Check if it already matches HH:mm:ss (24-hour format)
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
      return timeStr;
    }
    
    // Check if it is HH:mm (24-hour format)
    if (/^\d{2}:\d{2}$/.test(timeStr)) {
      return `${timeStr}:00`;
    }

    // Try to parse AM/PM format (e.g., "12:00 PM" or "11:00 AM")
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      const ampm = match[3].toUpperCase();

      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;

      const paddedHours = hours.toString().padStart(2, '0');
      return `${paddedHours}:${minutes}:00`;
    }

    return timeStr; // Fallback
  };

  // Define Timing slots matching ts-tours
  const slots = useMemo(() => {
    const combined: { title: string; slotStart: string; slotEnd: string; totalRooms: number; priceWeekday?: number | null; priceWeekend?: number | null }[] = [];
    const customSlots = room.bookingSlots || room.booking_slots;
    if (Array.isArray(customSlots)) {
      customSlots.forEach((s: any) => {
        combined.push({
          title: s.title || 'Custom Slot',
          slotStart: normalizeTime(s.slotStart || s.slot_start),
          slotEnd: normalizeTime(s.slotEnd || s.slot_end),
          totalRooms: Number(s.totalRooms || s.total_rooms || room.totalInventory || 5),
          priceWeekday: s.priceWeekday !== undefined ? s.priceWeekday : (s.price_weekday !== undefined ? s.price_weekday : null),
          priceWeekend: s.priceWeekend !== undefined ? s.priceWeekend : (s.price_weekend !== undefined ? s.price_weekend : null),
        });
      });
    }
    return combined;
  }, [room.bookingSlots, room.totalInventory]);

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
    // Initial fetch
    fetchAvailability(format(new Date(), 'yyyy-MM'));
    fetchAvailability(format(addMonths(new Date(), 1), 'yyyy-MM'));

    // Poll every 30 seconds when tab is active
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAvailability(format(new Date(), 'yyyy-MM'));
        fetchAvailability(format(addMonths(new Date(), 1), 'yyyy-MM'));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [room.id, room.slug]);

  const currentSlot = slots[selectedSlotIndex] || slots[0];

  const availableDatesSet = useMemo(() => {
    const available = new Set<string>();
    if (!currentSlot) return available;
    const suffix = `_${currentSlot.slotStart}_${currentSlot.slotEnd}`;
    
    // Convert object entries to arrays to avoid Object.entries overhead inside the loop
    const keys = Object.keys(availability);
    
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (key.endsWith(suffix)) {
        const info = availability[key];
        if (!info.isClosed && (info.totalRooms - info.bookedRooms - info.reservedRooms) > 0) {
          available.add(key.slice(0, 10)); // Extract 'YYYY-MM-DD' directly using slice instead of split
        }
      }
    }
    return available;
  }, [availability, currentSlot]);

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

  // ── Keyboard navigation for lightbox (needs galleries to be defined first) ──
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!showGallery) return;
    const n = galleries.length;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  setActiveImg(p => (p - 1 + n) % n);
      if (e.key === 'ArrowRight') setActiveImg(p => (p + 1) % n);
      if (e.key === 'Escape')     setShowGallery(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGallery, galleries.length]);

  // ── Touch / swipe helpers (also needs galleries) ───────────────────────────
  const galLen = galleries.length;
  const onTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setActiveImg(p => (p + 1) % galLen);
      else          setActiveImg(p => (p - 1 + galLen) % galLen);
    }
    setTouchStartX(null);
  };

  const facilities = Array.isArray(room.facilities) ? room.facilities as string[] : [];
  const faqs = Array.isArray(room.faqs) ? room.faqs : [];
  const rawPolicies = Array.isArray(room.policies) ? room.policies : (
    Array.isArray(room.hotel?.policies) ? room.hotel.policies : []
  );
  const policies = [
    {
      title: 'Occupancy & Children Policy',
      description: `Strictly limited to a maximum of ${room.capacityPerRoom || 3} adults and up to ${room.maxChildren} child${room.maxChildren > 1 ? 'ren' : ''} (ages 0-10) per room.`
    },
    ...rawPolicies
  ];
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
        if (inv.isClosed && !isAdmin) {
          minCapacity = 0;
          break;
        }
        const avail = inv.totalRooms - inv.bookedRooms - inv.reservedRooms;
        if (avail < minCapacity) {
          minCapacity = avail;
        }
      } else {
        // Block by default if there's no pre-registered inventory in DB
        minCapacity = 0;
        break;
      }
      current.setDate(current.getDate() + 1);
    }
    return Math.max(0, minCapacity);
  }, [checkIn, checkOut, selectedSlotIndex, slots, availability, room, isAdmin]);

  useEffect(() => {
    const maxAdultsAllowed = maxAvailableForSelectedSlot * (room.maxAdults || room.capacityPerRoom || 3);
    if (adults > maxAdultsAllowed && maxAvailableForSelectedSlot > 0) {
      setAdults(maxAdultsAllowed);
    }
  }, [maxAvailableForSelectedSlot, adults, room.maxAdults, room.capacityPerRoom]);

  useEffect(() => {
    const maxChildrenAllowed = maxAvailableForSelectedSlot * (room.maxChildren || 2);
    if (childrenCount > maxChildrenAllowed && maxAvailableForSelectedSlot > 0) {
      setChildrenCount(maxChildrenAllowed);
    }
  }, [maxAvailableForSelectedSlot, childrenCount, room.maxChildren]);

  useEffect(() => {
    if (bookingError) {
      setBookingError('');
    }
  }, [checkIn, checkOut, rooms, adults, childrenCount, selectedSlotIndex]);

  const pricing = useMemo(() => {
    let subtotal = 0;
    let pureBaseSubtotal = 0;
    let surgeSubtotal = 0;
    let discountSubtotal = 0;
    const current = new Date(checkIn);
    const breakdown: { date: string; pricePerRoom: number; price: number; isWeekend: boolean }[] = [];

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
      // Resolve custom slot base prices (slot-level pricing takes priority over room category pricing)
      const slotWeekdayPrice = slot?.priceWeekday ?? room.weekdayPrice;
      const slotWeekendPrice = slot?.priceWeekend ?? room.weekendPrice;
      const basePrice = isWeekendDay ? Number(slotWeekendPrice) : Number(slotWeekdayPrice);
      // If inventory has an admin price override, use that; otherwise use slot/category base price
      const pricePerRoom = inv && inv.priceOverride !== null && inv.priceOverride !== undefined ? Number(inv.priceOverride) : basePrice;

      breakdown.push({
        date: dateStr,
        pricePerRoom,
        price: pricePerRoom * rooms,
        isWeekend: isWeekendDay,
      });
      subtotal += pricePerRoom * rooms;
      pureBaseSubtotal += basePrice * rooms;
      
      if (pricePerRoom > basePrice) {
        surgeSubtotal += (pricePerRoom - basePrice) * rooms;
      } else if (pricePerRoom < basePrice) {
        discountSubtotal += (basePrice - pricePerRoom) * rooms;
      }

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
    // Compute a representative per-room price for the label (average across nights, per room)
    const avgPricePerRoom = breakdown.length > 0 ? Math.round(pureBaseSubtotal / rooms / breakdown.length) : 0;
    return { subtotal, pureBaseSubtotal, surgeSubtotal, discountSubtotal, gst, total, nights: breakdown.length, breakdown, agentDiscount, avgPricePerRoom };
  }, [checkIn, checkOut, rooms, room.weekdayPrice, room.weekendPrice, agentProfile, availability, selectedSlotIndex, slots]);

  const executeCheckout = async (
    passengersList?: any[],
    quickBookingVal?: boolean,
    paymentPercentage?: number,
    leadName?: string,
    leadPhone?: string,
    leadEmail?: string
  ) => {
    setBookingLoading(true);
    setBookingError('');
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
          guestName: leadName || guestName,
          guestPhone: leadPhone || guestPhone,
          guestEmail: leadEmail || guestEmail,
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
        setBookingLoading(false);
        return;
      }
      setIsRedirectingToPayment(true);
      setShowPassengerModal(false);
      router.push(`/booking/${data.publicId}`);
    } catch {
      setBookingError('Something went wrong. Please try again.');
      setBookingLoading(false);
    }
  };

  const handleBookingClick = () => {
    if (nights <= 0) return;
    setIsMobileDrawerOpen(false);
    setShowPassengerModal(true);
  };

  const handlePassengerSubmit = async (
    passengersList: any[],
    quickVal: boolean,
    paymentPercentage: number,
    leadName: string,
    leadPhone: string,
    leadEmail: string
  ) => {
    await executeCheckout(passengersList, quickVal, paymentPercentage, leadName, leadPhone, leadEmail);
  };

  const nights = pricing.nights;
  const reviewScore = (4.5 + (parseInt(room.id) % 5) * 0.1).toFixed(1);

  // Common Booking Inputs Component (to prevent duplicate definitions)
  const renderBookingForm = () => {
    const slot = slots[selectedSlotIndex] || slots[0];
    const sStart = slot ? normalizeTime(slot.slotStart) : '12:00:00';
    const sEnd = slot ? normalizeTime(slot.slotEnd) : '11:00:00';
    const isOvernight = sStart > sEnd || 
      (slot?.title || '').toLowerCase().includes('overnight') || 
      (slot?.title || '').toLowerCase().includes('night') || 
      (slot?.title || '').toLowerCase().includes('24');

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
            availableDates={availableDatesSet}
            onMonthChange={(m) => fetchAvailability(m)}
            align="left"
          />
          {isOvernight ? (
            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-600" />
                  Check-out
                </span>
              </label>
              <div className="w-full border-2 border-stone-200 bg-stone-50 rounded-xl px-3.5 py-3 text-stone-400 font-semibold text-sm cursor-not-allowed flex items-center justify-between shadow-sm">
                <span className="flex items-center gap-2">
                  <span>{format(addDays(checkIn, 1), 'dd MMM yyyy')}</span>
                  <span className="text-[9px] bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded-md normal-case shrink-0">
                    Next Day
                  </span>
                </span>
                <Calendar className="h-4 w-4 text-stone-400 opacity-50" />
              </div>
            </div>
          ) : (
            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-600" />
                  Check-out
                </span>
              </label>
              <div className="w-full border-2 border-stone-200 bg-stone-50 rounded-xl px-3.5 py-3 text-stone-400 font-semibold text-sm cursor-not-allowed flex items-center justify-between shadow-sm">
                <span className="flex items-center gap-2">
                  <span>{format(checkIn, 'dd MMM yyyy')}</span>
                  <span className="text-[9px] bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded-md normal-case shrink-0">
                    Same Day
                  </span>
                </span>
                <Calendar className="h-4 w-4 text-stone-400 opacity-50" />
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

        {slots.length === 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-750 font-bold">
            ⚠️ No timing slots are configured for this room. Booking is unavailable.
          </div>
        )}

        {maxAvailableForSelectedSlot === 0 && slots.length > 0 && (
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
              <div className={`flex items-center justify-between rounded-xl border border-stone-200 px-3 py-1.5 shadow-sm ${maxAvailableForSelectedSlot === 0 ? 'bg-stone-100 opacity-70' : 'bg-white'}`}>
                <button
                  type="button"
                  disabled={maxAvailableForSelectedSlot === 0 || adults <= 1}
                  onClick={() => setAdults((v) => Math.max(1, v - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:text-amber-700 hover:bg-stone-50 active:scale-95 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-sm font-black text-stone-800">{adults}</span>
                <button
                  type="button"
                  disabled={maxAvailableForSelectedSlot === 0 || adults >= maxAvailableForSelectedSlot * (room.maxAdults || room.capacityPerRoom || 3)}
                  onClick={() => setAdults((v) => Math.min(maxAvailableForSelectedSlot * (room.maxAdults || room.capacityPerRoom || 3), v + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:text-amber-700 hover:bg-stone-50 active:scale-95 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Children Counter */}
            <div>
              <span className="block text-[10px] font-bold text-stone-400 uppercase mb-1.5">Children (Ages 0 - 10)</span>
              <div className={`flex items-center justify-between rounded-xl border border-stone-200 px-3 py-1.5 shadow-sm ${maxAvailableForSelectedSlot === 0 ? 'bg-stone-100 opacity-70' : 'bg-white'}`}>
                <button
                  type="button"
                  disabled={maxAvailableForSelectedSlot === 0 || childrenCount <= 0}
                  onClick={() => setChildrenCount((v) => Math.max(0, v - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:text-amber-700 hover:bg-stone-50 active:scale-95 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-sm font-black text-stone-800">{childrenCount}</span>
                <button
                  type="button"
                  disabled={maxAvailableForSelectedSlot === 0 || childrenCount >= maxAvailableForSelectedSlot * (room.maxChildren || 2)}
                  onClick={() => setChildrenCount((v) => Math.min(maxAvailableForSelectedSlot * (room.maxChildren || 2), v + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:text-amber-700 hover:bg-stone-50 active:scale-95 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-[10px] font-bold mt-2 border-t border-stone-100 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-stone-400 uppercase tracking-wider">Max Occupancy Per Room:</span>
              <span className="text-stone-700 font-extrabold">{room.capacityPerRoom} Adults & {room.maxChildren} Child{room.maxChildren > 1 ? 'ren' : ''} (Ages 0-10)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-400 uppercase tracking-wider">Required Rooms:</span>
              <span className="text-amber-750 font-extrabold uppercase">
                {roomsCount} Room{roomsCount > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

      {/* Price Breakdown */}
      {nights > 0 && (
        <div className="bg-stone-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-stone-500">₹{pricing.avgPricePerRoom.toLocaleString('en-IN')} × {nights} night{nights > 1 ? 's' : ''} × {rooms} room{rooms > 1 ? 's' : ''}</span>
            <span className="font-semibold text-stone-700">{formatCurrency(pricing.pureBaseSubtotal)}</span>
          </div>
          {pricing.surgeSubtotal > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-stone-500">Surge Fee <span className="text-[10px] opacity-70">(High Demand)</span></span>
              <span className="font-bold text-red-600">+₹{pricing.surgeSubtotal.toLocaleString('en-IN')}</span>
            </div>
          )}
          {pricing.discountSubtotal > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-stone-500">Special Discount</span>
              <span className="font-bold text-emerald-600">-₹{pricing.discountSubtotal.toLocaleString('en-IN')}</span>
            </div>
          )}
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
        disabled={bookingLoading || nights <= 0 || room.isActive === false || slots.length === 0 || maxAvailableForSelectedSlot === 0}
        className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 disabled:text-stone-500 disabled:cursor-not-allowed text-white font-black rounded-xl py-3.5 text-sm transition-colors shadow-lg hover:shadow-amber-600/30 cursor-pointer"
      >
        {room.isActive === false
          ? 'Unavailable'
          : slots.length === 0
          ? 'No Slots Configured'
          : maxAvailableForSelectedSlot === 0
          ? 'Sold Out'
          : bookingLoading
          ? 'Processing...'
          : `Book Now – ${formatCurrency(pricing.total)}`}
      </button>

      <p className="text-center text-[10px] text-stone-400 font-bold uppercase tracking-wider">
        {room.isActive === false ? 'Reservations Closed' : "No payment charged yet — you'll pay after verification"}
      </p>
    </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-20 lg:pb-10">
      {/* ═══════════════════════════════════════════════════════
          GALLERY HERO — full-bleed Airbnb/Marriott 5-panel grid
          ═══════════════════════════════════════════════════════ */}
      <div className="relative bg-stone-900">

        {/* ── DESKTOP ──────────────────────────────────────────── */}
        <div className="hidden md:block">
          {/* Grid is full-bleed — no container wrapper so images touch edges */}
          <div className={`relative grid gap-[3px] h-[68vh] ${
            galleries.length === 1 ? 'grid-cols-1' :
            galleries.length === 2 ? 'grid-cols-[3fr_2fr]' :
            'grid-cols-[1fr_1fr]'
          }`}>

            {/* ─ Main (large) image ─ */}
            <div
              className="relative overflow-hidden cursor-pointer group"
              onClick={() => { setActiveImg(0); setShowGallery(true); }}
            >
              <Image
                src={galleries[0]}
                alt={room.name}
                fill
                priority
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                sizes={galleries.length === 1 ? "100vw" : "(min-width: 768px) 50vw, 100vw"}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* ─ Right column: 2-image or 2×2 grid ─ */}
            {galleries.length === 2 && (
              <div
                className="relative overflow-hidden cursor-pointer group"
                onClick={() => { setActiveImg(1); setShowGallery(true); }}
              >
                <Image src={galleries[1]} alt={`${room.name} 2`} fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  sizes="40vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/12 transition-colors pointer-events-none" />
              </div>
            )}

            {galleries.length >= 3 && (
              <div className={`grid gap-[3px] ${galleries.length === 3 ? 'grid-cols-1 grid-rows-2' : 'grid-cols-2 grid-rows-2'}`}>
                {galleries.slice(1, 5).map((img, i) => (
                  <div
                    key={i}
                    className={`relative overflow-hidden cursor-pointer group ${
                      galleries.length === 4 && i === 0 ? 'row-span-2' : ''
                    }`}
                    onClick={() => { setActiveImg(i + 1); setShowGallery(true); }}
                  >
                    <Image
                      src={img}
                      alt={`${room.name} ${i + 2}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      sizes="25vw"
                    />
                    {i === 3 && galleries.length > 5 ? (
                      <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1 pointer-events-none">
                        <span className="text-white font-black text-2xl">+{galleries.length - 5}</span>
                        <span className="text-white/75 text-[10px] font-semibold uppercase tracking-widest">more photos</span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors pointer-events-none" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ─ "Show all photos" floating pill ─ */}
            <button
              onClick={() => { setActiveImg(0); setShowGallery(true); }}
              className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-sm hover:bg-white text-stone-900 text-sm font-bold px-5 py-2.5 rounded-full shadow-xl border border-stone-200/80 transition-all hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              Show all {galleries.length} photo{galleries.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>

        {/* ── MOBILE: Full-width carousel with arrows + dots ──────── */}
        <div
          className="md:hidden relative h-[56vw] min-h-[240px] max-h-[400px] bg-stone-900 overflow-hidden select-none"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <Image
            src={galleries[activeImg] || galleries[0]}
            alt={room.name}
            fill
            priority
            className="object-cover transition-opacity duration-300"
            sizes="100vw"
            unoptimized={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Prev / Next arrows */}
          {galleries.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveImg((p) => (p - 1 + galleries.length) % galleries.length); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm hover:bg-black/65 text-white rounded-full p-2 transition-all"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveImg((p) => (p + 1) % galleries.length); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm hover:bg-black/65 text-white rounded-full p-2 transition-all"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Dot indicators */}
          {galleries.length > 1 && galleries.length <= 10 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
              {galleries.map((_, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`rounded-full transition-all ${i === activeImg ? 'bg-white w-4 h-1.5' : 'bg-white/50 w-1.5 h-1.5'}`} />
              ))}
            </div>
          )}

          {/* Photo counter badge */}
          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs rounded-lg px-2.5 py-1 font-semibold">
            {activeImg + 1} / {galleries.length}
          </div>

          {/* Tap to open lightbox */}
          <button
            onClick={() => setShowGallery(true)}
            className="absolute inset-0 w-full h-full"
            aria-label="Open photo gallery"
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          FULLSCREEN LIGHTBOX — keyboard + swipe enabled
          ═══════════════════════════════════════════════════ */}
      {showGallery && (
        <div
          className="fixed inset-0 z-[60] bg-black flex flex-col select-none"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* ── Top bar ── */}
          <div className="flex items-center justify-between px-5 py-3.5 shrink-0 bg-black/60 backdrop-blur-sm">
            <span className="text-white/60 text-sm font-medium truncate max-w-[40%]">{room.name}</span>
            <span className="text-white font-bold text-sm tabular-nums">
              {activeImg + 1}
              <span className="text-white/35 mx-1">/</span>
              {galleries.length}
            </span>
            <button
              onClick={() => setShowGallery(false)}
              className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm font-semibold"
            >
              <X className="h-5 w-5" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>

          {/* ── Main image — fills all remaining height ── */}
          <div className="relative flex-1 min-h-0 overflow-hidden">
            {/* Blurred Background to fill empty space */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
              <Image
                key={`bg-${galleries[activeImg]}`}
                src={galleries[activeImg]}
                alt=""
                fill
                className="object-cover blur-2xl scale-110"
                sizes="100vw"
                unoptimized
              />
            </div>

            {/* Prev */}
            {galleries.length > 1 && (
              <button
                onClick={() => setActiveImg(p => (p - 1 + galleries.length) % galleries.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/25 backdrop-blur-md text-white rounded-full p-4 transition-all hover:scale-110 active:scale-95 shadow-xl"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
            )}

            {/* Image — uses full div height */}
            <div className="absolute inset-0 z-10 flex items-center justify-center p-4 md:p-8">
              <div className="relative w-full h-full max-w-7xl">
                <Image
                  key={galleries[activeImg]}
                  src={galleries[activeImg]}
                  alt={`${room.name} – photo ${activeImg + 1}`}
                  fill
                  className="object-contain drop-shadow-2xl"
                  unoptimized
                  priority
                />
              </div>
            </div>

            {/* Next */}
            {galleries.length > 1 && (
              <button
                onClick={() => setActiveImg(p => (p + 1) % galleries.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/25 backdrop-blur-md text-white rounded-full p-4 transition-all hover:scale-110 active:scale-95 shadow-xl"
                aria-label="Next photo"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            )}
          </div>

          {/* ── Thumbnail strip ── */}
          {galleries.length > 1 && (
            <div className="shrink-0 bg-black/60 backdrop-blur-sm py-3 px-4">
              <div className="flex gap-2 justify-center overflow-x-auto">
                {galleries.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`relative shrink-0 rounded-md overflow-hidden transition-all duration-200 ${
                      i === activeImg
                        ? 'w-[72px] h-[52px] ring-2 ring-amber-400 ring-offset-1 ring-offset-black scale-105'
                        : 'w-14 h-10 opacity-45 hover:opacity-75 hover:scale-105'
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" sizes="72px" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Room Details */}
          <div className="lg:col-span-2 space-y-10">
            {/* Inactive Room Category Banner Alert */}
            {room.isActive === false && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 shadow-sm flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 text-amber-700 font-black text-lg">
                  ⚠️
                </div>
                <div>
                  <h4 className="text-amber-950 font-black text-sm uppercase tracking-wide">Currently Unavailable</h4>
                  <p className="text-amber-800 text-xs mt-1 font-semibold leading-relaxed">
                    This room category is currently not available for bookings. We are not accepting reservations at the moment. You can browse other available categories.
                  </p>
                </div>
              </div>
            )}
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

            {/* Clickable Selectable Timing Slots Grid */}
            {slots.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-stone-400">
                  Select Timing Slot
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {slots.map((slot, idx) => {
                    const isSelected = selectedSlotIndex === idx;
                    // Format timings for display (e.g., "12:00 PM" instead of "12:00:00")
                    const formatTimeDisplay = (timeStr: string) => {
                      if (!timeStr) return '';
                      const parts = timeStr.split(':');
                      if (parts.length >= 2) {
                        const h = parseInt(parts[0], 10);
                        const m = parts[1];
                        const ampm = h >= 12 ? 'PM' : 'AM';
                        const displayH = h % 12 === 0 ? 12 : h % 12;
                        return `${displayH}:${m} ${ampm}`;
                      }
                      return timeStr;
                    };
                    
                    const checkInDisp = formatTimeDisplay(slot.slotStart);
                    const checkOutDisp = formatTimeDisplay(slot.slotEnd);

                    // Pricing display for the slot
                    const slotWeekdayPrice = slot.priceWeekday ?? room.weekdayPrice;
                    const slotWeekendPrice = slot.priceWeekend ?? room.weekendPrice;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedSlotIndex(idx)}
                        className={`text-left flex flex-col justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50/70 border-amber-600 shadow-md shadow-amber-600/5'
                            : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className={`text-sm font-black ${isSelected ? 'text-amber-800' : 'text-stone-800'}`}>
                            {slot.title}
                          </span>
                          <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-amber-600 bg-amber-600 text-white' : 'border-stone-300'
                          }`}>
                            {isSelected && <span className="text-[10px] font-bold">✓</span>}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-2">
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                          <span>{checkInDisp} - {checkOutDisp}</span>
                        </div>

                        <div className="flex items-baseline gap-1 mt-auto">
                          <span className="text-xs text-stone-400 font-semibold">From</span>
                          <span className={`text-base font-black ${isSelected ? 'text-amber-800' : 'text-stone-905'}`}>
                            ₹{Number(slotWeekdayPrice).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-stone-400 font-bold">/night</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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
                {/* Price header - shows selected slot pricing, not raw category base price */}
                <div className="bg-gradient-to-br from-stone-900 to-stone-800 p-6">
                  {(() => {
                    const slot = slots[selectedSlotIndex] || slots[0];
                    const slotWeekdayPrice = slot?.priceWeekday ?? room.weekdayPrice;
                    const slotWeekendPrice = slot?.priceWeekend ?? room.weekendPrice;
                    return (
                      <>
                        <div className="text-stone-400 text-xs uppercase tracking-wider mb-1">Starting from</div>
                        <div className="text-3xl font-black text-white">
                          ₹{Number(slotWeekdayPrice).toLocaleString('en-IN')}
                          <span className="text-sm font-normal text-stone-300 ml-1">/night</span>
                        </div>
                        {Number(slotWeekendPrice) > Number(slotWeekdayPrice) && (
                          <div className="text-xs text-amber-400 mt-1">
                            Weekend: ₹{Number(slotWeekendPrice).toLocaleString('en-IN')}/night
                          </div>
                        )}
                      </>
                    );
                  })()}
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
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-stone-200/85 px-6 pt-4 pb-[calc(env(safe-area-inset-bottom)_+_0.85rem)] flex items-center justify-between gap-4 z-40 lg:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">
            {nights > 0 ? 'Total Computed Price' : 'Starting from'}
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-amber-700 tracking-tight">
              ₹{(nights > 0 ? pricing.total : (slots[selectedSlotIndex]?.priceWeekday ?? slots[0]?.priceWeekday ?? room.weekdayPrice)).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-bold text-stone-400 uppercase">
              {nights > 0 ? `(${nights} nights)` : '/night'}
            </span>
          </div>
        </div>
        {room.isActive === false ? (
          <button
            disabled
            className="flex-1 max-w-[200px] bg-stone-300 text-stone-500 font-black rounded-xl py-3 text-xs uppercase tracking-wider transition-all flex items-center justify-center cursor-not-allowed"
          >
            Closed
          </button>
        ) : slots.length === 0 ? (
          <button
            disabled
            className="flex-1 max-w-[200px] bg-stone-300 text-stone-500 font-black rounded-xl py-3 text-xs uppercase tracking-wider transition-all flex items-center justify-center cursor-not-allowed"
          >
            No Slots
          </button>
        ) : (
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="flex-1 max-w-[200px] bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl py-3 text-xs uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer shadow-md"
          >
            Book Room
          </button>
        )}
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
        isAdmin={isAdmin}
      />

      {/* Checkout Pending Check Modal */}
      <CheckoutPendingCheck />

      {/* Redirecting Full-Screen Loader Overlay */}
      {isRedirectingToPayment && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md z-[999] flex flex-col items-center justify-center text-white">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-6" />
          <h2 className="text-2xl font-bold tracking-wide animate-pulse" style={{ fontFamily: 'Georgia, serif' }}>Creating Your Reservation Hold...</h2>
          <p className="text-stone-400 text-xs mt-2 font-semibold">Setting up secure checkout details. Please wait.</p>
        </div>
      )}
    </div>
  );
}
