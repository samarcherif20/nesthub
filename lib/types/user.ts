// lib/types/user.ts

export type UserStatus = 
  | 'ACTIVE' 
  | 'TEMPORARILY_SUSPENDED' 
  | 'PERMANENTLY_BANNED' 
  | 'PENDING_VALIDATION' 
  | 'REJECTED' 
  | 'INACTIVE'
  | 'LOCKED';

export type UserRole = 'ADMIN' | 'PROPERTY_OWNER' | 'TENANT';
export type EscalationLevel = 0 | 1 | 2 | 3;

export type ActionType = 
  | 'SUSPEND' 
  | 'BAN' 
  | 'ACTIVATE' 
  | 'UNLOCK' 
  | 'LOCK' 
  | 'WARNING' 
  | 'ESCALATE' 
  | 'NOTE'
  | 'REJECT_VERIFICATION' 
  | 'VALIDATE_VERIFICATION';

export interface User {
  id: string;
  clerkId: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  profilePictureUrl: string | null;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isIdentityVerified: boolean;
  cinNumber: string | null;
  reliabilityScore: number;
  fraudScore: number;
  createdAt: string;
  lastLogin: string | null;
  suspendedUntil?: string | null;
  loginAttempts?: number;
  escalationLevel?: EscalationLevel;
  verificationRequests?: VerificationRequest[];
}

export interface VerificationRequest {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  // Ajoutez d'autres champs si nécessaire (date, documents...)
}

export interface AdminNote {
  id: string;
  userId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface UserActionLog {
  id: string;
  userId: string;
  actionType: ActionType;
  level?: EscalationLevel;
  reason?: string;
  motif?: string;
  duration?: number;
  content?: string;
  previousStatus?: UserStatus;
  newStatus?: UserStatus;
  createdAt: string;
  performedBy: string;
}

// --- Statistiques pour le tableau de bord admin ---
export interface StatsData {
  totalUsers: number;
  newUsers30d: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  bannedUsers: number;
  lockedUsers: number;
  verifiedIdentity: number;   // pourcentage ou nombre ?
  pendingApprovals: number;
  averageReliability: number;
}

// --- Pagination ---
export interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

// --- Filtres pour la recherche d'utilisateurs ---
export interface UserFilters {
  search: string;
  role: string;               // 'ALL' ou un rôle spécifique
  status: string;              // 'ALL' ou un statut spécifique
  verificationStatus: string;  // 'ALL', 'VERIFIED', 'PENDING', 'REJECTED'
  dateFrom: string;
  dateTo: string;
  minReliability: string;
  maxFraud: string;
}