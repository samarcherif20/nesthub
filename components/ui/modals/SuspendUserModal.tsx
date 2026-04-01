// components/modals/SuspendUserModal.tsx
"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import RichTextEditor from "@/components/ui/editor/RichTextEditor";
import { User } from "@/lib/types/user";
import { useTranslations } from "next-intl";
import NotificationCheckbox from "@/components/ui/NotificationCheckbox";
import { IoPauseCircleOutline } from "react-icons/io5";

const pip = (url: string) =>
  `/api/admin/serve-image?url=${encodeURIComponent(url)}`;

interface SuspendUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: (
    userId: string,
    duration: number,
    reason: string,
    motif: string,
    notify: boolean,
  ) => Promise<void>;
}

export default function SuspendUserModal({
  isOpen,
  onClose,
  user,
  onConfirm,
}: SuspendUserModalProps) {
  const t = useTranslations("admin.usersManagement.suspendModal");
  const [duration, setDuration] = useState(7);
  const [reason, setReason] = useState("");
  const [motif, setMotif] = useState("");
  const [notify, setNotify] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset quand le modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setDuration(7);
      setReason("");
      setMotif("");
      setNotify(false);
      setLoading(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!user || !reason) return;
    setLoading(true);
    try {
      await onConfirm(user.id, duration, reason, motif, notify);
      onClose();
    } catch (error) {
      console.error("Erreur suspension:", error);
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
      className="max-w-2xl"
      title={
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
            <IoPauseCircleOutline className="text-xl" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-slate-900 dark:text-white text-sm font-bold leading-tight">
              {t("title")}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              {t("description")}
            </p>
          </div>
        </div>
      }
    >
      <div className="p-4 space-y-2">
        {/* User Identity Header - compact */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700">
          {user.profilePictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pip(user.profilePictureUrl)}
              alt={`${user.firstName} ${user.lastName}`}
              className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xs">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-xs text-slate-900 dark:text-white truncate">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {user.email}
            </p>
          </div>
          <span className="text-[8px] font-medium px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded uppercase tracking-wider whitespace-nowrap">
            NESTHUB
          </span>
        </div>

        {/* Duration Selection */}
        <div className="space-y-1">
          <label className="block text-slate-700 dark:text-slate-300 text-[10px] font-semibold uppercase tracking-wider">
            {t("duration")}
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[1, 7, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`p-1.5 rounded-lg border text-center transition-all ${
                  duration === d
                    ? "border-2 border-orange-500 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-600"
                    : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-orange-300 dark:hover:border-orange-700"
                }`}
              >
                <span className={`text-[10px] font-semibold ${
                  duration === d
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-slate-900 dark:text-white"
                }`}>
                  {d === 1
                    ? t("day", { count: 1 })
                    : d === 7
                      ? t("days", { count: 7 })
                      : t("days", { count: 30 })}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Reason Dropdown */}
        <div className="space-y-1">
          <label className="block text-slate-700 dark:text-slate-300 text-[10px] font-semibold uppercase tracking-wider">
            {t("reason")} <span className="text-red-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors"
          >
            <option value="">{t("selectReason")}</option>
            <option value="spam">{t("reasons.spam")}</option>
            <option value="tos">{t("reasons.tos")}</option>
            <option value="safety">{t("reasons.safety")}</option>
            <option value="other">{t("reasons.other")}</option>
          </select>
        </div>

        {/* Detailed Motif Editor avec RichTextEditor */}
        {reason && (
          <div className="space-y-1">
            <label className="block text-slate-700 dark:text-slate-300 text-[10px] font-semibold uppercase tracking-wider">
              {t("details")}
            </label>
            
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
              <RichTextEditor
                value={motif}
                onChange={setMotif}
                placeholder={t("detailsPlaceholder")}
                compact={true}
              />
            </div>
          </div>
        )}

        {/* Notification Checkbox */}
        <div className="pt-1">
          <NotificationCheckbox
            notify={notify}
            setNotify={setNotify}
            userEmail={user.email}
            label={t("notify")}
            message="Un email sera envoyé à {email} pour le notifier de cette suspension."
            colorScheme="orange"
          />
        </div>
      </div>

      {/* Modal Footer */}
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
          disabled={loading || !reason}
          className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-medium hover:bg-orange-700 shadow-sm transition-all disabled:opacity-50 flex items-center gap-1"
          type="button"
        >
          {loading ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t("processing")}
            </>
          ) : (
            t("confirm")
          )}
        </button>
      </div>
    </Modal>
  );
}