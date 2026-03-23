import React from "react";
import { useTranslations } from "next-intl";

interface UserStatusBadgeProps {
  status: string;
  suspendedUntil?: string | null;
}

export default function UserStatusBadge({
  status,
  suspendedUntil,
}: UserStatusBadgeProps) {
  const t = useTranslations("admin.usersManagement");

  // Configuration pour chaque statut
  const statusConfig: Record<
    string,
    {
      dotColor: string;
      textColor: string;
      darkTextColor: string;
      label: string;
    }
  > = {
    ACTIVE: {
      dotColor: "bg-emerald-600",
      textColor: "text-emerald-700",
      darkTextColor: "dark:text-emerald-500",
      label: t("filters.status.active"),
    },
    TEMPORARILY_SUSPENDED: {
      dotColor: "bg-violet-600",
      textColor: "text-violet-700",
      darkTextColor: "dark:text-violet-500",
      label: t("filters.status.suspended"),
    },
    PERMANENTLY_BANNED: {
      dotColor: "bg-red-600",
      textColor: "text-red-700",
      darkTextColor: "dark:text-red-500",
      label: t("filters.status.banned"),
    },
    PENDING_VALIDATION: {
      dotColor: "bg-amber-500",
      textColor: "text-amber-500",
      darkTextColor: "dark:text-amber-400",
      label: t("filters.status.pending"),
    },
    SECURITY_LOCKED: {
      dotColor: "bg-orange-600",
      textColor: "text-orange-700",
      darkTextColor: "dark:text-orange-500",
      label: "Bloqué (sécurité)",
    },
    MANUALLY_BLOCKED: {
      dotColor: "bg-red-800",
      textColor: "text-red-900",
      darkTextColor: "dark:text-red-400",
      label: "Bloqué (admin)",
    },
    REJECTED: {
      dotColor: "bg-slate-600",
      textColor: "text-slate-700",
      darkTextColor: "dark:text-slate-400",
      label: t("filters.status.rejected"),
    },
    INACTIVE: {
      dotColor: "bg-gray-400",
      textColor: "text-gray-500",
      darkTextColor: "dark:text-gray-300",
      label: "Inactif",
    },
    // Ajout du statut LOCKED pour compatibilité
    LOCKED: {
      dotColor: "bg-orange-600",
      textColor: "text-orange-700",
      darkTextColor: "dark:text-orange-500",
      label: "Bloqué",
    },
  };

  // Fallback pour les statuts inconnus
  const config = statusConfig[status] || {
    dotColor: "bg-stone-600",
    textColor: "text-stone-700",
    darkTextColor: "dark:text-stone-500",
    label: status,
  };

  // Formater la date de suspension
  const formatSuspendedUntil = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-2">
        {/* Point coloré */}
        <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />

        {/* Texte du statut avec couleur */}
        <span
          className={`text-xs font-medium ${config.textColor} ${config.darkTextColor}`}
        >
          {config.label}
        </span>
      </div>

      {suspendedUntil && status === "TEMPORARILY_SUSPENDED" && (
        <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-4">
          Jusqu'au {formatSuspendedUntil(suspendedUntil)}
        </span>
      )}

      {status === "SECURITY_LOCKED" && (
        <span className="text-[10px] text-orange-500 dark:text-orange-400 ml-4">
          Déblocage auto après 24h
        </span>
      )}
    </div>
  );
}