"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { decodeJWT } from "@/lib/utils/jwt";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";
import { Loader2 } from "lucide-react";
import { IoDocumentTextOutline, IoSearchOutline } from "react-icons/io5";
import { useAuth } from "@clerk/nextjs";
import {
  IoMailOutline,
  IoKeyOutline,
  IoInformationCircleOutline,
  IoLinkOutline,
  IoCloseCircleOutline,
  IoRefreshOutline,
  IoLockClosedOutline,
  IoPersonAddOutline,
  IoTimerOutline,
  IoShieldCheckmarkOutline,
  IoCheckmarkCircleOutline,
  IoFilterOutline,
} from "react-icons/io5";
import { MdOutlineCheckCircle, MdOutlineDangerous } from "react-icons/md";
import { BsClockHistory } from "react-icons/bs";
import { FiInbox } from "react-icons/fi";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import { useInvitations } from "./hooks/useInvitations";

interface Toast {
  type: "success" | "error";
  message: string;
}

// ─── Ombres ─────────────────────────────────────────────────
const block3d =
  "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";
const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

const getTimeRemaining = (expiresAt: string) => {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { hours: 0, minutes: 0, expired: true, pct: 0 };
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return {
    hours,
    minutes,
    expired: false,
    pct: Math.min(100, (hours / 48) * 100),
  };
};

const getInitials = (e: string) => e.substring(0, 2).toUpperCase();
const getAvatarCls = (email: string) => {
  const list = [
    "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
    "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
    "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    "bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-300",
  ];
  return list[
    email.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % list.length
  ];
};

