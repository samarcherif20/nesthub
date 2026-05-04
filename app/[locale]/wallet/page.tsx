// app/[locale]/dashboard/tenant/wallet/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  IoWalletOutline,
  IoLockClosedOutline,
  IoRepeatOutline,
  IoAddOutline,
  IoCheckmarkCircleOutline,
  IoArrowForwardOutline,
  IoShieldCheckmarkOutline,
  IoCardOutline,
  IoChevronForwardOutline,
  IoTimeOutline,
  IoRefreshOutline,
  IoCloseOutline,
  IoAlertCircleOutline,
  IoTrendingUpOutline,
  IoReceiptOutline,
  IoEllipsisHorizontalOutline,
  IoStarOutline,
  IoCalendarOutline,
  IoCheckmarkDoneOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoInformationCircleOutline,
  IoSwapHorizontalOutline,
} from "react-icons/io5";
import { TenantHeader } from "@/components/ui/header/TenantHeader";

// ─── Types ────────────────────────────────────────────────────────────────────
interface WalletBalance {
  available: number;
  pending: number;
  totalSpent: number;
}

interface SecurityDeposit {
  id: string;
  amount: number;
  status: "AUTHORIZED" | "CHARGED" | "RELEASED" | "DISPUTED";
  releaseDate: string | null;
  listingTitle: string;
  checkOutDate: string;
}

interface UpcomingPayment {
  id: string;
  type: "RENT" | "CHARGES" | "SERVICE";
  amount: number;
  dueDate: string;
  description: string;
  listingTitle: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: "PAYMENT" | "REFUND" | "DEPOSIT" | "WITHDRAWAL";
  status: "COMPLETED" | "PENDING" | "FAILED" | "REFUNDED";
  description: string;
  date: string;
  reference: string;
  stripePaymentIntentId?: string;
}

