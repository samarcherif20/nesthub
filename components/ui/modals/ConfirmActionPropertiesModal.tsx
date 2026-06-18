// components/ui/modals/ConfirmActionModal.tsx
"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useTranslations } from "next-intl";
import {
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoArchiveOutline,
  IoEyeOffOutline,
  IoTrashOutline,
  IoWarningOutline,
  IoCheckmarkDoneCircleOutline,
} from "react-icons/io5";

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action:
    | "ACTIVATE"
    | "DEACTIVATE"
    | "ARCHIVE"
    | "VALIDATE"
    | "REJECT"
    | "DELETE"
    | "BULK_ACTIVATE"
    | "BULK_DEACTIVATE"
    | "BULK_ARCHIVE"
    | null;
  itemId?: string;
  itemIds?: string[];
  itemTitle?: string;
  onConfirm: () => Promise<void>;
  loading?: boolean;
  namespace?: string;
}

export default function ConfirmActionModal({
  isOpen,
  onClose,
  action,
  itemIds,
  itemTitle,
  onConfirm,
  loading = false,
  namespace = "AdminProperties",
}: ConfirmActionModalProps) {
  const t = useTranslations(namespace);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setConfirmText("");
    }
  }, [isOpen]);

  const getModalConfig = () => {
    switch (action) {
      case "ACTIVATE":
        return {
          icon: <IoCheckmarkCircleOutline className="text-xl" />,
          iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
          iconColor: "text-emerald-600 dark:text-emerald-400",
          title: t("activerConfirmTitle"),
          description: t("activerConfirmMessage"),
          confirmText: t("confirm"),
          buttonColor: "bg-emerald-600 hover:bg-emerald-700",
          confirmWord: t("confirmWord.activate").toUpperCase(),
        };
      case "DEACTIVATE":
        return {
          icon: <IoEyeOffOutline className="text-xl" />,
          iconBg: "bg-amber-100 dark:bg-amber-900/30",
          iconColor: "text-amber-600 dark:text-amber-400",
          title: t("desactiverConfirmTitle"),
          description: t("desactiverConfirmMessage"),
          confirmText: t("confirm"),
          buttonColor: "bg-amber-600 hover:bg-amber-700",
          confirmWord: t("confirmWord.deactivate").toUpperCase(),
        };
      case "ARCHIVE":
        return {
          icon: <IoArchiveOutline className="text-xl" />,
          iconBg: "bg-purple-100 dark:bg-purple-900/30",
          iconColor: "text-purple-600 dark:text-purple-400",
          title: t("archiverConfirmTitle"),
          description: t("archiverConfirmMessage"),
          confirmText: t("confirm"),
          buttonColor: "bg-purple-600 hover:bg-purple-700",
          confirmWord: t("confirmWord.archive").toUpperCase(),
        };
      case "VALIDATE":
        return {
          icon: <IoCheckmarkDoneCircleOutline className="text-xl" />,
          iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
          iconColor: "text-emerald-600 dark:text-emerald-400",
          title: t("validerConfirmTitle"),
          description: t("validerConfirmMessage"),
          confirmText: t("confirm"),
          buttonColor: "bg-emerald-600 hover:bg-emerald-700",
          confirmWord: t("confirmWord.validate").toUpperCase(),
        };
      case "REJECT":
        return {
          icon: <IoCloseOutline className="text-xl" />,
          iconBg: "bg-red-100 dark:bg-red-900/30",
          iconColor: "text-red-600 dark:text-red-400",
          title: t("rejeterConfirmTitle"),
          description: t("rejeterConfirmMessage"),
          confirmText: t("confirm"),
          buttonColor: "bg-red-600 hover:bg-red-700",
          confirmWord: t("confirmWord.reject").toUpperCase(),
        };
      case "DELETE":
        return {
          icon: <IoTrashOutline className="text-xl" />,
          iconBg: "bg-red-100 dark:bg-red-900/30",
          iconColor: "text-red-600 dark:text-red-400",
          title: t("supprimerConfirmTitle"),
          description: t("supprimerConfirmMessage"),
          confirmText: t("confirm"),
          buttonColor: "bg-red-600 hover:bg-red-700",
          confirmWord: t("confirmWord.delete").toUpperCase(),
          isDanger: true,
        };
      case "BULK_ACTIVATE":
        return {
          icon: <IoCheckmarkCircleOutline className="text-xl" />,
          iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
          iconColor: "text-emerald-600 dark:text-emerald-400",
          title: t("activerConfirmTitle"),
          description: t("activerBatchConfirmMessage", {
            count: itemIds?.length || 0,
          }),
          confirmText: t("confirm"),
          buttonColor: "bg-emerald-600 hover:bg-emerald-700",
          confirmWord: t("confirmWord.activate").toUpperCase(),
        };
      case "BULK_DEACTIVATE":
        return {
          icon: <IoEyeOffOutline className="text-xl" />,
          iconBg: "bg-amber-100 dark:bg-amber-900/30",
          iconColor: "text-amber-600 dark:text-amber-400",
          title: t("desactiverConfirmTitle"),
          description: t("desactiverBatchConfirmMessage", {
            count: itemIds?.length || 0,
          }),
          confirmText: t("confirm"),
          buttonColor: "bg-amber-600 hover:bg-amber-700",
          confirmWord: t("confirmWord.deactivate").toUpperCase(),
        };
      case "BULK_ARCHIVE":
        return {
          icon: <IoArchiveOutline className="text-xl" />,
          iconBg: "bg-purple-100 dark:bg-purple-900/30",
          iconColor: "text-purple-600 dark:text-purple-400",
          title: t("archiverConfirmTitle"),
          description: t("archiverBatchConfirmMessage", {
            count: itemIds?.length || 0,
          }),
          confirmText: t("confirm"),
          buttonColor: "bg-purple-600 hover:bg-purple-700",
          confirmWord: t("confirmWord.archive").toUpperCase(),
        };
      default:
        return {
          icon: <IoWarningOutline className="text-xl" />,
          iconBg: "bg-slate-100 dark:bg-slate-800",
          iconColor: "text-slate-600 dark:text-slate-400",
          title: t("confirm"),
          description: t("confirm"),
          confirmText: t("confirm"),
          buttonColor: "bg-indigo-600 hover:bg-indigo-700",
          confirmWord: t("confirmWord.default").toUpperCase(),
        };
    }
  };

  const config = getModalConfig();
  const isBulk = action?.startsWith("BULK_") ?? false;
  const needsConfirmationWord =
    !isBulk && (action === "DELETE" || action === "ARCHIVE");
  const isValid = !needsConfirmationWord || confirmText === config.confirmWord;

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
              {t("confirmModalDescription")}
            </p>
          </div>
        </div>
      }
    >
      <div className="p-4 space-y-4">
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {config.description}
          </p>
          {itemTitle && !isBulk && (
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-2 truncate">
              {itemTitle}
            </p>
          )}
          {isBulk && itemIds && itemIds.length > 0 && (
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-2">
              {t("itemsCount", { count: itemIds.length })}
            </p>
          )}
        </div>

        {needsConfirmationWord && (
          <div className="p-3 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-lg">
            <label className="block text-[10px] font-medium text-red-800 dark:text-red-300 mb-1">
              {t("confirmLabel")}{" "}
              <span className="font-bold underline">{config.confirmWord}</span>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              className="w-full px-2 py-1.5 text-xs rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-red-500 focus:border-red-500 uppercase font-bold text-center tracking-widest"
              placeholder={config.confirmWord}
            />
          </div>
        )}

        {isBulk && (
          <div className="p-3 border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
            <p className="text-[10px] text-amber-800 dark:text-amber-300">
              {t("bulkWarning")}
            </p>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          type="button"
        >
          {t("cancel")}
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
              {t("processing")}
            </>
          ) : (
            config.confirmText
          )}
        </button>
      </div>
    </Modal>
  );
}
