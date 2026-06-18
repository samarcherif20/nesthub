// components/ui/modals/DisputeActionModal.tsx
'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useTranslations } from 'next-intl';
import { 
  IoCheckmarkCircleOutline, 
  IoCloseCircleOutline,
  IoWarningOutline,
  IoChatbubbleOutline,
} from 'react-icons/io5';

interface DisputeActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: "RESOLVE" | "REJECT" | null;
  disputeId?: string;
  disputeTitle?: string;
  onConfirm: () => Promise<void>;
  loading?: boolean;
}

export default function DisputeActionModal({ 
  isOpen, 
  onClose, 
  action, 
  disputeTitle,
  onConfirm,
  loading = false
}: DisputeActionModalProps) {
  const t = useTranslations('Disputes');
  const [resolutionNote, setResolutionNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setResolutionNote("");
      setShowNoteInput(false);
    }
  }, [isOpen]);

  const getModalConfig = () => {
    if (action === "RESOLVE") {
      return {
        icon: <IoCheckmarkCircleOutline className="text-xl" />,
        iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        title: t("confirmResolveTitle"),
        description: t("confirmResolveDescription"),
        confirmText: t("confirmResolve"),
        buttonColor: "bg-emerald-600 hover:bg-emerald-700",
        placeholder: t("resolutionPlaceholder"),
      };
    } else if (action === "REJECT") {
      return {
        icon: <IoCloseCircleOutline className="text-xl" />,
        iconBg: "bg-red-100 dark:bg-red-900/30",
        iconColor: "text-red-600 dark:text-red-400",
        title: t("confirmRejectTitle"),
        description: t("confirmRejectDescription"),
        confirmText: t("confirmReject"),
        buttonColor: "bg-red-600 hover:bg-red-700",
        placeholder: t("rejectionPlaceholder"),
      };
    }
    return {
      icon: <IoChatbubbleOutline className="text-xl" />,
      iconBg: "bg-slate-100 dark:bg-slate-800",
      iconColor: "text-slate-600 dark:text-slate-400",
      title: t("confirmTitle"),
      description: t("confirmDescription"),
      confirmText: t("confirm"),
      buttonColor: "bg-indigo-600 hover:bg-indigo-700",
      placeholder: t("notePlaceholder"),
    };
  };

  const config = getModalConfig();

  const handleConfirm = () => {
    onConfirm();
  };

  const toggleNoteInput = () => {
    setShowNoteInput(!showNoteInput);
  };

  if (!action) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={true}
      className="max-w-md"
      title={
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${config.iconBg} ${config.iconColor}`}>
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
          {disputeTitle && (
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-2 truncate">
              {disputeTitle}
            </p>
          )}
        </div>

        {/* Option d'ajouter une note explicative */}
        <div>
          <button
            onClick={toggleNoteInput}
            className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
          >
{showNoteInput ? t("hideNote") : t("addNote")}          </button>
        </div>

        {showNoteInput && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              {action === "RESOLVE" ? t("resolutionNoteLabel") : t("rejectionNoteLabel")}
            </label>
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder={config.placeholder}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all resize-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              {action === "RESOLVE" ? t("resolutionNoteHint") : t("rejectionNoteHint")}
            </p>
          </div>
        )}

        {/* Avertissement pour la résolution */}
        {action === "RESOLVE" && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex items-start gap-2">
            <IoCheckmarkCircleOutline className="text-emerald-600 dark:text-emerald-400 text-sm flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
              {t("resolveWarning")}
            </p>
          </div>
        )}

        {/* Avertissement pour le rejet */}
        {action === "REJECT" && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 flex items-start gap-2">
            <IoWarningOutline className="text-red-600 dark:text-red-400 text-sm flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-red-700 dark:text-red-400">
              {t("rejectWarning")}
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
          onClick={handleConfirm}
          disabled={loading}
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