// components/owner/TeamManagementUI.tsx
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Users, UserPlus, Mail, Calendar, Shield, Edit,
  Building2, DollarSign, Settings, UserX, X, Loader2, Star, MoreHorizontal,
  History, ChevronRight, Clock, Trophy, Bell, Send, Check, Sparkles,
} from "lucide-react";
import { RiMailCloseLine } from "react-icons/ri";
import { LuUserX } from "react-icons/lu";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import InviteCoHostModal from "@/components/ui/modals/InviteCoOwnerModal";
import Pagination from "@/components/ui/Pagination";
import Alert from "@/components/ui/Alert";
import { useTeamManagement } from "./hooks/useTeamManagement";

const getImageUrl = (url: string) => {
  if (!url) return null;
  if (url.startsWith("blob:") || url.startsWith("/api/")) return url;
  return `/api/listings/image?url=${encodeURIComponent(url)}`;
};

function UserAvatar({ user, size = 42 }: { user: any; size?: number }) {
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}` || "?";
  const imageUrl = user?.profilePictureUrl ? getImageUrl(user.profilePictureUrl) : null;
  return (
    <div className="rounded-xl overflow-hidden flex-shrink-0 shadow-md shadow-violet-500/10 dark:shadow-violet-900/20" style={{ width: size, height: size }}>
      {imageUrl ? (
        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white font-medium"
          style={{ fontSize: size * 0.36, background: "linear-gradient(135deg,#0ea5e9,#8b5cf6,#a855f7)" }}>
          {initials}
        </div>
      )}
    </div>
  );
}

function TeamMemberCard({ member, onOpenMenu, onOpenPermissions, onViewHistory, t }: any) {
  const roleLabel = member.role === "MANAGER" ? t("roles.manager") : member.role === "CO_HOST" ? t("roles.coHost") : t("roles.observer");
  const roleColor = member.role === "MANAGER" ? "text-sky-600 dark:text-sky-400" : member.role === "CO_HOST" ? "text-violet-600 dark:text-violet-400" : "text-purple-600 dark:text-purple-400";

  return (
    <div className="group bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-gray-800 overflow-hidden hover:border-violet-200/60 dark:hover:border-violet-700/40 hover:shadow-xl hover:shadow-violet-500/5 dark:hover:shadow-violet-900/10 hover:-translate-y-1 transition-all duration-500">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <UserAvatar user={member.user} />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                <Check size={8} className="text-white" />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{member.user.firstName} {member.user.lastName}</h4>
              <span className={`inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-widest mt-0.5 ${roleColor}`}>
                <Star size={8} className="fill-current" /> {roleLabel}
              </span>
            </div>
          </div>
          <button onClick={(e) => onOpenMenu(e, member.id)}
            className="w-7 h-7 flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
            <MoreHorizontal size={14} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { val: member.canManageBookings ? "98%" : "—", label: t("stats.performance"), color: "text-sky-600 dark:text-sky-400" },
            { val: member.canEdit ? "12m" : "—", label: t("stats.response"), color: "text-violet-600 dark:text-violet-400" },
            { val: member.canViewRevenue ? "442" : "—", label: t("stats.tasks"), color: "text-purple-600 dark:text-purple-400" },
          ].map(({ val, label, color }) => (
            <div key={label} className="rounded-xl bg-gray-50/80 dark:bg-gray-800/40 p-2.5 text-center">
              <p className={`text-sm font-bold ${color}`}>{val}</p>
              <p className="text-[7px] text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {member.listing?.title && (
          <div className="flex items-center gap-2 text-xs mb-3 px-1">
            <Building2 size={11} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
            <span className="text-gray-500 dark:text-gray-400 truncate">{member.listing.title}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={() => onOpenPermissions(member)}
            className="flex-1 py-2 text-[11px] font-medium text-violet-600 dark:text-violet-400 bg-violet-50/80 dark:bg-violet-900/15 rounded-xl hover:bg-violet-100 dark:hover:bg-violet-900/25 transition-colors">
            {t("actions.permissions")}
          </button>
          <button onClick={() => onViewHistory(member)} title={t("actions.history")}
            className="w-9 py-2 flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50/80 dark:bg-gray-800/40 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <History size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

const getRemainingTime = (expiresAt: string, t: any) => {
  const hrs = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 3600000);
  if (hrs <= 0) return t("invitations.expired");
  if (hrs < 24) return t("invitations.hoursLeft", { hours: hrs });
  return t("invitations.daysLeft", { days: Math.floor(hrs / 24) });
};
const getProgress = (c: string, e: string) => Math.min(Math.max(((Date.now() - new Date(c).getTime()) / (new Date(e).getTime() - new Date(c).getTime())) * 100, 0), 100);
const isExpiringSoon = (e: string) => { const h = (new Date(e).getTime() - Date.now()) / 3600000; return h < 24 && h > 0; };
const getRoleConfig = (role: string, t: any) => {
  if (role === "MANAGER") return { label: t("roles.manager"), icon: Bell, color: "sky" };
  if (role === "CO_HOST") return { label: t("roles.coHost"), icon: Mail, color: "violet" };
  return { label: t("roles.observer"), icon: Clock, color: "purple" };
};
const roleColors: Record<string, string> = {
  sky: "bg-sky-50/80 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400",
  violet: "bg-violet-50/80 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400",
  purple: "bg-purple-50/80 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400",
};

export default function TeamManagementUI() {
  const t = useTranslations("TeamManagement");
  const {
    teamMembers, pendingInvitations, listings, loading, selectedListingId,
    showInviteModal, alert, permissionModalOpen, selectedMember, updatingPermissions,
    menuPosition, remindingId, currentPage, totalPages, totalMembers, currentMembers,
    totalInvitations, totalListings, activeRate, itemsPerPage,
    setShowInviteModal, setAlert, setPermissionModalOpen, setSelectedMember,
    setCurrentPage, setSelectedListingId, fetchData, cancelInvitation, remindInvitation,
    removeTeamMember, updatePermissions, openMenu, closeMenu,
  } = useTeamManagement();

  const viewMemberHistory = (member: any) => console.log("History:", member.user.firstName);

  if (loading) return <LoadingSpinner fullScreen variant="spinner" size="lg" color="primary" text={t("loading.message")} speed="normal" />;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-white dark:bg-slate-950 min-h-screen transition-colors">
      

      {alert && (
        <div className="fixed top-20 right-6 z-50 max-w-sm">
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} autoClose={5000} />
        </div>
      )}

      <div className="px-5 lg:px-8 py-8 w-full">

        {/* ══════════════════════════════════════════════════════════════════
            HERO — Cinematic image with integrated stats
        ══════════════════════════════════════════════════════════════════ */}
        <section className="relative rounded-3xl overflow-hidden mb-8 group shadow-2xl shadow-violet-500/10 dark:shadow-violet-950/20">
          {/* Image — fills the entire section */}
          <img
            alt="Team Collaboration"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[3s] ease-out group-hover:scale-[1.04]"
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1400&h=500&fit=crop"
          />

          {/* Cinematic overlays — no hard lines, just smooth gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-violet-950/70 via-transparent to-indigo-950/50" />

          {/* Content */}
          <div className="relative z-10 px-7 sm:px-10 pt-10 pb-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[9px] font-semibold uppercase tracking-[.2em] text-white/80 mb-5 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {t("hero.badge")}
            </div>

            {/* Title + description */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
              <div className="max-w-xl">
                <h2 className="text-white text-3xl sm:text-4xl font-bold tracking-tight leading-[1.1] mb-3">
                  {t("hero.title")}
                </h2>
                <p className="text-white/50 text-sm leading-relaxed max-w-md">
                  {t("hero.description")}
                </p>
              </div>

              {/* CTA — glass button */}
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2.5 px-6 py-3 bg-indigo-500/[0.08] hover:bg-indigo-500/[0.14] backdrop-blur-md text-indigo-400 rounded-2xl text-sm font-semibold border border-indigo-500/[0.12] hover:border-indigo-500/[0.2] shadow-lg active:scale-[.97] transition-all flex-shrink-0 group/btn"
              >
                <div className="w-7 h-7 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                  <UserPlus size={13} className="text-indigo-500" />
                </div>
                {t("hero.button")}
                <ChevronRight size={14} className="text-indigo-500/50 group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Stats strip — glass, integrated */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { val: totalMembers, label: t("stats.activeMembers"), icon: <Users size={14} /> },
                { val: totalInvitations, label: t("stats.pendingInvitations"), icon: <Mail size={14} /> },
                { val: totalListings, label: t("stats.properties"), icon: <Building2 size={14} /> },
                { val: `${activeRate}%`, label: t("analytics.activityRate"), icon: <Trophy size={14} /> },
              ].map(({ val, label, icon }) => (
                <div key={label} className="bg-indigo-500/[0.08] hover:bg-indigo-500/[0.12] backdrop-blur-md rounded-2xl border border-indigo-500/[0.08] px-4 py-3.5 transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-indigo-500/30">{icon}</span>
                    <span className="text-[8px] text-indigo-500/30 uppercase tracking-widest">{label}</span>
                  </div>
                  <p className="text-2xl font-bold text-indigo-400 leading-none">{val}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            MAIN GRID
        ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-7">

          {/* ═══ LEFT ═══ */}
          <div className="space-y-5 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-violet-500 dark:text-violet-400" />
                <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-gray-400 dark:text-gray-500">
                  Membres actifs · {totalMembers}
                </p>
              </div>
            </div>

            {teamMembers.length === 0 ? (
              <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl border-2 border-dashed border-violet-200/60 dark:border-violet-700/40 py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-4">
                  <LuUserX size={24} className="text-violet-400 dark:text-violet-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">{t("empty.title")}</h3>
                <p className="text-sm text-gray-400 dark:text-gray-500 max-w-sm mx-auto mb-5">{t("empty.description")}</p>
                <button onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 shadow-md shadow-violet-500/20 dark:shadow-violet-900/30">
                  <UserPlus size={16} /> {t("empty.button")}
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentMembers.map((member: any) => (
                    <TeamMemberCard key={member.id} member={member} onOpenMenu={openMenu}
                      onOpenPermissions={(m: any) => { setSelectedMember(m); setPermissionModalOpen(true); }}
                      onViewHistory={viewMemberHistory} t={t} />
                  ))}
                  {currentMembers.length < itemsPerPage && currentPage === totalPages && (
                    <div onClick={() => setShowInviteModal(true)}
                      className="border-2 border-dashed border-violet-200/50 dark:border-violet-700/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50/10 dark:hover:bg-violet-900/5 transition-all cursor-pointer group/add">
                      <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center group-hover/add:scale-110 transition-transform">
                        <UserPlus size={18} className="text-violet-500 dark:text-violet-400" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{t("addMember.title")}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{t("addMember.description")}</p>
                      </div>
                    </div>
                  )}
                </div>
                {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalMembers} pageSize={itemsPerPage} onPageChange={setCurrentPage} />}
              </>
            )}
          </div>

          {/* ═══ RIGHT ═══ */}
          <div className="space-y-5 lg:sticky lg:top-6">

            {/* Invitations */}
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-gray-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] font-semibold uppercase tracking-[.2em] text-gray-400 dark:text-gray-500">{t("invitations.title")}</p>
                {totalInvitations > 0 && (
                  <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded-lg">
                    {totalInvitations}
                  </span>
                )}
              </div>

              {pendingInvitations.length === 0 ? (
                <div className="text-center py-8">
                  <RiMailCloseLine size={28} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t("invitations.empty")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingInvitations.map((invite: any) => {
                    const remaining = getRemainingTime(invite.expiresAt, t);
                    const progress = getProgress(invite.createdAt, invite.expiresAt);
                    const expiring = isExpiringSoon(invite.expiresAt);
                    const rc = getRoleConfig(invite.role, t);
                    const Icon = rc.icon;
                    const cc = roleColors[rc.color] ?? roleColors.sky;

                    return (
                      <div key={invite.id} className="rounded-xl p-4 bg-white/50 dark:bg-gray-800/30 border border-gray-100/50 dark:border-gray-700/30">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cc}`}><Icon size={14} /></div>
                            <div>
                              <p className="text-xs font-medium text-gray-900 dark:text-white">{invite.inviteeName || invite.inviteeEmail}</p>
                              <p className={`text-[9px] font-semibold uppercase tracking-widest mt-0.5 ${cc.split(" ").filter((c: string) => c.startsWith("text-")).join(" ")}`}>{rc.label}</p>
                              {invite.listing?.title && <p className="text-[9px] text-gray-400 dark:text-gray-500 truncate max-w-[140px]">{invite.listing.title}</p>}
                            </div>
                          </div>
                          {expiring && (
                            <span className="text-[8px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">!</span>
                          )}
                        </div>

                        <div className="mb-3">
                          <div className="flex justify-between mb-1">
                            <span className="text-[8px] text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t("invitations.progress")}</span>
                            <span className={`text-[9px] font-medium ${expiring ? "text-amber-600 dark:text-amber-400" : "text-violet-600 dark:text-violet-400"}`}>{remaining}</span>
                          </div>
                          <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${expiring ? "bg-amber-500" : "bg-gradient-to-r from-violet-500 to-purple-500"}`}
                              style={{ width: `${Math.min(progress, 100)}%` }} />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button onClick={() => remindInvitation(invite.id)} disabled={remindingId === invite.id}
                            className="flex-1 py-1.5 text-[10px] font-medium text-violet-600 dark:text-violet-400 bg-violet-50/80 dark:bg-violet-900/15 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/25 transition-colors flex items-center justify-center gap-1 disabled:opacity-50">
                            {remindingId === invite.id ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
                            {t("invitations.remind")}
                          </button>
                          <button onClick={() => cancelInvitation(invite.id)}
                            className="flex-1 py-1.5 text-[10px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-900/15 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/25 transition-colors">
                            {t("invitations.cancel")}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-5 pt-5 border-t border-gray-100/50 dark:border-gray-800">
                <p className="text-[8px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">{t("analytics.title")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: `${activeRate}%`, label: t("analytics.activityRate"), color: "text-violet-600 dark:text-violet-400" },
                    { val: totalInvitations, label: t("analytics.pending"), color: "text-sky-600 dark:text-sky-400" },
                  ].map(({ val, label, color }) => (
                    <div key={label} className="rounded-xl bg-gray-50/80 dark:bg-gray-800/40 p-3 text-center">
                      <p className={`text-lg font-bold ${color}`}>{val}</p>
                      <p className="text-[8px] text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 dark:from-violet-600 dark:via-purple-700 dark:to-indigo-700" />
              <div className="absolute inset-0 opacity-[0.08]"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
              <div className="relative p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={14} className="text-white/70" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">{t("security.title")}</p>
                </div>
                <p className="text-xs text-white/60 leading-relaxed mb-4">{t("security.description")}</p>
                <button className="flex items-center gap-1.5 text-xs font-medium text-white bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors">
                  {t("security.button")} <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Menu ── */}
      {menuPosition.memberId && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeMenu} />
          <div className="fixed z-50 w-44 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-xl border border-white/50 dark:border-gray-800 shadow-2xl p-1"
            style={{ top: menuPosition.top, left: menuPosition.left }}>
            <button onClick={() => { const m = teamMembers.find((m: any) => m.id === menuPosition.memberId); setSelectedMember(m || null); setPermissionModalOpen(true); closeMenu(); }}
              className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg flex items-center gap-2 transition-colors">
              <Settings size={12} /> {t("actions.permissions")}
            </button>
            <button onClick={() => { const m = teamMembers.find((m: any) => m.id === menuPosition.memberId); if (m) removeTeamMember(m.id); closeMenu(); }}
              className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg flex items-center gap-2 transition-colors">
              <UserX size={12} /> {t("actions.remove")}
            </button>
          </div>
        </>
      )}

      {/* ── Permissions ── */}
      {permissionModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                  <Shield size={14} className="text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t("permissions.title")}</h3>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{selectedMember.user.firstName} {selectedMember.user.lastName}</p>
                </div>
              </div>
              <button onClick={() => setPermissionModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X size={14} className="text-gray-400 dark:text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-2.5">
              {[
                { key: "canEdit", label: t("permissions.canEdit"), desc: t("permissions.canEditDesc"), icon: Edit },
                { key: "canManageBookings", label: t("permissions.canManageBookings"), desc: t("permissions.canManageBookingsDesc"), icon: Calendar },
                { key: "canViewRevenue", label: t("permissions.canViewRevenue"), desc: t("permissions.canViewRevenueDesc"), icon: DollarSign },
                { key: "canManageTeam", label: t("permissions.canManageTeam"), desc: t("permissions.canManageTeamDesc"), icon: Users },
              ].map(opt => {
                const Icon = opt.icon;
                const active = selectedMember?.[opt.key as keyof typeof selectedMember] as boolean;
                return (
                  <div key={opt.key} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? "bg-violet-50 dark:bg-violet-900/30" : "bg-gray-50 dark:bg-gray-800"}`}>
                        <Icon size={14} className={active ? "text-violet-600 dark:text-violet-400" : "text-gray-400 dark:text-gray-500"} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900 dark:text-white">{opt.label}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{opt.desc}</p>
                      </div>
                    </div>
                    <button onClick={() => { if (selectedMember) updatePermissions(selectedMember.id, {
                      canEdit: opt.key === "canEdit" ? !active : selectedMember.canEdit,
                      canManageBookings: opt.key === "canManageBookings" ? !active : selectedMember.canManageBookings,
                      canViewRevenue: opt.key === "canViewRevenue" ? !active : selectedMember.canViewRevenue,
                      canManageTeam: opt.key === "canManageTeam" ? !active : selectedMember.canManageTeam,
                    }); }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${active ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"}`}>
                      {active ? <Check size={14} /> : <X size={14} />}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
              <button onClick={() => setPermissionModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {t("permissions.cancel")}
              </button>
              <button onClick={() => { if (selectedMember) updatePermissions(selectedMember.id, { canEdit: selectedMember.canEdit, canManageBookings: selectedMember.canManageBookings, canViewRevenue: selectedMember.canViewRevenue, canManageTeam: selectedMember.canManageTeam }); }}
                disabled={updatingPermissions}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-500 dark:to-purple-500 shadow-md shadow-violet-500/20 dark:shadow-violet-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {updatingPermissions ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {t("permissions.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      <InviteCoHostModal isOpen={showInviteModal}
        onClose={() => { setShowInviteModal(false); setSelectedListingId(null); }}
        listings={listings} preselectedListingId={selectedListingId}
        onSuccess={() => { setShowInviteModal(false); setSelectedListingId(null); fetchData(); setAlert({ type: "success", message: t("alerts.invitationSent") }); }} />
    </div>
  );
}