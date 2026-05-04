// app/[locale]/reviews/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  IoStarSharp,
  IoStarOutline,
  IoStarHalfSharp,
  IoSearchOutline,
  IoLocationOutline,
  IoHomeOutline,
  IoShieldCheckmarkOutline,
  IoChevronDownOutline,
  IoCloseOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoChevronForwardOutline,
  IoArrowForwardOutline,
  IoChatbubbleOutline,
  IoFlagOutline,
  IoSparklesOutline,
  IoRefreshOutline,
} from "react-icons/io5";
import { TenantHeader } from "@/components/ui/header/TenantHeader";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pipListing = (url: string) => `/api/listings/image?url=${encodeURIComponent(url)}`;
const pipAvatar = (url: string) => `/api/users/avatar?url=${encodeURIComponent(url)}`;

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  response: string | null;
  responseAt: string | null;
  createdAt: string;
  reviewer: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl: string | null;
  };
  target: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl: string | null;
  };
  booking: {
    checkIn: string;
    checkOut: string;
    listing: {
      id: string;
      title: string;
      governorate: string;
      delegation: string;
      type: string;
      photos: { url: string; isMain: boolean }[];
    };
  };
}

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  profilePictureUrl?: string;
  createdAt: string;
}

interface UserStats {
  averageRating: number;
  totalReviews: number;
  reliabilityScore: number;
  totalBookings: number;
}

function fmtDate(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function memberSince(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => {
        if (rating >= s) return <IoStarSharp key={s} className="text-amber-400 text-sm" />;
        if (rating >= s - 0.5) return <IoStarHalfSharp key={s} className="text-amber-400 text-sm" />;
        return <IoStarOutline key={s} className="text-gray-300 dark:text-gray-600 text-sm" />;
      })}
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 animate-pulse">
      <div className="flex flex-col sm:flex-row gap-5">
        <div className="w-full sm:w-36 h-28 rounded-xl bg-gray-200 dark:bg-gray-800 flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-4/5" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: "received" | "given" }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
      <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/30 flex items-center justify-center mb-4">
        <IoStarOutline className="text-violet-400 dark:text-violet-500 text-2xl" />
      </div>
      <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-1">
        {tab === "received" ? "Aucun avis reçu pour le moment" : "Aucun avis donné pour le moment"}
      </h3>
      <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
        {tab === "received"
          ? "Les avis laissés par vos hôtes apparaîtront ici."
          : "Partagez votre expérience après vos séjours."}
      </p>
      <Link
        href="/fr/reservations"
        className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 shadow-sm transition-all"
      >
        Mes réservations <IoArrowForwardOutline className="text-sm" />
      </Link>
    </div>
  );
}

