// app/[locale]/reservations/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  Ban,
  BedDouble,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Compass,
  Crown,
  Flame,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  Receipt,
  Search,
  Shield,
  Star,
  TrendingUp,
  Users,
  Wallet,
  X,
  Sparkles,
  Calendar,
  Calendar1Icon,
  CalendarIcon,
  CalendarCheck,
  User,
  Info,
} from "lucide-react";
import { SiHomeadvisor } from "react-icons/si";

import { TenantHeader } from "@/components/ui/header/TenantHeader";
import { ReviewModal } from "@/components/ui/modals/ReviewModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useReservations } from "./hooks/useReservations";

const PATTERN_SVG =
  "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E";

// ─── Helper functions ──────────────────────────────────────────────────────────
const proxyImage = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;
const pipAvatar = (url: string) =>
  `/api/users/avatar?url=${encodeURIComponent(url)}`;

function formatDateShort(d: string, locale: string = "fr") {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
  });
}

function formatDateLong(d: string, locale: string = "fr") {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "long",
  });
}

// ─── Toast Component ───────────────────────────────────────────────────────────
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-sky-500",
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <X className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${styles[type]} text-white`}
      >
        {icons[type]}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Status configuration ──────────────────────────────────────────────────────
const getStatusConfig = (status: string, t: any) => {
  const configs: Record<string, any> = {
    PENDING: {
      label: t("status.pending"),
      icon: Clock,
      bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
      text: "text-amber-700 dark:text-amber-400",
    },
    ACCEPTED: {
      label: t("status.accepted"),
      icon: CheckCircle2,
      bg: "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20",
      text: "text-sky-700 dark:text-sky-400",
    },
    CONFIRMED: {
      label: t("status.confirmed"),
      icon: Shield,
      bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
      text: "text-emerald-700 dark:text-emerald-400",
    },
    COMPLETED: {
      label: t("status.completed"),
      icon: Crown,
      bg: "bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20",
      text: "text-violet-700 dark:text-violet-400",
    },
    CANCELLED: {
      label: t("status.cancelled"),
      icon: Ban,
      bg: "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/30",
      text: "text-slate-500 dark:text-slate-400",
    },
    REJECTED: {
      label: t("status.rejected"),
      icon: X,
      bg: "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20",
      text: "text-rose-700 dark:text-rose-400",
    },
  };
  return configs[status] || configs.PENDING;
};

// ─── Gradient constants ────────────────────────────────────────────────────────
const GRADIENT_BUTTON = `
  bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 
  hover:from-sky-600 hover:via-indigo-600 hover:to-purple-700
  text-white shadow-md hover:shadow-lg 
  transition-all duration-300
