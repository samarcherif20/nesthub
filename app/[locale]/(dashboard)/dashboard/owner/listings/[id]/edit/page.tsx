// app/[locale]/(dashboard)/owner/listings/[id]/edit/page.tsx
"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import MapPickerWrapper from "@/components/ui/maps/MapPickerWrapper";
import { Toggle } from "@/components/ui/Toggle";
import { useEditListing } from "./hooks/useEditListing";
import Alert from "@/components/ui/Alert";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Home,
  Building2,
  Hotel,
  Layers,
  Bed,
  Bath,
  Users,
  Ruler,
  ArrowUp,
  Eye,
  Edit,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  DollarSign,
  CheckCircle,
  Loader2,
  Save,
  Rocket,
  Camera,
  Sun,
  Sparkles,
  Wifi,
  Wind,
  Flame,
  Utensils,
  Car,
  Waves,
  Dumbbell,
  Tv,
  Trees,
  WashingMachine,
  Fan,
  Shield,
  Calendar,
  Star,
  AlertCircle,
  EyeOff,
  Coffee,
  Smartphone,
  Lock,
  Music,
  BookOpen,
  TrendingUp,
  Zap,
  Award,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useRouter } from "next/navigation";

// Tooltip component simple sans UI change
function Tooltip({
  children,
  text,
}: {
  children: React.ReactNode;
  text: string;
}) {
  return (
    <span className="group relative inline-block w-full">
      {children}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {text}
      </span>
    </span>
  );
}

const getDisplayUrl = (url: string) => {
  if (!url) return null;
  if (url.startsWith("blob:")) return url;
  return `/api/listings/image?url=${encodeURIComponent(url)}`;
};

const governorates = [
  "Tunis",
  "Ariana",
  "Ben Arous",
  "Manouba",
  "Nabeul",
  "Zaghouan",
  "Bizerte",
  "Béja",
  "Jendouba",
  "Le Kef",
  "Siliana",
  "Kairouan",
  "Kasserine",
  "Sidi Bouzid",
  "Sousse",
  "Monastir",
  "Mahdia",
  "Sfax",
  "Gafsa",
  "Tozeur",
  "Kébili",
  "Gabès",
  "Médenine",
  "Tataouine",
];

const propertyTypes = [
  { value: "APARTMENT", label: "Appartement", icon: Building2 },
  { value: "VILLA", label: "Villa", icon: Home },
  { value: "HOUSE", label: "Maison", icon: Home },
  { value: "STUDIO", label: "Studio", icon: Hotel },
  { value: "DUPLEX", label: "Duplex", icon: Layers },
];

const equipmentList = [
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "ac", label: "Climatisation", icon: Wind },
  { id: "heating", label: "Chauffage", icon: Flame },
  { id: "kitchen", label: "Cuisine", icon: Utensils },
  { id: "parking", label: "Parking", icon: Car },
  { id: "pool", label: "Piscine", icon: Waves },
  { id: "gym", label: "Salle sport", icon: Dumbbell },
  { id: "washer", label: "Lave-linge", icon: WashingMachine },
  { id: "tv", label: "Télévision", icon: Tv },
  { id: "balcony", label: "Balcon", icon: Trees },
  { id: "dishwasher", label: "Lave-vaisselle", icon: Utensils },
  { id: "dryer", label: "Sèche-linge", icon: Fan },
  { id: "coffee", label: "Cafetière", icon: Coffee },
  { id: "smartlock", label: "Serrure connectée", icon: Smartphone },
  { id: "speaker", label: "Enceinte", icon: Music },
  { id: "workplace", label: "Espace travail", icon: BookOpen },
];

const SECTIONS = [
  { id: "details", label: "Informations", icon: Home },
  { id: "photos", label: "Photos", icon: Camera },
  { id: "pricing", label: "Tarification", icon: DollarSign },
  { id: "publish", label: "Publication", icon: Rocket },
];

