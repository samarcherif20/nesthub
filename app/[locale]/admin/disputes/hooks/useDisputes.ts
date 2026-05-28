// app/[locale]/admin/disputes/hooks/useDisputes.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";

export type Severity = "HIGH" | "MEDIUM" | "LOW";
export type DisputeStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED";

export interface DisputeMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "TENANT" | "OWNER" | "ADMIN";
  content: string;
  attachments?: string[];
  createdAt: string;
}

export interface Dispute {
  id: string;
  reference: string;
  reporter: {
    id: string;
    firstName: string;
    lastName: string;
    image?: string;
  };
  respondent?: {
    id: string;
    firstName: string;
    lastName: string;
    image?: string;
  };
  type: string;
  status: DisputeStatus;
  severity: Severity;
  createdAt: string;
  description: string;
  evidence?: string[];
  listing?: {
    id: string;
    title: string;
    image?: string;
    location?: string;
    governorate?: string;
    delegation?: string;
  };
  booking?: {
    id: string;
    checkIn: string;
    checkOut: string;
    totalPrice: number;
    nights?: number;
  };
  messages: DisputeMessage[];
  refundAmount?: number;
  resolvedAmount?: number;
  resolution?: string;
}

export interface DisputeStats {
  open: number;
  inReview: number;
  resolved: number;
  rejected: number;
  totalRefund: number;
}

export interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

export function useDisputes() {
  const t = useTranslations("Disputes");
  const { getToken } = useAuth();

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"active" | "archive">("active");
  const [stats, setStats] = useState<DisputeStats>({
    open: 0,
    inReview: 0,
    resolved: 0,
    rejected: 0,
    totalRefund: 0,
  });

  const fetchStats = useCallback(async () => {
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch("/api/admin/disputes/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats({
          open: data.open || 0,
          inReview: data.inReview || 0,
          resolved: data.resolved || 0,
          rejected: data.rejected || 0,
          totalRefund: data.totalRefund || 0,
        });
        return { success: true };
      }
      return { success: false, error: "Failed to fetch stats" };
    } catch (error) {
      console.error("Error fetching stats:", error);
      return { success: false, error: String(error) };
    }
  }, [getToken]);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const params = new URLSearchParams();

      if (tab === "active") {
        params.append("status", "OPEN,IN_REVIEW");
      } else {
        params.append("status", "RESOLVED,REJECTED");
      }

      if (search) {
        params.append("search", search);
      }

      const res = await fetch(`/api/admin/disputes?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setDisputes(data.disputes || []);

        if (data.disputes?.length > 0 && !selectedDispute) {
          setSelectedDispute(data.disputes[0]);
        } else if (data.disputes?.length === 0) {
          setSelectedDispute(null);
        }
        return { success: true };
      }
      return { success: false, error: "Failed to fetch disputes" };
    } catch (error) {
      console.error(error);
      return { success: false, error: String(error) };
    } finally {
      setLoading(false);
    }
  }, [getToken, tab, search, selectedDispute]);

  const refreshAll = useCallback(async () => {
    const [disputesResult, statsResult] = await Promise.all([fetchDisputes(), fetchStats()]);
    return { disputesResult, statsResult };
  }, [fetchDisputes, fetchStats]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    fetchDisputes();
  }, [tab, search]);

 // Version sans argent (recommandée)
const handleResolve = async (disputeId: string): Promise<ActionResult> => {
  console.log("🔵 [HOOK] handleResolve appelé - disputeId:", disputeId);
  setActionLoading(disputeId);
  try {
    const token = await getToken({ template: "my-app-template" });
    const res = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}), // ← body vide
    });
    
    if (res.ok) {
      await refreshAll();
      return { success: true, message: t("resolveSuccess") };
    } else {
      const data = await res.json();
      return { success: false, error: data.error || t("resolveError") };
    }
  } catch (error) {
    return { success: false, error: t("connectionError") };
  } finally {
    setActionLoading(null);
  }
};

  const handleReject = async (disputeId: string): Promise<ActionResult> => {
    setActionLoading(disputeId);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/admin/disputes/${disputeId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (res.ok) {
        await refreshAll();
        return { success: true, message: t("rejectSuccess") };
      } else {
        const data = await res.json();
        return { success: false, error: data.error || t("rejectError") };
      }
    } catch (error) {
      console.error(error);
      return { success: false, error: t("connectionError") };
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendMessage = async (
    disputeId: string,
    content: string,
    recipient: "BOTH" | "OWNER" | "TENANT" = "BOTH",
  ): Promise<ActionResult> => {
    setSendingMessage(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/admin/disputes/${disputeId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, recipient }),
      });
      
      if (res.ok) {
        const newMsg = await res.json();
        setSelectedDispute((prev) =>
          prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev,
        );
        await fetchDisputes();
        return { success: true };
      }
      return { success: false, error: "Failed to send message" };
    } catch (error) {
      console.error(error);
      return { success: false, error: String(error) };
    } finally {
      setSendingMessage(false);
    }
  };

  const totalActive = stats.open + stats.inReview;
  const totalArchived = stats.resolved + stats.rejected;

  return {
    disputes,
    selectedDispute,
    loading,
    actionLoading,
    sendingMessage,
    search,
    tab,
    stats,
    totalActive,
    totalArchived,
    setSelectedDispute,
    setSearch,
    setTab,
    fetchDisputes: refreshAll,
    handleResolve,
    handleReject,
    handleSendMessage,
  };
}