`;

const GRADIENT_TEXT =
  "bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent";

// ─── Countdown component ───────────────────────────────────────────────────────
function Countdown({ date, t }: { date: string; t: any }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const days = Math.ceil((new Date(date).getTime() - now) / 86400000);
  if (days <= 0) return null;
  if (days === 1)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-bold text-white shadow-md">
        {t("countdown.tomorrow")}
      </span>
    );
  if (days <= 7)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-bold text-white shadow-md">
        {t("countdown.days", { days })}
      </span>
    );
  if (days <= 30)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
        {t("countdown.daysOnly", { days })}
      </span>
    );
  return null;
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function Reservations() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "fr";
  const t = useTranslations("ReservationsPage");
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [recLoading, setRecLoading] = useState(true);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<
    any | null
  >(null);

  // Utiliser le hook useReservations
  const {
    tab,
    setTab,
    reservations,
    isLoading,
    toast,
    loading,
    upcoming,
    past,
    cancelled,
    spent,
    nightsCount,
    reviewedCount,
    favorites,
    toggleFavorite,
    downloadReceipt,
    showToast,
    handlePay,
    handleCancel,
    handleSubmitReview,
    loadReservations,
  } = useReservations();

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadRecommendations = async () => {
    setRecLoading(true);
    try {
      const res = await fetch("/api/listings?featured=true&limit=3");
      if (res.ok) {
        const data = await res.json();
        const listings = data.listings ?? [];

        console.log("🔍 API Listings:", listings); // Debug

        const formatted = listings.map((l: any, idx: number) => {
          // ✅ Récupérer l'image depuis l.photo (attention: c'est "photo" pas "photos")
          let imageUrl = null;

          // L'API retourne "photo" (singulier) car on a pris une seule photo
          if (l.photo?.url) {
            imageUrl = l.photo.url;
          }
          // Fallback sur photos si présent
          else if (l.photos && l.photos.length > 0) {
            imageUrl = l.photos[0]?.url;
          }

          const finalImageUrl = imageUrl ? proxyImage(imageUrl) : null;

          console.log(`Listing ${l.id} - image:`, finalImageUrl);

          return {
            id: l.id,
            title: l.title,
            location:
              l.location ||
              `${l.delegation || ""}, ${l.governorate || ""}`.replace(
                /^, /,
                "",
              ),
            pricePerNight: l.pricePerNight || 250,
            image: finalImageUrl,
            beds: l.rooms || 2,
            rating: l.rating || (4.5 + idx * 0.2).toFixed(1),
          };
        });

        setRecommendations(formatted);
      }
    } catch (err) {
      console.error("Erreur chargement recommandations:", err);
    } finally {
      setRecLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  // Filtrer par recherche
  const filteredList = (() => {
    const source =
      tab === "UPCOMING" ? upcoming : tab === "PAST" ? past : cancelled;
    let filtered = source;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((b) =>
        `${b.listing.title} ${b.listing.location} ${b.owner.name}`
          .toLowerCase()
          .includes(q),
      );
    }
    return filtered.sort(
      (a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime(),
    );
  })();

  const CARD_STYLE =
    "rounded-2xl border border-white/70 bg-white/85 shadow-[0_8px_28px_rgba(15,23,42,0.04)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/85";

  if (isLoading || !mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <TenantHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-73px)]">
          <LoadingSpinner
            text={t("loading")}
            size="lg"
            color="primary"
            variant="spinner"
            speed="normal"
          />
        </div>
      </div>
    );
  }

  const hasBookings = reservations.length > 0;

  // Fonction wrapper pour handleSubmitReview avec le bon paramètre
  const onReviewSubmit = async (reviewData: any) => {
    if (!selectedBookingForReview) return;
    const success = await handleSubmitReview(
      selectedBookingForReview.id,
      reviewData,
    );
    if (success) {
      setSelectedBookingForReview(null);
      await loadReservations();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <TenantHeader />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        {/* Header with badge */}
        <div className="mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-indigo-600 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/70 dark:text-indigo-300">
            <CalendarCheck className="h-3.5 w-3.5 text-indigo-600 dark:fill-indigo-300 dark:text-indigo-300" />
            {t("badge")}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-6xl">
            {t("title")}{" "}
            <span className={GRADIENT_TEXT}>{t("titleGradient")}</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400 md:text-base">
            {t("description")}
          </p>
        </div>

        {/* STATS BANNER */}
        <div className="relative mb-10 overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5" />
          <div className="relative grid gap-0 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 dark:divide-white/10">
            {[
              {
                icon: CalendarDays,
                label: t("stats.upcoming"),
                value: upcoming.length,
                unit: t("stats.reservations", { count: upcoming.length }),
                grad: "from-sky-400 to-blue-500",
                color: "text-sky-600 dark:text-sky-400",
              },
              {
                icon: Crown,
                label: t("stats.completed"),
                value: past.length,
                unit: t("stats.stays", { count: past.length }),
                grad: "from-violet-400 to-purple-500",
                color: "text-violet-600 dark:text-violet-400",
              },
              {
                icon: CircleDollarSign,
                label: t("stats.spent"),
                value: `${spent.toLocaleString()} TND`,
                unit: t("stats.nights", { count: nightsCount }),
                grad: "from-emerald-400 to-teal-500",
                color: "text-emerald-600 dark:text-emerald-400",
              },
              {
                icon: TrendingUp,
                label: t("stats.avgRating"),
                value: "4.8/5",
                unit: t("stats.reviews", { count: reviewedCount }),
                grad: "from-amber-400 to-orange-500",
                color: "text-amber-600 dark:text-amber-400",
              },
            ].map(({ icon: Icon, label, value, unit, grad, color }) => (
              <div key={label} className="flex items-center gap-4 px-6 py-6">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${grad} text-white shadow-md`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                    {label}
                  </p>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {value}
                  </p>
                  <p className={`text-[11px] font-semibold ${color}`}>{unit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SEARCH + TABS */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="overflow-x-auto pb-1">
            <div className="flex items-center gap-2">
              {[
                {
                  key: "UPCOMING",
                  label: t("tabs.upcoming"),
                  count: upcoming.length,
                  icon: CalendarDays,
                },
                {
                  key: "PAST",
                  label: t("tabs.past"),
                  count: past.length,
                  icon: CheckCircle2,
                },
                {
                  key: "CANCELLED",
                  label: t("tabs.cancelled"),
                  count: cancelled.length,
                  icon: Ban,
                },
              ].map(({ key, label, count, icon: Icon }) => {
                const active = tab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key as any)}
                    className={`hover:cursor-pointer flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                      active
                        ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20"
                        : "border-white/70 bg-white/80 text-slate-600 shadow-sm backdrop-blur-md hover:border-indigo-200 border-2 hover:text-indigo-600 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-400"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${active ? "text-white" : "text-slate-400"}`}
                    />
                    {label}
                    {count > 0 && (
                      <span
                        className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 dark:bg-white/5"}`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Reservations list */}
          <div className="space-y-5">
            {!hasBookings ? (
              <div
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white/50 p-12 text-center dark:border-white/20 dark:bg-slate-900/30"
                style={{ minHeight: "calc(320px + 340px)" }}
              >
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-purple-600/10 backdrop-blur-sm mx-auto">
                  <Calendar1Icon className="h-12 w-12 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {t("empty.title")}
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {t("empty.description")}
                </p>
                <Link
                  href={`/${locale}/search`}
                  className={`mt-6 inline-flex items-center gap-2 rounded-full ${GRADIENT_BUTTON} px-6 py-2.5 text-sm font-bold shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.02]`}
                >
                  <SiHomeadvisor className="h-4 w-4" /> {t("empty.button")}
                </Link>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-gray-50 p-12 text-center dark:border-white/20 dark:bg-slate-900/30 min-h-[450px]">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-purple-600/10 backdrop-blur-sm mx-auto">
                  <CalendarIcon className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t("noResults.title")}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t("noResults.description")}
                </p>
                <button
                  type="button"
                  onClick={() => setTab("UPCOMING")}
                  className={`mt-5 rounded-full ${GRADIENT_BUTTON} px-5 py-2 text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]`}
                >
                  {t("noResults.button")}
                </button>
              </div>
            ) : (
              filteredList.map((b) => {
                const isExpanded = expanded === b.id;
                const cfg = getStatusConfig(b.status, t);
                const Icon = cfg.icon;
                const isPendingPayment = b.status === "ACCEPTED" && !b.isPaid;
                const isActive =
                  (b.status === "CONFIRMED" || b.status === "ACCEPTED") &&
                  b.isPaid;
                const imageUrl = b.listing.image
                  ? proxyImage(b.listing.image)
                  : null;

                return (
                  <div
                    key={b.id}
                    className={`${CARD_STYLE} overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.10)] ${isExpanded ? "ring-2 ring-indigo-500/20" : ""}`}
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Image section */}
                      <div className="relative h-56 overflow-hidden bg-slate-200 dark:bg-slate-800 md:w-64 md:h-auto md:flex-shrink-0">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={b.listing.title}
                            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-600">
                            <Compass className="h-12 w-12 text-white/40" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/5 to-transparent" />
                        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${cfg.bg} ${cfg.text} shadow-sm backdrop-blur-sm`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {cfg.label}
                          </span>
                          {b.isPaid && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-3 py-1.5 text-[10px] font-bold text-white shadow-md backdrop-blur-sm">
                              <Check className="h-3 w-3" />
                              {t("badges.paid")}
                            </span>
                          )}
                          {isPendingPayment && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-3 py-1.5 text-[10px] font-bold text-white shadow-md backdrop-blur-sm animate-pulse">
                              <Wallet className="h-3 w-3" />
                              {t("badges.toPay")}
                            </span>
                          )}
                        </div>
                        <div className="absolute bottom-4 left-4">
                          <Countdown date={b.checkIn} t={t} />
                        </div>
                      </div>

                      {/* Content section */}
                      <div className="flex flex-col justify-between flex-1 p-5">
                        <div>
                          <div className="mb-3 flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                                {b.listing.title}
                              </h3>
                              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                {b.listing.location}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                setExpanded(isExpanded ? null : b.id)
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
                            >
                              <ArrowRight
                                className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                              />
                            </button>
                          </div>

                          <div className="mb-3 flex flex-wrap items-center gap-2.5 text-xs">
                            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                              <CalendarDays className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                              {formatDateShort(b.checkIn, locale)}{" "}
                              <span className="text-slate-300">→</span>{" "}
                              {formatDateShort(b.checkOut, locale)}
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                              <Users className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                              {t("guestsAndNights", {
                                guests: b.guests,
                                nights: b.nights,
                              })}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">
                              {b.listing.type === "VILLA"
                                ? t("propertyTypes.villa")
                                : b.listing.type === "HOUSE"
                                  ? t("propertyTypes.house")
                                  : t("propertyTypes.apartment")}
                            </span>
                          </div>

                          {/* Host section with clickable profile */}
                          <Link
                            href={`/${locale}/profile/${b.owner.username || b.owner.id}`}
                          >
                            <div className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 px-4 py-2.5 transition-all hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10">
                              {b.owner.image ? (
                                <img
                                  src={pipAvatar(b.owner.image)}
                                  alt={b.owner.name}
                                  className="h-8 w-8 rounded-xl object-cover"
                                />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 text-[11px] font-bold text-white shadow-md shadow-indigo-500/15">
                                  {b.owner.name?.charAt(0).toUpperCase() || "H"}
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                  {b.owner.name}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {t("host")}
                                </p>
                              </div>
                              <User className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                            </div>
                          </Link>

                          {isExpanded && (
                            <div className="mt-4 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 dark:bg-white/5">
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-slate-500">
                                    {b.listing.pricePerNight?.toLocaleString()}{" "}
                                    {t("currency")} × {b.nights}{" "}
                                    {t("nightsShort")}
                                  </span>
                                  <span className="font-bold">
                                    {(
                                      (b.listing.pricePerNight || 0) * b.nights
                                    ).toLocaleString()}{" "}
                                    {t("currency")}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">
                                    {t("cleaningFee")}
                                  </span>
                                  <span className="font-bold">
                                    {(b.cleaningFee || 0).toLocaleString()}{" "}
                                    {t("currency")}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">
                                    {t("serviceFee")}
                                  </span>
                                  <span className="font-bold">
                                    {(b.serviceFee || 0).toLocaleString()}{" "}
                                    {t("currency")}
                                  </span>
                                </div>
                                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold dark:border-white/10">
                                  <span className={GRADIENT_TEXT}>
                                    {t("total")}
                                  </span>
                                  <span className={GRADIENT_TEXT}>
                                    {b.totalPrice.toLocaleString()}{" "}
                                    {t("currency")}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                  {t("timeline.title")}
                                </p>
                                {[
                                  {
                                    date: b.checkIn,
                                    label: t("timeline.checkIn"),
                                    active: true,
                                  },
                                  {
                                    date: b.checkOut,
                                    label: t("timeline.checkOut"),
                                    active: b.status !== "PENDING",
                                  },
                                  {
                                    date: "",
                                    label: b.isPaid
                                      ? t("timeline.paid")
                                      : t("timeline.payment"),
                                    active: b.isPaid,
                                  },
                                  {
                                    date: "",
                                    label: t("timeline.review"),
                                    active: b.hasReview,
                                  },
                                ].map((tItem, idx, arr) => (
                                  <div
                                    key={tItem.label}
                                    className="flex items-start gap-3"
                                  >
                                    <div className="flex flex-col items-center">
                                      <div
                                        className={`h-3 w-3 rounded-full border-2 ${tItem.active ? "border-indigo-500 bg-indigo-500" : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900"}`}
                                      />
                                      {idx !== arr.length - 1 && (
                                        <div
                                          className={`h-5 w-0.5 ${tItem.active ? "bg-indigo-300 dark:bg-indigo-700" : "bg-slate-200 dark:bg-slate-700"}`}
                                        />
                                      )}
                                    </div>
                                    <div className="pb-2.5">
                                      <p
                                        className={`text-xs font-bold ${tItem.active ? "text-slate-800 dark:text-white" : "text-slate-400 dark:text-slate-600"}`}
                                      >
                                        {tItem.label}
                                      </p>
                                      {tItem.date && (
                                        <p className="text-[10px] text-slate-400">
                                          {formatDateLong(tItem.date, locale)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {b.status === "PENDING" && (
                            <Link
                              href={`/${locale}/messages?conversation=${b.id}`}
                              className="flex-1"
                            >
                              <button className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 hover:border-indigo-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                                <span className="inline-flex items-center gap-2">
                                  <MessageCircle className="h-4 w-4" />
                                  {t("actions.contact")}
                                </span>
                              </button>
                            </Link>
                          )}

                          {isPendingPayment && (
                            <button
                              onClick={() => handlePay(b)}
                              disabled={loading === b.id}
                              className={`flex flex-1 items-center justify-center gap-2 rounded-xl ${GRADIENT_BUTTON} px-4 py-3 text-xs font-bold text-white shadow-md shadow-indigo-500/15 hover:scale-[1.01] disabled:opacity-70`}
                            >
                              {loading === b.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Wallet className="h-4 w-4" />
                              )}
                              {t("actions.pay", {
                                amount: b.totalPrice.toLocaleString(),
                              })}
                            </button>
                          )}

                          {isActive && (
                            <>
                              <Link
                                href={`/${locale}/messages?conversation=${b.id}`}
                                className="flex-1"
                              >
                                <button className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 hover:border-indigo-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                                  <span className="inline-flex items-center gap-2">
                                    <MessageCircle className="h-4 w-4" />
                                    {t("actions.message")}
                                  </span>
                                </button>
                              </Link>
                              <Link
                                href={`/${locale}/bookings/${b.id}`}
                                className="flex-1"
                              >
                                <button
                                  className={`w-full rounded-xl ${GRADIENT_BUTTON} px-4 py-3 text-xs font-bold text-white shadow-md shadow-indigo-500/15 hover:scale-[1.01]`}
                                >
                                  <span className="inline-flex items-center gap-2">
                                    <Receipt className="h-4 w-4" />
                                    {t("actions.details")}
                                  </span>
                                </button>
                              </Link>
                            </>
                          )}

                          {b.status === "COMPLETED" && (
                            <>
                              {!b.hasReview ? (
                                <button
                                  onClick={() => setSelectedBookingForReview(b)}
                                  disabled={loading === b.id}
                                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:scale-[1.01] disabled:opacity-70`}
                                >
                                  {loading === b.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Star className="h-4 w-4 fill-white" />
                                  )}
                                  {t("actions.leaveReview")}
                                </button>
                              ) : (
                                <div className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                                  <CheckCircle2 className="h-4 w-4" />
                                  {t("actions.reviewed")}
                                </div>
                              )}
                              <button
                                onClick={() => downloadReceipt(b.id)}
                                disabled={loading === b.id}
                                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 hover:border-indigo-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 disabled:opacity-50"
                              >
                                {loading === b.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                ) : (
                                  <span className="inline-flex items-center gap-2">
                                    <Receipt className="h-4 w-4" />
                                    {t("actions.receipt")}
                                  </span>
                                )}
                              </button>
                            </>
                          )}

                          {(b.status === "PENDING" || isPendingPayment) && (
                            <button
                              onClick={() => handleCancel(b.id)}
                              disabled={loading === b.id}
                              className="flex-1 rounded-xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-100 disabled:opacity-70 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400"
                            >
                              {t("actions.cancel")}
                            </button>
                          )}

                          {(b.status === "CANCELLED" ||
                            b.status === "REJECTED") && (
                            <button className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                              <span className="inline-flex items-center gap-2">
                                <Ban className="h-4 w-4" />
                                {t("actions.cancelled")}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar - CTA Card et Support Card */}
          <aside className="space-y-5">
            <div className="sticky top-24 space-y-5">
              {/* CTA Card - Animated */}
              <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80 group cursor-pointer transition-all duration-500 hover:shadow-xl">
                <div
                  className="absolute inset-0 bg-gradient-to-br from-sky-500 via-purple-500 to-purple-600 animate-gradient-x"
                  style={{ backgroundSize: "200% 200%" }}
                />
                <div
                  className="absolute inset-0 opacity-30"
                  style={{ backgroundImage: `url("${PATTERN_SVG}")` }}
                />
                <div className="relative p-6 text-center text-white">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                    <Compass className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-extrabold tracking-tight">
                    {t("cta.title")}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/70">
                    {t("cta.description")}
                  </p>
                  <Link href={`/${locale}/search`}>
                    <button className="mt-4 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-600 shadow-lg transition-all hover:scale-[1.01]">
                      {t("cta.button")}{" "}
                      <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                    </button>
                  </Link>
                </div>
              </div>

              {/* Support Card */}
              <div className={`${CARD_STYLE} p-5`}>
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-md">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {t("support.title")}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {t("support.available")}
                    </p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {t("support.message")}
                </p>
                <Link
                  href={`/${locale}/#contact-support`}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t("support.button")}
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {/* RECOMMENDATIONS */}
        {!recLoading && recommendations.length >= 3 && (
          <section className="mt-16">
            <div className="mb-8">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-indigo-600 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/70 dark:text-indigo-300">
                <Flame className="h-3.5 w-3.5" /> {t("recommendations.badge")}
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
                {t("recommendations.title")}{" "}
                <span className={GRADIENT_TEXT}>
                  {t("recommendations.titleGradient")}
                </span>
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3 md:grid-rows-2">
              {/* Grande carte - Premier listing */}
              {recommendations[0] && (
                <div className="md:col-span-2 md:row-span-2 group relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-sm backdrop-blur-md transition-all hover:-translate-y-2 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-slate-900/85 h-[480px] md:h-full">
                  <img
                    src={recommendations[0].image || "/images/placeholder.jpg"}
                    alt={recommendations[0].title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                  <div className="absolute left-5 top-5 z-10 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-lg backdrop-blur-sm">
                      <Flame className="h-3.5 w-3.5" />
                      {t("recommendations.trending")}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1.5 text-[10px] font-bold text-white backdrop-blur-md">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {recommendations[0].rating}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleFavorite(recommendations[0].id)}
                    className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg backdrop-blur-md transition-all hover:scale-110 dark:bg-slate-900/90 dark:text-white"
                  >
                    <Heart
                      className={`h-5 w-5 ${favorites.includes(recommendations[0].id) ? "fill-rose-500 text-rose-500" : ""}`}
                    />
                  </button>

                  <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                    <h3 className="text-3xl font-extrabold tracking-tight text-white line-clamp-2">
                      {recommendations[0].title}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <p className="inline-flex items-center gap-1.5 text-sm text-white/70">
                        <MapPin className="h-4 w-4" />
                        {recommendations[0].location}
                      </p>
                      <span className="inline-flex items-center gap-1 text-sm text-white/70">
                        <BedDouble className="h-4 w-4" />
                        {recommendations[0].beds}{" "}
                        {t("recommendations.bedrooms")}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-extrabold text-white">
                          {recommendations[0].pricePerNight.toLocaleString()}
                        </span>
                        <span className="text-xs text-white/60">
                          {t("currency")} / {t("night")}
                        </span>
                      </div>
                      <Link
                        href={`/${locale}/listings/${recommendations[0].id}`}
                      >
                        <button
                          className={`rounded-full ${GRADIENT_BUTTON} px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-105`}
                        >
                          {t("recommendations.discover")}{" "}
                          <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Petites cartes - Deuxième et troisième listings */}
              {[1, 2].map(
                (idx) =>
                  recommendations[idx] && (
                    <div
                      key={idx}
                      className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-sm backdrop-blur-md transition-all hover:-translate-y-2 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-slate-900/85 h-[230px]"
                    >
                      <img
                        src={
                          recommendations[idx].image ||
                          "/images/placeholder.jpg"
                        }
                        alt={recommendations[idx].title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                      <div className="absolute right-4 top-4 z-10">
                        <button
                          onClick={() =>
                            toggleFavorite(recommendations[idx].id)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg backdrop-blur-md transition-all hover:scale-110 dark:bg-slate-900/90 dark:text-white"
                        >
                          <Heart
                            className={`h-4 w-4 ${favorites.includes(recommendations[idx].id) ? "fill-rose-500 text-rose-500" : ""}`}
                          />
                        </button>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                        <h3 className="text-lg font-extrabold tracking-tight text-white line-clamp-1">
                          {recommendations[idx].title}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <p className="inline-flex items-center gap-1 text-xs text-white/70">
                            <MapPin className="h-3 w-3" />
                            {recommendations[idx].location}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-extrabold text-white">
                              {recommendations[
                                idx
                              ].pricePerNight.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-white/60">
                              {t("currency")}/{t("nightShort")}
                            </span>
                          </div>
                          <Link
                            href={`/${locale}/listings/${recommendations[idx].id}`}
                          >
                            <button
                              className={`rounded-full ${GRADIENT_BUTTON} px-3 py-1.5 text-[10px] font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-105`}
                            >
                              {t("recommendations.view")}
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ),
              )}
            </div>
          </section>
        )}
      </main>

      {/* Review Modal */}
      <ReviewModal
        isOpen={!!selectedBookingForReview}
        onClose={() => setSelectedBookingForReview(null)}
        onSubmit={onReviewSubmit}
        booking={selectedBookingForReview}
      />
    </div>
  );
}
