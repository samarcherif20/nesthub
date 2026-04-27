"use client";

import { useState, useEffect } from "react";
import { IoChevronBackOutline, IoChevronForwardOutline } from "react-icons/io5";

interface AvailabilityCalendarProps {
  availability?:
    | Record<string, { available: boolean; price?: number }>
    | { date: string; isAvailable: boolean }[];
  blockedDates?: { startDate: string; endDate: string; reason?: string }[] | string[];
  pendingDates?: string[]; // ✅ AJOUT : dates en attente de paiement
  selectedStart?: string;
  selectedEnd?: string;
  onSelectRange?: (start: string, end: string) => void;
}

export default function AvailabilityCalendar({
  availability = [],
  blockedDates = [],
  pendingDates = [], // ✅ AJOUT
  selectedStart,
  selectedEnd,
  onSelectRange,
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
    if (!blockedDates) return new Set<string>();
    const set = new Set<string>();
    if (Array.isArray(blockedDates)) {
      blockedDates.forEach((b) => {
        if (typeof b === "string") {
          set.add(b);
        } else if (b.startDate && b.endDate) {
          const start = new Date(b.startDate);
          const end = new Date(b.endDate);
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            set.add(d.toISOString().split("T")[0]);
          }
        }
      });
    }
    return set;
  };

  // ✅ AJOUT : Set des dates en attente
  const getPendingSet = () => {
    if (!pendingDates) return new Set<string>();
    return new Set(pendingDates.map(d => d.split("T")[0]));
  };

  const availabilityMap = getAvailabilityMap();
  const blockedSet = getBlockedSet();
  const pendingSet = getPendingSet();

  const isBlocked = (day: number) => {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split("T")[0];
    return blockedSet.has(dateStr);
  };

  // ✅ AJOUT : Vérifier si une date est en attente de paiement
  const isPending = (day: number) => {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split("T")[0];
    return pendingSet.has(dateStr);
  };

  const isDateAvailable = (day: number) => {
    const dateStr = new Date(year, month, day).toISOString().split("T")[0];
    if (isBlocked(day)) return false;
    if (isPending(day)) return false; // Les dates en attente ne sont pas disponibles
    if (availabilityMap[dateStr] !== undefined) {
      return availabilityMap[dateStr];
    }
    return true;
  };

  const isPast = (day: number) => {
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isSelected = (day: number) => {
    const dateStr = new Date(year, month, day).toISOString().split("T")[0];
    return (
      tempStart === dateStr ||
      tempEnd === dateStr ||
      selectedStart === dateStr ||
      selectedEnd === dateStr
    );
  };

  const isInRange = (day: number) => {
    const dateStr = new Date(year, month, day).toISOString().split("T")[0];
    const start = tempStart || selectedStart;
    const end = tempEnd || selectedEnd;
    if (!start || !end) return false;
    return dateStr > start && dateStr < end;
  };

  const handleDateClick = (day: number) => {
    if (isPast(day) || !isDateAvailable(day)) return;

    const dateStr = new Date(year, month, day).toISOString().split("T")[0];

    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(dateStr);
      setTempEnd(null);
    } else {
      if (dateStr < tempStart) {
        setTempStart(dateStr);
        setTempEnd(tempStart);
        if (onSelectRange) onSelectRange(dateStr, tempStart);
      } else {
        setTempEnd(dateStr);
        if (onSelectRange) onSelectRange(tempStart, dateStr);
      }
    }
  };

  useEffect(() => {
    if (selectedStart && selectedEnd) {
      setTempStart(selectedStart);
      setTempEnd(selectedEnd);
    } else if (!selectedStart && !selectedEnd) {
      setTempStart(null);
      setTempEnd(null);
    }
  }, [selectedStart, selectedEnd]);

  const getDayStyle = (day: number) => {
    const past = isPast(day);
    const blocked = isBlocked(day);
    const pending = isPending(day);
    const available = isDateAvailable(day);
    const selected = isSelected(day);
    const inRange = isInRange(day);

    if (past)
      return "bg-gray-100 dark:bg-slate-800 text-gray-300 dark:text-gray-600 cursor-not-allowed";

    if (selected && !blocked && !pending)
      return "bg-sky-500 dark:bg-sky-600 text-white font-semibold cursor-pointer hover:bg-sky-600 dark:hover:bg-sky-700";

    if (inRange && !blocked && !pending)
      return "bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-semibold cursor-pointer";

    // ✅ Style pour les dates en attente de paiement (orange/amber)
    if (pending)
      return "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold cursor-not-allowed border border-amber-200 dark:border-amber-800";

    if (blocked)
      return "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-semibold cursor-not-allowed line-through";

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
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const isStart =
            (tempStart || selectedStart) ===
            new Date(year, month, day).toISOString().split("T")[0];
          const pending = isPending(day);

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              disabled={isPast(day) || isBlocked(day) || isPending(day)}
              className={`
                aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200
                relative
                ${getDayStyle(day)}
              `}
            >
              {day}
              {pending && !isPast(day) && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-500" />
              )}
              {isStart && !isPast(day) && !isBlocked(day) && !pending && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sky-500 dark:bg-sky-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Légende mise à jour */}
      <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Disponible
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Réservé
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            En attente de paiement
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-sky-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Sélectionné
          </span>
        </div>
        
        
      </div>
    </div>
  );
}