"use client";
import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  Search,
  Heart,
  MessageCircle,
  CalendarDays,
  User,
  LogOut,
  Wallet,
  Star,
  Home,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  Menu,
  X,
  ShieldCheck,
  Sparkles,
  Compass,
  Repeat2,
  Building2,
  User2,
} from "lucide-react";
import { ChatDrawer } from "../chat/ChatDrawer";
import NotificationBell from "../notifications/NotificationBell";
import { useTheme } from "next-themes";
import { GoLaw } from "react-icons/go";

// ─── Types ───────────────────────────────────────────────────────────
interface TenantHeaderProps {
  onChatDrawerOpen?: () => void;
  isChatDrawerOpen?: boolean;
  onChatDrawerClose?: () => void;
}

// ─── Couleurs pour l'avatar ─────────────────────────────────────────
const avatarColors = [
  "bg-blue-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-violet-500",
  "bg-sky-500",
  "bg-cyan-500",
  "bg-emerald-500",
  "bg-teal-500",
];

// ─── Nav Items ───────────────────────────────────────────────────────
const NAV_ITEMS = [
  { labelKey: "explorer", href: "/search", icon: Search },
  { labelKey: "favorites", href: "/favorites", icon: Heart },
  { labelKey: "messages", href: "/messages", icon: MessageCircle },
  { labelKey: "reservations", href: "/reservations", icon: CalendarDays },
];

// ─── Helper pour détecter le rôle basé sur l'URL ────────────────────
function detectRoleFromPath(
  pathname: string,
): "TENANT" | "PROPERTY_OWNER" | null {
  if (!pathname) return null;

  // Patterns pour propriétaire (vérifier d'abord car plus spécifiques)
  if (
    pathname.includes("/dashboard/owner") ||
    pathname.includes("/owner/") ||
    pathname.includes("/properties") ||
    pathname.includes("/earnings") ||
    pathname.includes("/owner-analytics")
  ) {
    return "PROPERTY_OWNER";
  }

  // Patterns pour locataire
  if (
    pathname.includes("/search") ||
    pathname.includes("/favorites") ||
    pathname.includes("/reservations") ||
    pathname.includes("/tenant/") ||
    pathname === "/fr" ||
    pathname === "/"
  ) {
    return "TENANT";
  }

  return null;
}