// 🔥 FONCTION CALCUL COMPLETUDE CORRIGÉE
function calculateCompletionScore(listing: any, photosLength: number): number {
  if (!listing) return 0;

  let score = 0;
  let total = 0;

  total += 5;
  if (listing.title && listing.title.length >= 10) score += 5;
  else if (listing.title && listing.title.length > 0) score += 3;

  total += 10;
  if (listing.description && listing.description.length >= 200) score += 10;
  else if (listing.description && listing.description.length >= 100) score += 7;
  else if (listing.description && listing.description.length > 0) score += 4;

  total += 15;
  const safePhotosLength = photosLength || 0;
  if (safePhotosLength >= 10) score += 15;
  else if (safePhotosLength >= 7) score += 12;
  else if (safePhotosLength >= 5) score += 10;
  else if (safePhotosLength >= 3) score += 6;
  else if (safePhotosLength >= 1) score += 3;

  total += 15;
  if (listing.governorate && listing.delegation && listing.latitude)
    score += 15;
  else if (listing.governorate && listing.latitude) score += 10;
  else if (listing.governorate) score += 5;

  total += 15;
  if (listing.pricePerNight || listing.pricePerMonth) score += 15;

  total += 10;
  if (
    listing.type &&
    listing.rooms >= 1 &&
    listing.bathrooms >= 1 &&
    listing.maxGuests >= 1
  )
    score += 10;
  else if (listing.type && (listing.rooms >= 1 || listing.bathrooms >= 1))
    score += 6;
  else if (listing.type) score += 3;

  total += 15;
  const equipmentCount = Object.values(listing.equipment || {}).filter(
    Boolean,
  ).length;
  if (equipmentCount >= 8) score += 15;
  else if (equipmentCount >= 5) score += 10;
  else if (equipmentCount >= 3) score += 6;
  else if (equipmentCount >= 1) score += 3;

  total += 5;
  if (listing.status === "ACTIVE") score += 5;
  else if (listing.status === "DRAFT") score += 2;

  total += 10;
  if (listing.customRules && listing.customRules.length > 0) score += 5;
  if (listing.securityDeposit || listing.cleaningFee) score += 5;

  return Math.round((score / total) * 100);
}

function QualityRing({ score }: { score: number }) {
  const color = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-700"></div>
      <div
        className="absolute rounded-full"
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: `conic-gradient(${color} 0deg ${score * 3.6}deg, #e2e8f0 ${score * 3.6}deg 360deg)`,
          mask: "radial-gradient(circle, transparent 58%, black 59%)",
          WebkitMask: "radial-gradient(circle, transparent 58%, black 59%)",
        }}
      />
      <span className="absolute text-sm font-black" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

