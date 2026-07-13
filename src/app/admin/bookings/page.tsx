'use client';

import { useState, useEffect } from 'react';
import { 
  Search, ShieldAlert, CheckCircle, Clock, XCircle, Eye, 
  Calendar, Phone, Mail, User, Info,
  AlertCircle, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import InlineLoader from '@/components/InlineLoader';
import { useModalStore } from '@/hooks/useModalStore';
import AdminDatePicker from '@/components/AdminDatePicker';
import InvoiceDownload from '@/components/InvoiceDownload';

function formatSlotTime(timeStr?: string | null, fallback: string = '12:00 PM') {
  if (!timeStr) return fallback;
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return fallback;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours.toString().padStart(2, '0')}:${displayMinutes} ${period}`;
  } catch {
    return fallback;
  }
}

interface Booking {
  id: string;
  publicId: string;
  sequenceId: string | null;
  roomTypeId: string;
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
  gatewayFee: number;
  totalAmount: number;
  paidAmount?: number | null;
  paymentPercentage?: number | null;
  paymentProofUrl: string | null;
  transactionId: string | null;
  gatewayTransactionId?: string | null;
  merchantTransactionId?: string | null;
  slotStart?: string;
  slotEnd?: string;
  completedPayments?: {
    id: string;
    merchantTransactionId: string;
    gatewayTransactionId: string | null;
    amount: number;
    createdAt: string;
  }[];
  status: string;
  createdAt: string;
  passengers?: any;
  roomType: { name: string; coverImageUrl: string | null };
  cancellationReason?: string | null;
  cancellationFee?: number | null;
  refundAmount?: number | null;
  postponeReason?: string | null;
  postponeNewDate?: string | null;
}

export default function AdminBookingsPage() {
  const { showAlert, showConfirm } = useModalStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRescheduleInput, setShowRescheduleInput] = useState(false);
  const [directPostponeDate, setDirectPostponeDate] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/bookings');
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const search = params.get('search')?.trim();
      if (search) {
        setSearchQuery(search);
      }
    }
  }, []);

  useEffect(() => {
    if (bookings.length > 0 && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const search = params.get('search')?.trim().toLowerCase();
      if (search) {
        const matched = bookings.find(
          (b) =>
            b.publicId.toLowerCase() === search ||
            b.sequenceId?.toLowerCase() === search
        );
        if (matched) {
          setSelectedBooking(matched);
        }
      }
    }
  }, [bookings]);

  const handleAction = async (
    publicId: string, 
    action: 'APPROVE' | 'REJECT' | 'APPROVE_CANCEL' | 'REJECT_CANCEL' | 'APPROVE_POSTPONE' | 'REJECT_POSTPONE' | 'MARK_REFUNDED'
  ) => {
    let title = 'Process Action';
    let text = 'Are you sure you want to perform this action?';
    let successMessage = 'Action completed successfully.';

    if (action === 'APPROVE') {
      title = 'Approve Booking';
      text = 'Are you sure you want to APPROVE this booking?';
      successMessage = 'Booking confirmed and approved successfully.';
    } else if (action === 'REJECT') {
      title = 'Reject Booking';
      text = 'Are you sure you want to REJECT this booking?';
      successMessage = 'Booking rejected successfully.';
    } else if (action === 'APPROVE_CANCEL') {
      title = 'Approve Cancellation';
      text = 'Are you sure you want to APPROVE this cancellation and release inventory?';
      successMessage = 'Cancellation request approved.';
    } else if (action === 'REJECT_CANCEL') {
      title = 'Reject Cancellation';
      text = 'Are you sure you want to REJECT this cancellation request?';
      successMessage = 'Cancellation request rejected.';
    } else if (action === 'APPROVE_POSTPONE') {
      title = 'Approve Reschedule';
      text = 'Are you sure you want to APPROVE this reschedule and update travel dates?';
      successMessage = 'Reschedule request approved.';
    } else if (action === 'REJECT_POSTPONE') {
      title = 'Reject Reschedule';
      text = 'Are you sure you want to REJECT this reschedule request?';
      successMessage = 'Reschedule request rejected.';
    } else if (action === 'MARK_REFUNDED') {
      title = 'Mark as Refunded';
      text = 'Are you sure you want to mark this booking as fully REFUNDED?';
      successMessage = 'Booking marked as refunded.';
    }

    const confirmed = await showConfirm(title, text);
    if (!confirmed) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/bookings/${publicId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, postponeNewDate: directPostponeDate }),
      });
 
      if (res.ok) {
        showAlert('Success', successMessage, 'success');
        setSelectedBooking(null);
        fetchBookings();
      } else {
        const data = await res.json();
        showAlert('Error', data.error || 'Action failed', 'error');
      }
    } catch {
      showAlert('Error', 'Network request failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      b.publicId.toLowerCase().includes(query) ||
      b.guestName.toLowerCase().includes(query) ||
      b.guestPhone.toLowerCase().includes(query) ||
      (b.transactionId && b.transactionId.toLowerCase().includes(query));

    const matchesStatus = statusFilter === '' || b.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-stone-900" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Customer Bookings Log
          </h1>
          <p className="text-stone-500 mt-1">Monitor stays, audit transaction proof uploads, and verify manual booking payments.</p>
        </div>
        <button 
          onClick={fetchBookings}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-white border border-stone-200 px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50 shadow-sm cursor-pointer disabled:opacity-50 self-start sm:self-center"
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
            placeholder="Search by Booking ID, guest name, phone, or transaction ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white pl-11 pr-4 py-3 text-sm outline-none focus:border-amber-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['', 'PENDING_PROOF', 'PENDING_CONFIRMATION', 'CONFIRMED', 'PARTIAL_PAID', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                statusFilter === status 
                  ? 'bg-amber-600 border-amber-600 text-white shadow-md' 
                  : 'bg-white border-stone-200 text-stone-600 hover:border-amber-500'
              }`}
            >
              {status === '' ? 'All Bookings' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50 text-xs font-bold text-stone-400 uppercase tracking-wider">
                <th className="px-6 py-4">Booking ID</th>
                <th className="px-6 py-4">Guest Info</th>
                <th className="px-6 py-4">Stay / Variant</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Payment Status</th>
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
                  <td colSpan={7} className="text-center py-16 text-stone-405">
                    <ShieldAlert className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                    <h3 className="font-bold text-stone-700">No bookings registered yet</h3>
                    <p className="text-xs text-stone-400 mt-1">Bookings will display here once customers check out rooms.</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr 
                    key={b.id} 
                    onClick={() => setSelectedBooking(b)}
                    className="hover:bg-stone-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-black text-amber-700">{b.sequenceId || b.publicId}</td>
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
                          {format(new Date(b.checkInDate), 'dd MMM')} - {format(new Date(b.checkOutDate), 'dd MMM yyyy')} ({b.totalNights} nights | {formatSlotTime(b.slotStart)} - {formatSlotTime(b.slotEnd)})
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-stone-900">
                      ₹{b.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        b.status === 'CONFIRMED'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : b.status === 'PARTIAL_PAID'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : b.status === 'PENDING_CONFIRMATION'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : b.status === 'PENDING_PROOF'
                          ? 'bg-purple-50 text-purple-750 border border-purple-200'
                          : b.status === 'CANCEL_REQUESTED'
                          ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                          : b.status === 'CANCELLED'
                          ? 'bg-stone-100 text-stone-500 border border-stone-200 line-through'
                          : b.status === 'POSTPONE_REQUESTED'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                          : b.status === 'POSTPONED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : b.status === 'REFUNDED'
                          ? 'bg-stone-200 text-stone-700 border border-stone-300'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {b.status === 'CONFIRMED' ? (
                          <><CheckCircle className="h-3 w-3" /> Confirmed</>
                        ) : b.status === 'PARTIAL_PAID' ? (
                          <><CheckCircle className="h-3 w-3" /> Partially Paid</>
                        ) : b.status === 'PENDING_CONFIRMATION' ? (
                          <><Clock className="h-3 w-3 animate-spin" /> Verifying</>
                        ) : b.status === 'PENDING_PROOF' ? (
                          <><Clock className="h-3 w-3 animate-pulse" /> Pending Payment</>
                        ) : b.status === 'CANCEL_REQUESTED' ? (
                          <><ShieldAlert className="h-3 w-3" /> Cancel Req</>
                        ) : b.status === 'CANCELLED' ? (
                          <><XCircle className="h-3 w-3" /> Cancelled</>
                        ) : b.status === 'POSTPONE_REQUESTED' ? (
                          <><Calendar className="h-3 w-3" /> Reschedule Req</>
                        ) : b.status === 'POSTPONED' ? (
                          <><CheckCircle className="h-3 w-3" /> Rescheduled</>
                        ) : b.status === 'REFUNDED' ? (
                          <><XCircle className="h-3 w-3" /> Refunded</>
                        ) : (
                          <><XCircle className="h-3 w-3" /> Rejected</>
                        )}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBooking(b);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-750 bg-white hover:bg-stone-50 rounded-lg transition-colors border border-stone-200 cursor-pointer shadow-sm active:scale-95"
                        title="Review stay details"
                      >
                        <Eye className="h-3.5 w-3.5 text-stone-500" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Audit Details Drawer Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-stone-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif' }}>Review Booking Ticket</h3>
                <p className="text-xs text-stone-400 mt-1">Audit guest payments and verification proofs</p>
              </div>
              <button 
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 hover:bg-stone-800 rounded-lg transition-colors text-white/70 hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-stone-800">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">Guest Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 font-bold text-stone-850"><User className="h-4 w-4 text-amber-600" /> {selectedBooking.guestName}</div>
                      <div className="flex items-center gap-2 font-semibold text-stone-600"><Phone className="h-4 w-4 text-amber-600" /> {selectedBooking.guestPhone}</div>
                      {selectedBooking.guestEmail && (
                        <div className="flex items-center gap-2 font-semibold text-stone-600"><Mail className="h-4 w-4 text-amber-600" /> {selectedBooking.guestEmail}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">Stay Parameters</h4>
                    <div className="space-y-2 text-sm font-semibold text-stone-600">
                      <div className="flex items-center gap-2 text-stone-850 font-bold"><Calendar className="h-4 w-4 text-amber-600" /> {selectedBooking.roomType.name}</div>
                      <div>Check-in: {format(new Date(selectedBooking.checkInDate), 'dd MMMM yyyy')} @ {formatSlotTime(selectedBooking.slotStart, '12:00 PM')}</div>
                      <div>Check-out: {format(new Date(selectedBooking.checkOutDate), 'dd MMMM yyyy')} @ {formatSlotTime(selectedBooking.slotEnd, '11:00 AM')}</div>
                      <div>Duration: {selectedBooking.totalNights} nights ({selectedBooking.roomsBooked} room{selectedBooking.roomsBooked > 1 ? 's' : ''})</div>
                      <div>Occupants: {selectedBooking.adultCount} adults, {selectedBooking.childCount} children</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">Transaction Info</h4>
                    <div className="bg-stone-50 rounded-xl p-4 space-y-2 text-xs font-semibold">
                      <div className="flex justify-between text-stone-500"><span>Subtotal:</span><span>₹{selectedBooking.subtotalAmount.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between text-stone-500"><span>GST (5%):</span><span>₹{selectedBooking.gstAmount.toLocaleString('en-IN')}</span></div>
                      {selectedBooking.gatewayFee > 0 && (
                        <div className="flex justify-between text-stone-500"><span>Gateway Fee:</span><span>₹{selectedBooking.gatewayFee.toLocaleString('en-IN')}</span></div>
                      )}
                      <div className="flex justify-between text-stone-900 border-t border-stone-250 pt-2 font-bold text-sm">
                        <span>Total Price:</span><span className="text-amber-700">₹{selectedBooking.totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                      {selectedBooking.paymentPercentage && selectedBooking.paymentPercentage < 100 && (
                        <>
                          <div className="flex justify-between text-stone-500 border-t border-stone-200/60 pt-1.5">
                            <span>Paid Advance ({selectedBooking.paymentPercentage}%):</span>
                            <span className="text-emerald-700 font-bold">₹{selectedBooking.paidAmount?.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-stone-900 font-extrabold bg-amber-50 p-1.5 rounded-lg mt-1 text-[11px]">
                            <span>Due at Check-In:</span>
                            <span className="text-amber-700">₹{(selectedBooking.totalAmount - (selectedBooking.paidAmount ?? 0)).toLocaleString('en-IN')}</span>
                          </div>
                        </>
                      )}
                      {selectedBooking.completedPayments && selectedBooking.completedPayments.length > 0 ? (
                        <div className="mt-4 pt-3 border-t border-stone-250 space-y-2">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">Completed Transactions History</span>
                          <div className="space-y-2">
                            {selectedBooking.completedPayments.map((p, idx) => (
                              <div key={p.id || idx} className="bg-white border border-stone-200 rounded-xl p-3 flex flex-col gap-1 text-[11px] font-bold text-stone-700">
                                <div className="flex justify-between text-stone-900">
                                  <span>Payment #{idx + 1} (₹{p.amount.toLocaleString('en-IN')})</span>
                                  <span className="text-emerald-700 font-extrabold uppercase text-[9px]">✓ Success</span>
                                </div>
                                <div className="grid grid-cols-2 gap-y-0.5 text-[10px] text-stone-500 font-medium">
                                  <div>Merchant Ref:</div>
                                  <div className="text-stone-750 text-right font-mono truncate select-all">{p.merchantTransactionId}</div>
                                  <div>Gateway Ref:</div>
                                  <div className="text-stone-750 text-right font-mono truncate select-all">{p.gatewayTransactionId || '—'}</div>
                                  <div>Date:</div>
                                  <div className="text-stone-700 text-right">{format(new Date(p.createdAt), 'dd MMM yyyy, hh:mm a')}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (selectedBooking.gatewayTransactionId || selectedBooking.transactionId) ? (
                        <div className="mt-2 text-stone-600 border-t border-stone-200 pt-2 space-y-1">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">PhonePe Gateway Transaction ID</span>
                            <span className="font-black text-stone-900 text-sm break-all">
                              {selectedBooking.gatewayTransactionId || selectedBooking.transactionId}
                            </span>
                          </div>
                          {selectedBooking.merchantTransactionId && selectedBooking.merchantTransactionId !== selectedBooking.gatewayTransactionId && (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">Internal Merchant Ref</span>
                              <span className="font-mono text-xs text-stone-600 break-all">{selectedBooking.merchantTransactionId}</span>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cancellation Request Box */}
              {selectedBooking.status === 'CANCEL_REQUESTED' && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-2">
                  <h5 className="font-extrabold text-red-800 text-sm flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4" /> Cancellation Request Details
                  </h5>
                  <p className="text-stone-700 text-sm font-medium">
                    <strong>Reason:</strong> "{selectedBooking.cancellationReason || 'No reason provided.'}"
                  </p>
                  <div className="flex gap-4 text-xs font-bold text-red-950 pt-1">
                    <div>Cancellation Charge: ₹{selectedBooking.cancellationFee?.toLocaleString('en-IN')}</div>
                    <div>Eligible Refund: ₹{selectedBooking.refundAmount?.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              )}

              {/* Postpone Request Box */}
              {selectedBooking.status === 'POSTPONE_REQUESTED' && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-2">
                  <h5 className="font-extrabold text-amber-800 text-sm flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" /> Reschedule Request Details
                  </h5>
                  <p className="text-stone-700 text-sm font-medium">
                    <strong>Reason:</strong> "{selectedBooking.postponeReason || 'No reason provided.'}"
                  </p>
                  <p className="text-xs font-bold text-amber-950">
                    <strong>Requested New Date:</strong> {selectedBooking.postponeNewDate ? format(new Date(selectedBooking.postponeNewDate), 'dd MMMM yyyy') : 'N/A'}
                  </p>
                </div>
              )}

              {/* Passengers Manifest */}
              {selectedBooking.passengers && (selectedBooking.passengers as any[]).length > 0 && (
                <div className="border-t border-stone-150 pt-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">Passenger Manifest ({(selectedBooking.passengers as any[]).length} guest(s))</h4>
                  <div className="overflow-x-auto rounded-xl border border-stone-250 bg-stone-50/50">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-stone-100 border-b border-stone-200 font-bold text-stone-700">
                          <th className="p-2.5 pl-3">Sr</th>
                          <th className="p-2.5">Name</th>
                          <th className="p-2.5 text-center">Age</th>
                          <th className="p-2.5">Gender</th>
                          <th className="p-2.5 font-mono">Aadhaar (Last 4)</th>
                          <th className="p-2.5 pr-3">Contact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-150">
                        {(selectedBooking.passengers as any[]).map((p, idx) => {
                          const isChild = idx >= selectedBooking.adultCount;
                          let aadharText = 'N/A';
                          if (p.aadhaar && p.aadhaar.trim().length === 12) {
                            aadharText = `XXXX-XXXX-${p.aadhaar.slice(-4)}`;
                          } else if (isChild) {
                            aadharText = 'Not Required';
                          }
                          return (
                            <tr key={idx} className="font-semibold text-stone-700">
                              <td className="p-2.5 pl-3 text-stone-400">{idx + 1}</td>
                              <td className="p-2.5 text-stone-900 font-bold">
                                {p.fullName}
                                {idx === 0 && <span className="ml-1.5 rounded bg-amber-100 px-1 py-0.5 text-[9px] text-amber-700 font-bold uppercase">Lead</span>}
                              </td>
                              <td className="p-2.5 text-center">{p.age} Yrs</td>
                              <td className="p-2.5 capitalize">{p.gender?.toLowerCase() || 'N/A'}</td>
                              <td className="p-2.5 font-mono text-stone-650">{aadharText}</td>
                              <td className="p-2.5 pr-3 text-stone-500">{p.phone || (idx === 0 ? selectedBooking.guestPhone : '—')}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            {/* Reschedule Date Picker Input block */}
            {showRescheduleInput && (
              <div className="px-6 py-4 bg-amber-50 border-t border-amber-200 flex flex-col gap-3 shrink-0">
                <p className="text-xs font-black text-amber-800">Select New Check-in Date</p>
                <AdminDatePicker
                  value={directPostponeDate}
                  onChange={setDirectPostponeDate}
                  placeholder="Pick a future date..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!directPostponeDate) {
                        alert('Please select a future check-in date first.');
                        return;
                      }
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      tomorrow.setHours(0,0,0,0);
                      const [py, pm, pd] = directPostponeDate.split('-').map(Number);
                      const chosen = new Date(py, pm - 1, pd);
                      if (chosen < tomorrow) {
                        alert('New check-in date must be tomorrow or later.');
                        return;
                      }
                      handleAction(selectedBooking.publicId, 'APPROVE_POSTPONE');
                      setShowRescheduleInput(false);
                    }}
                    disabled={actionLoading || !directPostponeDate}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold px-3 py-2 rounded-xl text-xs cursor-pointer shadow-sm transition-colors"
                  >
                    Confirm Reschedule
                  </button>
                  <button
                    onClick={() => { setShowRescheduleInput(false); setDirectPostponeDate(''); }}
                    className="px-3 py-2 text-stone-500 hover:bg-stone-100 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between shrink-0">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-400 font-bold uppercase">
                <Info className="h-4 w-4 text-stone-300" />
                <span>Status: {selectedBooking.status}</span>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => {
                    setSelectedBooking(null);
                    setShowRescheduleInput(false);
                    setDirectPostponeDate('');
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-stone-500 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  Close Review
                </button>
                <button
                  onClick={() => window.open(`/booking/${selectedBooking.publicId}`, '_blank')}
                  className="px-4 py-2.5 text-xs font-bold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 shadow-sm rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5 text-stone-500" />
                  <span>View Ticket</span>
                </button>
                <InvoiceDownload
                  booking={{
                    ...selectedBooking,
                    paidAmount: selectedBooking.paidAmount ?? undefined,
                    paymentPercentage: selectedBooking.paymentPercentage ?? undefined,
                    slotStart: selectedBooking.slotStart,
                    slotEnd: selectedBooking.slotEnd,
                    completedPayments: selectedBooking.completedPayments,
                    roomType: {
                      name: selectedBooking.roomType.name,
                      hotel: {
                        name: 'Punnami Southern Residency',
                        address: 'Bhadrachalam, Telangana',
                      },
                    },
                  }}
                  label="Download Invoice"
                />

                {/* Direct Actions for Confirmed / Partially Paid Stay Bookings */}
                {['CONFIRMED', 'PARTIAL_PAID'].includes(selectedBooking.status) && (
                  <>
                    <button
                      onClick={() => handleAction(selectedBooking.publicId, 'APPROVE_CANCEL')}
                      disabled={actionLoading}
                      className="bg-white border border-red-200 hover:bg-red-50 text-red-600 font-black px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Cancel Booking
                    </button>
                    <button
                      onClick={() => setShowRescheduleInput(true)}
                      disabled={actionLoading}
                      className="bg-white border border-amber-250 hover:bg-amber-50 text-amber-800 font-black px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Reschedule Stay
                    </button>
                  </>
                )}

                {/* Cancellation Request Actions */}
                {selectedBooking.status === 'CANCEL_REQUESTED' && (
                  <>
                    <button
                      onClick={() => handleAction(selectedBooking.publicId, 'REJECT_CANCEL')}
                      disabled={actionLoading}
                      className="bg-stone-100 border border-stone-200 hover:bg-stone-200 text-stone-700 font-black px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Reject Cancellation
                    </button>
                    <button
                      onClick={() => handleAction(selectedBooking.publicId, 'APPROVE_CANCEL')}
                      disabled={actionLoading}
                      className="bg-red-600 hover:bg-red-700 text-white font-black px-4 py-2.5 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
                    >
                      Approve & Cancel Booking
                    </button>
                  </>
                )}

                {/* Reschedule Request Actions */}
                {selectedBooking.status === 'POSTPONE_REQUESTED' && (
                  <>
                    <button
                      onClick={() => handleAction(selectedBooking.publicId, 'REJECT_POSTPONE')}
                      disabled={actionLoading}
                      className="bg-stone-100 border border-stone-200 hover:bg-stone-200 text-stone-700 font-black px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Reject Reschedule
                    </button>
                    <button
                      onClick={() => handleAction(selectedBooking.publicId, 'APPROVE_POSTPONE')}
                      disabled={actionLoading}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-black px-4 py-2.5 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
                    >
                      Approve & Reschedule Stays
                    </button>
                  </>
                )}

                {/* Original Awaiting Payment Proof Actions */}
                {['PENDING_PROOF', 'PENDING_CONFIRMATION'].includes(selectedBooking.status) && (
                  <>
                    {selectedBooking.paymentProofUrl ? (
                      <>
                        <button
                          onClick={() => handleAction(selectedBooking.publicId, 'REJECT')}
                          disabled={actionLoading}
                          className="bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 font-black px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          Reject Proof
                        </button>
                        <button
                          onClick={() => handleAction(selectedBooking.publicId, 'APPROVE')}
                          disabled={actionLoading}
                          className="bg-stone-900 hover:bg-amber-700 text-white font-black px-4 py-2.5 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
                        >
                          Approve & Confirm
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-800 text-[10px] font-bold uppercase tracking-wider w-full">
                        <AlertCircle className="h-4.5 w-4.5 text-amber-600 shrink-0" />
                        <span>Awaiting automated PhonePe payment confirmation...</span>
                      </div>
                    )}
                  </>
                )}

                {/* Cancelled Stay Awaiting Refund settlement */}
                {selectedBooking.status === 'CANCELLED' && (
                  <button
                    onClick={() => handleAction(selectedBooking.publicId, 'MARK_REFUNDED')}
                    disabled={actionLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-xl text-xs transition shadow-md cursor-pointer"
                  >
                    Mark as Refunded
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
