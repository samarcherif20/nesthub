// app/[locale]/listings/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import AvailabilityCalendar from "@/components/ui/calendar/AvailabilityCalendar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { POILegend } from "@/components/ui/maps/POILegend";
import {
  IoHeartOutline,
  IoHeart,
  IoStar,
  IoLocationOutline,
  IoCheckmarkCircle,
  IoShareSocialOutline,
  IoBedOutline,
  IoCloseOutline,
  IoPeopleOutline,
  IoTimeOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoAlertCircleOutline,
  IoShieldCheckmarkOutline,
  IoCopyOutline,
  IoMailOutline,
  IoWifi,
  IoSnowOutline,
  IoFlameOutline,
  IoTvOutline,
  IoCarOutline,
  IoLeafOutline,
  IoWaterOutline,
  IoEyeOutline,
  IoBarbellOutline,
  IoRestaurantOutline,
  IoHomeOutline,
  IoPersonOutline,
  IoCalendarOutline,
  IoInformationCircleOutline,
  IoRemoveOutline,
  IoAddOutline,
  IoPlayOutline,
  IoPauseOutline,
  IoNavigateOutline,
  IoMapOutline,
  IoLocationSharp,
  IoWalkOutline,
  IoArrowUp,
} from "react-icons/io5";
import {
  FaSwimmingPool,
  FaParking,
  FaUtensils,
  FaWheelchair,
  FaBaby,
  FaDog,
  FaSmoking,
  FaShower,
  FaFire,
  FaWind,
  FaUmbrellaBeach,
  FaMountain,
  FaCity,
  FaCoffee,
  FaSnowflake,
} from "react-icons/fa";
import {
  MdOutlineSquareFoot,
  MdOutlineElevator,
  MdBalcony,
  MdOutlineDeck,
  MdMicrowave,
  MdOutlineIron,
  MdOutlineSafetyCheck,
} from "react-icons/md";
import { useListingTest as useListing } from "@/hooks/useListingTest";
import { TenantHeader } from "@/components/ui/header/TenantHeader";

// ✅ Import dynamique de ListingMap avec SSR désactivé
const ListingMap = dynamic(() => import("@/components/ui/maps/ListingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-slate-800 rounded-2xl">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-xs text-gray-500">Chargement de la carte...</p>
      </div>
    </div>
  ),
});

const GRAD = "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600";
const GRAD_TEXT =
  "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent";
const BTN_GRAD = `${GRAD} text-white font-bold shadow-lg shadow-indigo-200/60 dark:shadow-indigo-900/30 hover:opacity-90 active:scale-[.98] transition-all duration-200`;

