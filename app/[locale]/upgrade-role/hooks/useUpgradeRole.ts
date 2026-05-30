// app/[locale]/upgrade-role/hooks/useUpgradeRole.ts
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";

export function useUpgradeRole(locale: string) {
  const t = useTranslations("UpgradeRole");
  const router = useRouter();
  const { user } = useUser();

  const [mounted, setMounted] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [loadingRole, setLoadingRole] = useState<"tenant" | "owner" | null>(
    null,
  );
  const [showDualModal, setShowDualModal] = useState(false);
  const [switcherActive, setSwitcherActive] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [isBoth, setIsBoth] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null,
  );

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return;
      try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const data = await res.json();
          const userData = data.user;
          setUserRole(userData.role);
          setIsBoth(userData.role === "BOTH");
          setProfilePictureUrl(userData.profilePictureUrl);
        }
      } catch (error) {
        console.error("Erreur vérification rôle:", error);
      }
    };
    checkUserRole();
  }, [user]);

  const handleSelect = useCallback(
    (role: "tenant" | "owner") => {
      localStorage.setItem("lastRole", role);
      setSelecting(true);
      setLoadingRole(role);
      setTimeout(() => {
        router.push(
          role === "tenant"
            ? `/${locale}/search`
            : `/${locale}/dashboard/owner`,
        );
      }, 1800);
    },
    [router, locale],
  );

  const handleSwitcherClick = async () => {
    if (isBoth) {
      setSwitcherActive(true);
      setTimeout(() => setShowDualModal(true), 200);
      return;
    }

    setUpgrading(true);
    try {
      const res = await fetch("/api/users/upgrade-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (res.ok) {
        setIsBoth(true);
        setUserRole("BOTH");
        showToast(t("toast.dualActivated"), "success");

        setTimeout(() => {
          setSwitcherActive(true);
          setShowDualModal(true);
        }, 500);
      } else {
        showToast(data.error || t("toast.activationError"), "error");
      }
    } catch (error) {
      showToast(t("toast.connectionError"), "error");
    } finally {
      setUpgrading(false);
    }
  };

  const handleModalNavigate = (role: "tenant" | "owner") => {
    setShowDualModal(false);
    handleSelect(role);
  };

  const handleModalClose = () => {
    setShowDualModal(false);
    setSwitcherActive(false);
  };

  return {
    // States
    mounted,
    selecting,
    loadingRole,
    showDualModal,
    switcherActive,
    upgrading,
    toast,
    userRole,
    isBoth,
    profilePictureUrl,
    // Functions
    showToast,
    handleSelect,
    handleSwitcherClick,
    handleModalNavigate,
    handleModalClose,
    t,
    user,
  };
}