export default function EditListingPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = React.use(params);
  const router = useRouter();
  const t = useTranslations("EditListing");
  const fileRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState("details");
  const [hasChanges, setHasChanges] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    listing,
    loading,
    saving,
    lastSaved,
    uploadingPhotos,
    alert,
    setAlert,
    setField,
    save,
    handleFileChange,
    removePhoto,
    setMainPhoto,
    saveAndResubmit,
  } = useEditListing(id, locale);

  // 🔥 COMPLETION SCORE CORRIGÉ
  const completionScore = useMemo(() => {
    if (!listing) return 0;
    const photosLength = listing.photos?.length ?? 0;
    return calculateCompletionScore(listing, photosLength);
  }, [listing]);

  // Détecter les modifications non sauvegardées
  useEffect(() => {
    if (listing) {
      setHasChanges(true);
    }
  }, [listing]);

  // Confirmation avant de quitter la page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = t("confirmLeave");
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges, t]);

  // Sauvegarde avec gestion du message de succès
  const handleSave = async (updates?: any, showToast?: boolean) => {
    const result = await save(updates, showToast);
    if (result) {
      setHasChanges(false);
      setSuccessMessage(t("success.saved"));
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("loading")}
          </p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="text-center">
          <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
            <Home size={24} className="text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium mb-3">
            {t("notFound")}
          </p>
          <Link
            href={`/${locale}/dashboard/owner/listings`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all"
          >
            <ChevronLeft size={14} /> {t("actions.back")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950">
      {/* Alert en haut à droite */}
      {(alert || successMessage) && (
        <div className="fixed top-20 right-6 z-50 max-w-md">
          {alert && (
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
              autoClose={5000}
            />
          )}
          {successMessage && (
            <Alert
              type="success"
              message={successMessage}
              onClose={() => setSuccessMessage(null)}
              autoClose={3000}
            />
          )}
        </div>
      )}

      {/* HEADER STICKY */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="px-6 py-4">
          <nav className="flex items-center gap-2 text-slate-400 text-xs font-medium tracking-wide uppercase mb-2">
            <Link
              href={`/${locale}/dashboard/owner/listings`}
              className="hover:text-indigo-600 transition-colors"
            >
              {t("breadcrumb.myListings")}
            </Link>
            <ChevronRight size={12} />
            <span className="text-slate-600 dark:text-slate-400">
              {listing.title}
            </span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {t("page.title")}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {t("page.subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                  listing.status === "ACTIVE"
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    : listing.status === "DRAFT"
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    listing.status === "ACTIVE"
                      ? "bg-emerald-500 animate-pulse"
                      : listing.status === "DRAFT"
                        ? "bg-slate-400"
                        : "bg-amber-500"
                  }`}
                />
                {listing.status === "ACTIVE"
                  ? t("status.active")
                  : listing.status === "DRAFT"
                    ? t("status.draft")
                    : t("status.inactive")}
              </div>
              {lastSaved && (
                <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
                  {t("autoSave.saved")}{" "}
                  {lastSaved.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
              <Tooltip text={t("tooltips.save")}>
                <button
                  onClick={() => handleSave(undefined, true)}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  {t("actions.save")}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* ⚠️ Bandeau d'alerte - Annonce rejetée */}
      {listing.status === "REJECTED" && listing.rejectionReason && (
        <div className="fixed top-20 right-6 z-50 w-[90%] max-w-md animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="text-red-600 dark:text-red-400 text-base" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-red-800 dark:text-red-300">
                  Annonce rejetée par l'administration
                </h3>
                <p className="text-xs text-red-700 dark:text-red-300/80 mt-1 leading-relaxed">
                  <span className="font-semibold">Motif :</span>{" "}
                  {listing.rejectionReason}
                  {listing.rejectionDetails && (
                    <span className="block mt-1 text-red-600/80 dark:text-red-400/80">
                      {listing.rejectionDetails}
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-red-500/70 dark:text-red-400/70 mt-2 flex items-center gap-1">
                  <Calendar size={10} />
                  Rejeté le{" "}
                  {listing.rejectedAt
                    ? format(
                        new Date(listing.rejectedAt),
                        "dd MMM yyyy à HH:mm",
                        { locale: fr },
                      )
                    : "récemment"}
                </p>
              </div>
              <button
                onClick={saveAndResubmit}
                disabled={saving}
                className="shrink-0 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Rocket size={12} />
                )}
                Sauvegarder & Resoumettre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT - Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* LEFT SIDEBAR - Sticky */}
            <aside className="w-full lg:w-64 shrink-0 space-y-4 sticky top-6">
              <nav className="bg-transparent rounded-xl p-1">
                {SECTIONS.map((s) => {
                  const Icon = s.icon;
                  const isActive = active === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActive(s.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all mb-1 last:mb-0 ${
                        isActive
                          ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <Icon
                        size={18}
                        className={
                          isActive
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-slate-400"
                        }
                      />
                      {s.label}
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Complétude Card */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {t("completion.title")}
                  </p>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center shadow-sm">
                    <Award size={14} className="text-white" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <QualityRing score={completionScore} />
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {completionScore >= 80
                        ? t("completion.excellent")
                        : completionScore >= 50
                          ? t("completion.good")
                          : t("completion.poor")}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {completionScore < 80 &&
                        t("completion.remaining", {
                          percent: 80 - completionScore,
                        })}
                      {completionScore >= 80 && t("completion.ready")}
                    </p>
                  </div>
                </div>
                {completionScore < 100 && (
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-violet-600 rounded-full transition-all duration-500"
                        style={{ width: `${completionScore}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Astuce Card */}
              <div className="relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-5">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-600 opacity-95"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Sparkles size={14} className="text-white" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/90">
                      {t("expertTip.title")}
                    </p>
                  </div>
                  <p className="text-sm text-white leading-relaxed font-medium">
                    {t("expertTip.message")}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse"></div>
                    <p className="text-[10px] text-white/70 font-medium uppercase tracking-wider">
                      {t("expertTip.recommendation")}
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 min-w-0">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-900 shadow-sm overflow-hidden">
                {/* Section Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
                      {React.createElement(
                        SECTIONS.find((s) => s.id === active)!.icon,
                        { size: 14, className: "text-white" },
                      )}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-800 dark:text-white">
                        {SECTIONS.find((s) => s.id === active)!.label}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {active === "details" && t("sectionHints.details")}
                        {active === "photos" && t("sectionHints.photos")}
                        {active === "pricing" && t("sectionHints.pricing")}
                        {active === "publish" && t("sectionHints.publish")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section Content */}
                <div className="p-6">
                  {/* DETAILS SECTION */}
                  {active === "details" && (
                    <div className="space-y-8">
                      {/* Titre & Description */}
                      <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-12 lg:col-span-3">
                          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            {t("details.titleAndDesc")}
                          </label>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {t("details.titleAndDescHint")}
                          </p>
                        </div>
                        <div className="col-span-12 lg:col-span-9 space-y-4">
                          <Tooltip text={t("tooltips.title")}>
                            <input
                              type="text"
                              value={listing.title}
                              onChange={(e) =>
                                setField("title", e.target.value)
                              }
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                              placeholder={t("fields.titlePlaceholder")}
                            />
                          </Tooltip>
                          <Tooltip text={t("tooltips.description")}>
                            <textarea
                              value={listing.description || ""}
                              onChange={(e) =>
                                setField("description", e.target.value)
                              }
                              rows={4}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                              placeholder={t("fields.descriptionPlaceholder")}
                            />
                          </Tooltip>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-700"></div>

                      {/* Type & Capacité */}
                      <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-12 lg:col-span-3">
                          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            {t("details.configuration")}
                          </label>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {t("details.configurationHint")}
                          </p>
                        </div>
                        <div className="col-span-12 lg:col-span-9 space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <select
                              value={listing.type}
                              onChange={(e) => setField("type", e.target.value)}
                              className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                              {propertyTypes.map((pt) => (
                                <option key={pt.value} value={pt.value}>
                                  {t(`propertyTypes.${pt.value}`)}
                                </option>
                              ))}
                            </select>
                            <div className="flex items-center px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                              <Users
                                size={16}
                                className="text-slate-400 dark:text-slate-500 mr-2"
                              />
                              <input
                                type="number"
                                value={listing.maxGuests}
                                onChange={(e) =>
                                  setField(
                                    "maxGuests",
                                    parseInt(e.target.value) || 1,
                                  )
                                }
                                className="w-full bg-transparent focus:outline-none"
                                min={1}
                              />
                              <span className="text-slate-400 dark:text-slate-500 text-sm ml-2">
                                {t("fields.guests")}
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <Tooltip text={t("tooltips.rooms")}>
                              <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                                <Bed
                                  size={16}
                                  className="text-slate-400 dark:text-slate-500"
                                />
                                <input
                                  type="number"
                                  min={1}
                                  value={listing.rooms}
                                  onChange={(e) =>
                                    setField(
                                      "rooms",
                                      parseInt(e.target.value) || 1,
                                    )
                                  }
                                  className="w-full bg-transparent focus:outline-none"
                                />
                              </div>
                            </Tooltip>
                            <Tooltip text={t("tooltips.bathrooms")}>
                              <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                                <Bath
                                  size={16}
                                  className="text-slate-400 dark:text-slate-500"
                                />
                                <input
                                  type="number"
                                  min={1}
                                  value={listing.bathrooms}
                                  onChange={(e) =>
                                    setField(
                                      "bathrooms",
                                      parseInt(e.target.value) || 1,
                                    )
                                  }
                                  className="w-full bg-transparent focus:outline-none"
                                />
                              </div>
                            </Tooltip>
                            <Tooltip text={t("tooltips.surface")}>
                              <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                                <Ruler
                                  size={16}
                                  className="text-slate-400 dark:text-slate-500"
                                />
                                <input
                                  type="number"
                                  value={listing.surfaceArea || ""}
                                  onChange={(e) =>
                                    setField(
                                      "surfaceArea",
                                      e.target.value
                                        ? parseInt(e.target.value)
                                        : null,
                                    )
                                  }
                                  className="w-full bg-transparent focus:outline-none"
                                />
                              </div>
                            </Tooltip>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                            <div className="flex items-center gap-2">
                              <ArrowUp
                                size={16}
                                className="text-slate-400 dark:text-slate-500"
                              />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {t("fields.elevator")}
                              </span>
                            </div>
                            <Toggle
                              checked={listing.hasElevator}
                              onChange={(v) => setField("hasElevator", v)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-700"></div>

                      {/* Localisation */}
                      <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-12 lg:col-span-3">
                          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            {t("location.title")}
                          </label>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {t("location.hint")}
                          </p>
                        </div>
                        <div className="col-span-12 lg:col-span-9 space-y-4">
                          <div className="grid grid-cols-3 gap-3">
                            <select
                              value={listing.governorate}
                              onChange={(e) =>
                                setField("governorate", e.target.value)
                              }
                              className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            >
                              <option value="">
                                {t("location.governorate")}
                              </option>
                              {governorates.map((g) => (
                                <option key={g} value={g}>
                                  {g}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={listing.delegation || ""}
                              onChange={(e) =>
                                setField("delegation", e.target.value)
                              }
                              placeholder={t("location.delegation")}
                              className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            />
                            <input
                              type="text"
                              value={listing.street || ""}
                              onChange={(e) =>
                                setField("street", e.target.value)
                              }
                              placeholder={t("location.street")}
                              className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            />
                          </div>
                          <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 h-56">
                            <MapPickerWrapper
                              latitude={listing.latitude}
                              longitude={listing.longitude}
                              onLocationChange={(lat, lng) => {
                                setField("latitude", lat);
                                setField("longitude", lng);
                              }}
                              onAddressChange={(addr) => console.log(addr)}
                            />
                          </div>
                          {listing.latitude !== null ? (
                            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                              <CheckCircle
                                size={14}
                                className="text-emerald-600 dark:text-emerald-400"
                              />
                              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                                {t("location.positionSet")}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                              <AlertCircle
                                size={14}
                                className="text-amber-600 dark:text-amber-400"
                              />
                              <span className="text-xs text-amber-700 dark:text-amber-400">
                                {t("location.positionMissing")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-700"></div>

                      {/* Équipements */}
                      <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-12 lg:col-span-3">
                          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            {t("details.equipment")}
                          </label>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {t("details.equipmentHint")}
                          </p>
                        </div>
                        <div className="col-span-12 lg:col-span-9">
                          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
                            {equipmentList.map(
                              ({ id: eqId, label, icon: Icon }) => {
                                const active = !!(listing.equipment ?? {})[
                                  eqId
                                ];
                                return (
                                  <button
                                    key={eqId}
                                    type="button"
                                    onClick={() =>
                                      setField("equipment", {
                                        ...(listing.equipment ?? {}),
                                        [eqId]: !active,
                                      })
                                    }
                                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${active ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-indigo-300"}`}
                                  >
                                    <Icon
                                      size={16}
                                      className={
                                        active
                                          ? "text-indigo-600 dark:text-indigo-400"
                                          : "text-slate-400"
                                      }
                                    />
                                    <span className="text-[10px] font-medium">
                                      {t(`equipment.${eqId}`)}
                                    </span>
                                  </button>
                                );
                              },
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PHOTOS SECTION */}
                  {active === "photos" && (
                    <div className="space-y-6">
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileChange(e.target.files)}
                      />
                      <Tooltip text={t("tooltips.addPhotos")}>
                        <div
                          onClick={() => fileRef.current?.click()}
                          className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-400 transition-all cursor-pointer"
                        >
                          <div className="flex flex-col items-center justify-center py-10 gap-2">
                            {uploadingPhotos ? (
                              <Loader2
                                size={28}
                                className="text-indigo-500 animate-spin"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 flex items-center justify-center">
                                <Camera size={20} className="text-white" />
                              </div>
                            )}
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {uploadingPhotos
                                ? t("photos.uploading")
                                : t("photos.clickToAdd")}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {listing.photos.length}/20 {t("photos.photos")}
                            </p>
                          </div>
                        </div>
                      </Tooltip>
                      {listing.photos.length < 5 && (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                          <AlertCircle
                            size={14}
                            className="text-amber-600 dark:text-amber-400"
                          />
                          <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                            {t("photos.minWarning", {
                              count: 5 - listing.photos.length,
                            })}
                          </span>
                        </div>
                      )}
                      {listing.photos.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {listing.photos.map((photo, idx) => (
                            <div
                              key={photo.id}
                              className={`relative group rounded-lg overflow-hidden aspect-square bg-slate-100 dark:bg-slate-700 ${photo.isMain ? "ring-2 ring-indigo-500 ring-offset-1" : ""}`}
                            >
                              <img
                                src={getDisplayUrl(photo.url) ?? ""}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              {photo.isMain && (
                                <div className="absolute top-1 left-1">
                                  <span className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                    {t("photos.main")}
                                  </span>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
                              <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                                {!photo.isMain && (
                                  <Tooltip text={t("tooltips.setAsMain")}>
                                    <button
                                      onClick={() => setMainPhoto(photo.id)}
                                      className="w-6 h-6 rounded-md bg-white/90 text-amber-500 flex items-center justify-center"
                                    >
                                      <Star size={10} />
                                    </button>
                                  </Tooltip>
                                )}
                                <Tooltip text={t("tooltips.deletePhoto")}>
                                  <button
                                    onClick={() => removePhoto(photo.id)}
                                    className="w-6 h-6 rounded-md bg-white/90 text-rose-500 flex items-center justify-center"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </Tooltip>
                              </div>
                            </div>
                          ))}
                          {listing.photos.length < 20 && (
                            <Tooltip text={t("tooltips.addPhoto")}>
                              <button
                                onClick={() => fileRef.current?.click()}
                                className="aspect-square rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all"
                              >
                                <Plus size={20} />
                                <span className="text-[10px] font-bold">
                                  {t("photos.add")}
                                </span>
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* PRICING SECTION */}
                  {active === "pricing" && (
                    <div className="space-y-6">
                      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-full w-fit">
                        {[
                          { v: "SHORT_TERM", l: "shortTerm" },
                          { v: "LONG_TERM", l: "longTerm" },
                          { v: "BOTH", l: "both" },
                        ].map(({ v, l }) => (
                          <button
                            key={v}
                            onClick={() => setField("rentalType", v)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${listing.rentalType === v ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
                          >
                            {t(`rentalTypes.${l}`)}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Tooltip text={t("tooltips.pricePerNight")}>
                          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 mb-2">
                              <Sun size={14} className="text-indigo-500" />
                              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                {t("pricing.perNight")}
                              </label>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-sm font-semibold text-slate-400">
                                TND
                              </span>
                              <input
                                type="number"
                                value={listing.pricePerNight ?? ""}
                                onChange={(e) =>
                                  setField(
                                    "pricePerNight",
                                    e.target.value
                                      ? parseFloat(e.target.value)
                                      : null,
                                  )
                                }
                                placeholder="0"
                                className="flex-1 text-2xl font-bold bg-transparent focus:outline-none"
                              />
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                              {t("units.night")}
                            </p>
                          </div>
                        </Tooltip>
                        <Tooltip text={t("tooltips.pricePerMonth")}>
                          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar size={14} className="text-indigo-500" />
                              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                {t("pricing.perMonth")}
                              </label>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-sm font-semibold text-slate-400">
                                TND
                              </span>
                              <input
                                type="number"
                                value={listing.pricePerMonth ?? ""}
                                onChange={(e) =>
                                  setField(
                                    "pricePerMonth",
                                    e.target.value
                                      ? parseFloat(e.target.value)
                                      : null,
                                  )
                                }
                                placeholder="0"
                                className="flex-1 text-2xl font-bold bg-transparent focus:outline-none"
                              />
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                              {t("units.month")}
                            </p>
                          </div>
                        </Tooltip>
                      </div>

                      <div className="space-y-3">
                        {[
                          {
                            field: "securityDeposit",
                            label: "deposit",
                            desc: "depositDesc",
                            icon: Shield,
                            def: 500,
                          },
                          {
                            field: "cleaningFee",
                            label: "cleaningFee",
                            desc: "cleaningFeeDesc",
                            icon: Sparkles,
                            def: 50,
                          },
                        ].map(({ field, label, desc, icon: Icon, def }) => (
                          <div
                            key={field}
                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
                          >
                            <div className="flex items-center gap-3">
                              <Icon size={14} className="text-indigo-500" />
                              <div>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {t(`pricing.${label}`)}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500">
                                  {t(`pricing.${desc}`)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {(listing as any)[field] !== null && (
                                <div className="flex items-center gap-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
                                  <input
                                    type="number"
                                    value={(listing as any)[field] ?? ""}
                                    onChange={(e) =>
                                      setField(
                                        field as any,
                                        e.target.value
                                          ? parseFloat(e.target.value)
                                          : null,
                                      )
                                    }
                                    className="w-14 text-right text-sm font-medium bg-transparent focus:outline-none"
                                  />
                                  <span className="text-xs text-slate-400">
                                    TND
                                  </span>
                                </div>
                              )}
                              <Toggle
                                checked={(listing as any)[field] !== null}
                                onChange={(v) =>
                                  setField(field as any, v ? def : null)
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PUBLISH SECTION */}
                  {active === "publish" && (
                    <div className="space-y-6">
                      <div
                        className={`p-4 rounded-lg border ${listing.status === "ACTIVE" ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${listing.status === "ACTIVE" ? "bg-emerald-100 dark:bg-emerald-900/50" : "bg-slate-100 dark:bg-slate-800"}`}
                          >
                            {listing.status === "ACTIVE" ? (
                              <CheckCircle
                                size={18}
                                className="text-emerald-600 dark:text-emerald-400"
                              />
                            ) : (
                              <AlertCircle
                                size={18}
                                className="text-slate-500 dark:text-slate-400"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800 dark:text-white">
                              {listing.status === "ACTIVE"
                                ? t("publish.published")
                                : listing.status === "DRAFT"
                                  ? t("publish.draft")
                                  : t("publish.hidden")}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {listing.status === "ACTIVE"
                                ? t("publish.publishedDesc")
                                : t("publish.hiddenDesc")}
                            </p>
                          </div>
                          {listing.status === "ACTIVE" && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-bold">
                              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />{" "}
                              {t("publish.live")}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                          {listing.status !== "ACTIVE" && (
                            <button
                              onClick={() => handleSave({ status: "ACTIVE" })}
                              className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg text-xs font-semibold"
                            >
                              <Rocket size={12} className="inline mr-1" />{" "}
                              {t("actions.publish")}
                            </button>
                          )}
                          {listing.status === "ACTIVE" && (
                            <button
                              onClick={() => handleSave({ status: "INACTIVE" })}
                              className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg text-xs font-semibold"
                            >
                              <EyeOff size={12} className="inline mr-1" />{" "}
                              {t("actions.hide")}
                            </button>
                          )}
                          <Link
                            href={`/${locale}/listings/${listing.id}`}
                            target="_blank"
                            className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg text-xs font-semibold"
                          >
                            <Eye size={12} className="inline mr-1" />{" "}
                            {t("actions.preview")}
                          </Link>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {[
                          {
                            icon: Eye,
                            label: "views",
                            value: listing.viewCount.toLocaleString("fr-FR"),
                          },
                          {
                            icon: Calendar,
                            label: "created",
                            value: new Date(
                              listing.createdAt,
                            ).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                            }),
                          },
                          {
                            icon: Award,
                            label: "score",
                            value: `${completionScore}%`,
                          },
                        ].map(({ icon: Icon, label, value }) => (
                          <div
                            key={label}
                            className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-center"
                          >
                            <Icon
                              size={14}
                              className="text-indigo-500 mx-auto mb-1"
                            />
                            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                              {t(`publish.stats.${label}`)}
                            </p>
                            <p className="text-sm font-bold text-slate-700 dark:text-white">
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {t("completion.title")}
                          </h3>
                          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                            {completionScore}%
                          </span>
                        </div>
                        <div className="space-y-2">
                          {[
                            {
                              key: "title",
                              done:
                                !!listing.title && listing.title.length >= 10,
                            },
                            {
                              key: "description",
                              done: !!(
                                listing.description &&
                                listing.description.length >= 100
                              ),
                            },
                            { key: "photos", done: listing.photos.length >= 5 },
                            {
                              key: "location",
                              done: !!(listing.governorate && listing.latitude),
                            },
                            {
                              key: "price",
                              done: !!(
                                listing.pricePerNight || listing.pricePerMonth
                              ),
                            },
                            {
                              key: "equipment",
                              done:
                                Object.values(listing.equipment || {}).filter(
                                  Boolean,
                                ).length >= 3,
                            },
                          ].map(({ key, done }) => (
                            <div key={key} className="flex items-center gap-2">
                              <CheckCircle
                                size={12}
                                className={
                                  done
                                    ? "text-emerald-500 dark:text-emerald-400"
                                    : "text-slate-300 dark:text-slate-600"
                                }
                              />
                              <span className="text-xs text-slate-600 dark:text-slate-400 flex-1">
                                {t(`completion.items.${key}`)}
                              </span>
                              <span
                                className={`text-[10px] font-medium ${done ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}
                              >
                                {done ? "✓" : "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bottom Navigation */}
                  <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={async () => {
                        await handleSave(undefined, true);
                        setTimeout(() => {
                          router.push(`/${locale}/dashboard/owner/listings`);
                        }, 3000);
                      }}
                      className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      <ChevronLeft size={14} /> {t("actions.back")}
                    </button>
                    <div className="flex items-center gap-2">
                      {active !== "details" && (
                        <button
                          onClick={() =>
                            setActive(
                              SECTIONS[
                                SECTIONS.findIndex((s) => s.id === active) - 1
                              ].id,
                            )
                          }
                          className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          {t("actions.previous")}
                        </button>
                      )}
                      {active !== "publish" ? (
                        <button
                          onClick={() =>
                            setActive(
                              SECTIONS[
                                SECTIONS.findIndex((s) => s.id === active) + 1
                              ].id,
                            )
                          }
                          className="px-5 py-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all"
                        >
                          {t("actions.next")}{" "}
                          <ChevronRight size={14} className="inline" />
                        </button>
                      ) : (
                        <Tooltip text={t("tooltips.save")}>
                          <button
                            onClick={() => handleSave(undefined, true)}
                            disabled={saving}
                            className="px-5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50"
                          >
                            {saving ? (
                              <Loader2
                                size={12}
                                className="animate-spin inline mr-1"
                              />
                            ) : (
                              <Save size={12} className="inline mr-1" />
                            )}
                            {t("actions.save")}
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Auto-save Toast */}
      {lastSaved && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-white dark:bg-slate-800 py-2 pl-3 pr-2 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 z-50">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            {t("autoSave.saved")}{" "}
            {lastSaved.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <Tooltip text={t("tooltips.save")}>
            <button
              onClick={() => handleSave(undefined, true)}
              className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-full flex items-center justify-center hover:shadow active:scale-90 transition-all"
            >
              <Save size={11} />
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
