'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bed, Calendar, Phone, CheckCircle, Clock, XCircle, ArrowRight, ShieldCheck, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import OTPModal from '@/components/OTPModal';

interface MyBooking {
  publicId: string;
  checkInDate: string;
  checkOutDate: string;
  guestName: string;
  totalAmount: number;
  status: string;
  roomType: { name: string; coverImageUrl: string | null };
}

export default function MyBookings() {
  const router = useRouter();
  
  // Auth state
  const [phone, setPhone] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [error, setError] = useState('');

  // Bookings list state
  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [fetchingBookings, setFetchingBookings] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/v1/auth/admin/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            router.push('/admin');
            return;
          }
        }
      } catch {}
      
      // Check regular user session via cookie API
      try {
        const userRes = await fetch('/api/v1/auth/me');
        if (userRes.ok) {
          const data = await userRes.json();
          if (data.authenticated && data.user) {
            setPhone(data.user.phone);
            setIsLoggedIn(true);
            localStorage.setItem('punnami_user_phone', data.user.phone);
            return;
          }
        }
      } catch {}

      // Check if phone number is saved locally
      const savedPhone = localStorage.getItem('punnami_user_phone');
      if (savedPhone) {
        setPhone(savedPhone);
        setIsLoggedIn(true);
      }
    };
    checkSession();
  }, [router]);

  const fetchBookings = async () => {
    setFetchingBookings(true);
    try {
      const res = await fetch('/api/v1/bookings/my-bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      } else {
        localStorage.removeItem('punnami_user_phone');
        setIsLoggedIn(false);
      }
    } catch {
      // ignore
    } finally {
      setFetchingBookings(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchBookings();
    }
  }, [isLoggedIn]);

  const handleRequestOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, '').length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setError('');
    setShowOTP(true);
  };

  const handleOTPSuccess = () => {
    localStorage.setItem('punnami_user_phone', phone);
    setIsLoggedIn(true);
    setShowOTP(false);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('punnami_user_phone');
    setIsLoggedIn(false);
    setBookings([]);
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Premium Hero Header */}
        <div className="bg-stone-900 absolute top-0 left-0 right-0 h-[400px] z-0 overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-600 via-stone-900 to-stone-900"></div>
        </div>
        
        <div className="relative z-10 text-center pt-8 pb-12">
          <div className="w-16 h-16 bg-stone-800/80 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-stone-700/50">
            <Ticket className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            My Bookings
          </h1>
          <div className="w-24 h-1 bg-amber-600 mx-auto rounded-full mb-6"></div>
          <p className="text-stone-300 max-w-2xl mx-auto text-lg">
            Manage and access your luxurious room bookings using your registered phone number.
          </p>
        </div>

        {/* Auth Gate: Request Phone & OTP Verification */}
        {!isLoggedIn ? (
          <div className="relative z-10 max-w-md mx-auto bg-white/95 backdrop-blur-xl border border-stone-200/50 rounded-[2rem] p-8 md:p-10 shadow-2xl">
            <h2 className="text-2xl font-bold text-stone-900 mb-2 text-center" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              Verify Phone Number
            </h2>
            <p className="text-sm text-stone-500 mb-8 text-center leading-relaxed">
              We will send a one-time passcode to retrieve your secure tickets.
            </p>

            <form onSubmit={handleRequestOTP} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">Registered Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9154206957"
                    className="w-full pl-11 pr-4 py-3.5 border-2 border-stone-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 font-bold transition-all"
                  />
                </div>
                {error && <p className="text-xs text-red-500 font-semibold mt-2">{error}</p>}
              </div>

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Request OTP Passcode</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        ) : (
          /* Bookings Dashboard list */
          <div className="relative z-10 bg-white/95 backdrop-blur-xl border border-stone-200/50 rounded-[2.5rem] p-8 md:p-12 shadow-2xl space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200 pb-6 gap-4">
              <div>
                <h3 className="text-2xl font-bold text-stone-900 mb-1" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>Registered Bookings Log</h3>
                <p className="text-sm text-stone-500 flex items-center gap-1.5 font-medium"><Phone className="h-3.5 w-3.5" /> {phone}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
              >
                Sign Out / Switch Phone
              </button>
            </div>

            {fetchingBookings ? (
              <div className="py-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <Bed className="h-10 w-10 mx-auto mb-3 text-stone-300 animate-pulse" />
                <p className="font-bold">No bookings found</p>
                <p className="text-xs mt-1">You haven't booked any rooms under this phone number yet.</p>
                <button
                  onClick={() => router.push('/rooms')}
                  className="mt-4 bg-stone-900 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Browse Stays
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {bookings.map((booking) => (
                  <div
                    key={booking.publicId}
                    className="relative bg-white rounded-3xl p-6 shadow-sm border border-stone-200 hover:border-amber-400 hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 overflow-hidden group"
                  >
                    {/* Ticket notch effect */}
                    <div className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-6 bg-stone-50 rounded-full border-r border-stone-200 group-hover:border-amber-400 transition-colors hidden sm:block"></div>
                    <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 bg-stone-50 rounded-full border-l border-stone-200 group-hover:border-amber-400 transition-colors hidden sm:block"></div>
                    
                    <div className="flex items-center gap-5 z-10 w-full sm:w-auto">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 shadow-md">
                        {booking.roomType.coverImageUrl ? (
                          <img src={booking.roomType.coverImageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                            <Bed className="h-8 w-8 text-stone-300" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-stone-900 mb-2 leading-tight" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>{booking.roomType.name}</h4>
                        <div className="flex flex-col gap-1 text-sm text-stone-500 font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-amber-600" />
                            <span>
                              {format(new Date(booking.checkInDate), 'dd MMM yyyy')} <span className="mx-1 text-stone-300">→</span> {format(new Date(booking.checkOutDate), 'dd MMM yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t border-dashed sm:border-0 border-stone-200 pt-5 sm:pt-0 z-10 sm:pl-6 sm:border-l">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-0.5">Total Amount</p>
                        <span className="font-black text-stone-900 text-2xl">₹{booking.totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                      
                      <div className="flex flex-col items-end gap-3 mt-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border ${
                          booking.status === 'CONFIRMED'
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : booking.status === 'PENDING_CONFIRMATION'
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                          {booking.status === 'CONFIRMED' ? (
                            <><CheckCircle className="h-3.5 w-3.5" /> Confirmed</>
                          ) : booking.status === 'PENDING_CONFIRMATION' ? (
                            <><Clock className="h-3.5 w-3.5 animate-spin" /> Verifying</>
                          ) : (
                            <><XCircle className="h-3.5 w-3.5" /> Rejected</>
                          )}
                        </span>
                        
                        <button
                          onClick={() => router.push(`/booking/${booking.publicId}`)}
                          className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors cursor-pointer group/btn"
                        >
                          View Ticket <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Verification OTP Modal */}
      {showOTP && (
        <OTPModal
          phone={phone}
          onSuccess={handleOTPSuccess}
          onClose={() => setShowOTP(false)}
        />
      )}
    </div>
  );
}
