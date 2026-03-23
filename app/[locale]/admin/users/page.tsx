"use client";

import React, { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { useAdminUsers } from "./hooks/useAdminUsers";
import { decodeJWT } from "@/lib/utils/jwt";

import SearchBar from "@/components/ui/SearchBar";
import FilterSelect from "@/components/ui/FilterSelect";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Alert from "@/components/ui/Alert";
import StatsCard from "@/components/ui/StatsCard";

import UserStatusBadge from "@/components/ui/badges/UserStatusBadge";
import UserRoleBadge from "@/components/ui/badges/UserRoleBadge";
import UserVerificationBadge from "@/components/ui/badges/UserVerificationBadge";

import SuspendUserModal from "@/components/ui/modals/SuspendUserModal";
import BanUserModal from "@/components/ui/modals/BanUserModal";
import ActivateUserModal from "@/components/ui/modals/ActivateUserModal";
import LockUnlockModal from "@/components/ui/modals/LockUnlockModal";
import EscalateUserModal from "@/components/ui/modals/EscalateUserModal";
import AddNoteModal from "@/components/ui/modals/AddNoteModal";
import ActionsHistoryModal from "@/components/ui/modals/ActionsHistoryModal";
import WarningUserModal from "@/components/ui/modals/WarningUserModal";

import {
  IoDownloadOutline, IoPauseCircleOutline, IoBanOutline,
  IoCheckmarkCircleOutline, IoWarningOutline, IoLockClosedOutline,
  IoLockOpenOutline, IoCreateOutline, IoArrowUpCircleOutline,
  IoArrowUndoOutline, IoEllipsisVertical, IoFilterOutline,
  IoSearchOutline, IoCloseOutline,
} from "react-icons/io5";
import { AiOutlineUsergroupAdd } from "react-icons/ai";
import { PiUsersThree } from "react-icons/pi";
import { GoShieldCheck } from "react-icons/go";
import { BsFiletypeCsv, BsFiletypePdf, BsTelephone } from "react-icons/bs";
import { MdOutlinePeopleAlt, MdOutlineVerified, MdOutlinePending } from "react-icons/md";
import { RiUserSharedLine } from "react-icons/ri";
import { FiChevronDown } from "react-icons/fi";

// ─── Shadows — same as AdminContentPage & AdminTeamPage ──────
const block3d = "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";
const card3d  = "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

export default function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = React.use(params);
  const t = useTranslations("admin.usersManagement");
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; userId: string | null }>({
    top: 0, left: 0, userId: null,
  });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuPosition({ top: 0, left: 0, userId: null });
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  React.useEffect(() => {
    const checkAdmin = async () => {
      if (!isUserLoaded || !clerkUser) { setIsAdmin(false); return; }
      try {
        const token = await getToken({ template: "my-app-template" });
        if (!token) { setIsAdmin(false); return; }
        setIsAdmin(decodeJWT(token)?.role === "ADMIN");
      } catch { setIsAdmin(false); }
    };
    checkAdmin();
  }, [isUserLoaded, clerkUser, getToken]);

  const {
    users, stats, actions, pagination, loading, error, success,
    setSuccess, setError, filters, setFilter, resetFilters,
    selectedUsers, selectedUser, handleSelectAll, handleSelectUser, setPage,
    showSuspendModal, showBanModal, showActivateModal, showLockUnlockModal,
    showEscalateModal, showAddNoteModal, showWarningModal, showActionsHistory,
    showExportOptions, openSuspendModal, openBanModal, openActivateModal,
    openLockUnlockModal, openEscalateModal, openAddNoteModal, openWarningModal,
    openActionsHistory, toggleExportOptions, closeModals,
    handleSuspend, handleBan, handleActivate, handleLock, handleUnlock,
    handleEscalate, handleAddNote, handleWarning, handleUndoAction, handleExport,
  } = useAdminUsers();

  const openMenu = (event: React.MouseEvent, userId: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + window.scrollY + 5, left: rect.left + window.scrollX - 160, userId });
  };
  const closeMenu = () => setMenuPosition({ top: 0, left: 0, userId: null });

  if (!isUserLoaded || isAdmin === null)
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  if (isAdmin === false)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-10 bg-white dark:bg-slate-900 rounded-2xl shadow-lg">
          <RiUserSharedLine className="text-6xl text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-2">Accès non autorisé</h1>
        </div>
      </div>
    );

  const roleOptions = [
    { value: "ALL", label: t("filters.role.all") },
    { value: "ADMIN", label: t("filters.role.admin") },
    { value: "PROPERTY_OWNER", label: t("filters.role.property_owner") },
    { value: "TENANT", label: t("filters.role.tenant") },
  ];
  const statusOptions = [
    { value: "ALL", label: t("filters.status.all") },
    { value: "ACTIVE", label: t("filters.status.active") },
    { value: "PENDING_VALIDATION", label: t("filters.status.pending") },
    { value: "TEMPORARILY_SUSPENDED", label: t("filters.status.suspended") },
    { value: "PERMANENTLY_BANNED", label: t("filters.status.banned") },
    { value: "REJECTED", label: t("filters.status.rejected") },
    { value: "SECURITY_LOCKED", label: "Bloqués (sécurité)" },
    { value: "MANUALLY_BLOCKED", label: "Bloqués (manuel)" },
    { value: "INACTIVE", label: "Inactifs" },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">

      {/* Alerts */}
      {error   && <div className="fixed top-5 right-5 z-[60] w-full max-w-sm"><Alert type="error"   message={error}   onClose={() => setError(null)}   /></div>}
      {success && <div className="fixed top-5 right-5 z-[60] w-full max-w-sm"><Alert type="success" message={success} onClose={() => setSuccess(null)} /></div>}

      {/* ── HEADER ── */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t("page.title")}</h2>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">{t("page.description")}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* History button */}
          <button onClick={openActionsHistory}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition-all text-sm font-medium">
            <IoArrowUndoOutline className="text-base" />
            Historique
          </button>
          {/* Export button */}
          <div className="relative">
            <button onClick={toggleExportOptions}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold shadow-sm transition-all">
              <IoDownloadOutline className="text-base" />
              {t("actions.export")}
              <FiChevronDown className="text-xs" />
            </button>
            {showExportOptions && (
              <div className={`absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 z-50 overflow-hidden ${block3d}`}>
                <button onClick={() => handleExport("csv")}
                  className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-3 transition-colors">
                  <BsFiletypeCsv className="text-emerald-500 text-lg" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">CSV</p>
                    <p className="text-xs text-slate-400">Pour Excel / analyse</p>
                  </div>
                </button>
                <button onClick={() => handleExport("pdf")}
                  className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-3 border-t border-indigo-50 dark:border-indigo-900/20 transition-colors">
                  <BsFiletypePdf className="text-red-500 text-lg" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">PDF</p>
                    <p className="text-xs text-slate-400">Pour impression</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
          {[
            {
              title: t("stats.totalUsers"),
              value: stats.totalUsers,
              Icon: PiUsersThree,
              grad: "from-indigo-500 to-blue-600",
              bg: "border-indigo-100 dark:border-indigo-900/40",
              cls: "text-indigo-600 dark:text-indigo-400",
            },
            {
              title: t("stats.newUsers30d"),
              value: stats.newUsers30d,
              Icon: AiOutlineUsergroupAdd,
              grad: "from-emerald-400 to-teal-500",
              bg: "border-emerald-100 dark:border-emerald-900/40",
              cls: "text-emerald-600 dark:text-emerald-400",
            },
            {
              title: "En attente de validation",
              value: stats.pendingValidationUsers || 0,
              Icon: MdOutlinePending,
              grad: "from-amber-400 to-orange-500",
              bg: "border-amber-100 dark:border-amber-900/40",
              cls: "text-amber-600 dark:text-amber-400",
            },
            {
              title: t("stats.verifiedIdentity"),
              value: `${stats.verifiedIdentity || 0}%`,
              Icon: GoShieldCheck,
              grad: "from-violet-500 to-purple-600",
              bg: "border-violet-100 dark:border-violet-900/40",
              cls: "text-violet-600 dark:text-violet-400",
            },
          ].map(({ title, value, Icon, grad, bg, cls }) => (
            <div key={title} className={`bg-white dark:bg-slate-900 rounded-2xl border ${bg} p-4 flex items-center gap-4 ${card3d}`}>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm flex-shrink-0`}>
                <Icon className="text-white text-xl" />
              </div>
              <div>
                <p className={`text-2xl font-black leading-none ${cls}`}>{value}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium leading-tight">{title}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── FILTERS + TABLE CARD ── */}
      <div className={`flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden ${block3d}`}>

        {/* Filters bar */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-indigo-50 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/40 to-violet-50/20 dark:from-indigo-900/10 dark:to-violet-900/5">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-base" />
              <input
                type="text"
                value={filters.search}
                onChange={e => setFilter("search", e.target.value)}
                placeholder={t("filters.searchPlaceholder")}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-slate-100 placeholder:text-indigo-300 dark:placeholder:text-indigo-700"
              />
            </div>
            {/* Role filter */}
            <select value={filters.role} onChange={e => setFilter("role", e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors text-slate-700 dark:text-slate-300 appearance-none">
              {roleOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {/* Status filter */}
            <select value={filters.status} onChange={e => setFilter("status", e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors text-slate-700 dark:text-slate-300 appearance-none">
              {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {/* Advanced toggle */}
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                showFilters
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 text-indigo-500 hover:border-indigo-400"
              }`}>
              <IoFilterOutline className="text-sm" />
              Filtres avancés
            </button>
            {/* Reset */}
            <button onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
              <IoCloseOutline className="text-sm" />
              Réinitialiser
            </button>
          </div>

          {/* Advanced filters */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-900/30 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5">
                  {t("filters.advanced.dateRange")}
                </label>
                <DateRangePicker
                  startDate={filters.dateFrom} endDate={filters.dateTo}
                  onStartDateChange={date => setFilter("dateFrom", date)}
                  onEndDateChange={date => setFilter("dateTo", date)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5">
                  {t("filters.advanced.minReliability")}
                </label>
                <input type="number" min="0" max="100" value={filters.minReliability}
                  onChange={e => setFilter("minReliability", e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Min 0%" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5">
                  {t("filters.advanced.maxFraud")}
                </label>
                <input type="number" min="0" max="100" value={filters.maxFraud}
                  onChange={e => setFilter("maxFraud", e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Max 100%" />
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40"><LoadingSpinner /></div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-indigo-300 dark:text-indigo-700">
              <PiUsersThree className="text-5xl" />
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("messages.noUsers")}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox"
                      checked={selectedUsers.length === users.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  </th>
                  {["Utilisateur", "Contact", "Rôle", "Statut", "Vérification", "Fiabilité", "Inscription", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {users.map(user => (
                  <tr key={`${user.id}-${user.status}`}
                    className="hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors">
                    {/* Checkbox */}
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <input type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    </td>
                    {/* User */}
                    <td className="px-4 py-3.5 cursor-pointer"
                      onClick={() => router.push(`/${locale}/admin/users/${user.id}`)}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 overflow-hidden flex-shrink-0">
                          {user.profilePictureUrl ? (
                            <Image src={user.profilePictureUrl} alt="" width={32} height={32} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-tight">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-[11px] text-slate-400">#{user.id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    {/* Contact */}
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
                      {user.phoneNumber && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <BsTelephone className="text-[10px]" />{user.phoneNumber}
                        </p>
                      )}
                    </td>
                    {/* Role */}
                    <td className="px-4 py-3.5"><UserRoleBadge role={user.role} /></td>
                    {/* Status */}
                    <td className="px-4 py-3.5"><UserStatusBadge status={user.status} suspendedUntil={user.suspendedUntil} /></td>
                    {/* Verification */}
                    <td className="px-4 py-3.5">
                      <UserVerificationBadge isVerified={user.isIdentityVerified} status={user.verificationRequests?.[0]?.status} />
                    </td>
                    {/* Reliability */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              (user.reliabilityScore || 0) >= 70 ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                              : (user.reliabilityScore || 0) >= 40 ? "bg-gradient-to-r from-amber-400 to-orange-400"
                              : "bg-gradient-to-r from-red-400 to-rose-500"
                            }`}
                            style={{ width: `${user.reliabilityScore || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {user.reliabilityScore || 0}%
                        </span>
                      </div>
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString(locale)}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={e => { e.stopPropagation(); openAddNoteModal(user); }}
                          title="Ajouter une note"
                          className="p-1.5 text-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                          <IoCreateOutline className="text-base" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); openMenu(e, user.id); }}
                          className="p-1.5 text-indigo-300 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors">
                          <IoEllipsisVertical className="text-base" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* ── Floating action menu ── */}
      {menuPosition.userId && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeMenu} />
          <div className={`fixed z-50 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40 overflow-hidden ${block3d}`}
            style={{ top: menuPosition.top, left: menuPosition.left }}>
            {users.find(u => u.id === menuPosition.userId) && (() => {
              const u = users.find(u => u.id === menuPosition.userId)!;
              return (
                <div className="py-1">
                  {u.status === "ACTIVE" && (
                    <button onClick={() => { openWarningModal(u); closeMenu(); }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-700 dark:text-slate-300 hover:text-amber-600 flex items-center gap-2.5 transition-colors">
                      <IoWarningOutline className="text-base text-amber-500" />Avertissement
                    </button>
                  )}
                  {(u.status === "TEMPORARILY_SUSPENDED" || u.status === "PERMANENTLY_BANNED") && (
                    <button onClick={() => { openActivateModal(u); closeMenu(); }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-700 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-2.5 transition-colors">
                      <IoCheckmarkCircleOutline className="text-base text-emerald-500" />Réactiver
                    </button>
                  )}
                  {(u.status === "SECURITY_LOCKED" || u.status === "MANUALLY_BLOCKED") && (
                    <button onClick={() => { openActivateModal(u); closeMenu(); }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-700 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-2.5 transition-colors">
                      <IoCheckmarkCircleOutline className="text-base text-emerald-500" />Débloquer
                    </button>
                  )}
                  {u.status === "ACTIVE" && (
                    <>
                      <button onClick={() => { openLockUnlockModal(u); closeMenu(); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-700 dark:text-slate-300 hover:text-amber-600 flex items-center gap-2.5 transition-colors border-t border-slate-50 dark:border-slate-800">
                        <IoLockClosedOutline className="text-base text-amber-500" />Bloquer
                      </button>
                      <button onClick={() => { openSuspendModal(u); closeMenu(); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-700 dark:text-slate-300 hover:text-amber-600 flex items-center gap-2.5 transition-colors">
                        <IoPauseCircleOutline className="text-base text-amber-500" />Suspendre
                      </button>
                    </>
                  )}
                  {u.status !== "PERMANENTLY_BANNED" && (
                    <>
                      <button onClick={() => { openBanModal(u); closeMenu(); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-700 dark:text-slate-300 hover:text-red-600 flex items-center gap-2.5 transition-colors border-t border-slate-50 dark:border-slate-800">
                        <IoBanOutline className="text-base text-red-500" />Bannir
                      </button>
                      <button onClick={() => { openEscalateModal(u); closeMenu(); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-violet-50 dark:hover:bg-violet-900/20 text-slate-700 dark:text-slate-300 hover:text-violet-600 flex items-center gap-2.5 transition-colors">
                        <IoArrowUpCircleOutline className="text-base text-violet-500" />Escalade
                      </button>
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        </>
      )}

      {/* Modals */}
      <SuspendUserModal isOpen={showSuspendModal} onClose={closeModals} user={selectedUser} onConfirm={handleSuspend} />
      <BanUserModal isOpen={showBanModal} onClose={closeModals} user={selectedUser} onConfirm={handleBan} />
      <ActivateUserModal isOpen={showActivateModal} onClose={closeModals} user={selectedUser} onConfirm={handleActivate} />
      <LockUnlockModal isOpen={showLockUnlockModal} onClose={closeModals} user={selectedUser} onLock={handleLock} onUnlock={handleUnlock} />
      <EscalateUserModal isOpen={showEscalateModal} onClose={closeModals} user={selectedUser} onEscalate={handleEscalate} currentLevel={selectedUser?.escalationLevel || 0} />
      <AddNoteModal isOpen={showAddNoteModal} onClose={closeModals} user={selectedUser} onAddNote={handleAddNote} />
      <WarningUserModal isOpen={showWarningModal} onClose={closeModals} user={selectedUser} onConfirm={handleWarning} />
      <ActionsHistoryModal isOpen={showActionsHistory} onClose={closeModals} actions={actions} onUndo={handleUndoAction} />
    </div>
  );
}