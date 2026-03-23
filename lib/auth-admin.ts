// lib/auth-admin.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

// Types Prisma pour les rôles
export type UserRole = 'ADMIN' | 'PROPERTY_OWNER' | 'TENANT';

// Interface pour les claims Clerk
export interface ClerkClaims {
  role?: UserRole;
  email?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: unknown;
}

// Interface pour l'admin authentifié
export interface AdminAuth {
  userId: string;
  role: 'ADMIN';
  claims: ClerkClaims;
}

// Interface pour les erreurs
export interface AuthError {
  error: string;
  status: 401 | 403;
}

// Type guard
export function isAuthError(result: AdminAuth | AuthError): result is AuthError {
  return 'error' in result;
}

// Fonction d'authentification principale
export function getAdminAuth(request: NextRequest): AdminAuth | AuthError {
  const auth = getAuth(request);
  
  const { userId, sessionClaims } = auth;
  
  if (!userId) {
    return { error: 'Non authentifié', status: 401 };
  }

  const claims = sessionClaims as ClerkClaims | null;
  
  if (!claims) {
    return { error: 'Session invalide', status: 401 };
  }

  const role = claims.role;
  
  if (role !== 'ADMIN') {
    return { 
      error: 'Non autorisé - Admin seulement', 
      status: 403
    };
  }

  return {
    userId,
    role: 'ADMIN',
    claims,
  };
}