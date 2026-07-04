'use client';

import React from 'react';
import { Ticket, Calendar, Phone, Mail, User, ShieldCheck, MapPin, Printer, ArrowLeft, Home, Sparkles, Users } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface BookingVoucherProps {
  booking: {
    publicId: string;
    checkInDate: string;
    checkOutDate: string;
    totalNights: number;
    roomsBooked: number;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    adultCount: number;
    childCount: number;
    subtotalAmount: number;
    discountAmount: number;
    gstAmount: number;
    totalAmount: number;
    status: string;
    createdAt: string;
    transactionId?: string | null;
    passengers?: {
      fullName: string;
      age: number;
      gender: string;
      aadhaar?: string;
      phone?: string;
      isPrimary?: boolean;
    }[];
    roomType: {
      name: string;
      capacityPerRoom: number;
      maxAdults: number;
      maxChildren: number;
      hotel: {
        name: string;
        address: string | null;
        checkInTime: string | null;
        checkOutTime: string | null;
      };
    };
  };
}

export default function BookingVoucher({ booking }: BookingVoucherProps) {
  const router = useRouter();

  const handlePrint = () => {
    window.print();
  };

  const checkInDateFormatted = format(new Date(booking.checkInDate), 'dd MMMM yyyy');
  const checkOutDateFormatted = format(new Date(booking.checkOutDate), 'dd MMMM yyyy');
  const bookingDateFormatted = format(new Date(booking.createdAt), 'dd MMM yyyy, hh:mm a');

  return (
    <div className="min-h-screen bg-stone-100 py-8 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white">
      
      {/* Dynamic CSS styles to ensure pixel-perfect background colors and grid rendering on printed sheets */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:bg-white {
            background-color: #ffffff !important;
          }
          .print\\:border-stone-200 {
            border-color: #e7e5e4 !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
            filter: none !important;
          }
          .print\\:rounded-2xl {
            border-radius: 1rem !important;
          }
          .print\\:rounded-3xl {
            border-radius: 1.5rem !important;
          }
          .print-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}} />

      {/* Navigation actions - Hidden during print */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <button
          onClick={() => router.push('/my-bookings')}
          className="flex items-center gap-2 text-stone-600 hover:text-stone-900 font-bold text-sm bg-white px-4 py-2.5 rounded-xl border border-stone-200 shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>My Bookings</span>
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900 font-bold text-sm bg-white px-4 py-2.5 rounded-xl border border-stone-200 shadow-sm transition-all cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Main Voucher Container */}
      <div className="max-w-4xl mx-auto bg-white border border-stone-200 rounded-3xl shadow-xl overflow-hidden print:border print:border-stone-200 print:shadow-none print:rounded-3xl">
        
        {/* Decorative Golden Ribbon */}
        <div className="h-2.5 bg-gradient-to-r from-amber-400 via-amber-600 to-amber-700 w-full" />

        {/* Voucher Header */}
        <div className="p-8 border-b border-stone-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-stone-50/70">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-stone-900 rounded-2xl flex items-center justify-center shrink-0 p-1 border border-stone-200 shadow-inner">
              <img src="/logo.png" alt="PSR Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-amber-700 font-black tracking-widest text-[10px] uppercase mb-0.5">
                <Sparkles className="h-3 w-3 text-amber-600 fill-amber-600" />
                <span>Official Hotel Stay Voucher</span>
              </div>
              <h1 className="text-2xl font-black text-stone-900 tracking-tight leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
                {booking.roomType.hotel.name}
              </h1>
              <p className="text-stone-500 text-xs mt-1.5 flex items-center gap-1 font-medium">
                <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span>{booking.roomType.hotel.address}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0 self-stretch sm:self-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-stone-150">
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Voucher Status</span>
            <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-3.5 py-1.5 text-xs font-black uppercase tracking-wider shadow-sm">
              <ShieldCheck className="h-4 w-4 fill-emerald-100" /> Confirmed
            </span>
          </div>
        </div>

        {/* Ticket Grid info */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-stone-150 text-center bg-stone-50/20">
          <div className="p-5 border-r border-stone-150">
            <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 mb-1">Booking Reference</p>
            <p className="font-extrabold text-stone-850 text-sm tracking-wide">{booking.publicId}</p>
          </div>
          <div className="p-5 border-r border-stone-150">
            <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 mb-1">Booking Date</p>
            <p className="font-semibold text-stone-750 text-xs">{bookingDateFormatted}</p>
          </div>
          <div className="p-5 border-r border-stone-150">
            <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 mb-1">Rooms Booked</p>
            <p className="font-extrabold text-stone-850 text-sm">{booking.roomsBooked} Category Room{booking.roomsBooked > 1 ? 's' : ''}</p>
          </div>
          <div className="p-5">
            <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 mb-1">Duration of Stay</p>
            <p className="font-extrabold text-stone-850 text-sm">{booking.totalNights} Night{booking.totalNights > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Check-In & Check-Out Card */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-stone-150">
          <div className="bg-stone-50/50 border border-stone-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-600/10 text-amber-700 rounded-xl flex items-center justify-center shrink-0 print:border print:border-amber-100">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 mb-0.5">Check-In Date</p>
              <h4 className="font-black text-stone-800 text-lg leading-tight">{checkInDateFormatted}</h4>
              <p className="text-stone-500 text-xs mt-1 font-semibold">Standard Check-In Time: {booking.roomType.hotel.checkInTime || '12:00 PM'}</p>
            </div>
          </div>

          <div className="bg-stone-50/50 border border-stone-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-600/10 text-amber-700 rounded-xl flex items-center justify-center shrink-0 print:border print:border-amber-100">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 mb-0.5">Check-Out Date</p>
              <h4 className="font-black text-stone-800 text-lg leading-tight">{checkOutDateFormatted}</h4>
              <p className="text-stone-500 text-xs mt-1 font-semibold">Standard Check-Out Time: {booking.roomType.hotel.checkOutTime || '11:00 AM'}</p>
            </div>
          </div>
        </div>

        {/* Main Details Section */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-stone-150">
          {/* Guest and Stay Profile */}
          <div className="space-y-6 print-card">
            <h3 className="text-xs font-black uppercase tracking-widest text-stone-450 border-b border-stone-150 pb-2 flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-stone-450" />
              <span>Guest & Stay Information</span>
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-stone-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-stone-400 uppercase font-black">Lead Passenger</p>
                  <p className="text-sm font-bold text-stone-800">{booking.guestName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-stone-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-stone-400 uppercase font-black">Registered Contact</p>
                  <p className="text-sm font-bold text-stone-800">{booking.guestPhone}</p>
                </div>
              </div>
              {booking.guestEmail && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-stone-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-stone-400 uppercase font-black">Email Address</p>
                    <p className="text-sm font-bold text-stone-800">{booking.guestEmail}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Ticket className="h-4 w-4 text-stone-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-stone-400 uppercase font-black">Selected Category</p>
                  <p className="text-sm font-bold text-stone-800">{booking.roomType.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Ledger */}
          <div className="space-y-6 print-card">
            <h3 className="text-xs font-black uppercase tracking-widest text-stone-450 border-b border-stone-150 pb-2">Voucher Financial Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500 font-semibold">Room Tariff Base Total</span>
                <span className="text-stone-800 font-bold">{formatCurrency(booking.subtotalAmount)}</span>
              </div>
              
              {Number(booking.discountAmount) > 0 && (
                <div className="flex justify-between text-sm text-green-700 font-bold">
                  <span>Special Discount Applied</span>
                  <span>-{formatCurrency(booking.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-stone-500 font-semibold">GST Taxes & Fees</span>
                <span className="text-stone-800 font-bold">{formatCurrency(booking.gstAmount)}</span>
              </div>

              <div className="border-t border-stone-200 pt-3 flex justify-between items-center">
                <span className="font-extrabold text-stone-900 text-sm">Paid Total Amount</span>
                <span className="font-black text-amber-700 text-xl">{formatCurrency(booking.totalAmount)}</span>
              </div>

              {booking.transactionId && (
                <div className="flex justify-between text-[11px] pt-1">
                  <span className="text-stone-400 font-bold uppercase tracking-wider">Transaction ID</span>
                  <span className="text-stone-750 font-mono font-bold">{booking.transactionId}</span>
                </div>
              )}

              <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 text-center mt-4">
                <p className="text-[10px] text-emerald-700 font-black uppercase tracking-wider">Payment Status: PAID IN FULL</p>
                <p className="text-[9px] text-emerald-600 mt-0.5 font-medium">Verified manually via Punnami Administrator Accounts desk.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Passenger Manifest Table */}
        {booking.passengers && booking.passengers.length > 0 && (
          <div className="p-8 border-b border-stone-150 print-card">
            <h3 className="text-xs font-black uppercase tracking-widest text-stone-450 border-b border-stone-150 pb-2 mb-4 flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-stone-450" />
              <span>Verified Guest Details</span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-stone-200 bg-stone-50/30">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-200 font-extrabold text-stone-750">
                    <th className="p-3">Sr. No.</th>
                    <th className="p-3">Guest Name</th>
                    <th className="p-3 text-center">Age</th>
                    <th className="p-3">Gender</th>
                    <th className="p-3">Aadhaar (Masked)</th>
                    <th className="p-3">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-150">
                  {booking.passengers.map((p, idx) => {
                    const isChild = idx >= booking.adultCount;
                    let maskedAadhaar = 'N/A';
                    if (p.aadhaar && p.aadhaar.trim().length === 12) {
                      maskedAadhaar = `XXXX-XXXX-${p.aadhaar.slice(-4)}`;
                    } else if (isChild) {
                      maskedAadhaar = 'Not Required';
                    }
                    return (
                      <tr key={idx} className="font-semibold text-stone-750 hover:bg-stone-50/50">
                        <td className="p-3 font-bold text-stone-400">{idx + 1}</td>
                        <td className="p-3 text-stone-900 font-bold">
                          {p.fullName}
                          {idx === 0 && (
                            <span className="ml-1.5 rounded bg-amber-100 px-1 py-0.5 text-[9px] text-amber-700 uppercase font-bold">Lead</span>
                          )}
                        </td>
                        <td className="p-3 text-center">{p.age} Yrs</td>
                        <td className="p-3 capitalize">{p.gender?.toLowerCase() || 'N/A'}</td>
                        <td className="p-3 font-mono text-stone-600">{maskedAadhaar}</td>
                        <td className="p-3 text-stone-600">{p.phone || (idx === 0 ? booking.guestPhone : '—')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Boarding Pass Tear-off Line */}
        <div className="relative my-2 print:my-4 print-card">
          <div className="absolute left-0 right-0 border-t-2 border-dashed border-stone-300 top-1/2 -translate-y-1/2" />
          <div className="relative flex justify-between px-8">
            <div className="w-6 h-6 bg-stone-100 rounded-full border border-stone-200 -ml-11 print:bg-white print:border-none" />
            <span className="bg-white px-4 text-[10px] font-bold text-stone-400 tracking-widest uppercase relative z-10 print:hidden">Terms & Guidelines Stub</span>
            <div className="w-6 h-6 bg-stone-100 rounded-full border border-stone-200 -mr-11 print:bg-white print:border-none" />
          </div>
        </div>

        {/* Stay Guidelines / Policies */}
        <div className="p-8 bg-stone-50/50 print-card">
          <h3 className="text-xs font-black uppercase tracking-widest text-stone-450 border-b border-stone-150 pb-2 mb-4">Check-in Guidelines & Policies</h3>
          <ul className="space-y-3 text-xs text-stone-600 leading-relaxed list-disc pl-4 font-medium">
            <li><strong>Photo Identification:</strong> A valid physical photo ID (Aadhar Card, Passport, Driving License or Voter ID) must be presented by all adult guests at the time of check-in.</li>
            <li><strong>Occupancy Limits:</strong> Check-in is capped based on the standard capacity of the room (max {booking.roomType.maxAdults} adults and {booking.roomType.maxChildren} children per room category).</li>
            <li><strong>Check-in & Check-out:</strong> Standard Check-In is at 12:00 PM. Check-Out is at 11:00 AM. Early check-in or late check-out is subject to availability and may incur custom hotel charges.</li>
            <li><strong>Boarding Ticket Voucher:</strong> Please carry a digital copy or printed slip of this hotel ticket voucher to present to check-in reception staff.</li>
          </ul>
        </div>

        {/* Voucher Footer */}
        <div className="bg-stone-900 text-stone-400 p-6 text-center text-xs border-t border-stone-800 print-card">
          <p className="font-bold text-stone-300">Thank you for choosing Punnami Southern Residency Bhadrachalam</p>
          <p className="text-[10px] mt-1 text-stone-500">For support, call us or email support@punnamihotels.com. This is an officially generated digital hotel voucher.</p>
        </div>

      </div>
    </div>
  );
}
