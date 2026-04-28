// app/[locale]/admin/listings/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import {
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoLocationOutline,
  IoBedOutline,
  IoHomeOutline,
  IoShieldCheckmarkOutline,
  IoStar,
  IoCallOutline,
  IoMailOutline,
  IoMapOutline,
  IoCalendarOutline,
  IoPeopleOutline,
  IoCheckmarkDoneOutline,
} from "react-icons/io5";
import { FaParking, FaShower, FaDog, FaSmoking } from "react-icons/fa";
import {
  MdOutlineSquareFoot,
  MdOutlineElevator,
  MdBalcony,
} from "react-icons/md";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertBanner from "@/components/ui/Alert";

const ListingMap = dynamic(() => import("@/components/ui/maps/ListingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-slate-800 rounded-xl">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-xs text-gray-500">Chargement de la carte...</p>
      </div>
    </div>
  ),
});

interface ListingDetail {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  governorate: string;
  delegation: string;
  street: string;
  latitude: number | null;
  longitude: number | null;
  pricePerNight: number | null;
  pricePerMonth: number | null;
  cleaningFee: number | null;
  securityDeposit: number | null;
  rooms: number;
  bathrooms: number;
  surfaceArea: number;
  maxGuests: number;
  floorNumber: number;
  hasElevator: boolean;
  hasBalcony: boolean;
  hasGarden: boolean;
  hasGarage: boolean;
  isFurnished: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  equipment: Record<string, boolean>;
  services: Record<string, boolean>;
  houseRules: Record<string, boolean>;
  customRules: string;
  photos: Array<{ url: string; thumbnailUrl: string; isMain: boolean }>;
  viewCount: number;
  bookingCount: number;
  totalRevenue: number;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
    profilePictureUrl: string | null;
    isIdentityVerified: boolean;
    createdAt: Date;
    stats: {
      averageRating: number;
      totalReviews: number;
    };
  };
  upcomingBookings: Array<{
    id: string;
    tenantName: string;
    tenantAvatar: string | null;
    checkIn: Date;
    checkOut: Date;
    nights: number;
    status: string;
    totalPrice: number;
  }>;
  createdAt: Date;
}

const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  if (url.includes("vercel-storage.com") || url.includes("googleusercontent.com")) {
    return `/api/admin/serve-image?url=${encodeURIComponent(url)}`;
  }
  return url;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return <span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-bold">Active</span>;
    case "PENDING_REVIEW":
      return (
        <span className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          En attente de validation
        </span>
      );
    default:
      return <span className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full text-xs font-bold">{status}</span>;
  }
};

const equipmentLabels: Record<string, string> = {
  wifi: "Wi-Fi haut débit",
  ac: "Climatisation",
  airConditioning: "Climatisation",
  heating: "Chauffage",
  kitchen: "Cuisine équipée",
  washer: "Machine à laver",
  dryer: "Sèche-linge",
  dishwasher: "Lave-vaisselle",
  oven: "Four",
  microwave: "Micro-ondes",
  refrigerator: "Réfrigérateur",
  coffeeMaker: "Cafetière",
  parking: "Parking gratuit",
  garage: "Garage",
  pool: "Piscine",
  swimmingPool: "Piscine",
  garden: "Jardin",
  terrace: "Terrasse",
  balcony: "Balcon",
  bbq: "Barbecue",
  gym: "Salle de sport",
  elevator: "Ascenseur",
  tv: "Télévision",
  smartTv: "Smart TV",
  netflix: "Netflix",
  safe: "Coffre-fort",
  smokeDetector: "Détecteur de fumée",
  fireExtinguisher: "Extincteur",
  firstAidKit: "Kit de premiers secours",
  hairDryer: "Sèche-cheveux",
  iron: "Fer à repasser",
  workspace: "Espace de travail",
  seaView: "Vue sur mer",
  mountainView: "Vue sur montagne",
  cityView: "Vue sur ville",
  allowedPets: "Animaux acceptés",
  petsAllowed: "Animaux acceptés",
  smokingAllowed: "Fumeurs acceptés",
  noParties: "Fêtes non autorisées",
  quietAfter22: "Calme après 22h",
  isFurnished: "Meublé",
};

