import { create } from 'zustand';

interface ModalState {
  isOpen: boolean;
  type: 'info' | 'success' | 'error' | 'confirm';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  showAlert: (title: string, message: string, type?: 'info' | 'success' | 'error') => Promise<void>;
  showConfirm: (title: string, message: string, options?: { confirmText?: string; cancelText?: string }) => Promise<boolean>;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set, get) => {
  let resolvePromise: (value: boolean) => void;

  return {
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',

    showAlert: (title, message, type = 'info') => {
      set({
        isOpen: true,
        type,
        title,
        message,
        confirmText: 'OK',
        onConfirm: () => {
          get().closeModal();
          if (resolvePromise) resolvePromise(true);
        },
        onCancel: undefined,
      });
      return new Promise<void>((resolve) => {
        resolvePromise = () => resolve();
      });
    },

    showConfirm: (title, message, options = {}) => {
      set({
        isOpen: true,
        type: 'confirm',
        title,
        message,
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        onConfirm: () => {
          get().closeModal();
          resolvePromise(true);
        },
        onCancel: () => {
          get().closeModal();
          resolvePromise(false);
        },
      });
      return new Promise<boolean>((resolve) => {
        resolvePromise = resolve;
      });
    },

    closeModal: () => {
      set({ isOpen: false });
    },
  };
});
