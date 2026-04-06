"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
  DollarSign,
  CalendarDays,
  Loader2,
  Unlock,
  Check,
  Sparkles,
  BarChart3,
  Home,
  Building2,
  Hotel,
  Layers,
  RefreshCw,
  Info,
  Calendar as CalendarIcon,
  Users,
  Clock,
  Eye,
} from "lucide-react";
import {
  useCalendar,
  isSameDay,
  BOOKING_COLORS,
  FR_MONTHS,
  FR_DAYS_SHORT,
} from "./hooks/useCalendar";

const pip = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

const TYPE_ICONS: Record<string, React.ElementType> = {
  APARTMENT: Building2,
  VILLA: Home,
  STUDIO: Hotel,
  DUPLEX: Layers,
  HOUSE: Home,
};

type AlertType = "success" | "error" | "info" | "warning";

interface Alert {
  id: string;
  type: AlertType;
  message: string;
  description?: string;
  duration?: number;
}

function AlertItem({
  alert,
  onClose,
}: {
  alert: Alert;
  onClose: (id: string) => void;
}) {
  const icons = {
    success: <CheckCircle size={18} className="text-emerald-600" />,
    error: <XCircle size={18} className="text-red-600" />,
    warning: <AlertCircle size={18} className="text-amber-600" />,
    info: <Info size={18} className="text-blue-600" />,
  };

  const bgColors = {
    success: "bg-emerald-50 border-emerald-200",
    error: "bg-red-50 border-red-200",
    warning: "bg-amber-50 border-amber-200",
    info: "bg-blue-50 border-blue-200",
  };

  const textColors = {
    success: "text-emerald-800",
    error: "text-red-800",
    warning: "text-amber-800",
    info: "text-blue-800",
  };

  React.useEffect(() => {
    if (alert.duration) {
      const timer = setTimeout(() => onClose(alert.id), alert.duration);
      return () => clearTimeout(timer);
    }
  }, [alert.id, alert.duration, onClose]);

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl border ${bgColors[alert.type]} shadow-sm animate-in slide-in-from-right duration-300`}
    >
      <div className="shrink-0">{icons[alert.type]}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${textColors[alert.type]}`}>
          {alert.message}
        </p>
        {alert.description && (
          <p className="text-xs text-slate-500 mt-0.5">{alert.description}</p>
        )}
      </div>
      <button
        onClick={() => onClose(alert.id)}
        className="shrink-0 p-0.5 rounded hover:bg-white/50 transition-colors"
      >
        <X size={14} className="text-slate-400" />
      </button>
    </div>
  );
}

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
          ? "bg-white shadow-sm border-l-4 border-indigo-600 text-indigo-700 font-semibold"
          : "text-slate-600 hover:bg-white/50 hover:translate-x-0.5 group"
      }`}
    >
      <div
        className={`w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-slate-100 ${!selected ? "grayscale group-hover:grayscale-0 transition-all" : ""}`}
      >
        {photo?.url ? (
          <img
            src={pip(photo.url)}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-indigo-100 flex items-center justify-center">
            <Icon size={18} className="text-indigo-500" />
          </div>
        )}
      </div>
      <div className="overflow-hidden">
        <p className="text-sm truncate font-medium">{listing.title}</p>
        <p className="text-[11px] text-slate-400 font-normal">
          {listing.governorate}
        </p>
      </div>
    </button>
  );
}

function Modal({
  isOpen,
  onClose,
  title,
  icon: Icon,
  iconBgColor,
  iconColor,
  children,
  onConfirm,
  confirmText,
  confirmIcon: ConfirmIcon,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ElementType;
  iconBgColor: string;
  iconColor: string;
  children: React.ReactNode;
  onConfirm: () => void;
  confirmText: string;
  confirmIcon: React.ElementType;
  isLoading: boolean;
}) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className={`p-5 border-b ${iconBgColor}/10`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full ${iconBgColor} flex items-center justify-center`}
              >
                <Icon size={20} className={iconColor} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={18} className="text-slate-400" />
            </button>
          </div>
        </div>
        <div className="p-5 space-y-4">{children}</div>
        <div className="p-5 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all ${iconBgColor} hover:opacity-90 disabled:opacity-50`}
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <ConfirmIcon size={18} />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OwnerCalendarPage() {
  const {
    listings,
    loadingListings,
    selectedListing,
    setSelectedListing,
    currentDate,
    setCurrentDate,
    days,
    today,
    selectedDays,
    clearSelection,
    isDaySelected,
    handleDayClick,
    handleDayMouseEnter,
    selectedDatesAreBlocked,
    bookings,
    blockedDates,
    pricingRules,
    loadingCal,
    saving,
    occupancy,
    revenue,
    bookedDays,
    blockedDaysCount,
    upcomingBookings,
    blockDates,
    unblockDates,
    setPriceForDates,
    fetchAvailability,
    BOOKING_COLORS: colors,
  } = useCalendar();

  const [showBlockPanel, setShowBlockPanel] = React.useState(false);
  const [showPricePanel, setShowPricePanel] = React.useState(false);
  const [blockReason, setBlockReason] = React.useState("");
  const [customPrice, setCustomPrice] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"month" | "list">("list");
  const [actionLoading, setActionLoading] = React.useState(false);
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [modalState, setModalState] = React.useState<{
    isOpen: boolean;
    type: "block" | "unblock" | "price";
    date?: Date;
    dateStr?: string;
  }>({ isOpen: false, type: "block" });

  const addAlert = (
    type: AlertType,
    message: string,
    description?: string,
    duration: number = 5000,
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setAlerts((prev) => [
      ...prev,
      { id, type, message, description, duration },
    ]);
  };

  const removeAlert = (id: string) =>
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  const monthTitle = `${FR_MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  // Generate all dates for current month avec customPrice depuis pricingRules
  const currentMonthDates = React.useMemo(() => {
    const dates: {
      date: Date;
      bookings: any[];
      isBlocked: boolean;
      blockedReason?: string;
      customPrice?: number;
    }[] = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const dayBookings = bookings.filter((b) => {
        const ci = new Date(b.checkIn);
        ci.setHours(0, 0, 0, 0);
        const co = new Date(b.checkOut);
        co.setHours(0, 0, 0, 0);
        return d >= ci && d < co;
      });
      const isBlocked = blockedDates.some((b) => b.date === dateStr);
      const blockedReason = blockedDates.find(
        (b) => b.date === dateStr,
      )?.reason;

      // Chercher dans pricingRules (prix spéciaux)
      const priceRule = pricingRules?.find((r) => {
        if (!r.startDate || !r.endDate) return false;
        const start = new Date(r.startDate);
        const end = new Date(r.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return d >= start && d <= end;
      });

      const customPrice = priceRule?.fixedPrice;

      dates.push({
        date: new Date(d),
        bookings: dayBookings,
        isBlocked,
        blockedReason,
        customPrice,
      });
    }
    return dates;
  }, [currentDate, bookings, blockedDates, pricingRules]);

  const openBlockModal = (date: Date) => {
    setBlockReason("");
    setModalState({
      isOpen: true,
      type: "block",
      date,
      dateStr: date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    });
  };

  const openUnblockModal = (date: Date, currentReason?: string) => {
    setBlockReason(currentReason || "");
    setModalState({
      isOpen: true,
      type: "unblock",
      date,
      dateStr: date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    });
  };

  const openPriceModal = (date: Date, currentPrice?: number) => {
    setCustomPrice(currentPrice?.toString() || "");
    setModalState({
      isOpen: true,
      type: "price",
      date,
      dateStr: date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: "block" });
    setBlockReason("");
    setCustomPrice("");
  };

  const handleBlockConfirm = async () => {
    if (!modalState.date) return;
    setActionLoading(true);
    try {
      await blockDates(blockReason, [modalState.date]);
      addAlert(
        "success",
        "Date bloquée",
        `Le ${modalState.dateStr} a été bloqué avec succès.`,
      );
    } catch (error) {
      addAlert(
        "error",
        "Erreur",
        "Impossible de bloquer la date. Veuillez réessayer.",
      );
    } finally {
      setActionLoading(false);
      closeModal();
    }
  };

  const handleUnblockConfirm = async () => {
    if (!modalState.date) return;
    setActionLoading(true);
    try {
      await unblockDates([modalState.date]);
      addAlert(
        "success",
        "Date débloquée",
        `Le ${modalState.dateStr} est maintenant disponible.`,
      );
    } catch (error) {
      addAlert(
        "error",
        "Erreur",
        "Impossible de débloquer la date. Veuillez réessayer.",
      );
    } finally {
      setActionLoading(false);
      closeModal();
    }
  };

  const handlePriceConfirm = async () => {
    if (!modalState.date || !customPrice) return;
    setActionLoading(true);
    try {
      await setPriceForDates(parseFloat(customPrice), [modalState.date]);
      addAlert(
        "success",
        "Prix spécial appliqué",
        `${customPrice} TND pour le ${modalState.dateStr}.`,
      );
    } catch (error) {
      addAlert(
        "error",
        "Erreur",
        "Impossible d'appliquer le prix. Veuillez réessayer.",
      );
    } finally {
      setActionLoading(false);
      closeModal();
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-white">
      {/* LEFT SIDEBAR */}
      <aside className="w-72 shrink-0 flex flex-col border-r border-slate-200 overflow-y-auto">
        <div className="px-5 pt-6 pb-3">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 mb-3">
            Mes Propriétés
          </p>
          {loadingListings ? (
            <div className="flex flex-col gap-2">{/* Skeleton */}</div>
          ) : listings.length === 0 ? (
            <div className="text-center py-6">
              <Home size={28} className="text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Aucune annonce active</p>
            </div>
          ) : (
            <div className="space-y-1">
              {listings.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  selected={selectedListing?.id === l.id}
                  onClick={() => {
                    setSelectedListing(l);
                    clearSelection();
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="mt-auto mx-4 mb-5 p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg">
          <p className="font-bold text-sm">Passer à Pro</p>
          <p className="text-xs opacity-80 mt-0.5 leading-relaxed">
            Gérez plus de 5 propriétés et débloquez les analyses avancées.
          </p>
          <button className="mt-3 bg-white text-indigo-700 text-xs font-bold py-2 px-4 rounded-full w-full hover:bg-indigo-50 transition-colors">
            Upgrade Now
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="shrink-0 bg-white border-b border-slate-100">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Calendrier de disponibilité
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {selectedListing ? (
                  <>
                    Gérez les tarifs et réservations pour{" "}
                    <span className="font-semibold text-indigo-600">
                      {selectedListing.title}
                    </span>
                  </>
                ) : (
                  "Sélectionnez une propriété"
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-100 p-1 rounded-full gap-0.5">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-1.5 ${viewMode === "list" ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:text-slate-700"}`}
                >
                  <CalendarIcon size={14} /> Liste
                </button>
                <button
                  onClick={() => setViewMode("month")}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-1.5 ${viewMode === "month" ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:text-slate-700"}`}
                >
                  <Eye size={14} /> Mois
                </button>
              </div>
              <button
                onClick={() => fetchAvailability()}
                disabled={loadingCal}
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 transition-colors shadow-sm"
              >
                <RefreshCw
                  size={16}
                  className={loadingCal ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>
          {alerts.length > 0 && (
            <div className="px-6 pb-4 space-y-2">
              {alerts.map((alert) => (
                <AlertItem key={alert.id} alert={alert} onClose={removeAlert} />
              ))}
            </div>
          )}
        </div>

        {!selectedListing ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-4 p-8">
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <CalendarDays size={40} className="text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-700 text-lg">
                Aucune propriété sélectionnée
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Choisissez une propriété dans la liste à gauche
              </p>
            </div>
          </div>
        ) : viewMode === "month" ? (
          // MONTH VIEW
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="shrink-0 flex items-center justify-between px-6 py-3 bg-white/90 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setCurrentDate(
                      (d) => new Date(d.getFullYear(), d.getMonth() - 1, 1),
                    )
                  }
                  className="p-1.5 hover:bg-slate-100 rounded-lg"
                >
                  <ChevronLeft size={18} className="text-indigo-600" />
                </button>
                <h2 className="text-lg font-bold text-slate-900">
                  {monthTitle}
                </h2>
                <button
                  onClick={() =>
                    setCurrentDate(
                      (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1),
                    )
                  }
                  className="p-1.5 hover:bg-slate-100 rounded-lg"
                >
                  <ChevronRight size={18} className="text-indigo-600" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg"
                >
                  Aujourd'hui
                </button>
              </div>
              {selectedDays.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">
                    {selectedDays.length} date(s)
                  </span>
                  <button onClick={clearSelection}>
                    <X
                      size={16}
                      className="text-slate-400 hover:text-rose-500"
                    />
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                {[
                  { dot: "bg-indigo-500", label: "Réservé" },
                  { dot: "bg-slate-300", label: "Bloqué" },
                  { dot: "bg-amber-400", label: "Prix spécial" },
                ].map((l) => (
                  <div
                    key={l.label}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm"
                  >
                    <span className={`w-3 h-3 rounded-full ${l.dot}`} />
                    <span className="text-xs font-medium text-slate-500">
                      {l.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-7 border-b border-slate-100 bg-white shrink-0">
              {FR_DAYS_SHORT.map((d) => (
                <div
                  key={d}
                  className="py-3 text-center text-xs font-black uppercase tracking-widest text-slate-400"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-7">
                {days.map((day, idx) => {
                  const isSelected = isDaySelected(day.date);
                  const isToday = isSameDay(day.date, new Date());
                  const colorIdx = day.bookingColor
                    ? colors.findIndex((c) => c.bar === day.bookingColor)
                    : 0;
                  const color = colors[colorIdx >= 0 ? colorIdx : 0];
                  const hasCustomPrice =
                    day.customPrice !== undefined && day.customPrice !== null;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleDayClick(day)}
                      onMouseEnter={() => handleDayMouseEnter(day)}
                      className={`min-h-[120px] p-2 border-r border-b border-slate-100 relative transition-all cursor-pointer ${!day.isCurrentMonth ? "opacity-30 bg-slate-50" : ""} ${day.isPast ? "bg-slate-50 cursor-not-allowed" : ""} ${day.isBooked ? `${color.light} cursor-pointer` : ""} ${day.isBlocked && !day.isBooked && !day.isPast ? "hachured-bg" : ""} ${hasCustomPrice && !day.isBooked && !day.isBlocked && !day.isPast ? "bg-amber-50/50 border-amber-200" : ""} ${!day.isBooked && !day.isBlocked && !day.isPast && day.isCurrentMonth && !hasCustomPrice ? "hover:bg-indigo-50/50 group" : ""} ${isSelected ? "ring-2 ring-inset ring-indigo-500 bg-indigo-100/80" : ""}`}
                      style={
                        day.isBlocked && !day.isPast && !day.isBooked
                          ? {
                              backgroundImage:
                                "repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(100,116,139,0.08) 10px,rgba(100,116,139,0.08) 20px)",
                            }
                          : {}
                      }
                    >
                      <div className="flex justify-between items-start">
                        <span
                          className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-indigo-600 text-white shadow-sm" : day.isPast ? "text-slate-300" : "text-slate-700"}`}
                        >
                          {day.date.getDate()}
                        </span>
                        {hasCustomPrice &&
                          day.isCurrentMonth &&
                          !day.isPast && (
                            <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-200">
                              {day.customPrice} TND
                            </span>
                          )}
                      </div>
                      {day.isBooked && day.isCheckIn && day.bookingGuest && (
                        <div
                          className="mt-1 rounded-md px-2 py-1 shadow-sm text-white text-[10px] font-bold truncate"
                          style={{ backgroundColor: day.bookingColor }}
                        >
                          {day.bookingGuest}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          // LIST VIEW
          <div className="flex-1 overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <p className="text-[10px] font-black uppercase text-indigo-500">
                    Occupation
                  </p>
                  <p className="text-2xl font-black text-indigo-600">
                    {occupancy}%
                  </p>
                </div>
                <div className="bg-violet-50 p-4 rounded-xl border border-violet-100">
                  <p className="text-[10px] font-black uppercase text-violet-500">
                    Revenus
                  </p>
                  <p className="text-2xl font-black text-violet-600">
                    {revenue > 0
                      ? `${revenue.toLocaleString("fr-FR")} TND`
                      : "—"}
                  </p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <p className="text-[10px] font-black uppercase text-emerald-500">
                    Réservations
                  </p>
                  <p className="text-2xl font-black text-emerald-600">
                    {upcomingBookings.length}
                  </p>
                </div>
                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-black uppercase text-slate-500">
                    Jours disponibles
                  </p>
                  <p className="text-2xl font-black text-slate-600">
                    {
                      currentMonthDates.filter(
                        (d) =>
                          !d.isBlocked &&
                          d.bookings.length === 0 &&
                          d.date >= new Date(),
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {currentMonthDates.map((item, idx) => {
                const isPast = item.date < new Date();
                const isToday = isSameDay(item.date, new Date());
                const dayOfWeek = item.date.toLocaleDateString("fr-FR", {
                  weekday: "long",
                });
                const color = colors[idx % colors.length];
                const hasCustomPrice =
                  item.customPrice !== undefined && item.customPrice !== null;
                return (
                  <div
                    key={idx}
                    className={`${isToday ? "bg-indigo-50/30" : ""} ${isPast ? "opacity-60" : ""} ${hasCustomPrice && !item.isBlocked && !isPast ? "bg-amber-50/20" : ""}`}
                  >
                    <div className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors group">
                      <div className="text-center min-w-[70px]">
                        <p
                          className={`text-3xl font-bold leading-7 ${isToday ? "text-indigo-600" : "text-slate-800"}`}
                        >
                          {item.date.getDate()}
                        </p>
                        <p className="text-xs font-medium text-slate-400 capitalize mt-1">
                          {dayOfWeek}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        {item.isBlocked && (
                          <div className="flex items-center gap-3 py-2">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                              <Lock size={18} className="text-slate-500" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-base font-semibold text-slate-700">
                                  Date bloquée
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                  Indisponible
                                </span>
                              </div>
                              {item.blockedReason && (
                                <p className="text-sm text-slate-400 mt-1">
                                  {item.blockedReason}
                                </p>
                              )}
                            </div>
                            {hasCustomPrice && (
                              <span className="text-sm font-bold text-amber-600 bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200">
                                {item.customPrice} TND
                              </span>
                            )}
                          </div>
                        )}
                        {!item.isBlocked &&
                          item.bookings.map((booking, i) => {
                            const bookingColor = colors[i % colors.length];
                            const checkIn = new Date(booking.checkIn),
                              checkOut = new Date(booking.checkOut);
                            const nights = Math.ceil(
                              (checkOut.getTime() - checkIn.getTime()) /
                                (1000 * 60 * 60 * 24),
                            );
                            return (
                              <div
                                key={booking.id}
                                className="flex items-center gap-3 py-2"
                              >
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm shrink-0 ${bookingColor.bg}`}
                                >
                                  {booking.guestName?.[0]?.toUpperCase() ?? "?"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-base font-semibold text-slate-800">
                                      {booking.guestName || "Voyageur"}
                                    </span>
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bookingColor.light} ${bookingColor.text}`}
                                    >
                                      {booking.status === "CONFIRMED"
                                        ? "Confirmée"
                                        : "En attente"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                                    <div className="flex items-center gap-1.5">
                                      <CalendarIcon size={12} />
                                      <span>
                                        {checkIn.toLocaleDateString("fr-FR", {
                                          day: "2-digit",
                                          month: "short",
                                        })}{" "}
                                        →{" "}
                                        {checkOut.toLocaleDateString("fr-FR", {
                                          day: "2-digit",
                                          month: "short",
                                        })}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Clock size={12} />
                                      <span>
                                        {nights} nuit{nights !== 1 ? "s" : ""}
                                      </span>
                                    </div>
                                    {booking.guestEmail && (
                                      <div className="flex items-center gap-1.5">
                                        <Users size={12} />
                                        <span>{booking.guestEmail}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {booking.totalPrice && (
                                  <div className="text-right">
                                    <p className="text-[10px] text-slate-400">
                                      Total
                                    </p>
                                    <p className="text-base font-bold text-slate-800">
                                      {booking.totalPrice.toLocaleString(
                                        "fr-FR",
                                      )}{" "}
                                      TND
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        {!item.isBlocked &&
                          item.bookings.length === 0 &&
                          !isPast &&
                          hasCustomPrice && (
                            <div className="flex items-center gap-3 py-2">
                              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                <DollarSign
                                  size={18}
                                  className="text-amber-600"
                                />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-base font-semibold text-amber-700">
                                    Prix spécial
                                  </span>
                                  <span className="text-sm font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-lg">
                                    {item.customPrice} TND
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  Tarif spécial appliqué pour cette date
                                </p>
                              </div>
                            </div>
                          )}
                        {!item.isBlocked &&
                          item.bookings.length === 0 &&
                          !isPast &&
                          !hasCustomPrice && (
                            <div className="flex items-center gap-3 py-2">
                              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                <Check size={18} className="text-emerald-500" />
                              </div>
                              <div className="flex-1">
                                <span className="text-base text-slate-500">
                                  Disponible
                                </span>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  Ouverte à la réservation
                                </p>
                              </div>
                            </div>
                          )}
                        {isPast &&
                          !item.isBlocked &&
                          item.bookings.length === 0 && (
                            <div className="flex items-center gap-3 py-2">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                <CalendarDays
                                  size={18}
                                  className="text-slate-400"
                                />
                              </div>
                              <div className="flex-1">
                                <span className="text-base text-slate-400">
                                  Date passée
                                </span>
                              </div>
                            </div>
                          )}
                      </div>
                      {!isPast && (
                        <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!item.isBlocked && item.bookings.length === 0 && (
                            <button
                              onClick={() => openBlockModal(item.date)}
                              className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-1.5"
                            >
                              <Lock size={14} /> Bloquer
                            </button>
                          )}
                          {item.isBlocked && (
                            <button
                              onClick={() =>
                                openUnblockModal(item.date, item.blockedReason)
                              }
                              className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-sm font-medium hover:bg-amber-100 transition-colors flex items-center gap-1.5"
                            >
                              <Unlock size={14} /> Débloquer
                            </button>
                          )}
                          <button
                            onClick={() =>
                              openPriceModal(item.date, item.customPrice)
                            }
                            className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-sm font-medium hover:bg-amber-100 transition-colors flex items-center gap-1.5"
                          >
                            <DollarSign size={14} /> Prix spécial
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* RIGHT SIDEBAR - Actions multi-dates */}
      <aside className="w-80 shrink-0 flex flex-col bg-white border-l border-slate-200 overflow-y-auto">
        <div className="p-5 space-y-5">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
              Actions multi-dates
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setShowBlockPanel(!showBlockPanel)}
                disabled={selectedDays.length === 0}
                className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 disabled:opacity-40 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Lock size={16} className="text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">
                    Bloquer{" "}
                    {selectedDays.length > 0 ? `(${selectedDays.length})` : ""}
                  </span>
                </div>
                {showBlockPanel ? (
                  <ChevronRight
                    size={14}
                    className="text-slate-400 rotate-90"
                  />
                ) : (
                  <ChevronRight size={14} className="text-slate-400" />
                )}
              </button>
              {showBlockPanel && selectedDays.length > 0 && (
                <div className="mt-2 p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-3">
                  <p className="text-xs font-medium text-indigo-600">
                    Bloquer {selectedDays.length} date(s)
                  </p>
                  <textarea
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="Raison (optionnel)"
                    rows={2}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowBlockPanel(false)}
                      className="flex-1 py-2 rounded-lg border border-indigo-200 text-sm"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={async () => {
                        await blockDates(blockReason);
                        setShowBlockPanel(false);
                        setBlockReason("");
                        addAlert(
                          "success",
                          "Dates bloquées",
                          `${selectedDays.length} date(s) ont été bloquées.`,
                        );
                      }}
                      disabled={saving}
                      className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Lock size={14} />
                      )}{" "}
                      Bloquer
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={async () => {
                  await unblockDates();
                  addAlert(
                    "success",
                    "Dates débloquées",
                    `${selectedDays.length} date(s) sont maintenant disponibles.`,
                  );
                }}
                disabled={
                  selectedDays.length === 0 ||
                  !selectedDatesAreBlocked ||
                  saving
                }
                className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 disabled:opacity-40 hover:border-emerald-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Unlock size={16} className="text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">
                    Débloquer{" "}
                    {selectedDays.length > 0 ? `(${selectedDays.length})` : ""}
                  </span>
                </div>
                {saving && selectedDatesAreBlocked ? (
                  <Loader2
                    size={14}
                    className="animate-spin text-emerald-500"
                  />
                ) : (
                  <ChevronRight size={14} className="text-slate-300" />
                )}
              </button>
              <div>
                <button
                  onClick={() => setShowPricePanel(!showPricePanel)}
                  disabled={
                    selectedDays.length === 0 || selectedDatesAreBlocked
                  }
                  className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 disabled:opacity-40 hover:border-amber-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <DollarSign size={16} className="text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700">
                      Prix spécial{" "}
                      {selectedDays.length > 0
                        ? `(${selectedDays.length})`
                        : ""}
                    </span>
                  </div>
                  {showPricePanel ? (
                    <ChevronRight
                      size={14}
                      className="text-slate-400 rotate-90"
                    />
                  ) : (
                    <ChevronRight size={14} className="text-slate-400" />
                  )}
                </button>
                {showPricePanel &&
                  selectedDays.length > 0 &&
                  !selectedDatesAreBlocked && (
                    <div className="mt-2 p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-3">
                      <p className="text-xs font-medium text-amber-600">
                        Prix pour {selectedDays.length} date(s)
                      </p>
                      <div className="relative">
                        <input
                          type="number"
                          value={customPrice}
                          onChange={(e) => setCustomPrice(e.target.value)}
                          placeholder="Prix par nuit"
                          className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-lg font-semibold"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                          TND
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowPricePanel(false)}
                          className="flex-1 py-2 rounded-lg border border-amber-200 text-sm"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={async () => {
                            await setPriceForDates(parseFloat(customPrice));
                            setShowPricePanel(false);
                            setCustomPrice("");
                            addAlert(
                              "success",
                              "Prix spéciaux appliqués",
                              `${customPrice} TND pour ${selectedDays.length} date(s).`,
                            );
                          }}
                          disabled={saving || !customPrice}
                          className="flex-1 py-2 rounded-lg bg-amber-500 text-white text-sm flex items-center justify-center gap-2"
                        >
                          {saving ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <DollarSign size={14} />
                          )}{" "}
                          Appliquer
                        </button>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
          {selectedDays.length > 0 && (
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-xs font-black uppercase text-indigo-500 mb-2">
                Sélection ({selectedDays.length})
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1 text-sm">
                {selectedDays
                  .slice(0, 6)
                  .sort((a, b) => a.getTime() - b.getTime())
                  .map((date, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-slate-600">
                        {date.toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "long",
                        })}
                      </span>
                    </div>
                  ))}
                {selectedDays.length > 6 && (
                  <p className="text-xs text-slate-400">
                    +{selectedDays.length - 6} autres
                  </p>
                )}
              </div>
              <button
                onClick={clearSelection}
                className="mt-2 text-xs text-indigo-500 hover:underline"
              >
                Tout désélectionner
              </button>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black uppercase text-slate-400">
                Stats — {FR_MONTHS[currentDate.getMonth()]}
              </p>
              <BarChart3 size={16} className="text-slate-300" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-50 p-3 rounded-xl">
                <p className="text-[10px] font-black uppercase text-indigo-500">
                  Occupation
                </p>
                <p className="text-xl font-black text-indigo-600">
                  {occupancy}%
                </p>
              </div>
              <div className="bg-violet-50 p-3 rounded-xl">
                <p className="text-[10px] font-black uppercase text-violet-500">
                  Revenus
                </p>
                <p className="text-xl font-black text-violet-600">
                  {revenue > 0 ? `${Math.floor(revenue / 1000)}k TND` : "—"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="bg-slate-50 p-3 rounded-xl text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  Nuits réservées
                </p>
                <p className="text-xl font-black text-slate-700">
                  {bookedDays}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  Jours bloqués
                </p>
                <p className="text-xl font-black text-slate-700">
                  {blockedDaysCount}
                </p>
              </div>
            </div>
          </div>
          <div className="p-5 bg-white rounded-xl border border-dashed border-indigo-200">
            <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-500" />
              Aperçu Concierge
            </h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              {occupancy < 40
                ? `Votre taux d'occupation est à ${occupancy}%. Envisagez des promotions.`
                : occupancy < 70
                  ? "Bonne activité. Optimisez vos tarifs weekend."
                  : "Excellente performance ! Votre calendrier est bien rempli."}
            </p>
            <button className="mt-3 text-xs font-bold text-indigo-600 hover:underline">
              Optimiser les prix →
            </button>
          </div>
        </div>
      </aside>

      {/* MODALS */}
      <Modal
        isOpen={modalState.isOpen && modalState.type === "block"}
        onClose={closeModal}
        title="Bloquer une date"
        icon={Lock}
        iconBgColor="bg-red-100"
        iconColor="text-red-600"
        onConfirm={handleBlockConfirm}
        confirmText="Bloquer"
        confirmIcon={Lock}
        isLoading={actionLoading}
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Vous allez bloquer la date du{" "}
            <span className="font-semibold text-slate-800">
              {modalState.dateStr}
            </span>
          </p>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Raison (optionnelle)
            </label>
            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="ex: Nettoyage, Travaux, Maintenance..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none"
            />
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={modalState.isOpen && modalState.type === "unblock"}
        onClose={closeModal}
        title="Débloquer une date"
        icon={Unlock}
        iconBgColor="bg-amber-100"
        iconColor="text-amber-600"
        onConfirm={handleUnblockConfirm}
        confirmText="Débloquer"
        confirmIcon={Unlock}
        isLoading={actionLoading}
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Vous allez débloquer la date du{" "}
            <span className="font-semibold text-slate-800">
              {modalState.dateStr}
            </span>
          </p>
          <p className="text-sm text-slate-500 bg-amber-50 p-3 rounded-lg">
            Cette date redeviendra disponible à la réservation.
          </p>
        </div>
      </Modal>
      <Modal
        isOpen={modalState.isOpen && modalState.type === "price"}
        onClose={closeModal}
        title="Prix spécial"
        icon={DollarSign}
        iconBgColor="bg-amber-100"
        iconColor="text-amber-600"
        onConfirm={handlePriceConfirm}
        confirmText="Appliquer"
        confirmIcon={DollarSign}
        isLoading={actionLoading}
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Pour la date du{" "}
            <span className="font-semibold text-slate-800">
              {modalState.dateStr}
            </span>
          </p>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Prix par nuit (TND)
            </label>
            <div className="relative">
              <input
                type="number"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="Ex: 250"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-lg font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                TND
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Ce prix remplacera le tarif par défaut pour cette date
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Alert icons
const CheckCircle = ({
  size,
  className,
}: {
  size: number;
  className: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const XCircle = ({ size, className }: { size: number; className: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const AlertCircle = ({
  size,
  className,
}: {
  size: number;
  className: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
