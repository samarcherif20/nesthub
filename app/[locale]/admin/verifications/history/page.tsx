"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Alert from "@/components/ui/Alert";
import SearchBar from "@/components/ui/SearchBar";
import Pagination from "@/components/ui/Pagination";
import {
  MdOutlineArrowBack,
  MdOutlineVisibility,
  MdOutlineCheckCircle,
  MdOutlineShield,
  MdOutlineChevronRight,
} from "react-icons/md";
import {
  TbRefresh,
  TbShieldCheck,
  TbShieldX,
  TbLayoutDashboard,
  TbFileCheck,
  TbHistoryToggle,
} from "react-icons/tb";
import { IoCheckmarkCircle, IoCloseCircle } from "react-icons/io5";
import {
  useVerificationsHistory,
  VerificationRequest,
} from "./hooks/useVerificationsHistory";

// ── design tokens ──────────────────────────────────────────────────────────
const block3d =
  "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";
const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

// ── sub-components ────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  if (status === "VALIDATED")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
        <IoCheckmarkCircle className="text-sm shrink-0" />
        Validée
      </span>
    );
  if (status === "REJECTED")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800">
        <IoCloseCircle className="text-sm shrink-0" />
        Rejetée
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
      En attente
    </span>
  );
};

const DateCell = ({ date }: { date?: string }) => {
  if (!date)
    return (
      <span className="text-sm text-slate-400 dark:text-slate-600">—</span>
    );
  const d = new Date(date);
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {d.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
      </span>
      <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">
        {d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
      </span>
    </div>
  );
};

// ── page ──────────────────────────────────────────────────────────────────
export default function VerificationsHistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = React.use(params);
  const t = useTranslations("VerificationsHistory");

  const {
    requests,
    loading,
    error,
    search,
    currentPage,
    totalPages,
    totalItems,
    statusFilter,
    globalStats, // ← real counts, unaffected by active filter
    refresh,
    changePage,
    changeStatusFilter,
    changeSearch,
    setError,
  } = useVerificationsHistory({ itemsPerPage: 10 });

  // ── helpers ────────────────────────────────────────────────────────────
  const getFullName = (f: string, l: string) =>
    `${f || ""} ${l || ""}`.trim() || "—";

  const getNotes = (req: VerificationRequest) =>
    req.rejectionMotif || req.adminComment || null;

  const getProcessedBy = (req: VerificationRequest) =>
    req.validatedBy
      ? getFullName(req.validatedBy.firstName, req.validatedBy.lastName)
      : "—";

  // approval rate based on global (unfiltered) counts
  const processed =
    (globalStats?.validatedCount ?? 0) + (globalStats?.rejectedCount ?? 0);
  const approvalRate =
    processed > 0
      ? Math.round(((globalStats?.validatedCount ?? 0) / processed) * 100)
      : 0;

  // ── stat cards ────────────────────────────────────────────────────────
  const stats = [
    {
      label: t("stats.total"),
      value: globalStats?.totalCount ?? 0,
      Icon: TbFileCheck,
      grad: "from-indigo-500 to-violet-600",
      border: "border-indigo-100 dark:border-indigo-900/40",
      cls: "text-indigo-600 dark:text-indigo-400",
    },
    {
      label: t("stats.approvalRate"),
      value: `${approvalRate}%`,
      bar: approvalRate,
      Icon: TbShieldCheck,
      grad: "from-emerald-400 to-teal-500",
      border: "border-emerald-100 dark:border-emerald-900/40",
      cls: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: t("stats.rejected"),
      value: globalStats?.rejectedCount ?? 0,
      Icon: TbShieldX,
      grad: "from-rose-400 to-red-500",
      border: "border-rose-100 dark:border-rose-900/40",
      cls: "text-rose-600 dark:text-rose-400",
    },
  ] as const;

  // ── filter tabs — counts come from globalStats, NOT from filtered requests
  const filterTabs: {
    key: "ALL" | "VALIDATED" | "REJECTED";
    label: string;
    count: number;
    active: string;
  }[] = [
    {
      key: "ALL",
      label: t("filters.all"),
      count: globalStats?.totalCount ?? 0,
      active:
        "bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-transparent",
    },
    {
      key: "VALIDATED",
      label: t("filters.validated"),
      count: globalStats?.validatedCount ?? 0,
      active:
        "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent",
    },
    {
      key: "REJECTED",
      label: t("filters.rejected"),
      count: globalStats?.rejectedCount ?? 0,
      active:
        "bg-gradient-to-r from-rose-500 to-red-500 text-white border-transparent",
    },
  ];

  const TABLE_HEADS = [
    t("table.submittedAt"),
    t("table.user"),
    t("table.status"),
    t("table.processedAt"),
    t("table.processedBy"),
    t("table.notes"),
    t("table.action"),
  ];
  const Breadcrumb = ({ locale, t }: { locale: string; t: any }) => (
    <div className="flex items-center gap-2 text-sm mb-4">
      <Link
        href={`/${locale}/admin/verifications`}
        className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
      >
        {t("verifications")}
      </Link>
      <MdOutlineChevronRight className="text-slate-400 dark:text-slate-600 text-sm" />
      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
        {t("history")}
      </span>
    </div>
  );
  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
      <Breadcrumb locale={locale} t={t} />

      {/* ══ HEADER ══════════════════════════════════════════════════════ */}
      <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-2 -mt-5">
        {/* left */}

        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
              {t("title")}
            </h2>
            <p className="text-slate-400 dark:text-slate-500 text-sm leading-none mt-0.5">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {/* right — stat cards */}
        <div className="flex gap-3 shrink-0">
          {stats.map(({ label, value, Icon, grad, border, cls, ...rest }) => (
            <div
              key={label}
              className={`bg-white dark:bg-slate-900 rounded-2xl border ${border} px-4 py-3 flex items-center gap-3 min-w-[130px] ${card3d}`}
            >
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm shrink-0`}
              >
                <Icon className="text-white text-base" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xl font-black leading-none ${cls}`}>
                  {value}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium truncate">
                  {label}
                </p>
                {"bar" in rest && typeof rest.bar === "number" && (
                  <div className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${rest.bar}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ AUDIT BANNER ════════════════════════════════════════════════ */}
      <div
        className={`shrink-0 flex items-center gap-4 px-5 py-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-gradient-to-r from-indigo-50/70 to-violet-50/40 dark:from-indigo-900/15 dark:to-violet-900/10 ${card3d}`}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm shrink-0">
          <MdOutlineShield className="text-white text-base" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Journal d'audit chiffré · Conservation 7 ans
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            NESTHUB maintient une piste d'audit chiffrée de toutes les activités
            conformément aux normes réglementaires.
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {[
            { label: "AES-256", dot: "bg-emerald-500" },
            { label: "RGPD", dot: "bg-indigo-500" },
            { label: "7 ans", dot: "bg-violet-500" },
          ].map(({ label, dot }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse`}
              />
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ MAIN TABLE CARD ═════════════════════════════════════════════ */}
      <div
        className={`flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden ${block3d}`}
      >
        {/* ── toolbar ── */}
        <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-indigo-50 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/40 to-violet-50/20 dark:from-indigo-900/10 dark:to-violet-900/5">
          {/* filter pills — counts use globalStats */}
          <div className="flex gap-1.5">
            {filterTabs.map(({ key, label, count, active }) => (
              <button
                key={key}
                onClick={() => changeStatusFilter(key)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  statusFilter === key
                    ? active
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {label}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none ${
                    statusFilter === key
                      ? "bg-white/25 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* search + refresh */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:w-72">
              <SearchBar
                value={search}
                onChange={changeSearch}
                placeholder={t("searchPlaceholder")}
                className="w-full"
              />
            </div>
            <button
              onClick={refresh}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-indigo-500 hover:border-indigo-400 hover:text-indigo-700 transition-all text-sm font-medium shrink-0"
            >
              <TbRefresh className="text-base" />
              {t("refresh")}
            </button>
          </div>
        </div>

        {/* ── content ── */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="p-6">
              <Alert
                type="error"
                message={error}
                onClose={() => setError(null)}
              />
            </div>
          ) : requests.length === 0 ? (
            /* empty state */
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/15 to-violet-400/15 rounded-full blur-3xl scale-150" />
                <div className="relative w-56 h-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
                      <TbHistoryToggle className="text-indigo-300 dark:text-indigo-700 text-5xl" />
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-28 h-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full" />
                      <div className="w-20 h-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-xl">
                  <MdOutlineCheckCircle className="text-white" size={18} />
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3 text-center">
                {t("empty.title")}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm text-center mb-8 leading-relaxed">
                {t("empty.description")}
              </p>
              <Link
                href={`/${locale}/admin/verifications`}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-sm shadow-sm transition-all active:scale-[0.98]"
              >
                <TbLayoutDashboard size={15} />
                {t("backToPending")}
              </Link>
            </div>
          ) : (
            /* table */
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10">
                <tr className="bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30">
                  {TABLE_HEADS.map((h, i) => (
                    <th
                      key={h}
                      className={`px-5 py-3 text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap ${
                        i === TABLE_HEADS.length - 1
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-indigo-50/25 dark:hover:bg-indigo-900/10 transition-colors"
                  >
                    {/* submitted */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <DateCell date={req.submittedAt} />
                    </td>

                    {/* user + email stacked */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40">
                          {req.user.profilePictureUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={`/api/admin/serve-image?url=${encodeURIComponent(req.user.profilePictureUrl)}`}
                              alt={req.user.firstName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                              {req.user.firstName?.[0]}
                              {req.user.lastName?.[0]}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight truncate">
                            {getFullName(req.user.firstName, req.user.lastName)}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {req.user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* status */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <StatusBadge status={req.status} />
                    </td>

                    {/* processed at */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <DateCell date={req.processedAt} />
                    </td>

                    {/* processed by */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {getProcessedBy(req)}
                      </span>
                    </td>

                    {/* notes */}
                    <td className="px-5 py-3.5 max-w-[200px]">
                      {getNotes(req) ? (
                        <p
                          className={`text-xs truncate italic ${
                            req.rejectionMotif
                              ? "text-rose-500 dark:text-rose-400"
                              : "text-slate-400 dark:text-slate-500"
                          }`}
                          title={getNotes(req) ?? undefined}
                        >
                          {getNotes(req)}
                        </p>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700 text-sm">
                          —
                        </span>
                      )}
                    </td>

                    {/* action */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <Link
                        href={`/${locale}/admin/verifications/${req.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.97]"
                      >
                        <MdOutlineVisibility className="text-sm" />
                        {t("table.view")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── pagination ── */}
        {totalPages > 1 && (
          <div className="shrink-0 border-t border-indigo-50 dark:border-indigo-900/30 px-5 py-3 flex items-center justify-between bg-gradient-to-r from-indigo-50/30 to-violet-50/10 dark:from-indigo-900/5 dark:to-violet-900/5">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {t("pagination.showing")}{" "}
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                {requests.length}
              </span>{" "}
              {t("pagination.of")}{" "}
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                {totalItems}
              </span>{" "}
              {t("pagination.results")}
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={10}
              onPageChange={changePage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
