// app/[locale]/(dashboard)/admin/properties/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import Link from "next/link";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Alert from "@/components/ui/Alert";
import Pagination from "@/components/ui/Pagination";
import MapPickerWrapper from "@/components/ui/maps/MapPickerWrapper";

import {
  Home,
  Building2,
  Hotel,
  Layers,
  MapPin,
  Eye,
  CalendarDays,
  TrendingUp,
  Bed,
  Bath,
  Users,
  Square,
  CheckCircle2,
  EyeOff,
  Archive,
  Trash2,
  MoreHorizontal,
  Search,
  Filter,
  X,
  ChevronRight,
  DollarSign,
  Star,
  Crown,
  AlertCircle,
  RefreshCw,
  Settings,
  UserPlus,
  Mail,
  Clock,
  Trophy,
  History,
  Shield,
  Sparkles,
  Zap,
  Download,
  TrendingUp as TrendingUpIcon,
  PlusCircle,
} from "lucide-react";
import { TbHomeEdit, TbHomeShare, TbHomeOff } from "react-icons/tb";

// Fonction pour les images
const pip = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

// ── Status Badge Component ───────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config: Record<
    string,
    { bg: string; text: string; icon: any; label: string; dotColor: string }
  > = {
    ACTIVE: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      icon: CheckCircle2,
      label: "Active",
      dotColor: "bg-emerald-500",
    },
    INACTIVE: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      icon: EyeOff,
      label: "Inactive",
      dotColor: "bg-amber-500",
    },
    DRAFT: {
      bg: "bg-slate-100",
      text: "text-slate-600",
      icon: EyeOff,
      label: "Brouillon",
      dotColor: "bg-slate-400",
    },
    ARCHIVED: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      icon: Archive,
      label: "Archivé",
      dotColor: "bg-purple-500",
    },
    PENDING_REVIEW: {
      bg: "bg-sky-50",
      text: "text-sky-700",
      icon: Clock,
      label: "En attente",
      dotColor: "bg-amber-400",
    },
    REPORTED: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      icon: AlertCircle,
      label: "Signalé",
      dotColor: "bg-rose-500",
    },
  };
  const cfg = config[status] || config.DRAFT;
  const Icon = cfg.icon;
  return (
    <div className="flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`}></span>
      <span className={`text-xs font-bold ${cfg.text} flex items-center gap-1`}>
        <Icon size={12} /> {cfg.label}
      </span>
    </div>
  );
}

// ── Type Badge Component ─────────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; bg: string; text: string }> = {
    APARTMENT: {
      label: "Appartement",
      bg: "bg-blue-50",
      text: "text-blue-700",
    },
    VILLA: {
      label: "Villa",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
    },
    STUDIO: { label: "Studio", bg: "bg-purple-50", text: "text-purple-700" },
    DUPLEX: { label: "Duplex", bg: "bg-amber-50", text: "text-amber-700" },
    HOUSE: { label: "Maison", bg: "bg-slate-100", text: "text-slate-700" },
  };
  const cfg = config[type] || config.APARTMENT;
  return (
    <span
      className={`px-3 py-1 ${cfg.bg} ${cfg.text} text-[10px] font-black uppercase rounded-full`}
    >
      {cfg.label}
    </span>
  );
}

// ── Fonctions pour le propriétaire ──────────────────────────────────────────
const getOwnerInitials = (listing: any) => {
  if (listing.owner?.firstName || listing.owner?.lastName) {
    const firstName = listing.owner.firstName?.[0] || "";
    const lastName = listing.owner.lastName?.[0] || "";
    return `${firstName}${lastName}`.toUpperCase() || "?";
  }
  return listing.owner?.email?.[0]?.toUpperCase() || "?";
};

const getOwnerName = (listing: any) => {
  if (listing.owner?.firstName && listing.owner?.lastName) {
    return `${listing.owner.firstName} ${listing.owner.lastName}`;
  }
  if (listing.owner?.firstName) {
    return listing.owner.firstName;
  }
  return listing.owner?.email?.split("@")[0] || "Propriétaire";
};

