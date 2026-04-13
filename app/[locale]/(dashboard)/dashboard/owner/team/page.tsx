// components/owner/TeamManagementUI.tsx
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Users,
  UserPlus,
  Mail,
  Calendar,
  Shield,
  Edit,
  CheckCircle,
  XCircle,
  Building2,
  DollarSign,
  Settings,
  UserX,
  X,
  Loader2,
  Star,
  MoreHorizontal,
  History,
  ChevronRight,
  Clock,
  Trophy,
  Bell,
  Send,
  Info,
  AlertCircle,
  Check,
} from "lucide-react";
import { RiMailCloseLine } from "react-icons/ri";
import { LuUserX } from "react-icons/lu";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import InviteCoHostModal from "@/components/ui/modals/InviteCoOwnerModal";
import Pagination from "@/components/ui/Pagination";
import Alert from "@/components/ui/Alert";
import { useTeamManagement } from "./hooks/useTeamManagement";

const cardHover =
  "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg";

// Fonction pour obtenir l'URL de l'image
const getImageUrl = (url: string) => {
  if (!url) return null;
  if (url.startsWith("blob:")) return url;
  if (url.startsWith("/api/")) return url;
  return `/api/listings/image?url=${encodeURIComponent(url)}`;
};

// Composant User Avatar
function UserAvatar({ user }: { user: any }) {
  const initials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}` || "?";
  const imageUrl = user?.profilePictureUrl
    ? getImageUrl(user.profilePictureUrl)
    : null;

  return (
    <div className="w-16 h-16 md:w-18 md:h-18 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 ring-2 ring-indigo-500/20 dark:ring-indigo-400/20">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl">
          {initials}
        </div>
      )}
    </div>
  );
}

// Composant Team Member Card
function TeamMemberCard({
  member,
  onOpenMenu,
  onOpenPermissions,
  onViewHistory,
  t,
}: any) {
  const roleLabel =
    member.role === "MANAGER"
      ? t("roles.manager")
      : member.role === "CO_HOST"
        ? t("roles.coHost")
        : t("roles.observer");

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm ${cardHover} group relative`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <UserAvatar user={member.user} />
          <div>
            <h4 className="font-semibold text-lg text-slate-900 dark:text-white">
              {member.user.firstName} {member.user.lastName}
            </h4>
            <div className="flex items-center gap-1.5 mt-1">
              <Star size={12} className="text-amber-500 fill-current" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                {roleLabel}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={(e) => onOpenMenu(e, member.id)}
          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 text-center">
          <div className="font-bold text-base text-indigo-600 dark:text-indigo-400">
            {member.canManageBookings ? "98%" : "0%"}
          </div>
          <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            {t("stats.performance")}
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 text-center">
          <div className="font-bold text-base text-violet-600 dark:text-violet-400">
            {member.canEdit ? "12m" : "--"}
          </div>
          <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            {t("stats.response")}
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 text-center">
          <div className="font-bold text-base text-purple-600 dark:text-purple-400">
            {member.canViewRevenue ? "442" : "0"}
          </div>
          <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            {t("stats.tasks")}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            {t("card.property")}
          </span>
          <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
            {member.listing?.title || t("card.none")}
          </span>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onOpenPermissions(member)}
            className="flex-1 py-2 text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
          >
            {t("actions.permissions")}
          </button>
          <button
            onClick={() => onViewHistory(member)}
            className="w-10 py-2 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title={t("actions.history")}
          >
            <History size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Fonctions utilitaires
const getRemainingTime = (expiresAt: string, t: any) => {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours <= 0) return t("invitations.expired");
  if (hours < 24) return t("invitations.hoursLeft", { hours });
  const days = Math.floor(hours / 24);
  return t("invitations.daysLeft", { days });
};

const getProgress = (createdAt: string, expiresAt: string) => {
  const created = new Date(createdAt);
  const expiry = new Date(expiresAt);
  const now = new Date();
  const total = expiry.getTime() - created.getTime();
  const elapsed = now.getTime() - created.getTime();
  const progress = (elapsed / total) * 100;
  return Math.min(Math.max(progress, 0), 100);
};

const isExpiringSoon = (expiresAt: string) => {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const hoursLeft = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursLeft < 24 && hoursLeft > 0;
};

