// app/[locale]/reservations/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import {
  IoCalendarOutline,
  IoPeopleOutline,
  IoLocationOutline,
  IoChatbubbleOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCloseCircleOutline,
  IoArrowForwardOutline,
  IoHomeOutline,
  IoRefreshOutline,
  IoStarSharp,
  IoStarOutline,
  IoWalletOutline,
  IoCardOutline,
  IoChevronForwardOutline,
  IoCompassOutline,
  IoChatbubblesOutline,
  IoPersonCircleOutline,
  IoMoonOutline,
  IoSunnyOutline,
  IoSearchOutline,
  IoFunnelOutline,
  IoCloseOutline,
  IoAlertCircleOutline,
  IoArrowBackOutline,
  IoReceiptOutline,
  IoShieldCheckmarkOutline,
  IoHeartOutline,
  IoHeartSharp,
  IoBedOutline,
  IoEllipsisVerticalOutline,
  IoShareOutline,
  IoDocumentTextOutline,
  IoNotificationsOutline,
  IoSparklesOutline,
  IoAirplaneOutline,
  IoTrendingUpOutline,
} from "react-icons/io5";
import { TenantHeader } from "@/components/ui/header/TenantHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ReviewModal } from "@/components/ui/modals/ReviewModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pip = (url: string) => `/api/listings/image?url=${encodeURIComponent(url)}`;
const pipAvatar = (url: string) => `/api/users/avatar?url=${encodeURIComponent(url)}`;

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}
function fmtDateLong(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" });
}
function fmtPrice(n: number) {
  return n.toLocaleString("fr-FR") + " TND";
}

// ─── Animated mesh gradient background ─────────────────────────────────────────
function MeshGradientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      <div className="absolute -top-[40%] -right-[20%] w-[80vw] h-[80vw] rounded-full opacity-[0.07] dark:opacity-[0.04] blur-[120px] animate-[meshFloat_25s_ease-in-out_infinite]"
        style={{ background: "radial-gradient(circle, #6366f1 0%, #8b5cf6 40%, #0ea5e9 100%)" }} />
      <div className="absolute -bottom-[30%] -left-[20%] w-[70vw] h-[70vw] rounded-full opacity-[0.06] dark:opacity-[0.03] blur-[100px] animate-[meshFloat_20s_ease-in-out_infinite_reverse]"
        style={{ background: "radial-gradient(circle, #7c3aed 0%, #6366f1 50%, #a78bfa 100%)" }} />
      <div className="absolute top-[20%] left-[30%] w-[50vw] h-[50vw] rounded-full opacity-[0.04] dark:opacity-[0.02] blur-[80px] animate-[meshFloat_30s_ease-in-out_infinite_2s]"
        style={{ background: "radial-gradient(circle, #0ea5e9 0%, #8b5cf6 60%, #6366f1 100%)" }} />
      <style>{`
        @keyframes meshFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(5%, -3%) scale(1.05); }
          50% { transform: translate(-3%, 5%) scale(0.95); }
          75% { transform: translate(3%, 2%) scale(1.02); }
        }
      `}</style>
    </div>
  );
}

// ─── Noise texture overlay ──────────────────────────────────────────────────────
function NoiseOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-[5] opacity-[0.015] dark:opacity-[0.03]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "128px 128px",
      }}
    />
  );
}

