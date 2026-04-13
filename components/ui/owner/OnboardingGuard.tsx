// components/owner/OnboardingGuard.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useHasListings } from "@/hooks/useHasListings";
import { GiPartyPopper } from "react-icons/gi";
import {
  Sparkles,
  ArrowRight,
  Home,
  Zap,
  Star,
  TrendingUp,
  Loader2,
} from "lucide-react";

interface OnboardingGuardProps {
  children: React.ReactNode;
  locale: string;
}

export default function OnboardingGuard({
  children,
  locale,
}: OnboardingGuardProps) {
  const { user } = useUser();
  const router = useRouter();
  const { hasListings, loading } = useHasListings();
  const [countdown, setCountdown] = useState(10);
  const [redirecting, setRedirecting] = useState(false);

  // Redirection automatique après 10 secondes
  useEffect(() => {
    if (hasListings === false && countdown > 0 && !redirecting) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (hasListings === false && countdown === 0 && !redirecting) {
      setRedirecting(true);
      router.push(`/${locale}/dashboard/owner/listings/create`);
    }
  }, [hasListings, countdown, locale, router, redirecting]);

  const handleCreateListing = () => {
    setRedirecting(true);
    router.push(`/${locale}/dashboard/owner/listings/create`);
  };

  const handleLater = () => {
    router.push(`/${locale}/dashboard/owner`);
  };

  // Afficher un loader pendant la vérification
  if (loading) {
    return null
   
  }

  // Si l'utilisateur a des annonces, afficher le contenu normal
  if (hasListings === true) {
    return <>{children}</>;
  }

  // Sinon, afficher le modal bloquant
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 md:p-6">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col md:flex-row relative">
        {/* Left Side - Image */}
        <div className="w-full md:w-5/12 relative min-h-[250px] md:min-h-full overflow-hidden">
          <img
            alt="Modern Tunisian Villa"
            className="absolute inset-0 w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4V7UH9HIULp-4V4xHdc6qhYwRLErl7tL1ltcGxysMTpSpbYVqqRg7rV0KGimwmpo9QaMRPD4RyxMibIbX1nIckpYr0Qd-XPxcsQFYxozyO93aD0resu-hn9gtgOdw2NjmcluLcgCXvkyJkSisVSGdd6ObyGdV1cDOGxQ8GElH_djfgo-Y3UaGzTyPta0vALWwwVb1FTdKJlmCPscLjKpSLl8y_NYvP5sHJ_LpHQmGnXR5yirj8xk8qOqo9isj0b3VnQ6Wb1kH090"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30"></div>

          {/* Excellence Badge */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-3 shadow-xl max-w-fit">
              <Sparkles size={20} className="text-indigo-500" />
              <div className="flex flex-col">
                <span className="text-[0.6rem] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold leading-none">
                  Excellence
                </span>
                <span className="text-[0.8rem] font-bold text-indigo-600 dark:text-indigo-400 leading-none">
                  NESTHUB
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Content */}
        <div className="w-full md:w-7/12 p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-white dark:bg-slate-900">
          <div className="mb-8 flex justify-center">
            <div className="p-3">
              <GiPartyPopper size={48} className="text-indigo-500 text-4xl" />
            </div>
          </div>

          <h2 className="font-headline text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-6 leading-[1.1] tracking-tight text-center">
            Bienvenue dans l'aventure,{" "}
            <span className="text-indigo-600 dark:text-indigo-400">
              {user?.firstName || user?.username || "Hôte"}
            </span>{" "}
            !
          </h2>

          <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed mb-10 text-center">
            Nous sommes ravis de vous compter parmi nos hôtes d'exception. Pour
            commencer à recevoir des voyageurs, la première étape est de créer
            votre annonce.
          </p>

          {/* Compte à rebours */}
          <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 text-center mb-4">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Redirection automatique dans {countdown} secondes
            </p>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 rounded-full transition-all duration-1000"
                style={{ width: `${(countdown / 10) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={handleCreateListing}
              disabled={redirecting}
              className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white px-8 py-5 rounded-2xl font-bold text-lg shadow-[0_12px_24px_-8px_rgba(79,70,229,0.5)] hover:shadow-[0_16px_32px_-8px_rgba(79,70,229,0.6)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {redirecting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Créer ma première annonce</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>

            <button
              onClick={handleLater}
              disabled={redirecting}
              className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm font-medium transition-colors py-2"
            >
              Peut-être plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
