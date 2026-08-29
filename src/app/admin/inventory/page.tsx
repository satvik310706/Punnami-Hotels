'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarDays, ChevronLeft, ChevronRight, Lock, Unlock, 
  Info, Sliders, Bed, Search, ShieldAlert, CheckCircle2, Clock, RefreshCw, Minus, Plus, X
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, getDay, getDaysInMonth } from 'date-fns';
import CustomDatePicker from '@/components/CustomDatePicker';
import CustomSelect from '@/components/CustomSelect';
import InlineLoader from '@/components/InlineLoader';
import { useModalStore } from '@/hooks/useModalStore';

interface InventoryItem {
  roomTypeId: string;
  roomTypeName: string;
  slotTitle?: string;
  slotStart?: string;
  slotEnd?: string;
  date: string;
  totalRooms: number;
  bookedRooms: number;
  reservedRooms: number;
  isClosed: boolean;
  hasOverride: boolean;
  id: string | null;
  priceOverride: number | null;
  defaultWeekdayPrice: number;
  defaultWeekendPrice: number;
}

interface CalendarDay {
  date: string;
  dayOfMonth: number;
  inventories: InventoryItem[];
}

interface RoomType {
  id: string;
  name: string;
  totalInventory: number;
  bookingSlots?: any;
  standardSlotStart?: string;
  standardSlotEnd?: string;
}

interface EditSlotState {
  slotStart: string;
  slotEnd: string;
  title: string;
  totalRooms: number;
  minRooms: number;
  isClosed: boolean;
  priceOverride: string;
  basePrice: number;
  isExpanded: boolean;
}