// ─── Stagger animation wrapper ──────────────────────────────────────────────────
function StaggerItem({ children, index, className = "" }: { children: React.ReactNode; index: number; className?: string }) {
  return (
    <div
      className={`animate-[fadeSlideUp_0.6s_ease-out_both] ${className}`}
      style={{ animationDelay: `${index * 80 + 100}ms` }}
    >
      {children}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Status config ─────────────────────────────────────────────────────────────
function getStatusConfig(status: string) {
  const map: Record<string, { label: string; dot: string; text: string; bg: string; glow: string }> = {
    PENDING:   { label: "En attente",  dot: "bg-amber-400",  text: "text-amber-700 dark:text-amber-300",  bg: "bg-amber-50/80 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-700/40", glow: "shadow-amber-500/20" },
    ACCEPTED:  { label: "Acceptée",    dot: "bg-sky-400",    text: "text-sky-700 dark:text-sky-300",      bg: "bg-sky-50/80 dark:bg-sky-950/40 border-sky-200/60 dark:border-sky-700/40", glow: "shadow-sky-500/20" },
    CONFIRMED: { label: "Confirmée",   dot: "bg-emerald-400",text: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-700/40", glow: "shadow-emerald-500/20" },
    PAID:      { label: "Payée",       dot: "bg-emerald-400",text: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-700/40", glow: "shadow-emerald-500/20" },
    REJECTED:  { label: "Refusée",     dot: "bg-rose-400",    text: "text-rose-700 dark:text-rose-300",      bg: "bg-rose-50/80 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-700/40", glow: "shadow-rose-500/20" },
    CANCELLED: { label: "Annulée",     dot: "bg-slate-400",  text: "text-slate-500 dark:text-slate-400",  bg: "bg-slate-100/80 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/40", glow: "" },
    COMPLETED: { label: "Terminée",    dot: "bg-violet-400", text: "text-violet-700 dark:text-violet-300", bg: "bg-violet-50/80 dark:bg-violet-950/40 border-violet-200/60 dark:border-violet-700/40", glow: "shadow-violet-500/20" },
    DISPUTED:  { label: "En litige",   dot: "bg-orange-400 animate-pulse", text: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50/80 dark:bg-orange-950/40 border-orange-200/60 dark:border-orange-700/40", glow: "shadow-orange-500/20" },
  };
  return map[status] ?? map.PENDING;
}

// ─── Quick stat pill ────────────────────────────────────────────────────────────
function StatPill({ icon, value, label, gradient }: { icon: React.ReactNode; value: number | string; label: string; gradient: string }) {
  return (
    <div className="group relative flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/40 hover:border-indigo-300/60 dark:hover:border-indigo-600/40 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 cursor-default">
      <div className={`w-10 h-10 rounded-xl ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-black text-gray-900 dark:text-white leading-none">{value}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Reservation card (enhanced) ───────────────────────────────────────────────
function ReservationCard({
  res,
  index,
  onPay,
  onCancel,
  onViewDetails,
  onContact,
  onRate,
}: {
  res: any;
  index: number;
  onPay: (r: any) => void;
  onCancel: (id: string) => void;
  onViewDetails: (r: any) => void;
  onContact: (r: any) => void;
  onRate: (r: any) => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const [ownerImgErr, setOwnerImgErr] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const imageUrl = res.listing?.image ? pip(res.listing.image) : null;
  const ownerAvatarUrl = res.owner?.profilePictureUrl ? pipAvatar(res.owner.profilePictureUrl) : null;

  const isPaid = res.paymentStatus === "PAID" || res.isPaid;
  const isPending = res.status === "PENDING";
  const isAccepted = res.status === "ACCEPTED";
  const isConfirmed = res.status === "CONFIRMED";
  const isCompleted = res.status === "COMPLETED";
  const isCancelled = res.status === "CANCELLED";
  const isRejected = res.status === "REJECTED";
  const isPendingPayment = (isAccepted || isConfirmed) && !isPaid;
  const isPaidAndConfirmed = (isConfirmed || isAccepted) && isPaid;
  const statusCfg = getStatusConfig(res.status);

  const nights = res.nights || Math.ceil(
    (new Date(res.checkOut).getTime() - new Date(res.checkIn).getTime()) / 86400000
  );

  // Days until check-in
  const daysUntil = Math.ceil(
    (new Date(res.checkIn).getTime() - Date.now()) / 86400000
  );

  return (
    <StaggerItem index={index}>
      <div
        className={`group relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/50 dark:border-slate-700/50 transition-all duration-500 h-full ${
          isHovered ? "shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-500/5 border-indigo-200/60 dark:border-indigo-700/40 -translate-y-1" : "shadow-sm hover:shadow-xl"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Subtle top accent line */}
        <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent transition-opacity duration-500 ${isHovered ? "opacity-100" : "opacity-0"}`} />

        <div className="flex flex-col sm:flex-row h-full">

          {/* ── Image ── */}
          <div className="sm:w-56 md:w-64 h-56 sm:h-auto relative overflow-hidden bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-950 dark:to-violet-950 flex-shrink-0">
            {imageUrl && !imgErr ? (
              <img
                src={imageUrl}
                alt={res.listing?.title ?? ""}
                className={`w-full h-full object-cover transition-all duration-700 ${isHovered ? "scale-110 brightness-105" : "scale-100"}`}
                onError={() => setImgErr(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-400 via-violet-500 to-purple-600 flex items-center justify-center">
                <IoHomeOutline className="text-white/40 text-6xl" />
              </div>
            )}

            {/* Cinematic overlay on image */}
            <div className={`absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/5 transition-opacity duration-500 ${isHovered ? "opacity-0" : "opacity-100"}`} />

            {/* Status badge - glass morphism */}
            <div className="absolute top-3 left-3">
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border backdrop-blur-xl ${statusCfg.bg} ${statusCfg.text} ${statusCfg.glow} shadow-lg`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
            </div>

            {/* Payment pill */}
            {isPaid && !isPending && !isPendingPayment && (
              <div className="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-sm text-white text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-emerald-500/30">
                <IoShieldCheckmarkOutline className="text-[11px]" /> Payé
              </div>
            )}
            {isPendingPayment && (
              <div className="absolute top-3 right-3 bg-amber-500/90 backdrop-blur-sm text-white text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-amber-500/30 animate-pulse">
                <IoWalletOutline className="text-[11px]" /> Paiement requis
              </div>
            )}

            {/* Countdown badge for upcoming */}
            {daysUntil > 0 && daysUntil <= 30 && !isCancelled && !isRejected && !isCompleted && (
              <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-xl text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <IoTimeOutline className="text-xs" />
                {daysUntil === 1 ? "Demain !" : `Dans ${daysUntil} jours`}
              </div>
            )}
          </div>

          {/* ── Content ── */}
          <div className="flex-1 p-6 flex flex-col justify-between min-w-0">
            <div>
              {/* Top row */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-indigo-400 dark:text-indigo-500">
                      {res.listing?.type ?? "Logement"}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <span className="text-[9px] font-mono font-bold tracking-wider text-slate-300 dark:text-slate-700">
                      #{res.reference?.slice(-6) ?? res.id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-gray-900 dark:text-white line-clamp-1 tracking-tight">
                    {res.listing?.title ?? "Propriété"}
                  </h3>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xl font-black bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent leading-none">
                      {fmtPrice(res.totalPrice)}
                    </p>
                    <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-600 mt-0.5 uppercase tracking-wider">
                      Total
                    </p>
                  </div>
                  {/* 3-dot menu */}
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen((p) => !p)}
                      className="p-2 rounded-xl text-slate-300 dark:text-slate-700 hover:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all"
                    >
                      <IoEllipsisVerticalOutline className="text-base" />
                    </button>
                    {menuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 w-52 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-2xl shadow-black/10 z-50 overflow-hidden p-1.5">
                          {[
                            { icon: <IoShareOutline />, label: "Partager", fn: () => {} },
                            { icon: <IoDocumentTextOutline />, label: "Voir le contrat", fn: () => {} },
                            ...(res.status !== "CANCELLED" && res.status !== "COMPLETED"
                              ? [{ icon: <IoCloseCircleOutline />, label: "Annuler la réservation", fn: () => { onCancel(res.id); setMenuOpen(false); }, danger: true }]
                              : []),
                          ].map(({ icon, label, fn, danger }: any) => (
                            <button
                              key={label}
                              onClick={() => { fn(); setMenuOpen(false); }}
                              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl transition-all ${danger ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80"}`}
                            >
                              <span className="text-base opacity-70">{icon}</span> {label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Details - redesigned with pill layout */}
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 text-sm">
                  <IoCalendarOutline className="text-indigo-500 text-sm flex-shrink-0" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300 text-xs">
                    {fmtDateLong(res.checkIn)}
                  </span>
                  <IoArrowForwardOutline className="text-indigo-300 dark:text-indigo-700 text-[10px]" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300 text-xs">
                    {fmtDateLong(res.checkOut)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50/60 dark:bg-violet-950/30 text-xs text-gray-600 dark:text-gray-400">
                  <IoMoonOutline className="text-violet-500 text-sm" />
                  <span className="font-semibold">{nights} nuit{nights > 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 text-xs text-gray-600 dark:text-gray-400">
                  <IoPeopleOutline className="text-sky-500 text-sm" />
                  <span className="font-semibold">{res.guests} voyageur{(res.guests ?? 1) > 1 ? "s" : ""}</span>
                </div>
              </div>

              {res.listing?.location && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-4">
                  <IoLocationOutline className="text-indigo-400 dark:text-indigo-600 text-sm flex-shrink-0" />
                  <span className="truncate max-w-[280px]">{res.listing.location}</span>
                </div>
              )}

              {/* Price breakdown */}
              {(res.cleaningFee || res.serviceFee) && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  {[
                    `${fmtPrice(res.pricePerNight ?? 0)}/nuit × ${nights}`,
                    res.cleaningFee > 0 ? `+ ${fmtPrice(res.cleaningFee)} ménage` : null,
                    res.serviceFee > 0 ? `+ ${fmtPrice(res.serviceFee)} service` : null,
                  ].filter(Boolean).map((text, i) => (
                    <span key={i} className="text-[10px] font-medium text-slate-400 dark:text-slate-600 px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      {text}
                    </span>
                  ))}
                </div>
              )}

              {/* Host row */}
              {res.owner && (
                <div className="flex items-center gap-2.5 mb-5 p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-800/50">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 via-violet-500 to-purple-500 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 shadow-md shadow-violet-500/20">
                    {ownerAvatarUrl && !ownerImgErr ? (
                      <img src={ownerAvatarUrl} alt="" className="w-full h-full object-cover" onError={() => setOwnerImgErr(true)} />
                    ) : (
                      `${res.owner.firstName?.[0] ?? ""}${res.owner.lastName?.[0] ?? ""}`
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-600">Hôte</span>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-none mt-0.5">
                      {res.owner.firstName} {res.owner.lastName}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── ACTION BUTTONS ── */}

            {/* PENDING */}
            {isPending && (
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => onContact(res)}
                  className="flex-1 min-w-[120px] py-3 rounded-2xl text-sm font-bold bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-all flex items-center justify-center gap-2 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50"
                >
                  <IoChatbubbleOutline className="text-sm" /> Contacter
                </button>
                <button
                  onClick={() => onCancel(res.id)}
                  className="flex-1 min-w-[120px] py-3 rounded-2xl text-sm font-bold bg-rose-50/80 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100/80 dark:hover:bg-rose-950/50 transition-all border border-rose-200/50 dark:border-rose-800/40 backdrop-blur-sm"
                >
                  Annuler
                </button>
              </div>
            )}

            {/* PENDING PAYMENT */}
            {isPendingPayment && (
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => onContact(res)}
                  className="flex-1 min-w-[100px] py-3 rounded-2xl text-sm font-bold bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-all flex items-center justify-center gap-2 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50"
                >
                  <IoChatbubbleOutline className="text-sm" />
                  <span className="hidden xs:inline">Contacter</span>
                </button>
                <button
                  onClick={() => onPay(res)}
                  className="flex-1 min-w-[140px] py-3 rounded-2xl text-sm font-extrabold bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <IoCardOutline className="text-sm" /> Finaliser le paiement
                </button>
              </div>
            )}

            {/* CONFIRMED & PAID */}
            {(isPaidAndConfirmed || (isConfirmed && isPaid)) && (
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => onContact(res)}
                  className="flex-1 min-w-[100px] py-3 rounded-2xl text-sm font-bold bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-all flex items-center justify-center gap-2 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50"
                >
                  <IoChatbubbleOutline className="text-sm" />
                  <span className=" xs:inline">Contacter l'hôte</span>
                </button>
                <button
                  onClick={() => onViewDetails(res)}
                  className="flex-1 min-w-[140px] py-3 rounded-2xl text-sm font-extrabold bg-gradient-to-r from-sky-500 via-blue-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Voir les détails <IoChevronForwardOutline className="text-xs" />
                </button>
              </div>
            )}

            {/* COMPLETED */}
            {isCompleted && (
              <div className="flex gap-2.5">
                {!res.hasReview ? (
                  <button
                    onClick={() => onRate(res)}
                    className="flex-1 relative flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-extrabold bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden"
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_ease-in-out_infinite] -skew-x-12" />
                    <IoStarSharp className="text-base relative z-10" />
                    <span className="relative z-10">Laisser un avis</span>
                    <style>{`
                      @keyframes shimmer {
                        0% { transform: translateX(-200%) skewX(-12deg); }
                        100% { transform: translateX(200%) skewX(-12deg); }
                      }
                    `}</style>
                  </button>
                ) : (
                  <div className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-700/40 backdrop-blur-sm">
                    <IoCheckmarkCircleOutline className="text-emerald-500 text-base" />
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      Avis donné
                    </span>
                  </div>
                )}

                <button
                  onClick={() => onViewDetails(res)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-extrabold bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Voir le bilan
                  <IoArrowForwardOutline className="text-sm" />
                </button>
              </div>
            )}

            {/* CANCELLED/REJECTED */}
            {(isCancelled || isRejected) && (
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => onViewDetails(res)}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-all backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50"
                >
                  Voir la propriété
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </StaggerItem>
  );
}

// ─── Skeleton card (enhanced) ──────────────────────────────────────────────────
function SkeletonCard({ index }: { index: number }) {
  return (
    <div
      className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/30 dark:border-slate-800/30 h-full animate-[fadeIn_0.4s_ease-out_both]"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex flex-col sm:flex-row h-full">
        <div className="sm:w-56 h-56 sm:h-auto relative overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-950/50 dark:to-violet-950/50 animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-white/5 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite] -skew-x-12" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          <div className="flex gap-2">
            <div className="h-2 bg-indigo-100 dark:bg-indigo-950/50 rounded-full w-16 animate-pulse" />
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full w-12 animate-pulse" />
          </div>
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-xl w-3/4 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl w-44 animate-pulse" />
            <div className="h-8 bg-violet-50 dark:bg-violet-950/30 rounded-xl w-20 animate-pulse" />
          </div>
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-1/2 animate-pulse" />
          <div className="flex gap-2.5 pt-4">
            <div className="flex-1 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
            <div className="flex-1 h-12 bg-gradient-to-r from-indigo-100 to-violet-100 dark:from-indigo-950/50 dark:to-violet-950/50 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Explore aside card (enhanced) ─────────────────────────────────────────────
function ExploreAside({ counts }: { counts: { upcoming: number; past: number; cancelled: number } }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div className="sticky top-24 space-y-5">
      {/* CTA card */}
      <div className="relative rounded-3xl overflow-hidden border border-white/50 dark:border-slate-700/50 shadow-xl">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-purple-500 to-purple-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />

        <div className="relative p-7 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-5 rotate-6 hover:rotate-0 transition-transform duration-500">
            <IoAirplaneOutline className="text-white text-3xl -rotate-45" />
          </div>
          <h3 className="text-xl font-extrabold text-white mb-2 tracking-tight">
            Envie d'évasion ?
          </h3>
          <p className="text-sm text-white/70 mb-6 leading-relaxed">
            Explorez de nouvelles destinations et réservez votre prochain séjour exceptionnel.
          </p>
          <Link href="/fr/search">
            <button className="w-full px-6 py-3 rounded-2xl bg-white text-indigo-600 font-extrabold text-sm hover:bg-white/90 active:scale-[0.98] transition-all shadow-lg shadow-black/10">
              Trouver un bien
            </button>
          </Link>
        </div>
      </div>

    

      {/* Help card */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-slate-700/50 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-sky-950/50 dark:to-indigo-950/50 flex items-center justify-center">
            <IoChatbubblesOutline className="text-indigo-500 text-sm" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Besoin d'aide ?</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-600">Disponible 24h/7j</p>
          </div>
        </div>
        <Link href="/fr/help" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 group">
          Centre d'aide <IoChevronForwardOutline className="text-[10px] group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

// ─── Bento recommendations (enhanced) ──────────────────────────────────────────
function BentoGrid({ recommendations }: { recommendations: any[] }) {
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [favs, setFavs] = useState<Set<string>>(new Set());

  const getImg = (l: any) => {
    const p = l.photos?.find((x: any) => x.isMain) ?? l.photos?.[0];
    if (p?.url) return pip(p.url);
    if (l.image) return pip(l.image);
    return null;
  };

  if (recommendations.length < 3) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 gap-5 h-auto lg:h-[580px]">
      {/* Main large card */}
      <Link
        href={`/fr/listings/${recommendations[0].id}`}
        className="sm:col-span-2 lg:col-span-2 lg:row-span-2 rounded-3xl overflow-hidden relative group cursor-pointer block shadow-xl shadow-indigo-500/5"
      >
        <div className="w-full h-72 sm:h-full min-h-[280px]">
          {getImg(recommendations[0]) && !errors.has(recommendations[0].id) ? (
            <img
              src={getImg(recommendations[0])!}
              alt={recommendations[0].title}
              className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110"
              onError={() => setErrors((p) => new Set([...p, recommendations[0].id]))}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-400 via-violet-500 to-purple-600 flex items-center justify-center">
              <IoHomeOutline className="text-white/30 text-7xl" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          {/* Favorite button */}
          <button
            onClick={(e) => { e.preventDefault(); setFavs((p) => { const n = new Set(p); n.has(recommendations[0].id) ? n.delete(recommendations[0].id) : n.add(recommendations[0].id); return n; }); }}
            className="absolute top-5 right-5 w-10 h-10 rounded-2xl bg-black/20 backdrop-blur-xl flex items-center justify-center hover:bg-black/40 transition-all hover:scale-110"
          >
            {favs.has(recommendations[0].id) ? <IoHeartSharp className="text-rose-400 text-lg" /> : <IoHeartOutline className="text-white text-lg" />}
          </button>
          {/* Label */}
          <div className="absolute top-5 left-5">
            <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-lg shadow-violet-500/30 flex items-center gap-1.5">
              <IoSparklesOutline className="text-xs" /> Tendance
            </span>
          </div>
          <div className="absolute bottom-6 left-6 right-6">
            <h3 className="text-3xl font-extrabold text-white mt-1 line-clamp-1 tracking-tight">{recommendations[0].title}</h3>
            <p className="text-white/60 text-sm font-medium mt-1">{recommendations[0].location ?? `${recommendations[0].delegation}, ${recommendations[0].governorate}`}</p>
            <div className="flex items-baseline gap-1.5 mt-3">
              <span className="text-white font-black text-2xl">{recommendations[0].pricePerNight ?? 250} TND</span>
              <span className="text-white/50 text-sm">/nuit</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Small cards */}
      {recommendations.slice(1, 3).map((rec, idx) => (
        <Link key={rec.id} href={`/fr/listings/${rec.id}`} className="rounded-3xl overflow-hidden relative group cursor-pointer block shadow-lg shadow-indigo-500/5">
          <div className="w-full h-60 lg:h-full min-h-[240px]">
            {getImg(rec) && !errors.has(rec.id) ? (
              <img
                src={getImg(rec)!}
                alt={rec.title}
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                onError={() => setErrors((p) => new Set([...p, rec.id]))}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-400 via-violet-500 to-purple-600 flex items-center justify-center">
                <IoHomeOutline className="text-white/30 text-5xl" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <button
              onClick={(e) => { e.preventDefault(); setFavs((p) => { const n = new Set(p); n.has(rec.id) ? n.delete(rec.id) : n.add(rec.id); return n; }); }}
              className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-black/20 backdrop-blur-xl flex items-center justify-center hover:bg-black/40 transition-all hover:scale-110"
            >
              {favs.has(rec.id) ? <IoHeartSharp className="text-rose-400 text-sm" /> : <IoHeartOutline className="text-white text-sm" />}
            </button>
            <div className="absolute bottom-5 left-5 right-5">
              <h3 className="text-lg font-extrabold text-white line-clamp-1 tracking-tight">{rec.title}</h3>
              <p className="text-white/50 text-xs font-medium mt-0.5">{rec.location ?? `${rec.delegation}, ${rec.governorate}`}</p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-white font-black text-lg">{rec.pricePerNight ?? 200} TND</span>
                <span className="text-white/40 text-xs">/nuit</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Tab button component ───────────────────────────────────────────────────────
function TabButton({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 ${
        active
          ? "bg-gradient-to-r from-sky-500 via-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25"
          : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`text-[10px] min-w-[20px] h-5 px-1.5 rounded-full font-black flex items-center justify-center ${
          active ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function TenantReservationsPage() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<"UPCOMING" | "PAST" | "CANCELLED">("UPCOMING");
  const [allReservations, setAllReservations] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "price">("date");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<any | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const showToastMessage = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings?role=tenant&status=ALL&pageSize=50");
      if (!res.ok) throw new Error();
      const data = await res.json();
      const raw: any[] = Array.isArray(data) ? data : (data.bookings ?? []);
      const processed = raw.map((r) => ({
        ...r,
        isPaid: r.paymentStatus === "PAID" || r.status === "CONFIRMED",
        nights: r.nights ?? Math.ceil((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 86400000),
        hasReview: r.review?.rating !== undefined && r.review?.rating !== null,
      }));
      setAllReservations(processed);
    } catch {
      showToastMessage("Erreur lors du chargement", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRecommendations = useCallback(async () => {
    setRecLoading(true);
    try {
      const res = await fetch("/api/listings?featured=true&limit=4");
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.listings ?? []);
      }
    } catch {/* silent */} finally {
      setRecLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    loadRecommendations();
  }, [loadAll, loadRecommendations]);

  const handlePay = (res: any) => {
    const params = new URLSearchParams({ bookingId: res.id, ...(res.offerId ? { offerId: res.offerId } : {}) });
    router.push(`/fr/payment?${params}`);
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Confirmer l'annulation de cette réservation ?")) return;
    setCancellingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, { method: "POST" });
      if (res.ok) {
        showToastMessage("Réservation annulée");
        setAllReservations((p) => p.map((b) => b.id === id ? { ...b, status: "CANCELLED" } : b));
      } else {
        const err = await res.json();
        showToastMessage(err.error ?? "Erreur d'annulation", "error");
      }
    } catch {
      showToastMessage("Erreur de connexion", "error");
    } finally {
      setCancellingId(null);
    }
  };

  const handleSubmitReview = async (reviewData: any) => {
    if (!selectedBookingForReview) return;

    try {
      const formData = new FormData();
      formData.append("rating", reviewData.rating.toString());
      formData.append("publicComment", reviewData.publicComment);
      formData.append("privateNote", reviewData.privateNote);
      formData.append("criteria", JSON.stringify(reviewData.criteria));

      reviewData.photos.forEach((photo: File) => {
        formData.append("photos", photo);
      });

      const res = await fetch(`/api/bookings/${selectedBookingForReview.id}/review`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        showToastMessage("Merci pour votre avis !", "success");
        setAllReservations((prev) =>
          prev.map((b) =>
            b.id === selectedBookingForReview.id ? { ...b, hasReview: true } : b
          )
        );
        setSelectedBookingForReview(null);
      } else {
        const error = await res.json();
        showToastMessage(error.error || "Erreur lors de l'envoi", "error");
      }
    } catch {
      showToastMessage("Erreur de connexion", "error");
    }
  };

  const handleViewDetails = (res: any) => router.push(`/fr/reservations/${res.id}`);
  const handleContact = (res: any) => {
    if (res.conversationId) router.push(`/fr/messages?conversation=${res.conversationId}`);
    else router.push(`/fr/messages?listingId=${res.listing?.id}&ownerId=${res.owner?.id}`);
  };
  const handleRate = (res: any) => setSelectedBookingForReview(res);

  // Filter & sort
  const filteredAll = allReservations.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        r.listing?.title?.toLowerCase().includes(q) ||
        r.listing?.location?.toLowerCase().includes(q) ||
        r.reference?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const upcoming = filteredAll.filter((r) => ["PENDING", "ACCEPTED", "CONFIRMED", "PAID"].includes(r.status));
  const past = filteredAll.filter((r) => r.status === "COMPLETED");
  const cancelled = filteredAll.filter((r) => ["CANCELLED", "REJECTED"].includes(r.status));

  const sortFn = (a: any, b: any) =>
    sortBy === "price"
      ? b.totalPrice - a.totalPrice
      : new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime();

  const displayed =
    tab === "UPCOMING" ? [...upcoming].sort(sortFn) :
    tab === "PAST" ? [...past].sort(sortFn) :
    [...cancelled].sort(sortFn);

  const counts = { upcoming: upcoming.length, past: past.length, cancelled: cancelled.length };
  const isDark = mounted && resolvedTheme === "dark";

  const totalSpent = useMemo(() => 
    allReservations.filter(r => r.status === "COMPLETED" || r.status === "CONFIRMED").reduce((sum, r) => sum + (r.totalPrice || 0), 0),
    [allReservations]
  );

  const TABS = [
    { key: "UPCOMING" as const, label: "À venir", count: counts.upcoming },
    { key: "PAST" as const, label: "Terminées", count: counts.past },
    { key: "CANCELLED" as const, label: "Annulées", count: counts.cancelled },
  ];

  return (
    <div className="min-h-screen bg-[#f6f5ff] dark:bg-[#0a0a1a] text-gray-900 dark:text-gray-100 transition-colors duration-500">
      <MeshGradientBackground />
      <NoiseOverlay />
      <TenantHeader />

      {/* ── Toast (enhanced) ── */}
      {toast && (
        <div className={`fixed top-20 right-4 z-[80] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-bold text-white backdrop-blur-xl border border-white/10 animate-[slideIn_0.3s_ease-out] ${
          toast.type === "error" ? "bg-rose-500/90 shadow-rose-500/20" : toast.type === "info" ? "bg-indigo-500/90 shadow-indigo-500/20" : "bg-emerald-500/90 shadow-emerald-500/20"
        }`}>
          {toast.type === "error" ? <IoAlertCircleOutline className="text-lg" /> : <IoCheckmarkCircleOutline className="text-lg" />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-1 opacity-70 hover:opacity-100 transition-opacity">
            <IoCloseOutline className="text-sm" />
          </button>
          <style>{`
            @keyframes slideIn {
              from { opacity: 0; transform: translateX(20px) scale(0.95); }
              to { opacity: 1; transform: translateX(0) scale(1); }
            }
          `}</style>
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={!!selectedBookingForReview}
        onClose={() => setSelectedBookingForReview(null)}
        onSubmit={handleSubmitReview}
        booking={selectedBookingForReview}
      />

      <main className="pt-8 pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Hero Header ── */}
        <div className="mb-10 animate-[fadeSlideUp_0.6s_ease-out_both]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
            <div>
              
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 dark:text-white leading-[1.1]">
                Mes{" "}
                <span className="bg-gradient-to-r from-sky-500 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                  Réservations
                </span>
              </h1>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-2 font-medium max-w-md">
                Gérez et suivez tous vos séjours en un seul endroit. Votre prochaine aventure n'attend que vous.
              </p>
            </div>
          </div>

          {/* Quick stats row */}
          {!loading && allReservations.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 animate-[fadeSlideUp_0.6s_ease-out_both_200ms]">
              <StatPill
                icon={<IoCalendarOutline className="text-white text-base" />}
                value={counts.upcoming}
                label="À venir"
                gradient="bg-gradient-to-br from-sky-400 to-indigo-500 shadow-indigo-500/30"
              />
              <StatPill
                icon={<IoCheckmarkCircleOutline className="text-white text-base" />}
                value={counts.past}
                label="Terminées"
                gradient="bg-gradient-to-br from-violet-400 to-purple-500 shadow-purple-500/30"
              />
              <StatPill
                icon={<IoWalletOutline className="text-white text-base" />}
                value={fmtPrice(totalSpent)}
                label="Total dépensé"
                gradient="bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/30"
              />
              <StatPill
                icon={<IoTrendingUpOutline className="text-white text-base" />}
                value={allReservations.length}
                label="Total"
                gradient="bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/30"
              />
            </div>
          )}
        </div>

        {/* ── Search + sort ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-[fadeSlideUp_0.6s_ease-out_both_300ms]">
          <div className={`relative flex-1 transition-all duration-300 ${searchFocused ? "scale-[1.01]" : ""}`}>
            <IoSearchOutline className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm transition-colors ${searchFocused ? "text-indigo-500" : "text-slate-400"}`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Rechercher une réservation..."
              className={`w-full pl-10 pr-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border rounded-2xl text-sm outline-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 font-medium ${
                searchFocused
                  ? "border-indigo-300 dark:border-indigo-600 ring-4 ring-indigo-500/10 shadow-lg shadow-indigo-500/5"
                  : "border-white/50 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-800"
              }`}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <IoCloseOutline className="text-sm text-slate-400" />
              </button>
            )}
          </div>
          <div className="relative">
            <IoFunnelOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "price")}
              className="w-full sm:w-auto pl-9 pr-8 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 dark:focus:border-indigo-600 text-slate-700 dark:text-slate-300 appearance-none cursor-pointer transition-all font-medium hover:border-indigo-200 dark:hover:border-indigo-800"
            >
              <option value="date">Trier par date</option>
              <option value="price">Trier par prix</option>
            </select>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1.5 mb-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/50 dark:border-slate-700/50 w-fit animate-[fadeSlideUp_0.6s_ease-out_both_400ms]">
          {TABS.map(({ key, label, count }) => (
            <TabButton
              key={key}
              active={tab === key}
              label={label}
              count={count}
              onClick={() => setTab(key)}
            />
          ))}
        </div>

        {/* ── Main layout ── */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Reservations list ── */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="space-y-5">
                {[...Array(3)].map((_, i) => <SkeletonCard key={i} index={i} />)}
              </div>
            ) : displayed.length === 0 ? (
              <StaggerItem index={0}>
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border-2 border-dashed border-slate-200/60 dark:border-slate-700/40">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-950/50 dark:to-violet-950/50 flex items-center justify-center mb-5 rotate-6">
                    <IoCalendarOutline className="text-indigo-400 dark:text-indigo-600 text-4xl" />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-700 dark:text-slate-300 mb-2">
                    {tab === "UPCOMING" ? "Aucune réservation à venir" : tab === "PAST" ? "Aucun séjour passé" : "Aucune réservation annulée"}
                  </h3>
                  <p className="text-slate-400 dark:text-slate-600 text-sm max-w-sm leading-relaxed">
                    {tab === "UPCOMING" ? "Explorez nos propriétés d'exception et réservez votre prochain séjour inoubliable." : "Votre historique de voyages apparaîtra ici une fois vos séjours terminés."}
                  </p>
                  {tab === "UPCOMING" && (
                    <Link href="/fr/search">
                      <button className="mt-6 px-8 py-3 rounded-2xl text-sm font-extrabold bg-gradient-to-r from-sky-300 via-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
                        Explorer les propriétés
                      </button>
                    </Link>
                  )}
                </div>
              </StaggerItem>
            ) : (
              <div className="space-y-5">
                {displayed.map((r, i) => (
                  <ReservationCard
                    key={r.id}
                    res={r}
                    index={i}
                    onPay={handlePay}
                    onCancel={handleCancel}
                    onViewDetails={handleViewDetails}
                    onContact={handleContact}
                    onRate={handleRate}
                  />
                ))}
                <div className="flex items-center justify-center gap-2 py-4 animate-[fadeSlideUp_0.6s_ease-out_both]" style={{ animationDelay: `${displayed.length * 80 + 200}ms` }}>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-slate-800" />
                  <p className="text-xs text-slate-400 dark:text-slate-600 font-semibold px-3">
                    {displayed.length} réservation{displayed.length > 1 ? "s" : ""} affichée{displayed.length > 1 ? "s" : ""}
                  </p>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-slate-800" />
                </div>
              </div>
            )}
          </div>

          {/* ── Aside ── */}
          <div className="lg:w-72 xl:w-80 flex-shrink-0 animate-[fadeSlideUp_0.6s_ease-out_both_500ms]">
            <ExploreAside counts={counts} />
          </div>
        </div>

        {/* ── Bento recommendations ── */}
        {!recLoading && recommendations.length >= 3 && (
          <section className="mt-20">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-violet-500 dark:text-violet-400">
                    Recommandations
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                  Inspirations pour votre{" "}
                  <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                    prochain voyage
                  </span>
                </h2>
                <p className="text-slate-400 dark:text-slate-600 text-sm mt-2 font-medium">
                  Sélection exclusive de propriétés d'exception
                </p>
              </div>
              <Link href="/fr/search" className="hidden sm:flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 font-bold hover:gap-2.5 transition-all group">
                Tout voir <IoArrowForwardOutline className="text-xs group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <BentoGrid recommendations={recommendations} />
          </section>
        )}
      </main>

      {/* ── Mobile bottom nav (enhanced) ── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-t border-white/50 dark:border-slate-700/50 px-6 py-3 flex justify-between items-center">
          {[
            { href: "/fr/search", icon: <IoCompassOutline className="text-xl" />, label: "Explorer" },
            { href: "/fr/reservations", icon: <IoCalendarOutline className="text-xl" />, label: "Voyages", active: true },
            { href: "/fr/messages", icon: <IoChatbubblesOutline className="text-xl" />, label: "Messages" },
            { href: "/fr/profile", icon: <IoPersonCircleOutline className="text-xl" />, label: "Profil" },
          ].map(({ href, icon, label, active }) => (
            <Link key={label} href={href} className="relative flex flex-col items-center gap-0.5 transition-all">
              <div className={`p-1.5 rounded-xl transition-all ${active ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50" : "text-slate-400 dark:text-slate-600 hover:text-indigo-500"}`}>
                {icon}
              </div>
              <span className={`text-[9px] font-extrabold uppercase tracking-wider ${active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-600"}`}>
                {label}
              </span>
              {active && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500" />
              )}
            </Link>
          ))}
        </div>
        {/* Safe area spacer for iOS */}
        <div className="bg-white/80 dark:bg-slate-900/80 h-[env(safe-area-inset-bottom)]" />
      </div>

      {/* Global animation styles */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}