// app/[locale]/(dashboard)/owner/disputes/page.tsx
"use client";
import React from "react";
import { useTranslations } from "next-intl";
import {
  Search,
  Loader2,
  Gavel,
  Home,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  HelpCircle,
  Eye,
  Calendar,
  Tag,
  FileText,
  X,
  ZoomIn,
  Download,
  FilterX,
  Paperclip,
  Shield,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import { TbListDetails } from "react-icons/tb";
import { TfiEmail } from "react-icons/tfi";
import { useDisputes } from "./hooks/useDisputes";
import { useRouter } from "next/navigation";

const block3d = "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";
const card3d = "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

// Helpers
const formatDate = (date: string) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date: string) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatRelative = (date: string) => {
  if (!date) return "";
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  return `Il y a ${diffDays} j`;
};

// Composant Toast
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-5 right-5 z-[60] w-full max-w-sm animate-in slide-in-from-top-2 fade-in duration-300">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border ${type === "success" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300" : "bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-300"}`}>
        {type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-auto hover:opacity-70"><X size={16} /></button>
      </div>
    </div>
  );
}

// Composant StatusBadge
function StatusBadge({ status, t }: { status: string; t: any }) {
  const config = {
    OPEN: { color: "text-white", bg: "bg-gradient-to-r from-red-500 to-rose-600", icon: AlertCircle, label: "open" },
    IN_REVIEW: { color: "text-white", bg: "bg-gradient-to-r from-amber-500 to-orange-500", icon: Clock, label: "inReview" },
    RESOLVED: { color: "text-white", bg: "bg-gradient-to-r from-emerald-500 to-emerald-600", icon: CheckCircle, label: "resolved" },
    CLOSED: { color: "text-white", bg: "bg-gradient-to-r from-slate-500 to-slate-600", icon: AlertCircle, label: "closed" },
  };
  const cfg = config[status as keyof typeof config] || config.OPEN;
  const Icon = cfg.icon;

  return (
    <div className="relative group">
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ${cfg.color} ${cfg.bg} shadow-md`}>
        <Icon size={12} /> {t(`status.${cfg.label}`)}
      </span>
      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 shadow-lg">
        {t(`status.${cfg.label}Desc`)}
      </div>
    </div>
  );
}

// Composant EvidenceModal avec navigation
function EvidenceModal({ urls, initialIndex, onClose }: { urls: string[]; initialIndex: number; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const currentUrl = urls[currentIndex];
  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(currentUrl);
  const total = urls.length;

  const goPrev = () => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  const goNext = () => setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : 0));

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10">
        <X size={24} />
      </button>
      {total > 1 && (
        <button onClick={(e) => { e.stopPropagation(); goPrev(); }} className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10">
          <ChevronLeft size={32} />
        </button>
      )}
      <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {isImage ? (
          <img src={currentUrl} alt={`Preuve ${currentIndex + 1}`} className="max-w-full max-h-[85vh] object-contain rounded-lg" />
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center min-w-[300px]">
            <FileText size={48} className="mx-auto text-indigo-500 mb-4" />
            <p className="text-slate-700 dark:text-slate-300 mb-4">Document PDF</p>
            <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <Download size={16} /> Ouvrir le PDF
            </a>
          </div>
        )}
      </div>
      {total > 1 && (
        <button onClick={(e) => { e.stopPropagation(); goNext(); }} className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10">
          <ChevronRight size={32} />
        </button>
      )}
      {total > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/50 text-white text-xs font-medium">
          {currentIndex + 1} / {total}
        </div>
      )}
    </div>
  );
}

