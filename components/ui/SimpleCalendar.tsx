// components/ui/SimpleCalendar.tsx - VERSION CORRIGÉE
"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  FR_DAYS_SHORT,
  FR_MONTHS,
  isSameDay,
} from "../../app/[locale]/(dashboard)/dashboard/owner/calendar/hooks/useCalendar";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  LockOpen,
  MousePointerClick,
} from "lucide-react";
import {
  RiCalendarCheckLine,
  RiLockLine,
  RiMoneyDollarCircleLine,
  RiCheckboxCircleLine,
} from "react-icons/ri";
import {
  TbCalendarOff,
  TbCalendarCheck,
  TbCalendarSearch,
} from "react-icons/tb";
import { BsGrid3X3Gap } from "react-icons/bs";
import { MdFormatListBulleted } from "react-icons/md";
import { LuCalendarDays } from "react-icons/lu";

// ── CSS ────────────────────────────────────────────────────────────────────────
const CSS = `
.sc{
  font-family:'Inter',system-ui,sans-serif;
  --c-border:#e2e8f0; --c-head-bg:#f8fafc; --c-head-txt:#64748b;
  --c-day-bg:#fff; --c-day-num:#0f172a;
  --c-btn-bg:#f1f5f9; --c-btn-txt:#475569; --c-btn-hover:#e2e8f0;
  --c-other:#f8fafc; --c-other-num:#94a3b8;
  --c-past-bg:#f9fafb; --c-past-num:#c0c8d6;
  --c-hover:rgba(99,102,241,.04);
  --c-sel:rgba(99,102,241,.10); --c-sel-border:#6366f1;
  --c-title:#0f172a;
  --c-blocked-bg:rgba(239,68,68,.06); --c-booked-bg:rgba(99,102,241,.06); --c-price-bg:rgba(245,158,11,.06);
}
.sc.dark{
  --c-border:#1e293b; --c-head-bg:#0f172a; --c-head-txt:#475569;
  --c-day-bg:#0f172a; --c-day-num:#e2e8f0;
  --c-btn-bg:#1e293b; --c-btn-txt:#94a3b8; --c-btn-hover:#334155;
  --c-other:#090e17; --c-other-num:#334155;
  --c-past-bg:#0a0f1a; --c-past-num:#334155;
  --c-hover:rgba(99,102,241,.08);
  --c-sel:rgba(99,102,241,.16); --c-sel-border:#818cf8;
  --c-title:#f1f5f9;
  --c-blocked-bg:rgba(239,68,68,.12); --c-booked-bg:rgba(99,102,241,.14); --c-price-bg:rgba(245,158,11,.12);
}
/* toolbar */
.sc-toolbar{ display:flex; align-items:center; justify-content:space-between; padding:0 0 12px; gap:10px; flex-wrap:wrap; }
.sc-nav{ display:flex; align-items:center; gap:4px; }
.sc-ico-btn{ width:32px;height:32px;padding:0; display:flex;align-items:center;justify-content:center; background:var(--c-btn-bg); color:var(--c-btn-txt); border:none; border-radius:9px; cursor:pointer; transition:all .15s; }
.sc-ico-btn:hover{ background:var(--c-btn-hover); }
.sc-today-btn{ background:var(--c-btn-bg); color:var(--c-btn-txt); border:none; border-radius:10px; font-size:12px; font-weight:700; padding:6px 14px; cursor:pointer; transition:background .15s; }
.sc-today-btn:hover{ background:var(--c-btn-hover); }
.sc-title{ font-size:18px; font-weight:800; color:var(--c-title); min-width:200px; text-align:center; letter-spacing:-.01em; }
.sc-toggle{ display:flex; gap:3px; background:var(--c-btn-bg); padding:4px; border-radius:11px; }
.sc-vbtn{ display:flex;align-items:center;gap:5px; background:transparent; color:var(--c-btn-txt); border:none; border-radius:8px; font-size:11px; font-weight:700; padding:5px 12px; cursor:pointer; transition:all .15s; white-space:nowrap; }
.sc-vbtn:hover{ background:var(--c-btn-hover); }
.sc-vbtn.on{ background:#6366f1!important; color:#fff!important; box-shadow:0 2px 8px rgba(99,102,241,.35); }
/* legend */
.sc-legend{ display:flex; flex-wrap:wrap; gap:6px; padding:0 0 12px; }
.sc-leg-item{ display:flex;align-items:center;gap:5px; padding:3px 10px; background:var(--c-btn-bg); border-radius:8px; font-size:11px; font-weight:700; color:var(--c-head-txt); border:1px solid transparent; }
.sc-leg-dot{ width:8px;height:8px; border-radius:50%; flex-shrink:0; }
.sc-leg-dot.booked{ background:#6366f1; }
.sc-leg-dot.blocked{ background:#ef4444; }
.sc-leg-dot.price{ background:#f59e0b; }
.sc-leg-dot.sel{ background:transparent; border:2px solid #6366f1; }
.sc-leg-item.sel-item{ background:rgba(99,102,241,.08); border-color:rgba(99,102,241,.25); color:#6366f1; }
/* grid */
.sc-grid-wrap{ border:1px solid var(--c-border); border-radius:12px; overflow:hidden; }
.sc-col-headers{ display:grid; grid-template-columns:repeat(7,1fr); background:var(--c-head-bg); border-bottom:1px solid var(--c-border); }
.sc-col-hdr{ padding:10px 4px; text-align:center; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:var(--c-head-txt); }
.sc-days{ display:grid; grid-template-columns:repeat(7,1fr); }
.sc-day{ min-height:88px; border-right:1px solid var(--c-border); border-bottom:1px solid var(--c-border); padding:5px 4px 3px; cursor:pointer; transition:background .12s; position:relative; background:var(--c-day-bg); }
.sc-day:hover:not(.past):not(.other){ background:var(--c-hover); }
.sc-day.other{ opacity:.3; background:var(--c-other); cursor:default; }
.sc-day.past{ cursor:default; background:var(--c-past-bg); }
.sc-day.today .sc-num{ background:#6366f1; color:#fff!important; border-radius:50%; width:24px;height:24px; display:inline-flex;align-items:center;justify-content:center; }
/* SELECTED — colored indigo tint + outline */
.sc-day.sel{ background:var(--c-sel)!important; outline:2px solid var(--c-sel-border); outline-offset:-2px; }
.sc-day.sel:not(.today) .sc-num{ background:rgba(99,102,241,.18); color:#6366f1!important; border-radius:50%; width:24px;height:24px; display:inline-flex;align-items:center;justify-content:center; font-weight:900; }
.sc-day.booked-day{ background:var(--c-booked-bg); }
.sc-day.blocked-day{ background:var(--c-blocked-bg); }
.sc-day.price-day{ background:var(--c-price-bg); }
.sc-num{ font-size:12px; font-weight:700; color:var(--c-day-num); display:inline-block; min-width:20px; line-height:1; user-select:none; }
.sc-day.past .sc-num{ color:var(--c-past-num); }
.sc-day.other .sc-num{ color:var(--c-other-num); }
.sc-events{ display:flex; flex-direction:column; gap:2px; margin-top:3px; }
/* Tooltip styles */
.sc-pill{ position:relative; border-radius:4px; padding:2px 5px; font-size:9px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:pointer; transition:opacity .12s; display:flex;align-items:center;gap:3px; max-width:100%; }
.sc-pill span{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.sc-pill:hover::after{ 
  content:attr(data-tooltip); 
  position:absolute; 
  bottom:100%; 
  left:50%; 
  transform:translateX(-50%); 
  margin-bottom:8px; 
  padding:8px 12px; 
  background:#1e293b; 
  color:#fff; 
  font-size:11px; 
  font-weight:500; 
  white-space:normal;
  max-width:280px;
  word-break:break-word;
  border-radius:8px; 
  z-index:9999; 
  box-shadow:0 4px 12px rgba(0,0,0,0.2); 
  pointer-events:none;
  line-height:1.4;
  text-align:center;
}
.sc-pill:hover::before{ 
  content:''; 
  position:absolute; 
  bottom:100%; 
  left:50%; 
  transform:translateX(-50%); 
  margin-bottom:2px; 
  border-width:6px; 
  border-style:solid; 
  border-color:#1e293b transparent transparent transparent; 
  pointer-events:none;
  z-index:9999;
}
.sc-pill.sel-pill{ background:rgba(99,102,241,.16)!important; color:#6366f1!important; font-size:8px; }
/* week */
.sc-week-wrap{ overflow-x:auto; }
.sc-week-inner{ min-width:700px; }
.sc-week-header{ display:grid; grid-template-columns:52px repeat(7,1fr); border-bottom:1px solid var(--c-border); background:var(--c-head-bg); position:sticky;top:0;z-index:5; }
.sc-week-hcell{ padding:8px 4px; text-align:center; border-right:1px solid var(--c-border); }
.sc-week-hcell:last-child{ border-right:none; }
.sc-week-hday{ font-size:9px; font-weight:800; text-transform:uppercase; letter-spacing:.07em; color:var(--c-head-txt); }
.sc-week-hnum{ font-size:16px; font-weight:800; color:var(--c-day-num); width:30px;height:30px; display:flex;align-items:center;justify-content:center; border-radius:50%; margin:2px auto 0; transition:all .15s; }
.sc-week-hnum.today{ background:#6366f1; color:#fff!important; }
/* SELECTED week header */
.sc-week-hnum.sel-day{ background:rgba(99,102,241,.15); color:#6366f1!important; outline:2px solid #6366f1; outline-offset:1px; }
.sc-hour-row{ display:grid; grid-template-columns:52px repeat(7,1fr); border-bottom:1px solid var(--c-border); min-height:44px; transition:background .1s; }
.sc-hour-row:hover{ background:var(--c-hover); }
.sc-hour-lbl{ padding:4px 6px; text-align:right; font-size:10px; font-family:monospace; color:var(--c-head-txt); border-right:1px solid var(--c-border); display:flex;align-items:flex-start;justify-content:flex-end; font-weight:600; }
.sc-hour-lbl.now-lbl{ color:#ef4444; font-weight:800; }
.sc-hour-cell{ border-right:1px solid var(--c-border); padding:2px; position:relative; }
.sc-hour-cell:last-child{ border-right:none; }
.sc-hour-cell.blocked-bg{ background:var(--c-blocked-bg); }
.sc-hour-cell.booked-bg{ background:var(--c-booked-bg); }
.sc-hour-cell.price-bg{ background:var(--c-price-bg); }
/* SELECTED column tint */
.sc-hour-cell.sel-col{ background:var(--c-sel)!important; }
.sc-hour-btn{ width:100%;height:100%;min-height:40px; display:flex;flex-direction:column;align-items:center;justify-content:center; gap:2px; border:none;background:transparent;cursor:pointer; border-radius:6px; transition:background .1s; }
.sc-hour-btn:hover:not(:disabled){ background:rgba(99,102,241,.07); }
.sc-hour-btn:disabled{ cursor:default; }
.sc-hour-pill{ display:flex;align-items:center;gap:3px; font-size:9px; font-weight:700; padding:2px 6px; border-radius:4px; }
.sc-hour-pill[title]:hover::after{ content:attr(title); position:absolute; bottom:100%; left:50%; transform:translateX(-50%); margin-bottom:8px; padding:8px 12px; background:#1e293b; color:#fff; font-size:11px; white-space:normal; max-width:280px; word-break:break-word; border-radius:8px; z-index:9999; pointer-events:none; }
/* now */
.sc-now-line{ position:absolute;left:0;right:0;height:2px;background:#ef4444;z-index:4;pointer-events:none; }
.sc-now-dot{ position:absolute;left:-4px;top:-3px;width:8px;height:8px;border-radius:50%;background:#ef4444; }
/* list */
.sc-list-table{ width:100%; border-collapse:collapse; font-size:12px; }
.sc-list-dh td{ background:var(--c-head-bg); padding:7px 14px; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.07em; color:var(--c-head-txt); border-top:1px solid var(--c-border); }
.sc-list-row td{ padding:9px 14px; border-top:1px solid var(--c-border); color:var(--c-day-num); vertical-align:middle; transition:background .1s; }
.sc-list-row:hover td{ background:var(--c-hover); }
/* SELECTED list row */
.sc-list-row.sel-row td{ background:var(--c-sel)!important; }
.sc-status-pill{ display:inline-flex;align-items:center;gap:5px; padding:3px 9px; border-radius:99px; font-size:10px; font-weight:700; }
.sc-status-pill[title]:hover::after{ content:attr(title); position:absolute; bottom:100%; left:50%; transform:translateX(-50%); margin-bottom:8px; padding:8px 12px; background:#1e293b; color:#fff; font-size:11px; white-space:normal; max-width:280px; word-break:break-word; border-radius:8px; z-index:9999; pointer-events:none; white-space:pre-wrap; }
.sc-list-empty{ text-align:center; padding:40px; color:var(--c-head-txt); font-size:12px; }
`;