// ─── Custom Hook for Role Management ──────────────────────────────
function useRoleManagement(isSignedIn: boolean, pathname: string) {
  const [currentRole, setCurrentRole] = useState<"TENANT" | "PROPERTY_OWNER">(
    "TENANT",
  );
  const [hasBothRoles, setHasBothRoles] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);

  // Détecter le rôle depuis l'URL
  const roleFromUrl = detectRoleFromPath(pathname);

  // Fonction pour récupérer le rôle actuel depuis l'API
  const fetchCurrentRole = useCallback(
    async (silent: boolean = false) => {
      if (!isSignedIn) return null;

      if (!silent) {
        console.log("🔄 Synchronisation du rôle...");
      }

      try {
        const response = await fetch("/api/users/switch-role", {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setHasBothRoles(data.canSwitch);

          let newRole = data.activeRole as "TENANT" | "PROPERTY_OWNER";

          // PRIORITÉ ABSOLUE à l'URL
          if (roleFromUrl) {
            newRole = roleFromUrl;
            console.log(
              `📍 Rôle FORCÉ par l'URL: ${newRole} (pathname: ${pathname})`,
            );
          }

          if (newRole !== currentRole) {
            console.log(`✨ Rôle changé: ${currentRole} -> ${newRole}`);
            setCurrentRole(newRole);
            localStorage.setItem("userRole", newRole);
            sessionStorage.setItem("currentRole", newRole);

            window.dispatchEvent(
              new CustomEvent("role-changed", {
                detail: { role: newRole, hasBothRoles: data.canSwitch },
              }),
            );
          }

          retryCountRef.current = 0;
          return { role: newRole, hasBoth: data.canSwitch };
        }
      } catch (error) {
        console.error("❌ Erreur:", error);
        retryCountRef.current++;
        if (retryCountRef.current < 5) {
          const delay = Math.min(
            1000 * Math.pow(2, retryCountRef.current),
            30000,
          );
          setTimeout(() => fetchCurrentRole(true), delay);
        }
      }
      return null;
    },
    [isSignedIn, currentRole, roleFromUrl, pathname],
  );

  // FORCER la mise à jour quand l'URL change
  useEffect(() => {
    if (roleFromUrl && isSignedIn && roleFromUrl !== currentRole) {
      console.log(`🔄 URL changée: ${currentRole} -> ${roleFromUrl}`);
      setCurrentRole(roleFromUrl);
      localStorage.setItem("userRole", roleFromUrl);
      sessionStorage.setItem("currentRole", roleFromUrl);

      // Notifier l'API
      if (hasBothRoles) {
        fetch("/api/users/switch-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetRole: roleFromUrl }),
        }).catch(console.error);
      }
    }
  }, [roleFromUrl, pathname, isSignedIn, currentRole, hasBothRoles]);

  // Initialisation
  useEffect(() => {
    if (!isSignedIn) return;
    fetchCurrentRole();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "userRole" && e.newValue && !roleFromUrl) {
        const newRole = e.newValue as "TENANT" | "PROPERTY_OWNER";
        if (newRole !== currentRole) setCurrentRole(newRole);
      }
    };

    const handleCustomRoleChange = (e: CustomEvent) => {
      if (e.detail?.role && e.detail.role !== currentRole && !roleFromUrl) {
        setCurrentRole(e.detail.role);
        if (e.detail.hasBothRoles !== undefined)
          setHasBothRoles(e.detail.hasBothRoles);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "role-changed",
      handleCustomRoleChange as EventListener,
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "role-changed",
        handleCustomRoleChange as EventListener,
      );
    };
  }, [isSignedIn, fetchCurrentRole, currentRole, roleFromUrl]);

  const switchRole = useCallback(
    async (targetRole: "TENANT" | "PROPERTY_OWNER") => {
      if (!isSignedIn || isSwitching) return false;
      setIsSwitching(true);

      try {
        const response = await fetch("/api/users/switch-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetRole }),
        });

        if (response.ok) {
          setCurrentRole(targetRole);
          localStorage.setItem("userRole", targetRole);
          sessionStorage.setItem("currentRole", targetRole);
          window.dispatchEvent(
            new CustomEvent("role-changed", {
              detail: { role: targetRole, hasBothRoles },
            }),
          );
          return true;
        }
        return false;
      } catch (error) {
        console.error("❌ Erreur:", error);
        return false;
      } finally {
        setIsSwitching(false);
      }
    },
    [isSignedIn, isSwitching, hasBothRoles],
  );

  return {
    currentRole,
    hasBothRoles,
    switchRole,
    isSwitching,
    refreshRole: () => fetchCurrentRole(false),
  };
}

// ─── Role Badge Component ───────────────────────────────────────────
function RoleBadge({ role, t }: { role: "TENANT" | "PROPERTY_OWNER"; t: any }) {
  if (role === "PROPERTY_OWNER") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200/30 dark:border-emerald-800/30">
        <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
          {t("role.ownerBadge") || "Propriétaire"}
        </span>
      </div>
    );
  }

 
}

// ─── Role Switcher Component ────────────────────────────────────────
function RoleSwitcher({
  currentRole,
  hasBothRoles,
  onSwitch,
  isSwitching,
  t,
}: any) {
  const [isHovered, setIsHovered] = useState(false);
  if (!hasBothRoles) return null;

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={onSwitch}
        disabled={isSwitching}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-sky-500/10 hover:from-violet-500/20 hover:via-indigo-500/20 hover:to-sky-500/20 border border-violet-200/30 dark:border-violet-800/30 transition-all duration-300"
      >
        <div className="flex items-center gap-1.5">
          {currentRole === "TENANT" ? (
            <User2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          ) : (
            <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          )}
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {currentRole === "TENANT" ? t("role.tenant") : t("role.owner")}
          </span>
        </div>
        <div
          className={`w-6 h-6 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center transition-all duration-500 ${isHovered && !isSwitching ? "rotate-180" : ""}`}
        >
          {isSwitching ? (
            <div className="w-3 h-3 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Repeat2 className="w-3 h-3 text-violet-500" />
          )}
        </div>
      </button>
      <div
        className={`absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-medium rounded shadow-lg whitespace-nowrap transition-all duration-200 pointer-events-none ${isHovered ? "opacity-100 visible" : "opacity-0 invisible"}`}
      >
        {isSwitching ? t("role.switching") : t("role.switchTooltip")}
      </div>
    </div>
  );
}