const EQUIPMENT_MAP: Record<string, { label: string; icon: React.ReactNode }> =
  {
    // Connexion & Divertissement
    wifi: { label: "Wi-Fi haut débit", icon: <IoWifi /> },
    tv: { label: "Télévision", icon: <IoTvOutline /> },
    netflix: { label: "Netflix", icon: <IoTvOutline /> },
    cableTv: { label: "TV par câble", icon: <IoTvOutline /> },
    smartTv: { label: "Smart TV", icon: <IoTvOutline /> },

    // Climatisation & Chauffage
    ac: { label: "Climatisation", icon: <IoSnowOutline /> },
    airConditioning: { label: "Climatisation", icon: <IoSnowOutline /> },
    heating: { label: "Chauffage", icon: <IoFlameOutline /> },
    fan: { label: "Ventilateur", icon: <IoFlameOutline /> },

    // Cuisine & Électroménager
    kitchen: { label: "Cuisine équipée", icon: <FaUtensils /> },
    washer: { label: "Machine à laver", icon: <FaWind /> },
    washingMachine: { label: "Machine à laver", icon: <FaWind /> },
    dryer: { label: "Sèche-linge", icon: <FaWind /> },
    dishwasher: { label: "Lave-vaisselle", icon: <IoRestaurantOutline /> },
    oven: { label: "Four", icon: <IoRestaurantOutline /> },
    microwave: { label: "Micro-ondes", icon: <MdMicrowave /> },
    refrigerator: { label: "Réfrigérateur", icon: <FaSnowflake /> },
    coffeeMaker: { label: "Cafetière", icon: <FaCoffee /> },
    kettle: { label: "Bouilloire", icon: <FaCoffee /> },
    toaster: { label: "Grille-pain", icon: <FaUtensils /> },
    blender: { label: "Mixeur", icon: <FaUtensils /> },
    espressoMachine: { label: "Machine à expresso", icon: <FaCoffee /> },
    freezer: { label: "Congélateur", icon: <FaSnowflake /> },

    // Extérieur & Parking
    parking: { label: "Parking gratuit", icon: <FaParking /> },
    garage: { label: "Garage", icon: <FaParking /> },
    pool: { label: "Piscine", icon: <FaSwimmingPool /> },
    swimmingPool: { label: "Piscine", icon: <FaSwimmingPool /> },
    garden: { label: "Jardin", icon: <IoLeafOutline /> },
    terrace: { label: "Terrasse", icon: <MdOutlineDeck /> },
    balcony: { label: "Balcon", icon: <MdBalcony /> },
    bbq: { label: "Barbecue", icon: <FaFire /> },
    beachAccess: { label: "Accès plage", icon: <FaUmbrellaBeach /> },
    outdoorFurniture: { label: "Mobilier de jardin", icon: <IoLeafOutline /> },

    // Sports & Bien-être
    gym: { label: "Salle de sport", icon: <IoBarbellOutline /> },
    sauna: { label: "Sauna", icon: <IoWaterOutline /> },
    jacuzzi: { label: "Jacuzzi", icon: <IoWaterOutline /> },
    hammam: { label: "Hammam", icon: <IoWaterOutline /> },

    // Services & Sécurité
    elevator: { label: "Ascenseur", icon: <MdOutlineElevator /> },
    iron: { label: "Fer à repasser", icon: <MdOutlineIron /> },
    ironingBoard: { label: "Planche à repasser", icon: <MdOutlineIron /> },
    hairDryer: { label: "Sèche-cheveux", icon: <IoFlameOutline /> },
    hangers: { label: "Cintres", icon: <IoCheckmarkCircle /> },
    desk: { label: "Bureau", icon: <IoHomeOutline /> },
    workspace: { label: "Espace de travail", icon: <IoHomeOutline /> },
    printer: { label: "Imprimante", icon: <IoHomeOutline /> },
    vacuum: { label: "Aspirateur", icon: <FaWind /> },
    safe: { label: "Coffre-fort", icon: <MdOutlineSafetyCheck /> },
    smokeDetector: {
      label: "Détecteur de fumée",
      icon: <IoAlertCircleOutline />,
    },
    fireExtinguisher: { label: "Extincteur", icon: <IoAlertCircleOutline /> },
    firstAidKit: { label: "Kit de secours", icon: <IoCheckmarkCircle /> },
    securityCameras: {
      label: "Caméras de surveillance",
      icon: <IoShieldCheckmarkOutline />,
    },

    // Accessibilité
    wheelchair: { label: "Accessible PMR", icon: <FaWheelchair /> },
    shower: { label: "Douche italienne", icon: <FaShower /> },
    grabRails: { label: "Barres d'appui", icon: <FaWheelchair /> },

    // Enfants & Animaux
    babyBed: { label: "Lit bébé", icon: <FaBaby /> },
    crib: { label: "Lit bébé", icon: <FaBaby /> },
    highChair: { label: "Chaise haute", icon: <FaBaby /> },
    babyBath: { label: "Baignoire bébé", icon: <FaBaby /> },
    allowedPets: { label: "Animaux acceptés", icon: <FaDog /> },
    petsAllowed: { label: "Animaux acceptés", icon: <FaDog /> },

    // Règles
    smokingAllowed: { label: "Fumeurs acceptés", icon: <FaSmoking /> },
    allowedSmoking: { label: "Fumeurs acceptés", icon: <FaSmoking /> },
    noParties: { label: "Pas de fêtes", icon: <IoAlertCircleOutline /> },
    quietAfter22: { label: "Calme après 22h", icon: <IoTimeOutline /> },

    // Vues
    seaView: { label: "Vue sur mer", icon: <IoEyeOutline /> },
    mountainView: { label: "Vue sur montagne", icon: <FaMountain /> },
    cityView: { label: "Vue sur ville", icon: <FaCity /> },
    poolView: { label: "Vue sur piscine", icon: <IoEyeOutline /> },
    gardenView: { label: "Vue sur jardin", icon: <IoLeafOutline /> },

    // Services supplémentaires
    cleaning: { label: "Ménage inclus", icon: <IoCheckmarkCircle /> },
    linen: { label: "Draps et linge fournis", icon: <IoCheckmarkCircle /> },
    isFurnished: { label: "Meublé", icon: <IoHomeOutline /> },
    concierge: { label: "Conciergerie", icon: <IoPersonOutline /> },
    breakfast: { label: "Petit-déjeuner inclus", icon: <FaCoffee /> },
    airportShuttle: { label: "Navette aéroport", icon: <IoCarOutline /> },
    housekeeping: { label: "Ménage quotidien", icon: <IoCheckmarkCircle /> },

    // Extras
    hotWater: { label: "Eau chaude 24/7", icon: <IoWaterOutline /> },
    fireplace: { label: "Cheminée", icon: <FaFire /> },
    conciergeService: {
      label: "Service de conciergerie",
      icon: <IoPersonOutline />,
    },
  };

interface NearbyPOI {
  id: string;
  lat: number;
  lon: number;
  name: string;
  category: string;
  icon: string;
  color: string;
  distance: number;
  duration?: number;
}

function resolveEquipmentList(
  equipment: unknown,
  amenities: string[],
): { label: string; icon: React.ReactNode }[] {
  let keys: string[] = [];
  if (equipment && typeof equipment === "object" && !Array.isArray(equipment)) {
    keys = Object.entries(equipment as Record<string, unknown>)
      .filter(([, v]) => v === true || v === "true")
      .map(([k]) => k);
  } else if (Array.isArray(equipment) && equipment.length > 0) {
    keys = equipment as string[];
  } else if (amenities && amenities.length > 0) {
    keys = amenities;
  }

  const getTranslation = (key: string): string => {
    const translations: Record<string, string> = {
      ac: "Climatisation",
      pool: "Piscine",
      washer: "Machine à laver",
      dryer: "Sèche-linge",
      kitchen: "Cuisine équipée",
      wifi: "Wi-Fi",
      tv: "Télévision",
      parking: "Parking",
      elevator: "Ascenseur",
      balcony: "Balcon",
      garden: "Jardin",
      terrace: "Terrasse",
      gym: "Salle de sport",
      heating: "Chauffage",
      bbq: "Barbecue",
      safe: "Coffre-fort",
    };
    return (
      translations[key] ||
      key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")
    );
  };

  return keys.map((raw) => {
    if (EQUIPMENT_MAP[raw]) return EQUIPMENT_MAP[raw];
    const match = Object.entries(EQUIPMENT_MAP).find(
      ([key, value]) =>
        key.toLowerCase() === raw.toLowerCase() ||
        value.label.toLowerCase().includes(raw.toLowerCase()),
    );
    if (match) return match[1];
    return {
      label: getTranslation(raw),
      icon: <IoCheckmarkCircle />,
    };
  });
}

