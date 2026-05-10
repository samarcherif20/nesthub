// app/[locale]/(dashboard)/owner/calendar/page.tsx
"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import Link from "next/link";
import { RxCalendar } from "react-icons/rx";

import {
  X,
  Lock,
  DollarSign,
  CalendarDays,
  Loader2,
  Unlock,
  Check,
  Sparkles,
  Home,
  Building2,
  Hotel,
  Layers,
  RefreshCw,
  Info,
  ChevronRight,
  TrendingUp,
  HelpCircle,
  Plus,
} from "lucide-react";
import { useCalendar } from "./hooks/useCalendar";
import { SimpleCalendar } from "@/components/ui/SimpleCalendar";
import Alert from "@/components/ui/Alert";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

type AlertType = "success" | "error" | "info" | "warning";

const TYPE_ICONS: Record<string, React.ElementType> = {
  APARTMENT: Building2,
  VILLA: Home,
  STUDIO: Hotel,
  DUPLEX: Layers,
  HOUSE: Home,
};

const BOOKING_COLORS = [
  {
    bg: "#6366f1",
    light: "rgba(99,102,241,0.15)",
    dark: "rgba(99,102,241,0.25)",
  },
  {
    bg: "#8b5cf6",
    light: "rgba(139,92,246,0.15)",
    dark: "rgba(139,92,246,0.25)",
  },
  {
    bg: "#0ea5e9",
    light: "rgba(14,165,233,0.15)",
    dark: "rgba(14,165,233,0.25)",
  },
  {
    bg: "#10b981",
    light: "rgba(16,185,129,0.15)",
    dark: "rgba(16,185,129,0.25)",
  },
  {
    bg: "#f59e0b",
    light: "rgba(245,158,11,0.15)",
    dark: "rgba(245,158,11,0.25)",
  },
];

