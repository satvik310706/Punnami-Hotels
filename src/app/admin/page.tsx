'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, BookOpen, Check, X, Eye, IndianRupee, LayoutDashboard } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
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
  totalAmount: number;
  paymentProofUrl: string | null;
  transactionId: string | null;
  status: string;
  createdAt: string;
  roomType: { name: string; coverImageUrl: string | null };
}

export default function AdminDashboard() {
  const { showAlert, showConfirm } = useModalStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

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

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    const isApprove = action === 'APPROVE';
    const confirmed = await showConfirm(
      isApprove ? 'Approve Booking' : 'Reject Booking',
      `Are you sure you want to ${action.toLowerCase()} this booking?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/v1/admin/bookings/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('Success', data.message || 'Action executed successfully.', 'success');
        fetchBookings();
      } else {
        showAlert('Error', data.error || 'Action failed', 'error');
      }
    } catch {
      showAlert('Error', 'Network request failed.', 'error');
    }
  };

  // Stats
  const totalBookings = bookings.length;
  const pendingConfirmation = bookings.filter((b) => b.status === 'PENDING_CONFIRMATION').length;
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
          <p className="text-stone-500 text-xs uppercase tracking-widest font-semibold mt-1">Real-time stats and payment verifications</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        {[
          { label: 'Total Bookings', value: totalBookings, icon: BookOpen, color: 'bg-blue-500/10 text-blue-600' },
          { label: 'Pending Confirms', value: pendingConfirmation, icon: ShieldAlert, color: 'bg-amber-500/10 text-amber-600' },
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

      {/* Verification Board */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-stone-900 mb-4" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
          Awaiting Verification ({pendingConfirmation})
        </h2>

        {loadingBookings ? (
          <div className="py-8 flex justify-center"><InlineLoader size="sm" /></div>
        ) : bookings.filter((b) => b.status === 'PENDING_CONFIRMATION').length === 0 ? (
          <p className="text-stone-400 text-sm py-8 text-center">🎉 No bookings currently awaiting verification.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-stone-400 text-xs font-bold uppercase tracking-wider">
                  <th className="pb-3">Guest / Booking ID</th>
                  <th className="pb-3">Room Type</th>
                  <th className="pb-3">Check-in / Check-out</th>
                  <th className="pb-3">UTR / Proof</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {bookings
                  .filter((b) => b.status === 'PENDING_CONFIRMATION')
                  .map((b) => (
                    <tr key={b.id} className="text-stone-700">
                      <td className="py-4">
                        <div className="font-bold text-stone-900">{b.guestName}</div>
                        <div className="text-xs text-stone-400">{b.guestPhone} | ID: {b.publicId}</div>
                      </td>
                      <td className="py-4 font-semibold">{b.roomType.name}</td>
                      <td className="py-4 text-xs font-medium">
                        {format(new Date(b.checkInDate), 'dd MMM yyyy')} to {format(new Date(b.checkOutDate), 'dd MMM yyyy')}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs bg-stone-100 rounded-lg px-2 py-1 font-bold text-stone-600">{b.transactionId || 'N/A'}</span>
                          {b.paymentProofUrl && (
                            <button
                              onClick={() => setSelectedProofUrl(b.paymentProofUrl)}
                              className="p-1.5 hover:bg-stone-100 rounded-lg text-amber-600 hover:text-amber-700 transition-colors"
                              title="View Screenshot"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 font-black text-stone-900">₹{b.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="py-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleAction(b.publicId, 'APPROVE')}
                          className="inline-flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleAction(b.publicId, 'REJECT')}
                          className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
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
                  <tr key={b.id} className="text-stone-700">
                    <td className="py-4">
                      <div className="font-bold text-stone-900">{b.guestName}</div>
                      <div className="text-xs text-stone-400">{b.guestPhone} | ID: {b.publicId}</div>
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
                          : b.status === 'PENDING_CONFIRMATION'
                          ? 'bg-amber-50 text-amber-700'
                          : b.status === 'REJECTED'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-stone-100 text-stone-500'
                      }`}>
                        {b.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 text-right space-x-1">
                      {b.status === 'PENDING_CONFIRMATION' && (
                        <>
                          <button
                            onClick={() => handleAction(b.publicId, 'APPROVE')}
                            className="bg-green-50 hover:bg-green-100 text-green-700 p-1.5 rounded-lg transition-colors inline-flex"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleAction(b.publicId, 'REJECT')}
                            className="bg-red-50 hover:bg-red-100 text-red-700 p-1.5 rounded-lg transition-colors inline-flex"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {b.paymentProofUrl && (
                        <button
                          onClick={() => setSelectedProofUrl(b.paymentProofUrl)}
                          className="p-1.5 hover:bg-stone-100 rounded-lg text-amber-600 hover:text-amber-700 transition-colors inline-flex"
                          title="View Screenshot"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Proof Lightbox */}
      {selectedProofUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden max-w-lg w-full relative">
            <button
              onClick={() => setSelectedProofUrl(null)}
              className="absolute top-4 right-4 bg-stone-900/60 hover:bg-stone-950 text-white p-2 rounded-full transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-bold text-stone-900">Payment Verification Proof</h3>
              <a href={selectedProofUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-amber-700 hover:underline">Open Original →</a>
            </div>
            <div className="relative h-[60vh] bg-stone-50 flex items-center justify-center p-4">
              <img src={selectedProofUrl} alt="Payment Proof Screenshot" className="max-h-full max-w-full object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
