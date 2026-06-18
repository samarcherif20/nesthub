// app/[locale]/disputes/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import {
  IoCalendarOutline,
  IoLocationOutline,
  IoHomeOutline,
  IoTimeOutline,
  IoScaleOutline,
  IoChatbubblesOutline,
  IoFlagOutline,
  IoChevronForwardOutline,
  IoDocumentTextOutline,
  IoPersonOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoChevronBack,
} from "react-icons/io5";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { TenantHeader } from "@/components/ui/header/TenantHeader";
import { useDisputeDetail } from "./hooks/useDisputeDetail";

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

const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; border: string; icon: any }
> = {
  OPEN: {
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: IoTimeOutline,
  },
  IN_REVIEW: {
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-200",
    icon: IoTimeOutline,
  },
  RESOLVED: {
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: IoCheckmarkCircleOutline,
  },
  REJECTED: {
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    icon: IoCloseCircleOutline,
  },
};

const TYPE_LABELS: Record<string, string> = {
  DAMAGE: "damage",
  CLEANING: "cleaning",
  MISREPRESENTATION: "misrepresentation",
  NOISE: "noise",
  PAYMENT: "payment",
  CANCELLATION: "cancellation",
  OTHER: "other",
};

function formatDate(dateStr: string) {
  if (!dateStr) return "Date non spécifiée";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShort(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const t = useTranslations("DisputesPage");

  const {
    dispute,
    loading,
    error,
    imgError,
    mainImage,
    isResolved,
    disputeRef,
    nights,
    setImgError,
  } = useDisputeDetail(params.id as string);

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

  if (error || !dispute) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDark ? "bg-slate-950" : "bg-gradient-to-br from-sky-50 via-white to-indigo-50"}`}
      >
        <div className="text-center">
          <IoDocumentTextOutline className="text-5xl text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500">Litige non trouvé</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-indigo-600 hover:underline"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.OPEN;
  const StatusIcon = statusConfig.icon;
  const typeKey = TYPE_LABELS[dispute.type] || "other";
  const typeLabel = t(`types.${typeKey}`);
  const statusLabel = t(`status.${dispute.status.toLowerCase()}`);

  return (
    <div
      className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-gradient-to-br from-sky-50 via-white to-indigo-50"}`}
    >
      <TenantHeader />

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider">
            <Link
              href={`/${locale}/search`}
              className="text-slate-500 hover:text-indigo-600 transition uppercase"
            >
              {t("breadcrumb.home")}
            </Link>
            <IoChevronForwardOutline className="h-3 w-3 text-slate-400" />
            <Link
              href={`/${locale}/disputes`}
              className="text-slate-500 hover:text-indigo-600 transition uppercase"
            >
              {t("breadcrumb.disputes")}
            </Link>
            <IoChevronForwardOutline className="h-3 w-3 text-slate-400" />
            <span className="text-indigo-600 dark:text-indigo-400 uppercase font-extrabold">
              {disputeRef}
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] shadow-sm bg-white/75 border-white/70 text-indigo-600 dark:bg-slate-900/70 dark:border-white/10 dark:text-indigo-300">
            <IoScaleOutline className="h-3 w-3" />
            {t("detail.badge")}
          </div>
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                {t("detail.title")}{" "}
                <span className={GRADIENT_TEXT}>{disputeRef}</span>
              </h1>
              <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
                {dispute.booking.listing.title}
              </p>
            </div>
            <div className="flex gap-2">
              <span
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}
              >
                <StatusIcon className="text-xs" />
                {statusLabel}
              </span>
              {dispute.priority === "HIGH" && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                  <IoFlagOutline className="text-xs" />
                  {t("detail.urgent")}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Colonne gauche */}
          <div className="lg:col-span-8 space-y-6">
            {/* Carte du logement */}
            <div className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="relative h-56 overflow-hidden">
                {mainImage && !imgError ? (
                  <img
                    src={pipListingImage(mainImage)}
                    alt={dispute.booking.listing.title}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-sky-950/50 dark:to-indigo-950/50">
                    <IoHomeOutline className="text-5xl text-slate-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-5 right-5">
                  <h3 className="text-white font-bold text-xl">
                    {dispute.booking.listing.title}
                  </h3>
                  <p className="text-white/80 text-sm flex items-center gap-1 mt-1">
                    <IoLocationOutline className="text-sm" />
                    {dispute.booking.listing.governorate},{" "}
                    {dispute.booking.listing.delegation}
                  </p>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {t("detail.arrival")}
                    </p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                      {formatShort(dispute.booking.checkIn)}
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {t("detail.departure")}
                    </p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                      {formatShort(dispute.booking.checkOut)}
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {t("detail.duration")}
                    </p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                      {nights} {t("detail.nights")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description du litige */}
            <div className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center">
                  <IoFlagOutline className="text-indigo-500 text-lg" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    {t("detail.reason")}
                  </h3>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {typeLabel}
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {dispute.description}
              </p>
            </div>

            {/* Résolution */}
            {dispute.resolution && (
              <div className="rounded-2xl border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <IoCheckmarkCircleOutline className="text-emerald-500 text-lg" />
                  </div>
                  <h3 className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                    {t("detail.resolution")}
                  </h3>
                </div>
                <p className="text-sm text-emerald-700 dark:text-emerald-400/80 leading-relaxed">
                  {dispute.resolution}
                </p>
              </div>
            )}
          </div>

          {/* Colonne droite */}
          <div className="lg:col-span-4 space-y-5">
            {/* Participants */}
            <div className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                <IoPersonOutline className="text-indigo-500" />
                {t("detail.participants")}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                    {dispute.booking.tenant.profilePictureUrl ? (
                      <img
                        src={pipAvatar(
                          dispute.booking.tenant.profilePictureUrl,
                        )}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-bold text-slate-500">
                        {dispute.booking.tenant.username
                          ?.charAt(0)
                          ?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {t("detail.tenant")}
                    </p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      @{dispute.booking.tenant.username}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                    {dispute.booking.owner.profilePictureUrl ? (
                      <img
                        src={pipAvatar(dispute.booking.owner.profilePictureUrl)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-bold text-slate-500">
                        {dispute.booking.owner.username
                          ?.charAt(0)
                          ?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {t("detail.owner")}
                    </p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      @{dispute.booking.owner.username}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-xl bg-gradient-to-r from-indigo-50/30 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/20">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                    <IoScaleOutline className="text-white text-lg" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {t("detail.mediator")}
                    </p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      {t("detail.mediatorTeam")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                <IoCalendarOutline className="text-indigo-500" />
                {t("detail.timeline")}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {t("detail.openedOn")}
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    {formatDate(dispute.createdAt)}
                  </p>
                </div>
                <div className="flex justify-between items-center py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {t("detail.lastUpdate")}
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    {formatDate(dispute.updatedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Bouton conversation */}
            {!isResolved && (
              <Link href={`/${locale}/messages`}>
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center justify-center gap-3 rounded-xl px-5 py-3.5 text-sm font-bold uppercase tracking-wide ${GRADIENT_BUTTON}`}
                >
                  <IoChatbubblesOutline className="text-xl" />
                  {t("actions.goToConversation")}
                </motion.button>
              </Link>
            )}

            {/* Message si résolu */}
            {isResolved && (
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 text-center">
                <p className="text-xs text-slate-500">{t("detail.closed")}</p>
              </div>
            )}

            {/* Bouton retour */}
            <button
              onClick={() => router.back()}
              className="w-full flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition mt-4"
            >
              <IoChevronBack className="text-lg" />
              {t("actions.backToList")}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
