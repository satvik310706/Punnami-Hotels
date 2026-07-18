'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Loader2, Plus, Calendar, User, Phone, Mail, Clock, ShieldCheck, CreditCard } from 'lucide-react';
import { format, addDays } from 'date-fns';
import CustomDatePicker from '@/components/CustomDatePicker';
import AdminSelect from '@/components/AdminSelect';

interface RoomTypeOption {
  id: string;
  name: string;
  weekdayPrice: number;
  weekendPrice: number;
  capacityPerRoom: number;
  bookingSlots?: Array<{ title: string; slotStart: string; slotEnd: string }>;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminCreateBookingModal({ isOpen, onClose, onSuccess }: Props) {
  const [roomsList, setRoomsList] = useState<RoomTypeOption[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [roomTypeId, setRoomTypeId] = useState('');
  const [checkInDate, setCheckInDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [checkOutDate, setCheckOutDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [adultCount, setAdultCount] = useState(2);
  const [childCount, setChildCount] = useState(0);
  const [manualRoomCount, setManualRoomCount] = useState(1);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'UPI'>('CASH');

  async function fetchRooms() {
    setIsLoadingRooms(true);
    try {
      const res = await fetch('/api/v1/admin/rooms');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setRoomsList(list);
        if (list.length > 0) {
          setRoomTypeId(list[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load room types:', err);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRooms();
      setErrorMsg('');
      setGuestName('');
      setGuestPhone('');
      setGuestEmail('');
      setAdultCount(2);
      setChildCount(0);
      setManualRoomCount(1);
      setAmountPaid('');
      setPaymentMethod('CASH');
    }
  }, [isOpen]);



  const selectedRoomType = useMemo(() => {
    return roomsList.find((r) => r.id === roomTypeId) || null;
  }, [roomTypeId, roomsList]);

  const slots = useMemo(() => {
    if (!selectedRoomType) return [];
    return selectedRoomType.bookingSlots || [];
  }, [selectedRoomType]);

  const isOvernightSlot = (slot: { title?: string; slotStart?: string; slotEnd?: string; slot_start?: string; slot_end?: string }) => {
    if (!slot) return false;
    const start = slot.slotStart || slot.slot_start || '12:00:00';
    const end = slot.slotEnd || slot.slot_end || '11:00:00';
    const normalizeTime = (t: string) => {
      const p = t.split(':');
      if (p.length === 2) return `${t}:00`;
      return t;
    };
    const sStart = normalizeTime(start);
    const sEnd = normalizeTime(end);
    return sStart > sEnd || 
      (slot.title || '').toLowerCase().includes('overnight') || 
      (slot.title || '').toLowerCase().includes('night') || 
      (slot.title || '').toLowerCase().includes('24');
  };

  // Synchronize check-out date when timing slot or check-in date changes
  useEffect(() => {
    const currentSlot = slots[selectedSlotIndex];
    if (!currentSlot) return;
    const isOvernight = isOvernightSlot(currentSlot);

    try {
      const cIn = new Date(checkInDate + 'T00:00:00');
      const cOut = new Date(checkOutDate + 'T00:00:00');

      if (isOvernight) {
        if (cOut <= cIn || isNaN(cOut.getTime())) {
          const nextDay = new Date(cIn.getTime());
          nextDay.setDate(nextDay.getDate() + 1);
          setCheckOutDate(format(nextDay, 'yyyy-MM-dd'));
        }
      } else {
        const tomorrow = new Date(cIn.getTime());
        tomorrow.setDate(tomorrow.getDate() + 1);
        // If checkout is set to tomorrow (default) or is before check-in, set to same-day checkout for day stay
        if (cOut < cIn || isNaN(cOut.getTime()) || cOut.getTime() === tomorrow.getTime()) {
          setCheckOutDate(checkInDate);
        }
      }
    } catch (err) {
      console.error('Date sync error:', err);
    }
  }, [selectedSlotIndex, checkInDate, slots]);

  const pricingSummary = useMemo(() => {
    if (!selectedRoomType) return { subtotal: 0, gst: 0, total: 0, rooms: 0, nights: 0 };
    
    // Parse dates
    const checkIn = new Date(checkInDate + 'T00:00:00');
    const checkOut = new Date(checkOutDate + 'T00:00:00');
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkOut < checkIn) {
      return { subtotal: 0, gst: 0, total: 0, rooms: 0, nights: 0 };
    }

    const currentSlot = slots[selectedSlotIndex];
    const sStart = currentSlot ? currentSlot.slotStart : '12:00:00';
    const sEnd = currentSlot ? currentSlot.slotEnd : '11:00:00';

    let limit = new Date(checkOut);
    if (checkIn.getTime() === checkOut.getTime()) {
      limit = addDays(checkIn, 1);
    }

    const stayDates: Date[] = [];
    const current = new Date(checkIn);
    while (current < limit) {
      stayDates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const requiredRooms = Math.max(1, manualRoomCount);

    let subtotal = 0;
    for (const d of stayDates) {
      const isWeekendDay = d.getDay() === 0 || d.getDay() === 6;
      const slotWeekdayPrice = currentSlot ? (currentSlot as any).priceWeekday ?? (currentSlot as any).price_weekday ?? selectedRoomType.weekdayPrice : selectedRoomType.weekdayPrice;
      const slotWeekendPrice = currentSlot ? (currentSlot as any).priceWeekend ?? (currentSlot as any).price_weekend ?? selectedRoomType.weekendPrice : selectedRoomType.weekendPrice;
      const price = isWeekendDay ? Number(slotWeekendPrice) : Number(slotWeekdayPrice);
      subtotal += price * requiredRooms;
    }

    const gst = Math.round(subtotal * 0.05);
    const gatewayFee = Math.round((subtotal + gst) * 0.01);
    const total = subtotal + gst + gatewayFee;
    return { subtotal, gst, total, rooms: requiredRooms, nights: stayDates.length };
  }, [selectedRoomType, checkInDate, checkOutDate, selectedSlotIndex, slots, adultCount, manualRoomCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setErrorMsg('Guest name is required.');
      return;
    }
    if (!/^\d{10}$/.test(guestPhone.trim())) {
      setErrorMsg('Please enter a valid 10-digit phone number.');
      return;
    }
    if (pricingSummary.total <= 0) {
      setErrorMsg('Invalid stay parameters or pricing.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const slot = slots[selectedSlotIndex];
      const payload = {
        roomTypeId,
        checkInDate,
        checkOutDate,
        slotStart: slot ? slot.slotStart : '12:00:00',
        slotEnd: slot ? slot.slotEnd : '11:00:00',
        adultCount,
        childCount,
        roomCount: manualRoomCount,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestEmail: guestEmail.trim(),
        amountPaid: amountPaid ? parseFloat(amountPaid) : 0,
        paymentMethod,
      };

      const res = await fetch('/api/v1/admin/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(data.error || 'Failed to create booking.');
      }
    } catch {
      setErrorMsg('Network request failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="bg-stone-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif' }}>Create New Booking</h3>
            <p className="text-xs text-stone-400 mt-1">Directly allocate rooms and override billing limits</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-stone-800 rounded-lg transition-colors text-white/70 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-stone-850">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-750 p-4.5 rounded-2xl text-xs font-bold leading-relaxed">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Room Category */}
          <div className="space-y-2">
            {isLoadingRooms ? (
              <div className="flex items-center gap-2 text-stone-500 text-xs font-bold py-2"><Loader2 className="h-4 w-4 animate-spin text-amber-600" /> Loading categories...</div>
            ) : (
              <AdminSelect
                label="Lodge Room Category"
                value={roomTypeId}
                onChange={(val) => {
                  setRoomTypeId(val);
                  setSelectedSlotIndex(0);
                }}
                options={roomsList.map((r) => ({
                  value: r.id,
                  label: `${r.name} (Max Occupancy: ${r.capacityPerRoom} adults)`,
                }))}
                placeholder="-- Choose Room Variant --"
                isSearchable={true}
              />
            )}
          </div>

          {/* Dates & Timing Slots */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <CustomDatePicker
                label="Check-in Date"
                selected={new Date(checkInDate + 'T00:00:00')}
                onChange={(date) => setCheckInDate(format(date, 'yyyy-MM-dd'))}
                allowToday={true}
              />
            </div>
            <div>
              <CustomDatePicker
                label="Check-out Date"
                selected={new Date(checkOutDate + 'T00:00:00')}
                onChange={(date) => setCheckOutDate(format(date, 'yyyy-MM-dd'))}
                minDate={new Date(checkInDate + 'T00:00:00')}
                allowToday={true}
              />
            </div>
          </div>

          {/* Timing Slots selection */}
          {slots.length > 0 && (
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Timing Slot</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {slots.map((s, idx) => {
                  const isSelected = selectedSlotIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedSlotIndex(idx)}
                      className={`text-left flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-50/70 border-amber-600 shadow-sm'
                          : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/30'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className={`block text-xs font-black ${isSelected ? 'text-amber-800' : 'text-stone-800'}`}>{s.title}</span>
                        <span className="block text-[10px] text-stone-400 font-bold">{s.slotStart.slice(0, 5)} - {s.slotEnd.slice(0, 5)}</span>
                      </div>
                      <div className={`h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-amber-600 bg-amber-600 text-white' : 'border-stone-300'
                      }`}>
                        {isSelected && <span className="text-[10px] font-bold">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Guest Identity */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 border-b border-stone-100 pb-1">Guest Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Guest Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-2xl border border-stone-200 bg-white pl-11 pr-4 py-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Guest Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="9951369573"
                    className="w-full rounded-2xl border border-stone-200 bg-white pl-11 pr-4 py-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Guest Email (Optional)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="guest@example.com"
                    className="w-full rounded-2xl border border-stone-200 bg-white pl-11 pr-4 py-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Occupancy Counters */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 border-b border-stone-100 pb-1">Stay Occupancy</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Rooms</label>
                <div className="flex items-center justify-between border-2 border-stone-200 rounded-2xl p-1 bg-stone-50">
                  <button
                    type="button"
                    onClick={() => setManualRoomCount(Math.max(1, manualRoomCount - 1))}
                    className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-stone-200 transition-colors text-stone-500 font-bold"
                  >
                    -
                  </button>
                  <span className="text-sm font-black text-stone-900">
                    {manualRoomCount} Room{manualRoomCount > 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => setManualRoomCount(manualRoomCount + 1)}
                    className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-stone-200 transition-colors text-stone-500 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Adults</label>
                <div className="flex items-center justify-between border-2 border-stone-200 rounded-2xl p-1 bg-stone-50">
                  <button
                    type="button"
                    onClick={() => setAdultCount(Math.max(1, adultCount - 1))}
                    className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-stone-200 transition-colors text-stone-500 font-bold"
                  >
                    -
                  </button>
                  <span className="text-sm font-black text-stone-900">
                    {adultCount} Adult{adultCount > 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAdultCount(adultCount + 1)}
                    className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-stone-200 transition-colors text-stone-500 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Children (Ages 0-10)</label>
                <div className="flex items-center justify-between border-2 border-stone-200 rounded-2xl p-1 bg-stone-50">
                  <button
                    type="button"
                    onClick={() => setChildCount(Math.max(0, childCount - 1))}
                    className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-stone-200 transition-colors text-stone-500 font-bold"
                  >
                    -
                  </button>
                  <span className="text-sm font-black text-stone-900">
                    {childCount} Child{childCount !== 1 ? 'ren' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => setChildCount(childCount + 1)}
                    className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-stone-200 transition-colors text-stone-500 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Cash Collection Override */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 border-b border-stone-100 pb-1">Billing & Direct Cash Receipt</h4>
            
            <div className="bg-stone-50 rounded-2xl p-4.5 space-y-2 text-xs font-semibold">
              <div className="flex justify-between text-stone-500">
                <span>Calculated Nights & Room allocation:</span>
                <span>{pricingSummary.nights} {checkInDate === checkOutDate ? 'day' : 'night'}{pricingSummary.nights > 1 ? 's' : ''} × {pricingSummary.rooms} room{pricingSummary.rooms > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Base Price (Subtotal):</span>
                <span>₹{pricingSummary.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Taxes & GST (5%):</span>
                <span>₹{pricingSummary.gst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Processing Fee (1%):</span>
                <span>₹{(pricingSummary.total - pricingSummary.subtotal - pricingSummary.gst).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-stone-900 font-bold border-t border-stone-200/50 pt-2 text-sm">
                <span>Total Calculated Stay Price:</span>
                <span className="text-amber-800">₹{pricingSummary.total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                  Amount Received (₹ - Leave empty for full pay)
                </label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder={`Full stay: ₹${pricingSummary.total}`}
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
                />
              </div>

              <div>
                <AdminSelect
                  label="Receipt Channel"
                  value={paymentMethod}
                  onChange={(val) => setPaymentMethod(val as any)}
                  options={[
                    { value: 'CASH', label: 'Cash Drawer' },
                    { value: 'BANK_TRANSFER', label: 'Bank Transfer (IMPS/NEFT)' },
                    { value: 'UPI', label: 'Google Pay / PhonePe UPI' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-stone-600 bg-white border border-stone-200 hover:bg-stone-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3.5 rounded-2xl text-sm font-black text-white bg-stone-900 hover:bg-amber-700 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <ShieldCheck className="h-4.5 w-4.5" />}
              <span>Create Direct Booking</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
