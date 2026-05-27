// app/[locale]/admin/listings/validation/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

import {
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoLocationOutline,
  IoBedOutline,
  IoHomeOutline,
  IoShieldCheckmarkOutline,
  IoStarSharp,
  IoCallOutline,
  IoMailOutline,
  IoMapOutline,
  IoCalendarOutline,
  IoPeopleOutline,
  IoCheckmarkDoneOutline,
  IoGitBranchOutline,
  IoCreateOutline,
  IoDocumentTextOutline,
  IoEyeOutline,
  IoExpandOutline,
  IoWifiOutline,
  IoFlameOutline,
  IoSnowOutline,
  IoCarOutline,
  IoLeafOutline,
  IoConstructOutline,
  IoTvOutline,
  IoFitnessOutline,
  IoRestaurantOutline,
  IoLockClosedOutline,
  IoAlertCircleOutline,
  IoCloseCircleOutline,
  IoCheckmarkCircle,
  IoInformationCircleOutline,
  IoStatsChartOutline,
  IoCashOutline,
  IoHeartOutline,
  IoTimeOutline,
  IoAddOutline,
  IoRemoveOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
} from "react-icons/io5";
import {
  MdOutlineSquareFoot,
  MdOutlineElevator,
  MdBalcony,
  MdOutlinePets,
  MdSmokingRooms,
  MdOutlineKitchen,
} from "react-icons/md";
import {
  FaShower,
  FaSwimmingPool,
  FaParking,
  FaUtensils,
  FaWind,
} from "react-icons/fa";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAdminListingDetail } from "./hooks/useAdminListingDetail";

const ListingMap = dynamic(() => import("@/components/ui/maps/ListingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-slate-800 rounded-xl">
      <div className="w-7 h-7 border-2 border-gray-200 dark:border-slate-700 border-t-sky-500 rounded-full animate-spin" />
    </div>
  ),
});

interface Toast {
  type: "success" | "error";
  message: string;
}

// ============================================
// LIGHTBOX COMPONENT AVEC ZOOM ET SWIPE
// ============================================
function Lightbox({
  images,
  initialIndex,
  onClose,
  getImageUrl,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
  getImageUrl: (url: string | null | undefined) => string;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const goNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleZoomIn = () => setScale(Math.min(scale + 0.3, 3));
  const handleZoomOut = () => {
    if (scale > 0.5) {
      setScale(Math.max(scale - 0.3, 0.5));
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };
  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
      if (e.key === "0") handleResetZoom();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, scale]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all"
      >
        <IoCloseOutline className="text-xl" />
      </button>

      {/* Zoom controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full px-3 py-2">
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
          title="Zoom out (-)"
        >
          <IoRemoveOutline className="text-lg" />
        </button>
        <span className="text-white text-xs font-mono min-w-[40px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
          title="Zoom in (+)"
        >
          <IoAddOutline className="text-lg" />
        </button>
        {scale !== 1 && (
          <button
            onClick={handleResetZoom}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all text-xs"
            title="Reset zoom (0)"
          >
            ⟲
          </button>
        )}
      </div>

      {/* Navigation buttons */}
      {currentIndex > 0 && (
        <button
          onClick={goPrev}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all"
        >
          <IoChevronBackOutline className="text-xl" />
        </button>
      )}

      {currentIndex < images.length - 1 && (
        <button
          onClick={goNext}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all"
        >
          <IoChevronForwardOutline className="text-xl" />
        </button>
      )}

      {/* Image */}
      <div
        className="relative max-w-[90vw] max-h-[85vh] overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        style={{ cursor: scale > 1 ? "grab" : "default" }}
      >
        <img
          src={getImageUrl(images[currentIndex])}
          alt=""
          className="max-w-full max-h-[85vh] object-contain transition-transform duration-200"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
          }}
          draggable={false}
        />
      </div>

      {/* Counter */}
      <div className="absolute bottom-6 right-6 z-20 bg-black/50 backdrop-blur-md rounded-full px-3 py-1.5">
        <span className="text-white text-xs font-mono">
          {currentIndex + 1} / {images.length}
        </span>
      </div>
    </div>
  );
}

