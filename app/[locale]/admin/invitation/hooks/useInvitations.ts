// hooks/useInvitations.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";

export interface Invitation {
  id: string;
  email: string;
  role: string;
  invitedBy: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  acceptedAt: string | null;
  status: "pending" | "expired" | "accepted" | "revoked";
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
  const params = useParams();
  const locale = params?.locale || "fr";
  const isMounted = useRef(true);

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stats, setStats] = useState<InvitationStats>({
    active: 0,
    expired: 0,
    revoked: 0,
    accepted: 0,
    total: 0,
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: "all",
    search: "",
  });
  const fetchInvitations = useCallback(
    async (page = 1) => {
      console.log(" fetchInvitations appelée avec page:", page);

      setLoading(true);

      try {
        const token = await getToken({ template: "my-app-template" });

        const urlParams = new URLSearchParams();
        urlParams.append("page", page.toString());
        urlParams.append("limit", "5");

        if (filters.status !== "all") {
          urlParams.append("status", filters.status);
        }
        if (filters.search.trim()) {
          urlParams.append("search", filters.search.trim());
        }

        console.log(
          " Envoi requête API page:",
          page,
          "URL:",
          urlParams.toString(),
        );

        const response = await fetch(
          `/api/admin/invitations?${urlParams.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (!response.ok) throw new Error();
        const data = await response.json();

        console.log(
          " Réception page:",
          page,
          "nb invitations:",
          data.invitations?.length,
        );

        const invs: Invitation[] = Array.isArray(data.invitations)
          ? data.invitations
          : [];

        setInvitations(invs);

        if (data.stats) {
          setStats(data.stats);
        }

        if (data.pagination) {
          console.log(" Nouvelle pagination:", data.pagination);
          setPagination(data.pagination);
        } else {
          setPagination({
            page: page,
            limit: 5,
            total: invs.length,
            totalPages: Math.max(1, Math.ceil(invs.length / 5)),
          });
        }
      } catch (error) {
        console.error("Erreur chargement invitations:", error);
      } finally {
        setLoading(false);
      }
    },
    [getToken, filters],
  );

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
      await fetchInvitations(1);
      return true;
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async (token: string): Promise<string> => {
    const inviteLink = `${window.location.origin}/${locale}/accept-invite?token=${token}`;
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
      await fetchInvitations(1);
    } finally {
      setSubmitting(false);
    }
  };

  const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilters((prev) => {
      const updated = { ...prev, ...newFilters };
      return updated;
    });
  }, []);

  // Fetch quand les filtres changent
  useEffect(() => {
    if (isMounted.current) {
      fetchInvitations(1);
    }
  }, [filters]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    invitations,
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
