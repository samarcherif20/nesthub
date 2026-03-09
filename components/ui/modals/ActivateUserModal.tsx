'use client';

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { User } from "@/lib/types/user";
import { RiUserFollowLine } from "react-icons/ri";
import { useTranslations } from "next-intl";

interface ActivateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: (userId: string) => Promise<void>;
}

export default function ActivateUserModal({
  isOpen,
  onClose,
  user,
  onConfirm,
}: ActivateUserModalProps) {

  const t = useTranslations("admin.usersManagement.activateModal");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!user) return;

    setLoading(true);

    try {
      await onConfirm(user.id);
      onClose();
    } catch (error) {
      console.error("Erreur réactivation :", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const statusMap: Record<string, string> = {
    TEMPORARILY_SUSPENDED: t("status.suspended"),
    PERMANENTLY_BANNED: t("status.banned"),
    SECURITY_LOCKED: t("status.locked"),
    INACTIVE: t("status.inactive"),
    REJECTED: t("status.rejected"),
  };

  const statusText = statusMap[user.status] ?? t("status.unknown");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={true}
      title={
        <div className="flex flex-col items-center w-full ml-18">
          {/* Icon au centre */}
          <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-3">
            <RiUserFollowLine className="text-emerald-600 text-4xl" />
          </div>
          
          {/* Titre */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {t("title")}
          </h2>
          
          {/* Statut */}
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {t("currentStatus", { status: statusText })}
          </p>
        </div>
      }
    >
      {/* BODY */}
      <div className="p-6 space-y-5">
        <p className="text-center text-gray-600 dark:text-gray-300">
          {t("description")}
        </p>

        {/* User Card */}
        <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
          {user?.profilePictureUrl ? (
            <img
              src={user.profilePictureUrl}
              alt="avatar"
              className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-sm"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
              <RiUserFollowLine className="text-gray-500 text-xl" />
            </div>
          )}

          <div className="ml-4 overflow-hidden">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {user?.firstName} {user?.lastName}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row-reverse gap-3">
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="inline-flex justify-center items-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors disabled:opacity-50"
        >
          {loading ? t("processing") : t("confirm")}
        </button>

        <button
          onClick={onClose}
          className="inline-flex justify-center items-center px-4 py-2.5 rounded-xl bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          {t("cancel")}
        </button>
      </div>
    </Modal>
  );
}