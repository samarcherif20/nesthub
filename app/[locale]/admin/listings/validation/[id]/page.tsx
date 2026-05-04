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
  IoArrowBackOutline,
  IoEyeOutline,
  IoExpandOutline,
  IoWifiOutline,
  IoFlameOutline,
  IoSnowOutline,
  IoCarOutline,
  IoLeafOutline,
  IoWaterOutline,
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
} from "react-icons/io5";
import {
  MdOutlineSquareFoot,
  MdOutlineElevator,
  MdBalcony,
  MdOutlinePets,
  MdSmokingRooms,
  MdOutlineSmokeFree,
  MdOutlineKitchen,
  MdOutlineMapsHomeWork,
} from "react-icons/md";
import { FaShower } from "react-icons/fa";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

const ListingMap = dynamic(() => import("@/components/ui/maps/ListingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-slate-800 rounded-xl">
      <div className="w-7 h-7 border-2 border-gray-200 dark:border-slate-700 border-t-sky-500 rounded-full animate-spin" />
    </div>
  ),
});

// ─── Types ────────────────────────────────────────────────────────────────────
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
  numberOfKitchens: number;
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
  viewCount: number;
  bookingCount: number;
  totalRevenue: number;
  favoriteCount: number;
  rentalType: string;
  hasPendingRevision?: boolean;
  pendingRevisionData?: {
    changes: Array<{ field: string; oldValue: any; newValue: any }>;
  };
  equipment: Record<string, boolean>;
  services: Record<string, boolean>;
  houseRules: Record<string, boolean>;
  customRules: string;
  photos: Array<{ url: string; thumbnailUrl: string; isMain: boolean }>;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
    profilePictureUrl: string | null;
    isIdentityVerified: boolean;
    createdAt: Date;
    stats: { averageRating: number; totalReviews: number };
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
  publishedAt: Date | null;
  rejectionReason: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  if (url.includes("vercel-storage.com") || url.includes("googleusercontent.com"))
    return `/api/admin/serve-image?url=${encodeURIComponent(url)}`;
  return url;
};

const TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Appartement", VILLA: "Villa", HOUSE: "Maison",
  STUDIO: "Studio", DUPLEX: "Duplex", ROOM: "Chambre",
};

const EQUIPMENT_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  wifi: { label: "Wi-Fi", icon: <IoWifiOutline /> },
  ac: { label: "Climatisation", icon: <IoSnowOutline /> },
  airConditioning: { label: "Climatisation", icon: <IoSnowOutline /> },
  heating: { label: "Chauffage", icon: <IoFlameOutline /> },
  kitchen: { label: "Cuisine équipée", icon: <MdOutlineKitchen /> },
  washer: { label: "Machine à laver", icon: <IoWaterOutline /> },
  dryer: { label: "Sèche-linge", icon: <IoConstructOutline /> },
  dishwasher: { label: "Lave-vaisselle", icon: <IoWaterOutline /> },
  parking: { label: "Parking", icon: <IoCarOutline /> },
  garage: { label: "Garage", icon: <IoCarOutline /> },
  pool: { label: "Piscine", icon: <IoWaterOutline /> },
  swimmingPool: { label: "Piscine", icon: <IoWaterOutline /> },
  garden: { label: "Jardin", icon: <IoLeafOutline /> },
  terrace: { label: "Terrasse", icon: <IoHomeOutline /> },
  balcony: { label: "Balcon", icon: <MdBalcony /> },
  gym: { label: "Salle de sport", icon: <IoFitnessOutline /> },
  elevator: { label: "Ascenseur", icon: <MdOutlineElevator /> },
  tv: { label: "TV", icon: <IoTvOutline /> },
  smartTv: { label: "Smart TV", icon: <IoTvOutline /> },
  safe: { label: "Coffre-fort", icon: <IoLockClosedOutline /> },
  workspace: { label: "Espace bureau", icon: <IoDocumentTextOutline /> },
  hairDryer: { label: "Sèche-cheveux", icon: <IoConstructOutline /> },
  iron: { label: "Fer à repasser", icon: <IoConstructOutline /> },
};