// ─── User Menu Dropdown ──────────────────────────────────────────────
function UserMenu({
  user,
  appUser,
  avatarColor,
  getAvatarUrl,
  onClose,
  onLogout,
  t,
  notificationsMuted,
  onToggleMute,
  hasBothRoles,
  currentRole,
  onRoleSwitch,
  isSwitchingRole,
}: any) {
  const { setTheme, theme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const [dark, setDark] = useState(theme === "dark");

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  useEffect(() => {
    setDark(theme === "dark");
  }, [theme]);

  const menuItems =
    currentRole === "PROPERTY_OWNER"
      ? [
          { labelKey: "dashboard", icon: Home, href: "/dashboard/owner" },
          { labelKey: "properties", icon: Building2, href: "/properties" },
          { labelKey: "bookings", icon: CalendarDays, href: "/bookings" },
          { labelKey: "earnings", icon: Wallet, href: "/earnings" },
          { labelKey: "reviews", icon: Star, href: "/reviews" },
          { labelKey: "disputes", icon: GoLaw, href: "/disputes" },
        ]
      : [
          { labelKey: "profile", icon: User, href: "/tenant/profile" },
          {
            labelKey: "reservations",
            icon: CalendarDays,
            href: "/reservations",
          },
          { labelKey: "wallet", icon: Wallet, href: "/wallet" },
          { labelKey: "reviews", icon: Star, href: "/reviews" },
          { labelKey: "disputes", icon: GoLaw, href: "/disputes" },
        ];

  const displayName =
    appUser?.username || user?.username || user?.firstName || "User";
  const initial = displayName.charAt(0).toUpperCase();
  const avatarUrl = getAvatarUrl();

  return (
    <div
      ref={ref}
      className="absolute right-0 top-[calc(100%+12px)] w-80 animate-in fade-in zoom-in-95 duration-200 z-[60]"
    >
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/10 border border-white/20 dark:border-gray-700/50 overflow-hidden">
        <div className="relative p-5 pb-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-sky-500/10" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-sky-500 p-[2px] shadow-lg shadow-violet-500/20 flex-shrink-0">
                <div className="w-full h-full rounded-[14px] bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-full h-full ${avatarColor} flex items-center justify-center text-white font-bold text-xl`}
                    >
                      {initial}
                    </div>
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
                  {displayName}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.emailAddresses?.[0]?.emailAddress || "user@email.com"}
                </p>
              </div>
            </div>
            <RoleBadge role={currentRole} t={t} />
          </div>
        </div>

        {hasBothRoles && (
          <div className="px-4 pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 rounded-xl p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-2">
                {t("role.switchTo")}
              </p>
              <button
                onClick={() => {
                  onRoleSwitch();
                  onClose();
                }}
                disabled={isSwitchingRole}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  {currentRole === "TENANT" ? (
                    <>
                      <Building2 className="w-5 h-5 text-emerald-500" />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {t("role.ownerMode")}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {t("role.ownerDesc")}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <User2 className="w-5 h-5 text-violet-500" />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {t("role.tenantMode")}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {t("role.tenantDesc")}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  {isSwitchingRole ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Repeat2 className="w-4 h-4 text-white" />
                  )}
                </div>
              </button>
            </div>
          </div>
        )}

        <div className="px-2 pb-2">
          {menuItems.map((item: any) => (
            <Link
              key={item.labelKey}
              href={`/fr${item.href}`}
              onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:text-violet-700 dark:hover:text-violet-300 transition-all duration-150 group"
            >
              <item.icon className="w-4 h-4 text-gray-400 group-hover:text-violet-500 transition-colors" />
              <span>{t(`menu.${item.labelKey}`)}</span>
            </Link>
          ))}
        </div>

        <div className="px-2 pb-2 border-t border-gray-100 dark:border-gray-800 pt-2">
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl">
            <div className="flex items-center gap-3">
              {notificationsMuted ? (
                <Bell className="w-4 h-4 text-gray-400" />
              ) : (
                <Bell className="w-4 h-4 text-indigo-500" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {notificationsMuted
                  ? t("notifications.muted")
                  : t("notifications.active")}
              </span>
            </div>
            <button
              onClick={() => {
                onToggleMute();
                onClose();
              }}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${notificationsMuted ? "bg-gray-300 dark:bg-gray-600" : "bg-indigo-500"}`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${notificationsMuted ? "left-1" : "right-1"}`}
              />
            </button>
          </div>

          <button
            onClick={() => {
              setTheme(theme === "dark" ? "light" : "dark");
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            {dark ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
            <span>{dark ? t("theme.light") : t("theme.dark")}</span>
          </button>

          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all group"
          >
            <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            <span>{t("menu.logout")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile Menu ─────────────────────────────────────────────────────
function MobileMenu({
  isOpen,
  onClose,
  isSignedIn,
  user,
  appUser,
  avatarColor,
  getAvatarUrl,
  onNavigate,
  onLogout,
  onLogin,
  t,
  hasBothRoles,
  currentRole,
  onRoleSwitch,
  isSwitchingRole,
}: any) {
  if (!isOpen) return null;

  const displayName =
    appUser?.username || user?.username || user?.firstName || "User";
  const initial = displayName.charAt(0).toUpperCase();
  const avatarUrl = getAvatarUrl();

  return (
    <div className="fixed inset-0 z-[100] md:hidden">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute top-20 left-4 right-4 animate-in slide-in-from-top-4 fade-in duration-300">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
          {isSignedIn && (
            <div className="p-5 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-sky-500 p-[2px]">
                  <div className="w-full h-full rounded-[14px] bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-full ${avatarColor} flex items-center justify-center text-white font-bold text-lg`}
                      >
                        {initial}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">
                    {displayName}
                  </p>
                </div>
              </div>
              <RoleBadge role={currentRole} t={t} />
            </div>
          )}

          {hasBothRoles && (
            <div className="mx-4 mt-3 mb-2 p-3 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 rounded-xl">
              <button
                onClick={() => {
                  onRoleSwitch();
                  onClose();
                }}
                disabled={isSwitchingRole}
                className="w-full flex items-center justify-between disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  {currentRole === "TENANT" ? (
                    <>
                      <Building2 className="w-5 h-5 text-emerald-500" />
                      <div className="text-left">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                          {t("role.switchToOwner")}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <User2 className="w-5 h-5 text-violet-500" />
                      <div className="text-left">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                          {t("role.switchToTenant")}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 flex items-center justify-center">
                  {isSwitchingRole ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Repeat2 className="w-4 h-4 text-white" />
                  )}
                </div>
              </button>
            </div>
          )}

          <div className="p-3">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.labelKey}
                onClick={() => {
                  onNavigate(item.href);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all"
              >
                <item.icon className="w-5 h-5 text-gray-400" />
                <span>{t(item.labelKey)}</span>
              </button>
            ))}
          </div>

          <div className="p-3 pt-0 border-t border-gray-100 dark:border-gray-800 mt-1">
            {isSignedIn ? (
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span>{t("menu.logout")}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onLogin();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t("login")}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Logout Modal ─────────────────────────────────────────────────────
function LogoutModal({ isOpen, onClose, onConfirm, t }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl p-6 text-center border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 fade-in duration-200">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
          <LogOut className="text-2xl text-rose-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {t("logout.confirm")}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {t("logout.message")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm transition-colors"
          >
            {t("logout.cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm shadow-lg shadow-rose-600/20 transition-colors"
          >
            {t("logout.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main TenantHeader ───────────────────────────────────────────────
export function TenantHeader({}: TenantHeaderProps) {
  const t = useTranslations("TenantHeader");
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const pathname = usePathname();
  const router = useRouter();

  const {
    currentRole,
    hasBothRoles,
    switchRole,
    isSwitching: isSwitchingRole,
    refreshRole,
  } = useRoleManagement(isSignedIn || false, pathname || "");

  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localMessengerOpen, setLocalMessengerOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notificationsMuted, setNotificationsMuted] = useState(false);
  const [appUser, setAppUser] = useState<any>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [loading, setLoading] = useState(true);

  const avatarColor = React.useMemo(
    () => avatarColors[Math.floor(Math.random() * avatarColors.length)],
    [],
  );

  const handleRoleSwitch = useCallback(async () => {
    const newRole = currentRole === "TENANT" ? "PROPERTY_OWNER" : "TENANT";
    const success = await switchRole(newRole);
    if (success) {
      refreshRole();
      if (newRole === "PROPERTY_OWNER") router.push("/fr/dashboard/owner");
      else router.push("/fr/search");
    }
  }, [currentRole, switchRole, router, refreshRole]);

  useEffect(() => {
    const savedMuted = localStorage.getItem("notificationsMuted");
    if (savedMuted !== null) setNotificationsMuted(JSON.parse(savedMuted));
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isSignedIn || !user) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch("/api/users/me");
        if (response.ok) {
          const data = await response.json();
          setAppUser(data.user);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [isSignedIn, user, currentRole]);

  const loadFavorites = useCallback(async () => {
    if (!isSignedIn || currentRole !== "TENANT") {
      setFavoritesCount(0);
      return;
    }
    try {
      const response = await fetch("/api/users/favorites");
      if (response.ok) {
        const data = await response.json();
        let favoriteList =
          data.success && data.favorites
            ? data.favorites
            : Array.isArray(data)
              ? data
              : data.favorites || [];
        setFavoritesCount(favoriteList.length);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }, [isSignedIn, currentRole]);

  useEffect(() => {
    loadFavorites();
  }, [isSignedIn, loadFavorites, currentRole]);

  useEffect(() => {
    const handleFavoritesUpdate = () => loadFavorites();
    window.addEventListener("favorites-updated", handleFavoritesUpdate);
    return () =>
      window.removeEventListener("favorites-updated", handleFavoritesUpdate);
  }, [loadFavorites]);

  useEffect(() => {
    setAvatarError(false);
  }, [appUser?.profilePictureUrl, user?.imageUrl]);

  const getAvatarUrl = () => {
    if (appUser?.profilePictureUrl && !avatarError)
      return `/api/users/avatar?url=${encodeURIComponent(appUser.profilePictureUrl)}`;
    if (user?.imageUrl && !avatarError) return user.imageUrl;
    return null;
  };

  const displayName =
    appUser?.username || user?.username || user?.firstName || "Utilisateur";
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const res = await fetch("/api/conversations/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count ?? 0);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (isSignedIn) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isSignedIn, fetchUnreadCount]);

  const toggleMuteNotifications = useCallback(async () => {
    const newMutedState = !notificationsMuted;
    setNotificationsMuted(newMutedState);
    localStorage.setItem("notificationsMuted", JSON.stringify(newMutedState));
    try {
      await fetch("/api/users/notification-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ muted: newMutedState }),
      });
    } catch (error) {
      console.error("Erreur:", error);
    }
  }, [notificationsMuted]);

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    refreshRole();
  }, [pathname, refreshRole]);

  const handleNavigate = useCallback(
    (href: string) => router.push(`/fr${href}`),
    [router],
  );
  const handleLogout = async () => {
    await signOut();
    router.push("/fr/login");
  };
  const isActive = (href: string) => {
    const fullHref = `/fr${href}`;
    return fullHref === "/fr/search"
      ? pathname === "/fr/search" || pathname === "/fr"
      : pathname?.startsWith(fullHref);
  };
  const getBadge = (href: string) => {
    if (href === "/favorites") return favoritesCount;
    if (href === "/messages") return unreadCount;
    return 0;
  };

  if (!mounted || loading)
    return (
      <div className="fixed top-0 w-full z-50 h-20 bg-white dark:bg-gray-900" />
    );

  return (
    <>
      {!isMobile ? (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-3 px-3 md:px-6">
          <header
            className={`relative w-full max-w-7xl rounded-[20px] transition-all duration-500 ease-out ${scrolled ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl shadow-lg shadow-black/5 border border-white/30 dark:border-gray-700/30 scale-[0.98]" : "bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-md shadow-black/5 border border-white/20 dark:border-gray-700/20"}`}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[3px] rounded-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-70" />
            {scrolled && (
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
            )}
            <div className="flex items-center justify-between h-14 md:h-16 px-3 md:px-5">
              <Link
                href={
                  currentRole === "PROPERTY_OWNER"
                    ? "/fr/dashboard/owner"
                    : "/fr/search"
                }
                className="flex items-center gap-2 group flex-shrink-0"
              >
                <div className="relative w-10 h-10 md:w-12 md:h-12 scale-380 mt-5">
                  <Image
                    src="/logo/logo.png"
                    alt="NESTHUB"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <span className="hidden sm:block text-base md:text-2xl font-extrabold tracking-tight">
                  <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent">
                    N E S T H U B
                  </span>
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(item.href);
                  const badge = getBadge(item.href);
                  return (
                    <button
                      key={item.href}
                      onClick={() => handleNavigate(item.href)}
                      className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 ${active ? "bg-violet-100/80 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300" : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-white/5"}`}
                    >
                      <item.icon
                        className={`w-4 h-4 ${active ? "text-violet-600 dark:text-violet-400" : ""}`}
                        strokeWidth={active ? 2.5 : 2}
                      />
                      <span>{t(item.labelKey)}</span>
                      {badge > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center text-[9px] font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 rounded-full px-1 shadow-sm shadow-rose-500/30">
                          {badge > 9 ? "9+" : badge}
                        </span>
                      )}
                      {active && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                <RoleSwitcher
                  currentRole={currentRole}
                  hasBothRoles={hasBothRoles}
                  onSwitch={handleRoleSwitch}
                  isSwitching={isSwitchingRole}
                  t={t}
                />
                <RoleBadge role={currentRole} t={t} />
                <button
                  onClick={() => setLocalMessengerOpen(true)}
                  className="relative w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all duration-200 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  <MessageCircle
                    className="w-[18px] h-[18px]"
                    strokeWidth={2}
                  />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center text-[9px] font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 rounded-full px-1 shadow-sm shadow-rose-500/30">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                <NotificationBell muted={notificationsMuted} />
                <div className="hidden md:block w-px h-5 bg-gray-200 dark:bg-gray-700" />

                {isSignedIn ? (
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl transition-all duration-200 ${userMenuOpen ? "bg-violet-100 dark:bg-violet-500/15" : "hover:bg-gray-100 dark:hover:bg-white/5"}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 via-indigo-500 to-sky-500 p-[1.5px] shadow-sm shadow-violet-500/15">
                        <div className="w-full h-full rounded-[7px] bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                          {getAvatarUrl() ? (
                            <img
                              src={getAvatarUrl()!}
                              alt={displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className={`w-full h-full ${avatarColor} flex items-center justify-center text-white font-bold text-xs`}
                            >
                              {initial}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {displayName}
                      </span>
                      <ChevronDown
                        className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {userMenuOpen && (
                      <UserMenu
                        user={user}
                        appUser={appUser}
                        avatarColor={avatarColor}
                        getAvatarUrl={getAvatarUrl}
                        onClose={() => setUserMenuOpen(false)}
                        onLogout={() => {
                          setUserMenuOpen(false);
                          setShowLogoutModal(true);
                        }}
                        t={t}
                        notificationsMuted={notificationsMuted}
                        onToggleMute={toggleMuteNotifications}
                        hasBothRoles={hasBothRoles}
                        currentRole={currentRole}
                        onRoleSwitch={handleRoleSwitch}
                        isSwitchingRole={isSwitchingRole}
                      />
                    )}
                  </div>
                ) : (
                  <Link
                    href="/fr/login"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 hover:shadow-lg hover:shadow-violet-500/25 active:scale-[0.97] transition-all duration-200 shadow-md shadow-violet-500/15"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t("login")}</span>
                  </Link>
                )}
              </div>
            </div>
          </header>
        </div>
      ) : (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-3 px-3">
          {/* Mobile header simplifié */}
          <header className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[20px] shadow-md border border-white/20 dark:border-gray-700/20">
            <div className="flex items-center justify-between h-14 px-4">
              <Link
                href={
                  currentRole === "PROPERTY_OWNER"
                    ? "/fr/dashboard/owner"
                    : "/fr/search"
                }
                className="flex items-center gap-2"
              >
                <div className="relative w-8 h-8">
                  <Image
                    src="/logo/logo.png"
                    alt="NESTHUB"
                    fill
                    className="object-contain"
                  />
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <RoleBadge role={currentRole} t={t} />
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 flex items-center justify-center text-white shadow-lg"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>
        </div>
      )}

      {!isMobile && <div className="h-20 md:h-24" />}

      <ChatDrawer
        isOpen={localMessengerOpen}
        onClose={() => setLocalMessengerOpen(false)}
        userRole={currentRole}
      />
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isSignedIn={isSignedIn}
        user={user}
        appUser={appUser}
        avatarColor={avatarColor}
        getAvatarUrl={getAvatarUrl}
        onNavigate={handleNavigate}
        onLogout={() => setShowLogoutModal(true)}
        onLogin={() => router.push("/fr/login")}
        t={t}
        hasBothRoles={hasBothRoles}
        currentRole={currentRole}
        onRoleSwitch={handleRoleSwitch}
        isSwitchingRole={isSwitchingRole}
      />
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        t={t}
      />
    </>
  );
}
