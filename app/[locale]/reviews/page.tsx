// app/[locale]/reviews/page.tsx
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { 
  IoSearchOutline, 
  IoChevronDownOutline, 
  IoStarSharp, 
  IoCheckmarkCircleOutline, 
  IoAlertCircleOutline, 
  IoCloseOutline, 
  IoFilterOutline,
  IoSparklesOutline,
  IoCloudDownloadOutline,
  IoStarOutline,
  IoStarHalfSharp,
  IoShieldCheckmarkOutline,
  IoHomeOutline,
  IoFlagOutline,
  IoChatbubbleOutline,
  IoChevronForwardOutline,
  IoArrowForwardOutline
} from "react-icons/io5";

import { TenantHeader } from "@/components/ui/header/TenantHeader";
import { ReviewModal } from "@/components/ui/modals/ReviewModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const proxyImage = (url: string) => `/api/listings/image?url=${encodeURIComponent(url)}`;
const proxyAvatar = (url: string) => `/api/users/avatar?url=${encodeURIComponent(url)}`;

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
      pricePerNight?: number;
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

function EmptyState({ tab, onCreateReview }: { tab: "received" | "given"; onCreateReview: () => void }) {
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
      {tab === "given" && (
        <button
          onClick={onCreateReview}
          className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 shadow-sm transition-all"
        >
          <IoSparklesOutline className="text-sm" />
          Simuler un avis
        </button>
      )}
    </div>
  );
}

