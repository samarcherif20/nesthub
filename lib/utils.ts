import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// TYPES POUR LE LOGIN
// ============================================
export interface ClerkError {
  code: string;
  message: string;
  longMessage?: string;
  meta?: Record<string, unknown>;
}

export interface ClerkAPIErrorResponse {
  errors: ClerkError[];
  status?: number;
  statusText?: string;
}

export type IdentifierType = "email" | "username" | "unknown";

// ============================================
// TYPE GUARDS
// ============================================
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isClerkAPIError(error: unknown): error is ClerkAPIErrorResponse {
  if (!isObject(error)) return false;
  if (!('errors' in error)) return false;
  
  const errors = error.errors;
  if (!Array.isArray(errors)) return false;
  if (errors.length === 0) return false;
  
  const firstError = errors[0];
  if (!isObject(firstError)) return false;
  if (!('code' in firstError) || !('message' in firstError)) return false;
  if (!isString(firstError.code) || !isString(firstError.message)) return false;
  
  return true;
}

export function isStandardError(error: unknown): error is Error {
  return error instanceof Error;
}

// ============================================
// VALIDATIONS POUR LE LOGIN
// ============================================
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  
  isEmail: (value: string): boolean => {
    return ValidationPatterns.email.test(value);
  },
  
  isUsername: (value: string): boolean => {
    return ValidationPatterns.username.test(value);
  },
  
  detectIdentifierType: (value: string): IdentifierType => {
    if (!value?.trim()) return "unknown";
    
    const trimmed = value.trim();
    
    if (ValidationPatterns.isEmail(trimmed)) return "email";
    if (trimmed.includes('@')) return "email";
    if (ValidationPatterns.isUsername(trimmed)) return "username";
    if (/^[a-zA-Z0-9_]+$/.test(trimmed)) return "username";
    
    return "unknown";
  },
  
  validateIdentifier: (value: string): boolean => {
    if (!value?.trim()) return false;
    return ValidationPatterns.isEmail(value) || ValidationPatterns.isUsername(value);
  }
};

// ============================================
// GESTION DES ERREURS DE LOGIN
// ============================================

// Codes d'erreur Clerk pour le login
export const ClerkLoginErrorCodes = {
  // Identifiants
  IDENTIFIER_NOT_FOUND: "form_identifier_not_found",
  IDENTIFIER_EXISTS: "form_identifier_exists",
  
  // Mot de passe
  PASSWORD_INCORRECT: "form_password_incorrect",
  PASSWORD_PWNED: "form_password_pwned",
  PASSWORD_LENGTH_TOO_SHORT: "form_password_length_too_short",
  
  // 2FA
  CODE_INCORRECT: "form_code_incorrect",
  CODE_EXPIRED: "form_code_expired",
  VERIFICATION_FAILED: "verification_failed",
  
  // Session
  SESSION_EXISTS: "session_exists",
  
  // Rate limiting
  TOO_MANY_ATTEMPTS: "too_many_requests",
  RATE_LIMIT_EXCEEDED: "rate_limit_exceeded",
  
  // Compte
  USER_LOCKED: "user_locked",
  USER_SUSPENDED: "user_suspended",
} as const;

export type ClerkLoginErrorCode = typeof ClerkLoginErrorCodes[keyof typeof ClerkLoginErrorCodes];

/**
 * Traduit les erreurs Clerk en messages utilisateur
 */
