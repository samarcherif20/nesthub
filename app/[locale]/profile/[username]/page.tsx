"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useTheme } from "next-themes";
import Link from "next/link";
import {
  IoChatbubbleOutline,
  IoCheckmarkCircleOutline,
  IoChevronForwardOutline,
  IoCloseOutline,
  IoGlobeOutline,
  IoHomeOutline,
  IoLocationOutline,
  IoMailOutline,
  IoShieldCheckmarkOutline,
  IoStar,
  IoTimeOutline,
  IoPersonOutline,
  IoCalendarOutline,
  IoPeopleOutline,
} from "react-icons/io5";
import { FaGlobe, FaMedal, FaUserCheck, FaBuilding } from "react-icons/fa";
import { useIdentityVerification } from "@/hooks/useIdentityVerification";
import { IdentityVerificationModal } from "@/components/ui/IdentityVerificationModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// ============================================
// TYPES
// ============================================

type Listing = {
  id: string;
  title: string;
  location: string;
  image: string | null;
  images?: string[];
  guests: number;
  bedrooms: number;
  baths: number;
  rating: number;
  priceDisplay: string;
  pricePerNight: number;
  pricePerMonth: number;
  rentalType: string;
  summary: string;
  ownerId?: string;
};

type Review = {
  id: string;
  author: string;
  role: string;
  avatar?: string;
  rating: number;
  date: string;
  comment: string;
};

type ProfileData = {
  id: string;
  username: string;
  role: string;
  roleDisplay: string;
  roleBadgeText: string;
  location: string;
  bio: string;
  memberSince: Date;
  profession: string | null;
  languages: string[];
  acceptsForeigners: boolean;
  isIdentityVerified: boolean;
  isEmailVerified: boolean;
  phoneVerified: boolean;
  profilePictureUrl: string | null;
  stats: {
    reliabilityScore: number;
    trustLabel: string;
    totalReviews: number;
    averageRating: number;
    responseRate: number;
    responseTime: string;
    totalListings: number;
  };
};

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function fmtDate(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getImageUrl(url: string) {
  if (!url) return "";
  if (url.includes("/api/listings/image")) return url;
  return `/api/listings/image?url=${encodeURIComponent(url)}`;
}

function getAvatarUrl(url: string) {
  if (!url) return "";
  if (url.includes("/api/listings/image")) return url;
  return `/api/listings/image?url=${encodeURIComponent(url)}`;
}

// ============================================
// COMPOSANTS UI
// ============================================

const motionContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const motionItem = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
    },
  },
};

function SectionHeader({
  eyebrow,
  title,
  description,
  dark,
}: {
  eyebrow: string;
  title: string;
  description: string;
  dark: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
        {eyebrow}
      </p>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
          {title}
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base">
          {description}
        </p>
      </div>
    </div>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => (
        <IoStar
          key={index}
          className={
            index < Math.round(rating)
              ? "text-amber-400"
              : "text-slate-300 dark:text-slate-600"
          }
        />
      ))}
    </div>
  );
}

