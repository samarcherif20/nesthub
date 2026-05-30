"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Calendar,
  CreditCard,
  MessageSquare,
  Star,
  Bell,
  Home,
  Shield,
  Gift,
} from "lucide-react";

interface NotificationCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  enabled: boolean;
}

// Interface pour le toast
interface ToastState {
  type: "success" | "error";
  message: string;
}

export function useSettings(
  setToast: React.Dispatch<React.SetStateAction<ToastState | null>>
) {
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
  const [vacationError, setVacationError] = useState<string | null>(null);
  const [vacationStatus, setVacationStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Helper pour les toasts personnalisés
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    profilePictureUrl: null as string | null,
    preferredLocale: currentLocale,
  });

  const [security, setSecurity] = useState<{ sessions: any[] }>({
    sessions: [],
  });

  const [vacation, setVacation] = useState({
    enabled: false,
    message: "",
    startDate: "",
    endDate: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    showCurrent: false,
    showNew: false,
    showConfirm: false,
    strength: 0,
    isSubmitting: false,
    success: false,
  });

  // Configuration des catégories de notifications
  const [notificationCategories, setNotificationCategories] = useState<
    NotificationCategory[]
  >([
    {
      id: "bookings",
      name: "Réservations",
      icon: <Calendar size={16} />,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      enabled: true,
    },
    {
      id: "payments",
      name: "Paiements",
      icon: <CreditCard size={16} />,
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
      enabled: true,
    },
    {
      id: "messages",
      name: "Messages",
      icon: <MessageSquare size={16} />,
      iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      enabled: true,
    },
    {
      id: "reviews",
      name: "Avis",
      icon: <Star size={16} />,
      iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      enabled: true,
    },
    {
      id: "listings",
      name: "Annonces",
      icon: <Home size={16} />,
      iconBg: "bg-teal-100 dark:bg-teal-900/30",
      iconColor: "text-teal-600 dark:text-teal-400",
      enabled: true,
    },
    {
      id: "alerts",
      name: "Alertes",
      icon: <Bell size={16} />,
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400",
      enabled: true,
    },
    {
      id: "disputes",
      name: "Litiges",
      icon: <Shield size={16} />,
      iconBg: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
      enabled: true,
    },
    {
      id: "offers",
      name: "Offres",
      icon: <Gift size={16} />,
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      enabled: true,
    },
  ]);

  const [quietHours, setQuietHours] = useState({
    start: "22:00",
    end: "07:00",
  });

  // Calcul de la force du mot de passe
  const calculateStrength = useCallback((password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    if (password.length >= 12) strength++;
    return Math.min(strength, 5);
  }, []);

  const updatePasswordStrength = (password: string) => {
    setPasswordForm((prev) => ({
      ...prev,
      strength: calculateStrength(password),
    }));
  };

  const passwordsMatch =
    passwordForm.newPassword === passwordForm.confirmPassword &&
    passwordForm.newPassword !== "";
  const isPasswordValid = passwordForm.strength >= 4 && passwordsMatch;

  const passwordCriteria = {
    length: passwordForm.newPassword.length >= 8,
    uppercase:
      /[A-Z]/.test(passwordForm.newPassword) &&
      /[a-z]/.test(passwordForm.newPassword),
    number: /[0-9]/.test(passwordForm.newPassword),
    special: /[^A-Za-z0-9]/.test(passwordForm.newPassword),
  };

  const getStrengthLabel = () => {
    const strength = passwordForm.strength;
    if (strength === 1)
      return { text: "Très faible", color: "#ef4444", width: "20%" };
    if (strength === 2)
      return { text: "Faible", color: "#f97316", width: "40%" };
    if (strength === 3)
      return { text: "Moyen", color: "#eab308", width: "60%" };
    if (strength === 4) return { text: "Fort", color: "#22c55e", width: "80%" };
    if (strength === 5)
      return { text: "Très fort", color: "#10b981", width: "100%" };
    return { text: "Très faible", color: "#ef4444", width: "20%" };
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
            startDate: user.vacationStartDate?.split("T")[0] || "",
            endDate: user.vacationEndDate?.split("T")[0] || "",
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
              })),
            );
          }
          if (data.quietHours) setQuietHours(data.quietHours);
        }
      } catch (error) {
        console.error("Erreur chargement:", error);
        showToast("error", "Erreur lors du chargement des données");
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
        body: JSON.stringify({
          userId: clerkUser?.id,
          preferredLocale: locale,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la mise à jour");
      }

      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
      const pathWithoutLocale = pathname.replace(`/${currentLocale}`, "");
      router.push(`/${locale}${pathWithoutLocale || "/"}`);
      showToast("success", "Langue mise à jour avec succès");
    } catch (error: any) {
      console.error("Erreur mise à jour langue:", error);
      setProfile((prev) => ({ ...prev, preferredLocale: previousLocale }));
      showToast("error", error.message || "Erreur lors du changement de langue");
      throw error;
    }
  };

  // Changer le mot de passe
  const changePassword = async () => {
    if (!passwordForm.currentPassword) {
      showToast("error", "Veuillez entrer votre mot de passe actuel");
      throw new Error("Veuillez entrer votre mot de passe actuel");
    }

    if (!isPasswordValid) {
      showToast("error", "Le nouveau mot de passe n'est pas assez fort");
      throw new Error("Le nouveau mot de passe n'est pas assez fort");
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("error", "Les mots de passe ne correspondent pas");
      throw new Error("Les mots de passe ne correspondent pas");
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
        showToast("success", "Mot de passe mis à jour avec succès !");
        setTimeout(() => {
          setPasswordForm((prev) => ({
            ...prev,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
            isSubmitting: false,
            success: false,
            strength: 0,
          }));
        }, 2000);
      } else {
        const errorMsg =
          data.error || data.message || "Mot de passe actuel incorrect";
        showToast("error", errorMsg);
        setPasswordForm((prev) => ({
          ...prev,
          isSubmitting: false,
          currentPassword: "",
        }));
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error("Erreur changement mot de passe:", error);
      setPasswordForm((prev) => ({ ...prev, isSubmitting: false }));
      if (error.message && !error.message.includes("Veuillez")) {
        showToast("error", error.message || "Erreur de connexion");
      }
      throw error;
    }
  };

  // Toggle vacation mode
  const toggleVacationMode = async () => {
    setVacationError(null);
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
          startDate: vacation.startDate,
          endDate: vacation.endDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du changement");
      }

      setVacation((prev) => ({ ...prev, enabled: !prev.enabled }));
      const message = vacation.enabled
        ? "Mode vacances désactivé"
        : "Mode vacances activé";
      setVacationStatus({ type: "success", message });
      showToast("success", message);
      setVacationError(null);
    } catch (error: any) {
      console.error("Erreur toggle vacation mode:", error);
      const errorMsg = error.message || "Erreur lors de la modification";
      setVacationError(errorMsg);
      setVacationStatus({ type: "error", message: errorMsg });
      showToast("error", errorMsg);
      throw error;
    }
  };

  // Sauvegarder le message de vacances
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
          startDate: vacation.startDate,
          endDate: vacation.endDate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la sauvegarde");
      }

      showToast("success", "Message de vacances sauvegardé");
    } catch (error: any) {
      console.error("Erreur sauvegarde message:", error);
      showToast("error", error.message || "Erreur lors de la sauvegarde");
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
      showToast("success", "Session révoquée avec succès");
    } catch (error: any) {
      console.error("Erreur révocation session:", error);
      showToast("error", error.message || "Erreur lors de la révocation");
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

      showToast("success", `Données exportées avec succès au format ${format.toUpperCase()}`);
    } catch (error: any) {
      console.error("Erreur exportation:", error);
      showToast("error", error.message || "Erreur lors de l'exportation");
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

      showToast("success", "Votre compte a été désactivé avec succès");
      await clerkUser?.reload();
      router.push("/");
    } catch (error: any) {
      console.error("Erreur désactivation:", error);
      showToast("error", error.message || "Erreur lors de la désactivation");
      throw error;
    } finally {
      setIsDeactivating(false);
    }
  };

  // Toggle notification category
  const toggleNotificationCategory = async (categoryId: string) => {
    // Sauvegarder l'état avant modification
    const previousCategories = [...notificationCategories];
    
    // Mettre à jour l'état local immédiatement
    const updatedCategories = notificationCategories.map((cat) =>
      cat.id === categoryId ? { ...cat, enabled: !cat.enabled } : cat,
    );
    setNotificationCategories(updatedCategories);

    try {
      const token = await getToken({ template: "my-app-template" });
      const preferences: Record<string, boolean> = {};
      updatedCategories.forEach((cat) => {
        preferences[cat.id] = cat.enabled;
      });

      const response = await fetch("/api/users/notifications/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categories: preferences, quietHours }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde");
      }

      showToast("success", "Préférences de notifications mises à jour");
    } catch (error) {
      console.error("Erreur sauvegarde préférences:", error);
      // Revert avec l'état sauvegardé
      setNotificationCategories(previousCategories);
      showToast("error", "Erreur lors de la sauvegarde des préférences");
    }
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

      showToast("success", "Heures calmes mises à jour avec succès");
    } catch (error: any) {
      console.error("Erreur mise à jour heures calmes:", error);
      showToast("error", error.message || "Erreur lors de la mise à jour");
      throw error;
    }
  };

  return {
    loading,
    saving,
    profile,
    security,
    vacation,
    setVacation,
    vacationError,
    vacationStatus,
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