// components/modals/ActionsHistoryModal.tsx
"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  IoBanOutline,
  IoPauseCircleOutline,
  IoCheckmarkCircleOutline,
  IoLockClosedOutline,
  IoLockOpenOutline,
  IoWarningOutline,
  IoArrowUpCircleOutline,
  IoCreateOutline,
  IoArrowUndoOutline,
  IoArrowBackOutline,
} from "react-icons/io5";
import { MdOutlineVerified, MdOutlineClose } from "react-icons/md";
import SearchBar from "@/components/ui/SearchBar";
import Pagination from "@/components/ui/Pagination";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";

interface ActionsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onUndo?: (actionId: string) => Promise<void>;
}

// Type correspondant à votre modèle Prisma UserAction
interface UserAction {
  id: string;
  userId: string;
  actionType: string;
  performedBy: string;
  reason?: string | null;
  motif?: string | null;
  internalNote?: string | null;
  duration?: number | null;
  level?: number | null;
  content?: string | null;
  previousStatus?: string | null;
  newStatus?: string | null;
  createdAt: string;
  user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  };
  admin?: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  };
}

// ✅ Fonction pour nettoyer le HTML et garder les retours à la ligne
const cleanHtml = (html: string | null | undefined): string => {
  if (!html) return "";
  
  // Remplacer les balises <br> et <p> par des retours à la ligne
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<div>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]*>/g, ''); // Supprimer toutes les autres balises
  
  // Décoder les entités HTML
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }
  return text;
};

// ✅ Fonction pour formater le texte avec des retours à la ligne
const formatText = (text: string | null | undefined): string[] => {
  if (!text) return [];
  
  // Nettoyer le HTML d'abord
  const cleanText = cleanHtml(text);
  
  // Split par les retours à la ligne et garder les lignes (même vides)
  return cleanText.split('\n');
};

// ✅ Fonction pour obtenir l'icône en fonction du type d'action (y compris les versions "undone")
const getActionIcon = (actionType: string) => {
  const baseType = actionType.replace('_UNDONE', '');
  
  if (actionType.includes('_UNDONE')) {
    return <IoArrowBackOutline className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
  }
  
  switch (baseType) {
    case 'SUSPEND_USER':
      return <IoPauseCircleOutline className="w-5 h-5 text-red-600 dark:text-red-400" />;
    case 'BAN_USER':
      return <IoBanOutline className="w-5 h-5 text-red-600 dark:text-red-400" />;
    case 'ACTIVATE_USER':
      return <IoCheckmarkCircleOutline className="w-5 h-5 text-green-600 dark:text-green-400" />;
    case 'UNLOCK_USER':
      return <IoLockOpenOutline className="w-5 h-5 text-green-600 dark:text-green-400" />;
    case 'LOCK_USER':
      return <IoLockClosedOutline className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
    case 'WARNING':
      return <IoWarningOutline className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
    case 'ESCALATE_USER':
      return <IoArrowUpCircleOutline className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    case 'ADD_NOTE':
      return <IoCreateOutline className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    case 'REJECT_VERIFICATION':
      return <MdOutlineClose className="w-5 h-5 text-red-600 dark:text-red-400" />;
    case 'VALIDATE_VERIFICATION':
      return <MdOutlineVerified className="w-5 h-5 text-green-600 dark:text-green-400" />;
    default:
      return <IoCreateOutline className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
  }
};

