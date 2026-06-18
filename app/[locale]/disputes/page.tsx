// app/[locale]/disputes/page.tsx
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  IoChevronForwardOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoHomeOutline,
  IoTimeOutline,
  IoScaleOutline,
  IoAddOutline,
  IoCheckmarkCircleOutline,
  IoHourglassOutline,
  IoCloseCircleOutline,
  IoDocumentTextOutline,
  IoChatbubblesOutline,
  IoEyeOutline,
  IoSearchOutline,
} from "react-icons/io5";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { TenantHeader } from "@/components/ui/header/TenantHeader";
import { useDisputes } from "./hooks/useDisputes";
import { NewDisputeModal } from "@/components/ui/modals/NewDisputeModal";

// ============================================
// CONSTANTES UI
// ============================================
const GRADIENT_BUTTON = `
  bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 
  hover:from-sky-600 hover:via-indigo-600 hover:to-purple-700
  text-white shadow-md hover:shadow-lg 
  transition-all duration-300
`;

const GRADIENT_TEXT =
  "bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent";

const pipListingImage = (url: string) => {
  if (!url) return "";
  return `/api/listings/image?url=${encodeURIComponent(url)}`;
};

const pipAvatar = (url: string) => {
  if (!url) return "";
  return `/api/users/avatar?url=${encodeURIComponent(url)}`;
};

// ============================================
// TYPES DE LITIGES (traductions)
// ============================================
const getTypeLabel = (type: string, t: any) => {
  const types: Record<string, string> = {
    DAMAGE: t("types.damage"),
    CLEANING: t("types.cleaning"),
    MISREPRESENTATION: t("types.misrepresentation"),
    NOISE: t("types.noise"),
    PAYMENT: t("types.payment"),
    CANCELLATION: t("types.cancellation"),
    OTHER: t("types.other"),
  };
  return types[type] || t("types.other");
};

const getStatusConfig = (status: string, t: any) => {
  const configs: Record<
    string,
    { label: string; color: string; bg: string; border: string; icon: any }
  > = {
    OPEN: {
      label: t("status.open"),
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      icon: IoHourglassOutline,
    },
    IN_REVIEW: {
      label: t("status.inReview"),
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20",
      icon: IoTimeOutline,
    },
    RESOLVED: {
      label: t("status.resolved"),
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      icon: IoCheckmarkCircleOutline,
    },
    REJECTED: {
      label: t("status.rejected"),
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      icon: IoCloseCircleOutline,
    },
  };
  return configs[status] || configs.OPEN;
};

// ============================================
// FONCTIONS UTILITAIRES
// ============================================
function formatShort(dateStr: string, locale: string = "fr") {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString(
    locale === "fr" ? "fr-FR" : "en-US",
    {
      day: "numeric",
      month: "short",
    },
  );
}

function getDaysAgo(dateStr: string, t: any) {
  if (!dateStr) return t("date.unknown");
  const diff = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 86400000,
  );
  if (diff === 0) return t("date.today");
  if (diff === 1) return t("date.yesterday");
  return t("date.daysAgo", { days: diff });
}

