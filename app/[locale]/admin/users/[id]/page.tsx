// app/[locale]/admin/users/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import {
  IoArrowBackOutline,
  IoShieldCheckmarkOutline,
  IoLocationOutline,
  IoSearchOutline,
  IoNotificationsOutline,
  IoSettingsOutline,
  IoMenuOutline,
  IoAddOutline,
  IoLockClosedOutline,
  IoChevronForwardOutline,
  IoDocumentTextOutline,
  IoTimeOutline,
  IoCloseOutline,
  IoDownloadOutline,
  IoExpandOutline,
  IoAlertCircleOutline,
  IoScaleOutline,
  IoReceiptOutline,
  IoStar,
  IoInformationCircleOutline,
  IoGlobeOutline,
  IoCallOutline,
  IoMailOutline,
  IoCalendarOutline,
} from "react-icons/io5";
import {
  FaBuilding,
  FaMedal,
  FaIdCard,
  FaPassport,
  FaGavel,
  FaUserCheck,
} from "react-icons/fa";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// ============================================
// STYLES DU THÈME ADMIN
// ============================================
const block3d = "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";
const card3d = "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

// ============================================
// TYPES
// ============================================
interface UserDetails {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  governorate?: string;
  delegation?: string;
  role: string;
  isIdentityVerified: boolean;
  twoFactorEnabled: boolean;
  status: string;
  suspendedUntil?: string;
  createdAt: string;
  verificationRequestId?: string;
  escalationLevel?: number;
  cinData?: {
    cinNumber?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    documentType?: string;
    passportNumber?: string;
    country?: string;
    frontImageUrl?: string;
    backImageUrl?: string;
    passportUrl?: string;
  };
  stats: {
    trustScore: number;
    globalRank: number;
    totalVolume: number;
    activeBalance: number;
    pendingPayout: number;
    totalCommission: number;
    totalListings?: number;
    totalBookings?: number;
    totalReviews?: number;
    averageRating?: string;
    responseRate?: number;
  };
  listings: Listing[];
  recentActivity: Activity[];
  disputes: Dispute[];
  tenantBookings?: Booking[];
}

interface Listing {
  id: string;
  title: string;
  location: string;
  pricePerNight: number;
  status: string;
  rating: number;
  reviewCount: number;
  image: string;
}

interface Activity {
  id: string;
  type: string;
  device?: string;
  ipAddress?: string;
  location?: string;
  timestamp: string;
  status?: string;
}

interface Dispute {
  id: string;
  number: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface Booking {
  id: string;
  listingId: string;
  listing?: {
    title: string;
    governorate: string;
  };
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

// ============================================
// FORMATAGE DES TEXTES EN FRANÇAIS
// ============================================
const formatUserStatus = (status: string) => {
  switch (status) {
    case "ACTIVE": return "Session active";
    case "TEMPORARILY_SUSPENDED": return "Suspendu temporairement";
    case "PERMANENTLY_BANNED": return "Banni définitivement";
    case "PENDING_VALIDATION": return "En attente de validation";
    case "SECURITY_LOCKED": return "Verrouillé (sécurité)";
    case "INACTIVE": return "Inactif";
    case "REJECTED": return "Rejeté";
    default: return status || "Inconnu";
  }
};

const formatUserRole = (role: string) => {
  switch (role) {
    case "PROPERTY_OWNER": return "Hôte Premium";
    case "TENANT": return "Voyageur";
    case "ADMIN": return "Administrateur";
    case "BOTH": return "Hôte & Voyageur";
    case "CO_HOST": return "Co-hôte";
    default: return role || "Membre";
  }
};

const formatRiskLevel = (score: number) => {
  if (score >= 90) return "Faible";
  if (score >= 70) return "Moyen";
  return "Élevé";
};

const formatVerificationStatus = (isVerified: boolean) => {
  return isVerified ? "KYC Vérifié" : "Vérification en attente";
};

const formatDisputeStatus = (status: string) => {
  switch (status?.toLowerCase()) {
    case "open": return "Ouvert";
    case "resolved": return "Résolu";
    case "closed": return "Fermé";
    case "rejected": return "Rejeté";
    default: return status || "En cours";
  }
};

const formatDisputePriority = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case "high": return "Urgent";
    case "medium": return "Moyen";
    case "low": return "Normal";
    default: return priority || "Normal";
  }
};