// ── Main Component ──────────────────────────────────────────────────────────
export default function AdminPropertiesPage() {
  const { getToken } = useAuth();
  const t = useTranslations("AdminProperties");

  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 36.8065, lng: 10.1815 });
  const PAGE_SIZE = 5;

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    reported: 0,
  });

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = await getToken({ template: "my-app-template" });
      return fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers ?? {}),
        },
      });
    },
    [getToken],
  );

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("pageSize", PAGE_SIZE.toString());
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (typeFilter !== "ALL") params.append("type", typeFilter);

      const res = await authFetch(`/api/listings?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.totalCount || 0);

        const allListings = data.listings || [];
        setStats({
          total: data.pagination?.totalCount || 0,
          active: allListings.filter((l: any) => l.status === "ACTIVE").length,
          pending: allListings.filter((l: any) => l.status === "PENDING_REVIEW")
            .length,
          reported: 0,
        });

        const listingWithCoords = allListings.find(
          (l: any) => l.latitude && l.longitude,
        );
        if (listingWithCoords) {
          setMapCenter({
            lat: listingWithCoords.latitude,
            lng: listingWithCoords.longitude,
          });
        }
      }
    } catch (error) {
      console.error("Erreur chargement:", error);
      setAlert({
        type: "error",
        message: "Erreur lors du chargement des annonces",
      });
    } finally {
      setLoading(false);
    }
  }, [authFetch, currentPage, searchQuery, statusFilter, typeFilter]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const getMainImage = (listing: any) => {
    const mainPhoto =
      listing.photos?.find((p: any) => p.isMain) || listing.photos?.[0];
    return mainPhoto?.url ? pip(mainPhoto.url) : null;
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setCurrentPage(1);
  };

  const mapListings = listings.filter(
    (listing) => listing.latitude && listing.longitude,
  );

  if (loading && listings.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#f9f9ff] dark:bg-[#0d0f1a]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#f9f9ff] dark:bg-[#0d0f1a]">
      {/* Alertes */}
      {alert && (
        <div className="fixed top-5 right-5 z-[60] w-full max-w-sm">
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      {/* Header Section */}
      <div className="px-8 pt-8 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
              Gestion des Propriétés
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Contrôlez et modérez l'inventaire immobilier de Nesthub.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-full hover:bg-slate-200 transition-colors">
              <Filter size={16} /> Filtrer
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-slate-700 text-white font-semibold rounded-full hover:bg-slate-800 transition-colors">
              <Download size={16} /> Exporter CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-8 mb-10">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl relative overflow-hidden group border border-slate-200 dark:border-slate-700">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
            Total Listings
          </p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {stats.total}
          </p>
          <div className="mt-4 flex items-center text-xs font-bold text-emerald-600">
            <TrendingUpIcon size={14} className="mr-1" /> +12% ce mois
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl relative overflow-hidden group border border-slate-200 dark:border-slate-700">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
            Active
          </p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {stats.active}
          </p>
          <div className="mt-4 flex items-center text-xs font-bold text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>{" "}
            En ligne
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl relative overflow-hidden group border border-slate-200 dark:border-slate-700">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
            Pending
          </p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {stats.pending}
          </p>
          <div className="mt-4 flex items-center text-xs font-bold text-amber-600">
            <Clock size={14} className="mr-1" /> Attente de validation
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl relative overflow-hidden group border border-slate-200 dark:border-slate-700">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
            Under Review
          </p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {stats.reported}
          </p>
          <div className="mt-4 flex items-center text-xs font-bold text-rose-600">
            <AlertCircle size={14} className="mr-1" /> Signalements
          </div>
        </div>
      </div>

      {/* Main Data Table Container */}
      <div className="mx-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Inventaire Immobilier
          </h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une propriété..."
                className="pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${statusFilter === "ALL" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500"}`}
              >
                Tout
              </button>
              <button
                onClick={() => setStatusFilter("REPORTED")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${statusFilter === "REPORTED" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500"}`}
              >
                Signalés
              </button>
              <button
                onClick={() => setStatusFilter("ACTIVE")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${statusFilter === "ACTIVE" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500"}`}
              >
                Récents
              </button>
            </div>
            <button
              onClick={fetchListings}
              className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Propriété
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Propriétaire
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Type
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Statut
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Date de Création
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {listings.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Aucune propriété trouvée
                  </td>
                </tr>
              ) : (
                listings.map((listing) => {
                  const imageUrl = getMainImage(listing);
                  return (
                    <tr
                      key={listing.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Colonne Propriété avec image */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={listing.title}
                              className="w-16 h-12 rounded-lg object-cover shadow-sm"
                            />
                          ) : (
                            <div className="w-16 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                              <Home size={20} className="text-slate-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">
                              {listing.title}
                            </p>
                            <p className="text-[11px] text-slate-400 font-medium flex items-center">
                              <MapPin size={12} className="mr-1" />{" "}
                              {listing.governorate}, {listing.delegation}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Colonne Propriétaire avec avatar et photo de profil */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 flex items-center justify-center overflow-hidden ring-2 ring-indigo-500/10 flex-shrink-0">
                            {listing.owner?.profilePictureUrl ? (
                              <img
                                src={pip(listing.owner.profilePictureUrl)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                {getOwnerInitials(listing)}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {getOwnerName(listing)}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                              {listing.owner?.email || ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Colonne Type */}
                      <td className="px-6 py-4">
                        <TypeBadge type={listing.type} />
                      </td>

                      {/* Colonne Statut */}
                      <td className="px-6 py-4">
                        <StatusBadge status={listing.status} />
                      </td>

                      {/* Colonne Date */}
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium text-slate-500">
                          {new Date(listing.createdAt).toLocaleDateString(
                            "fr-FR",
                          )}
                        </p>
                      </td>

                      {/* Colonne Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/fr/dashboard/owner/listings/${listing.id}`}
                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Voir"
                          >
                            <Eye size={18} />
                          </Link>
                          <Link
                            href={`/fr/dashboard/owner/listings/${listing.id}/edit`}
                            className="p-2 text-slate-400 hover:text-amber-500 transition-colors"
                            title="Modifier"
                          >
                            <TbHomeEdit size={18} />
                          </Link>
                          <button
                            className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Bloquer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              Affichage de 1-{listings.length} sur {totalCount} propriétés
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Secondary Section: Map & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10 px-8 pb-8">
        {/* Carte des propriétés */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Distribution Géographique
            </h3>
            <p className="text-xs text-slate-500">
              {mapListings.length} propriété
              {mapListings.length !== 1 ? "s" : ""} sur la carte
            </p>
          </div>
          <div className="h-[400px] rounded-xl overflow-hidden relative">
            {mapListings.length > 0 ? (
              <MapPickerWrapper
                latitude={mapCenter.lat}
                longitude={mapCenter.lng}
                onLocationChange={() => {}}
                readOnly={true}
                markers={mapListings.map((l) => ({
                  id: l.id,
                  title: l.title,
                  latitude: l.latitude,
                  longitude: l.longitude,
                  status: l.status,
                  price: l.pricePerNight || l.pricePerMonth || undefined,
                }))}
                showAllMarkers={true}
                onMarkerClick={(id) =>
                  (window.location.href = `/fr/dashboard/owner/listings/${id}`)
                }
              />
            ) : (
              <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center">
                <MapPin size={48} className="text-slate-400 mb-4" />
                <p className="text-slate-500 text-sm">
                  Aucune propriété avec localisation
                </p>
              </div>
            )}
          </div>
          {/* Miniatures des propriétés */}
          {mapListings.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {mapListings.slice(0, 5).map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                  onClick={() =>
                    (window.location.href = `/fr/listings/${listing.id}`)
                  }
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      listing.status === "ACTIVE"
                        ? "bg-emerald-500"
                        : listing.status === "INACTIVE"
                          ? "bg-amber-500"
                          : listing.status === "DRAFT"
                            ? "bg-slate-500"
                            : listing.status === "ARCHIVED"
                              ? "bg-purple-500"
                              : listing.status === "PENDING_REVIEW"
                                ? "bg-blue-500"
                                : "bg-rose-500"
                    }`}
                  ></div>
                  <span className="truncate max-w-[120px]">
                    {listing.title}
                  </span>
                </div>
              ))}
              {mapListings.length > 5 && (
                <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs">
                  +{mapListings.length - 5} autres
                </div>
              )}
            </div>
          )}
        </div>

        {/* Alertes Récentes */}
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
            Alertes Récentes
          </h3>
          <div className="space-y-4">
            <div className="flex gap-4 p-3 bg-white dark:bg-slate-900 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Signalement: Fraude
                </p>
                <p className="text-[11px] text-slate-500">
                  Propriété signalée pour photos mensongères.
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Il y a 2 heures
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-3 bg-white dark:bg-slate-900 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Propriété Vérifiée
                </p>
                <p className="text-[11px] text-slate-500">
                  Une nouvelle propriété a été vérifiée.
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Il y a 5 heures
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-3 bg-white dark:bg-slate-900 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                <PlusCircle size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Nouveau Listing
                </p>
                <p className="text-[11px] text-slate-500">
                  Un propriétaire a ajouté un nouveau bien.
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Hier, 18:30</p>
              </div>
            </div>
          </div>
          <button className="w-full mt-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors">
            Tout voir
          </button>
        </div>
      </div>
    </div>
  );
}
