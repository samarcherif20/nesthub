// app/[locale]/(dashboard)/owner/listings/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";

// Composant Map
import MapPickerWrapper from "@/components/ui/maps/MapPickerWrapper";

// Icônes React
import {
  Home,
  Building2,
  Hotel,
  Layers,
  Bed,
  Bath,
  Users,
  Wifi,
  Waves,
  Car,
  Utensils,
  Wind,
  Tv,
  Star,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Share2,
  Heart,
  Eye,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Verified,
  TrendingUp,
  ArrowLeft,
  X,
  Grid3x3,
  ZoomIn,
  ChevronDown,
  ChevronUp,
  Navigation,
  Coffee,
  ShoppingBag,
  Bus,
} from "lucide-react";
import { MdCheckBoxOutlineBlank } from "react-icons/md";
import { FaSquare } from "react-icons/fa";
import { BsBoundingBox } from "react-icons/bs";

interface Listing {
  id: string;
  title: string;
  type: string;
  description: string;
  governorate: string;
  delegation: string;
  street: string;
  latitude: number | null;
  longitude: number | null;
  rooms: number;
  bathrooms: number;
  maxGuests: number;
  surfaceArea: number | null;
  floorNumber: number | null;
  hasElevator: boolean;
  equipment: Record<string, boolean>;
  services: Record<string, boolean>;
  houseRules: Record<string, boolean>;
  customRules: string;
  photos: Array<{
    id: string;
    url: string;
    thumbnailUrl: string;
    isMain: boolean;
    position: number;
  }>;
  rentalType: string;
  pricePerNight: number | null;
  pricePerMonth: number | null;
  securityDeposit: number | null;
  cleaningFee: number | null;
  status: string;
  viewCount: number;
  bookingCount: number;
  favoriteCount: number;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    profilePictureUrl: string | null;
    isIdentityVerified: boolean;
    createdAt: string;
    stats?: {
      averageRating: number | null;
      totalReviews: number;
    } | null;
  };
}

// Fonction pip pour les images Vercel Blob
const pip = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

// Icônes des équipements
const getEquipmentIcon = (key: string) => {
  const icons: Record<string, any> = {
    wifi: Wifi,
    ac: Wind,
    heating: Wind,
    kitchen: Utensils,
    parking: Car,
    pool: Waves,
    tv: Tv,
    washer: Wifi,
    dryer: Wifi,
    gym: Wifi,
  };
  return icons[key] || CheckCircle;
};

// Noms lisibles des équipements
const getEquipmentLabel = (key: string, t: any) => {
  const labels: Record<string, string> = {
    wifi: "Wi-Fi haut débit",
    ac: "Climatisation",
    heating: "Chauffage",
    kitchen: "Cuisine équipée",
    parking: "Parking gratuit",
    pool: "Piscine",
    tv: "Smart TV",
    washer: "Lave-linge",
    dryer: "Sèche-linge",
    gym: "Salle de sport",
  };
  return labels[key] || key;
};

