// components/ui/headers/TenantHeader.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import {
  IoPersonOutline,
  IoGridOutline,
  IoSettingsOutline,
  IoWalletOutline,
  IoStarOutline,
  IoHomeOutline,
  IoCalendarOutline,
  IoSearchOutline,
  IoChevronDownOutline,
  IoShieldCheckmarkOutline,
  IoHelpCircleOutline,
  IoChatbubbleEllipsesOutline,
  IoSunnyOutline,
  IoMoonOutline,
} from "react-icons/io5";
import { ChatDrawer } from "../chat/ChatDrawer";
import NotificationBell from "../notifications/NotificationBell";
import { useTheme } from "next-themes";
import { RiLogoutCircleLine } from "react-icons/ri";
import SearchBar from "../SearchBar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TenantHeaderProps {
  onChatDrawerOpen?: () => void;
  isChatDrawerOpen?: boolean;
  onChatDrawerClose?: () => void;
}

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    name: "explorer",
    href: "/search",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    name: "favorites",
    href: "/favorites",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    name: "messages",
    href: "/messages",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    name: "reservations",
    href: "/reservations",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
];

// ─── Logout Modal ────────────────────────────────────────────────────────────

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
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <RiLogoutCircleLine className="text-red-500 text-2xl sm:text-3xl" />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-center text-slate-900 dark:text-white mb-2">
            {t("logout.title")}
          </h3>
          <p className="text-sm sm:text-base text-center text-slate-500 dark:text-slate-400 mb-6">
            {t("logout.message")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              {t("logout.cancel")}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-all shadow-md"
            >
              {t("logout.confirm")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── UserMenu ────────────────────────────────────────────────────────────────

function UserMenu({
  user,
  isOpen,
  onClose,
  onLogout,
  t,
  isDark,
}: {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  t: any;
  isDark: boolean;
}) {
  const { setTheme, theme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    if (isOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [isOpen, onClose]);

  const items = [
    { label: t("menu.profile"), href: "/profile", icon: <IoPersonOutline /> },
    { label: t("menu.dashboard"), href: "/dashboard", icon: <IoGridOutline /> },
    {
      label: t("menu.reservations"),
      href: "/reservations",
      icon: <IoCalendarOutline />,
    },
    { label: t("menu.wallet"), href: "/wallet", icon: <IoWalletOutline /> },
    { label: t("menu.reviews"), href: "/reviews", icon: <IoStarOutline /> },
    {
      label: t("menu.settings"),
      href: "/settings",
      icon: <IoSettingsOutline />,
    },
    { divider: true },
    {
      label: t("menu.becomeHost"),
      href: "/become-host",
      icon: <IoHomeOutline />,
      highlight: true,
    },
    { label: t("menu.help"), href: "/help", icon: <IoHelpCircleOutline /> },
    { divider: true },
    {
      label: t("menu.theme"),
      icon: theme === "dark" ? <IoSunnyOutline /> : <IoMoonOutline />,
      onClick: () => setTheme(theme === "dark" ? "light" : "dark"),
    },
    { divider: true },
    {
      label: t("menu.logout"),
      icon: <RiLogoutCircleLine />,
      danger: true,
      onClick: onLogout,
    },
  ];

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-72 sm:w-80 z-[60]"
    >
      <div className="absolute right-4 -top-1.5 w-3 h-3 bg-white dark:bg-slate-900 rotate-45 border-l border-t border-slate-200 dark:border-slate-700" />
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-4 sm:px-5 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-sky-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0 overflow-hidden">
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.username?.charAt(0) || "U"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-800 dark:text-white text-sm sm:text-base truncate">
                {user?.username}
              </p>
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {user?.emailAddresses[0]?.emailAddress}
              </p>
              <div className="flex flex-wrap items-center gap-1 mt-1">
                <IoShieldCheckmarkOutline className="text-emerald-500 text-[10px] sm:text-xs" />
                <span className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  {t("verifiedTenant")}
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500">
                  · {t("role")}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="py-2 max-h-[400px] overflow-y-auto">
          {items.map((item, idx) => {
            if ("divider" in item && item.divider)
              return (
                <div
                  key={`div-${idx}`}
                  className="border-t border-slate-100 dark:border-slate-800 my-1"
                />
              );
            const cls = `flex items-center gap-3 w-full px-4 sm:px-5 py-2.5 text-sm transition-colors text-left ${
              item.danger
                ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                : item.highlight
                  ? "text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30 font-semibold"
                  : `text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800`
            }`;
            if (item.onClick)
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    item.onClick?.();
                    onClose();
                  }}
                  className={cls}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </button>
              );
            return (
              <Link
                key={item.label}
                href={`/fr${item.href}`}
                onClick={onClose}
                className={cls}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main header ──────────────────────────────────────────────────────────────

export function TenantHeader({}: TenantHeaderProps) {
  const t = useTranslations("TenantHeader");
  const { isSignedIn, user, signOut } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [localMessengerOpen, setLocalMessengerOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("favorites");
    if (saved) setFavorites(JSON.parse(saved));
    const updateFavs = () => {
      const s = localStorage.getItem("favorites");
      if (s) setFavorites(JSON.parse(s));
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

  const isActive = (href: string) => {
    const fullHref = `/fr${href}`;
    return fullHref === "/fr/search"
      ? pathname === "/fr/search" || pathname === "/fr"
      : pathname.startsWith(fullHref);
  };

  const getBadge = (item: any) =>
    item.href === "/favorites"
      ? favorites.length
      : item.href === "/messages"
        ? unreadCount
        : 0;

  const handleLogout = async () => {
    await signOut();
    router.push("/fr/login");
  };

  const currentTheme = mounted ? resolvedTheme || theme : "light";
  const isDark = currentTheme === "dark";

  if (!mounted) {
    return (
      <>
        <div className="fixed top-0 w-full z-50 h-16 lg:h-20 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700" />
        <div className="h-16 lg:h-20" />
        <ChatDrawer isOpen={false} onClose={() => {}} userRole="TENANT" />
      </>
    );
  }

  const textColor = isDark ? "text-white" : "text-slate-800";
  const textMuted = isDark ? "text-white/60" : "text-slate-500";

  return (
    <>
      <header
        className="fixed top-0 w-full z-50 transition-all duration-300"
        style={{
          background: isDark
            ? "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #2e1065 100%)"
            : "linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)",
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
          boxShadow: isDark
            ? "0 4px 32px rgba(0,0,0,0.3)"
            : "0 4px 32px rgba(0,0,0,0.05)",
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, #38bdf8 25%, #818cf8 50%, #c084fc 75%, transparent 100%)",
          }}
        />

        <div className="px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between h-16 lg:h-20 gap-4 lg:gap-8 w-full">
            {/* Logo */}
            {/* Logo */}
            <Link
              href="/fr/search"
              className="flex items-center gap-2 flex-shrink-0 select-none"
            >
              <img
                src="/logo/logo.png"
                alt="NESTHUB"
                className="h-23 w-auto object-contain scale-140 mt-6.5"
              />
              <span
                className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 btext-transparent -ml-9 mt-0.4"
                style={{
                  background:
                    "linear-gradient(90deg,#38bdf8 0%,#818cf8 50%,#c084fc 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                      transform: "scaleY(2)", // 1.5 = 50% taller

                }}
              >
                N E S T H U B
              </span>
            </Link>

            {/* Search bar - desktop avec bordure et plus long */}
            <div className="hidden lg:flex flex-1 justify-center">
              <div className="w-full max-w-2xl border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-200 overflow-hidden bg-white dark:bg-slate-800">
                <SearchBar />
              </div>
            </div>

            {/* Navigation pills - desktop */}
            <nav className="hidden md:flex items-center gap-1 flex-shrink-0">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                const badge = getBadge(item);
                return (
                  <Link
                    key={item.name}
                    href={`/fr${item.href}`}
                    className={`flex items-center gap-1.5 rounded-full text-sm font-semibold transition-all duration-200 relative whitespace-nowrap px-3 py-2 lg:px-4 ${active ? (isDark ? "bg-white/15 text-white" : "bg-black/5 text-slate-800") : textColor}`}
                    style={{ opacity: active ? 1 : 0.7 }}
                  >
                    {item.icon}
                    <span className="hidden sm:inline">
                      {t(`nav.${item.name}`)}
                    </span>
                    {badge > 0 && (
                      <span className="absolute -top-1 -right-1 text-white font-extrabold text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-red-500">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Search button mobile */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all"
              >
                <IoSearchOutline className={`text-xl ${textColor}`} />
              </button>

              {/* Messenger */}
              <button
                onClick={() => setLocalMessengerOpen(true)}
                className="relative p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all"
              >
                <IoChatbubbleEllipsesOutline
                  className={`text-xl ${textColor}`}
                />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-white font-extrabold text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-red-500">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              <NotificationBell />

              <div
                className="hidden md:block w-px h-6"
                style={{
                  background: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.08)",
                }}
              />

              {isSignedIn ? (
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setIsUserMenuOpen((p) => !p)}
                    className="flex items-center gap-2 transition-all duration-200"
                    style={{
                      background: isUserMenuOpen
                        ? isDark
                          ? "rgba(255,255,255,0.12)"
                          : "rgba(0,0,0,0.04)"
                        : "transparent",
                      border: `1px solid ${isUserMenuOpen ? (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)") : "transparent"}`,
                      borderRadius: 50,
                      padding: "3px 8px 3px 3px sm:px-3 sm:py-1",
                    }}
                  >
                    <div
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-white text-xs sm:text-sm overflow-hidden"
                      style={{
                        background:
                          "linear-gradient(135deg, #0ea5e9, #6366f1, #a855f7)",
                      }}
                    >
                      {user?.imageUrl ? (
                        <img
                          src={user.imageUrl}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user?.username?.charAt(0) || "U"
                      )}
                    </div>
                    <div className="hidden sm:flex flex-col text-left leading-none">
                      <span className={`text-xs font-semibold ${textColor}`}>
                        {user?.username}
                      </span>
                     
                      <span className={`text-[9px] ${textMuted}`}>
                        {t("role")}
                      </span>
                    </div>
                    <IoChevronDownOutline
                      className={`text-xs transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""} ${textMuted}`}
                    />
                  </button>
                  <UserMenu
                    user={user}
                    isOpen={isUserMenuOpen}
                    onClose={() => setIsUserMenuOpen(false)}
                    onLogout={() => {
                      setIsUserMenuOpen(false);
                      setShowLogoutModal(true);
                    }}
                    t={t}
                    isDark={isDark}
                  />
                </div>
              ) : (
                <Link
                  href="/fr/login"
                  className="flex-shrink-0 text-sm font-bold text-white transition-all duration-300 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 hover:from-indigo-600 hover:via-purple-600 hover:to-blue-600 shadow-lg hover:shadow-xl rounded-full px-4 sm:px-5 py-2"
                >
                  {t("login")}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Panel */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-lg">
            <SearchBar onResultClick={() => setIsMobileMenuOpen(false)} />
          </div>
        )}
      </header>

      <div className="h-16 lg:h-20" />

      <ChatDrawer
        isOpen={localMessengerOpen}
        onClose={() => setLocalMessengerOpen(false)}
        userRole="TENANT"
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