const ruleLabels: Record<string, string> = {
  noSmoking: "Interdiction de fumer dans le logement",
  noPets: "Animaux non autorisés",
  noParties: "Fêtes et événements interdits",
  childrenAllowed: "Enfants bienvenus",
  smokingAllowed: "Fumeurs acceptés (extérieur)",
  petsAllowed: "Animaux acceptés",
  quietAfter22: "Calme après 22 heures",
};

const getEquipmentLabel = (key: string): string => {
  return equipmentLabels[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
};

const getRuleLabel = (key: string): string => {
  return ruleLabels[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
};

const getListingTypeLabel = (type: string) => {
  const types: Record<string, string> = {
    APARTMENT: "Appartement",
    VILLA: "Villa",
    HOUSE: "Maison",
    STUDIO: "Studio",
    DUPLEX: "Duplex",
    ROOM: "Chambre",
  };
  return types[type] || type;
};

export default function AdminListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;
  const { getToken } = useAuth();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionDetails, setRejectionDetails] = useState("");
  const [alert, setAlert] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const showAlert = (type: "success" | "error" | "info", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const fetchListing = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const response = await fetch(`/api/listings/${listingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data = await response.json();
      setListing(data);
    } catch (error) {
      console.error(error);
      showAlert("error", "Erreur lors du chargement de l'annonce");
    } finally {
      setLoading(false);
    }
  }, [getToken, listingId]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  const handleValidate = async (action: "approve" | "reject") => {
    if (action === "reject" && !rejectionReason) {
      showAlert("error", "Veuillez sélectionner un motif de rejet");
      return;
    }

    setActionLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const fullReason = action === "reject" 
        ? `${rejectionReason}${rejectionDetails ? ` - ${rejectionDetails}` : ""}`
        : undefined;

      const response = await fetch(`/api/admin/listings/${listingId}/validate`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          rejectionReason: fullReason,
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de la validation");

      showAlert("success", `Annonce ${action === "approve" ? "approuvée" : "rejetée"} avec succès`);
      setTimeout(() => {
        router.push("/admin/listings/validation");
      }, 1500);
    } catch (error) {
      console.error(error);
      showAlert("error", "Erreur lors de l'action");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9ff] dark:bg-slate-950">
        <LoadingSpinner size="lg" color="primary" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9ff] dark:bg-slate-950">
        <div className="text-center">
          <p className="text-slate-500">Annonce non trouvée</p>
          <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg">Retour</button>
        </div>
      </div>
    );
  }

  const mainImage = listing.photos?.find((p) => p.isMain) || listing.photos?.[0];
  const otherPhotos = listing.photos?.filter((p) => !p.isMain) || [];
  const displayPhotos = [mainImage, ...otherPhotos.slice(0, 4)].filter(Boolean);
  const isPending = listing.status === "PENDING_REVIEW";

  const activeEquipment = Object.entries(listing.equipment || {})
    .filter(([, active]) => active === true)
    .map(([key]) => getEquipmentLabel(key));

  const activeRules = Object.entries(listing.houseRules || {})
    .filter(([, active]) => active === true)
    .map(([key]) => getRuleLabel(key));

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased">
      {alert && (
        <div className="fixed top-4 right-8 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      <div className="w-full px-4 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 pt-6">
          <div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
              {listing.title}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-sm">
              <IoLocationOutline className="text-sm" />
              {listing.delegation}, {listing.governorate}
              {listing.street ? ` - ${listing.street}` : ""}
            </p>
          </div>
          <div className="flex gap-3">
            {getStatusBadge(listing.status)}
            <button
              onClick={() => window.open(`/fr/listings/${listing.id}`, "_blank")}
              className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Voir sur le site
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 space-y-6 lg:space-y-8">
            {/* GALLERIE : 1 grande + 4 petites */}
            <section className="grid grid-cols-4 gap-2 lg:gap-3 h-[300px] lg:h-[500px]">
              <div
                className="col-span-2 row-span-2 relative overflow-hidden rounded-xl lg:rounded-2xl bg-slate-100 cursor-pointer"
                onClick={() => setSelectedImage(displayPhotos[0]?.url || null)}
              >
                {displayPhotos[0] ? (
                  <img
                    src={getImageUrl(displayPhotos[0].url)}
                    alt={listing.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <IoHomeOutline className="text-3xl lg:text-4xl text-slate-400" />
                  </div>
                )}
              </div>
              {displayPhotos.slice(1, 5).map((photo, idx) => (
                <div
                  key={idx}
                  className="relative overflow-hidden rounded-xl lg:rounded-2xl bg-slate-100 cursor-pointer"
                  onClick={() => setSelectedImage(photo.url)}
                >
                  <img
                    src={getImageUrl(photo.url)}
                    alt={`Vue ${idx + 2}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  {idx === 3 && listing.photos && listing.photos.length > 5 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl lg:rounded-2xl">
                      <span className="text-white font-bold text-base lg:text-lg">
                        +{listing.photos.length - 5}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {[...Array(4 - (displayPhotos.length - 1))].map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="relative overflow-hidden rounded-xl lg:rounded-2xl bg-slate-100 flex items-center justify-center"
                >
                  <IoHomeOutline className="text-2xl lg:text-3xl text-slate-300" />
                </div>
              ))}
            </section>

            {/* Caractéristiques principales */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
              {listing.surfaceArea > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 lg:p-6 rounded-xl lg:rounded-2xl">
                  <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-4 text-indigo-600">
                    <MdOutlineSquareFoot className="text-lg lg:text-xl" />
                    <span className="text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Surface habitable
                    </span>
                  </div>
                  <p className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">
                    {listing.surfaceArea} m²
                  </p>
                </div>
              )}
              {listing.rooms > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 lg:p-6 rounded-xl lg:rounded-2xl">
                  <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-4 text-indigo-600">
                    <IoBedOutline className="text-lg lg:text-xl" />
                    <span className="text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Chambres
                    </span>
                  </div>
                  <p className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">
                    {listing.rooms === 1 ? "1 chambre" : `${listing.rooms} chambres`}
                  </p>
                </div>
              )}
              {listing.bathrooms > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 lg:p-6 rounded-xl lg:rounded-2xl">
                  <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-4 text-indigo-600">
                    <FaShower className="text-lg lg:text-xl" />
                    <span className="text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Salles de bain
                    </span>
                  </div>
                  <p className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">
                    {listing.bathrooms === 1 ? "1 salle de bain" : `${listing.bathrooms} salles de bain`}
                  </p>
                </div>
              )}
            </div>

            {/* Informations générales */}
            <div className="bg-white dark:bg-slate-900 p-5 lg:p-8 rounded-xl lg:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
              <h3 className="text-lg lg:text-xl font-bold mb-4 lg:mb-6 text-slate-900 dark:text-white">
                Informations générales
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <div>
                  <span className="text-slate-500 text-xs lg:text-sm">Type de bien</span>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm lg:text-base">
                    {getListingTypeLabel(listing.type)}
                  </p>
                </div>
                {listing.isFurnished && (
                  <div>
                    <span className="text-slate-500 text-xs lg:text-sm">Meublé</span>
                    <p className="font-semibold text-slate-900 dark:text-white">Oui</p>
                  </div>
                )}
                {listing.petsAllowed && (
                  <div>
                    <span className="text-slate-500 text-xs lg:text-sm">Animaux acceptés</span>
                    <p className="font-semibold text-slate-900 dark:text-white">Oui</p>
                  </div>
                )}
                {listing.smokingAllowed && (
                  <div>
                    <span className="text-slate-500 text-xs lg:text-sm">Fumeurs acceptés</span>
                    <p className="font-semibold text-slate-900 dark:text-white">Oui</p>
                  </div>
                )}
                {listing.hasElevator && (
                  <div>
                    <span className="text-slate-500 text-xs lg:text-sm">Ascenseur</span>
                    <p className="font-semibold text-slate-900 dark:text-white">Oui</p>
                  </div>
                )}
                {listing.hasBalcony && (
                  <div>
                    <span className="text-slate-500 text-xs lg:text-sm">Balcon</span>
                    <p className="font-semibold text-slate-900 dark:text-white">Oui</p>
                  </div>
                )}
                {listing.hasGarden && (
                  <div>
                    <span className="text-slate-500 text-xs lg:text-sm">Jardin</span>
                    <p className="font-semibold text-slate-900 dark:text-white">Oui</p>
                  </div>
                )}
                {listing.hasGarage && (
                  <div>
                    <span className="text-slate-500 text-xs lg:text-sm">Garage</span>
                    <p className="font-semibold text-slate-900 dark:text-white">Oui</p>
                  </div>
                )}
                {listing.maxGuests && listing.maxGuests > 0 && (
                  <div>
                    <span className="text-slate-500 text-xs lg:text-sm">Nombre de voyageurs maximum</span>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {listing.maxGuests === 1 ? "1 personne" : `${listing.maxGuests} personnes`}
                    </p>
                  </div>
                )}
                {listing.floorNumber !== undefined && listing.floorNumber !== null && (
                  <div>
                    <span className="text-slate-500 text-xs lg:text-sm">Étage</span>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {listing.floorNumber === 0 ? "Rez-de-chaussée" : listing.floorNumber === 1 ? "1er étage" : `${listing.floorNumber}ème étage`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Équipements */}
            {activeEquipment.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-5 lg:p-8 rounded-xl lg:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="text-lg lg:text-xl font-bold mb-4 lg:mb-6 text-slate-900 dark:text-white">
                  Équipements
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
                  {activeEquipment.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs lg:text-sm text-slate-600 dark:text-slate-400">
                      <IoCheckmarkCircleOutline className="text-emerald-500 text-base lg:text-lg" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Règles */}
            {activeRules.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-5 lg:p-8 rounded-xl lg:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="text-lg lg:text-xl font-bold mb-4 lg:mb-6 text-slate-900 dark:text-white">
                  Règles de la maison
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-3">
                  {activeRules.map((rule) => (
                    <div key={rule} className="flex items-center gap-2 text-xs lg:text-sm text-slate-600 dark:text-slate-400">
                      <IoShieldCheckmarkOutline className="text-indigo-500 text-base lg:text-lg" />
                      {rule}
                    </div>
                  ))}
                </div>
                {listing.customRules && (
                  <div className="mt-3 lg:mt-4 p-3 lg:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg lg:rounded-xl">
                    <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400">{listing.customRules}</p>
                  </div>
                )}
              </div>
            )}

            {/* Réservations */}
            {listing.upcomingBookings && listing.upcomingBookings.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-5 lg:p-8 rounded-xl lg:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="text-lg lg:text-xl font-bold mb-4 lg:mb-6 text-slate-900 dark:text-white flex items-center gap-2">
                  <IoCalendarOutline className="text-indigo-500" /> Réservations à venir
                </h3>
                <div className="space-y-2 lg:space-y-3">
                  {listing.upcomingBookings.map((booking) => (
                    <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 lg:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg lg:rounded-xl gap-2">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm lg:text-base">{booking.tenantName}</p>
                        <p className="text-[10px] lg:text-xs text-slate-500">
                          {format(new Date(booking.checkIn), "dd MMMM yyyy", { locale: fr })} → {format(new Date(booking.checkOut), "dd MMMM yyyy", { locale: fr })}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-bold text-slate-900 dark:text-white text-sm lg:text-base">{booking.totalPrice.toLocaleString()} TND</p>
                        <p className="text-[10px] lg:text-xs text-slate-500">{booking.nights} nuits</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {listing.description && (
              <div className="bg-white dark:bg-slate-900 p-5 lg:p-8 rounded-xl lg:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="text-lg lg:text-xl font-bold mb-4 lg:mb-6 text-slate-900 dark:text-white">
                  Description détaillée
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm lg:text-base whitespace-pre-wrap">
                  {listing.description}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-4 space-y-6 lg:space-y-8">
            <div className="sticky top-24 space-y-6 lg:space-y-8">
              {/* Tarification */}
              <div className="bg-white dark:bg-slate-900 p-5 lg:p-8 rounded-xl lg:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="text-[9px] lg:text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-4 lg:mb-6">
                  Tarification
                </h3>
                <div className="space-y-3 lg:space-y-4">
                  {listing.pricePerNight && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-sm">Prix par nuit</span>
                      <span className="font-bold text-slate-900 dark:text-white">{listing.pricePerNight.toLocaleString()} TND</span>
                    </div>
                  )}
                  {listing.pricePerMonth && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-sm">Prix par mois</span>
                      <span className="font-bold text-slate-900 dark:text-white">{listing.pricePerMonth.toLocaleString()} TND</span>
                    </div>
                  )}
                  {listing.cleaningFee && listing.cleaningFee > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-sm">Frais de ménage</span>
                      <span className="font-bold text-slate-900 dark:text-white">{listing.cleaningFee.toLocaleString()} TND</span>
                    </div>
                  )}
                  {listing.securityDeposit && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-sm">Caution de sécurité</span>
                      <span className="font-bold text-slate-900 dark:text-white">{listing.securityDeposit.toLocaleString()} TND</span>
                    </div>
                  )}
                </div>
              </div>

             {/* Décision administrative */}
{isPending && (
  <div className="bg-slate-900 text-white p-5 lg:p-6 rounded-2xl lg:rounded-3xl relative overflow-hidden">
    <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
    <h3 className="text-lg lg:text-xl font-bold mb-4 relative z-10">Décision administrative</h3>
    
    <div className="space-y-4 relative z-10">
      {/* Boutons d'action en haut */}
      <div className="space-y-2">
        <button
          onClick={() => handleValidate("approve")}
          disabled={actionLoading}
          className="w-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white py-2.5 lg:py-3 rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
        >
          <IoCheckmarkCircleOutline className="text-base lg:text-lg" />
          Approuver l'annonce
        </button>
        
        <button
          onClick={() => handleValidate("reject")}
          disabled={actionLoading || !rejectionReason}
          className="w-full bg-white/10 text-white py-2.5 lg:py-3 rounded-xl font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <IoCloseOutline className="text-base lg:text-lg text-red-400" />
          Rejeter l'annonce
        </button>
      </div>

      {/* Motifs de rejet - 3 par ligne sans emojis */}
      <div className="space-y-2">
        <label className="block text-[9px] lg:text-[10px] uppercase font-bold text-slate-400 tracking-widest">
          Motif du rejet (obligatoire)
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {[
            { id: "photos", label: "Photos de mauvaise qualité" },
            { id: "description", label: "Description incomplète" },
            { id: "price", label: "Prix incohérent" },
            { id: "rules", label: "Règlement non conforme" },
            { id: "info", label: "Informations manquantes" },
            { id: "duplicate", label: "Doublon avec une annonce existante" },
          ].map((reason) => (
            <label
              key={reason.id}
              className={`flex items-center p-2 rounded-lg cursor-pointer transition-all ${
                rejectionReason === reason.label
                  ? "bg-red-500/20 border border-red-400/50"
                  : "bg-white/5 hover:bg-white/10 border border-transparent"
              }`}
            >
              <input
                type="radio"
                name="rejection_reason"
                value={reason.label}
                checked={rejectionReason === reason.label}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-3.5 h-3.5 border-2 border-slate-500 text-red-500 focus:ring-red-500/20 bg-transparent checked:bg-red-500"
              />
              <span className="ml-2 text-xs text-slate-200">
                {reason.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Précisions complémentaires */}
      <div className="space-y-1.5">
        <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-widest">
          Précisions complémentaires (optionnel)
        </label>
        <textarea
          value={rejectionDetails}
          onChange={(e) => setRejectionDetails(e.target.value)}
          placeholder="Détaillez les raisons du rejet pour aider l'annonceur..."
          rows={2}
          className="w-full bg-slate-800 border-none rounded-lg p-2 text-xs text-white focus:ring-2 focus:ring-indigo-500/40 placeholder:text-slate-500 resize-none"
        />
      </div>

      <p className="text-[9px] text-center text-slate-500 italic pt-2">
        Action irréversible après confirmation. L'annonceur sera notifié par email.
      </p>
    </div>
  </div>
)}

              {/* Propriétaire */}
              <div className="bg-white dark:bg-slate-900 p-5 lg:p-8 rounded-xl lg:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="text-[9px] lg:text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-4 lg:mb-6">
                  Informations propriétaire
                </h3>
                <div className="flex items-center gap-3 lg:gap-4 mb-4 lg:mb-6">
                  <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 overflow-hidden flex items-center justify-center">
                    {listing.owner.profilePictureUrl ? (
                      <img src={getImageUrl(listing.owner.profilePictureUrl)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-indigo-600 font-bold text-base lg:text-lg">
                        {listing.owner.firstName?.charAt(0)}{listing.owner.lastName?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm lg:text-base">
                      {listing.owner.firstName} {listing.owner.lastName}
                    </h4>
                    <p className="text-[10px] lg:text-xs text-slate-500">
                      Membre depuis {format(new Date(listing.owner.createdAt), "MMMM yyyy", { locale: fr })}
                    </p>
                    {listing.owner.isIdentityVerified && (
                      <p className="text-[9px] lg:text-[10px] text-emerald-600 flex items-center gap-1 mt-1">
                        <IoCheckmarkDoneOutline className="text-[10px] lg:text-xs" /> Identité vérifiée
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-3 lg:space-y-4">
                  <div className="flex items-center justify-between text-xs lg:text-sm">
                    <span className="text-slate-500 flex items-center gap-1"><IoCallOutline className="text-xs lg:text-sm" /> Téléphone</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{listing.owner.phoneNumber || "Non renseigné"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs lg:text-sm">
                    <span className="text-slate-500 flex items-center gap-1"><IoMailOutline className="text-xs lg:text-sm" /> Adresse email</span>
                    <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px] lg:max-w-[200px]">{listing.owner.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs lg:text-sm">
                    <span className="text-slate-500 flex items-center gap-1"><IoStar className="text-xs lg:text-sm" /> Note moyenne</span>
                    <span className="flex items-center gap-1 text-amber-500 font-bold">
                      <IoStar className="text-xs lg:text-sm" />
                      {(listing.owner.stats?.averageRating || 0).toFixed(1)} sur 5 ({listing.owner.stats?.totalReviews || 0} avis)
                    </span>
                  </div>
                </div>
              </div>

              {/* Carte */}
              <div className="bg-white dark:bg-slate-900 rounded-xl lg:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-3 lg:p-4 pb-2">
                  <h3 className="text-[9px] lg:text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                    Localisation exacte
                  </h3>
                </div>
                <div className="h-48 lg:h-64 rounded-lg lg:rounded-xl overflow-hidden mx-3 lg:mx-4">
                  {listing.latitude && listing.longitude ? (
                    <ListingMap homeLat={listing.latitude} homeLng={listing.longitude} pois={[]} zoom={14} />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800">
                      <IoMapOutline className="text-3xl lg:text-4xl text-slate-400 mb-2" />
                      <p className="text-[10px] lg:text-xs text-slate-500">Position non définie</p>
                    </div>
                  )}
                </div>
                <div className="p-3 lg:p-4">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{listing.governorate}</p>
                  <p className="text-xs text-slate-500">{listing.delegation}{listing.street ? ` - ${listing.street}` : ""}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={getImageUrl(selectedImage)}
            alt="Fullscreen"
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
          <button
            className="absolute top-4 right-4 text-white text-2xl bg-black/50 rounded-full p-2 hover:bg-black/70 transition-all"
            onClick={() => setSelectedImage(null)}
          >
            <IoCloseOutline />
          </button>
        </div>
      )}
    </div>
  );
}