function StatBlock({
  label,
  value,
  icon,
  dark,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  dark: boolean;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700">
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function TrustMetric({
  label,
  value,
  suffix,
  accent,
  dark,
}: {
  label: string;
  value: string | number;
  suffix: string;
  accent: string;
  dark: boolean;
}) {
  return (
    <div className="grid gap-4 bg-white dark:bg-slate-900 p-6 sm:grid-cols-[auto_1fr] sm:items-end sm:justify-between sm:p-8">
      <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${accent}`} />
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <div className="flex items-end gap-2">
          <p className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            {value}
          </p>
          {suffix && (
            <span className="pb-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
              {suffix}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailChip({
  icon,
  label,
  dark,
}: {
  icon: ReactNode;
  label: string;
  dark: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 shadow-sm">
      {icon}
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </span>
    </div>
  );
}

function EmptyState({
  type,
  dark,
}: {
  type: "listings" | "reviews";
  dark: boolean;
}) {
  if (type === "listings") {
    return (
      <div className="flex flex-col items-center justify-center rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <FaBuilding className="text-2xl text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Aucune annonce pour le moment
        </h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Cet hôte n'a pas encore publié d'annonces.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <IoStar className="text-2xl text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        Aucun avis pour le moment
      </h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Soyez le premier à laisser un avis !
      </p>
    </div>
  );
}

// ============================================
// HERO IMAGE
// ============================================

function HeroImage({
  listings,
  profilePictureUrl,
  username,
  dark,
}: {
  listings: Listing[];
  profilePictureUrl: string | null;
  username: string;
  dark: boolean;
}) {
  const getHeroImageUrl = () => {
    if (listings.length > 0 && listings[0]?.image) {
      return getImageUrl(listings[0].image);
    }
    if (profilePictureUrl) {
      return getAvatarUrl(profilePictureUrl);
    }
    return null;
  };

  const heroUrl = getHeroImageUrl();

  if (!heroUrl) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-950 dark:to-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/92 via-slate-950/72 to-slate-950/28" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <img
        src={heroUrl}
        alt={`Photo de couverture de @${username}`}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/92 via-slate-950/72 to-slate-950/28" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.24),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.18),transparent_30%)]" />
    </div>
  );
}

// ============================================
// AVATAR
// ============================================

function ProfileAvatar({
  profilePictureUrl,
  username,
  isVerified,
  dark,
}: {
  profilePictureUrl: string | null;
  username: string;
  isVerified: boolean;
  dark: boolean;
}) {
  return (
    <div className="relative h-20 w-20 overflow-hidden rounded-full border border-white/20 shadow-2xl shadow-slate-950/30 ring-4 ring-white/12 sm:h-24 sm:w-24">
      {profilePictureUrl ? (
        <img
          src={getAvatarUrl(profilePictureUrl)}
          alt={`@${username}`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white">
          {username?.charAt(0)?.toUpperCase() || "U"}
        </div>
      )}
      {isVerified && (
        <div className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-emerald-400 text-slate-950 shadow-lg">
          <IoShieldCheckmarkOutline className="text-sm" />
        </div>
      )}
    </div>
  );
}

// ============================================
// INFO REQUEST MODAL
// ============================================

function InfoRequestModal({
  isOpen,
  onClose,
  onSend,
  listingTitle,
  username,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSend: (
    checkIn: string,
    checkOut: string,
    guests: number,
    message: string,
  ) => void;
  listingTitle: string;
  username: string;
  isLoading: boolean;
}) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Demander une information
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          >
            <IoCloseOutline className="text-xl text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Envoyer une demande à{" "}
            <span className="font-semibold">@{username}</span> concernant "
            {listingTitle}"
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date d'arrivée
              </label>
              <input
                type="date"
                value={checkIn}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de départ
              </label>
              <input
                type="date"
                value={checkOut}
                min={checkIn || new Date().toISOString().split("T")[0]}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre de voyageurs
            </label>
            <input
              type="number"
              value={guests}
              min={1}
              max={20}
              onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message (optionnel)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder={`Bonjour @${username}, je suis intéressé par votre logement...`}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-200 transition"
            >
              Annuler
            </button>
            <button
              onClick={() => onSend(checkIn, checkOut, guests, message)}
              disabled={!checkIn || !checkOut || isLoading}
              className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {isLoading ? "Envoi..." : "Envoyer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SUCCESS MODAL
// ============================================

function SuccessModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
        <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto mb-3">
          <IoCheckmarkCircleOutline className="text-2xl text-emerald-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Demande envoyée !
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Votre demande d'information a été transmise à l'hôte.
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-200 transition"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

// ============================================
// LISTING CARD - bouton "Demander des infos" au-dessus du prix
// ============================================

function ListingCard({
  listing,
  onInfoRequest,
  dark,
}: {
  listing: Listing;
  username: string;
  onInfoRequest: (listing: Listing) => void;
  dark: boolean;
}) {
  const imageUrl = listing?.image ? getImageUrl(listing.image) : null;

  return (
    <motion.div
      variants={motionItem}
      whileHover={{ y: -4 }}
      className="group flex overflow-hidden rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left shadow-sm transition hover:shadow-md"
    >
      <div className="relative h-56 w-40 shrink-0 sm:h-60 sm:w-48">
        <Link href={`/listings/${listing.id}`} className="block h-full">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={listing.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
              <FaBuilding className="text-4xl text-slate-400 dark:text-slate-500" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 to-transparent" />
        </Link>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
        <Link href={`/listings/${listing.id}`} className="block">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  {listing.location}
                </p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-white sm:text-xl">
                  {listing.title}
                </h3>
              </div>
              <div className="rounded-full bg-amber-50 dark:bg-amber-950/50 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                {listing.priceDisplay}
              </div>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
              {listing.summary}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <span>{listing.guests} voyageurs</span>
            <span>
              {listing.bedrooms} chambre{listing.bedrooms > 1 ? "s" : ""}
            </span>
            <span>
              {listing.baths} salle{listing.baths > 1 ? "s" : ""} de bain
            </span>
          </div>
        </Link>

        {/* ✅ BOUTON DEMANDER DES INFOS - juste au-dessus du prix */}
        <button
          onClick={() => onInfoRequest(listing)}
          className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
        >
          Demander une information
        </button>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <StarRow rating={listing.rating} />
            <span>{listing.rating.toFixed(2)}</span>
          </div>
          <Link
            href={`/listings/${listing.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white"
          >
            Voir détails
            <IoChevronForwardOutline className="text-base text-slate-400 dark:text-slate-500" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
// ============================================
// REVIEW AVATAR
// ============================================

function ReviewAvatar({
  avatar,
  author,
  dark,
}: {
  avatar?: string;
  author: string;
  dark: boolean;
}) {
  return (
    <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700">
      {avatar ? (
        <img
          src={getAvatarUrl(avatar)}
          alt={author}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-sm font-semibold text-white">
          {author.charAt(0)}
        </div>
      )}
    </div>
  );
}

// ============================================
// BACKGROUND
// ============================================

function Background({ dark }: { dark: boolean }) {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none transition-colors duration-700">
      <div
        className={`absolute inset-0 ${dark ? "bg-[#070b14]" : "bg-gradient-to-br from-sky-50 via-white to-indigo-50"}`}
      />
      <motion.div
        className={`absolute w-[600px] h-[600px] rounded-full blur-[120px] ${dark ? "opacity-20" : "opacity-[0.07]"}`}
        style={{
          background: dark
            ? "radial-gradient(circle,#4f46e5,#7c3aed,transparent)"
            : "radial-gradient(circle,#818cf8,#a78bfa,transparent)",
          top: "-10%",
          right: "-5%",
        }}
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={`absolute w-[500px] h-[500px] rounded-full blur-[100px] ${dark ? "opacity-15" : "opacity-[0.05]"}`}
        style={{
          background: dark
            ? "radial-gradient(circle,#0ea5e9,#6366f1,transparent)"
            : "radial-gradient(circle,#60a5fa,#818cf8,transparent)",
          bottom: "-15%",
          left: "-10%",
        }}
        animate={{
          x: [0, -30, 40, 0],
          y: [0, 40, -20, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      {dark && (
        <>
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: "128px",
            }}
          />
        </>
      )}
    </div>
  );
}

// ============================================
// PAGE PRINCIPALE
// ============================================

export default function HostProfilePage() {
  const params = useParams();
  const username = params?.username as string;
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const isDark = !mounted
    ? false
    : theme === "dark" || (theme === "system" && systemTheme === "dark");
  const dark = isDark && mounted;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Info request states
  const [infoRequestLoading, setInfoRequestLoading] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [pendingInfoRequest, setPendingInfoRequest] = useState(false);

  const {
    checkCanPerformAction,
    handleVerificationComplete: onVerificationComplete,
  } = useIdentityVerification();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      if (!username) return;

      setIsLoading(true);
      try {
        const res = await fetch(`/api/users/profile/${username}`);
        if (!res.ok) throw new Error("Profil non trouvé");
        const data = await res.json();

        setProfile(data.profile);
        setListings(data.listings || []);
        setReviews(data.reviews || []);
        setIsHost(data.isHost);
      } catch (error) {
        console.error("Erreur:", error);
        setToast("Profil non trouvé");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [username]);

  useEffect(() => {
    if (!toast) return;
    const timeoutId = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const memberSince = useMemo(() => {
    if (!profile?.memberSince) return "";
    return formatDistanceToNow(new Date(profile.memberSince), {
      locale: fr,
      addSuffix: true,
    });
  }, [profile?.memberSince]);

  const sendInfoRequest = async (
    checkIn: string,
    checkOut: string,
    guests: number,
    message: string,
  ) => {
    if (!selectedListing) return;

    setInfoRequestLoading(true);
    try {
      const response = await fetch("/api/info-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: selectedListing.id,
          message:
            message ||
            `Séjour du ${fmtDate(checkIn)} au ${fmtDate(checkOut)} pour ${guests} personne(s).\n\nJe suis intéressé(e) par votre logement, pourriez-vous me donner plus d'informations ?`,
          checkIn,
          checkOut,
          guests: guests,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setShowInfoModal(false);
        setShowSuccessModal(true);
        setSelectedListing(null);
        setToast("Demande envoyée avec succès !");
      } else {
        setToast(data.error || "Une erreur est survenue");
      }
    } catch {
      setToast("Erreur de connexion");
    } finally {
      setInfoRequestLoading(false);
    }
  };

  const openInfoRequest = (listing: Listing) => {
    setSelectedListing(listing);

    // Vérifier si l'utilisateur peut envoyer une demande
    const { canProceed, needsVerification } =
      checkCanPerformAction("make_booking");

    if (!canProceed || needsVerification) {
      setPendingInfoRequest(true);
      setShowVerificationModal(true);
      return;
    }

    setShowInfoModal(true);
  };

  const handleVerificationComplete = async () => {
    setShowVerificationModal(false);
    if (pendingInfoRequest && selectedListing) {
      setPendingInfoRequest(false);
      setShowInfoModal(true);
    }
    await onVerificationComplete();
  };

  const handleCloseVerificationModal = () => {
    setShowVerificationModal(false);
    setPendingInfoRequest(false);
    setSelectedListing(null);
  };

  if (!mounted || isLoading) {
  return (
    <LoadingSpinner
      fullScreen
      text="Chargement du profil..."
      size="lg"
      color="primary"
      variant="spinner"
      speed="normal"
    />
  )
}

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <IoPersonOutline className="text-6xl text-slate-400 dark:text-slate-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            Profil non trouvé
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
            L'utilisateur "{username}" n'existe pas
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-700 ${dark ? "text-white" : "text-gray-900"}`}
    >
      <Background dark={dark} />

      {/* HEADER */}
      <header className="relative isolate overflow-hidden bg-slate-950 text-white">
        <HeroImage
          listings={listings}
          profilePictureUrl={profile.profilePictureUrl}
          username={profile.username}
          dark={dark}
        />

        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm">
              <FaMedal className="text-base sm:text-lg text-emerald-300" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold tracking-wide">
                @{profile.username}
              </p>
              <p className="text-[10px] sm:text-xs text-white/65">
                {profile.isIdentityVerified
                  ? "Identité vérifiée"
                  : "Profil vérifié"}
              </p>
            </div>
          </div>
        </div>

        <motion.section
          variants={motionContainer}
          initial="hidden"
          animate="show"
          className="relative mx-auto flex min-h-[70vh] sm:min-h-[86vh] max-w-7xl flex-col justify-end px-4 sm:px-6 pb-12 sm:pb-16 pt-10 lg:pb-24"
        >
          <motion.div
            variants={motionItem}
            className="max-w-3xl space-y-6 sm:space-y-8"
          >
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-white/80">
              <div className="flex items-center gap-1 sm:gap-2">
                <IoLocationOutline className="text-sm sm:text-base text-emerald-300" />
                <span>{profile.location}</span>
              </div>
              {profile.isIdentityVerified && profile.isEmailVerified && (
                <div className="flex items-center gap-1 sm:gap-2">
                  <IoCheckmarkCircleOutline className="text-sm sm:text-base text-sky-300" />
                  <span>Identité et contact vérifiés</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 sm:gap-5">
              <ProfileAvatar
                profilePictureUrl={profile.profilePictureUrl}
                username={profile.username}
                isVerified={profile.isIdentityVerified}
                dark={dark}
              />

              <div className="space-y-1 sm:space-y-2">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-white/55">
                  {profile.roleBadgeText}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-white/80">
                  <span className="rounded-full bg-white/10 px-2 py-0.5 sm:px-3 sm:py-1 backdrop-blur-sm">
                    Réponse rapide
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 sm:px-3 sm:py-1 backdrop-blur-sm">
                    {isHost ? "Hôte expérimenté" : "Membre actif"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-5">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white break-all">
                @{profile.username}
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl leading-7 sm:leading-8 text-white/80">
                {profile.roleDisplay}. Une présence rassurante, des services de
                qualité et une relation simple.
              </p>
            </div>

            <p className="text-sm sm:text-base leading-6 sm:leading-7 text-white/70">
              {profile.bio}
            </p>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              {isHost && listings.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    document
                      .getElementById("featured-listings")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      });
                  }}
                  className="inline-flex items-center gap-1 sm:gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/12"
                >
                  Voir ses annonces
                  <IoChevronForwardOutline className="text-sm sm:text-base" />
                </button>
              )}
            </div>
          </motion.div>
        </motion.section>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-24">
        <div className="mx-auto max-w-7xl space-y-12 sm:space-y-16 lg:space-y-20">
          {/* SECTION À PROPOS */}
          <motion.section
            variants={motionContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-10%" }}
            className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14"
          >
            <motion.div
              variants={motionItem}
              className="space-y-5 sm:space-y-6"
            >
              <SectionHeader
                eyebrow="À propos"
                title="Un profil qui inspire confiance avant même le premier message"
                description="La page met en avant l'essentiel sans surcharger la lecture: une bio claire, des infos utiles et des signaux de confiance lisibles en un coup d'œil."
                dark={dark}
              />
              <div className="space-y-4 sm:space-y-5 text-slate-700 dark:text-slate-300">
                <p className="text-sm sm:text-base leading-6 sm:leading-7">
                  {profile.bio}
                </p>
                <p className="text-xs sm:text-sm leading-5 sm:leading-6 text-slate-600 dark:text-slate-400">
                  @{profile.username} s'engage à offrir une expérience fluide,
                  avec une communication rapide et une attention aux détails.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={motionItem}
              className="space-y-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5 sm:p-6 shadow-sm backdrop-blur-sm"
            >
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <StatBlock
                  label="Membre depuis"
                  value={memberSince}
                  icon={<IoTimeOutline className="text-sky-500" />}
                  dark={dark}
                />
                {profile.profession && (
                  <StatBlock
                    label="Profession"
                    value={profile.profession}
                    icon={<IoHomeOutline className="text-emerald-500" />}
                    dark={dark}
                  />
                )}
                <StatBlock
                  label="Langues"
                  value={profile.languages.slice(0, 3).join(", ")}
                  icon={<IoGlobeOutline className="text-violet-500" />}
                  dark={dark}
                />
                <StatBlock
                  label="Accueille les étrangers"
                  value={profile.acceptsForeigners ? "Oui" : "Non"}
                  icon={<FaGlobe className="text-amber-500" />}
                  dark={dark}
                />
              </div>
            </motion.div>
          </motion.section>

          {/* SECTION CONFIANCE */}
          <motion.section
            variants={motionContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-10%" }}
            className="space-y-5 sm:space-y-6"
          >
            <motion.div variants={motionItem}>
              <SectionHeader
                eyebrow="Confiance"
                title="Des indicateurs de qualité visibles sans bruit visuel"
                description="Les données de confiance sont présentées comme un tableau de bord discret, pour garder une lecture élégante et rapide."
                dark={dark}
              />
            </motion.div>

            <motion.div
              variants={motionItem}
              className="grid gap-px overflow-hidden rounded-[2rem] bg-slate-200 dark:bg-slate-800 shadow-sm"
            >
              <TrustMetric
                label="Score de confiance"
                value={profile.stats.reliabilityScore}
                suffix="/100"
                accent="from-emerald-500 to-green-600"
                dark={dark}
              />
              <TrustMetric
                label="Note globale"
                value={profile.stats.averageRating}
                suffix="/5"
                accent="from-sky-500 to-indigo-600"
                dark={dark}
              />
              <TrustMetric
                label="Taux de réponse"
                value={profile.stats.responseRate}
                suffix="%"
                accent="from-amber-500 to-orange-600"
                dark={dark}
              />
              <TrustMetric
                label="Délai moyen"
                value={profile.stats.responseTime}
                suffix=""
                accent="from-violet-500 to-fuchsia-600"
                dark={dark}
              />
            </motion.div>

            <motion.div
              variants={motionItem}
              className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400"
            >
              {profile.isIdentityVerified && (
                <DetailChip
                  icon={<FaUserCheck className="text-emerald-600" />}
                  label="Identité vérifiée"
                  dark={dark}
                />
              )}
              {profile.isEmailVerified && (
                <DetailChip
                  icon={<IoMailOutline className="text-sky-600" />}
                  label="Email vérifié"
                  dark={dark}
                />
              )}
              {profile.phoneVerified && (
                <DetailChip
                  icon={
                    <IoShieldCheckmarkOutline className="text-violet-600" />
                  }
                  label="Téléphone confirmé"
                  dark={dark}
                />
              )}
              {profile.acceptsForeigners && (
                <DetailChip
                  icon={<FaGlobe className="text-amber-600" />}
                  label="Ouvert aux voyageurs internationaux"
                  dark={dark}
                />
              )}
            </motion.div>
          </motion.section>

          {/* SECTION ANNONCES */}
          {isHost && (
            <motion.section
              id="featured-listings"
              variants={motionContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-10%" }}
              className="space-y-5 sm:space-y-6"
            >
              <motion.div variants={motionItem}>
                <SectionHeader
                  eyebrow="Annonces"
                  title="Biens mis en avant"
                  description="Chaque annonce est présentée comme un objet simple et lisible, avec une image forte, quelques détails utiles et un appel à l'action direct."
                  dark={dark}
                />
              </motion.div>
              {listings.length === 0 ? (
                <EmptyState type="listings" dark={dark} />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                  {listings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      username={profile.username}
                      onInfoRequest={openInfoRequest}
                      dark={dark}
                    />
                  ))}
                </div>
              )}
            </motion.section>
          )}

          {/* SECTION AVIS */}
          <motion.section
            variants={motionContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-10%" }}
            className="space-y-5 sm:space-y-6"
          >
            <motion.div variants={motionItem}>
              <SectionHeader
                eyebrow="Avis"
                title="Des retours récents qui racontent la qualité du service"
                description="Les témoignages sont affichés sans artifice, pour souligner la confiance."
                dark={dark}
              />
            </motion.div>

            {reviews.length === 0 ? (
              <EmptyState type="reviews" dark={dark} />
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-sm backdrop-blur-sm">
                {reviews.map((review) => (
                  <motion.article
                    key={review.id}
                    variants={motionItem}
                    className="p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <ReviewAvatar
                          avatar={review.avatar}
                          author={review.author}
                          dark={dark}
                        />
                        <div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
                              {review.author}
                            </h3>
                            <StarRow rating={review.rating} />
                          </div>
                          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            {review.role} - {review.date}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                        {review.rating.toFixed(1)}/5
                      </div>
                    </div>
                    <p className="mt-3 sm:mt-4 text-sm sm:text-base leading-6 sm:leading-7 text-slate-700 dark:text-slate-300">
                      "{review.comment}"
                    </p>
                  </motion.article>
                ))}
              </div>
            )}
          </motion.section>
        </div>
      </main>

      {/* Info Request Modal */}
      <InfoRequestModal
        isOpen={showInfoModal}
        onClose={() => {
          setShowInfoModal(false);
          setSelectedListing(null);
        }}
        onSend={sendInfoRequest}
        listingTitle={selectedListing?.title || ""}
        username={profile.username}
        isLoading={infoRequestLoading}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />

      {/* Identity Verification Modal */}
      <IdentityVerificationModal
        isOpen={showVerificationModal}
        onClose={handleCloseVerificationModal}
        onVerified={handleVerificationComplete}
        requiredAction="make_booking"
      />

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-950 dark:bg-white px-4 py-2 sm:px-5 sm:py-3 text-xs sm:text-sm font-medium text-white dark:text-slate-950 shadow-2xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
