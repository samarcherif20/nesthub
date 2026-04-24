// app/[locale]/admin/properties/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Alert from "@/components/ui/Alert";
import Pagination from "@/components/ui/Pagination";
import MapPickerWrapper from "@/components/ui/maps/MapPickerWrapper";

import {
  IoSearchOutline,
  IoFilterOutline,
  IoCloseOutline,
  IoDownloadOutline,
  IoRefreshOutline,
  IoEyeOutline,
  IoLocationOutline,
  IoHomeOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoAlertCircleOutline,
  IoArchiveOutline,
  IoEllipsisVerticalOutline,
  IoMapOutline,
  IoBuildOutline,
  IoLockClosedOutline,
  IoEyeOffOutline,
  IoAddCircleOutline,
} from "react-icons/io5";
import { TbHomeEdit } from "react-icons/tb";
import { BsFiletypeCsv, BsFiletypePdf, BsBuilding } from "react-icons/bs";
import { MdOutlineVilla, MdOutlineApartment } from "react-icons/md";
import { PiHouseLine } from "react-icons/pi";
import { FiChevronDown } from "react-icons/fi";

import { useAdminProperties } from "./hooks/useAdminProperties";

// Shadow tokens
const block3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)]";
const card3d =
  "shadow-[0_2px_0_0_rgba(0,0,0,0.03),0_4px_12px_-4px_rgba(0,0,0,0.05)]";

// Status config
const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    dot: string;
    text: string;
    bg: string;
    icon: React.ReactNode;
  }
> = {
  ACTIVE: {
    label: "Active",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    icon: <IoCheckmarkCircleOutline />,
  },
  INACTIVE: {
    label: "Inactive",
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
    icon: <IoEyeOffOutline />,
  },
  DRAFT: {
    label: "Brouillon",
    dot: "bg-slate-400",
    text: "text-slate-600",
    bg: "bg-slate-100",
    icon: <IoEyeOffOutline />,
  },
  ARCHIVED: {
    label: "Archivé",
    dot: "bg-purple-500",
    text: "text-purple-700",
    bg: "bg-purple-50",
    icon: <IoArchiveOutline />,
  },
  PENDING_REVIEW: {
    label: "En attente",
    dot: "bg-sky-500",
    text: "text-sky-700",
    bg: "bg-sky-50",
    icon: <IoTimeOutline />,
  },
  SUSPENDED: {
    label: "Suspendu",
    dot: "bg-red-500",
    text: "text-red-700",
    bg: "bg-red-50",
    icon: <IoLockClosedOutline />,
  },
};

// Type config
const TYPE_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  APARTMENT: {
    label: "Appartement",
    bg: "bg-blue-50",
    text: "text-blue-700",
    icon: <MdOutlineApartment />,
  },
  VILLA: {
    label: "Villa",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: <MdOutlineVilla />,
  },
  STUDIO: {
    label: "Studio",
    bg: "bg-purple-50",
    text: "text-purple-700",
    icon: <BsBuilding />,
  },
  DUPLEX: {
    label: "Duplex",
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: <IoBuildOutline />,
  },
  HOUSE: {
    label: "Maison",
    bg: "bg-slate-100",
    text: "text-slate-700",
    icon: <PiHouseLine />,
  },
  ROOM: {
    label: "Chambre",
    bg: "bg-pink-50",
    text: "text-pink-700",
    icon: <IoHomeOutline />,
  },
};

// StatusBadge Component
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      <span className={`text-xs font-bold flex items-center gap-1 ${cfg.text}`}>
        {cfg.icon}
        {cfg.label}
      </span>
    </div>
  );
}

// TypeBadge Component
function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.APARTMENT;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${cfg.bg} ${cfg.text}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// OwnerAvatar Component
function OwnerAvatar({ owner }: { owner: any }) {
  const [err, setErr] = React.useState(false);
  const pip = (url: string) =>
    `/api/listings/image?url=${encodeURIComponent(url)}`;
  const initials =
    `${owner?.firstName?.[0] ?? ""}${owner?.lastName?.[0] ?? ""}`.toUpperCase() ||
    "?";
  const name =
    owner?.firstName && owner?.lastName
      ? `${owner.firstName} ${owner.lastName}`
      : (owner?.email?.split("@")[0] ?? "Propriétaire");

  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center overflow-hidden ring-2 ring-indigo-500/10 flex-shrink-0">
        {owner?.profilePictureUrl && !err ? (
          <img
            src={pip(owner.profilePictureUrl)}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setErr(true)}
          />
        ) : (
          <span className="text-xs font-bold text-indigo-600">{initials}</span>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700 leading-none">
          {name}
        </p>
        {owner?.email && (
          <p className="text-[10px] text-slate-400 truncate max-w-[120px] mt-0.5">
            {owner.email}
          </p>
        )}
      </div>
    </div>
  );
}

