// app/[locale]/admin/transactions/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Alert from "@/components/ui/Alert";
import Pagination from "@/components/ui/Pagination";
import {
  IoSearchOutline,
  IoDownloadOutline,
  IoRefreshOutline,
  IoTrendingUpOutline,
  IoWalletOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoReceiptOutline,
  IoHomeOutline,
} from "react-icons/io5";
import { MdOutlinePercent } from "react-icons/md";
import { BsFiletypeCsv, BsFiletypePdf } from "react-icons/bs";
import { FiChevronDown } from "react-icons/fi";

const pip = (url: string) => `/api/listings/image?url=${encodeURIComponent(url)}`;

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

interface Kpis {
  totalVolume: number;
  totalCommissions: number;
  pendingPayouts: number;
  pendingCount: number;
  volumeGrowth: number;
  commissionsGrowth: number;
}

function StatusBadge({ status }: { status: TxStatus }) {
  const map: Record<TxStatus, { label: string; dot: string; cls: string }> = {
    SUCCESS: { label: "Réussie", dot: "bg-emerald-500", cls: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700" },
    PENDING: { label: "En attente", dot: "bg-amber-500", cls: "bg-amber-100 dark:bg-amber-950/40 text-amber-700" },
    REFUNDED: { label: "Remboursée", dot: "bg-red-500", cls: "bg-red-100 dark:bg-red-950/40 text-red-700" },
    FAILED: { label: "Échouée", dot: "bg-red-700", cls: "bg-red-100 dark:bg-red-950/40 text-red-800" },
  };
  const { label, dot, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function StripeLogo() {
  return (
    <svg className="h-4 w-auto text-[#635BFF]" fill="currentColor" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 19.34c0-5.87-2.65-9.34-8.06-9.34-5.32 0-8.62 3.65-8.62 9.42 0 6.64 3.73 9.4 8.78 9.4 2.22 0 4.14-.37 5.76-.92v-3.77c-1.52.54-3.13.79-4.88.79-2.82 0-4.63-1.07-4.9-3.72h11.83c.06-.55.09-1.25.09-1.86zm-11.82-2.12c.1-1.95 1.34-3.13 3.1-3.13 1.76 0 2.87 1.18 2.97 3.13h-6.07zm-14.71-7.22c-2.31 0-3.64 1.14-4.2 1.7V10.4H4.55v22.45h4.86V21.65c0-3.23 1.83-5.31 4.58-5.31 1.02 0 1.63.15 2.15.38V12.1a10.8 10.8 0 0 0-2.67-.32zm-7.66-3.86a2.82 2.82 0 0 0-2.84-2.85 2.83 2.83 0 0 0-2.84 2.85 2.83 2.83 0 0 0 2.84 2.84 2.82 2.82 0 0 0 2.84-2.84zm-4.95 4.16h4.86v18.06H.86V10.38z" />
    </svg>
  );
}

export default function AdminTransactionsPage() {
  const { getToken } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kpis, setKpis] = useState<Kpis>({
    totalVolume: 0,
    totalCommissions: 0,
    pendingPayouts: 0,
    pendingCount: 0,
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
  const PAGE_SIZE = 10;

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: PAGE_SIZE.toString(),
        ...(search && { search }),
        ...(statusFilter !== "ALL" && { status: statusFilter }),
      });
      const res = await fetch(`/api/admin/transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotalCount(data.pagination?.totalCount ?? 0);
        if (data.kpis) setKpis(data.kpis);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [getToken, currentPage, search, statusFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleExport = async (format: "csv" | "pdf") => {
    setShowExport(false);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/admin/transactions/export?format=${format}&status=${statusFilter}&search=${search}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transactions.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        setAlert({ type: "error", message: "Export non disponible" });
      }
    } catch {
      setAlert({ type: "error", message: "Erreur lors de l'export" });
    }
  };

  const formatAmount = (n: number) =>
    n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-6">
      {alert && (
        <div className="fixed top-20 right-8 z-50">
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Transactions</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Suivez et gérez toutes les transactions de la plateforme
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowExport(!showExport)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold shadow-sm transition-all"
          >
            <IoDownloadOutline className="text-base" />
            Exporter
            <FiChevronDown className="text-xs" />
          </button>
          {showExport && (
            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 overflow-hidden">
              <button
                onClick={() => handleExport("csv")}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <BsFiletypeCsv className="text-emerald-500 text-base" />
                Export CSV
              </button>
              <button
                onClick={() => handleExport("pdf")}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <BsFiletypePdf className="text-red-500 text-base" />
                Export PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-indigo-50 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/40 to-violet-50/20">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-base" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Rechercher par référence, propriété..."
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-slate-100"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="SUCCESS">Réussies</option>
              <option value="PENDING">En attente</option>
              <option value="REFUNDED">Remboursées</option>
              <option value="FAILED">Échouées</option>
            </select>
            <button
              onClick={fetchTransactions}
              className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
            >
              <IoRefreshOutline className="text-lg" />
            </button>
          </div>
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-900/40 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <IoWalletOutline className="text-emerald-600 dark:text-emerald-400 text-lg" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Volume total</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatAmount(kpis.totalVolume)} TND</p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center text-green-600 text-[11px] font-semibold">
              <IoTrendingUpOutline className="text-sm mr-1" />
              <span>+{kpis.volumeGrowth}% vs mois dernier</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-900/40 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <MdOutlinePercent className="text-purple-600 dark:text-purple-400 text-lg" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Commissions</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatAmount(kpis.totalCommissions)} TND</p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center text-green-600 text-[11px] font-semibold">
              <IoTrendingUpOutline className="text-sm mr-1" />
              <span>+{kpis.commissionsGrowth}% vs mois dernier</span>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <IoTimeOutline className="text-white text-lg" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/70 uppercase">Paiements en attente</p>
              <p className="text-2xl font-bold text-white">{formatAmount(kpis.pendingPayouts)} TND</p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/20">
            <div className="flex items-center text-white/80 text-[11px] font-semibold">
              <span>{kpis.pendingCount} transaction(s) en attente</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner size="md" color="primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <IoReceiptOutline className="text-5xl mb-3" />
              <p className="text-sm font-medium">Aucune transaction trouvée</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30">
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Transaction ID</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Montant</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Propriété</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Provider</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {tx.reference}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(tx.date)} à {formatTime(tx.date)}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                      {formatAmount(tx.amount)} TND
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                          {tx.property.image ? (
                            <img src={pip(tx.property.image)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <IoHomeOutline className="text-slate-400 text-sm" />
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 max-w-[150px] truncate">
                          {tx.property.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      {tx.provider === "STRIPE" ? <StripeLogo /> : <span className="text-xs text-slate-500">{tx.provider}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-indigo-50 dark:border-indigo-900/30 px-4 py-3">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {/* Bottom Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/40 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Calendrier des paiements</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Règlements automatisés toutes les 48h</p>
            </div>
            <IoTimeOutline className="text-indigo-500 text-2xl" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-semibold">Prochain règlement</span>
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Demain, 09:00</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl opacity-70">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <span className="text-xs font-semibold">Dernier règlement</span>
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Hier, 09:00</span>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-lg font-bold">Sécurité des transactions</h4>
              <p className="text-white/70 text-sm">Conformité Stripe Connect</p>
            </div>
            <IoCheckmarkCircleOutline className="text-white text-2xl" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 text-center p-3 bg-white/10 rounded-xl">
              <p className="text-2xl font-bold">100%</p>
              <p className="text-[10px] font-bold uppercase tracking-wider">Paiements sécurisés</p>
            </div>
            <div className="flex-1 text-center p-3 bg-white/10 rounded-xl">
              <p className="text-2xl font-bold">0.02%</p>
              <p className="text-[10px] font-bold uppercase tracking-wider">Taux de fraude</p>
            </div>
          </div>
          <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all">
            Exécuter audit de sécurité
          </button>
        </div>
      </div>
    </div>
  );
}