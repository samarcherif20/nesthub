// app/[locale]/profile/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  IoLocationOutline,
  IoCalendarOutline,
  IoCheckmarkCircle,
  IoInformationCircleOutline,
  IoHeart,
  IoHeartOutline,
  IoBedOutline,
  IoBoatOutline,
  IoSquareOutline,
  IoChatbubbleOutline,
  IoShieldCheckmarkOutline,
  IoLanguageOutline,
  IoPawOutline,
  IoBriefcaseOutline,
  IoCreateOutline,
  IoStar,
  IoStarHalf,
  IoStarOutline,
  IoLogOutOutline,
  IoSettingsOutline,
  IoNotificationsOutline,
  IoHelpCircleOutline,
} from "react-icons/io5";
import { TenantHeader } from "@/components/ui/header/TenantHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const proxyImage = (url: string) => `/api/listings/image?url=${encodeURIComponent(url)}`;
const pipAvatar = (url: string) => `/api/users/avatar?url=${encodeURIComponent(url)}`;

function fmtDate(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function Stars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <IoStar key={`full-${i}`} className="text-amber-400 text-sm fill-amber-400" />
      ))}
      {hasHalfStar && <IoStarHalf className="text-amber-400 text-sm" />}
      {[...Array(emptyStars)].map((_, i) => (
        <IoStarOutline key={`empty-${i}`} className="text-gray-300 dark:text-gray-600 text-sm" />
      ))}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  bio?: string;
  governorate?: string;
  delegation?: string;
  profession?: string;
  spokenLanguages?: string[];
  role: string;
  createdAt: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isIdentityVerified: boolean;
}

interface UserStats {
  reliabilityScore: number;
  totalBookings: number;
  totalReviews: number;
  averageRating: number;
}

interface FavoriteListing {
  id: string;
  title: string;
  location: string;
  pricePerNight: number;
  pricePerMonth?: number;
  image?: string;
  bedrooms: number;
  bathrooms: number;
  surfaceArea: number;
  rating?: number;
}