// ActionMenu Component
function ActionMenu({ listing, position, onClose, onAction }: any) {
  const actions = [
    {
      label: "Voir l'annonce",
      icon: <IoEyeOutline />,
      color: "hover:text-indigo-600 hover:bg-indigo-50",
      fn: () => {
        window.open(`/fr/listings/${listing.id}`, "_blank");
        onClose();
      },
    },
    {
      label: "Modifier",
      icon: <TbHomeEdit />,
      color: "hover:text-amber-600 hover:bg-amber-50",
      fn: () => {
        window.location.href = `/fr/dashboard/owner/listings/${listing.id}/edit`;
        onClose();
      },
    },
    ...(listing.status === "ACTIVE"
      ? [
          {
            label: "Désactiver",
            icon: <IoEyeOffOutline />,
            color: "hover:text-amber-600 hover:bg-amber-50",
            fn: () => {
              onAction("deactivate", listing.id);
              onClose();
            },
          },
        ]
      : []),
    ...(listing.status === "INACTIVE" || listing.status === "DRAFT"
      ? [
          {
            label: "Activer",
            icon: <IoCheckmarkCircleOutline />,
            color: "hover:text-emerald-600 hover:bg-emerald-50",
            fn: () => {
              onAction("activate", listing.id);
              onClose();
            },
          },
        ]
      : []),
    {
      label: "Archiver",
      icon: <IoArchiveOutline />,
      color: "hover:text-purple-600 hover:bg-purple-50",
      fn: () => {
        onAction("archive", listing.id);
        onClose();
      },
    },
    {
      label: "Supprimer",
      icon: <IoTrashOutline />,
      color: "hover:text-red-600 hover:bg-red-50 border-t border-slate-100",
      fn: () => {
        if (confirm("Confirmer la suppression ?")) {
          onAction("delete", listing.id);
        }
        onClose();
      },
    },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className={`fixed z-50 w-52 rounded-2xl bg-white border border-indigo-100 overflow-hidden ${block3d}`}
        style={{ top: position.top, left: position.left }}
      >
        <div className="py-1">
          {actions.map(({ label, icon, color, fn }) => (
            <button
              key={label}
              onClick={fn}
              className={`w-full text-left px-4 py-2.5 text-sm text-slate-700 flex items-center gap-2.5 transition-colors ${color}`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// Main UI Component
export default function AdminPropertiesPage() {
  const {
    listings,
    loading,
    searchQuery,
    statusFilter,
    typeFilter,
    currentPage,
    totalPages,
    totalCount,
    showFilters,
    showExport,
    alert,
    menuState,
    mapCenter,
    priceMin,
    priceMax,
    governorate,
    stats,
    mapListings,
    PAGE_SIZE,
    setSearchQuery,
    setStatusFilter,
    setTypeFilter,
    setCurrentPage,
    setShowFilters,
    setShowExport,
    setMenuState,
    setAlert,
    setPriceMin,
    setPriceMax,
    setGovernorate,
    fetchListings,
    handleAction,
    handleExport,
    getMainImage,
    resetFilters,
  } = useAdminProperties();

  const showPagination = totalPages > 1 && totalCount > 0;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6 bg-white">
      {alert && (
        <div className="fixed top-5 right-5 z-[60] w-full max-w-sm">
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Gestion des Propriétés
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Contrôlez et modérez l'inventaire immobilier de NestHub.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchListings}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all text-sm font-medium"
          >
            <IoRefreshOutline className="text-base" />
            Actualiser
          </button>
          <div className="relative">
            <button
              onClick={() => setShowExport(!showExport)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold shadow-sm transition-all"
            >
              <IoDownloadOutline className="text-base" />
              Exporter
              <FiChevronDown className="text-xs" />
            </button>
            {showExport && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowExport(false)}
                />
                <div
                  className={`absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-indigo-100 z-50 overflow-hidden ${block3d}`}
                >
                  {[
                    {
                      fmt: "csv",
                      icon: (
                        <BsFiletypeCsv className="text-emerald-500 text-lg" />
                      ),
                      title: "Exporter en CSV",
                      desc: "Format tableur",
                    },
                    {
                      fmt: "pdf",
                      icon: <BsFiletypePdf className="text-red-500 text-lg" />,
                      title: "Exporter en PDF",
                      desc: "Format document",
                    },
                  ].map(({ fmt, icon, title, desc }) => (
                    <button
                      key={fmt}
                      onClick={() => handleExport(fmt as "csv" | "pdf")}
                      className="w-full text-left px-4 py-3 hover:bg-indigo-50 flex items-center gap-3 transition-colors border-b border-indigo-50 last:border-b-0"
                    >
                      {icon}
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {title}
                        </p>
                        <p className="text-xs text-slate-400">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Total Listings",
            value: stats.total,
            icon: <IoHomeOutline className="text-white text-xl" />,
            grad: "from-indigo-500 to-blue-600",
            text: "text-indigo-600",
            sub: "+12% ce mois",
          },
          {
            title: "Actives",
            value: stats.active,
            icon: <IoCheckmarkCircleOutline className="text-white text-xl" />,
            grad: "from-emerald-400 to-teal-500",
            text: "text-emerald-600",
            sub: "En ligne",
            dot: true,
          },
          {
            title: "En attente",
            value: stats.pending,
            icon: <IoTimeOutline className="text-white text-xl" />,
            grad: "from-amber-400 to-orange-500",
            text: "text-amber-600",
            sub: "À valider",
          },
          {
            title: "Inactives",
            value: stats.inactive + stats.draft,
            icon: <IoEyeOffOutline className="text-white text-xl" />,
            grad: "from-violet-500 to-purple-600",
            text: "text-violet-600",
            sub: "Non publiées",
          },
        ].map(({ title, value, icon, grad, text, sub, dot }) => (
          <div
            key={title}
            className={`bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 ${card3d}`}
          >
            <div
              className={`w-11 h-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm flex-shrink-0`}
            >
              {icon}
            </div>
            <div>
              <p className={`text-2xl font-black leading-none ${text}`}>
                {value}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 font-medium leading-tight">
                {title}
              </p>
              <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-slate-500">
                {dot && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
                {sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main table */}
      <div
        className={`flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden ${block3d}`}
      >
        {/* Filters bar */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-slate-100 bg-slate-50/40">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Rechercher une propriété..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 text-slate-700"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DRAFT">Brouillon</option>
              <option value="PENDING_REVIEW">En attente</option>
              <option value="ARCHIVED">Archivé</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 text-slate-700"
            >
              <option value="ALL">Tous les types</option>
              <option value="APARTMENT">Appartement</option>
              <option value="VILLA">Villa</option>
              <option value="STUDIO">Studio</option>
              <option value="DUPLEX">Duplex</option>
              <option value="HOUSE">Maison</option>
              <option value="ROOM">Chambre</option>
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${showFilters ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-200 text-indigo-500 hover:border-indigo-400"}`}
            >
              <IoFilterOutline className="text-sm" />
              Filtres avancés
            </button>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-indigo-600"
            >
              <IoCloseOutline className="text-sm" />
              Réinitialiser
            </button>
            <p className="ml-auto text-xs font-medium text-slate-400 whitespace-nowrap">
              {totalCount} propriété{totalCount > 1 ? "s" : ""}
            </p>
          </div>
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-indigo-600 mb-1.5">
                  Prix min (TND/nuit)
                </label>
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="ex: 50"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-indigo-600 mb-1.5">
                  Prix max (TND/nuit)
                </label>
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="ex: 500"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-indigo-600 mb-1.5">
                  Gouvernorat
                </label>
                <input
                  type="text"
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  placeholder="ex: Tunis, Sousse..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <LoadingSpinner />
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-300">
              <IoHomeOutline className="text-5xl" />
              <p className="text-sm text-slate-500">Aucune propriété trouvée</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 border-b border-slate-100">
                  {[
                    "Propriété",
                    "Propriétaire",
                    "Type",
                    "Prix",
                    "Statut",
                    "Date",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {listings.map((listing) => {
                  const imageUrl = getMainImage(listing);
                  const price = listing.pricePerNight ?? listing.pricePerMonth;
                  const priceUnit = listing.pricePerNight ? "/nuit" : "/mois";
                  return (
                    <tr
                      key={listing.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={listing.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <IoHomeOutline className="text-slate-400 text-lg" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 leading-tight line-clamp-1 max-w-[180px]">
                              {listing.title}
                            </p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <IoLocationOutline className="text-xs" />
                              {listing.governorate}, {listing.delegation}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <OwnerAvatar owner={listing.owner} />
                      </td>
                      <td className="px-4 py-3.5">
                        <TypeBadge type={listing.type} />
                      </td>
                      <td className="px-4 py-3.5">
                        {price ? (
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {price.toLocaleString("fr-FR")} TND
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {priceUnit}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={listing.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-medium text-slate-500">
                          {new Date(listing.createdAt).toLocaleDateString(
                            "fr-FR",
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/fr/listings/${listing.id}`}
                            target="_blank"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <IoEyeOutline className="text-base" />
                          </Link>
                          <Link
                            href={`/fr/dashboard/owner/listings/${listing.id}/edit`}
                            className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <TbHomeEdit className="text-base" />
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              setMenuState({
                                listing,
                                position: {
                                  top: rect.bottom + window.scrollY + 5,
                                  left: rect.left + window.scrollX - 160,
                                },
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                          >
                            <IoEllipsisVerticalOutline className="text-base" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {showPagination && (
          <div className="flex-shrink-0 border-t border-slate-100">
            <Pagination
              currentPage={Math.max(1, currentPage)}
              totalPages={Math.max(1, totalPages)}
              totalItems={Math.max(0, totalCount)}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Map + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className={`lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 ${card3d}`}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <IoMapOutline className="text-indigo-500" />
              Distribution géographique
            </h3>
            <span className="text-xs text-slate-400">
              {mapListings.length} propriété
              {mapListings.length !== 1 ? "s" : ""} géolocalisée
              {mapListings.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="h-80 rounded-xl overflow-hidden">
            {mapListings.length > 0 ? (
              <MapPickerWrapper
                latitude={mapCenter.lat}
                longitude={mapCenter.lng}
                onLocationChange={() => {}}
                readOnly
                markers={mapListings.map((l) => ({
                  id: l.id,
                  title: l.title,
                  latitude: l.latitude,
                  longitude: l.longitude,
                  status: l.status,
                  price: l.pricePerNight ?? l.pricePerMonth ?? undefined,
                }))}
                showAllMarkers
                onMarkerClick={(id) =>
                  (window.location.href = `/fr/listings/${id}`)
                }
              />
            ) : (
              <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200">
                <IoMapOutline className="text-slate-300 text-4xl" />
                <p className="text-sm text-slate-400">
                  Aucune propriété géolocalisée
                </p>
              </div>
            )}
          </div>
          {mapListings.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {mapListings.slice(0, 6).map((l) => (
                <button
                  key={l.id}
                  onClick={() => window.open(`/fr/listings/${l.id}`, "_blank")}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-full text-xs hover:bg-indigo-100 transition-colors"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[l.status]?.dot || "bg-slate-400"}`}
                  />
                  <span className="truncate max-w-[110px] text-slate-600">
                    {l.title}
                  </span>
                </button>
              ))}
              {mapListings.length > 6 && (
                <span className="px-2.5 py-1 bg-slate-100 rounded-full text-xs text-slate-400">
                  +{mapListings.length - 6} autres
                </span>
              )}
            </div>
          )}
        </div>

        <div
          className={`bg-white rounded-2xl p-6 border border-slate-200 ${card3d}`}
        >
          <h3 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
            <IoAlertCircleOutline className="text-indigo-500" />
            Alertes Récentes
          </h3>
          <div className="space-y-3">
            {[
              {
                icon: <IoAlertCircleOutline className="text-rose-600" />,
                bg: "bg-rose-100",
                title: "Signalement: Fraude",
                desc: "Propriété signalée pour photos mensongères.",
                time: "Il y a 2 heures",
              },
              {
                icon: <IoCheckmarkCircleOutline className="text-emerald-600" />,
                bg: "bg-emerald-100",
                title: "Propriété Vérifiée",
                desc: "Un nouveau bien a été validé avec succès.",
                time: "Il y a 5 heures",
              },
              {
                icon: <IoAddCircleOutline className="text-blue-600" />,
                bg: "bg-blue-100",
                title: "Nouveau Listing",
                desc: "Un propriétaire a ajouté un nouveau bien.",
                time: "Hier, 18:30",
              },
            ].map(({ icon, bg, title, desc, time }) => (
              <div
                key={title}
                className="flex gap-3 p-3 bg-slate-50 rounded-xl"
              >
                <div
                  className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center flex-shrink-0 text-base`}
                >
                  {icon}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-none mb-0.5">
                    {title}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {desc}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">{time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2.5 border border-slate-200 text-indigo-500 text-xs font-bold rounded-xl hover:bg-indigo-50 transition-colors">
            Voir toutes les alertes
          </button>
        </div>
      </div>

      {menuState.listing && (
        <ActionMenu
          listing={menuState.listing}
          position={menuState.position}
          onClose={() =>
            setMenuState({ listing: null, position: { top: 0, left: 0 } })
          }
          onAction={handleAction}
        />
      )}
    </div>
  );
}
