import React from "react";
//import Badge from "@/components/ui/Badge";
import { UserRole } from "@/lib/types/user";
import { useTranslations } from "next-intl";

interface UserRoleBadgeProps {
  role: UserRole;
}

export default function UserRoleBadge({ role }: UserRoleBadgeProps) {
  const t = useTranslations("admin.usersManagement");

  const roleConfig = {
    ADMIN: {
      bgColor: "bg-red-100 dark:bg-red-900/30",
      textColor: "text-red-700 dark:text-red-300",
      borderColor: "border-red-200 dark:border-red-800",
      key: "admin",
    },
    PROPERTY_OWNER: {
      bgColor: "bg-indigo-100 dark:bg-indigo-800/30",
      textColor: "text-indigo-600 dark:text-indigo-300",
      borderColor: "border-indigo-200 dark:border-indigo-800",
      key: "property_owner",
    },
    TENANT: {
      bgColor: "bg-purple-50 dark:bg-purple-900/30",
      textColor: "text-purple-800 dark:text-purple-300",
      borderColor: "border-purple-200 dark:border-purple-800",
      key: "tenant",
    },
  };

  const config = roleConfig[role];

  // Fallback
  if (!config) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        {role}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor}`}
    >
      <span>{t(`filters.role.${config.key}`)}</span>
    </span>
  );
}
