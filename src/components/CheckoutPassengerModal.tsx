'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Users, AlertTriangle, Zap, Check } from 'lucide-react';
import CustomSelect from './CustomSelect';

// ─── Verhoeff Checksum (client-side Aadhaar validation) ──────────────────────
const _d = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];
const _p = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

function isValidAadhaar(num: string): boolean {
  if (!num || num.length !== 12 || !/^\d{12}$/.test(num)) return false;
  if (num[0] === '0' || num[0] === '1') return false;
  let c = 0;
  const digits = num.split('').map(Number).reverse();
  for (let i = 0; i < digits.length; i++) {
    c = _d[c][_p[i % 8][digits[i]]];
  }
  return c === 0;
}

export interface PassengerInput {
  fullName: string;
  age: number | '';
  gender: 'MALE' | 'FEMALE' | 'OTHER' | '';
  phone: string;
  aadhaar: string;
  isPrimary: boolean;
}

interface CheckoutPassengerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    passengers: PassengerInput[],
    quickBooking: boolean,
    paymentPercentage: number,
    leadName: string,
    leadPhone: string,
    leadEmail: string
  ) => Promise<void>;
  adults: number;
  children: number;
  isProcessing: boolean;
  guestName?: string;
  guestPhone?: string;
  totalAmount?: number;
  isAdmin?: boolean;
}