export default function AdminInventoryPage() {
  const { showAlert, showConfirm } = useModalStore();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit Drawer / Modal state — now multi-slot
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [editSlots, setEditSlots] = useState<EditSlotState[]>([]);
  const [saving, setSaving] = useState(false);

  // Bulk modal state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkRoomId, setBulkRoomId] = useState('');
  const [bulkSlotStart, setBulkSlotStart] = useState('ALL');
  const [bulkSlotEnd, setBulkSlotEnd] = useState('ALL');
  const [bulkStartDate, setBulkStartDate] = useState<Date>(new Date());
  const [bulkEndDate, setBulkEndDate] = useState<Date>(new Date());
  const [bulkIsClosed, setBulkIsClosed] = useState(true);
  const [bulkTotalRooms, setBulkTotalRooms] = useState<string>('');
  const [bulkPriceOverride, setBulkPriceOverride] = useState<string>('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1; // 1-indexed

      const res = await fetch(`/api/v1/admin/inventory/calendar?year=${year}&month=${month}`);
      if (res.ok) {
        const data = await res.json();
        setCalendarData(data.calendarData);
        setRoomTypes(data.roomTypes);
        if (data.roomTypes.length > 0 && !selectedRoomId) {
          setSelectedRoomId(data.roomTypes[0].id);
          setBulkRoomId(data.roomTypes[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, [currentMonth]);

  const isPastDate = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cellDate = new Date(dateStr + 'T00:00:00');
    return cellDate < today;
  };

  // Build editSlots array from inventories for a given room
  const buildEditSlots = (day: CalendarDay, activeId: string, openSlotKey?: string): EditSlotState[] => {
    const rt = roomTypes.find((r) => r.id === activeId);
    const customSlots = (rt?.bookingSlots as any[]) ?? [];
    if (customSlots.length === 0) return [];
    const cellDate = new Date(day.date + 'T00:00:00');
    const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;

    return customSlots.map((s: any, idx: number) => {
      const ss = s.slotStart || s.slot_start || '12:00:00';
      const se = s.slotEnd || s.slot_end || '11:00:00';
      const slotKey = `${ss}_${se}`;
      const inv = day.inventories.find((i) => i.roomTypeId === activeId && i.slotStart === ss && i.slotEnd === se);
      const slotBasePrice = isWeekend 
        ? (inv?.defaultWeekendPrice ?? s.priceWeekend ?? s.price_weekend ?? 2200)
        : (inv?.defaultWeekdayPrice ?? s.priceWeekday ?? s.price_weekday ?? 2200);

      return {
        slotStart: ss,
        slotEnd: se,
        title: s.title || `Slot ${idx + 1}`,
        totalRooms: inv?.totalRooms ?? rt?.totalInventory ?? 5,
        minRooms: inv ? (inv.bookedRooms + inv.reservedRooms) : 0,
        isClosed: inv?.isClosed ?? true,
        priceOverride: inv?.priceOverride !== null && inv?.priceOverride !== undefined ? String(inv.priceOverride) : '',
        basePrice: Number(slotBasePrice),
        isExpanded: openSlotKey ? slotKey === openSlotKey : idx === 0,
      };
    });
  };


  // Open edit modal for a day, optionally focusing a specific slot
  const handleOpenEdit = (day: CalendarDay, roomId?: string, slotStart?: string, slotEnd?: string) => {
    setSelectedDay(day);
    const firstRoomId = roomTypes[0]?.id || '';
    const activeId = roomId || selectedRoomId || firstRoomId;
    setSelectedRoomId(activeId);
    const openKey = slotStart && slotEnd ? `${slotStart}_${slotEnd}` : undefined;
    setEditSlots(buildEditSlots(day, activeId, openKey));
  };

  // When room changes inside the modal, rebuild slots for the new room
  const handleRoomChangeInEdit = (roomId: string) => {
    setSelectedRoomId(roomId);
    if (selectedDay) {
      setEditSlots(buildEditSlots(selectedDay, roomId));
    }
  };

  // Update a single slot field in the editSlots array
  const updateSlot = (idx: number, field: Partial<EditSlotState>) => {
    setEditSlots(prev => prev.map((s, i) => i === idx ? { ...s, ...field } : s));
  };

  // Save all slots for the selected day
  const handleSaveDay = async () => {
    if (!selectedDay || editSlots.length === 0) return;
    setSaving(true);
    try {
      const results = await Promise.all(
        editSlots.map((slot) =>
          fetch('/api/v1/admin/inventory/update-day', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomTypeId: selectedRoomId,
              date: selectedDay.date,
              slotStart: slot.slotStart,
              slotEnd: slot.slotEnd,
              totalRooms: slot.totalRooms,
              isClosed: slot.isClosed,
              priceOverride: slot.priceOverride !== '' ? parseFloat(slot.priceOverride) : null,
            }),
          })
        )
      );
      const anyFailed = results.some(r => !r.ok);
      if (!anyFailed) {
        setSelectedDay(null);
        fetchInventoryData();
        showAlert('Success', 'All slot settings saved successfully.', 'success');
      } else {
        showAlert('Error', 'One or more slots failed to save. Please try again.', 'error');
      }
    } catch {
      showAlert('Error', 'Network request failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Save bulk configuration
  const handleSaveBulk = async () => {
    setBulkLoading(true);
    try {
      const res = await fetch('/api/v1/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomTypeId: bulkRoomId,
          startDate: format(bulkStartDate, 'yyyy-MM-dd'),
          endDate: format(bulkEndDate, 'yyyy-MM-dd'),
          slotStart: bulkSlotStart,
          slotEnd: bulkSlotEnd,
          isClosed: bulkIsClosed,
          totalRooms: bulkTotalRooms ? parseInt(bulkTotalRooms) : null,
          priceOverride: bulkPriceOverride !== '' ? parseFloat(bulkPriceOverride) : null,
        }),
      });

      if (res.ok) {
        setIsBulkModalOpen(false);
        setBulkTotalRooms('');
        setBulkPriceOverride('');
        fetchInventoryData();
        showAlert('Success', 'Bulk inventory updated successfully.', 'success');
      } else {
        const data = await res.json();
        showAlert('Error', data.error || 'Failed to update range', 'error');
      }
    } catch {
      showAlert('Error', 'Network request failed.', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

  const daysInMonthCount = getDaysInMonth(currentMonth);
  const firstDayIndex = getDay(startOfMonth(currentMonth)); // 0 = Sun, 1 = Mon ...
  const blankCells = Array(firstDayIndex).fill(null);

  // Compute available slots for selected room in bulk modal
  const bulkRoomSlots = useMemo(() => {
    const rt = roomTypes.find((r) => r.id === bulkRoomId);
    if (!rt) return [];
    
    const combined: { title: string; slotStart: string; slotEnd: string }[] = [
      { title: 'All Timing Slots', slotStart: 'ALL', slotEnd: 'ALL' }
    ];
    const customSlots = rt.bookingSlots;
    if (Array.isArray(customSlots)) {
      customSlots.forEach((s: any) => {
        combined.push({
          title: s.title || 'Custom Slot',
          slotStart: s.slotStart || s.slot_start || '12:00:00',
          slotEnd: s.slotEnd || s.slot_end || '11:00:00',
        });
      });
    }
    return combined;
  }, [roomTypes, bulkRoomId]);

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-stone-900" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Room Occupancy Inventory Grid
          </h1>
          <p className="text-stone-500 mt-1">Visually monitor booking availability, sold out dates, slots, and block closures.</p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <button
            onClick={() => fetchInventoryData()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-700 shadow-sm transition-all hover:bg-stone-50 hover:border-stone-300 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-amber-600' : 'text-stone-500'}`} />
            Refresh
          </button>
          <button
            onClick={() => {
              if (selectedRoomId) {
                setBulkRoomId(selectedRoomId);
              } else if (roomTypes.length > 0) {
                setBulkRoomId(roomTypes[0].id);
              }
              setBulkSlotStart('12:00:00');
              setBulkSlotEnd('11:00:00');
              setIsBulkModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-amber-700"
          >
            <Sliders className="h-4 w-4" />
            Bulk Block Date Range
          </button>
        </div>
      </div>

      {/* Navigation and Indicators */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center bg-white border border-stone-200 p-5 rounded-2xl shadow-sm gap-4">
        {/* Room Variant Select dropdown */}
        <div className="flex-1 max-w-md">
          <label className="block text-xs font-black uppercase tracking-wider text-stone-500 mb-1.5">View Room Variant</label>
          {roomTypes.length > 0 && (
            <CustomSelect
              label="Room Variant"
              value={selectedRoomId}
              onChange={(val) => {
                setSelectedRoomId(val);
                setBulkRoomId(val);
              }}
              options={roomTypes.map(rt => ({ value: rt.id, label: rt.name }))}
            />
          )}
        </div>

        {/* Month Selector Buttons */}
        <div className="flex items-center gap-4 justify-center">
          <button 
            type="button"
            onClick={handlePrevMonth}
            className="p-2.5 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5 text-stone-600" />
          </button>
          <h2 className="text-xl font-bold text-stone-950 min-w-[160px] text-center" style={{ fontFamily: 'Georgia, serif' }}>
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button 
            type="button"
            onClick={handleNextMonth}
            className="p-2.5 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer"
          >
            <ChevronRight className="h-5 w-5 text-stone-600" />
          </button>
        </div>

        {/* Legend status indicators */}
        <div className="flex flex-wrap gap-4 items-center text-xs font-bold uppercase tracking-wider text-stone-500 justify-start lg:justify-end">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-green-50 border border-green-200 inline-block" />
            <span>Open</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-50 border border-red-200 inline-block" />
            <span>Closed / Blocked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-50 border border-amber-250 inline-block" />
            <span>Sold Out</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50/50 px-2 py-0.5 rounded-lg border border-amber-200/50">
            <span className="w-3.5 h-3.5 rounded bg-gradient-to-tr from-amber-500/10 to-amber-500/40 border border-amber-300 inline-block" />
            <span className="font-extrabold text-[10px]">Weekend (Saturday & Sunday)</span>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="bg-white border border-stone-200 rounded-3xl shadow-lg overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-stone-200 text-center bg-stone-50 text-stone-500 py-3.5 text-xs font-bold uppercase tracking-widest">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, idx) => {
              const isWeekendHeader = idx === 0 || idx === 6;
              return (
                <div 
                  key={d} 
                  className={`py-1 ${isWeekendHeader ? 'text-amber-800 bg-amber-100/40 border-b-2 border-amber-500/80 font-black rounded-t-lg' : ''}`}
                >
                  {d}
                </div>
              );
            })}
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 min-h-[400px]">
          {loading ? (
            <div className="col-span-7 flex items-center justify-center py-24">
              <InlineLoader size="lg" label="Loading calendar" />
            </div>
          ) : (
            <>
              {blankCells.map((_, idx) => (
                <div key={`blank-${idx}`} className="border border-stone-100 bg-stone-50/30" />
              ))}
              
              {calendarData.map((day) => {
                const isPast = isPastDate(day.date);
                const cellDate = new Date(day.date + 'T00:00:00');
                const dayOfWeek = cellDate.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                return (
                  <div
                    key={day.date}
                    onClick={() => handleOpenEdit(day)}
                    className={`border border-stone-100 p-3 min-h-[135px] text-left align-top transition-all flex flex-col justify-between cursor-pointer relative group ${
                      isPast 
                        ? 'bg-red-50/30 hover:bg-red-50/50' 
                        : isWeekend
                        ? 'bg-gradient-to-br from-amber-500/[0.03] to-amber-500/[0.08] hover:from-amber-500/[0.06] hover:to-amber-500/[0.12] border-amber-200/50 border-l-4 border-l-amber-500/80 shadow-[inset_0_1px_2px_rgba(245,158,11,0.03)]'
                        : 'hover:bg-stone-50 bg-white hover:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)]'
                    }`}
                  >
                    {/* Day number & weekend indicator */}
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-sm font-extrabold flex items-baseline gap-1 ${
                        isPast ? 'text-red-700/60' : isWeekend ? 'text-amber-900 font-black' : 'text-stone-900'
                      }`}>
                        <span className="text-base">{day.dayOfMonth}</span>
                        {isWeekend && !isPast && (
                          <span className="text-[9px] text-amber-600/80 font-bold">
                            ({dayOfWeek === 6 ? 'Sat' : 'Sun'})
                          </span>
                        )}
                        {isPast && <span className="text-[8px] uppercase tracking-wider text-red-500/70 font-semibold">(Past)</span>}
                      </span>
                      {isWeekend && !isPast && (
                        <span className="text-[7.5px] tracking-widest text-amber-800 bg-amber-100/90 border border-amber-200/40 px-2 py-0.5 rounded-full font-black uppercase shadow-xs shrink-0">
                          Wknd
                        </span>
                      )}
                    </div>

                    {/* Compact Summary of Room Slots */}
                    <div className="mt-3 w-full">
                      {(() => {
                        const roomInvs = day.inventories.filter((inv) => inv.roomTypeId === selectedRoomId);
                        if (roomInvs.length === 0) return null;
                        
                        const totalSlots = roomInvs.length;
                        const closedSlots = roomInvs.filter(i => i.isClosed).length;
                        const soldOutSlots = roomInvs.filter(i => i.bookedRooms >= i.totalRooms && !i.isClosed).length;
                        const openSlots = totalSlots - closedSlots - soldOutSlots;

                        return (
                          <div className="flex flex-col gap-1.5 w-full">
                            {openSlots > 0 && (
                              <div className="bg-green-50 text-green-700 border border-green-200 text-[9px] font-bold px-1.5 py-1 rounded-md flex justify-between">
                                <span>Open Slots</span>
                                <span>{openSlots}</span>
                              </div>
                            )}
                            {soldOutSlots > 0 && (
                              <div className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold px-1.5 py-1 rounded-md flex justify-between">
                                <span>Sold Out</span>
                                <span>{soldOutSlots}</span>
                              </div>
                            )}
                            {closedSlots > 0 && (
                              <div className="bg-red-50 text-red-700 border border-red-200 text-[9px] font-bold px-1.5 py-1 rounded-md flex justify-between">
                                <span>Closed</span>
                                <span>{closedSlots}</span>
                              </div>
                            )}
                            <div className="mt-1 text-[8px] text-stone-400 font-bold uppercase tracking-wider text-center">
                              Click to view details
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </>
          )}
          </div>
        </div>
      </div>

      {/* Drawer popup modal for editing a day's settings */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 relative flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="bg-stone-900 px-6 py-5 text-white rounded-t-3xl flex items-start justify-between relative overflow-hidden shrink-0">
              <div className="relative z-10">
                <h3 className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif' }}>Configure Inventory</h3>
                <p className="text-xs text-stone-400 mt-1">{format(new Date(selectedDay.date + 'T00:00:00'), 'EEEE, dd MMMM yyyy')}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-stone-800/80 text-stone-300 hover:bg-stone-700 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto flex-1">
              <div className="p-5 space-y-4">
                {/* Room Variant selector */}
                {roomTypes.length > 0 && (
                  <CustomSelect
                    value={selectedRoomId}
                    onChange={handleRoomChangeInEdit}
                    options={roomTypes.map(rt => ({ value: rt.id, label: rt.name }))}
                    label="Select Room Variant"
                  />
                )}

                {/* All Timing Slots listed as collapsible accordion cards */}
                {editSlots.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Time Slots — Click to expand & edit</p>
                    {editSlots.map((slot, idx) => (
                      <div
                        key={`${slot.slotStart}_${slot.slotEnd}`}
                        className={`border-2 rounded-2xl overflow-hidden transition-all duration-200 ${
                          slot.isClosed ? 'border-red-200' : 'border-green-200'
                        }`}
                      >
                        {/* Slot Header — always visible, click to toggle */}
                        <button
                          type="button"
                          onClick={() => updateSlot(idx, { isExpanded: !slot.isExpanded })}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                            slot.isClosed ? 'bg-red-50/60 hover:bg-red-50' : 'bg-green-50/60 hover:bg-green-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-2 w-2 rounded-full shrink-0 ${
                              slot.isClosed ? 'bg-red-400' : 'bg-green-400'
                            }`} />
                            <div>
                              <p className="text-sm font-black text-stone-800">{slot.title}</p>
                              <p className="text-[10px] text-stone-400 font-semibold">
                                {slot.slotStart.slice(0, 5)} → {slot.slotEnd.slice(0, 5)}
                                {slot.priceOverride !== '' && (() => {
                                  const adj = parseInt(slot.priceOverride) || 0;
                                  const finalPrice = Math.max(0, slot.basePrice + adj);
                                  return ` · ₹${finalPrice.toLocaleString('en-IN')}`;
                                })()}
                              </p>
                            </div>

                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                              slot.isClosed ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {slot.isClosed ? 'Closed' : `${slot.totalRooms} rooms`}
                            </span>
                            <ChevronRight className={`h-4 w-4 text-stone-400 transition-transform duration-200 ${
                              slot.isExpanded ? 'rotate-90' : ''
                            }`} />
                          </div>
                        </button>

                        {/* Slot Body — expanded controls */}
                        {slot.isExpanded && (
                          <div className="px-4 pb-4 pt-3 space-y-3 bg-white border-t border-stone-100">
                            <div className="grid grid-cols-2 gap-3">
                              {/* Rooms Available */}
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">Rooms Available</label>
                                <div className="flex items-center justify-between border-2 border-stone-200 rounded-xl px-1.5 py-1 bg-white shadow-sm">
                                  <button
                                    type="button"
                                    disabled={slot.totalRooms <= slot.minRooms}
                                    onClick={() => updateSlot(idx, { totalRooms: Math.max(slot.minRooms, slot.totalRooms - 1) })}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-amber-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>
                                  <input
                                    type="number"
                                    min={slot.minRooms}
                                    value={slot.totalRooms}
                                    onChange={(e) => updateSlot(idx, { totalRooms: Math.max(slot.minRooms, parseInt(e.target.value) || slot.minRooms) })}
                                    className="w-10 text-center text-sm font-bold text-stone-900 focus:outline-none appearance-none bg-transparent"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateSlot(idx, { totalRooms: slot.totalRooms + 1 })}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-amber-700 transition-colors"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                {slot.minRooms > 0 && (
                                  <p className="text-[9px] text-stone-400 mt-1">Min: {slot.minRooms} booked</p>
                                )}
                              </div>


                              {/* Price Adjustment (+Surge / -Discount) */}
                              <div>
                                <div className="flex justify-between items-center mb-1.5">

                                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                                    Price Adjustment
                                  </label>
                                  <span className="text-[10px] font-semibold text-stone-400">
                                    Base: ₹{slot.basePrice.toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between border-2 border-stone-200 rounded-xl px-1.5 py-1 bg-white shadow-sm">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const current = parseInt(slot.priceOverride) || 0;
                                      const nextVal = Math.max(-slot.basePrice, current - 50);
                                      updateSlot(idx, { priceOverride: String(nextVal) });
                                    }}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-amber-700 transition-colors"
                                    title="Add ₹50 discount"
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>
                                  <div className="flex items-center">
                                    <input
                                      type="number"
                                      min={-slot.basePrice}
                                      placeholder="±0"
                                      value={slot.priceOverride}
                                      onChange={(e) => {
                                        const raw = e.target.value;
                                        if (raw === '' || raw === '-') {
                                          updateSlot(idx, { priceOverride: raw });
                                        } else {
                                          const parsed = parseInt(raw, 10);
                                          if (!isNaN(parsed)) {
                                            const clamped = Math.max(-slot.basePrice, parsed);
                                            updateSlot(idx, { priceOverride: String(clamped) });
                                          }
                                        }
                                      }}
                                      className="w-18 text-center text-sm font-bold text-stone-900 focus:outline-none appearance-none placeholder:font-normal placeholder:text-stone-300 bg-transparent"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const current = parseInt(slot.priceOverride) || 0;
                                      const nextVal = current + 50;
                                      updateSlot(idx, { priceOverride: String(nextVal) });
                                    }}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-amber-700 transition-colors"
                                    title="Add ₹50 surge"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                {/* Live calculation preview */}
                                <div className="mt-1 flex justify-between items-center text-[9px]">
                                  {(() => {
                                    const adj = parseInt(slot.priceOverride) || 0;
                                    const finalPrice = Math.max(0, slot.basePrice + adj);
                                    if (adj > 0) {
                                      return (
                                        <span className="text-amber-700 font-bold">
                                          Rate: ₹{finalPrice.toLocaleString('en-IN')} (+₹{adj} surge)
                                        </span>
                                      );
                                    } else if (adj < 0) {
                                      return (
                                        <span className="text-emerald-700 font-bold">
                                          Rate: ₹{finalPrice.toLocaleString('en-IN')} (-₹{Math.abs(adj)} discount)
                                        </span>
                                      );
                                    }
                                    return (
                                      <span className="text-stone-400 font-medium">
                                        Rate: ₹{slot.basePrice.toLocaleString('en-IN')} (Standard)
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>

                            {/* Open / Close toggle */}
                            <button
                              type="button"
                              onClick={() => updateSlot(idx, { isClosed: !slot.isClosed })}
                              className={`w-full flex items-center justify-between rounded-xl border px-4 py-2.5 transition-colors ${
                                slot.isClosed ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'
                              }`}
                            >

                              <span className="text-xs font-black uppercase tracking-wider">
                                {slot.isClosed ? 'Slot is CLOSED — tap to open' : 'Slot is OPEN — tap to close'}
                              </span>
                              {slot.isClosed ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Bulk actions for the day */}
                <div className="border-t border-stone-100 pt-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Bulk Actions (All Rooms on this day)</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const confirmed = await showConfirm('Close All Rooms', 'Are you sure you want to close all room categories and slots for this date?');
                        if (!confirmed) return;
                        setSaving(true);
                        try {
                          const res = await fetch('/api/v1/admin/inventory/bulk-day', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ date: selectedDay.date, action: 'CLOSE_ALL' }),
                          });
                          if (res.ok) {
                            setSelectedDay(null);
                            fetchInventoryData();
                            showAlert('Success', 'All room slots are closed for this date.', 'success');
                          } else {
                            const data = await res.json();
                            showAlert('Error', data.error || 'Failed to close slots', 'error');
                          }
                        } catch {
                          showAlert('Error', 'Network request failed.', 'error');
                        } finally {
                          setSaving(false);
                        }
                      }}
                      className="flex-1 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold py-2.5 px-3 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Close All Rooms
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const confirmed = await showConfirm('Open All Rooms', 'Are you sure you want to open all room categories and slots for this date?');
                        if (!confirmed) return;
                        setSaving(true);
                        try {
                          const res = await fetch('/api/v1/admin/inventory/bulk-day', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ date: selectedDay.date, action: 'OPEN_ALL' }),
                          });
                          if (res.ok) {
                            setSelectedDay(null);
                            fetchInventoryData();
                            showAlert('Success', 'All room slots are opened for this date.', 'success');
                          } else {
                            const data = await res.json();
                            showAlert('Error', data.error || 'Failed to open slots', 'error');
                          }
                        } catch {
                          showAlert('Error', 'Network request failed.', 'error');
                        } finally {
                          setSaving(false);
                        }
                      }}
                      className="flex-1 border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 font-bold py-2.5 px-3 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Open All Rooms
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-stone-50 border-t border-stone-100 shrink-0 rounded-b-3xl">
              <button 
                type="button" 
                onClick={() => setSelectedDay(null)}
                className="px-4 py-2 text-sm font-bold text-stone-500 hover:bg-stone-100 rounded-xl"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSaveDay}
                disabled={saving}
                className="flex items-center gap-1.5 bg-stone-900 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-md"
              >
                {saving && <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                Save All Slots
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk date blockage modal popup */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-150 relative">
            {/* Header */}
            <div className="bg-stone-900 px-6 py-5 text-white rounded-t-3xl flex items-start justify-between relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif' }}>Bulk Inventory Block</h3>
                <p className="text-xs text-stone-400 mt-1">Configure closures over a range of dates.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-stone-800/80 text-stone-300 hover:bg-stone-700 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              {roomTypes.length > 0 && (
                <CustomSelect
                  value={bulkRoomId}
                  onChange={(val) => {
                    setBulkRoomId(val);
                    setBulkSlotStart('ALL');
                    setBulkSlotEnd('ALL');
                  }}
                  options={roomTypes.map(rt => ({ value: rt.id, label: rt.name }))}
                  label="Select Room Variant"
                />
              )}

              {/* Timing Slot selector for bulk updates */}
              {bulkRoomSlots.length > 1 && (
                <CustomSelect
                  value={`${bulkSlotStart}_${bulkSlotEnd}`}
                  onChange={(val) => {
                    const [sStart, sEnd] = val.split('_');
                    setBulkSlotStart(sStart);
                    setBulkSlotEnd(sEnd);
                  }}
                  options={bulkRoomSlots.map((s) => ({
                    value: `${s.slotStart}_${s.slotEnd}`,
                    label: s.slotStart === 'ALL' ? s.title : `${s.title} (${s.slotStart.slice(0, 5)} - ${s.slotEnd.slice(0, 5)})`,
                  }))}
                  label="Select Timing Slot"
                />
              )}

              <div className="grid grid-cols-2 gap-2">
                <CustomDatePicker
                  selected={bulkStartDate}
                  onChange={(d) => setBulkStartDate(d)}
                  label="Start Date"
                  align="left"
                />
                <CustomDatePicker
                  selected={bulkEndDate}
                  onChange={(d) => setBulkEndDate(d)}
                  minDate={bulkStartDate}
                  label="End Date"
                  align="right"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                    Rooms Capacity Override
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Keep default"
                    value={bulkTotalRooms}
                    onChange={(e) => setBulkTotalRooms(e.target.value)}
                    className="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                    Price Overrides
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Keep default"
                    value={bulkPriceOverride}
                    onChange={(e) => setBulkPriceOverride(e.target.value)}
                    className="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Block Action</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkIsClosed(true)}
                    className={`flex-1 font-bold py-3 text-xs rounded-xl border-2 transition-all uppercase tracking-wider ${
                      bulkIsClosed ? 'bg-amber-600 border-amber-600 text-white shadow-md' : 'border-stone-200 text-stone-500 bg-white hover:border-amber-500'
                    }`}
                  >
                    Close Bookings
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkIsClosed(false)}
                    className={`flex-1 font-bold py-3 text-xs rounded-xl border-2 transition-all uppercase tracking-wider ${
                      !bulkIsClosed ? 'bg-amber-600 border-amber-600 text-white shadow-md' : 'border-stone-200 text-stone-500 bg-white hover:border-amber-500'
                    }`}
                  >
                    Open Bookings
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-stone-50 border-t border-stone-100">
              <button 
                type="button" 
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-stone-500 hover:bg-stone-100 rounded-xl"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSaveBulk}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 bg-stone-900 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-md"
              >
                {bulkLoading && <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                Apply Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
