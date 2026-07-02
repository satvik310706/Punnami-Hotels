'use client';

import { useState, useEffect } from 'react';
import { 
  Search, ShieldAlert, CheckCircle, Clock, XCircle, Eye, 
  Calendar, Phone, Mail, User, Info, FileText, ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import InlineLoader from '@/components/InlineLoader';
import { useModalStore } from '@/hooks/useModalStore';

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
  paymentProofUrl: string | null;
  transactionId: string | null;
  status: string;
  createdAt: string;
  passengers?: any;
  roomType: { name: string; coverImageUrl: string | null };
}

export default function AdminBookingsPage() {
  const { showAlert, showConfirm } = useModalStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
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

  const handleAction = async (publicId: string, action: 'APPROVE' | 'REJECT') => {
    const isApprove = action === 'APPROVE';
    const confirmed = await showConfirm(
      isApprove ? 'Approve Booking' : 'Reject Booking',
      `Are you sure you want to ${isApprove ? 'APPROVE' : 'REJECT'} this booking?`
    );
    if (!confirmed) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/bookings/${publicId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        showAlert('Success', `Booking ${isApprove ? 'approved' : 'rejected'} successfully.`, 'success');
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
      <div>
        <h1 className="text-3xl font-black text-stone-900" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
          Customer Bookings Log
        </h1>
        <p className="text-stone-500 mt-1">Monitor stays, audit transaction proof uploads, and verify manual booking payments.</p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input 
            type="text" 
            placeholder="Search by Voucher ID, guest name, phone, or transaction ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white pl-11 pr-4 py-3 text-sm outline-none focus:border-amber-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['', 'PENDING_PROOF', 'PENDING_CONFIRMATION', 'CONFIRMED', 'REJECTED'].map((status) => (
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
                <th className="px-6 py-4">Voucher ID</th>
                <th className="px-6 py-4">Guest Info</th>
                <th className="px-6 py-4">Stay / Variant</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Payment Status</th>
                <th className="px-6 py-4">Proof</th>
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
                    <td className="px-6 py-4 font-black text-amber-700">{b.publicId}</td>
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
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        b.status === 'CONFIRMED'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : b.status === 'PENDING_CONFIRMATION'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : b.status === 'PENDING_PROOF'
                          ? 'bg-stone-100 text-stone-600 border border-stone-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {b.status === 'CONFIRMED' ? (
                          <><CheckCircle className="h-3 w-3" /> Confirmed</>
                        ) : b.status === 'PENDING_CONFIRMATION' ? (
                          <><Clock className="h-3 w-3 animate-spin" /> Verifying</>
                        ) : b.status === 'PENDING_PROOF' ? (
                          <><Clock className="h-3 w-3" /> Upload Awaiting</>
                        ) : (
                          <><XCircle className="h-3 w-3" /> Rejected</>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {b.paymentProofUrl ? (
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 inline" /> Available
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
                          <XCircle className="h-3 w-3 inline" /> Missing
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/booking/${b.publicId}`, '_blank');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200"
                        title="View Public Ticket"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ticket
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
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Info grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      {selectedBooking.transactionId && (
                        <div className="mt-2 text-stone-600 border-t border-stone-200 pt-2">
                          Transaction ID: <span className="font-black text-stone-900">{selectedBooking.transactionId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Proof Column */}
                <div className="flex flex-col">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">Payment Verification Proof</h4>
                  <div className="border border-stone-200 rounded-2xl bg-stone-100 overflow-hidden flex-1 flex items-center justify-center min-h-[250px] relative">
                    {selectedBooking.paymentProofUrl ? (
                      <img 
                        src={selectedBooking.paymentProofUrl} 
                        alt="Payment Proof Uploaded by Customer" 
                        className="w-full h-full object-contain max-h-[350px] hover:scale-105 transition-transform duration-300 cursor-zoom-in"
                        onClick={() => window.open(selectedBooking.paymentProofUrl!, '_blank')}
                      />
                    ) : (
                      <div className="text-center p-6 text-stone-400">
                        <FileText className="h-10 w-10 mx-auto mb-2 text-stone-300" />
                        <p className="font-bold">No receipt proof uploaded</p>
                        <p className="text-xs mt-1">Customer hasn't uploaded payment screenshot yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

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

            {/* Footer actions */}
            <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between shrink-0">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-400 font-bold uppercase">
                <Info className="h-4 w-4 text-stone-300" />
                <span>Status: {selectedBooking.status}</span>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2.5 text-xs font-bold text-stone-500 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => window.open(`/booking/${selectedBooking.publicId}`, '_blank')}
                  className="px-4 py-2.5 text-xs font-bold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 shadow-sm rounded-xl cursor-pointer"
                >
                  View Ticket
                </button>
                {selectedBooking.status !== 'CONFIRMED' && selectedBooking.status !== 'REJECTED' && (
                  <>
                    <button
                      onClick={() => handleAction(selectedBooking.publicId, 'REJECT')}
                      disabled={actionLoading}
                      className="bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 font-black px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(selectedBooking.publicId, 'APPROVE')}
                      disabled={actionLoading}
                      className="bg-stone-900 hover:bg-amber-700 text-white font-black px-4 py-2.5 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
                    >
                      Approve & Confirm
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
