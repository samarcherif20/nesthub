/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Alert from "@/components/ui/Alert";
import { useVerificationDetail } from "./hooks/useVerificationDetail";

import {
  MdOutlineArrowBack,
  MdOutlineDownload,
  MdOutlineClose,
  MdOutlineFullscreen,
  MdOutlineRotateRight,
  MdOutlineRotateLeft,
  MdOutlineFlip,
  MdOutlineImage,
  MdOutlineChevronRight,
} from "react-icons/md";
import { TbShieldCheck, TbShieldX } from "react-icons/tb";
import { FiMail, FiPhone, FiUser } from "react-icons/fi";
import { HiOutlineIdentification } from "react-icons/hi";
import { RiUserSharedLine } from "react-icons/ri";
import { Loader2 } from "lucide-react";

const pip = (url: string) =>
  `/api/admin/serve-image?url=${encodeURIComponent(url)}`;

export default function VerificationDetailPage() {
  const params = useParams();
  const locale = params?.locale as string;
  const requestId = params?.requestId as string;

  const t = useTranslations("VerificationDetail");
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminChecked, setAdminChecked] = useState(false);
  const [fullscreen, setFullscreen] = useState<string | null>(null);
  const [side, setSide] = useState<"front" | "back">("front");
  const [scale, setScale] = useState(0.8);
  const [rotation, setRotation] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const {
    loading,
    submitting,
    error,
    success,
    request,
    showRejectForm,
    rejectionMotif,
    adminComment,
    extractedData,
    requestUser,
    setShowRejectForm,
    setRejectionMotif,
    setAdminComment,
    selectedAction,
    selectValidate,
    selectReject,
    confirmDecision,
    resetError,
    resetSuccess,
    fetchRequest,
  } = useVerificationDetail(requestId);

  // ── admin guard ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isUserLoaded || !clerkUser) return;
    (async () => {
      try {
        const token = await getToken({ template: "my-app-template" });
        if (token) {
          const decoded = JSON.parse(atob(token.split(".")[1]));
          setIsAdmin(decoded?.role === "ADMIN");
        } else setIsAdmin(false);
      } catch {
        setIsAdmin(false);
      } finally {
        setAdminChecked(true);
      }
    })();
  }, [isUserLoaded, clerkUser, getToken]);

  useEffect(() => {
    if (adminChecked && isAdmin && requestId) fetchRequest();
  }, [adminChecked, isAdmin, requestId, fetchRequest]);

  // ── image helpers ──────────────────────────────────────────────────────
  // Detect document type (CIN has recto/verso, PASSPORT has single image)
  const isPassport =
    request?.cinData?.documentType === "PASSPORT" ||
    request?.documentType === "passport";
  const frontUrl = request?.documentFrontUrl ?? null;
  const backUrl = request?.documentBackUrl ?? null;
  const passportUrl = request?.cinData?.passportUrl ?? null;

  let hasBack = !!backUrl;
  let currentUrl: string | null = null;

  if (isPassport) {
    // For passport: only one image, disable back toggle
    hasBack = false;
    currentUrl = passportUrl || frontUrl;
  } else {
    // For CIN: front/back images
    currentUrl = side === "front" ? frontUrl : backUrl;
  }

  // ── processed state ────────────────────────────────────────────────────
  // When the request is already VALIDATED or REJECTED all action buttons
  // must be disabled and a notice must be shown instead of the action form.
  const isProcessed =
    request?.status === "VALIDATED" || request?.status === "REJECTED";

  const download = async () => {
    if (!currentUrl) return;
    const blob = await fetch(pip(currentUrl)).then((r) => r.blob());
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `cin_${side}_${requestId?.slice(-6)}.jpg`,
    });
    document.body.append(a);
    a.click();
    a.remove();
  };

  // ── guards ─────────────────────────────────────────────────────────────
  if (!adminChecked || !isUserLoaded)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );

  if (isAdmin === false)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-10 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
          <RiUserSharedLine className="text-6xl text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
            {t("unauthorized")}
          </h1>
          <p className="text-sm text-slate-500">{t("adminRequired")}</p>
        </div>
      </div>
    );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );

  if (!request)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 mb-4 text-sm">{t("noData")}</p>
          <button
            onClick={() => fetchRequest()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-all"
          >
            {t("reload")}
          </button>
        </div>
      </div>
    );

  // ── header badge helper ────────────────────────────────────────────────
  const statusBadge = (() => {
    if (request.status === "VALIDATED")
      return {
        dot: "bg-emerald-500",
        wrap: "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800",
        text: "text-emerald-700 dark:text-emerald-400",
        label: t("validated"),
        pulse: false,
      };
    if (request.status === "REJECTED")
      return {
        dot: "bg-rose-500",
        wrap: "bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800",
        text: "text-rose-700 dark:text-rose-400",
        label: t("rejected"),
        pulse: false,
      };
    return {
      dot: "bg-amber-500",
      wrap: "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800",
      text: "text-amber-700 dark:text-amber-400",
      label: t("pending"),
      pulse: true,
    };
  })();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <header className="shrink-0 px-5 py-3 border-b border-slate-200 dark:border-slate-800">
        {/* Breadcrumb et Status sur la même ligne */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Link
              href={`/${locale}/admin/verifications`}
              className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
            >
              {t("verifications")}
            </Link>
            <MdOutlineChevronRight className="text-slate-400 dark:text-slate-600 text-sm" />
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
              {t("requestNumber")} #{requestId?.slice(-8).toUpperCase()}
            </span>
          </div>

          {/* dynamic status badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide ${statusBadge.wrap} ${statusBadge.text}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot} ${statusBadge.pulse ? "animate-pulse" : ""}`}
            />
            {statusBadge.label}
          </div>
        </div>
      </header>

      {/* ══ BODY ════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex min-h-0 overflow-hidden gap-0">
        {/* ── LEFT : image panel ──────────────────────────────────────────── */}
        <div className="w-[38%] shrink-0 flex flex-col overflow-hidden border-r border-slate-200 dark:border-slate-800">
          {/* toolbar */}
          <div
            className="shrink-0 flex items-center justify-between gap-2 px-3 py-2
            border-b border-slate-100 dark:border-slate-800
            bg-slate-50 dark:bg-slate-900/60"
          >
            {/* recto / verso toggle - hide back button for passport */}
            <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
              {(["front", "back"] as const).map((s) => {
                // Don't show back button for passport
                if (isPassport && s === "back") return null;
                return (
                  <button
                    key={s}
                    onClick={() => {
                      if (s === "back" && !hasBack) return;
                      setSide(s);
                    }}
                    disabled={
                      (s === "back" && !hasBack) || (isPassport && s === "back")
                    }
                    className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all
          ${
            side === s && !isPassport
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : isPassport && s === "front" && side === "front"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          } disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    {s === "front" ? t("front") : t("back")}
                  </button>
                );
              })}
            </div>
            {/* controls */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setScale((p) => Math.max(p - 0.15, 0.3))}
                title={t("zoomOut")}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                  />
                </svg>
              </button>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 w-8 text-center tabular-nums">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale((p) => Math.min(p + 0.15, 2.5))}
                title={t("zoomIn")}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                  />
                </svg>
              </button>

              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

              <button
                onClick={() => setRotation((p) => (p - 90 + 360) % 360)}
                title={t("rotateLeft")}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <MdOutlineRotateLeft className="text-base" />
              </button>
              <button
                onClick={() => setRotation((p) => (p + 90) % 360)}
                title={t("rotateRight")}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <MdOutlineRotateRight className="text-base" />
              </button>
              <button
                onClick={() => setFlipped((p) => !p)}
                title={t("flip")}
                className={`p-1.5 rounded-lg transition-all ${
                  flipped
                    ? "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <MdOutlineFlip className="text-base" />
              </button>

              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

              <button
                onClick={download}
                title={t("download")}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all"
              >
                <MdOutlineDownload className="text-base" />
              </button>
              <button
                onClick={() => currentUrl && setFullscreen(currentUrl)}
                title={t("fullscreen")}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all"
              >
                <MdOutlineFullscreen className="text-base" />
              </button>
            </div>
          </div>

          {/* canvas */}
          <div
            className="flex-1 flex items-center justify-center overflow-hidden min-h-0
            [background-image:linear-gradient(rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.07)_1px,transparent_1px)]
            [background-size:20px_20px]
            dark:[background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)]
            bg-slate-50 dark:bg-slate-950"
          >
            {currentUrl ? (
              <div
                className="cursor-zoom-in select-none"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: "transform 0.3s ease",
                }}
                onClick={() => setFullscreen(currentUrl)}
              >
                <div
                  style={{
                    transform: flipped ? "scaleX(-1)" : "scaleX(1)",
                    transition: "transform 0.35s ease",
                  }}
                >
                  <img
                    src={pip(currentUrl)}
                    alt={`CIN ${side}`}
                    draggable={false}
                    className="rounded-xl object-contain
                      shadow-[0_8px_32px_rgba(0,0,0,0.16)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.6)]
                      border border-white/60 dark:border-slate-700/40"
                    style={{
                      transform: `scale(${scale})`,
                      transition: "transform 0.25s ease",
                      maxWidth: "calc(38vw - 2.5rem)",
                      maxHeight: "calc(100vh - 8rem)",
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-300 dark:text-slate-700">
                <MdOutlineImage className="text-5xl" />
                <p className="text-xs">{t("noImage")}</p>
              </div>
            )}
          </div>

          {/* status bar */}
          <div
            className="shrink-0 flex items-center justify-between px-3 py-1.5
            border-t border-slate-100 dark:border-slate-800
            bg-slate-50 dark:bg-slate-900/60"
          >
            <span className="text-[10px] text-slate-400 dark:text-slate-600 font-mono tabular-nums">
              {rotation}° · {Math.round(scale * 100)}%
              {flipped ? ` · ${t("mirror")}` : ""}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-600">
              {t("clickToExpand")}
            </span>
          </div>
        </div>

        {/* ── RIGHT : details + actions ────────────────────────────────────── */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-12 py-3 custom-scrollbar">
            <div className="space-y-7">
              {/* ── user profile header ──────────────────────────────────── */}
              <div className="flex items-start gap-5 mt-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
                  {requestUser?.profilePictureUrl ? (
                    <img
                      src={pip(requestUser.profilePictureUrl)}
                      alt="User profile portrait"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-indigo-500 dark:text-indigo-400">
                      {requestUser?.firstName?.[0]}
                      {requestUser?.lastName?.[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                    {requestUser?.firstName} {requestUser?.lastName}
                  </h1>
                  <p className="text-slate-500 mt-0.5">
                    {t("memberSince")}{" "}
                    {new Date(
                      requestUser?.createdAt || Date.now(),
                    ).toLocaleDateString("fr-FR", {
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    • 0 {t("propertiesListed")}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {t("userId")}: #{requestId?.slice(-8).toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {t("tier1Account")}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── identity details ─────────────────────────────────────── */}
              <section className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <span className="w-8 h-px bg-slate-200 dark:bg-slate-700" />
                  {t("identityDetails")}
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {/* ✅ Prénom - prend le cinData.firstName (arabe) */}
                  <div className="space-y-0.5">
                    <label className="text-xs font-medium text-slate-500 uppercase">
                      {t("firstName")}
                    </label>
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium text-sm font-arabic">
                      {request?.cinData?.firstName || "-"}
                    </div>
                  </div>

                  {/* ✅ Nom - prend le cinData.lastName (arabe) */}
                  <div className="space-y-0.5">
                    <label className="text-xs font-medium text-slate-500 uppercase">
                      {t("lastName")}
                    </label>
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium text-sm font-arabic">
                      {request?.cinData?.lastName || "-"}
                    </div>
                  </div>

                  {/* Téléphone - inchangé */}
                  <div className="space-y-0.5">
                    <label className="text-xs font-medium text-slate-500 uppercase">
                      {t("phone")}
                    </label>
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium text-sm flex items-center justify-between">
                      {requestUser?.phoneNumber || "-"}
                    </div>
                  </div>

                  {/* Email - inchangé */}
                  <div className="space-y-0.5">
                    <label className="text-xs font-medium text-slate-500 uppercase">
                      {t("email")}
                    </label>
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium text-sm">
                      {requestUser?.email}
                    </div>
                  </div>

                  {/* CIN Number - ALWAYS show for both CIN and PASSPORT */}
                  <div className="space-y-0.5 col-span-1">
                    <label className="text-xs font-medium text-slate-500 uppercase">
                      {t("cinNumber")}
                    </label>
                    <div className="px-4 py-2 bg-white dark:bg-slate-800 border-2 border-indigo-500/20 rounded-lg text-slate-900 dark:text-slate-100 font-medium text-sm">
                      {request?.cinData?.cinNumber ||
                        extractedData?.cinNumber ||
                        "-"}
                    </div>
                  </div>

                  {/* Passport Number - ONLY for PASSPORT documents */}
                  {isPassport && request?.cinData?.passportNumber && (
                    <div className="space-y-0.5 col-span-1">
                      <label className="text-xs font-medium text-slate-500 uppercase">
                        {t("passportNumber")}
                      </label>
                      <div className="px-4 py-2 bg-white dark:bg-slate-800 border-2 border-indigo-500/20 rounded-lg text-slate-900 dark:text-slate-100 font-medium text-sm">
                        {request?.cinData?.passportNumber}
                      </div>
                    </div>
                  )}

                  {/* Nationality - ONLY for PASSPORT documents */}
                  {isPassport && request?.cinData?.country && (
                    <div className="space-y-0.5 col-span-2">
                      <label className="text-xs font-medium text-slate-500 uppercase">
                        {t("nationality")}
                      </label>
                      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-sm">
                        {request?.cinData?.country}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* ── internal note ────────────────────────────────────────── */}
              <section className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase">
                  {t("internalNote")}
                </label>
                <textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder={t("internalNotePlaceholder")}
                  rows={1}
                  disabled={isProcessed}
                  className="w-full px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </section>

              {/* ── finalize section ─────────────────────────────────────── */}
              <section className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-0.5">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {t("finalizeVerification")}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {t("reviewInstruction")}
                  </p>
                </div>

                {/* ── already-processed notice ─────────────────────────── */}
                {isProcessed && (
                  <div
                    className={`flex items-start gap-3 p-4 rounded-xl border ${
                      request.status === "VALIDATED"
                        ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                        : "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800"
                    }`}
                  >
                    {request.status === "VALIDATED" ? (
                      <TbShieldCheck className="text-2xl text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <TbShieldX className="text-2xl text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-bold ${
                          request.status === "VALIDATED"
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-rose-700 dark:text-rose-400"
                        }`}
                      >
                        {request.status === "VALIDATED"
                          ? t("alreadyValidated")
                          : t("alreadyRejected")}
                      </p>
                      {request.processedAt && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          {new Date(request.processedAt).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      )}
                      {request.rejectionMotif && (
                        <p className="text-xs text-rose-500 dark:text-rose-400 mt-1 italic">
                          Motif : {request.rejectionMotif}
                        </p>
                      )}
                      {request.adminComment && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                          Note : {request.adminComment}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ── action buttons ───────────────────────────────────── */}
                <div className="space-y-2">
                  <div className="flex gap-3">
                    {/* validate */}
                    <button
                      onClick={selectValidate}
                      disabled={submitting || isProcessed}
                      className={`flex-1 py-2.5 px-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all
                        ${
                          isProcessed
                            ? "opacity-40 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800/50"
                            : selectedAction === "validate"
                              ? "border-emerald-500 bg-emerald-600 text-white"
                              : "border-emerald-500/20 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-500/5 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                        }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                      {t("validateId")}
                    </button>

                    {/* reject */}
                    <button
                      onClick={selectReject}
                      disabled={submitting || isProcessed}
                      className={`flex-1 py-2.5 px-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all
                        ${
                          isProcessed
                            ? "opacity-40 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800/50"
                            : selectedAction === "reject"
                              ? "border-rose-500 bg-rose-600 text-white"
                              : "border-rose-500/20 bg-rose-50/50 text-rose-700 dark:bg-rose-500/5 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
                      </svg>
                      {t("rejectId")}
                    </button>
                  </div>

                  {/* reject form — only shown when not processed */}
                  {showRejectForm && !isProcessed && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {t("rejectionReason")}
                        </label>
                        <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">
                          * {t("required")}
                        </span>
                      </div>
                      <textarea
                        value={rejectionMotif}
                        onChange={(e) => setRejectionMotif(e.target.value)}
                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-indigo-500 focus:border-indigo-500 text-sm p-2"
                        placeholder={t("rejectionReasonPlaceholder")}
                        rows={1}
                      />
                      <div className="flex gap-2 flex-wrap">
                        {[
                          "Image floue",
                          "Document expiré",
                          "Mauvaise personne",
                          "Document incomplet",
                        ].map((reason) => (
                          <button
                            key={reason}
                            onClick={() => setRejectionMotif(reason)}
                            className={`px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-400 cursor-pointer hover:border-indigo-400 transition-colors
                              ${rejectionMotif === reason ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" : ""}`}
                          >
                            {reason}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={selectReject}
                        disabled={submitting || !rejectionMotif}
                        className="w-full py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                      >
                        {submitting ? (
                          <Loader2 className="animate-spin h-4 w-4" />
                        ) : (
                          <MdOutlineClose className="text-base" />
                        )}
                        {t("confirmRejection")}
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* ── footer ────────────────────────────────────────────────────── */}
          <div className="shrink-0 h-16 px-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
            <Link
              href={`/${locale}/admin/verifications`}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
              <span className="font-medium">{t("skipForNow")}</span>
            </Link>
            <div className="flex gap-3">
              <Link
                href={`/${locale}/admin/verifications`}
                className="px-6 py-2 rounded-lg font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm"
              >
                {t("cancel")}
              </Link>
              <button
                onClick={confirmDecision}
                disabled={
                  submitting ||
                  isProcessed ||
                  !selectedAction ||
                  (selectedAction === "reject" && !rejectionMotif)
                }
                className="px-6 py-2 rounded-lg font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {submitting ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  t("confirmDecision")
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══ ALERTS ══════════════════════════════════════════════════════════ */}
      <div className="fixed top-12 right-9 z-50 flex flex-col gap-3">
        {error && <Alert type="error" message={error} onClose={resetError} />}
        {success && (
          <Alert type="success" message={success} onClose={resetSuccess} />
        )}
      </div>

      {/* ══ FULLSCREEN ══════════════════════════════════════════════════════ */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setFullscreen(null)}
        >
          <img
            src={pip(fullscreen)}
            alt={t("fullscreenImage")}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[92vw] max-h-[92vh] object-contain rounded-xl shadow-[0_0_80px_rgba(0,0,0,0.8)]"
          />
          <button
            onClick={() => setFullscreen(null)}
            className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <MdOutlineClose className="text-white text-xl" />
          </button>
        </div>
      )}
    </div>
  );
}