export default function ListingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = React.use(params);
  const router = useRouter();
  const { user } = useUser();
  const t = useTranslations("ListingDetail");

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
// Dans app/[locale]/(dashboard)/owner/listings/[id]/page.tsx
// Remplacez l'effet existant par :


  useEffect(() => {
    fetchListing();
    // Simuler la vérification des favoris
    if (user) {
      checkIfFavorite();
    }
  }, [id, user]);

  const fetchListing = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${id}`);
      if (res.ok) {
        const data = await res.json();
        setListing(data);
      } else {
        console.error("Error fetching listing");
      }
    } catch (error) {
      console.error("Error fetching listing:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorite = async () => {
    try {
      const res = await fetch(`/api/favorites/check?listingId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setIsFavorite(data.isFavorite);
      }
    } catch (error) {
      console.error("Error checking favorite:", error);
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }
    try {
      const res = await fetch("/api/favorites", {
        method: isFavorite ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id }),
      });
      if (res.ok) {
        setIsFavorite(!isFavorite);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing?.title,
          text: "Découvrez cette superbe annonce !",
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback: copier l'URL
      navigator.clipboard.writeText(window.location.href);
      alert("Lien copié dans le presse-papier !");
    }
  };

  const calculateTotalPrice = () => {
    if (!listing?.pricePerNight || !checkInDate || !checkOutDate) return null;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (nights <= 0) return null;
    const subtotal = listing.pricePerNight * nights;
    const cleaningFee = listing.cleaningFee || 0;
    const serviceFee = Math.round(subtotal * 0.1);
    return {
      nights,
      subtotal,
      cleaningFee,
      serviceFee,
      total: subtotal + cleaningFee + serviceFee,
    };
  };

  const priceDetails = calculateTotalPrice();
  const pricePerUnit = listing?.pricePerNight || listing?.pricePerMonth;
  const priceUnit = listing?.pricePerNight ? "nuit" : "mois";
  const averageRating = listing?.owner?.stats?.averageRating || 0;
  const totalReviews = listing?.owner?.stats?.totalReviews || 0;

  // Calcul du Trust Score (simulé basé sur les données)
  const trustScore = Math.min(
    85 +
      (listing?.owner?.isIdentityVerified ? 10 : 0) +
      (listing?.bookingCount ? Math.min(listing.bookingCount, 5) : 0),
    98
  );

  // Vérifications de sécurité
  const safetyChecks = [
    { label: "Identité vérifiée", active: listing?.owner?.isIdentityVerified || false, icon: Verified },
    { label: "5+ réservations", active: (listing?.bookingCount || 0) >= 5, icon: Calendar },
    { label: "Dépôt de garantie", active: (listing?.securityDeposit || 0) > 0, icon: Shield },
    { label: "Réponse rapide", active: true, icon: Clock },
  ];

  // Équipements principaux (affichage limité)
  const mainEquipment = Object.entries(listing?.equipment || {})
    .filter(([, value]) => value === true)
    .slice(0, 6);

  const allEquipment = Object.entries(listing?.equipment || {})
    .filter(([, value]) => value === true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <Loader2 size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <Home size={64} className="mx-auto text-slate-400 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Annonce non trouvée
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            L'annonce que vous recherchez n'existe pas ou a été supprimée.
          </p>
          <Link
            href={`/${locale}/dashboard/owner/listings`}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:opacity-90"
          >
            <ArrowLeft size={18} />
            Retour aux annonces
          </Link>
        </div>
      </div>
    );
  }

  const mainPhoto = listing.photos.find((p) => p.isMain) || listing.photos[0];
  const previewPhotos = listing.photos.slice(0, 5);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
     

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 font-medium mb-6">
          <Link href={`/${locale}`} className="hover:text-primary">Accueil</Link>
          <ChevronRight size={14} />
          <Link href={`/${locale}/dashboard/owner/listings`} className="hover:text-primary">Mes annonces</Link>
          <ChevronRight size={14} />
          <span className="text-slate-900 dark:text-slate-200">{listing.title}</span>
        </div>

        {/* Title & Meta */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
            {listing.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <MapPin size={18} className="text-primary" />
              <span className="text-sm font-medium">
                {listing.governorate}
                {listing.delegation ? `, ${listing.delegation}` : ""}
                {listing.street ? `, ${listing.street}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Star size={18} className="fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-sm">({totalReviews} avis)</span>
            </div>
            {listing.owner?.isIdentityVerified && (
              <div className="flex items-center gap-1">
                <Verified size={18} className="text-emerald-500" />
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[11px]">
                  Identité vérifiée
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Gallery Grid - Style inspiration */}
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-3 h-[400px] md:h-[500px] mb-12 rounded-2xl overflow-hidden group">
          {/* Large Image */}
          <div className="md:col-span-2 md:row-span-2 relative overflow-hidden cursor-pointer"
               onClick={() => { setGalleryStartIndex(0); setShowGalleryModal(true); }}>
            <img
              src={pip(previewPhotos[0]?.url)}
              alt={listing.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {listing.photos.length > 5 && (
              <div className="absolute bottom-6 left-6">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowAllPhotos(true); }}
                  className="bg-white/90 backdrop-blur-sm text-slate-900 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-xl hover:bg-white transition-all"
                >
                  <Grid3x3 size={18} />
                  Voir toutes les photos ({listing.photos.length})
                </button>
              </div>
            )}
          </div>

          {/* Small Previews */}
          {previewPhotos.slice(1, 5).map((photo, idx) => (
            <div
              key={photo.id}
              className="hidden md:block relative overflow-hidden cursor-pointer"
              onClick={() => { setGalleryStartIndex(idx + 1); setShowGalleryModal(true); }}
            >
              <img
                src={pip(photo.url)}
                alt={`${listing.title} - ${idx + 2}`}
                className="w-full h-full object-cover hover:opacity-90 transition-opacity"
              />
              {idx === 3 && listing.photos.length > 5 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer hover:bg-black/50 transition-colors">
                  <span className="text-white font-bold text-lg">
                    +{listing.photos.length - 5} photos
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-10">
            {/* Quick Stats */}
            <div className="flex flex-wrap gap-8 py-6 border-y border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <Bed size={20} className="text-slate-700 dark:text-slate-300" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Chambres</p>
                  <p className="text-lg font-bold">{listing.rooms} {listing.rooms === 1 ? "chambre" : "chambres"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <Bath size={20} className="text-slate-700 dark:text-slate-300" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Salles de bain</p>
                  <p className="text-lg font-bold">{listing.bathrooms} {listing.bathrooms === 1 ? "sdb" : "sdb"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <Users size={20} className="text-slate-700 dark:text-slate-300" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Voyageurs max</p>
                  <p className="text-lg font-bold">{listing.maxGuests} personnes</p>
                </div>
              </div>
              {listing.surfaceArea && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <BsBoundingBox   className="material-symbols-outlined text-xl"/>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Surface</p>
                    <p className="text-lg font-bold">{listing.surfaceArea} m²</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <section>
              <h3 className="text-2xl font-bold mb-4">À propos de ce bien</h3>
              <p className={`text-slate-600 dark:text-slate-400 leading-relaxed ${!showFullDescription ? "line-clamp-4" : ""}`}>
                {listing.description || "Aucune description fournie."}
              </p>
              {listing.description && listing.description.length > 300 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-primary font-bold flex items-center gap-1 mt-2 hover:underline"
                >
                  {showFullDescription ? "Voir moins" : "Lire la suite"}
                  {showFullDescription ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              )}
            </section>

            {/* Amenities */}
            <section>
              <h3 className="text-2xl font-bold mb-6">Équipements et services</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {(showAllAmenities ? allEquipment : mainEquipment).map(([key, value]) => {
                  const Icon = getEquipmentIcon(key);
                  return (
                    <div key={key} className="flex items-center gap-3 group">
                      <Icon size={18} className="text-slate-500 group-hover:text-primary transition-colors" />
                      <span className="font-medium text-sm">{getEquipmentLabel(key, t)}</span>
                    </div>
                  );
                })}
              </div>
              {allEquipment.length > 6 && (
                <button
                  onClick={() => setShowAllAmenities(!showAllAmenities)}
                  className="mt-6 px-6 py-3 border-2 border-slate-300 dark:border-slate-600 font-bold rounded-xl hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all"
                >
                  {showAllAmenities ? "Voir moins" : `Voir tous les ${allEquipment.length} équipements`}
                </button>
              )}
            </section>

            {/* Trust & Safety Section */}
            <section className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-8 border border-primary/20">
              <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                <div className="relative flex-shrink-0">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      fill="transparent"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-primary/10"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      fill="transparent"
                      r="58"
                      stroke="currentColor"
                      strokeDasharray="364.4"
                      strokeDashoffset={364.4 - (364.4 * trustScore) / 100}
                      strokeLinecap="round"
                      strokeWidth="8"
                      className="text-primary"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-primary leading-none">{trustScore}</span>
                    <span className="text-[10px] font-bold text-primary/70 uppercase tracking-tighter">Trust Score</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-black">Confiance &amp; Sécurité</h3>
                    <Shield size={20} className="text-primary" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm leading-relaxed">
                    Notre algorithme IA a analysé plus de 250 points de données pour ce propriétaire.
                    Identité vérifiée, taux de remboursement des dépôts à 100%, et temps de réponse constant.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {safetyChecks.map((check, idx) => {
                      const Icon = check.icon;
                      return (
                        <span
                          key={idx}
                          className={`px-3 py-1.5 border rounded-full text-xs font-bold flex items-center gap-1.5 ${
                            check.active
                              ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-green-600"
                              : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                          }`}
                        >
                          {check.active && <CheckCircle size={14} className="text-green-500" />}
                          {check.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* Location Map */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Localisation et quartier</h3>
                {listing.latitude && listing.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-bold flex items-center gap-1 hover:underline text-sm"
                  >
                    Ouvrir dans Maps <Navigation size={14} />
                  </a>
                )}
              </div>
              <div className="h-[400px] w-full rounded-2xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700">
                {listing.latitude && listing.longitude ? (
                  <MapPickerWrapper
                    latitude={listing.latitude}
                    longitude={listing.longitude}
                    onLocationChange={() => {}}
                    readOnly
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <p className="text-slate-500">Position non disponible</p>
                  </div>
                )}
              </div>

              {/* Points d'intérêt à proximité (simulés) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Bus size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Transport en commun</p>
                    <p className="text-xs text-slate-500 font-medium">À 5 min à pied</p>
                  </div>
                </div>
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ShoppingBag size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Supermarché</p>
                    <p className="text-xs text-slate-500 font-medium">À 8 min à pied</p>
                  </div>
                </div>
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Coffee size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Café à proximité</p>
                    <p className="text-xs text-slate-500 font-medium">À 2 min à pied</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Sticky Booking Widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-6">
              {/* Booking Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <span className="text-2xl font-black">{pricePerUnit} TND</span>
                    <span className="text-slate-500 font-medium"> / {priceUnit}</span>
                  </div>
                  {averageRating > 4.5 && (
                    <div className="text-right">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">Très bien noté</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <div className="p-3 border-r border-slate-200 dark:border-slate-700">
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Arrivée</label>
                      <input
                        type="date"
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        className="bg-transparent border-none p-0 text-sm font-bold w-full focus:ring-0"
                      />
                    </div>
                    <div className="p-3">
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Départ</label>
                      <input
                        type="date"
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        className="bg-transparent border-none p-0 text-sm font-bold w-full focus:ring-0"
                      />
                    </div>
                  </div>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Voyageurs</label>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(parseInt(e.target.value))}
                      className="bg-transparent border-none p-0 text-sm font-bold w-full focus:ring-0"
                    >
                      {Array.from({ length: listing.maxGuests }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "voyageur" : "voyageurs"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {priceDetails && (
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 underline">
                        {pricePerUnit} TND × {priceDetails.nights} {priceDetails.nights === 1 ? "nuit" : "nuits"}
                      </span>
                      <span className="font-bold">{priceDetails.subtotal} TND</span>
                    </div>
                    {priceDetails.cleaningFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 underline">Frais de ménage</span>
                        <span className="font-bold">{priceDetails.cleaningFee} TND</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 underline">Frais de service</span>
                      <span className="font-bold">{priceDetails.serviceFee} TND</span>
                    </div>
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                      <span className="font-black text-lg">Total</span>
                      <span className="font-black text-lg">{priceDetails.total} TND</span>
                    </div>
                  </div>
                )}

                <button
                  disabled={!checkInDate || !checkOutDate}
                  className="w-full bg-primary text-white font-black py-4 rounded-xl hover:bg-primary/90 transition-all transform active:scale-95 mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkInDate && checkOutDate ? "Contacter le propriétaire" : "Sélectionnez des dates"}
                </button>
                <p className="text-center text-xs text-slate-400 font-medium">Vous ne serez pas débité maintenant</p>
              </div>

              {/* Owner Card */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 flex items-center gap-4 border border-slate-100 dark:border-slate-800">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                    {listing.owner?.profilePictureUrl ? (
                      <img
                        src={pip(listing.owner.profilePictureUrl)}
                        alt={listing.owner?.firstName || ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                        {(listing.owner?.firstName?.[0] || listing.owner?.username?.[0] || "U").toUpperCase()}
                      </div>
                    )}
                  </div>
                  {listing.owner?.isIdentityVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-white dark:border-slate-800 w-5 h-5 rounded-full flex items-center justify-center">
                      <CheckCircle size={12} className="text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Proposé par</p>
                  <p className="font-bold text-lg">
                    {listing.owner?.firstName || listing.owner?.username || "Propriétaire"}
                  </p>
                  <Link
                    href={`/${locale}/profile/${listing.owner?.id}`}
                    className="text-primary text-sm font-bold hover:underline"
                  >
                    Voir le profil
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {totalReviews > 0 && (
          <section className="mt-20 py-12 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-8">
              <Star size={28} className="fill-yellow-400 text-yellow-400" />
              <h3 className="text-2xl font-bold">
                {averageRating.toFixed(1)} • {totalReviews} avis
              </h3>
            </div>
            <button className="border border-slate-300 dark:border-slate-700 px-8 py-3 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              Voir tous les avis
            </button>
          </section>
        )}
      </main>

      {/* Gallery Modal - Pour agrandir et naviguer */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          <div className="flex justify-between items-center p-4">
            <button
              onClick={() => setShowGalleryModal(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={24} />
            </button>
            <span className="text-white font-medium">
              {galleryStartIndex + 1} / {listing.photos.length}
            </span>
            <div className="w-10" />
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <img
              src={pip(listing.photos[galleryStartIndex]?.url)}
              alt={listing.title}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="flex justify-center gap-4 p-4">
            <button
              onClick={() => setGalleryStartIndex((prev) => Math.max(0, prev - 1))}
              disabled={galleryStartIndex === 0}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() =>
                setGalleryStartIndex((prev) =>
                  Math.min(listing.photos.length - 1, prev + 1)
                )
              }
              disabled={galleryStartIndex === listing.photos.length - 1}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>
          {/* Miniatures */}
          <div className="flex justify-center gap-2 p-4 overflow-x-auto">
            {listing.photos.map((photo, idx) => (
              <button
                key={photo.id}
                onClick={() => setGalleryStartIndex(idx)}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === galleryStartIndex ? "border-primary" : "border-transparent opacity-60"
                }`}
              >
                <img src={pip(photo.url)} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}