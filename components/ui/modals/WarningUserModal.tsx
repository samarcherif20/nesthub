// components/modals/WarningUserModal.tsx
"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import RichTextEditor from "@/components/ui/editor/RichTextEditor";
import { User } from "@/lib/types/user";
import { IoWarningOutline } from "react-icons/io5";
import { useTranslations } from "next-intl";
import NotificationCheckbox from "@/components/ui/NotificationCheckbox";

const pip = (url: string) =>
  `/api/admin/serve-image?url=${encodeURIComponent(url)}`;

interface WarningUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: (
    userId: string,
    reason: string,
    motif: string,
    notify: boolean,
  ) => Promise<void>;
}

export default function WarningUserModal({
  isOpen,
  onClose,
  user,
  onConfirm,
}: WarningUserModalProps) {
  const t = useTranslations("admin.usersManagement.warningModal");
  const [reason, setReason] = useState("");
  const [motif, setMotif] = useState("");
  const [notify, setNotify] = useState(false);
  const [loading, setLoading] = useState(false);

  const WARNING_REASONS = [
    {
      value: "INAPPROPRIATE_BEHAVIOR",
      label: t("reasons.inappropriateBehavior.label"),
      description: t("reasons.inappropriateBehavior.description"),
    },
    {
      value: "SPAM",
      label: t("reasons.spam.label"),
      description: t("reasons.spam.description"),
    },
    {
      value: "FALSE_INFORMATION",
      label: t("reasons.falseInformation.label"),
      description: t("reasons.falseInformation.description"),
    },
    {
      value: "PAYMENT_ISSUES",
      label: t("reasons.paymentIssues.label"),
      description: t("reasons.paymentIssues.description"),
    },
    {
      value: "MULTIPLE_ACCOUNTS",
      label: t("reasons.multipleAccounts.label"),
      description: t("reasons.multipleAccounts.description"),
    },
    {
      value: "OTHER",
      label: t("reasons.other.label"),
      description: t("reasons.other.description"),
    },
  ];

  const handleConfirm = async () => {
    if (!user || !reason) return;
    setLoading(true);
    try {
      await onConfirm(user.id, reason, motif, notify);
      onClose();
      // Reset
      setReason("");
      setMotif("");
      setNotify(false);
    } catch (error) {
      console.error(t("error"), error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={true}
      size="md"
      className="max-w-2xl"
      title={
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-13 h-13 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
            <IoWarningOutline className="text-4xl" />
          </div>
          <div className="flex flex-col">
            <span className="text-slate-900 dark:text-white text-lg font-bold leading-tight">
              {t("title")}
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-xs">
              {t("description")}
            </span>
          </div>
        </div>
      }
    >
      {/* Contenu - avec largeur légèrement élargie */}
      <div className="p-4 space-y-2">
        {/* Informations utilisateur - dimensions originales */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30">
          {user.profilePictureUrl ? (
            <img
              src={pip(user.profilePictureUrl)}
              alt={`${user.firstName} ${user.lastName}`}
              className="w-10 h-10 rounded-full object-cover border border-orange-200 dark:border-orange-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-sm">
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user.email}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("reliability")}
            </p>
            <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
              {user.reliabilityScore || 0}%
            </p>
          </div>
        </div>

        {/* Sélection de la raison - grille 2 colonnes originale */}
        <div className="space-y-2">
          <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">
            {t("reason")} <span className="text-red-500">*</span>
          </label>

          <div className="grid grid-cols-2 gap-2">
            {WARNING_REASONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setReason(option.value)}
                className={`w-full p-2 rounded-lg border text-left transition-all ${
                  reason === option.value
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-600"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-orange-300 dark:hover:border-orange-700"
                }`}
              >
                <p className="font-medium text-xs text-slate-900 dark:text-white">
                  {option.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Message personnalisé avec RichTextEditor - version plus petite */}
        {reason && (
          <div className="space-y-1.5">
            <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">
              {reason === "OTHER" ? t("specifyReason") : t("optionalMessage")}
            </label>

            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
              <RichTextEditor
                value={motif}
                onChange={setMotif}
                placeholder={
                  reason === "OTHER"
                    ? t("explainReason")
                    : t("additionalDetails")
                }
                compact={true}
              />
            </div>
          </div>
        )}

        {/* Notification et infos - sans espace supplémentaire */}
        <div>
          <NotificationCheckbox
            notify={notify}
            setNotify={setNotify}
            userEmail={user.email}
            label={t("notifyByEmail")}
            message="Un email sera envoyé à {email} pour lui notifier cet avertissement."
            colorScheme="orange"
          />

          {/* Historique des avertissements */}
          {user.escalationLevel && user.escalationLevel > 1 && (
            <div className="mt-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30">
              <p className="text-xs text-orange-700 dark:text-orange-400 flex items-start gap-1.5">
                <IoWarningOutline className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>
                  {t("previousWarnings", { count: user.escalationLevel - 1 })}
                </span>
              </p>
            </div>
          )}

          {/* Message d'information */}
          <div className="mt-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30">
            <p className="text-xs text-blue-700 dark:text-blue-400 flex items-start gap-1.5">
              <svg
                className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                Cet avertissement sera visible dans le dashboard de
                l'utilisateur.
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer - dimensions originales */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
        >
          {t("cancel")}
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading || !reason}
          className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 shadow-sm shadow-orange-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t("processing")}
            </>
          ) : (
            t("send")
          )}
        </button>
      </div>
    </Modal>
  );
}