function parseHouseRules(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean) as string[];
  if (typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    const lines: string[] = [];
    if (r.checkIn) lines.push(`🕒 Arrivée à partir de ${r.checkIn}`);
    if (r.checkOut) lines.push(`🕒 Départ avant ${r.checkOut}`);
    if (r.noSmoking === true)
      lines.push("🚭 Interdiction de fumer dans le logement");
    if (r.noPets === true) lines.push("🐾 Animaux non autorisés");
    if (r.noParties === true) lines.push("🎉 Fêtes et événements interdits");
    if (r.quietHours) lines.push(`🔇 Calme après ${r.quietHours}`);
    if (r.customRules && typeof r.customRules === "string") {
      r.customRules
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((s) => lines.push(`📌 ${s}`));
    }
    if (r.petsAllowed === true) lines.push("🐕 Animaux acceptés");
    if (r.smokingAllowed === true)
      lines.push("🚬 Fumeurs acceptés (extérieur)");
    if (r.childrenAllowed === true) lines.push("👶 Enfants bienvenus");
    return lines;
  }
  return [];
}

function nightsBetween(a: string, b: string): number {
  if (!a || !b) return 0;
  const diff = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

function fmtDate(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getWalkingTime(distanceKm: number) {
  const walkingSpeed = 5;
  const minutes = Math.round((distanceKm / walkingSpeed) * 60);
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
}

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles = {
    success:
      "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300",
    error:
      "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/70 text-red-800 dark:text-red-300",
    info: "border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300",
  };
  const Icon =
    type === "success"
      ? IoCheckmarkCircle
      : type === "error"
        ? IoAlertCircleOutline
        : IoShieldCheckmarkOutline;

  return (
    <div className="fixed top-20 right-4 z-[80] max-w-sm animate-in slide-in-from-top-3 fade-in duration-300">
      <div
        className={`flex items-center gap-3 border rounded-xl px-4 py-3 shadow-xl backdrop-blur-sm text-sm font-medium ${styles[type]}`}
      >
        <Icon className="text-lg flex-shrink-0" />
        <span className="flex-1">{message}</span>
        <button onClick={onClose} className="ml-1 opacity-50 hover:opacity-100">
          <IoCloseOutline />
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="border-t border-gray-100 dark:border-slate-800/80 pt-6 mt-6 first:border-t-0 first:pt-0 first:mt-0">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold tracking-tight text-gray-900 dark:text-white">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-xs text-gray-500 dark:text-gray-400 w-36 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-sky-500"
          style={{ width: `${Math.round((value / 5) * 100)}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-6 text-right tabular-nums">
        {value}
      </span>
    </div>
  );
}

function ShareMenu({
  onClose,
  onCopy,
}: {
  onClose: () => void;
  onCopy: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-40 overflow-hidden"
    >
      <button
        onClick={() => {
          onCopy();
          onClose();
        }}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors"
      >
        <IoCopyOutline className="text-sky-500" /> Copier le lien
      </button>
      <button
        onClick={onClose}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors"
      >
        <IoMailOutline className="text-sky-500" /> Partager par email
      </button>
    </div>
  );
}

export default function ListingDetailPage() {
  const t = useTranslations("ListingPage");
  const params = useParams();
  const id = params.id as string;
  const {
    listing,
    loading,
    selectedImage,
    setSelectedImage,
    showAllPhotos,
    setShowAllPhotos,
    checkIn,
    setCheckIn,
    checkOut,
    setCheckOut,
    guests,
    setGuests,
  } = useListing(id);

  const [isFavorite, setIsFavorite] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [infoRequestLoading, setInfoRequestLoading] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [sentInfoRequest, setSentInfoRequest] = useState<any>(null);
  const [nearbyPOIs, setNearbyPOIs] = useState<NearbyPOI[]>([]);
  const [poiFilters, setPoiFilters] = useState<string[]>([]);
  const [loadingPOIs, setLoadingPOIs] = useState(false);
  const [showAllDistances, setShowAllDistances] = useState(false);
  const slideshowInterval = useRef<NodeJS.Timeout | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") =>
      setToast({ message, type }),
    [],
  );

  const getImageUrl = useCallback((url: string) => {
    if (!url) return "";
    if (url.includes("/api/listings/image")) return url;
    return `/api/listings/image?url=${encodeURIComponent(url)}`;
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) setIsFavorite((JSON.parse(saved) as string[]).includes(id));
  }, [id]);

  const fetchNearbyPOIs = useCallback(async () => {
    if (!listing?.latitude || !listing?.longitude) return;
    setLoadingPOIs(true);
    try {
      const res = await fetch(`/api/listings/${id}/pois?radius=10000`);
      const data = await res.json();
      if (data.success) {
        setNearbyPOIs(data.pois);
      }
    } catch (error) {
      console.error("Error fetching POIs:", error);
    } finally {
      setLoadingPOIs(false);
    }
  }, [listing?.latitude, listing?.longitude, id]);

  useEffect(() => {
    fetchNearbyPOIs();
  }, [fetchNearbyPOIs]);

  const filteredPOIs =
    poiFilters.length > 0
      ? nearbyPOIs.filter((p) => poiFilters.includes(p.category))
      : nearbyPOIs;

  const openInGoogleMaps = () => {
    if (listing?.latitude && listing?.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`;
      window.open(url, "_blank");
    }
  };

  const handleCalendarSelect = useCallback(
    (start: string, end: string) => {
      setCheckIn(start);
      setCheckOut(end);
    },
    [setCheckIn, setCheckOut],
  );

  const handlePoiClick = useCallback(
    (poi: NearbyPOI) => {
      if (listing?.latitude && listing?.longitude) {
        const url = `https://www.google.com/maps/dir/${listing.latitude},${listing.longitude}/${poi.lat},${poi.lon}`;
        window.open(url, "_blank");
      }
    },
    [listing?.latitude, listing?.longitude],
  );

  const handleToggleDistance = useCallback(() => {
    setShowAllDistances((prev) => !prev);
  }, []);

  const handleInfoRequest = async () => {
    if (!checkIn || !checkOut) {
      showToast(t("toast.selectDates"), "error");
      return;
    }
    setInfoRequestLoading(true);
    try {
      const response = await fetch("/api/info-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing?.id,
          message: `Séjour du ${fmtDate(checkIn)} au ${fmtDate(checkOut)} pour ${guests} personne(s).\n\nJe suis intéressé(e) par votre logement, pourriez-vous me donner plus d'informations ?`,
          checkIn,
          checkOut,
          guests,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setSentInfoRequest(data.infoRequest);
        setShowInfoModal(true);
        showToast(t("toast.requestSent"), "success");
      } else {
        showToast(data.error || t("toast.error"), "error");
      }
    } catch {
      showToast(t("toast.connectionError"), "error");
    } finally {
      setInfoRequestLoading(false);
    }
  };

  const handleToggleFavorite = () => {
    const next = !isFavorite;
    setIsFavorite(next);
    const saved = localStorage.getItem("favorites");
    let ids: string[] = saved ? JSON.parse(saved) : [];
    ids = next
      ? [...ids.filter((f) => f !== listing?.id), listing?.id!]
      : ids.filter((f) => f !== listing?.id);
    localStorage.setItem("favorites", JSON.stringify(ids));
    window.dispatchEvent(new Event("favorites-updated"));
    showToast(
      next ? t("toast.addedToFavorites") : t("toast.removedFromFavorites"),
      next ? "success" : "info",
    );
  };

  const incrementGuests = () => {
    if (listing?.maxGuests && guests < listing.maxGuests) setGuests(guests + 1);
  };
  const decrementGuests = () => {
    if (guests > 1) setGuests(guests - 1);
  };
  const goToPreviousImage = () => {
    if (selectedImage > 0) setSelectedImage(selectedImage - 1);
  };
  const goToNextImage = () => {
    if (listing?.images && selectedImage < listing.images.length - 1)
      setSelectedImage(selectedImage + 1);
  };
  const zoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const zoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const resetZoom = () => setZoomLevel(1);
  const startSlideshow = () => {
    if (slideshowInterval.current) clearInterval(slideshowInterval.current);
    setIsPlaying(true);
    slideshowInterval.current = setInterval(() => {
      if (listing?.images && selectedImage < listing.images.length - 1)
        setSelectedImage((prev) => prev + 1);
      else if (listing?.images && selectedImage === listing.images.length - 1)
        setSelectedImage(0);
    }, 3000);
  };
  const stopSlideshow = () => {
    if (slideshowInterval.current) {
      clearInterval(slideshowInterval.current);
      slideshowInterval.current = null;
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      if (slideshowInterval.current) clearInterval(slideshowInterval.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showAllPhotos) return;
      if (e.key === "ArrowLeft") goToPreviousImage();
      if (e.key === "ArrowRight") goToNextImage();
      if (e.key === "Escape") setShowAllPhotos(false);
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-") zoomOut();
      if (e.key === "0") resetZoom();
      if (e.key === " ") {
        e.preventDefault();
        isPlaying ? stopSlideshow() : startSlideshow();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAllPhotos, selectedImage, listing?.images, isPlaying]);

  if (loading)
    return (
      <LoadingSpinner
        fullScreen
        text={t("loading")}
        size="lg"
        color="primary"
        variant="spinner"
        speed="normal"
      />
    );
  if (!listing)
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-purple-100 dark:from-slate-950 dark:via-slate-800 dark:to-purple-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <IoHomeOutline className="text-5xl text-gray-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t("notFound")}
          </h3>
          <Link
            href="/fr/search"
            className="text-sky-600 dark:text-sky-400 hover:underline text-sm font-medium"
          >
            {t("backToSearch")}
          </Link>
        </div>
      </div>
    );

  const nights = nightsBetween(checkIn, checkOut);
  const basePrice = listing.pricePerNight * nights;
  const cleaningFee = listing.cleaningFee ?? 85;
  const serviceFee = Math.round(basePrice * 0.05);
  const totalToPay = basePrice + cleaningFee + serviceFee;
  const equipmentItems = resolveEquipmentList(
    listing.equipment,
    listing.amenities ?? [],
  );
  const visibleEquipment = showAllAmenities
    ? equipmentItems
    : equipmentItems.slice(0, 10);
  const houseRules = parseHouseRules(listing.houseRules);
  const totalPhotos = listing.images?.length || 0;
  const remainingPhotos = totalPhotos - 4;

  // Fonctions de formatage
  const formatMaxGuests = () => {
    if (!listing.maxGuests) return "Capacité non spécifiée";
    if (listing.maxGuests === 1) return "1 personne max.";
    return `${listing.maxGuests} personnes max.`;
  };

  const formatBathrooms = () => {
    if (listing.bathrooms === 1) return "1 salle de bain";
    return `${listing.bathrooms} salles de bain`;
  };

  const formatBedrooms = () => {
    if (listing.bedrooms === 1) return "1 chambre";
    return `${listing.bedrooms} chambres`;
  };

  const formatSurfaceArea = () => {
    if (!listing.surfaceArea) return null;
    return `${listing.surfaceArea} m²`;
  };

  const formatKitchens = () => {
    if (listing.numberOfKitchens === 1) return "1 cuisine";
    return `${listing.numberOfKitchens} cuisines`;
  };

  const formatFloorNumber = () => {
    if (listing.floorNumber === undefined || listing.floorNumber === null)
      return null;
    if (listing.floorNumber === 0) return "Rez-de-chaussée";
    if (listing.floorNumber === 1) return "1er étage";
    return `${listing.floorNumber}ème étage`;
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("fr-FR");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-purple-100 dark:from-slate-950 dark:via-slate-800 dark:to-purple-900">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
<TenantHeader></TenantHeader>
      {/* Info Request Modal */}
      {showInfoModal && sentInfoRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto mb-3">
                <IoCheckmarkCircle className="text-2xl text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {t("modal.title")}
              </h3>
              <div className="bg-sky-50 dark:bg-sky-950/30 rounded-xl p-3 mb-4 text-left">
                <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                  {t("modal.message")}
                </p>
                <div className="border-t border-sky-100 dark:border-sky-900/50 my-2 pt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <IoCalendarOutline className="text-sky-500" />{" "}
                    <span className="font-semibold">{t("modal.dates")}:</span>{" "}
                    {fmtDate(checkIn)} → {fmtDate(checkOut)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                    <IoPeopleOutline className="text-sky-500" />{" "}
                    <span className="font-semibold">{t("modal.guests")}:</span>{" "}
                    {guests} personne{guests > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="flex-1 px-3 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-200 transition"
                >
                  {t("modal.close")}
                </button>
                <Link href="/fr/notifications" className="flex-1">
                  <button className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition">
                    {t("modal.viewNotifications")}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="pt-6 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 py-3">
          <Link href="/fr" className="hover:text-gray-700 transition">
            Accueil
          </Link>
          <IoChevronForwardOutline className="text-[10px]" />
          <Link href="/fr/search" className="hover:text-gray-700 transition">
            Recherche
          </Link>
          <IoChevronForwardOutline className="text-[10px]" />
          <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[200px]">
            {listing.title}
          </span>
        </nav>

        {/* Title + actions */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-5">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-snug mb-1">
              {listing.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {listing.rating > 0 && (
                <div className="flex items-center gap-1 font-semibold text-gray-800">
                  <IoStar className="text-amber-400" />{" "}
                  <span>{listing.rating}</span>{" "}
                  <span className="text-gray-400">
                    ({listing.reviewCount} {t("reviews")})
                  </span>
                </div>
              )}
              {listing.isVerified && (
                <span className="flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                  <IoShieldCheckmarkOutline /> Vérifié
                </span>
              )}
              <div className="flex items-center gap-1 text-gray-500">
                <IoLocationOutline className="text-sky-500" />{" "}
                <span>{listing.location}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <button
                onClick={() => setShowShare((p) => !p)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium text-gray-600 hover:border-gray-300 bg-white dark:bg-slate-900"
              >
                <IoShareSocialOutline /> Partager
              </button>
              {showShare && (
                <ShareMenu
                  onClose={() => setShowShare(false)}
                  onCopy={() => {
                    navigator.clipboard.writeText(window.location.href);
                    showToast("Lien copié !", "success");
                  }}
                />
              )}
            </div>
            <button
              onClick={handleToggleFavorite}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                isFavorite
                  ? "border-red-200 text-red-500 bg-red-50"
                  : "border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-500 bg-white"
              }`}
            >
              {isFavorite ? <IoHeart /> : <IoHeartOutline />}{" "}
              {isFavorite ? "Sauvegardé" : "Sauvegarder"}
            </button>
          </div>
        </div>

        {/* Photo gallery */}
        <section className="mb-6">
          <div className="grid grid-cols-4 grid-rows-2 gap-1.5 h-[380px] rounded-xl overflow-hidden">
            <div
              className="col-span-4 md:col-span-2 row-span-2 relative group cursor-pointer overflow-hidden bg-gray-100"
              onClick={() => {
                setZoomLevel(1);
                setShowAllPhotos(true);
              }}
            >
              {listing.images?.[0] ? (
                <img
                  alt={listing.title}
                  src={getImageUrl(listing.images[0])}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  onError={(e) => {
                    console.error(
                      "Erreur chargement image:",
                      listing.images[0],
                    );
                    setImageErrors((prev) => ({ ...prev, [0]: true }));
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <IoHomeOutline className="text-4xl text-gray-300" />
                </div>
              )}
            </div>
            {listing.images?.slice(1, 4).map((img, idx) => (
              <div
                key={idx}
                className="hidden md:block col-span-1 row-span-1 relative group cursor-pointer overflow-hidden bg-gray-100"
                onClick={() => {
                  setSelectedImage(idx + 1);
                  setZoomLevel(1);
                  setShowAllPhotos(true);
                }}
              >
                <img
                  alt={`Vue ${idx + 2}`}
                  src={getImageUrl(img)}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  onError={(e) => {
                    console.error("Erreur chargement image:", img);
                    setImageErrors((prev) => ({ ...prev, [idx + 1]: true }));
                  }}
                />
              </div>
            ))}
            {totalPhotos > 4 && (
              <div
                className="hidden md:block col-span-1 row-span-1 relative group cursor-pointer overflow-hidden bg-gray-100"
                onClick={() => {
                  setSelectedImage(4);
                  setZoomLevel(1);
                  setShowAllPhotos(true);
                }}
              >
                <img
                  alt="Plus de photos"
                  src={getImageUrl(listing.images[4])}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  onError={(e) => {
                    console.error(
                      "Erreur chargement image:",
                      listing.images[4],
                    );
                    setImageErrors((prev) => ({ ...prev, [4]: true }));
                  }}
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                    +{remainingPhotos}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Lightbox */}
        {showAllPhotos && (
          <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center">
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full px-3 py-1.5">
              <button
                onClick={zoomOut}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <IoRemoveOutline className="text-base" />
              </button>
              <span className="text-white text-xs font-mono min-w-[45px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={zoomIn}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <IoAddOutline className="text-base" />
              </button>
              <div className="w-px h-5 bg-white/20 mx-1" />
              <button
                onClick={resetZoom}
                className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs"
              >
                Reset
              </button>
              <div className="w-px h-5 bg-white/20 mx-1" />
              <button
                onClick={isPlaying ? stopSlideshow : startSlideshow}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                {isPlaying ? (
                  <IoPauseOutline className="text-base" />
                ) : (
                  <IoPlayOutline className="text-base" />
                )}
              </button>
            </div>
            <button
              onClick={() => {
                stopSlideshow();
                setShowAllPhotos(false);
                setZoomLevel(1);
              }}
              className="absolute top-3 right-3 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10"
            >
              <IoCloseOutline className="text-2xl" />
            </button>
            <button
              onClick={goToPreviousImage}
              disabled={selectedImage === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white disabled:opacity-20"
            >
              <IoChevronBackOutline className="text-xl" />
            </button>
            <button
              onClick={goToNextImage}
              disabled={selectedImage === totalPhotos - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white disabled:opacity-20"
            >
              <IoChevronForwardOutline className="text-xl" />
            </button>
            <div className="relative w-full max-w-5xl mx-auto px-12 overflow-hidden">
              <div className="flex justify-center items-center min-h-[55vh]">
                {listing.images?.[selectedImage] ? (
                  <img
                    src={getImageUrl(listing.images[selectedImage])}
                    alt=""
                    className="transition-transform duration-300 ease-out max-h-[65vh] object-contain"
                    style={{ transform: `scale(${zoomLevel})` }}
                    onError={(e) => {
                      console.error(
                        "Erreur chargement image lightbox:",
                        listing.images[selectedImage],
                      );
                    }}
                  />
                ) : (
                  <div className="w-full h-64 bg-slate-800 rounded-xl flex items-center justify-center">
                    <IoHomeOutline className="text-3xl text-slate-600" />
                  </div>
                )}
              </div>
              <p className="text-center text-white/40 text-xs mt-2">
                {selectedImage + 1} / {totalPhotos}
              </p>
              <div className="flex justify-center gap-1.5 mt-3 overflow-x-auto pb-2">
                {listing.images?.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedImage(idx);
                      resetZoom();
                    }}
                    className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 transition-all ring-2 ${
                      selectedImage === idx
                        ? "ring-white opacity-100"
                        : "ring-transparent opacity-40 hover:opacity-60"
                    }`}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error("Erreur chargement miniature:", img);
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT column */}
          <div className="lg:w-[60%]">
            {/* Stat chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { icon: <IoBedOutline />, label: formatBedrooms(), show: true },
                {
                  icon: <FaShower />,
                  label: formatBathrooms(),
                  show: listing.bathrooms > 0,
                },
                {
                  icon: <IoPeopleOutline />,
                  label: formatMaxGuests(),
                  show: true,
                },
                {
                  icon: <MdOutlineSquareFoot />,
                  label: formatSurfaceArea(),
                  show: !!listing.surfaceArea,
                },
                {
                  icon: <FaUtensils />,
                  label: formatKitchens(),
                  show: listing.numberOfKitchens > 0,
                },
                {
                  icon: <IoArrowUp />,
                  label: formatFloorNumber(),
                  show: !!formatFloorNumber(),
                },
                {
                  icon: <MdOutlineElevator />,
                  label: "Ascenseur",
                  show: listing.hasElevator === true,
                },
                {
                  icon: <MdBalcony />,
                  label: "Balcon/Terrasse",
                  show: listing.hasBalcony === true,
                },
                {
                  icon: <IoLeafOutline />,
                  label: "Jardin",
                  show: listing.hasGarden === true,
                },
                {
                  icon: <FaParking />,
                  label: "Garage/Parking",
                  show: listing.hasGarage === true,
                },
              ]
                .filter((item) => item.show && item.label)
                .map(({ icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs font-medium border border-gray-200 dark:border-slate-700"
                  >
                    <span className="text-sky-500 text-xs">{icon}</span> {label}
                  </span>
                ))}
            </div>

            {/* Host card */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700 mb-6">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {listing.owner?.username?.charAt(0)?.toUpperCase() ?? "H"}
                  </div>
                  {listing.owner?.isVerified && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                      <IoCheckmarkCircle className="text-white text-[8px]" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">
                    Hébergé par
                  </p>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">
                    @{listing.owner?.username || listing.owner?.name}
                  </p>
                </div>
              </div>
              {listing.rating > 0 && (
                <div className="text-right shrink-0">
                  <div className="flex items-center justify-end gap-0.5">
                    <IoStar className="text-amber-400 text-xs" />
                    <span className="font-extrabold text-lg text-gray-900 dark:text-white">
                      {listing.rating}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Score confiance
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            {listing.description?.trim() && (
              <Section title="À propos">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {listing.description}
                </p>
              </Section>
            )}

            {/* Equipment */}
            {equipmentItems.length > 0 && (
              <Section
                title="Équipements"
                action={
                  equipmentItems.length > 10 ? (
                    <button
                      onClick={() => setShowAllAmenities((p) => !p)}
                      className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 underline"
                    >
                      {showAllAmenities
                        ? "Voir moins"
                        : `Voir les ${equipmentItems.length}`}
                    </button>
                  ) : undefined
                }
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {visibleEquipment.map(({ label, icon }, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800/40 border text-xs text-gray-700 dark:text-gray-300"
                    >
                      <span className="text-sky-500 shrink-0 text-sm">
                        {icon}
                      </span>{" "}
                      {label}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Calendar */}
            <Section title="Disponibilités">
              <p className="text-xs text-gray-400 -mt-1 mb-3">
                Sélectionnez vos dates
              </p>
              {checkIn && checkOut && nights > 0 && (
                <div className="inline-flex items-center gap-2 mb-3 px-2 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-800">
                  <IoCalendarOutline className="text-sky-500 text-sm" />
                  <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-400">
                    {nights} nuit{nights > 1 ? "s" : ""} · {fmtDate(checkIn)} →{" "}
                    {fmtDate(checkOut)}
                  </span>
                  <button
                    onClick={() => {
                      setCheckIn("");
                      setCheckOut("");
                    }}
                    className="text-sky-400"
                  >
                    <IoCloseOutline className="text-xs" />
                  </button>
                </div>
              )}
              <div className="bg-gray-50 dark:bg-slate-800/40 rounded-xl p-3 border">
                <AvailabilityCalendar
                  availability={listing.availability}
                  blockedDates={listing.blockedDates}
                  pendingDates={listing.pendingDates}
                  selectedStart={checkIn}
                  selectedEnd={checkOut}
                  onSelectRange={handleCalendarSelect}
                />
              </div>
            </Section>

            {/* Reviews */}
            {listing.reviewCount > 0 && (
              <Section
                title={`${listing.rating} · ${listing.reviewCount} avis`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {[
                    ["Propreté", 4.9],
                    ["Précision", 4.8],
                    ["Communication", 5.0],
                    ["Emplacement", 4.7],
                    ["Arrivée", 4.9],
                    ["Rapport qualité-prix", 4.6],
                  ].map(([l, v]) => (
                    <ScoreBar
                      key={l as string}
                      label={l as string}
                      value={v as number}
                    />
                  ))}
                </div>
              </Section>
            )}

            {/* House rules */}
            <Section title="Règlement">
              {houseRules.length > 0 ? (
                <ul className="space-y-2">
                  {houseRules.map((rule, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400"
                    >
                      <IoTimeOutline className="text-sky-400 shrink-0 mt-0.5 text-sm" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 dark:bg-slate-800/40 border">
                  <IoInformationCircleOutline className="text-gray-300 text-base shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Aucun règlement spécifique renseigné.
                  </p>
                </div>
              )}
            </Section>
          </div>
          {/* RIGHT column: Booking widget */}
          <aside className="lg:w-[40%]">
            <div className="sticky top-20 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 px-4 py-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider mb-0.5">
                      Tarif par nuit
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-white leading-none">
                        {formatPrice(listing.pricePerNight)} TND
                      </span>
                    </div>
                  </div>
                  {listing.rating > 0 && (
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <IoStar className="text-amber-300 text-xs" />
                        <span className="font-bold text-white text-sm">
                          {listing.rating}
                        </span>
                      </div>
                      <p className="text-white/60 text-[10px]">
                        {listing.reviewCount} avis
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 space-y-3">
                {/* Date pickers */}
                <div className="rounded-lg border overflow-hidden divide-y bg-gray-50 dark:bg-slate-800">
                  <div className="grid grid-cols-2 divide-x">
                    <div className="p-2">
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-sky-500 mb-0.5">
                        Arrivée
                      </label>
                      <input
                        type="date"
                        value={checkIn}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => {
                          setCheckIn(e.target.value);
                          if (checkOut && e.target.value >= checkOut)
                            setCheckOut("");
                        }}
                        className="w-full text-xs bg-transparent focus:outline-none text-gray-800 dark:text-gray-200 dark:[color-scheme:dark]"
                      />
                    </div>
                    <div className="p-2">
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-purple-500 mb-0.5">
                        Départ
                      </label>
                      <input
                        type="date"
                        value={checkOut}
                        min={checkIn || new Date().toISOString().split("T")[0]}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="w-full text-xs bg-transparent focus:outline-none text-gray-800 dark:text-gray-200 dark:[color-scheme:dark]"
                      />
                    </div>
                  </div>

                  {/* ✅ CORRECTION ICI - Guest selector avec des fonctions correctes */}
                  <div className="p-2">
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-indigo-500 mb-1">
                      Voyageurs
                    </label>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (guests > 1) {
                              setGuests(guests - 1);
                            }
                          }}
                          disabled={guests <= 1}
                          className="w-7 h-7 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          type="button"
                        >
                          <IoRemoveOutline className="text-sm" />
                        </button>
                        <span className="text-sm font-semibold w-8 text-center">
                          {guests}
                        </span>
                        <button
                          onClick={() => {
                            if (
                              listing.maxGuests &&
                              guests < listing.maxGuests
                            ) {
                              setGuests(guests + 1);
                            }
                          }}
                          disabled={
                            listing.maxGuests
                              ? guests >= listing.maxGuests
                              : false
                          }
                          className="w-7 h-7 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          type="button"
                        >
                          <IoAddOutline className="text-sm" />
                        </button>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        Max{" "}
                        {listing.maxGuests
                          ? `${listing.maxGuests} pers.`
                          : "Non spécifié"}
                      </span>
                    </div>
                    {/* Affichage du message si max atteint */}
                    {guests === listing.maxGuests && listing.maxGuests && (
                      <p className="text-[9px] text-amber-500 mt-1 text-center">
                        Capacité maximale atteinte
                      </p>
                    )}
                  </div>
                </div>

                {/* Price breakdown */}
                {checkIn && checkOut && nights > 0 ? (
                  <div className="rounded-lg bg-gray-50 dark:bg-slate-800 p-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>
                        {formatPrice(listing.pricePerNight)} TND × {nights} nuit
                        {nights > 1 ? "s" : ""}
                      </span>
                      <span className="font-semibold">
                        {formatPrice(basePrice)} TND
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Frais de ménage</span>
                      <span>{formatPrice(cleaningFee)} TND</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Frais de service (5%)</span>
                      <span>{formatPrice(serviceFee)} TND</span>
                    </div>
                    <div className="pt-2 border-t flex justify-between font-extrabold text-sm">
                      <span className={GRAD_TEXT}>Total</span>
                      <span className={GRAD_TEXT}>
                        {formatPrice(totalToPay)} TND
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-3 text-center text-xs text-gray-400 bg-gray-50 dark:bg-slate-800">
                    Sélectionnez vos dates pour voir le prix total
                  </div>
                )}

                {/* Info request button */}
                <button
                  onClick={handleInfoRequest}
                  disabled={infoRequestLoading || !checkIn || !checkOut}
                  className={`w-full py-2.5 rounded-lg text-xs font-extrabold transition-all ${
                    checkIn && checkOut && !infoRequestLoading
                      ? BTN_GRAD
                      : "bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {infoRequestLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Envoi...
                    </span>
                  ) : !checkIn || !checkOut ? (
                    "Choisissez vos dates"
                  ) : (
                    "Demander une information"
                  )}
                </button>
                <p className="text-center text-[10px] text-gray-400">
                  Aucun engagement, l'hôte vous répondra sous 24h
                </p>

                {/* Security badges */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {[
                    {
                      icon: <IoShieldCheckmarkOutline />,
                      label: "Paiement sécurisé",
                    },
                    {
                      icon: <IoCheckmarkCircle />,
                      label: "Annulation flexible",
                    },
                    { icon: <IoPersonOutline />, label: "Support 24h/24" },
                  ].map(({ icon, label }) => (
                    <div
                      key={label}
                      className="text-center p-2 rounded-lg bg-gray-50 dark:bg-slate-800 border"
                    >
                      <span className="flex justify-center text-indigo-400 mb-1 text-base">
                        {icon}
                      </span>
                      <p className="text-[9px] text-gray-500 dark:text-gray-400 font-medium leading-tight">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* LOCALISATION SECTION WITH MAP AND POIs */}
        <Section title="📍 Localisation et quartier">
          <div className="space-y-4">
            {/* Adresse et bouton Google Maps */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <IoLocationSharp className="text-sky-500 text-base" />
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {listing.street && `${listing.street}, `}
                    {listing.delegation && `${listing.delegation}, `}
                    {listing.governorate}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Tunisie</p>
                </div>
              </div>
              <button
                onClick={openInGoogleMaps}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-xs font-semibold hover:opacity-90 transition"
              >
                <IoNavigateOutline className="text-sm" />
                Ouvrir dans Maps
              </button>
            </div>

            {/* Carte avec ListingMap */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-slate-700">
              <div className="h-[450px] w-full">
                {(() => {
                  const lat = listing?.latitude;
                  const lng = listing?.longitude;

                  if (lat && lng) {
                    return (
                      <ListingMap
                        homeLat={lat}
                        homeLng={lng}
                        pois={filteredPOIs}
                        zoom={14}
                        onPoiClick={handlePoiClick}
                        showAllDistances={showAllDistances}
                      />
                    );
                  } else {
                    return (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-slate-800">
                        <IoMapOutline className="text-4xl text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">
                          Position non disponible
                        </p>
                      </div>
                    );
                  }
                })()}
              </div>

              {/* Légende des POIs */}
              {nearbyPOIs.length > 0 && (
                <POILegend
                  pois={nearbyPOIs}
                  onFilterChange={setPoiFilters}
                  onToggleDistance={handleToggleDistance}
                  showAllDistances={showAllDistances}
                />
              )}

              {/* Indicateur de chargement */}
              {loadingPOIs && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-xs text-gray-500">
                      Chargement des points d'intérêt...
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Liste des POIs */}
            {nearbyPOIs.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <IoLocationSharp className="text-sky-500" />
                    Points d'intérêt à proximité
                  </h3>
                  <span className="text-[10px] text-gray-400">
                    {nearbyPOIs.length} lieux trouvés
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                  {filteredPOIs.slice(0, 12).map((poi) => (
                    <div
                      key={poi.id}
                      onClick={() => handlePoiClick(poi)}
                      className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-slate-800/40 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer group"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${poi.color}20` }}
                      >
                        <span className="text-base">{poi.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                          {poi.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-400">
                            {poi.distance?.toFixed(1)} km
                          </span>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                            <IoWalkOutline className="text-[9px]" />
                            {getWalkingTime(poi.distance || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {filteredPOIs.length > 12 && (
                  <p className="text-center text-[10px] text-gray-400 mt-2">
                    +{filteredPOIs.length - 12} autres lieux disponibles sur la
                    carte
                  </p>
                )}
              </div>
            )}

            {/* Transport info */}
            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40">
              <div className="flex items-start gap-2">
                <IoInformationCircleOutline className="text-sky-500 text-base mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-sky-700 dark:text-sky-400 mb-1">
                    Transport à proximité
                  </p>
                  <p className="text-[11px] text-sky-600 dark:text-sky-300 leading-relaxed">
                    Le quartier est bien desservi. De nombreux commerces,
                    restaurants et services sont accessibles à pied ou à
                    quelques minutes en voiture.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Section>
      </main>
    </div>
  );
}
