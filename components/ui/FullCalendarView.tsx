// components/ui/FullCalendarView.tsx
"use client";

import * as React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg } from "@fullcalendar/core";

// @ts-ignore
import frLocale from "@fullcalendar/core/locales/fr";

interface FullCalendarViewProps {
  bookings: any[];
  blockedDates: any[];
  pricingRules: any[];
  onDateSelect: (start: Date, end: Date) => void;
  onEventClick: (event: any) => void;
  onDateNavigate?: (date: Date) => void;
  initialDate?: Date;
  isDark?: boolean;
  selectedDates?: Date[];
}

export function FullCalendarView({
  bookings = [],
  blockedDates = [],
  pricingRules = [],
  onDateSelect,
  onEventClick,
  onDateNavigate,
  initialDate,
  isDark = false,
  selectedDates = [],
}: FullCalendarViewProps) {
  const calendarRef = React.useRef<FullCalendar>(null);
  const [calendarKey, setCalendarKey] = React.useState(0);

  // Forcer le re-rendu quand les données changent
  React.useEffect(() => {
    setCalendarKey((prev) => prev + 1);
  }, [
    bookings.length,
    blockedDates.length,
    pricingRules.length,
    selectedDates.length,
  ]);

  // Construire les événements pour FullCalendar
  const events = React.useMemo(() => {
    const allEvents: any[] = [];

    // 1. Ajouter les réservations
    bookings.forEach((booking) => {
      const startDate = new Date(booking.checkIn);
      const endDate = new Date(booking.checkOut);

      allEvents.push({
        id: `booking-${booking.id}`,
        title: `🏠 ${booking.guestName || "Réservation"}`,
        start: startDate,
        end: endDate,
        backgroundColor: "#3b82f6",
        borderColor: "#2563eb",
        textColor: "#ffffff",
        extendedProps: {
          type: "booking",
          guestName: booking.guestName,
          price: booking.totalPrice,
          status: booking.status,
        },
        allDay: true,
      });
    });

    // 2. Ajouter les dates bloquées
    blockedDates.forEach((blocked) => {
      let startDate: Date;
      let endDate: Date;

      if (
        blocked.startDate &&
        blocked.endDate &&
        blocked.startDate !== blocked.endDate
      ) {
        startDate = new Date(blocked.startDate);
        endDate = new Date(blocked.endDate);
        endDate.setDate(endDate.getDate() + 1);
      } else {
        const dateStr = blocked.startDate || blocked.date;
        if (!dateStr) return;
        startDate = new Date(dateStr);
        endDate = new Date(dateStr);
        endDate.setDate(endDate.getDate() + 1);
      }

      allEvents.push({
        id: `blocked-${blocked.id}`,
        title: `🔒 ${blocked.reason || "Bloqué"}`,
        start: startDate,
        end: endDate,
        backgroundColor: "#ef4444",
        borderColor: "#dc2626",
        textColor: "#ffffff",
        extendedProps: {
          type: "blocked",
          reason: blocked.reason,
        },
        allDay: true,
      });
    });

    // 3. Ajouter les prix spéciaux
    pricingRules.forEach((rule) => {
      if (!rule.startDate || !rule.fixedPrice) return;

      const startDate = new Date(rule.startDate);
      let endDate = rule.endDate
        ? new Date(rule.endDate)
        : new Date(rule.startDate);
      endDate.setDate(endDate.getDate() + 1);

      allEvents.push({
        id: `price-${rule.id}`,
        title: `💰 ${rule.fixedPrice} TND`,
        start: startDate,
        end: endDate,
        backgroundColor: "#fbbf24",
        borderColor: "#f59e0b",
        textColor: "#78350f",
        extendedProps: {
          type: "price",
          price: rule.fixedPrice,
        },
        allDay: true,
      });
    });

    // 4. Ajouter les dates sélectionnées
    if (selectedDates.length > 0) {
      const sortedDates = [...selectedDates].sort(
        (a, b) => a.getTime() - b.getTime(),
      );
      const startDate = sortedDates[0];
      const endDate = new Date(sortedDates[sortedDates.length - 1]);
      endDate.setDate(endDate.getDate() + 1);

      let isContinuous = true;
      for (let i = 1; i < sortedDates.length; i++) {
        const prev = sortedDates[i - 1];
        const curr = sortedDates[i];
        const diffDays = Math.round(
          (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (diffDays !== 1) {
          isContinuous = false;
          break;
        }
      }

      if (isContinuous && sortedDates.length > 0) {
        allEvents.push({
          id: "temp-selection",
          title: `${sortedDates.length} nuit(s) sélectionnée(s)`,
          start: startDate,
          end: endDate,
          backgroundColor: "transparent",
          borderColor: isDark ? "#818cf8" : "#4f46e5",
          textColor: isDark ? "#c7d2fe" : "#3730a3",
          extendedProps: { type: "selection" },
          display: "background",
          classNames: ["fc-selection-highlight"],
          allDay: true,
        });
      }
    }

    console.log("📅 Événements générés:", {
      total: allEvents.length,
      bookings: bookings.length,
      blocked: blockedDates.length,
      prices: pricingRules.length,
    });

    return allEvents;
  }, [bookings, blockedDates, pricingRules, selectedDates, isDark]);

  const handleSelect = (selectionInfo: DateSelectArg) => {
    onDateSelect(selectionInfo.start, selectionInfo.end);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    if (clickInfo.event.id === "temp-selection") return;
    onEventClick(clickInfo.event);
  };

  const handleDatesSet = (dateInfo: any) => {
    if (onDateNavigate && dateInfo.view.type === "dayGridMonth") {
      onDateNavigate(dateInfo.start);
    }
  };

  const plugins = [
    dayGridPlugin,
    timeGridPlugin,
    listPlugin,
    interactionPlugin,
  ];

  const headerToolbar = {
    left: "prev,next today",
    center: "title",
    right: "dayGridMonth,timeGridWeek,listWeek",
  };

  const messages = {
    today: "Aujourd'hui",
    month: "Mois",
    week: "Semaine",
    day: "Jour",
    list: "Liste",
    previous: "Précédent",
    next: "Suivant",
  };

  return (
    <div className={`fullcalendar-container ${isDark ? "dark-calendar" : ""}`}>
      <style jsx global>{`
        .fullcalendar-container {
          --fc-border-color: ${isDark ? "#334155" : "#e2e8f0"};
        }

        .dark-calendar .fc {
          background-color: #0f172a;
          color: #e2e8f0;
        }

        .dark-calendar .fc-theme-standard th,
        .dark-calendar .fc-theme-standard td,
        .dark-calendar .fc-theme-standard .fc-scrollgrid {
          border-color: #334155;
        }

        .dark-calendar .fc-col-header-cell {
          background-color: #1e293b;
          color: #cbd5e1;
        }

        .dark-calendar .fc-day-today {
          background-color: #1e293b !important;
        }

        .dark-calendar .fc-day-other {
          background-color: #0f172a;
        }

        .dark-calendar .fc-daygrid-day-number {
          color: #cbd5e1;
        }

        .dark-calendar .fc-day-other .fc-daygrid-day-number {
          color: #475569;
        }

        .dark-calendar .fc-button-primary {
          background-color: #1e293b;
          border-color: #334155;
          color: #cbd5e1;
        }

        .dark-calendar .fc-button-primary:hover {
          background-color: #334155;
        }

        .dark-calendar .fc-button-primary:not(:disabled).fc-button-active,
        .dark-calendar .fc-button-primary:not(:disabled):active {
          background-color: #4f46e5;
          border-color: #4f46e5;
        }

        .dark-calendar .fc-list-table {
          background-color: #0f172a;
          border-color: #334155;
        }

        .dark-calendar .fc-list-day-cushion {
          background-color: #1e293b;
          color: #cbd5e1;
        }

        .dark-calendar .fc-list-event td {
          border-color: #334155;
          color: #e2e8f0;
        }

        .dark-calendar .fc-list-event:hover td {
          background-color: #1e293b;
        }

        /* Style pour les dates sélectionnées */
        .fc-daygrid-day.fc-day-selected {
          background-color: ${isDark
            ? "rgba(79, 70, 229, 0.3)"
            : "rgba(99, 102, 241, 0.15)"} !important;
          outline: 2px solid ${isDark ? "#818cf8" : "#4f46e5"} !important;
          outline-offset: -1px;
        }

        .fc-daygrid-day.fc-day-selected .fc-daygrid-day-number {
          background-color: ${isDark ? "#4f46e5" : "#6366f1"};
          color: white !important;
          border-radius: 50%;
          width: 26px;
          height: 26px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .fc-selection-highlight {
          background-color: ${isDark
            ? "rgba(79, 70, 229, 0.2)"
            : "rgba(99, 102, 241, 0.1)"} !important;
        }

        .fc-event {
          cursor: pointer;
          transition: transform 0.1s ease;
          border-radius: 4px !important;
          margin: 2px 4px !important;
          font-size: 11px !important;
          padding: 2px 4px !important;
        }

        .fc-event:hover {
          transform: scale(1.02);
          opacity: 0.9;
        }

        .fc-daygrid-day-events {
          min-height: 30px;
        }
      `}</style>

      <FullCalendar
        key={calendarKey}
        ref={calendarRef}
        plugins={plugins}
        headerToolbar={headerToolbar}
        initialView="dayGridMonth"
        initialDate={initialDate}
        locale={frLocale}
        events={events}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={3}
        weekends={true}
        nowIndicator={true}
        editable={false}
        select={handleSelect}
        eventClick={handleEventClick}
        datesSet={handleDatesSet}
        height="calc(100vh - 280px)"
        buttonText={messages}
        selectAllow={(selectInfo) => {
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          return selectInfo.start >= now;
        }}
        eventDisplay="block"
        displayEventTime={false}
      />
    </div>
  );
}
