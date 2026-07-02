'use client';

import React from 'react';
import { Ticket, Calendar, Phone, Mail, User, ShieldCheck, MapPin, Printer, ArrowLeft, Home, Sparkles } from 'lucide-react';
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
      {/* Navigation actions - Hidden during print */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <button
          onClick={() => router.push('/my-bookings')}
          className="flex items-center gap-2 text-stone-600 hover:text-stone-900 font-bold text-sm bg-white px-4 py-2.5 rounded-xl border border-stone-200 shadow-sm transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>My Bookings</span>
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900 font-bold text-sm bg-white px-4 py-2.5 rounded-xl border border-stone-200 shadow-sm transition-all"
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
      <div className="max-w-4xl mx-auto bg-white border border-stone-200 rounded-3xl shadow-xl overflow-hidden print:border-0 print:shadow-none print:rounded-none">
        
        {/* Decorative Golden Ribbon */}
        <div className="h-2 bg-gradient-to-r from-amber-400 via-amber-600 to-amber-700 w-full" />

        {/* Voucher Header */}
        <div className="p-8 border-b border-stone-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-stone-50/50">
          <div>
            <div className="flex items-center gap-2 text-amber-700 font-black tracking-widest text-xs uppercase mb-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-600 fill-amber-600" />
              <span>Luxury Stay Accommodation</span>
            </div>
            <h1 className="text-3xl font-black text-stone-900 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
              {booking.roomType.hotel.name}
            </h1>
            <p className="text-stone-500 text-xs mt-1 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-stone-400" />
              {booking.roomType.hotel.address}
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Voucher Status</span>
            <span className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5" /> Confirmed
            </span>
          </div>
        </div>

        {/* Ticket Grid info */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-stone-150 text-center">
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
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-600/10 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 mb-0.5">Check-In Date</p>
              <h4 className="font-black text-stone-800 text-lg leading-tight">{checkInDateFormatted}</h4>
              <p className="text-stone-500 text-xs mt-1 font-semibold">Standard Check-In Time: {booking.roomType.hotel.checkInTime || '12:00 PM'}</p>
            </div>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-600/10 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
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
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-stone-400 border-b border-stone-150 pb-2">Guest & Stay Information</h3>
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

          {/* Pricing & Ledger - Crucially keeping Travel Agent Commission Hidden */}
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-stone-400 border-b border-stone-150 pb-2">Voucher Financial Summary</h3>
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

              <div className="border-t border-stone-150 pt-3 flex justify-between items-center">
                <span className="font-extrabold text-stone-900 text-sm">Paid Total Amount</span>
                <span className="font-black text-amber-700 text-xl">{formatCurrency(booking.totalAmount)}</span>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center mt-4">
                <p className="text-[10px] text-green-700 font-black uppercase tracking-wider">Payment Status: PAID IN FULL</p>
                <p className="text-[9px] text-green-600 mt-0.5">Verified manually via Punnami Administrator Accounts desk.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stay Guidelines / Policies */}
        <div className="p-8 bg-stone-50/50">
          <h3 className="text-xs font-black uppercase tracking-widest text-stone-400 border-b border-stone-150 pb-2 mb-4">Check-in Guidelines & Policies</h3>
          <ul className="space-y-2.5 text-xs text-stone-600 leading-relaxed list-disc pl-4 font-semibold">
            <li><strong>Photo Identification:</strong> A valid physical photo ID (Aadhar Card, Passport, Driving License or Voter ID) must be presented by all adult guests at the time of check-in.</li>
            <li><strong>Occupancy Limits:</strong> Check-in is capped based on the standard capacity of the room (max {booking.roomType.maxAdults} adults and {booking.roomType.maxChildren} children per room category).</li>
            <li><strong>Check-in & Check-out:</strong> Standard Check-In is at 12:00 PM. Check-Out is at 11:00 AM. Early check-in or late check-out is subject to availability and may incur custom hotel charges.</li>
            <li><strong>Boarding Ticket Voucher:</strong> Please carry a digital copy or printed slip of this hotel ticket voucher to present to check-in reception staff.</li>
          </ul>
        </div>

        {/* Voucher Footer */}
        <div className="bg-stone-900 text-stone-400 p-6 text-center text-xs border-t border-stone-800">
          <p className="font-bold text-stone-300">Thank you for choosing Punnami Southern Residency Bhadrachalam</p>
          <p className="text-[10px] mt-1">For support, call us or email support@punnamihotels.com. This is an officially generated digital hotel voucher.</p>
        </div>

      </div>
    </div>
  );
}
