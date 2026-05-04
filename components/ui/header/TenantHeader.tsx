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
  IoCloseOutline,
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    name: "favorites",
    href: "/favorites",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    name: "messages",
    href: "/messages",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    name: "reservations",
    href: "/reservations",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
];

// ─── Logout Modal ─────────────────────────────────────────────────────────────
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
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 fade-in duration-200">
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/25 flex items-center justify-center border border-rose-200 dark:border-rose-800/40">
              <RiLogoutCircleLine className="text-rose-500 text-2xl" />
            </div>
          </div>
          <h3 className="text-lg font-extrabold text-center text-gray-900 dark:text-white mb-1.5">
            {t("logout.title")}
          </h3>
          <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
            {t("logout.message")}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t("logout.cancel")}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-rose-500 hover:bg-rose-600 text-white transition-colors shadow-sm shadow-rose-500/20"
            >
              {t("logout.confirm")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── UserMenu ─────────────────────────────────────────────────────────────────
function UserMenu({
  user,
  isOpen,
  onClose,
  onLogout,
  t,
}: {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  t: any;
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
    { label: t("menu.reservations"), href: "/reservations", icon: <IoCalendarOutline /> },
    { label: t("menu.wallet"), href: "/wallet", icon: <IoWalletOutline /> },
    { label: t("menu.reviews"), href: "/reviews", icon: <IoStarOutline /> },
    { label: t("menu.settings"), href: "/settings", icon: <IoSettingsOutline /> },
    { divider: true },
    { label: t("menu.becomeHost"), href: "/become-host", icon: <IoHomeOutline />, highlight: true },
    { label: t("menu.help"), href: "/help", icon: <IoHelpCircleOutline /> },
    { divider: true },
    {
      label: t("menu.theme"),
      icon: theme === "dark" ? <IoSunnyOutline /> : <IoMoonOutline />,
      onClick: () => setTheme(theme === "dark" ? "light" : "dark"),
      sub: theme === "dark" ? "Passer en clair" : "Passer en sombre",
    },
    { divider: true },
    { label: t("menu.logout"), icon: <RiLogoutCircleLine />, danger: true, onClick: onLogout },
  ];

  if (!isOpen) return null;

  return (
    <div ref={ref} className="absolute right-0 top-full mt-3 w-[300px] z-[60]">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* User header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0 overflow-hidden shadow-md shadow-violet-500/15">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                user?.username?.charAt(0) || "U"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-gray-900 dark:text-white text-sm truncate">
                {user?.username}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                {user?.emailAddresses[0]?.emailAddress}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <IoShieldCheckmarkOutline className="text-emerald-500 text-[11px]" />
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  {t("verifiedTenant")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="py-1.5 max-h-[420px] overflow-y-auto">
          {items.map((item, idx) => {
            if ("divider" in item && item.divider) {
              return <div key={`d-${idx}`} className="h-px bg-gray-100 dark:bg-gray-800 mx-3 my-1" />;
            }

            const cls = `flex items-center gap-3 w-full px-4 py-2.5 text-[13px] font-semibold transition-colors text-left rounded-lg mx-1.5 ${
              (item as any).danger
                ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/15"
                : (item as any).highlight
                  ? "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/15"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/80"
            }`;

            const style = { width: "calc(100% - 12px)" };

            if ((item as any).onClick) {
              return (
                <button
                  key={(item as any).label}
                  onClick={() => {
                    (item as any).onClick?.();
                    if (!(item as any).sub) onClose();
                  }}
                  className={cls}
                  style={style}
                >
                  <span className="text-base opacity-70">{(item as any).icon}</span>
                  <span className="flex-1">{(item as any).label}</span>
                  {(item as any).sub && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                      {(item as any).sub}
                    </span>
                  )}
                </button>
              );
            }

            return (
              <Link
                key={(item as any).label}
                href={`/fr${(item as any).href}`}
                onClick={onClose}
                className={cls}
                style={style}
              >
                <span className="text-base opacity-70">{(item as any).icon}</span>
                <span className="flex-1">{(item as any).label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Icon button ──────────────────────────────────────────────────────────────
function HeaderIconButton({
  children,
  onClick,
  badge,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  badge?: number;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 bg-gray-100/80 dark:bg-white/[0.06] hover:bg-gray-200/80 dark:hover:bg-white/[0.1] border border-gray-200/60 dark:border-white/[0.08] text-gray-600 dark:text-gray-300 ${className}`}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center text-[9px] font-extrabold text-white bg-gradient-to-r from-rose-500 to-red-500 rounded-full px-1 shadow-sm shadow-rose-500/30">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
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
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => {
    const fullHref = `/fr${href}`;
    return fullHref === "/fr/search"
      ? pathname === "/fr/search" || pathname === "/fr"
      : pathname.startsWith(fullHref);
  };

  const getBadge = (item: (typeof NAV_ITEMS)[0]) =>
    item.href === "/favorites" ? favorites.length : item.href === "/messages" ? unreadCount : 0;

  const handleLogout = async () => {
    await signOut();
    router.push("/fr/login");
  };

  const currentTheme = mounted ? resolvedTheme || theme : "light";
  const isDark = currentTheme === "dark";

  if (!mounted) {
    return (
      <>
        <div className="fixed top-0 w-full z-50 h-16 lg:h-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800" />
        <div className="h-16 lg:h-20" />
        <ChatDrawer isOpen={false} onClose={() => {}} userRole="TENANT" />
      </>
    );
  }

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/85 dark:bg-gray-950/85 backdrop-blur-2xl shadow-sm"
            : "bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl"
        }`}
        style={{
          borderBottom: `1px solid ${
            scrolled
              ? isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
              : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"
          }`,
        }}
      >
        {/* Top accent gradient line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: "linear-gradient(90deg, transparent 0%, #38bdf8 20%, #6366f1 40%, #8b5cf6 60%, #a855f7 80%, transparent 100%)",
            opacity: scrolled ? 0.8 : 1,
            transition: "opacity .3s",
          }}
        />

        <div className="px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between h-16 lg:h-20 gap-4 lg:gap-6 w-full">

            {/* ── Logo — YOUR ORIGINAL preserved ── */}
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
                className="text-xl font-bold -ml-9 mt-0.4"
                style={{
                  background: "linear-gradient(90deg, #38bdf8 0%, #6366f1 35%, #8b5cf6 65%, #a855f7 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  transform: "scaleY(2)",
                }}
              >
                N E S T H U B
              </span>
            </Link>

            {/* ── Search bar — desktop ── */}
            <div className="hidden lg:flex flex-1 justify-center max-w-2xl">
              <div className="w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md hover:shadow-indigo-500/5 focus-within:border-indigo-400 dark:focus-within:border-indigo-600 focus-within:shadow-lg focus-within:shadow-indigo-500/10 transition-all duration-200 overflow-hidden">
                <SearchBar />
              </div>
            </div>

            {/* ── Navigation — desktop ── */}
            <nav className="hidden md:flex items-center gap-0.5 flex-shrink-0">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                const badge = getBadge(item);
                return (
                  <Link
                    key={item.name}
                    href={`/fr${item.href}`}
                    className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 ${
                      active
                        ? "bg-indigo-50 dark:bg-indigo-900/25 text-indigo-600 dark:text-indigo-400"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className={active ? "opacity-100" : "opacity-60"}>
                      {item.icon}
                    </span>
                    <span className="hidden lg:inline">{t(`nav.${item.name}`)}</span>
                    {badge > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center text-[9px] font-extrabold text-white bg-gradient-to-r from-rose-500 to-red-500 rounded-full px-1 shadow-sm shadow-rose-500/30">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                    {active && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* ── Right actions ── */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Mobile search */}
              <HeaderIconButton
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                className="lg:hidden"
              >
                {isMobileSearchOpen ? (
                  <IoCloseOutline className="text-lg" />
                ) : (
                  <IoSearchOutline className="text-lg" />
                )}
              </HeaderIconButton>

              {/* Messenger */}
              <HeaderIconButton onClick={() => setLocalMessengerOpen(true)} badge={unreadCount}>
                <IoChatbubbleEllipsesOutline className="text-lg" />
              </HeaderIconButton>

              {/* Notifications */}
              <NotificationBell />

              {/* Separator */}
              <div className="hidden md:block w-px h-6 bg-gray-200 dark:bg-gray-800 mx-0.5" />

              {/* User / Login */}
              {isSignedIn ? (
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setIsUserMenuOpen((p) => !p)}
                    className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-2xl transition-all duration-200 border ${
                      isUserMenuOpen
                        ? "bg-gray-100 dark:bg-white/[0.08] border-gray-200 dark:border-white/[0.12]"
                        : "bg-transparent border-transparent hover:bg-gray-100/60 dark:hover:bg-white/[0.04] hover:border-gray-200/60 dark:hover:border-white/[0.06]"
                    }`}
                  >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-xs sm:text-sm overflow-hidden shadow-sm shadow-violet-500/15">
                      {user?.imageUrl ? (
                        <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user?.username?.charAt(0) || "U"
                      )}
                    </div>
                    <div className="hidden sm:flex flex-col text-left leading-none">
                      <span className="text-xs font-bold text-gray-800 dark:text-white truncate max-w-[80px]">
                        {user?.username}
                      </span>
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">
                        {t("role")}
                      </span>
                    </div>
                    <IoChevronDownOutline
                      className={`text-[10px] text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
                        isUserMenuOpen ? "rotate-180" : ""
                      }`}
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
                  />
                </div>
              ) : (
                <Link
                  href="/fr/login"
                  className="flex-shrink-0 text-sm font-extrabold text-white px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:shadow-lg hover:shadow-violet-500/25 active:scale-[.97] transition-all"
                >
                  {t("login")}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Mobile search panel ── */}
        {isMobileSearchOpen && (
          <div className="lg:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3 shadow-lg">
            <SearchBar onResultClick={() => setIsMobileSearchOpen(false)} />
          </div>
        )}
      </header>

      {/* Spacer */}
      <div className="h-16 lg:h-20" />

      {/* Drawers & Modals */}
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