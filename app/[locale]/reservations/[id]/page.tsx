// app/[locale]/dashboard/tenant/bookings/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  IoArrowBackOutline, IoLocationOutline, IoKeyOutline, IoCopyOutline,
  IoCheckmarkCircleOutline, IoDocumentTextOutline, IoDownloadOutline,
  IoChatbubbleOutline, IoShieldCheckmarkOutline, IoPersonOutline,
  IoCallOutline, IoStarSharp, IoTimeOutline, IoReceiptOutline,
  IoAlertCircleOutline, IoHomeOutline, IoNavigateOutline, IoChevronForwardOutline,
  IoInformationCircleOutline, IoCalendarNumberOutline, IoPeopleOutline,
  IoMapOutline, IoMoonOutline, IoVolumeMuteOutline, IoBanOutline,
  IoPawOutline, IoMusicalNotesOutline, IoLogInOutline, IoLogOutOutline,
  IoWalletOutline, IoLockClosedOutline, IoCloseOutline, IoShareOutline,
  IoHeartOutline, IoHeartSharp, IoPhonePortraitOutline, IoSparklesOutline,
} from "react-icons/io5";
import { TenantHeader } from "@/components/ui/header/TenantHeader";
import TenantCancelModal from "@/components/ui/bookings/TenantCancelModal";

const MapPickerWrapper = dynamic(
  () => import("@/components/ui/maps/MapPickerWrapper"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-200 dark:border-indigo-800 border-t-indigo-500 animate-spin" />
      </div>
    ),
  }
);

