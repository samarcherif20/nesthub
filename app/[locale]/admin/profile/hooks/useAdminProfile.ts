// hooks/useAdminProfile.ts
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";

interface AdminProfile {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  profilePictureUrl: string | null;
  role: string;
  status: string;
  createdAt: string;
  lastLogin: string | null;
  bio: string | null;
  preferredLocale?: string;
  stats?: {
    totalActions: number;
    actionsThisMonth: number;
    accessLevel: number;
  };
}

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

export function useAdminProfile() {
  const { getToken } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken({ template: "my-app-template" });
      if (!token) throw new Error("Token non disponible");

      // Récupérer le profil
      const profileRes = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!profileRes.ok) {
        throw new Error("Erreur chargement profil");
      }

      const profileData = await profileRes.json();
      const user = profileData.user || profileData;

      setProfile({
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        phoneNumber: user.phoneNumber || null,
        profilePictureUrl: user.profilePictureUrl || null,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin || null,
        bio: user.bio || null,
        preferredLocale: user.preferredLocale || "fr",
        stats: {
          totalActions: user.stats?.totalActions || 0,
          actionsThisMonth: user.stats?.actionsThisMonth || 0,
          accessLevel: user.stats?.accessLevel || 5,
        },
      });

      // Récupérer les vraies sessions
      const sessionsRes = await fetch("/api/users/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData.sessions || []);
      } else {
        console.warn("Impossible de charger les sessions");
        setSessions([]);
      }
    } catch (err) {
      console.error("fetchProfile error:", err);
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  const updateProfile = useCallback(
    async (data: Partial<AdminProfile>) => {
      setSaving(true);
      try {
        const token = await getToken({ template: "my-app-template" });
        if (!token) throw new Error("Token non disponible");

        const res = await fetch("/api/users/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: profile?.clerkId,
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: data.phoneNumber,
            bio: data.bio,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Erreur mise à jour");
        }

        setSuccess("Profil mis à jour avec succès");
        await fetchProfile();
        setTimeout(() => setSuccess(null), 3000);
        return true;
      } catch (err) {
        console.error("updateProfile error:", err);
        setError(err instanceof Error ? err.message : "Erreur");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [getToken, fetchProfile, profile?.clerkId],
  );

  const updatePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      setSaving(true);
      try {
        const token = await getToken({ template: "my-app-template" });
        if (!token) throw new Error("Token non disponible");

        const res = await fetch("/api/users/change-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Erreur changement mot de passe");
        }

        setSuccess("Mot de passe mis à jour avec succès");
        setTimeout(() => setSuccess(null), 3000);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [getToken],
  );

  const updateAvatar = useCallback(
    async (file: File) => {
      setSaving(true);
      try {
        const token = await getToken({ template: "my-app-template" });
        if (!token) throw new Error("Token non disponible");

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/users/avatar", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Erreur upload avatar");
        }

        const data = await res.json();
        setSuccess("Photo de profil mise à jour avec succès");
        await fetchProfile();
        setTimeout(() => setSuccess(null), 3000);
        return data.profilePictureUrl;
      } catch (err) {
        console.error("updateAvatar error:", err);
        setError(err instanceof Error ? err.message : "Erreur upload avatar");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [getToken, fetchProfile],
  );

  const terminateSession = useCallback(
    async (sessionId: string) => {
      try {
        const token = await getToken({ template: "my-app-template" });
        if (!token) throw new Error("Token non disponible");

        const res = await fetch(`/api/users/sessions/${sessionId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Erreur terminaison session");
        }

        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        setSuccess("Session terminée");
        setTimeout(() => setSuccess(null), 3000);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur");
        return false;
      }
    },
    [getToken],
  );

  const terminateAllSessions = useCallback(async () => {
    try {
      const token = await getToken({ template: "my-app-template" });
      if (!token) throw new Error("Token non disponible");

      const res = await fetch("/api/users/sessions", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur terminaison sessions");
      }

      setSessions((prev) => prev.filter((s) => s.isCurrent));
      setSuccess("Toutes les autres sessions sont terminées");
      setTimeout(() => setSuccess(null), 3000);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      return false;
    }
  }, [getToken]);

  const updateLanguage = useCallback(
    async (locale: string) => {
      setSaving(true);
      try {
        const token = await getToken({ template: "my-app-template" });

        const response = await fetch("/api/users/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: profile?.clerkId,
            preferredLocale: locale,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erreur lors de la mise à jour");
        }

        document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
        const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, "");
        router.push(`/${locale}${pathWithoutLocale || "/admin/profile"}`);

        setSuccess("Langue mise à jour avec succès");
        setTimeout(() => setSuccess(null), 3000);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [getToken, profile?.clerkId, pathname, router],
  );

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  }, [theme, setTheme]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    sessions,
    loading,
    saving,
    error,
    success,
    setError,
    updateProfile,
    updatePassword,
    updateAvatar,
    terminateSession,
    terminateAllSessions,
    updateLanguage,
    toggleTheme,
    theme,
    setTheme,
    refresh: fetchProfile,
  };
}