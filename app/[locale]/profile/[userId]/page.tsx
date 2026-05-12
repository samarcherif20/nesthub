"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  ChevronRight,
  Crown,
  Heart,
  History,
  Home,
  Share2,
  ShieldCheck,
  Star,
  Sun,
  UserCheck,
  MapPin,
  Calendar,
  MessageCircle,
  Phone,
  Mail,
  Award,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
} from "lucide-react";

// Types
interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  profilePictureUrl: string | null;
  bio: string;
  memberSince: string;
  responseRate: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isEliteHost: boolean;
  location: string;
  languages: string[];
}

interface Listing {
  id: string;
  title: string;
  location: string;
  guests: number;
  bedrooms: number;
  price: number;
  rating: number;
  imageUrl: string;
  liked: boolean;
}

const pipAvatar = (url: string) => `/api/users/avatar?url=${encodeURIComponent(url)}`;
const pipImage = (url: string) => `/api/listings/image?url=${encodeURIComponent(url)}`;

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "info"; message: string } | null>(null);
  const [isDark, setIsDark] = useState(false);

  // Détecter le thème
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setIsDark(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(isDark ? "dark" : "light");
  }, [isDark]);

  // Charger les données du profil
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Récupérer le profil public
        const profileRes = await fetch(`/api/users/public/${userId}`);
        if (!profileRes.ok) {
          throw new Error("Profil non trouvé");
        }
        const profileData = await profileRes.json();
        setProfile(profileData.user);

        // Récupérer les annonces de l'utilisateur
        const listingsRes = await fetch(`/api/users/public/${userId}/listings`);
        if (listingsRes.ok) {
          const listingsData = await listingsRes.json();
          setListings(listingsData.listings || []);
        }
      } catch (err) {
        setError("Impossible de charger le profil");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  // Effet pour le toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToast({ type: "success", message: "Lien du profil copié !" });
    } catch {
      setToast({ type: "info", message: "Partage disponible sur les navigateurs supportés" });
    }
  };

  const handleContact = () => {
    setToast({ type: "info", message: "Connectez-vous pour contacter cet hôte" });
  };

  const handleLike = (listingId: string) => {
    setListings(prev => prev.map(l => 
      l.id === listingId ? { ...l, liked: !l.liked } : l
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Profil non trouvé</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{error || "L'utilisateur que vous recherchez n'existe pas."}</p>
          <Link href="/" className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  const trustItems = [
    {
      title: "Identité vérifiée",
      description: "Confirmée via une pièce d'identité officielle",
      color: "text-emerald-600 dark:text-emerald-400",
      verified: profile.isVerified,
    },
    {
      title: "Email & téléphone confirmés",
      description: "Communications sécurisées sur Nesthub",
      color: "text-emerald-600 dark:text-emerald-400",
      verified: true,
    },
    {
      title: profile.isEliteHost ? "Hôte Concierge" : "Hôte Elite",
      description: profile.isEliteHost 
        ? "Recommandé par nos curateurs de luxe méditerranéen"
        : "Hôte vérifié avec d'excellentes évaluations",
      color: "text-indigo-600 dark:text-indigo-400",
      verified: true,
    },
  ];

  const interests = [
    { label: "Architecture", icon: Home },
    { label: "Vie côtière", icon: Sun },
    { label: "Gastronomie", icon: Crown },
    { label: "Patrimoine", icon: History },
  ];

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
        {/* Toast notification */}
        {toast && (
          <div className="fixed top-24 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className={`rounded-full px-5 py-3 text-sm font-semibold shadow-lg backdrop-blur-xl ${
              toast.type === "success"
                ? "bg-emerald-500 text-white"
                : "bg-indigo-600 text-white"
            }`}>
              {toast.message}
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="relative h-[400px] overflow-hidden">
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-50 via-transparent to-transparent dark:from-slate-950" />
          <div className="absolute inset-0 bg-black/20 z-5" />
          <img
            className="h-full w-full object-cover"
            alt="Mediterranean hero"
            src="https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1600&h=600&fit=crop"
          />
          <div className="absolute bottom-0 left-0 z-20 flex w-full flex-col items-end justify-between gap-6 px-8 pb-8 md:flex-row md:px-12">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-lg md:h-40 md:w-40 dark:border-slate-800">
                  {profile.profilePictureUrl ? (
                    <img
                      className="h-full w-full object-cover"
                      alt={profile.firstName}
                      src={pipAvatar(profile.profilePictureUrl)}
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <span className="text-4xl text-white">
                        {profile.firstName?.[0]}{profile.lastName?.[0]}
                      </span>
                    </div>
                  )}
                </div>
                {profile.isVerified && (
                  <div className="absolute bottom-2 right-2 flex items-center justify-center rounded-full bg-indigo-600 p-2 text-white shadow-lg dark:bg-indigo-500">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                )}
              </div>

              <div className="mb-4 max-w-xl">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  <span className="flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                    <UserCheck className="h-3 w-3" /> 
                    {profile.isEliteHost ? "Hôte Concierge" : "Hôte Elite"}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {profile.bio || `Passionné par l'architecture méditerranéenne et l'art de recevoir.`}
                </p>
              </div>
            </div>

            <div className="mb-4 flex gap-4">
              <button
                onClick={handleShare}
                className="rounded-full border border-indigo-600 px-6 py-3 font-semibold text-indigo-600 transition-all hover:bg-indigo-50 dark:border-indigo-400 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
              >
                <span className="inline-flex items-center gap-2">
                  <Share2 className="h-4 w-4" /> Partager
                </span>
              </button>
              <button
                onClick={handleContact}
                className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                Contacter
              </button>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="grid grid-cols-1 gap-12 px-8 py-16 lg:grid-cols-12 lg:px-12">
          {/* Sidebar */}
          <div className="space-y-8 lg:col-span-4">
            {/* Stats Card */}
            <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-slate-900/50">
              <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Informations</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <span className="text-sm text-slate-500">Note</span>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-900 dark:text-white">{profile.rating}</span>
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-xs text-slate-400">({profile.reviewCount})</span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <span className="text-sm text-slate-500">Membre depuis</span>
                  <span className="font-medium text-slate-900 dark:text-white">{profile.memberSince}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <span className="text-sm text-slate-500">Taux de réponse</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{profile.responseRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Localisation</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{profile.location || "Tunisie"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Langues */}
            {profile.languages && profile.languages.length > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-slate-900/50">
                <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Langues parlées</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map((lang) => (
                    <span key={lang} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Trust & Safety */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Confiance & Sécurité</h3>
              <div className="space-y-3">
                {trustItems.map((item) => (
                  <div key={item.title} className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900/50">
                    <ShieldCheck className={`mt-0.5 h-5 w-5 ${item.color}`} />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-12 lg:col-span-8">
            {/* About Section */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">À propos</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {profile.bio || `${profile.firstName} est un hôte passionné qui aime partager les merveilles de la Tunisie avec les voyageurs du monde entier. 
                Avec plusieurs années d'expérience dans l'hôtellerie de luxe, ${profile.firstName} met un point d'honneur à offrir une expérience unique à chaque visiteur.`}
              </p>
            </div>

            {/* Interests */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Centres d'intérêt</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {interests.map(({ label, icon: Icon }) => (
                  <div key={label} className="rounded-xl bg-white p-4 text-center shadow-sm dark:bg-slate-900/50">
                    <Icon className="mx-auto mb-2 h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Listings Section */}
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Annonces actives</h2>
                {listings.length > 3 && (
                  <button className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:gap-2 transition-all dark:text-indigo-400">
                    Voir tout <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>

              {listings.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow-sm dark:bg-slate-900/50">
                  <Home className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">Aucune annonce active pour le moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {listings.slice(0, 4).map((listing) => (
                    <div key={listing.id} className="group cursor-pointer">
                      <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl shadow-md">
                        <img
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          alt={listing.title}
                          src={listing.imageUrl ? pipImage(listing.imageUrl) : "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop"}
                        />
                        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 shadow-sm backdrop-blur-sm dark:bg-slate-900/80">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">{listing.rating}</span>
                        </div>
                      </div>
                      <h4 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">{listing.title}</h4>
                      <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                        {listing.location} • {listing.guests} voyageurs • {listing.bedrooms} chambres
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                          {listing.price.toLocaleString()} <span className="text-sm font-normal text-slate-400">TND / nuit</span>
                        </p>
                        <button
                          onClick={() => handleLike(listing.id)}
                          className="text-slate-300 transition-colors hover:text-red-500 dark:text-slate-600"
                        >
                          <Heart className={`h-5 w-5 ${listing.liked ? "fill-red-500 text-red-500" : ""}`} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-auto flex flex-col items-center justify-between gap-6 border-t border-slate-200 bg-white px-8 py-8 text-xs uppercase tracking-widest text-slate-400 md:flex-row lg:px-12 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="text-center md:text-left">
            © 2024 Nesthub. Plateforme de confiance pour les locations de luxe.
          </div>
          <div className="flex flex-wrap gap-6">
            <Link href="/terms" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
              Conditions
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
              Confidentialité
            </Link>
            <Link href="/support" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
              Aide
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}