export default function AdminInvitationsPage() {
  const t = useTranslations("AdminInvitations");
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || "fr";
  const {
    invitations,
    stats,
    pagination,
    loading: hookLoading,
    submitting,
    fetchInvitations,
    createInvitation,
    copyLink,
    revokeInvitation,
    resendInvitation,
    updateFilters,
    filters,
  } = useInvitations();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false });
  const [emailError, setEmailError] = useState<string | undefined>();

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState<string>("");

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Synchroniser les filtres de la page avec le hook
  useEffect(() => {
    if (isAdmin) {
      // Convertir 'active' en 'pending' pour l'API
      const apiStatus = statusFilter === "active" ? "pending" : statusFilter;
      updateFilters({ status: apiStatus, search: searchFilter });
    }
  }, [statusFilter, searchFilter, isAdmin, updateFilters]);

  useEffect(() => {
    const check = async () => {
      if (!isUserLoaded || !clerkUser) {
        setIsAdmin(false);
        return;
      }
      try {
        const tok = await getToken({ template: "my-app-template" });
        if (!tok) {
          setIsAdmin(false);
          return;
        }
        setIsAdmin(decodeJWT(tok)?.role === "ADMIN");
      } catch {
        setIsAdmin(false);
      }
    };
    check();
  }, [isUserLoaded, clerkUser, getToken]);

  useEffect(() => {
    if (isAdmin === false) router.push(`/${locale}`);
  }, [isAdmin, router, locale]);

  useEffect(() => {
    if (isAdmin) {
      fetchInvitations();
      setLoading(false);
    }
  }, [isAdmin]);

  const validateEmail = (v: string) => {
    if (!v.trim()) return t("emailRequired");
    if (!v.includes("@") || !v.includes(".")) return t("emailInvalid");

    const existingActiveInvitation = invitations.find(
      (inv) =>
        inv.email.toLowerCase() === v.toLowerCase() && inv.status === "pending",
    );

    if (existingActiveInvitation) {
      return t("invitationAlreadyExists", { email: v });
    }

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
    await createInvitation(email, "ADMIN");
    showToast("success", t("invitationSent", { email }));
    setEmail("");
    setTouched({ email: false });
    setEmailError(undefined);
  } catch (err: any) {
    let errorMessage = err.message;
    
    try {
      const parsed = JSON.parse(err.message);
      if (parsed.errorCode) {
        switch (parsed.errorCode) {
          case "UNAUTHENTICATED":
            errorMessage = t("errorUnauthenticated");
            break;
          case "ACCESS_DENIED":
            errorMessage = t("errorAccessDenied");
            break;
          case "INVALID_EMAIL":
            errorMessage = t("errorInvalidEmail");
            break;
          case "ALREADY_ACCEPTED_INVITATION":
            errorMessage = t("errorAlreadyAcceptedInvitation");
            break;
          case "USER_ALREADY_ADMIN":
            errorMessage = t("errorUserAlreadyAdmin");
            break;
          case "ACTIVE_INVITATION_EXISTS":
            errorMessage = t("errorActiveInvitationExists");
            break;
          case "EMAIL_SEND_FAILED":
            errorMessage = t("errorEmailSendFailed");
            break;
          default:
            errorMessage = t("errorUnknown");
        }
      }
    } catch {
      // Si ce n'est pas du JSON, garder le message original
      if (
        err.message?.includes("already exists") ||
        err.message?.includes("déjà") ||
        err.message?.includes("déjà administrateur")
      ) {
        errorMessage = t("errorActiveInvitationExists");
      }
    }
    
    showToast("error", errorMessage);
  }
};
  const handleCopyLink = async (token: string) => {
    await copyLink(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    showToast("success", t("linkCopied"));
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeInvitation(id);
      showToast("success", t("invitationRevoked"));
    } catch {
      showToast("error", t("revokeError"));
    }
  };

  const handleResend = async (invEmail: string) => {
    try {
      await resendInvitation(invEmail, "ADMIN");
      showToast("success", t("invitationResent", { email: invEmail }));
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setSearchFilter("");
  };

  // ─── Guards ──────────────────────────────────────────────────
  if (!isUserLoaded || isAdmin === null || loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );

  if (isAdmin === false)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-10 bg-white dark:bg-slate-900 rounded-2xl shadow-lg">
          <IoLockClosedOutline className="text-6xl text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            {t("unauthorized")}
          </h1>
        </div>
      </div>
    );

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 hover:opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── EN-TÊTE ── */}
      <div className="flex-shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("title")}
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">
            {t("description")}
          </p>
        </div>
      </div>

      {/* ── GRILLE PRINCIPALE ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-shrink-0 xl:items-stretch">
        {/* ── GAUCHE : formulaire + statistiques ── */}
        <section className="xl:col-span-1 flex flex-col gap-4">
          {/* Carte du formulaire */}
          <div
            className={`flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-violet-100 dark:border-violet-900/40 overflow-hidden flex flex-col ${block3d}`}
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-violet-50 dark:border-violet-900/30 bg-gradient-to-r from-violet-50/60 to-indigo-50/60 dark:from-violet-900/10 dark:to-indigo-900/10">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
                <IoPersonAddOutline className="text-white text-base" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-violet-900 dark:text-violet-100 leading-tight">
                  {t("inviteAdmin")}
                </h3>
                <p className="text-[11px] text-primary dark:text-white">
                  {t("secureLink")}
                </p>
              </div>
            </div>

            <form
              onSubmit={handleCreateInvitation}
              className="p-5 flex flex-col gap-4 flex-1"
            >
              <div>
                <label className="block text-xs font-semibold text-primary dark:text-violet-300 mb-1.5">
                  {t("newAdminEmail")}
                </label>
                <div className="relative">
                  <IoMailOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleBlur}
                    placeholder="admin@exemple.fr"
                    required
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

              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <IoShieldCheckmarkOutline className="text-emerald-600 dark:text-emerald-400 text-base" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    {t("fullAccessTitle")}
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400/80 mt-0.5">
                    {t("fullAccessDescription")}
                  </p>
                </div>
                <IoCheckmarkCircleOutline className="text-emerald-500 text-lg flex-shrink-0" />
              </div>

              <div className="flex items-start gap-2.5 p-3 bg-indigo-50/50 dark:bg-indigo-900/15 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50">
                <IoInformationCircleOutline className="text-indigo-500 text-sm mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-indigo-500 dark:text-indigo-400 leading-relaxed">
                  {t("infoText")}{" "}
                  <strong className="text-indigo-700 dark:text-indigo-300">
                    48 heures
                  </strong>
                  .
                </p>
              </div>

              <div className="flex-1" />

              <button
                type="submit"
                disabled={submitting || (touched.email && !!emailError)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-600 hover:from-violet-600 hover:via-indigo-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    {t("sending")}…
                  </>
                ) : (
                  <>
                    <IoKeyOutline className="text-base" />
                    {t("generateInvitation")}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-shrink-0">
            {[
              {
                label: t("activeLinks"),
                count: stats.active,
                countCls: "text-indigo-600 dark:text-indigo-400",
                Icon: IoLinkOutline,
                grad: "from-indigo-500 to-blue-500",
                bg: "border-indigo-100 dark:border-indigo-900/40",
              },
              {
                label: t("expired"),
                count: stats.expired,
                countCls: "text-rose-500",
                Icon: IoTimerOutline,
                grad: "from-rose-400 to-red-500",
                bg: "border-rose-100 dark:border-rose-900/40",
              },
              {
                label: t("accepted"),
                count: stats.accepted || 0,
                countCls: "text-emerald-600 dark:text-emerald-400",
                Icon: IoCheckmarkCircleOutline,
                grad: "from-emerald-400 to-teal-500",
                bg: "border-emerald-100 dark:border-emerald-900/40",
              },
            ].map(({ label, count, countCls, Icon, grad, bg }) => (
              <div
                key={label}
                className={`bg-white dark:bg-slate-900 rounded-2xl border ${bg} p-3 flex flex-col gap-2 ${card3d}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm`}
                >
                  <Icon className="text-white text-xs" />
                </div>
                <div>
                  <p className={`text-xl font-black leading-none ${countCls}`}>
                    {count}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium uppercase tracking-wide">
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── DROITE : tableau avec filtres ── */}
        <section className="xl:col-span-2 flex flex-col">
          <div
            className={`flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden flex flex-col ${block3d}`}
          >
            <div className="flex-shrink-0 px-5 pt-4 pb-2 border-b border-indigo-50 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/40 to-violet-50/30 dark:from-indigo-900/10 dark:to-violet-900/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
                  <BsClockHistory className="text-white text-sm" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
                    {t("currentInvitations")}
                  </h3>
                  <p className="text-[11px] text-gray-800 dark:text-white">
                    {invitations.length} /{" "}
                    {pagination.total || invitations.length} {t("displayed")}
                  </p>
                </div>
              </div>
            </div>

            {/* Barre de filtres */}
            <div className="flex-shrink-0 px-5 py-3 border-b border-indigo-50 dark:border-indigo-900/30 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-end gap-3 flex-wrap">
                <div className="relative">
                  <IoFilterOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-sm" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-9 pr-8 py-2 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 cursor-pointer appearance-none"
                  >
                    <option value="all">{t("allStatus")}</option>
                    <option value="active">{t("active")}</option>
                    <option value="expired">{t("expired")}</option>
                    <option value="revoked">{t("revoked")}</option>
                    <option value="accepted">{t("accepted")}</option>
                  </select>
                </div>

                <div className="relative">
                  <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-sm" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder={t("searchByEmail")}
                    className="pl-9 pr-4 py-2 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 w-full sm:w-56"
                  />
                </div>

                {(statusFilter !== "all" || searchFilter) && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 text-sm text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl transition-colors"
                  >
                    <IoCloseCircleOutline className="text-sm" />
                    {t("clearFilters")}
                  </button>
                )}

                <button
                  onClick={() => fetchInvitations(pagination.page)}
                  className="p-2 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all"
                  title={t("refresh")}
                >
                  <IoRefreshOutline className="text-base" />
                </button>
              </div>
            </div>

            {/* Corps du tableau */}
            <div className="flex-1 overflow-x-auto overflow-y-auto">
              {hookLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-indigo-50/80 dark:bg-indigo-900/20">
                    <tr className="border-b border-indigo-100 dark:border-indigo-900/30">
                      <th className="px-5 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider">
                        {t("email")}
                      </th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider">
                        {t("expiresIn")}
                      </th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider">
                        {t("status")}
                      </th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider">
                        {t("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                    {invitations.map((inv) => {
                      const time = getTimeRemaining(inv.expiresAt);
                      const isExpired = inv.status === "expired";
                      const isAcc = inv.status === "accepted";
                      const isRevoked = inv.status === "revoked";
                      const isActive = inv.status === "pending";

                      return (
                        <tr
                          key={inv.id}
                          className={`transition-colors ${
                            isExpired || isAcc || isRevoked
                              ? "opacity-50"
                              : "hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10"
                          }`}
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${getAvatarCls(inv.email)}`}
                              >
                                {getInitials(inv.email)}
                              </div>
                              <span className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate max-w-[200px]">
                                {inv.email}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            {isAcc || isExpired || isRevoked ? (
                              <span className="text-xs font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wide">
                                {isAcc
                                  ? t("accepted")
                                  : isRevoked
                                    ? t("revoked")
                                    : t("expired")}
                              </span>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <span
                                  className={`text-sm font-black tabular-nums ${time.hours < 6 ? "text-red-500" : "text-indigo-700 dark:text-indigo-300"}`}
                                >
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
                          <td className="px-5 py-3.5">
                            {isAcc ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {t("accepted")}
                              </span>
                            ) : isRevoked ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                {t("revoked")}
                              </span>
                            ) : isExpired ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                {t("expired")}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                {t("active")}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1">
                              {isActive && (
                                <>
                                  <button
                                    onClick={() => handleCopyLink(inv.token)}
                                    title={t("copyLink")}
                                    className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors relative"
                                  >
                                    {copiedToken === inv.token ? (
                                      <MdOutlineCheckCircle className="text-base text-emerald-500" />
                                    ) : (
                                      <IoLinkOutline className="text-base" />
                                    )}
                                    {copiedToken === inv.token && (
                                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg whitespace-nowrap z-10">
                                        {t("copied")}
                                      </span>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleRevoke(inv.id)}
                                    title={t("revoke")}
                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                                  >
                                    <IoCloseCircleOutline className="text-base" />
                                  </button>
                                </>
                              )}
                              {(isExpired || isRevoked) && (
                                <button
                                  onClick={() => handleResend(inv.email)}
                                  className="text-xs font-semibold text-violet-500 hover:text-violet-700 dark:hover:text-violet-300 hover:underline transition-colors"
                                >
                                  {t("resend")}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {invitations.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-16 text-center">
                          <FiInbox className="text-5xl text-indigo-200 dark:text-indigo-800 mb-3 mx-auto" />
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            {searchFilter || statusFilter !== "all"
                              ? t("noResults")
                              : t("noInvitations")}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            {searchFilter || statusFilter !== "all"
                              ? t("tryDifferentFilters")
                              : t("createInvitationHint")}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* ── PAGINATION ── */}
            {/* ── PAGINATION ── */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={pagination.limit}
                onPageChange={(newPage) => {
                  fetchInvitations(newPage);
                }}
              />
            )}
          </div>
        </section>
      </div>

      {/* ── PIED DE PAGE SÉCURITÉ AVEC LIEN POLITIQUE ── */}
      <div className="bg-slate-900 dark:bg-slate-950 text-slate-400 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-4 overflow-hidden relative border border-slate-800">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 pointer-events-none">
          <svg
            className="h-full w-full"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <path d="M0 100 L100 0 L100 100 Z" fill="currentColor" />
          </svg>
        </div>
        <div className="flex-1 space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <IoTimerOutline className="text-red-400 text-base flex-shrink-0" />
            <h4 className="text-red-400 text-sm font-black">
              {t("expiryApplication")}
            </h4>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            {t("securityText")}
          </p>
          <div className="flex gap-3 pt-1">
            <div className="flex items-center gap-1.5">
              <IoShieldCheckmarkOutline className="text-indigo-400 text-sm" />
              <span className="text-xs font-bold text-white uppercase tracking-tighter">
                {t("autoPurge")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <IoLockClosedOutline className="text-indigo-400 text-sm" />
              <span className="text-xs font-bold text-white uppercase tracking-tighter">
                {t("limitedAccess")}
              </span>
            </div>
          </div>
        </div>
        <div className="hidden md:block w-px h-14 bg-slate-800" />
        <div className="flex flex-col items-center gap-1.5 relative z-10">
          <div className="w-11 h-11 rounded-full border-4 border-slate-800 flex items-center justify-center text-indigo-400">
            <IoDocumentTextOutline className="text-xl" />
          </div>
          <a
            href={`/${locale}/terms`}
            className="text-[10px] font-bold text-slate-300 hover:text-white underline decoration-indigo-500 transition-colors"
          >
            {t("policy")}
          </a>
        </div>
      </div>
    </div>
  );
}
