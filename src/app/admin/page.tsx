'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldAlert, BookOpen, Check, X, Eye, IndianRupee, LayoutDashboard, 
  XCircle, Calendar, Phone, Mail, User, Info, FileText, CheckCircle, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import InlineLoader from '@/components/InlineLoader';
import { useModalStore } from '@/hooks/useModalStore';
import AdminDatePicker from '@/components/AdminDatePicker';

interface Booking {
  id: string;
  publicId: string;
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
  totalAmount: number;
  paidAmount: number | null;
  paymentPercentage: number | null;
  paymentProofUrl: string | null;
  transactionId: string | null;
  gatewayTransactionId?: string | null;
  merchantTransactionId?: string | null;
  status: string;
  cancellationReason: string | null;
  cancellationFee: number | null;
  refundAmount: number | null;
  postponeReason: string | null;
  postponeNewDate: string | null;
  passengers: any;
  createdAt: string;
  roomType: { name: string; coverImageUrl: string | null };
}

export default function AdminDashboard() {
  const { showAlert, showConfirm } = useModalStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRescheduleInput, setShowRescheduleInput] = useState(false);
  const [directPostponeDate, setDirectPostponeDate] = useState('');

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await fetch('/api/v1/admin/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

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
      successMessage = 'Booking approved successfully.';
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

  // Stats
  const totalBookings = bookings.length;
  const totalRevenue = bookings.filter((b) => b.status === 'CONFIRMED').reduce((acc, curr) => acc + curr.totalAmount, 0);
  const occupancyRate = bookings.filter((b) => b.status === 'CONFIRMED').length;

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center">
          <LayoutDashboard className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Administration Dashboard
          </h1>
          <p className="text-stone-500 text-xs uppercase tracking-widest font-semibold mt-1">Real-time stats and bookings administration</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: 'Total Bookings', value: totalBookings, icon: BookOpen, color: 'bg-blue-500/10 text-blue-600' },
          { label: 'Revenue Received', value: formatCurrency(totalRevenue), icon: IndianRupee, color: 'bg-green-500/10 text-green-600' },
          { label: 'Confirmed Guests', value: occupancyRate, icon: Check, color: 'bg-purple-500/10 text-purple-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">{label}</span>
              <div className="text-2xl font-black text-stone-900 mt-1">{value}</div>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Booking History Logs */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-stone-900 mb-4" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
          All Bookings History Log
        </h2>

        {loadingBookings ? (
          <div className="py-8 flex justify-center"><InlineLoader size="sm" /></div>
        ) : bookings.length === 0 ? (
          <p className="text-stone-400 text-sm py-4 text-center">No bookings registered in system.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-stone-400 text-xs font-bold uppercase tracking-wider">
                  <th className="pb-3">Guest / Booking ID</th>
                  <th className="pb-3">Room Type</th>
                  <th className="pb-3">Dates</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {bookings.map((b) => (
                  <tr 
                    key={b.id} 
                    onClick={() => setSelectedBooking(b)}
                    className="text-stone-700 hover:bg-stone-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-4">
                      <div className="font-bold text-stone-900">{b.guestName}</div>
                      <div className="text-xs text-stone-400">{b.guestPhone} | ID: {b.sequenceId || b.publicId}</div>
                    </td>
                    <td className="py-4 font-semibold">{b.roomType.name}</td>
                    <td className="py-4 text-xs font-medium">
                      {format(new Date(b.checkInDate), 'dd/MM/yyyy')} to {format(new Date(b.checkOutDate), 'dd/MM/yyyy')}
                    </td>
                    <td className="py-4 font-bold text-stone-900">₹{b.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                        b.status === 'CONFIRMED'
                          ? 'bg-green-50 text-green-700'
                          : b.status === 'PARTIAL_PAID'
                          ? 'bg-amber-50 text-amber-700'
                          : b.status === 'PENDING_CONFIRMATION'
                          ? 'bg-amber-50 text-amber-700'
                          : b.status === 'CANCEL_REQUESTED'
                          ? 'bg-red-50 px-2.5 py-1 rounded-full text-red-700 animate-pulse'
                          : b.status === 'CANCELLED'
                          ? 'bg-stone-100 text-stone-500'
                          : b.status === 'POSTPONE_REQUESTED'
                          ? 'bg-amber-50 text-amber-700'
                          : b.status === 'POSTPONED'
                          ? 'bg-blue-50 text-blue-700'
                          : b.status === 'REFUNDED'
                          ? 'bg-stone-200 text-stone-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {b.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBooking(b);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-750 bg-white hover:bg-stone-50 rounded-lg transition-colors border border-stone-200 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-stone-500" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>



      {/* Drawer */}
      {selectedBooking && (
        <div 
          className="fixed inset-0 bg-stone-950/45 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-150"
          onClick={() => setSelectedBooking(null)}
        >
          <div 
            className="w-full max-w-2xl bg-white h-screen shadow-2xl flex flex-col animate-in slide-in-from-right duration-250 border-l border-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-stone-150 bg-stone-50 flex items-center justify-between shrink-0">
              <div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  selectedBooking.status === 'CONFIRMED'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : selectedBooking.status === 'PARTIAL_PAID'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : selectedBooking.status === 'PENDING_CONFIRMATION'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : selectedBooking.status === 'CANCEL_REQUESTED'
                    ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                    : selectedBooking.status === 'CANCELLED'
                    ? 'bg-stone-100 text-stone-500 border border-stone-200 line-through'
                    : selectedBooking.status === 'POSTPONE_REQUESTED'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                    : selectedBooking.status === 'POSTPONED'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : selectedBooking.status === 'REFUNDED'
                    ? 'bg-stone-200 text-stone-700 border border-stone-300'
                    : 'bg-red-50 text-red-800'
                }`}>
                  {selectedBooking.status.replace('_', ' ')}
                </span>
                <h3 className="text-lg font-black text-stone-900 mt-1">Review Booking #{selectedBooking.sequenceId || selectedBooking.publicId}</h3>
              </div>
              <button 
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 hover:bg-stone-200 rounded-lg text-stone-400 hover:text-stone-700 transition cursor-pointer"
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
                      <div>Check-in: {format(new Date(selectedBooking.checkInDate), 'dd MMMM yyyy')}</div>
                      <div>Check-out: {format(new Date(selectedBooking.checkOutDate), 'dd MMMM yyyy')}</div>
                      <div>Duration: {selectedBooking.totalNights} nights ({selectedBooking.roomsBooked} room{selectedBooking.roomsBooked > 1 ? 's' : ''})</div>
                      <div>Occupants: {selectedBooking.adultCount} adults, {selectedBooking.childCount} children</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">Transaction Info</h4>
                    <div className="bg-stone-50 rounded-xl p-4 space-y-2 text-xs font-semibold">
                      <div className="flex justify-between text-stone-500"><span>Subtotal:</span><span>₹{selectedBooking.subtotalAmount.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between text-stone-500"><span>GST:</span><span>₹{selectedBooking.gstAmount.toLocaleString('en-IN')}</span></div>
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
                      {(selectedBooking.gatewayTransactionId || selectedBooking.transactionId) && (
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
                      )}
                    </div>
                  </div>
                </div>
              </div>

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

              {selectedBooking.status === 'POSTPONE_REQUESTED' && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-2">
                  <h5 className="font-extrabold text-amber-800 text-sm flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" /> Reschedule Request Details
                  </h5>
                  <p className="text-stone-700 text-sm font-medium">
                    <strong>Reason:</strong> "{selectedBooking.postponeReason || 'No reason provided.'}"
                  </p>
                  <p className="text-xs font-bold text-amber-955">
                    <strong>Requested New Date:</strong> {selectedBooking.postponeNewDate ? format(new Date(selectedBooking.postponeNewDate), 'dd MMMM yyyy') : 'N/A'}
                  </p>
                </div>
              )}

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
                            <tr key={idx} className="font-semibold text-stone-750">
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
                      // Guard: must be tomorrow or later
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      tomorrow.setHours(0,0,0,0);
                      const [py, pm, pd] = directPostponeDate.split('-').map(Number);
                      const chosen = new Date(py, pm - 1, pd);
                      if (chosen < tomorrow) {
                        alert('New check-in date must be tomorrow or later. You cannot reschedule to today or a past date.');
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

            {/* Footer */}
            <div className="p-6 border-t border-stone-150 bg-stone-50 flex items-center justify-end gap-2 shrink-0">
              <button 
                onClick={() => {
                  setSelectedBooking(null);
                  setShowRescheduleInput(false);
                  setDirectPostponeDate('');
                }}
                className="px-4 py-2.5 bg-white border border-stone-200 hover:bg-stone-100 rounded-xl text-xs font-bold text-stone-500 cursor-pointer"
              >
                Close Review
              </button>

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



              {selectedBooking.status === 'CANCEL_REQUESTED' && (
                <>
                  <button
                    onClick={() => handleAction(selectedBooking.publicId, 'REJECT_CANCEL')}
                    disabled={actionLoading}
                    className="px-4 py-2.5 bg-white border border-stone-200 hover:bg-stone-100 text-stone-750 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Reject Cancellation
                  </button>
                  <button
                    onClick={() => handleAction(selectedBooking.publicId, 'APPROVE_CANCEL')}
                    disabled={actionLoading}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs transition shadow-md cursor-pointer"
                  >
                    Approve Cancellation & Free Slot
                  </button>
                </>
              )}

              {selectedBooking.status === 'POSTPONE_REQUESTED' && (
                <>
                  <button
                    onClick={() => handleAction(selectedBooking.publicId, 'REJECT_POSTPONE')}
                    disabled={actionLoading}
                    className="px-4 py-2.5 bg-white border border-stone-255 hover:bg-stone-100 text-stone-750 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Reject Reschedule
                  </button>
                  <button
                    onClick={() => handleAction(selectedBooking.publicId, 'APPROVE_POSTPONE')}
                    disabled={actionLoading}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-xs transition shadow-md cursor-pointer"
                  >
                    Approve & Update Stay Dates
                  </button>
                </>
              )}

              {selectedBooking.status === 'CANCELLED' && (
                <button
                  onClick={() => handleAction(selectedBooking.publicId, 'MARK_REFUNDED')}
                  disabled={actionLoading}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition shadow-md cursor-pointer"
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
