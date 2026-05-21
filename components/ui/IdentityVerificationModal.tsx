// components/ui/IdentityVerificationModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useUser } from "@clerk/nextjs";
import { 
  Shield, 
  Mail, 
  Phone, 
  IdCard, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Headphones
} from "lucide-react";
import { RiShieldUserLine, RiVerifiedBadgeLine } from "react-icons/ri";
import { TbShieldLock } from "react-icons/tb";

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
  const { user, isLoaded } = useUser();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Effet parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (window.innerWidth / 2 - e.pageX) / 50;
      const y = (window.innerHeight / 2 - e.pageY) / 50;
      setRotation({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Vérifier les statuts
  const isEmailVerified = user?.emailAddresses[0]?.verification?.status === "verified";
  const isPhoneVerified = user?.phoneNumbers[0]?.verification?.status === "verified";
  const hasValidId = user?.unsafeMetadata?.identityVerified === true;

  const canProceed = isEmailVerified && isPhoneVerified;

  const handleVerify = async () => {
    setIsVerifying(true);
    setError(null);
    
    try {
      const response = await fetch("/api/user/verify-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        await user?.reload();
        onVerified();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || "Échec de la vérification");
      }
    } catch (err) {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
      {/* Fond cinématique */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-secondary/10" />
      </div>

      {/* Container du modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 md:p-12 overflow-hidden pointer-events-none">
        {/* Carte en verre */}
        <div 
          ref={containerRef}
          className="relative w-full max-w-2xl bg-white/10 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 md:p-12 flex flex-col items-center text-center pointer-events-auto shadow-2xl transition-transform duration-200 ease-out"
          style={{ 
            transform: `rotateY(${rotation.x}deg) rotateX(${rotation.y}deg)`,
            perspective: "1000px"
          }}
        >
          {/* Bouton fermer */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} className="text-white/60" />
          </button>

          {/* Icône centrale */}
          <div className="relative mb-8 flex items-center justify-center">
            <div className="absolute w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute w-24 h-24 border border-dashed border-primary/40 rounded-full animate-spin-slow" />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center shadow-lg">
              <RiShieldUserLine className="text-white text-3xl" />
              <div className="absolute inset-0 rounded-full border border-white/30 animate-ping opacity-20" />
            </div>
            <div className="absolute -top-2 -right-1 w-2 h-2 rounded-full bg-secondary/60 animate-bounce [animation-delay:100ms]" />
            <div className="absolute -bottom-1 -left-2 w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse [animation-delay:500ms]" />
          </div>

          {/* Titre et description */}
          <div className="space-y-4 max-w-lg">
            <h1 className="font-bold text-2xl md:text-3xl text-white tracking-tight">
              {t("title")}
            </h1>
            <p className="text-white/70 text-base md:text-lg leading-relaxed">
              {requiredAction === "create_listing" 
                ? t("description.create_listing")
                : t("description.make_booking")}
            </p>
          </div>

          {/* Étapes de vérification */}
          <div className="mt-8 w-full space-y-3">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-white/60" />
                <div className="text-left">
                  <p className="font-medium text-sm text-white">
                    {t("emailVerification")}
                  </p>
                  <p className="text-xs text-white/40">
                    {user?.emailAddresses[0]?.emailAddress}
                  </p>
                </div>
              </div>
              {isEmailVerified ? (
                <CheckCircle size={18} className="text-emerald-400" />
              ) : (
                <AlertCircle size={18} className="text-amber-400" />
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-white/60" />
                <div className="text-left">
                  <p className="font-medium text-sm text-white">
                    {t("phoneVerification")}
                  </p>
                  <p className="text-xs text-white/40">
                    {user?.phoneNumbers[0]?.phoneNumber || "Non renseigné"}
                  </p>
                </div>
              </div>
              {isPhoneVerified ? (
                <CheckCircle size={18} className="text-emerald-400" />
              ) : (
                <AlertCircle size={18} className="text-amber-400" />
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <IdCard size={18} className="text-white/60" />
                <div className="text-left">
                  <p className="font-medium text-sm text-white">
                    {t("identityDocument")}
                  </p>
                  <p className="text-xs text-white/40">
                    {t("idDescription")}
                  </p>
                </div>
              </div>
              {hasValidId ? (
                <CheckCircle size={18} className="text-emerald-400" />
              ) : (
                <button 
                  onClick={() => window.location.href = "/profile/verify-identity"}
                  className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                >
                  {t("uploadId")}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl w-full">
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* Message de confiance */}
          <div className="mt-6 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 w-full">
            <p className="text-xs text-amber-300/80 flex items-center gap-2 justify-center">
              <TbShieldLock size={14} />
              {t("trustInfo")}
            </p>
          </div>

          {/* Actions */}
          <div className="mt-8 w-full flex flex-col gap-3">
            <button 
              onClick={handleVerify}
              disabled={!canProceed || isVerifying}
              className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-base shadow-lg hover:shadow-sky-500/25 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <RiVerifiedBadgeLine size={18} />
              )}
              {canProceed ? t("verifyButton") : t("completeRequirements")}
            </button>
            
            <button 
              onClick={onClose}
              className="w-full py-3 px-6 rounded-full border border-white/20 hover:bg-white/10 text-white/80 font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Headphones size={14} />
              {t("later")}
            </button>
          </div>

          {/* Indicateur de statut */}
          <div className="mt-6 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400" />
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-white/40">
              Vérification active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}