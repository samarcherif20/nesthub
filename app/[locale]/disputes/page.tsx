// app/[locale]/disputes/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  IoChevronForwardOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoHomeOutline,
  IoShieldCheckmarkOutline,
  IoTimeOutline,
  IoWalletOutline,
  IoScaleOutline,
  IoAddOutline,
  IoCheckmarkCircleOutline,
  IoHourglassOutline,
  IoCloseCircleOutline,
  IoDocumentTextOutline,
  IoHeadsetOutline,
  IoChatbubblesOutline,
  IoEyeOutline,
  IoTrophyOutline,
  IoFlashOutline,
  IoDiamondOutline,
  IoSearchOutline,
} from "react-icons/io5";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { TenantHeader } from "@/components/ui/header/TenantHeader";

const GRADIENT_BUTTON = `
  bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 
  hover:from-sky-600 hover:via-indigo-600 hover:to-purple-700
  text-white shadow-md hover:shadow-lg 
  transition-all duration-300
`;

const GRADIENT_TEXT = "bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent";

const pipListingImage = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

// ============================================
// DISPUTE TYPES LABELS
// ============================================
const TYPE_LABELS: Record<string, string> = {
  DAMAGE: "Dommages matériels",
  CLEANING: "Propreté",
  MISREPRESENTATION: "Non conforme",
  NOISE: "Bruit",
  PAYMENT: "Paiement",
  CANCELLATION: "Annulation",
  OTHER: "Autre",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  OPEN: { label: "En attente", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: IoHourglassOutline },
  IN_REVIEW: { label: "En examen", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", icon: IoTimeOutline },
  RESOLVED: { label: "Résolu", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: IoCheckmarkCircleOutline },
  REJECTED: { label: "Rejeté", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", icon: IoCloseCircleOutline },
};

// ============================================
// UTILS
// ============================================
function fmtShort(d: string) { return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }); }
function fmtPrice(n: number) { return n.toLocaleString("fr-FR"); }
function daysAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Hier";
  return `Il y a ${diff}j`;
}

// ============================================
// GLASS CARD
// ============================================
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  
  return (
    <div className={`relative ${className}`}>
      <div className={`absolute -inset-1 rounded-[28px] blur-lg ${isDark ? "bg-gradient-to-r from-indigo-500/5 via-violet-500/5 to-purple-500/5" : "bg-gradient-to-r from-indigo-200/20 via-violet-200/20 to-purple-200/20"}`} />
      <div className={`relative backdrop-blur-xl border rounded-[24px] overflow-hidden ${isDark ? "bg-white/[0.03] border-white/[0.06]" : "bg-white/70 border-white/50 shadow-lg shadow-slate-200/50"}`}>
        <div className={`h-px bg-gradient-to-r from-transparent to-transparent ${isDark ? "via-white/[0.06]" : "via-indigo-500/20"}`} />
        {children}
      </div>
    </div>
  );
}

