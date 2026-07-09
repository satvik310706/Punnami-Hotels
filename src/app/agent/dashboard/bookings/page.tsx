'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, ShieldAlert, CheckCircle, Clock, XCircle, Eye, 
  Calendar, Phone, User, Info, FileText, ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import InlineLoader from '@/components/InlineLoader';

interface Booking {
  publicId: string;
  checkInDate: string;
  checkOutDate: string;
  totalNights: number;
  roomsBooked: number;
  guestName: string;
  guestPhone: string;
  totalAmount: number;
  agentCommission: number;
  status: string;
  roomType: { name: string; coverImageUrl: string | null };
}

export default function AgentBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/bookings/agent/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      b.publicId.toLowerCase().includes(query) ||
      b.guestName.toLowerCase().includes(query) ||
      b.guestPhone.toLowerCase().includes(query);

    const matchesStatus = statusFilter === '' || b.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-stone-900" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
          Registered Bookings Log
        </h1>
        <p className="text-stone-500 mt-1">Review guest stay reservations, payment verification statuses, and commissions earned.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input 
            type="text" 
            placeholder="Search by Booking ID, guest name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white pl-11 pr-4 py-3 text-sm outline-none focus:border-amber-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', 'PENDING_PROOF', 'PENDING_CONFIRMATION', 'CONFIRMED', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                statusFilter === status 
                  ? 'bg-teal-600 border-teal-600 text-white shadow-md' 
                  : 'bg-white border-stone-200 text-stone-600 hover:border-teal-500'
              }`}
            >
              {status === '' ? 'All Statuses' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table grid */}
      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50 text-xs font-bold text-stone-400 uppercase tracking-wider">
                <th className="px-6 py-4">Booking ID</th>
                <th className="px-6 py-4">Guest Info</th>
                <th className="px-6 py-4">Stay Details</th>
                <th className="px-6 py-4">Price paid (Net)</th>
                <th className="px-6 py-4">Commission Earned</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <InlineLoader size="md" />
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-stone-400">
                    <ShieldAlert className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                    <h3 className="font-bold text-stone-750">No stay logs matching criteria</h3>
                    <p className="text-xs text-stone-400 mt-1">Bookings you complete on behalf of guests will display here.</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.publicId} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4 font-black text-stone-900">{b.publicId}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-stone-900">{b.guestName}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{b.guestPhone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-stone-850">{b.roomType.name}</p>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {format(new Date(b.checkInDate), 'dd MMM')} - {format(new Date(b.checkOutDate), 'dd MMM yyyy')} ({b.totalNights} nights)
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-stone-900">
                      ₹{b.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 font-black text-teal-600">
                      ₹{b.agentCommission.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        b.status === 'CONFIRMED'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : b.status === 'PENDING_CONFIRMATION'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : b.status === 'PENDING_PROOF'
                          ? 'bg-purple-50 text-purple-750 border border-purple-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {b.status === 'CONFIRMED' ? (
                          <><CheckCircle className="h-3 w-3" /> Confirmed</>
                        ) : b.status === 'PENDING_CONFIRMATION' ? (
                          <><Clock className="h-3 w-3 animate-spin" /> Verifying</>
                        ) : b.status === 'PENDING_PROOF' ? (
                          <><Clock className="h-3 w-3 animate-pulse" /> Pending Payment</>
                        ) : (
                          <><XCircle className="h-3 w-3" /> Rejected</>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => router.push(`/booking/${b.publicId}`)}
                        className="p-2 text-stone-400 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-all cursor-pointer"
                        title="View Ticket"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
