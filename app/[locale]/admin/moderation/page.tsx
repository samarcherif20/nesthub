// app/[locale]/admin/moderation/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import {
  IoChatbubblesOutline,
  IoFlagOutline,
  IoFlag,
  IoEyeOutline,
  IoCloseOutline,
  IoSearchOutline,
  IoShieldOutline,
  IoArrowForwardOutline,
  IoHomeOutline,
  IoLocationOutline,
  IoAlertCircleOutline,
} from "react-icons/io5";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertBanner from "@/components/ui/Alert";
import Pagination from "@/components/ui/Pagination";

const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

interface Conversation {
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

interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

const getAvatarUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  return `/api/admin/serve-image?url=${encodeURIComponent(url)}`;
};

const getListingImageUrl = (imageUrl: string | undefined): string => {
  if (!imageUrl) return "";
  return `/api/listings/image?url=${encodeURIComponent(imageUrl)}`;
};

// Hook personnalisé pour le debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function ModerationPage() {
  const { getToken } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 5,
    totalCount: 0,
    totalPages: 1,
  });
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const isInitialMount = useRef(true);

  const showAlert = (type: "success" | "error" | "info", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

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

      const response = await fetch(`/api/admin/conversations?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data = await response.json();
      setConversations(data.conversations);
      setPagination(data.pagination);
    } catch (error) {
      console.error(error);
      showAlert("error", "Erreur lors du chargement des conversations");
    } finally {
      setLoading(false);
    }
  }, [getToken, pagination.page, pagination.limit, filter, debouncedSearch]);

  // Chargement initial
  useEffect(() => {
    fetchConversations();
  }, []);

  // Recherche avec debounce
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchConversations();
  }, [debouncedSearch, filter]);

  const handleAction = async (
    conversationId: string,
    action: string,
    reason?: string,
  ) => {
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
      showAlert(
        "success",
        `Conversation ${action === "FLAG" ? "signalée" : "modifiée"} avec succès`,
      );
      fetchConversations();
    } catch (error) {
      console.error(error);
      showAlert("error", "Erreur lors de l'action");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            Active
          </span>
        );
      case "FLAGGED":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            Signalée
          </span>
        );
      case "CLOSED":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Fermée
          </span>
        );
      default:
        return null;
    }
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
    fetchConversations();
  };

  const handleImageError = (convId: string) =>
    setImageErrors((prev) => ({ ...prev, [convId]: true }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <LoadingSpinner size="lg" color="primary" />
      </div>
    );
  }

  const totalActive = conversations.filter((c) => c.status === "ACTIVE").length;
  const totalFlagged = conversations.filter(
    (c) => c.status === "FLAGGED",
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 overflow-x-hidden">
      {alert && (
        <div className="fixed top-20 right-8 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <AlertBanner
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1">
        <div className="p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Modération des Conversations
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                Surveillez, signalez et résolvez les interactions utilisateurs
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 p-3 flex items-center gap-3 ${card3d}`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <IoChatbubblesOutline className="text-emerald-600 dark:text-emerald-400 text-sm" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Actives
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {totalActive}
                  </p>
                </div>
              </div>
              <div
                className={`bg-white dark:bg-slate-900 rounded-2xl border border-red-100 dark:border-red-900/40 p-3 flex items-center gap-3 ${card3d}`}
              >
                <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <IoFlag className="text-red-600 dark:text-red-400 text-sm" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Signalées
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {totalFlagged}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-indigo-50 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/40 to-violet-50/20 dark:from-indigo-900/10 dark:to-violet-900/5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-base" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher par titre, participant..."
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-slate-100"
                  />
                </div>
                <select
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors text-slate-700 dark:text-slate-300"
                >
                  <option value="all">Toutes</option>
                  <option value="active">Actives</option>
                  <option value="flagged">Signalées</option>
                  <option value="closed">Fermées</option>
                </select>
                <button
                  onClick={() => {
                    setPagination(prev => ({ ...prev, page: 1 }));
                    fetchConversations();
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold shadow-sm transition-all"
                >
                  Appliquer
                </button>
              </div>
            </div>
          </div>

          {/* Tableau */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden w-full max-w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30">
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                      Participants
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                      Annonce
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                      Dernier message
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {conversations.map((conv) => {
                    const listingImageUrl = conv.listing?.image;
                    const proxiedUrl = getListingImageUrl(listingImageUrl);
                    const hasImageError = imageErrors[conv.id];
                    return (
                      <tr
                        key={conv.id}
                        className="hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors"
                      >
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 overflow-hidden border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                {conv.participants.owner.avatar ? (
                                  <img
                                    src={getAvatarUrl(
                                      conv.participants.owner.avatar,
                                    )}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    onError={(e) =>
                                      (e.currentTarget.style.display = "none")
                                    }
                                  />
                                ) : (
                                  <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                    {conv.participants.owner.firstName?.charAt(
                                      0,
                                    ) ||
                                      conv.participants.owner.name?.charAt(0) ||
                                      "O"}
                                  </span>
                                )}
                              </div>
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 overflow-hidden border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                {conv.participants.tenant.avatar ? (
                                  <img
                                    src={getAvatarUrl(
                                      conv.participants.tenant.avatar,
                                    )}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    onError={(e) =>
                                      (e.currentTarget.style.display = "none")
                                    }
                                  />
                                ) : (
                                  <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                    {conv.participants.tenant.firstName?.charAt(
                                      0,
                                    ) ||
                                      conv.participants.tenant.name?.charAt(
                                        0,
                                      ) ||
                                      "T"}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {conv.participants.owner.firstName ||
                                  conv.participants.owner.name ||
                                  "Propriétaire"}{" "}
                                {conv.participants.owner.lastName || ""}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                &amp;{" "}
                                {conv.participants.tenant.firstName ||
                                  conv.participants.tenant.name ||
                                  "Locataire"}{" "}
                                {conv.participants.tenant.lastName || ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                              {listingImageUrl && !hasImageError ? (
                                <img
                                  src={proxiedUrl}
                                  alt={conv.listing.title || "Annonce"}
                                  className="w-full h-full object-cover"
                                  onError={() => handleImageError(conv.id)}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                                  <IoHomeOutline className="w-5 h-5 text-slate-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[200px]">
                                {conv.listing.title || "Sans titre"}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <IoLocationOutline className="text-[9px]" />
                                <span className="truncate max-w-[150px]">
                                  {conv.listing.location ||
                                    `${conv.listing.governorate || ""} ${conv.listing.delegation || ""}`}
                                </span>
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 max-w-xs">
                          <p
                            className={`text-sm truncate ${conv.hasReports ? "text-red-600 dark:text-red-400 font-medium" : "text-slate-600 dark:text-slate-400"}`}
                          >
                            {conv.lastMessage && conv.lastMessage.length > 60
                              ? conv.lastMessage.substring(0, 60) + "..."
                              : conv.lastMessage || "Aucun message"}
                          </p>
                          {conv.reportCount > 0 && (
                            <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1">
                              <IoAlertCircleOutline className="text-[9px]" />
                              {conv.reportCount} signalement
                              {conv.reportCount > 1 ? "s" : ""}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDistanceToNow(
                              new Date(conv.lastMessageDate),
                              { addSuffix: true, locale: fr },
                            )}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {getStatusBadge(conv.status)}
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/admin/conversations/${conv.id}`}
                              className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                            >
                              <IoEyeOutline className="text-base" />
                            </Link>
                            {conv.status !== "FLAGGED" ? (
                              <button
                                onClick={() => handleAction(conv.id, "FLAG")}
                                disabled={actionLoading === conv.id}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-50"
                              >
                                <IoFlagOutline className="text-base" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAction(conv.id, "UNFLAG")}
                                disabled={actionLoading === conv.id}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-50"
                              >
                                <IoFlag className="text-base" />
                              </button>
                            )}
                            {conv.status !== "CLOSED" ? (
                              <button
                                onClick={() => handleAction(conv.id, "CLOSE")}
                                disabled={actionLoading === conv.id}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50"
                              >
                                <IoCloseOutline className="text-base" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAction(conv.id, "REOPEN")}
                                disabled={actionLoading === conv.id}
                                className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all disabled:opacity-50"
                              >
                                <IoChatbubblesOutline className="text-base" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {pagination.totalPages > 1 && (
              <div className="border-t border-indigo-50 dark:border-indigo-900/30 px-4 py-3">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.totalCount}
                  pageSize={pagination.limit}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 mt-auto">
        <div className="p-2 pt-0 mb-30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-base font-bold mb-1">
                  Modération Automatique
                </h3>
                <p className="text-white/70 text-xs mb-4">
                  Notre IA a signalé des conversations potentiellement
                  problématiques.
                </p>
                <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition">
                  Lancer l'audit
                </button>
              </div>
              <IoShieldOutline className="absolute -right-3 -bottom-3 text-[80px] text-white/10" />
            </div>
            <div className="p-5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <div className="relative z-10">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  Règles Communautaires
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
                  Assurez-vous que toutes les interactions respectent les normes
                  Nesthub.
                </p>
                <button className="text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 group">
                  Voir la politique
                  <IoArrowForwardOutline className="transition-transform group-hover:translate-x-0.5 text-xs" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}