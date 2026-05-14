// app/[locale]/dashboard/tenant/wallet/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  IoTimeOutline,
  IoRefreshOutline,
  IoCloseOutline,
  IoAlertCircleOutline,
  IoReceiptOutline,
  IoCalendarOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoSwapHorizontalOutline,
  IoShieldCheckmark,
  IoCashOutline,
  IoCheckmarkDoneOutline,
} from "react-icons/io5";
import { TenantHeader } from "@/components/ui/header/TenantHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// ─── Gradient constants (same as other pages) ─────────────────────────────────
const GRADIENT_BUTTON = `
  bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 
  hover:from-sky-600 hover:via-indigo-600 hover:to-purple-700
  text-white shadow-md hover:shadow-lg 
  transition-all duration-300
`;

const GRADIENT_TEXT = "bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent";

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

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePictureUrl?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtPrice(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TND";
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
    ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
    : "text-gray-900 dark:text-white font-extrabold";
}

function txSign(type: string) {
  return type === "REFUND" ? "+" : "−";
}

const depositStatusCfg: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  AUTHORIZED: { label: "Autorisée", dot: "bg-amber-400", text: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800" },
  CHARGED: { label: "Prélevée", dot: "bg-rose-500", text: "text-rose-700 dark:text-rose-300", bg: "bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800" },
  RELEASED: { label: "Libérée", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800" },
  DISPUTED: { label: "Litige", dot: "bg-red-500 animate-pulse", text: "text-red-700 dark:text-red-300", bg: "bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800" },
};

const txStatusCfg: Record<string, { label: string; color: string }> = {
  COMPLETED: { label: "Terminé", color: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800" },
  PENDING: { label: "En attente", color: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800" },
  FAILED: { label: "Échoué", color: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800" },
  REFUNDED: { label: "Remboursé", color: "text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800" },
};

// ─── Mesh background ──────────────────────────────────────────────────────────
function MeshBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      <div className="absolute -top-[40%] -right-[20%] w-[80vw] h-[80vw] rounded-full opacity-[0.08] dark:opacity-[0.05] blur-[120px]"
        style={{ background: "radial-gradient(circle, #6366f1 0%, #8b5cf6 40%, #0ea5e9 100%)" }} />
      <div className="absolute -bottom-[30%] -left-[20%] w-[70vw] h-[70vw] rounded-full opacity-[0.07] dark:opacity-[0.04] blur-[100px]"
        style={{ background: "radial-gradient(circle, #7c3aed 0%, #6366f1 50%, #a78bfa 100%)" }} />
      <div className="absolute top-[20%] left-[30%] w-[50vw] h-[50vw] rounded-full opacity-[0.05] dark:opacity-[0.03] blur-[80px]"
        style={{ background: "radial-gradient(circle, #0ea5e9 0%, #8b5cf6 60%)" }} />
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "128px 128px" }} />
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-20 right-6 z-[110] flex items-center gap-3 pl-4 pr-3 py-3.5 rounded-2xl text-xs font-bold shadow-2xl border backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300 ${
      type === "success"
        ? "bg-emerald-50/95 dark:bg-emerald-950/95 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 shadow-emerald-500/10"
        : "bg-rose-50/95 dark:bg-rose-950/95 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 shadow-rose-500/10"
    }`}>
      {type === "success" ? <IoCheckmarkCircleOutline className="text-lg text-emerald-600 dark:text-emerald-400 flex-shrink-0" /> : <IoAlertCircleOutline className="text-lg text-rose-600 dark:text-rose-400 flex-shrink-0" />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
        <IoCloseOutline className="text-base" />
      </button>
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [txTab, setTxTab] = useState<"all" | "payments" | "refunds">("all");
  const [showAllTx, setShowAllTx] = useState(false);
  
  // Modals state
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  
  // Recharge modal form
  const [rechargeAmount, setRechargeAmount] = useState<number>(200);
  const [rechargeMethod, setRechargeMethod] = useState<string>("card_main");
  const [isProcessingTx, setIsProcessingTx] = useState(false);
  
  // Withdraw modal form
  const [withdrawAmount, setWithdrawAmount] = useState<number>(150);
  const [bankAccount, setBankAccount] = useState<string>("STB •••• 5542");

  const showToast = (message: string, type: "success" | "error") => setToast({ message, type });

  const fetchWalletData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch("/api/stripe/wallet", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance || { available: 0, pending: 0, totalSpent: 0 });
        setDeposits(data.securityDeposits || []);
        setUpcomingPayments(data.upcomingPayments || []);
        setTransactions(data.transactions || []);
        setPaymentMethods(data.paymentMethods || []);
      }
      
      // Fetch user profile
      const profileRes = await fetch("/api/users/me", { headers: { Authorization: `Bearer ${token}` } });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData.user || profileData);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  // ─── Actions handlers ────────────────────────────────────────────────────────
  const handleAddPaymentMethod = async () => {
    setProcessing(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch("/api/stripe/create-setup-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { clientSecret } = await res.json();
        window.location.href = `/fr/stripe/setup?client_secret=${clientSecret}`;
      } else {
        showToast("Erreur lors de l'ajout de la carte", "error");
      }
    } catch {
      showToast("Erreur de connexion", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleSetDefaultCard = async (id: string) => {
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch("/api/stripe/set-default-payment-method", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentMethodId: id }),
      });
      if (res.ok) {
        showToast("Carte par défaut mise à jour", "success");
        fetchWalletData();
      }
    } catch {
      showToast("Erreur lors de la mise à jour", "error");
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm("Supprimer cette carte ?")) return;
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch("/api/stripe/detach-payment-method", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentMethodId: id }),
      });
      if (res.ok) {
        showToast("Carte supprimée", "success");
        fetchWalletData();
      }
    } catch {
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const handleSimulateRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rechargeAmount <= 0) {
      showToast("Veuillez saisir un montant valide", "error");
      return;
    }

    setIsProcessingTx(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: rechargeAmount, currency: "tnd" }),
      });
      
      if (res.ok) {
        const { clientSecret } = await res.json();
        window.location.href = `/fr/stripe/payment?client_secret=${clientSecret}&amount=${rechargeAmount}`;
      } else {
        showToast("Erreur lors de la recharge", "error");
        setIsProcessingTx(false);
        setShowRechargeModal(false);
      }
    } catch {
      showToast("Erreur de connexion", "error");
      setIsProcessingTx(false);
      setShowRechargeModal(false);
    }
  };

  const handleSimulateWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount <= 0 || withdrawAmount > balance.available) {
      showToast("Solde disponible insuffisant pour ce retrait", "error");
      return;
    }

    setIsProcessingTx(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch("/api/stripe/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: withdrawAmount, bankAccount }),
      });
      
      if (res.ok) {
        showToast(`Demande de virement de ${fmtPrice(withdrawAmount)} en cours de traitement.`, "success");
        fetchWalletData();
        setShowWithdrawModal(false);
      } else {
        showToast("Erreur lors du retrait", "error");
      }
    } catch {
      showToast("Erreur de connexion", "error");
    } finally {
      setIsProcessingTx(false);
    }
  };

  const handlePayUpcoming = async (paymentId: string) => {
    const payment = upcomingPayments.find(p => p.id === paymentId);
    if (!payment) return;

    if (balance.available < payment.amount) {
      showToast("Solde insuffisant pour régler cette échéance. Veuillez recharger votre compte.", "error");
      return;
    }

    if (!confirm(`Régler l'échéance de ${fmtPrice(payment.amount)} avec votre solde portefeuille ?`)) return;

    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch("/api/stripe/pay-upcoming", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentId }),
      });
      
      if (res.ok) {
        showToast("Échéance payée avec succès !", "success");
        fetchWalletData();
      } else {
        showToast("Erreur lors du paiement", "error");
      }
    } catch {
      showToast("Erreur de connexion", "error");
    }
  };

  // ─── Filtered Transactions ──────────────────────────────────────────────────
  const filteredTx = useMemo(() => {
    return transactions.filter(t => {
      if (txTab === "payments") return t.type === "PAYMENT" || t.type === "DEPOSIT";
      if (txTab === "refunds") return t.type === "REFUND";
      return true;
    });
  }, [transactions, txTab]);

  const displayedTx = showAllTx ? filteredTx : filteredTx.slice(0, 6);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <MeshBackground />
        <TenantHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-73px)]">
          <div className="flex flex-col items-center justify-center gap-4">
            <LoadingSpinner className="w-12 h-12" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Chargement de votre portefeuille…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 text-gray-900 dark:text-white transition-colors duration-200">
      <MeshBackground />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <TenantHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-28">

        {/* ── Header with badge (same style as other pages) ── */}
        <div className="mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-indigo-600 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/70 dark:text-indigo-300">
            <IoWalletOutline className="h-3.5 w-3.5 fill-indigo-600 text-indigo-600 dark:fill-indigo-300 dark:text-indigo-300" />
            GESTION FINANCIÈRE
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-6xl">
            Votre <span className={GRADIENT_TEXT}>Portefeuille</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400 md:text-base">
            Consultez vos soldes, libérez vos cautions et gérez vos prélèvements automatiques en toute sérénité.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ══ LEFT COLUMN ═══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-4 space-y-6">

            {/* Balance hero card */}
            <div className="relative overflow-hidden rounded-2xl shadow-xl shadow-indigo-500/15">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />
              <div className="absolute inset-0 opacity-[0.08]"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` }} />
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />

              <div className="relative p-7">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-[10px] font-black uppercase tracking-[.25em] text-white/70">Solde disponible</span>
                  <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-inner">
                    <IoShieldCheckmark className="text-emerald-400 text-xs" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white">Stripe Verified</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none">{fmtPrice(balance.available)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/50 mb-0.5">En attente de retrait</p>
                    <p className="text-base font-extrabold text-white">{fmtPrice(balance.pending)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/50 mb-0.5">Total dépensé</p>
                    <p className="text-base font-extrabold text-white">{fmtPrice(balance.totalSpent)}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowRechargeModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-indigo-700 rounded-xl text-xs font-extrabold shadow-lg hover:bg-white/90 active:scale-95 transition-all"
                  >
                    <IoAddOutline className="text-base" /> Recharger
                  </button>
                  <button 
                    onClick={() => setShowWithdrawModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold border border-white/20 transition-all active:scale-95"
                  >
                    <IoSwapHorizontalOutline className="text-base" /> Retirer
                  </button>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <IoReceiptOutline />, label: "Transactions", value: transactions.length, color: "sky" },
                { icon: <IoLockClosedOutline />, label: "Cautions Actives", value: deposits.filter(d => d.status === "AUTHORIZED").length, color: "amber" },
              ].map(({ icon, label, value, color }) => {
                const styles: Record<string, string> = {
                  sky: "bg-sky-50/70 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60 text-sky-600 dark:text-sky-400",
                  amber: "bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400",
                };
                return (
                  <div key={label} className={`flex items-center gap-3.5 p-4 rounded-xl border backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 shadow-sm ${styles[color]}`}>
                    <span className="text-xl p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs flex-shrink-0">{icon}</span>
                    <div>
                      <p className="text-xl font-extrabold text-gray-900 dark:text-white leading-none">{value}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-1">{label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Security deposits */}
            {deposits.length > 0 && (
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl border border-white/70 dark:border-gray-800 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <IoLockClosedOutline className="text-amber-500 text-base" />
                    <p className="text-xs font-extrabold uppercase tracking-widest text-gray-700 dark:text-gray-300">Cautions locatives</p>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full">
                    Gérées par Stripe
                  </span>
                </div>
                <div className="space-y-3">
                  {deposits.map((d) => {
                    const cfg = depositStatusCfg[d.status] ?? depositStatusCfg.AUTHORIZED;
                    return (
                      <div key={d.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/60">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[180px]" title={d.listingTitle}>
                            {d.listingTitle}
                          </p>
                          <p className="text-sm font-black text-gray-900 dark:text-white flex-shrink-0">{fmtPrice(d.amount)}</p>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                          {d.releaseDate && (
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                              <IoCalendarOutline className="text-violet-500 text-xs" />
                              Libération : {format(new Date(d.releaseDate), "dd MMM yyyy", { locale: fr })}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Payment methods */}
            {paymentMethods.length > 0 && (
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl border border-white/70 dark:border-gray-800 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-gray-700 dark:text-gray-300">Moyens de paiement</p>
                  <button
                    onClick={handleAddPaymentMethod}
                    disabled={processing}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <IoAddOutline className="text-xs" /> Ajouter
                  </button>
                </div>
                <div className="space-y-2.5">
                  {paymentMethods.slice(0, 2).map((m) => (
                    <div key={m.id} className={`flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border ${m.isDefault ? "border-indigo-200 dark:border-indigo-800" : "border-gray-100 dark:border-slate-700/60"}`}>
                      <div className="flex items-center gap-3">
                        <CardBrand brand={m.brand} />
                        <div>
                          <p className="text-xs font-mono font-bold text-gray-900 dark:text-white">•••• {m.last4}</p>
                          <p className="text-[9px] text-gray-400">Expire {String(m.expiryMonth).padStart(2, "0")}/{m.expiryYear}</p>
                        </div>
                      </div>
                      {m.isDefault && (
                        <span className="text-[8px] font-bold uppercase bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">Défaut</span>
                      )}
                    </div>
                  ))}
                  {paymentMethods.length > 2 && (
                    <p className="text-[9px] text-center text-gray-400 pt-2">+{paymentMethods.length - 2} autre(s) carte(s)</p>
                  )}
                </div>
              </div>
            )}

            {/* Security badge */}
            <div className="relative overflow-hidden rounded-xl shadow-md">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700" />
              <div className="relative p-6 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <IoShieldCheckmark className="text-emerald-300 text-xl" />
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-100">Protection Bancaire 3D Secure</p>
                </div>
                <p className="text-xs text-white/90 leading-relaxed mb-4 font-medium">
                  Vos transactions et informations de paiement sont chiffrées de bout en bout et certifiées conformes aux normes bancaires internationales PCI DSS Level 1.
                </p>
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-200 border-t border-white/20 pt-3">
                  <span>Audit de sécurité continu</span>
                  <IoCheckmarkDoneOutline className="text-base text-white" />
                </div>
              </div>
            </div>

          </div>

          {/* ══ RIGHT COLUMN ══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-8 space-y-8">

            {/* Upcoming payments */}
            {upcomingPayments.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold shadow-xs">
                      <IoTimeOutline className="text-lg" />
                    </div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">Échéances à régler</h2>
                  </div>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    {upcomingPayments.length} prélèvement(s) en attente
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {upcomingPayments.map((p) => (
                    <div key={p.id} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl border border-white/70 dark:border-gray-800 p-5 hover:border-violet-300 dark:hover:border-violet-700 transition-all shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center flex-shrink-0 shadow-xs">
                            <IoRepeatOutline className="text-indigo-600 dark:text-indigo-400 text-base" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-extrabold text-gray-900 dark:text-white truncate" title={p.description}>{p.description}</p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5" title={p.listingTitle}>{p.listingTitle}</p>
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-gray-100 dark:border-slate-700/60 flex items-center justify-between mb-4">
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Prélèvement le</p>
                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-0.5">{format(new Date(p.dueDate), "dd MMMM yyyy", { locale: fr })}</p>
                          </div>
                          <p className="text-lg font-black bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">{fmtPrice(p.amount)}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handlePayUpcoming(p.id)}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold text-white ${GRADIENT_BUTTON} shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5`}
                      >
                        <IoCashOutline className="text-sm" />
                        <span>Régler avec le solde</span>
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Transactions History */}
            <section>
              <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold shadow-xs">
                    <IoReceiptOutline className="text-lg" />
                  </div>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white">Historique des mouvements</h2>
                </div>

                <div className="flex gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
                  {([
                    { key: "all", label: "Tout afficher" },
                    { key: "payments", label: "Recharges & Prélèvements" },
                    { key: "refunds", label: "Remboursements" },
                  ] as const).map(({ key, label }) => (
                    <button key={key} onClick={() => setTxTab(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        txTab === key
                          ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl border border-white/70 dark:border-gray-800 overflow-hidden shadow-sm">
                {displayedTx.length === 0 ? (
                  <div className="py-16 text-center px-4">
                    <IoReceiptOutline className="text-4xl text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">Aucune transaction trouvée</p>
                    <p className="text-xs text-gray-400">Modifiez votre filtre pour explorer les autres mouvements financiers.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800/80">
                    {displayedTx.map((tx) => {
                      const cfg = txStatusCfg[tx.status] ?? txStatusCfg.COMPLETED;
                      return (
                        <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors gap-4">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-lg shadow-inner">
                              {txIcon(tx.type)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate max-w-[280px] sm:max-w-md">{tx.description}</p>
                              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                                {format(new Date(tx.date), "dd MMMM yyyy", { locale: fr })} · Réf: {tx.reference}
                              </p>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className={`text-sm sm:text-base ${txAmountColor(tx.type)}`}>
                              {txSign(tx.type)} {fmtPrice(Math.abs(tx.amount))}
                            </p>
                            <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full mt-1 ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {filteredTx.length > 6 && (
                  <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-gray-100 dark:border-gray-800 text-center">
                    <button 
                      onClick={() => setShowAllTx(!showAllTx)}
                      className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {showAllTx ? "Réduire la liste des transactions" : `Afficher les ${filteredTx.length - 6} transactions antérieures`}
                    </button>
                  </div>
                )}
              </div>
            </section>

          </div>

        </div>

      </main>

      {/* ─── MODAL 1 : RECHARGE FUNDS ──────────────────────────────────────────────── */}
      {showRechargeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 dark:border-slate-800 p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-xs">
                  <IoAddOutline className="text-xl" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight">
                    Recharger le portefeuille
                  </h2>
                  <p className="text-xs text-gray-400">Transfert immédiat via Stripe</p>
                </div>
              </div>
              <button 
                onClick={() => setShowRechargeModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-colors"
              >
                <IoCloseOutline className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSimulateRecharge} className="space-y-5">
              <div>
                <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-2">
                  Montant à créditer (TND)
                </label>
                <div className="grid grid-cols-3 gap-2.5 mb-3">
                  {[100, 200, 500].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setRechargeAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        rechargeAmount === amt 
                          ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 font-extrabold"
                          : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700"
                      }`}
                    >
                      +{amt} TND
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-base font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                    placeholder="Montant libre"
                    min="10"
                    max="10000"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">TND</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-2">
                  Méthode de dépôt
                </label>
                <select
                  value={rechargeMethod}
                  onChange={(e) => setRechargeMethod(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="card_main">Carte Bancaire Principale (Stripe 3D Secure)</option>
                  <option value="bank_transfer">Virement Bancaire Instantané</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700/60 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                ℹ️ Les recharges sont traitées instantanément et protégées par la garantie de paiement Stripe 3D Secure.
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRechargeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isProcessingTx}
                  className="px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isProcessingTx ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Traitement Stripe...</span>
                    </>
                  ) : (
                    <span>Confirmer la recharge</span>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ─── MODAL 2 : WITHDRAW FUNDS ─────────────────────────────────────────────── */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 dark:border-slate-800 p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold shadow-xs">
                  <IoSwapHorizontalOutline className="text-xl" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight">
                    Retrait vers compte bancaire
                  </h2>
                  <p className="text-xs text-gray-400">Virement SEPA / IBAN sous 48h</p>
                </div>
              </div>
              <button 
                onClick={() => setShowWithdrawModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-colors"
              >
                <IoCloseOutline className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSimulateWithdraw} className="space-y-5">
              <div>
                <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-2">
                  Montant à retirer (TND)
                </label>
                <div className="relative mb-2">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-base font-bold text-gray-900 dark:text-white outline-none focus:border-violet-500"
                    placeholder="Montant à virer"
                    max={balance.available}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">TND</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold px-1">
                  <span>Solde disponible : {fmtPrice(balance.available)}</span>
                  <button 
                    type="button" 
                    onClick={() => setWithdrawAmount(balance.available)}
                    className="text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    Tout retirer
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-2">
                  Compte bancaire de destination
                </label>
                <select
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold text-gray-800 dark:text-gray-200 outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="STB •••• 5542">Société Tunisienne de Banque (STB) - TN59 •••• 5542</option>
                  <option value="BIAT •••• 1092">Banque Internationale Arabe de Tunisie (BIAT) - TN59 •••• 1092</option>
                  <option value="Attijari •••• 9912">Attijari Bank - TN59 •••• 9912</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
                ⚠️ Les virements sortants nécessitent l'approbation du service de sécurité et prennent 1 à 2 jours ouvrés pour apparaître sur votre compte bancaire.
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isProcessingTx}
                  className="px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-violet-600 hover:bg-violet-700 shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isProcessingTx ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <span>Valider le virement</span>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}