// ✅ Fonction pour obtenir les couleurs en fonction du type d'action
const getActionColors = (actionType: string) => {
  const baseType = actionType.replace('_UNDONE', '');
  
  if (actionType.includes('_UNDONE')) {
    return {
      bg: "bg-gray-100",
      text: "text-gray-700",
      darkBg: "dark:bg-gray-800",
      darkText: "dark:text-gray-400",
    };
  }
  
  switch (baseType) {
    case 'SUSPEND_USER':
    case 'BAN_USER':
    case 'REJECT_VERIFICATION':
      return {
        bg: "bg-red-100",
        text: "text-red-700",
        darkBg: "dark:bg-red-900/30",
        darkText: "dark:text-red-300",
      };
    case 'ACTIVATE_USER':
    case 'UNLOCK_USER':
    case 'VALIDATE_VERIFICATION':
      return {
        bg: "bg-green-100",
        text: "text-green-700",
        darkBg: "dark:bg-green-900/30",
        darkText: "dark:text-green-300",
      };
    case 'LOCK_USER':
      return {
        bg: "bg-amber-100",
        text: "text-amber-700",
        darkBg: "dark:bg-amber-900/30",
        darkText: "dark:text-amber-300",
      };
    case 'WARNING':
      return {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        darkBg: "dark:bg-yellow-900/30",
        darkText: "dark:text-yellow-300",
      };
    case 'ESCALATE_USER':
      return {
        bg: "bg-purple-100",
        text: "text-purple-700",
        darkBg: "dark:bg-purple-900/30",
        darkText: "dark:text-purple-300",
      };
    case 'ADD_NOTE':
      return {
        bg: "bg-blue-100",
        text: "text-blue-700",
        darkBg: "dark:bg-blue-900/30",
        darkText: "dark:text-blue-300",
      };
    default:
      return {
        bg: "bg-blue-100",
        text: "text-blue-700",
        darkBg: "dark:bg-blue-900/30",
        darkText: "dark:text-blue-300",
      };
  }
};

// ✅ Fonction pour obtenir le libellé en français
const getActionLabel = (actionType: string, t: any) => {
  const baseType = actionType.replace('_UNDONE', '');
  
  if (actionType.includes('_UNDONE')) {
    switch (baseType) {
      case 'SUSPEND_USER':
        return t("actionTypes.suspensionUndone") || "Suspension annulée";
      case 'BAN_USER':
        return t("actionTypes.banUndone") || "Bannissement annulé";
      case 'LOCK_USER':
        return t("actionTypes.lockUndone") || "Blocage annulé";
      case 'ESCALATE_USER':
        return t("actionTypes.escalationUndone") || "Escalade annulée";
      default:
        return t("actionTypes.undone") || "Action annulée";
    }
  }
  
  const labels: Record<string, string> = {
    SUSPEND_USER: t("actionTypes.suspension"),
    BAN_USER: t("actionTypes.ban"),
    ACTIVATE_USER: t("actionTypes.activation"),
    UNLOCK_USER: t("actionTypes.unlock"),
    LOCK_USER: t("actionTypes.lock"),
    WARNING: t("actionTypes.warning"),
    ESCALATE_USER: t("actionTypes.escalation"),
    ADD_NOTE: t("actionTypes.note"),
    REJECT_VERIFICATION: t("actionTypes.rejectVerification"),
    VALIDATE_VERIFICATION: t("actionTypes.validateVerification"),
  };
  return labels[baseType] || baseType;
};

