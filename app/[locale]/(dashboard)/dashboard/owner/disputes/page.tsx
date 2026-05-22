// app/[locale]/(dashboard)/owner/disputes/page.tsx
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Loader2,
  Gavel,
  Home,
  User,
  Printer,
  MoreVertical,
  Send,
  X,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  HelpCircle,
  Download,
  MapPin,
  Save,
  SaveAllIcon,
} from "lucide-react";
import AlertBanner from "@/components/ui/Alert";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";

// YOUR shadow tokens - 3D effect for cards
const block3d =
  "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";
const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

// STATUS_CONFIG
const STATUS_CONFIG = {
  OPEN: {
    color: "text-white",
    bg: "bg-gradient-to-r from-red-500 to-rose-600",
    border: "border-red-500",
    icon: AlertCircle,
    labelKey: "open",
    descKey: "openDesc",
    glow: "shadow-lg shadow-red-500/30",
    cardBorder: "border-red-200 dark:border-red-800",
  },
  IN_REVIEW: {
    color: "text-white",
    bg: "bg-gradient-to-r from-amber-500 to-orange-500",
    border: "border-amber-500",
    icon: Clock,
    labelKey: "inReview",
    descKey: "inReviewDesc",
    glow: "shadow-lg shadow-amber-500/30",
    cardBorder: "border-amber-200 dark:border-amber-800",
  },
  RESOLVED: {
    color: "text-white",
    bg: "bg-gradient-to-r from-emerald-500 to-emerald-600",
    border: "border-emerald-500",
    icon: CheckCircle,
    labelKey: "resolved",
    descKey: "resolvedDesc",
    glow: "shadow-lg shadow-emerald-500/30",
    cardBorder: "border-emerald-200 dark:border-emerald-800",
  },
  CLOSED: {
    color: "text-white",
    bg: "bg-gradient-to-r from-slate-500 to-slate-600",
    border: "border-slate-500",
    icon: X,
    labelKey: "closed",
    descKey: "closedDesc",
    glow: "shadow-lg shadow-slate-500/30",
    cardBorder: "border-slate-200 dark:border-slate-700",
  },
} as const;