interface PaymentMethod {
  id: string;
  type: "card";
  brand: string;
  last4: string;
  isDefault: boolean;
  expiryMonth: number;
  expiryYear: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtPrice(n: number) {
  return n.toLocaleString("fr-FR") + " TND";
}

function txIcon(type: string) {
  switch (type) {
    case "REFUND": return <IoRefreshOutline className="text-emerald-500" />;
    case "DEPOSIT": return <IoLockClosedOutline className="text-amber-500" />;
    case "WITHDRAWAL": return <IoArrowUpOutline className="text-rose-500" />;
    default: return <IoArrowDownOutline className="text-indigo-500" />;
  }
}

function txAmountColor(type: string) {
  return type === "REFUND" || type === "WITHDRAWAL"
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-gray-900 dark:text-white";
}

function txSign(type: string) {
  return type === "REFUND" ? "+" : "−";
}

const depositStatusCfg: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  AUTHORIZED: { label: "Autorisée", dot: "bg-amber-400", text: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-900/20" },
  CHARGED: { label: "Prélevée", dot: "bg-rose-500", text: "text-rose-700 dark:text-rose-300", bg: "bg-rose-50 dark:bg-rose-900/20" },
  RELEASED: { label: "Libérée", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  DISPUTED: { label: "Litige", dot: "bg-red-500 animate-pulse", text: "text-red-700 dark:text-red-300", bg: "bg-red-50 dark:bg-red-900/20" },
};

const txStatusCfg: Record<string, { label: string; color: string }> = {
  COMPLETED: { label: "Terminé", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" },
  PENDING: { label: "En attente", color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20" },
  FAILED: { label: "Échoué", color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20" },
  REFUNDED: { label: "Remboursé", color: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20" },
};

// ─── Mesh background ──────────────────────────────────────────────────────────
function MeshBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      <div className="absolute -top-[40%] -right-[20%] w-[80vw] h-[80vw] rounded-full opacity-[0.07] dark:opacity-[0.04] blur-[120px]"
        style={{ background: "radial-gradient(circle, #6366f1 0%, #8b5cf6 40%, #0ea5e9 100%)" }} />
      <div className="absolute -bottom-[30%] -left-[20%] w-[70vw] h-[70vw] rounded-full opacity-[0.06] dark:opacity-[0.03] blur-[100px]"
        style={{ background: "radial-gradient(circle, #7c3aed 0%, #6366f1 50%, #a78bfa 100%)" }} />
      <div className="absolute top-[20%] left-[30%] w-[50vw] h-[50vw] rounded-full opacity-[0.04] dark:opacity-[0.02] blur-[80px]"
        style={{ background: "radial-gradient(circle, #0ea5e9 0%, #8b5cf6 60%)" }} />
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "128px 128px" }} />
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-20 right-4 z-[80] flex items-center gap-2.5 pl-4 pr-3 py-3 rounded-2xl text-sm font-medium shadow-xl border backdrop-blur-sm ${
      type === "success"
        ? "bg-emerald-50/90 dark:bg-emerald-900/80 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 shadow-emerald-500/10"
        : "bg-rose-50/90 dark:bg-rose-900/80 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 shadow-rose-500/10"
    }`}>
      {type === "success" ? <IoCheckmarkCircleOutline className="text-lg" /> : <IoAlertCircleOutline className="text-lg" />}
      {message}
      <button onClick={onClose} className="ml-1 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><IoCloseOutline className="text-sm" /></button>
    </div>
  );
}

// ─── Card brand display ───────────────────────────────────────────────────────
function CardBrand({ brand }: { brand: string }) {
  const colors: Record<string, string> = {
    visa: "from-blue-600 to-blue-800",
    mastercard: "from-red-500 to-orange-600",
    amex: "from-green-600 to-teal-700",
  };
  const g = colors[brand.toLowerCase()] ?? "from-gray-700 to-gray-900";
  return (
    <div className={`w-11 h-7 rounded-md bg-gradient-to-br ${g} flex items-center justify-center shadow-sm`}>
      <span className="text-[8px] font-bold text-white uppercase tracking-wider">{brand.slice(0, 4)}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function TenantWalletPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<WalletBalance>({ available: 0, pending: 0, totalSpent: 0 });
  const [deposits, setDeposits] = useState<SecurityDeposit[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [txTab, setTxTab] = useState<"all" | "payments" | "refunds">("all");
  const [showAllTx, setShowAllTx] = useState(false);

  const showToast = (message: string, type: "success" | "error") => setToast({ message, type });

  const fetchWalletData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch("/api/stripe/wallet", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
        setDeposits(data.securityDeposits || []);
        setUpcomingPayments(data.upcomingPayments || []);
        setTransactions(data.transactions || []);
        setPaymentMethods(data.paymentMethods || []);
      }
    } catch { } finally { setLoading(false); }
  }, [getToken]);

  useEffect(() => { fetchWalletData(); }, [fetchWalletData]);

  const handleAddPaymentMethod = async () => {
    setProcessing(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch("/api/stripe/create-setup-intent", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } });
      if (res.ok) { const { clientSecret } = await res.json(); window.location.href = `/fr/stripe/setup?client_secret=${clientSecret}`; }
      else showToast("Erreur lors de l'ajout de la carte", "error");
    } catch { showToast("Erreur de connexion", "error"); } finally { setProcessing(false); }
  };

  const handleSetDefaultCard = async (id: string) => {
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch("/api/stripe/set-default-payment-method", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ paymentMethodId: id }) });
      if (res.ok) { showToast("Carte par défaut mise à jour", "success"); fetchWalletData(); }
    } catch { showToast("Erreur lors de la mise à jour", "error"); }
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm("Supprimer cette carte ?")) return;
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch("/api/stripe/detach-payment-method", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ paymentMethodId: id }) });
      if (res.ok) { showToast("Carte supprimée", "success"); fetchWalletData(); }
    } catch { showToast("Erreur lors de la suppression", "error"); }
  };

  const filteredTx = transactions.filter(t => {
    if (txTab === "payments") return t.type === "PAYMENT" || t.type === "DEPOSIT";
    if (txTab === "refunds") return t.type === "REFUND";
    return true;
  });
  const displayedTx = showAllTx ? filteredTx : filteredTx.slice(0, 6);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f5ff] dark:bg-[#0a0a1a]">
        <MeshBackground />
        <TenantHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 animate-pulse mx-auto shadow-lg shadow-violet-500/20" />
            <p className="text-xs font-bold uppercase tracking-[.25em] text-indigo-400 dark:text-indigo-500">Chargement…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f5ff] dark:bg-[#0a0a1a] text-gray-900 dark:text-white transition-colors">
      <MeshBackground />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <TenantHeader />

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .fu{animation:fadeUp .5s cubic-bezier(.22,1,.36,1) both}
        .d1{animation-delay:.06s}.d2{animation-delay:.12s}.d3{animation-delay:.18s}
        .d4{animation-delay:.24s}.d5{animation-delay:.3s}
      `}</style>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-28">

        {/* ── Header ── */}
        <div className="mb-8 fu">
          
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Votre{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
              Portefeuille
            </span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gérez vos transactions et méthodes de paiement — sécurisé par Stripe
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">

          {/* ══ LEFT ═══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-4 space-y-5">

            {/* Balance hero card */}
            <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-violet-500/15 fu d1">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-700" />
              {/* Crosshatch */}
              <div className="absolute inset-0 opacity-[0.07]"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` }} />
              {/* Glow orb */}
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />

              <div className="relative p-6">
                {/* Stripe badge */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[9px] font-bold uppercase tracking-[.22em] text-white/50">Solde disponible</span>
                  <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
                    <IoShieldCheckmarkOutline className="text-white/60 text-xs" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">Stripe</span>
                  </div>
                </div>

                {/* Main balance */}
                <div className="mb-2">
                  <p className="text-4xl font-black text-white tracking-tight leading-none">{fmtPrice(balance.available)}</p>
                </div>

                {/* Sub balances */}
                <div className="flex gap-4 mb-6">
                  <div>
                    <p className="text-[8px] uppercase tracking-widest text-white/35">En attente</p>
                    <p className="text-sm font-semibold text-white/60">{fmtPrice(balance.pending)}</p>
                  </div>
                  <div className="w-px bg-white/10" />
                  <div>
                    <p className="text-[8px] uppercase tracking-widest text-white/35">Total dépensé</p>
                    <p className="text-sm font-semibold text-white/60">{fmtPrice(balance.totalSpent)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2.5">
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white text-indigo-600 rounded-xl text-xs font-bold shadow-lg hover:bg-white/90 active:scale-[.97] transition-all">
                    <IoAddOutline className="text-sm" /> Recharger
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white/10 hover:bg-white/15 text-white/70 rounded-xl text-xs font-medium border border-white/10 transition-colors cursor-not-allowed">
                    <IoSwapHorizontalOutline className="text-sm" /> Retirer
                  </button>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3 fu d2">
              {[
                { icon: <IoReceiptOutline />, label: "Transactions", value: transactions.length, color: "sky" },
                { icon: <IoLockClosedOutline />, label: "Cautions", value: deposits.filter(d => d.status === "AUTHORIZED").length, color: "amber" },
              ].map(({ icon, label, value, color }) => {
                const styles: Record<string, string> = {
                  sky: "bg-sky-50/60 dark:bg-sky-900/20 border-sky-100 dark:border-sky-800/30 text-sky-600 dark:text-sky-400",
                  amber: "bg-amber-50/60 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30 text-amber-600 dark:text-amber-400",
                };
                return (
                  <div key={label} className={`flex items-center gap-3 p-3.5 rounded-2xl border backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 ${styles[color]}`}>
                    <span className="text-lg flex-shrink-0">{icon}</span>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{value}</p>
                      <p className="text-[9px] uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Security deposits */}
            {deposits.length > 0 && (
              <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-gray-800 p-5 fu d3">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[9px] font-bold uppercase tracking-[.2em] text-gray-400 dark:text-gray-500">Cautions</p>
                  <IoLockClosedOutline className="text-amber-500 text-sm" />
                </div>
                <div className="space-y-2.5">
                  {deposits.map((d) => {
                    const cfg = depositStatusCfg[d.status] ?? depositStatusCfg.AUTHORIZED;
                    return (
                      <div key={d.id} className="p-3 rounded-xl bg-white/50 dark:bg-gray-800/30 border border-gray-100/50 dark:border-gray-700/30">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-[140px]">{d.listingTitle}</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{fmtPrice(d.amount)}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                          {d.releaseDate && (
                            <span className="text-[9px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                              <IoCalendarOutline className="text-[9px]" />
                              {format(new Date(d.releaseDate), "dd MMM", { locale: fr })}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Security badge */}
            <div className="relative overflow-hidden rounded-2xl fu d4">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600" />
              <div className="relative p-5">
                <div className="flex items-center gap-2 mb-2">
                  <IoShieldCheckmarkOutline className="text-white/80 text-base" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Sécurité bancaire</p>
                </div>
                <p className="text-xs text-white/60 leading-relaxed mb-3">
                  Toutes vos transactions sont chiffrées et protégées par Stripe PCI DSS Level 1.
                </p>
                <button className="flex items-center gap-1.5 text-xs font-medium text-white bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors">
                  En savoir plus <IoChevronForwardOutline className="text-xs" />
                </button>
              </div>
            </div>
          </div>

          {/* ══ RIGHT ══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-8 space-y-6">

            {/* Upcoming payments */}
            {upcomingPayments.length > 0 && (
              <section className="fu d1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <IoTimeOutline className="text-violet-500 text-base" />
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">Échéances à venir</h2>
                  </div>
                  <button className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                    Voir tout <IoChevronForwardOutline className="text-[10px]" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {upcomingPayments.map((p) => (
                    <div key={p.id} className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-gray-800 p-4 hover:border-indigo-200/60 dark:hover:border-indigo-700/40 transition-colors">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50/80 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-800/30 flex items-center justify-center flex-shrink-0">
                          <IoRepeatOutline className="text-indigo-500 dark:text-indigo-400 text-sm" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{p.description}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{p.listingTitle}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[8px] uppercase tracking-widest text-gray-400 dark:text-gray-500">Prélèvement le</p>
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{format(new Date(p.dueDate), "dd MMM yyyy", { locale: fr })}</p>
                        </div>
                        <p className="text-base font-black bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">{fmtPrice(p.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Payment methods */}
            <section className="fu d2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <IoCardOutline className="text-violet-500 text-base" />
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Méthodes de paiement</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paymentMethods.map((m) => (
                  <div key={m.id} className={`bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border p-4 transition-all ${m.isDefault ? "border-indigo-200/60 dark:border-indigo-700/40 shadow-md shadow-indigo-500/5" : "border-white/50 dark:border-gray-800"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <CardBrand brand={m.brand} />
                      {m.isDefault && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
                          Par défaut
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-mono tracking-wider text-gray-900 dark:text-white mb-0.5">
                      •••• •••• •••• {m.last4}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-3">
                      Expire {String(m.expiryMonth).padStart(2, "0")}/{m.expiryYear}
                    </p>
                    <div className="flex gap-3 pt-3 border-t border-gray-100/50 dark:border-gray-700/30">
                      {!m.isDefault && (
                        <button onClick={() => handleSetDefaultCard(m.id)} className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                          Définir par défaut
                        </button>
                      )}
                      <button onClick={() => handleDeleteCard(m.id)} className="text-[10px] font-medium text-rose-500 dark:text-rose-400 hover:underline ml-auto">
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add card */}
                <button onClick={handleAddPaymentMethod} disabled={processing}
                  className="border-2 border-dashed border-indigo-200/60 dark:border-indigo-700/40 rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-all group disabled:opacity-50">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <IoAddOutline className="text-indigo-500 dark:text-indigo-400 text-xl" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">Ajouter une carte</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">Paiements sécurisés Stripe</p>
                  </div>
                </button>
              </div>
            </section>

            {/* Transactions */}
            <section className="fu d3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <IoReceiptOutline className="text-violet-500 text-base" />
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Historique</h2>
                </div>
                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/50 dark:border-gray-800">
                  {([
                    { key: "all", label: "Tout" },
                    { key: "payments", label: "Paiements" },
                    { key: "refunds", label: "Remboursements" },
                  ] as const).map(({ key, label }) => (
                    <button key={key} onClick={() => setTxTab(key)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        txTab === key
                          ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-gray-800 overflow-hidden">
                {displayedTx.length === 0 ? (
                  <div className="py-12 text-center">
                    <IoReceiptOutline className="text-3xl text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">Aucune transaction</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100/50 dark:divide-gray-800">
                    {displayedTx.map((tx, i) => {
                      const cfg = txStatusCfg[tx.status] ?? txStatusCfg.COMPLETED;
                      return (
                        <div key={tx.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/40 dark:hover:bg-gray-800/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 flex items-center justify-center flex-shrink-0 text-base">
                              {txIcon(tx.type)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[220px]">{tx.description}</p>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                {format(new Date(tx.date), "dd MMM yyyy", { locale: fr })} · {tx.reference}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`text-sm font-bold ${txAmountColor(tx.type)}`}>
                              {txSign(tx.type)} {fmtPrice(Math.abs(tx.amount))}
                            </p>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {filteredTx.length > 6 && (
                  <div className="px-5 py-3 border-t border-gray-100/50 dark:border-gray-800">
                    <button onClick={() => setShowAllTx(!showAllTx)}
                      className="w-full text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline text-center">
                      {showAllTx ? "Voir moins" : `Voir ${filteredTx.length - 6} de plus`}
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}