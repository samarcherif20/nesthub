// hooks/useInvitations.ts
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { decodeJWT } from "@/lib/utils/jwt";

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
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useInvitations() {
  const { getToken } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stats, setStats] = useState<InvitationStats>({
    active: 0,
    expired: 0,
    revoked: 0,
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchInvitations = async (page = 1) => {
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

      setStats({
        active: invs.filter(
          (i) => i.status === "active" || i.status === "pending",
        ).length,
        expired: invs.filter((i) => i.status === "expired").length,
        revoked: invs.filter((i) => i.status === "revoked").length,
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
    } catch (error) {
      console.error("Erreur chargement invitations:", error);
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

  return {
    invitations,
    stats,
    pagination,
    loading: setLoading,
    submitting,
    fetchInvitations,
    createInvitation,
    copyLink,
    revokeInvitation,
    resendInvitation,
  };
}
