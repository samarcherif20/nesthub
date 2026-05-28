// app/[locale]/admin/contacts/[id]/hooks/useContactReply.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

export interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  userId: string | null;
  userProfilePictureUrl: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  message: string;
  status: string;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

export function useContactReply(contactId: string, locale: string) {
  const t = useTranslations("AdminContacts.reply");
  
  const [message, setMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const getProfileImageUrl = useCallback((url: string | null | undefined): string => {
    if (!url) return "";
    return `/api/admin/serve-image?url=${encodeURIComponent(url)}`;
  }, []);

  const handleImageError = useCallback((id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  }, []);

  const fetchMessage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/contact/list`);
      if (!res.ok) throw new Error(t("loading.error"));
      const data = await res.json();
      const found = data.messages.find((m: ContactMessage) => m.id === contactId);
      
      if (!found) throw new Error(t("errors.notFound"));
      
      setMessage(found);
      setReplyText(found?.reply || "");
      setReplySubject(`Re: ${found?.fullName} - ${t("page.title")}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("toast.loadError"));
    } finally {
      setLoading(false);
    }
  }, [contactId, t]);

  const sendReply = useCallback(async () => {
    if (!message) {
      return { success: false, error: t("toast.messageNotFound") };
    }
    
    // ✅ VÉRIFIER SI DÉJÀ RÉPONDU
    if (message.status === "REPLIED") {
      return { success: false, error: t("toast.alreadyReplied") };
    }
    
    if (!replyText.trim()) {
      return { success: false, error: t("toast.writeReply") };
    }

    setSending(true);

    try {
      const res = await fetch("/api/admin/contact/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: message.id,
          replyMessage: replyText,
          subject: replySubject,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ Mettre à jour le statut localement après envoi réussi
        setMessage(prev => prev ? { ...prev, status: "REPLIED", repliedAt: new Date().toISOString() } : prev);
        return { success: true, message: `${t("toast.replySent")} ${message.email}` };
      } else {
        throw new Error(data.error || t("toast.replyError"));
      }
    } catch (err) {
      return { success: false, error: t("toast.replyError") };
    } finally {
      setSending(false);
    }
  }, [message, replyText, replySubject, t]);

  const formatDate = useCallback((date: string) => {
    const dateLocale = locale === "fr" ? "fr-FR" : "en-US";
    return new Date(date).toLocaleDateString(dateLocale, {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [locale]);

  useEffect(() => {
    fetchMessage();
  }, [fetchMessage]);

  const isAlreadyReplied = message?.status === "REPLIED";
  const hasProfileImage = message?.userId && message?.userProfilePictureUrl && !imageErrors[message.id];
  const profileImageUrl = message?.userProfilePictureUrl ? getProfileImageUrl(message.userProfilePictureUrl) : "";

  return {
    // Data
    message,
    replyText,
    replySubject,
    sending,
    loading,
    error,
    hasProfileImage,
    profileImageUrl,
    isAlreadyReplied, // ✅ NOUVEAU
    // Actions
    setReplyText,
    setReplySubject,
    sendReply,
    formatDate,
    handleImageError,
    refetch: fetchMessage,
  };
}