"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import AvailabilityCalendar from "@/components/ui/calendar/AvailabilityCalendar";
import {
  IoHeartOutline,
  IoHeart,
  IoStar,
  IoLocationOutline,
  IoCheckmarkCircle,
  IoShareSocialOutline,
  IoNotificationsOutline,
  IoBedOutline,
  IoCloseOutline,
  IoPeopleOutline,
  IoTimeOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoAlertCircleOutline,
  IoShieldCheckmarkOutline,
  IoGridOutline,
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
import { useListing } from "../hooks/useListing";

// ─── Design tokens ────────────────────────────────────────────────────────────

const GRAD = "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600";
const GRAD_TEXT =
  "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent";
const BTN_GRAD = `${GRAD} text-white font-bold shadow-lg shadow-indigo-200/60 dark:shadow-indigo-900/30 hover:opacity-90 active:scale-[.98] transition-all duration-200`;

// ─── Equipment map - noms français depuis la base de données ──────────────────

const EQUIPMENT_MAP: Record<string, { label: string; icon: React.ReactNode }> =
  {
    wifi: { label: "Wi-Fi", icon: <IoWifi /> },
    parking: { label: "Parking", icon: <FaParking /> },
    swimmingPool: { label: "Piscine", icon: <FaSwimmingPool /> },
    airConditioning: { label: "Climatisation", icon: <IoSnowOutline /> },
    kitchen: { label: "Cuisine équipée", icon: <FaUtensils /> },
    tv: { label: "Télévision", icon: <IoTvOutline /> },
    heating: { label: "Chauffage", icon: <IoFlameOutline /> },
    washingMachine: { label: "Machine à laver", icon: <FaWind /> },
    dryer: { label: "Sèche-linge", icon: <FaWind /> },
    dishwasher: { label: "Lave-vaisselle", icon: <IoRestaurantOutline /> },
    oven: { label: "Four", icon: <IoRestaurantOutline /> },
    microwave: { label: "Micro-ondes", icon: <MdMicrowave /> },
    coffeeMaker: { label: "Cafetière", icon: <FaCoffee /> },
    refrigerator: { label: "Réfrigérateur", icon: <FaSnowflake /> },
    balcony: { label: "Balcon", icon: <MdBalcony /> },
    garden: { label: "Jardin", icon: <IoLeafOutline /> },
    terrace: { label: "Terrasse", icon: <MdOutlineDeck /> },
    elevator: { label: "Ascenseur", icon: <MdOutlineElevator /> },
    gym: { label: "Salle de sport", icon: <IoBarbellOutline /> },
    sauna: { label: "Sauna", icon: <IoWaterOutline /> },
    jacuzzi: { label: "Jacuzzi", icon: <IoWaterOutline /> },
    beachAccess: { label: "Accès plage", icon: <FaUmbrellaBeach /> },
    seaView: { label: "Vue mer", icon: <IoEyeOutline /> },
    mountainView: { label: "Vue montagne", icon: <FaMountain /> },
    cityView: { label: "Vue ville", icon: <FaCity /> },
    babyBed: { label: "Lit bébé", icon: <FaBaby /> },
    workDesk: { label: "Bureau", icon: <IoHomeOutline /> },
    allowedPets: { label: "Animaux acceptés", icon: <FaDog /> },
    allowedSmoking: { label: "Fumeurs acceptés", icon: <FaSmoking /> },
    eventsAllowed: { label: "Événements autorisés", icon: <FaUmbrellaBeach /> },
    iron: { label: "Fer à repasser", icon: <MdOutlineIron /> },
    safe: { label: "Coffre-fort", icon: <MdOutlineSafetyCheck /> },
    shower: { label: "Douche italienne", icon: <FaShower /> },
    fireplace: { label: "Cheminée", icon: <FaFire /> },
    wheelchair: { label: "Accès PMR", icon: <FaWheelchair /> },
    car: { label: "Véhicule inclus", icon: <IoCarOutline /> },
  };

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

  return keys.map((raw) => {
    if (EQUIPMENT_MAP[raw]) {
      return EQUIPMENT_MAP[raw];
    }
    const match = Object.values(EQUIPMENT_MAP).find(
      (e) => e.label.toLowerCase() === raw.toLowerCase(),
    );
    if (match) return match;
    return {
      label: raw.charAt(0).toUpperCase() + raw.slice(1).replace(/_/g, " "),
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
    if (r.checkIn) lines.push(`Arrivée à partir de ${r.checkIn}`);
    if (r.checkOut) lines.push(`Départ avant ${r.checkOut}`);
    if (r.noSmoking === true)
      lines.push("Interdiction de fumer dans le logement");
    if (r.noPets === true) lines.push("Animaux non autorisés");
    if (r.noParties === true) lines.push("Fêtes non autorisées");
    if (r.quietHours) lines.push(`Calme après ${r.quietHours}`);
    if (r.customRules && typeof r.customRules === "string")
      r.customRules
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((s) => lines.push(s));
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

// ─── Toast ────────────────────────────────────────────────────────────────────

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
    <div className="fixed top-24 right-4 z-[80] max-w-sm animate-in slide-in-from-top-3 fade-in duration-300">
      <div
        className={`flex items-center gap-3 border rounded-xl px-4 py-3 shadow-xl backdrop-blur-sm text-sm font-medium ${styles[type]}`}
      >
        <Icon className="text-lg flex-shrink-0" />
        <span className="flex-1">{message}</span>
        <button
          onClick={onClose}
          className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
        >
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
    <section className="border-t border-gray-100 dark:border-slate-800/80 pt-10 mt-10 first:border-t-0 first:pt-0 first:mt-0">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[17px] font-bold tracking-tight text-gray-900 dark:text-white">
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
      <span className="text-sm text-gray-500 dark:text-gray-400 w-44 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-[3px] bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-sky-500"
          style={{ width: `${Math.round((value / 5) * 100)}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-7 text-right tabular-nums">
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
      className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-40 overflow-hidden"
    >
      <button
        onClick={() => {
          onCopy();
          onClose();
        }}
        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-colors"
      >
        <IoCopyOutline className="text-sky-500" />
        Copier le lien
      </button>
      <button
        onClick={onClose}
        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-colors"
      >
        <IoMailOutline className="text-sky-500" />
        Partager par email
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ListingDetailPage() {
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
  const slideshowInterval = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") =>
      setToast({ message, type }),
    [],
  );

  // Load favourite
  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) setIsFavorite((JSON.parse(saved) as string[]).includes(id));
  }, [id]);

  // Calendar → widget sync
  const handleCalendarSelect = useCallback(
    (start: string, end: string) => {
      setCheckIn(start);
      setCheckOut(end);
    },
    [setCheckIn, setCheckOut],
  );

  // Demande d'information avec appel API réel
  const handleInfoRequest = async () => {
    const isLoggedIn =
      localStorage.getItem("clerk-user") ||
      document.cookie.includes("__session");

    if (!isLoggedIn) {
      if (
        window.confirm(
          "Vous devez être connecté pour contacter l'hôte. Voulez-vous vous connecter ?",
        )
      ) {
        window.location.href = "/fr/sign-in";
      }
      return;
    }

    if (!checkIn || !checkOut) {
      showToast("Veuillez sélectionner vos dates de séjour", "error");
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
        showToast(
          "Demande d'information envoyée avec succès ! L'hôte vous répondra rapidement.",
          "success",
        );
      } else {
        showToast(data.error || "Une erreur est survenue", "error");
      }
    } catch (error) {
      console.error("Erreur:", error);
      showToast("Erreur de connexion. Veuillez réessayer.", "error");
    } finally {
      setInfoRequestLoading(false);
    }
  };

  const closeInfoModal = () => {
    setShowInfoModal(false);
    setSentInfoRequest(null);
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
      next ? "Ajouté aux favoris" : "Retiré des favoris",
      next ? "success" : "info",
    );
  };

  // Price
  const nights = nightsBetween(checkIn, checkOut);
  const basePrice = listing ? listing.pricePerNight * nights : 0;
  const cleaningFee = listing?.cleaningFee ?? 85;
  const serviceFee = Math.round(basePrice * 0.05);
  const totalToPay = basePrice + cleaningFee + serviceFee;

  const equipmentItems = listing
    ? resolveEquipmentList(listing.equipment, listing.amenities ?? [])
    : [];
  const visibleEquipment = showAllAmenities
    ? equipmentItems
    : equipmentItems.slice(0, 10);

  const houseRules = listing ? parseHouseRules(listing.houseRules) : [];

  // Gestionnaire pour le compteur de voyageurs
  const incrementGuests = () => {
    if (listing && guests < listing.maxGuests) {
      setGuests(guests + 1);
    }
  };

  const decrementGuests = () => {
    if (guests > 1) {
      setGuests(guests - 1);
    }
  };

  // Navigation dans la lightbox
  const goToPreviousImage = () => {
    if (selectedImage > 0) {
      setSelectedImage(selectedImage - 1);
    }
  };

  const goToNextImage = () => {
    if (listing?.images && selectedImage < listing.images.length - 1) {
      setSelectedImage(selectedImage + 1);
    }
  };

  // Zoom
  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  // Diaporama
  const startSlideshow = () => {
    if (slideshowInterval.current) clearInterval(slideshowInterval.current);
    setIsPlaying(true);
    slideshowInterval.current = setInterval(() => {
      if (listing?.images && selectedImage < listing.images.length - 1) {
        setSelectedImage((prev) => prev + 1);
      } else if (
        listing?.images &&
        selectedImage === listing.images.length - 1
      ) {
        setSelectedImage(0);
      }
    }, 3000);
  };

  const stopSlideshow = () => {
    if (slideshowInterval.current) {
      clearInterval(slideshowInterval.current);
      slideshowInterval.current = null;
    }
    setIsPlaying(false);
  };

  // Nettoyage du diaporama
  useEffect(() => {
    return () => {
      if (slideshowInterval.current) clearInterval(slideshowInterval.current);
    };
  }, []);

  // Raccourcis clavier pour la lightbox
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl mx-auto bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 animate-pulse" />
          <p className="text-sm font-medium text-gray-400 dark:text-gray-600">
            Chargement…
          </p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <IoHomeOutline className="text-5xl text-gray-200 dark:text-slate-700 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Annonce introuvable
          </h3>
          <Link
            href="/fr/search"
            className="text-sky-600 dark:text-sky-400 hover:underline text-sm font-medium"
          >
            Retour à la recherche
          </Link>
        </div>
      </div>
    );
  }

  const totalPhotos = listing.images?.length || 0;
  const remainingPhotos = totalPhotos - 4;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-100 antialiased transition-colors duration-300">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Modal de confirmation après envoi de la demande */}
      {showInfoModal && sentInfoRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <IoCheckmarkCircle className="text-3xl text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Demande envoyée ! ✅
              </h3>
              <div className="bg-sky-50 dark:bg-sky-950/30 rounded-xl p-4 mb-4 text-left">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Votre demande d'information a bien été transmise au
                  propriétaire.
                </p>
                <div className="border-t border-sky-100 dark:border-sky-900/50 my-3 pt-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <IoCalendarOutline className="text-sky-500" />
                    <span className="font-semibold">Dates sélectionnées :</span>
                    {fmtDate(checkIn)} → {fmtDate(checkOut)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                    <IoPeopleOutline className="text-sky-500" />
                    <span className="font-semibold">Voyageurs :</span>
                    {guests} personne{guests > 1 ? "s" : ""}
                  </p>
                  {sentInfoRequest.reference && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                      <IoShieldCheckmarkOutline className="text-sky-500" />
                      <span className="font-semibold">Référence :</span>
                      {sentInfoRequest.reference}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                📧 Le propriétaire vous répondra par email et dans votre espace
                notifications.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={closeInfoModal}
                  className="flex-1 px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-slate-700 transition"
                >
                  Fermer
                </button>
                <Link href="/fr/notifications" className="flex-1">
                  <button className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-purple-600 text-white font-semibold hover:opacity-90 transition">
                    Voir mes notifications
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 h-16 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800/80 flex items-center px-5 lg:px-10 justify-between transition-colors duration-300">
        <div className="flex items-center gap-5">
          <Link href="/fr/search" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 shrink-0" />
            <span className="font-extrabold text-[17px] tracking-tight bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              NestHub
            </span>
          </Link>
          <div className="hidden md:flex gap-4">
            <Link
              href="/fr/search"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
            >
              Explorer
            </Link>
            <Link
              href="/fr/favorites"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
            >
              Favoris
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <IoNotificationsOutline className="text-xl" />
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-offset-2 ring-indigo-200 dark:ring-indigo-800 ring-offset-white dark:ring-offset-slate-950">
            <img
              alt="Profil"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWgtC4nvS1MTwfCM4JrdsgQfoHYn--1LZFwFiggqJAZL_J7iD21_fcx4YBoLbKgZvu2Sk9hE2gyRaH_Z8GKpuaco4Kou_9vEGctBEKNqzI5eDHFv2jJzF08dbdzDDYj9lyHeNmnzI3rMpIPOsTC-i3q2CT7T2VrDxaFCPep-FK1n1siRJZEcOuxA1aBnL8-gD5A8pQPMebIbSYJHta5cUTjLF1Jhg7BDId9b3Xd6cUhs3x96NU0JrLlQih4mE5uz2FFpIxZyvmxdkd"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </nav>

      <main className="pt-16 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-600 py-4">
          <Link
            href="/fr"
            className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
          >
            Accueil
          </Link>
          <IoChevronForwardOutline className="text-[10px]" />
          <Link
            href="/fr/search"
            className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
          >
            Recherche
          </Link>
          <IoChevronForwardOutline className="text-[10px]" />
          <span className="text-gray-600 dark:text-gray-400 font-medium truncate max-w-[200px]">
            {listing.title}
          </span>
        </nav>

        {/* Title + actions */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-snug mb-2">
              {listing.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {listing.rating > 0 && (
                <>
                  <div className="flex items-center gap-1 font-semibold text-gray-800 dark:text-gray-200">
                    <IoStar className="text-amber-400" />
                    <span>{listing.rating}</span>
                    <span className="text-gray-400 dark:text-gray-600 font-normal">
                      ({listing.reviewCount} avis)
                    </span>
                  </div>
                  <span className="text-gray-200 dark:text-gray-700">·</span>
                </>
              )}
              {listing.isVerified && (
                <>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                    <IoShieldCheckmarkOutline />
                    Vérifié
                  </span>
                  <span className="text-gray-200 dark:text-gray-700">·</span>
                </>
              )}
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <IoLocationOutline className="text-sky-500 dark:text-sky-400" />
                <span>{listing.location}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <button
                onClick={() => setShowShare((p) => !p)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600 transition-colors bg-white dark:bg-slate-900"
              >
                <IoShareSocialOutline />
                Partager
              </button>
              {showShare && (
                <ShareMenu
                  onClose={() => setShowShare(false)}
                  onCopy={() => {
                    navigator.clipboard
                      .writeText(window.location.href)
                      .catch(() => {});
                    showToast("Lien copié", "success");
                  }}
                />
              )}
            </div>
            <button
              onClick={handleToggleFavorite}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                isFavorite
                  ? "border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30"
                  : "border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-red-200 hover:text-red-500 bg-white dark:bg-slate-900"
              }`}
            >
              {isFavorite ? <IoHeart /> : <IoHeartOutline />}
              {isFavorite ? "Sauvegardé" : "Sauvegarder"}
            </button>
          </div>
        </div>

        {/* Photo gallery avec compteur +X */}
        <section className="mb-10">
          <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[440px] rounded-2xl overflow-hidden">
            {/* Main image */}
            <div
              className="col-span-4 md:col-span-2 row-span-2 relative group cursor-pointer overflow-hidden bg-gray-100 dark:bg-slate-800"
              onClick={() => {
                setZoomLevel(1);
                setShowAllPhotos(true);
              }}
            >
              {listing.images?.[0] ? (
                <img
                  alt={listing.title}
                  src={listing.images[0]}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-slate-800">
                  <IoHomeOutline className="text-5xl text-gray-300 dark:text-slate-700" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/8 transition-colors" />
            </div>

            {/* Thumbnails avec compteur +X */}
            {listing.images?.slice(1, 4).map((img, idx) => (
              <div
                key={idx}
                className="hidden md:block col-span-1 row-span-1 relative group cursor-pointer overflow-hidden bg-gray-100 dark:bg-slate-800"
                onClick={() => {
                  setSelectedImage(idx + 1);
                  setZoomLevel(1);
                  setShowAllPhotos(true);
                }}
              >
                <img
                  alt={`Vue ${idx + 2}`}
                  src={img}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                />
              </div>
            ))}

            {/* 4ème case avec compteur +X */}
            {totalPhotos > 4 && (
              <div
                className="hidden md:block col-span-1 row-span-1 relative group cursor-pointer overflow-hidden bg-gray-100 dark:bg-slate-800"
                onClick={() => {
                  setSelectedImage(4);
                  setZoomLevel(1);
                  setShowAllPhotos(true);
                }}
              >
                <img
                  alt="Plus de photos"
                  src={listing.images?.[4]}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    +{remainingPhotos}
                  </span>
                </div>
              </div>
            )}

            {/* Si moins de 4 photos, afficher les cases vides */}
            {totalPhotos <= 4 && totalPhotos > 1 && (
              <div className="hidden md:block col-span-1 row-span-1 relative bg-gray-100 dark:bg-slate-800" />
            )}
          </div>
        </section>

        {/* Lightbox avec zoom, diaporama et contrôles */}
        {showAllPhotos && (
          <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center">
            {/* Header controls */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-black/50 backdrop-blur-md rounded-full px-4 py-2">
              <button
                onClick={zoomOut}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                title="Dézoomer (-)"
              >
                <IoRemoveOutline className="text-lg" />
              </button>
              <span className="text-white text-sm font-mono min-w-[50px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={zoomIn}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                title="Zoomer (+)"
              >
                <IoAddOutline className="text-lg" />
              </button>
              <div className="w-px h-6 bg-white/20 mx-1" />
              <button
                onClick={resetZoom}
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
                title="Réinitialiser zoom (0)"
              >
                Reset
              </button>
              <div className="w-px h-6 bg-white/20 mx-1" />
              <button
                onClick={isPlaying ? stopSlideshow : startSlideshow}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                title={isPlaying ? "Pause (espace)" : "Diaporama (espace)"}
              >
                {isPlaying ? (
                  <IoPauseOutline className="text-lg" />
                ) : (
                  <IoPlayOutline className="text-lg" />
                )}
              </button>
            </div>

            <button
              onClick={() => {
                stopSlideshow();
                setShowAllPhotos(false);
                setZoomLevel(1);
              }}
              className="absolute top-5 right-5 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-20"
            >
              <IoCloseOutline className="text-3xl" />
            </button>

            {/* Navigation - boutons sur les côtés */}
            <button
              onClick={goToPreviousImage}
              disabled={selectedImage === 0}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white disabled:opacity-20 transition-colors"
            >
              <IoChevronBackOutline className="text-2xl" />
            </button>

            <button
              onClick={goToNextImage}
              disabled={selectedImage === totalPhotos - 1}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white disabled:opacity-20 transition-colors"
            >
              <IoChevronForwardOutline className="text-2xl" />
            </button>

            {/* Image avec zoom */}
            <div className="relative w-full max-w-6xl mx-auto px-14 overflow-hidden">
              <div className="flex justify-center items-center min-h-[60vh]">
                {listing.images?.[selectedImage] ? (
                  <img
                    src={listing.images[selectedImage]}
                    alt=""
                    className="transition-transform duration-300 ease-out max-h-[70vh] object-contain"
                    style={{ transform: `scale(${zoomLevel})` }}
                  />
                ) : (
                  <div className="w-full h-72 bg-slate-800 rounded-xl flex items-center justify-center">
                    <IoHomeOutline className="text-4xl text-slate-600" />
                  </div>
                )}
              </div>

              <p className="text-center text-white/40 text-xs mt-3">
                {selectedImage + 1} / {totalPhotos}
              </p>

              {/* Miniatures */}
              <div className="flex justify-center gap-2 mt-4 overflow-x-auto pb-2">
                {listing.images?.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedImage(idx);
                      resetZoom();
                    }}
                    className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 transition-all ring-2 ${
                      selectedImage === idx
                        ? "ring-white opacity-100"
                        : "ring-transparent opacity-40 hover:opacity-60"
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-14">
          {/* LEFT column */}
          <div className="lg:w-[60%]">
            {/* Stat chips */}
            <div className="flex flex-wrap gap-2 mb-10">
              {[
                {
                  icon: <IoBedOutline />,
                  label: `${listing.bedrooms} chambre${listing.bedrooms > 1 ? "s" : ""}`,
                },
                {
                  icon: <IoPeopleOutline />,
                  label: `${listing.maxGuests} personne${listing.maxGuests > 1 ? "s" : ""} max.`,
                },
                ...(listing.bathrooms > 0
                  ? [
                      {
                        icon: <FaShower />,
                        label: `${listing.bathrooms} salle${listing.bathrooms > 1 ? "s" : ""} de bain`,
                      },
                    ]
                  : []),
                ...(listing.surfaceArea > 0
                  ? [
                      {
                        icon: <MdOutlineSquareFoot />,
                        label: `${listing.surfaceArea} m²`,
                      },
                    ]
                  : []),
              ].map(({ icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-sm font-medium border border-gray-200 dark:border-slate-700"
                >
                  <span className="text-sky-500 dark:text-sky-400 text-sm">
                    {icon}
                  </span>
                  {label}
                </span>
              ))}
            </div>

            {/* Host card */}
            <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/60 mb-10">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base">
                    {listing.owner?.name?.charAt(0)?.toUpperCase() ?? "H"}
                  </div>
                  {listing.owner?.isVerified && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                      <IoCheckmarkCircle className="text-white text-[9px]" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
                    Hébergé par
                  </p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {listing.owner?.name}
                  </p>
                  {listing.owner?.isVerified && (
                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                      Vérifié
                    </span>
                  )}
                </div>
              </div>
              {listing.rating > 0 && (
                <div className="text-right shrink-0">
                  <div className="flex items-center justify-end gap-1">
                    <IoStar className="text-amber-400 text-sm" />
                    <span className="font-extrabold text-xl text-gray-900 dark:text-white">
                      {listing.rating}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Score confiance
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            {listing.description?.trim() && (
              <Section title="À propos">
                <p className="text-[15px] text-gray-600 dark:text-gray-400 leading-relaxed">
                  {listing.description}
                </p>
              </Section>
            )}

            {/* Equipment - noms français */}
            {equipmentItems.length > 0 && (
              <Section
                title="Équipements"
                action={
                  equipmentItems.length > 10 ? (
                    <button
                      onClick={() => setShowAllAmenities((p) => !p)}
                      className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors underline underline-offset-2"
                    >
                      {showAllAmenities
                        ? "Voir moins"
                        : `Voir les ${equipmentItems.length}`}
                    </button>
                  ) : undefined
                }
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {visibleEquipment.map(({ label, icon }, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/50 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span className="text-sky-500 dark:text-sky-400 shrink-0 text-base">
                        {icon}
                      </span>
                      {label}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Calendar */}
            <Section title="Disponibilités">
              <p className="text-sm text-gray-400 dark:text-gray-600 -mt-2 mb-4">
                Sélectionnez vos dates
              </p>

              {checkIn && checkOut && nights > 0 && (
                <div className="inline-flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50">
                  <IoCalendarOutline className="text-sky-500 dark:text-sky-400 shrink-0" />
                  <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                    {nights} nuit{nights > 1 ? "s" : ""} · {fmtDate(checkIn)} →{" "}
                    {fmtDate(checkOut)}
                  </span>
                  <button
                    onClick={() => {
                      setCheckIn("");
                      setCheckOut("");
                    }}
                    className="text-sky-400 hover:text-sky-600 dark:hover:text-sky-300 transition-colors"
                  >
                    <IoCloseOutline className="text-sm" />
                  </button>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-slate-800/40 rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-slate-700/50">
                <AvailabilityCalendar
                  availability={listing.availability}
                  blockedDates={listing.blockedDates}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      name: "Sophie L.",
                      date: "Mars 2024",
                      initials: "SL",
                      text: "Séjour parfait. Villa magnifique, hôte attentionné.",
                    },
                    {
                      name: "Marc-Antoine D.",
                      date: "Février 2024",
                      initials: "MD",
                      text: "Excellente expérience. Logement conforme aux photos.",
                    },
                  ].map(({ name, date, initials, text }) => (
                    <div
                      key={name}
                      className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/50"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {initials}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white">
                            {name}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-600">
                            {date}
                          </p>
                        </div>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <IoStar
                              key={i}
                              className="text-amber-400 text-xs"
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* House rules */}
            <Section title="Règlement">
              {houseRules.length > 0 ? (
                <ul className="space-y-2.5">
                  {houseRules.map((rule, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <IoTimeOutline className="text-sky-400 dark:text-sky-500 shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/50">
                  <IoInformationCircleOutline className="text-gray-300 dark:text-slate-600 text-lg shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-500 dark:text-gray-600">
                    Aucun règlement spécifique renseigné.
                  </p>
                </div>
              )}
            </Section>
          </div>

          {/* RIGHT column: Booking widget */}
          <aside className="lg:w-[40%]">
            <div className="sticky top-20 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700/60 shadow-xl shadow-gray-100/80 dark:shadow-black/30 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 px-5 py-5">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-white/60 text-[11px] font-semibold uppercase tracking-widest mb-1">
                      Tarif par nuit
                    </p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[28px] font-extrabold text-white leading-none">
                        {listing.pricePerNight.toLocaleString("fr-FR")}
                      </span>
                      <span className="text-white/80 font-semibold">TND</span>
                    </div>
                  </div>
                  {listing.rating > 0 && (
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <IoStar className="text-amber-300" />
                        <span className="font-bold text-white">
                          {listing.rating}
                        </span>
                      </div>
                      <p className="text-white/60 text-[11px] mt-0.5">
                        {listing.reviewCount} avis
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Date inputs */}
                <div className="rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden divide-y divide-gray-200 dark:divide-slate-700 bg-gray-50 dark:bg-slate-800/40">
                  <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-slate-700">
                    <div className="p-3">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-sky-500 dark:text-sky-400 mb-1.5">
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
                        className="w-full text-sm bg-transparent focus:outline-none text-gray-800 dark:text-gray-200 dark:[color-scheme:dark]"
                      />
                    </div>
                    <div className="p-3">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-purple-500 dark:text-purple-400 mb-1.5">
                        Départ
                      </label>
                      <input
                        type="date"
                        value={checkOut}
                        min={checkIn || new Date().toISOString().split("T")[0]}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="w-full text-sm bg-transparent focus:outline-none text-gray-800 dark:text-gray-200 dark:[color-scheme:dark]"
                      />
                    </div>
                  </div>

                  {/* Input + / - pour voyageurs */}
                  <div className="p-3">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-2">
                      Voyageurs
                    </label>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={decrementGuests}
                          disabled={guests <= 1}
                          className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <IoRemoveOutline className="text-sm" />
                        </button>
                        <span className="text-base font-semibold text-gray-800 dark:text-gray-200 w-8 text-center">
                          {guests}
                        </span>
                        <button
                          onClick={incrementGuests}
                          disabled={listing && guests >= listing.maxGuests}
                          className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <IoAddOutline className="text-sm" />
                        </button>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        Max {listing.maxGuests} pers.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price breakdown */}
                {checkIn && checkOut && nights > 0 ? (
                  <div className="rounded-xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/50 p-4 space-y-2.5">
                    <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                      <span>
                        {listing.pricePerNight.toLocaleString("fr-FR")} TND ×{" "}
                        {nights} nuit{nights > 1 ? "s" : ""}
                      </span>
                      <span className="font-semibold">
                        {basePrice.toLocaleString("fr-FR")} TND
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-500">
                      <span>Frais de ménage</span>
                      <span>{cleaningFee} TND</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-500">
                      <span>Frais de service (5%)</span>
                      <span>{serviceFee.toLocaleString("fr-FR")} TND</span>
                    </div>
                    <div className="pt-3 border-t border-gray-200 dark:border-slate-700 flex justify-between font-extrabold text-base">
                      <span className={GRAD_TEXT}>Total</span>
                      <span className={GRAD_TEXT}>
                        {totalToPay.toLocaleString("fr-FR")} TND
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 dark:border-slate-700 p-4 text-center text-sm text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-slate-800/20">
                    Sélectionnez vos dates pour voir le prix total
                  </div>
                )}

                {/* Bouton Demander une information - désactivé tant que pas de dates */}
                <button
                  onClick={handleInfoRequest}
                  disabled={infoRequestLoading || !checkIn || !checkOut}
                  className={`w-full py-3.5 rounded-xl text-sm font-extrabold transition-all ${
                    checkIn && checkOut && !infoRequestLoading
                      ? BTN_GRAD
                      : "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {infoRequestLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Envoi en cours…
                    </span>
                  ) : !checkIn || !checkOut ? (
                    "Choisissez vos dates"
                  ) : (
                    "Demander une information"
                  )}
                </button>

                <p className="text-center text-xs text-gray-400 dark:text-gray-600">
                  Aucun engagement, l'hôte vous répondra sous 24h
                </p>

                {/* Trust strip */}
                <div className="grid grid-cols-3 gap-2 pt-1">
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
                      className="text-center p-3 rounded-xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/50"
                    >
                      <span className="flex justify-center text-indigo-400 dark:text-indigo-500 mb-1.5 text-lg">
                        {icon}
                      </span>
                      <p className="text-[10px] text-gray-500 dark:text-gray-500 font-medium leading-tight">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600" />
            <div>
              <span className="font-extrabold text-gray-900 dark:text-white text-sm">
                NestHub
              </span>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
                © 2026 · Propriétés d'exception
              </p>
            </div>
          </div>
          <div className="flex gap-5">
            {["Aide", "Confidentialité", "CGU", "Plan du site"].map((link) => (
              <Link
                key={link}
                href="#"
                className="text-xs text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-400 transition-colors"
              >
                {link}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