// ─── Property Card ────────────────────────────────────────────────────────────
function PropertyCard({ listing, isFavorite, onToggleFavorite }: { 
  listing: FavoriteListing; 
  isFavorite: boolean; 
  onToggleFavorite: (id: string) => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const imageUrl = listing.image ? proxyImage(listing.image) : null;
  const price = listing.pricePerMonth || listing.pricePerNight;

  return (
    <div className="min-w-[280px] md:min-w-[320px] bg-white dark:bg-gray-900 rounded-2xl overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800">
      <div className="relative h-48 overflow-hidden">
        {imageUrl && !imgErr ? (
          <img
            src={imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center">
            <IoHeartOutline className="text-white/40 text-4xl" />
          </div>
        )}
        <button
          onClick={() => onToggleFavorite(listing.id)}
          className="absolute top-3 right-3 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-sm hover:scale-110 transition-transform"
        >
          {isFavorite ? (
            <IoHeart className="text-rose-500 text-base" />
          ) : (
            <IoHeartOutline className="text-slate-600 text-base" />
          )}
        </button>
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full">
          <span className="text-white text-xs font-bold">
            {listing.pricePerMonth ? `${price.toLocaleString()} DT / Mois` : `${price.toLocaleString()} DT / Nuit`}
          </span>
        </div>
        {listing.rating && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1">
            <IoStar className="text-amber-400 text-xs fill-amber-400" />
            <span className="text-xs font-bold text-gray-900">{listing.rating}</span>
          </div>
        )}
      </div>
      <div className="p-4 space-y-1.5">
        <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-1">
          {listing.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <IoLocationOutline className="text-xs" /> {listing.location}
        </p>
        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1"><IoBedOutline className="text-xs" /> {listing.bedrooms} lits</span>
          <span className="flex items-center gap-1"><IoBoatOutline className="text-xs" /> {listing.bathrooms} sdb</span>
          <span className="flex items-center gap-1"><IoSquareOutline className="text-xs" /> {listing.surfaceArea} m²</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { getToken } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [favorites, setFavorites] = useState<FavoriteListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarErr, setAvatarErr] = useState(false);

  useEffect(() => setMounted(true), []);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      
      const profileRes = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.user || data);
      }

      const statsRes = await fetch("/api/users/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats || data);
      }

      const favRes = await fetch("/api/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (favRes.ok) {
        const data = await favRes.json();
        setFavorites(data.favorites || []);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleToggleFavorite = async (listingId: string) => {
    try {
      const token = await getToken({ template: "my-app-template" });
      const isFav = favorites.some(f => f.id === listingId);
      
      const res = await fetch("/api/favorites/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ listingId, action: isFav ? "remove" : "add" }),
      });
      
      if (res.ok) {
        if (isFav) {
          setFavorites(prev => prev.filter(f => f.id !== listingId));
        } else {
          const newFav = await res.json();
          setFavorites(prev => [...prev, newFav.listing]);
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <TenantHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-73px)]">
          <LoadingSpinner size="lg" color="primary" variant="spinner" />
        </div>
      </div>
    );
  }

  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : "Utilisateur";
  const initials = profile ? `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}` : "U";
  const memberSince = profile ? fmtDate(profile.createdAt) : "";
  const location = [profile?.governorate, profile?.delegation].filter(Boolean).join(", ") || "Tunisie";
  const languages = profile?.spokenLanguages?.length ? profile.spokenLanguages.join(", ") : "Français, Anglais";
  const reliabilityScore = stats?.reliabilityScore ?? 85;
  const averageRating = stats?.averageRating ?? 4.8;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 transition-colors">
      <TenantHeader />
      
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        
        {/* Hero Profile Section */}
        <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-10 overflow-hidden shadow-xl border border-gray-100 dark:border-gray-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full -mr-48 -mt-48 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-sky-500/5 to-indigo-500/5 rounded-full -ml-48 -mb-48 blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white dark:border-gray-800 shadow-xl overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-600">
                {profile?.profilePictureUrl && !avatarErr ? (
                  <img
                    src={pipAvatar(profile.profilePictureUrl)}
                    alt={fullName}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarErr(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                    {initials}
                  </div>
                )}
              </div>
              <div className="absolute bottom-1 right-1 bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-md">
                <IoCheckmarkCircle className="text-sm" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white">{fullName}</h1>
                <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full">
                  {profile?.role === "TENANT" ? "Locataire" : profile?.role === "PROPERTY_OWNER" ? "Propriétaire" : "Membre"}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-500 dark:text-slate-400 mt-2">
                <span className="flex items-center gap-1"><IoLocationOutline className="text-sm" /> {location}</span>
                <span className="flex items-center gap-1"><IoCalendarOutline className="text-sm" /> Membre depuis {memberSince}</span>
                <div className="flex items-center gap-1"><Stars rating={averageRating} /> <span className="text-xs">({stats?.totalReviews ?? 0} avis)</span></div>
              </div>
            </div>

            {/* Edit Button */}
            <Link href="/fr/profile/edit">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 flex items-center gap-2">
                <IoCreateOutline className="text-base" />
                Modifier le profil
              </button>
            </Link>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
          
          {/* Left Column - About Me */}
          <div className="lg:col-span-8 space-y-6">
            {/* Bio */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-indigo-600 rounded-full" />
                À propos de moi
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {profile?.bio || "Je suis un voyageur passionné à la recherche de logements de qualité. Respectueux des lieux et communicatif, je prends soin de chaque propriété comme si elle était la mienne. Je suis particulièrement intéressé par les espaces lumineux et bien situés."}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Profession</p>
                  <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IoBriefcaseOutline className="text-sm text-indigo-500" /> {profile?.profession || "Architecte Designer"}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Langues</p>
                  <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IoLanguageOutline className="text-sm text-indigo-500" /> {languages}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Animal</p>
                  <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IoPawOutline className="text-sm text-indigo-500" /> Accepté (1 petit chien)</p>
                </div>
              </div>
            </div>

            {/* Favorite Properties Carousel */}
            {favorites.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">Ma collection</p>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Propriétés favorites</h2>
                  </div>
                  <Link href="/fr/favorites" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                    Voir tout <IoHeartOutline className="text-xs" />
                  </Link>
                </div>
                <div className="flex gap-5 overflow-x-auto pb-4 hide-scrollbar">
                  {favorites.slice(0, 6).map((listing) => (
                    <PropertyCard
                      key={listing.id}
                      listing={listing}
                      isFavorite={true}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column - Verified Info & Stats */}
          <div className="lg:col-span-4 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-800 shadow-sm">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalBookings ?? 0}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Séjours</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-800 shadow-sm">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalReviews ?? 0}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avis reçus</p>
              </div>
            </div>

            {/* Reliability Score */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Score de fiabilité</p>
                <IoShieldCheckmarkOutline className="text-indigo-500 text-lg" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{reliabilityScore}%</p>
              <div className="mt-3 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full transition-all duration-700" style={{ width: `${reliabilityScore}%` }} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                Basé sur vos interactions et réservations
              </p>
            </div>

            {/* Verified Info */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border-t-4 border-indigo-500/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Vérifications</h2>
              <ul className="space-y-4">
                <li className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                      <IoCheckmarkCircle className="text-sm" />
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Email</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {profile?.isEmailVerified ? "VÉRIFIÉ" : "EN ATTENTE"}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                      <IoCheckmarkCircle className="text-sm" />
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Téléphone</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {profile?.isPhoneVerified ? "VÉRIFIÉ" : "EN ATTENTE"}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                      <IoCheckmarkCircle className="text-sm" />
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Identité</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {profile?.isIdentityVerified ? "VÉRIFIÉ" : "EN ATTENTE"}
                  </span>
                </li>
              </ul>
              <div className="mt-5 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
                <p className="text-xs text-indigo-800 dark:text-indigo-300 font-medium flex items-center gap-1">
                  <IoInformationCircleOutline className="text-sm" />
                  Votre badge vérifié augmente votre taux de réponse des propriétaires de 45%.
                </p>
              </div>
            </div>

            {/* Contact Support */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <IoChatbubbleOutline className="text-white/80 text-xl" />
                <h3 className="font-bold">Besoin d'aide ?</h3>
              </div>
              <p className="text-xs text-white/80 mb-4">Notre équipe est disponible 24h/24 pour vous assister.</p>
              <button className="w-full bg-white/20 hover:bg-white/30 rounded-xl py-2 text-sm font-semibold transition-all">
                Contacter le support
              </button>
            </div>
          </div>
        </div>
        
        <div className="h-8" />
      </main>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}