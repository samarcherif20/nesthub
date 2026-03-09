// components/ui/Alert.tsx
'use client';

import { useEffect, useState } from 'react';
import { IoCheckmarkCircle, IoCloseCircle, IoInformation, IoWarning } from 'react-icons/io5';

interface AlertProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onClose?: () => void;
  autoClose?: number;
}

const icons = {
  success: <IoCheckmarkCircle className="w-5 h-5" />,
  error: <IoCloseCircle className="w-5 h-5" />,
  info: <IoInformation className="w-5 h-5" />,
  warning: <IoWarning className="w-5 h-5" />,
};

const styles = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function Alert({ type, message, onClose, autoClose = 5000 }: AlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border ${styles[type]}`}>
      <span className="shrink-0">{icons[type]}</span>
      <p className="flex-1 text-sm font-medium">{message}</p>
      {onClose && (
        <button
          onClick={() => {
            setIsVisible(false);
            onClose();
          }}
          className="shrink-0 p-1 hover:opacity-70 transition-opacity"
        >
          <IoCloseCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}