// ── color config ──────────────────────────────────────────────────────────────
const COLORS = {
  booking: {
    bg: (d: boolean) => (d ? "#1e3a8a" : "#6366f1"),
    text: "#fff",
    light: (d: boolean) =>
      d ? "rgba(99,102,241,.20)" : "rgba(99,102,241,.12)",
  },
  blocked: {
    bg: (d: boolean) => (d ? "#7f1d1d" : "#ef4444"),
    text: "#fff",
    light: (d: boolean) => (d ? "rgba(239,68,68,.20)" : "rgba(239,68,68,.10)"),
  },
  price: {
    bg: (d: boolean) => (d ? "#78350f" : "#f59e0b"),
    text: (d: boolean) => (d ? "#fef3c7" : "#78350f"),
    light: (d: boolean) =>
      d ? "rgba(245,158,11,.20)" : "rgba(245,158,11,.12)",
  },
};

const getEventInfo = (day: any, dark: boolean, t: any) => {
  if (day.isBooked) {
    const fullLabel = day.bookingGuest || t("booking");
    let displayLabel = fullLabel;
    if (displayLabel && displayLabel.length > 12)
      displayLabel = displayLabel.substring(0, 10) + "..";
    return {
      type: "booking",
      bg: COLORS.booking.bg(dark),
      text: COLORS.booking.text,
      label: displayLabel,
      fullLabel,
    };
  }
  if (day.isBlocked && !day.isPast) {
    const fullLabel = day.blockedReason || t("blocked");
    let displayLabel = fullLabel;
    if (displayLabel && displayLabel.length > 10)
      displayLabel = displayLabel.substring(0, 8) + "..";
    return {
      type: "blocked",
      bg: COLORS.blocked.bg(dark),
      text: COLORS.blocked.text,
      label: displayLabel,
      fullLabel,
    };
  }
  if (day.customPrice && !day.isPast)
    return {
      type: "price",
      bg: COLORS.price.bg(dark),
      text: COLORS.price.text(dark),
      label: `${day.customPrice} TND`,
      fullLabel: `💰 Prix spécial: ${day.customPrice} TND par nuit`,
    };
  return null;
};

