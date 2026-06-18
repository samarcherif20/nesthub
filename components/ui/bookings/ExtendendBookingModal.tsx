// components/bookings/ExtendBookingModal.tsx
"use client";

import { useState, useEffect } from "react";
import { format, differenceInDays, isBefore, addMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslations } from "next-intl";
import {
  IoCloseOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoCalendarOutline,
  IoCashOutline,
  IoInformationCircleOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
} from "react-icons/io5";
import Modal from "@/components/ui/Modal";

// Toast component
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
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const getStyles = () => {
    if (type === "success") return "bg-green-500 text-white";
    if (type === "error") return "bg-red-500 text-white";
    return "bg-sky-500 text-white";
  };

  const getIcon = () => {
    if (type === "success")
      return <IoCheckmarkCircleOutline className="w-5 h-5" />;
    if (type === "error") return <IoAlertCircleOutline className="w-5 h-5" />;
    return <IoInformationCircleOutline className="w-5 h-5" />;
  };

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[250] animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${getStyles()}`}
      >
        {getIcon()}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70">
          <IoCloseOutline className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

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
  const t = useTranslations("Bookings");

  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(booking.checkOut),
  );
  const [currentMonth, setCurrentMonth] = useState(new Date(booking.checkOut));
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<Set<string>>(new Set());
  const [checkingAvailability, setCheckingAvailability] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [isLoadingMonths, setIsLoadingMonths] = useState(false);

  const currentCheckOut = new Date(booking.checkOut);
  const additionalNights = differenceInDays(selectedDate, currentCheckOut);
  const basePriceTotal = additionalNights * booking.pricePerNight;
  const serviceFee = Math.round(basePriceTotal * 0.09);
  const totalPrice = basePriceTotal + serviceFee;

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchAvailabilityForMonths();
  }, [currentMonth]);

  const fetchAvailabilityForMonths = async () => {
    setIsLoadingMonths(true);
    setCheckingAvailability(true);

    try {
      const blockedSet = new Set<string>();
      const monthsToCheck = [0, 1, 2];

      for (const offset of monthsToCheck) {
        const monthDate = addMonths(currentMonth, offset);
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth() + 1;

        const response = await fetch(
          `/api/listings/availability?listingId=${booking.listingId}&year=${year}&month=${month}`,
        );

        if (response.ok) {
          const data = await response.json();

          if (data.blockedDates && Array.isArray(data.blockedDates)) {
            data.blockedDates.forEach((bd: any) => {
              const date = new Date(bd.startDate).toISOString().split("T")[0];
              blockedSet.add(date);
            });
          }

          if (
            data.confirmedBlockedDates &&
            Array.isArray(data.confirmedBlockedDates)
          ) {
            data.confirmedBlockedDates.forEach((bd: any) => {
              const date = new Date(bd.startDate).toISOString().split("T")[0];
              blockedSet.add(date);
            });
          }
        }
      }

      setAvailability(blockedSet);
    } catch (err) {
      console.error("Erreur vérification disponibilité:", err);
    } finally {
      setCheckingAvailability(false);
      setIsLoadingMonths(false);
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
    } else {
      showToast(t("extend.errors.notAvailable"), "error");
    }
  };

  const handleSubmit = async () => {
    if (additionalNights <= 0) {
      showToast(t("extend.errors.selectDate"), "error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/bookings/${booking.id}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newCheckOut: selectedDate.toISOString(),
          additionalNights,
          totalPrice,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || t("extend.errors.requestError"), "error");
        return;
      }

      showToast(t("extend.success.message"), "success");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      showToast(t("extend.errors.network"), "error");
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

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8" />);
    }

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
    t("calendar.january"),
    t("calendar.february"),
    t("calendar.march"),
    t("calendar.april"),
    t("calendar.may"),
    t("calendar.june"),
    t("calendar.july"),
    t("calendar.august"),
    t("calendar.september"),
    t("calendar.october"),
    t("calendar.november"),
    t("calendar.december"),
  ];

  const daysOfWeek = [
    { key: "mon", label: t("calendar.monday") },
    { key: "tue", label: t("calendar.tuesday") },
    { key: "wed", label: t("calendar.wednesday") },
    { key: "thu", label: t("calendar.thursday") },
    { key: "fri", label: t("calendar.friday") },
    { key: "sat", label: t("calendar.saturday") },
    { key: "sun", label: t("calendar.sunday") },
  ];

  const disableSubmit = additionalNights <= 0 || loading;

  // Title personnalisé pour le Modal
  const modalTitle = (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
        <IoCalendarOutline className="text-xl" />
      </div>
      <div>
        <h2 className="text-slate-900 dark:text-white text-base font-bold">
          {t("extend.title")}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs">
          {booking.listingTitle}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Modal isOpen={true} onClose={onClose} title={modalTitle}>
        {/* Body - PLUS DE HEADER ICI */}
        <div className="p-5 space-y-5">
          {/* Current Stay Info */}
          <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border-l-4 border-indigo-500">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {t("extend.currentDeparture")}
              </p>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">
                {format(currentCheckOut, "dd MMMM yyyy", { locale: fr })}
              </p>
            </div>
            <IoCalendarOutline className="text-slate-400 text-lg" />
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {t("extend.newDeparture")}
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
                  {t("extend.selectDate")}
                </span>
              </div>
              {additionalNights > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400">
                    +{additionalNights}{" "}
                    {additionalNights > 1
                      ? t("extend.nights")
                      : t("extend.night")}
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
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
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

              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {daysOfWeek.map((day) => (
                  <div
                    key={day.key}
                    className="text-[9px] font-bold text-slate-400 uppercase"
                  >
                    {day.label}
                  </div>
                ))}
              </div>

              {checkingAvailability || isLoadingMonths ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
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
                  {t("extend.priceDetails")}
                </h3>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">
                    {additionalNights}{" "}
                    {additionalNights > 1
                      ? t("extend.extraNights")
                      : t("extend.extraNight")}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {basePriceTotal.toLocaleString()} TND
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">
                    {t("extend.serviceFee")}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {serviceFee.toLocaleString()} TND
                  </span>
                </div>
                <div className="pt-2 flex justify-between border-t border-dashed border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {t("extend.total")}
                  </span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {totalPrice.toLocaleString()} TND
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Info Note */}
          <div className="flex gap-2 p-2.5 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <IoInformationCircleOutline className="text-purple-500 text-sm flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-purple-700 dark:text-purple-400 leading-relaxed">
              {t("extend.infoNote")}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            {t("extend.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={disableSubmit}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t("extend.sending")}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <IoCheckmarkCircleOutline className="text-sm" />
                {t("extend.sendRequest")}
              </span>
            )}
          </button>
        </div>
      </Modal>
    </>
  );
}
