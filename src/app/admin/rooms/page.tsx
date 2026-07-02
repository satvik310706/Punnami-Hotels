'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Plus, Search, Filter, Edit3, Trash2, Eye, Copy, ChevronRight, 
  ShieldAlert, Tv, Wifi, Wind, ChevronDown, Loader2, Check 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalStore } from '@/hooks/useModalStore';

function CustomFilterSelect({ 
  value, 
  options, 
  onChange,
  placeholder
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white pl-10 pr-4 py-3 text-sm font-bold text-stone-700 cursor-pointer shadow-sm hover:border-stone-300 transition-all outline-none min-w-[150px] justify-between"
      >
        <div className="flex items-center gap-2">
          <Filter className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 shrink-0" />
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-stone-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1.5 z-50 rounded-xl border border-stone-150 bg-white p-1.5 shadow-xl min-w-[160px]">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-black cursor-pointer transition-all ${
                  opt.value === value
                    ? 'bg-amber-50 text-amber-800'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminRoomsPage() {
  const { showAlert, showConfirm } = useModalStore();
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Status toggle states
  const [selectedRoomToToggle, setSelectedRoomToToggle] = useState<any | null>(null);
  const [futureBookingsList, setFutureBookingsList] = useState<any[]>([]);
  const [isToggleModalOpen, setIsToggleModalOpen] = useState(false);
  const [togglingActiveId, setTogglingActiveId] = useState<string | null>(null);
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/admin/rooms');
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleDeleteConfirm = async () => {
    if (selectedRoomId) {
      try {
        const res = await fetch(`/api/v1/admin/rooms/${selectedRoomId}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (res.ok) {
          showAlert('Success', 'Room category deleted successfully.', 'success');
          setIsDeleteModalOpen(false);
          setSelectedRoomId(null);
          fetchRooms();
        } else {
          showAlert('Error', data.error || 'Delete failed', 'error');
        }
      } catch {
        showAlert('Error', 'Network request failed.', 'error');
      }
    }
  };

  const handleDuplicate = async (room: any) => {
    try {
      const confirmed = await showConfirm(
        'Duplicate Room variant',
        `Are you sure you want to duplicate "${room.name}"?`
      );
      if (!confirmed) return;

      const duplicatedData = {
        ...room,
        name: `${room.name} (Copy)`,
        slug: `${room.slug}-copy-${Date.now()}`,
        status: 'DRAFT',
      };

      delete duplicatedData.id;
      delete duplicatedData.createdAt;
      delete duplicatedData.updatedAt;

      const res = await fetch('/api/v1/admin/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicatedData),
      });

      const data = await res.json();
      if (res.ok) {
        showAlert('Success', 'Room duplicated successfully as draft.', 'success');
        fetchRooms();
      } else {
        showAlert('Error', data.error || 'Duplicate failed', 'error');
      }
    } catch (err) {
      showAlert('Error', 'Failed to duplicate room.', 'error');
    }
  };

  const handleToggleActive = async (room: any) => {
    if (togglingActiveId) return;
    setTogglingActiveId(room.id);
    
    if (room.isActive) {
      // Check future bookings
      try {
        const response = await fetch(`/api/v1/admin/rooms/${room.id}/future-bookings`);
        const data = await response.json();
        if (response.ok && data.length > 0) {
          setFutureBookingsList(data);
          setSelectedRoomToToggle(room);
          setIsToggleModalOpen(true);
          setTogglingActiveId(null);
        } else {
          // Inactivate directly
          await updateRoomStatus(room.id, { isActive: false });
          fetchRooms();
          setTogglingActiveId(null);
        }
      } catch {
        showAlert('Error', 'Failed to check bookings.', 'error');
        setTogglingActiveId(null);
      }
    } else {
      await updateRoomStatus(room.id, { isActive: true });
      fetchRooms();
      setTogglingActiveId(null);
    }
  };

  const handleToggleStatus = async (room: any) => {
    if (togglingStatusId) return;
    setTogglingStatusId(room.id);
    
    const newStatus = 
      room.status === 'DRAFT' ? 'PUBLISHED' :
      room.status === 'PUBLISHED' ? 'ARCHIVED' : 'DRAFT';

    if (newStatus === 'ARCHIVED' || newStatus === 'DRAFT') {
      try {
        const response = await fetch(`/api/v1/admin/rooms/${room.id}/future-bookings`);
        const data = await response.json();
        if (response.ok && data.length > 0) {
          setFutureBookingsList(data);
          setSelectedRoomToToggle({ ...room, intent: 'STATUS', newStatus });
          setIsToggleModalOpen(true);
          setTogglingStatusId(null);
          return;
        }
      } catch {
        // ignore
      }
    }

    await updateRoomStatus(room.id, { status: newStatus });
    fetchRooms();
    setTogglingStatusId(null);
  };

  const updateRoomStatus = async (id: string, payload: any) => {
    try {
      const res = await fetch(`/api/v1/admin/rooms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        showAlert('Error', data.error || 'Update failed', 'error');
      }
    } catch {
      showAlert('Error', 'Network request failed.', 'error');
    }
  };

  const handleConfirmToggleInactive = async () => {
    if (selectedRoomToToggle) {
      setIsConfirming(true);
      try {
        if (selectedRoomToToggle.intent === 'STATUS') {
          await updateRoomStatus(selectedRoomToToggle.id, { status: selectedRoomToToggle.newStatus });
        } else {
          await updateRoomStatus(selectedRoomToToggle.id, { isActive: false });
        }
        setIsToggleModalOpen(false);
        setSelectedRoomToToggle(null);
        setFutureBookingsList([]);
        fetchRooms();
      } finally {
        setIsConfirming(false);
      }
    }
  };

  // Filters logic
  let filtered = rooms.filter(r => 
    searchVal === '' || 
    r.name.toLowerCase().includes(searchVal.toLowerCase()) || 
    r.slug.toLowerCase().includes(searchVal.toLowerCase())
  );

  if (statusFilter) {
    filtered = filtered.filter(r => r.status === statusFilter);
  }

  if (featuredFilter === 'featured') {
    filtered = filtered.filter(r => r.isFeatured);
  } else if (featuredFilter === 'non-featured') {
    filtered = filtered.filter(r => !r.isFeatured);
  }

  if (sortBy === 'price-asc') {
    filtered.sort((a, b) => a.weekdayPrice - b.weekdayPrice);
  } else if (sortBy === 'price-desc') {
    filtered.sort((a, b) => b.weekdayPrice - a.weekdayPrice);
  }

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-stone-900" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Room Categories
          </h1>
          <p className="text-stone-500 mt-1">Manage and configure lodging room variants and occupancy pricing.</p>
        </div>
        <Link 
          href="/admin/rooms/create"
          className="flex items-center gap-2 self-start rounded-xl bg-amber-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" />
          Create New Room Category
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input 
            type="text" 
            placeholder="Search room categories by name or slug..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white pl-11 pr-4 py-3 text-sm outline-none focus:border-amber-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <CustomFilterSelect
            value={statusFilter}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'DRAFT', label: 'Draft' },
              { value: 'PUBLISHED', label: 'Published' },
              { value: 'ARCHIVED', label: 'Archived' }
            ]}
            onChange={setStatusFilter}
            placeholder="All Statuses"
          />
          <CustomFilterSelect
            value={featuredFilter}
            options={[
              { value: 'all', label: 'All Features' },
              { value: 'featured', label: 'Featured Only' },
              { value: 'non-featured', label: 'Non-Featured Only' },
            ]}
            onChange={setFeaturedFilter}
            placeholder="All Features"
          />
          <CustomFilterSelect
            value={sortBy}
            options={[
              { value: 'default', label: 'Sort: Default' },
              { value: 'price-asc', label: 'Sort: Price (Low to High)' },
              { value: 'price-desc', label: 'Sort: Price (High to Low)' },
            ]}
            onChange={setSortBy}
            placeholder="Sort: Default"
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50 text-xs font-bold text-stone-400 uppercase tracking-wider">
                <th className="px-6 py-4">Room Variant</th>
                <th className="px-6 py-4">Total Inventory</th>
                <th className="px-6 py-4">Weekday / Weekend Price</th>
                <th className="px-6 py-4">Active Booking</th>
                <th className="px-6 py-4">Publish State</th>
                <th className="px-6 py-4">Featured</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <span className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent inline-block" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-stone-400">
                    <ShieldAlert className="h-12 w-12 text-stone-350 mx-auto mb-4" />
                    <h3 className="font-bold text-stone-700">No room categories found</h3>
                    <p className="text-xs text-stone-400 mt-1">Try resetting filters or create a new room category.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((room) => (
                  <tr key={room.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-16 shrink-0 rounded-lg bg-stone-100 overflow-hidden border border-stone-200 relative">
                          {room.coverImageUrl ? (
                            <img src={room.coverImageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-stone-200 flex items-center justify-center text-[10px] text-stone-400 font-bold">No Image</div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-stone-900 group-hover:text-amber-600 transition-colors">{room.name}</h4>
                          <p className="text-xs text-stone-400 mt-0.5 max-w-[200px] truncate">{room.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-stone-700">{room.totalInventory} rooms</td>
                    <td className="px-6 py-4 font-semibold text-stone-700">
                      ₹{room.weekdayPrice} / ₹{room.weekendPrice}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(room)}
                        disabled={togglingActiveId === room.id}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all border cursor-pointer ${
                          room.isActive 
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                            : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        }`}
                      >
                        {togglingActiveId === room.id ? (
                          <><Loader2 className="h-3 w-3 animate-spin" /> Updating</>
                        ) : (
                          <>
                            <span className={`h-2 w-2 rounded-full ${room.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            {room.isActive ? 'Accepting Bookings' : 'Closed / Inactive'}
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        disabled={togglingStatusId === room.id}
                        onClick={() => handleToggleStatus(room)}
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold cursor-pointer ${
                          room.status === 'PUBLISHED' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : room.status === 'DRAFT'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-stone-50 text-stone-600 border-stone-200'
                        }`}
                      >
                        {togglingStatusId === room.id ? (
                          <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Updating</>
                        ) : room.status}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            const val = !room.isFeatured;
                            await updateRoomStatus(room.id, { isFeatured: val });
                            fetchRooms();
                          }}
                          className={`flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-300 ${
                            room.isFeatured ? 'bg-amber-500' : 'bg-stone-300'
                          }`}
                        >
                          <div
                            className={`h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                              room.isFeatured ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/rooms/${room.slug}`}
                          target="_blank"
                          title="View Public Page"
                          className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-all"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button 
                          onClick={() => handleDuplicate(room)}
                          title="Duplicate"
                          className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-all"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <Link 
                          href={`/admin/rooms/edit/${room.id}`}
                          title="Edit"
                          className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Link>
                        <button 
                          onClick={() => {
                            setSelectedRoomId(room.id);
                            setIsDeleteModalOpen(true);
                          }}
                          title="Delete"
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-stone-900 mb-2">Delete Room Variant</h3>
            <p className="text-sm text-stone-500 mb-6 leading-relaxed">
              Are you sure you want to delete this room category? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 border border-stone-200 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-50">Cancel</button>
              <button onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-750 text-white rounded-xl text-sm font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Future Bookings Warning Modal */}
      <AnimatePresence>
        {isToggleModalOpen && selectedRoomToToggle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm" 
              onClick={() => setIsToggleModalOpen(false)} 
            />
            
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-stone-100 overflow-hidden z-10"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500" />

              <div className="flex items-start gap-4 mb-5">
                <div className="p-3 bg-red-50 rounded-2xl text-red-600 shrink-0">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-stone-900 leading-tight">Active Future Bookings Found</h3>
                  <p className="text-xs font-semibold text-stone-500 mt-1">
                    You are trying to turn off bookings for <span className="font-bold text-stone-800">"{selectedRoomToToggle.name}"</span>. The following customers have active bookings scheduled:
                  </p>
                </div>
              </div>

              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 mb-6 max-h-40 overflow-y-auto space-y-2">
                {futureBookingsList.map((b) => (
                  <div key={b.publicId} className="flex justify-between text-xs text-stone-600 font-bold border-b border-stone-100 pb-1.5 last:border-0 last:pb-0">
                    <div>
                      <div>{b.guest_name} ({b.guest_phone})</div>
                      <div className="text-[10px] text-stone-400 font-semibold">{b.check_in} to {b.check_out}</div>
                    </div>
                    <span className="text-amber-700">{b.publicId}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setIsToggleModalOpen(false)}
                  disabled={isConfirming}
                  className="rounded-xl border border-stone-200 bg-white px-5 py-3 text-xs font-bold text-stone-700 cursor-pointer hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmToggleInactive}
                  disabled={isConfirming}
                  className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-750 text-white px-5 py-3 text-xs font-bold cursor-pointer"
                >
                  {isConfirming && <Loader2 className="h-4 w-4 animate-spin text-white" />}
                  Confirm Inactive
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
