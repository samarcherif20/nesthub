// hooks/useTeamManagement.ts
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

interface TeamMember {
  id: string;
  userId: string;
  listingId: string;
  role: string;
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
  listing: { id: string; title: string; type: string; governorate: string };
}

interface PendingInvitation {
  id: string;
  listingId: string;
  listing: { id: string; title: string };
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

export function useTeamManagement() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<
    PendingInvitation[]
  >([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(
    null,
  );
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning" | "info";
    message: string;
  } | null>(null);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [updatingPermissions, setUpdatingPermissions] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    memberId: string | null;
  }>({ top: 0, left: 0, memberId: null });
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 4;

  // Pagination values
  const totalMembers = teamMembers.length;
  const totalPages = Math.ceil(totalMembers / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMembers = teamMembers.slice(startIndex, endIndex);
  const totalInvitations = pendingInvitations.length;
  const totalListings = listings.length;
  const activeRate =
    teamMembers.length > 0
      ? Math.round(
          (teamMembers.filter((m) => m.canManageBookings).length /
            teamMembers.length) *
            100,
        )
      : 0;

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = await getToken({ template: "my-app-template" });
      return fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers ?? {}),
        },
      });
    },
    [getToken],
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lr, tr, ir] = await Promise.all([
        authFetch("/api/listings?my=true"),
        authFetch("/api/owner/team"),
        authFetch("/api/owner/team/invite"),
      ]);
      if (lr.ok) {
        const d = await lr.json();
        setListings(d.listings || []);
      }
      if (tr.ok) {
        const d = await tr.json();
        setTeamMembers(d.members || []);
      }
      if (ir.ok) {
        const d = await ir.json();
        setPendingInvitations(d.invitations || []);
      }
    } catch (err) {
      setError("Erreur lors du chargement des données. Veuillez réessayer.");
      setAlert({
        type: "error",
        message: "Erreur lors du chargement des données. Veuillez réessayer.",
      });
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  const cancelInvitation = async (id: string) => {
    try {
      const res = await authFetch(`/api/owner/team/invite?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAlert({
          type: "success",
          message: "Invitation annulée avec succès.",
        });
        fetchData();
      } else {
        const e = await res.json();
        setAlert({
          type: "error",
          message: e.error || "Erreur lors de l'annulation de l'invitation.",
        });
      }
    } catch {
      setAlert({
        type: "error",
        message: "Erreur de connexion. Veuillez réessayer.",
      });
    }
  };

  const remindInvitation = async (id: string) => {
    setRemindingId(id);
    try {
      const res = await authFetch(`/api/owner/team/invite/${id}/remind`, {
        method: "POST",
      });
      if (res.ok) {
        setAlert({
          type: "success",
          message: "L'invitation a été renvoyée avec succès.",
        });
      } else {
        const e = await res.json();
        setAlert({
          type: "error",
          message: e.error || "Erreur lors du rappel de l'invitation.",
        });
      }
    } catch {
      setAlert({
        type: "error",
        message: "Erreur de connexion. Veuillez réessayer.",
      });
    } finally {
      setRemindingId(null);
    }
  };

  const removeTeamMember = async (id: string) => {
    if (
      !confirm("Êtes-vous sûr de vouloir retirer ce membre de votre équipe ?")
    )
      return;
    try {
      const res = await authFetch(`/api/owner/team/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAlert({
          type: "success",
          message: "Le membre a été retiré avec succès.",
        });
        fetchData();
      } else {
        const e = await res.json();
        setAlert({
          type: "error",
          message: e.error || "Erreur lors du retrait du membre.",
        });
      }
    } catch {
      setAlert({
        type: "error",
        message: "Erreur de connexion. Veuillez réessayer.",
      });
    }
  };

  const updatePermissions = async (memberId: string, permissions: any) => {
    setUpdatingPermissions(true);
    try {
      const res = await authFetch(`/api/owner/team/${memberId}/permissions`, {
        method: "PATCH",
        body: JSON.stringify(permissions),
      });
      if (res.ok) {
        setAlert({
          type: "success",
          message: "Permissions mises à jour avec succès.",
        });
        fetchData();
        setPermissionModalOpen(false);
      } else {
        const e = await res.json();
        setAlert({
          type: "error",
          message: e.error || "Erreur lors de la mise à jour des permissions.",
        });
      }
    } catch {
      setAlert({
        type: "error",
        message: "Erreur de connexion. Veuillez réessayer.",
      });
    } finally {
      setUpdatingPermissions(false);
    }
  };

  const openMenu = (event: React.MouseEvent, memberId: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + window.scrollY + 5,
      left: rect.left + window.scrollX - 140,
      memberId,
    });
  };

  const closeMenu = () => setMenuPosition({ top: 0, left: 0, memberId: null });

  useEffect(() => {
    const lid = searchParams.get("listingId");
    if (searchParams.get("openInvite") === "true" && lid) {
      setSelectedListingId(lid);
      setShowInviteModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    teamMembers,
    pendingInvitations,
    listings,
    loading,
    error,
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
  };
}
