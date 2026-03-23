import React from 'react';
import { 
  GoShieldCheck, 
  GoShieldSlash, 
  GoClock,
  GoXCircle 
} from 'react-icons/go';

interface UserVerificationBadgeProps {
  isVerified?: boolean;
  status?: 'PENDING' | 'VALIDATED' | 'REJECTED' | null;
  className?: string;
}

const verificationConfig = {
  VALIDATED: {
    label: 'Vérifié',
    icon: GoShieldCheck,
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
  },
  PENDING: {
    label: 'En attente',
    icon: GoClock,
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    iconClass: 'text-amber-600 dark:text-amber-400',
  },
  REJECTED: {
    label: 'Rejeté',
    icon: GoXCircle,
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    iconClass: 'text-red-600 dark:text-red-400',
  },
  NON_VERIFIE: {
    label: 'Non vérifié',
    icon: GoShieldSlash,
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    iconClass: 'text-slate-500 dark:text-slate-500',
  },
};

export default function UserVerificationBadge({ 
  isVerified,
  status,
  className = '' 
}: UserVerificationBadgeProps) {
  // Déterminer le statut à afficher
  let displayStatus: keyof typeof verificationConfig = 'NON_VERIFIE';
  
  if (isVerified) {
    displayStatus = 'VALIDATED';
  } else if (status === 'PENDING') {
    displayStatus = 'PENDING';
  } else if (status === 'REJECTED') {
    displayStatus = 'REJECTED';
  }

  const config = verificationConfig[displayStatus];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className} ${className}`}>
      <Icon className={`w-3.5 h-3.5 ${config.iconClass}`} />
      {config.label}
    </span>
  );
}