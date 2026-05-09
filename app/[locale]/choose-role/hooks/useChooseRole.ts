"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { useTheme } from "next-themes";

interface UserData {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinedYear: string;
  clerkId: string;
}

interface UseChooseRoleReturn {
  user: UserData | null;
  selected: "tenant" | "owner" | null;
  remember: boolean;
  transitioning: boolean;
  loading: boolean;
  submitting: boolean;
  showLogoutModal: boolean;
  isDark: boolean;
  setSelected: (role: "tenant" | "owner" | null) => void;
  setRemember: (value: boolean) => void;
  setShowLogoutModal: (value: boolean) => void;
  handleSelect: (role: "tenant" | "owner") => void;
  handleConfirm: () => Promise<void>;
  handleLogout: () => Promise<void>;
  handleCloseLogoutModal: () => void;
}

const pipAvatar = (url: string) =>
  `/api/users/avatar?url=${encodeURIComponent(url)}`;

export function useChooseRole(): UseChooseRoleReturn {
  const router = useRouter();
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [user, setUser] = useState<UserData | null>(null);
  const [selected, setSelected] = useState<"tenant" | "owner" | null>(null);
  const [remember, setRemember] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Charger les données utilisateur
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Utiliser Clerk si déjà connecté
        if (clerkUser) {
          const response = await fetch(`/api/users/by-clerk-id/${clerkUser.id}`);
          if (response.ok) {
            const userData = await response.json();
            const fullName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim();
            setUser({
              id: userData.id,
              name: fullName || userData.email.split("@")[0],
              email: userData.email,
              avatar: userData.profilePictureUrl || null,
              joinedYear: new Date(userData.createdAt).getFullYear().toString(),
              clerkId: userData.clerkId,
            });
            setLoading(false);
            return;
          }
        }
        
        // Fallback: récupérer depuis sessionStorage
        const email = sessionStorage.getItem("pendingLoginEmail");
        if (email) {
          const response = await fetch(`/api/users/by-email/${encodeURIComponent(email)}`);
          if (response.ok) {
            const userData = await response.json();
            const fullName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim();
            setUser({
              id: userData.id,
              name: fullName || userData.email.split("@")[0],
              email: userData.email,
              avatar: userData.profilePictureUrl || null,
              joinedYear: new Date(userData.createdAt).getFullYear().toString(),
              clerkId: userData.clerkId,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded) {
      fetchUserData();
    }
  }, [clerkUser, isLoaded]);

  // Vérifier l'authentification - NE PAS REDIRIGER VERS LOGIN si on a un email en attente
  useEffect(() => {
    if (!loading && isLoaded && !isSignedIn) {
      const email = sessionStorage.getItem("pendingLoginEmail");
      if (!email) {
        router.push("/login");
      }
    }
  }, [isLoaded, isSignedIn, router, loading]);

  const handleSelect = useCallback((role: "tenant" | "owner") => {
    setSelected((prev) => (prev === role ? null : role));
  }, []);

  // ✅ HANDLECONFIRM SIMPLIFIÉ - PAS D'APPEL API
  const handleConfirm = useCallback(async () => {
    if (!selected || !user) return;

    setSubmitting(true);
    
    try {
      // Nettoyer sessionStorage
      sessionStorage.removeItem("pendingLoginEmail");
      sessionStorage.removeItem("pendingLoginPassword");

      // Stocker le choix localement si remember
      if (remember) {
        localStorage.setItem("selectedRole", selected);
      }

      setTransitioning(true);
      
      setTimeout(() => {
        if (selected === "owner") {
          router.push("/dashboard/owner");
        } else {
          router.push("/search");
        }
      }, 3000);
    } catch (error) {
      console.error("Error:", error);
      setTransitioning(false);
    } finally {
      setSubmitting(false);
    }
  }, [selected, user, remember, router]);

  const handleLogout = useCallback(async () => {
    localStorage.removeItem("rememberMe");
    localStorage.removeItem("redirectAfterLogin");
    sessionStorage.clear();
    await signOut();
    router.push("/login");
  }, [signOut, router]);

  const handleCloseLogoutModal = useCallback(() => {
    setShowLogoutModal(false);
  }, []);

  const avatarUrl = useMemo(() => {
    if (user?.avatar && !avatarError) {
      if (user.avatar.includes('vercel-storage.com')) {
        return pipAvatar(user.avatar);
      }
      return user.avatar;
    }
    if (clerkUser?.imageUrl && !avatarError) {
      return clerkUser.imageUrl;
    }
    const name = user?.name || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=005cab&color=fff&bold=true&size=128&rounded=true`;
  }, [user, clerkUser, avatarError]);

  return {
    user: user ? { ...user, avatar: avatarUrl } : null,
    selected,
    remember,
    transitioning,
    loading,
    submitting,
    showLogoutModal,
    isDark,
    setSelected,
    setRemember,
    setShowLogoutModal,
    handleSelect,
    handleConfirm,
    handleLogout,
    handleCloseLogoutModal,
  };
}