const getRoleConfig = (role: string, t: any) => {
  switch (role) {
    case "MANAGER":
      return { label: t("roles.manager"), color: "primary", icon: Bell };
    case "CO_HOST":
      return { label: t("roles.coHost"), color: "secondary", icon: Mail };
    default:
      return { label: t("roles.observer"), color: "tertiary", icon: Clock };
  }
};

const getRoleColorClass = (color: string) => {
  switch (color) {
    case "primary":
      return "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400";
    case "secondary":
      return "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400";
    case "tertiary":
      return "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400";
    default:
      return "bg-indigo-100 text-indigo-600";
  }
};

// UI Principal
export default function TeamManagementUI() {
  const t = useTranslations("TeamManagement");
  const {
    teamMembers,
    pendingInvitations,
    listings,
    loading,
    selectedListingId,
    showInviteModal,
    alert,
    permissionModalOpen,
    selectedMember,
    updatingPermissions,
    menuPosition,
    remindingId,
    currentPage,
    totalPages,
    totalMembers,
    currentMembers,
    totalInvitations,
    totalListings,
    activeRate,
    itemsPerPage,
    setShowInviteModal,
    setAlert,
    setPermissionModalOpen,
    setSelectedMember,
    setCurrentPage,
    setSelectedListingId,
    fetchData,
    cancelInvitation,
    remindInvitation,
    removeTeamMember,
    updatePermissions,
    openMenu,
    closeMenu,
  } = useTeamManagement();

  const viewMemberHistory = (member: any) => {
    console.log("Voir historique de", member.user.firstName);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-backgroud-light dark:bg-background-dark gap-4">
        <LoadingSpinner />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("loading.message")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-backgroud-light dark:bg-background-dark">
      {/* Alert */}
      {alert && (
        <div className="fixed top-20 right-6 z-50 w-full max-w-sm animate-in slide-in-from-top-2 fade-in duration-300">
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
            autoClose={5000}
          />
        </div>
      )}

      {/* Hero Section - Sans marges latérales */}
      <section className="relative rounded-2xl overflow-hidden mb-8 mt-6 group shadow-md mx-4">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-600/90 to-purple-600/90 z-10" />
        <div className="absolute inset-0">
          <img
            alt="Team Collaboration"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=300&fit=crop"
          />
        </div>
        <div className="relative z-20 px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white text-[10px] font-semibold uppercase tracking-wider mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {t("hero.badge")}
            </div>
            <h2 className="text-white text-2xl md:text-3xl font-bold tracking-tight mb-2">
              {t("hero.title")}
            </h2>
            <p className="text-white/80 text-sm max-w-lg">
              {t("hero.description")}
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-white text-indigo-600 hover:bg-slate-50 transition-all px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md shadow-indigo-500/30 flex items-center gap-2 active:scale-95"
          >
            <UserPlus size={16} />
            {t("hero.button")}
          </button>
        </div>
      </section>

      {/* Stats Cards - Sans marges latérales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Users
                size={18}
                className="text-indigo-600 dark:text-indigo-400"
              />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {totalMembers}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("stats.activeMembers")}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Mail size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {totalInvitations}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("stats.pendingInvitations")}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Building2
                size={18}
                className="text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {totalListings}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("stats.properties")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Layout - Sans marges latérales */}
      <div className="px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Team Section */}
          <div className="lg:col-span-8 space-y-6">
            {teamMembers.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
                <LuUserX
                  size={48}
                  className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
                />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                  {t("empty.title")}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {t("empty.description")}
                </p>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-medium"
                >
                  <UserPlus size={16} /> {t("empty.button")}
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {currentMembers.map((member) => (
                    <TeamMemberCard
                      key={member.id}
                      member={member}
                      onOpenMenu={openMenu}
                      onOpenPermissions={setSelectedMember}
                      onViewHistory={viewMemberHistory}
                      t={t}
                    />
                  ))}
                  {currentMembers.length < itemsPerPage &&
                    currentPage === totalPages && (
                      <div
                        onClick={() => setShowInviteModal(true)}
                        className="border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3 hover:border-indigo-500 hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-all cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          <UserPlus size={20} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            {t("addMember.title")}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t("addMember.description")}
                          </p>
                        </div>
                      </div>
                    )}
                </div>
                {totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalMembers}
                      pageSize={itemsPerPage}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Side Panel */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Pending Invitations */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {t("invitations.title")}
                </h3>
                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-medium rounded-full">
                  {totalInvitations} {t("invitations.pending")}
                </span>
              </div>

              <div className="space-y-4">
                {pendingInvitations.length === 0 ? (
                  <div className="text-center py-8">
                    <RiMailCloseLine
                      size={32}
                      className="mx-auto text-slate-300 dark:text-slate-600 mb-3"
                    />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t("invitations.empty")}
                    </p>
                  </div>
                ) : (
                  pendingInvitations.map((invite) => {
                    const remainingTime = getRemainingTime(invite.expiresAt, t);
                    const progress = getProgress(
                      invite.createdAt,
                      invite.expiresAt,
                    );
                    const expiringSoon = isExpiringSoon(invite.expiresAt);
                    const roleConfig = getRoleConfig(invite.role, t);
                    const Icon = roleConfig.icon;
                    const roleColorClass = getRoleColorClass(roleConfig.color);

                    return (
                      <div
                        key={invite.id}
                        className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex gap-3">
                            <div
                              className={`w-8 h-8 ${roleColorClass} rounded-lg flex items-center justify-center`}
                            >
                              <Icon size={16} />
                            </div>
                            <div>
                              <p className="font-medium text-sm text-slate-900 dark:text-white">
                                {invite.inviteeName || invite.inviteeEmail}
                              </p>
                              <p
                                className={`text-[9px] ${roleColorClass} font-medium uppercase tracking-wide mt-0.5`}
                              >
                                {roleConfig.label}
                              </p>
                              <p className="text-[9px] text-slate-400 dark:text-slate-500">
                                {invite.listing?.title}
                              </p>
                            </div>
                          </div>
                          <p
                            className={`text-[9px] font-medium uppercase ${expiringSoon ? "text-amber-600" : "text-slate-400"}`}
                          >
                            {expiringSoon
                              ? t("invitations.expiringSoon")
                              : t("invitations.pendingStatus")}
                          </p>
                        </div>

                        <div className="mt-4">
                          <div className="flex justify-between items-end mb-1">
                            <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wide">
                              {t("invitations.progress")}
                            </span>
                            <span
                              className={`text-[10px] font-semibold ${expiringSoon ? "text-amber-600" : "text-indigo-600"}`}
                            >
                              {remainingTime}
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${expiringSoon ? "bg-amber-500" : "bg-indigo-500"}`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => remindInvitation(invite.id)}
                            disabled={remindingId === invite.id}
                            className="flex-1 py-2 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all border border-indigo-200 dark:border-indigo-800 disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            {remindingId === invite.id ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : (
                              <Send size={10} />
                            )}
                            {t("invitations.remind")}
                          </button>
                          <button
                            onClick={() => cancelInvitation(invite.id)}
                            className="flex-1 py-2 text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all border border-rose-200 dark:border-rose-800"
                          >
                            {t("invitations.cancel")}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Performance Stats */}
              <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  {t("analytics.title")}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg text-center">
                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                      {activeRate}
                      <span className="text-sm">%</span>
                    </p>
                    <p className="text-[9px] font-medium text-slate-500 uppercase tracking-wide mt-1">
                      {t("analytics.activityRate")}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg text-center">
                    <p className="text-xl font-bold text-violet-600 dark:text-violet-400">
                      {totalInvitations}
                      <span className="text-sm">att.</span>
                    </p>
                    <p className="text-[9px] font-medium text-slate-500 uppercase tracking-wide mt-1">
                      {t("analytics.pending")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Reminder Card */}
            <div className="bg-gradient-to-r from-sky-600 to-purple-600 rounded-xl p-5 text-white shadow-md">
              <h3 className="text-base font-semibold mb-2">
                {t("security.title")}
              </h3>
              <p className="text-white/80 text-xs leading-relaxed mb-4">
                {t("security.description")}
              </p>
              <button className="inline-flex items-center gap-2 text-xs font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-all">
                {t("security.button")} <ChevronRight size={12} />
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Floating action menu */}
      {menuPosition.memberId && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeMenu} />
          <div
            className="fixed z-50 w-40 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <div className="py-1">
              <button
                onClick={() => {
                  const member = teamMembers.find(
                    (m) => m.id === menuPosition.memberId,
                  );
                  setSelectedMember(member || null);
                  setPermissionModalOpen(true);
                  closeMenu();
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-300 flex items-center gap-2 transition-colors"
              >
                <Settings size={12} /> {t("actions.permissions")}
              </button>
              <button
                onClick={() => {
                  const member = teamMembers.find(
                    (m) => m.id === menuPosition.memberId,
                  );
                  if (member) removeTeamMember(member.id);
                  closeMenu();
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-700 dark:text-slate-300 hover:text-rose-600 flex items-center gap-2 transition-colors border-t border-slate-100 dark:border-slate-800"
              >
                <UserX size={12} /> {t("actions.remove")}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Permission Modal */}
      {permissionModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md border border-slate-200 dark:border-slate-700 shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Shield size={16} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {t("permissions.title")}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedMember.user.firstName}{" "}
                    {selectedMember.user.lastName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPermissionModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={16} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              {[
                {
                  key: "canEdit",
                  label: t("permissions.canEdit"),
                  desc: t("permissions.canEditDesc"),
                  icon: Edit,
                },
                {
                  key: "canManageBookings",
                  label: t("permissions.canManageBookings"),
                  desc: t("permissions.canManageBookingsDesc"),
                  icon: Calendar,
                },
                {
                  key: "canViewRevenue",
                  label: t("permissions.canViewRevenue"),
                  desc: t("permissions.canViewRevenueDesc"),
                  icon: DollarSign,
                },
                {
                  key: "canManageTeam",
                  label: t("permissions.canManageTeam"),
                  desc: t("permissions.canManageTeamDesc"),
                  icon: Users,
                },
              ].map((opt) => {
                const Icon = opt.icon;
                const active = selectedMember?.[
                  opt.key as keyof typeof selectedMember
                ] as boolean;
                return (
                  <div
                    key={opt.key}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? "bg-indigo-100 dark:bg-indigo-900/30" : "bg-slate-100 dark:bg-slate-800"}`}
                      >
                        <Icon
                          size={14}
                          className={
                            active ? "text-indigo-600" : "text-slate-400"
                          }
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {opt.label}
                        </p>
                        <p className="text-xs text-slate-500">{opt.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (selectedMember) {
                          const updatedPermissions = {
                            canEdit:
                              opt.key === "canEdit"
                                ? !active
                                : selectedMember.canEdit,
                            canManageBookings:
                              opt.key === "canManageBookings"
                                ? !active
                                : selectedMember.canManageBookings,
                            canViewRevenue:
                              opt.key === "canViewRevenue"
                                ? !active
                                : selectedMember.canViewRevenue,
                            canManageTeam:
                              opt.key === "canManageTeam"
                                ? !active
                                : selectedMember.canManageTeam,
                          };
                          updatePermissions(
                            selectedMember.id,
                            updatedPermissions,
                          );
                        }
                      }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${active ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}
                    >
                      {active ? <Check size={14} /> : <X size={14} />}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
              <button
                onClick={() => setPermissionModalOpen(false)}
                className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {t("permissions.cancel")}
              </button>
              <button
                onClick={() => {
                  if (selectedMember) {
                    updatePermissions(selectedMember.id, {
                      canEdit: selectedMember.canEdit,
                      canManageBookings: selectedMember.canManageBookings,
                      canViewRevenue: selectedMember.canViewRevenue,
                      canManageTeam: selectedMember.canManageTeam,
                    });
                  }
                }}
                disabled={updatingPermissions}
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {updatingPermissions ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                {t("permissions.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <InviteCoHostModal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setSelectedListingId(null);
        }}
        listings={listings}
        preselectedListingId={selectedListingId}
        onSuccess={() => {
          setShowInviteModal(false);
          setSelectedListingId(null);
          fetchData();
          setAlert({
            type: "success",
            message: t("alerts.invitationSent"),
          });
        }}
      />
    </div>
  );
}