// ============================================
// STAT CARD
// ============================================
function StatCard({ label, value, icon, iconBg, delay }: { label: string; value: number; icon: React.ReactNode; iconBg: string; delay: number }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [current, setCurrent] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setCurrent(value), delay * 1000);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      whileHover={{ y: -2, scale: 1.02 }}
      className={`p-4 rounded-2xl border transition-all cursor-default ${isDark ? "bg-white/[0.02] border-white/[0.05]" : "bg-white/70 border-white/50 shadow-sm"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center text-sm`}>{icon}</div>
        <span className={`text-2xl font-black ${isDark ? "text-white/70" : "text-slate-700"}`}>{current}</span>
      </div>
      <p className={`text-[10px] font-extrabold uppercase tracking-[0.15em] ${isDark ? "text-white/25" : "text-slate-500"}`}>{label}</p>
      <div className="mt-2">
        <div className="w-full h-1 rounded-full bg-slate-200 dark:bg-white/[0.04] overflow-hidden">
          <motion.div className={`h-full rounded-full ${iconBg.includes("amber") ? "bg-amber-500/40" : iconBg.includes("sky") ? "bg-sky-500/40" : iconBg.includes("emerald") ? "bg-emerald-500/40" : "bg-rose-500/40"}`}
            initial={{ width: "0%" }}
            animate={{ width: `${value > 0 ? 100 : 0}%` }}
            transition={{ delay: delay + 0.2, duration: 0.8, ease: "easeOut" }} />
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// DISPUTE CARD
// ============================================
function DisputeCard({ dispute, delay = 0 }: { dispute: any; delay?: number }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const params = useParams();
  const locale = params.locale as string;
  const status = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.OPEN;
  const StatusIcon = status.icon;
  const isActive = dispute.status === "OPEN" || dispute.status === "IN_REVIEW";
  const [imgError, setImgError] = useState(false);

  return (
    <Link href={`/${locale}/disputes/${dispute.id}`}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
        whileHover={{ y: -3, scale: 1.003 }}
        className="group cursor-pointer">
        <div className={`relative ${!isActive ? "opacity-55 hover:opacity-75" : ""} transition-all`}>
          <div className={`absolute -inset-1 rounded-[24px] blur-lg bg-gradient-to-r from-white/[0.02] via-white/[0.03] to-white/[0.02]`} />
          <div className={`relative backdrop-blur-xl border rounded-[24px] overflow-hidden hover:border-white/[0.1] transition-all ${isDark ? "bg-white/[0.03] border-white/[0.06]" : "bg-white/70 border-white/50 shadow-sm"}`}>
            <div className={`h-0.5 ${
              dispute.status === "OPEN" ? "bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" :
              dispute.status === "IN_REVIEW" ? "bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" :
              dispute.status === "RESOLVED" ? "bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" :
              "bg-gradient-to-r from-transparent via-rose-500/30 to-transparent"
            }`} />

            <div className="p-5">
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-white/[0.06] relative bg-slate-100 dark:bg-slate-800">
                  {dispute.booking.listing.images?.[0] && !imgError ? (
                    <img src={pipListingImage(dispute.booking.listing.images[0])} alt="" className="w-full h-full object-cover" onError={() => setImgError(true)} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <IoHomeOutline className="text-2xl text-slate-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-[9px] font-extrabold uppercase tracking-[0.15em] ${isDark ? "text-white/25 bg-white/[0.04] border-white/[0.05]" : "text-slate-500 bg-slate-100 border-slate-200"} px-2.5 py-0.5 rounded-full border`}>
                      {TYPE_LABELS[dispute.type] || dispute.type}
                    </span>
                    <span className={`flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] ${status.color} ${status.bg} px-2.5 py-0.5 rounded-full border ${status.border}`}>
                      <StatusIcon className="text-[10px]" />{status.label}
                    </span>
                    {dispute.priority === "HIGH" && (
                      <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                        ● Urgent
                      </span>
                    )}
                  </div>

                  <h3 className={`text-sm font-bold truncate mb-0.5 ${isDark ? "text-white/80 group-hover:text-white/90" : "text-slate-800"}`}>
                    {dispute.booking.listing.title}
                  </h3>
                  <p className={`text-[10px] flex items-center gap-1 ${isDark ? "text-white/20" : "text-slate-500"}`}>
                    <IoLocationOutline className="text-[10px]" />{dispute.booking.listing.governorate}, {dispute.booking.listing.delegation}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className={`text-[10px] flex items-center gap-1 ${isDark ? "text-white/15" : "text-slate-400"}`}>
                      <IoCalendarOutline className="text-[10px]" />{fmtShort(dispute.booking.checkIn)} → {fmtShort(dispute.booking.checkOut)}
                    </span>
                    <span className={`text-[10px] ${isDark ? "text-white/10" : "text-slate-300"}`}>·</span>
                    <span className={`text-[10px] flex items-center gap-1 ${isDark ? "text-white/15" : "text-slate-400"}`}>
                      <IoTimeOutline className="text-[10px]" />{daysAgo(dispute.updatedAt)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between flex-shrink-0">
                  {dispute.refundAmount && (
                    <div className="text-right">
                      <p className={`text-[8px] uppercase tracking-wider mb-0.5 ${isDark ? "text-white/15" : "text-slate-400"}`}>Demandé</p>
                      <p className={`text-sm font-bold ${isDark ? "text-white/40" : "text-slate-600"}`}>{fmtPrice(dispute.refundAmount)} <span className="text-[9px] text-white/15">TND</span></p>
                    </div>
                  )}
                  {dispute.resolvedAmount && (
                    <div className="text-right mt-1">
                      <p className="text-[8px] text-emerald-500/50 uppercase tracking-wider mb-0.5">Remboursé</p>
                      <p className="text-sm font-bold text-emerald-400/70">{fmtPrice(dispute.resolvedAmount)} <span className="text-[9px] text-emerald-400/30">TND</span></p>
                    </div>
                  )}
                  {dispute.status === "REJECTED" && (
                    <div className="text-right mt-1">
                      <p className="text-[8px] text-rose-500/40 uppercase tracking-wider">Non remboursé</p>
                    </div>
                  )}
                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all mt-2 ${isDark ? "bg-white/[0.03] border-white/[0.05] group-hover:bg-white/[0.06] group-hover:border-white/[0.08]" : "bg-white/50 border-slate-200 group-hover:bg-white"}`}>
                    <IoChevronForwardOutline className={`text-xs transition-all ${isDark ? "text-white/20 group-hover:text-white/40 group-hover:translate-x-0.5" : "text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5"}`} />
                  </div>
                </div>
              </div>

              <p className={`text-[11px] mt-3 line-clamp-1 leading-relaxed ${isDark ? "text-white/15" : "text-slate-400"}`}>
                {dispute.description}
              </p>

              <div className={`flex items-center justify-between mt-3 pt-3 border-t ${isDark ? "border-white/[0.03]" : "border-slate-100"}`}>
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] font-mono ${isDark ? "text-white/15" : "text-slate-400"}`}>{dispute.reference}</span>
                  <span className={`text-[9px] ${isDark ? "text-white/10" : "text-slate-300"}`}>·</span>
                  <span className={`text-[9px] ${isDark ? "text-white/12" : "text-slate-400"}`}>{dispute.booking.tenant.firstName} {dispute.booking.tenant.lastName}</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <IoEyeOutline className={`text-[10px] ${isDark ? "text-white/20" : "text-slate-400"}`} />
                  <span className={`text-[9px] ${isDark ? "text-white/20" : "text-slate-400"}`}>Voir détails</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ============================================
// MAIN PAGE
// ============================================
interface Dispute {
  id: string;
  reference: string;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED";
  type: string;
  description: string;
  refundAmount: number | null;
  resolvedAmount: number | null;
  priority: "HIGH" | "MEDIUM" | "LOW";
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    checkIn: string;
    checkOut: string;
    totalPrice: number;
    listing: {
      id: string;
      title: string;
      governorate: string;
      delegation: string;
      images?: string[];
    };
    tenant: { firstName: string; lastName: string };
    owner: { firstName: string; lastName: string };
  };
}

export default function DisputesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const { getToken } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const token = await getToken();
      const res = await fetch("/api/disputes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const disputesList = Array.isArray(data) ? data : data.disputes || [];
      setDisputes(disputesList);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    open: disputes.filter(d => d.status === "OPEN").length,
    inReview: disputes.filter(d => d.status === "IN_REVIEW").length,
    resolved: disputes.filter(d => d.status === "RESOLVED").length,
    rejected: disputes.filter(d => d.status === "REJECTED").length,
  };
  const totalRequested = disputes.reduce((s, d) => s + (d.refundAmount || 0), 0);
  const totalResolved = disputes.reduce((s, d) => s + (d.resolvedAmount || 0), 0);
  const resolutionRate = disputes.length > 0 ? Math.round((stats.resolved / disputes.length) * 100) : 0;

  const filtered = disputes.filter(d => {
    if (filter === "active") return d.status === "OPEN" || d.status === "IN_REVIEW";
    if (filter === "resolved") return d.status === "RESOLVED" || d.status === "REJECTED";
    return true;
  });
  const activeDisputes = filtered.filter(d => d.status === "OPEN" || d.status === "IN_REVIEW");
  const pastDisputes = filtered.filter(d => d.status === "RESOLVED" || d.status === "REJECTED");

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen={true}
        variant="spinner"
        size="lg"
        color="primary"
        text="Chargement des litiges..."
        speed="normal"
      />
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? "text-white" : "text-slate-800"}`}>
      
      <TenantHeader />

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
       

        {/* Hero - Aligné à gauche */}
        <div className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-600 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/70 dark:text-indigo-300">
            <IoScaleOutline className="h-3 w-3" />
            Assistance litige
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
            Suivi des <span className={GRADIENT_TEXT}>litiges</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Gérez vos réclamations actives et consultez l'historique de vos résolutions.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          {/* LEFT COLUMN - Disputes List */}
          <div className="lg:col-span-8 space-y-8">
            {/* Filters */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="flex flex-wrap items-center gap-2">
              {[
                { key: "all" as const, label: "Tous", count: disputes.length },
                { key: "active" as const, label: "Actifs", count: stats.open + stats.inReview },
                { key: "resolved" as const, label: "Terminés", count: stats.resolved + stats.rejected },
              ].map(tab => (
                <motion.button key={tab.key} onClick={() => setFilter(tab.key)} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                    filter === tab.key
                      ? isDark ? "bg-white/[0.06] border border-white/[0.1] text-white/60 shadow-lg shadow-black/10" : "bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-sm"
                      : isDark ? "bg-white/[0.01] border border-white/[0.03] text-white/20 hover:text-white/35 hover:border-white/[0.06]" : "bg-white/50 border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300"
                  }`}>
                  {tab.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    filter === tab.key
                      ? isDark ? "bg-white/[0.08] text-white/40" : "bg-indigo-100 text-indigo-600"
                      : isDark ? "bg-white/[0.03] text-white/12" : "bg-slate-100 text-slate-500"
                  }`}>{tab.count}</span>
                </motion.button>
              ))}
              <div className="flex-1"></div>
              <Link href={`/${locale}/disputes/new`}>
                <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all group ${GRADIENT_BUTTON}`}>
                  <IoAddOutline className="text-sm group-hover:rotate-90 transition-transform duration-300" />
                  Nouveau litige
                </motion.button>
              </Link>
            </motion.div>

            {/* Active Disputes */}
            {activeDisputes.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                  <h2 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500 dark:text-white/30">Litiges actifs</h2>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-white/[0.04]" />
                  <span className="text-[10px] text-slate-400 dark:text-white/15">{activeDisputes.length} en cours</span>
                </div>
                <div className="space-y-3">
                  {activeDisputes.map((d, i) => (
                    <DisputeCard key={d.id} dispute={d} delay={0.3 + i * 0.08} />
                  ))}
                </div>
              </div>
            )}

            {/* Past Disputes */}
            {pastDisputes.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <IoCheckmarkCircleOutline className="text-sm text-slate-400 dark:text-white/12" />
                  <h2 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500 dark:text-white/18">Historique</h2>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-white/[0.03]" />
                  <span className="text-[10px] text-slate-400 dark:text-white/12">{pastDisputes.length} terminé(s)</span>
                </div>
                <div className="space-y-3">
                  {pastDisputes.map((d, i) => (
                    <DisputeCard key={d.id} dispute={d} delay={0.55 + i * 0.08} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State - Dans une GlassCard */}
            {filtered.length === 0 && (
              <GlassCard>
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center h-122">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-500/20 via-indigo-500/20 to-purple-600/20 animate-pulse" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-purple-600/10 backdrop-blur-sm">
                      <IoDocumentTextOutline className={`h-10 w-10 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
                    </div>
                  </div>
                  <p className={`text-sm ${isDark ? "text-white/60" : "text-slate-600"}`}>Aucun litige trouvé</p>
                  <p className={`mt-1 text-[11px] ${isDark ? "text-white/25" : "text-slate-400"}`}>Modifiez vos filtres ou créez un nouveau litige.</p>
                  <Link href={`/${locale}/disputes/new`} className={`mt-5 inline-flex items-center gap-2 rounded-full ${GRADIENT_BUTTON} px-5 py-2.5 text-xs font-bold shadow-md`}>
                    <IoAddOutline className="h-3.5 w-3.5" />
                    Nouveau litige
                  </Link>
                </div>
              </GlassCard>
            )}
          </div>

          {/* RIGHT COLUMN - SIDEBAR */}
          <div className="lg:col-span-4 space-y-5">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="En attente" value={stats.open} icon={<IoHourglassOutline />} iconBg="bg-amber-500/10 text-amber-400 border border-amber-500/20" delay={0.1} />
              <StatCard label="En examen" value={stats.inReview} icon={<IoTimeOutline />} iconBg="bg-sky-500/10 text-sky-400 border border-sky-500/20" delay={0.15} />
              <StatCard label="Résolus" value={stats.resolved} icon={<IoCheckmarkCircleOutline />} iconBg="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" delay={0.2} />
              <StatCard label="Rejetés" value={stats.rejected} icon={<IoCloseCircleOutline />} iconBg="bg-rose-500/10 text-rose-400 border border-rose-500/20" delay={0.25} />
            </div>

            {/* Summary */}
            <div className={`overflow-hidden rounded-[28px] border ${isDark ? "bg-white/[0.03] border-white/[0.06]" : "bg-white/70 border-white/50 shadow-md"} p-5`}>
              <h3 className={`text-xs font-extrabold mb-4 ${isDark ? "text-white/60" : "text-slate-700"}`}>Résumé</h3>
              <div className="mb-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className={`text-[10px] ${isDark ? "text-white/25" : "text-slate-500"}`}>Taux de résolution</span>
                  <span className={`text-lg font-black ${isDark ? "text-white/60" : "text-slate-700"}`}>{resolutionRate}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/[0.04]">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-500/40 to-emerald-400/30"
                    initial={{ width: "0%" }}
                    animate={{ width: `${resolutionRate}%` }}
                    transition={{ delay: 0.5, duration: 1, ease: "easeOut" }} />
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "Total litiges", value: disputes.length.toString(), color: isDark ? "text-white/60" : "text-slate-700" },
                  { label: "Montant demandé", value: `${fmtPrice(totalRequested)} TND`, color: isDark ? "text-white/40" : "text-slate-500" },
                  { label: "Montant remboursé", value: `${fmtPrice(totalResolved)} TND`, color: "text-emerald-400/70" },
                  { label: "Taux de remboursement", value: `${totalRequested > 0 ? Math.round((totalResolved / totalRequested) * 100) : 0}%`, color: "text-emerald-400/50" },
                ].map(item => (
                  <div key={item.label} className={`flex items-center justify-between border-b py-2 last:border-0 ${isDark ? "border-white/[0.03]" : "border-slate-100"}`}>
                    <span className={`text-[11px] ${isDark ? "text-white/20" : "text-slate-500"}`}>{item.label}</span>
                    <span className={`text-xs font-bold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Process */}
            <div className={`overflow-hidden rounded-[28px] border ${isDark ? "bg-white/[0.03] border-white/[0.06]" : "bg-white/70 border-white/50 shadow-md"} p-5`}>
              <h3 className={`text-xs font-extrabold mb-4 ${isDark ? "text-white/60" : "text-slate-700"}`}>Processus</h3>
              <div className="space-y-4">
                {[
                  { icon: <IoDocumentTextOutline />, title: "Soumettez", desc: "Décrivez le problème et joignez des preuves", time: "Jour 1" },
                  { icon: <IoTimeOutline />, title: "Examen", desc: "Analyse de votre demande sous 24h", time: "J+1" },
                  { icon: <IoChatbubblesOutline />, title: "Médiation", desc: "Contact avec l'hôte pour sa version", time: "J+2-3" },
                  { icon: <IoCheckmarkCircleOutline />, title: "Résolution", desc: "Décision finale et remboursement", time: "J+3-5" },
                ].map((s, i) => (
                  <div key={s.title} className="flex items-start gap-3 group">
                    <div className="relative">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm transition-all ${isDark ? "border border-white/[0.05] bg-white/[0.03] text-white/20 group-hover:border-white/[0.08]" : "border border-slate-200 bg-white/50 text-slate-400"}`}>
                        {s.icon}
                      </div>
                      {i < 3 && <div className="absolute left-1/2 top-full h-3 w-px -translate-x-1/2 bg-slate-200 dark:bg-white/[0.04]" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-bold ${isDark ? "text-white/45" : "text-slate-700"}`}>{s.title}</p>
                        <span className={`text-[8px] font-mono ${isDark ? "text-white/12" : "text-slate-400"}`}>{s.time}</span>
                      </div>
                      <p className={`mt-0.5 text-[10px] ${isDark ? "text-white/18" : "text-slate-500"}`}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Help */}
            <div className={`overflow-hidden rounded-[28px] border ${isDark ? "bg-white/[0.03] border-white/[0.06]" : "bg-white/70 border-white/50 shadow-md"} p-5 space-y-2.5`}>
              <h3 className={`text-xs font-extrabold mb-3 ${isDark ? "text-white/60" : "text-slate-700"}`}>Besoin d'aide ?</h3>
              <button className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${isDark ? "border-white/[0.03] bg-white/[0.01] hover:border-white/[0.06] hover:bg-white/[0.02]" : "border-slate-200 bg-white/50 hover:border-indigo-300 hover:bg-white"}`}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-100 to-indigo-100 text-sky-500 dark:from-sky-500/10 dark:to-indigo-500/10 dark:text-sky-400">
                  <IoHeadsetOutline className="text-sm" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Contacter le support</p>
                  <p className="text-[9px] text-slate-500">Réponse sous 2h</p>
                </div>
                <IoChevronForwardOutline className="text-slate-400 text-xs" />
              </button>
              <button className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${isDark ? "border-white/[0.03] bg-white/[0.01] hover:border-white/[0.06] hover:bg-white/[0.02]" : "border-slate-200 bg-white/50 hover:border-indigo-300 hover:bg-white"}`}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-100 to-indigo-100 text-sky-500 dark:from-sky-500/10 dark:to-indigo-500/10 dark:text-sky-400">
                  <IoDocumentTextOutline className="text-sm" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Politique de litiges</p>
                  <p className="text-[9px] text-slate-500">Conditions générales</p>
                </div>
                <IoChevronForwardOutline className="text-slate-400 text-xs" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}