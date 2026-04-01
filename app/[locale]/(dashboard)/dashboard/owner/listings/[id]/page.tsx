// app/[locale]/(dashboard)/owner/listings/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";

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
} from "lucide-react";

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
  availability?: Array<{
    date: string;
    isAvailable: boolean;
    customPrice: number | null;
  }>;
}

// Fonction pip pour les images Vercel Blob
const pip = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

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
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchListing();
  }, [id]);

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

  const calculateTotalPrice = () => {
    if (!listing?.pricePerNight || !checkInDate || !checkOutDate) return null;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (nights <= 0) return null;
    const subtotal = listing.pricePerNight * nights;
    const cleaningFee = listing.cleaningFee || 0;
    const serviceFee = Math.round(subtotal * 0.1); // 10% de frais de service
    return {
      nights,
      subtotal,
      cleaningFee,
      serviceFee,
      total: subtotal + cleaningFee + serviceFee,
    };
  };

  const priceDetails = calculateTotalPrice();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "APARTMENT":
        return Building2;
      case "VILLA":
        return Home;
      case "STUDIO":
        return Hotel;
      case "DUPLEX":
        return Layers;
      default:
        return Building2;
    }
  };

  const getEquipmentIcon = (key: string) => {
    const icons: Record<string, any> = {
      wifi: Wifi,
      ac: Wind,
      heating: Wind,
      kitchen: Utensils,
      parking: Car,
      pool: Waves,
      tv: Tv,
    };
    return icons[key] || CheckCircle;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f8f7] dark:bg-[#10221b]">
        <Loader2 size={48} className="animate-spin text-[#0df293]" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f8f7] dark:bg-[#10221b]">
        <div className="text-center">
          <Home size={64} className="mx-auto text-slate-400 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {t("notFound.title")}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            {t("notFound.description")}
          </p>
          <Link
            href={`/${locale}/owner/listings`}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0df293] text-slate-900 rounded-xl font-semibold hover:opacity-90"
          >
            <ChevronLeft size={18} />
            {t("notFound.back")}
          </Link>
        </div>
      </div>
    );
  }

  const TypeIcon = getTypeIcon(listing.type);
  const mainPhoto = listing.photos.find((p) => p.isMain) || listing.photos[0];
  const pricePerUnit = listing.pricePerNight || listing.pricePerMonth;
  const priceUnit = listing.pricePerNight ? t("unit.night") : t("unit.month");
  const averageRating = listing.owner?.stats?.averageRating || 0;
  const totalReviews = listing.owner?.stats?.totalReviews || 0;

  return (
    <div className="min-h-screen bg-[#f5f8f7] dark:bg-[#10221b] ">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            href={`/${locale}/dashbard/owner/listings`}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">{t("backToListings")}</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handleFavorite}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Heart
                size={20}
                className={
                  isFavorite ? "fill-red-500 text-red-500" : "text-slate-500"
                }
              />
            </button>
            <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Share2 size={20} className="text-slate-500" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title & Location */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
            {listing.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <Star size={16} className="fill-yellow-400 text-yellow-400" />
              <span>{averageRating.toFixed(1)}</span>
              <span>
                ({totalReviews} {t("reviews")})
              </span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <MapPin size={16} />
              <span>
                {listing.governorate}
                {listing.delegation ? `, ${listing.delegation}` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Photo Gallery */}
        <section className="grid grid-cols-4 grid-rows-2 gap-3 h-[500px] mb-12 rounded-3xl overflow-hidden shadow-lg">
          {listing.photos.slice(0, 5).map((photo, idx) => {
            const isMain = idx === 0;
            return (
              <div
                key={photo.id}
                className={`relative group cursor-pointer overflow-hidden ${
                  isMain ? "col-span-2 row-span-2" : ""
                }`}
                onClick={() => setSelectedImage(idx)}
              >
                <img
                  src={pip(photo.url)}
                  alt={listing.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all" />
                {idx === 4 && listing.photos.length > 5 && (
                  <button
                    onClick={() => setShowAllPhotos(true)}
                    className="absolute bottom-6 right-6 bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-sm font-bold shadow-sm border border-slate-200/20 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">
                      grid_view
                    </span>
                    {t("viewAllPhotos", { count: listing.photos.length })}
                  </button>
                )}
              </div>
            );
          })}
        </section>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-12">
            {/* Host Info */}
            <div className="flex justify-between items-center pb-8 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {t("hostedBy", {
                    name: listing.owner?.firstName || listing.owner?.username,
                  })}
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                  {listing.maxGuests} {t("guests")} • {listing.rooms}{" "}
                  {t("bedrooms")} • {listing.bathrooms} {t("bathrooms")}
                </p>
              </div>
              <div className="relative">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                  {listing.owner?.profilePictureUrl ? (
                    <img
                      src={pip(listing.owner.profilePictureUrl)}
                      alt={listing.owner?.firstName || ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                      {(
                        listing.owner?.firstName?.[0] ||
                        listing.owner?.username?.[0] ||
                        "U"
                      ).toUpperCase()}
                    </div>
                  )}
                </div>
                {listing.owner?.isIdentityVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full border-2 border-white">
                    <CheckCircle size={12} className="fill-current" />
                  </div>
                )}
              </div>
            </div>

            {/* Unique Selling Points */}
            <div className="space-y-6">
              {listing.hasElevator && (
                <div className="flex gap-4">
                  <span className="material-symbols-outlined text-2xl text-slate-900">
                    elevator
                  </span>
                  <div>
                    <h4 className="font-bold">{t("elevator")}</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      {t("elevatorDesc")}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex gap-4">
                <MapPin size={24} className="text-slate-900" />
                <div>
                  <h4 className="font-bold">{t("greatLocation")}</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {t("greatLocationDesc")}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Calendar size={24} className="text-slate-900" />
                <div>
                  <h4 className="font-bold">{t("freeCancellation")}</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {t("freeCancellationDesc")}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="py-8 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold mb-4">{t("about")}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                {listing.description || t("noDescription")}
              </p>
            </div>

            {/* Amenities */}
            <div className="py-8 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold mb-6">{t("amenities")}</h3>
              <div className="grid grid-cols-2 gap-y-4">
                {Object.entries(listing.equipment || {})
                  .filter(([, value]) => value === true)
                  .slice(0, 8)
                  .map(([key]) => {
                    const Icon = getEquipmentIcon(key);
                    return (
                      <div key={key} className="flex items-center gap-4">
                        <Icon size={20} className="text-slate-600" />
                        <span className="text-slate-700 dark:text-slate-300">
                          {t(`equipment.${key}`)}
                        </span>
                      </div>
                    );
                  })}
              </div>
              {Object.keys(listing.equipment || {}).filter(
                (k) => listing.equipment?.[k],
              ).length > 8 && (
                <button className="mt-8 border border-slate-300 dark:border-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                  {t("showAllAmenities")}
                </button>
              )}
            </div>

            {/* Calendar */}
            <div className="py-8 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold mb-4">{t("availability")}</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                {t("selectDates")}
              </p>
              <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">
                    <ChevronLeft size={20} />
                  </button>
                  <span className="font-semibold">Juin 2024</span>
                  <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">
                    <ChevronRight size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                  {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map(
                    (day) => (
                      <span key={day}>{day}</span>
                    ),
                  )}
                </div>
                <div className="grid grid-cols-7 gap-2 text-center">
                  {Array.from({ length: 35 }, (_, i) => {
                    const day = i - 4;
                    const isAvailable =
                      day >= 1 && day <= 30 && day !== 10 && day !== 11;
                    return (
                      <div
                        key={i}
                        className={`p-3 rounded-full text-sm font-semibold cursor-pointer transition-colors ${
                          day < 1 || day > 30
                            ? "text-slate-300 dark:text-slate-600"
                            : !isAvailable
                              ? "bg-slate-200 dark:bg-slate-700 text-slate-400 line-through cursor-not-allowed"
                              : day >= 3 && day <= 7
                                ? "bg-[#0df293] text-slate-900"
                                : "hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        {day >= 1 && day <= 30 ? day : ""}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Booking Widget */}
          <div className="relative">
            <div className="sticky top-28 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_24px_-4px_rgba(24,28,34,0.1)] border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <span className="text-2xl font-extrabold">
                    {pricePerUnit} TND
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {" "}
                    / {priceUnit}
                  </span>
                </div>
                <div className="text-sm font-medium flex items-center gap-1">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  <span>{averageRating.toFixed(1)}</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
                <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-700">
                  <div className="p-3 border-r border-slate-200 dark:border-slate-700">
                    <label className="block text-[10px] font-bold uppercase text-slate-500">
                      {t("checkIn")}
                    </label>
                    <input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="w-full text-sm bg-transparent focus:outline-none"
                    />
                  </div>
                  <div className="p-3">
                    <label className="block text-[10px] font-bold uppercase text-slate-500">
                      {t("checkOut")}
                    </label>
                    <input
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full text-sm bg-transparent focus:outline-none"
                    />
                  </div>
                </div>
                <div className="p-3">
                  <label className="block text-[10px] font-bold uppercase text-slate-500">
                    {t("guests")}
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value))}
                    className="w-full text-sm bg-transparent focus:outline-none"
                  >
                    {Array.from(
                      { length: listing.maxGuests },
                      (_, i) => i + 1,
                    ).map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? t("guest") : t("guests")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                disabled={!checkInDate || !checkOutDate}
                className="w-full py-4 bg-gradient-to-r from-[#0df293] to-emerald-500 text-slate-900 rounded-full font-bold text-lg mb-6 shadow-lg shadow-[#0df293]/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("requestToBook")}
              </button>

              <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-6">
                {t("noChargeYet")}
              </p>

              {priceDetails && (
                <div className="space-y-4">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span className="underline">
                      {pricePerUnit} TND x {priceDetails.nights}{" "}
                      {priceDetails.nights === 1 ? t("night") : t("nights")}
                    </span>
                    <span>{priceDetails.subtotal} TND</span>
                  </div>
                  {priceDetails.cleaningFee > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span className="underline">{t("cleaningFee")}</span>
                      <span>{priceDetails.cleaningFee} TND</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span className="underline">{t("serviceFee")}</span>
                    <span>{priceDetails.serviceFee} TND</span>
                  </div>
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between font-extrabold text-lg">
                    <span>{t("total")}</span>
                    <span>{priceDetails.total} TND</span>
                  </div>
                </div>
              )}
            </div>

            {/* Report Button */}
            <div className="mt-8 p-6 flex items-center justify-center gap-4 bg-slate-100 dark:bg-slate-800 rounded-2xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <span className="material-symbols-outlined text-slate-500 text-2xl">
                flag
              </span>
              <span className="text-sm font-medium underline text-slate-600 dark:text-slate-400">
                {t("reportListing")}
              </span>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="mt-20 py-12 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-8">
            <Star size={24} className="fill-yellow-400 text-yellow-400" />
            <h3 className="text-2xl font-bold">
              {averageRating.toFixed(1)} • {totalReviews} {t("reviews")}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Placeholder for reviews */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                <div>
                  <h4 className="font-bold">Sami K.</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {t("reviewDate")}
                  </p>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {t("sampleReview")}
              </p>
            </div>
          </div>
          <button className="mt-12 border border-slate-300 dark:border-slate-700 px-8 py-3 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            {t("showAllReviews", { count: totalReviews })}
          </button>
        </section>
      </main>

      {/* All Photos Modal */}
      {showAllPhotos && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          <div className="flex justify-between items-center p-4">
            <button
              onClick={() => setShowAllPhotos(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <XCircle size={24} />
            </button>
            <span className="text-white font-medium">
              {selectedImage + 1} / {listing.photos.length}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <img
              src={pip(listing.photos[selectedImage]?.url)}
              alt={listing.title}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="flex justify-center gap-4 p-4">
            <button
              onClick={() => setSelectedImage((prev) => Math.max(0, prev - 1))}
              disabled={selectedImage === 0}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() =>
                setSelectedImage((prev) =>
                  Math.min(listing.photos.length - 1, prev + 1),
                )
              }
              disabled={selectedImage === listing.photos.length - 1}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
