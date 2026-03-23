'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCheckmarkCircle, IoCloseCircle, IoInformation, IoWarning } from 'react-icons/io5';

interface AlertProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onClose?: () => void;
  autoClose?: number;
}

const CFG = {
  success: {
    grad:    'from-emerald-500 to-green-600',
    icon:    IoCheckmarkCircle,
    title:   'Succès',
  },
  error: {
    grad:    'from-red-500 to-rose-600',
    icon:    IoCloseCircle,
    title:   'Erreur',
  },
  info: {
    grad:    'from-blue-500 to-indigo-600',
    icon:    IoInformation,
    title:   'Information',
  },
  warning: {
    grad:    'from-amber-500 to-orange-500',
    icon:    IoWarning,
    title:   'Attention',
  },
};

export default function Alert({ type, message, onClose, autoClose = 5000 }: AlertProps) {
  const [visible, setVisible] = useState(true);
  const { grad, icon: Icon, title } = CFG[type];

  useEffect(() => {
    if (!autoClose) return;
    const t = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, autoClose);
    return () => clearTimeout(t);
  }, [autoClose, onClose]);

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0,   scale: 1     }}
          exit={{    opacity: 0, y: -20,  scale: 0.92  }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        >
          <div className={`bg-gradient-to-r ${grad} text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 border border-white/20`}>
            {/* Icon circle */}
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-white" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-white/90 truncate">{message}</p>
            </div>

            {/* Close */}
            {onClose && (
              <button
                onClick={handleClose}
                className="w-8 h-8 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
              >
                <IoCloseCircle className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}