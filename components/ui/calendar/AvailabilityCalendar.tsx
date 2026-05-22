"use client";

import { useState, useEffect } from "react";
import { IoChevronBackOutline, IoChevronForwardOutline } from "react-icons/io5";
import { TbBeach } from "react-icons/tb";

interface AvailabilityCalendarProps {
  availability?:
    | Record<string, { available: boolean; price?: number }>
    | { date: string; isAvailable: boolean }[]
    | Record<string, boolean>;

  blockedDates?:
    | { startDate: string; endDate: string; reason?: string }[]
    | string[];
  pendingDates?: (
    | string
    | { startDate: string; endDate: string; reason?: string }
  )[];
  pricingRules?: { startDate: string; endDate: string; fixedPrice: number }[];
  selectedStart?: string;
  selectedEnd?: string;
  onSelectRange?: (start: string, end: string) => void;
  listing?: {
    vacationMode?: boolean;
    vacationStartDate?: string;
    vacationEndDate?: string;
  };
}

export default function AvailabilityCalendar({
  availability = [],
  blockedDates = [],
  pendingDates = [],
  pricingRules = [],
  selectedStart,
  selectedEnd,
  onSelectRange,
  listing,
}: AvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tempStart, setTempStart] = useState<string | null>(null);
  const [tempEnd, setTempEnd] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const monthName = currentDate.toLocaleString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const formatDate = (year: number, month: number, day: number): string => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const getPricingRulesMap = () => {
    if (!pricingRules || pricingRules.length === 0)
      return new Map<string, number>();
    const map = new Map<string, number>();
    pricingRules.forEach((rule) => {
      const start = new Date(rule.startDate);
      const end = new Date(rule.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = formatDate(d.getFullYear(), d.getMonth(), d.getDate());
        map.set(dateStr, rule.fixedPrice);
      }
    });
    return map;
  };

  const getAvailabilityMap = () => {
    if (!availability) return {};
    if (Array.isArray(availability)) {
      const map: Record<string, boolean> = {};
      availability.forEach((a) => {
        const dateStr = a.date?.split("T")[0];
        if (dateStr) map[dateStr] = a.isAvailable;
      });
      return map;
    }
    const map: Record<string, boolean> = {};
    Object.entries(availability).forEach(([date, data]) => {
      map[date] = data.available;
    });
    return map;
  };

  const getBlockedSet = () => {
    if (!blockedDates || blockedDates.length === 0) return new Set<string>();
    const set = new Set<string>();

    if (Array.isArray(blockedDates)) {
      blockedDates.forEach((b) => {
        if (typeof b === "string") {
          const date = new Date(b);
          set.add(
            formatDate(date.getFullYear(), date.getMonth(), date.getDate()),
          );
        } else if (b.startDate && b.endDate) {
          const start = new Date(b.startDate);
          const end = new Date(b.endDate);
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            set.add(formatDate(d.getFullYear(), d.getMonth(), d.getDate()));
          }
        }
      });
    }
    return set;
  };

  const getPendingSet = () => {
    if (!pendingDates || pendingDates.length === 0) return new Set<string>();
    const set = new Set<string>();

    for (const item of pendingDates) {
      try {
        let dateStr = "";

        if (typeof item === "string") {
          const date = new Date(item);
          dateStr = formatDate(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
          );
        } else if (item && typeof item === "object") {
          if (item.startDate) {
            const date = new Date(item.startDate);
            dateStr = formatDate(
              date.getFullYear(),
              date.getMonth(),
              date.getDate(),
            );
          } else if (item.date) {
            const date = new Date(item.date);
            dateStr = formatDate(
              date.getFullYear(),
              date.getMonth(),
              date.getDate(),
            );
          }
        }

        if (dateStr) {
          set.add(dateStr);
        }
      } catch (e) {
        console.error("Erreur parsing pending date:", item, e);
      }
    }

    return set;
  };

  const availabilityMap = getAvailabilityMap();
  const blockedSet = getBlockedSet();
  const pendingSet = getPendingSet();
  const pricingMap = getPricingRulesMap();
  const isVacationMode = (day: number) => {
    if (!listing?.vacationMode) return false;
    const dateStr = formatDate(year, month, day);
    const startDate = listing.vacationStartDate;
    const endDate = listing.vacationEndDate;
    if (!startDate || !endDate) return false;
    return dateStr >= startDate && dateStr <= endDate;
  };
  const isBlocked = (day: number) => {
    const dateStr = formatDate(year, month, day);
    return blockedSet.has(dateStr);
  };

  const isPending = (day: number) => {
    const dateStr = formatDate(year, month, day);
    return pendingSet.has(dateStr);
  };

  const hasSpecialPrice = (day: number) => {
    const dateStr = formatDate(year, month, day);
    return pricingMap.has(dateStr);
  };

  const getSpecialPrice = (day: number) => {
    const dateStr = formatDate(year, month, day);
    return pricingMap.get(dateStr);
  };

  const isDateAvailable = (day: number) => {
    const dateStr = formatDate(year, month, day);
    if (isBlocked(day)) return false;
    if (isPending(day)) return false;
    if (availabilityMap[dateStr] !== undefined) {
      return availabilityMap[dateStr];
    }
    return true;
  };

  const isPast = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isStartDate = (day: number): boolean => {
    const dateStr = formatDate(year, month, day);
    return tempStart === dateStr || selectedStart === dateStr;
  };

  const isEndDate = (day: number): boolean => {
    const dateStr = formatDate(year, month, day);
    return tempEnd === dateStr || selectedEnd === dateStr;
  };

  const isSelected = (day: number): boolean => {
    return isStartDate(day) || isEndDate(day);
  };

  const isInRange = (day: number): boolean => {
    const dateStr = formatDate(year, month, day);
    const start = tempStart || selectedStart;
    const end = tempEnd || selectedEnd;
    if (!start || !end) return false;
    return dateStr > start && dateStr < end;
  };

  const handleDateClick = (day: number) => {
    if (isPast(day) || !isDateAvailable(day)) return;

    const dateStr = formatDate(year, month, day);

    const currentStart = tempStart || selectedStart;
    const currentEnd = tempEnd || selectedEnd;

    if (!currentStart && !currentEnd) {
      setTempStart(dateStr);
      setTempEnd(null);
      if (onSelectRange) onSelectRange(dateStr, "");
      return;
    }

    if (currentStart && !currentEnd) {
      if (dateStr === currentStart) {
        setTempStart(null);
        setTempEnd(null);
        if (onSelectRange) onSelectRange("", "");
      } else if (dateStr < currentStart) {
        setTempStart(dateStr);
        setTempEnd(currentStart);
        if (onSelectRange) onSelectRange(dateStr, currentStart);
      } else {
        setTempEnd(dateStr);
        if (onSelectRange) onSelectRange(currentStart, dateStr);
      }
      return;
    }

    if (currentStart && currentEnd) {
      if (dateStr < currentStart) {
        setTempStart(dateStr);
        setTempEnd(currentEnd);
        if (onSelectRange) onSelectRange(dateStr, currentEnd);
      } else if (dateStr > currentEnd) {
        setTempStart(currentStart);
        setTempEnd(dateStr);
        if (onSelectRange) onSelectRange(currentStart, dateStr);
      } else if (dateStr > currentStart && dateStr < currentEnd) {
        setTempStart(dateStr);
        setTempEnd(null);
        if (onSelectRange) onSelectRange(dateStr, "");
      } else if (dateStr === currentStart || dateStr === currentEnd) {
        setTempStart(null);
        setTempEnd(null);
        if (onSelectRange) onSelectRange("", "");
      }
      return;
    }
  };

  useEffect(() => {
    if (selectedStart && selectedEnd) {
      setTempStart(selectedStart);
      setTempEnd(selectedEnd);
    } else if (selectedStart && !selectedEnd) {
      setTempStart(selectedStart);
      setTempEnd(null);
    } else if (!selectedStart && !selectedEnd) {
      setTempStart(null);
      setTempEnd(null);
    }
  }, [selectedStart, selectedEnd]);

  const getDayStyle = (day: number) => {
    const past = isPast(day);
    const blocked = isBlocked(day);
    const pending = isPending(day);
    const special = hasSpecialPrice(day);
    const available = isDateAvailable(day);
    const selected = isSelected(day);
    const inRange = isInRange(day);
    const isStart = isStartDate(day);
    const isEnd = isEndDate(day);
    const vacation = isVacationMode(day);

    if (past)
      return "bg-gray-100 dark:bg-slate-800 text-gray-300 dark:text-gray-600 cursor-not-allowed";

    // ✅ PRIORITÉ MAXIMALE - MODE VACANCES (violet)
    if (vacation)
      return "bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 font-semibold cursor-not-allowed line-through relative";

    if ((isStart || isEnd) && !blocked && !pending && !vacation)
      return "bg-sky-500 dark:bg-sky-600 text-white font-semibold cursor-pointer hover:bg-sky-600 dark:hover:bg-sky-700";

    if (inRange && !blocked && !pending && !vacation)
      return "bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-semibold cursor-pointer";

    if (blocked)
      return "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-semibold cursor-not-allowed line-through";

    if (pending)
      return "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold cursor-not-allowed border border-amber-200 dark:border-amber-800";

    if (special)
      return "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 font-semibold cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800";

    if (available)
      return "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-semibold cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/50";

    return "bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors cursor-pointer";
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={prevMonth}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-gray-400"
        >
          <IoChevronBackOutline className="text-xl" />
        </button>
        <h4 className="font-bold capitalize text-gray-800 dark:text-gray-200">
          {monthName}
        </h4>
        <button
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-gray-400"
        >
          <IoChevronForwardOutline className="text-xl" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
          <div
            key={d}
            className="text-center text-xs font-bold text-gray-500 dark:text-gray-500 py-2"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const pending = isPending(day);
          const special = hasSpecialPrice(day);
          const specialPrice = getSpecialPrice(day);
          const blocked = isBlocked(day);
          const isStart = isStartDate(day);
          const isEnd = isEndDate(day);
          const vacation = isVacationMode(day); // ✅ AJOUTÉ

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              disabled={isPast(day) || blocked || pending || vacation} // ✅ MODIFIÉ
              className={`
        aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all duration-200
        relative
        ${getDayStyle(day)}
      `}
            >
              <span>{day}</span>
              {special && !blocked && !pending && !vacation && (
                <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                  {specialPrice} TND
                </span>
              )}
              {/* ✅ AJOUTÉ - Icône mode vacances */}
              {vacation && !isPast(day) && (
                <TbBeach className="absolute -top-1 -right-1 text-sm"></TbBeach>
              )}
              {/* Point ORANGE */}
              {pending && !isPast(day) && !blocked && !vacation && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-500" />
              )}
              {(isStart || isEnd) &&
                !isPast(day) &&
                !blocked &&
                !pending &&
                !vacation && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white dark:bg-white" />
                )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Disponible
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Réservé / Indisponible
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            En attente de paiement
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Prix spécial
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-sky-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Début / Fin du séjour
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-sky-100 dark:bg-sky-950/50 border border-sky-200" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Nuits du séjour
          </span>
        </div>
      </div>
    </div>
  );
}
