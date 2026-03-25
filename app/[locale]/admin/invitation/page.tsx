"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { decodeJWT } from "@/lib/utils/jwt";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Alert from "@/components/ui/Alert";
import Pagination from "@/components/ui/Pagination";
import { Loader2 } from "lucide-react";
import { IoDocumentTextOutline, IoFilterOutline } from "react-icons/io5";
// En haut du fichier, ajoutez useAuth dans l'import
import {  useAuth } from "@clerk/nextjs";
import {
  IoMailOutline, IoKeyOutline, IoInformationCircleOutline,
  IoLinkOutline, IoCloseCircleOutline, IoRefreshOutline,
  IoLockClosedOutline, IoPersonAddOutline, IoTimerOutline,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";
import { MdOutlineTimer, MdOutlineCheckCircle, MdOutlineDangerous } from "react-icons/md";
import { BsClockHistory } from "react-icons/bs";
import { FiInbox } from "react-icons/fi";
import { useInvitations ,Invitation} from "./hooks/useInvitations";

// ─── Shadows ─────────────────────────────────────────────────
const block3d = "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";
const card3d  = "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

const roleOptions = [
  "User Management","Content Moderation","System Infrastructure",
  "Super-Admin (Full Access)","Support Tier 1",
];

const getTimeRemaining = (expiresAt: string) => {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { hours: 0, minutes: 0, expired: true, pct: 0 };
  const hours   = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return { hours, minutes, expired: false, pct: Math.min(100, (hours / 48) * 100) };
};

const getInitials  = (e: string) => e.substring(0, 2).toUpperCase();
const getAvatarCls = (email: string) => {
  const list = [
    "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
    "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
    "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    "bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-300",
  ];
  return list[email.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % list.length];
};

export default function AdminInvitationsPage() {
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const {
    invitations,
    stats,
    pagination,
    submitting,
    fetchInvitations,
    createInvitation,
    copyLink,
    revokeInvitation,
    resendInvitation,
  } = useInvitations();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("User Management");
  const [alertState, setAlertState] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false });
  const [emailError, setEmailError] = useState<string | undefined>();

  const showAlert = (type: "success" | "error", msg: string) => setAlertState({ type, message: msg });
  const closeAlert = () => setAlertState(null);

  useEffect(() => {
    const check = async () => {
      if (!isUserLoaded || !clerkUser) { setIsAdmin(false); return; }
      try {
        const tok = await getToken({ template: "my-app-template" });
        if (!tok) { setIsAdmin(false); return; }
        setIsAdmin(decodeJWT(tok)?.role === "ADMIN");
      } catch { setIsAdmin(false); }
    };
    check();
  }, [isUserLoaded, clerkUser, getToken]);

  useEffect(() => { 
    if (isAdmin === false) router.push("/"); 
  }, [isAdmin, router]);

  useEffect(() => {
    if (isAdmin) { 
      fetchInvitations(); 
      setLoading(false); 
    }
  }, [isAdmin]);

  const validateEmail = (v: string) => {
    if (!v.trim()) return "L'email est requis";
    if (!v.includes("@") || !v.includes(".")) return "Email invalide";
    return undefined;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setEmail(v);
    if (touched.email) setEmailError(validateEmail(v));
  };

  const handleBlur = () => {
    setTouched({ email: true });
    setEmailError(validateEmail(email));
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true });
    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;
    
    try {
      await createInvitation(email, role);
      showAlert("success", `Invitation envoyée à ${email} ✓`);
      setEmail("");
      setRole("User Management");
      setTouched({ email: false });
      setEmailError(undefined);
    } catch (err: any) {
      showAlert("error", err.message);
    }
  };

  const handleCopyLink = async (token: string) => {
    await copyLink(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeInvitation(id);
      showAlert("success", "Invitation révoquée");
    } catch {
      showAlert("error", "Erreur lors de la révocation");
    }
  };

  const handleResend = async (invEmail: string, invRole: string) => {
    try {
      await resendInvitation(invEmail, invRole);
      showAlert("success", `Invitation renvoyée à ${invEmail} ✓`);
    } catch (err: any) {
      showAlert("error", err.message);
    }
  };

  // ─── Guards ──────────────────────────────────────────────────
  if (!isUserLoaded || isAdmin === null || loading)
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  if (isAdmin === false)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-10 bg-white dark:bg-slate-900 rounded-2xl shadow-lg">
          <IoLockClosedOutline className="text-6xl text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-2">Accès non autorisé</h1>
        </div>
      </div>
    );

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">

      {alertState && (
        <div className="fixed top-5 right-5 z-[60] w-full max-w-sm">
          <Alert type={alertState.type} message={alertState.message} onClose={closeAlert} autoClose={4000} />
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="flex-shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gestion des invitations</h2>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">
            Invitez de nouveaux administrateurs — liens sécurisés valides 48h
          </p>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-shrink-0 xl:items-stretch">

        {/* ── LEFT: form + stats ── */}
        <section className="xl:col-span-1 flex flex-col gap-4">

          {/* Form card */}
          <div className={`flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-violet-100 dark:border-violet-900/40 overflow-hidden flex flex-col ${block3d}`}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-violet-50 dark:border-violet-900/30 bg-gradient-to-r from-violet-50/60 to-indigo-50/60 dark:from-violet-900/10 dark:to-indigo-900/10">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
                <IoPersonAddOutline className="text-white text-base" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-violet-900 dark:text-violet-100 leading-tight">Inviter un administrateur</h3>
                <p className="text-[11px] text-primary dark:text-white">Lien sécurisé · expire dans 48h</p>
              </div>
            </div>

            <form onSubmit={handleCreateInvitation} className="p-5 flex flex-col gap-4 flex-1">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-primary dark:text-violet-300 mb-1.5">
                  Email du nouvel admin
                </label>
                <div className="relative">
                  <IoMailOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                  <input
                    type="email" value={email}
                    onChange={handleEmailChange} onBlur={handleBlur}
                    placeholder="admin@nesthub.tn" required
                    className={`w-full pl-9 pr-4 py-2.5 bg-gray-50/40 dark:bg-violet-900/10 border rounded-xl text-sm outline-none focus:border-violet-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-slate-100 placeholder:text-gray-400 ${
                      touched.email && emailError
                        ? "border-red-400 dark:border-red-500"
                        : "border-violet-200 dark:border-violet-800"
                    }`}
                  />
                </div>
                {touched.email && emailError && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <MdOutlineDangerous className="shrink-0" size={14} />
                    {emailError}
                  </p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-primary dark:text-violet-300 mb-1.5">
                  Responsabilité
                </label>
                <select
                  value={role} onChange={e => setRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-violet-50/40 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800 rounded-xl text-sm outline-none focus:border-violet-500 transition-all text-slate-900 dark:text-slate-100 appearance-none"
                >
                  {roleOptions.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>

              {/* Info */}
              <div className="flex items-start gap-2.5 p-3 bg-indigo-50/50 dark:bg-indigo-900/15 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50">
                <IoInformationCircleOutline className="text-indigo-500 text-sm mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-indigo-500 dark:text-indigo-400 leading-relaxed">
                  Un lien unique sera envoyé par email et expirera dans{" "}
                  <strong className="text-indigo-700 dark:text-indigo-300">48 heures</strong>.
                </p>
              </div>

              <div className="flex-1" />

              {/* Submit */}
              <button
                type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-600 hover:from-violet-600 hover:via-indigo-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
              >
                {submitting
                  ? <><Loader2 className="animate-spin h-4 w-4" />Envoi en cours…</>
                  : <><IoKeyOutline className="text-base" />Générer l'invitation</>
                }
              </button>
            </form>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-4 flex-shrink-0">
            {[
              { label: "Liens actifs",  count: stats.active,  countCls: "text-indigo-600 dark:text-indigo-400", Icon: IoLinkOutline,  grad: "from-indigo-500 to-blue-500",  bg: "border-indigo-100 dark:border-indigo-900/40" },
              { label: "Expirées", count: stats.expired, countCls: "text-rose-500", Icon: IoTimerOutline, grad: "from-rose-400 to-red-500", bg: "border-rose-100 dark:border-rose-900/40" },
              { label: "Révoquées", count: stats.revoked, countCls: "text-red-500", Icon: IoCloseCircleOutline, grad: "from-red-400 to-red-500", bg: "border-red-100 dark:border-red-900/40" },
            ].map(({ label, count, countCls, Icon, grad, bg }) => (
              <div key={label} className={`bg-white dark:bg-slate-900 rounded-2xl border ${bg} p-4 flex flex-col gap-2 ${card3d}`}>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm`}>
                  <Icon className="text-white text-sm" />
                </div>
                <div>
                  <p className={`text-2xl font-black leading-none ${countCls}`}>{count}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── RIGHT: table ── */}
        <section className="xl:col-span-2 flex flex-col">
          <div className={`flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden flex flex-col ${block3d}`}>

            {/* Table header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-indigo-50 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/40 to-violet-50/30 dark:from-indigo-900/10 dark:to-violet-900/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
                  <BsClockHistory className="text-white text-sm" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-100">Invitations en cours</h3>
                  <p className="text-[11px] text-gray-800 dark:text-white">Suivi de l'expiration en temps réel</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => fetchInvitations(pagination.page)}
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-400 hover:text-indigo-600 transition-all">
                  <IoRefreshOutline className="text-sm" />
                </button>
              </div>
            </div>

            {/* Table body */}
            <div className="flex-1 overflow-x-auto overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30">
                    {["Email","Responsabilité","Expire dans","Statut","Actions"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                  {invitations.map(inv => {
                    const time = getTimeRemaining(inv.expiresAt);
                    const isExpired = inv.status === "expired";
                    const isAcc = inv.status === "accepted";
                    const isRevoked = inv.status === "revoked";
                    const isActive = inv.status === "active" || inv.status === "pending";

                    return (
                      <tr key={inv.id} className={`transition-colors ${
                        isExpired || isAcc || isRevoked ? "opacity-40" : "hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10"
                      }`}>
                        {/* Email */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${getAvatarCls(inv.email)}`}>
                              {getInitials(inv.email)}
                            </div>
                            <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{inv.email}</span>
                          </div>
                        </td>
                        {/* Role */}
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
                            {inv.role}
                          </span>
                        </td>
                        {/* Timer */}
                        <td className="px-5 py-3.5">
                          {isAcc || isExpired || isRevoked ? (
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wide">
                              {isAcc ? "Acceptée" : isRevoked ? "Révoquée" : "Expirée"}
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className={`text-sm font-black tabular-nums ${time.hours < 6 ? "text-red-500" : "text-indigo-700 dark:text-indigo-300"}`}>
                                {time.hours}h {time.minutes}m
                              </span>
                              <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${time.hours < 6 ? "bg-red-500" : "bg-gradient-to-r from-violet-500 to-indigo-500"}`}
                                  style={{ width: `${time.pct}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </td>
                        {/* Status */}
                        <td className="px-5 py-3.5">
                          {isAcc ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Acceptée
                            </span>
                          ) : isRevoked ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />Révoquée
                            </span>
                          ) : isExpired ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />Expirée
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />Active
                            </span>
                          )}
                        </td>
                        {/* Actions */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            {isActive && (
                              <>
                                <button onClick={() => handleCopyLink(inv.token)} title="Copier le lien"
                                  className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors relative">
                                  {copiedToken === inv.token
                                    ? <MdOutlineCheckCircle className="text-base text-emerald-500" />
                                    : <IoLinkOutline className="text-base" />
                                  }
                                  {copiedToken === inv.token && (
                                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg whitespace-nowrap z-10">
                                      Copié !
                                    </span>
                                  )}
                                </button>
                                <button onClick={() => handleRevoke(inv.id)} title="Révoquer"
                                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors">
                                  <IoCloseCircleOutline className="text-base" />
                                </button>
                              </>
                            )}
                            {(isExpired || isRevoked) && (
                              <button onClick={() => handleResend(inv.email, inv.role)}
                                className="text-xs font-semibold text-violet-500 hover:text-violet-700 dark:hover:text-violet-300 hover:underline transition-colors">
                                Renvoyer
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {invitations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <FiInbox className="text-5xl text-indigo-200 dark:text-indigo-800 mb-3 mx-auto" />
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Aucune invitation en cours</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Utilisez le formulaire à gauche pour en créer une</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ── PAGINATION ── */}
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              pageSize={pagination.limit}
              onPageChange={fetchInvitations}
            />
          </div>
        </section>
      </div>

      {/* ── SECURITY FOOTER ── */}
      <div className="bg-slate-900 dark:bg-slate-950 text-slate-400 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-4 overflow-hidden relative border border-slate-800">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 pointer-events-none">
          <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <path d="M0 100 L100 0 L100 100 Z" fill="currentColor" />
          </svg>
        </div>
        <div className="flex-1 space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <IoTimerOutline className="text-red-400 text-base flex-shrink-0" />
            <h4 className="text-red-400 text-sm font-black">Application de l'expiration 48h</h4>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            NESTHUB's zero-trust invitation system generates transient access tokens. If an invitee does not complete
            registration within the <span className="text-white font-bold">48-hour window</span>, the encrypted token
            is automatically purged from the gateway cache. This prevents long-standing unauthorized link reuse.
          </p>
          <div className="flex gap-3 pt-1">
            <div className="flex items-center gap-1.5">
              <IoShieldCheckmarkOutline className="text-indigo-400 text-sm" />
              <span className="text-xs font-bold text-white uppercase tracking-tighter">Purge auto</span>
            </div>
            <div className="flex items-center gap-1.5">
              <IoLockClosedOutline className="text-indigo-400 text-sm" />
              <span className="text-xs font-bold text-white uppercase tracking-tighter">Accès limité</span>
            </div>
          </div>
        </div>
        <div className="hidden md:block w-px h-14 bg-slate-800" />
        <div className="flex flex-col items-center gap-1.5 relative z-10">
          <div className="w-11 h-11 rounded-full border-4 border-slate-800 flex items-center justify-center text-indigo-400">
            <IoDocumentTextOutline className="text-xl" />
          </div>
          <a href="#" className="text-[10px] font-bold text-slate-300 hover:text-white underline decoration-indigo-500 transition-colors">
            Politique
          </a>
        </div>
      </div>
    </div>
  );
}