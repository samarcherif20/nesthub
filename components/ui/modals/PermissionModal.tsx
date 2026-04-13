// components/ui/modals/PermissionModal.tsx
"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { CheckCircle, XCircle, Shield } from "lucide-react";
import LoadingSpinner from "../LoadingSpinner";

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  currentPermissions: {
    canEdit: boolean;
    canManageBookings: boolean;
    canViewRevenue: boolean;
    canManageTeam: boolean;
  };
  onSave: (permissions: any) => Promise<void>;
  isLoading?: boolean;
}

export function PermissionModal({
  isOpen,
  onClose,
  memberName,
  currentPermissions,
  onSave,
  isLoading = false,
}: PermissionModalProps) {
  const [permissions, setPermissions] = useState(currentPermissions);

  const permissionOptions = [
    { key: "canEdit", label: "Modifier l'annonce", description: "Peut modifier les informations de l'annonce" },
    { key: "canManageBookings", label: "Gérer les réservations", description: "Peut confirmer/annuler les réservations" },
    { key: "canViewRevenue", label: "Voir les revenus", description: "Peut consulter les statistiques financières" },
    { key: "canManageTeam", label: "Gérer l'équipe", description: "Peut inviter/retirer des membres" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Permissions - ${memberName}`}>
      <div className="space-y-4 p-2">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
          <Shield size={16} className="text-indigo-500" />
          <span>Configurez les accès pour ce co-hôte</span>
        </div>

        {permissionOptions.map((opt) => (
          <div
            key={opt.key}
            className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">
                {opt.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {opt.description}
              </p>
            </div>
            <button
              onClick={() =>
                setPermissions((prev) => ({
                  ...prev,
                  [opt.key]: !prev[opt.key as keyof typeof prev],
                }))
              }
              className={`p-2 rounded-lg transition-all ${
                permissions[opt.key as keyof typeof permissions]
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
              }`}
            >
              {permissions[opt.key as keyof typeof permissions] ? (
                <CheckCircle size={18} />
              ) : (
                <XCircle size={18} />
              )}
            </button>
          </div>
        ))}

        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave(permissions)}
            disabled={isLoading}
            className="flex-1 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <LoadingSpinner  className="animate-spin" />
            ) : (
              <CheckCircle size={16} />
            )}
            Enregistrer
          </button>
        </div>
      </div>
    </Modal>
  );
}