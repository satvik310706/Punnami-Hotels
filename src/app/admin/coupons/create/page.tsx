'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { useModalStore } from '@/hooks/useModalStore';
import CustomDatePicker from '@/components/CustomDatePicker';
import CustomSelect from '@/components/CustomSelect';

interface RoomType {
  id: string;
  name: string;
}

export default function CreateCouponPage() {
  const router = useRouter();
  const { showAlert } = useModalStore();
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [minBookingAmt, setMinBookingAmt] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  // Date range toggles
  const [useDateRange, setUseDateRange] = useState(false);
  const [validFrom, setValidFrom] = useState<Date>(() => new Date());
  const [validUntil, setValidUntil] = useState<Date>(() => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

  // Weekday / Weekend constraint
  const [isWeekendOnly, setIsWeekendOnly] = useState(false);
  const [isWeekdayOnly, setIsWeekdayOnly] = useState(false);

  // Rooms applicability states
  const [targetType, setTargetType] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchRoomsList = async () => {
      try {
        const res = await fetch('/api/v1/rooms');
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.items || data.rooms || []);
          setRooms(list.map((r: any) => ({ id: r.id.toString(), name: r.name })));
        }
      } catch (err) {
        console.error('Error fetching rooms:', err);
      } finally {
        setIsLoadingRooms(false);
      }
    };
    fetchRoomsList();
  }, []);

  const handleRoomCheckbox = (roomId: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) {
      showAlert('Required Fields', 'Please specify a coupon code and discount value.', 'error');
      return;
    }

    setIsSubmitting(true);

    const applicableRoomIds = targetType === 'ALL' 
      ? 'ALL' 
      : selectedRoomIds.length > 0 
      ? selectedRoomIds.join(',') 
      : 'ALL';

    const payload = {
      code: code.toUpperCase().trim(),
      discountType,
      discountValue: parseFloat(discountValue),
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
      minBookingAmt: minBookingAmt ? parseFloat(minBookingAmt) : null,
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      validFrom: useDateRange ? validFrom.toISOString() : null,
      validUntil: useDateRange ? validUntil.toISOString() : null,
      isActive,
      isWeekendOnly,
      isWeekdayOnly,
      applicableRoomIds,
    };

    try {
      const res = await fetch('/api/v1/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        showAlert('Success', `Coupon code "${payload.code}" created successfully!`, 'success');
        router.push('/admin/coupons');
      } else {
        showAlert('Error', data.error || 'Failed to create coupon.', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Error', 'An error occurred while creating coupon.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Back link */}
      <div>
        <Link 
          href="/admin/coupons" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Coupons
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-stone-900" style={{ fontFamily: 'Georgia, serif' }}>Create Coupon</h1>
        <p className="text-stone-500 text-xs mt-1">Setup discount promo code with custom date, time and category restrictions.</p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coupon Code */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase text-stone-700 tracking-wider">Promo Code Name *</label>
            <input 
              type="text" 
              placeholder="e.g. WELCOME20"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              className="w-full rounded-lg border border-stone-250 bg-stone-50/50 px-4 py-3 text-xs outline-none focus:border-amber-600 focus:bg-white transition-all font-bold tracking-wider"
            />
          </div>

          {/* Discount Type */}
          <div>
            <CustomSelect
              value={discountType}
              onChange={(val) => setDiscountType(val)}
              options={[
                { value: 'PERCENTAGE', label: 'Percentage (%)' },
                { value: 'FLAT', label: 'Flat Amount (₹)' }
              ]}
              label="Discount Type *"
            />
          </div>

          {/* Discount Value */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase text-stone-700 tracking-wider">Discount Value *</label>
            <input 
              type="number" 
              placeholder={discountType === 'PERCENTAGE' ? 'e.g. 10' : 'e.g. 500'}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              required
              min="0"
              className="w-full rounded-lg border border-stone-250 bg-stone-50/50 px-4 py-3 text-xs outline-none focus:border-amber-600 focus:bg-white transition-all font-bold"
            />
          </div>

          {/* Max Discount Amount */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase text-stone-700 tracking-wider">
              Max Discount Cap {discountType === 'FLAT' && '(Not Applicable)'}
            </label>
            <input 
              type="number" 
              placeholder="e.g. 1000"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
              disabled={discountType === 'FLAT'}
              className="w-full rounded-lg border border-stone-250 bg-stone-50/50 px-4 py-3 text-xs outline-none focus:border-amber-600 focus:bg-white transition-all font-bold disabled:opacity-55"
            />
          </div>

          {/* Min Booking Amt */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase text-stone-700 tracking-wider">Min Booking Subtotal</label>
            <input 
              type="number" 
              placeholder="e.g. 2000"
              value={minBookingAmt}
              onChange={(e) => setMinBookingAmt(e.target.value)}
              className="w-full rounded-lg border border-stone-250 bg-stone-50/50 px-4 py-3 text-xs outline-none focus:border-amber-600 focus:bg-white transition-all font-bold"
            />
          </div>

          {/* Usage Limit */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase text-stone-700 tracking-wider">Max Usage Limit</label>
            <input 
              type="number" 
              placeholder="e.g. 100 (Leave blank for unlimited)"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              className="w-full rounded-lg border border-stone-250 bg-stone-50/50 px-4 py-3 text-xs outline-none focus:border-amber-600 focus:bg-white transition-all font-bold"
            />
          </div>
        </div>

        {/* Date Constraint Toggle */}
        <div className="pt-4 border-t border-stone-150 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black uppercase text-stone-700 tracking-wider">Active Date Constraint</h3>
              <p className="text-[10px] text-stone-400 mt-0.5">Toggle to limit this coupon validity during specific dates.</p>
            </div>
            <button
              type="button"
              onClick={() => setUseDateRange(!useDateRange)}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors border border-stone-300 ${useDateRange ? 'bg-amber-600 justify-end' : 'bg-stone-200 justify-start'}`}
            >
              <span className="bg-white w-4.5 h-4.5 rounded-full shadow-md" />
            </button>
          </div>

          {useDateRange && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-50/30 p-4 border border-stone-150 rounded-xl">
              <div>
                <CustomDatePicker
                  selected={validFrom}
                  onChange={(d) => setValidFrom(d)}
                  label="Valid From"
                  allowToday={true}
                />
              </div>
              <div>
                <CustomDatePicker
                  selected={validUntil}
                  onChange={(d) => setValidUntil(d)}
                  label="Valid Until"
                  allowToday={true}
                  minDate={validFrom}
                />
              </div>
            </div>
          )}
        </div>

        {/* Time Restrictions */}
        <div className="pt-4 border-t border-stone-150 space-y-4">
          <h3 className="text-sm font-black text-stone-900" style={{ fontFamily: 'Georgia, serif' }}>Day-of-Week Limitations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Weekend Only */}
            <label className="flex items-center gap-3 p-4 border border-stone-200 rounded-xl bg-stone-50/30 hover:bg-stone-50 cursor-pointer">
              <input
                type="checkbox"
                checked={isWeekendOnly}
                onChange={(e) => {
                  setIsWeekendOnly(e.target.checked);
                  if (e.target.checked) setIsWeekdayOnly(false); // mutually exclusive
                }}
                className="h-4.5 w-4.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer animate-fade-in"
              />
              <div>
                <span className="block text-xs font-bold text-stone-850">Weekend Stays Only</span>
                <span className="block text-[10px] text-stone-400 mt-0.5">Coupon will only apply if reservation check-in date is Saturday or Sunday.</span>
              </div>
            </label>

            {/* Weekday Only */}
            <label className="flex items-center gap-3 p-4 border border-stone-200 rounded-xl bg-stone-50/30 hover:bg-stone-50 cursor-pointer">
              <input
                type="checkbox"
                checked={isWeekdayOnly}
                onChange={(e) => {
                  setIsWeekdayOnly(e.target.checked);
                  if (e.target.checked) setIsWeekendOnly(false); // mutually exclusive
                }}
                className="h-4.5 w-4.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <div>
                <span className="block text-xs font-bold text-stone-850">Weekday Stays Only</span>
                <span className="block text-[10px] text-stone-400 mt-0.5">Coupon will only apply if reservation check-in date is Monday to Friday.</span>
              </div>
            </label>
          </div>
        </div>

        {/* Room Applicability */}
        <div className="pt-4 border-t border-stone-150 space-y-4">
          <h3 className="text-sm font-black text-stone-900" style={{ fontFamily: 'Georgia, serif' }}>Room Category Applicability</h3>
          
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-stone-700">
              <input 
                type="radio" 
                name="targetType" 
                checked={targetType === 'ALL'} 
                onChange={() => setTargetType('ALL')}
                className="h-4 w-4 text-amber-600 focus:ring-amber-500" 
              />
              All Rooms
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-stone-700">
              <input 
                type="radio" 
                name="targetType" 
                checked={targetType === 'SPECIFIC'} 
                onChange={() => setTargetType('SPECIFIC')}
                className="h-4 w-4 text-amber-600 focus:ring-amber-500" 
              />
              Specific Room Categories
            </label>
          </div>

          {targetType === 'SPECIFIC' && (
            <div className="bg-stone-50 rounded-xl border border-stone-200 p-4">
              {isLoadingRooms ? (
                <div className="text-center py-4">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin inline-block" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rooms.map((room) => (
                    <label key={room.id} className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-stone-150 hover:bg-stone-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRoomIds.includes(room.id)}
                        onChange={() => handleRoomCheckbox(room.id)}
                        className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-stone-700">{room.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Active Toggle */}
        <div className="pt-4 border-t border-stone-150 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase text-stone-700 tracking-wider">Is Active</h3>
            <p className="text-[10px] text-stone-400 mt-0.5">Toggle whether this coupon is currently discoverable and redeemable.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors border border-stone-300 ${isActive ? 'bg-amber-600 justify-end' : 'bg-stone-200 justify-start'}`}
          >
            <span className="bg-white w-4.5 h-4.5 rounded-full shadow-md" />
          </button>
        </div>

        {/* Buttons */}
        <div className="pt-6 border-t border-stone-150 flex items-center justify-end gap-3">
          <Link
            href="/admin/coupons"
            className="px-5 py-3 text-xs font-bold text-stone-600 hover:text-stone-900 border border-stone-200 rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-xs font-bold px-6 py-3.5 rounded-xl transition-colors cursor-pointer shadow-md hover:shadow-amber-600/20"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? 'Saving...' : 'Save Coupon'}
          </button>
        </div>
      </form>
    </div>
  );
}
