"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import {
  Calendar,
  CreditCard,
  MessageSquare,
  Star,
  Bell,
  Home,
  Shield,
  Gift,
  Settings,
} from "lucide-react";

interface NotificationCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  enabled: boolean;
}

export function useSettings() {
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    profilePictureUrl: null as string | null,
    preferredLocale: currentLocale,
  });

  const [security, setSecurity] = useState<{ sessions: any[] }>({ sessions: [] });
  const [vacation, setVacation] = useState({ enabled: false, message: "" });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    showCurrent: false,
    showNew: false,
    showConfirm: false,
    strength: 1,
    isSubmitting: false,
    success: false,
  });

  const [notificationCategories, setNotificationCategories] = useState<NotificationCategory[]>([
    { id: "bookings", name: "Réservations", icon: <Calendar size={16} />, iconBg: "bg-blue-100 dark:bg-blue-900/30", iconColor: "text-blue-600", enabled: true },
    { id: "payments", name: "Paiements", icon: <CreditCard size={16} />, iconBg: "bg-purple-100 dark:bg-purple-900/30", iconColor: "text-purple-600", enabled: true },
    { id: "messages", name: "Messages", icon: <MessageSquare size={16} />, iconBg: "bg-indigo-100 dark:bg-indigo-900/30", iconColor: "text-indigo-600", enabled: true },
    { id: "reviews", name: "Avis", icon: <Star size={16} />, iconBg: "bg-yellow-100 dark:bg-yellow-900/30", iconColor: "text-yellow-600", enabled: true },
    { id: "listings", name: "Annonces", icon: <Home size={16} />, iconBg: "bg-teal-100 dark:bg-teal-900/30", iconColor: "text-teal-600", enabled: true },
    { id: "alerts", name: "Alertes", icon: <Bell size={16} />, iconBg: "bg-amber-100 dark:bg-amber-900/30", iconColor: "text-amber-600", enabled: true },
    { id: "disputes", name: "Litiges", icon: <Shield size={16} />, iconBg: "bg-red-100 dark:bg-red-900/30", iconColor: "text-red-600", enabled: true },
    { id: "offers", name: "Offres", icon: <Gift size={16} />, iconBg: "bg-green-100 dark:bg-green-900/30", iconColor: "text-green-600", enabled: true },
    { id: "system", name: "Système", icon: <Settings size={16} />, iconBg: "bg-slate-100 dark:bg-slate-700/50", iconColor: "text-slate-600", enabled: true },
  ]);

  const [quietHours, setQuietHours] = useState({ start: "22:00", end: "07:00" });

  // Calcul de la force du mot de passe
  const calculateStrength = useCallback((password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    if (password.length >= 12) strength++;
    return Math.min(strength, 5);
  }, []);

  const updatePasswordStrength = (password: string) => {
    setPasswordForm((prev) => ({ ...prev, strength: calculateStrength(password) }));
  };

  const passwordsMatch = passwordForm.newPassword === passwordForm.confirmPassword && passwordForm.newPassword !== "";
  const isPasswordValid = passwordForm.strength >= 4 && passwordsMatch;

  const passwordCriteria = {
    length: passwordForm.newPassword.length >= 8,
    uppercase: /[A-Z]/.test(passwordForm.newPassword),
    number: /[0-9]/.test(passwordForm.newPassword),
    special: /[^A-Za-z0-9]/.test(passwordForm.newPassword),
  };

  const getStrengthLabel = () => {
    const strength = passwordForm.strength;
    if (strength === 1) return { text: "Faible", color: "#ef4444" };
    if (strength === 2) return { text: "Moyen", color: "#f97316" };
    if (strength === 3) return { text: "Bon", color: "#eab308" };
    if (strength === 4) return { text: "Fort", color: "#22c55e" };
    return { text: "Très fort", color: "#10b981" };
  };

  // Charger les données utilisateur
  useEffect(() => {
    if (!isUserLoaded || !clerkUser) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const token = await getToken({ template: "my-app-template" });

        const profileRes = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const data = await profileRes.json();
          const user = data.user || data;
          setProfile({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            profilePictureUrl: user.profilePictureUrl || null,
            preferredLocale: user.preferredLocale || currentLocale,
          });
          setVacation({
            enabled: user.vacationMode || false,
            message: user.vacationMessage || "",
          });
        }

        const sessionsRes = await fetch("/api/users/sessions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (sessionsRes.ok) {
          const data = await sessionsRes.json();
          setSecurity({ sessions: data.sessions || [] });
        }

        const notifRes = await fetch("/api/users/notifications/preferences", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (notifRes.ok) {
          const data = await notifRes.json();
          if (data.categories) {
            setNotificationCategories((prev) =>
              prev.map((cat) => ({
                ...cat,
                enabled: data.categories[cat.id] ?? cat.enabled,
              }))
            );
          }
          if (data.quietHours) setQuietHours(data.quietHours);
        }
      } catch (error) {
        console.error("Erreur chargement:", error);
        toast.error("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [clerkUser, getToken, isUserLoaded, currentLocale]);

  // Mettre à jour la langue
  const updateLanguage = async (locale: string) => {
    if (locale === currentLocale) return;
    
    const previousLocale = currentLocale;
    setProfile((prev) => ({ ...prev, preferredLocale: locale }));
    
    try {
      const token = await getToken({ template: "my-app-template" });
      const response = await fetch("/api/users/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: clerkUser?.id, preferredLocale: locale }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la mise à jour");
      }

      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
      const pathWithoutLocale = pathname.replace(`/${currentLocale}`, "");
      router.push(`/${locale}${pathWithoutLocale || "/"}`);
      toast.success("Langue mise à jour avec succès");
    } catch (error: any) {
      console.error("Erreur mise à jour langue:", error);
      setProfile((prev) => ({ ...prev, preferredLocale: previousLocale }));
      throw new Error(error.message || "Erreur lors du changement de langue");
    }
  };

  // Changer le mot de passe - CORRIGÉ AVEC GESTION D'ERREUR
  const changePassword = async () => {
    // Validations
    if (!passwordForm.currentPassword) {
      const error = new Error("Veuillez entrer votre mot de passe actuel");
      toast.error(error.message);
      throw error;
    }
    
    if (!isPasswordValid) {
      const error = new Error("Le nouveau mot de passe n'est pas assez fort");
      toast.error(error.message);
      throw error;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      const error = new Error("Les mots de passe ne correspondent pas");
      toast.error(error.message);
      throw error;
    }

    setPasswordForm((prev) => ({ ...prev, isSubmitting: true }));
    
    try {
      const token = await getToken({ template: "my-app-template" });
      
      const response = await fetch("/api/users/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordForm((prev) => ({ ...prev, success: true }));
        toast.success("Mot de passe mis à jour avec succès !");
        
        setTimeout(() => {
          setPasswordForm((prev) => ({
            ...prev,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
            isSubmitting: false,
            success: false,
          }));
        }, 2000);
      } else {
        // Gestion spécifique des erreurs
        const errorMsg = data.error || data.message || "Erreur lors du changement";
        toast.error(errorMsg);
        setPasswordForm((prev) => ({ ...prev, isSubmitting: false, currentPassword: "" }));
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error("Erreur changement mot de passe:", error);
      setPasswordForm((prev) => ({ ...prev, isSubmitting: false }));
      if (error.message && !error.message.includes("Veuillez")) {
        toast.error(error.message || "Erreur de connexion");
      }
      throw error;
    }
  };

  // Basculer mode vacances
  const toggleVacationMode = async () => {
    try {
      const token = await getToken({ template: "my-app-template" });
      const response = await fetch("/api/users/vacation-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enabled: !vacation.enabled,
          message: vacation.message,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors du changement");
      }

      setVacation((prev) => ({ ...prev, enabled: !prev.enabled }));
      toast.success(vacation.enabled ? "Mode vacances désactivé" : "Mode vacances activé");
    } catch (error: any) {
      console.error("Erreur toggle vacation mode:", error);
      toast.error(error.message || "Erreur lors de la modification");
      throw error;
    }
  };

  // Sauvegarder message vacances
  const saveVacationMessage = async () => {
    setSaving(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const response = await fetch("/api/users/vacation-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enabled: vacation.enabled,
          message: vacation.message,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la sauvegarde");
      }

      toast.success("Message de vacances sauvegardé");
    } catch (error: any) {
      console.error("Erreur sauvegarde message:", error);
      toast.error(error.message || "Erreur lors de la sauvegarde");
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Révoquer une session
  const revokeSession = async (sessionId: string) => {
    try {
      const token = await getToken({ template: "my-app-template" });
      const response = await fetch(`/api/users/sessions/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la révocation");
      }

      setSecurity((prev) => ({
        ...prev,
        sessions: prev.sessions.filter((s) => s.id !== sessionId),
      }));
      toast.success("Session révoquée avec succès");
    } catch (error: any) {
      console.error("Erreur révocation session:", error);
      toast.error(error.message || "Erreur lors de la révocation");
      throw error;
    }
  };

  // Exporter les données
  const exportUserData = async (format: "csv" | "json") => {
    setIsExporting(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const response = await fetch(`/api/users/export?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'exportation");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `nesthub_export_${format === "csv" ? "csv" : "json"}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Données exportées avec succès au format ${format.toUpperCase()}`);
    } catch (error: any) {
      console.error("Erreur exportation:", error);
      toast.error(error.message || "Erreur lors de l'exportation");
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  // Désactiver le compte
  const deactivateAccount = async () => {
    setIsDeactivating(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const response = await fetch("/api/users/deactivate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la désactivation");
      }

      toast.success("Votre compte a été désactivé avec succès");
      await clerkUser?.reload();
      router.push("/");
    } catch (error: any) {
      console.error("Erreur désactivation:", error);
      toast.error(error.message || "Erreur lors de la désactivation");
      throw error;
    } finally {
      setIsDeactivating(false);
    }
  };

  // Toggle notification category
  const toggleNotificationCategory = (categoryId: string) => {
    setNotificationCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId ? { ...cat, enabled: !cat.enabled } : cat
      )
    );

    const savePref = async () => {
      try {
        const token = await getToken({ template: "my-app-template" });
        const preferences: Record<string, boolean> = {};
        notificationCategories.forEach((cat) => {
          preferences[cat.id] = cat.enabled;
        });
        await fetch("/api/users/notifications/preferences", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ categories: preferences, quietHours }),
        });
      } catch (error) {
        console.error("Erreur sauvegarde préférences:", error);
        toast.error("Erreur lors de la sauvegarde des préférences");
      }
    };
    savePref();
  };

  // Mettre à jour les heures calmes
  const updateQuietHours = async (start: string, end: string) => {
    setQuietHours({ start, end });
    try {
      const token = await getToken({ template: "my-app-template" });
      const response = await fetch("/api/users/notifications/quiet-hours", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ start, end, enabled: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la mise à jour");
      }

      toast.success("Heures calmes mises à jour avec succès");
    } catch (error: any) {
      console.error("Erreur mise à jour heures calmes:", error);
      toast.error(error.message || "Erreur lors de la mise à jour");
      throw error;
    }
  };

  return {
    loading,
    saving,
    profile,
    security,
    vacation,
    passwordForm,
    passwordCriteria,
    theme,
    setTheme,
    updateLanguage,
    changePassword,
    toggleVacationMode,
    saveVacationMessage,
    revokeSession,
    setPasswordForm,
    updatePasswordStrength,
    passwordsMatch,
    isPasswordValid,
    getStrengthLabel,
    exportUserData,
    isExporting,
    deactivateAccount,
    isDeactivating,
    notificationCategories,
    quietHours,
    toggleNotificationCategory,
    updateQuietHours,
  };
}