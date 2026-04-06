// app/[locale]/(dashboard)/owner/listings/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import * as React from "react";
import Link from "next/link";
import {
  Home, Building2, Hotel, Layers, TrendingUp, Eye, Edit, Trash2,
  Search, CheckCircle, AlertCircle, Archive, BarChart3, RefreshCw,
  X, Users, MapPin, Star, MoreVertical, EyeOff, Rocket, FileWarning,
  Calendar, Sparkles, TrendingDown, Shield, Zap, Award,
  CreditCard, ExternalLink, QrCode, Filter, Grid3X3, List, History,
} from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import DeleteListingModal from "@/components/ui/modals/DeleteListingModal";
import QRCodeModal from "@/components/ui/modals/QRCodeModal";
import AlertBanner from "@/components/ui/Alert";
import { BsHouseAdd } from "react-icons/bs";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { PriceRangeSlider } from "@/components/ui/PriceRangeSlider";
import { useListings } from "./hooks/useListings";

// ── constants ────────────────────────────────────────────────────────────────
const pip = (url: string) => `/api/listings/image?url=${encodeURIComponent(url)}`;
const PAGE_SIZE = 6;

const STATUS_CONFIG = {
  ACTIVE: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20", icon: CheckCircle, label: "Publiée" },
  INACTIVE: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20", icon: EyeOff, label: "Masquée" },
  DRAFT: { color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800", border: "border-slate-200 dark:border-slate-700", icon: AlertCircle, label: "Brouillon" },
  ARCHIVED: { color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10", border: "border-purple-200 dark:border-purple-500/20", icon: Archive, label: "Archivée" },
} as const;

const TYPE_ICONS: Record<string, React.ElementType> = {
  APARTMENT: Building2, VILLA: Home, STUDIO: Hotel, DUPLEX: Layers, HOUSE: Home,
};

const getAIInsight = (listing: any) => {
  const conversionRate = listing.viewCount > 0 ? ((listing.bookingCount / listing.viewCount) * 100).toFixed(1) : "0";
  switch (listing.status) {
    case "DRAFT": return { message: "Brouillon - Complétez et publiez", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: AlertCircle };
    case "ARCHIVED": return { message: "Archivée - Restaurez pour réactiver", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", icon: Archive };
    case "INACTIVE": return { message: "Masquée - Publiez pour être visible", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: EyeOff };
    case "ACTIVE":
      if (listing.viewCount < 30) return { message: "Plus de photos = +20% de vues", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: TrendingUp };
      if (listing.bookingCount === 0) return { message: "Vérifiez votre prix par rapport au marché", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200", icon: Zap };
      if (parseFloat(conversionRate) < 2) return { message: `Conversion ${conversionRate}% - Améliorez votre annonce`, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", icon: TrendingDown };
      return { message: "Excellente performance ! Continuez ainsi", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: Award };
    default: return { message: "Optimisez votre annonce", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", icon: Sparkles };
  }
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DRAFT;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.color} ${cfg.bg} ${cfg.border} border`}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

export default function OwnerListingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = React.use(params);
  const {
    listings,
    loading,
    statsLoading,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    totalCount,
    tabCounts,
    globalStats,
    filters,
    setFilters,
    priceRange,
    actionLoading,
    alert,
    setAlert,
    updateStatus,
    handleDelete,
    resetFilters,
    refreshData,
  } = useListings(PAGE_SIZE);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTitle, setDeleteTitle] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [qrCodeListing, setQrCodeListing] = useState<{ id: string; title: string } | null>(null);
  const [cancelBookings, setCancelBookings] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Gestion du clic en dehors du menu
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuId(null);
      }
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuId(null);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  const governorates = ['Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan', 'Bizerte', 'Béja', 'Jendouba', 'Le Kef', 'Siliana', 'Kairouan', 'Kasserine', 'Sidi Bouzid', 'Sousse', 'Monastir', 'Mahdia', 'Sfax', 'Gafsa', 'Tozeur', 'Kébili', 'Gabès', 'Médenine', 'Tataouine'];

  const mainPhoto = (l: any) => {
    const p = l.photos?.find((p: any) => p.isMain) ?? l.photos?.[0];
    return p?.url ? pip(p.url) : null;
  };

  const tabs = [
    { id: "all" as const, label: "Toutes", count: tabCounts.all, icon: Home },
    { id: "active" as const, label: "Publiées", count: tabCounts.active, icon: CheckCircle },
    { id: "inactive" as const, label: "Masquées", count: tabCounts.inactive, icon: EyeOff },
    { id: "draft" as const, label: "Brouillons", count: tabCounts.draft, icon: AlertCircle },
    { id: "archived" as const, label: "Archivées", count: tabCounts.archived, icon: Archive },
  ];

  return (
  <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6 bg-slight dark:bg-slate-950">
    {/* Alertes en position fixed top-right */}
    {alert && (
      <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-2 fade-in duration-300">
        <AlertBanner 
          type={alert.type} 
          message={alert.message} 
          onClose={() => setAlert(null)} 
        />
      </div> )}
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Portfolio Management</h2>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">Suivez la performance de vos biens et gérez vos annonces</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refreshData} className="p-2.5 rounded-xl border border-indigo-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-indigo-700 hover:text-indigo-600 transition-colors">
            <RefreshCw size={15} />
          </button>
          <Link href={`/${locale}/dashboard/owner/listings/create`} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-black dark:text-white rounded-xl font-semibold text-sm shadow-sm transition-all">
            <BsHouseAdd size={16} /> Ajouter un bien
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 animate-pulse"><div className="h-4 w-20 bg-slate-100 dark:bg-slate-700 rounded mb-3" /><div className="h-7 w-28 bg-slate-100 dark:bg-slate-700 rounded" /></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 p-4 relative shadow-sm">
            <div className="absolute top-3 right-3 text-emerald-500 text-[10px] font-bold">+{globalStats.revenueGrowth}%</div>
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center"><CreditCard size={18} className="text-indigo-600 dark:text-indigo-400" /></div><div><p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{globalStats.totalRevenue.toLocaleString("fr-FR")} TND</p><p className="text-[11px] text-slate-400 dark:text-slate-500">Revenu total</p></div></div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 p-4 relative shadow-sm">
            <div className="absolute top-3 right-3 text-slate-400 text-[10px] font-bold">Stable</div>
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"><Home size={18} className="text-emerald-600 dark:text-emerald-400" /></div><div><p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{globalStats.activeCount}</p><p className="text-[11px] text-slate-400 dark:text-slate-500">Annonces actives</p></div></div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-100 dark:border-amber-900/40 p-4 relative shadow-sm">
            <div className="absolute top-3 right-3 text-emerald-500 text-[10px] font-bold">+{globalStats.viewsGrowth}%</div>
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"><Eye size={18} className="text-amber-600 dark:text-amber-400" /></div><div><p className="text-xl font-black text-amber-600 dark:text-amber-400">{globalStats.totalViews.toLocaleString("fr-FR")}</p><p className="text-[11px] text-slate-400 dark:text-slate-500">Vues totales</p></div></div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-violet-100 dark:border-violet-900/40 p-4 relative shadow-sm">
            <div className="absolute top-3 right-3 text-emerald-500 text-[10px] font-bold">+{globalStats.occupancyGrowth}%</div>
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center"><Users size={18} className="text-violet-600 dark:text-violet-400" /></div><div><p className="text-xl font-black text-violet-600 dark:text-violet-400">{globalStats.occupancyRate}%</p><p className="text-[11px] text-slate-400 dark:text-slate-500">Taux d'occupation</p></div></div>
          </div>
        </div>
      )}

      {/* Layout avec Sidebar */}
      <div className="flex gap-6">
        {/* Sidebar Filtres */}
        <div className="w-72 flex-shrink-0 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden shadow-sm sticky top-6">
            <div className="px-4 py-3 border-b border-indigo-100 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/40 to-violet-50/20">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Filtres avancés</h3>
              </div>
            </div>
            <div className="p-4 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5">Gouvernorat</label>
                <select value={filters.governorate} onChange={e => setFilters(p => ({ ...p, governorate: e.target.value }))} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm">
                  <option value="">Tous</option>
                  {governorates.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5">Fourchette de prix (TND)</label>
                <PriceRangeSlider
                  minPrice={filters.minPrice}
                  maxPrice={filters.maxPrice}
                  onMinChange={(val) => setFilters(p => ({ ...p, minPrice: val }))}
                  onMaxChange={(val) => setFilters(p => ({ ...p, maxPrice: val }))}
                  minLimit={priceRange.min}
                  maxLimit={priceRange.max}
                  isLoading={statsLoading}
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5">Min chambres</label>
                <input type="number" placeholder="1" value={filters.minRooms} onChange={e => setFilters(p => ({ ...p, minRooms: e.target.value }))} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm" />
              </div>
              
              <button onClick={resetFilters} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors border border-slate-200 dark:border-indigo-800">
                <X size={14} /> Réinitialiser les filtres
              </button>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-sky-300 to-violet-500 dark:from-sky-900/20 dark:to-violet-900/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Sparkles size={12} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Conseil IA</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">Utilisez les filtres pour trouver rapidement vos annonces les plus performantes.</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Search bar et actions */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden shadow-sm mb-4">
            <div className="px-4 py-3 border-b border-indigo-100 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/40 to-violet-50/20">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 dark:text-indigo-500" />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher une annonce..." className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-indigo-300 dark:placeholder:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-slate-400 hover:text-indigo-400"}`}><Grid3X3 size={16} /></button>
                  <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-slate-400 hover:text-indigo-400"}`}><List size={16} /></button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 px-4 py-2 border-b border-indigo-100 dark:border-indigo-900/30 bg-white dark:bg-slate-800">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isActive ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"}`}>
                    <Icon size={12} /> {tab.label}
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"}`}>{tab.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Listings Content */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden shadow-sm">
            <div className="p-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3"><LoadingSpinner /><p className="text-sm text-slate-400 dark:text-slate-500">Chargement de vos annonces...</p></div>
              ) : listings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center"><Home size={48} className="text-slate-300 dark:text-slate-600 mb-4" /><h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Aucune annonce</h3><p className="text-slate-400 dark:text-slate-500 max-w-sm mb-6">Commencez par créer votre première annonce</p><Link href={`/${locale}/dashboard/owner/listings/create`} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm">Créer une annonce</Link></div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {listings.map(listing => {
                    const img = mainPhoto(listing);
                    const price = listing.pricePerNight ?? listing.pricePerMonth;
                    const unit = listing.pricePerNight ? "/nuit" : "/mois";
                    const TypeIcon = TYPE_ICONS[listing.type] ?? Building2;
                    const isLoading = actionLoading === listing.id;
                    const aiInsight = getAIInsight(listing);
                    const InsightIcon = aiInsight.icon;
                    const conversionRate = listing.viewCount > 0 ? ((listing.bookingCount / listing.viewCount) * 100).toFixed(1) : "0";

                    return (
                      <div key={listing.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all">
                        <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-700">
                          {img ? <img src={img} alt={listing.title} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center"><Home size={40} className="text-slate-300 dark:text-slate-500" /></div>}
                          {listing.status === "ACTIVE" && <div className="absolute top-3 left-3 flex items-center gap-1 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> En ligne</div>}
                          {isLoading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>}
                          <div className="absolute top-3 right-3"><StatusBadge status={listing.status} /></div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-1"><TypeIcon size={14} className="text-slate-400 dark:text-slate-500" /><h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm line-clamp-1">{listing.title}</h3></div>
                          <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 mb-3"><MapPin size={11} /> <span>{listing.governorate}</span></div>
                          <div className="grid grid-cols-4 gap-2 py-2 border-y border-slate-100 dark:border-slate-700 mb-3">
                            <div className="text-center"><Eye size={12} className="mx-auto text-slate-400 dark:text-slate-500 mb-0.5" /><span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{listing.viewCount?.toLocaleString() || 0}</span><p className="text-[9px] text-slate-400 dark:text-slate-500">Vues</p></div>
                            <div className="text-center"><Calendar size={12} className="mx-auto text-slate-400 dark:text-slate-500 mb-0.5" /><span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{listing.bookingCount || 0}</span><p className="text-[9px] text-slate-400 dark:text-slate-500">Rés.</p></div>
                            <div className="text-center"><Star size={12} className="mx-auto text-slate-400 dark:text-slate-500 mb-0.5" /><span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{listing.favoriteCount || 0}</span><p className="text-[9px] text-slate-400 dark:text-slate-500">Fav.</p></div>
                            <div className="text-center"><BarChart3 size={12} className="mx-auto text-slate-400 dark:text-slate-500 mb-0.5" /><span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{conversionRate}%</span><p className="text-[9px] text-slate-400 dark:text-slate-500">Conv.</p></div>
                          </div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            {price && <div><span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{price.toLocaleString()}</span><span className="text-xs text-slate-400 dark:text-slate-500"> TND {unit}</span></div>}
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[9px] ${aiInsight.color} ${aiInsight.bg} ${aiInsight.border} flex-1 min-w-0`}><InsightIcon size={9} className="shrink-0" /><span className="truncate">{aiInsight.message}</span></div>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-1">
                              <Link href={`/${locale}/dashboard/owner/listings/${listing.id}`} className="p-1.5 rounded text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"><Eye size={14} /></Link>
                              <Link href={`/${locale}/dashboard/owner/listings/${listing.id}/edit`} className="p-1.5 rounded text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"><Edit size={14} /></Link>
                              <button onClick={() => setQrCodeListing({ id: listing.id, title: listing.title })} className="p-1.5 rounded text-slate-400 dark:text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"><QrCode size={14} /></button>
                              <Link href={`/${locale}/dashboard/owner/listings/${listing.id}/history`} className="p-1.5 rounded text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"><History size={14} /></Link>
                            </div>
                            <div className="relative" ref={menuId === listing.id ? menuRef : null}>
                              <button onClick={() => setMenuId(menuId === listing.id ? null : listing.id)} className="p-1.5 rounded text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"><MoreVertical size={14} /></button>
                              {menuId === listing.id && (
                                <div className="absolute right-0 bottom-full mb-1 w-36 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg z-50 overflow-hidden">
                                  <div className="py-1">
                                    {listing.status === "ACTIVE" && <button onClick={() => updateStatus(listing.id, "INACTIVE", "Annonce masquée")} className="w-full text-left px-3 py-2 text-xs hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center gap-2"><EyeOff size={12} /> Masquer</button>}
                                    {(listing.status === "INACTIVE" || listing.status === "DRAFT") && <button onClick={() => updateStatus(listing.id, "ACTIVE", "Annonce publiée")} className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-2"><Rocket size={12} /> Publier</button>}
                                    {listing.status !== "ARCHIVED" && listing.status !== "DRAFT" && <button onClick={() => updateStatus(listing.id, "ARCHIVED", "Annonce archivée")} className="w-full text-left px-3 py-2 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-2 border-t"><Archive size={12} /> Archiver</button>}
                                    {listing.status === "ARCHIVED" && <button onClick={() => updateStatus(listing.id, "INACTIVE", "Annonce restaurée")} className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-2"><FileWarning size={12} /> Restaurer</button>}
                                    {listing.status === "ACTIVE" && <Link href={`/${locale}/listings/${listing.id}`} target="_blank" className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2 border-t"><ExternalLink size={12} /> Voir public</Link>}
                                    <button onClick={() => { setMenuId(null); setDeleteId(listing.id); setDeleteTitle(listing.title); }} className="w-full text-left px-3 py-2 text-xs hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2 border-t"><Trash2 size={12} /> Supprimer</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {listings.map(listing => {
                    const img = mainPhoto(listing);
                    const price = listing.pricePerNight ?? listing.pricePerMonth;
                    const unit = listing.pricePerNight ? "/nuit" : "/mois";
                    const TypeIcon = TYPE_ICONS[listing.type] ?? Building2;
                    const isLoading = actionLoading === listing.id;
                    const aiInsight = getAIInsight(listing);
                    const InsightIcon = aiInsight.icon;
                    const conversionRate = listing.viewCount > 0 ? ((listing.bookingCount / listing.viewCount) * 100).toFixed(1) : "0";

                    return (
                      <div key={listing.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors p-4 flex flex-col xl:flex-row xl:items-center gap-4">
                        <div className="relative shrink-0 w-full xl:w-40 h-28 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-100 dark:border-slate-700">
                          {img ? <img src={img} alt={listing.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center"><Home size={28} className="text-slate-300 dark:text-slate-500" /></div>}
                          {listing.status === "ACTIVE" && <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full">En ligne</div>}
                          {isLoading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2"><TypeIcon size={14} className="text-slate-400 dark:text-slate-500" /><h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{listing.title}</h3></div>
                            <StatusBadge status={listing.status} />
                          </div>
                          <p className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 mb-3"><MapPin size={11} /> {listing.governorate}{listing.delegation ? `, ${listing.delegation}` : ""}</p>
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-3">
                            <div className="flex flex-col"><span className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">Vues</span><div className="flex items-center gap-1 mt-0.5"><Eye size={11} className="text-slate-300 dark:text-slate-600" /><span className="text-sm font-bold text-slate-700 dark:text-slate-300">{listing.viewCount?.toLocaleString() || 0}</span></div></div>
                            <div className="flex flex-col"><span className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">Réservations</span><div className="flex items-center gap-1 mt-0.5"><Calendar size={11} className="text-slate-300 dark:text-slate-600" /><span className="text-sm font-bold text-slate-700 dark:text-slate-300">{listing.bookingCount || 0}</span></div></div>
                            <div className="flex flex-col"><span className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">Favoris</span><div className="flex items-center gap-1 mt-0.5"><Star size={11} className="text-slate-300 dark:text-slate-600" /><span className="text-sm font-bold text-slate-700 dark:text-slate-300">{listing.favoriteCount || 0}</span></div></div>
                            <div className="flex flex-col"><span className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">Conversion</span><div className="flex items-center gap-1 mt-0.5"><BarChart3 size={11} className="text-slate-300 dark:text-slate-600" /><span className="text-sm font-bold text-slate-700 dark:text-slate-300">{conversionRate}%</span></div></div>
                            {price && <div className="flex flex-col"><span className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">Prix</span><span className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">{price.toLocaleString()} TND <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{unit}</span></span></div>}
                          </div>
                          <div className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-[11px] ${aiInsight.color} ${aiInsight.bg} ${aiInsight.border}`}>
                            <InsightIcon size={14} className="shrink-0 mt-0.5" /><span className="leading-relaxed">{aiInsight.message}</span>
                          </div>
                        </div>
                        <div className="flex xl:flex-col gap-1.5 items-center xl:items-stretch shrink-0">
                          <Link href={`/${locale}/dashboard/owner/listings/${listing.id}`} className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"><Eye size={16} /></Link>
                          <Link href={`/${locale}/dashboard/owner/listings/${listing.id}/edit`} className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"><Edit size={16} /></Link>
                          <button onClick={() => setQrCodeListing({ id: listing.id, title: listing.title })} className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"><QrCode size={16} /></button>
                          <Link href={`/${locale}/dashboard/owner/listings/${listing.id}/history`} className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-blue-100 dark:hover:bg-blue-900/20"><History size={16} /></Link>
                          <div className="relative" ref={menuId === listing.id ? menuRef : null}>
                            <button onClick={() => setMenuId(menuId === listing.id ? null : listing.id)} className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"><MoreVertical size={16} /></button>
                            {menuId === listing.id && (
                              <div className="absolute right-0 xl:left-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden shadow-lg">
                                <div className="py-1">
                                  {listing.status === "ACTIVE" && <button onClick={() => updateStatus(listing.id, "INACTIVE", "Annonce masquée")} className="w-full text-left px-4 py-2 text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-700 dark:text-slate-300 hover:text-amber-600 flex items-center gap-2"><EyeOff size={14} /> Masquer</button>}
                                  {(listing.status === "INACTIVE" || listing.status === "DRAFT") && <button onClick={() => updateStatus(listing.id, "ACTIVE", "Annonce publiée")} className="w-full text-left px-4 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-700 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-2"><Rocket size={14} /> Publier</button>}
                                  {listing.status !== "ARCHIVED" && listing.status !== "DRAFT" && <button onClick={() => updateStatus(listing.id, "ARCHIVED", "Annonce archivée")} className="w-full text-left px-4 py-2 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 text-slate-700 dark:text-slate-300 hover:text-purple-600 flex items-center gap-2 border-t"><Archive size={14} /> Archiver</button>}
                                  {listing.status === "ARCHIVED" && <button onClick={() => updateStatus(listing.id, "INACTIVE", "Annonce restaurée")} className="w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-300 hover:text-indigo-600 flex items-center gap-2"><FileWarning size={14} /> Restaurer</button>}
                                  {listing.status === "ACTIVE" && <Link href={`/${locale}/listings/${listing.id}`} target="_blank" className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-slate-300 hover:text-blue-600 flex items-center gap-2 border-t"><ExternalLink size={14} /> Voir public</Link>}
                                  <button onClick={() => { setMenuId(null); setDeleteId(listing.id); setDeleteTitle(listing.title); }} className="w-full text-left px-4 py-2 text-sm hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-700 dark:text-slate-300 hover:text-rose-600 flex items-center gap-2 border-t"><Trash2 size={14} /> Supprimer</button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {/* Pagination */}
          {totalPages > 1 && !loading && (
            <div className="mt-4">
              <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalCount} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <DeleteListingModal
        isOpen={!!deleteId}
        onClose={() => {
          setDeleteId(null);
          setDeleteTitle("");
        }}
        onConfirm={(withCancelBookings) => {
          if (deleteId) {
            handleDelete(deleteId, withCancelBookings || false);
            setDeleteId(null);
            setDeleteTitle("");
          }
        }}
        isLoading={actionLoading !== null}
        listingTitle={deleteTitle}
        hasBookings={false}
        bookingsCount={0}
      />

      {qrCodeListing && (
        <QRCodeModal
          isOpen={!!qrCodeListing}
          onClose={() => setQrCodeListing(null)}
          listingId={qrCodeListing.id}
          listingTitle={qrCodeListing.title}
        />
      )}
    </div>
  );
}