// components/ui/WelcomeModal.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, X } from "lucide-react";

interface WelcomeModalProps {
  locale: string;
  userName?: string;
  isOpen: boolean;
  onClose?: () => void;
  onLater?: () => void;
  onDiscover?: () => void;
}

export function WelcomeModal({
  locale,
  userName = "Mehdi",
  isOpen,
  onClose,
  onLater,
  onDiscover,
}: WelcomeModalProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);
  const [redirecting, setRedirecting] = useState(false);

  // ✅ Compte à rebours pour redirection automatique
  useEffect(() => {
    if (isOpen && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (isOpen && countdown === 0 && !redirecting) {
      setRedirecting(true);
      router.push(`/${locale}/dashboard/owner/listings/create`);
    }
  }, [isOpen, countdown, locale, router, redirecting]);

  const handleCreateListing = () => {
    setRedirecting(true);
    router.push(`/${locale}/dashboard/owner/listings/create`);
  };

  const handleLater = () => {
    if (onLater) onLater();
  };

  const handleDiscover = () => {
    if (onDiscover) onDiscover();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 md:p-6">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col md:flex-row relative">
        {/* Left Side - Image */}
        <div className="w-full md:w-5/12 relative min-h-[250px] md:min-h-full overflow-hidden">
          <img
            alt="Modern Tunisian Villa"
            className="absolute inset-0 w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4V7UH9HIULp-4V4xHdc6qhYwRLErl7tL1ltcGxysMTpSpbYVqqRg7rV0KGimwmpo9QaMRPD4RyxMibIbX1nIckpYr0Qd-XPxcsQFYxozyO93aD0resu-hn9gtgOdw2NjmcluLcgCXvkyJkSisVSGdd6ObyGdV1cDOGxQ8GElH_djfgo-Y3UaGzTyPta0vALWwwVb1FTdKJlmCPscLjKpSLl8y_NYvP5sHJ_LpHQmGnXR5yirj8xk8qOqo9isj0b3VnQ6Wb1kH090"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30"></div>
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-xl max-w-fit">
              <Sparkles className="w-5 h-5 text-primary" />
              <div className="flex flex-col">
                <span className="text-[0.6rem] uppercase tracking-wider font-bold leading-none">Excellence</span>
                <span className="text-[0.8rem] font-bold text-primary leading-none">NESTHUB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Content */}
        <div className="w-full md:w-7/12 p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-[#f9f9ff]">
          <div className="mb-8 flex">
            <div className="p-3 bg-primary/5 rounded-2xl">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </div>

          <h2 className="font-headline text-3xl md:text-4xl font-extrabold text-[#181c22] mb-6 leading-[1.1] tracking-tight">
            Bienvenue dans l'aventure, <span className="text-[#005cab]">{userName}</span> !
          </h2>

          <p className="text-[#404753] text-base md:text-lg leading-relaxed mb-10">
            Nous sommes ravis de vous compter parmi nos hôtes d'exception. Pour commencer à recevoir des voyageurs, la première étape est de créer votre annonce.
          </p>

          {/* Compte à rebours */}
          <div className="bg-slate-100 rounded-xl p-4 text-center mb-4">
            <p className="text-sm font-medium text-slate-600 mb-2">
              Redirection automatique dans {countdown} secondes
            </p>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#005cab] to-[#712ae2] rounded-full transition-all duration-1000"
                style={{ width: `${(countdown / 10) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={handleCreateListing}
              disabled={redirecting}
              className="bg-gradient-to-r from-[#005cab] to-[#712ae2] text-white px-8 py-5 rounded-2xl font-bold text-lg shadow-[0_12px_24px_-8px_rgba(0,92,171,0.5)] hover:shadow-[0_16px_32px_-8px_rgba(0,92,171,0.6)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {redirecting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Créer ma première annonce</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
              <button onClick={handleLater} className="text-[#707785] hover:text-[#005cab] font-semibold text-sm transition-colors duration-200">
                Plus tard
              </button>
              <span className="w-1 h-1 rounded-full bg-[#707785]/30"></span>
              <button onClick={handleDiscover} className="text-[#707785] hover:text-[#005cab] font-semibold text-sm transition-colors duration-200">
                Découvrir mon tableau de bord
              </button>
            </div>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 text-[#707785] hover:text-[#181c22] transition-colors p-2 hidden md:block">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}