const formatBookingStatus = (status: string) => {
  switch (status) {
    case "COMPLETED": return "Terminée";
    case "PENDING": return "En attente";
    case "CONFIRMED": return "Confirmée";
    case "CANCELLED": return "Annulée";
    default: return status || "En cours";
  }
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "active": case "live": case "open": case "resolved": case "completed":
      return "bg-green-500 text-white";
    case "pending": case "pending_review":
      return "bg-amber-500 text-white";
    case "closed": case "rejected": case "cancelled":
      return "bg-red-500 text-white";
    default: return "bg-slate-500 text-white";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case "high": case "urgent":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "medium":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    default:
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  }
};

const getRiskColor = (score: number) => {
  if (score >= 90) return "text-emerald-600";
  if (score >= 70) return "text-amber-600";
  return "text-red-600";
};

const getImageUrl = (url: string) => {
  if (!url) return "";
  return `/api/listings/image?url=${encodeURIComponent(url)}`;
};

const getDocumentImageUrl = (url: string) => {
  if (!url) return "";
  return `/api/admin/serve-image?url=${encodeURIComponent(url)}`;
};

const formatDate = (dateString: string) => {
  if (!dateString) return "Date inconnue";
  try {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch { return "Date inconnue"; }
};

const formatDateTime = (dateString: string) => {
  if (!dateString) return "Date inconnue";
  try {
    return new Date(dateString).toLocaleString("fr-FR", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return "Date inconnue"; }
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function AdminUserDetailsPage() {
  const params = useParams();
  const userId = params.id as string;
  const { getToken } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserDetails | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [docSide, setDocSide] = useState<"front" | "back">("front");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);

  const isPropertyOwner = user?.role === "PROPERTY_OWNER" || user?.role === "BOTH";

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUser(data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const viewSessionDetails = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowSessionModal(true);
  };

  const goToUserListings = () => router.push(`/admin/properties?userId=${userId}`);
  const goToUserBookings = () => router.push(`/admin/transactions?userId=${userId}`);
  const goToUserDisputes = () => router.push(`/admin/disputes?userId=${userId}`);
  const goToUserVerification = () => {
    if (user?.verificationRequestId) {
      router.push(`/admin/verifications/${user.verificationRequestId}`);
    } else {
      router.push(`/admin/verifications?userId=${userId}`);
    }
  };

  const getDocumentImage = () => {
    if (isPassport) {
      return user?.cinData?.passportUrl || user?.cinData?.frontImageUrl || null;
    } else {
      return docSide === "front" ? user?.cinData?.frontImageUrl : user?.cinData?.backImageUrl;
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Chargement du profil utilisateur..." size="lg" color="primary" variant="spinner" />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Utilisateur non trouvé</h2>
          <Link href="/admin/users" className="mt-4 text-indigo-600 hover:underline inline-block">Retour à la liste</Link>
        </div>
      </div>
    );
  }

  const riskColor = getRiskColor(user.stats?.trustScore || 85);
  const trustScore = user.stats?.trustScore || 85;
  const isPassport = user.cinData?.documentType === "PASSPORT";
  const hasBack = !!user.cinData?.backImageUrl && !isPassport;
  const bookings = (user as any).tenantBookings || [];
  const documentImageUrl = getDocumentImage();

  return (
    <div className="min-h-screen">
      <main className="md:ml-2 min-h-screen pb-20">
        <div className="px-4 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8 max-w-[1600px] mx-auto">
          
          {/* Fil d'Ariane */}
          <div className="flex items-center gap-2 text-xs font-medium">
            <Link href="/admin/dashboard" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">ADMIN</Link>
            <IoChevronForwardOutline className="h-3 w-3 text-slate-400" />
            <Link href="/admin/users" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600">Utilisateurs</Link>
            <IoChevronForwardOutline className="h-3 w-3 text-slate-400" />
            <span className="text-slate-700 dark:text-slate-300 font-semibold">Détails du profil</span>
          </div>

          {/* Header avec retour seulement */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Détails du profil</h2>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">Consultez les informations de l'utilisateur</p>
              </div>
            </div>
          </div>

          {/* Section Hero */}
          <div className="grid grid-cols-12 gap-4 md:gap-6">
            {/* Carte de profil utilisateur - avec block3d */}
            <div className={`col-span-12 lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-start relative overflow-hidden ${block3d}`}>
              <div className="absolute top-0 right-0 p-4 md:p-6">
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-bold tracking-wider uppercase">
                  {user.status === "ACTIVE" ? "Session active" : formatUserStatus(user.status)}
                </span>
              </div>
              <div className="relative group">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden ring-4 ring-indigo-100 dark:ring-indigo-950/50 group-hover:ring-indigo-300 transition-all">
                  {user.profilePictureUrl ? (
                    <img className="w-full h-full object-cover" src={getImageUrl(user.profilePictureUrl)} alt={user.fullName} />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl md:text-4xl font-bold">
                      {(user.fullName || user.firstName || user.email || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-800 p-1.5 rounded-lg shadow-md">
                  <IoShieldCheckmarkOutline className="text-indigo-600 text-xl" />
                </div>
              </div>
              <div className="flex-1 space-y-3 md:space-y-4">
                <div className="space-y-1">
                  <h3 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white">{user.fullName}</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-xs md:text-sm flex items-center gap-2">
                    <IoMailOutline className="text-sm" /> {user.email}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-xs flex items-center gap-2">
                    <IoCalendarOutline className="text-sm" /> Membre depuis {formatDate(user.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] md:text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <FaMedal className="text-[12px] md:text-[14px]" /> {formatUserRole(user.role)}
                  </span>
                  {user.twoFactorEnabled && (
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] md:text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <IoShieldCheckmarkOutline className="text-[12px] md:text-[14px]" /> Double authentification
                    </span>
                  )}
                  {user.governorate && (
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] md:text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <IoLocationOutline className="text-[12px] md:text-[14px]" /> {user.governorate}
                    </span>
                  )}
                  {user.isIdentityVerified && (
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/30 rounded-lg text-[10px] md:text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <FaUserCheck className="text-[12px] md:text-[14px]" /> Identité vérifiée
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Statistiques rapides - avec card3d */}
            <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-3 md:gap-4">
              <div className={`bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-6 flex flex-col justify-between ${card3d}`}>
                <p className="text-[9px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Score de confiance</p>
                <div>
                  <p className="text-2xl md:text-4xl font-display font-bold text-indigo-600">{trustScore}<span className="text-sm md:text-xl font-medium opacity-50">%</span></p>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${trustScore}%` }}></div>
                  </div>
                </div>
              </div>
              <div className={`bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-6 flex flex-col justify-between ${card3d}`}>
                <p className="text-[9px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Rang global</p>
                <div>
                  <p className="text-2xl md:text-4xl font-display font-bold text-purple-600">#{user.stats?.globalRank || 142}</p>
                  <p className="text-[9px] md:text-[10px] text-emerald-600 font-bold mt-1 md:mt-2">↑ 12 positions ce mois</p>
                </div>
              </div>
              <div className={`bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-6 flex flex-col justify-between ${card3d}`}>
                <p className="text-[9px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Volume total</p>
                <div>
                  <p className="text-xl md:text-2xl font-display font-bold">{Math.round(user.stats?.totalVolume || 0).toLocaleString()}<span className="text-xs md:text-sm font-medium opacity-50"> TND</span></p>
                  <p className="text-[8px] md:text-[10px] text-slate-400 mt-1 md:mt-2">Valeur brute historique</p>
                </div>
              </div>
              <div className={`bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-6 flex flex-col justify-between border-2 border-indigo-200 dark:border-indigo-800 ${card3d}`}>
                <p className="text-[9px] md:text-xs font-bold text-indigo-600 uppercase tracking-widest">Niveau de risque</p>
                <div>
                  <p className={`text-2xl md:text-4xl font-display font-bold ${riskColor}`}>{formatRiskLevel(user.stats?.trustScore || 85)}</p>
                  <p className="text-[8px] md:text-[10px] text-indigo-600/70 font-bold mt-1 md:mt-2">Dernier audit : il y a 2h</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section principale */}
          <div className="grid grid-cols-12 gap-6 md:gap-8">
            
            {/* Colonne gauche - Performance financière */}
            <div className="col-span-12 xl:col-span-7 space-y-5 md:space-y-6">
              {isPropertyOwner ? (
                <>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
                    <div>
                      <h4 className="text-lg md:text-xl font-display font-bold text-slate-900 dark:text-white">Performance financière</h4>
                      <p className="text-xs md:text-sm text-slate-500">Analyse des revenus et santé des paiements</p>
                    </div>
                    <button onClick={goToUserBookings} className="text-[10px] md:text-xs font-bold text-indigo-600 flex items-center gap-1">
                      Voir le grand livre <IoChevronForwardOutline className="text-sm" />
                    </button>
                  </div>
                  <div className={`bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-8 ${card3d}`}>
                    <div className="grid grid-cols-3 gap-4 md:gap-8 mb-6 md:mb-8">
                      <div className="space-y-1">
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Solde actif</p>
                        <p className="text-xl md:text-2xl font-display font-bold text-slate-900 dark:text-white">{Math.round(user.stats?.activeBalance || 0).toLocaleString()} <span className="text-[10px] md:text-xs opacity-50">TND</span></p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paiements en attente</p>
                        <p className="text-xl md:text-2xl font-display font-bold text-purple-600">{Math.round(user.stats?.pendingPayout || 0).toLocaleString()} <span className="text-[10px] md:text-xs opacity-50">TND</span></p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Commission totale</p>
                        <p className="text-xl md:text-2xl font-display font-bold text-indigo-600">{Math.round(user.stats?.totalCommission || 0).toLocaleString()} <span className="text-[10px] md:text-xs opacity-50">TND</span></p>
                      </div>
                    </div>

                    <div className="relative h-36 md:h-48 w-full flex items-end gap-1 md:gap-2">
                      {[40, 65, 50, 85, 95, 70, 60, 45, 90, 75, 65, 55].map((height, i) => (
                        <div key={i} className={`flex-1 ${i === 4 ? "bg-indigo-400" : "bg-slate-200 dark:bg-slate-700"} rounded-t-lg transition-all duration-500 hover:bg-indigo-300 cursor-help`} style={{ height: `${height}%` }}></div>
                      ))}
                      <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                        <span>Jan</span><span>Fév</span><span>Mar</span><span>Avr</span><span>Mai</span><span>Juin</span>
                        <span>Juil</span><span>Aoû</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Déc</span>
                      </div>
                    </div>
                  </div>

                  {/* Réservations récentes */}
                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <IoReceiptOutline className="text-indigo-500 text-sm" />
                        <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Réservations récentes</h5>
                      </div>
                      <button onClick={goToUserBookings} className="text-[10px] md:text-xs font-bold text-indigo-600 flex items-center gap-1">
                        Voir tout <IoChevronForwardOutline className="text-sm" />
                      </button>
                    </div>
                    <div className={`bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-3 min-h-[210px] ${card3d}`}>
                      {bookings && bookings.length > 0 ? (
                        bookings.slice(0, 3).map((booking: Booking, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                                <FaBuilding className="text-indigo-500 text-sm" />
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">{booking.listing?.title || "Propriété"}</p>
                                <p className="text-[8px] text-slate-400">{formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-indigo-600">{Math.round(booking.totalPrice || 0).toLocaleString()} TND</p>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${booking.status === "COMPLETED" ? "bg-green-100 text-green-600" : booking.status === "PENDING" ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"}`}>
                                {formatBookingStatus(booking.status)}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6">
                          <IoReceiptOutline className="text-3xl text-slate-300 mx-auto mb-2" />
                          <p className="text-[10px] text-slate-400">Aucune réservation</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className={`bg-white dark:bg-slate-900 rounded-2xl p-8 text-center ${card3d}`}>
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                    <IoReceiptOutline className="text-2xl text-slate-400" />
                  </div>
                  <h4 className="text-lg font-display font-bold text-slate-700 dark:text-slate-300">Aucune donnée financière</h4>
                  <p className="text-xs text-slate-500 mt-2">Cet utilisateur est un voyageur et ne possède pas de données financières d'hôte.</p>
                  <button onClick={goToUserBookings} className="mt-4 text-[10px] md:text-xs font-bold text-indigo-600 flex items-center gap-1">
                    Voir ses réservations <IoChevronForwardOutline className="text-sm" />
                  </button>
                </div>
              )}
            </div>

            {/* Colonne droite - Dossier de vérification */}
            <div className="col-span-12 xl:col-span-5 space-y-5 md:space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <h4 className="text-lg md:text-xl font-display font-bold text-slate-900 dark:text-white">Dossier de vérification</h4>
                  <p className="text-xs md:text-sm text-slate-500">Pièces d'identité et conformité</p>
                </div>
                <button onClick={goToUserVerification} className="text-[10px] md:text-xs font-bold text-indigo-600 flex items-center gap-1">
                  Voir les détails <IoChevronForwardOutline className="text-sm" />
                </button>
                <span className={`px-2 py-1 rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-wider ${user.isIdentityVerified ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400" : "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"}`}>
                  {formatVerificationStatus(user.isIdentityVerified)}
                </span>
              </div>
              <div className={`bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 space-y-5 md:space-y-6 ${card3d}`}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {isPassport ? <FaPassport className="text-indigo-500" /> : <FaIdCard className="text-indigo-500" />}
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {isPassport ? "INFORMATIONS PASSEPORT" : "INFORMATIONS CIN"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                      <p className="text-[9px] uppercase text-slate-400">N° CIN/Passeport</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{user.cinData?.cinNumber || user.cinData?.passportNumber || "-"}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                      <p className="text-[9px] uppercase text-slate-400">Nom complet</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{user.cinData?.firstName} {user.cinData?.lastName}</p>
                    </div>
                    {isPassport && user.cinData?.country && (
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 col-span-2">
                        <p className="text-[9px] uppercase text-slate-400">Pays</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{user.cinData.country}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">IMAGES DES DOCUMENTS</p>
                  
                  {hasBack && (
                    <div className="flex gap-2">
                      {["front", "back"].map((s) => (
                        <button key={s} onClick={() => setDocSide(s as "front" | "back")} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${docSide === s ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
                          {s === "front" ? "RECTO" : "VERSO"}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="relative">
                    {documentImageUrl ? (
                      <div className="relative group cursor-pointer" onClick={() => setFullscreenImage(documentImageUrl)}>
                        <img src={getDocumentImageUrl(documentImageUrl)} alt={isPassport ? "Passeport" : "Document d'identité"} className="w-full rounded-xl shadow-md object-cover max-h-48" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                          <button onClick={(e) => { e.stopPropagation(); setFullscreenImage(documentImageUrl); }} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition">
                            <IoExpandOutline className="text-white text-xl" />
                          </button>
                          <a href={getDocumentImageUrl(documentImageUrl)} download onClick={(e) => e.stopPropagation()} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition">
                            <IoDownloadOutline className="text-white text-xl" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-[1.6/1] rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
                        <IoDocumentTextOutline className="text-3xl md:text-4xl text-slate-500" />
                        <p className="text-xs text-slate-400 ml-2">Aucune image disponible</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] md:text-xs font-bold text-slate-600 dark:text-slate-300">Avis du modérateur</span>
                    <span className="text-[9px] md:text-[10px] text-slate-400">{user.isIdentityVerified ? formatDate(new Date().toISOString()) : "En attente"}</span>
                  </div>
                  <p className="text-[11px] md:text-xs leading-relaxed text-slate-600 dark:text-slate-400 italic font-medium">
                    {user.isIdentityVerified ? "Identité vérifiée dans la base nationale. Aucune anomalie détectée. L'utilisateur est autorisé pour les transactions de grande valeur." : "Vérification des documents en attente. Veuillez examiner les documents téléchargés."}
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">AD</div>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-500">{user.isIdentityVerified ? "Agent de sécurité" : "En attente de révision"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section des propriétés */}
          {isPropertyOwner && (
            <section className="space-y-5 md:space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <h4 className="text-lg md:text-xl font-display font-bold text-slate-900 dark:text-white">Propriétés gérées</h4>
                  <p className="text-xs md:text-sm text-slate-500">Aperçu des annonces de cet hôte</p>
                </div>
                <button onClick={goToUserListings} className="text-[10px] md:text-xs font-bold text-indigo-600 flex items-center gap-1">
                  Voir toutes les propriétés <IoChevronForwardOutline className="text-sm" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {user.listings && user.listings.length > 0 ? (
                  user.listings.map((listing) => (
                    <Link key={listing.id} href={`/admin/properties/${listing.id}`}>
                      <div className={`group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300 cursor-pointer ${card3d}`}>
                        <div className="aspect-[4/3] relative">
                          {listing.image ? (
                            <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src={getImageUrl(listing.image)} alt={listing.title} />
                          ) : (
                            <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                              <FaBuilding className="text-3xl md:text-4xl text-slate-400" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full text-[9px] md:text-[10px] font-extrabold text-indigo-600">PREMIUM</div>
                          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[9px] md:text-[10px] font-extrabold uppercase text-white ${getStatusColor(listing.status)}`}>
                            {listing.status === "ACTIVE" ? "En ligne" : listing.status}
                          </div>
                        </div>
                        <div className="p-4 md:p-5 space-y-2 md:space-y-3">
                          <div>
                            <h5 className="font-display font-bold text-sm truncate text-slate-900 dark:text-white">{listing.title}</h5>
                            <p className="text-[10px] md:text-[11px] text-slate-500">{listing.location}</p>
                          </div>
                          <div className="flex justify-between items-center text-[10px] md:text-xs font-bold">
                            <span className="text-indigo-600">{listing.pricePerNight.toLocaleString()} TND / nuit</span>
                            <span className="text-slate-400">★ {listing.rating || "Nouveau"}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-4 flex flex-col items-center justify-center py-12 md:py-16 text-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <FaBuilding className="text-2xl md:text-3xl text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-sm md:text-base font-medium text-slate-500 dark:text-slate-400">Aucune propriété trouvée</p>
                    <p className="text-xs md:text-sm text-slate-400 dark:text-slate-500 mt-1">Cet hôte n'a pas encore de propriétés</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Journaux d'activité et litiges */}
          <div className="grid grid-cols-12 gap-6 md:gap-8">
            
            {/* Journaux Sentinel */}
            <div className="col-span-12 lg:col-span-8 space-y-5 md:space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <h4 className="text-lg md:text-xl font-display font-bold text-slate-900 dark:text-white">Journaux Sentinel</h4>
                  <p className="text-xs md:text-sm text-slate-500">Historique des connexions et interactions en temps réel</p>
                </div>
              </div>
              <div className={`bg-white dark:bg-slate-900 rounded-2xl overflow-hidden ${card3d}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-[9px] md:text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Type d'événement</th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-[9px] md:text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Appareil &amp; IP</th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-[9px] md:text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Localisation</th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-[9px] md:text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Date &amp; Heure</th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-[9px] md:text-[10px] font-bold text-indigo-500 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {user.recentActivity && user.recentActivity.length > 0 ? (
                        user.recentActivity.slice(0, 5).map((activity) => (
                          <tr key={activity.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                            <td className="px-4 md:px-6 py-3 md:py-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${activity.status === "failed" ? "bg-red-500" : "bg-green-500"}`}></div>
                                <span className="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300">{activity.type}</span>
                              </div>
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-4">
                              <div className="space-y-0.5">
                                <p className="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300">{activity.device || "Inconnu"}</p>
                                <p className="text-[9px] md:text-[10px] text-slate-400">{activity.ipAddress || "-"}</p>
                              </div>
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-medium text-slate-600 dark:text-slate-400">{activity.location || "-"}</td>
                            <td className="px-4 md:px-6 py-3 md:py-4 text-[9px] md:text-[10px] font-bold text-slate-400">{formatDateTime(activity.timestamp)}</td>
                            <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                              <button onClick={() => viewSessionDetails(activity)} className="text-[9px] md:text-[10px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">DÉTAILS</button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Aucune activité trouvée</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Litiges récents */}
            <div className="col-span-12 lg:col-span-4 space-y-5 md:space-y-6">
              <div className="flex items-center gap-2">
                <h4 className="text-lg md:text-xl font-display font-bold text-slate-900 dark:text-white">Litiges récents</h4>
              </div>
              <div className="space-y-4">
                {user.disputes && user.disputes.length > 0 ? (
                  user.disputes.slice(0, 3).map((dispute) => (
                    <div key={dispute.id} className={`bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-5 border-l-4 ${dispute.priority === "high" ? "border-l-red-500" : dispute.priority === "medium" ? "border-l-amber-500" : "border-l-blue-500"} ${card3d}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <IoAlertCircleOutline className={`text-sm ${dispute.priority === "high" ? "text-red-500" : dispute.priority === "medium" ? "text-amber-500" : "text-blue-500"}`} />
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${getPriorityColor(dispute.priority)}`}>
                            {formatDisputePriority(dispute.priority)}
                          </span>
                        </div>
                        <span className="text-[9px] md:text-[10px] text-slate-400 font-mono">{dispute.number}</span>
                      </div>
                      <h6 className="text-[11px] md:text-xs font-bold text-slate-900 dark:text-white mb-1">{dispute.title}</h6>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${dispute.status === "open" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                          {formatDisputeStatus(dispute.status)}
                        </span>
                        <span className="text-[9px] text-slate-400">{formatDate(dispute.createdAt)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`bg-white dark:bg-slate-900 rounded-2xl p-8 text-center flex flex-col justify-center items-center min-h-[250px] ${card3d}`}>
                    <IoScaleOutline className="text-3xl text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Aucun litige trouvé</p>
                    <p className="text-[10px] text-slate-500 mt-1">Cet utilisateur n'a aucun litige ouvert ou résolu</p>
                  </div>
                )}
              </div>
              <button onClick={goToUserDisputes} className="w-full py-3 md:py-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-[10px] md:text-xs font-bold text-slate-500 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                <IoTimeOutline className="text-base md:text-[18px]" /> Voir tous les litiges
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Session Details Modal */}
      {showSessionModal && selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowSessionModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${selectedActivity.status === "failed" ? "bg-red-500" : "bg-green-500"}`}></div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Détails de la session</h3>
                </div>
                <button onClick={() => setShowSessionModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                  <IoCloseOutline className="text-xl text-slate-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type d'événement</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{selectedActivity.type}</p>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Appareil / Navigateur</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{selectedActivity.device || "Inconnu"}</p>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Adresse IP</p>
                  <p className="text-sm font-mono text-slate-700 dark:text-slate-300 mt-1">{selectedActivity.ipAddress || "-"}</p>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Localisation</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{selectedActivity.location || "-"}</p>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date et heure</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{formatDateTime(selectedActivity.timestamp)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Statut</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedActivity.status === "failed" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>
                    {selectedActivity.status === "failed" ? "Échec" : "Succès"}
                  </span>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={() => setShowSessionModal(false)} className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition">Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {fullscreenImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setFullscreenImage(null)}>
          <img src={getDocumentImageUrl(fullscreenImage)} alt="Document plein écran" className="max-w-[92vw] max-h-[92vh] object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
          <button onClick={() => setFullscreenImage(null)} className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <IoCloseOutline className="text-white text-xl" />
          </button>
        </div>
      )}
    </div>
  );
}