function StatsSection({ 
  reviews, 
  userProfile, 
  userStats,
  selectedFilterRating,
  onSelectFilterRating
}: { 
  reviews: Review[]; 
  userProfile: UserProfile | null;
  userStats: UserStats | null;
  selectedFilterRating: number | null;
  onSelectFilterRating: (star: number | null) => void;
}) {
  const [avatarErr, setAvatarErr] = useState(false);
  
  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.floor(r.rating) === star).length,
    pct: reviews.length > 0 ? (reviews.filter((r) => Math.floor(r.rating) === star).length / reviews.length) * 100 : 0,
  }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
      {/* Rating Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] text-violet-500 dark:text-violet-400 uppercase tracking-widest font-semibold">Note globale</p>
          <IoStarSharp className="text-amber-400 text-lg" />
        </div>
        <p className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
          {avgRating > 0 ? avgRating.toFixed(2) : "—"}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">Basé sur {reviews.length} avis</p>
        {reviews.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {ratingDistribution.map(({ star, count, pct }) => (
              <button
                key={star}
                onClick={() => onSelectFilterRating(selectedFilterRating === star ? null : star)}
                className="w-full flex items-center gap-2 group cursor-pointer"
              >
                <span className={`text-[10px] w-3 transition-colors ${selectedFilterRating === star ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-gray-400 dark:text-gray-500 group-hover:text-amber-500'}`}>
                  {star}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <span className={`text-[10px] w-4 text-right transition-colors ${selectedFilterRating === star ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reliability Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] text-sky-500 dark:text-sky-400 uppercase tracking-widest font-semibold">Fiabilité</p>
          <IoShieldCheckmarkOutline className="text-sky-500 dark:text-sky-400 text-lg" />
        </div>
        <p className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
          {userStats?.reliabilityScore ?? "—"}{userStats?.reliabilityScore !== undefined && "%"}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">Score de confiance</p>
        {userStats?.reliabilityScore !== undefined && (
          <div className="mt-4 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-sky-500 rounded-full transition-all duration-700" style={{ width: `${userStats.reliabilityScore}%` }} />
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center text-white font-semibold text-xl shadow-md overflow-hidden">
            {userProfile?.profilePictureUrl && !avatarErr ? (
              <img src={proxyAvatar(userProfile.profilePictureUrl)} alt="" className="w-full h-full object-cover" onError={() => setAvatarErr(true)} />
            ) : (
              `${userProfile?.firstName?.[0] ?? ""}${userProfile?.lastName?.[0] ?? ""}`
            )}
          </div>
          <div>
            <p className="text-base font-bold text-gray-900 dark:text-white truncate">
              {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : "..."}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Membre depuis {userProfile ? memberSince(userProfile.createdAt) : "..."}</p>
            <div className="mt-1 flex items-center gap-1">
              <IoSparklesOutline className="text-sky-500 text-xs" />
              <span className="text-[10px] text-sky-600 dark:text-sky-400 uppercase tracking-wider font-semibold">Super Voyageur</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="text-center py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{userStats?.totalBookings ?? "—"}</p>
            <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">Séjours</p>
          </div>
          <div className="text-center py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{userStats?.totalReviews ?? "—"}</p>
            <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">Avis reçus</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ 
  review, 
  tab, 
  onReply, 
  onReport
}: { 
  review: Review; 
  tab: "received" | "given";
  onReply: (id: string, response: string) => void;
  onReport: (id: string) => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const listingPhoto = review.booking.listing.photos?.find(p => p.isMain)?.url || review.booking.listing.photos?.[0]?.url;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-md transition-all duration-300">
      <div className="flex flex-col sm:flex-row gap-5">
        {/* Listing Image */}
        <div className="flex-shrink-0 w-full sm:w-40">
          <Link
            href={`/fr/listings/${review.booking.listing.id}`}
            className="relative w-full sm:w-40 h-28 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 group block"
          >
            {listingPhoto && !imgErr ? (
              <img
                src={proxyImage(listingPhoto)}
                alt={review.booking.listing.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={() => setImgErr(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <IoHomeOutline className="text-3xl text-gray-300 dark:text-gray-600" />
              </div>
            )}
          </Link>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-2 text-center sm:text-left">
            {fmtDate(review.booking.checkIn)}
          </p>
        </div>

        {/* Review Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <Link
                href={`/fr/listings/${review.booking.listing.id}`}
                className="text-base font-bold text-gray-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                {review.booking.listing.title}
              </Link>
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
                  if (response) onReply(review.id, response);
                }}
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 transition-colors"
              >
                <IoChatbubbleOutline className="text-sm" />
                {review.response ? "Modifier la réponse" : "Répondre"}
              </button>
            )}
            <button
              onClick={() => onReport(review.id)}
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
  const [filterStatus, setFilterStatus] = useState<"all" | "replied" | "unreplied">("all");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [showNewReviewModal, setShowNewReviewModal] = useState(false);

  const showToastMessage = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      
      // Fetch reviews
      const reviewsRes = await fetch(`/api/reviews?tab=${tab}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        setReviews(data.reviews || []);
      }

      // Fetch user profile
      const profileRes = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.user || data);
      }

      // Fetch user stats
      const statsRes = await fetch("/api/users/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats || data);
      }
    } catch (error) {
      console.error(error);
      showToastMessage("Erreur de chargement", false);
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
        showToastMessage("Réponse publiée avec succès !");
        fetchData();
      } else {
        showToastMessage("Erreur lors de la publication", false);
      }
    } catch {
      showToastMessage("Erreur de connexion", false);
    }
  };

  const handleReport = async (reviewId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir signaler cet avis ?")) return;
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/reviews/${reviewId}/report`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToastMessage("Avis signalé. Notre équipe l'examinera sous 24h.");
      } else {
        showToastMessage("Erreur lors du signalement", false);
      }
    } catch {
      showToastMessage("Erreur de connexion", false);
    }
  };

  const handleCreateReview = async (data: {
    rating: number;
    reviewerName: string;
    comment: string;
    listingId: string;
  }) => {
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          listingId: data.listingId,
          rating: data.rating,
          comment: data.comment,
          reviewerName: data.reviewerName,
        }),
      });
      
      if (res.ok) {
        showToastMessage(`Nouvel avis ajouté avec succès !`);
        setShowNewReviewModal(false);
        fetchData();
      } else {
        showToastMessage("Erreur lors de la création de l'avis", false);
      }
    } catch {
      showToastMessage("Erreur de connexion", false);
    }
  };

  const handleExportCSV = () => {
    const filtered = reviews.filter(r => {
      if (filterStatus === "replied" && !r.response) return false;
      if (filterStatus === "unreplied" && r.response) return false;
      return true;
    });
    
    const headers = "ID,Titre Bien,Note,Voyageur,Commentaire,Date,Réponse\n";
    const rows = filtered.map(r => 
      `"${r.id}","${r.booking.listing.title}",${r.rating},"${r.reviewer.firstName} ${r.reviewer.lastName}","${r.comment?.replace(/"/g, '""') || ''}","${r.createdAt}","${r.response?.replace(/"/g, '""') || ''}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `luxestay_avis_${tab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToastMessage("Export CSV généré avec succès !");
  };

  // Filter & Sort logic
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      // Search filter
      const q = search.toLowerCase();
      if (q) {
        const titleMatch = r.booking.listing.title.toLowerCase().includes(q);
        const nameMatch = `${r.reviewer.firstName} ${r.reviewer.lastName}`.toLowerCase().includes(q);
        const locMatch = `${r.booking.listing.delegation} ${r.booking.listing.governorate}`.toLowerCase().includes(q);
        if (!titleMatch && !nameMatch && !locMatch) return false;
      }

      // Star rating filter
      if (filterRating !== null && Math.floor(r.rating) !== filterRating) return false;

      // Status filter (only for received tab)
      if (tab === "received") {
        if (filterStatus === "replied" && !r.response) return false;
        if (filterStatus === "unreplied" && r.response) return false;
      }

      return true;
    });
  }, [reviews, search, filterRating, filterStatus, tab]);

  const sortedReviews = useMemo(() => {
    return [...filteredReviews].sort((a, b) => {
      if (sortBy === "rating_desc") return b.rating - a.rating;
      if (sortBy === "rating_asc") return a.rating - b.rating;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filteredReviews, sortBy]);

  const activeFiltersCount = (search ? 1 : 0) + (filterRating !== null ? 1 : 0) + (filterStatus !== "all" ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white transition-colors duration-200">
      
      {/* Header */}
      <TenantHeader />

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-4 z-[110] flex items-center gap-3 pl-4 pr-3 py-3.5 rounded-2xl text-xs font-bold shadow-2xl border backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300 ${
          toast.ok
            ? "bg-emerald-50/90 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800"
            : "bg-rose-50/90 dark:bg-rose-950/90 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800"
        }`}>
          {toast.ok ? <IoCheckmarkCircleOutline className="text-lg" /> : <IoAlertCircleOutline className="text-lg" />}
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-2 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
            <IoCloseOutline className="text-base" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
        
        {/* Title Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
              Tableau de bord Réputation
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
              Consultez les retours clients, optimisez vos réponses publiques et suivez en temps réel l'évolution de vos indicateurs de confiance.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition-colors"
            >
              <IoCloudDownloadOutline className="text-sm text-sky-600 dark:text-sky-400" />
              <span>Exporter CSV</span>
            </button>
            <button
              onClick={() => setShowNewReviewModal(true)}
              className="md:hidden flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow-sm"
            >
              <IoSparklesOutline className="text-sm" />
              <span>Nouveau</span>
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <StatsSection 
          reviews={reviews}
          userProfile={profile}
          userStats={stats}
          selectedFilterRating={filterRating}
          onSelectFilterRating={(star) => setFilterRating(star)}
        />

        {/* Tab Switcher */}
        <div className="flex gap-8 mb-8 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => {
              setTab("received");
              setFilterRating(null);
              setFilterStatus("all");
            }}
            className={`pb-3 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 ${
              tab === "received" 
                ? "border-sky-600 text-sky-600 dark:text-sky-400" 
                : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <span>Avis reçus</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              tab === "received" ? "bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
            }`}>
              {reviews.length}
            </span>
          </button>

          <button
            onClick={() => {
              setTab("given");
              setFilterRating(null);
            }}
            className={`pb-3 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 ${
              tab === "given" 
                ? "border-violet-600 text-violet-600 dark:text-violet-400" 
                : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <span>Avis donnés</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              tab === "given" ? "bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
            }`}>
              {0}
            </span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 mb-8 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shadow-sm">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par titre de bien, nom du voyageur, ville..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all"
            />
            {search && (
              <button 
                onClick={() => setSearch("")} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                Effacer
              </button>
            )}
          </div>

          {/* Quick Filter Pills & Sorting */}
          <div className="flex items-center gap-3 flex-wrap">
            
            {/* Status Filter (only for received tab) */}
            {tab === "received" && (
              <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 text-xs">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterStatus === "all" ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold shadow-sm" : "text-gray-500"}`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setFilterStatus("replied")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterStatus === "replied" ? "bg-white dark:bg-gray-900 text-sky-600 dark:text-sky-400 font-bold shadow-sm" : "text-gray-500"}`}
                >
                  Répondus
                </button>
                <button
                  onClick={() => setFilterStatus("unreplied")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterStatus === "unreplied" ? "bg-white dark:bg-gray-900 text-amber-600 dark:text-amber-400 font-bold shadow-sm" : "text-gray-500"}`}
                >
                  À Répondre
                </button>
              </div>
            )}

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="recent">Tri : Plus récents</option>
                <option value="rating_desc">Note : Décroissante (5 → 1)</option>
                <option value="rating_asc">Note : Croissante (1 → 5)</option>
              </select>
              <IoChevronDownOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
            </div>

          </div>

        </div>

        {/* Active Filter Indicators */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <IoFilterOutline /> Filtres actifs :
            </span>
            {search && (
              <span className="bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-xs font-semibold px-3 py-1 rounded-xl border border-sky-200 dark:border-sky-800 flex items-center gap-1.5">
                Recherche: &ldquo;{search}&rdquo;
                <button onClick={() => setSearch("")}><IoCloseOutline /></button>
              </span>
            )}
            {filterRating !== null && (
              <span className="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-semibold px-3 py-1 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                Note: {filterRating} Étoiles
                <button onClick={() => setFilterRating(null)}><IoCloseOutline /></button>
              </span>
            )}
            {filterStatus !== "all" && tab === "received" && (
              <span className="bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 text-xs font-semibold px-3 py-1 rounded-xl border border-violet-200 dark:border-violet-800 flex items-center gap-1.5">
                Statut: {filterStatus === "replied" ? "Répondus" : "En attente de réponse"}
                <button onClick={() => setFilterStatus("all")}><IoCloseOutline /></button>
              </span>
            )}
            <button
              onClick={() => {
                setSearch("");
                setFilterRating(null);
                setFilterStatus("all");
              }}
              className="text-xs font-semibold text-gray-500 hover:underline ml-2"
            >
              Réinitialiser tout
            </button>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-6">
          {loading ? (
            [...Array(3)].map((_, i) => <ReviewSkeleton key={i} />)
          ) : sortedReviews.length === 0 ? (
            <EmptyState tab={tab} onCreateReview={() => setShowNewReviewModal(true)} />
          ) : (
            sortedReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                tab={tab}
                onReply={handleReply}
                onReport={handleReport}
              />
            ))
          )}
        </div>

      </main>

      {/* Create New Review Modal */}
      {showNewReviewModal && (
        <ReviewModal
          isOpen={showNewReviewModal}
          onClose={() => setShowNewReviewModal(false)}
          onSubmit={handleCreateReview}
          booking={{ listing: { id: "", title: "" } }}
        />
      )}
    </div>
  );
}