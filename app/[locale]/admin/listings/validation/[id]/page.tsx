// app/[locale]/admin/listings/validation/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ChevronRight, Sparkles } from "lucide-react";
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

// Equipment Icons
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
  shower: <FaShower />,
  gym: <IoFitnessOutline />,
  restaurant: <IoRestaurantOutline />,
  safe: <IoLockClosedOutline />,
  heating: <IoFlameOutline />,
};

// Helper functions
const isFieldChanged = (
  changes: any[] | undefined,
  fieldName: string,
): boolean => {
  return !!changes?.some((c) => c.field === fieldName);
};

const getOldValue = (changes: any[] | undefined, fieldName: string): any => {
  return changes?.find((c) => c.field === fieldName)?.oldValue;
};

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

// Lightbox Component
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
      setPosition({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

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
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all"
      >
        <IoCloseOutline className="text-xl" />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full px-3 py-2">
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
        >
          <IoRemoveOutline className="text-lg" />
        </button>
        <span className="text-white text-xs font-mono min-w-[40px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
        >
          <IoAddOutline className="text-lg" />
        </button>
        {scale !== 1 && (
          <button
            onClick={handleResetZoom}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all text-xs"
          >
            ⟲
          </button>
        )}
      </div>

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

      <div className="absolute bottom-6 right-6 z-20 bg-black/50 backdrop-blur-md rounded-full px-3 py-1.5">
        <span className="text-white text-xs font-mono">
          {currentIndex + 1} / {images.length}
        </span>
      </div>
    </div>
  );
}

