// hooks/useSettings.ts
import { useState, useEffect, useCallback } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";

export function useSettings() {
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // État du profil
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    profilePictureUrl: null as string | null,
    preferredLocale: currentLocale, // Initialize with current URL locale
  });

  // État de sécurité
  const [security, setSecurity] = useState({
    sessions: [] as any[],
  });

  // État mode vacances
  const [vacation, setVacation] = useState({
    enabled: false,
    message: "",
  });

  // État du formulaire mot de passe
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
    setPasswordForm((prev) => ({
      ...prev,
      strength: calculateStrength(password),
    }));
  };

  const passwordsMatch =
    passwordForm.newPassword === passwordForm.confirmPassword &&
    passwordForm.newPassword !== "";
  const isPasswordValid = passwordForm.strength >= 4 && passwordsMatch;

  const getStrengthLabel = () => {
    const strength = passwordForm.strength;
    if (strength === 1) return { text: "Faible", color: "text-red-500" };
    if (strength === 2) return { text: "Moyen", color: "text-orange-500" };
    if (strength === 3) return { text: "Bon", color: "text-yellow-500" };
    if (strength >= 4) return { text: "Fort", color: "text-green-500" };
    return { text: "Faible", color: "text-red-500" };
  };

  // Charger les données utilisateur
  useEffect(() => {
    if (!isUserLoaded || !clerkUser) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const token = await getToken({ template: "my-app-template" });

        // Récupérer le profil
        const profileRes = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const data = await profileRes.json();
          const user = data.user || data;
          setProfile({
            firstName: user.firstName || clerkUser.firstName || "",
            lastName: user.lastName || clerkUser.lastName || "",
            email:
              user.email || clerkUser.emailAddresses[0]?.emailAddress || "",
            profilePictureUrl:
              user.profilePictureUrl || clerkUser.imageUrl || null,
            preferredLocale: user.preferredLocale || currentLocale, // Use DB value or current URL locale
          });
          setVacation({
            enabled: user.vacationMode || false,
            message: user.vacationMessage || "",
          });
        }

        // Récupérer les sessions
        const sessionsRes = await fetch("/api/users/sessions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (sessionsRes.ok) {
          const data = await sessionsRes.json();
          setSecurity((prev) => ({ ...prev, sessions: data.sessions || [] }));
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

  // Mettre à jour la langue avec next-intl
  const updateLanguage = async (locale: string) => {
    // Don't do anything if it's the same locale
    if (locale === currentLocale) return;

    setProfile((prev) => ({ ...prev, preferredLocale: locale }));

    try {
      const token = await getToken({ template: "my-app-template" });

      // Save to database
      await fetch("/api/users/update", {
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

      // Set cookie for next-intl
      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;

      // Remove the current locale from pathname and replace with new one
      const pathWithoutLocale = pathname.replace(`/${currentLocale}`, "");
      const newPath = pathWithoutLocale || "/";
      const fullNewPath = `/${locale}${newPath === "/" ? "" : newPath}`;

      // Redirect to the new locale URL
      router.push(fullNewPath);

      toast.success("Langue mise à jour");
    } catch (error) {
      console.error("Erreur mise à jour langue:", error);
      toast.error("Erreur lors de la mise à jour");
      // Revert profile locale on error
      setProfile((prev) => ({ ...prev, preferredLocale: currentLocale }));
    }
  };

  // Changer le mot de passe
  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;

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

      if (response.ok) {
        setPasswordForm((prev) => ({ ...prev, success: true }));
        toast.success("Mot de passe mis à jour avec succès !");
        setTimeout(() => {
          setPasswordForm({
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
        }, 3000);
      } else {
        const error = await response.json();
        toast.error(error.message || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Erreur changement mot de passe:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setPasswordForm((prev) => ({ ...prev, isSubmitting: false }));
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

      if (response.ok) {
        setVacation((prev) => ({ ...prev, enabled: !prev.enabled }));
        toast.success(
          vacation.enabled ? "Mode vacances désactivé" : "Mode vacances activé",
        );
      }
    } catch (error) {
      console.error("Erreur toggle vacation mode:", error);
      toast.error("Erreur lors de la modification");
    }
  };

  // Sauvegarder message vacances
  const saveVacationMessage = async () => {
    setSaving(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      await fetch("/api/users/vacation-mode", {
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
      toast.success("Message de vacances mis à jour");
    } catch (error) {
      console.error("Erreur sauvegarde message:", error);
      toast.error("Erreur lors de la sauvegarde");
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

      if (response.ok) {
        setSecurity((prev) => ({
          ...prev,
          sessions: prev.sessions.filter((s) => s.id !== sessionId),
        }));
        toast.success("Session révoquée");
      }
    } catch (error) {
      console.error("Erreur révocation session:", error);
      toast.error("Erreur lors de la révocation");
    }
  };

  return {
    loading,
    saving,
    profile,
    security,
    vacation,
    passwordForm,
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
  };
}