export default function ActionsHistoryModal({
  isOpen,
  onClose,
  userId,
  onUndo,
}: ActionsHistoryModalProps) {
  const t = useTranslations("admin.usersManagement.actionsHistoryModal");
  const { getToken } = useAuth();
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [actions, setActions] = useState<UserAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [undoingId, setUndoingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 5;

  // Charger les actions depuis l'API
  useEffect(() => {
    if (isOpen) {
      fetchActions();
    }
  }, [isOpen, userId, currentPage, filter, search]);

  const fetchActions = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken({ template: "my-app-template" });

      if (!token) {
        throw new Error(t("errors.tokenNotAvailable"));
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(userId && { userId }),
        ...(filter !== "ALL" && { actionType: filter }),
        ...(search && { search }),
      });

      const url = `/api/admin/users/actions?${params}`;
      console.log("📡 Fetching URL:", url);

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`${t("errors.apiError")} ${response.status}`);
      }

      const data = await response.json();
      setActions(data.actions || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.totalCount || 0);
    } catch (error) {
      console.error("❌ Erreur chargement actions:", error);
      setError(t("errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async (actionId: string) => {
    if (!onUndo) return;

    setUndoingId(actionId);
    try {
      await onUndo(actionId);
      fetchActions();
    } catch (error) {
      console.error("❌ Erreur annulation:", error);
    } finally {
      setUndoingId(null);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchActions();
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(e.target.value);
    setCurrentPage(1);
  };

  const getAdminName = (admin?: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  }) => {
    if (!admin) return t("admin.default");
    if (admin.firstName && admin.lastName)
      return `${admin.firstName} ${admin.lastName}`;
    if (admin.firstName) return admin.firstName;
    if (admin.lastName) return admin.lastName;
    return admin.email.split("@")[0];
  };

  const getStatusColor = (status: string) => {
    if (status.includes("BANNED") || status === "PERMANENTLY_BANNED")
      return "text-red-600 dark:text-red-400";
    if (status.includes("SUSPENDED") || status === "TEMPORARILY_SUSPENDED")
      return "text-amber-600 dark:text-amber-400";
    if (status === "ACTIVE") return "text-green-600 dark:text-green-400";
    if (status === "PENDING_VALIDATION")
      return "text-yellow-600 dark:text-yellow-400";
    if (status === "LOCKED") return "text-orange-600 dark:text-orange-400";
    if (status === "REJECTED") return "text-red-600 dark:text-red-400";
    if (status === "INACTIVE") return "text-gray-600 dark:text-gray-400";
    return "text-gray-600 dark:text-gray-400";
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, string> = {
      ACTIVE: t("status.active"),
      TEMPORARILY_SUSPENDED: t("status.suspended"),
      PERMANENTLY_BANNED: t("status.banned"),
      PENDING_VALIDATION: t("status.pending"),
      LOCKED: t("status.locked"),
      INACTIVE: t("status.inactive"),
      REJECTED: t("status.rejected"),
    };
    return statusMap[status] || status;
  };

  const getStatusBadge = (
    previousStatus?: string | null,
    newStatus?: string | null,
  ) => {
    if (!previousStatus || !newStatus) return null;

    return (
      <div className="flex items-center mt-2 text-xs font-medium flex-wrap gap-1">
        <span className={getStatusColor(previousStatus)}>
          {getStatusDisplay(previousStatus)}
        </span>
        <svg
          className="h-3 w-3 mx-1 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M14 5l7 7m0 0l-7 7m7-7H3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          ></path>
        </svg>
        <span className={getStatusColor(newStatus)}>
          {getStatusDisplay(newStatus)}
        </span>
      </div>
    );
  };

  const filterOptions = [
    { value: "ALL", label: t("filters.all") },
    { value: "WARNING", label: t("actionTypes.warning") },
    { value: "SUSPEND_USER", label: t("actionTypes.suspension") },
    { value: "BAN_USER", label: t("actionTypes.ban") },
    { value: "ACTIVATE_USER", label: t("actionTypes.activation") },
    { value: "LOCK_USER", label: t("actionTypes.lock") },
    { value: "UNLOCK_USER", label: t("actionTypes.unlock") },
    { value: "ESCALATE_USER", label: t("actionTypes.escalation") },
    { value: "ADD_NOTE", label: t("actionTypes.note") },
    {
      value: "REJECT_VERIFICATION",
      label: t("actionTypes.rejectVerification"),
    },
    {
      value: "VALIDATE_VERIFICATION",
      label: t("actionTypes.validateVerification"),
    },
  ];

  // Vérifier si le bouton Undo doit être affiché pour cette action
  const canUndo = (action: UserAction) => {
    const undoableActions = [
      "SUSPEND_USER",
      "BAN_USER",
      "LOCK_USER",
      "ESCALATE_USER",
    ];
    return (
      undoableActions.includes(action.actionType) &&
      !action.actionType.includes("_UNDONE")
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={true}
      title={
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-primary/10 dark:bg-primary/20 rounded-full">
            <IoArrowUndoOutline className="h-5 w-5 text-primary dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("title")}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("subtitle")}
            </p>
          </div>
        </div>
      }
      size="xl"
    >
      {/* Controls Section */}
      <div className="p-5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-grow md:flex-grow-0 md:w-96">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder={t("search.placeholder")}
              onSearch={handleSearch}
              className="text-sm"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {t("filters.label")}:
            </span>
            <select
              value={filter}
              onChange={handleFilterChange}
              className="w-full md:w-48 py-2 pl-3 pr-8 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Action List */}
      <div className="flex-grow overflow-y-auto custom-scrollbar p-5 max-h-[450px] bg-white dark:bg-gray-900">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 dark:text-red-400 text-sm mb-3">{error}</p>
            <button
              onClick={fetchActions}
              className="px-4 py-2 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 rounded-lg transition-colors"
            >
              {t("errors.retry")}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {actions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t("results.empty")}</p>
              </div>
            ) : (
              actions.map((action) => {
                const colors = getActionColors(action.actionType);
                const adminName = getAdminName(action.admin);
                const displayText = action.motif || action.reason || action.content;
                const showUndo = onUndo && canUndo(action);
                
                // ✅ Formater le texte avec retours à la ligne
                const textLines = formatText(displayText);

                return (
                  <div
                    key={action.id}
                    className="group flex flex-col md:flex-row md:items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 shadow-sm bg-white dark:bg-gray-900"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full ${colors.bg} ${colors.darkBg} flex items-center justify-center`}
                      >
                        {getActionIcon(action.actionType)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-gray-900 dark:text-white">
                            {adminName}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.darkBg} ${colors.text} ${colors.darkText} font-medium`}
                          >
                            {getActionLabel(action.actionType, t)}
                            {action.duration && ` · ${action.duration}j`}
                            {action.level && ` · Niv.${action.level}`}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {formatDistanceToNow(new Date(action.createdAt), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                        </div>

                        {/* Utilisateur concerné */}
                        {!userId && action.user && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span className="font-medium">
                              {t("user.target")}:
                            </span>{" "}
                            {action.user.firstName} {action.user.lastName} ({action.user.email})
                          </div>
                        )}

                        {/* ✅ Motif ou contenu - avec retours à la ligne et sans HTML */}
                        {textLines.length > 0 && (
                          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-gray-700 dark:text-gray-300 font-medium mb-1">
                              {t("action.reason")}:
                            </p>
                            <div className="space-y-1">
                              {textLines.map((line, index) => {
                                // Ignorer les lignes vides
                                if (line.trim() === '') return null;
                                return (
                                  <p 
                                    key={index} 
                                    className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words pl-2 border-l-2 border-gray-300 dark:border-gray-600"
                                  >
                                    {line}
                                  </p>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Changement de statut */}
                        {getStatusBadge(action.previousStatus, action.newStatus)}
                      </div>
                    </div>

                    {/* Bouton Undo - Conditionnel (caché pour les actions déjà annulées) */}
                    {showUndo && (
                      <div className="mt-3 md:mt-0 md:ml-4 flex justify-end">
                        <button
                          onClick={() => handleUndo(action.id)}
                          disabled={undoingId === action.id}
                          className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={t("undo.title")}
                        >
                          {undoingId === action.id ? (
                            <>
                              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              <span>{t("undo.processing")}</span>
                            </>
                          ) : (
                            <>
                              <IoArrowUndoOutline className="w-3.5 h-3.5" />
                              <span>{t("undo.button")}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex flex-col items-center gap-4">
          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={itemsPerPage}
              onPageChange={handlePageChange}
            />
          )}

          {/* Bottom Close Button */}
          <button
            onClick={onClose}
            className="min-w-[120px] px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 shadow-sm"
          >
            {t("close")}
          </button>
        </div>
      </footer>
    </Modal>
  );
}