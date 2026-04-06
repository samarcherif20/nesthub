// app/[locale]/(dashboard)/owner/listings/[id]/history/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Download, History,
  Tag, Image, Wrench, FileText,
  CheckCircle, EyeOff, AlertCircle, Archive,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useListingHistory, formatValue, getTimeKey, pip, ACTION_CONFIG, STATUS_LABELS } from "./hooks/useListingHistory";

function PriceDiff({ old: oldVal, next: newVal }: { old: any; next: any }) {
  const a = parseFloat(oldVal);
  const b = parseFloat(newVal);
  if (isNaN(a) || isNaN(b)) return null;
  const diff = b - a;
  const pct = Math.abs(Math.round((diff / a) * 100));
  if (diff === 0) return <span className="text-slate-400 text-xs">Inchangé</span>;
  if (diff > 0) return <span className="text-emerald-600 text-xs font-bold">+{diff.toLocaleString()} TND ({pct}%)</span>;
  return <span className="text-rose-600 text-xs font-bold">{diff.toLocaleString()} TND ({pct}%)</span>;
}

function StatusIcon({ status }: { status: string }) {
  const config = STATUS_LABELS[status];
  if (!config) return null;
  const icons: Record<string, React.ElementType> = {
    CheckCircle: CheckCircle,
    EyeOff: EyeOff,
    AlertCircle: AlertCircle,
    Archive: Archive,
  };
  const Icon = icons[config.icon as string] || CheckCircle;
  return <Icon size={14} className={config.color} />;
}

function getActionIcon(iconName: string) {
  const icons: Record<string, React.ElementType> = {
    Tag: Tag,
    Image: Image,
    Wrench: Wrench,
    FileText: FileText,
    CheckCircle: CheckCircle,
  };
  return icons[iconName] || FileText;
}