// Section Component
function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
      <div className="px-5 py-3.5 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2.5 bg-gray-50/50 dark:bg-slate-800/50">
        <span className="text-base text-gray-400 dark:text-slate-500">
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
          {title}
        </h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// 🇫🇷 TRADUCTIONS DES ÉQUIPEMENTS EN FRANÇAIS PROFESSIONNEL
const EQUIPMENT_FRENCH: Record<string, string> = {
  wifi: "Wi-Fi haut débit",
  tv: "Télévision LED",
  smartTv: "Smart TV",
  netflix: "Netflix inclus",
  ac: "Climatisation réversible",
  airConditioning: "Climatisation",
  heating: "Chauffage central",
  kitchen: "Cuisine entièrement équipée",
  washer: "Lave-linge",
  dryer: "Sèche-linge",
  dishwasher: "Lave-vaisselle",
  microwave: "Four micro-ondes",
  oven: "Four",
  coffeeMaker: "Machine à café",
  parking: "Parking privé",
  garage: "Garage",
  pool: "Piscine",
  swimmingPool: "Piscine",
  garden: "Jardin paysager",
  terrace: "Terrasse aménagée",
  balcony: "Balcon",
  gym: "Salle de sport",
  elevator: "Ascenseur",
  bbq: "Barbecue",
  seaView: "Vue sur mer",
  mountainView: "Vue sur montagne",
  cityView: "Vue sur ville",
  refrigerator: "Réfrigérateur",
  hairDryer: "Sèche-cheveux",
  iron: "Fer à repasser",
  safe: "Coffre-fort",
  workspace: "Espace bureau",
  babyChair: "Chaise bébé",
  babyBed: "Lit bébé",
  beachEssentials: "Équipements de plage",
  cleaningProducts: "Produits d'entretien",
  firstAidKit: "Trousse de secours",
  fireExtinguisher: "Extincteur",
  smokeDetector: "Détecteur de fumée",
};

// 🇫🇷 TRADUCTIONS DES RÈGLES
const RULES_FRENCH: Record<string, string> = {
  noSmoking: "Interdiction de fumer dans tout le logement",
  noPets: "Animaux domestiques non autorisés",
  noParties: "Fêtes et événements interdits",
  childrenAllowed: "Enfants bienvenus",
  petsAllowed: "Animaux acceptés sur demande",
  smokingAllowed: "Fumeurs acceptés (extérieur uniquement)",
};

// 🇫🇷 TRADUCTIONS DES TYPES D'ÉQUIPEMENT (icônes)
const EQUIP_ICONS: Record<string, React.ReactNode> = {
  wifi: <IoWifiOutline />,
  pool: <FaSwimmingPool />,
  ac: <IoSnowOutline />,
  kitchen: <FaUtensils />,
  parking: <FaParking />,
  terrace: <IoHomeOutline />,
  washer: <FaWind />,
  tv: <IoTvOutline />,
  garden: <IoLeafOutline />,
  bbq: <IoFlameOutline />,
  elevator: <MdOutlineElevator />,
  balcony: <MdBalcony />,
  shower: <FaShower />,
  gym: <IoFitnessOutline />,
  restaurant: <IoRestaurantOutline />,
  safe: <IoLockClosedOutline />,
  heating: <IoFlameOutline />,
};

// 🇫🇷 TRADUCTIONS DES TYPES DE BIEN
const TYPE_TRANSLATIONS: Record<string, string> = {
  APARTMENT: "Appartement de standing",
  VILLA: "Villa de prestige",
  STUDIO: "Studio moderne",
  DUPLEX: "Duplex spacieux",
  HOUSE: "Maison individuelle",
  ROOM: "Chambre privée",
};

// 🇫🇷 TRADUCTIONS DES TYPES DE LOCATION
const RENTAL_TYPE_TRANSLATIONS: Record<string, string> = {
  SHORT_TERM: "Location courte durée (minimum 2 nuits)",
  LONG_TERM: "Location longue durée (mensuelle)",
  BOTH: "Mixte (court et long terme)",
};