export default function AdminListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;
  const locale = (params?.locale as string) || "fr";
  const t = useTranslations("AdminListingDetail");

  // Highlighted Value Component - Violet
  const HighlightedValue = ({
    currentValue,
    oldValue,
    isChanged,
    formatValue = (v: any) => v ?? "—",
  }: {
    currentValue: any;
    oldValue?: any;
    isChanged: boolean;
    formatValue?: (v: any) => string;
  }) => {
    if (!isChanged) {
      return (
        <span className="text-gray-900 dark:text-white">
          {formatValue(currentValue)}
        </span>
      );
    }

    return (
      <span className="group relative inline-block">
        <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-violet-100 dark:bg-violet-900/50 text-violet-800 dark:text-violet-300 font-medium border border-violet-200 dark:border-violet-700">
          <Sparkles size={10} className="text-violet-500" />
          {formatValue(currentValue)}
        </span>
        <span className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-10">
          <span className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap shadow-lg">
            {t("common.oldValue")}: {formatValue(oldValue)}
          </span>
        </span>
      </span>
    );
  };
  // Badge Modifié Component - Violet
  const ModifiedBadge = ({
    fieldName,
    changes,
  }: {
    fieldName: string;
    changes: any[] | undefined;
  }) => {
    if (!isFieldChanged(changes, fieldName)) return null;
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[9px] font-bold">
        <Sparkles size={8} /> {t("common.modified")}
      </span>
    );
  };

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
    allPhotos,
    hasMorePhotos,
    hiddenPhotosCount,
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

  const imageUrls = (allPhotos || []).map((p) => p.url).filter(Boolean);
  const changes = listing?.pendingRevisionData?.changes;

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
              <div className="flex items-center gap-2">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1.5">
                  {listing.title}
                </h1>
              </div>
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

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
          {/* LEFT COLUMN */}
          <div className="space-y-6 min-w-0">
            {/* Gallery */}
            <div className="grid grid-cols-4 gap-2 h-[340px] lg:h-[480px] rounded-2xl overflow-hidden">
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
              {[1, 2, 3, 4].map((idx) => (
                <div
                  key={idx}
                  className="relative overflow-hidden cursor-pointer group bg-gray-100"
                  onClick={() => displayPhotos[idx] && setLightboxIndex(idx)}
                >
                  {displayPhotos[idx] ? (
                    <img
                      src={getImageUrl(displayPhotos[idx].url)}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <IoHomeOutline className="text-2xl text-gray-300" />
                    </div>
                  )}
                  {idx === 4 && hasMorePhotos && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                      <p className="text-white font-bold text-xl">
                        +{hiddenPhotosCount + 1}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Props */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                {
                  icon: <MdOutlineSquareFoot />,
                  label: t("propSurface"),
                  value: listing.surfaceArea || 0,
                  suffix: "m²",
                  field: "surfaceArea",
                },
                {
                  icon: <IoBedOutline />,
                  label: t("propBedrooms"),
                  value: listing.rooms || 0,
                  suffix: "",
                  field: "rooms",
                },
                {
                  icon: <FaShower />,
                  label: t("propBathrooms"),
                  value: listing.bathrooms || 0,
                  suffix: "",
                  field: "bathrooms",
                },
                {
                  icon: <IoPeopleOutline />,
                  label: t("propMaxGuests"),
                  value: listing.maxGuests || "—",
                  suffix: "",
                  field: "maxGuests",
                },
                {
                  icon: <MdOutlineKitchen />,
                  label: t("propKitchens"),
                  value: listing.numberOfKitchens || 1,
                  suffix: "",
                  field: "numberOfKitchens",
                },
                {
                  icon: <IoHomeOutline />,
                  label: t("propType"),
                  value: t(`propertyType.${listing.type}`, {
                    defaultValue: listing.type,
                  }),
                  suffix: "",
                  field: "type",
                },
                {
                  icon: <IoLeafOutline />,
                  label: t("propGarden"),
                  value: listing.hasGarden ? t("yes") : t("no"),
                  suffix: "",
                  field: "hasGarden",
                },
                {
                  icon: <MdBalcony />,
                  label: t("propBalcony"),
                  value: listing.hasBalcony ? t("yes") : t("no"),
                  suffix: "",
                  field: "hasBalcony",
                },
                {
                  icon: <MdOutlineElevator />,
                  label: t("propElevator"),
                  value: listing.hasElevator ? t("yes") : t("no"),
                  suffix: "",
                  field: "hasElevator",
                },
                {
                  icon: <IoCarOutline />,
                  label: t("propParking"),
                  value: listing.hasGarage ? t("yes") : t("no"),
                  suffix: "",
                  field: "hasGarage",
                },
                {
                  icon: <IoHomeOutline />,
                  label: t("propFurnished"),
                  value: listing.isFurnished ? t("yes") : t("no"),
                  suffix: "",
                  field: "isFurnished",
                },
              ].map(({ icon, label, value, suffix, field }) => (
                <div
                  key={field}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border ${isFieldChanged(changes, field) ? "border-violet-400 bg-violet-50/30 dark:bg-violet-950/20" : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"}`}
                >
                  <span className="text-lg text-gray-400 dark:text-slate-500">
                    {icon}
                  </span>
                  <div>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest font-semibold">
                      {label}
                    </p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      <HighlightedValue
                        currentValue={value}
                        oldValue={getOldValue(changes, field)}
                        isChanged={isFieldChanged(changes, field)}
                        formatValue={(v) => `${v}${suffix ? ` ${suffix}` : ""}`}
                      />
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Equipment Section - Style identique aux Quick Props */}
            {(() => {
              const EXCLUDED_EQUIPMENT = new Set([
                "balcony",
                "garden",
                "elevator",
                "garage",
                "furnished",
                "pets",
                "smoking",
              ]);
              const currentEquipment = new Set<string>();
              if (listing.equipment) {
                Object.keys(listing.equipment).forEach((key) => {
                  if (
                    !EXCLUDED_EQUIPMENT.has(key.toLowerCase()) &&
                    listing.equipment[key] === true
                  )
                    currentEquipment.add(key);
                });
              }
              const previousEquipment = new Set<string>();
              if (changes) {
                changes.forEach((change) => {
                  if (change.field === "equipment") {
                    const oldEquip = change.oldValue || {};
                    Object.keys(oldEquip).forEach((key) => {
                      if (
                        !EXCLUDED_EQUIPMENT.has(key.toLowerCase()) &&
                        oldEquip[key] === true
                      )
                        previousEquipment.add(key);
                    });
                  } else if (change.field.startsWith("equipment.")) {
                    const equipName = change.field.replace("equipment.", "");
                    if (
                      !EXCLUDED_EQUIPMENT.has(equipName.toLowerCase()) &&
                      (change.oldValue === true ||
                        change.oldValue === " Oui" ||
                        change.oldValue === "✅ Oui")
                    ) {
                      previousEquipment.add(equipName);
                    }
                  }
                });
              }
              const addedEquipment = new Set(
                [...currentEquipment].filter((e) => !previousEquipment.has(e)),
              );
              const removedEquipment = new Set(
                [...previousEquipment].filter((e) => !currentEquipment.has(e)),
              );
              const allEquipmentToShow = new Set([
                ...currentEquipment,
                ...removedEquipment,
              ]);
              if (allEquipmentToShow.size === 0) return null;

              return (
                <Section
                  title={t("sectionEquipment")}
                  icon={<IoConstructOutline />}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array.from(allEquipmentToShow).map((equipName) => {
                      const cleanName = equipName.toLowerCase().trim();
                      if (EXCLUDED_EQUIPMENT.has(cleanName)) return null;
                      const isAdded = addedEquipment.has(equipName);
                      const isRemoved = removedEquipment.has(equipName);
                      const IconComponent = EQUIP_ICONS[cleanName] || (
                        <IoCheckmarkCircleOutline className="text-sm" />
                      );

                      if (isRemoved) {
                        return (
                          <div
                            key={equipName}
                            className="flex items-center gap-3 p-3.5 rounded-xl border border-red-400 bg-red-50/70 dark:bg-red-950/40"
                          >
                            <span className="text-lg text-red-500 dark:text-red-400">
                              {IconComponent}
                            </span>
                            <div>
                              <p className="text-[10px] text-red-600 dark:text-red-400 uppercase tracking-widest font-semibold">
                                {t("equipment.removed")}
                              </p>
                              <p className="text-sm font-bold text-red-800 dark:text-red-300 line-through decoration-red-500">
                                {t(`equipment.${cleanName}`, {
                                  defaultValue: equipName,
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      if (isAdded) {
                        return (
                          <div
                            key={equipName}
                            className="flex items-center gap-3 p-3.5 rounded-xl border border-violet-400 bg-violet-50/50 dark:bg-violet-950/30 ring-1 ring-violet-400"
                          >
                            <span className="text-lg text-violet-600 dark:text-violet-400">
                              {IconComponent}
                            </span>
                            <div>
                              <p className="text-[10px] text-violet-600 dark:text-violet-400 uppercase tracking-widest font-semibold">
                                {t("equipment.added")}
                              </p>
                              <p className="text-sm font-bold text-violet-800 dark:text-violet-300">
                                {t(`equipment.${cleanName}`, {
                                  defaultValue: equipName,
                                })}
                              </p>
                            </div>
                            <Sparkles
                              size={12}
                              className="text-violet-500 ml-auto"
                            />
                          </div>
                        );
                      }

                      return (
                        <div
                          key={equipName}
                          className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        >
                          <span className="text-lg text-gray-400 dark:text-slate-500">
                            {IconComponent}
                          </span>
                          <div>
                            <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest font-semibold">
                              {t("equipment.label")}
                            </p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {t(`equipment.${cleanName}`, {
                                defaultValue: equipName,
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              );
            })()}

            {/* House Rules Section - Style identique */}
            {(() => {
              const ALL_RULES = [
                {
                  key: "noSmoking",
                  label: t("rules.noSmoking"),
                  Icon: IoShieldCheckmarkOutline,
                },
                {
                  key: "noPets",
                  label: t("rules.noPets"),
                  Icon: IoShieldCheckmarkOutline,
                },
                {
                  key: "noParties",
                  label: t("rules.noParties"),
                  Icon: IoShieldCheckmarkOutline,
                },
                {
                  key: "childrenAllowed",
                  label: t("rules.childrenAllowed"),
                  Icon: IoPeopleOutline,
                },
                {
                  key: "petsAllowed",
                  label: t("rules.petsAllowed"),
                  Icon: IoLeafOutline,
                },
                {
                  key: "smokingAllowed",
                  label: t("rules.smokingAllowed"),
                  Icon: IoFlameOutline,
                },
                {
                  key: "quietAfter22",
                  label: t("rules.quietAfter22"),
                  Icon: IoTimeOutline,
                },
              ];

              const currentRules = new Set<string>();
              if (listing.houseRules) {
                if (listing.houseRules.noSmoking === true)
                  currentRules.add("noSmoking");
                if (listing.houseRules.noPets === true)
                  currentRules.add("noPets");
                if (listing.houseRules.noParties === true)
                  currentRules.add("noParties");
                if (listing.houseRules.childrenAllowed === true)
                  currentRules.add("childrenAllowed");
                if (listing.houseRules.quietAfter22 === true)
                  currentRules.add("quietAfter22");
              }
              if (listing.petsAllowed === true) currentRules.add("petsAllowed");
              if (listing.smokingAllowed === true)
                currentRules.add("smokingAllowed");

              const previousRules = new Set<string>();
              if (changes) {
                changes.forEach((change) => {
                  if (change.field === "houseRules") {
                    const oldRules = change.oldValue || {};
                    if (oldRules.noSmoking === true)
                      previousRules.add("noSmoking");
                    if (oldRules.noPets === true) previousRules.add("noPets");
                    if (oldRules.noParties === true)
                      previousRules.add("noParties");
                    if (oldRules.childrenAllowed === true)
                      previousRules.add("childrenAllowed");
                    if (oldRules.quietAfter22 === true)
                      previousRules.add("quietAfter22");
                  } else if (
                    change.field === "petsAllowed" &&
                    change.oldValue === true
                  ) {
                    previousRules.add("petsAllowed");
                  } else if (
                    change.field === "smokingAllowed" &&
                    change.oldValue === true
                  ) {
                    previousRules.add("smokingAllowed");
                  } else if (change.field.startsWith("houseRules.")) {
                    const ruleName = change.field.replace("houseRules.", "");
                    if (change.oldValue === true) previousRules.add(ruleName);
                  }
                });
              }

              const addedRules = new Set(
                [...currentRules].filter((r) => !previousRules.has(r)),
              );
              const removedRules = new Set(
                [...previousRules].filter((r) => !currentRules.has(r)),
              );
              const allRulesToShow = new Set([
                ...currentRules,
                ...removedRules,
              ]);
              if (allRulesToShow.size === 0) return null;

              return (
                <Section
                  title={t("sectionHouseRules")}
                  icon={<IoShieldCheckmarkOutline />}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ALL_RULES.map(
                      ({ key, label, Icon: RuleIconComponent }) => {
                        if (!allRulesToShow.has(key)) return null;
                        const isAdded = addedRules.has(key);
                        const isRemoved = removedRules.has(key);

                        if (isRemoved) {
                          return (
                            <div
                              key={key}
                              className="flex items-center gap-3 p-3.5 rounded-xl border border-red-400 bg-red-50/70 dark:bg-red-950/40"
                            >
                              <RuleIconComponent className="text-lg text-red-500 dark:text-red-400" />
                              <div>
                                <p className="text-[10px] text-red-600 dark:text-red-400 uppercase tracking-widest font-semibold">
                                  {t("rules.removed")}
                                </p>
                                <p className="text-sm font-bold text-red-800 dark:text-red-300 line-through decoration-red-500">
                                  {label}
                                </p>
                              </div>
                            </div>
                          );
                        }

                        if (isAdded) {
                          return (
                            <div
                              key={key}
                              className="flex items-center gap-3 p-3.5 rounded-xl border border-violet-400 bg-violet-50/50 dark:bg-violet-950/30 ring-1 ring-violet-400"
                            >
                              <RuleIconComponent className="text-lg text-violet-600 dark:text-violet-400" />
                              <div>
                                <p className="text-[10px] text-violet-600 dark:text-violet-400 uppercase tracking-widest font-semibold">
                                  {t("rules.added")}
                                </p>
                                <p className="text-sm font-bold text-violet-800 dark:text-violet-300">
                                  {label}
                                </p>
                              </div>
                              <Sparkles
                                size={12}
                                className="text-violet-500 ml-auto"
                              />
                            </div>
                          );
                        }

                        return (
                          <div
                            key={key}
                            className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                          >
                            <RuleIconComponent className="text-lg text-gray-400 dark:text-slate-500" />
                            <div>
                              <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest font-semibold">
                                {t("rules.label")}
                              </p>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {label}
                              </p>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </Section>
              );
            })()}

            {/* Description */}
            {listing.description && (
              <Section
                title={t("sectionDescription")}
                icon={<IoDocumentTextOutline />}
              >
                <div
                  className={`p-4 rounded-xl border ${isFieldChanged(changes, "description") ? "border-violet-400 bg-violet-50/30 dark:bg-violet-950/20" : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("description.current")}
                    </p>
                    <ModifiedBadge fieldName="description" changes={changes} />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                    {listing.description}
                  </p>
                  {isFieldChanged(changes, "description") && (
                    <div className="mt-3 pt-2 border-t border-violet-200 dark:border-violet-800">
                      <p className="text-[10px] text-violet-600 dark:text-violet-400 font-medium">
                        {t("description.old")}:
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-through">
                        {getOldValue(changes, "description")}
                      </p>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Location */}
            <Section title={t("sectionLocation")} icon={<IoMapOutline />}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      label: t("location.governorate"),
                      value: listing.governorate,
                      field: "governorate",
                      icon: <IoLocationOutline />,
                    },
                    {
                      label: t("location.delegation"),
                      value: listing.delegation,
                      field: "delegation",
                      icon: <IoLocationOutline />,
                    },
                    {
                      label: t("location.street"),
                      value: listing.street || "—",
                      field: "street",
                      icon: <IoLocationOutline />,
                    },
                  ].map(({ label, value, field, icon }) => (
                    <div
                      key={field}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border ${isFieldChanged(changes, field) ? "border-violet-400 bg-violet-50/30 dark:bg-violet-950/20" : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"}`}
                    >
                      <span className="text-lg text-gray-400 dark:text-slate-500">
                        {icon}
                      </span>
                      <div>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest font-semibold">
                          {label}
                        </p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          <HighlightedValue
                            currentValue={value}
                            oldValue={getOldValue(changes, field)}
                            isChanged={isFieldChanged(changes, field)}
                          />
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
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
                {(isFieldChanged(changes, "latitude") ||
                  isFieldChanged(changes, "longitude")) && (
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-violet-400 bg-violet-50/30 dark:bg-violet-950/20">
                    <span className="text-lg text-violet-600 dark:text-violet-400">
                      <IoMapOutline />
                    </span>
                    <div>
                      <p className="text-[10px] text-violet-600 dark:text-violet-400 uppercase tracking-widest font-semibold">
                        {t("location.coordinates")}
                      </p>
                      <p className="text-sm font-bold text-violet-800 dark:text-violet-300">
                        {t("location.coordinatesChanged")}
                      </p>
                    </div>
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
                {[
                  {
                    label: t("pricePerNight"),
                    value: listing.pricePerNight,
                    field: "pricePerNight",
                    show: listing.pricePerNight,
                    icon: <IoCashOutline />,
                  },
                  {
                    label: t("pricePerMonth"),
                    value: listing.pricePerMonth,
                    field: "pricePerMonth",
                    show: listing.pricePerMonth,
                    icon: <IoCashOutline />,
                  },
                  {
                    label: t("cleaningFee"),
                    value: listing.cleaningFee,
                    field: "cleaningFee",
                    show: listing.cleaningFee && listing.cleaningFee > 0,
                    icon: <IoCashOutline />,
                  },
                  {
                    label: t("securityDeposit"),
                    value: listing.securityDeposit,
                    field: "securityDeposit",
                    show:
                      listing.securityDeposit && listing.securityDeposit > 0,
                    icon: <IoCashOutline />,
                  },
                ].map(
                  ({ label, value, field, show, icon }) =>
                    show && (
                      <div
                        key={field}
                        className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border ${isFieldChanged(changes, field) ? "border-violet-400 bg-violet-50/30 dark:bg-violet-950/20" : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg text-gray-400 dark:text-slate-500">
                            {icon}
                          </span>
                          <span className="text-sm text-gray-500">{label}</span>
                        </div>
                        <div className="text-right">
                          <ModifiedBadge fieldName={field} changes={changes} />
                          <span className="text-sm font-bold text-gray-900 ml-2">
                            <HighlightedValue
                              currentValue={value}
                              oldValue={getOldValue(changes, field)}
                              isChanged={isFieldChanged(changes, field)}
                              formatValue={(v) => formatPrice(v)}
                            />
                          </span>
                        </div>
                      </div>
                    ),
                )}
                <div className="flex items-center justify-between pt-1 px-1">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    {t("rentalTypeLabel")}
                  </span>
                  <span className="text-xs font-medium text-gray-700 px-2 py-0.5 rounded-lg bg-gray-100">
                    <HighlightedValue
                      currentValue={t(`rentalType.${listing.rentalType}`, {
                        defaultValue: listing.rentalType,
                      })}
                      oldValue={
                        getOldValue(changes, "rentalType")
                          ? t(
                              `rentalType.${getOldValue(changes, "rentalType")}`,
                              {
                                defaultValue: getOldValue(
                                  changes,
                                  "rentalType",
                                ),
                              },
                            )
                          : null
                      }
                      isChanged={isFieldChanged(changes, "rentalType")}
                    />
                  </span>
                </div>
              </div>
            </Section>

            {/* Validation Panel */}
            {needsValidation && (
              <div
                className={`rounded-2xl overflow-hidden relative ${isRevision ? "bg-gradient-to-br from-violet-800 to-indigo-500" : "bg-gradient-to-br from-sky-500 to-indigo-500"}`}
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
                    <button
                      onClick={async () => {
                        const result = await handleValidate("approve");
                        showToast(
                          result.success ? "success" : "error",
                          result.message,
                        );
                        if (result.success)
                          setTimeout(
                            () =>
                              router.push(
                                `/${locale}/admin/listings/validation`,
                              ),
                            1500,
                          );
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
                    <button
                      onClick={async () => {
                        const result = await handleValidate("reject");
                        showToast(
                          result.success ? "success" : "error",
                          result.message,
                        );
                        if (result.success)
                          setTimeout(
                            () =>
                              router.push(
                                `/${locale}/admin/listings/validation`,
                              ),
                            1500,
                          );
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
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all text-sm ${rejectionReason === reason ? "bg-rose-500/20 border border-rose-400/40 text-white" : "bg-white/10 border border-transparent hover:bg-white/20 text-white/80"}`}
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
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
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
                  <div
                    className={`p-3.5 rounded-xl border ${isFieldChanged(changes, "owner.bio") ? "border-violet-400 bg-violet-50/30 dark:bg-violet-950/20" : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {t("owner.bio")}
                      </p>
                      <ModifiedBadge fieldName="owner.bio" changes={changes} />
                    </div>
                    <p className="text-xs leading-relaxed text-gray-500 dark:text-slate-400">
                      {listing.ownerBio}
                    </p>
                  </div>
                )}
                <div className="space-y-3">
                  {[
                    {
                      label: t("owner.phone"),
                      value: listing.owner.phoneNumber ?? t("notProvided"),
                      field: "owner.phoneNumber",
                      icon: <IoCallOutline />,
                    },
                    {
                      label: t("owner.email"),
                      value: listing.owner.email,
                      field: "owner.email",
                      icon: <IoMailOutline />,
                    },
                  ].map(({ label, value, field, icon }) => (
                    <div
                      key={field}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border ${isFieldChanged(changes, field) ? "border-violet-400 bg-violet-50/30 dark:bg-violet-950/20" : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"}`}
                    >
                      <span className="text-lg text-gray-400 dark:text-slate-500">
                        {icon}
                      </span>
                      <div>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest font-semibold">
                          {label}
                        </p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          <HighlightedValue
                            currentValue={value}
                            oldValue={getOldValue(changes, field)}
                            isChanged={isFieldChanged(changes, field)}
                          />
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            {/* Dates */}
            <Section title={t("sectionDates")} icon={<IoCalendarOutline />}>
              <div className="space-y-3">
                {[
                  {
                    label: t("dateCreated"),
                    value: formatDate(listing.createdAt),
                    field: "createdAt",
                    icon: <IoCalendarOutline />,
                  },
                  ...(listing.publishedAt
                    ? [
                        {
                          label: t("datePublished"),
                          value: formatDate(listing.publishedAt),
                          field: "publishedAt",
                          icon: <IoCalendarOutline />,
                        },
                      ]
                    : []),
                ].map(({ label, value, field, icon }) => (
                  <div
                    key={field}
                    className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border ${isFieldChanged(changes, field) ? "border-violet-400 bg-violet-50/30 dark:bg-violet-950/20" : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg text-gray-400 dark:text-slate-500">
                        {icon}
                      </span>
                      <span className="text-sm text-gray-500">{label}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      <HighlightedValue
                        currentValue={value}
                        oldValue={
                          getOldValue(changes, field)
                            ? formatDate(new Date(getOldValue(changes, field)))
                            : null
                        }
                        isChanged={isFieldChanged(changes, field)}
                      />
                    </span>
                  </div>
                ))}
                {listing.rejectionReason && (
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-red-400 bg-red-50/70 dark:bg-red-950/40">
                    <span className="text-lg text-red-500 dark:text-red-400">
                      <IoAlertCircleOutline />
                    </span>
                    <div>
                      <p className="text-[10px] text-red-600 dark:text-red-400 uppercase tracking-widest font-semibold">
                        {t("previousRejectionReason")}
                      </p>
                      <p className="text-sm font-bold text-red-800 dark:text-red-300">
                        <HighlightedValue
                          currentValue={listing.rejectionReason}
                          oldValue={getOldValue(changes, "rejectionReason")}
                          isChanged={isFieldChanged(changes, "rejectionReason")}
                        />
                      </p>
                    </div>
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
