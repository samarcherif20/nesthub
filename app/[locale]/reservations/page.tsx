// app/[locale]/reservations/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight, Ban, BedDouble, CalendarDays, Check, CheckCircle2,
  CircleDollarSign, Clock, Compass, Crown, Flame, Heart,
  Loader2, MapPin, MessageCircle, Receipt, Search, Shield,
  Star, TrendingUp, Users, Wallet, X, Moon, Sun
} from "lucide-react";
import { TenantHeader } from "@/components/ui/header/TenantHeader";
import { ReviewModal } from "@/components/ui/modals/ReviewModal";

// ─── Helper functions ──────────────────────────────────────────────────────────
const proxyImage = (url: string) => `/api/listings/image?url=${encodeURIComponent(url)}`;

function formatDateShort(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function formatDateLong(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

// ─── Status configuration ──────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { l: string; i: any; b: string; t: string }> = {
  PENDING: { l: "En attente", i: Clock, b: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20", t: "text-amber-700 dark:text-amber-400" },
  ACCEPTED: { l: "Acceptée", i: CheckCircle2, b: "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20", t: "text-sky-700 dark:text-sky-400" },
  CONFIRMED: { l: "Confirmée", i: Shield, b: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20", t: "text-emerald-700 dark:text-emerald-400" },
  COMPLETED: { l: "Terminée", i: Crown, b: "bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20", t: "text-violet-700 dark:text-violet-400" },
  CANCELLED: { l: "Annulée", i: Ban, b: "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/30", t: "text-slate-500 dark:text-slate-400" },
  REJECTED: { l: "Refusée", i: X, b: "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20", t: "text-rose-700 dark:text-rose-400" },
};

// ─── Countdown component ───────────────────────────────────────────────────────
function Countdown({ date }: { date: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const days = Math.ceil((new Date(date).getTime() - now) / 86400000);
  if (days <= 0) return null;
  if (days === 1) return <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-bold text-white shadow-md">Demain</span>;
  if (days <= 7) return <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-bold text-white shadow-md">J-{days}</span>;
  if (days <= 30) return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">{days} jours</span>;
  return null;
}

// ─── Theme toggle ──────────────────────────────────────────────────────────────
function ThemeToggle({ dark, setDark }: { dark: boolean; setDark: (v: boolean) => void }) {
  return (
    <button
      onClick={() => setDark(!dark)}
      className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-slate-600 shadow-md backdrop-blur-sm transition-all hover:scale-105 dark:bg-slate-800/80 dark:text-slate-300"
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function Reservations() {
  const [dark, setDark] = useState(false);
  const [tab, setTab] = useState<"UPCOMING" | "PAST" | "CANCELLED">("UPCOMING");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "price">("date");
  const [bookings, setBookings] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [favs, setFavs] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(true);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<any | null>(null);

  // Theme detection
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mq.matches);
    const handler = () => setDark(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  // Load bookings from API
  const loadBookings = async () => {
    setPageLoading(true);
    try {
      const res = await fetch("/api/bookings?role=tenant&status=ALL&pageSize=50");
      if (!res.ok) throw new Error();
      const data = await res.json();
      const raw = Array.isArray(data) ? data : (data.bookings ?? []);
      const processed = raw.map((b: any) => ({
        id: b.id,
        listing: {
          id: b.listing?.id,
          title: b.listing?.title || "Propriété",
          image: b.listing?.image,
          location: b.listing?.location || `${b.listing?.delegation || ""}, ${b.listing?.governorate || ""}`,
          pricePerNight: b.pricePerNight || b.listing?.pricePerNight || 0,
          type: b.listing?.type || "APARTMENT",
        },
        host: {
          name: b.owner ? `${b.owner.firstName || ""} ${b.owner.lastName || ""}` : "Hôte",
          initials: b.owner ? `${(b.owner.firstName?.[0] || "")}${(b.owner.lastName?.[0] || "")}` : "??",
        },
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        guests: b.guests,
        nights: b.nights || Math.ceil((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000),
        totalPrice: b.totalPrice,
        cleaningFee: b.cleaningFee || 0,
        serviceFee: b.serviceFee || 0,
        status: b.status,
        isPaid: b.paymentStatus === "PAID" || b.status === "CONFIRMED",
        hasReview: b.review?.rating !== undefined && b.review?.rating !== null,
      }));
      setBookings(processed);
    } catch (err) {
      console.error(err);
      setToast("Erreur lors du chargement");
    } finally {
      setPageLoading(false);
    }
  };

  // Load recommendations (exactly 3)
  const loadRecommendations = async () => {
    setRecLoading(true);
    try {
      const res = await fetch("/api/listings?featured=true&limit=3");
      if (res.ok) {
        const data = await res.json();
        const listings = (data.listings ?? []).slice(0, 3);
        const formatted = listings.map((l: any, idx: number) => ({
          id: l.id,
          title: l.title,
          location: l.location || `${l.delegation || ""}, ${l.governorate || ""}`,
          pricePerNight: l.pricePerNight || 250,
          image: l.photos?.find((p: any) => p.isMain)?.url || l.image,
          beds: l.bedrooms || 2,
          rating: (4.5 + idx * 0.2).toFixed(1),
        }));
        setRecommendations(formatted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRecLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    loadRecommendations();
  }, []);

  // Filter and sort
  const upcoming = bookings.filter((b) => ["PENDING", "ACCEPTED", "CONFIRMED"].includes(b.status));
  const past = bookings.filter((b) => b.status === "COMPLETED");
  const cancelled = bookings.filter((b) => ["CANCELLED", "REJECTED"].includes(b.status));

  const filteredList = (() => {
    const source = tab === "UPCOMING" ? upcoming : tab === "PAST" ? past : cancelled;
    let filtered = source;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((b) =>
        `${b.listing.title} ${b.listing.location} ${b.host.name}`.toLowerCase().includes(q)
      );
    }
    return filtered.sort((a, b) =>
      sortBy === "price"
        ? b.totalPrice - a.totalPrice
        : new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
    );
  })();

  const spent = bookings.filter((b) => b.status === "COMPLETED").reduce((s, b) => s + b.totalPrice, 0);
  const nights = bookings.filter((b) => b.status === "COMPLETED").reduce((s, b) => s + b.nights, 0);
  const reviewed = bookings.filter((b) => b.hasReview).length;

  // Actions
  const performAction = async (id: string, action: () => Promise<void>) => {
    setLoading(id);
    await action();
    setLoading(null);
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Confirmer l'annulation de cette réservation ?")) return;
    await performAction(id, async () => {
      const res = await fetch(`/api/bookings/${id}/cancel`, { method: "POST" });
      if (res.ok) {
        setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "CANCELLED" } : b));
        setToast("Réservation annulée");
      } else {
        const err = await res.json();
        setToast(err.error ?? "Erreur d'annulation");
      }
    });
  };

  const handlePay = (id: string) => {
    router.push(`/fr/payment?bookingId=${id}`);
  };

  const handleSubmitReview = async (reviewData: any) => {
    if (!selectedBookingForReview) return;
    try {
      const formData = new FormData();
      formData.append("rating", reviewData.rating.toString());
      formData.append("publicComment", reviewData.publicComment);
      formData.append("privateNote", reviewData.privateNote);
      formData.append("criteria", JSON.stringify(reviewData.criteria));
      reviewData.photos.forEach((photo: File) => formData.append("photos", photo));

      const res = await fetch(`/api/bookings/${selectedBookingForReview.id}/review`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => b.id === selectedBookingForReview.id ? { ...b, hasReview: true } : b)
        );
        setToast("Merci pour votre avis !");
        setSelectedBookingForReview(null);
      } else {
        const err = await res.json();
        setToast(err.error ?? "Erreur lors de l'envoi");
      }
    } catch {
      setToast("Erreur de connexion");
    }
  };

  const GRAD = "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600";
  const GT = "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent";
  const CARD_STYLE = "rounded-2xl border border-white/70 bg-white/85 shadow-[0_8px_28px_rgba(15,23,42,0.04)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/85";

  // Loading skeleton
  if (pageLoading) {
    return (
      <div className={dark ? "dark" : ""}>
        <div className="min-h-screen bg-[#f6f5ff] dark:bg-[#070711]">
          <TenantHeader />
          <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
            <div className="animate-pulse space-y-6">
              <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                ))}
              </div>
              <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-[#f6f5ff] text-slate-800 transition-colors dark:bg-[#070711] dark:text-slate-100">
        <TenantHeader />

        {/* Toast */}
        {toast && (
          <div className="fixed top-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-slate-900/92 px-6 py-3.5 text-sm font-bold text-white shadow-2xl backdrop-blur-xl dark:bg-white/92 dark:text-slate-900">
            {toast}
          </div>
        )}

        <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
          {/* STATS BANNER */}
          <div className="relative mb-10 overflow-hidden rounded-3xl border border-white/70 shadow-[0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/85">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5" />
            <div className="relative grid gap-0 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 dark:divide-white/10">
              {[
                { i: CalendarDays, l: "À venir", v: upcoming.length, u: "réservation" + (upcoming.length !== 1 ? "s" : ""), g: "from-sky-400 to-blue-500", c: "text-sky-600 dark:text-sky-400" },
                { i: Crown, l: "Terminées", v: past.length, u: "séjour" + (past.length !== 1 ? "s" : ""), g: "from-violet-400 to-purple-500", c: "text-violet-600 dark:text-violet-400" },
                { i: CircleDollarSign, l: "Total dépensé", v: `${spent.toLocaleString()} TND`, u: `${nights} nuits`, g: "from-emerald-400 to-teal-500", c: "text-emerald-600 dark:text-emerald-400" },
                { i: TrendingUp, l: "Note moyenne", v: "4.8/5", u: `${reviewed} avis`, g: "from-amber-400 to-orange-500", c: "text-amber-600 dark:text-amber-400" },
              ].map(({ i: Icon, l, v, u, g, c }) => (
                <div key={l} className="flex items-center gap-4 px-6 py-6">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${g} text-white shadow-lg`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{l}</p>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{v}</p>
                    <p className={`text-[11px] font-semibold ${c}`}>{u}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SEARCH + SORT */}
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par titre, lieu ou hôte..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-500/10"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "price")}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 outline-none dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
            >
              <option value="date">Par date</option>
              <option value="price">Par prix</option>
            </select>
            <ThemeToggle dark={dark} setDark={setDark} />
          </div>

          {/* TABS */}
          <div className="mb-8 flex items-center gap-2">
            {[
              { k: "UPCOMING" as const, l: "À venir", n: upcoming.length, i: CalendarDays },
              { k: "PAST" as const, l: "Terminées", n: past.length, i: CheckCircle2 },
              { k: "CANCELLED" as const, l: "Annulées", n: cancelled.length, i: Ban }
            ].map(({ k, l, n, i: Icon }) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`inline-flex items-center gap-2.5 rounded-full border-2 px-5 py-2.5 text-sm font-bold transition-all ${
                  tab === k
                    ? `border-transparent ${GRAD} text-white shadow-lg shadow-blue-500/20`
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
                }`}
              >
                <Icon className={`h-4 w-4 ${tab === k ? "text-white" : "text-slate-400"}`} />
                {l}
                <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold ${tab === k ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 dark:bg-white/5"}`}>
                  {n}
                </span>
              </button>
            ))}
          </div>

          {/* MAIN GRID */}
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            {/* Reservations list */}
            <div className="space-y-5">
              {filteredList.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 py-24 text-center dark:border-white/10 dark:bg-slate-900/50">
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/5 dark:to-white/10">
                    <CalendarDays className="h-9 w-9 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-600 dark:text-slate-400">
                    Aucune réservation {tab === "UPCOMING" ? "à venir" : tab === "PAST" ? "passée" : "annulée"}
                  </h3>
                  {tab === "UPCOMING" && (
                    <button className={`mt-6 inline-flex items-center gap-2 rounded-full ${GRAD} px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]`}>
                      <Compass className="h-4 w-4" /> Découvrir des logements
                    </button>
                  )}
                </div>
              ) : (
                filteredList.map((b) => {
                  const isExpanded = expanded === b.id;
                  const cfg = STATUS_MAP[b.status] || STATUS_MAP.PENDING;
                  const Icon = cfg.i;
                  const isPendingPayment = b.status === "ACCEPTED" && !b.isPaid;
                  const isActive = (b.status === "CONFIRMED" || b.status === "ACCEPTED") && b.isPaid;
                  const imageUrl = b.listing.image ? proxyImage(b.listing.image) : null;

                  return (
                    <div
                      key={b.id}
                      className={`${CARD_STYLE} overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.10)] ${isExpanded ? "ring-2 ring-blue-500/20" : ""}`}
                    >
                      <div className="flex flex-col md:flex-row">
                        {/* Image section */}
                        <div className="relative h-56 overflow-hidden bg-slate-200 dark:bg-slate-800 md:w-64 md:h-auto md:flex-shrink-0">
                          {imageUrl ? (
                            <img src={imageUrl} alt={b.listing.title} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-600">
                              <Compass className="h-12 w-12 text-white/40" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/5 to-transparent" />
                          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${cfg.b} ${cfg.t} shadow-sm backdrop-blur-sm`}>
                              <Icon className="h-3.5 w-3.5" />{cfg.l}
                            </span>
                            {b.isPaid && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-3 py-1.5 text-[10px] font-bold text-white shadow-md backdrop-blur-sm">
                                <Check className="h-3 w-3" />Payé
                              </span>
                            )}
                            {isPendingPayment && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-3 py-1.5 text-[10px] font-bold text-white shadow-md backdrop-blur-sm animate-pulse">
                                <Wallet className="h-3 w-3" />À payer
                              </span>
                            )}
                          </div>
                          <div className="absolute bottom-4 left-4">
                            <Countdown date={b.checkIn} />
                          </div>
                        </div>

                        {/* Content section */}
                        <div className="flex flex-col justify-between flex-1 p-5">
                          <div>
                            <div className="mb-3 flex items-start justify-between">
                              <div>
                                <h3 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">{b.listing.title}</h3>
                                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                  <MapPin className="h-3.5 w-3.5 shrink-0" />{b.listing.location}
                                </p>
                              </div>
                              <button
                                onClick={() => setExpanded(isExpanded ? null : b.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
                              >
                                <ArrowRight className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                              </button>
                            </div>

                            <div className="mb-3 flex flex-wrap items-center gap-2.5 text-xs">
                              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                                <CalendarDays className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                {formatDateShort(b.checkIn)} <span className="text-slate-300">→</span> {formatDateShort(b.checkOut)}
                              </span>
                              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                                <Users className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                                {b.guests} voyageur{b.guests > 1 ? "s" : ""} · {b.nights} nuit{b.nights > 1 ? "s" : ""}
                              </span>
                              <span className="text-xs font-semibold text-slate-400">
                                {b.listing.type === "VILLA" ? "Villa" : b.listing.type === "HOUSE" ? "Maison" : "Appartement"}
                              </span>
                            </div>

                            {/* Host info */}
                            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-white/5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 text-[11px] font-bold text-white shadow-md shadow-blue-500/15">
                                {b.host.initials}
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{b.host.name}</p>
                                <p className="text-[10px] text-slate-400">Votre hôte</p>
                              </div>
                              <MessageCircle className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                            </div>

                            {/* Expanded details */}
                            {isExpanded && (
                              <div className="mt-4 grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2 dark:bg-white/5">
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">{b.listing.pricePerNight.toLocaleString()} × {b.nights} n</span>
                                    <span className="font-bold">{(b.listing.pricePerNight * b.nights).toLocaleString()} TND</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Ménage</span>
                                    <span className="font-bold">{b.cleaningFee.toLocaleString()} TND</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Service</span>
                                    <span className="font-bold">{b.serviceFee.toLocaleString()} TND</span>
                                  </div>
                                  <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold dark:border-white/10">
                                    <span className={GT}>Total</span>
                                    <span className={GT}>{b.totalPrice.toLocaleString()} TND</span>
                                  </div>
                                </div>
                                <div>
                                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Suivi</p>
                                  {[
                                    { date: b.checkIn, label: "Arrivée", active: true },
                                    { date: b.checkOut, label: "Départ", active: b.status !== "PENDING" },
                                    { date: "", label: b.isPaid ? "Payé" : "Paiement", active: b.isPaid },
                                    { date: "", label: "Avis", active: b.hasReview }
                                  ].map((t, idx, arr) => (
                                    <div key={t.label} className="flex items-start gap-3">
                                      <div className="flex flex-col items-center">
                                        <div className={`h-3 w-3 rounded-full border-2 ${t.active ? "border-indigo-500 bg-indigo-500" : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900"}`} />
                                        {idx !== arr.length - 1 && <div className={`h-5 w-0.5 ${t.active ? "bg-indigo-300 dark:bg-indigo-700" : "bg-slate-200 dark:bg-slate-700"}`} />}
                                      </div>
                                      <div className="pb-2.5">
                                        <p className={`text-xs font-bold ${t.active ? "text-slate-800 dark:text-white" : "text-slate-400 dark:text-slate-600"}`}>{t.label}</p>
                                        {t.date && <p className="text-[10px] text-slate-400">{formatDateLong(t.date)}</p>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-4 flex flex-wrap gap-2">
                            {b.status === "PENDING" && (
                              <button className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 hover:border-blue-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                                <span className="inline-flex items-center gap-2"><MessageCircle className="h-4 w-4" />Contacter</span>
                              </button>
                            )}

                            {isPendingPayment && (
                              <button
                                onClick={() => handlePay(b.id)}
                                disabled={loading === b.id}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-xl ${GRAD} px-4 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/15 hover:scale-[1.01] disabled:opacity-70`}
                              >
                                {loading === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                                Payer {b.totalPrice.toLocaleString()} TND
                              </button>
                            )}

                            {isActive && (
                              <>
                                <button className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 hover:border-blue-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                                  <span className="inline-flex items-center gap-2"><MessageCircle className="h-4 w-4" />Message</span>
                                </button>
                                <button className={`flex-1 rounded-xl ${GRAD} px-4 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/15 hover:scale-[1.01]`}>
                                  <span className="inline-flex items-center gap-2"><Receipt className="h-4 w-4" />Détails</span>
                                </button>
                              </>
                            )}

                            {b.status === "COMPLETED" && (
                              <>
                                {!b.hasReview ? (
                                  <button
                                    onClick={() => setSelectedBookingForReview(b)}
                                    disabled={loading === b.id}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:scale-[1.01] disabled:opacity-70`}
                                  >
                                    {loading === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4 fill-white" />}
                                    Laisser un avis
                                  </button>
                                ) : (
                                  <div className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                                    <CheckCircle2 className="h-4 w-4" />Avis publié
                                  </div>
                                )}
                                <button className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 hover:border-blue-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                                  <span className="inline-flex items-center gap-2"><Receipt className="h-4 w-4" />Reçu</span>
                                </button>
                              </>
                            )}

                            {(b.status === "PENDING" || isPendingPayment) && (
                              <button
                                onClick={() => handleCancel(b.id)}
                                disabled={loading === b.id}
                                className="flex-1 rounded-xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-100 disabled:opacity-70 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400"
                              >
                                Annuler
                              </button>
                            )}

                            {(b.status === "CANCELLED" || b.status === "REJECTED") && (
                              <button className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                                <span className="inline-flex items-center gap-2"><Ban className="h-4 w-4" />Annulée</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-5">
              <div className="sticky top-24 space-y-5">
                <div className="relative overflow-hidden rounded-3xl border border-white/70 shadow-[0_16px_45px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/85">
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-purple-500 to-purple-600" />
                  <div className="relative p-7 text-center text-white">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                      <Compass className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-extrabold tracking-tight">Prêt pour l'évasion ?</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/70">Des villas de luxe aux dars de charme, trouvez votre prochaine destination.</p>
                    <button className="mt-6 w-full rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-indigo-600 shadow-xl transition-all hover:scale-[1.01]">
                      Explorer les biens <ArrowRight className="ml-1 inline h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className={`${CARD_STYLE} p-5`}>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-md">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Support NestHub</h3>
                      <p className="text-[11px] text-slate-400">Disponible 24h/24</p>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">Une question sur votre réservation ? Notre équipe est là pour vous aider.</p>
                  <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 shadow-sm hover:border-blue-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                    <MessageCircle className="h-4 w-4" />Contacter le support
                  </button>
                </div>
              </div>
            </aside>
          </div>

          {/* RECOMMENDATIONS - Une grande + deux petites cartes */}
          {!recLoading && recommendations.length >= 3 && (
            <section className="mt-16">
              <div className="mb-8">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 shadow-sm backdrop-blur-md dark:border-indigo-500/20 dark:bg-slate-900/70 dark:text-indigo-300">
                  <Flame className="h-3.5 w-3.5" /> Recommandations
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
                  Inspirations pour <span className={GT}>vous.</span>
                </h2>
              </div>
              
              <div className="grid gap-5 md:grid-cols-3 md:grid-rows-2">
                {/* Grande carte - première recommandation (occupe 2 colonnes et 2 rangées) */}
                <div className="md:col-span-2 md:row-span-2 group relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-sm backdrop-blur-md transition-all hover:-translate-y-2 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-slate-900/85 h-[480px] md:h-full">
                  <img
                    src={recommendations[0]?.image ? proxyImage(recommendations[0].image) : "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"}
                    alt={recommendations[0]?.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  
                  {/* Badges */}
                  <div className="absolute left-5 top-5 z-10 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-lg backdrop-blur-sm">
                      <Flame className="h-3.5 w-3.5" />Tendance
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1.5 text-[10px] font-bold text-white backdrop-blur-md">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{recommendations[0]?.rating}
                    </span>
                  </div>
                  
                  {/* Favorite button */}
                  <button
                    onClick={() => setFavs((p) => p.includes(recommendations[0].id) ? p.filter((f) => f !== recommendations[0].id) : [...p, recommendations[0].id])}
                    className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg backdrop-blur-md transition-all hover:scale-110 dark:bg-slate-900/90 dark:text-white"
                  >
                    <Heart className={`h-5 w-5 ${favs.includes(recommendations[0].id) ? "fill-rose-500 text-rose-500" : ""}`} />
                  </button>
                  
                  {/* Content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                    <h3 className="text-3xl font-extrabold tracking-tight text-white line-clamp-2">{recommendations[0]?.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <p className="inline-flex items-center gap-1.5 text-sm text-white/70">
                        <MapPin className="h-4 w-4" />{recommendations[0]?.location}
                      </p>
                      <span className="inline-flex items-center gap-1 text-sm text-white/70">
                        <BedDouble className="h-4 w-4" />{recommendations[0]?.beds} ch.
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-extrabold text-white">{recommendations[0]?.pricePerNight.toLocaleString()}</span>
                        <span className="text-xs text-white/60">TND / nuit</span>
                      </div>
                      <button className={`rounded-full ${GRAD} px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105`}>
                        Découvrir <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Première petite carte - deuxième recommandation */}
                <div className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-sm backdrop-blur-md transition-all hover:-translate-y-2 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-slate-900/85 h-[230px]">
                  <img
                    src={recommendations[1]?.image ? proxyImage(recommendations[1].image) : "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=80"}
                    alt={recommendations[1]?.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  
                  <div className="absolute right-4 top-4 z-10">
                    <button
                      onClick={() => setFavs((p) => p.includes(recommendations[1].id) ? p.filter((f) => f !== recommendations[1].id) : [...p, recommendations[1].id])}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg backdrop-blur-md transition-all hover:scale-110 dark:bg-slate-900/90 dark:text-white"
                    >
                      <Heart className={`h-4 w-4 ${favs.includes(recommendations[1].id) ? "fill-rose-500 text-rose-500" : ""}`} />
                    </button>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                    <h3 className="text-lg font-extrabold tracking-tight text-white line-clamp-1">{recommendations[1]?.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <p className="inline-flex items-center gap-1 text-xs text-white/70">
                        <MapPin className="h-3 w-3" />{recommendations[1]?.location}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-extrabold text-white">{recommendations[1]?.pricePerNight.toLocaleString()}</span>
                        <span className="text-[10px] text-white/60">TND/nuit</span>
                      </div>
                      <button className={`rounded-full ${GRAD} px-3 py-1.5 text-[10px] font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105`}>
                        Voir
                      </button>
                    </div>
                  </div>
                </div>

                {/* Deuxième petite carte - troisième recommandation */}
                <div className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-sm backdrop-blur-md transition-all hover:-translate-y-2 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-slate-900/85 h-[230px]">
                  <img
                    src={recommendations[2]?.image ? proxyImage(recommendations[2].image) : "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80"}
                    alt={recommendations[2]?.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  
                  <div className="absolute right-4 top-4 z-10">
                    <button
                      onClick={() => setFavs((p) => p.includes(recommendations[2].id) ? p.filter((f) => f !== recommendations[2].id) : [...p, recommendations[2].id])}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg backdrop-blur-md transition-all hover:scale-110 dark:bg-slate-900/90 dark:text-white"
                    >
                      <Heart className={`h-4 w-4 ${favs.includes(recommendations[2].id) ? "fill-rose-500 text-rose-500" : ""}`} />
                    </button>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                    <h3 className="text-lg font-extrabold tracking-tight text-white line-clamp-1">{recommendations[2]?.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <p className="inline-flex items-center gap-1 text-xs text-white/70">
                        <MapPin className="h-3 w-3" />{recommendations[2]?.location}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-extrabold text-white">{recommendations[2]?.pricePerNight.toLocaleString()}</span>
                        <span className="text-[10px] text-white/60">TND/nuit</span>
                      </div>
                      <button className={`rounded-full ${GRAD} px-3 py-1.5 text-[10px] font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105`}>
                        Voir
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={!!selectedBookingForReview}
        onClose={() => setSelectedBookingForReview(null)}
        onSubmit={handleSubmitReview}
        booking={selectedBookingForReview}
      />
    </div>
  );
}