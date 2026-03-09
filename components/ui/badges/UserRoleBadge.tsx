import React from 'react';
import Badge from '@/components/ui/Badge';
import { UserRole } from '@/lib/types/user';

interface UserRoleBadgeProps {
  role: UserRole;
  t: any;
}

export default function UserRoleBadge({ role, t }: UserRoleBadgeProps) {
  const roleMap = {
    ADMIN: { variant: 'primary' as const, key: 'admin' },
    PROPERTY_OWNER: { variant: 'info' as const, key: 'property_owner' },
    TENANT: { variant: 'success' as const, key: 'tenant' },
  };

  const config = roleMap[role];
  return <Badge variant={config.variant}>{t(`filters.role.${config.key}`)}</Badge>;
}