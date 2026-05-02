// hooks/useInvitations.ts
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

export interface Invitation {
  id: string;
  email: string;
  role: string;
  invitedBy: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  acceptedAt: string | null;
  status: "active" | "expired" | "accepted" | "revoked";
}

export interface InvitationStats {
  active: number;
  expired: number;
  revoked: number;
  accepted: number;
  total: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FilterOptions {
  status: string;
  search: string;
}

export function useInvitations() {
  const { getToken } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [filteredInvitations, setFilteredInvitations] = useState<Invitation[]>(
    [],
  );
  const [stats, setStats] = useState<InvitationStats>({
    active: 0,
    expired: 0,
    revoked: 0,
    accepted: 0,
    total: 0,
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: "all",
    search: "",
  });

  const applyFilters = useCallback(
    (invitationsList: Invitation[]) => {
      let filtered = [...invitationsList];

      // Filter by status
      if (filters.status !== "all") {
        filtered = filtered.filter((inv) => inv.status === filters.status);
      }

      // Filter by search (email)
      if (filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase().trim();
        filtered = filtered.filter((inv) =>
          inv.email.toLowerCase().includes(searchTerm),
        );
      }

      setFilteredInvitations(filtered);

      // Update pagination based on filtered results
      setPagination((prev) => ({
        ...prev,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / prev.limit)),
        page: 1, // Reset to first page when filtering
      }));

      return filtered;
    },
    [filters],
  );

  const fetchInvitations = async (page = 1) => {
    setLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const response = await fetch(
        `/api/admin/invitations?page=${page}&limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) throw new Error();
      const data = await response.json();

      const invs: Invitation[] = Array.isArray(data.invitations)
        ? data.invitations
        : [];

      setInvitations(invs);

      // Calculate stats from all invitations
      const activeCount = invs.filter(
        (i) => i.status === "active" || i.status === "pending",
      ).length;
      const expiredCount = invs.filter((i) => i.status === "expired").length;
      const revokedCount = invs.filter((i) => i.status === "revoked").length;
      const acceptedCount = invs.filter((i) => i.status === "accepted").length;

      setStats({
        active: activeCount,
        expired: expiredCount,
        revoked: revokedCount,
        accepted: acceptedCount,
        total: invs.length,
      });

      setPagination(
        data.pagination && typeof data.pagination.total === "number"
          ? data.pagination
          : {
              page: 1,
              limit: 10,
              total: invs.length,
              totalPages: Math.max(1, Math.ceil(invs.length / 10)),
            },
      );

      // Apply filters
      applyFilters(invs);
    } catch (error) {
      console.error("Erreur chargement invitations:", error);
    } finally {
      setLoading(false);
    }
  };

  const createInvitation = async (
    email: string,
    role: string,
  ): Promise<boolean> => {
    setSubmitting(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const response = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur");
      await fetchInvitations(pagination.page);
      return true;
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async (token: string): Promise<string> => {
    const inviteLink = `${window.location.origin}/fr/accept-invite?token=${token}`;
    await navigator.clipboard.writeText(inviteLink);
    return inviteLink;
  };

  const revokeInvitation = async (id: string): Promise<void> => {
    const token = await getToken({ template: "my-app-template" });
    const response = await fetch(`/api/admin/invitations/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error();
    await fetchInvitations(pagination.page);
  };

  const resendInvitation = async (
    email: string,
    role: string,
  ): Promise<void> => {
    setSubmitting(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const response = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur");
      await fetchInvitations(pagination.page);
    } finally {
      setSubmitting(false);
    }
  };

  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Apply filters whenever they change or invitations change
  useEffect(() => {
    if (invitations.length > 0) {
      applyFilters(invitations);
    }
  }, [filters, invitations, applyFilters]);

  return {
    invitations: filteredInvitations, // Return filtered invitations instead
    allInvitations: invitations, // Keep original if needed
    stats,
    pagination,
    loading,
    submitting,
    filters,
    updateFilters,
    fetchInvitations,
    createInvitation,
    copyLink,
    revokeInvitation,
    resendInvitation,
  };
}