const ReviewModal = dynamic(
  () => import("@/components/ui/modals/ReviewModal").then((m) => m.ReviewModal),
  { ssr: false }
);
const ExtendBookingModal = dynamic(
  () => import("@/components/ui/bookings/ExtendendBookingModal"),
  { ssr: false }
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pip = (u: string) => `/api/listings/image?url=${encodeURIComponent(u)}`;
const pipA = (u: string) => `/api/users/avatar?url=${encodeURIComponent(u)}`;

const fmtDate = (d: string) => !d ? "—" : new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const fmtDay  = (d: string) => !d ? "" : new Date(d).toLocaleDateString("fr-FR", { weekday: "long" });
const fmtPrice = (n: number) => n.toLocaleString("fr-FR") + " TND";

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000); }}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 border ${
        ok ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40"
           : "bg-white/60 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800/40"
      }`}
    >
      {ok ? <><IoCheckmarkCircleOutline /> Copié !</> : <><IoCopyOutline /> Copier</>}
    </button>
  );
}

function getStatus(s: string) {
  const m: Record<string, any> = {
    COMPLETED: { label: "Terminé",    dot: "bg-violet-500",  text: "text-violet-700 dark:text-violet-300",  bg: "bg-violet-50/80 dark:bg-violet-900/20 border-violet-200/60 dark:border-violet-800/40" },
    CONFIRMED: { label: "Confirmé",   dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200/60 dark:border-emerald-800/40" },
    ACCEPTED:  { label: "Accepté",    dot: "bg-sky-500",     text: "text-sky-700 dark:text-sky-300",         bg: "bg-sky-50/80 dark:bg-sky-900/20 border-sky-200/60 dark:border-sky-800/40" },
    PAID:      { label: "Payé",       dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200/60 dark:border-emerald-800/40" },
    PENDING:   { label: "En attente", dot: "bg-amber-500 animate-pulse", text: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50/80 dark:bg-amber-900/20 border-amber-200/60 dark:border-amber-800/40" },
    CANCELLED: { label: "Annulé",     dot: "bg-rose-500",    text: "text-rose-700 dark:text-rose-300",       bg: "bg-rose-50/80 dark:bg-rose-900/20 border-rose-200/60 dark:border-rose-800/40" },
  };
  return m[s] ?? m.PENDING;
}

function getRules(r?: Record<string, boolean | string> | null) {
  return [
    { icon: <IoBanOutline />, label: "Non Fumeur", show: r ? r.noSmoking !== false : true },
    { icon: <IoPawOutline />, label: "Animaux admis", show: r ? r.petsAllowed === true : true },
    { icon: <IoMusicalNotesOutline />, label: "Pas de fêtes", show: r ? r.noParties !== false : true },
    { icon: <IoVolumeMuteOutline />, label: r?.quietHours ? `Silence ${r.quietHours}` : "Silence 22h–08h", show: true },
  ].filter(x => x.show);
}

interface BookingDetails {
  id: string; reference: string; status: string;
  checkIn: string; checkOut: string; nights: number; guests: number;
  totalPrice: number; pricePerNight: number; cleaningFee?: number; serviceFee?: number;
  listing: {
    id: string; title: string; type: string;
    governorate: string; delegation: string; street?: string;
    latitude?: number; longitude?: number;
    photos: { url: string; isMain: boolean }[];
    houseRules?: Record<string, boolean | string> | null;
  };
  owner: {
    id: string; firstName: string; lastName: string;
    profilePictureUrl?: string;
    stats?: { averageRating: number; totalReviews: number };
  };
  revealedInfo?: { accessCode?: string; checkinInstructions?: string; exactAddress?: string; ownerPhone?: string };
  contract?: { pdfUrl: string };
  hasReview?: boolean; conversationId?: string;
}

// ─── Glass card ───────────────────────────────────────────────────────────────
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-gray-800 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/20 flex-shrink-0">
        <span className="text-white text-base">{icon}</span>
      </div>
      <div>
        <h2 className="text-sm font-extrabold text-gray-900 dark:text-white leading-tight">{title}</h2>
        {sub && <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{sub}</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function TenantBookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [imgErr, setImgErr] = useState(false);
  const [avatarErr, setAvatarErr] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [saved, setSaved] = useState(false);

  const toast$ = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/bookings/${id}`);
      if (!r.ok) throw 0;
      const d = await r.json();
      if (!d.nights && d.checkIn && d.checkOut)
        d.nights = Math.ceil((+new Date(d.checkOut) - +new Date(d.checkIn)) / 864e5);
      setBooking(d);
      if (d.listing?.id) {
        const lr = await fetch(`/api/listings/${d.listing.id}`);
        if (lr.ok) { const ld = await lr.json(); if (ld.latitude && ld.longitude) setCoords({ lat: ld.latitude, lng: ld.longitude }); }
      }
    } catch { setBooking(null); } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const submitReview = async (data: any) => {
    if (!booking) return;
    try {
      const fd = new FormData();
      fd.append("bookingId", booking.id); fd.append("rating", data.rating.toString());
      fd.append("criteria", JSON.stringify(data.criteria)); fd.append("publicComment", data.publicComment);
      fd.append("privateNote", data.privateNote || "");
      data.photos?.forEach((p: File, i: number) => fd.append(`photo_${i}`, p));
      const r = await fetch("/api/reviews", { method: "POST", body: fd });
      if (r.ok) { toast$("Merci pour votre avis !"); setReviewOpen(false); load(); }
      else { const e = await r.json(); toast$(e.error || "Erreur", false); }
    } catch { toast$("Erreur de connexion", false); }
  };

  const doCancel = async (reason: string, notes: string) => {
    try {
      const r = await fetch(`/api/bookings/${booking?.id}/cancel`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, message: notes }),
      });
      const d = await r.json();
      if (r.ok) { toast$(d.message || "Annulée"); setCancelOpen(false); load(); }
      else toast$(d.error || "Erreur", false);
    } catch { toast$("Erreur de connexion", false); }
  };

  const doExtendSuccess = async () => { setExtendOpen(false); await load(); toast$("Demande de prolongation envoyée !"); };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#f6f5ff] dark:bg-[#0a0a1a]">
      <TenantHeader />
      <div className="max-w-6xl mx-auto px-5 pt-8 pb-20 space-y-5 animate-pulse">
        <div className="h-6 w-32 rounded-xl bg-gray-200 dark:bg-gray-800" />
        <div className="h-80 rounded-3xl bg-gray-200 dark:bg-gray-800" />
        <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl bg-gray-200 dark:bg-gray-800" />)}</div>
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-4">{[260,200,180].map((h,i) => <div key={i} className="rounded-2xl bg-gray-200 dark:bg-gray-800" style={{height:h}} />)}</div>
          <div className="space-y-4">{[300,220,160].map((h,i) => <div key={i} className="rounded-2xl bg-gray-200 dark:bg-gray-800" style={{height:h}} />)}</div>
        </div>
      </div>
    </div>
  );

  // ─── 404 ──────────────────────────────────────────────────────────────────
  if (!booking) return (
    <div className="min-h-screen bg-[#f6f5ff] dark:bg-[#0a0a1a] flex flex-col">
      <TenantHeader />
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center"><IoAlertCircleOutline className="text-rose-500 text-3xl" /></div>
        <p className="text-lg font-bold text-gray-900 dark:text-white">Réservation introuvable</p>
        <button onClick={() => router.push("/fr/reservations")} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">Retour</button>
      </div>
    </div>
  );

  // ─── Derived ──────────────────────────────────────────────────────────────
  const st = getStatus(booking.status);
  const isCompleted = booking.status === "COMPLETED";
  const isConfirmed = ["CONFIRMED","ACCEPTED","PAID"].includes(booking.status);
  const isCancelled = booking.status === "CANCELLED";
  const future = new Date(booking.checkOut) > new Date();
  const daysUntil = Math.ceil((+new Date(booking.checkIn) - Date.now()) / 864e5);
  const loc = [booking.listing.street, booking.listing.delegation, booking.listing.governorate].filter(Boolean).join(", ");
  const photo = booking.listing.photos.find(p => p.isMain) ?? booking.listing.photos[0];
  const ownerName = `${booking.owner.firstName} ${booking.owner.lastName}`;
  const rules = getRules(booking.listing.houseRules);
  const nightsTotal = booking.pricePerNight * booking.nights;
  const stayStarted = Date.now() >= new Date(booking.checkIn).getTime();
  const stayProgress = stayStarted && !isCompleted && !isCancelled
    ? Math.min(100, Math.max(0, ((Date.now() - +new Date(booking.checkIn)) / (+new Date(booking.checkOut) - +new Date(booking.checkIn))) * 100))
    : null;

  return (
    <div className="min-h-screen bg-[#f6f5ff] dark:bg-[#0a0a1a] text-gray-900 dark:text-white transition-colors">
      {/* Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-[40%] -right-[20%] w-[80vw] h-[80vw] rounded-full opacity-[0.07] dark:opacity-[0.04] blur-[120px]"
          style={{ background: "radial-gradient(circle,#6366f1,#8b5cf6 40%,#0ea5e9)" }} />
        <div className="absolute -bottom-[30%] -left-[20%] w-[70vw] h-[70vw] rounded-full opacity-[0.06] dark:opacity-[0.03] blur-[100px]"
          style={{ background: "radial-gradient(circle,#7c3aed,#6366f1 50%,#a78bfa)" }} />
      </div>

      <TenantHeader />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-[90] flex items-center gap-2.5 pl-4 pr-3 py-3 rounded-2xl text-sm font-bold shadow-xl border backdrop-blur-sm ${
          toast.ok ? "bg-emerald-50/90 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shadow-emerald-500/10"
                   : "bg-rose-50/90 dark:bg-rose-900/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 shadow-rose-500/10"
        }`}>
          {toast.ok ? <IoCheckmarkCircleOutline className="text-lg" /> : <IoAlertCircleOutline className="text-lg" />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-1 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><IoCloseOutline className="text-sm" /></button>
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .fu{animation:fadeUp .5s cubic-bezier(.22,1,.36,1) both}
        .d1{animation-delay:.06s}.d2{animation-delay:.12s}.d3{animation-delay:.18s}
        .d4{animation-delay:.24s}.d5{animation-delay:.3s}.d6{animation-delay:.36s}.d7{animation-delay:.42s}
      `}</style>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-28">

        {/* ── Back ── */}
        <button onClick={() => router.push("/fr/reservations")}
          className="group flex items-center gap-2 text-sm font-semibold text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-6 fu">
          <div className="w-8 h-8 rounded-xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/50 dark:border-gray-800 flex items-center justify-center group-hover:border-indigo-300 dark:group-hover:border-indigo-700 transition-colors shadow-sm">
            <IoArrowBackOutline className="text-sm" />
          </div>
          Mes réservations
        </button>

        {/* ══════════════════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════════════════ */}
        <div className="relative rounded-3xl overflow-hidden mb-7 fu d1 shadow-2xl shadow-indigo-500/10 dark:shadow-black/30">
          {/* Image */}
          <div className="aspect-[21/9] sm:aspect-[3/1] w-full">
            {photo && !imgErr ? (
              <img src={pip(photo.url)} alt={booking.listing.title}
                className="w-full h-full object-cover transition-transform duration-[2s] hover:scale-[1.03]"
                onError={() => setImgErr(true)} />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-300 via-violet-400 to-purple-500 dark:from-indigo-900 dark:via-violet-900 dark:to-purple-900 flex items-center justify-center">
                <IoHomeOutline className="text-7xl text-white/20" />
              </div>
            )}
          </div>

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/5" />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/50 via-transparent to-transparent" />

          {/* Top actions */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={() => setSaved(!saved)}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 flex items-center justify-center transition-all active:scale-95">
              {saved ? <IoHeartSharp className="text-rose-400" /> : <IoHeartOutline className="text-white" />}
            </button>
            <button className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 flex items-center justify-center transition-all active:scale-95">
              <IoShareOutline className="text-white" />
            </button>
          </div>

          {/* Bottom content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            {/* Chips */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.15em] px-3 py-1.5 rounded-full border backdrop-blur-xl ${st.bg} ${st.text}`}>
                <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                {st.label}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                {booking.listing.type}
              </span>
              <span className="text-[10px] font-mono font-bold text-white/30 tracking-wider">#{booking.reference}</span>
              {daysUntil > 0 && daysUntil <= 60 && !isCompleted && !isCancelled && (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-amber-400/20 flex items-center gap-1.5 animate-pulse">
                  <IoTimeOutline /> {daysUntil === 1 ? "Demain !" : `J-${daysUntil}`}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-2 leading-tight">{booking.listing.title}</h1>
            <div className="flex items-center gap-1.5 text-white/55 text-sm">
              <IoLocationOutline className="flex-shrink-0" />
              <span className="truncate">{loc || `${booking.listing.delegation}, ${booking.listing.governorate}`}</span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            STAY PROGRESS
        ══════════════════════════════════════════════════════════════════ */}
        {stayProgress !== null && (
          <GlassCard className="p-4 mb-6 fu d1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Séjour en cours</span>
              </div>
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500">{Math.round(stayProgress)}% écoulé</span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-full transition-all duration-1000"
                style={{ width: `${stayProgress}%` }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-gray-400 dark:text-gray-500">{fmtDate(booking.checkIn)}</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">{fmtDate(booking.checkOut)}</span>
            </div>
          </GlassCard>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ACTIONS
        ══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-wrap gap-2.5 mb-7 fu d2">
          {isCompleted && !booking.hasReview && (
            <button onClick={() => setReviewOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 active:scale-[.97] transition-all">
              <IoStarSharp /> Laisser un avis
            </button>
          )}
          {isCompleted && booking.hasReview && (
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 backdrop-blur-sm">
              <IoCheckmarkCircleOutline /> Avis publié
            </div>
          )}
          {isConfirmed && future && (
            <button onClick={() => setExtendOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/25 hover:scale-[1.02] active:scale-[.97] transition-all">
              <IoCalendarNumberOutline /> Prolonger
            </button>
          )}
          {isConfirmed && future && (
            <button onClick={() => setCancelOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-800/40 backdrop-blur-sm hover:bg-rose-100 dark:hover:bg-rose-900/30 active:scale-[.97] transition-all">
              Annuler
            </button>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            DATE STRIP
        ══════════════════════════════════════════════════════════════════ */}
        <GlassCard className="p-5 mb-7 fu d2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50/80 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-800/30 flex items-center justify-center flex-shrink-0">
                <IoLogInOutline className="text-indigo-600 dark:text-indigo-400 text-xl" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5">Arrivée</p>
                <p className="text-base font-extrabold text-gray-900 dark:text-white">{fmtDate(booking.checkIn)}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{fmtDay(booking.checkIn)} · dès 15h00</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <div className="hidden sm:block h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50/80 dark:bg-purple-900/20 border border-purple-100/50 dark:border-purple-800/30">
                  <IoMoonOutline className="text-purple-600 dark:text-purple-400 text-sm" />
                  <span className="text-sm font-extrabold text-purple-700 dark:text-purple-300">{booking.nights}</span>
                  <span className="text-xs text-purple-500 dark:text-purple-400">nuit{booking.nights > 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50/80 dark:bg-sky-900/20 border border-sky-100/50 dark:border-sky-800/30">
                  <IoPeopleOutline className="text-sky-600 dark:text-sky-400 text-sm" />
                  <span className="text-sm font-extrabold text-sky-700 dark:text-sky-300">{booking.guests}</span>
                </div>
              </div>
              <div className="hidden sm:block h-px flex-1 bg-gradient-to-l from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
            </div>

            <div className="flex items-center gap-4 sm:flex-row-reverse sm:text-right">
              <div className="w-12 h-12 rounded-2xl bg-violet-50/80 dark:bg-violet-900/20 border border-violet-100/50 dark:border-violet-800/30 flex items-center justify-center flex-shrink-0">
                <IoLogOutOutline className="text-violet-600 dark:text-violet-400 text-xl" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5">Départ</p>
                <p className="text-base font-extrabold text-gray-900 dark:text-white">{fmtDate(booking.checkOut)}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{fmtDay(booking.checkOut)} · avant 11h00</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Review CTA */}
        {isCompleted && !booking.hasReview && (
          <div className="relative overflow-hidden rounded-2xl mb-7 fu d2">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-[shimmer_3s_ease-in-out_infinite]" />
            <div className="relative flex items-center gap-4 p-5">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0"><IoStarSharp className="text-white text-xl" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">Votre avis compte !</p>
                <p className="text-xs text-white/70">Partagez votre expérience pour aider les futurs voyageurs.</p>
              </div>
              <button onClick={() => setReviewOpen(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-orange-600 hover:bg-white/90 active:scale-[.97] transition-all flex-shrink-0 shadow-lg">
                Écrire un avis
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TWO COLUMNS
        ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

          {/* ═══ LEFT ═══ */}
          <div className="space-y-5 min-w-0">

            {/* Access */}
            {booking.revealedInfo && (
              <GlassCard className="overflow-hidden fu d3">
                <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
                <div className="p-6">
                  <SectionHeader icon={<IoKeyOutline />} title="Accès & Instructions" sub="Informations confidentielles" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-5">
                      {booking.revealedInfo.accessCode && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
                            <IoLockClosedOutline /> Code d'entrée
                          </p>
                          <div className="bg-gradient-to-br from-indigo-50/80 to-violet-50/80 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-xl p-4 border border-indigo-100/50 dark:border-indigo-800/30">
                            <div className="flex items-center justify-between gap-3 mb-2.5">
                              <div className="flex gap-1.5">
                                {booking.revealedInfo.accessCode.split("").map((c, i) => (
                                  <div key={i} className="w-10 rounded-xl bg-white dark:bg-gray-900 border border-indigo-200/60 dark:border-indigo-700/40 flex items-center justify-center shadow-sm" style={{paddingTop:10,paddingBottom:10}}>
                                    <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">{c}</span>
                                  </div>
                                ))}
                              </div>
                              <CopyBtn text={booking.revealedInfo.accessCode} />
                            </div>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                              <IoTimeOutline className="text-xs" /> Actif à partir de 15h00
                            </p>
                          </div>
                        </div>
                      )}
                      {booking.revealedInfo.ownerPhone && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
                            <IoPhonePortraitOutline /> Téléphone de l'hôte
                          </p>
                          <div className="bg-sky-50/80 dark:bg-sky-900/15 rounded-xl p-4 border border-sky-100/50 dark:border-sky-800/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
                                <IoCallOutline className="text-sky-600 dark:text-sky-400" />
                              </div>
                              <span className="font-extrabold text-gray-900 dark:text-white tracking-wider">{booking.revealedInfo.ownerPhone}</span>
                            </div>
                            <CopyBtn text={booking.revealedInfo.ownerPhone} />
                          </div>
                        </div>
                      )}
                    </div>
                    {booking.revealedInfo.checkinInstructions && (
                      <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
                          <IoInformationCircleOutline /> Instructions
                        </p>
                        <div className="bg-violet-50/60 dark:bg-violet-900/10 rounded-xl p-4 border border-violet-100/50 dark:border-violet-800/30 h-[calc(100%-28px)]">
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{booking.revealedInfo.checkinInstructions}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Not revealed */}
            {!booking.revealedInfo && isConfirmed && (
              <div className="bg-amber-50/80 dark:bg-amber-900/15 border border-amber-200/60 dark:border-amber-800/30 backdrop-blur-sm rounded-2xl p-5 flex items-start gap-4 fu d3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0"><IoLockClosedOutline className="text-amber-600 dark:text-amber-400 text-lg" /></div>
                <div>
                  <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">Accès disponible bientôt</p>
                  <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-1 leading-relaxed">Le code d'accès sera révélé 24h avant votre arrivée.{daysUntil > 1 && ` Encore ${daysUntil - 1} jour${daysUntil > 2 ? "s" : ""}.`}</p>
                </div>
              </div>
            )}

            {/* Map */}
            {coords?.lat && coords?.lng && (
              <GlassCard className="overflow-hidden fu d4">
                <div className="px-5 py-4 border-b border-white/30 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50/80 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-800/30 flex items-center justify-center">
                      <IoMapOutline className="text-indigo-600 dark:text-indigo-400 text-sm" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Localisation</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-[220px]">{loc}</p>
                    </div>
                  </div>
                  <button onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(loc || booking.listing.delegation)}`, "_blank")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 shadow-sm shadow-violet-500/20 hover:shadow-md hover:scale-[1.02] active:scale-[.97] transition-all">
                    <IoNavigateOutline /> Maps
                  </button>
                </div>
                <div className="h-56 w-full">
                  <MapPickerWrapper latitude={coords.lat} longitude={coords.lng} onLocationChange={() => {}} readOnly />
                </div>
              </GlassCard>
            )}

            {/* Rules */}
            <GlassCard className="p-6 fu d5">
              <SectionHeader icon={<IoShieldCheckmarkOutline />} title="Règlement intérieur" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {rules.map((r, i) => (
                  <div key={i} className="group flex flex-col items-center gap-2.5 p-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100/50 dark:border-gray-700/30 text-center hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 hover:border-indigo-200/50 dark:hover:border-indigo-800/40 transition-all cursor-default">
                    <div className="w-10 h-10 rounded-xl bg-white/80 dark:bg-gray-900/80 border border-gray-100/50 dark:border-gray-700/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl group-hover:scale-110 transition-transform">{r.icon}</div>
                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400 leading-snug">{r.label}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* ═══ RIGHT ═══ */}
          <div className="space-y-5">

            {/* Price */}
            <div className="relative overflow-hidden rounded-2xl shadow-2xl shadow-violet-500/15 fu d3">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-700" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
              <div className="relative p-6">
                <div className="flex items-center gap-2.5 mb-5">
                  <IoReceiptOutline className="text-white/60 text-base" />
                  <p className="text-[9px] font-bold uppercase tracking-[.25em] text-white/40">Récapitulatif financier</p>
                </div>
                <p className="text-5xl font-black text-white tracking-tight leading-none mb-1">{fmtPrice(booking.totalPrice)}</p>
                <p className="text-white/40 text-xs mb-6">Total payé</p>
                <div className="space-y-3 mb-5 border-t border-white/10 pt-5">
                  {[
                    { l: `${fmtPrice(booking.pricePerNight)} × ${booking.nights} nuit${booking.nights>1?"s":""}`, v: fmtPrice(nightsTotal) },
                    ...(booking.cleaningFee ? [{ l: "Frais de ménage", v: fmtPrice(booking.cleaningFee) }] : []),
                    ...(booking.serviceFee ? [{ l: "Frais de service", v: fmtPrice(booking.serviceFee) }] : []),
                  ].map(({ l, v }, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-white/50">{l}</span>
                      <span className="text-white/80 font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 border border-white/10">
                  <IoShieldCheckmarkOutline className="text-emerald-300 text-sm flex-shrink-0" />
                  <p className="text-xs font-medium text-white/60">Sécurisé par Nesthub Pay</p>
                </div>
              </div>
            </div>

            {/* Host */}
            <GlassCard className="p-5 fu d4">
              <p className="text-[9px] font-bold uppercase tracking-[.22em] text-gray-400 dark:text-gray-500 mb-4">Votre hôte</p>
              <div className="flex items-center gap-3.5 mb-5">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-violet-500/20">
                    {booking.owner.profilePictureUrl && !avatarErr ? (
                      <img src={pipA(booking.owner.profilePictureUrl)} alt="" className="w-full h-full object-cover" onError={() => setAvatarErr(true)} />
                    ) : `${booking.owner.firstName[0]}${booking.owner.lastName[0]}`}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                    <IoShieldCheckmarkOutline className="text-white text-[8px]" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-extrabold text-gray-900 dark:text-white">{ownerName}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[1,2,3,4,5].map(s => (
                      <IoStarSharp key={s} className={`text-xs ${s <= Math.round(booking.owner.stats?.averageRating ?? 5) ? "text-amber-400" : "text-gray-200 dark:text-gray-700"}`} />
                    ))}
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">({booking.owner.stats?.totalReviews ?? 0})</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {booking.conversationId ? (
                  <Link href={`/fr/messages?conversation=${booking.conversationId}`}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[.97] transition-all">
                    <IoChatbubbleOutline /> Contacter l'hôte
                  </Link>
                ) : (
                  <button className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20 hover:scale-[1.02] active:scale-[.97] transition-all">
                    <IoChatbubbleOutline /> Contacter l'hôte
                  </button>
                )}
                <Link href={`/fr/profiles/${booking.owner.id}`}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-100/80 dark:bg-gray-800/60 hover:bg-gray-200/80 dark:hover:bg-gray-700/60 border border-gray-200/60 dark:border-gray-700/40 active:scale-[.98] transition-all">
                  <IoPersonOutline /> Voir le profil
                </Link>
              </div>
            </GlassCard>

            {/* Documents */}
            <GlassCard className="overflow-hidden fu d5">
              <div className="p-5">
                <p className="text-[9px] font-bold uppercase tracking-[.22em] text-gray-400 dark:text-gray-500 mb-3">Documents</p>
                <div className="space-y-1">
                  {booking.contract?.pdfUrl && (
                    <a href={booking.contract.pdfUrl} target="_blank" rel="noopener noreferrer"
                      className="group flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50/80 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-800/30 flex items-center justify-center">
                          <IoDocumentTextOutline className="text-indigo-600 dark:text-indigo-400 text-base" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">Contrat de location</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500">PDF · Signé</p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100/50 dark:border-gray-700/30 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                        <IoDownloadOutline className="text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 text-sm transition-colors" />
                      </div>
                    </a>
                  )}
                  <a href="#" className="group flex items-center justify-between p-3 rounded-xl hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-violet-50/80 dark:bg-violet-900/20 border border-violet-100/50 dark:border-violet-800/30 flex items-center justify-center">
                        <IoReceiptOutline className="text-violet-600 dark:text-violet-400 text-base" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Facture détaillée</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">PDF · Exportable</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100/50 dark:border-gray-700/30 flex items-center justify-center group-hover:bg-violet-50 dark:group-hover:bg-violet-900/30 transition-colors">
                      <IoChevronForwardOutline className="text-gray-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 text-sm transition-colors group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </a>
                </div>
              </div>
            </GlassCard>

            {/* Cancel policy */}
            <div className="rounded-2xl p-4 border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-900/10 backdrop-blur-sm fu d6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-100/80 dark:bg-rose-900/40 flex items-center justify-center flex-shrink-0">
                  <IoInformationCircleOutline className="text-rose-500 text-sm" />
                </div>
                <div>
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">Politique d'annulation</p>
                  <p className="text-xs text-rose-600/70 dark:text-rose-400/70 leading-relaxed">
                    Politique <strong className="text-rose-700 dark:text-rose-300">Modérée</strong> — Annulation gratuite jusqu'à 5 jours avant l'arrivée.
                  </p>
                </div>
              </div>
            </div>

            {/* Help */}
            <GlassCard className="p-4 fu d7">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100/80 dark:bg-gray-800/80 flex items-center justify-center border border-gray-200/50 dark:border-gray-700/30">
                    <IoChatbubbleOutline className="text-gray-500 dark:text-gray-400 text-sm" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Besoin d'aide ?</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">Support 24h/7j</p>
                  </div>
                </div>
                <Link href="/fr/help" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 group">
                  Centre d'aide <IoChevronForwardOutline className="text-[10px] group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-14 pt-8 border-t border-gray-200/60 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-5 fu d7">
          <p className="text-sm text-gray-400 dark:text-gray-600 italic text-center sm:text-left">
            "Nous espérons que{" "}
            <span className="not-italic font-bold text-indigo-600 dark:text-indigo-400">{booking.listing.title}</span>{" "}
            a été à la hauteur de vos attentes."
          </p>
          <div className="flex items-center gap-2 opacity-20">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500" />
            <span className="text-lg font-extrabold tracking-tight">NESTHUB</span>
          </div>
        </div>
      </main>

      {reviewOpen && <ReviewModal isOpen onClose={() => setReviewOpen(false)} onSubmit={submitReview} booking={booking} />}
      {extendOpen && <ExtendBookingModal booking={{ id: booking.id, listingId: booking.listing.id, listingTitle: booking.listing.title, checkOut: booking.checkOut, pricePerNight: booking.pricePerNight }} onClose={() => setExtendOpen(false)} onSuccess={doExtendSuccess} />}
      <TenantCancelModal booking={booking} isOpen={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={doCancel} />
    </div>
  );
}