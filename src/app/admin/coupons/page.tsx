'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Tag, 
  ShieldAlert,
  Percent,
  Calendar,
  CheckCircle,
  XCircle,
  HelpCircle,
  Briefcase
} from 'lucide-react';
import { useModalStore } from '@/hooks/useModalStore';

interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  maxDiscount: number | null;
  minBookingAmt: number | null;
  usageLimit: number | null;
  usageCount: number;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  isWeekendOnly: boolean;
  isWeekdayOnly: boolean;
  applicableRoomIds: string | null;
}

interface RoomType {
  id: string;
  name: string;
}

export default function AdminCouponsPage() {
  const { showAlert, showConfirm } = useModalStore();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/v1/admin/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/v1/rooms');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.items || data.rooms || []);
        setRooms(list.map((r: any) => ({ id: r.id.toString(), name: r.name })));
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchCoupons(), fetchRooms()]).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const roomMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    rooms.forEach((rm) => {
      map[rm.id] = rm.name;
    });
    return map;
  }, [rooms]);

  const handleDelete = async (couponId: string, couponCode: string) => {
    const confirm = await showConfirm(
      'Delete Coupon',
      `Are you sure you want to delete coupon "${couponCode}"? This action cannot be undone.`
    );
    if (!confirm) return;

    try {
      const res = await fetch(`/api/v1/admin/coupons/${couponId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showAlert('Deleted', `Coupon "${couponCode}" has been successfully deleted.`, 'success');
        setCoupons((prev) => prev.filter((c) => c.id !== couponId));
      } else {
        const data = await res.json();
        showAlert('Error', data.error || 'Failed to delete coupon.', 'error');
      }
    } catch (err) {
      console.error('Error deleting coupon:', err);
      showAlert('Error', 'Failed to delete coupon due to server error.', 'error');
    }
  };

  const toggleActiveStatus = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/v1/admin/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      if (res.ok) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, isActive: !coupon.isActive } : c))
        );
      } else {
        const data = await res.json();
        showAlert('Error', data.error || 'Failed to update status.', 'error');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      showAlert('Error', 'Failed to update coupon status.', 'error');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No date constraint';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredCoupons = React.useMemo(() => {
    return coupons.filter((coupon) =>
      coupon.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [coupons, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-stone-900" style={{ fontFamily: 'Georgia, serif' }}>Discount Coupons</h1>
          <p className="text-stone-500 text-xs mt-1">Configure special promotions, weekday/weekend restrictions, and room-specific codes.</p>
        </div>
        <Link 
          href="/admin/coupons/create"
          className="flex items-center gap-2 self-start rounded-xl bg-amber-600 hover:bg-amber-700 px-6 py-3.5 text-xs font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="h-4 w-4" />
          Create New Coupon
        </Link>
      </div>

      {/* Search Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input 
            type="text" 
            placeholder="Search coupons by code name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white pl-11 pr-4 py-3 text-xs outline-none focus:border-amber-600 transition-all font-semibold"
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-stone-250 bg-white overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/50 text-[10px] font-black text-stone-450 uppercase tracking-wider">
                <th className="px-6 py-4">Promo Code</th>
                <th className="px-6 py-4">Discount Details</th>
                <th className="px-6 py-4">Rooms Applicable</th>
                <th className="px-6 py-4">Time Constraints</th>
                <th className="px-6 py-4">Usage Count</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-150 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin inline-block" />
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-stone-450">
                    <ShieldAlert className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                    <h3 className="font-bold text-stone-700">No promo coupons found</h3>
                    <p className="text-[10px] text-stone-400 mt-1">Create a new coupon to launch promo campaign.</p>
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => {
                  const isExpired = coupon.validUntil ? new Date(coupon.validUntil) < new Date() : false;
                  return (
                    <tr key={coupon.id} className={`hover:bg-stone-50/40 transition-colors group ${isExpired ? 'opacity-70 bg-red-50/10' : ''}`}>
                      <td className="px-6 py-4 font-bold">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                            <Tag className="h-4 w-4 text-amber-700" />
                          </div>
                          <div>
                            <h4 className="font-black text-stone-900 uppercase tracking-wider">{coupon.code}</h4>
                            <p className="text-[10px] text-stone-400 mt-0.5 font-bold">
                              Min Booking: ₹{Number(coupon.minBookingAmt || 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-stone-750">
                        <div className="flex items-center gap-1.5">
                          {coupon.discountType === 'PERCENTAGE' ? (
                            <>
                              <Percent className="h-3.5 w-3.5 text-blue-500" />
                              <span>{Number(coupon.discountValue)}% Off</span>
                              {coupon.maxDiscount && (
                                <span className="text-[9px] bg-stone-100 text-stone-500 rounded px-1.5 py-0.5 font-bold">Max ₹{Number(coupon.maxDiscount)}</span>
                              )}
                            </>
                          ) : (
                            <span className="font-black text-emerald-700">₹{Number(coupon.discountValue).toLocaleString('en-IN')} Flat Off</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-stone-600">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {!coupon.applicableRoomIds || coupon.applicableRoomIds === 'ALL' ? (
                            <span className="text-[9px] bg-stone-100 text-stone-600 font-bold px-2 py-0.5 rounded border border-stone-200">Global (All Rooms)</span>
                          ) : (
                            coupon.applicableRoomIds.split(',').map((id) => (
                              <span key={id} className="text-[9px] bg-amber-50 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-100 truncate max-w-[150px]">
                                {roomMap[id.trim()] || `Room ID ${id}`}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-stone-500">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-stone-400" />
                            <span>
                              {coupon.validFrom || coupon.validUntil ? (
                                `${formatDate(coupon.validFrom)} - ${formatDate(coupon.validUntil)}`
                              ) : (
                                'No expiry date'
                              )}
                            </span>
                          </div>
                          {(coupon.isWeekendOnly || coupon.isWeekdayOnly) && (
                            <div className="font-bold text-[9px] uppercase tracking-wider text-amber-700">
                              {coupon.isWeekendOnly ? '⚡ Weekends Only' : '⚡ Weekdays Only'}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-stone-700">
                        <span>{coupon.usageCount}</span>
                        {coupon.usageLimit && (
                          <span className="text-stone-400 font-semibold"> / {coupon.usageLimit} limit</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleActiveStatus(coupon)}
                          className="cursor-pointer transition-transform hover:scale-105"
                        >
                          {coupon.isActive ? (
                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full font-bold">
                              <CheckCircle className="h-3.5 w-3.5" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-500 border border-stone-200 px-2 py-1 rounded-full font-bold">
                              <XCircle className="h-3.5 w-3.5" /> Inactive
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link 
                            href={`/admin/coupons/edit/${coupon.id}`}
                            className="p-2 text-stone-500 hover:text-amber-700 hover:bg-stone-100 rounded-lg transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Link>
                          <button 
                            onClick={() => handleDelete(coupon.id, coupon.code)}
                            className="p-2 text-stone-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
