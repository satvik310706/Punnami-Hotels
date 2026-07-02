'use client';

import { useModalStore } from '@/hooks/useModalStore';
import { ShieldAlert, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalModal() {
  const { isOpen, type, title, message, confirmText, cancelText, onConfirm, onCancel } = useModalStore();

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-10 w-10 text-emerald-500 animate-bounce" />;
      case 'error':
        return <AlertTriangle className="h-10 w-10 text-red-500 animate-pulse" />;
      case 'confirm':
        return <ShieldAlert className="h-10 w-10 text-amber-500 animate-pulse" />;
      default:
        return <Info className="h-10 w-10 text-blue-500" />;
    }
  };

  const getThemeClasses = () => {
    switch (type) {
      case 'success':
        return {
          border: 'border-emerald-500/20',
          button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        };
      case 'error':
        return {
          border: 'border-red-500/20',
          button: 'bg-red-600 hover:bg-red-700 text-white',
        };
      case 'confirm':
        return {
          border: 'border-amber-500/20',
          button: 'bg-amber-600 hover:bg-amber-700 text-white',
        };
      default:
        return {
          border: 'border-stone-200',
          button: 'bg-stone-900 hover:bg-stone-800 text-white',
        };
    }
  };

  const theme = getThemeClasses();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel || onConfirm}
            className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={`relative w-full max-w-sm rounded-3xl bg-white border ${theme.border} p-6 shadow-2xl overflow-hidden`}
          >
            {/* Close icon */}
            <button
              onClick={onCancel || onConfirm}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              {/* Icon Container */}
              <div className="mb-4 p-3 rounded-full bg-stone-50 border border-stone-100">
                {getIcon()}
              </div>

              {/* Title */}
              <h3 className="text-lg font-black text-stone-900 leading-tight mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                {title}
              </h3>

              {/* Message */}
              <p className="text-sm font-semibold text-stone-500 leading-relaxed mb-6 whitespace-pre-line">
                {message}
              </p>

              {/* Actions */}
              <div className="flex w-full gap-3">
                {type === 'confirm' && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 rounded-2xl border-2 border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold py-3 text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {cancelText}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onConfirm}
                  className={`flex-1 rounded-2xl ${theme.button} font-bold py-3 text-xs uppercase tracking-wider shadow-md transition-colors cursor-pointer`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
