// components/ui/IdentityVerificationModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Shield, ChevronRight } from "lucide-react";
import { MdOutlineSupportAgent } from "react-icons/md";

interface IdentityVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  requiredAction: "create_listing" | "make_booking";
}

export function IdentityVerificationModal({
  isOpen,
  onClose,
  onVerified,
  requiredAction,
}: IdentityVerificationModalProps) {
  const t = useTranslations("IdentityVerification");
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [timeLeft, setTimeLeft] = useState("24:00");

  // Parallax Micro-interaction
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (window.innerWidth / 2 - e.pageX) / 50;
      const y = (window.innerHeight / 2 - e.pageY) / 50;
      setRotation({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Timer animation
  useEffect(() => {
    if (!isOpen) return;
    
    let time = 48 * 60;
    const timer = setInterval(() => {
      if (time <= 0) {
        clearInterval(timer);
        return;
      }
      time--;
      const hours = Math.floor(time / 60);
      const minutes = time % 60;
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    }, 60000);
    
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            ref={containerRef}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
            style={{ 
              transform: `rotateY(${rotation.x}deg) rotateX(${rotation.y}deg)`,
              perspective: "1000px"
            }}
          >
            {/* Bouton fermer */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={20} className="text-slate-400" />
            </button>

            {/* Contenu principal */}
            <div className="p-8 md:p-10 flex flex-col items-center text-center">
              {/* Sentinel Core */}
              <div className="relative mb-6 flex items-center justify-center">
                {/* Outer Glow */}
                <div className="absolute w-32 h-32 bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
                {/* Orbital Ring */}
                <div className="absolute w-28 h-28 border border-dashed border-sky-400/40 rounded-full animate-spin-slow" />
                {/* Main Core */}
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Shield size={36} className="text-white" />
                  {/* Inner Pulse Ring */}
                  <div className="absolute inset-0 rounded-full border border-white/30 animate-ping opacity-20" />
                </div>
                {/* Aesthetic Particles */}
                <div className="absolute -top-3 -right-2 w-2 h-2 rounded-full bg-purple-400/60 animate-bounce [animation-delay:100ms]" />
                <div className="absolute -bottom-2 -left-3 w-2 h-2 rounded-full bg-sky-400/60 animate-pulse [animation-delay:500ms]" />
                <div className="absolute top-1/2 -right-4 w-1.5 h-1.5 rounded-full bg-indigo-400/60 animate-ping [animation-delay:300ms]" />
              </div>

              {/* Titre */}
              <div className="space-y-4 max-w-md">
                <h1 className="font-bold text-3xl md:text-4xl text-slate-900 dark:text-white tracking-tight">
                  {t("title")}{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600">
                    {t("gradientText")}
                  </span>
                </h1>
                
                {/* Timer badge */}
                <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-4 py-2 rounded-full w-fit mx-auto">
                  <Clock size={16} />
                  <span className="text-sm font-medium">
                    {t("timerLabel", { time: timeLeft })}
                  </span>
                </div>

                {/* Long paragraphe explicatif */}
                <div className="space-y-3 text-slate-500 dark:text-slate-400 text-base leading-relaxed">
                  <p>{t("description.line1")}</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    {t("description.line2")}
                  </p>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="mt-8 w-full max-w-md">
                <div className="relative">
                  <div className="overflow-hidden h-1.5 text-xs flex rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="w-2/3 h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 animate-pulse" />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{t("progressLabel")}</p>
                </div>
              </div>

              {/* Boutons */}
              <div className="mt-8 w-full max-w-md flex flex-col gap-3">
                <button 
                  onClick={onClose}
                  className="w-full py-3 px-6 rounded-full border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-base transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  <MdOutlineSupportAgent size={18} className="group-hover:scale-110 transition-transform" />
                  {t("buttonSupport")}
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Status Label */}
              <div className="mt-6 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500" />
                </span>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400">
                  {t("statusLabel")}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}