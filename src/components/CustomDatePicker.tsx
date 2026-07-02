'use client';

import { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, getDay } from 'date-fns';
import { getTodayIST, isISTToday } from '@/lib/ist';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomDatePickerProps {
  selected: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  label: string;
  badge?: string;
  availableDates?: Set<string>;
  closedDates?: Set<string>;
  onMonthChange?: (monthStr: string) => void;
  align?: 'left' | 'right';
}

export default function CustomDatePicker({
  selected,
  onChange,
  minDate = getTodayIST(),
  label,
  badge,
  availableDates,
  closedDates,
  onMonthChange,
  align = 'left',
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(selected);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get weekday offset (0 = Sunday, 1 = Monday, etc.)
  const startDayOfWeek = getDay(monthStart);
  const blankDays = Array.from({ length: startDayOfWeek }, (_, i) => i);

  const triggerMonthChange = (newMonth: Date) => {
    setCurrentMonth(newMonth);
    if (onMonthChange) {
      onMonthChange(format(newMonth, 'yyyy-MM'));
    }
  };

  const nextMonth = () => {
    const next = addMonths(currentMonth, 1);
    triggerMonthChange(next);
  };

  const prevMonth = () => {
    const prev = subMonths(currentMonth, 1);
    if (!isBefore(endOfMonth(prev), minDate)) {
      triggerMonthChange(prev);
    }
  };

  const handleDateSelect = (date: Date) => {
    onChange(date);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-amber-600" />
          {label}
        </span>
      </label>
      
      {/* Input button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border-2 border-stone-200 bg-white hover:border-amber-500 rounded-xl px-3.5 py-3 text-stone-800 font-semibold text-sm focus:outline-none transition-colors text-left flex items-center justify-between shadow-sm"
      >
        <span className="flex items-center gap-2">
          <span>{format(selected, 'dd MMM yyyy')}</span>
          {badge && (
            <span className="text-[9px] bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded-md normal-case shrink-0">
              {badge}
            </span>
          )}
        </span>
        <Calendar className="h-4 w-4 text-stone-400" />
      </button>

      {/* Calendar Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full mt-2 bg-white rounded-2xl border border-stone-200 shadow-xl p-4 z-[999] w-[min(288px,calc(100vw-2rem))] ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={prevMonth}
                disabled={isBefore(endOfMonth(subMonths(currentMonth, 1)), minDate)}
                className="p-1 hover:bg-stone-100 rounded-lg text-stone-600 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-bold text-stone-800 text-sm">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 hover:bg-stone-100 rounded-lg text-stone-600"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, idx) => (
                <span key={day} className={`text-[10px] font-bold uppercase tracking-wider ${idx === 0 || idx === 6 ? 'text-amber-600' : 'text-stone-400'}`}>
                  {day}
                </span>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* Empty offsets */}
              {blankDays.map((i) => (
                <div key={`blank-${i}`} className="h-8" />
              ))}

              {/* Day cells */}
              {days.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isPast = isBefore(day, minDate) && !isSameDay(day, minDate);
                
                // Closed if in closedDates OR if availableDates is set and doesn't contain this date
                const isClosed = closedDates?.has(dateStr) || (availableDates !== undefined && !availableDates.has(dateStr));
                
                const isDisabled = isPast || isClosed;
                const isSelected = isSameDay(day, selected);
                const isCurrentToday = isISTToday(day);
                const dayOfWeek = getDay(day);
                const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleDateSelect(day)}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                        : isClosed
                        ? 'bg-red-100 text-red-500 border border-red-200 cursor-not-allowed hover:bg-red-100'
                        : isDisabled
                        ? 'text-stone-300 cursor-not-allowed line-through'
                        : isCurrentToday
                        ? 'border border-amber-500 text-amber-700 hover:bg-amber-50'
                        : isWeekendDay
                        ? 'text-amber-600 hover:bg-stone-50'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