// ============================================
// TOAST COMPONENT
// ============================================
function ToastNotification({
  toast,
  onClose,
}: {
  toast: { type: "success" | "error" | "info"; message: string } | null;
  onClose: () => void;
}) {
  if (!toast) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === "success"
            ? "bg-green-500 text-white"
            : toast.type === "error"
              ? "bg-red-500 text-white"
              : "bg-sky-500 text-white"
        }`}
      >
        {toast.type === "success" ? (
          <CheckCircle className="w-5 h-5" />
        ) : toast.type === "error" ? (
          <AlertCircle className="w-5 h-5" />
        ) : (
          <IoChatbubblesOutline className="w-5 h-5" />
        )}
        <span className="text-sm font-medium">{toast.message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// COMPOSANT STATISTIQUE
// ============================================
function StatCard({
  label,
  value,
  icon,
  iconBg,
  delay,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  delay: number;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [current, setCurrent] = useState(0);

  // Animation du compteur
  setTimeout(() => setCurrent(value), delay * 1000);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -2, scale: 1.02 }}
      className={`p-4 rounded-2xl border transition-all cursor-default ${isDark ? "bg-white/[0.02] border-white/[0.05]" : "bg-white/70 border-white/50 shadow-sm"}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center text-sm`}
        >
          {icon}
        </div>
        <span
          className={`text-2xl font-black ${isDark ? "text-white/70" : "text-slate-700"}`}
        >
          {current}
        </span>
      </div>
      <p
        className={`text-[10px] font-extrabold uppercase tracking-[0.15em] ${isDark ? "text-white/25" : "text-slate-500"}`}
      >
        {label}
      </p>
    </motion.div>
  );
}

// ============================================
// COMPOSANT CARTE DE LITIGE
// ============================================
function DisputeCard({
  dispute,
  delay = 0,
  t,
}: {
  dispute: any;
  delay?: number;
  t: any;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const params = useParams();
  const locale = params.locale as string;
  const statusConfig = getStatusConfig(dispute.status, t);
  const StatusIcon = statusConfig.icon;
  const isActive = dispute.status === "OPEN" || dispute.status === "IN_REVIEW";
  const [imgError, setImgError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const listingTitle = dispute.booking?.listing?.title || t("common.listing");
  const listingGovernorate = dispute.booking?.listing?.governorate || "";
  const listingDelegation = dispute.booking?.listing?.delegation || "";
  const listingImage = dispute.booking?.listing?.images?.[0] || null;
  const checkIn = dispute.booking?.checkIn;
  const checkOut = dispute.booking?.checkOut;
  const updatedAt = dispute.updatedAt;
  const reference =
    dispute.booking?.reference || `LIT-${dispute.id?.slice(-6).toUpperCase()}`;
  const description = dispute.description || "";
  const user = dispute.booking?.tenant;
  const username = user?.username || t("common.user");
  const userAvatar = user?.profilePictureUrl;
  const typeLabel = getTypeLabel(dispute.type, t);

  return (
    <Link href={`/${locale}/disputes/${dispute.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        whileHover={{ y: -3 }}
        className="group cursor-pointer"
      >
        <div
          className={`relative ${!isActive ? "opacity-55" : ""} transition-all`}
        >
          <div className="relative rounded-[24px] overflow-hidden transition-all bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md">
            {/* Bandeau coloré selon statut */}
            <div
              className={`h-0.5 ${
                dispute.status === "OPEN"
                  ? "bg-amber-400"
                  : dispute.status === "IN_REVIEW"
                    ? "bg-sky-400"
                    : dispute.status === "RESOLVED"
                      ? "bg-emerald-400"
                      : "bg-rose-400"
              }`}
            />

            <div className="p-5">
              <div className="flex gap-4">
                {/* Image */}
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
                  {listingImage && !imgError ? (
                    <img
                      src={pipListingImage(listingImage)}
                      alt={listingTitle}
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <IoHomeOutline className="text-2xl text-slate-400" />
                    </div>
                  )}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                      {typeLabel}
                    </span>
                    <span
                      className={`flex items-center gap-1.5 text-[9px] font-extrabold uppercase ${statusConfig.color} ${statusConfig.bg} px-2.5 py-0.5 rounded-full border ${statusConfig.border}`}
                    >
                      <StatusIcon className="text-[10px]" />
                      {statusConfig.label}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold truncate text-slate-800 dark:text-white">
                    {listingTitle}
                  </h3>

                  {(listingGovernorate || listingDelegation) && (
                    <p className="text-[10px] flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <IoLocationOutline className="text-[10px]" />
                      {[listingGovernorate, listingDelegation]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-slate-400 dark:text-slate-500">
                    {checkIn && checkOut && (
                      <>
                        <span className="text-[10px] flex items-center gap-1">
                          <IoCalendarOutline className="text-[10px]" />
                          {formatShort(checkIn, locale)} →{" "}
                          {formatShort(checkOut, locale)}
                        </span>
                        <span className="text-[10px]">·</span>
                      </>
                    )}
                    <span className="text-[10px] flex items-center gap-1">
                      <IoTimeOutline className="text-[10px]" />
                      {getDaysAgo(updatedAt, t)}
                    </span>
                  </div>

                  {/* Avatar utilisateur */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                      {userAvatar && !avatarError ? (
                        <img
                          src={pipAvatar(userAvatar)}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={() => setAvatarError(true)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-slate-500">
                          {username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      @{username}
                    </span>
                  </div>
                </div>

                {/* Flèche action */}
                <div className="flex items-center flex-shrink-0">
                  <div className="w-8 h-8 rounded-xl border flex items-center justify-center bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 group-hover:border-indigo-300 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/30 transition-all">
                    <IoChevronForwardOutline className="text-xs text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>

              {/* Description */}
              {description && (
                <p className="text-[11px] mt-3 line-clamp-2 text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">
                  {reference}
                </span>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <IoEyeOutline className="text-[10px] text-slate-400 dark:text-slate-500" />
                  <span className="text-[9px] text-slate-400 dark:text-slate-500">
                    {t("actions.viewDetails")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ============================================
// PAGE PRINCIPALE
// ============================================
export default function DisputesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const t = useTranslations("DisputesPage");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    loading,
    activeDisputes,
    pastDisputes,
    totalCount,
    filter,
    searchQuery,
    toast,
    stats,
    resolutionRate,
    setFilter,
    setSearchQuery,
    hideToast,
    refreshDisputes,
  } = useDisputes();

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen={true}
        variant="spinner"
        size="lg"
        color="primary"
        text={t("loading")}
        speed="normal"
      />
    );
  }

  return (
    <div
      className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-gradient-to-br from-sky-50 via-white to-indigo-50"}`}
    >
      <TenantHeader />

      <ToastNotification toast={toast} onClose={hideToast} />

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] shadow-sm bg-white/75 border-white/70 text-indigo-600 dark:bg-slate-900/70 dark:border-white/10 dark:text-indigo-300">
            <IoScaleOutline className="h-3 w-3" />
            {t("badge")}
          </div>
          <h1 className="text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
            {t("title")}{" "}
            <span className={GRADIENT_TEXT}>{t("titleHighlight")}</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            {t("description")}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Colonne gauche */}
          <div className="lg:col-span-8 space-y-8">
            {/* Barre de recherche et filtres */}
            <div className="flex flex-wrap items-center gap-3">
              <div
                className={`flex items-center gap-2 rounded-xl px-3 py-2 border flex-1 min-w-[200px] ${isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200"}`}
              >
                <IoSearchOutline className="text-sm text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("search.placeholder")}
                  className={`flex-1 bg-transparent outline-none text-sm ${isDark ? "text-white placeholder-white/20" : "text-slate-600 placeholder-slate-400"}`}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  {
                    key: "all" as const,
                    label: t("filters.all"),
                    count: totalCount,
                  },
                  {
                    key: "active" as const,
                    label: t("filters.active"),
                    count: activeDisputes.length,
                  },
                  {
                    key: "resolved" as const,
                    label: t("filters.resolved"),
                    count: pastDisputes.length,
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      filter === tab.key
                        ? "bg-indigo-500 text-white shadow-md"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {tab.label}
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-white/20 text-white text-[10px]">
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Bouton Nouveau litige - OUVRE LE MODAL */}
              <button
                onClick={() => setIsModalOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold ${GRADIENT_BUTTON}`}
              >
                <IoAddOutline className="text-sm" />
                {t("newDispute")}
              </button>
            </div>

            {/* Litiges actifs */}
            {activeDisputes.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  {t("activeDisputes")} ({activeDisputes.length})
                </h2>
                <div className="space-y-3">
                  {activeDisputes.map((d, i) => (
                    <DisputeCard
                      key={d.id}
                      dispute={d}
                      delay={i * 0.05}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Historique */}
            {pastDisputes.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <IoCheckmarkCircleOutline className="text-sm text-emerald-500" />
                  {t("history")} ({pastDisputes.length})
                </h2>
                <div className="space-y-3">
                  {pastDisputes.map((d, i) => (
                    <DisputeCard
                      key={d.id}
                      dispute={d}
                      delay={i * 0.05}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* État vide */}
            {activeDisputes.length === 0 && pastDisputes.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <IoDocumentTextOutline className="text-2xl text-slate-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  {t("empty.title")}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {t("empty.description")}
                </p>
              </div>
            )}
          </div>

          {/* Colonne droite - Statistiques */}
          <div className="lg:col-span-4 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label={t("stats.pending")}
                value={stats.open}
                icon={<IoHourglassOutline />}
                iconBg="bg-amber-500/10 text-amber-400 border border-amber-500/20"
                delay={0.1}
              />
              <StatCard
                label={t("stats.inReview")}
                value={stats.inReview}
                icon={<IoTimeOutline />}
                iconBg="bg-sky-500/10 text-sky-400 border border-sky-500/20"
                delay={0.15}
              />
              <StatCard
                label={t("stats.resolved")}
                value={stats.resolved}
                icon={<IoCheckmarkCircleOutline />}
                iconBg="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                delay={0.2}
              />
              <StatCard
                label={t("stats.rejected")}
                value={stats.rejected}
                icon={<IoCloseCircleOutline />}
                iconBg="bg-rose-500/10 text-rose-400 border border-rose-500/20"
                delay={0.25}
              />
            </div>

            {/* Résumé */}
            <div className="p-5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">
                {t("summary.title")}
              </h3>
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{t("summary.resolutionRate")}</span>
                  <span className="font-semibold">{resolutionRate}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${resolutionRate}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    {t("summary.totalDisputes")}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-white">
                    {activeDisputes.length + pastDisputes.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    {t("summary.successRate")}
                  </span>
                  <span className="font-semibold text-emerald-500">
                    {resolutionRate}%
                  </span>
                </div>
              </div>
            </div>

            {/* Processus */}
            <div className="p-5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">
                {t("process.title")}
              </h3>
              <div className="space-y-4">
                {[
                  {
                    step: "1",
                    title: t("process.step1"),
                    desc: t("process.step1Desc"),
                  },
                  {
                    step: "2",
                    title: t("process.step2"),
                    desc: t("process.step2Desc"),
                  },
                  {
                    step: "3",
                    title: t("process.step3"),
                    desc: t("process.step3Desc"),
                  },
                  {
                    step: "4",
                    title: t("process.step4"),
                    desc: t("process.step4Desc"),
                  },
                ].map((s) => (
                  <div key={s.title} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center">
                      {s.step}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-white">
                        {s.title}
                      </p>
                      <p className="text-[10px] text-slate-500">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL NOUVEAU LITIGE */}
      <NewDisputeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          refreshDisputes();
        }}
      />
    </div>
  );
}