// Composant StatsCards
function StatsCards({ stats, t }: { stats: { open: number; inReview: number; resolved: number; total: number }; t: any }) {
  const active = stats.open + stats.inReview;
  const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

  const cards = [
    { title: t("stats.openDisputes"), value: active, Icon: AlertCircle, grad: "from-red-500 to-rose-600", bg: "border-red-100 dark:border-red-900/40", cls: "text-red-600 dark:text-red-400", hint: `${stats.open} ouverts · ${stats.inReview} en examen`, trend: active > 0 ? `+${stats.open}` : "Stable" },
    { title: t("stats.inReview"), value: stats.inReview, Icon: Clock, grad: "from-amber-500 to-orange-500", bg: "border-amber-100 dark:border-amber-900/40", cls: "text-amber-600 dark:text-amber-400", hint: "En cours d'analyse", trend: "En attente" },
    { title: t("stats.resolved"), value: stats.resolved, Icon: CheckCircle, grad: "from-emerald-500 to-emerald-600", bg: "border-emerald-100 dark:border-emerald-900/40", cls: "text-emerald-600 dark:text-emerald-400", hint: `${resolutionRate}% de résolution`, trend: `${resolutionRate}%` },
// Remplacer la 4ème carte (avgResolution) par :
{ title: t("stats.avgResolution"), value: stats.avgResolutionDays || "0", unit: t("stats.days"), Icon: TrendingUp, grad: "from-indigo-500 to-violet-600", bg: "border-indigo-100 dark:border-indigo-900/40", cls: "text-indigo-600 dark:text-indigo-400", hint: `${stats.trend || 0}% vs mois dernier`, trend: `${stats.trend || 0}%` },  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map(({ title, value, unit, Icon, grad, bg, cls, hint, trend }) => (
        <div key={title} className={`group relative bg-white dark:bg-slate-900 rounded-2xl border ${bg} p-5 ${card3d} hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden`}>
          <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${grad} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
          <div className="relative flex items-start justify-between mb-4">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-lg`}>
              <Icon className="text-white" size={20} />
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls} bg-current/10`}>{trend}</span>
          </div>
          <div className="relative">
            <div className="flex items-baseline gap-1.5">
              <p className={`text-3xl font-black leading-none ${cls}`}>{value}</p>
              {unit && <p className={`text-sm font-semibold ${cls} opacity-70`}>{unit}</p>}
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">{title}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{hint}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Composant Filters
function Filters({ searchQuery, setSearchQuery, statusFilter, setStatusFilter, priorityFilter, setPriorityFilter, sort, setSort, onRefresh, activeFilters, onClear, refreshing, t }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-[0_6px_0_0_rgba(0,0,0,0.06)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38)] border border-indigo-100 dark:border-indigo-900/40">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2">
          <Search size={16} className="text-indigo-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t("filters.searchPlaceholder")} className="bg-transparent border-none focus:outline-none text-sm ml-2 w-full dark:text-white" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-sm cursor-pointer dark:text-white">
          <option value="all">{t("filters.allStatus")}</option>
          <option value="OPEN">{t("status.open")}</option>
          <option value="IN_REVIEW">{t("status.inReview")}</option>
          <option value="RESOLVED">{t("status.resolved")}</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-sm cursor-pointer dark:text-white">
          <option value="all">{t("filters.allPriority")}</option>
          <option value="HIGH">{t("priority.high")}</option>
          <option value="MEDIUM">{t("priority.medium")}</option>
          <option value="LOW">{t("priority.low")}</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-sm cursor-pointer dark:text-white">
          <option value="newest">{t("sort.newest")}</option>
          <option value="oldest">{t("sort.oldest")}</option>
          <option value="priority">{t("sort.priority")}</option>
        </select>
        <div className="flex items-center gap-2">
          {activeFilters > 0 && (
            <button onClick={onClear} className="p-2 rounded-xl text-slate-500 hover:text-red-500 transition-colors">
              <FilterX size={16} />
            </button>
          )}
          <button onClick={onRefresh} disabled={refreshing} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-all disabled:opacity-50">
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Composant DisputeCard
function DisputeCard({ dispute, selected, onClick, t }: { dispute: any; selected: boolean; onClick: () => void; t: any }) {
  const priorityColors = {
    HIGH: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/40",
    MEDIUM: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40",
    LOW: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40",
  };

  return (
    <button onClick={onClick} className={`group w-full text-left bg-white dark:bg-slate-900 rounded-2xl p-5 border-l-4 transition-all duration-300 ${card3d} hover:shadow-xl hover:-translate-y-0.5 ${selected && "ring-2 ring-indigo-500 -translate-y-0.5"} ${dispute.status === "OPEN" && "border-l-red-500"} ${dispute.status === "IN_REVIEW" && "border-l-amber-500"} ${dispute.status === "RESOLVED" && "border-l-emerald-500"} ${dispute.status === "CLOSED" && "border-l-slate-400"}`}>
      <div className="flex justify-between items-start mb-3 gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">#{dispute.reference?.slice(-8) || dispute.id.slice(-8)}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${priorityColors[dispute.priority]}`}>{t(`priority.${dispute.priority?.toLowerCase()}`)}</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{t(`types.${dispute.type?.toLowerCase() || "other"}`)}</h3>
        </div>
        <StatusBadge status={dispute.status} t={t} />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">{dispute.description}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
        <div className="flex items-center gap-1.5"><User size={12} /> {dispute.booking.tenant.username}</div>
        <div className="flex items-center gap-1.5"><Home size={12} /> {dispute.booking.listing.title}</div>
        <div className="flex items-center gap-1.5"><Calendar size={12} /> {formatDate(dispute.createdAt)}</div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-slate-400"><Clock size={11} /> {formatRelative(dispute.updatedAt)}</span>
          {dispute.evidence?.length > 0 && <span className="flex items-center gap-1 text-slate-400"><Paperclip size={11} /> {dispute.evidence.length}</span>}
        </div>
      </div>
    </button>
  );
}

// Page principale
export default function OwnerDisputesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = React.use(params);
  const t = useTranslations("OwnerDisputes");
  const router = useRouter();

  const {
    filteredDisputes,
    selectedDispute,
    loading,
    refreshing,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    sort,
    setSort,
    activeFilters,
    stats,
    handleSelectDispute,
    handleRefresh,
    handleClearFilters,
    handlePreview,
    previewData,
    setPreviewData,
    toast,
    setToast,
     avgResolutionDays,  
    trend,              
  } = useDisputes(t);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen gap-4">
        <LoadingSpinner />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium animate-pulse">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-x-hidden overflow-y-auto p-6 gap-6 ">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {previewData && <EvidenceModal urls={previewData.urls} initialIndex={previewData.index} onClose={() => setPreviewData(null)} />}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">{t("page.title")}</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl">{t("page.description")}</p>
        </div>
      </header>

      <StatsCards stats={{ ...stats, avgResolutionDays, trend }} t={t} />
      <Filters
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter} setPriorityFilter={setPriorityFilter}
        sort={sort} setSort={setSort}
        onRefresh={handleRefresh} activeFilters={activeFilters} onClear={handleClearFilters} refreshing={refreshing}
        t={t}
      />

      <section className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1 mb-1">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              {filteredDisputes.length} {filteredDisputes.length === 1 ? t("dispute") : t("disputes")}
            </p>
            {refreshing && (
              <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                <Loader2 size={12} className="animate-spin" /> {t("refreshing")}
              </div>
            )}
          </div>

          {filteredDisputes.length === 0 ? (
            <div className={`bg-white dark:bg-slate-900 rounded-2xl border-2 border-indigo-100/40 dark:border-indigo-800 ${card3d} p-12 flex flex-col items-center justify-center text-center min-h-[580px]`}>
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-sky-100 to-purple-100 dark:from-sky-950/50 dark:to-purple-950/50 flex items-center justify-center shadow-lg">
                  <Gavel size={48} className="text-sky-500 dark:text-sky-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-purple-600 dark:from-sky-400 dark:to-purple-400 bg-clip-text text-transparent mb-3">
                {activeFilters > 0 ? t("emptyState.noResults") : t("emptyState.title")}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                {activeFilters > 0 ? t("emptyState.tryDifferent") : t("emptyState.description")}
              </p>
              {activeFilters > 0 && (
                <button onClick={handleClearFilters} className="mt-4 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                  {t("filters.clearFilters")}
                </button>
              )}
              <Link href={`/${locale}/help`} className="mt-6 text-xs text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors flex items-center gap-1">
                <HelpCircle size={12} /> {t("emptyState.helpLink")}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDisputes.map((dispute) => (
                <DisputeCard
                  key={dispute.id}
                  dispute={dispute}
                  selected={dispute.id === selectedDispute?.id}
                  onClick={() => handleSelectDispute(dispute.id)}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-7">
          {selectedDispute ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 overflow-hidden sticky top-6 mt-4">
              <div className="p-5 border-b border-indigo-100 dark:border-indigo-800/50 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">{t("disputeId")} #{selectedDispute.reference?.slice(-8) || selectedDispute.id.slice(-8)}</span>
                    <h3 className="font-bold text-slate-900 dark:text-white mt-1">{t(`types.${selectedDispute.type?.toLowerCase() || "other"}`)}</h3>
                  </div>
                  <StatusBadge status={selectedDispute.status} t={t} />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 pt-2 border-t border-indigo-100 dark:border-indigo-800/50">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">{t("createdAt")}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">{formatDateTime(selectedDispute.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">{t("updatedAt")}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">{formatDateTime(selectedDispute.updatedAt)}</p>
                  </div>
                  {selectedDispute.resolvedAt && (
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider">{t("resolvedAt")}</p>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">{formatDateTime(selectedDispute.resolvedAt)}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 border-b border-indigo-100 dark:border-indigo-800/50">
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">{t("bookingInfo")}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <User size={14} className="text-slate-400" /> 
                    <span className="font-medium text-slate-900 dark:text-white">{selectedDispute.booking?.tenant?.username}</span>
                    <span className="text-slate-400">(@{selectedDispute.booking?.tenant?.username})</span>
                  </div>
                  {selectedDispute.booking?.tenant?.email && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <TfiEmail /> {selectedDispute.booking.tenant.email}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Home size={14} className="text-slate-400" /> {selectedDispute.booking?.listing?.title}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Calendar size={14} className="text-slate-400" /> {formatDate(selectedDispute.booking?.checkIn)} → {formatDate(selectedDispute.booking?.checkOut)}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Tag size={14} className="text-slate-400" /> 
                    <span className="font-medium">{selectedDispute.booking?.totalPrice?.toLocaleString()} TND</span>
                  </div>
                </div>
              </div>

              <div className="p-5 border-b border-indigo-100 dark:border-indigo-800/50">
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">{t("description")}</p>
                <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">{selectedDispute.description}</p>
                </div>
              </div>

              {selectedDispute.evidence && selectedDispute.evidence.length > 0 && (
                <div className="p-5 border-b border-indigo-100 dark:border-indigo-800/50">
                  <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">{t("evidence")}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedDispute.evidence.map((url, idx) => {
                      const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);
                      return (
                        <button
                          key={idx}
                          onClick={() => handlePreview(selectedDispute.evidence, idx)}
                          className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-indigo-100 dark:border-indigo-800 hover:border-indigo-500 transition-all"
                        >
                          {isImage ? (
                            <img src={url} alt={`Preuve ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                              <FileText size={28} className="text-indigo-500" />
                              <span className="text-[10px] text-slate-500">{t("document")} {idx + 1}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/50 text-white text-[9px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="p-5">
                <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 p-5 text-center border border-indigo-100 dark:border-indigo-800/50">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-3">
                    <Shield size={20} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t("ownerInfo")}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t("adminHandles")}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-indigo-100/20 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 p-12 text-center min-h-[580px] flex flex-col items-center justify-center mt-5.5">
              <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4">
                <TbListDetails size={32} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">{t("selectDispute")}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">{t("selectDisputeDescription")}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}