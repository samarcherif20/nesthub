import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "TND",
  }).format(price);
}

// TYPES 
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

// TYPE GUARDS 
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

// VALIDATIONS 
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  
  isEmail: (value: string): boolean => {
    return ValidationPatterns.email.test(value);
  },
  
  isUsername: (value: string): boolean => {
    return ValidationPatterns.username.test(value);
  },
  
  // ✅ VERSION FINALE CORRIGÉE
  detectIdentifierType: (value: string): IdentifierType => {
    if (!value?.trim()) return "unknown";
    
    const trimmed = value.trim();
    
    // 1. Vérifier si c'est un email valide
    if (ValidationPatterns.isEmail(trimmed)) return "email";
    
    // 2. Vérifier si ça RESSEMBLE à un email (contient @ et un point après @)
    // Ex: "john@", "@gmail.com", "john@gmail", "john@doe"
    if (trimmed.includes('@')) {
      return "email"; // Toute chaîne avec @ est une tentative d'email
    }
    
    // 3. Vérifier si c'est un username valide
    if (ValidationPatterns.isUsername(trimmed)) return "username";
    
    // 4. Vérifier si ça RESSEMBLE à un username (lettres, chiffres, _ uniquement)
    if (/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return "username"; // C'est une tentative de username (même si longueur incorrecte)
    }
    
    // 5. Pour "abc@" - déjà capturé par la règle 2 (contient @)
    
    // 6. Pour "123" - chiffres uniquement, mais pas de @
    if (/^[0-9]+$/.test(trimmed)) {
      return "unknown"; // C'est un format inconnu
    }
    
    // 7. Pour les chaînes avec caractères spéciaux (sans @)
    if (/^[a-zA-Z0-9_@.-]+$/.test(trimmed)) {
      // Si ça contient @, c'est un email (déjà traité)
      // Sinon, c'est un username potentiel mais avec caractères valides
      return "username";
    }
    
    // 8. Tout le reste est inconnu
    return "unknown";
  },
  
  validateIdentifier: (value: string): boolean => {
    if (!value?.trim()) return false;
    return ValidationPatterns.isEmail(value) || ValidationPatterns.isUsername(value);
  }
};

// GESTION DES ERREURS 
export function getClerkErrorMessage(
  error: unknown,
  identifierType: IdentifierType,
  t: (key: string) => string
): string {
  if (!isClerkAPIError(error)) {
    return isStandardError(error) ? error.message : t("error");
  }

  const clerkError = error.errors[0];

  switch (clerkError.code) {
    case "form_identifier_not_found":
      if (identifierType === "email") return t("emailNotFound");
      if (identifierType === "username") return t("usernameNotFound");
      return t("userNotFound");
    
    case "form_password_incorrect":
      return t("incorrectPassword");
    
    case "too_many_requests":
      return t("tooManyAttempts");
    
    default:
      return clerkError.message || t("error");
  }
}

// LOGGER
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
  }
};