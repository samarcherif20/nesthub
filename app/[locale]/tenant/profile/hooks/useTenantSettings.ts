"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";

interface Session {
  id: string;
  device: string;
  location: string;
  ip: string;
  isCurrent: boolean;
  lastActive: string;
}

interface NotificationCategory {
  id: string;
  name: string;
  enabled: boolean;
}

export function useTenantSettings() {
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [preferredLocale, setPreferredLocale] = useState(currentLocale);

  const [security, setSecurity] = useState<{ sessions: Session[] }>({
    sessions: [],
  });

  const [notificationCategories, setNotificationCategories] = useState<NotificationCategory[]>([
    { id: "bookings", name: "Réservations", enabled: true },
    { id: "payments", name: "Paiements", enabled: true },
    { id: "messages", name: "Messages", enabled: true },
    { id: "reviews", name: "Avis", enabled: true },
    { id: "alerts", name: "Alertes", enabled: true },
  ]);

  const [quietHours, setQuietHours] = useState({ start: "22:00", end: "07:00" });

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

  const passwordsMatch =
    passwordForm.newPassword === passwordForm.confirmPassword &&
    passwordForm.newPassword !== "";
  const isPasswordValid = passwordForm.strength >= 4 && passwordsMatch;

  const passwordCriteria = {
    length: passwordForm.newPassword.length >= 8,
    uppercase: /[A-Z]/.test(passwordForm.newPassword),
    number: /[0-9]/.test(passwordForm.newPassword),
    special: /[^A-Za-z0-9]/.test(passwordForm.newPassword),
  };

  // Charger les données
  useEffect(() => {
    if (!isUserLoaded || !clerkUser) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const token = await getToken();

        // Récupérer le profil
        const profileRes = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const data = await profileRes.json();
          const user = data.user || data;
          setPreferredLocale(user.preferredLocale || currentLocale);
        }

        // Récupérer les sessions
        const sessionsRes = await fetch("/api/users/sessions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (sessionsRes.ok) {
          const data = await sessionsRes.json();
          setSecurity({ sessions: data.sessions || [] });
        }

        // Récupérer les préférences de notification
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
        toast.error("Erreur lors du chargement des paramètres");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clerkUser, getToken, isUserLoaded, currentLocale]);

  const updateLanguage = async (locale: string) => {
    if (locale === currentLocale) return;

    const previousLocale = currentLocale;
    setPreferredLocale(locale);

    try {
      const token = await getToken();
      const response = await fetch("/api/users/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          preferredLocale: locale,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la mise à jour");
      }

      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
      const pathWithoutLocale = pathname.replace(`/${currentLocale}`, "") || "/";
      router.push(`/${locale}${pathWithoutLocale}`);
      toast.success("Langue mise à jour avec succès");
    } catch (error: any) {
      setPreferredLocale(previousLocale);
      toast.error(error.message || "Erreur lors du changement de langue");
      throw error;
    }
  };

  const changePassword = async () => {
    if (!passwordForm.currentPassword) {
      toast.error("Veuillez entrer votre mot de passe actuel");
      throw new Error("Mot de passe actuel requis");
    }

    if (!isPasswordValid) {
      toast.error("Le nouveau mot de passe n'est pas assez fort");
      throw new Error("Mot de passe trop faible");
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      throw new Error("Mots de passe différents");
    }

    setPasswordForm((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const token = await getToken();
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
        throw new Error(data.error || data.message || "Erreur lors du changement");
      }
    } catch (error: any) {
      setPasswordForm((prev) => ({
        ...prev,
        isSubmitting: false,
        currentPassword: "",
      }));
      toast.error(error.message || "Erreur lors du changement de mot de passe");
      throw error;
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const token = await getToken();
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
      toast.error(error.message || "Erreur lors de la révocation");
      throw error;
    }
  };

  const exportUserData = async (format: "csv" | "json") => {
    setIsExporting(true);

    try {
      const token = await getToken();
      const response = await fetch(`/api/users/export?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'exportation");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nesthub_export_${format}.${format === "csv" ? "csv" : "json"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Données exportées avec succès au format ${format.toUpperCase()}`);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'exportation");
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const deactivateAccount = async () => {
    setIsDeactivating(true);

    try {
      const token = await getToken();
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
      toast.error(error.message || "Erreur lors de la désactivation");
      throw error;
    } finally {
      setIsDeactivating(false);
    }
  };

  const toggleNotificationCategory = async (categoryId: string) => {
    const newCategories = notificationCategories.map((cat) =>
      cat.id === categoryId ? { ...cat, enabled: !cat.enabled } : cat
    );
    setNotificationCategories(newCategories);

    try {
      const token = await getToken();
      const preferences: Record<string, boolean> = {};
      newCategories.forEach((cat) => {
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
      // Revert
      setNotificationCategories(notificationCategories);
    }
  };

  const updateQuietHours = async (start: string, end: string) => {
    setQuietHours({ start, end });

    try {
      const token = await getToken();
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
      toast.error(error.message || "Erreur lors de la mise à jour");
      throw error;
    }
  };

  return {
    loading,
    security,
    passwordForm,
    passwordCriteria,
    theme,
    setTheme,
    updateLanguage,
    changePassword,
    revokeSession,
    setPasswordForm,
    updatePasswordStrength,
    passwordsMatch,
    isPasswordValid,
    exportUserData,
    isExporting,
    deactivateAccount,
    isDeactivating,
    notificationCategories,
    quietHours,
    toggleNotificationCategory,
    updateQuietHours,
    preferredLocale,
  };
}