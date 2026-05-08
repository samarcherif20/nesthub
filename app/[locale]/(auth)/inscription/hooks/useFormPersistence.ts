import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "nesthub_inscription_draft_v2";
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const AUTO_SAVE_DELAY = 30000; // 30 secondes

export interface PersistedFormData {
  timestamp: number;
  currentStep: number;
  role: "landlord" | "tenant" | null;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  bio: string;
  governorate: string;
  delegation: string;
  acceptTerms: boolean;
}

export function useFormPersistence() {
  const [isRestored, setIsRestored] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sauvegarde manuelle
  const saveForm = useCallback((data: Partial<PersistedFormData>) => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      const parsed = existing ? JSON.parse(existing) : {};
      
      const toSave: PersistedFormData = {
        timestamp: Date.now(),
        currentStep: data.currentStep ?? parsed.currentStep ?? 1,
        role: data.role ?? parsed.role ?? null,
        username: data.username ?? parsed.username ?? "",
        email: data.email ?? parsed.email ?? "",
        firstName: data.firstName ?? parsed.firstName ?? "",
        lastName: data.lastName ?? parsed.lastName ?? "",
        phoneNumber: data.phoneNumber ?? parsed.phoneNumber ?? "",
        bio: data.bio ?? parsed.bio ?? "",
        governorate: data.governorate ?? parsed.governorate ?? "",
        delegation: data.delegation ?? parsed.delegation ?? "",
        acceptTerms: data.acceptTerms ?? parsed.acceptTerms ?? false,
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      console.log("💾 Formulaire sauvegardé automatiquement");
    } catch (error) {
      console.error("Erreur sauvegarde formulaire:", error);
    }
  }, []);

  // Chargement des données sauvegardées
  const loadForm = useCallback((): PersistedFormData | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;
      
      const data: PersistedFormData = JSON.parse(saved);
      const isExpired = Date.now() - data.timestamp > SESSION_TIMEOUT;
      
      if (isExpired) {
        localStorage.removeItem(STORAGE_KEY);
        console.log("⌛ Session expirée, formulaire nettoyé");
        return null;
      }
      
      console.log("📂 Formulaire restauré depuis sauvegarde");
      return data;
    } catch (error) {
      console.error("Erreur chargement formulaire:", error);
      return null;
    }
  }, []);

  // Nettoyage après succès
  const clearForm = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    console.log("🧹 Formulaire nettoyé après succès");
  }, []);

  // Sauvegarde automatique périodique
  const startAutoSave = useCallback((data: Partial<PersistedFormData>) => {
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }
    
    autoSaveTimerRef.current = setInterval(() => {
      saveForm(data);
    }, AUTO_SAVE_DELAY);
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [saveForm]);

  useEffect(() => {
    setIsRestored(true);
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, []);

  return {
    saveForm,
    loadForm,
    clearForm,
    startAutoSave,
    isRestored
  };
}