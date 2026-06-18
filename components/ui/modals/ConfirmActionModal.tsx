"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useTranslations } from "next-intl";
import {
  IoFlagOutline,
  IoFlag,
  IoCloseOutline,
  IoChatbubblesOutline,
  IoWarningOutline,
  IoTrashOutline,
  IoEyeOffOutline,
  IoEyeOutline,
} from "react-icons/io5";

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action:
    | "FLAG"
    | "UNFLAG"
    | "CLOSE"
    | "REOPEN"
    | "BULK_FLAG"
    | "BULK_CLOSE"
    | "DELETE_REVIEW"
    | "HIDE_REVIEW"
    | "SHOW_REVIEW"
    | null;
  conversationId?: string;
  conversationIds?: string[];
  conversationTitle?: string;
  onConfirm: () => Promise<void>;
  loading?: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "success";
}

export default function ConfirmActionModal({
  isOpen,
  onClose,
  action,
  conversationIds,
  conversationTitle,
  onConfirm,
  loading = false,
  title: customTitle,
  message: customMessage,
  confirmText: customConfirmText,
  cancelText = "Annuler",
  variant,
}: ConfirmActionModalProps) {
  const t = useTranslations("Moderation");
  const [confirmWord, setConfirmWord] = useState("");

  // Reset quand le modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setConfirmWord("");
    }
  }, [isOpen]);

  const getModalConfig = () => {
    // Actions pour les reviews
    if (action === "DELETE_REVIEW") {
      return {
        icon: <IoTrashOutline className="text-xl" />,
        iconBg:
          variant === "danger"
            ? "bg-red-100 dark:bg-red-900/30"
            : "bg-red-100 dark:bg-red-900/30",
        iconColor: "text-red-600 dark:text-red-400",
        title: customTitle || t("confirm.deleteReviewTitle"),
        description: customMessage || t("confirm.deleteReviewDescription"),
        confirmText: customConfirmText || t("confirm.deleteReviewConfirm"),
        buttonColor: "bg-red-600 hover:bg-red-700",
        confirmWord:
          customConfirmText?.toUpperCase() ||
          t("confirm.deleteReviewConfirm").toUpperCase(),
      };
    }
    if (action === "HIDE_REVIEW") {
      return {
        icon: <IoEyeOffOutline className="text-xl" />,
        iconBg:
          variant === "warning"
            ? "bg-amber-100 dark:bg-amber-900/30"
            : "bg-amber-100 dark:bg-amber-900/30",
        iconColor: "text-amber-600 dark:text-amber-400",
        title: customTitle || t("confirm.hideReviewTitle"),
        description: customMessage || t("confirm.hideReviewDescription"),
        confirmText: customConfirmText || t("confirm.hideReviewConfirm"),
        buttonColor: "bg-amber-600 hover:bg-amber-700",
        confirmWord:
          customConfirmText?.toUpperCase() ||
          t("confirm.hideReviewConfirm").toUpperCase(),
      };
    }
    if (action === "SHOW_REVIEW") {
      return {
        icon: <IoEyeOutline className="text-xl" />,
        iconBg:
          variant === "success"
            ? "bg-emerald-100 dark:bg-emerald-900/30"
            : "bg-emerald-100 dark:bg-emerald-900/30",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        title: customTitle || t("confirm.showReviewTitle"),
        description: customMessage || t("confirm.showReviewDescription"),
        confirmText: customConfirmText || t("confirm.showReviewConfirm"),
        buttonColor: "bg-emerald-600 hover:bg-emerald-700",
        confirmWord:
          customConfirmText?.toUpperCase() ||
          t("confirm.showReviewConfirm").toUpperCase(),
      };
    }

    // Actions originales pour les conversations
    switch (action) {
      case "FLAG":
        return {
          icon: <IoFlagOutline className="text-xl" />,
          iconBg: "bg-orange-100 dark:bg-orange-900/30",
          iconColor: "text-orange-600 dark:text-orange-400",
          title: t("confirm.flagTitle"),
          description: t("confirm.flagDescription"),
          confirmText: t("confirm.flagConfirm"),
          buttonColor: "bg-orange-600 hover:bg-orange-700",
          confirmWord: t("confirm.flagConfirm").toUpperCase(),
        };
      case "UNFLAG":
        return {
          icon: <IoFlag className="text-xl" />,
          iconBg: "bg-green-100 dark:bg-green-900/30",
          iconColor: "text-green-600 dark:text-green-400",
          title: t("confirm.unflagTitle"),
          description: t("confirm.unflagDescription"),
          confirmText: t("confirm.unflagConfirm"),
          buttonColor: "bg-green-600 hover:bg-green-700",
          confirmWord: t("confirm.unflagConfirm").toUpperCase(),
        };
      case "CLOSE":
        return {
          icon: <IoCloseOutline className="text-xl" />,
          iconBg: "bg-red-100 dark:bg-red-900/30",
          iconColor: "text-red-600 dark:text-red-400",
          title: t("confirm.closeTitle"),
          description: t("confirm.closeDescription"),
          confirmText: t("confirm.closeConfirm"),
          buttonColor: "bg-red-600 hover:bg-red-700",
          confirmWord: t("confirm.closeConfirm").toUpperCase(),
        };
      case "REOPEN":
        return {
          icon: <IoChatbubblesOutline className="text-xl" />,
          iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
          iconColor: "text-emerald-600 dark:text-emerald-400",
          title: t("confirm.reopenTitle"),
          description: t("confirm.reopenDescription"),
          confirmText: t("confirm.reopenConfirm"),
          buttonColor: "bg-emerald-600 hover:bg-emerald-700",
          confirmWord: t("confirm.reopenConfirm").toUpperCase(),
        };
      case "BULK_FLAG":
        return {
          icon: <IoFlagOutline className="text-xl" />,
          iconBg: "bg-orange-100 dark:bg-orange-900/30",
          iconColor: "text-orange-600 dark:text-orange-400",
          title: t("confirm.bulkFlagTitle", {
            count: conversationIds?.length || 0,
          }),
          description: t("confirm.bulkFlagDescription", {
            count: conversationIds?.length || 0,
          }),
          confirmText: t("confirm.flagConfirm"),
          buttonColor: "bg-orange-600 hover:bg-orange-700",
          confirmWord: t("confirm.flagConfirm").toUpperCase(),
        };
      case "BULK_CLOSE":
        return {
          icon: <IoCloseOutline className="text-xl" />,
          iconBg: "bg-red-100 dark:bg-red-900/30",
          iconColor: "text-red-600 dark:text-red-400",
          title: t("confirm.bulkCloseTitle", {
            count: conversationIds?.length || 0,
          }),
          description: t("confirm.bulkCloseDescription", {
            count: conversationIds?.length || 0,
          }),
          confirmText: t("confirm.closeConfirm"),
          buttonColor: "bg-red-600 hover:bg-red-700",
          confirmWord: t("confirm.closeConfirm").toUpperCase(),
        };
      default:
        return {
          icon: <IoWarningOutline className="text-xl" />,
          iconBg: "bg-slate-100 dark:bg-slate-800",
          iconColor: "text-slate-600 dark:text-slate-400",
          title: customTitle || t("confirm.defaultTitle"),
          description: customMessage || t("confirm.defaultDescription"),
          confirmText: customConfirmText || t("confirm.defaultConfirm"),
          buttonColor: "bg-indigo-600 hover:bg-indigo-700",
          confirmWord:
            customConfirmText?.toUpperCase() ||
            t("confirm.defaultConfirm").toUpperCase(),
        };
    }
  };

  const config = getModalConfig();
  const isBulk = action === "BULK_FLAG" || action === "BULK_CLOSE";
  const isReviewAction =
    action === "DELETE_REVIEW" ||
    action === "HIDE_REVIEW" ||
    action === "SHOW_REVIEW";
  const needsConfirmationWord = !isBulk && !isReviewAction;
  const isValid = !needsConfirmationWord || confirmWord === config.confirmWord;

  if (!action) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={true}
      className="max-w-md"
      title={
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full ${config.iconBg} ${config.iconColor}`}
          >
            {config.icon}
          </div>
          <div className="flex flex-col">
            <h2 className="text-slate-900 dark:text-white text-sm font-bold leading-tight">
              {config.title}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              {t("confirm.modalDescription")}
            </p>
          </div>
        </div>
      }
    >
      <div className="p-4 space-y-4">
        {/* Description */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {config.description}
          </p>
          {conversationTitle && !isBulk && (
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-2 truncate">
              {conversationTitle}
            </p>
          )}
          {isBulk && conversationIds && conversationIds.length > 0 && (
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-2">
              {conversationIds.length} {t("confirm.conversationsCount")}
            </p>
          )}
        </div>

        {/* Security Confirmation Input (only for single actions that are not review actions) */}
        {needsConfirmationWord && (
          <div className="p-3 border border-orange-200 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
            <label className="block text-[10px] font-medium text-orange-800 dark:text-orange-300 mb-1">
              {t("confirm.confirmLabel")}{" "}
              <span className="font-bold underline">{config.confirmWord}</span>
            </label>
            <input
              type="text"
              value={confirmWord}
              onChange={(e) => setConfirmWord(e.target.value.toUpperCase())}
              className="w-full px-2 py-1.5 text-xs rounded-lg border border-orange-200 dark:border-orange-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500 uppercase font-bold text-center tracking-widest"
              placeholder={config.confirmWord}
            />
          </div>
        )}

        {/* Warning for bulk actions */}
        {isBulk && (
          <div className="p-3 border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
            <p className="text-[10px] text-amber-800 dark:text-amber-300">
              {t("confirm.bulkWarning")}
            </p>
          </div>
        )}
      </div>

      {/* Modal Footer */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          type="button"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading || !isValid}
          className={`px-3 py-1.5 rounded-lg text-white text-xs font-medium shadow-sm transition-all disabled:opacity-50 flex items-center gap-1 ${config.buttonColor}`}
          type="button"
        >
          {loading ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t("confirm.processing")}
            </>
          ) : (
            config.confirmText
          )}
        </button>
      </div>
    </Modal>
  );
}
