"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoCheckmarkCircle,
  IoCloseCircle,
  IoInformation,
  IoWarning,
} from "react-icons/io5";

interface AlertProps {
  type: "success" | "error" | "info" | "warning";
  message: string;
  onClose?: () => void;
  autoClose?: number;
}

const CFG = {
  success: {
    icon: IoCheckmarkCircle,
    title: "Succès",
    light: "bg-green-50 border-green-500 text-green-800",
    dark: "dark:bg-green-950 dark:border-green-500 dark:text-green-300",
    iconLight: "bg-green-100 text-green-600",
    iconDark: "dark:bg-green-900 dark:text-green-400",
    barLight: "bg-green-500",
    barDark: "dark:bg-green-400",
  },
  error: {
    icon: IoCloseCircle,
    title: "Erreur",
    light: "bg-red-50 border-red-500 text-red-800",
    dark: "dark:bg-red-950 dark:border-red-500 dark:text-red-300",
    iconLight: "bg-red-100 text-red-600",
    iconDark: "dark:bg-red-900 dark:text-red-400",
    barLight: "bg-red-500",
    barDark: "dark:bg-red-400",
  },
  info: {
    icon: IoInformation,
    title: "Information",
    light: "bg-blue-50 border-blue-500 text-blue-800",
    dark: "dark:bg-blue-950 dark:border-blue-500 dark:text-blue-300",
    iconLight: "bg-blue-100 text-blue-600",
    iconDark: "dark:bg-blue-900 dark:text-blue-400",
    barLight: "bg-blue-500",
    barDark: "dark:bg-blue-400",
  },
  warning: {
    icon: IoWarning,
    title: "Attention",
    light: "bg-amber-50 border-amber-500 text-amber-800",
    dark: "dark:bg-amber-950 dark:border-amber-500 dark:text-amber-300",
    iconLight: "bg-amber-100 text-amber-600",
    iconDark: "dark:bg-amber-900 dark:text-amber-400",
    barLight: "bg-amber-500",
    barDark: "dark:bg-amber-400",
  },
};

export default function Alert({
  type,
  message,
  onClose,
  autoClose = 5000,
}: AlertProps) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  const config = CFG[type];
  const Icon = config.icon;

  // Refs for pause-on-hover
  const pausedRef = useRef(false);
  const startRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const rafRef = useRef<number>();

  const dismiss = () => {
    setVisible(false);
    onClose?.();
  };

  // Progress bar animation
  useEffect(() => {
    if (!autoClose) return;

    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      if (!pausedRef.current) {
        elapsedRef.current = ts - startRef.current;
      }
      const pct = Math.max(0, 100 - (elapsedRef.current / autoClose) * 100);
      setProgress(pct);
      if (elapsedRef.current >= autoClose) {
        dismiss();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [autoClose]);

  const handleMouseEnter = () => {
    pausedRef.current = true;
  };

  const handleMouseLeave = () => {
    if (startRef.current !== null) {
      startRef.current = performance.now() - elapsedRef.current;
    }
    pausedRef.current = false;
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.92 }}
          transition={{ type: "spring", damping: 22, stiffness: 280 }}
          className="fixed top-4 right-4 z-50"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className={`
              w-[380px] rounded-xl shadow-lg overflow-hidden border border-l-4
              ${config.light} ${config.dark}
            `}
          >
            {/* Content */}
            <div className="p-4 flex items-center gap-3">
              {/* Icon circle */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                  ${config.iconLight} ${config.iconDark}
                `}
              >
                <Icon className="w-5 h-5" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{config.title}</p>
                <p className="text-xs opacity-90">{message}</p>
              </div>

              {/* Close */}
              {onClose && (
                <button
                  onClick={dismiss}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-colors flex-shrink-0 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <svg
                    className="w-4 h-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Progress bar */}
            {autoClose > 0 && (
              <div
                className={`h-1 transition-none ${config.barLight} ${config.barDark}`}
                style={{ width: `${progress}%` }}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────
   AlertStack — renders multiple alerts stacked
   in the top-right corner.
   ───────────────────────────────────────────── */
interface AlertItem {
  id: number;
  type: AlertProps["type"];
  message: string;
}

interface AlertStackProps {
  alerts: AlertItem[];
  onClose: (id: number) => void;
  autoClose?: number;
}

export function AlertStack({
  alerts,
  onClose,
  autoClose = 5000,
}: AlertStackProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {alerts.map((a) => (
        <Alert
          key={a.id}
          type={a.type}
          message={a.message}
          autoClose={autoClose}
          onClose={() => onClose(a.id)}
        />
      ))}
    </div>
  );
}
