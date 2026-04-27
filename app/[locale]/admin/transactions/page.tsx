// app/[locale]/(dashboard)/admin/transactions/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Alert from "@/components/ui/Alert";
import Pagination from "@/components/ui/Pagination";
import {
  IoSearchOutline,
  IoFilterOutline,
  IoDownloadOutline,
  IoNotificationsOutline,
  IoHelpCircleOutline,
  IoEllipsisVerticalOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoTrendingUpOutline,
  IoWalletOutline,
  IoTimeOutline,
  IoRefreshOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoAlertCircleOutline,
  IoCalendarOutline,
  IoReceiptOutline,
  IoHomeOutline,
  IoSettingsOutline,
  IoLogOutOutline,
  IoShareOutline,
  IoChatbubbleOutline,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";
import { MdOutlineGavel, MdOutlinePercent } from "react-icons/md";
import { BsFiletypeCsv, BsFiletypePdf } from "react-icons/bs";
import { FiChevronDown } from "react-icons/fi";

// ─── pip helper ───────────────────────────────────────────────────────────────
const pip = (url: string) => `/api/listings/image?url=${encodeURIComponent(url)}`;

// ─── Admin Sidebar ────────────────────────────────────────────────────────────
function AdminSidebar({ active }: { active: string }) {
  const navItems = [
    { label: "Dashboard", href: "/fr/admin", icon: <IoShareOutline /> },
    { label: "Transactions", href: "/fr/admin/transactions", icon: <IoReceiptOutline /> },
    { label: "Property Listings", href: "/fr/admin/properties", icon: <IoHomeOutline /> },
    { label: "Disputes", href: "/fr/admin/disputes", icon: <MdOutlineGavel /> },
    { label: "Moderation", href: "/fr/admin/moderation", icon: <IoChatbubbleOutline /> },
  ];

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-50 dark:bg-slate-950 flex flex-col py-8 px-4 gap-6 z-50 border-r border-slate-100 dark:border-slate-800">
      <div className="px-4">
        <span className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">
          Nesthub Atlas
        </span>
        <p className="text-xs text-slate-500 font-medium mt-1">Management Suite</p>
      </div>
      <nav className="flex-1 flex flex-col gap-0.5">
        {navItems.map(({ label, href, icon }) => (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              active === label
                ? "text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-300 hover:translate-x-1"
            }`}
          >
            <span className="text-base">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-4 space-y-0.5">
        <Link
          href="/fr/admin/settings"
          className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors"
        >
          <IoSettingsOutline className="text-base" />
          Settings
        </Link>
        <Link
          href="/fr/logout"
          className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors"
        >
          <IoLogOutOutline className="text-base" />
          Logout
        </Link>
      </div>
    </aside>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type TxStatus = "SUCCESS" | "PENDING" | "REFUNDED" | "FAILED";

interface Transaction {
  id: string;
  reference: string;
  date: string;
  amount: number;
  property: {
    id: string;
    title: string;
    image?: string;
  };
  status: TxStatus;
  provider: string;
  tenantName?: string;
}

interface KPIs {
  totalVolume: number;
  totalCommissions: number;
  pendingPayouts: number;
  pendingCount: number;
  volumeGrowth: number;
  commissionsGrowth: number;
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: TxStatus }) {
  const map: Record<TxStatus, { label: string; dot: string; cls: string; icon: React.ReactNode }> = {
    SUCCESS: { label: "Success", dot: "bg-emerald-500", cls: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400", icon: <IoCheckmarkCircleOutline /> },
    PENDING: { label: "Pending", dot: "bg-amber-500", cls: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400", icon: <IoTimeOutline /> },
    REFUNDED: { label: "Refunded", dot: "bg-red-500", cls: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400", icon: <IoCloseCircleOutline /> },
    FAILED: { label: "Failed", dot: "bg-red-700", cls: "bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300", icon: <IoAlertCircleOutline /> },
  };
  const { label, dot, cls, icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

// ─── Stripe SVG logo ──────────────────────────────────────────────────────────
function StripeLogo() {
  return (
    <svg className="h-4 w-auto text-[#635BFF]" fill="currentColor" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 19.34c0-5.87-2.65-9.34-8.06-9.34-5.32 0-8.62 3.65-8.62 9.42 0 6.64 3.73 9.4 8.78 9.4 2.22 0 4.14-.37 5.76-.92v-3.77c-1.52.54-3.13.79-4.88.79-2.82 0-4.63-1.07-4.9-3.72h11.83c.06-.55.09-1.25.09-1.86zm-11.82-2.12c.1-1.95 1.34-3.13 3.1-3.13 1.76 0 2.87 1.18 2.97 3.13h-6.07zm-14.71-7.22c-2.31 0-3.64 1.14-4.2 1.7V10.4H4.55v22.45h4.86V21.65c0-3.23 1.83-5.31 4.58-5.31 1.02 0 1.63.15 2.15.38V12.1a10.8 10.8 0 0 0-2.67-.32zm-7.66-3.86a2.82 2.82 0 0 0-2.84-2.85 2.83 2.83 0 0 0-2.84 2.85 2.83 2.83 0 0 0 2.84 2.84 2.82 2.82 0 0 0 2.84-2.84zm-4.95 4.16h4.86v18.06H.86V10.38z" />
    </svg>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminTransactionsPage() {
  const { getToken } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kpis, setKpis] = useState<KPIs>({
    totalVolume: 248590,
    totalCommissions: 18245.5,
    pendingPayouts: 12400,
    pendingCount: 14,
    volumeGrowth: 12,
    commissionsGrowth: 8.4,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [nextSettlement, setNextSettlement] = useState("Tomorrow, 09:00 AM");
  const [lastSettlement, setLastSettlement] = useState("Yesterday, 09:00 AM");
  const PAGE_SIZE = 10;

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
    [getToken]
  );

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: PAGE_SIZE.toString(),
        ...(search && { search }),
        ...(statusFilter !== "ALL" && { status: statusFilter }),
      });
      const res = await authFetch(`/api/admin/transactions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotalCount(data.pagination?.totalCount ?? 0);
        if (data.kpis) setKpis(data.kpis);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [authFetch, currentPage, search, statusFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleExport = async (fmt: "csv" | "pdf") => {
    setShowExport(false);
    try {
      const res = await authFetch(`/api/admin/transactions/export?format=${fmt}&status=${statusFilter}&search=${search}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transactions.${fmt}`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        setAlert({ type: "error", message: "Export non disponible" });
      }
    } catch {
      setAlert({ type: "error", message: "Erreur lors de l'export" });
    }
  };

  const fmtAmount = (n: number) =>
    n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="bg-[#f9f9ff] dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 transition-colors">
      <AdminSidebar active="Transactions" />

      <main className="ml-64 min-h-screen bg-[#f9f9ff] dark:bg-slate-950">
        {/* ── Top nav ── */}
        <header className="flex items-center justify-between w-full px-8 h-16 sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold tracking-tighter text-slate-900 dark:text-white">
              Transaction Tracking
            </h1>
            <div className="relative hidden md:block">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search transactions..."
                className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm w-64 focus:ring-4 focus:ring-blue-500/20 outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-full transition-all">
              <IoNotificationsOutline className="text-xl" />
            </button>
            <button className="p-2 text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-full transition-all">
              <IoHelpCircleOutline className="text-xl" />
            </button>
            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-200 dark:border-slate-700">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">Admin User</p>
                <p className="text-[10px] text-slate-500">System Controller</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Alert */}
        {alert && (
          <div className="fixed top-20 right-5 z-[60] w-full max-w-sm">
            <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
          </div>
        )}

        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">

          {/* ── KPI cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Total Volume */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(24,28,34,0.07)] relative overflow-hidden group border border-slate-100 dark:border-slate-800">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <IoWalletOutline className="text-8xl" />
              </div>
              <p className="text-[10px] text-slate-500 font-bold mb-1 tracking-widest uppercase">
                Total Volume (TND)
              </p>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
                {fmtAmount(kpis.totalVolume)}
              </h2>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                  <IoTrendingUpOutline className="text-xs" />
                  {kpis.volumeGrowth}%
                </span>
                <span className="text-[10px] text-slate-400">vs last month</span>
              </div>
            </div>

            {/* Platform Commissions */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(24,28,34,0.07)] relative overflow-hidden group border border-slate-100 dark:border-slate-800">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <MdOutlinePercent className="text-8xl" />
              </div>
              <p className="text-[10px] text-slate-500 font-bold mb-1 tracking-widest uppercase">
                Platform Commissions
              </p>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
                {fmtAmount(kpis.totalCommissions)}
              </h2>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                  <IoTrendingUpOutline className="text-xs" />
                  {kpis.commissionsGrowth}%
                </span>
                <span className="text-[10px] text-slate-400">vs last month</span>
              </div>
            </div>

            {/* Pending Payouts — gradient card */}
            <div className="bg-gradient-to-br from-[#005cab] to-[#712ae2] rounded-2xl p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
                <IoTimeOutline className="text-8xl text-white" />
              </div>
              <p className="text-[10px] text-white/70 font-bold mb-1 tracking-widest uppercase">
                Pending Payouts
              </p>
              <h2 className="text-3xl font-black text-white tracking-tighter mb-2">
                {fmtAmount(kpis.pendingPayouts)}
              </h2>
              <div className="flex items-center gap-2">
                <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {kpis.pendingCount} transactions
                </span>
              </div>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(24,28,34,0.07)] overflow-hidden border border-slate-100 dark:border-slate-800">
            {/* Table header */}
            <div className="px-6 md:px-8 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time settlement data from Tunisia market
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none appearance-none"
                >
                  <option value="ALL">All Status</option>
                  <option value="SUCCESS">Success</option>
                  <option value="PENDING">Pending</option>
                  <option value="REFUNDED">Refunded</option>
                  <option value="FAILED">Failed</option>
                </select>

                {/* Refresh */}
                <button
                  onClick={fetchTransactions}
                  className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                  title="Refresh"
                >
                  <IoRefreshOutline className="text-base" />
                </button>

                {/* Export */}
                <div className="relative">
                  <button
                    onClick={() => setShowExport((p) => !p)}
                    className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs px-3 py-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <IoDownloadOutline className="text-sm" />
                    Export
                    <FiChevronDown className="text-xs" />
                  </button>
                  {showExport && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowExport(false)} />
                      <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xl z-50 overflow-hidden">
                        {[
                          { fmt: "csv" as const, icon: <BsFiletypeCsv className="text-emerald-500 text-base" />, label: "Export CSV" },
                          { fmt: "pdf" as const, icon: <BsFiletypePdf className="text-red-500 text-base" />, label: "Export PDF" },
                        ].map(({ fmt, icon, label }) => (
                          <button
                            key={fmt}
                            onClick={() => handleExport(fmt)}
                            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            {icon}
                            {label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Table body */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <LoadingSpinner fullScreen={false} variant="spinner" size="md" color="primary" text="Chargement..." speed="normal" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-600">
                  <IoReceiptOutline className="text-5xl mb-3" />
                  <p className="text-sm font-medium">Aucune transaction trouvée</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800">
                      {["Transaction ID", "Date", "Amount (TND)", "Property", "Status", "Provider", "Actions"].map((h) => (
                        <th key={h} className="px-5 md:px-8 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-5 md:px-8 py-4">
                          <span className="font-mono text-xs text-slate-900 dark:text-white font-bold">
                            {tx.reference}
                          </span>
                        </td>
                        <td className="px-5 md:px-8 py-4 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })} • {new Date(tx.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-5 md:px-8 py-4 font-bold text-slate-900 dark:text-white text-sm">
                          {fmtAmount(tx.amount)}
                        </td>
                        <td className="px-5 md:px-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                              {tx.property.image ? (
                                <img
                                  src={pip(tx.property.image)}
                                  alt={tx.property.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <IoHomeOutline className="text-slate-400 text-sm" />
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                              {tx.property.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 md:px-8 py-4">
                          <StatusBadge status={tx.status} />
                        </td>
                        <td className="px-5 md:px-8 py-4">
                          {tx.provider === "STRIPE" ? (
                            <StripeLogo />
                          ) : (
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                              {tx.provider}
                            </span>
                          )}
                        </td>
                        <td className="px-5 md:px-8 py-4">
                          <button className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100">
                            <IoEllipsisVerticalOutline className="text-base" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            <div className="px-6 md:px-8 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Showing 1–{Math.min(PAGE_SIZE, transactions.length)} of {totalCount} transactions
              </p>
              {totalPages > 1 && (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 transition-all disabled:opacity-40"
                  >
                    <IoChevronBackOutline className="text-sm" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 transition-all disabled:opacity-40"
                  >
                    <IoChevronForwardOutline className="text-sm" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Bottom editorial grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payout Schedule */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-8 border border-slate-100 dark:border-slate-800">
              <div className="flex items-start justify-between mb-7">
                <div>
                  <h4 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Payout Schedule
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Automated settlements every 48 hours
                  </p>
                </div>
                <IoTimeOutline className="text-blue-600 dark:text-blue-400 text-3xl flex-shrink-0" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Next Settlement
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {nextSettlement}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-900/50 rounded-xl opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Last Settlement
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {lastSettlement}
                  </span>
                </div>
              </div>
              <button className="mt-7 w-full py-3 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-xl shadow-sm hover:shadow-md border border-slate-100 dark:border-slate-800 transition-all">
                View Settlement History
              </button>
            </div>

            {/* Verification Status */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-8 border border-slate-100 dark:border-slate-800">
              <div className="flex items-start justify-between mb-7">
                <div>
                  <h4 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Verification Status
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Compliance & KYC oversight
                  </p>
                </div>
                <IoShieldCheckmarkOutline className="text-purple-600 dark:text-purple-400 text-3xl flex-shrink-0" />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 text-center p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-2xl font-black text-slate-900 dark:text-white">98%</p>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider mt-1">
                    Verified Hosts
                  </p>
                </div>
                <div className="flex-1 text-center p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-2xl font-black text-slate-900 dark:text-white">0.02%</p>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider mt-1">
                    Fraud Flag Rate
                  </p>
                </div>
              </div>
              <button className="mt-7 w-full py-3 bg-gradient-to-r from-[#005cab] to-[#712ae2] text-white font-bold text-xs rounded-xl shadow-lg hover:opacity-90 transition-all">
                Run Global Risk Audit
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}