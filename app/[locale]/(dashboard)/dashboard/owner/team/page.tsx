// app/[locale]/(dashboard)/owner/team/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import * as React from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import {
  Users, UserPlus, Mail, Calendar, Shield, Edit, Trash2, CheckCircle,
  XCircle, Clock, TrendingUp, Home, Building2, MoreVertical, Send,
  Eye, EyeOff, DollarSign, MessageSquare, Settings, UserCheck, UserX,
  ChevronRight, Plus, X, Loader2, AlertCircle,
} from "lucide-react";
import AlertBanner from "@/components/ui/Alert";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import InviteCoHostModal from "@/components/ui/modals/InviteCoOwnerModal";

// ── types ───────────────────────────────────────────────────────────────────
interface TeamMember {
  id: string;
  userId: string;
  listingId: string;
  role: string;
  permissions: any;
  canEdit: boolean;
  canManageBookings: boolean;
  canViewRevenue: boolean;
  canManageTeam: boolean;
  invitedBy: string;
  invitedAt: string;
  joinedAt: string | null;
  isActive: boolean;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    profilePictureUrl: string | null;
  };
  listing: {
    id: string;
    title: string;
    type: string;
    governorate: string;
  };
}

interface PendingInvitation {
  id: string;
  listingId: string;
  listing: {
    id: string;
    title: string;
  };
  inviteeEmail: string;
  inviteeName: string | null;
  role: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

interface Listing {
  id: string;
  title: string;
  type: string;
  governorate: string;
  status: string;
}

// ── sub-components ──────────────────────────────────────────────────────────
function PermissionBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${active ? "text-emerald-600" : "text-slate-400"}`}>
      {active ? (
        <CheckCircle size={12} className="text-emerald-500" />
      ) : (
        <XCircle size={12} className="text-slate-300" />
      )}
      <span className={active ? "font-medium" : ""}>{label}</span>
    </div>
  );
}

export default function TeamManagementPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = React.use(params);
  const { getToken } = useAuth();
  const t = useTranslations("OwnerTeam");

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);
  const [stats, setStats] = useState({ totalMembers: 0, pendingInvites: 0, activeListings: 0 });
  const [showPermissionsSidebar, setShowPermissionsSidebar] = useState(true);

  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = await getToken({ template: "my-app-template" });
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
  }, [getToken]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const listingsRes = await authFetch("/api/owner/listings");
      if (listingsRes.ok) {
        const listingsData = await listingsRes.json();
        setListings(listingsData.listings);
        setStats(prev => ({ ...prev, activeListings: listingsData.listings.length }));
      }

      const teamRes = await authFetch("/api/owner/team");
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setTeamMembers(teamData.members);
        setStats(prev => ({ ...prev, totalMembers: teamData.members.length }));
      }

      const invitesRes = await authFetch("/api/owner/team/invitations");
      if (invitesRes.ok) {
        const invitesData = await invitesRes.json();
        setPendingInvitations(invitesData.invitations);
        setStats(prev => ({ ...prev, pendingInvites: invitesData.invitations.length }));
      }
    } catch (error) {
      console.error(error);
      setAlert({ type: 'error', message: 'Erreur lors du chargement des données' });
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const cancelInvitation = async (invitationId: string) => {
    try {
      const res = await authFetch(`/api/owner/team/invitations/${invitationId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAlert({ type: 'success', message: 'Invitation annulée' });
        fetchData();
      } else {
        const error = await res.json();
        setAlert({ type: 'error', message: error.error || 'Erreur lors de l\'annulation' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Erreur de connexion' });
    }
  };

  const removeTeamMember = async (memberId: string) => {
    try {
      const res = await authFetch(`/api/owner/team/${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAlert({ type: 'success', message: 'Membre retiré de l\'équipe' });
        fetchData();
      } else {
        const error = await res.json();
        setAlert({ type: 'error', message: error.error || 'Erreur lors du retrait' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Erreur de connexion' });
    }
  };

  const updatePermissions = async (memberId: string, permissions: any) => {
    try {
      const res = await authFetch(`/api/owner/team/${memberId}/permissions`, {
        method: "PATCH",
        body: JSON.stringify(permissions),
      });
      if (res.ok) {
        setAlert({ type: 'success', message: 'Permissions mises à jour' });
        fetchData();
      } else {
        const error = await res.json();
        setAlert({ type: 'error', message: error.error || 'Erreur lors de la mise à jour' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Erreur de connexion' });
    }
  };

  const membersByListing = teamMembers.reduce((acc, member) => {
    if (!acc[member.listingId]) {
      acc[member.listingId] = {
        listing: member.listing,
        members: [],
      };
    }
    acc[member.listingId].members.push(member);
    return acc;
  }, {} as Record<string, { listing: Listing; members: TeamMember[] }>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light dark:bg-[#0d0f1a]">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner />
          <p className="text-sm text-slate-500">Chargement de votre équipe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-light dark:bg-[#0d0f1a]">
      <div className="flex gap-6 p-6">
        {/* Main Content - Left side */}
        <div className="flex-1 min-w-0 space-y-6">
          {alert && <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

          {/* Header */}
          <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Gestion d'équipe
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Gérez vos co-hôtes, définissez leurs permissions et suivez les invitations
              </p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl font-semibold text-sm shadow-sm transition-all active:scale-95"
            >
              <UserPlus size={16} />
              Inviter un co-hôte
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                  <Users size={18} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-emerald-500 text-xs font-medium flex items-center gap-1">
                  <TrendingUp size={12} /> +{stats.totalMembers} total
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalMembers}</p>
              <p className="text-xs text-slate-500 mt-1">Membres dans votre équipe</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                  <Clock size={18} className="text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-amber-500 text-xs font-medium">En attente</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pendingInvites}</p>
              <p className="text-xs text-slate-500 mt-1">Invitations en attente</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                  <Home size={18} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-emerald-500 text-xs font-medium">Actives</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.activeListings}</p>
              <p className="text-xs text-slate-500 mt-1">Annonces avec co-hôtes</p>
            </div>
          </div>

          {/* Team Members by Listing */}
          <div className="space-y-8">
            {Object.entries(membersByListing).map(([listingId, { listing, members }]) => (
              <div key={listingId} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-indigo-50/40 to-violet-50/20 dark:from-indigo-900/10 dark:to-violet-900/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <Building2 size={18} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{listing.title}</h3>
                        <p className="text-xs text-slate-500">{listing.governorate}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{members.length} membre(s)</span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {members.map((member) => (
                      <div key={member.id} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 relative">
                        <div className="absolute top-4 right-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            member.role === 'OWNER' 
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                              : member.role === 'MANAGER'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            {member.role === 'OWNER' ? 'Propriétaire' : member.role === 'MANAGER' ? 'Gestionnaire' : 'Co-hôte'}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0">
                            {member.user.profilePictureUrl ? (
                              <img
                                src={`/api/admin/serve-image?url=${encodeURIComponent(member.user.profilePictureUrl)}`}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                                {member.user.firstName?.[0]}{member.user.lastName?.[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {member.user.firstName} {member.user.lastName}
                            </p>
                            <p className="text-xs text-slate-500">{member.user.email}</p>
                            {member.joinedAt && (
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                A rejoint le {new Date(member.joinedAt).toLocaleDateString('fr-FR')}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Permissions</p>
                          <div className="grid grid-cols-2 gap-2">
                            <PermissionBadge label="Modifier l'annonce" active={member.canEdit} />
                            <PermissionBadge label="Gérer les réservations" active={member.canManageBookings} />
                            <PermissionBadge label="Voir les revenus" active={member.canViewRevenue} />
                            <PermissionBadge label="Gérer l'équipe" active={member.canManageTeam} />
                          </div>
                        </div>

                        {member.role !== 'OWNER' && (
                          <div className="flex gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                            <button
                              onClick={() => updatePermissions(member.id, {
                                canEdit: !member.canEdit,
                                canManageBookings: member.canManageBookings,
                                canViewRevenue: member.canViewRevenue,
                                canManageTeam: member.canManageTeam,
                              })}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                            >
                              <Settings size={12} />
                              Permissions
                            </button>
                            <button
                              onClick={() => removeTeamMember(member.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <UserX size={12} />
                              Retirer
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Pending Invitations Section */}
            {pendingInvitations.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-amber-50/40 to-orange-50/20">
                  <h3 className="font-bold text-slate-900 dark:text-white">Invitations en attente</h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {pendingInvitations.map((invite) => (
                    <div key={invite.id} className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <Mail size={18} className="text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {invite.inviteeName || invite.inviteeEmail}
                          </p>
                          <p className="text-xs text-slate-500">
                            {invite.listing.title} • Rôle: {invite.role === 'MANAGER' ? 'Gestionnaire' : 'Co-hôte'}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Invitée le {new Date(invite.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => cancelInvitation(invite.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Annuler l'invitation"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {Object.keys(membersByListing).length === 0 && pendingInvitations.length === 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700">
                <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4">
                  <Users size={32} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Aucun membre dans votre équipe
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                  Invitez des co-hôtes pour vous aider à gérer vos annonces
                </p>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-semibold text-sm"
                >
                  <UserPlus size={16} />
                  Inviter un co-hôte
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Permissions Sidebar - Right side */}
        <div className="w-80 flex-shrink-0">
          <div className="sticky top-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-indigo-50/40 to-violet-50/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-indigo-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Tableau des permissions</h3>
                </div>
                <button
                  onClick={() => setShowPermissionsSidebar(!showPermissionsSidebar)}
                  className="text-slate-400 hover:text-slate-600 lg:hidden"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              
              {showPermissionsSidebar && (
                <div className="p-4">
                  <div className="space-y-3">
                    {/* Owner Row */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center">
                          <CheckCircle size={12} className="text-indigo-600" />
                        </div>
                        <span className="font-semibold text-sm text-indigo-700 dark:text-indigo-400">Propriétaire</span>
                      </div>
                      <div className="space-y-1.5 pl-8">
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle size={12} className="text-emerald-500" />
                          <span>Modifier l'annonce</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle size={12} className="text-emerald-500" />
                          <span>Gérer les réservations</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle size={12} className="text-emerald-500" />
                          <span>Voir les revenus</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle size={12} className="text-emerald-500" />
                          <span>Gérer l'équipe</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle size={12} className="text-emerald-500" />
                          <span>Supprimer l'annonce</span>
                        </div>
                      </div>
                    </div>

                    {/* Manager Row */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center">
                          <Users size={12} className="text-emerald-600" />
                        </div>
                        <span className="font-semibold text-sm text-emerald-700 dark:text-emerald-400">Gestionnaire</span>
                      </div>
                      <div className="space-y-1.5 pl-8">
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle size={12} className="text-emerald-500" />
                          <span>Modifier l'annonce</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle size={12} className="text-emerald-500" />
                          <span>Gérer les réservations</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <XCircle size={12} className="text-slate-400" />
                          <span className="text-slate-500">Voir les revenus</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <XCircle size={12} className="text-slate-400" />
                          <span className="text-slate-500">Gérer l'équipe</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <XCircle size={12} className="text-slate-400" />
                          <span className="text-slate-500">Supprimer l'annonce</span>
                        </div>
                      </div>
                    </div>

                    {/* Co-host Row */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center">
                          <Calendar size={12} className="text-amber-600" />
                        </div>
                        <span className="font-semibold text-sm text-amber-700 dark:text-amber-400">Co-hôte</span>
                      </div>
                      <div className="space-y-1.5 pl-8">
                        <div className="flex items-center gap-2 text-xs">
                          <XCircle size={12} className="text-slate-400" />
                          <span className="text-slate-500">Modifier l'annonce</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle size={12} className="text-emerald-500" />
                          <span>Gérer les réservations</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <XCircle size={12} className="text-slate-400" />
                          <span className="text-slate-500">Voir les revenus</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <XCircle size={12} className="text-slate-400" />
                          <span className="text-slate-500">Gérer l'équipe</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <XCircle size={12} className="text-slate-400" />
                          <span className="text-slate-500">Supprimer l'annonce</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400 text-center">
                      Les permissions peuvent être personnalisées par co-hôte
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <InviteCoHostModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        listings={listings}
        onSuccess={() => {
          setShowInviteModal(false);
          fetchData();
          setAlert({ type: 'success', message: 'Invitation envoyée avec succès' });
        }}
      />
    </div>
  );
}