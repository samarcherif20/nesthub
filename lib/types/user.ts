// lib/types/user.ts

// ===== STATUS =====
// Aligné avec Prisma + LOCKED pour les blocages auto
export type UserStatus = 
  | 'ACTIVE' 
  | 'TEMPORARILY_SUSPENDED'    // Suspension temporaire (admin)
  | 'PERMANENTLY_BANNED'        // Bannissement définitif
  | 'PENDING_VALIDATION'        // En attente de validation email
  | 'SECURITY_LOCKED'           // ← AJOUTER : blocage auto (trop de tentatives)
  | 'MANUALLY_BLOCKED'          // ← AJOUTER : blocage manuel non punitif
  | 'REJECTED'                   // Compte rejeté
  | 'INACTIVE';                  // Inactif (pas de connexion depuis X jours)

// ===== ROLES =====
export type UserRole = 'ADMIN' | 'PROPERTY_OWNER' | 'TENANT';

// ===== ESCALATION =====
// 0: Aucun, 1: Avertissement, 2: Suspension 1j, 3: Suspension 7-30j, 4: Ban
export type EscalationLevel = 0 | 1 | 2 | 3 | 4;  // ← AJOUTER 4

// ===== VÉRIFICATION =====
export type VerificationStatus = 'PENDING' | 'VALIDATED' | 'REJECTED'; // ← ALIGNER avec Prisma

// ===== ACTIONS ADMIN =====
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

// ===== USER INTERFACE =====
export interface User {
  id: string;
  clerkId: string | null;           // ← NULL possible
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  profilePictureUrl: string | null;
  
  // 3 dimensions indépendantes
  role: UserRole;
  status: UserStatus;
  escalationLevel: EscalationLevel;  // ← OBLIGATOIRE (pas optionnel)
  
  // Vérification
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isIdentityVerified: boolean;
  verificationStatus?: VerificationStatus; // ← AJOUTER : dérivé des requêtes
  
  // Données CIN
  cinNumber: string | null;
  
  // Scores
  reliabilityScore: number;
  fraudScore: number;
  
  // Dates
  createdAt: string;
  lastLogin: string | null;
  suspendedUntil?: string | null;
  
  // Sécurité
  failedLoginAttempts?: number;       // ← Remplacer loginAttempts
  
  // Relations
  verificationRequests?: VerificationRequest[];
}

// ===== VERIFICATION REQUEST =====
export interface VerificationRequest {
  id: string;
  userId: string;
  status: 'PENDING' | 'VALIDATED' | 'REJECTED';  // ← ALIGNER avec Prisma (VALIDATED, pas APPROVED)
  submittedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  rejectionMotif?: string | null;
  documentFrontUrl?: string;
  documentBackUrl?: string | null;
  selfieUrl?: string | null;
}

// ===== ADMIN NOTE =====
export interface AdminNote {
  id: string;
  userId: string;
  content: string;
  authorId: string;
  author?: {                         // ← Optionnel, mais plus complet
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  createdAt: string;
}

// ===== USER ACTION LOG =====
export interface UserActionLog {
  id: string;
  userId: string;
  actionType: ActionType;
  level?: EscalationLevel;
  reason?: string;
  motif?: string;
  duration?: number;                 // en jours
  content?: string;                  // pour les notes
  previousStatus?: UserStatus;
  newStatus?: UserStatus;
  createdAt: string;
  performedBy: string;               // admin ID
  admin?: {                          // ← AJOUTER pour les infos admin
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  user?: {                           // ← AJOUTER pour les infos user
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

// ===== STATS DASHBOARD =====
export interface StatsData {
  totalUsers: number;
  newUsers30d: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  bannedUsers: number;
  lockedUsers: number;               // SECURITY_LOCKED + MANUALLY_BLOCKED
  inactiveUsers: number;              // ← AJOUTER
  verifiedIdentity: number;           // Pourcentage (0-100)
  pendingApprovals: number;
  averageReliability: number;
}

// ===== PAGINATION =====
export interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

// ===== FILTERS =====
export interface UserFilters {
  search: string;
  role: string;                      // 'ALL' ou un rôle
  status: string;                     // 'ALL' ou un statut
  verificationStatus: string;          // 'ALL', 'VERIFIED', 'PENDING', 'REJECTED'
  dateFrom: string;
  dateTo: string;
  minReliability: string;
  maxFraud: string;
}