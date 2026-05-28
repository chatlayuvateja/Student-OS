import React from 'react';
import { motion } from 'framer-motion';
import Modal from './Modal';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  children,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        {message && (
          <p className="text-gray-600 leading-relaxed">{message}</p>
        )}
        {children}

        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all duration-200"
          >
            {cancelText}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`px-5 py-2.5 rounded-xl font-medium text-white transition-all duration-200 hover-lift ${
              variant === 'danger'
                ? 'bg-red-500 hover:bg-red-600'
                : variant === 'warning'
                ? 'bg-amber-500 hover:bg-amber-600'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
