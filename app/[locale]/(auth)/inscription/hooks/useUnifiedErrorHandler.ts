import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

export type ErrorCode = 
  | "NET_001"    // Erreur réseau/connexion
  | "VAL_001"    // Erreur de validation formulaire
  | "DB_001"     // Doublon (email, username, phone déjà existants)
  | "RL_001"     // Rate limiting (trop de tentatives)
  | "AUTH_001"   // Erreur d'authentification Clerk
  | "OCR_001"    // Erreur lecture automatique CIN
  | "UPLOAD_001" // Erreur upload fichiers
  | "WHATSAPP_001" // Erreur WhatsApp
  | "UNKNOWN_000"; // Erreur inconnue

export interface UnifiedError {
  code: ErrorCode;
  message: string;
  field?: string;        // Champ concerné (email, username, etc.)
  details?: any;
  timestamp: number;
  priority: 1 | 2 | 3 | 4; // 1=bloquant, 4=simple info
  retryable: boolean;     // Peut-on réessayer ?
}

const errorConfig: Record<ErrorCode, { priority: 1 | 2 | 3 | 4; retryable: boolean; defaultMessage: string }> = {
  "NET_001": { priority: 1, retryable: true, defaultMessage: "Erreur réseau. Vérifiez votre connexion." },
  "VAL_001": { priority: 2, retryable: false, defaultMessage: "Données invalides." },
  "DB_001": { priority: 1, retryable: false, defaultMessage: "Ces informations existent déjà." },
  "RL_001": { priority: 3, retryable: true, defaultMessage: "Trop de tentatives. Attendez quelques minutes." },
  "AUTH_001": { priority: 1, retryable: false, defaultMessage: "Erreur d'authentification." },
  "OCR_001": { priority: 3, retryable: true, defaultMessage: "Lecture automatique échouée." },
  "UPLOAD_001": { priority: 2, retryable: true, defaultMessage: "Erreur d'upload." },
  "WHATSAPP_001": { priority: 2, retryable: true, defaultMessage: "Erreur WhatsApp." },
  "UNKNOWN_000": { priority: 4, retryable: false, defaultMessage: "Erreur inconnue." }
};

export function useUnifiedErrorHandler() {
  const [currentError, setCurrentError] = useState<UnifiedError | null>(null);
  const [errorHistory, setErrorHistory] = useState<UnifiedError[]>([]);
  const [showError, setShowError] = useState(false);

  // Auto-clear error after 5 seconds (priorité 3-4 s'effacent, 1-2 restent)
  useEffect(() => {
    if (currentError && currentError.priority >= 3) {
      const timer = setTimeout(() => {
        setCurrentError(null);
        setShowError(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentError]);

  const addError = useCallback((
    code: ErrorCode,
    customMessage?: string,
    field?: string,
    details?: any
  ) => {
    const config = errorConfig[code];
    const error: UnifiedError = {
      code,
      message: customMessage || config.defaultMessage,
      field,
      details,
      timestamp: Date.now(),
      priority: config.priority,
      retryable: config.retryable
    };

    setCurrentError(error);
    setErrorHistory(prev => [error, ...prev].slice(0, 50)); // Garde les 50 dernières erreurs
    setShowError(true);

    // Toast pour les erreurs non-bloquantes
    if (config.priority >= 3) {
      toast.error(error.message, {
        description: field ? `Champ: ${field}` : undefined,
        duration: 4000
      });
    }

    return error;
  }, []);

  const clearError = useCallback(() => {
    setCurrentError(null);
    setShowError(false);
  }, []);

  // Convertit n'importe quelle erreur en UnifiedError
  const getErrorMessage = useCallback((error: unknown): UnifiedError => {
    if (error instanceof Error) {
      const message = error.message;
      
      if (message.includes("réseau") || message.includes("network") || message.includes("fetch")) {
        return { code: "NET_001", message: errorConfig.NET_001.defaultMessage, timestamp: Date.now(), priority: 1, retryable: true };
      }
      if (message.includes("email") || message.includes("username") || message.includes("déjà") || message.includes("exists")) {
        return { code: "DB_001", message: message, timestamp: Date.now(), priority: 1, retryable: false };
      }
      if (message.includes("rate") || message.includes("limite") || message.includes("too many")) {
        return { code: "RL_001", message: errorConfig.RL_001.defaultMessage, timestamp: Date.now(), priority: 3, retryable: true };
      }
      if (message.includes("whatsapp")) {
        return { code: "WHATSAPP_001", message: message, timestamp: Date.now(), priority: 2, retryable: true };
      }
      if (message.includes("upload") || message.includes("CIN") || message.includes("file")) {
        return { code: "UPLOAD_001", message: message, timestamp: Date.now(), priority: 2, retryable: true };
      }
      if (message.includes("OCR")) {
        return { code: "OCR_001", message: message, timestamp: Date.now(), priority: 3, retryable: true };
      }
    }
    
    return { code: "UNKNOWN_000", message: errorConfig.UNKNOWN_000.defaultMessage, timestamp: Date.now(), priority: 4, retryable: false };
  }, []);

  return {
    currentError,
    errorHistory,
    showError,
    addError,
    clearError,
    getErrorMessage,
    setShowError
  };
}