// ── component ─────────────────────────────────────────────────────────────────
export function SimpleCalendar({
  days,
  currentDate,
  onDateChange,
  onDateClick,
  selectedDates,
  onDateMouseEnter,
  isDark = false,
}: {
  days: any[];
  currentDate: Date;
  onDateChange: (d: Date) => void;
  onDateClick: (day: any) => void;
  selectedDates: Date[];
  onDateMouseEnter?: (day: any) => void;
  isDark?: boolean;
}) {
  const t = useTranslations("Calendar");
  const [view, setView] = React.useState<"month" | "week" | "list">("month");

  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const changeMonth = (d: number) => {
    const n = new Date(currentDate);
    n.setMonth(n.getMonth() + d);
    onDateChange(n);
  };
  const changeWeek = (d: number) => {
    const n = new Date(currentDate);
    n.setDate(n.getDate() + d * 7);
    onDateChange(n);
  };
  const goToday = () => onDateChange(new Date());
  const handlePrev = () => (view === "week" ? changeWeek(-1) : changeMonth(-1));
  const handleNext = () => (view === "week" ? changeWeek(1) : changeMonth(1));

  const isSel = (d: Date) => selectedDates.some((s) => isSameDay(s, d));

  const weekStart = React.useMemo(() => {
    const s = new Date(currentDate);
    s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
    s.setHours(0, 0, 0, 0);
    return s;
  }, [currentDate]);

  const weekDates = React.useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
      }),
    [weekStart],
  );

  const dayMap = React.useMemo(() => {
    const m = new Map<string, any>();
    days.forEach((d) => m.set(d.date.toDateString(), d));
    return m;
  }, [days]);

  const title = React.useMemo(() => {
    if (view === "week") {
      const end = weekDates[6];
      const fmt = (d: Date) =>
        d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
      return `${fmt(weekDates[0])} – ${fmt(end)} ${end.getFullYear()}`;
    }
    return `${FR_MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }, [view, currentDate, weekDates]);

  // ── MONTH ───────────────────────────────────────────────────────────────────
  const renderMonth = () => (
    <div className="sc-grid-wrap">
      <div className="sc-col-headers">
        {FR_DAYS_SHORT.map((d) => (
          <div key={d} className="sc-col-hdr">
            {d}
          </div>
        ))}
      </div>
      <div className="sc-days">
        {days.map((day, i) => {
          const ev = getEventInfo(day, isDark, t);
          const isTd = isSameDay(day.date, today);
          const isSd = isSel(day.date);
          const cls = [
            "sc-day",
            !day.isCurrentMonth ? "other" : "",
            day.isPast && day.isCurrentMonth ? "past" : "",
            isTd ? "today" : "",
            isSd ? "sel" : "",
            day.isBooked ? "booked-day" : "",
            day.isBlocked && !day.isPast ? "blocked-day" : "",
            day.customPrice && !day.isPast ? "price-day" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div
              key={i}
              className={cls}
              onClick={() =>
                !day.isPast && day.isCurrentMonth && onDateClick(day)
              }
              onMouseEnter={() => onDateMouseEnter?.(day)}
            >
              <span className="sc-num">{day.date.getDate()}</span>
              <div className="sc-events">
                {isSd && !ev && (
                  <div className="sc-pill sel-pill">
                    <RiCheckboxCircleLine
                      style={{ width: 9, height: 9, flexShrink: 0 }}
                    />
                    {t("selected")}
                  </div>
                )}
                {ev && (
                  <div
                    className="sc-pill"
                    style={{ background: ev.bg, color: ev.text }}
                    data-tooltip={ev.fullLabel}
                  >
                    {ev.type === "booking" && (
                      <RiCalendarCheckLine
                        style={{ width: 9, height: 9, flexShrink: 0 }}
                      />
                    )}
                    {ev.type === "blocked" && (
                      <RiLockLine
                        style={{ width: 9, height: 9, flexShrink: 0 }}
                      />
                    )}
                    {ev.type === "price" && (
                      <RiMoneyDollarCircleLine
                        style={{ width: 9, height: 9, flexShrink: 0 }}
                      />
                    )}
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ev.label}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── WEEK ────────────────────────────────────────────────────────────────────
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const nowHour = new Date().getHours();
  const nowMin = new Date().getMinutes();

  const renderWeek = () => (
    <div className="sc-week-wrap">
      <div className="sc-week-inner sc-grid-wrap">
        <div className="sc-week-header">
          <div
            className="sc-week-hcell"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Clock size={13} style={{ color: "var(--c-head-txt)" }} />
          </div>
          {weekDates.map((wd, i) => {
            const isTd = isSameDay(wd, today);
            const isSd = isSel(wd);
            return (
              <div key={i} className="sc-week-hcell">
                <div className="sc-week-hday">{FR_DAYS_SHORT[i]}</div>
                <div
                  className={`sc-week-hnum${isTd ? " today" : ""}${isSd && !isTd ? " sel-day" : ""}`}
                >
                  {wd.getDate()}
                </div>
              </div>
            );
          })}
        </div>
        <div>
          {hours.map((h) => {
            const nowRow = isSameDay(new Date(), today) && h === nowHour;
            const topPct = (nowMin / 60) * 100;
            return (
              <div key={h} className="sc-hour-row">
                <div
                  className={`sc-hour-lbl${h === nowHour && isSameDay(new Date(), today) ? " now-lbl" : ""}`}
                >
                  {String(h).padStart(2, "0")}:00
                </div>
                {weekDates.map((wd, di) => {
                  const day = dayMap.get(wd.toDateString());
                  const isBlk = day?.isBlocked && !day?.isPast;
                  const isBkd = day?.isBooked;
                  const isPrc = !!day?.customPrice && !isBlk && !isBkd;
                  const isSd = isSel(wd);

                  const cellCls = [
                    "sc-hour-cell",
                    isBlk ? "blocked-bg" : "",
                    isBkd ? "booked-bg" : "",
                    isPrc ? "price-bg" : "",
                    isSd && !isBlk && !isBkd ? "sel-col" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  // Récupérer le texte complet pour le tooltip
                  const tooltipText = isBkd ? day?.bookingGuest : (isBlk ? day?.blockedReason : (isPrc ? `Prix spécial: ${day?.customPrice} TND` : ""));

                  return (
                    <div
                      key={di}
                      className={cellCls}
                      style={{ position: "relative" }}
                    >
                      {nowRow && isSameDay(wd, today) && (
                        <div
                          className="sc-now-line"
                          style={{ top: `${topPct}%` }}
                        >
                          <div className="sc-now-dot" />
                        </div>
                      )}
                      <button
                        className="sc-hour-btn"
                        disabled={!day || day.isPast || isBkd || isBlk}
                        onClick={() => day && onDateClick(day)}
                        onMouseEnter={() => day && onDateMouseEnter?.(day)}
                      >
                        {isBkd && h === 8 && (
                          <div
                            className="sc-hour-pill"
                            style={{
                              background: COLORS.booking.bg(isDark),
                              color: COLORS.booking.text,
                            }}
                            title={tooltipText}
                          >
                            <RiCalendarCheckLine
                              style={{ width: 9, height: 9 }}
                            />{" "}
                            {day?.bookingGuest?.substring(0, 10) ||
                              t("booking")}
                          </div>
                        )}
                        {isBlk && h === 8 && (
                          <div
                            className="sc-hour-pill"
                            style={{
                              background: COLORS.blocked.bg(isDark),
                              color: COLORS.blocked.text,
                            }}
                            title={tooltipText}
                          >
                            <RiLockLine style={{ width: 9, height: 9 }} />{" "}
                            {day?.blockedReason?.substring(0, 10) ||
                              t("blocked")}
                          </div>
                        )}
                        {isPrc && h === 8 && (
                          <div
                            className="sc-hour-pill"
                            style={{
                              background: COLORS.price.bg(isDark),
                              color: COLORS.price.text(isDark) as string,
                            }}
                            title={tooltipText}
                          >
                            <RiMoneyDollarCircleLine
                              style={{ width: 9, height: 9 }}
                            />{" "}
                            {day?.customPrice} TND
                          </div>
                        )}
                        {isSd && !isBlk && !isBkd && !isPrc && h === 8 && (
                          <div
                            className="sc-hour-pill"
                            style={{
                              background: "rgba(99,102,241,.18)",
                              color: "#6366f1",
                            }}
                          >
                            <RiCheckboxCircleLine
                              style={{ width: 9, height: 9 }}
                            />{" "}
                            {t("selected")}
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── LIST ────────────────────────────────────────────────────────────────────
  const renderList = () => {
    const evDays = days
      .filter((d) => d.isCurrentMonth)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    const groups: { label: string; items: any[] }[] = [];
    evDays.forEach((d) => {
      const label = d.date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      });
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.items.push(d);
      else groups.push({ label, items: [d] });
    });

    return (
      <div className="sc-grid-wrap">
        {groups.length === 0 && (
          <div className="sc-list-empty">
            <TbCalendarSearch
              style={{
                width: 28,
                height: 28,
                margin: "0 auto 8px",
                color: "var(--c-head-txt)",
              }}
            />
            {t("noEvents")}
          </div>
        )}
        <table className="sc-list-table">
          <tbody>
            {groups.map(({ label, items }) => (
              <React.Fragment key={label}>
                <tr className="sc-list-dh">
                  <td colSpan={4} style={{ textTransform: "capitalize" }}>
                    {label}
                  </td>
                </tr>
                {items.map((day, i) => {
                  const ev = getEventInfo(day, isDark, t);
                  const sel = isSel(day.date);
                  const tooltipText = day.isBooked ? day.bookingGuest : (day.isBlocked ? day.blockedReason : (day.customPrice ? `Prix spécial: ${day.customPrice} TND` : ""));
                  return (
                    <tr
                      key={i}
                      className={`sc-list-row${sel ? " sel-row" : ""}`}
                      style={{ cursor: "pointer" }}
                      onClick={() => !day.isPast && onDateClick(day)}
                    >
                      <td style={{ width: 24, paddingRight: 0 }}>
                        {(ev || sel) && (
                          <span
                            style={{
                              display: "inline-block",
                              width: 10,
                              height: 10,
                              borderRadius: 3,
                              background: ev ? ev.bg : "#6366f1",
                              verticalAlign: "middle",
                            }}
                          />
                        )}
                      </td>
                      <td>
                        {sel && (
                          <div
                            className="sc-status-pill"
                            style={{
                              background: "rgba(99,102,241,.12)",
                              color: "#6366f1",
                              marginRight: 6,
                              display: "inline-flex",
                            }}
                          >
                            <RiCheckboxCircleLine
                              style={{ width: 11, height: 11 }}
                            />{" "}
                            {t("selected")}
                          </div>
                        )}
                        {day.isBooked && (
                          <div
                            className="sc-status-pill"
                            style={{
                              background: COLORS.booking.light(isDark),
                              color: COLORS.booking.bg(isDark),
                            }}
                            title={tooltipText}
                          >
                            <RiCalendarCheckLine
                              style={{ width: 11, height: 11 }}
                            />{" "}
                            {day.bookingGuest?.substring(0, 20) || t("booking")}
                          </div>
                        )}
                        {day.isBlocked && !day.isPast && (
                          <div
                            className="sc-status-pill"
                            style={{
                              background: COLORS.blocked.light(isDark),
                              color: COLORS.blocked.bg(isDark),
                            }}
                            title={tooltipText}
                          >
                            <RiLockLine style={{ width: 11, height: 11 }} />{" "}
                            {day.blockedReason?.substring(0, 20) ||
                              t("blocked")}
                          </div>
                        )}
                        {day.customPrice &&
                          !day.isBlocked &&
                          !day.isBooked &&
                          !day.isPast && (
                            <div
                              className="sc-status-pill"
                              style={{
                                background: COLORS.price.light(isDark),
                                color: COLORS.price.bg(isDark),
                              }}
                              title={tooltipText}
                            >
                              <RiMoneyDollarCircleLine
                                style={{ width: 11, height: 11 }}
                              />{" "}
                              {t("specialPrice")}
                            </div>
                          )}
                        {!day.isBooked &&
                          !day.isBlocked &&
                          !day.customPrice &&
                          !day.isPast &&
                          !sel && (
                            <div
                              className="sc-status-pill"
                              style={{
                                background: "rgba(16,185,129,.10)",
                                color: "#059669",
                              }}
                            >
                              <TbCalendarCheck
                                style={{ width: 11, height: 11 }}
                              />{" "}
                              {t("available")}
                            </div>
                          )}
                        {day.isPast && (
                          <div
                            className="sc-status-pill"
                            style={{
                              background: "var(--c-btn-bg)",
                              color: "var(--c-head-txt)",
                            }}
                          >
                            <TbCalendarOff style={{ width: 11, height: 11 }} />{" "}
                            {t("past")}
                          </div>
                        )}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontWeight: 700,
                          color: day.customPrice
                            ? "#f59e0b"
                            : "var(--c-head-txt)",
                        }}
                      >
                        {day.customPrice && !day.isBlocked && !day.isBooked ? (
                          `${day.customPrice} TND`
                        ) : (
                          <span style={{ opacity: 0.35 }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {!day.isPast && !day.isBooked && !day.isBlocked && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDateClick(day);
                            }}
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "3px 9px",
                              borderRadius: 6,
                              border: "none",
                              cursor: "pointer",
                              background: sel
                                ? "#6366f1"
                                : "rgba(99,102,241,.10)",
                              color: sel ? "#fff" : "#6366f1",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              transition: "all .15s",
                            }}
                          >
                            <MousePointerClick size={10} />
                            {sel ? t("deselect") : t("select")}
                          </button>
                        )}
                        {day.isBlocked && !day.isPast && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDateClick(day);
                            }}
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "3px 9px",
                              borderRadius: 6,
                              border: "none",
                              cursor: "pointer",
                              background: "rgba(239,68,68,.10)",
                              color: "#ef4444",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <LockOpen size={10} /> {t("unblock")}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const VIEWS = [
    { val: "month" as const, Icon: BsGrid3X3Gap, key: "month" },
    { val: "week" as const, Icon: LuCalendarDays, key: "week" },
    { val: "list" as const, Icon: MdFormatListBulleted, key: "list" },
  ];

  return (
    <div className={`sc${isDark ? " dark" : ""}`}>
      <style>{CSS}</style>

      <div className="sc-toolbar">
        <div className="sc-nav">
          <button className="sc-ico-btn" onClick={handlePrev}>
            <ChevronLeft size={16} />
          </button>
          <button className="sc-ico-btn" onClick={handleNext}>
            <ChevronRight size={16} />
          </button>
          <button className="sc-today-btn" onClick={goToday}>
            {t("today")}
          </button>
        </div>
        <div className="sc-title">{title}</div>
        <div className="sc-toggle">
          {VIEWS.map(({ val, Icon, key }) => (
            <button
              key={val}
              className={`sc-vbtn${view === val ? " on" : ""}`}
              onClick={() => setView(val)}
            >
              <Icon style={{ width: 13, height: 13, flexShrink: 0 }} /> {t(key)}
            </button>
          ))}
        </div>
      </div>

      <div className="sc-legend">
        <div className="sc-leg-item">
          <span className="sc-leg-dot booked" />
          <RiCalendarCheckLine style={{ width: 10, height: 10 }} />{" "}
          {t("legendBooked")}
        </div>
        <div className="sc-leg-item">
          <span className="sc-leg-dot blocked" />
          <RiLockLine style={{ width: 10, height: 10 }} /> {t("legendBlocked")}
        </div>
        <div className="sc-leg-item">
          <span className="sc-leg-dot price" />
          <RiMoneyDollarCircleLine style={{ width: 10, height: 10 }} />{" "}
          {t("legendSpecialPrice")}
        </div>
        {selectedDates.length > 0 ? (
          <div className="sc-leg-item sel-item">
            <span className="sc-leg-dot sel" />
            <RiCheckboxCircleLine style={{ width: 10, height: 10 }} />
            {t("legendSelectedCount", { count: selectedDates.length })}
          </div>
        ) : (
          <div className="sc-leg-item">
            <span className="sc-leg-dot sel" /> {t("legendSelect")}
          </div>
        )}
      </div>

      {view === "month" && renderMonth()}
      {view === "week" && renderWeek()}
      {view === "list" && renderList()}
    </div>
  );
}