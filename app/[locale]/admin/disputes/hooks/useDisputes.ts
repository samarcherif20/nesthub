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
  totalRefund: number;
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
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [stats, setStats] = useState<DisputeStats>({
    open: 0,
    inReview: 0,
    resolved: 0,
    totalRefund: 0,
  });

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const params = new URLSearchParams({
        status: tab === "active" ? "OPEN,IN_REVIEW" : "RESOLVED,REJECTED",
        ...(search && { search }),
      });
      const res = await fetch(`/api/admin/disputes?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDisputes(data.disputes || []);
        if (data.stats) {
          setStats({
            open: data.stats.open || 0,
            inReview: data.stats.inReview || 0,
            resolved: data.stats.resolved || 0,
            totalRefund: data.stats.totalRefund || 0,
          });
        }
        if (data.disputes?.length > 0 && !selectedDispute) {
          setSelectedDispute(data.disputes[0]);
        }
      }
    } catch (error) {
      console.error(error);
      showAlert("error", t("errors.fetchFailed"));
    } finally {
      setLoading(false);
    }
  }, [getToken, tab, search, t]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const handleResolve = async (disputeId: string, resolvedAmount?: number) => {
    setActionLoading(disputeId);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resolution: t("resolutions.adminResolved"),
          resolvedAmount,
        }),
      });
      if (res.ok) {
        showAlert("success", t("success.resolved"));
        fetchDisputes();
      }
    } catch (error) {
      showAlert("error", t("errors.resolveFailed"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (disputeId: string) => {
    setActionLoading(disputeId);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/admin/disputes/${disputeId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: t("resolutions.adminRejected") }),
      });
      if (res.ok) {
        showAlert("success", t("success.rejected"));
        fetchDisputes();
      }
    } catch (error) {
      showAlert("error", t("errors.rejectFailed"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendMessage = async (disputeId: string, content: string) => {
    setSendingMessage(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/admin/disputes/${disputeId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const msg = await res.json();
        setSelectedDispute((prev) =>
          prev ? { ...prev, messages: [...prev.messages, msg] } : prev,
        );
        fetchDisputes();
      }
    } catch (error) {
      console.error(error);
      showAlert("error", t("errors.messageFailed"));
    } finally {
      setSendingMessage(false);
    }
  };

  const clearAlert = () => setAlert(null);

  const totalActive = stats.open + stats.inReview;

  return {
    // États
    disputes,
    selectedDispute,
    loading,
    actionLoading,
    sendingMessage,
    search,
    tab,
    alert,
    stats,
    totalActive,
    // Setters
    setSelectedDispute,
    setSearch,
    setTab,
    // Actions
    fetchDisputes,
    handleResolve,
    handleReject,
    handleSendMessage,
    clearAlert,
  };
}