export default function ListingHistoryPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = React.use(params);
  
  const {
    loading,
    listingTitle,
    filterType,
    setFilterType,
    days,
    setDays,
    currentPage,
    setCurrentPage,
    totalPages,
    groupedHistory,
    filterOptions,
    periodOptions,
  } = useListingHistory(id);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner />
          <p className="text-sm text-slate-500">Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-white">
      <div className="w-full px-6 py-8">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href={`/${locale}/dashboard/owner/listings`} className="hover:text-indigo-600 transition-colors">
            Mes Annonces
          </Link>
          <ChevronRight size={14} />
          <Link href={`/${locale}/dashboard/owner/listings/${id}`} className="hover:text-indigo-600 transition-colors truncate max-w-[200px]">
            {listingTitle || "Annonce"}
          </Link>
          <ChevronRight size={14} />
          <span className="font-bold text-slate-900">Historique</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Historique des modifications
            </h1>
            <p className="text-slate-500 mt-2">
              Consultez l'évolution de votre annonce "{listingTitle}" et suivez les interventions de votre équipe.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-slate-100 px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-slate-200 transition-colors">
              <Download size={16} />
              Exporter (PDF)
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="md:col-span-2 bg-slate-50 p-6 rounded-2xl">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 block">Période</label>
            <div className="flex gap-2 flex-wrap">
              {periodOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setDays(opt.days)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    days === opt.days
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 bg-slate-50 p-6 rounded-2xl">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 block">Types de modifications</label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilterType(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-2 ${
                    filterType === opt.value
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${filterType === opt.value ? "bg-white" : opt.dotColor}`} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative pl-8 border-l-2 border-slate-200 ml-4 space-y-12">
          {Object.entries(groupedHistory).map(([dateKey, entries]) => (
            <div key={dateKey} className="relative">
              <div className="absolute -left-[41px] top-0 bg-white border-4 border-indigo-500 w-5 h-5 rounded-full z-10 shadow-sm"></div>
              
              <div className="mb-2">
                <span className="text-sm font-bold text-slate-600">{dateKey}</span>
              </div>
              
              {entries.map((entry, idx) => {
                const config = ACTION_CONFIG[entry.actionType] || ACTION_CONFIG.UPDATE;
                const Icon = getActionIcon(config.icon);
                const isPrice = entry.fieldName === "pricePerNight" || entry.fieldName === "pricePerMonth";
                const isStatus = entry.fieldName === "status";
                const isPhoto = entry.fieldName === "photos";
                
                return (
                  <div key={entry.id} className={`flex flex-col md:flex-row gap-6 ${idx > 0 ? 'mt-6' : ''}`}>
                    <div className="w-32 pt-1">
                      <p className="text-xs text-slate-400">{getTimeKey(entry.createdAt)}</p>
                    </div>
                    <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                            {entry.changedByUser.profilePictureUrl ? (
                              <img src={pip(entry.changedByUser.profilePictureUrl)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                                {entry.changedByUser.firstName?.[0] || "U"}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {entry.changedByUser.firstName} {entry.changedByUser.lastName || ""}
                            </p>
                            <p className="text-[10px] uppercase tracking-wider text-indigo-600 font-bold">
                              {entry.actionType === "PRICE_UPDATE" && "Propriétaire"}
                              {entry.actionType === "STATUS_CHANGE" && "Propriétaire"}
                              {entry.actionType === "PHOTO_UPDATE" && "Propriétaire"}
                              {entry.actionType === "EQUIPMENT_UPDATE" && "Co-propriétaire"}
                              {entry.actionType === "UPDATE" && "Modification"}
                            </p>
                          </div>
                        </div>
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.color}`}>
                          <Icon size={10} />
                          {config.label}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="space-y-4">
                        <h3 className="text-base font-bold text-slate-800">
                          {entry.fieldName === "pricePerNight" && "Mise à jour du tarif week-end"}
                          {entry.fieldName === "pricePerMonth" && "Mise à jour du prix mensuel"}
                          {entry.fieldName === "status" && "Changement de statut"}
                          {entry.fieldName === "photos" && "Mise à jour de la photo de couverture"}
                          {entry.fieldName === "equipment" && "Ajout de nouveaux équipements"}
                          {entry.fieldName === "description" && "Modification de la description"}
                          {entry.fieldName === "title" && "Modification du titre"}
                          {!entry.fieldName && "Modification générale"}
                        </h3>

                        {/* Value comparison */}
                        {(entry.oldValue !== null || entry.newValue !== null) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {entry.oldValue !== null && (
                              <div className={`rounded-xl p-4 ${isPhoto ? "relative aspect-video overflow-hidden grayscale opacity-60" : "bg-rose-50 border border-rose-100"}`}>
                                <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Ancienne valeur</p>
                                {isPhoto ? (
                                  <>
                                    <img src={pip(entry.oldValue)} alt="Ancienne photo" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                      <span className="text-white font-bold text-xs bg-red-600 px-2 py-1 rounded">SUPPRIMÉE</span>
                                    </div>
                                  </>
                                ) : isStatus && entry.oldValue ? (
                                  <div className="flex items-center gap-2">
                                    <StatusIcon status={entry.oldValue} />
                                    <span className="text-sm text-slate-500 line-through">{STATUS_LABELS[entry.oldValue]?.label || entry.oldValue}</span>
                                  </div>
                                ) : (
                                  <div className="text-sm text-rose-600 line-through break-all">
                                    {formatValue(entry.oldValue, entry.fieldName)}
                                  </div>
                                )}
                              </div>
                            )}

                            {entry.newValue !== null && (
                              <div className={`rounded-xl p-4 ${isPhoto ? "relative aspect-video overflow-hidden ring-4 ring-emerald-500/30" : "bg-emerald-50 border border-emerald-100"} ${entry.oldValue !== null ? "md:border-l md:border-slate-200 md:pl-4" : ""}`}>
                                <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Nouvelle valeur</p>
                                {isPhoto ? (
                                  <>
                                    <img src={pip(entry.newValue)} alt="Nouvelle photo" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                      <span className="text-white font-bold text-xs bg-emerald-600 px-2 py-1 rounded">NOUVELLE</span>
                                    </div>
                                  </>
                                ) : isStatus && entry.newValue ? (
                                  <div className="flex items-center gap-2">
                                    <StatusIcon status={entry.newValue} />
                                    <span className={`text-sm font-semibold ${STATUS_LABELS[entry.newValue]?.color}`}>
                                      {STATUS_LABELS[entry.newValue]?.label || entry.newValue}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="text-sm text-emerald-700 font-semibold break-all">
                                    {formatValue(entry.newValue, entry.fieldName)}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Price difference */}
                        {isPrice && entry.oldValue !== null && entry.newValue !== null && (
                          <div className="mt-2">
                            <PriceDiff old={entry.oldValue} next={entry.newValue} />
                          </div>
                        )}

                        {/* Equipment changes list */}
                        {entry.fieldName === "equipment" && entry.oldValue && entry.newValue && (
                          <div className="mt-2 space-y-2">
                            {Object.entries(entry.newValue).map(([key, val]) => {
                              const wasActive = entry.oldValue?.[key] === true;
                              const isActive = val === true;
                              if (wasActive !== isActive) {
                                return (
                                  <div key={key} className="flex items-center gap-2 text-sm">
                                    {isActive && <span className="text-emerald-600">✓ Ajouté :</span>}
                                    {!isActive && wasActive && <span className="text-rose-600">✗ Retiré :</span>}
                                    <span>{key}</span>
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {Object.keys(groupedHistory).length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <History size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucune modification</h3>
              <p className="text-slate-500 max-w-sm">
                Aucune modification n'a été enregistrée pour cette annonce.
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8 pt-4 border-t border-slate-100">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {(() => {
                const pages: (number | string)[] = [];
                const delta = 2;
                const range = [];
                const rangeWithDots = [];
                let l;

                for (let i = 1; i <= totalPages; i++) {
                  if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
                    range.push(i);
                  }
                }

                for (const i of range) {
                  if (l) {
                    if (i - l === 2) {
                      rangeWithDots.push(l + 1);
                    } else if (i - l !== 1) {
                      rangeWithDots.push('...');
                    }
                  }
                  rangeWithDots.push(i);
                  l = i;
                }
                return rangeWithDots.map((page, idx) => (
                  page === '...' ? (
                    <span key={`dots-${idx}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm">…</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page as number)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {page}
                    </button>
                  )
                ));
              })()}
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}