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
  Settings,
  Wallet,
  Star,
  Grid3X3,
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

// ─── Nav Items ───────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: "Explorer", href: "/search", icon: Search },
  { label: "Favorites", href: "/favorites", icon: Heart },
  { label: "Messages", href: "/messages", icon: MessageCircle },
  { label: "Reservations", href: "/reservations", icon: CalendarDays },
];

// ─── Couleurs pour l'avatar (comme dans OwnerLayout) ─────────────────
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

// ─── Circular Orbit Component ───────────────────────────────────────
function CircularOrbitMenu({
  isOpen,
  onToggle,
  onNavigate,
  activeTab,
  favoritesCount,
  unreadCount,
  themePreset,
}: {
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: (href: string) => void;
  activeTab: string;
  favoritesCount: number;
  unreadCount: number;
  themePreset: { accentColor: string };
}) {
  const menuItems = [
    { id: "explorer", label: "Explore", icon: <Compass className="w-5 h-5" />, angle: -25, href: "/search" },
    { id: "favorites", label: `Saved (${favoritesCount})`, icon: <Heart className="w-5 h-5" />, angle: 20, href: "/favorites" },
    { id: "messages", label: `Inbox (${unreadCount})`, icon: <MessageCircle className="w-5 h-5" />, angle: 65, href: "/messages" },
    { id: "reservations", label: "Bookings", icon: <CalendarDays className="w-5 h-5" />, angle: 110, href: "/reservations" },
  ];

  const getPositionStyles = (angle: number) => {
    if (!isOpen) return { transform: "translate(0px, 0px)", opacity: 0, pointerEvents: "none" as const };
    const radius = 85;
    const radians = (angle * Math.PI) / 180;
    const x = radius * Math.cos(radians);
    const y = radius * Math.sin(radians);
    return {
      transform: `translate(${x}px, ${y}px)`,
      opacity: 1,
      pointerEvents: "auto" as const,
    };
  };

  return (
    <div className="fixed top-8 left-8 z-[100]">
      <div className="relative flex items-center justify-center">
        {menuItems.map((item, idx) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.href);
                onToggle();
              }}
              className={`absolute w-12 h-12 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-350 transform group ${
                isActive
                  ? "text-white"
                  : "bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm text-gray-700 dark:text-gray-200 border border-violet-200/30 dark:border-violet-800/30"
              }`}
              style={{
                ...getPositionStyles(item.angle),
                backgroundColor: isActive ? '#8b5cf6' : undefined,
                transitionDelay: isOpen ? `${idx * 40}ms` : "0ms",
              }}
            >
              {item.icon}
              <span className="absolute bottom-full mb-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {item.label}
              </span>
            </button>
          );
        })}

        <button
          onClick={onToggle}
          className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-105 active:scale-95 transition-all relative z-10"
          style={{
            background: `linear-gradient(135deg, #8b5cf6, #6366f1, #06b6d4)`,
          }}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          {unreadCount > 0 && !isOpen && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-bounce">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── User Menu Dropdown (version corrigée avec avatar comme OwnerLayout) ──
function UserMenu({
  user,
  appUser,
  avatarColor,
  getAvatarUrl,
  onClose,
  onLogout,
  t,
}: {
  user: any;
  appUser: any;
  avatarColor: string;
  getAvatarUrl: () => string | null;
  onClose: () => void;
  onLogout: () => void;
  t: any;
}) {
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

  const menuItems = [
    { label: t("menu.profile") || "Profile", icon: User, href: "/profile" },
    { label: t("menu.reservations") || "Reservations", icon: CalendarDays, href: "/reservations" },
    { label: t("menu.wallet") || "Wallet", icon: Wallet, href: "/wallet" },
    { label: t("menu.reviews") || "Reviews", icon: Star, href: "/reviews" },
    { label: t("menu.settings") || "Settings", icon: Settings, href: "/settings" },
    { label: t("menu.disputes") || "ligites", icon: GoLaw, href: "/disputes" },
  ];

  const displayName = appUser?.username || user?.username || user?.firstName || "User";
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
          <div className="relative flex items-center gap-3">
            {/* Avatar - comme dans OwnerLayout */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-sky-500 p-[2px] shadow-lg shadow-violet-500/20 flex-shrink-0">
              <div className="w-full h-full rounded-[14px] bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full ${avatarColor} flex items-center justify-center text-white font-bold text-xl`}>
                    {initial}
                  </div>
                )}
              </div>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
                {displayName}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.emailAddresses[0]?.emailAddress || "user@email.com"}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {t("verifiedTenant") || "Verified Tenant"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-2 pb-2">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={`/fr${item.href}`}
              onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:text-violet-700 dark:hover:text-violet-300 transition-all duration-150 group"
            >
              <item.icon className="w-4 h-4 text-gray-400 group-hover:text-violet-500 transition-colors" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="px-2 pb-2 border-t border-gray-100 dark:border-gray-800 pt-2">
          <button
            onClick={() => {
              const newTheme = theme === "dark" ? "light" : "dark";
              setTheme(newTheme);
              setDark(newTheme === "dark");
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            {dark ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
            <span>{dark ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all group"
          >
            <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            <span>{t("menu.logout") || "Sign Out"}</span>
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
}: {
  isOpen: boolean;
  onClose: () => void;
  isSignedIn?: boolean;
  user?: any;
  appUser?: any;
  avatarColor: string;
  getAvatarUrl: () => string | null;
  onNavigate: (href: string) => void;
  onLogout: () => void;
  onLogin: () => void;
  t: any;
}) {
  if (!isOpen) return null;

  const displayName = appUser?.username || user?.username || user?.firstName || "User";
  const initial = displayName.charAt(0).toUpperCase();
  const avatarUrl = getAvatarUrl();

  return (
    <div className="fixed inset-0 z-[100] md:hidden">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute top-20 left-4 right-4 animate-in slide-in-from-top-4 fade-in duration-300">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
          {isSignedIn && (
            <div className="p-5 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-sky-500 p-[2px]">
                  <div className="w-full h-full rounded-[14px] bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full ${avatarColor} flex items-center justify-center text-white font-bold text-lg`}>
                        {initial}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verified Tenant
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="p-3">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  onNavigate(item.href);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all"
              >
                <item.icon className="w-5 h-5 text-gray-400" />
                <span>{item.label}</span>
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
                <span>{t("menu.logout") || "Sign Out"}</span>
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
                <span>{t("login") || "Sign In"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Logout Modal ─────────────────────────────────────────────────────
function LogoutModal({
  isOpen,
  onClose,
  onConfirm,
  t,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  t: any;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl p-6 text-center border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 fade-in duration-200">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
          <LogOut className="text-2xl text-rose-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {t("logout.confirm") || "Se déconnecter ?"}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {t("logout.message") || "Êtes-vous sûr de vouloir vous déconnecter ?"}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm transition-colors"
          >
            {t("logout.cancel") || "Annuler"}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm shadow-lg shadow-rose-600/20 transition-colors"
          >
            {t("logout.confirm") || "Se déconnecter"}
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

  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orbitOpen, setOrbitOpen] = useState(false);
  const [localMessengerOpen, setLocalMessengerOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // États pour l'avatar (comme dans OwnerLayout)
  const [appUser, setAppUser] = useState<any>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Couleur aléatoire pour l'avatar (comme dans OwnerLayout)
  const avatarColor = React.useMemo(() => {
    const randomIndex = Math.floor(Math.random() * avatarColors.length);
    return avatarColors[randomIndex];
  }, []);

  // Récupérer les données utilisateur depuis la DB (comme dans OwnerLayout)
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
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [isSignedIn, user]);

  // Réinitialiser l'erreur d'avatar quand l'URL change
  useEffect(() => {
    setAvatarError(false);
  }, [appUser?.profilePictureUrl, user?.imageUrl]);

  // Fonction pour obtenir l'URL de l'avatar (comme dans OwnerLayout)
  const getAvatarUrl = () => {
    if (appUser?.profilePictureUrl && !avatarError)
      return `/api/users/avatar?url=${encodeURIComponent(appUser.profilePictureUrl)}`;
    if (user?.imageUrl && !avatarError) return user.imageUrl;
    return null;
  };

  // Nom d'affichage
  const displayName = appUser?.username || user?.username || user?.firstName || "Utilisateur";
  const initial = displayName.charAt(0).toUpperCase();

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("favorites");
    if (saved) setFavoritesCount(JSON.parse(saved).length);
    const updateFavs = () => {
      const s = localStorage.getItem("favorites");
      if (s) setFavoritesCount(JSON.parse(s).length);
    };
    window.addEventListener("favorites-updated", updateFavs);
    return () => window.removeEventListener("favorites-updated", updateFavs);
  }, []);

  useEffect(() => {
    fetch("/api/conversations/unread-count")
      .then((r) => r.json())
      .then((d) => setUnreadCount(d.count ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavigate = useCallback(
    (href: string) => {
      router.push(`/fr${href}`);
    },
    [router]
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

  const themePreset = { accentColor: "#8b5cf6" };

  if (!mounted || loading) {
    return (
      <>
        <div className="fixed top-0 w-full z-50 h-20 bg-white dark:bg-gray-900" />
        <div className="h-20" />
      </>
    );
  }

  return (
    <>
      {/* ── Desktop Floating Pill Header (hidden on mobile) ── */}
      {!isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-3 px-3 md:px-6">
          <header
            className={`
              relative w-full max-w-7xl rounded-[20px] transition-all duration-500 ease-out
              ${
                scrolled
                  ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl shadow-lg shadow-black/5 border border-white/30 dark:border-gray-700/30 scale-[0.98]"
                  : "bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-md shadow-black/5 border border-white/20 dark:border-gray-700/20"
              }
            `}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[3px] rounded-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-70" />
            {scrolled && (
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
            )}
            <div className="flex items-center justify-between h-14 md:h-16 px-3 md:px-5">
              {/* Logo */}
              <Link href="/fr/search" className="flex items-center gap-2 group flex-shrink-0">
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

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-1">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(item.href);
                  const badge = getBadge(item.href);

                  return (
                    <button
                      key={item.href}
                      onClick={() => handleNavigate(item.href)}
                      className={`
                        relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200
                        ${
                          active
                            ? "bg-violet-100/80 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-white/5"
                        }
                      `}
                    >
                      <item.icon
                        className={`w-4 h-4 ${active ? "text-violet-600 dark:text-violet-400" : ""}`}
                        strokeWidth={active ? 2.5 : 2}
                      />
                      <span>{item.label}</span>
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

              {/* Right Actions */}
              <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                {/* Messenger */}
                <button
                  onClick={() => setLocalMessengerOpen(true)}
                  className="relative w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all duration-200 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  <MessageCircle className="w-[18px] h-[18px]" strokeWidth={2} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center text-[9px] font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 rounded-full px-1 shadow-sm shadow-rose-500/30">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications */}
                <NotificationBell />

                {/* Separator */}
                <div className="hidden md:block w-px h-5 bg-gray-200 dark:bg-gray-700" />

                {/* User Menu with Avatar comme OwnerLayout */}
                {isSignedIn ? (
                  <div className="relative">
                    <button
                      onClick={() => {
                        setUserMenuOpen(!userMenuOpen);
                        setNotifOpen(false);
                      }}
                      className={`
                        flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl transition-all duration-200
                        ${
                          userMenuOpen
                            ? "bg-violet-100 dark:bg-violet-500/15"
                            : "hover:bg-gray-100 dark:hover:bg-white/5"
                        }
                      `}
                    >
                      {/* Avatar - comme dans OwnerLayout */}
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 via-indigo-500 to-sky-500 p-[1.5px] shadow-sm shadow-violet-500/15">
                        <div className="w-full h-full rounded-[7px] bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                          {getAvatarUrl() ? (
                            <img
                              src={getAvatarUrl()!}
                              alt={displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className={`w-full h-full ${avatarColor} flex items-center justify-center text-white font-bold text-xs`}>
                              {initial}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {displayName}
                      </span>
                      <ChevronDown
                        className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
                          userMenuOpen ? "rotate-180" : ""
                        }`}
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
                      />
                    )}
                  </div>
                ) : (
                  <Link
                    href="/fr/login"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 hover:shadow-lg hover:shadow-violet-500/25 active:scale-[0.97] transition-all duration-200 shadow-md shadow-violet-500/15"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t("login") || "Sign In"}</span>
                  </Link>
                )}
              </div>
            </div>
          </header>
        </div>
      )}

      {/* ── Mobile Circular Orbit Menu ── */}
      {isMobile && (
        <CircularOrbitMenu
          isOpen={orbitOpen}
          onToggle={() => setOrbitOpen(!orbitOpen)}
          onNavigate={handleNavigate}
          activeTab={pathname?.includes("/search") ? "explorer" : pathname?.includes("/favorites") ? "favorites" : pathname?.includes("/messages") ? "messages" : "reservations"}
          favoritesCount={favoritesCount}
          unreadCount={unreadCount}
          themePreset={themePreset}
        />
      )}

      {/* ── Desktop Spacer ── */}
      {!isMobile && <div className="h-20 md:h-24" />}

      {/* Drawers */}
      <ChatDrawer
        isOpen={localMessengerOpen}
        onClose={() => setLocalMessengerOpen(false)}
        userRole="TENANT"
      />

      {/* Mobile Menu */}
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
      />

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        t={t}
      />
    </>
  );
}