export default function AdminListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;
  const locale = (params?.locale as string) || "fr";
  const t = useTranslations("AdminListingDetail");

  // REJECTION_REASONS à l'intérieur du composant
  const REJECTION_REASONS = [
    t("rejectionReasons.poorPhotos"),
    t("rejectionReasons.incompleteDesc"),
    t("rejectionReasons.inconsistentPrice"),
    t("rejectionReasons.nonCompliantRules"),
    t("rejectionReasons.missingInfo"),
    t("rejectionReasons.duplicate"),
  ];

  const [toast, setToast] = useState<Toast | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const {
    listing,
    loading,
    actionLoading,
    rejectionReason,
    rejectionDetails,
    showChanges,
    isPending,
    isRevision,
    needsValidation,
    displayPhotos,
    activeEquipment,
    statusCfg,
    setRejectionReason,
    setRejectionDetails,
    setShowChanges,
    getImageUrl,
    handleValidate,
    formatPrice,
    formatDate,
  } = useAdminListingDetail(listingId, locale);

  // Liste des URLs d'images pour la lightbox
  const imageUrls = displayPhotos.map(p => p.url).filter(Boolean);

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen
        variant="spinner"
        size="lg"
        color="primary"
        text={t("loading")}
        speed="normal"
      />
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <IoHomeOutline className="text-4xl text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">
            {t("notFound")}
          </p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm bg-sky-600 text-white rounded-xl"
          >
            {t("goBack")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen antialiased">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 hover:opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && imageUrls.length > 0 && (
        <Lightbox
          images={imageUrls}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          getImageUrl={getImageUrl}
        />
      )}

      <div className="w-full px-4 lg:px-8 py-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs mb-4 overflow-x-auto whitespace-nowrap pb-1 uppercase font-semibold tracking-wider">
            <Link
              href={`/${locale}/admin/properties`}
              className="text-gray-500 dark:text-slate-400 hover:text-indigo-600 transition-colors"
            >
              {t("breadcrumbProperties")}
            </Link>
            <ChevronRight className="text-gray-300 dark:text-slate-600 text-xs" />
            <Link
              href={`/${locale}/admin/listings/validation`}
              className="text-gray-500 dark:text-slate-400 hover:text-indigo-600 transition-colors"
            >
              {t("breadcrumbValidations")}
            </Link>
            <ChevronRight className="text-gray-300 dark:text-slate-600 text-xs" />
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
              {isRevision
                ? t("breadcrumbModification")
                : t("breadcrumbNewListing")}{" "}
              #{listing.id.slice(-6).toUpperCase()}
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {isRevision && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 dark:bg-violet-950/30 border border-violet-100 text-violet-700 text-[10px] font-bold uppercase rounded-lg">
                    <IoGitBranchOutline className="text-sm" />{" "}
                    {t("badgeModification")}
                  </span>
                )}
                {isPending && !isRevision && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded-lg">
                    <IoCreateOutline className="text-sm" />{" "}
                    {t("badgeNewListing")}
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-[10px] font-bold uppercase rounded-lg ${statusCfg.bg} ${statusCfg.text}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}
                  />
                  {t(`status_${listing.status}`)}
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1.5">
                {listing.title}
              </h1>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400">
                <IoLocationOutline className="text-base" />
                {listing.delegation}, {listing.governorate}
                {listing.street ? ` — ${listing.street}` : ""}
              </div>
            </div>
            <button
              onClick={() =>
                window.open(`/${locale}/listings/${listing.id}`, "_blank")
              }
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-sky-300 hover:text-sky-600 transition-all flex-shrink-0"
            >
              <IoEyeOutline className="text-sm" /> {t("viewOnSite")}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            {
              icon: <IoEyeOutline />,
              label: t("statsViews"),
              value: listing.viewCount?.toLocaleString() ?? "0",
              color: "bg-sky-50 dark:bg-sky-950/30 border-sky-100 text-sky-600",
            },
            {
              icon: <IoCalendarOutline />,
              label: t("statsBookings"),
              value: listing.bookingCount ?? 0,
              color:
                "bg-violet-50 dark:bg-violet-950/30 border-violet-100 text-violet-600",
            },
            {
              icon: <IoHeartOutline />,
              label: t("statsFavorites"),
              value: listing.favoriteCount ?? 0,
              color:
                "bg-amber-50 dark:bg-amber-950/30 border-amber-100 text-amber-600",
            },
            {
              icon: <IoCashOutline />,
              label: t("statsRevenue"),
              value: `${(listing.totalRevenue ?? 0).toLocaleString()} TND`,
              color:
                "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 text-emerald-600",
            },
          ].map(({ icon, label, value, color }) => (
            <div
              key={label}
              className={`flex items-center gap-3 p-4 rounded-xl border ${color}`}
            >
              <span className="text-xl flex-shrink-0">{icon}</span>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-slate-400 font-semibold">
                  {label}
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Revision Banner */}
        {isRevision && listing.pendingRevisionData && (
          <div className="mb-6 border border-violet-200 dark:border-violet-800 rounded-2xl overflow-hidden">
            <div className="flex items-start gap-4 p-5 bg-violet-50 dark:bg-violet-950/30">
              <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/50 border border-violet-200 flex items-center justify-center flex-shrink-0">
                <IoGitBranchOutline className="text-violet-600 text-base" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-violet-900 dark:text-violet-300 mb-0.5">
                  {t("revisionTitle")}
                </h4>
                <p className="text-xs text-violet-600/80">
                  {t("revisionDescription")}
                </p>
              </div>
              <button
                onClick={() => setShowChanges(!showChanges)}
                className="text-xs font-medium text-violet-700 hover:underline flex items-center gap-1"
              >
                <IoDocumentTextOutline className="text-sm" />
                {showChanges ? t("revisionHide") : t("revisionView")}
              </button>
            </div>
            {showChanges && (
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {listing.pendingRevisionData.changes.map((c, i) => (
                  <div
                    key={i}
                    className="p-5 grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4"
                  >
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                        {t("revisionField")}
                      </p>
                      <p className="text-sm font-semibold text-gray-800 capitalize">
                        {c.field.replace(/_/g, " ")}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-rose-500 mb-1">
                          {t("revisionBefore")}
                        </p>
                        <p className="text-xs text-rose-700 line-through">
                          {String(c.oldValue ?? "—")}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-500 mb-1">
                          {t("revisionAfter")}
                        </p>
                        <p className="text-xs text-emerald-700 font-medium">
                          {String(c.newValue ?? "—")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      {/* Main Grid */}
<div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
  {/* LEFT COLUMN */}
  <div className="space-y-6 min-w-0">
    {/* Gallery - 1 grande + 4 petites, +X sur la dernière petite */}
    <div className="grid grid-cols-4 gap-2 h-[340px] lg:h-[480px] rounded-2xl overflow-hidden">
      {/* Grande image principale (colspan 2, rowspan 2) */}
      <div
        className="col-span-2 row-span-2 relative overflow-hidden cursor-pointer group bg-gray-100"
        onClick={() => displayPhotos[0] && setLightboxIndex(0)}
      >
        {displayPhotos[0] ? (
          <img
            src={getImageUrl(displayPhotos[0].url)}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <IoHomeOutline className="text-5xl text-gray-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        <span className="absolute bottom-3 left-3 flex items-center gap-1 text-[10px] font-bold text-white bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <IoExpandOutline className="text-xs" /> {t("galleryZoom")}
        </span>
      </div>

      {/* 1ère petite image (top right) */}
      <div
        className="relative overflow-hidden cursor-pointer group bg-gray-100"
        onClick={() => displayPhotos[1] && setLightboxIndex(1)}
      >
        {displayPhotos[1] ? (
          <img
            src={getImageUrl(displayPhotos[1].url)}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <IoHomeOutline className="text-2xl text-gray-300" />
          </div>
        )}
      </div>

      {/* 2ème petite image (middle right) */}
      <div
        className="relative overflow-hidden cursor-pointer group bg-gray-100"
        onClick={() => displayPhotos[2] && setLightboxIndex(2)}
      >
        {displayPhotos[2] ? (
          <img
            src={getImageUrl(displayPhotos[2].url)}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <IoHomeOutline className="text-2xl text-gray-300" />
          </div>
        )}
      </div>

      {/* 3ème petite image (middle right 2) */}
      <div
        className="relative overflow-hidden cursor-pointer group bg-gray-100"
        onClick={() => displayPhotos[3] && setLightboxIndex(3)}
      >
        {displayPhotos[3] ? (
          <img
            src={getImageUrl(displayPhotos[3].url)}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <IoHomeOutline className="text-2xl text-gray-300" />
          </div>
        )}
      </div>

      {/* 4ème petite image (bottom right) - Celle avec le +X */}
      <div
        className="relative overflow-hidden cursor-pointer group bg-gray-100"
        onClick={() => displayPhotos[4] && setLightboxIndex(4)}
      >
        {displayPhotos[4] ? (
          <>
            <img
              src={getImageUrl(displayPhotos[4].url)}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {/* Overlay avec compteur "+X" sur la 4ème petite image */}
            {listing.photos && listing.photos.length > 5 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                <p className="text-white font-bold text-xl">+{listing.photos.length - 5}</p>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <IoHomeOutline className="text-2xl text-gray-300" />
          </div>
        )}
      </div>
    </div>

            {/* Quick Props */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <MdOutlineSquareFoot className="text-lg text-gray-400 dark:text-slate-500" />
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest font-semibold">
                    {t("propSurface")}
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {listing.surfaceArea || 0} m²
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <IoBedOutline className="text-lg text-gray-400 dark:text-slate-500" />
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest font-semibold">
                    {t("propBedrooms")}
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {listing.rooms || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <FaShower className="text-lg text-gray-400 dark:text-slate-500" />
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest font-semibold">
                    {t("propBathrooms")}
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {listing.bathrooms || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <IoPeopleOutline className="text-lg text-gray-400 dark:text-slate-500" />
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest font-semibold">
                    {t("propMaxGuests")}
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {listing.maxGuests || "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <MdOutlineKitchen className="text-lg text-gray-400 dark:text-slate-500" />
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest font-semibold">
                    {t("propKitchens")}
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {listing.numberOfKitchens || 1}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <IoHomeOutline className="text-lg text-gray-400 dark:text-slate-500" />
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest font-semibold">
                    {t("propType")}
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {TYPE_TRANSLATIONS[listing.type] ?? listing.type}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <IoLeafOutline className="text-lg text-gray-400 dark:text-slate-500" />
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest font-semibold">
                    {t("propGarden")}
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {listing.hasGarden ? t("yes") : t("no")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <MdBalcony className="text-lg text-gray-400 dark:text-slate-500" />
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest font-semibold">
                    {t("propBalcony")}
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {listing.hasBalcony ? t("yes") : t("no")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <MdOutlineElevator className="text-lg text-gray-400 dark:text-slate-500" />
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest font-semibold">
                    {t("propElevator")}
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {listing.hasElevator ? t("yes") : t("no")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <IoCarOutline className="text-lg text-gray-400 dark:text-slate-500" />
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest font-semibold">
                    {t("propParking")}
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {listing.hasGarage ? t("yes") : t("no")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <IoHomeOutline className="text-lg text-gray-400 dark:text-slate-500" />
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest font-semibold">
                    {t("propFurnished")}
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {listing.isFurnished ? t("yes") : t("no")}
                  </p>
                </div>
              </div>
            </div>

            {/* Equipment Section */}
            {activeEquipment.length > 0 && (
              <Section
                title={t("sectionEquipment")}
                icon={<IoConstructOutline />}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activeEquipment.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-xs text-gray-700 dark:text-slate-300"
                    >
                      <span className="text-sm text-gray-400 dark:text-slate-500">
                        {EQUIP_ICONS[item.icon?.toLowerCase()] || (
                          <IoCheckmarkCircleOutline className="text-sm" />
                        )}
                      </span>
                      {EQUIPMENT_FRENCH[item.icon?.toLowerCase()] || item.name}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* House Rules Section */}
            {listing.houseRulesList && listing.houseRulesList.length > 0 && (
              <Section
                title={t("sectionHouseRules")}
                icon={<IoShieldCheckmarkOutline />}
              >
                <div className="space-y-2.5">
                  {listing.houseRulesList.map((rule, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 text-xs text-gray-500 dark:text-slate-400"
                    >
                      <IoTimeOutline className="text-sm text-gray-300 dark:text-slate-500 flex-shrink-0" />
                      <span>{RULES_FRENCH[rule] || rule}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Description */}
            {listing.description && (
              <Section
                title={t("sectionDescription")}
                icon={<IoDocumentTextOutline />}
              >
                <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                  {listing.description}
                </p>
              </Section>
            )}

            {/* Map */}
            <Section title={t("sectionLocation")} icon={<IoMapOutline />}>
              <div className="h-64 rounded-xl overflow-hidden border border-gray-200">
                {listing.latitude && listing.longitude ? (
                  <ListingMap
                    homeLat={listing.latitude}
                    homeLng={listing.longitude}
                    pois={[]}
                    zoom={14}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                    <IoMapOutline className="text-4xl text-gray-300 mb-2" />
                    <p className="text-xs text-gray-400">
                      {t("noCoordinates")}
                    </p>
                  </div>
                )}
              </div>
            </Section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5 lg:sticky lg:top-6">
            {/* Pricing */}
            <Section title={t("sectionPricing")} icon={<IoCashOutline />}>
              <div className="space-y-3">
                {listing.pricePerNight && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">
                      {t("pricePerNight")}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatPrice(listing.pricePerNight)}
                    </span>
                  </div>
                )}
                {listing.pricePerMonth && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">
                      {t("pricePerMonth")}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatPrice(listing.pricePerMonth)}
                    </span>
                  </div>
                )}
                {listing.cleaningFee && listing.cleaningFee > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">
                      {t("cleaningFee")}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatPrice(listing.cleaningFee)}
                    </span>
                  </div>
                )}
                {listing.securityDeposit && listing.securityDeposit > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">
                      {t("securityDeposit")}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatPrice(listing.securityDeposit)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    {t("rentalType")}
                  </span>
                  <span className="text-xs font-medium text-gray-700 px-2 py-0.5 rounded-lg bg-gray-100">
                    {RENTAL_TYPE_TRANSLATIONS[listing.rentalType] ||
                      listing.rentalType}
                  </span>
                </div>
              </div>
            </Section>

            {/* Validation Panel */}
            {needsValidation && (
              <div
                className={`rounded-2xl overflow-hidden relative ${isRevision ? "bg-gradient-to-br from-sky-800 to-indigo-500" : "bg-gradient-to-br from-sky-500 to-indigo-500"}`}
              >
                <div
                  className={`absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl ${isRevision ? "bg-violet-500/20" : "bg-sky-500/20"}`}
                />
                <div className="relative z-10 p-6">
                  <div className="mb-5">
                    <h3 className="text-xl font-bold text-white">
                      {isRevision
                        ? t("validateModificationTitle")
                        : t("validateListingTitle")}
                    </h3>
                    <p className="text-sm text-white/70 mt-1.5">
                      {isRevision
                        ? t("validateModificationDesc")
                        : t("validateListingDesc")}
                    </p>
                  </div>

                  <div className="space-y-2.5 mb-5">
                    {/* Approve Button */}
                    <button
                      onClick={async () => {
                        const result = await handleValidate("approve");
                        showToast(
                          result.success ? "success" : "error",
                          result.message,
                        );
                        if (result.success) {
                          setTimeout(() => {
                            router.push(`/${locale}/admin/listings/validation`);
                          }, 1500);
                        }
                      }}
                      disabled={actionLoading}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <IoCheckmarkCircleOutline className="text-lg" />
                      )}
                      {isRevision
                        ? t("btnApproveModification")
                        : t("btnApproveListing")}
                    </button>

                    {/* Reject Button */}
                    <button
                      onClick={async () => {
                        const result = await handleValidate("reject");
                        showToast(
                          result.success ? "success" : "error",
                          result.message,
                        );
                        if (result.success) {
                          setTimeout(() => {
                            router.push(`/${locale}/admin/listings/validation`);
                          }, 1500);
                        }
                      }}
                      disabled={actionLoading || !rejectionReason}
                      className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <IoCloseOutline className="text-lg" />
                      {isRevision
                        ? t("btnRejectModification")
                        : t("btnRejectListing")}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold text-white/50 tracking-widest">
                        {t("rejectionReasonLabel")}{" "}
                        <span className="text-rose-400">*</span>
                      </label>
                      {rejectionReason && (
                        <button
                          onClick={() => setRejectionReason("")}
                          className="text-xs text-white/40 hover:text-white/70"
                        >
                          {t("clear")}
                        </button>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {REJECTION_REASONS.map((reason) => (
                        <label
                          key={reason}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all text-sm ${
                            rejectionReason === reason
                              ? "bg-rose-500/20 border border-rose-400/40 text-white"
                              : "bg-white/10 border border-transparent hover:bg-white/20 text-white/80"
                          }`}
                        >
                          <input
                            type="radio"
                            name="rejection"
                            value={reason}
                            checked={rejectionReason === reason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-3.5 h-3.5 border-2 border-white/30 text-rose-500 focus:ring-rose-500/20 bg-transparent checked:bg-rose-500"
                          />
                          <span className="text-xs">{reason}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <label className="text-[10px] uppercase font-bold text-white/50 tracking-widest">
                      {t("rejectionDetailsLabel")}
                    </label>
                    <textarea
                      value={rejectionDetails}
                      onChange={(e) => setRejectionDetails(e.target.value)}
                      placeholder={t("rejectionDetailsPlaceholder")}
                      rows={3}
                      className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-xs text-white placeholder-white/40 focus:ring-2 focus:ring-sky-500/30 resize-none transition-all"
                    />
                  </div>

                  <p
                    className={`mt-4 text-[10px] text-center ${isRevision ? "text-violet-300/70" : "text-sky-300/70"}`}
                  >
                    {isRevision ? t("revisionNote") : t("validationNote")}
                  </p>
                </div>
              </div>
            )}

            {/* Owner Section */}
            <Section title={t("sectionOwner")} icon={<IoPeopleOutline />}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-sky-100 to-violet-100 flex items-center justify-center flex-shrink-0 border border-gray-200">
                  {listing.owner.profilePictureUrl ? (
                    <img
                      src={getImageUrl(listing.owner.profilePictureUrl)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-base font-bold text-sky-600">
                      {listing.owner.firstName?.charAt(0)}
                      {listing.owner.lastName?.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {listing.owner.firstName} {listing.owner.lastName}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {t("memberSince")} {formatDate(listing.owner.createdAt)}
                  </p>
                  {listing.owner.isIdentityVerified && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 mt-0.5">
                      <IoCheckmarkDoneOutline className="text-[10px]" />{" "}
                      {t("verified")}
                    </span>
                  )}
                </div>
              </div>

              {listing.ownerBio && (
                <p className="text-xs leading-relaxed mb-4 text-gray-500 dark:text-slate-400">
                  {listing.ownerBio}
                </p>
              )}

              <div className="space-y-2.5 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <IoCallOutline className="text-sm text-gray-400" />
                  {listing.owner.phoneNumber ?? t("notProvided")}
                </div>
                <div className="flex items-center gap-2">
                  <IoMailOutline className="text-sm text-gray-400" />
                  <span className="truncate">{listing.owner.email}</span>
                </div>
              </div>
            </Section>

            {/* Dates */}
            <Section title={t("sectionDates")} icon={<IoCalendarOutline />}>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">{t("dateCreated")}</span>
                  <span className="font-medium text-gray-700">
                    {formatDate(listing.createdAt)}
                  </span>
                </div>
                {listing.publishedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t("datePublished")}</span>
                    <span className="font-medium text-gray-700">
                      {formatDate(listing.publishedAt)}
                    </span>
                  </div>
                )}
                {listing.rejectionReason && (
                  <div className="mt-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-rose-500 mb-1">
                      {t("previousRejectionReason")}
                    </p>
                    <p className="text-xs text-rose-700">
                      {listing.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}