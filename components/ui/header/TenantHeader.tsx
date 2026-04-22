// components/ui/headers/TenantHeader.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface TenantHeaderProps {
  onChatDrawerOpen?: () => void;
  isChatDrawerOpen?: boolean;
  onChatDrawerClose?: () => void;
}

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    name: "Explorer",
    href: "/fr/search",
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
    name: "Favoris",
    href: "/fr/favorites",
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
    name: "Messages",
    href: "/fr/messages",
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
    name: "Réservations",
    href: "/fr/reservations",
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
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <RiLogoutCircleLine className="text-red-500 text-3xl" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">
            Déconnexion
          </h3>
          <p className="text-center text-slate-500 dark:text-slate-400 mb-6">
            Êtes-vous sûr de vouloir vous déconnecter ?
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 transition-all"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-all shadow-md"
            >
              Déconnexion
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
}: {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    if (isOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [isOpen, onClose]);

  const items = [
    { label: "Mon profil", href: "/fr/profile", icon: <IoPersonOutline /> },
    {
      label: "Tableau de bord",
      href: "/fr/dashboard",
      icon: <IoGridOutline />,
    },
    {
      label: "Mes réservations",
      href: "/fr/reservations",
      icon: <IoCalendarOutline />,
    },
    { label: "Portefeuille", href: "/fr/wallet", icon: <IoWalletOutline /> },
    { label: "Mes avis", href: "/fr/reviews", icon: <IoStarOutline /> },
    { label: "Paramètres", href: "/fr/settings", icon: <IoSettingsOutline /> },
    { divider: true },
    {
      label: "Devenir propriétaire",
      href: "/fr/become-host",
      icon: <IoHomeOutline />,
      highlight: true,
    },
    { label: "Aide", href: "/fr/help", icon: <IoHelpCircleOutline /> },
    { divider: true },
    {
      label: "Thème",
      icon: theme === "dark" ? <IoSunnyOutline /> : <IoMoonOutline />,
      onClick: () => setTheme(theme === "dark" ? "light" : "dark"),
    },
    { divider: true },
    {
      label: "Déconnexion",
      icon: <RiLogoutCircleLine />,
      danger: true,
      onClick: onLogout,
    },
  ];

  if (!isOpen) return null;

  return (
    <div ref={ref} className="absolute right-0 top-full mt-3 w-80 z-[60]">
      <div className="absolute right-4 -top-1.5 w-3 h-3 bg-white dark:bg-slate-900 rotate-45 border-l border-t border-slate-200 dark:border-slate-700" />
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-400 to-purple-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 overflow-hidden">
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.firstName?.charAt(0) || "U"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900 dark:text-white text-base truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate mt-0.5">
                {user?.emailAddresses[0]?.emailAddress}
              </p>
              <div className="flex items-center gap-1 mt-1.5">
                <IoShieldCheckmarkOutline className="text-emerald-500 text-xs" />
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Locataire vérifié
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  · Rôle: Locataire
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="py-2">
          {items.map((item, idx) => {
            if ("divider" in item && item.divider)
              return (
                <div
                  key={`div-${idx}`}
                  className="border-t border-slate-100 dark:border-slate-800 my-1"
                />
              );
            const cls = `flex items-center gap-3 w-full px-5 py-2.5 text-sm transition-colors text-left ${
              item.danger
                ? "text-red-600 hover:bg-red-50"
                : item.highlight
                  ? "text-sky-600 hover:bg-sky-50 font-semibold"
                  : "text-slate-700 hover:bg-slate-50"
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
                href={item.href!}
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

  const isActive = (href: string) =>
    href === "/fr/search"
      ? pathname === "/fr/search" || pathname === "/fr"
      : pathname.startsWith(href);
  const getBadge = (item: any) =>
    item.href === "/fr/favorites"
      ? favorites.length
      : item.href === "/fr/messages"
        ? unreadCount
        : 0;

  const handleLogout = async () => {
    await signOut();
    router.push("/fr/login");
  };

  // 🔑 Correction : Utiliser resolvedTheme pour avoir la valeur réelle après montage
  const currentTheme = mounted ? resolvedTheme || theme : "light";
  const isDark = currentTheme === "dark";

  // Pendant l'hydratation, afficher un placeholder neutre
  if (!mounted) {
    return (
      <>
        <div className="fixed top-0 w-full z-50 h-20 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700" />
        <div className="h-20" />
        <ChatDrawer isOpen={false} onClose={() => {}} userRole="TENANT" />
      </>
    );
  }

  return (
    <>
      <header
        className="fixed top-0 w-full z-50 transition-colors duration-300"
        style={{
          background: isDark
            ? "linear-gradient(135deg,#0c0a2e 0%,#1a0845 35%,#0f2060 65%,#0c1a4a 100%)"
            : "linear-gradient(135deg, #e9d5ff 0%, #bfdbfe 50%, #f0f9ff 100%)",
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.15)"}`,
          boxShadow: "0 4px 32px rgba(0,0,0,.25)",
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background:
              "linear-gradient(90deg,transparent 0%,#38bdf8 25%,#818cf8 50%,#c084fc 75%,transparent 100%)",
          }}
        />
        <div className="px-8 w-full">
          <div className="flex items-center justify-between h-20 gap-8 w-full">
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
                className="text-[18px] font-black tracking-tight leading-none -ml-9 mt-3"
                style={{
                  background:
                    "linear-gradient(90deg,#38bdf8 0%,#818cf8 50%,#c084fc 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                N E S T H U B
              </span>
            </Link>

            {/* Search bar */}
            <button
              onClick={() => router.push("/fr/search")}
              className="hidden lg:flex items-center gap-3 flex-1 transition-all duration-200 max-w-md"
              style={{
                background: isDark
                  ? "rgba(255,255,255,.07)"
                  : "rgba(255,255,255,.6)",
                border: `1px solid ${isDark ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.3)"}`,
                borderRadius: 50,
                padding: "10px 20px",
                cursor: "pointer",
                backdropFilter: "blur(4px)",
              }}
            >
              <IoSearchOutline
                style={{
                  color: isDark ? "rgba(255,255,255,.6)" : "rgba(0,0,0,.5)",
                  fontSize: 18,
                }}
              />
              <span
                style={{
                  fontSize: 14,
                  color: isDark ? "rgba(255,255,255,.5)" : "rgba(0,0,0,.5)",
                  fontWeight: 500,
                }}
              >
                Où voulez-vous aller ?
              </span>
            </button>

            {/* Navigation pills */}
            <nav className="hidden md:flex items-center gap-1 flex-shrink-0">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                const badge = getBadge(item);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-1.5 rounded-full text-sm font-semibold transition-all duration-200 relative"
                    style={{
                      padding: "7px 14px",
                      background: active
                        ? isDark
                          ? "rgba(255,255,255,.18)"
                          : "rgba(255,255,255,.7)"
                        : "transparent",
                      color: active
                        ? isDark
                          ? "#fff"
                          : "#1e1b4b"
                        : isDark
                          ? "rgba(255,255,255,.7)"
                          : "rgba(255,255,255,.9)",
                      border: active
                        ? `1px solid ${isDark ? "rgba(255,255,255,.2)" : "rgba(255,255,255,.5)"}`
                        : "1px solid transparent",
                    }}
                  >
                    {item.icon}
                    {item.name}
                    {badge > 0 && (
                      <span
                        className="text-white font-extrabold"
                        style={{
                          background: "linear-gradient(135deg,#f43f5e,#e11d48)",
                          fontSize: 10,
                          padding: "1px 6px",
                          borderRadius: 20,
                          minWidth: 18,
                          textAlign: "center",
                        }}
                      >
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Messenger */}
              <button
                onClick={() => setLocalMessengerOpen(true)}
                className="relative p-2 rounded-full hover:bg-white/10 transition-all"
              >
                <IoChatbubbleEllipsesOutline className="text-white/80 text-xl" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 text-white font-extrabold"
                    style={{
                      background: "linear-gradient(135deg,#f43f5e,#e11d48)",
                      fontSize: 9,
                      padding: "1px 4px",
                      borderRadius: 20,
                      minWidth: 16,
                      textAlign: "center",
                    }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications */}
              <NotificationBell />

              {/* Divider */}
              <div
                className="hidden md:block w-px h-8"
                style={{
                  background: isDark
                    ? "rgba(255,255,255,.12)"
                    : "rgba(255,255,255,.2)",
                }}
              />

              {/* User button */}
              {isSignedIn ? (
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setIsUserMenuOpen((p) => !p)}
                    className="flex items-center gap-2.5 transition-all duration-200"
                    style={{
                      background: isUserMenuOpen
                        ? isDark
                          ? "rgba(255,255,255,.15)"
                          : "rgba(255,255,255,.8)"
                        : isDark
                          ? "rgba(255,255,255,.1)"
                          : "rgba(255,255,255,.6)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,.2)" : "rgba(255,255,255,.4)"}`,
                      borderRadius: 50,
                      padding: "4px 12px 4px 4px",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm overflow-hidden"
                      style={{
                        background:
                          "linear-gradient(135deg,#0ea5e9,#6366f1,#a855f7)",
                      }}
                    >
                      {user?.imageUrl ? (
                        <img
                          src={user.imageUrl}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user?.firstName?.charAt(0) || "U"
                      )}
                    </div>
                    <div className="hidden sm:flex flex-col text-left leading-none">
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: isDark ? "#fff" : "#1e1b4b",
                          lineHeight: 1.2,
                        }}
                      >
                        {user?.firstName} {user?.lastName}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: isDark
                            ? "rgba(255,255,255,.5)"
                            : "rgba(0,0,0,.5)",
                          lineHeight: 1.3,
                        }}
                      >
                        {user?.emailAddresses[0]?.emailAddress}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 500,
                          color: isDark
                            ? "rgba(255,255,255,.35)"
                            : "rgba(0,0,0,.35)",
                          lineHeight: 1.2,
                          marginTop: 1,
                        }}
                      >
                        Rôle: Locataire
                      </span>
                    </div>
                    <IoChevronDownOutline
                      style={{
                        color: isDark
                          ? "rgba(255,255,255,.5)"
                          : "rgba(0,0,0,.4)",
                        fontSize: 12,
                        transition: "transform .2s",
                        transform: isUserMenuOpen
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      }}
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
                  />
                </div>
              ) : (
                <Link
                  href="/fr/login"
                  className="flex-shrink-0 text-sm font-bold text-white transition-all duration-300 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 hover:from-indigo-600 hover:via-purple-600 hover:to-blue-600 shadow-lg hover:shadow-xl rounded-full px-5 py-2"
                >
                  Connexion
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Spacer */}
      <div className="h-20" />

      {/* Messenger drawer */}
      <ChatDrawer
        isOpen={localMessengerOpen}
        onClose={() => setLocalMessengerOpen(false)}
        userRole="TENANT"
      />

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}
