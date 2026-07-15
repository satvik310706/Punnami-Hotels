'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Option {
  value: string | number;
  label: string;
}

interface AdminSelectProps {
  value: string | number | null | undefined;
  onChange: (value: any) => void;
  options: Option[];
  label?: string;
  placeholder?: string;
  isSearchable?: boolean;
  disabled?: boolean;
}

export default function AdminSelect({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select an option',
  isSearchable = false,
  disabled = false,
}: AdminSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const safeOptions = Array.isArray(options) ? options : [];
  const selectedOption = safeOptions.find((opt) => String(opt.value) === String(value));

  const filteredOptions = safeOptions.filter(opt =>
    (opt.label || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={[
          'w-full flex items-center justify-between gap-2 px-4 py-3.5',
          'rounded-2xl border text-left text-sm font-semibold transition-all select-none',
          disabled
            ? 'bg-stone-50 border-stone-100 text-stone-400 cursor-not-allowed'
            : isOpen
            ? 'border-amber-500 bg-white ring-2 ring-amber-500/20 shadow-md'
            : 'border-stone-200 bg-white hover:border-amber-500 shadow-sm',
        ].join(' ')}
      >
        <span className={!selectedOption ? 'text-stone-400 font-medium' : 'text-stone-800 font-bold'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`h-4.5 w-4.5 text-stone-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-amber-600' : ''}`} />
      </button>

      {/* Dropdown Popover */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-stone-200 shadow-2xl p-2 z-[999] max-h-[300px] flex flex-col overflow-hidden"
          >
            {/* Search Input */}
            {isSearchable && (
              <div className="relative mb-2 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 rounded-xl border border-stone-200 bg-stone-50/50 pl-9 pr-3 text-xs font-semibold outline-none focus:border-amber-500 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-all"
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              </div>
            )}

            {/* Options List */}
            <div className="overflow-y-auto flex-1">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-8 text-xs text-stone-400 text-center font-medium">
                  No results found
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = String(opt.value) === String(value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={[
                        'w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all text-left mb-1 last:mb-0 cursor-pointer',
                        isSelected
                          ? 'bg-amber-50 text-amber-800'
                          : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900',
                      ].join(' ')}
                    >
                      <span className="truncate pr-2">{opt.label}</span>
                      {isSelected && <Check className="h-4 w-4 text-amber-700 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
