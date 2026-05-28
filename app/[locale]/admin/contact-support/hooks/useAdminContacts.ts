// app/[locale]/admin/contacts/hooks/useAdminContacts.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

export interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  userId: string | null;
  message: string;
  status: string;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

export function useAdminContacts() {
  const t = useTranslations("AdminContacts");
  
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/contact/list");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages(data.messages);
      setError(null);
    } catch (err) {
      setError(t("errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Stats calculées
  const total = messages.length;
  const pending = messages.filter((m) => m.status === "PENDING").length;
  const replied = messages.filter((m) => m.status === "REPLIED").length;
  const userMessages = messages.filter((m) => m.userId !== null).length;
  const visitorMessages = messages.filter((m) => m.userId === null).length;
  const responseRate = total > 0 ? (replied / total) * 100 : 0;

  const stats = {
    total,
    pending,
    responseRate,
    userMessages,
    visitorMessages,
  };

  // Filtrage des messages
  const filteredMessages = messages.filter((msg) => {
    const matchesSearch =
      msg.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      typeFilter === "all"
        ? true
        : typeFilter === "user"
        ? msg.userId !== null
        : typeFilter === "visitor"
        ? msg.userId === null
        : true;

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "new"
        ? msg.status === "PENDING"
        : statusFilter === "resolved"
        ? msg.status === "REPLIED"
        : true;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMessages.length / itemsPerPage);
  const paginatedMessages = filteredMessages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm !== "" || typeFilter !== "all" || statusFilter !== "all";

  return {
    // Data
    messages,
    loading,
    error,
    searchTerm,
    typeFilter,
    statusFilter,
    currentPage,
    totalPages,
    itemsPerPage,
    filteredMessages,
    paginatedMessages,
    stats,
    hasActiveFilters,
    // Actions
    setSearchTerm,
    setTypeFilter,
    setStatusFilter,
    setCurrentPage,
    fetchMessages,
    resetFilters,
  };
}