function StatusBadge({ status, t }: { status: string; t: any }) {
  const cfg =
    STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.OPEN;
  const Icon = cfg.icon;

  return (
    <div className="relative group">
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ${cfg.color} ${cfg.bg} ${cfg.border} border ${cfg.glow} cursor-help shadow-md`}
      >
        <Icon size={12} /> {t(`status.${cfg.labelKey}`)}
      </span>
      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 shadow-lg">
        {t(`status.${cfg.descKey}`)}
      </div>
    </div>
  );
}

function Tooltip({
  children,
  text,
}: {
  children: React.ReactNode;
  text: string;
}) {
  return (
    <span className="group relative inline-block">
      {children}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {text}
      </span>
    </span>
  );
}

interface Dispute {
  id: string;
  reference: string;
  type: string;
  description: string;
  status: string;
  priority: string;
  amount: number | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  booking: {
    id: string;
    reference: string;
    checkIn: string;
    checkOut: string;
    totalPrice: number;
    listing: {
      id: string;
      title: string;
      type: string;
      governorate: string;
    };
    tenant: {
      id: string;
      username: string;
      name: string;
      avatar: string | null;
    };
  };
  messages: Message[];
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  isInternal: boolean;
  sender: {
    id: string;
    name: string;
    role: string;
    isAdmin: boolean;
    avatar: string | null;
  };
}

interface DisputeDetail extends Dispute {
  booking: Dispute["booking"] & {
    listing: Dispute["booking"]["listing"] & {
      delegation: string;
      street: string;
      image: string | null;
    };
    tenant: Dispute["booking"]["tenant"] & {
      email: string;
      phone: string;
    };
  };
  evidence: any[];
  resolution: string | null;
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function OwnerDisputesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = React.use(params);
  const t = useTranslations("OwnerDisputes");
  const router = useRouter();
  const { user } = useUser();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<DisputeDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stats, setStats] = useState({
    open: 0,
    inReview: 0,
    resolvedMonth: 0,
    total: 0,
  });
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/owner/disputes");
      const data = await res.json();
      if (data.success) {
        setDisputes(data.disputes);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Erreur chargement litiges:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDisputeDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/owner/disputes/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedDispute(data.dispute);
      }
    } catch (error) {
      console.error("Erreur chargement détail:", error);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedDispute) return;
    setSendingMessage(true);
    try {
      const res = await fetch(
        `/api/owner/disputes/${selectedDispute.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newMessage }),
        },
      );
      if (res.ok) {
        setNewMessage("");
        await fetchDisputeDetail(selectedDispute.id);
        setAlert({ type: "success", message: t("alerts.messageSent") });
      }
    } catch (error) {
      console.error("Erreur envoi message:", error);
      setAlert({ type: "error", message: t("alerts.messageError") });
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const handleSelectDispute = (id: string) => {
    fetchDisputeDetail(id);
  };

  const filteredDisputes = disputes.filter((dispute) => {
    const matchesSearch =
      dispute.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.booking.listing.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      dispute.booking.tenant.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || dispute.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statsCards = [
    {
      title: t("stats.openDisputes"),
      value: stats.open + stats.inReview,
      Icon: AlertCircle,
      grad: "from-red-500 to-rose-600",
      bg: "border-red-100 dark:border-red-900/40",
      cls: "text-red-600 dark:text-red-400",
    },
    {
      title: t("stats.inReview"),
      value: stats.inReview || 0,
      Icon: Clock,
      grad: "from-amber-500 to-orange-500",
      bg: "border-amber-100 dark:border-amber-900/40",
      cls: "text-amber-600 dark:text-amber-400",
    },
    {
      title: t("stats.resolvedMonth"),
      value: stats.resolvedMonth || 0,
      Icon: CheckCircle,
      grad: "from-emerald-500 to-emerald-600",
      bg: "border-emerald-100 dark:border-emerald-900/40",
      cls: "text-emerald-600 dark:text-emerald-400",
    },
  ];
  
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen gap-4">
        <LoadingSpinner />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium animate-pulse">
          {t("loading")}
        </p>
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col overflow-x-hidden overflow-y-auto p-6 gap-6">
      {alert && (
        <div className="fixed top-5 right-5 z-[60] w-full max-w-sm animate-in slide-in-from-top-2 fade-in duration-300">
          <AlertBanner
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
            {t("page.title")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl">
            {t("page.description")}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          {statsCards.map(({ title, value, Icon, grad, bg, cls }) => (
            <div
              key={title}
              className={`bg-white dark:bg-slate-900 rounded-2xl border ${bg} p-4 ${card3d} hover:shadow-md transition-all min-w-[160px]`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm flex-shrink-0`}
                >
                  <Icon className="text-white text-lg" />
                </div>
                <div>
                  <p className={`text-2xl font-black leading-none ${cls}`}>
                    {value}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium uppercase tracking-wider">
                    {title}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* Filters & Layout Grid */}
      <section className="grid grid-cols-12 gap-8">
        {/* List Side - col-span-12 lg:col-span-7 */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          {/* Search and Filter Bar */}
          <div
            className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 ${block3d} flex flex-wrap gap-4 items-center`}
          >
            <div className="flex-grow flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3">
              <Search size={18} className="text-indigo-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("filters.searchPlaceholder")}
                className="bg-transparent border-none focus:outline-none text-sm ml-2 w-full dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 cursor-pointer dark:text-white"
            >
              <option value="all">{t("filters.allStatus")}</option>
              <option value="OPEN">{t("status.open")}</option>
              <option value="IN_REVIEW">{t("status.inReview")}</option>
              <option value="RESOLVED">{t("status.resolved")}</option>
            </select>
            <Tooltip text={t("actions.refresh")}>
              <button
                onClick={fetchDisputes}
                className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 rounded-xl transition-all"
              >
                <RefreshCw size={18} />
              </button>
            </Tooltip>
          </div>

          {/* Disputes Main List */}
          <div className="space-y-4">
            {filteredDisputes.length === 0 ? (
              <div
                className={`bg-white dark:bg-slate-900 rounded-2xl border-2 border-indigo-100/40 dark:border-indigo-800 ${card3d} p-12 flex flex-col items-center justify-center text-center min-h-[500px]`}
              >
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse"></div>
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-sky-100 to-purple-100 dark:from-sky-950/50 dark:to-purple-950/50 flex items-center justify-center shadow-lg">
                    <Gavel size={48} className="text-sky-500 dark:text-sky-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-purple-600 dark:from-sky-400 dark:to-purple-400 bg-clip-text text-transparent mb-3">
                  {t("emptyState.title")}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                  {t("emptyState.description")}
                </p>
                <Link
                  href={`/${locale}/help`}
                  className="mt-6 text-xs text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors flex items-center gap-1"
                >
                  <HelpCircle size={12} /> {t("emptyState.helpLink")}
                </Link>
              </div>
            ) : (
              filteredDisputes.map((dispute) => {
                const statusCfg =
                  STATUS_CONFIG[dispute.status as keyof typeof STATUS_CONFIG] ||
                  STATUS_CONFIG.OPEN;
                return (
                  <div
                    key={dispute.id}
                    onClick={() => handleSelectDispute(dispute.id)}
                    className={`group bg-white dark:bg-slate-900 rounded-xl p-5 border-l-4 ${statusCfg.cardBorder} ${card3d} hover:shadow-lg transition-all cursor-pointer`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                          ID: {dispute.reference}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                          {dispute.type === "DAMAGE"
                            ? t("disputeTypes.damageFurniture")
                            : dispute.type === "PAYMENT"
                              ? t("disputeTypes.paymentLate")
                              : dispute.type === "CANCELLATION"
                                ? t("disputeTypes.cancellationBooking")
                                : t("disputeTypes.other")}
                        </h3>
                      </div>
                      <StatusBadge status={dispute.status} t={t} />
                    </div>
                    <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <User size={14} /> {dispute.booking.tenant.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <Home size={14} /> {dispute.booking.listing.title}
                      </div>
                      {dispute.amount && (
                        <div className="ml-auto font-bold text-indigo-600 dark:text-indigo-400">
                          {dispute.amount.toLocaleString()} TND
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:underline">
                        {t("actions.viewDetails")} <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Detail Panel Side - col-span-12 lg:col-span-5 */}
        <div className="col-span-12 lg:col-span-5">
          {loadingDetail ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 p-12 flex items-center justify-center min-h-[600px]">
              <Loader2 size={32} className="animate-spin text-indigo-500" />
            </div>
          ) : selectedDispute ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 overflow-hidden sticky top-6">
              {/* Detail Header */}
              <div className="p-5 border-b border-dashed border-indigo-200 dark:border-indigo-800">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                      {selectedDispute.reference}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white mt-1">
                      {selectedDispute.type === "DAMAGE"
                        ? t("disputeTypes.damage")
                        : selectedDispute.type === "PAYMENT"
                          ? t("disputeTypes.payment")
                          : selectedDispute.type === "CANCELLATION"
                            ? t("disputeTypes.cancellation")
                            : t("disputeTypes.other")}
                    </h3>
                  </div>
                  <StatusBadge status={selectedDispute.status} t={t} />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <User size={14} /> {selectedDispute.booking.tenant.name}
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Home size={14} /> {selectedDispute.booking.listing.title}
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="p-5 space-y-4 max-h-[500px] overflow-y-auto">
                <div>
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                    {t("description")}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedDispute.description}
                  </p>
                </div>

                {selectedDispute.messages.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                      {t("lastMessage")}
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {selectedDispute.messages[selectedDispute.messages.length - 1].content}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {formatDate(selectedDispute.messages[selectedDispute.messages.length - 1].createdAt)}
                      </p>
                    </div>
                  </div>
                )}

                {selectedDispute.amount && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                      {t("amount")}
                    </p>
                    <p className="text-xl font-bold text-amber-700 dark:text-amber-500">
                      {selectedDispute.amount.toLocaleString()} TND
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-dashed border-indigo-200 dark:border-indigo-800">
                <div className="flex gap-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t("messagePlaceholder")}
                    rows={2}
                    className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border-0 resize-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sendingMessage || !newMessage.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                  >
                    {sendingMessage ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  {t("messageInfo")}
                </p>
              </div>
            </div>
          ) : (
            /* Empty Detail State */
            <div className="bg-indigo-100/20 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 p-12 text-center min-h-[600px] flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4">
                <SaveAllIcon size={24} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
                {t("selectDispute")}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">
                {t("selectDisputeDescription")}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}