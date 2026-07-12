'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomSelect from '@/components/CustomSelect';
import { 
  Save, ArrowLeft, Info, Plus, Trash2, Sliders, Eye, 
  HelpCircle, ShieldCheck, BedDouble, ChevronDown, Clock,
  Image as ImageIcon, AlertTriangle, X, Loader2, Sparkles, Check 
} from 'lucide-react';
import { useModalStore } from '@/hooks/useModalStore';

interface RoomFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

// Time helper — strips seconds from "HH:MM:SS" to get "HH:MM" for <input type="time">
const timeToInputFormat = (timeStr: string) => {
  if (!timeStr) return '';
  return timeStr.slice(0, 5);
};

const PRESET_FACILITIES = [
  'Wi-Fi',
  'Air Conditioning',
  '24/7 Hot Water',
  'Smart TV',
  'In-Room Dining',
  'Room Service',
  'Free Parking',
  'Meals',
  'Swimming Pool',
  'Gym / Fitness',
  'Laundry Service',
  'Doctor on Call',
];

export default function RoomForm({ initialData, onSubmit, isLoading }: RoomFormProps) {
  const router = useRouter();
  const { showAlert } = useModalStore();
  const [activeTab, setActiveTab] = useState<'basic' | 'slots' | 'amenities' | 'media' | 'faq-policy'>('basic');

  // Form fields state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [weekdayPrice, setWeekdayPrice] = useState('0');
  const [weekendPrice, setWeekendPrice] = useState('0');
  const [capacityPerRoom, setCapacityPerRoom] = useState(2);
  const [maxAdults, setMaxAdults] = useState(2);
  const [maxChildren, setMaxChildren] = useState(0);
  const [totalInventory, setTotalInventory] = useState(5);
  const [orderPriority, setOrderPriority] = useState(0);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [status, setStatus] = useState('DRAFT');

  // Booking slots (multiple timeslots — like ts-tours)
  const [bookingSlots, setBookingSlots] = useState<{ title: string; slotStart: string; slotEnd: string; totalRooms?: number; priceWeekday?: number | null; priceWeekend?: number | null }[]>([]);

  // Facilities, highlights, FAQs, policies
  const [facilities, setFacilities] = useState<string[]>([]);
  const [customFacilityInput, setCustomFacilityInput] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);

  // Local helper states
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [isDragOverCover, setIsDragOverCover] = useState(false);
  const [isDragOverGallery, setIsDragOverGallery] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setSlug(initialData.slug || '');
      setDescription(initialData.description || '');
      setWeekdayPrice(String(initialData.weekdayPrice || '0'));
      setWeekendPrice(String(initialData.weekendPrice || '0'));
      setCapacityPerRoom(initialData.capacityPerRoom || 2);
      setMaxAdults(initialData.maxAdults || 2);
      setMaxChildren(initialData.maxChildren || 0);
      setTotalInventory(initialData.totalInventory || 1);
      setOrderPriority(initialData.orderPriority || 0);
      setIsFeatured(initialData.isFeatured || false);
      setIsActive(initialData.isActive !== false);
      setStatus(initialData.status || 'DRAFT');
      setFacilities(initialData.facilities || []);
      setCoverImageUrl(initialData.coverImageUrl || '');
      setGalleryImages(initialData.galleryImages || []);
      setHighlights(initialData.highlights || []);
      setFaqs(initialData.faqs || []);
      setPolicies(initialData.policies || []);
      // Load booking slots — support both camelCase and snake_case from API
      const rawSlots = initialData.bookingSlots || initialData.booking_slots || [];
      setBookingSlots(
        rawSlots.map((s: any) => ({
          title: s.title || '',
          slotStart: s.slotStart || s.slot_start || '12:00:00',
          slotEnd: s.slotEnd || s.slot_end || '11:00:00',
          totalRooms: s.totalRooms || s.total_rooms || initialData.totalInventory || 5,
          priceWeekday: s.priceWeekday !== undefined ? s.priceWeekday : (s.price_weekday !== undefined ? s.price_weekday : null),
          priceWeekend: s.priceWeekend !== undefined ? s.priceWeekend : (s.price_weekend !== undefined ? s.price_weekend : null),
        }))
      );
    }
  }, [initialData]);

  // Handle name change -> auto slug helper
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!initialData) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      );
    }
  };

  // Multi-file Upload helper supporting drag-and-drop and input sources
  const uploadFiles = async (files: FileList | File[], isGallery = false) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    if (isGallery) setUploadingGallery(true);
    else setUploadingCover(true);

    try {
      const uploadTargets = isGallery ? fileArray : [fileArray[0]];
      const uploadPromises = uploadTargets.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'rooms');

        const res = await fetch('/api/v1/admin/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.url) {
          return data.url as string;
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      });

      const urls = await Promise.all(uploadPromises);
      if (isGallery) {
        setGalleryImages((prev) => [...prev, ...urls]);
      } else if (urls.length > 0) {
        setCoverImageUrl(urls[0]);
      }
    } catch (err: any) {
      showAlert('Upload Failed', err.message || 'Failed to upload one or more images.', 'error');
    } finally {
      setUploadingGallery(false);
      setUploadingCover(false);
    }
  };

  const handleDragOver = (e: React.DragEvent, isGallery = false) => {
    e.preventDefault();
    if (isGallery) setIsDragOverGallery(true);
    else setIsDragOverCover(true);
  };

  const handleDragLeave = (isGallery = false) => {
    if (isGallery) setIsDragOverGallery(false);
    else setIsDragOverCover(false);
  };

  const handleDrop = async (e: React.DragEvent, isGallery = false) => {
    e.preventDefault();
    if (isGallery) setIsDragOverGallery(false);
    else setIsDragOverCover(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadFiles(files, isGallery);
    }
  };

  const removeGalleryImage = (idx: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // Booking Slot handlers
  const addBookingSlot = () => {
    setBookingSlots((prev) => [...prev, { title: '', slotStart: '12:00', slotEnd: '11:00', totalRooms: totalInventory || 5, priceWeekday: null, priceWeekend: null }]);
  };
  const updateBookingSlot = (idx: number, key: string, val: any) => {
    setBookingSlots((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [key]: val } : s))
    );
  };
  const removeBookingSlot = (idx: number) => {
    setBookingSlots((prev) => prev.filter((_, i) => i !== idx));
  };

  // Facilities
  const toggleFacility = (facility: string) => {
    setFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    );
  };
  const addCustomFacility = () => {
    const trimmed = customFacilityInput.trim();
    if (!trimmed) return;
    if (!facilities.includes(trimmed)) {
      setFacilities((prev) => [...prev, trimmed]);
    }
    setCustomFacilityInput('');
  };

  // Highlights Add/Delete
  const addHighlight = () => {
    setHighlights((prev) => [...prev, { title: '', icon: '✨' }]);
  };
  const updateHighlight = (idx: number, key: string, val: string) => {
    setHighlights((prev) =>
      prev.map((h, i) => (i === idx ? { ...h, [key]: val } : h))
    );
  };
  const removeHighlight = (idx: number) => {
    setHighlights((prev) => prev.filter((_, i) => i !== idx));
  };

  // FAQs Add/Delete
  const addFaq = () => {
    setFaqs((prev) => [...prev, { question: '', answer: '' }]);
  };
  const updateFaq = (idx: number, key: string, val: string) => {
    setFaqs((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, [key]: val } : f))
    );
  };
  const removeFaq = (idx: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== idx));
  };

  // Policies Add/Delete
  const addPolicy = () => {
    setPolicies((prev) => [...prev, { title: '', description: '' }]);
  };
  const updatePolicy = (idx: number, key: string, val: string) => {
    setPolicies((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [key]: val } : p))
    );
  };
  const removePolicy = (idx: number) => {
    setPolicies((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    onSubmit({
      name,
      slug,
      description,
      weekdayPrice,
      weekendPrice,
      capacityPerRoom,
      maxAdults,
      maxChildren,
      totalInventory,
      orderPriority,
      isFeatured,
      isActive,
      status,
      facilities,
      coverImageUrl,
      galleryImages,
      highlights,
      faqs,
      policies,
      // Persist booking slots with consistent camelCase
      bookingSlots: bookingSlots.map((s: any) => ({
        title: s.title,
        slotStart: s.slotStart.length === 5 ? s.slotStart + ':00' : s.slotStart,
        slotEnd: s.slotEnd.length === 5 ? s.slotEnd + ':00' : s.slotEnd,
        totalRooms: Number(s.totalRooms || totalInventory || 5),
        priceWeekday: s.priceWeekday !== undefined && s.priceWeekday !== null ? Number(s.priceWeekday) : null,
        priceWeekend: s.priceWeekend !== undefined && s.priceWeekend !== null ? Number(s.priceWeekend) : null,
      })),
    });
  };

  const tabs = [
    { id: 'basic', label: 'Basic Details', icon: Sliders },
    { id: 'slots', label: 'Time Slots', icon: Clock },
    { id: 'amenities', label: 'Amenities', icon: BedDouble },
    { id: 'media', label: 'Media', icon: ImageIcon },
    { id: 'faq-policy', label: 'FAQs & Policies', icon: HelpCircle },
  ];

  return (
    <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xl max-w-5xl mx-auto">
      {/* Top Banner Header */}
      <div className="bg-stone-900 px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-800">
        <div>
          <button 
            onClick={() => router.push('/admin/rooms')}
            className="flex items-center gap-1.5 text-xs text-amber-500 font-bold uppercase tracking-wider mb-2 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to List
          </button>
          <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Georgia, serif' }}>
            {initialData ? `Edit "${name}"` : 'Create New Room Category'}
          </h2>
          <p className="text-xs text-stone-400 mt-1">Configure variant descriptions, amenities checklists, time slots, and pricing rules.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-md"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Room
        </button>
      </div>

      {/* Tabs list navigation */}
      <div className="flex border-b border-stone-200 bg-stone-50 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-4 text-xs font-bold uppercase tracking-wider border-b-2 shrink-0 transition-colors ${
              activeTab === tab.id
                ? 'border-amber-600 text-amber-700 bg-white font-black'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <tab.icon className="h-4 w-4 shrink-0" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Forms body */}
      <div className="p-8 space-y-8 min-h-[50vh]">
        {/* TAB 1: BASIC DETAILS */}
        {activeTab === 'basic' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">Variant Name *</label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Luxury Suite"
                className="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">Custom Slug *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. luxury-suite"
                className="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors tracking-wider"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Write an elegant description for this room category..."
                className="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div className="hidden">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">Weekday Price (₹) *</label>
              <input
                type="number"
                value={weekdayPrice}
                onChange={(e) => setWeekdayPrice(e.target.value)}
                className="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors font-bold text-stone-900"
              />
            </div>
            <div className="hidden">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">Weekend Price (₹) *</label>
              <input
                type="number"
                value={weekendPrice}
                onChange={(e) => setWeekendPrice(e.target.value)}
                className="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors font-bold text-stone-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">Total Rooms Available *</label>
              <input
                type="number"
                value={totalInventory}
                onChange={(e) => setTotalInventory(parseInt(e.target.value) || 1)}
                className="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors font-bold text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">Capacity Per Room</label>
              <input
                type="number"
                value={capacityPerRoom}
                onChange={(e) => setCapacityPerRoom(parseInt(e.target.value) || 2)}
                className="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">Max Adults Allowed</label>
              <input
                type="number"
                value={maxAdults}
                onChange={(e) => setMaxAdults(parseInt(e.target.value) || 2)}
                className="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">Max Children Allowed</label>
              <input
                type="number"
                value={maxChildren}
                onChange={(e) => setMaxChildren(parseInt(e.target.value) || 0)}
                className="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">Order Priority</label>
              <input
                type="number"
                value={orderPriority}
                onChange={(e) => setOrderPriority(parseInt(e.target.value) || 0)}
                className="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">Publish Status</label>
              <CustomSelect
                label=""
                value={status}
                onChange={(val) => setStatus(val)}
                options={[
                  { value: 'DRAFT', label: 'Draft' },
                  { value: 'PUBLISHED', label: 'Published' },
                  { value: 'ARCHIVED', label: 'Archived' },
                ]}
              />
            </div>
            <div className="flex flex-col justify-center space-y-2 mt-4 pl-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="isFeatured" className="text-sm font-bold text-stone-700 cursor-pointer select-none flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Featured Room
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded text-green-600 focus:ring-green-500 cursor-pointer"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-stone-700 cursor-pointer select-none">
                  Available for Bookings
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TIME SLOTS */}
        {activeTab === 'slots' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-sm font-black text-stone-900 uppercase tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>
                  Booking Time Slots
                </h3>
                <p className="text-xs text-stone-400 font-semibold mt-1">
                  Add multiple timeslots guests can choose from when booking this room (e.g. Day Session, Night Stay, 24hr Stay).
                  These slots appear in the booking widget on the room detail page.
                </p>
              </div>
              <button
                type="button"
                onClick={addBookingSlot}
                className="flex items-center gap-2 rounded-xl bg-stone-900 hover:bg-stone-800 px-4 py-2.5 text-xs font-black text-white shadow-md transition-all uppercase tracking-wider"
              >
                <Plus className="h-3.5 w-3.5" /> Add Time Slot
              </button>
            </div>

            {bookingSlots.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
                <Clock className="h-8 w-8 text-stone-300 mx-auto mb-3" />
                <p className="text-xs font-bold text-stone-400">
                  No custom time slots configured.
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  Click "Add Time Slot" to define check-in/check-out windows (e.g., Day Session: 10 AM – 6 PM).
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {bookingSlots.map((slot, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-5 bg-stone-50 border border-stone-200 rounded-2xl group"
                  >
                    <div className="grid gap-4 sm:grid-cols-6 flex-1">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                          Slot Name / Title *
                        </label>
                        <input
                          type="text"
                          value={slot.title}
                          onChange={(e) => updateBookingSlot(index, 'title', e.target.value)}
                          placeholder="e.g. Night Stay"
                          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-amber-500 text-stone-700 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                          Check-In Time *
                        </label>
                        <input
                          type="time"
                          value={timeToInputFormat(slot.slotStart)}
                          onChange={(e) =>
                            updateBookingSlot(index, 'slotStart', e.target.value || '12:00')
                          }
                          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-amber-500 text-stone-700 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                          Check-Out Time *
                        </label>
                        <input
                          type="time"
                          value={timeToInputFormat(slot.slotEnd)}
                          onChange={(e) =>
                            updateBookingSlot(index, 'slotEnd', e.target.value || '11:00')
                          }
                          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-amber-500 text-stone-700 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                          Rooms Capacity *
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={slot.totalRooms}
                          onChange={(e) =>
                            updateBookingSlot(index, 'totalRooms', parseInt(e.target.value) || 1)
                          }
                          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-amber-500 text-stone-700 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                          Weekday Cost (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          placeholder="Default room price"
                          value={slot.priceWeekday ?? ''}
                          onChange={(e) =>
                            updateBookingSlot(index, 'priceWeekday', e.target.value ? parseFloat(e.target.value) : null)
                          }
                          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-amber-500 text-stone-700 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                          Weekend Cost (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          placeholder="Default room price"
                          value={slot.priceWeekend ?? ''}
                          onChange={(e) =>
                            updateBookingSlot(index, 'priceWeekend', e.target.value ? parseFloat(e.target.value) : null)
                          }
                          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-amber-500 text-stone-700 transition-colors"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBookingSlot(index)}
                      className="p-2.5 border border-stone-200 hover:border-red-200 bg-white rounded-xl text-stone-400 hover:text-red-500 shrink-0 mt-6 shadow-sm transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {bookingSlots.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-amber-800">
                  <span className="font-black">💡 Tip:</span> Guests will see all these slots in the booking panel on the room page and can choose their preferred check-in window.
                  Each slot can have its own inventory managed in the Inventory admin panel.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AMENITIES & HIGHLIGHTS */}
        {activeTab === 'amenities' && (
          <div className="space-y-8">
            {/* Preset facilities */}
            <div>
              <h3 className="text-base font-bold text-stone-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                Preset Room Facilities
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {PRESET_FACILITIES.map((facility) => {
                  const hasFacility = facilities.includes(facility);
                  return (
                    <button
                      key={facility}
                      type="button"
                      onClick={() => toggleFacility(facility)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold text-left transition-all ${
                        hasFacility
                          ? 'border-amber-600 bg-amber-50/50 text-amber-700'
                          : 'border-stone-200 bg-white hover:border-stone-400 text-stone-600'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                        hasFacility ? 'bg-amber-600 border-amber-600 text-white' : 'border-stone-300'
                      }`}>
                        {hasFacility && <Check className="h-3 w-3" />}
                      </div>
                      {facility}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom facility input */}
            <div className="border-t border-stone-100 pt-6">
              <h3 className="text-sm font-black text-stone-900 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                Add Custom Facility
              </h3>
              <p className="text-xs text-stone-400 mb-3">Type any facility not in the preset list and click Add.</p>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <input
                    type="text"
                    value={customFacilityInput}
                    onChange={(e) => setCustomFacilityInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomFacility(); }}}
                    placeholder="e.g. Rooftop View, River-facing Balcony, Bonfire Area..."
                    className="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={addCustomFacility}
                  disabled={!customFacilityInput.trim()}
                  className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 py-3 rounded-xl text-sm transition-all"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>

              {/* All selected facilities list (preset + custom) */}
              {facilities.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Selected Facilities:</p>
                  <div className="flex flex-wrap gap-2">
                    {facilities.map((f) => (
                      <span
                        key={f}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold"
                      >
                        {f}
                        <button
                          type="button"
                          onClick={() => setFacilities(facilities.filter((x) => x !== f))}
                          className="text-amber-600 hover:text-red-500 transition-colors ml-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Custom Highlights */}
            <div>
              <div className="flex items-center justify-between mb-4 border-t border-stone-100 pt-6">
                <h3 className="text-base font-bold text-stone-900" style={{ fontFamily: 'Georgia, serif' }}>
                  Custom Variant Highlights
                </h3>
                <button
                  type="button"
                  onClick={addHighlight}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Highlight
                </button>
              </div>

              {highlights.length === 0 ? (
                <p className="text-stone-400 text-xs py-4 text-center border border-dashed border-stone-200 rounded-2xl">
                  No custom highlights added. (e.g. "King Size Bed", "Balcony View")
                </p>
              ) : (
                <div className="space-y-3">
                  {highlights.map((h, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-stone-50 border border-stone-200 rounded-xl p-3">
                      <input
                        type="text"
                        value={h.icon || '✨'}
                        placeholder="Icon (Emoji)"
                        onChange={(e) => updateHighlight(idx, 'icon', e.target.value)}
                        className="w-16 text-center border border-stone-200 rounded-lg p-2 text-sm bg-white"
                      />
                      <input
                        type="text"
                        value={h.title || ''}
                        placeholder="Highlight Title (e.g. King Bed)"
                        onChange={(e) => updateHighlight(idx, 'title', e.target.value)}
                        className="flex-1 border border-stone-200 rounded-lg p-2 text-sm bg-white font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => removeHighlight(idx)}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MEDIA GALLERY */}
        {activeTab === 'media' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">Cover Image URL *</label>
                <input
                  type="text"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="Paste cover image link or upload below"
                  className="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div className="flex flex-col justify-end">
                <div
                  onDragOver={(e) => handleDragOver(e, false)}
                  onDragLeave={() => handleDragLeave(false)}
                  onDrop={(e) => handleDrop(e, false)}
                  className={`border-2 border-dashed rounded-xl p-0.5 transition-all ${
                    isDragOverCover ? 'border-amber-500 bg-amber-50/50 shadow-md shadow-amber-600/10' : 'border-transparent'
                  }`}
                >
                  <label className="w-full bg-stone-900 hover:bg-stone-850 text-white text-xs font-bold uppercase tracking-wider rounded-xl py-3 px-4 text-center cursor-pointer shadow-md transition-colors flex items-center justify-center gap-1.5">
                    {uploadingCover ? (
                      <><Loader2 className="h-4 w-4 animate-spin text-white" /> Uploading...</>
                    ) : (
                      <>Upload Cover Image</>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingCover}
                      onChange={async (e) => {
                        if (e.target.files) {
                          await uploadFiles(e.target.files, false);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {coverImageUrl && (
                <div className="sm:col-span-3 border border-stone-200 rounded-2xl overflow-hidden max-w-sm relative">
                  <button
                    type="button"
                    onClick={() => setCoverImageUrl('')}
                    className="absolute top-2 right-2 bg-red-650 text-white rounded-full p-1 shadow-md hover:bg-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <img src={coverImageUrl} alt="Cover Preview" className="w-full h-48 object-cover" />
                </div>
              )}
            </div>

            <div className="border-t border-stone-150 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-stone-900" style={{ fontFamily: 'Georgia, serif' }}>
                  Gallery Images Slideshow
                </h3>
              </div>

              {/* Drag and Drop Zone for Gallery */}
              <div
                onDragOver={(e) => handleDragOver(e, true)}
                onDragLeave={() => handleDragLeave(true)}
                onDrop={(e) => handleDrop(e, true)}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all ${
                  isDragOverGallery
                    ? 'border-amber-500 bg-amber-50/50'
                    : 'border-stone-300 bg-stone-50 hover:bg-stone-100/50'
                }`}
              >
                <div className="text-center space-y-3">
                  <div className="text-stone-500 font-bold text-sm">
                    Drag & Drop multiple images here, or
                  </div>
                  <label className="inline-block bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl py-2.5 px-6 text-center cursor-pointer shadow-md transition-all">
                    {uploadingGallery ? (
                      <span className="flex items-center gap-1.5 justify-center">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-white" /> Uploading...
                      </span>
                    ) : (
                      <span>Browse Files</span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={uploadingGallery}
                      onChange={async (e) => {
                        if (e.target.files) {
                          await uploadFiles(e.target.files, true);
                        }
                      }}
                    />
                  </label>
                  <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                    Select multiple JPG, PNG, WebP up to 10MB each
                  </p>
                </div>
              </div>

              {galleryImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                  {galleryImages.map((img, idx) => (
                    <div key={idx} className="relative rounded-2xl overflow-hidden border border-stone-250 aspect-video bg-stone-50 group shadow-sm">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(idx)}
                        className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-650"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: FAQS & POLICIES */}
        {activeTab === 'faq-policy' && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-stone-900" style={{ fontFamily: 'Georgia, serif' }}>
                  Frequently Asked Questions (FAQ)
                </h3>
                <button
                  type="button"
                  onClick={addFaq}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" /> Add FAQ
                </button>
              </div>

              {faqs.length === 0 ? (
                <p className="text-stone-400 text-xs py-4 text-center border border-dashed border-stone-200 rounded-2xl">
                  No FAQs added for this room variant.
                </p>
              ) : (
                <div className="space-y-4">
                  {faqs.map((f, idx) => (
                    <div key={idx} className="bg-stone-50 border border-stone-200 rounded-2xl p-4 relative space-y-3">
                      <button
                        type="button"
                        onClick={() => removeFaq(idx)}
                        className="absolute top-4 right-4 text-stone-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="pr-10">
                        <label className="block text-[10px] font-bold text-stone-450 uppercase mb-1">Question</label>
                        <input
                          type="text"
                          value={f.question || ''}
                          placeholder="e.g. Is there a hot tub?"
                          onChange={(e) => updateFaq(idx, 'question', e.target.value)}
                          className="w-full border border-stone-200 rounded-lg p-2 text-sm bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-450 uppercase mb-1">Answer</label>
                        <textarea
                          value={f.answer || ''}
                          rows={2}
                          placeholder="Answer here..."
                          onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                          className="w-full border border-stone-200 rounded-lg p-2 text-sm bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-stone-150 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-stone-900" style={{ fontFamily: 'Georgia, serif' }}>
                  Variant Policies
                </h3>
                <button
                  type="button"
                  onClick={addPolicy}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Policy
                </button>
              </div>

              {policies.length === 0 ? (
                <p className="text-stone-400 text-xs py-4 text-center border border-dashed border-stone-200 rounded-2xl">
                  No policies custom defined. Will inherit global hotel policies.
                </p>
              ) : (
                <div className="space-y-4">
                  {policies.map((p, idx) => (
                    <div key={idx} className="bg-stone-50 border border-stone-200 rounded-2xl p-4 relative space-y-3">
                      <button
                        type="button"
                        onClick={() => removePolicy(idx)}
                        className="absolute top-4 right-4 text-stone-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="pr-10">
                        <label className="block text-[10px] font-bold text-stone-450 uppercase mb-1">Policy Title</label>
                        <input
                          type="text"
                          value={p.title || ''}
                          placeholder="e.g. Smoke Policy"
                          onChange={(e) => updatePolicy(idx, 'title', e.target.value)}
                          className="w-full border border-stone-200 rounded-lg p-2 text-sm bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-450 uppercase mb-1">Description</label>
                        <textarea
                          value={p.description || ''}
                          rows={2}
                          placeholder="Policy description rules..."
                          onChange={(e) => updatePolicy(idx, 'description', e.target.value)}
                          className="w-full border border-stone-200 rounded-lg p-2 text-sm bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
