// components/bookings/ExtendBookingModal.tsx
"use client";

import { useState, useEffect } from "react";
import { format, differenceInDays, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import {
  IoCloseOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoCalendarOutline,
  IoCashOutline,
  IoInformationCircleOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";
import Modal from "@/components/ui/Modal";

interface ExtendBookingModalProps {
  booking: {
    id: string;
    listingId: string;
    listingTitle: string;
    checkOut: string;
    pricePerNight: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExtendBookingModal({
  booking,
  onClose,
  onSuccess,
}: ExtendBookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(booking.checkOut),
  );
  const [currentMonth, setCurrentMonth] = useState(new Date(booking.checkOut));
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<Set<string>>(new Set());
  const [checkingAvailability, setCheckingAvailability] = useState(true);
  const [error, setError] = useState("");

  const currentCheckOut = new Date(booking.checkOut);
  const additionalNights = differenceInDays(selectedDate, currentCheckOut);
  const basePriceTotal = additionalNights * booking.pricePerNight;
  const serviceFee = Math.round(basePriceTotal * 0.09);
  const totalPrice = basePriceTotal + serviceFee;

  useEffect(() => {
    checkAvailability();
  }, [currentMonth]);

  const checkAvailability = async () => {
    setCheckingAvailability(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const response = await fetch(
        `/api/listings/availability?listingId=${booking.listingId}&year=${year}&month=${month}`,
      );
      const data = await response.json();

      const blockedSet = new Set<string>();
      data.blockedDates.forEach((bd: any) => {
        const date = new Date(bd.startDate).toISOString().split("T")[0];
        blockedSet.add(date);
      });
      setAvailability(blockedSet);
    } catch (err) {
      console.error("Erreur vérification disponibilité:", err);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const isDateAvailable = (date: Date): boolean => {
    const dateStr = date.toISOString().split("T")[0];
    const isBlocked = availability.has(dateStr);
    const isPast = isBefore(date, currentCheckOut);
    return !isBlocked && !isPast;
  };

  const handleDateSelect = (date: Date) => {
    if (isDateAvailable(date)) {
      setSelectedDate(date);
      setError("");
    }
  };

  const handleSubmit = async () => {
    if (additionalNights <= 0) {
      setError("Veuillez sélectionner une date après votre départ actuel");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newCheckOut: selectedDate.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur lors de la demande");
        return;
      }

      onSuccess();
    } catch (err) {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startDay = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Jours vides
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8" />);
    }
    // Jours du mois
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const isAvailable = isDateAvailable(date);
      const isSelected =
        selectedDate && date.toDateString() === selectedDate.toDateString();
      const isCurrentCheckout =
        date.toDateString() === currentCheckOut.toDateString();

      let bgClass = "hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer";
      let textClass = "text-gray-900 dark:text-white";

      if (isCurrentCheckout) {
        bgClass = "bg-indigo-100 dark:bg-indigo-900/30 ring-2 ring-indigo-500";
        textClass = "text-indigo-700 dark:text-indigo-400 font-semibold";
      } else if (isSelected) {
        bgClass = "bg-indigo-600 text-white ring-4 ring-indigo-500/20";
        textClass = "text-white font-bold";
      } else if (!isAvailable) {
        bgClass =
          "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed line-through";
        textClass = "text-gray-400";
      }

      days.push(
        <button
          key={d}
          onClick={() => handleDateSelect(date)}
          disabled={!isAvailable}
          className={`h-8 rounded-lg text-xs font-medium transition-all ${bgClass} ${textClass} ${
            !isAvailable ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
          }`}
        >
          {d}
        </button>,
      );
    }
    return days;
  };

  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  const daysOfWeek = [
    { key: "mon", label: "L" },
    { key: "tue", label: "M" },
    { key: "wed", label: "M" },
    { key: "thu", label: "J" },
    { key: "fri", label: "V" },
    { key: "sat", label: "S" },
    { key: "sun", label: "D" },
  ];

  const disableSubmit = additionalNights <= 0 || loading;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      showCloseButton={true}
      title={
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
            <IoCalendarOutline className="text-xl" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-slate-900 dark:text-white text-sm font-bold leading-tight">
              Prolonger le séjour
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              {booking.listingTitle}
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Current Stay Info */}
        <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border-l-4 border-indigo-500">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
              Départ actuel
            </p>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">
              {format(currentCheckOut, "dd MMMM yyyy", { locale: fr })}
            </p>
          </div>
          <IoCalendarOutline className="text-slate-400 text-lg" />
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Nouveau départ
            </p>
            <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
              {format(selectedDate, "dd MMMM yyyy", { locale: fr })}
            </p>
          </div>
        </div>

        {/* Calendar */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <IoCalendarOutline className="text-slate-400 text-sm" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Choisir une date
              </span>
            </div>
            {additionalNights > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400">
                  +{additionalNights} nuit{additionalNights > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() - 1,
                      1,
                    ),
                  )
                }
                className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <IoChevronBackOutline className="text-sm text-slate-600 dark:text-slate-400" />
              </button>
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                {monthNames[currentMonth.getMonth()]}{" "}
                {currentMonth.getFullYear()}
              </span>
              <button
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() + 1,
                      1,
                    ),
                  )
                }
                className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <IoChevronForwardOutline className="text-sm text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            {/* ✅ LIGNE CORRIGÉE : jours de la semaine avec clés uniques */}
            <div className="grid grid-cols-7 gap-0.5 text-center mb-2">
              {daysOfWeek.map((day) => (
                <div
                  key={day.key}
                  className="text-[9px] font-bold text-slate-400 uppercase"
                >
                  {day.label}
                </div>
              ))}
            </div>

            {checkingAvailability ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-0.5">
                {generateCalendar()}
              </div>
            )}
          </div>
        </div>

        {/* Price Breakdown */}
        {additionalNights > 0 && (
          <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
            <div className="flex items-center gap-2 mb-2">
              <IoCashOutline className="text-slate-400 text-sm" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Détail du prix
              </h3>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">
                  {additionalNights} nuit{additionalNights > 1 ? "s" : ""}{" "}
                  supplémentaire{additionalNights > 1 ? "s" : ""}
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {basePriceTotal.toLocaleString()} TND
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">
                  Frais de service
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {serviceFee.toLocaleString()} TND
                </span>
              </div>
              <div className="pt-1.5 flex justify-between border-t border-dashed border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Total
                </span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {totalPrice.toLocaleString()} TND
                </span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-2">
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Info Note */}
        <div className="flex gap-2 p-2.5 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <IoInformationCircleOutline className="text-purple-500 text-sm flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-purple-700 dark:text-purple-400 leading-relaxed">
            La prolongation est sujette à l'acceptation du propriétaire.
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row-reverse gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={handleSubmit}
          disabled={disableSubmit}
          className="inline-flex justify-center items-center px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Envoi...
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <IoCheckmarkCircleOutline className="text-sm" />
              Envoyer la demande
            </span>
          )}
        </button>
        <button
          onClick={onClose}
          className="inline-flex justify-center items-center px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
        >
          <IoCloseOutline className="text-sm mr-1" />
          Annuler
        </button>
      </div>
    </Modal>
  );
}
