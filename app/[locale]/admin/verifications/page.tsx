'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useVerifications } from './hooks/useVerifications';

import SearchBar from '@/components/ui/SearchBar';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import StatsCard from '@/components/ui/StatsCard';

import {
  MdOutlinePendingActions,
  MdOutlineFactCheck,
  MdMarkEmailRead,
} from 'react-icons/md';
import { TbRefresh, TbLayoutDashboard, TbHistoryToggle } from 'react-icons/tb';
import { FaRegCheckCircle } from 'react-icons/fa';
import { IoArrowForwardOutline, IoFilterOutline } from 'react-icons/io5';
import { RiUserSharedLine } from 'react-icons/ri';

const block3d = "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";
const card3d  = "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

function formatRelativeTime(date: string, t: any) {
  const now = new Date();
  const then = new Date(date);
  const diffMinutes = Math.floor((now.getTime() - then.getTime()) / (1000 * 60));
  if (diffMinutes < 1) return t("justNow");
  if (diffMinutes < 60) return t("minutesAgo", { count: diffMinutes });
  if (diffMinutes < 120) return t("oneHourAgo");
  if (diffMinutes < 1440) return t("hoursAgo", { count: Math.floor(diffMinutes / 60) });
  return t("daysAgo", { count: Math.floor(diffMinutes / 1440) });
}

export default function VerificationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = React.use(params);
  const router = useRouter();
  const t = useTranslations("Verifications");

  const {
    requests, stats, pagination, loading, error,
    search, isAdmin, isUserLoaded,
    setSearch, setPage, refresh, setError,
  } = useVerifications();

  if (!isUserLoaded || isAdmin === null)
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  if (isAdmin === false)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-10 bg-white dark:bg-slate-900 rounded-2xl shadow-lg">
          <RiUserSharedLine className="text-6xl text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-2">{t("unauthorized")}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t("adminRequired")}</p>
        </div>
      </div>
    );

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">

      {error && (
        <div className="fixed top-5 right-5 z-[60] w-full max-w-sm">
          <Alert type="error" message={error} onClose={() => setError(null)} />
        </div>
      )}

      {/* ── HEADER — title left, stats cards right ── */}
      <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("title")}
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">
            {t("description")}
          </p>
        </div>

        {/* Stats cards */}
        <div className="flex gap-3 flex-shrink-0">
          {[
            {
              title: t("stats.pending"),
              value: stats?.pendingCount ?? 0,
              Icon: MdOutlinePendingActions,
              grad: "from-amber-400 to-orange-500",
              border: "border-amber-100 dark:border-amber-900/40",
              cls: "text-amber-600 dark:text-amber-400",
            },
            {
              title: t("stats.processedToday"),
              value: stats?.processedToday ?? 0,
              Icon: MdOutlineFactCheck,
              grad: "from-indigo-500 to-violet-600",
              border: "border-indigo-100 dark:border-indigo-900/40",
              cls: "text-indigo-600 dark:text-indigo-400",
            },
          ].map(({ title, value, Icon, grad, border, cls }) => (
            <div key={title} className={`bg-white dark:bg-slate-900 rounded-2xl border ${border} px-4 py-3 flex items-center gap-3 ${card3d}`}>
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm flex-shrink-0`}>
                <Icon className="text-white text-base" />
              </div>
              <div>
                <p className={`text-xl font-black leading-none ${cls}`}>{value}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">{title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN CARD ── */}
      <div className={`flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden ${block3d}`}>

        {/* Table header — search + refresh button */}
        {requests.length > 0 && (
          <div className="flex-shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-b border-indigo-50 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/40 to-violet-50/20 dark:from-indigo-900/10 dark:to-violet-900/5">
            <div className="flex-1 min-w-[280px]">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder={t("searchPlaceholder")}
                className="w-full"
              />
            </div>
            <button onClick={refresh}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-indigo-500 hover:border-indigo-400 hover:text-indigo-700 transition-all text-sm font-medium flex-shrink-0">
              <TbRefresh className="text-base" />
              {t("refresh")}
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-12 text-center"><LoadingSpinner /></div>
          ) : error ? (
            <div className="p-6"><Alert type="error" message={error} onClose={() => setError(null)} /></div>
          ) : requests.length > 0 ? (
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10">
                <tr className="bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30">
                  {[t("table.user"), t("table.role"), t("table.date"), t("table.status"), t("table.action")].map((h, i) => (
                    <th key={h} className={`px-5 py-3 text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider ${i === 4 ? "text-right" : "text-left"}`}>
                      {h}
                    </th>
                  ))}
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors">
                    {/* Utilisateur */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 flex-shrink-0">
                          {req.user.profilePictureUrl ? (
                            <Image src={req.user.profilePictureUrl} alt={req.user.firstName || ''} width={36} height={36} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                              {req.user.firstName?.[0]}{req.user.lastName?.[0]}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-tight">
                            {req.user.firstName} {req.user.lastName}
                          </p>
                          <p className="text-[11px] text-slate-400">{req.user.email}</p>
                        </div>
                      </div>
                    </td>
                    {/* Rôle */}
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 uppercase">
                        {req.user.role === "PROPERTY_OWNER" ? t("role.owner") : t("role.tenant")}
                      </span>
                    </td>
                    {/* Date */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {formatRelativeTime(req.submittedAt, t)}
                      </span>
                    </td>
                    {/* Statut */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        {t("status.pending")}
                      </span>
                    </td>
                    {/* Action */}
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/${locale}/admin/verifications/${req.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
                      >
                        {t("processRequest")}
                        <IoArrowForwardOutline />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/15 to-violet-400/15 rounded-full blur-3xl scale-150" />
                <div className="relative w-72 h-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center overflow-hidden border border-indigo-100 dark:border-indigo-900/40">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
                        <MdMarkEmailRead className="text-indigo-300 dark:text-indigo-600" size={100} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-24 h-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full" />
                      <div className="w-12 h-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full" />
                    </div>
                    <div className="w-40 h-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full" />
                  </div>
                </div>
                <div className="absolute -top-3 -right-4 w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-xl">
                  <FaRegCheckCircle className="text-white" size={20} />
                </div>
              </div>

              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight text-center">
                {t("empty.title")}
              </h3>
              <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 max-w-lg leading-relaxed text-center">
                {t("empty.description")}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <Link href={`/${locale}/admin/dashboard`}
                  className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-sm shadow-sm transition-all">
                  <TbLayoutDashboard size={18} />
                  {t("empty.backToDashboard")}
                </Link>
                <Link href={`/${locale}/admin/verifications/history`}
                  className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:border-indigo-400 transition-all">
                  <TbHistoryToggle size={18} />
                  {t("empty.viewHistory")}
                </Link>
              </div>

              {stats && (stats.processedToday > 0 || stats.averageProcessingTime > 0) && (
                <div className="mt-12 flex items-center gap-8 py-4 px-8 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 shadow-sm">
                  {stats.processedToday > 0 && (
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("stats.processedToday")}</span>
                      <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{stats.processedToday} {t("stats.documents")}</span>
                    </div>
                  )}
                  {stats.averageProcessingTime > 0 && (
                    <>
                      <div className="w-px h-8 bg-indigo-100 dark:bg-indigo-900/30" />
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("stats.averageTime")}</span>
                        <span className="text-xl font-black text-violet-600 dark:text-violet-400">{stats.averageProcessingTime} {t("stats.minutes")}</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex-shrink-0 border-t border-indigo-50 dark:border-indigo-900/30">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalCount}
              pageSize={pagination.limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}