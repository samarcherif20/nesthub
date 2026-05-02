// app/[locale]/admin/conversations/[id]/hooks/useConversationDetail.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";

export interface Message {
  id: string;
  content: string;
  createdAt: Date;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  isRead: boolean;
  isSystem: boolean;
}

export interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar: string | null;
  role: "OWNER" | "TENANT";
  reliabilityScore: number;
}

export interface ConversationDetail {
  id: string;
  listing: {
    id: string;
    title: string;
    reference: string;
  };
  participants: {
    owner: Participant;
    tenant: Participant;
  };
  messages: Message[];
  status: string;
  isBlocked: boolean;
  reportCount: number;
  notes?: AdminNote[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminNote {
  id: string;
  content: string;
  createdAt: Date;
  adminName: string;
}

export function useConversationDetail(conversationId: string) {
  const t = useTranslations("ConversationDetail");
  const { getToken } = useAuth();
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const showAlert = (type: "success" | "error" | "info", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const fetchConversation = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const response = await fetch(`/api/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(t("errors.loadFailed"));
      const data = await response.json();
      setConversation(data);
    } catch (error) {
      console.error(error);
      showAlert("error", t("errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [getToken, conversationId, t]);

  useEffect(() => {
    if (conversationId) {
      fetchConversation();
    }
  }, [conversationId, fetchConversation]);

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setSubmitting(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const response = await fetch(`/api/admin/conversations/${conversationId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: note }),
      });
      if (!response.ok) throw new Error(t("errors.noteFailed"));
      showAlert("success", t("success.noteAdded"));
      setNote("");
      fetchConversation();
    } catch (error) {
      console.error(error);
      showAlert("error", t("errors.noteFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (action: string) => {
    try {
      const token = await getToken({ template: "my-app-template" });
      const response = await fetch(`/api/admin/conversations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conversationId, action }),
      });
      if (!response.ok) throw new Error(t("errors.actionFailed"));
      
      let successMessage = "";
      if (action === "FLAG") successMessage = t("success.flagged");
      else if (action === "UNFLAG") successMessage = t("success.unflagged");
      else if (action === "CLOSE") successMessage = t("success.closed");
      else if (action === "REOPEN") successMessage = t("success.reopened");
      else successMessage = t("success.actionDone");
      
      showAlert("success", successMessage);
      fetchConversation();
    } catch (error) {
      console.error(error);
      showAlert("error", t("errors.actionFailed"));
    }
  };

  const cleanSystemMessage = (content: string): string => {
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}]/gu;
    let cleaned = content.replace(/\*\*/g, "");
    cleaned = cleaned.replace(/\*/g, "");
    cleaned = cleaned.replace(emojiRegex, "");
    cleaned = cleaned.replace(/\s+/g, " ").trim();
    return cleaned;
  };

  const getImageUrl = (url: string | null | undefined): string => {
    if (!url) return "";
    return `/api/admin/serve-image?url=${encodeURIComponent(url)}`;
  };

  return {
    conversation,
    loading,
    note,
    submitting,
    alert,
    setNote,
    setAlert,
    fetchConversation,
    handleAddNote,
    handleAction,
    cleanSystemMessage,
    getImageUrl,
  };
}