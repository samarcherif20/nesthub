import React from 'react';
import Badge from '@/components/ui/Badge';

interface UserVerificationBadgeProps {
  isVerified: boolean;
  status?: string;
  t: any;
}

export default function UserVerificationBadge({ isVerified, status, t }: UserVerificationBadgeProps) {
  if (isVerified) {
    return <Badge variant="success">{t('badges.verified')}</Badge>;
  }
  if (status === 'PENDING') {
    return <Badge variant="warning">{t('badges.pending')}</Badge>;
  }
  if (status === 'REJECTED') {
    return <Badge variant="danger">{t('badges.rejected')}</Badge>;
  }
  return <Badge variant="default">{t('badges.unverified')}</Badge>;
}