const RULE_LABELS: Record<string, { label: string; icon: React.ReactNode; positive: boolean }> = {
  noSmoking: { label: "Non-fumeur", icon: <MdOutlineSmokeFree />, positive: false },
  noPets: { label: "Animaux non autorisés", icon: <MdOutlinePets />, positive: false },
  noParties: { label: "Fêtes interdites", icon: <IoAlertCircleOutline />, positive: false },
  childrenAllowed: { label: "Enfants bienvenus", icon: <IoPeopleOutline />, positive: true },
  smokingAllowed: { label: "Fumeurs acceptés", icon: <MdSmokingRooms />, positive: true },
  petsAllowed: { label: "Animaux acceptés", icon: <MdOutlinePets />, positive: true },
  quietAfter22: { label: "Calme après 22h", icon: <IoAlertCircleOutline />, positive: false },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  ACTIVE: { label: "Active", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  PENDING_REVIEW: { label: "En attente", bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500 animate-pulse" },
  REJECTED: { label: "Rejetée", bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-700 dark:text-rose-400", dot: "bg-rose-500" },
  INACTIVE: { label: "Inactive", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", dot: "bg-gray-400" },
  SUSPENDED: { label: "Suspendue", bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-700 dark:text-orange-400", dot: "bg-orange-500" },
  DRAFT: { label: "Brouillon", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", dot: "bg-gray-400" },
};

const BOOKING_STATUS: Record<string, { label: string; color: string }> = {
  CONFIRMED: { label: "Confirmée", color: "text-emerald-600 dark:text-emerald-400" },
  PAID: { label: "Payée", color: "text-sky-600 dark:text-sky-400" },
  PENDING: { label: "En attente", color: "text-amber-600 dark:text-amber-400" },
  COMPLETED: { label: "Terminée", color: "text-violet-600 dark:text-violet-400" },
  CANCELLED: { label: "Annulée", color: "text-rose-600 dark:text-rose-400" },
};

const REJECTION_REASONS = [
  "Photos de mauvaise qualité",
  "Description incomplète",
  "Prix incohérent",
  "Règlement non conforme",
  "Informations manquantes",
  "Doublon détecté",
];

// ─── Section ──────────────────────────────────────────────────────────────────
function Section({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
      <div className="px-5 py-3.5 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2.5 bg-gray-50/50 dark:bg-slate-800/50">
        <span className="text-base text-gray-400 dark:text-slate-500">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error" | "info"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`flex items-center gap-2.5 pl-4 pr-3 py-3 rounded-2xl text-sm font-medium shadow-xl border ${
      type === "success" ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
        : type === "error" ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400"
        : "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400"
    }`}>
      {type === "success" ? <IoCheckmarkCircle className="text-lg" /> : type === "error" ? <IoCloseCircleOutline className="text-lg" /> : <IoInformationCircleOutline className="text-lg" />}
      {msg}
      <button onClick={onClose} className="ml-1 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><IoCloseOutline className="text-sm" /></button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const listingId = params.id as string;
  const locale = params.locale as string;

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionDetails, setRejectionDetails] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [showChanges, setShowChanges] = useState(false);

  const showToast = (msg: string, type: "success" | "error" | "info" = "info") => setToast({ msg, type });

  const fetchListing = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/listings/${listingId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      setListing(await res.json());
    } catch { showToast("Erreur lors du chargement", "error"); } finally { setLoading(false); }
  }, [getToken, listingId]);

  useEffect(() => { fetchListing(); }, [fetchListing]);

  const handleValidate = async (action: "approve" | "reject") => {
    if (action === "reject" && !rejectionReason) { showToast("Veuillez sélectionner un motif de rejet", "error"); return; }
    setActionLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/admin/listings/${listingId}/validate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action,
          rejectionReason: action === "reject" ? `${rejectionReason}${rejectionDetails ? ` — ${rejectionDetails}` : ""}` : undefined,
          isRevision: listing?.hasPendingRevision ?? false,
        }),
      });
      if (!res.ok) throw new Error();
      const isRev = listing?.hasPendingRevision;
      showToast(isRev ? (action === "approve" ? "Modification approuvée !" : "Modification rejetée") : (action === "approve" ? "Annonce approuvée !" : "Annonce rejetée"), action === "approve" ? "success" : "info");
      setTimeout(() => router.push(`/${locale}/admin/listings/validation`), 1500);
    } catch { showToast("Erreur", "error"); } finally { setActionLoading(false); }
  };

  if (loading) return <LoadingSpinner fullScreen variant="spinner" size="lg" color="primary" text="Chargement de l'annonce" speed="normal" />;

  if (!listing) return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <IoHomeOutline className="text-4xl text-gray-300 dark:text-slate-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">Annonce non trouvée</p>
        <button onClick={() => router.back()} className="px-4 py-2 text-sm bg-sky-600 text-white rounded-xl">Retour</button>
      </div>
    </div>
  );

  const isPending = listing.status === "PENDING_REVIEW";
  const isRevision = !!(listing.hasPendingRevision && listing.status === "ACTIVE");
  const needsValidation = isPending || isRevision;
  const mainPhoto = listing.photos?.find(p => p.isMain) ?? listing.photos?.[0];
  const displayPhotos = [mainPhoto, ...(listing.photos?.filter(p => !p.isMain) ?? []).slice(0, 4)].filter(Boolean) as typeof listing.photos;
  const activeEquipment = Object.entries(listing.equipment ?? {}).filter(([, v]) => v).map(([k]) => ({ key: k, ...(EQUIPMENT_LABELS[k] ?? { label: k, icon: <IoCheckmarkCircleOutline /> }) }));
  const activeRules = Object.entries(listing.houseRules ?? {}).filter(([, v]) => v).map(([k]) => ({ key: k, ...(RULE_LABELS[k] ?? { label: k, icon: <IoShieldCheckmarkOutline />, positive: true }) }));
  const statusCfg = STATUS_CONFIG[listing.status] ?? STATUS_CONFIG.INACTIVE;

  return (
    <div className="min-h-screen antialiased">
      {/* Toast */}
      {toast && <div className="fixed top-4 right-4 z-[90]"><Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} /></div>}

      {/* Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={() => setLightboxImg(null)}>
          <img src={getImageUrl(lightboxImg)} alt="" className="max-w-[92vw] max-h-[90vh] object-contain rounded-xl" />
          <button onClick={() => setLightboxImg(null)} className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"><IoCloseOutline className="text-xl" /></button>
        </div>
      )}

      <div className="w-full px-4 lg:px-8 py-6">

        {/* ── Header ── */}
        <div className="mb-6">
          {/* Fil d'Ariane (Breadcrumb) */}
          <div className="flex items-center gap-2 text-xs mb-4 overflow-x-auto whitespace-nowrap pb-1 uppercase font-semibold tracking-wider">
            <Link 
              href={`/${locale}/admin/properties`}
              className="text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
            >
              PROPRIÉTÉS
            </Link>
            <ChevronRight className="text-gray-300 dark:text-slate-600 text-xs" />
            
            {isRevision ? (
              <>
                <Link 
                  href={`/${locale}/admin/listings/validation`}
                  className="text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  VALIDATIONS
                </Link>
                <ChevronRight className="text-gray-300 dark:text-slate-600 text-xs" />
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                  MODIFICATION #{listing.id.slice(-6).toUpperCase()}
                </span>
              </>
            ) : isPending ? (
              <>
                <Link 
                  href={`/${locale}/admin/listings/validation`}
                  className="text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  VALIDATIONS EN ATTENTE
                </Link>
                <ChevronRight className="text-gray-300 dark:text-slate-600 text-xs" />
                <span className="text-black dark:text-amber-400 font-bold">
                  NOUVELLE ANNONCE #{listing.id.slice(-6).toUpperCase()}
                </span>
              </>
            ) : (
              <>
                <Link 
                  href={`/${locale}/admin/properties`}
                  className="text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  TOUTES LES PROPRIÉTÉS
                </Link>
                <ChevronRight className="text-gray-300 dark:text-slate-600 text-xs" />
                <span className="text-gray-700 dark:text-slate-300 font-bold truncate max-w-[300px]">
                  {listing.title.toUpperCase()}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {isRevision && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-800 text-violet-700 dark:text-violet-400 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                    <IoGitBranchOutline className="text-sm" /> MODIFICATION
                  </span>
                )}
                {isPending && !isRevision && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                    <IoCreateOutline className="text-sm" /> NOUVELLE ANNONCE
                  </span>
                )}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-[10px] font-bold uppercase tracking-wider rounded-lg ${statusCfg.bg} ${statusCfg.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                  {statusCfg.label.toUpperCase()}
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1.5">{listing.title}</h1>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400">
                <IoLocationOutline className="text-base text-gray-400 dark:text-slate-500" />
                {listing.delegation}, {listing.governorate}{listing.street ? ` — ${listing.street}` : ""}
              </div>
            </div>
            <button onClick={() => window.open(`/fr/listings/${listing.id}`, "_blank")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-sky-300 dark:hover:border-sky-600 hover:text-sky-600 dark:hover:text-sky-400 transition-all flex-shrink-0">
              <IoEyeOutline className="text-sm" /> VOIR SUR LE SITE
            </button>
          </div>
        </div>
        
        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: <IoEyeOutline />, label: "VUES", value: listing.viewCount?.toLocaleString() ?? "0", color: "bg-sky-50 dark:bg-sky-950/30 border-sky-100 dark:border-sky-800 text-sky-600 dark:text-sky-400" },
            { icon: <IoCalendarOutline />, label: "RÉSERVATIONS", value: listing.bookingCount ?? 0, color: "bg-violet-50 dark:bg-violet-950/30 border-violet-100 dark:border-violet-800 text-violet-600 dark:text-violet-400" },
            { icon: <IoHeartOutline />, label: "FAVORIS", value: listing.favoriteCount ?? 0, color: "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-800 text-amber-600 dark:text-amber-400" },
            { icon: <IoCashOutline />, label: "REVENUS", value: `${(listing.totalRevenue ?? 0).toLocaleString()} TND`, color: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400" },
          ].map(({ icon, label, value, color }) => (
            <div key={label} className={`flex items-center gap-3 p-4 rounded-xl border ${color}`}>
              <span className="text-xl flex-shrink-0">{icon}</span>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-slate-400 font-semibold">{label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Revision banner ── */}
        {isRevision && listing.pendingRevisionData && (
          <div className="mb-6 border border-violet-200 dark:border-violet-800 rounded-2xl overflow-hidden">
            <div className="flex items-start gap-4 p-5 bg-violet-50 dark:bg-violet-950/30">
              <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/50 border border-violet-200 dark:border-violet-700 flex items-center justify-center flex-shrink-0">
                <IoGitBranchOutline className="text-violet-600 dark:text-violet-400 text-base" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-violet-900 dark:text-violet-300 mb-0.5">MODIFICATION EN ATTENTE</h4>
                <p className="text-xs text-violet-600/80 dark:text-violet-400/80">Le propriétaire a demandé à modifier son annonce active.</p>
              </div>
              <button onClick={() => setShowChanges(!showChanges)} className="text-xs font-medium text-violet-700 dark:text-violet-400 hover:underline flex items-center gap-1">
                <IoDocumentTextOutline className="text-sm" />
                {showChanges ? "MASQUER" : "VOIR LES CHANGEMENTS"}
              </button>
            </div>
            {showChanges && (
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {listing.pendingRevisionData.changes.map((c, i) => (
                  <div key={i} className="p-5 grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-1">CHAMP</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 capitalize">{c.field.replace(/_/g, " ")}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-rose-500 dark:text-rose-400 mb-1">AVANT</p>
                        <p className="text-xs text-rose-700 dark:text-rose-400 line-through">{String(c.oldValue ?? "—")}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-500 dark:text-emerald-400 mb-1">APRÈS</p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">{String(c.newValue ?? "—")}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">

          {/* ══ LEFT ═══════════════════════════════════════════════════════ */}
          <div className="space-y-6 min-w-0">

            {/* Gallery */}
            <div className="grid grid-cols-4 gap-2 h-[340px] lg:h-[480px] rounded-2xl overflow-hidden">
              <div className="col-span-2 row-span-2 relative overflow-hidden cursor-pointer group bg-gray-100 dark:bg-slate-800"
                onClick={() => displayPhotos[0] && setLightboxImg(displayPhotos[0].url)}>
                {displayPhotos[0] ? (
                  <img src={getImageUrl(displayPhotos[0].url)} alt={listing.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><IoHomeOutline className="text-5xl text-gray-300 dark:text-slate-600" /></div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                <span className="absolute bottom-3 left-3 flex items-center gap-1 text-[10px] font-bold text-white bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <IoExpandOutline className="text-xs" /> AGRANDIR
                </span>
              </div>
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="relative overflow-hidden cursor-pointer group bg-gray-100 dark:bg-slate-800" onClick={() => displayPhotos[idx] && setLightboxImg(displayPhotos[idx].url)}>
                  {displayPhotos[idx] ? (
                    <img src={getImageUrl(displayPhotos[idx].url)} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><IoHomeOutline className="text-2xl text-gray-300 dark:text-slate-600" /></div>
                  )}
                  {idx === 3 && listing.photos && listing.photos.length > 5 && (
                    <div className="absolute inset-0 bg-black/55 flex items-center justify-center"><p className="text-white font-bold text-lg">+{listing.photos.length - 5}</p></div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick props */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                listing.surfaceArea > 0 && { icon: <MdOutlineSquareFoot />, label: "SURFACE", value: `${listing.surfaceArea} m²` },
                listing.rooms > 0 && { icon: <IoBedOutline />, label: "CHAMBRES", value: listing.rooms },
                listing.bathrooms > 0 && { icon: <FaShower />, label: "SDB", value: listing.bathrooms },
                listing.numberOfKitchens > 0 && { icon: <MdOutlineKitchen />, label: "CUISINES", value: listing.numberOfKitchens },
                listing.maxGuests > 0 && { icon: <IoPeopleOutline />, label: "VOYAGEURS MAX", value: listing.maxGuests },
                { icon: <IoHomeOutline />, label: "TYPE", value: TYPE_LABELS[listing.type] ?? listing.type },
                { icon: <IoStatsChartOutline />, label: "ÉTAGE", value: listing.floorNumber === 0 ? "RDC" : `${listing.floorNumber}e` },
              ].filter(Boolean).map((p: any) => (
                <div key={p.label} className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <span className="text-lg text-gray-400 dark:text-slate-500 flex-shrink-0">{p.icon}</span>
                  <div>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest font-semibold">{p.label}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{p.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Feature pills */}
            {(listing.isFurnished || listing.petsAllowed || listing.smokingAllowed || listing.hasElevator || listing.hasBalcony || listing.hasGarden || listing.hasGarage) && (
              <div className="flex flex-wrap gap-2">
                {[
                  listing.isFurnished && { icon: <IoHomeOutline />, label: "MEUBLÉ", cls: "bg-sky-50 dark:bg-sky-950/30 border-sky-100 dark:border-sky-800 text-sky-700 dark:text-sky-400" },
                  listing.petsAllowed && { icon: <MdOutlinePets />, label: "ANIMAUX ACCEPTÉS", cls: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400" },
                  listing.smokingAllowed && { icon: <MdSmokingRooms />, label: "FUMEURS", cls: "bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-800 text-orange-700 dark:text-orange-400" },
                  listing.hasElevator && { icon: <MdOutlineElevator />, label: "ASCENSEUR", cls: "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300" },
                  listing.hasBalcony && { icon: <MdBalcony />, label: "BALCON", cls: "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300" },
                  listing.hasGarden && { icon: <IoLeafOutline />, label: "JARDIN", cls: "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300" },
                  listing.hasGarage && { icon: <IoCarOutline />, label: "GARAGE", cls: "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300" },
                ].filter(Boolean).map((f: any) => (
                  <span key={f.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${f.cls}`}>
                    <span className="text-sm">{f.icon}</span> {f.label}
                  </span>
                ))}
              </div>
            )}

            {/* Equipment */}
            {activeEquipment.length > 0 && (
              <Section title="ÉQUIPEMENTS" icon={<IoConstructOutline />}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activeEquipment.map(({ key, label, icon }) => (
                    <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-xs text-gray-700 dark:text-slate-300">
                      <span className="text-sm text-gray-400 dark:text-slate-500">{icon}</span> {label}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Rules */}
            {activeRules.length > 0 && (
              <Section title="RÈGLEMENT" icon={<IoShieldCheckmarkOutline />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeRules.map(({ key, label, icon, positive }) => (
                    <div key={key} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium ${positive ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-400"}`}>
                      <span className="text-sm">{icon}</span> {label}
                    </div>
                  ))}
                </div>
                {listing.customRules && (
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800 rounded-xl">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 dark:text-amber-400 mb-1">RÈGLES PERSONNALISÉES</p>
                    <p className="text-xs text-amber-800 dark:text-amber-300">{listing.customRules}</p>
                  </div>
                )}
              </Section>
            )}

            {/* Description */}
            {listing.description && (
              <Section title="DESCRIPTION" icon={<IoDocumentTextOutline />}>
                <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
              </Section>
            )}

            {/* Bookings */}
            {listing.upcomingBookings?.length > 0 && (
              <Section title={`RÉSERVATIONS (${listing.upcomingBookings.length})`} icon={<IoCalendarOutline />}>
                <div className="space-y-2">
                  {listing.upcomingBookings.map(b => {
                    const bc = BOOKING_STATUS[b.status] ?? { label: b.status, color: "text-gray-600 dark:text-gray-400" };
                    return (
                      <div key={b.id} className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{b.tenantName}</p>
                          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                            {format(new Date(b.checkIn), "dd MMM", { locale: fr })} → {format(new Date(b.checkOut), "dd MMM yyyy", { locale: fr })} · {b.nights} nuit{b.nights > 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{b.totalPrice.toLocaleString()} TND</p>
                          <p className={`text-[10px] font-medium ${bc.color}`}>{bc.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Map */}
            <Section title="LOCALISATION" icon={<IoMapOutline />}>
              <div className="h-64 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                {listing.latitude && listing.longitude ? (
                  <ListingMap homeLat={listing.latitude} homeLng={listing.longitude} pois={[]} zoom={14} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-800/50">
                    <IoMapOutline className="text-4xl text-gray-300 dark:text-slate-600 mb-2" />
                    <p className="text-xs text-gray-400 dark:text-slate-500">Coordonnées non définies</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5 mt-2.5">
                <IoLocationOutline className="text-sm text-gray-400 dark:text-slate-500" />
                {listing.delegation}, {listing.governorate}{listing.street ? ` — ${listing.street}` : ""}
              </p>
            </Section>
          </div>

          {/* ══ RIGHT ══════════════════════════════════════════════════════ */}
          <div className="space-y-5 lg:sticky lg:top-6">

            {/* Pricing */}
            <Section title="TARIFICATION" icon={<IoCashOutline />}>
              <div className="space-y-3">
                {listing.pricePerNight && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800">
                    <span className="text-sm text-gray-500 dark:text-slate-400">Prix / nuit</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{listing.pricePerNight.toLocaleString()} TND</span>
                  </div>
                )}
                {listing.pricePerMonth && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800">
                    <span className="text-sm text-gray-500 dark:text-slate-400">Prix / mois</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{listing.pricePerMonth.toLocaleString()} TND</span>
                  </div>
                )}
                {listing.cleaningFee && listing.cleaningFee > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800">
                    <span className="text-sm text-gray-500 dark:text-slate-400">Ménage</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{listing.cleaningFee.toLocaleString()} TND</span>
                  </div>
                )}
                {listing.securityDeposit && listing.securityDeposit > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-500 dark:text-slate-400">Caution</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{listing.securityDeposit.toLocaleString()} TND</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold">TYPE LOCATION</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-slate-300 px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-slate-800">
                    {listing.rentalType === "SHORT_TERM" ? "Court terme" : listing.rentalType === "LONG_TERM" ? "Long terme" : "Court & long"}
                  </span>
                </div>
              </div>
            </Section>

            {/* ── Validation panel (COLORED) ── */}
            {needsValidation && (
              <div className={`rounded-2xl overflow-hidden relative ${isRevision ? "bg-gradient-to-br from-violet-600 to-purple-900 dark:from-violet-800 dark:to-purple-950" : "bg-gradient-to-br from-indigo-600 to-violet-800 dark:from-indigo-800 dark:to-violet-950"}`}>
                <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl ${isRevision ? "bg-violet-500/20" : "bg-sky-500/20"}`} />

                <div className="relative z-10 p-6">
                  <div className="mb-5">
                    <h3 className="text-xl font-bold text-white">
                      {isRevision ? "VALIDATION DE MODIFICATION" : "VALIDATION D'ANNONCE"}
                    </h3>
                    <p className="text-sm text-white/70 mt-1.5">
                      {isRevision ? "Le propriétaire souhaite modifier son annonce active." : "Nouvelle annonce nécessitant votre validation."}
                    </p>
                  </div>

                  <div className="space-y-2.5 mb-5">
                    <button onClick={() => handleValidate("approve")} disabled={actionLoading}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      {actionLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <IoCheckmarkCircleOutline className="text-lg" />}
                      {isRevision ? "APPROUVER LA MODIFICATION" : "APPROUVER L'ANNONCE"}
                    </button>
                    <button onClick={() => handleValidate("reject")} disabled={actionLoading || !rejectionReason}
                      className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      <IoCloseOutline className="text-lg" />
                      {isRevision ? "REJETER LA MODIFICATION" : "REJETER L'ANNONCE"}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold text-white/50 tracking-widest">
                        MOTIF DU REJET <span className="text-rose-400">*</span>
                      </label>
                      {rejectionReason && (
                        <button onClick={() => setRejectionReason("")} className="text-xs text-white/40 hover:text-white/70">EFFACER</button>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {REJECTION_REASONS.map(reason => (
                        <label key={reason} className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all text-sm ${
                          rejectionReason === reason
                            ? "bg-rose-500/20 border border-rose-400/40 text-white"
                            : "bg-white/10 border border-transparent hover:bg-white/20 text-white/80"
                        }`}>
                          <input
                            type="radio"
                            name="rejection"
                            value={reason}
                            checked={rejectionReason === reason}
                            onChange={e => setRejectionReason(e.target.value)}
                            className="w-3.5 h-3.5 border-2 border-white/30 text-rose-500 focus:ring-rose-500/20 bg-transparent checked:bg-rose-500"
                          />
                          <span className="text-xs">{reason}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <label className="text-[10px] uppercase font-bold text-white/50 tracking-widest">PRÉCISIONS (OPTIONNEL)</label>
                    <textarea
                      value={rejectionDetails}
                      onChange={e => setRejectionDetails(e.target.value)}
                      placeholder="Ajoutez des détails pour aider le propriétaire…"
                      rows={3}
                      className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-xs text-white placeholder-white/40 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/40 resize-none transition-all"
                    />
                  </div>

                  <p className={`mt-4 text-[10px] text-center ${isRevision ? "text-violet-300/70" : "text-sky-300/70"}`}>
                    {isRevision ? "L'annonce restera active avec ses infos actuelles en cas de rejet." : "Le propriétaire sera notifié par e-mail."}
                  </p>
                </div>
              </div>
            )}

            {/* Owner */}
            <Section title="PROPRIÉTAIRE" icon={<IoPeopleOutline />}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-sky-100 to-violet-100 dark:from-sky-900/50 dark:to-violet-900/50 flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-slate-700">
                  {listing.owner.profilePictureUrl ? (
                    <img src={getImageUrl(listing.owner.profilePictureUrl)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-base font-bold text-sky-600 dark:text-sky-400">{listing.owner.firstName?.charAt(0)}{listing.owner.lastName?.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{listing.owner.firstName} {listing.owner.lastName}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500">Depuis {format(new Date(listing.owner.createdAt), "MMMM yyyy", { locale: fr })}</p>
                  {listing.owner.isIdentityVerified && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      <IoCheckmarkDoneOutline className="text-[10px]" /> VÉRIFIÉ
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2.5 text-xs text-gray-600 dark:text-slate-400">
                <div className="flex items-center gap-2"><IoCallOutline className="text-sm text-gray-400 dark:text-slate-500" />{listing.owner.phoneNumber ?? "Non renseigné"}</div>
                <div className="flex items-center gap-2"><IoMailOutline className="text-sm text-gray-400 dark:text-slate-500" /><span className="truncate">{listing.owner.email}</span></div>
                <div className="flex items-center gap-2"><IoStarSharp className="text-sm text-amber-400" />{(listing.owner.stats?.averageRating ?? 0).toFixed(1)}/5 <span className="text-gray-400 dark:text-slate-500">({listing.owner.stats?.totalReviews ?? 0})</span></div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button onClick={() => router.push(`/${locale}/admin/users/${listing.owner.id}`)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-sky-300 dark:hover:border-sky-600 hover:text-sky-600 dark:hover:text-sky-400 transition-all">
                  <IoEyeOutline className="text-sm" /> VOIR LE PROFIL COMPLET
                </button>
              </div>
            </Section>

            {/* Dates */}
            <Section title="DATES" icon={<IoCalendarOutline />}>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between"><span className="text-gray-400 dark:text-slate-500">CRÉÉE</span><span className="font-medium text-gray-700 dark:text-slate-300">{format(new Date(listing.createdAt), "dd MMM yyyy", { locale: fr })}</span></div>
                {listing.publishedAt && <div className="flex justify-between"><span className="text-gray-400 dark:text-slate-500">PUBLIÉE</span><span className="font-medium text-gray-700 dark:text-slate-300">{format(new Date(listing.publishedAt), "dd MMM yyyy", { locale: fr })}</span></div>}
                {listing.rejectionReason && (
                  <div className="mt-2 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800 rounded-xl">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-rose-500 dark:text-rose-400 mb-1">MOTIF REJET PRÉCÉDENT</p>
                    <p className="text-xs text-rose-700 dark:text-rose-400">{listing.rejectionReason}</p>
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