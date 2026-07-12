'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Ticket, IndianRupee, Calendar, Users, TrendingUp, 
  Briefcase, ChevronRight, Bed, Clock, CheckCircle, XCircle 
} from 'lucide-react';
import InlineLoader from '@/components/InlineLoader';

interface Summary {
  booking_count: number;
  total_earnings: number;
  this_month_earnings: number;
  total_customers: number;
}

export default function AgentDashboardPage() {
  const router = useRouter();
  const [agentName, setAgentName] = useState('Partner');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const profileStr = localStorage.getItem('punnami_agent_profile');
    if (profileStr) {
      const p = JSON.parse(profileStr);
      setAgentName(p.fullName || 'Partner');
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [summaryRes, bookingsRes] = await Promise.all([
          fetch('/api/v1/bookings/agent/dashboard-summary'),
          fetch('/api/v1/bookings/agent/bookings')
        ]);

        if (summaryRes.ok && bookingsRes.ok) {
          const s = await summaryRes.json();
          const b = await bookingsRes.json();
          setSummary(s);
          setBookings(b.slice(0, 3)); // show top 3 recent
        }
      } catch {
        setError('Failed to fetch sales summary analytics.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      {/* Welcome Card Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#07111e] to-[#0d223c] rounded-3xl p-8 md:p-10 shadow-xl text-white">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-8 opacity-5">
          <Briefcase className="w-64 h-64" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-white/10 border border-white/20 uppercase tracking-widest text-teal-400">
            Agent Console Active
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
            {getGreeting()}, {agentName}!
          </h1>
          <p className="text-white/80 text-sm md:text-base leading-relaxed">
            Manage your customer bookings, view your retained commission details, and quickly create new room bookings for stays in Bhadrachalam.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/rooms"
              className="inline-flex items-center justify-center bg-teal-500 hover:bg-teal-600 text-stone-900 font-bold px-5 py-3 rounded-xl text-xs uppercase tracking-wider transition-all hover:-translate-y-0.5 shadow-md shadow-teal-500/10"
            >
              Book Guest Stays
            </Link>
            <Link
              href="/agent/dashboard/bookings"
              className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3 rounded-xl text-xs uppercase tracking-wider transition-all hover:-translate-y-0.5 border border-white/25"
            >
              See Stays Log
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* KPI stats widgets grid */}
      {loading ? (
        <div className="h-32 flex items-center justify-center bg-white border border-stone-200 rounded-3xl shadow-sm">
          <InlineLoader size="sm" label="Loading metrics" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'My Bookings count', value: summary?.booking_count || 0, icon: Ticket, bg: 'bg-blue-50 text-blue-600', desc: 'Total guest tickets' },
            { label: 'Retained Commissions', value: `₹${(summary?.total_earnings || 0).toLocaleString('en-IN')}`, icon: IndianRupee, bg: 'bg-emerald-50 text-emerald-600', desc: 'Retained instantly' },
            { label: 'Commission (This Month)', value: `₹${(summary?.this_month_earnings || 0).toLocaleString('en-IN')}`, icon: Calendar, bg: 'bg-teal-50 text-teal-600', desc: 'Current month' },
            { label: 'Total Passengers', value: summary?.total_customers || 0, icon: Users, bg: 'bg-purple-50 text-purple-600', desc: 'Unique passengers' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className={`w-11 h-11 rounded-xl ${stat.bg.split(' ')[0]} flex items-center justify-center mb-4`}>
                  <stat.icon className={`h-5 w-5 ${stat.bg.split(' ')[1]}`} />
                </div>
                <h4 className="text-stone-400 text-xs font-bold uppercase tracking-wider">{stat.label}</h4>
                <p className="text-2xl font-black text-stone-900 mt-1 leading-none">{stat.value}</p>
              </div>
              <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider mt-3 border-t border-stone-100 pt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-teal-500" /> {stat.desc}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Recent reservations stay log */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <h3 className="font-bold text-stone-900" style={{ fontFamily: 'Georgia, serif' }}>Recent Registrations Log</h3>
            <p className="text-xs text-stone-400 mt-0.5">Quick lookup of the most recent guest room stays booked</p>
          </div>
          <Link href="/agent/dashboard/bookings" className="text-xs font-bold text-teal-600 hover:underline flex items-center">
            See all bookings <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center"><InlineLoader size="sm" /></div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            <Bed className="h-10 w-10 mx-auto mb-2 text-stone-300 animate-pulse" />
            <p className="font-bold text-sm">No stayed guest entries found</p>
            <p className="text-xs mt-0.5">Click "Book Guest Stays" to record your first client booking.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {bookings.map((booking) => (
              <div key={booking.publicId} className="py-4 flex justify-between items-center text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900">{booking.guestName}</span>
                    <span className="text-[10px] bg-stone-100 text-stone-500 font-bold px-2 py-0.5 rounded-full">{booking.sequenceId || booking.publicId}</span>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">{booking.roomType.name} · {booking.totalNights} nights · {booking.roomsBooked} rooms</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-stone-900">₹{booking.totalAmount.toLocaleString('en-IN')}</p>
                  <div className="flex items-center gap-1.5 justify-end mt-1">
                    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      booking.status === 'CONFIRMED'
                        ? 'bg-green-50 text-green-700'
                        : booking.status === 'PENDING_CONFIRMATION'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {booking.status === 'CONFIRMED' ? (
                        <><CheckCircle className="h-2.5 w-2.5" /> Confirmed</>
                      ) : booking.status === 'PENDING_CONFIRMATION' ? (
                        <><Clock className="h-2.5 w-2.5 animate-spin" /> Pending Approval</>
                      ) : (
                        <><XCircle className="h-2.5 w-2.5" /> Rejected</>
                      )}
                    </span>
                    <span className="text-[10px] text-teal-600 font-extrabold">₹{booking.agentCommission} comm.</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