export default function ReviewsPage() {
  const { getToken } = useAuth();
  const [tab, setTab] = useState<"received" | "given">("received");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "rating_desc" | "rating_asc">("recent");
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [avatarErr, setAvatarErr] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      
      // 1. Fetch reviews
      const reviewsRes = await fetch(`/api/reviews?tab=${tab}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        setReviews(data.reviews || []);
      }

      // 2. Fetch user profile
      const profileRes = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.user || data);
      }

      // 3. Fetch user stats
      const statsRes = await fetch("/api/users/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats || data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast("Erreur de chargement", false);
    } finally {
      setLoading(false);
    }
  }, [getToken, tab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReply = async (reviewId: string, response: string) => {
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/reviews/${reviewId}/response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ response }),
      });
      if (res.ok) {
        showToast("Réponse publiée !");
        fetchData();
      } else {
        showToast("Erreur lors de la publication", false);
      }
    } catch {
      showToast("Erreur de connexion", false);
    }
  };

  const handleReport = async (reviewId: string) => {
    if (!window.confirm("Signaler cet avis comme inapproprié ?")) return;
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/reviews/${reviewId}/report`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) showToast("Avis signalé");
      else showToast("Erreur", false);
    } catch {
      showToast("Erreur de connexion", false);
    }
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.floor(r.rating) === star).length,
    pct: reviews.length > 0 ? (reviews.filter((r) => Math.floor(r.rating) === star).length / reviews.length) * 100 : 0,
  }));

  const filtered = reviews.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.booking.listing.title.toLowerCase().includes(q);
    const matchRating = filterRating === null || Math.floor(r.rating) === filterRating;
    return matchSearch && matchRating;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "rating_desc") return b.rating - a.rating;
    if (sortBy === "rating_asc") return a.rating - b.rating;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white transition-colors">
      <TenantHeader />

      {toast && (
        <div className={`fixed top-20 right-4 z-[80] flex items-center gap-2 pl-4 pr-3 py-3 rounded-2xl text-sm font-medium shadow-xl border backdrop-blur-sm ${
          toast.ok
            ? "bg-emerald-50 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
            : "bg-rose-50 dark:bg-rose-900/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
        }`}>
          {toast.ok ? <IoCheckmarkCircleOutline className="text-lg" /> : <IoAlertCircleOutline className="text-lg" />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-1 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
            <IoCloseOutline className="text-sm" />
          </button>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-24">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
            Mes avis
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed">
            Gérez vos retours d'expérience et consultez les évaluations laissées par vos hôtes.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] text-violet-500 dark:text-violet-400 uppercase tracking-widest">Note globale</p>
              <IoStarSharp className="text-amber-400 text-lg" />
            </div>
            <p className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
              {avgRating > 0 ? avgRating.toFixed(2) : "—"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Basé sur {reviews.length} avis</p>
            {reviews.length > 0 && (
              <div className="mt-4 space-y-1.5">
                {ratingDistribution.map(({ star, count, pct }) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 w-3">{star}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 w-4 text-right">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] text-sky-500 dark:text-sky-400 uppercase tracking-widest">Fiabilité</p>
              <IoShieldCheckmarkOutline className="text-sky-500 dark:text-sky-400 text-lg" />
            </div>
            <p className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
              {stats?.reliabilityScore ?? "—"}{stats?.reliabilityScore !== undefined && "%"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Score de confiance</p>
            {stats?.reliabilityScore !== undefined && (
              <div className="mt-4 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full transition-all duration-700" style={{ width: `${stats.reliabilityScore}%` }} />
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center text-white font-semibold text-xl shadow-md overflow-hidden">
                {profile?.profilePictureUrl && !avatarErr ? (
                  <img src={pipAvatar(profile.profilePictureUrl)} alt="" className="w-full h-full object-cover" onError={() => setAvatarErr(true)} />
                ) : (
                  `${profile?.firstName?.[0] ?? ""}${profile?.lastName?.[0] ?? ""}`
                )}
              </div>
              <div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">
                  {profile ? `${profile.firstName} ${profile.lastName}` : "..."}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Membre depuis {profile ? memberSince(profile.createdAt) : "..."}</p>
                <div className="mt-1 flex items-center gap-1">
                  <IoSparklesOutline className="text-sky-500 text-xs" />
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 uppercase tracking-wider font-medium">Super Voyageur</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="text-center py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.totalBookings ?? "—"}</p>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Séjours</p>
              </div>
              <div className="text-center py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.totalReviews ?? "—"}</p>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Avis reçus</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mb-6 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setTab("received")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              tab === "received" ? "border-sky-500 text-gray-900 dark:text-white" : "border-transparent text-gray-400 dark:text-gray-500"
            }`}
          >
            Avis reçus ({reviews.length})
          </button>
          <button
            onClick={() => setTab("given")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              tab === "given" ? "border-sky-500 text-gray-900 dark:text-white" : "border-transparent text-gray-400 dark:text-gray-500"
            }`}
          >
            Avis donnés
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un séjour…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-sky-400 dark:focus:border-sky-600 focus:ring-4 focus:ring-sky-500/10 transition-all"
            />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none pl-4 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 outline-none focus:border-sky-400 dark:focus:border-sky-600 cursor-pointer w-full sm:w-auto"
            >
              <option value="recent">Date : Récent</option>
              <option value="rating_desc">Note ↓</option>
              <option value="rating_asc">Note ↑</option>
            </select>
            <IoChevronDownOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
          </div>

          <div className="flex gap-1.5">
            {[null, 5, 4, 3, 2, 1].map((star) => (
              <button
                key={star ?? "all"}
                onClick={() => setFilterRating(filterRating === star ? null : star)}
                className={`flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs border transition-all ${
                  filterRating === star
                    ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
                    : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-amber-300"
                }`}
              >
                {star === null ? "Tous" : <><IoStarSharp className="text-amber-400 text-[11px]" />{star}</>}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {loading ? (
            [...Array(3)].map((_, i) => <ReviewSkeleton key={i} />)
          ) : sorted.length === 0 ? (
            <EmptyState tab={tab} />
          ) : (
            sorted.map((review) => (
              <div key={review.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="flex-shrink-0 w-full sm:w-40">
                    <div className="relative w-full sm:w-40 h-28 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {review.booking.listing.photos?.[0] ? (
                        <img
                          src={pipListing(review.booking.listing.photos[0].url)}
                          alt={review.booking.listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <IoHomeOutline className="text-3xl text-gray-300 dark:text-gray-600" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-2 text-center sm:text-left">
                      {fmtDate(review.booking.checkIn)}
                    </p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h4 className="text-base font-bold text-gray-900 dark:text-white truncate">
                          {review.booking.listing.title}
                        </h4>
                        <p className="text-xs text-sky-600 dark:text-sky-400 mt-0.5">
                          {tab === "received" ? "Hôte" : "Pour"} : {review.reviewer.firstName} {review.reviewer.lastName}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-900/20">
                        <IoStarSharp className="text-amber-400 text-sm" />
                        <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">{review.rating}</span>
                      </div>
                    </div>

                    {review.comment && (
                      <div className="border-l-4 border-gray-200 dark:border-gray-700 pl-4 py-1 mb-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">
                          &ldquo;{review.comment}&rdquo;
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 flex-wrap">
                      {tab === "received" && (
                        <button
                          onClick={() => {
                            const response = prompt("Votre réponse:", review.response || "");
                            if (response) handleReply(review.id, response);
                          }}
                          className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                        >
                          <IoChatbubbleOutline className="text-sm" />
                          {review.response ? "Modifier la réponse" : "Répondre"}
                        </button>
                      )}
                      <button
                        onClick={() => handleReport(review.id)}
                        className="text-xs text-gray-400 dark:text-gray-500 hover:text-rose-500 transition-colors flex items-center gap-1"
                      >
                        <IoFlagOutline className="text-sm" />
                        Signaler
                      </button>
                      <Link
                        href={`/fr/listings/${review.booking.listing.id}`}
                        className="text-xs text-gray-400 dark:text-gray-500 hover:text-sky-600 transition-colors ml-auto flex items-center gap-1"
                      >
                        Voir le bien <IoChevronForwardOutline className="text-[10px]" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}