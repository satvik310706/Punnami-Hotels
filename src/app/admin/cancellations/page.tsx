'use client';

import React, { useEffect, useState } from 'react';
import { 
  Search, RefreshCw, AlertTriangle, Clock, CheckCircle2, XCircle, 
  Eye, Loader2, DollarSign, Calendar, Phone, Mail, User, Info 
} from 'lucide-react';

interface Booking {
  publicId: string;
  sequenceId?: string | null;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  checkInDate: string;
  checkOutDate: string;
  totalNights: number;
  roomsBooked: number;
  totalAmount: number;
  paidAmount: number;
  paymentPercentage: number;
  cancellationReason: string | null;
  cancellationFee: number | null;
  refundAmount: number | null;
  status: string;
  createdAt: string;
  roomType: {
    name: string;
    hotel: {
      name: string;
    };
  };
}

export default function AdminCancellationsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/bookings');
      if (res.ok) {
        const data = await res.json();
        // Filter down to cancellation-related booking records
        const cancellationBookings = data.filter((b: any) => 
          ['CANCEL_REQUESTED', 'CANCELLED', 'REFUNDED'].includes(b.status)
        );
        setBookings(cancellationBookings);
      }
    } catch (err) {
      console.error('Failed to load cancellations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleAction = async (publicId: string, action: 'APPROVE_CANCEL' | 'REJECT_CANCEL' | 'MARK_REFUNDED') => {
    let confirmText = 'Are you sure you want to perform this action?';
    if (action === 'APPROVE_CANCEL') {
      confirmText = 'Are you sure you want to APPROVE this cancellation request and release the inventory room slots?';
    } else if (action === 'REJECT_CANCEL') {
      confirmText = 'Are you sure you want to REJECT this cancellation request and restore the booking?';
    } else if (action === 'MARK_REFUNDED') {
      confirmText = 'Are you sure you want to mark this booking as fully REFUNDED?';
    }

    if (!confirm(confirmText)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/bookings/${publicId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        alert('Action processed successfully!');
        setSelectedBooking(null);
        fetchBookings();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to complete action');
      }
    } catch {
      alert('Network request failed.');
    } finally {
      setActionLoading(false);
    }
  };

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
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Cancellation Requests & Log
          </h1>
          <p className="text-sm font-semibold text-stone-500">
            View room stays cancellation requests, process refunds, and manage released inventories.
          </p>
        </div>
        <button 
          onClick={fetchBookings}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-white border border-stone-200 px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50 shadow-sm cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 text-stone-500 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filters Bar */}
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
        <div className="flex flex-wrap gap-2">
          {['', 'CANCEL_REQUESTED', 'CANCELLED', 'REFUNDED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                statusFilter === status 
                  ? 'bg-amber-600 border-amber-600 text-white shadow-md' 
                  : 'bg-white border-stone-200 text-stone-600 hover:border-amber-500'
              }`}
            >
              {status === '' ? 'All Requests' : status === 'CANCEL_REQUESTED' ? 'Pending Approval' : status.replace('_', ' ')}
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
                <th className="px-6 py-4">Check-in Date</th>
                <th className="px-6 py-4">Total Paid</th>
                <th className="px-6 py-4">Request Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex justify-center items-center gap-2 text-stone-500 text-xs font-bold">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading cancellations...
                    </div>
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-stone-400 font-semibold">
                    <AlertTriangle className="h-10 w-10 text-stone-300 mx-auto mb-3" />
                    <p>No cancellation records found matching the filters.</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.publicId} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-stone-900">{b.sequenceId || b.publicId}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-stone-800">{b.guestName}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{b.guestPhone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-stone-600">
                      {new Date(b.checkInDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 font-black text-stone-900">
                      ₹{Number(b.paidAmount || b.totalAmount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      {b.status === 'CANCEL_REQUESTED' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 text-xs font-bold uppercase tracking-wider">
                          <Clock className="h-3 w-3 animate-pulse" /> Pending Approval
                        </span>
                      )}
                      {b.status === 'CANCELLED' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 text-red-700 px-2.5 py-1 text-xs font-bold uppercase tracking-wider">
                          <XCircle className="h-3 w-3" /> Cancelled
                        </span>
                      )}
                      {b.status === 'REFUNDED' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 text-xs font-bold uppercase tracking-wider">
                          <CheckCircle2 className="h-3 w-3" /> Refunded
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="inline-flex items-center gap-1 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 hover:text-stone-900 font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Dialog */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-stone-50 border-b border-stone-150 p-6 flex justify-between items-start shrink-0">
              <div>
                <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-red-700 border border-red-200 mb-2">
                  Cancellation Review
                </span>
                <h3 className="text-xl font-black text-stone-900 leading-tight">
                  Booking #{selectedBooking.sequenceId || selectedBooking.publicId}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 hover:bg-stone-200 rounded-lg text-stone-400 hover:text-stone-700 transition"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 bg-stone-50 rounded-2xl border border-stone-150 p-4">
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Guest Lead</p>
                  <p className="text-sm font-bold text-stone-850">{selectedBooking.guestName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Phone Number</p>
                  <p className="text-sm font-bold text-stone-855">{selectedBooking.guestPhone}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Category Booked</p>
                  <p className="text-sm font-bold text-stone-850">{selectedBooking.roomType.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Hotel</p>
                  <p className="text-sm font-bold text-stone-850">{selectedBooking.roomType.hotel.name}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
                  Cancellation Reason
                </h4>
                <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 text-sm text-stone-700 leading-relaxed font-semibold">
                  {selectedBooking.cancellationReason || 'No cancellation reason provided.'}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-stone-150 pt-4">
                <div className="bg-stone-50/70 p-3 rounded-xl border border-stone-150">
                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-wider">Paid Amount</p>
                  <p className="text-sm font-black text-stone-850 mt-0.5">₹{Number(selectedBooking.paidAmount || selectedBooking.totalAmount).toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-stone-50/70 p-3 rounded-xl border border-stone-150">
                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-wider">Cancellation Fee</p>
                  <p className="text-sm font-black text-red-655 mt-0.5">
                    ₹{selectedBooking.cancellationFee ? Number(selectedBooking.cancellationFee).toLocaleString('en-IN') : '0'}
                  </p>
                </div>
                <div className="bg-stone-50/70 p-3 rounded-xl border border-stone-150">
                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-wider">Eligible Refund</p>
                  <p className="text-sm font-black text-teal-655 mt-0.5">
                    ₹{selectedBooking.refundAmount ? Number(selectedBooking.refundAmount).toLocaleString('en-IN') : '0'}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-stone-50 border-t border-stone-150 p-6 flex flex-wrap justify-end gap-2 shrink-0">
              <button 
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2.5 text-xs font-bold text-stone-500 hover:bg-stone-200 rounded-xl cursor-pointer"
              >
                Close Drawer
              </button>

              {selectedBooking.status === 'CANCEL_REQUESTED' && (
                <>
                  <button
                    onClick={() => handleAction(selectedBooking.publicId, 'REJECT_CANCEL')}
                    disabled={actionLoading}
                    className="bg-white border border-stone-200 hover:bg-stone-50 text-stone-750 font-black px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Reject Cancellation
                  </button>
                  <button
                    onClick={() => handleAction(selectedBooking.publicId, 'APPROVE_CANCEL')}
                    disabled={actionLoading}
                    className="bg-red-600 hover:bg-red-700 text-white font-black px-4 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                  >
                    Approve & Release Slot
                  </button>
                </>
              )}

              {selectedBooking.status === 'CANCELLED' && (
                <button
                  onClick={() => handleAction(selectedBooking.publicId, 'MARK_REFUNDED')}
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  Mark as Refunded
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