export default function CheckoutPassengerModal({
  isOpen,
  onClose,
  onSubmit,
  adults,
  children: childrenCount,
  isProcessing,
  guestName = '',
  guestPhone = '',
  totalAmount,
  isAdmin = false,
}: CheckoutPassengerModalProps) {
  const totalGuests = adults + childrenCount;

  const [leadName, setLeadName] = useState(guestName);
  const [leadPhone, setLeadPhone] = useState(guestPhone);
  const [leadEmail, setLeadEmail] = useState('');

  const [passengers, setPassengers] = useState<PassengerInput[]>([]);
  const [passengerMode, setPassengerMode] = useState<'full' | 'quick'>('full');
  const [paymentOption, setPaymentOption] = useState<'FULL' | 'CUSTOM'>('FULL');
  const [quickPassenger, setQuickPassenger] = useState<PassengerInput>({
    fullName: '',
    age: '',
    gender: 'MALE',
    phone: '',
    aadhaar: '',
    isPrimary: true,
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToConsent, setAgreedToConsent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLeadName(guestName);
      setLeadPhone(guestPhone);
      setLeadEmail('');
      // Set initial guest passenger entries empty (no auto-prefill)
      const initial: PassengerInput[] = Array.from({ length: totalGuests }).map((_, i) => ({
        fullName: '',
        age: '',
        gender: 'MALE',
        phone: '',
        aadhaar: '',
        isPrimary: i === 0,
      }));
      setPassengers(initial);
      setPassengerMode('full');
      setQuickPassenger({
        fullName: '',
        age: '',
        gender: 'MALE',
        phone: '',
        aadhaar: '',
        isPrimary: true,
      });
      setAgreedToTerms(false);
      setAgreedToConsent(false);
      if (totalAmount !== undefined) {
        setPaymentOption('FULL');
      }
    }
  }, [isOpen, totalGuests, totalAmount, guestName, guestPhone]);

  if (!isOpen) return null;

  const handleChange = (index: number, field: keyof PassengerInput, value: any) => {
    const newPassengers = [...passengers];
    newPassengers[index] = { ...newPassengers[index], [field]: value };
    setPassengers(newPassengers);
  };

  const advanceAmount = totalAmount ? Math.round(totalAmount * 0.5) : 0;
  const finalPercentage = paymentOption === 'FULL' ? 100 : 50;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms || !agreedToConsent) return;
    if (!leadName.trim() || !leadPhone.trim()) return;

    if (passengerMode === 'quick') {
      const payload: PassengerInput[] = [
        {
          fullName: leadName,
          age: quickPassenger.age || 25,
          gender: quickPassenger.gender || 'MALE',
          phone: leadPhone,
          aadhaar: quickPassenger.aadhaar || '',
          isPrimary: true,
        }
      ];
      // Generate placeholders for other guests
      for (let i = 1; i < adults; i++) {
        payload.push({
          fullName: `Guest Adult ${i + 1}`,
          age: 25,
          gender: 'MALE',
          phone: '',
          aadhaar: '',
          isPrimary: false,
        });
      }
      for (let i = 0; i < childrenCount; i++) {
        payload.push({
          fullName: `Guest Child ${i + 1}`,
          age: 6,
          gender: 'MALE',
          phone: '',
          aadhaar: '',
          isPrimary: false,
        });
      }
      await onSubmit(payload, true, finalPercentage, leadName, leadPhone, leadEmail);
    } else {
      const updatedPassengers = [...passengers];
      if (updatedPassengers[0]) {
        updatedPassengers[0].fullName = leadName;
        updatedPassengers[0].phone = leadPhone;
      }
      await onSubmit(updatedPassengers, false, finalPercentage, leadName, leadPhone, leadEmail);
    }
  };

  // Check if form is valid to proceed
  const isFormValid = () => {
    if (!agreedToTerms || !agreedToConsent) return false;
    if (!leadName.trim()) return false;
    if (!/^\d{10}$/.test(leadPhone.trim())) return false;
    if (leadEmail.trim().length > 0 && !leadEmail.includes('@')) return false;

    if (passengerMode === 'quick') {
      const ageOk = typeof quickPassenger.age === 'number' && quickPassenger.age >= 11;
      const genderOk = quickPassenger.gender !== '';
      const aadhaarOk = quickPassenger.aadhaar.length === 12 && isValidAadhaar(quickPassenger.aadhaar);
      return ageOk && genderOk && aadhaarOk;
    } else {
      return passengers.every((p, i) => {
        const isChild = i >= adults;
        // The first passenger name and phone are synced to leadName and leadPhone, so they are always ok
        const nameOk = i === 0 ? true : p.fullName.trim() !== '';
        
        // Age validation
        let ageOk = false;
        if (typeof p.age === 'number') {
          ageOk = isChild ? p.age <= 10 && p.age >= 0 : p.age >= 11;
        }

        const genderOk = p.gender !== '';

        // Aadhaar validation: Mandatory for adults (>=11), optional for children (<=10)
        let aadhaarOk = true;
        if (!isChild) {
          aadhaarOk = p.aadhaar.length === 12 && isValidAadhaar(p.aadhaar);
        } else if (p.aadhaar.trim().length > 0) {
          aadhaarOk = p.aadhaar.length === 12 && isValidAadhaar(p.aadhaar);
        }

        // Phone validation: Mandatory for primary contact (index 0)
        let phoneOk = true;
        if (i > 0 && p.phone.trim().length > 0) {
          phoneOk = /^\d{10}$/.test(p.phone.trim());
        }

        return nameOk && ageOk && genderOk && aadhaarOk && phoneOk;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-stone-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-700 border border-amber-250">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-stone-900" style={{ fontFamily: 'Georgia, serif' }}>Guest Details Verification</h2>
              <p className="text-xs font-semibold text-stone-500">Provide details for {totalGuests} guest(s).</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-full p-2 text-stone-400 hover:bg-stone-200 hover:text-stone-600 transition disabled:opacity-50 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 scrollbar-thin">
          
          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-xl">
            <button
              type="button"
              onClick={() => setPassengerMode('full')}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                passengerMode === 'full'
                  ? 'bg-white text-amber-700 shadow-sm border border-stone-200/50'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Full Guest Manifest</span>
            </button>
            <button
              type="button"
              onClick={() => setPassengerMode('quick')}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                passengerMode === 'quick'
                  ? 'bg-white text-amber-700 shadow-sm border border-stone-200/50'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Zap className="h-4 w-4" />
              <span>Quick Booking</span>
            </button>
          </div>

          <form id="passenger-form" onSubmit={handleFormSubmit} className="space-y-6">
            {passengerMode === 'quick' ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-2 items-start">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-amber-700 leading-relaxed">
                    Quick Booking Mode: Provide details for the <strong>lead adult guest</strong>. Other stays will be generated under generic guest placeholders.
                  </p>
                </div>

                <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-5 space-y-4">
                  <p className="text-xs font-black text-amber-700 uppercase tracking-wider flex items-center gap-2">
                    <span>Primary Guest Details</span>
                    <span className="rounded bg-amber-600 px-1.5 py-0.5 text-[9px] text-white font-black uppercase">Lead</span>
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-bold text-stone-600">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm font-semibold text-stone-855 outline-none focus:border-amber-500 text-stone-850"
                        placeholder="Full Name"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-600">Contact Phone *</label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={leadPhone}
                        onChange={(e) => setLeadPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm font-semibold text-stone-855 outline-none focus:border-amber-500 text-stone-850"
                        placeholder="10 digit phone number"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-600">Email Address <span className="text-[10px] text-stone-400 font-bold uppercase">(Optional)</span></label>
                      <input
                        type="email"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm font-semibold text-stone-855 outline-none focus:border-amber-500 text-stone-850"
                        placeholder="Optional (for confirmation email)"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-600">Age *</label>
                      <input
                        type="number"
                        required
                        min={11}
                        max={120}
                        disabled={isProcessing}
                        value={quickPassenger.age}
                        onChange={(e) => setQuickPassenger(prev => ({ ...prev, age: e.target.value === '' ? '' : parseInt(e.target.value) }))}
                        className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm font-semibold text-stone-855 outline-none focus:border-amber-500"
                        placeholder="Min 11"
                      />
                    </div>

                    <div className="space-y-1">
                      <CustomSelect
                        label="Gender *"
                        value={quickPassenger.gender}
                        onChange={(val) => setQuickPassenger(prev => ({ ...prev, gender: val }))}
                        options={[
                          { value: 'MALE', label: 'Male' },
                          { value: 'FEMALE', label: 'Female' },
                          { value: 'OTHER', label: 'Other' },
                        ]}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-600">Aadhaar Number *</label>
                      <input
                        type="text"
                        required
                        pattern="[0-9]{12}"
                        title="12 digit Aadhaar number"
                        value={quickPassenger.aadhaar}
                        onChange={(e) => setQuickPassenger(prev => ({ ...prev, aadhaar: e.target.value.replace(/\D/g, '').slice(0, 12) }))}
                        className={`w-full rounded-lg border px-3 py-2.5 text-sm font-semibold text-stone-855 outline-none focus:border-amber-500 ${
                          quickPassenger.aadhaar.length === 12 && !isValidAadhaar(quickPassenger.aadhaar)
                            ? 'border-red-400 bg-red-50'
                            : 'border-stone-300'
                        }`}
                        placeholder="12 digit number"
                      />
                      {quickPassenger.aadhaar.length === 12 && !isValidAadhaar(quickPassenger.aadhaar) && (
                        <p className="text-[10px] font-bold text-red-600 mt-1">Checksum validation failed</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {passengers.map((p, idx) => {
                  const isChild = idx >= adults;
                  return (
                    <div key={idx} className="rounded-xl border border-stone-250 bg-white p-5 space-y-4 hover:border-amber-500/30 transition-all shadow-sm">
                      <p className="text-xs font-black text-amber-700 uppercase tracking-wider flex items-center justify-between">
                        <span>{isChild ? `Child ${idx - adults + 1} Details` : `Adult ${idx + 1} Details`}</span>
                        {idx === 0 && <span className="rounded bg-amber-100 border border-amber-200 px-1.5 py-0.5 text-[9px] text-amber-700 font-bold uppercase">Primary Contact</span>}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {idx === 0 ? (
                          <>
                            <div className="space-y-1 sm:col-span-2">
                              <label className="text-xs font-bold text-stone-655">Full Name *</label>
                              <input
                                type="text"
                                required
                                value={leadName}
                                onChange={(e) => setLeadName(e.target.value)}
                                className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm font-semibold outline-none focus:border-amber-500 text-stone-850 border-stone-300"
                                placeholder="Full Name"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-stone-655">Contact Phone *</label>
                              <input
                                type="tel"
                                required
                                maxLength={10}
                                value={leadPhone}
                                onChange={(e) => setLeadPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm font-semibold outline-none focus:border-amber-500 text-stone-850 border-stone-300"
                                placeholder="10 digit phone number"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-bold text-stone-655">Email Address <span className="text-[10px] text-stone-400 font-bold uppercase">(Optional)</span></label>
                              <input
                                type="email"
                                value={leadEmail}
                                onChange={(e) => setLeadEmail(e.target.value)}
                                className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm font-semibold outline-none focus:border-amber-500 text-stone-850 border-stone-300"
                                placeholder="Optional (for confirmation email)"
                              />
                            </div>
                          </>
                        ) : (
                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-xs font-bold text-stone-655">Full Name *</label>
                            <input
                              type="text"
                              required
                              value={p.fullName}
                              onChange={(e) => handleChange(idx, 'fullName', e.target.value)}
                              className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm font-semibold outline-none focus:border-amber-500 text-stone-850 border-stone-300"
                              placeholder="Full Name"
                            />
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-stone-655">{isChild ? 'Age (0 - 10) *' : 'Age (11+) *'}</label>
                          <input
                            type="number"
                            required
                            min={isChild ? 0 : 11}
                            max={isChild ? 10 : 120}
                            value={p.age}
                            onChange={(e) => handleChange(idx, 'age', e.target.value === '' ? '' : parseInt(e.target.value))}
                            className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm font-semibold text-stone-855 outline-none focus:border-amber-500"
                            placeholder="Age"
                          />
                        </div>

                        <div className="space-y-1">
                          <CustomSelect
                            label="Gender *"
                            value={p.gender}
                            onChange={(val) => handleChange(idx, 'gender', val)}
                            options={[
                              { value: 'MALE', label: 'Male' },
                              { value: 'FEMALE', label: 'Female' },
                              { value: 'OTHER', label: 'Other' },
                            ]}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-stone-655 flex items-center gap-1.5">
                            <span>Aadhaar Number</span>
                            {isChild && <span className="text-[10px] text-stone-400 font-bold uppercase">(Optional)</span>}
                          </label>
                          <input
                            type="text"
                            required={!isChild}
                            pattern="[0-9]{12}"
                            title="12 digit Aadhaar number"
                            value={p.aadhaar}
                            onChange={(e) => handleChange(idx, 'aadhaar', e.target.value.replace(/\D/g, '').slice(0, 12))}
                            className={`w-full rounded-lg border px-3 py-2.5 text-sm font-semibold text-stone-850 outline-none focus:border-amber-500 ${
                              p.aadhaar.length === 12 && !isValidAadhaar(p.aadhaar)
                                ? 'border-red-400 bg-red-50'
                                : 'border-stone-300'
                            }`}
                            placeholder="12 digit number"
                          />
                          {p.aadhaar.length === 12 && !isValidAadhaar(p.aadhaar) && (
                            <p className="text-[10px] font-bold text-red-650 mt-1">Checksum validation failed</p>
                          )}
                        </div>

                        {idx > 0 && (
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-655 flex items-center gap-1.5">
                              <span>Contact Phone</span>
                              <span className="text-[10px] text-stone-400 font-bold uppercase">(Optional)</span>
                            </label>
                            <input
                              type="tel"
                              pattern="[0-9]{10}"
                              maxLength={10}
                              value={p.phone}
                              onChange={(e) => handleChange(idx, 'phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                              className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm font-semibold outline-none focus:border-amber-500"
                              placeholder="10 digit phone"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </form>

          {/* Payment Percentage Selector */}
          {totalAmount !== undefined && !isAdmin && (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-4">
              <h4 className="text-xs font-black text-stone-700 uppercase tracking-wider">
                Select Payment Option
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentOption('FULL')}
                  className={`flex items-center justify-between p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    paymentOption === 'FULL'
                      ? 'border-amber-500 bg-amber-50/30'
                      : 'border-stone-200 bg-white hover:border-amber-300'
                  }`}
                >
                  <div>
                    <p className="text-xs font-extrabold text-stone-900">Pay Full Amount (100%)</p>
                    <p className="text-[10px] text-stone-500 mt-0.5">Instant booking confirmation</p>
                  </div>
                  <span className="text-sm font-black text-amber-700">₹{totalAmount.toLocaleString('en-IN')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentOption('CUSTOM')}
                  className={`flex items-center justify-between p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    paymentOption === 'CUSTOM'
                      ? 'border-amber-500 bg-amber-50/30'
                      : 'border-stone-200 bg-white hover:border-amber-300'
                  }`}
                >
                  <div>
                    <p className="text-xs font-extrabold text-stone-900">Pay 50% Advance</p>
                    <p className="text-[10px] text-stone-550 mt-0.5">Pay balance online or at check-in</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-amber-700 block">
                      ₹{advanceAmount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[9px] font-bold text-stone-400">Advance (50%)</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Consents & Checklist */}
          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-amber-850 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" /> Government Mandate Rules
            </h4>
            <ul className="text-xs text-stone-650 space-y-2 list-disc pl-4 font-semibold leading-relaxed">
              <li>Original government photo IDs must be presented during property check-in.</li>
              <li>Aadhaar cards are mandatory for all adult guests (11+).</li>
              <li>Child policy: age limit is strictly capped up to 10 years old. No Aadhaar is required for children.</li>
            </ul>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-2.5 text-xs text-stone-600 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 text-amber-600 focus:ring-amber-500 rounded border-stone-300"
              />
              <span>I confirm that all guest details match official government IDs.</span>
            </label>
            <label className="flex items-start gap-2.5 text-xs text-stone-600 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToConsent}
                onChange={(e) => setAgreedToConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 text-amber-600 focus:ring-amber-500 rounded border-stone-300"
              />
              <span>I give my consent to verify and store these Aadhaar numbers for check-in audits.</span>
            </label>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-stone-100 p-4 bg-stone-50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-xl px-5 py-2.5 text-xs font-bold text-stone-500 hover:bg-stone-200 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            form="passenger-form"
            type="submit"
            disabled={isProcessing || !isFormValid()}
            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black px-6 py-2.5 text-xs transition shadow-md disabled:bg-stone-300 disabled:cursor-not-allowed cursor-pointer"
          >
            {isProcessing ? (
              <span className="flex items-center gap-1"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting...</span>
            ) : isAdmin ? (
              'Confirm Admin Booking'
            ) : (
              'Confirm Guest Details'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