export function getClerkErrorMessage(
  error: unknown,
  identifierType: IdentifierType,
  t: (key: string) => string
): string {
  // Si ce n'est pas une erreur Clerk
  if (!isClerkAPIError(error)) {
    if (isStandardError(error)) {
      return error.message;
    }
    return t("error");
  }

  const clerkError = error.errors[0];
  const code = clerkError.code as ClerkLoginErrorCode;
  
  // Log pour débogage (seulement en dev)
  if (process.env.NODE_ENV === 'development') {
    console.log(` [LOGIN ERROR] Code: ${code}`);
    console.log(` [LOGIN ERROR] Message: ${clerkError.message}`);
  }

  // Mapping des codes d'erreur vers les clés de traduction
  switch (code) {
    // ===== ERREURS D'IDENTIFIANT =====
    case ClerkLoginErrorCodes.IDENTIFIER_NOT_FOUND:
      if (identifierType === "email") return t("emailNotFound");
      if (identifierType === "username") return t("usernameNotFound");
      return t("userNotFound");
    
    case ClerkLoginErrorCodes.IDENTIFIER_EXISTS:
      return t("emailAlreadyExists");
    
    // ===== ERREURS DE MOT DE PASSE =====
    case ClerkLoginErrorCodes.PASSWORD_INCORRECT:
      return t("incorrectPassword");
    
    case ClerkLoginErrorCodes.PASSWORD_PWNED:
      return t("passwordCompromised");
    
    case ClerkLoginErrorCodes.PASSWORD_LENGTH_TOO_SHORT:
      return t("passwordTooShort");
    
    // ===== ERREURS 2FA =====
    case ClerkLoginErrorCodes.CODE_INCORRECT:
      return t("incorrectCode");
    
    case ClerkLoginErrorCodes.CODE_EXPIRED:
      return t("codeExpired");
    
    case ClerkLoginErrorCodes.VERIFICATION_FAILED:
      return t("verificationFailed");
    
    // ===== ERREURS DE SESSION =====
    case ClerkLoginErrorCodes.SESSION_EXISTS:
      return t("sessionExists");
    
    // ===== TROP DE TENTATIVES =====
    case ClerkLoginErrorCodes.TOO_MANY_ATTEMPTS:
    case ClerkLoginErrorCodes.RATE_LIMIT_EXCEEDED:
      return t("tooManyAttempts");
    
    // ===== ÉTAT DU COMPTE =====
    case ClerkLoginErrorCodes.USER_LOCKED:
      return t("accountLocked");
    
    case ClerkLoginErrorCodes.USER_SUSPENDED:
      return t("accountSuspended");
    
    // ===== CAS PAR DÉFAUT =====
    default:
      // Si on a un longMessage, on l'utilise
      if (clerkError.longMessage) {
        return clerkError.longMessage;
      }
      // Sinon le message par défaut
      return clerkError.message || t("error");
  }
}

/**
 * Récupère le code d'erreur Clerk (pour débogage)
 */
export function getClerkErrorCode(error: unknown): string | null {
  if (!isClerkAPIError(error)) return null;
  return error.errors[0]?.code || null;
}

/**
 * Vérifie si l'erreur est une erreur de mot de passe incorrect
 */
export function isIncorrectPasswordError(error: unknown): boolean {
  if (!isClerkAPIError(error)) return false;
  const code = error.errors[0]?.code;
  return code === ClerkLoginErrorCodes.PASSWORD_INCORRECT;
}

/**
 * Vérifie si l'erreur est une erreur d'identifiant non trouvé
 */
export function isIdentifierNotFoundError(error: unknown): boolean {
  if (!isClerkAPIError(error)) return false;
  const code = error.errors[0]?.code;
  return code === ClerkLoginErrorCodes.IDENTIFIER_NOT_FOUND;
}

/**
 * Vérifie si l'erreur est une erreur de rate limiting
 */
export function isRateLimitError(error: unknown): boolean {
  if (!isClerkAPIError(error)) return false;
  const code = error.errors[0]?.code;
  return code === ClerkLoginErrorCodes.TOO_MANY_ATTEMPTS || 
         code === ClerkLoginErrorCodes.RATE_LIMIT_EXCEEDED;
}
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  
  const [localPart, domain] = email.split('@');
  
  // Gestion de la partie locale (avant le @)
  if (localPart.length <= 4) {
    // Si trop court, on garde tel quel
    return email;
  }
  
  const firstThree = localPart.slice(0, 3); // "sam"
  const lastOne = localPart.slice(-1); // dernière lettre avant @ (ex: "1")
  const middleLength = localPart.length - 4; // longueur de la partie à masquer
  const maskedMiddle = '*'.repeat(middleLength);
  
  const maskedLocal = firstThree + maskedMiddle + lastOne; // "sam*******1"
  
  return `${maskedLocal}@${domain}`;
}
// ============================================
// LOGGER POUR LE LOGIN
// ============================================
export const logger = {
  info: (message: string, data?: unknown) => {
    console.log(` [INFO] ${message}`, data !== undefined ? data : '');
  },
  
  success: (message: string, data?: unknown) => {
    console.log(` [SUCCESS] ${message}`, data !== undefined ? data : '');
  },
  
  warning: (message: string, data?: unknown) => {
    console.log(` [WARNING] ${message}`, data !== undefined ? data : '');
  },
  
  error: (message: string, error?: unknown) => {
    console.error(` [ERROR] ${message}`, error !== undefined ? error : '');
  },
  
  auth: (message: string, data?: unknown) => {
    console.log(` [AUTH] ${message}`, data !== undefined ? data : '');
  },
  
  debug: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(` [DEBUG] ${message}`, data !== undefined ? data : '');
    }
  }
};