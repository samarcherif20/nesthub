// app/[locale]/admin/moderation/hooks/useModeration.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";

export interface Conversation {
  id: string;
  participants: {
    owner: {
      id: string;
      name: string;
      avatar: string | null;
      firstName: string;
      lastName: string;
    };
    tenant: {
      id: string;
      name: string;
      avatar: string | null;
      firstName: string;
      lastName: string;
    };
  };
  listing: {
    id: string;
    title: string;
    location: string;
    image?: string;
    governorate: string;
    delegation: string;
  };
  lastMessage: string;
  lastMessageDate: Date;
  status: "ACTIVE" | "FLAGGED" | "CLOSED";
  hasReports: boolean;
  reportCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export interface AlertState {
  type: "success" | "error" | "info";
  message: string;
}

export function useModeration(dateFilter?: string) {
  const t = useTranslations("Moderation");
  const { getToken } = useAuth();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
  });
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const isInitialMount = useRef(true);
  
  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const showAlert = useCallback((type: "success" | "error" | "info", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  }, []);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: filter,
        search: debouncedSearch,
      });
      
      // Ajout du filtre date si présent
      if (dateFilter && dateFilter !== "all") {
  params.append("dateRange", dateFilter);  
      }

      const response = await fetch(`/api/admin/conversations?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data = await response.json();
      setConversations(data.conversations);
      setPagination(data.pagination);
    } catch (error) {
      console.error(error);
      showAlert("error", t("errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [getToken, pagination.page, pagination.limit, filter, debouncedSearch, dateFilter, t, showAlert]);

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Reset page on filter/search change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchConversations();
  }, [debouncedSearch, filter, dateFilter, fetchConversations]);

  // Fetch on page change
  useEffect(() => {
    if (!isInitialMount.current) {
      fetchConversations();
    }
  }, [pagination.page, fetchConversations]);

  const handleAction = useCallback(async (conversationId: string, action: string, reason?: string) => {
    setActionLoading(conversationId);
    try {
      const token = await getToken({ template: "my-app-template" });
      const response = await fetch("/api/admin/conversations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ conversationId, action, reason }),
      });
      if (!response.ok) throw new Error("Erreur lors de l'action");
      
      let successMessage = "";
      if (action === "FLAG") successMessage = t("actions.flagged");
      else if (action === "UNFLAG") successMessage = t("actions.unflagged");
      else if (action === "CLOSE") successMessage = t("actions.closed");
      else if (action === "REOPEN") successMessage = t("actions.reopened");
      else successMessage = t("actions.success");
      
      showAlert("success", successMessage);
      fetchConversations();
    } catch (error) {
      console.error(error);
      showAlert("error", t("errors.actionFailed"));
    } finally {
      setActionLoading(null);
    }
  }, [getToken, t, showAlert, fetchConversations]);

  // Nouvelle fonction pour les actions groupées
  const handleBulkAction = useCallback(async (conversationIds: string[], action: string, reason?: string) => {
    setBulkActionLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const response = await fetch("/api/admin/conversations/bulk", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ conversationIds, action, reason }),
      });
      
      if (!response.ok) throw new Error("Erreur lors de l'action groupée");
      
      const result = await response.json();
      
      let successMessage = "";
      if (action === "FLAG") successMessage = t("actions.bulkFlagged", { count: conversationIds.length });
      else if (action === "CLOSE") successMessage = t("actions.bulkClosed", { count: conversationIds.length });
      else successMessage = t("actions.success");
      
      showAlert("success", successMessage);
      fetchConversations();
    } catch (error) {
      console.error(error);
      showAlert("error", t("errors.bulkActionFailed"));
    } finally {
      setBulkActionLoading(false);
    }
  }, [getToken, t, showAlert, fetchConversations]);

  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const handleImageError = useCallback((convId: string) => {
    setImageErrors((prev) => ({ ...prev, [convId]: true }));
  }, []);

  const totalActive = conversations.filter((c) => c.status === "ACTIVE").length;
  const totalFlagged = conversations.filter((c) => c.status === "FLAGGED").length;

  return {
    // Data
    conversations,
    loading,
    pagination,
    filter,
    search,
    alert,
    actionLoading,
    bulkActionLoading,
    imageErrors,
    totalActive,
    totalFlagged,
    // Actions
    setFilter,
    setSearch,
    handleAction,
    handleBulkAction,
    handlePageChange,
    handleImageError,
    setAlert,
    fetchConversations,
  };
}