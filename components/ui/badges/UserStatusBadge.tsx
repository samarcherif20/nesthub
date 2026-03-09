import React from 'react';
import Badge from '@/components/ui/Badge'; // adaptez le chemin si nécessaire
import { UserStatus } from '@/lib/types/user';

interface UserStatusBadgeProps {
  status: UserStatus;
  t: any; // fonction de traduction
  suspendedUntil?: string | null;
}

export default function UserStatusBadge({ status, t, suspendedUntil }: UserStatusBadgeProps) {
  const getVariant = () => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'TEMPORARILY_SUSPENDED':
        return 'warning';
      case 'PERMANENTLY_BANNED':
        return 'danger';
      case 'PENDING_VALIDATION':
        return 'warning';
      case 'REJECTED':
        return 'danger';
      case 'LOCKED':
        return 'default';
      case 'INACTIVE':
        return 'default';
      default:
        return 'default';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'ACTIVE':
        return t('filters.status.active');
      case 'TEMPORARILY_SUSPENDED':
        return t('filters.status.suspended');
      case 'PERMANENTLY_BANNED':
        return t('filters.status.banned');
      case 'PENDING_VALIDATION':
        return t('filters.status.pending');
      case 'REJECTED':
        return t('filters.status.rejected');
      case 'LOCKED':
        return 'Bloqué';
      case 'INACTIVE':
        return 'Inactif';
      default:
        return status;
    }
  };

  return (
    <div className="flex flex-col items-start">
      <Badge variant={getVariant()}>{getLabel()}</Badge>
      {suspendedUntil && (
        <span className="text-xs text-slate-500 mt-1">
          Jusqu'au {new Date(suspendedUntil).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}