function ListingCard({
  listing,
  selected,
  onClick,
}: {
  listing: any;
  selected: boolean;
  onClick: () => void;
}) {
  const photo =
    listing.photos?.find((p: any) => p.isMain) ?? listing.photos?.[0];
  const Icon = TYPE_ICONS[listing.type] ?? Home;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all ${
        selected
          ? "bg-white dark:bg-slate-800 shadow-sm border-l-4 border-sky-500 text-sky-700 dark:text-sky-300 font-semibold"
          : "text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/40 hover:translate-x-0.5 group"
      }`}
    >
      <div
        className={`w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-700 ${
          !selected ? "grayscale group-hover:grayscale-0 transition-all" : ""
        }`}
      >
        {photo?.url ? (
          <img
            src={`/api/listings/image?url=${encodeURIComponent(photo.url)}`}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
            <Icon size={18} className="text-sky-500 dark:text-sky-400" />
          </div>
        )}
      </div>
      <div className="overflow-hidden">
        <p className="text-sm truncate font-semibold dark:text-white">
          {listing.title}
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
          {listing.governorate}
        </p>
      </div>
    </button>
  );
}

// COMPOSANT EMPTY STATE - STYLE LISTINGS (sans motion)
function EmptyCalendarState({ t, locale }: { t: any; locale: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-sky-100 to-purple-100 dark:from-sky-950/50 dark:to-purple-950/50 flex items-center justify-center shadow-lg">
          <RxCalendar size={48} className="text-sky-500 dark:text-sky-400" />
        </div>
      </div>
      <h3 className="text-2xl font-headline font-bold bg-gradient-to-r from-sky-600 to-purple-600 dark:from-sky-400 dark:to-purple-400 bg-clip-text text-transparent mb-3">
        {t("emptyState.title")}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed">
        {t("emptyState.description")}
      </p>
      <Link
        href={`/${locale}/dashboard/owner/listings/create`}
        className="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
      >
        <Plus size={18} className="group-hover:rotate-12 transition-transform duration-300" />
        {t("emptyState.button")}
        <TrendingUp size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
      </Link>
      <Link
        href={`/${locale}/help`}
        className="mt-6 text-xs text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors flex items-center gap-1 justify-center"
      >
        <HelpCircle size={12} />
        {t("emptyState.helpLink")}
      </Link>
    </div>
  );
}

export default function OwnerCalendarPage() {
  const t = useTranslations("OwnerCalendar");
  const { resolvedTheme } = useTheme();
  const [isDark, setIsDark] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [selectedDates, setSelectedDates] = React.useState<Date[]>([]);
  const [showBlockPanel, setShowBlockPanel] = React.useState(false);
  const [showPricePanel, setShowPricePanel] = React.useState(false);
  const [blockReason, setBlockReason] = React.useState("");
  const [customPrice, setCustomPrice] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState(false);
  const [alert, setAlert] = React.useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const {
    listings,
    loadingListings,
    selectedListing,
    setSelectedListing,
    currentDate,
    setCurrentDate,
    days,
    selectedDays,
    clearSelection,
    handleDayClick,
    handleDayMouseEnter,
    bookings,
    blockedDates,
    pricingRules,
    loadingCal,
    occupancy,
    revenue,
    blockDates,
    unblockDates,
    setPriceForDates,
    fetchAvailability,
  } = useCalendar();

  const locale = "fr";

  React.useEffect(() => {
    setMounted(true);
    setIsDark(resolvedTheme === "dark");
  }, [resolvedTheme]);

  React.useEffect(() => {
    setSelectedDates(selectedDays);
  }, [selectedDays]);

  const showAlert = (
    type: "success" | "error" | "info" | "warning",
    message: string,
  ) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchAvailability();
      showAlert("success", t("alerts.dataRefreshed"));
    } catch (error) {
      showAlert("error", t("alerts.refreshFailed"));
    } finally {
      setIsRefreshing(false);
    }
  };

  const clearSelectionHandler = () => {
    clearSelection();
    setShowBlockPanel(false);
    setShowPricePanel(false);
    setBlockReason("");
    setCustomPrice("");
  };

  const doBlock = async () => {
    if (!selectedDates.length) return;
    setActionLoading(true);
    try {
      await blockDates(blockReason, selectedDates);
      showAlert(
        "success",
        t("alerts.datesBlocked", { count: selectedDates.length }),
      );
      clearSelectionHandler();
    } catch {
      showAlert("error", t("alerts.cannotBlockDates"));
    } finally {
      setActionLoading(false);
    }
  };

  const doUnblock = async () => {
    if (!selectedDates.length) return;
    setActionLoading(true);
    try {
      await unblockDates(selectedDates);
      showAlert(
        "success",
        t("alerts.datesUnblocked", { count: selectedDates.length }),
      );
      clearSelectionHandler();
    } catch {
      showAlert("error", t("alerts.cannotUnblockDates"));
    } finally {
      setActionLoading(false);
    }
  };

  const doSetPrice = async () => {
    if (!selectedDates.length || !customPrice) return;
    setActionLoading(true);
    try {
      await setPriceForDates(parseFloat(customPrice), selectedDates);
      showAlert(
        "success",
        t("alerts.priceApplied", {
          price: customPrice,
          count: selectedDates.length,
        }),
      );
      clearSelectionHandler();
    } catch {
      showAlert("error", t("alerts.cannotApplyPrices"));
    } finally {
      setActionLoading(false);
    }
  };

  const formatDateRange = () => {
    if (selectedDates.length === 0) return "";
    if (selectedDates.length === 1) {
      return selectedDates[0].toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    }
    const first = selectedDates[0];
    const last = selectedDates[selectedDates.length - 1];
    return `${first.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} → ${last.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}`;
  };

  const upcomingBookings = React.useMemo(
    () =>
      (bookings ?? [])
        .filter((b: any) => new Date(b.checkIn) >= new Date())
        .slice(0, 5),
    [bookings],
  );

  const bookedNights = (bookings ?? []).length;
  const blockedCount = (blockedDates ?? []).length;

  if (!mounted || loadingListings) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Alert */}
      {alert && (
        <div className="fixed top-20 right-6 z-[999] w-full max-w-sm animate-in slide-in-from-top-2 fade-in duration-300">
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
            autoClose={5000}
          />
        </div>
      )}

      {/* LEFT SIDEBAR - TOUJOURS VISIBLE */}
      <aside className="w-64 shrink-0 flex flex-col bg-white dark:bg-slate-900/0 border-r border-slate-200 dark:border-slate-800 h-full overflow-y-auto">
        <div className="px-4 pt-5 pb-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1 mb-3">
            {t("sidebar.myProperties")}
          </p>
          <div className="space-y-1">
            {listings.map((l: any) => (
              <ListingCard
                key={l.id}
                listing={l}
                selected={selectedListing?.id === l.id}
                onClick={() => {
                  setSelectedListing(l);
                  clearSelectionHandler();
                }}
              />
            ))}
          </div>
        </div>

        {upcomingBookings.length > 0 && (
          <div className="mt-auto px-4 pb-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              {t("sidebar.upcomingBookings")}
            </p>
            <div className="space-y-1.5">
              {upcomingBookings.map((b: any, i: number) => {
                const c = BOOKING_COLORS[i % BOOKING_COLORS.length];
                return (
                  <div
                    key={b.id}
                    className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700"
                  >
                    <div
                      className="w-2 h-8 rounded-full shrink-0"
                      style={{ backgroundColor: c.bg }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {b.guestName || t("common.guest")}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(b.checkIn).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <div className="shrink-0 bg-white dark:bg-slate-900/0 border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 shadow-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {t("page.title")}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedListing ? (
                  <>
                    {t("page.managementFor")}{" "}
                    <span className="font-semibold text-sky-600">
                      {selectedListing.title}
                    </span>
                  </>
                ) : listings.length > 0 ? (
                  t("page.selectProperty")
                ) : (
                  t("page.noProperties")
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || loadingCal || !selectedListing}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  size={14}
                  className={isRefreshing || loadingCal ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>
        </div>

       {/* CONTENU PRINCIPAL - EMPTY STATE OU CALENDRIER */}
<div className="flex-1 overflow-auto p-5">
  {listings.length === 0 ? (
    <div className="h-full flex items-center justify-center">
      <EmptyCalendarState t={t} locale={locale} />
    </div>
  ) : !selectedListing ? (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-md mx-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
          className="relative mb-6"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/50 dark:to-orange-950/50 flex items-center justify-center shadow-lg">
            <CalendarDays size={48} className="text-amber-500 dark:text-amber-400" />
          </div>
        </motion.div>

        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-headline font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent mb-3"
        >
          {t("noProperty.title")}
        </motion.h3>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed"
        >
          {t("noProperty.description")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={() => {
              const firstListing = listings[0];
              if (firstListing) setSelectedListing(firstListing);
            }}
            className="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <Home size={18} className="group-hover:rotate-12 transition-transform duration-300" />
            {t("noProperty.button")}
            <TrendingUp size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </motion.div>
      </div>
    </div>
  ) : (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md p-4">
      <SimpleCalendar
        days={days}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onDateClick={handleDayClick}
        onDateMouseEnter={handleDayMouseEnter}
        selectedDates={selectedDates}
        isDark={isDark}
      />
    </div>
  )}
</div>
</div>
      {/* RIGHT SIDEBAR - Actions groupées (désactivées si pas de sélection) */}
      <aside className="w-80 shrink-0 flex flex-col bg-white dark:bg-slate-900/0 border-l border-slate-200 dark:border-slate-800 h-full overflow-y-auto">
        <div className="p-5 space-y-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
              {t("bulkActions.title")}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowBlockPanel(!showBlockPanel);
                  setShowPricePanel(false);
                }}
                disabled={selectedDates.length === 0 || !selectedListing}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-100 transition-all disabled:opacity-40"
              >
                <div className="flex items-center gap-3">
                  <Lock size={16} />
                  <div className="text-left">
                    <p className="text-sm font-bold">
                      {t("bulkActions.block")}
                    </p>
                    <p className="text-[10px] opacity-70">
                      {selectedDates.length
                        ? `${selectedDates.length} ${t("common.dates")}`
                        : t("bulkActions.selectDates")}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={14}
                  className={`transition-transform ${showBlockPanel ? "rotate-90" : ""}`}
                />
              </button>

              {showBlockPanel && selectedDates.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800 space-y-2.5">
                  <textarea
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder={t("bulkActions.reasonOptional")}
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 rounded-lg resize-none"
                  />
                  <button
                    onClick={doBlock}
                    disabled={actionLoading}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Lock size={14} />
                    )}{" "}
                    {t("actions.confirm")}
                  </button>
                </div>
              )}

              <button
                onClick={doUnblock}
                disabled={selectedDates.length === 0 || !selectedListing}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-all disabled:opacity-40"
              >
                <div className="flex items-center gap-3">
                  <Unlock size={16} />
                  <div className="text-left">
                    <p className="text-sm font-bold">
                      {t("bulkActions.unblock")}
                    </p>
                    <p className="text-[10px] opacity-70">
                      {selectedDates.length
                        ? `${selectedDates.length} ${t("common.dates")}`
                        : t("bulkActions.selectDates")}
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowPricePanel(!showPricePanel);
                  setShowBlockPanel(false);
                }}
                disabled={selectedDates.length === 0 || !selectedListing}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100 transition-all disabled:opacity-40"
              >
                <div className="flex items-center gap-3">
                  <DollarSign size={16} />
                  <div className="text-left">
                    <p className="text-sm font-bold">
                      {t("bulkActions.specialPrice")}
                    </p>
                    <p className="text-[10px] opacity-70">
                      {selectedDates.length
                        ? `${selectedDates.length} ${t("common.dates")}`
                        : t("bulkActions.selectDates")}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={14}
                  className={`transition-transform ${showPricePanel ? "rotate-90" : ""}`}
                />
              </button>

              {showPricePanel && selectedDates.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 space-y-2.5">
                  <div className="relative">
                    <input
                      type="number"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      placeholder={t("bulkActions.pricePlaceholder")}
                      className="w-full px-3 py-2 text-lg font-bold bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 rounded-lg"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      TND/{t("common.night")}
                    </span>
                  </div>
                  <button
                    onClick={doSetPrice}
                    disabled={actionLoading || !customPrice}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}{" "}
                    {t("actions.apply")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {selectedDates.length > 0 && (
            <div className="p-3.5 bg-sky-50 dark:bg-sky-950/30 rounded-xl border border-sky-200 dark:border-sky-800">
              <p className="text-[10px] font-black uppercase text-sky-600 mb-2">
                {t("selection.title")}
              </p>
              <p className="font-bold text-slate-800 dark:text-white text-sm">
                {formatDateRange()}
              </p>
              <p className="text-xs text-sky-600 mt-0.5">
                {selectedDates.length} {t("common.nights")}
              </p>
            </div>
          )}

          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
              {t("stats.title")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-sky-50 dark:bg-sky-950/30 p-3 rounded-xl border border-sky-100 dark:border-sky-800">
                <p className="text-[10px] font-black text-sky-600">
                  {t("stats.occupancy")}
                </p>
                <p className="text-xl font-black text-sky-700">{occupancy}%</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-xl border border-purple-100 dark:border-purple-800">
                <p className="text-[10px] font-black text-purple-600">
                  {t("stats.revenue")}
                </p>
                <p className="text-xl font-black text-purple-700">
                  {revenue > 0 ? `${Math.round(revenue / 1000)}k TND` : "—"}
                </p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800">
                <p className="text-[10px] font-black text-emerald-600">
                  {t("stats.bookedNights")}
                </p>
                <p className="text-xl font-black text-emerald-700">
                  {bookedNights}
                </p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-100 dark:border-amber-800">
                <p className="text-[10px] font-black text-amber-600">
                  {t("stats.blockedDays")}
                </p>
                <p className="text-xl font-black text-amber-700">
                  {blockedCount}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-sky-200 dark:border-sky-800 mt-55">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
              <Sparkles size={14} className="text-sky-500" />
              {t("aiTip.title")}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {occupancy < 40
                ? t("aiTip.lowOccupancy", { occupancy })
                : occupancy < 70
                  ? t("aiTip.goodActivity")
                  : t("aiTip.excellent")}
            </p>
          </div>
        </div>
        
      </aside>
    </div>
  );
}