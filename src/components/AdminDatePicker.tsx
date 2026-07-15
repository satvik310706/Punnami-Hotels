'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface AdminDatePickerProps {
  value: string; // ISO date string YYYY-MM-DD or ''
  onChange: (date: string) => void;
  /** Minimum selectable date (YYYY-MM-DD). Defaults to tomorrow. */
  minDate?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function formatDisplay(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseIso(iso: string): [number, number, number] | null {
  if (!iso) return null;
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3) return null;
  return [parts[0], parts[1] - 1, parts[2]]; // year, month (0-based), day
}

export default function AdminDatePicker({
  value,
  onChange,
  minDate,
  label,
  placeholder = 'Select date',
  disabled = false,
}: AdminDatePickerProps) {
  // tomorrow as default minimum (can't reschedule to today or past)
  const getDefaultMin = () => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return toIso(t.getFullYear(), t.getMonth(), t.getDate());
  };
  const effectiveMinIso = minDate || getDefaultMin();
  const [minY, minM, minD] = parseIso(effectiveMinIso) || [2024, 0, 1];

  const getInitialView = (): [number, number] => {
    const parsed = parseIso(value);
    if (parsed) return [parsed[0], parsed[1]];
    return [minY, minM];
  };

  const [open, setOpen] = useState(false);
  const [[viewYear, viewMonth], setView] = useState(getInitialView);
  const [openUpward, setOpenUpward] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      const parsed = parseIso(value);
      setView(parsed ? [parsed[0], parsed[1]] : [minY, minM]);
      // Determine dropdown direction
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setOpenUpward(window.innerHeight - rect.bottom < 340);
      }
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const prevMonth = () => {
    const [y, m] = viewMonth === 0 ? [viewYear - 1, 11] : [viewYear, viewMonth - 1];
    setView([y, m]);
  };
  const nextMonth = () => {
    const [y, m] = viewMonth === 11 ? [viewYear + 1, 0] : [viewYear, viewMonth + 1];
    setView([y, m]);
  };

  // Block going to months before the min
  const canGoPrev = viewYear > minY || (viewYear === minY && viewMonth > minM);

  // Build cells
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();
  const todayIso = toIso(today.getFullYear(), today.getMonth(), today.getDate());

  const isDayDisabled = (day: number): boolean => {
    const iso = toIso(viewYear, viewMonth, day);
    return iso < effectiveMinIso;
  };
  const isDaySelected = (day: number): boolean => {
    return value === toIso(viewYear, viewMonth, day);
  };
  const isDayToday = (day: number): boolean => {
    return todayIso === toIso(viewYear, viewMonth, day);
  };

  const handleDayClick = (day: number) => {
    if (isDayDisabled(day)) return;
    onChange(toIso(viewYear, viewMonth, day));
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <p className="text-xs font-black text-amber-800 mb-1.5">{label}</p>
      )}

      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        className={[
          'w-full flex items-center justify-between gap-2 px-3.5 py-2.5',
          'rounded-xl border-2 text-left text-sm font-bold transition-all select-none',
          open
            ? 'border-amber-500 bg-white ring-2 ring-amber-500/20 shadow-md'
            : 'border-stone-200 bg-white hover:border-amber-400 shadow-sm',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        <span className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-amber-600 shrink-0" />
          <span className={value ? 'text-stone-800' : 'text-stone-400 font-semibold'}>
            {value ? formatDisplay(value) : placeholder}
          </span>
        </span>
        <ChevronRight className={`h-4 w-4 text-stone-400 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
      </button>

      {/* Dropdown calendar */}
      {open && (
        <>
          {/* Backdrop overlay for mobile viewport */}
          <div
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[9980] sm:hidden"
            onClick={() => setOpen(false)}
          />
          <div
            className={[
              'fixed inset-x-4 top-1/2 -translate-y-1/2 sm:absolute sm:inset-x-auto sm:translate-y-0 sm:w-72 bg-white rounded-2xl overflow-hidden',
              'border border-stone-200 z-[9999]',
              openUpward ? 'sm:bottom-full sm:mb-2' : 'sm:top-full sm:mt-2',
              'sm:left-0',
            ].join(' ')}
            style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)' }}
          >
          {/* Month navigation */}
          <div className="flex items-center justify-between px-4 py-3 bg-stone-900 text-white select-none">
            <button
              type="button"
              onClick={prevMonth}
              disabled={!canGoPrev}
              className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-black tracking-wide">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 bg-stone-50 border-b border-stone-100">
            {DAYS.map(d => (
              <div key={d} className="py-2 text-center text-[9px] font-black text-stone-400 uppercase tracking-widest">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-px p-2.5">
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />;
              const disabled2 = isDayDisabled(day);
              const selected = isDaySelected(day);
              const isT = isDayToday(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  disabled={disabled2}
                  className={[
                    'h-8 w-full flex items-center justify-center rounded-lg text-xs font-bold transition-all',
                    selected
                      ? 'bg-amber-600 text-white shadow-md scale-105'
                      : disabled2
                        ? 'text-stone-300 cursor-not-allowed'
                        : isT
                          ? 'text-stone-500 line-through cursor-not-allowed opacity-60'
                          : 'text-stone-700 hover:bg-amber-50 hover:text-amber-800 cursor-pointer',
                  ].join(' ')}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-100">
            <p className="text-[10px] font-bold text-amber-700 text-center">
              New check-in must be tomorrow or later
            </p>
          </div>
        </div>
      </>
    )}
  </div>
);
}
