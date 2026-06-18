"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import { useTranslations } from "next-intl";

// Icônes
import { LuLayoutDashboard } from "react-icons/lu";
import { IoHomeOutline, IoPersonOutline } from "react-icons/io5";
import { GoShieldLock } from "react-icons/go";
import { IoSettingsOutline } from "react-icons/io5";
import { RiLogoutCircleLine } from "react-icons/ri";
import { IoSearch } from "react-icons/io5";
import {
  FaChevronCircleLeft,
  FaChevronCircleRight,
  FaChevronDown,
  FaHouseUser,
} from "react-icons/fa";
import {
  MdOutlineHomeWork,
  MdOutlineKeyboardDoubleArrowRight,
} from "react-icons/md";
import { MdOutlineCalendarMonth } from "react-icons/md";
import { MdOutlineBookOnline } from "react-icons/md";
import { MdOutlineChatBubble } from "react-icons/md";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { PiMicrosoftTeamsLogo } from "react-icons/pi";
import { FloatingChat } from "@/components/ui/chat/FloatingChat";
import NotificationBell from "@/components/ui/notifications/NotificationBell";
import { GiDuality, GiDualityMask } from "react-icons/gi";
import { TbHomeSearch } from "react-icons/tb";
import { FaGavel } from "react-icons/fa6";
import { Wallet2Icon } from "lucide-react";

// Fonction pip pour les images Vercel Blob (avatar)
const pipAvatar = (url: string) =>
  `/api/users/avatar?url=${encodeURIComponent(url)}`;

interface AppUser {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
  role: string;
  isIdentityVerified: boolean;
  status: string;
}

// Couleurs pour l'avatar
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

// Composant Avatar simple pour le dropdown
function SimpleAvatar({
  src,
  name,
  size = 32,
}: {
  src?: string;
  name: string;
  size?: number;
}) {
  const [err, setErr] = useState(false);
  const url = src ? pipAvatar(src) : null;
  const safeName = name || "?";
  const firstChar = safeName.charAt(0).toUpperCase();

  return (
    <div
      className="relative flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center font-bold text-white"
      style={{
        width: size,
        height: size,
        background:
          !url || err
            ? "linear-gradient(135deg, #0ea5e9, #6366f1, #a855f7)"
            : "#e2e8f0",
        fontSize: size * 0.36,
      }}
    >
      {url && !err ? (
        <img
          src={url}
          alt={safeName}
          className="w-full h-full object-cover"
          onError={() => setErr(true)}
        />
      ) : (
        firstChar
      )}
    </div>
  );
}

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "fr";

  const t = useTranslations("OwnerLayout");
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  // États
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [userRole, setUserRole] = useState<"OWNER" | "CO_HOST" | "BOTH">(
    "OWNER",
  );
  const [hasListings, setHasListings] = useState<boolean | null>(null);

  // États pour les compteurs
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [pendingReservationsCount, setPendingReservationsCount] = useState(0);
  const [pendingDisputesCount, setPendingDisputesCount] = useState(0);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // États pour le dropdown chat
  const [isChatDropdownOpen, setIsChatDropdownOpen] = useState(false);
  const [chatConversations, setChatConversations] = useState<any[]>([]);
  const [chatDropdownLoading, setChatDropdownLoading] = useState(false);
  const chatDropdownRef = useRef<HTMLDivElement>(null);

  // Refs pour les dropdowns
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Couleur aléatoire pour l'avatar
  const avatarColor = React.useMemo(() => {
    const randomIndex = Math.floor(Math.random() * avatarColors.length);
    return avatarColors[randomIndex];
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Vérifier si l'utilisateur a des annonces
  useEffect(() => {
    if (!mounted || !clerkUser) return;

    const checkListings = async () => {
      try {
        const token = await clerkUser?.getToken?.({
          template: "my-app-template",
        });
        const response = await fetch(
          "/api/listings/my?status=ALL&page=1&pageSize=1",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          const total = data.pagination?.totalCount || 0;
          setHasListings(total > 0);
        } else {
          setHasListings(false);
        }
      } catch (error) {
        console.error("Error checking listings:", error);
        setHasListings(false);
      }
    };

    checkListings();
  }, [clerkUser, mounted]);

  // Récupérer les données utilisateur et permissions
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [userRes, permissionsRes] = await Promise.all([
          fetch("/api/users/me"),
          fetch("/api/owner/my-permissions"),
        ]);

        if (userRes.ok) {
          const data = await userRes.json();
          setAppUser(data.user);
          setDbRole(data.user?.role);
          console.log("🔍 Rôle DB (user.role):", data.user?.role);
        }

        if (permissionsRes.ok) {
          const permissionsData = await permissionsRes.json();
          setUserRole(permissionsData.role);
          console.log("🔍 Rôle permissions:", permissionsData.role);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [clerkUser, mounted]);

  // Ajoute ce state
  const [dbRole, setDbRole] = useState<string>("");

  // Pour vérifier si l'utilisateur est en mode BOTH (Propriétaire + Locataire)
  const isBothTenantOwner = dbRole === "BOTH";

  // Fonctions pour les compteurs
  const fetchUnreadMessagesCount = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const res = await fetch("/api/conversations/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnreadMessagesCount(data.count ?? 0);
      }
    } catch (error) {
      console.error("Erreur chargement messages non lus:", error);
    }
  }, [isSignedIn]);

  const fetchPendingReservationsCount = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const res = await fetch(
        "/api/owner/reservations?status=PENDING&pageSize=1",
      );
      if (res.ok) {
        const data = await res.json();
        setPendingReservationsCount(
          data.pagination?.totalCount || data.length || 0,
        );
      }
    } catch (error) {
      console.error("Erreur chargement réservations:", error);
    }
  }, [isSignedIn]);

  const fetchPendingDisputesCount = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const res = await fetch("/api/disputes?status=OPEN&pageSize=1");
      if (res.ok) {
        const data = await res.json();
        setPendingDisputesCount(
          data.pagination?.totalCount || data.length || 0,
        );
      }
    } catch (error) {
      console.error("Erreur chargement litiges:", error);
    }
  }, [isSignedIn]);

  const fetchUnreadNotificationsCount = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const res = await fetch("/api/notifications/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnreadNotificationsCount(data.count ?? 0);
      }
    } catch (error) {
      console.error("Erreur chargement notifications:", error);
    }
  }, [isSignedIn]);

  const fetchPendingBookingsCount = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const res = await fetch("/api/owner/bookings?status=PENDING&pageSize=1");
      if (res.ok) {
        const data = await res.json();
        setPendingBookingsCount(
          data.pagination?.totalCount || data.length || 0,
        );
      }
    } catch (error) {
      console.error("Erreur chargement bookings:", error);
    }
  }, [isSignedIn]);

  // Charger les conversations pour le dropdown
  const loadChatDropdownConversations = useCallback(async () => {
    if (!isSignedIn) return;
    setChatDropdownLoading(true);
    try {
      const res = await fetch("/api/conversations?limit=5");
      if (res.ok) {
        const data = await res.json();
        setChatConversations(data.slice(0, 5));
      }
    } catch (error) {
      console.error("Error loading chat conversations:", error);
    } finally {
      setChatDropdownLoading(false);
    }
  }, [isSignedIn]);

  // Ouvrir une conversation dans le FloatingChat
  const openConversationInFloatingChat = (conversationId: string) => {
    setIsChatDropdownOpen(false);
    const event = new CustomEvent("open-floating-chat-conversation", {
      detail: { conversationId },
    });
    window.dispatchEvent(event);
  };

  // Gestion du clic sur le bouton chat
  const handleChatButtonClick = () => {
    if (!isChatDropdownOpen) {
      loadChatDropdownConversations();
    }
    setIsChatDropdownOpen(!isChatDropdownOpen);
  };

  // Fermer le dropdown au clic outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        chatDropdownRef.current &&
        !chatDropdownRef.current.contains(e.target as Node)
      ) {
        setIsChatDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Vérifier l'authentification
  useEffect(() => {
    if (!mounted) return;
    if (isLoaded && !isSignedIn) {
      router.push(`/${locale}/login`);
    }
  }, [isLoaded, isSignedIn, router, locale, mounted]);

  // Intervalle pour les compteurs
  useEffect(() => {
    if (isSignedIn) {
      fetchUnreadMessagesCount();
      fetchPendingReservationsCount();
      fetchPendingDisputesCount();
      fetchUnreadNotificationsCount();
      fetchPendingBookingsCount();

      const interval = setInterval(() => {
        fetchUnreadMessagesCount();
        fetchPendingReservationsCount();
        fetchPendingDisputesCount();
        fetchUnreadNotificationsCount();
        fetchPendingBookingsCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [
    isSignedIn,
    fetchUnreadMessagesCount,
    fetchPendingReservationsCount,
    fetchPendingDisputesCount,
    fetchUnreadNotificationsCount,
    fetchPendingBookingsCount,
  ]);

  // Fermer les dropdowns
  useEffect(() => {
    if (!mounted) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(target)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [mounted]);

  useEffect(() => {
    setAvatarError(false);
  }, [appUser?.profilePictureUrl, clerkUser?.imageUrl]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(`/api/owner/search?q=${query}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("rememberMe");
    localStorage.removeItem("redirectAfterLogin");
    await signOut();
    router.push(`/${locale}/login`);
  };

  // Navigation items avec badges
  const navItems = [
    {
      name: t("nav.dashboard"),
      href: `/${locale}/dashboard/owner`,
      icon: LuLayoutDashboard,
      badge: null,
      badgeColor: null,
    },
    {
      name: t("nav.listings"),
      href: `/${locale}/dashboard/owner/listings`,
      icon: MdOutlineHomeWork,
      badge: null,
      badgeColor: null,
    },
    {
      name: t("nav.calendar"),
      href: `/${locale}/dashboard/owner/calendar`,
      icon: MdOutlineCalendarMonth,
      badge: pendingBookingsCount > 0 ? pendingBookingsCount : null,
      badgeColor: "bg-amber-500",
    },
    {
      name: t("nav.reservations"),
      href: `/${locale}/dashboard/owner/reservations`,
      icon: MdOutlineBookOnline,
      badge: pendingReservationsCount > 0 ? pendingReservationsCount : null,
      badgeColor: "bg-blue-500",
    },
    {
      name: t("nav.messages"),
      href: `/${locale}/dashboard/owner/messages`,
      icon: MdOutlineChatBubble,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : null,
      badgeColor: "bg-indigo-500",
    },
    {
      name: t("nav.disputes"),
      href: `/${locale}/dashboard/owner/disputes`,
      icon: FaGavel,
      badge: pendingDisputesCount > 0 ? pendingDisputesCount : null,
      badgeColor: "bg-red-500",
    },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}/dashboard/owner`) return pathname === href;
    return pathname?.startsWith(href);
  };

  const getAvatarUrl = () => {
    if (appUser?.profilePictureUrl && !avatarError)
      return pipAvatar(appUser.profilePictureUrl);
    if (clerkUser?.imageUrl && !avatarError) return clerkUser.imageUrl;
    return null;
  };

  const displayUsername =
    appUser?.username ||
    clerkUser?.username ||
    clerkUser?.firstName ||
    "Utilisateur";
  const initial = displayUsername.charAt(0).toUpperCase();
  const isVerified = appUser?.isIdentityVerified === true;

  const getRoleLabel = () => {
    if (userRole === "BOTH") return t("role.both");
    if (userRole === "CO_HOST") return t("role.cohost");
    return t("role.owner");
  };

  const getSidebarSubtitle = () => {
    if (userRole === "BOTH") return t("sidebar.bothSpace");
    if (userRole === "CO_HOST") return t("sidebar.cohostSpace");
    return t("sidebar.ownerSuite");
  };

  const getHeaderRoleLabel = () => {
    if (userRole === "BOTH") return t("header.both");
    if (userRole === "CO_HOST") return t("header.cohost");
    return t("header.owner");
  };

  // Loader
  if (!mounted || !isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  const sidebarW = sidebarCollapsed ? "w-20" : "w-64";

  return (
    <div className="flex h-screen bg-light dark:bg-slate-900/20 overflow-hidden">
      {/* Overlay mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:static top-0 left-0 z-50 h-full
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0 transition-transform duration-300 ease-in-out
        ${sidebarW} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 
        flex flex-col shadow-xl lg:shadow-none
      `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-slate-200 dark:border-slate-800 gap-8">
          <div className="relative w-8 h-8 shrink-0">
            <Image
              src="/logo/logo.png"
              alt="NestHub Logo"
              fill
              className="object-contain scale-[5.75] translate-y-2.75 ml-2.5"
            />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                N E S T H U B
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 -mt-0.5">
                {getSidebarSubtitle()}
              </p>
            </div>
          )}
        </div>

        {/* Toggle sidebar button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-58 w-6 h-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all z-10 shadow-md hidden lg:flex cursor-pointer"
        >
          {sidebarCollapsed ? (
            <FaChevronCircleRight size={14} />
          ) : (
            <FaChevronCircleLeft size={14} />
          )}
        </button>

        {/* Profile section */}
        <div
          className={`flex flex-col items-center py-6 px-4 border-b border-slate-100 dark:border-slate-800 ${sidebarCollapsed ? "px-2" : ""}`}
        >
          <div className="relative">
            <div
              className={`rounded-full overflow-hidden ring-2 ring-blue-100 dark:ring-blue-900 shadow-lg ${sidebarCollapsed ? "w-10 h-10" : "w-14 h-14"}`}
            >
              {getAvatarUrl() ? (
                <img
                  src={getAvatarUrl()!}
                  alt={displayUsername}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div
                  className={`w-full h-full ${avatarColor} flex items-center justify-center text-white font-bold text-lg`}
                >
                  {initial}
                </div>
              )}
            </div>
            {isVerified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 flex items-center justify-center">
                <GoShieldLock size={10} className="text-white" />
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <div className="mt-3 text-center">
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {displayUsername}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                {getRoleLabel()}
              </p>
              {isVerified && (
                <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                  <GoShieldLock size={10} /> {t("sidebar.verified")}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const hasBadge = item.badge !== null && item.badge > 0;
              return (
                <li key={item.href} className="group">
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative cursor-pointer ${
                      sidebarCollapsed ? "justify-center" : ""
                    } ${
                      active
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    }`}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="font-medium text-sm truncate flex-1">
                          {item.name}
                        </span>
                        {hasBadge && (
                          <span
                            className={`min-w-[20px] h-5 flex items-center justify-center text-[10px] font-bold text-white ${item.badgeColor} rounded-full px-1.5 shadow-sm`}
                          >
                            {item.badge > 99 ? "99+" : item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                  {sidebarCollapsed && hasBadge && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 hidden group-hover:block">
                      <div className="bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap">
                        {item.badge > 99 ? "99+" : item.badge}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        {/* === CARTE MESH GRADIENT - Dark & White Mode === */}
        {userRole !== "BOTH" && !sidebarCollapsed && (
          <div className="px-3 mb-10">
            <div className="group animate-float">
              <div className="relative mesh-gradient-bg rounded-xl overflow-hidden shadow-lg border border-white/20 dark:border-white/10 transition-all duration-300 hover:shadow-xl">
                {/* Image de fond - adaptée au mode */}
                <div className="absolute inset-0 w-full h-full">
                  <img
                    src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=300&fit=crop"
                    alt=""
                    className="w-full h-full object-cover mix-blend-overlay opacity-50 dark:opacity-40 group-hover:scale-110 transition-transform duration-700"
                  />
                </div>

                {/* Overlay adapté dark/white */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent dark:from-black/90 dark:via-black/40" />

                {/* Contenu */}
                <div className="relative p-4 text-center">
                  {/* Icône */}
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-white/20 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                    <GiDualityMask className="w-5 h-5 text-white dark:text-white/90" />
                  </div>

                  <h4 className="headline-font font-bold text-white dark:text-white text-sm mb-1 drop-shadow-md">
                    {t("duality.title")}
                  </h4>

                  <p className="text-[10px] text-white/80 dark:text-white/70 mb-3 leading-relaxed">
                    {t("duality.description")}
                  </p>

                  <button
                    onClick={() => router.push(`/${locale}/upgrade-role`)}
                    className="w-full py-1.5 px-2 rounded-lg bg-white/95 dark:bg-white/10 backdrop-blur-sm text-indigo-600 dark:text-indigo-300 text-[9px] font-bold uppercase tracking-wider hover:bg-white dark:hover:bg-white/20 transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5 border border-white/20 dark:border-white/10"
                  >
                    <span>{t("duality.button")}</span>
                    <MdOutlineKeyboardDoubleArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Bottom section */}
        <div className="mt-auto border-t border-slate-200 dark:border-slate-800 pt-2 pb-4">
          <ul className="space-y-1 px-2">
            <li>
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer"
              >
                <RiLogoutCircleLine size={18} />
                {!sidebarCollapsed && (
                  <span className="font-medium text-sm">
                    {t("sidebar.logout")}
                  </span>
                )}
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            aria-label="Ouvrir le menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="hidden lg:block"></div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search desktop */}
            <div className="relative hidden lg:block">
              <div className="relative">
                <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={t("header.searchPlaceholder")}
                  className="rounded-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none text-sm w-64 xl:w-80 focus:ring-2 focus:ring-blue-300 focus:bg-white dark:focus:bg-slate-700 transition-all outline-none"
                />
              </div>
              {searchQuery.length >= 2 && (
                <div className="absolute right-0 mt-2 w-[450px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50">
                  <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                      {isSearching
                        ? t("search.searching")
                        : t("search.resultsCount", {
                            count: searchResults.length,
                          })}
                    </p>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {isSearching ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto" />
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((result, index) => (
                        <Link
                          key={index}
                          href={`/${locale}${result.href}`}
                          onClick={() => {
                            setSearchQuery("");
                            setSearchResults([]);
                          }}
                          className="block px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b last:border-b-0 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                result.type === "listing"
                                  ? "bg-blue-100 text-blue-700"
                                  : result.type === "booking"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-green-100 text-green-700"
                              }`}
                            >
                              {result.type === "listing" && (
                                <MdOutlineHomeWork size={20} />
                              )}
                              {result.type === "booking" && (
                                <MdOutlineBookOnline size={20} />
                              )}
                              {result.type === "user" && (
                                <IoPersonOutline size={20} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                {result.title}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {result.subtitle}
                              </p>
                            </div>
                            {result.status && (
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${result.statusColor}`}
                              >
                                {result.statusLabel}
                              </span>
                            )}
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        {t("search.noResults")}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* === ROLE SWITCHER (Propriétaire ↔ Locataire) === */}
            {isBothTenantOwner && (
              <div className="bg-gray-300/35 dark:bg-slate-800 backdrop-blur-sm p-0.5 rounded-full flex items-center gap-0.5 shadow-inner">
                <button
                  onClick={() => router.push(`/${locale}/dashboard/owner`)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer ${
                    !pathname?.includes("/dashboard/tenant")
                      ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 text-white shadow-md"
                      : "text-slate-600 dark:text-slate-400 hover:text-indigo-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <FaHouseUser className="w-3.5 h-3.5" />
                    <span>{t("roleSwitcher.owner")}</span>
                  </div>
                </button>

                <button
                  onClick={() => router.push(`/${locale}/search`)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer ${
                    pathname?.includes("/dashboard/tenant")
                      ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 text-white shadow-md"
                      : "text-slate-600 dark:text-slate-400 hover:text-indigo-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <TbHomeSearch className="w-3.5 h-3.5" />
                    <span>{t("roleSwitcher.tenant")}</span>
                  </div>
                </button>
              </div>
            )}

            {/* Bouton Chat avec dropdown */}
            <div className="relative" ref={chatDropdownRef}>
              <button
                onClick={handleChatButtonClick}
                className="relative p-2 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <MdOutlineChatBubble size={20} />
                {unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-4 flex items-center justify-center text-[9px] font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 rounded-full px-1 shadow-sm">
                    {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                  </span>
                )}
              </button>

              {/* Dropdown des conversations */}
              {isChatDropdownOpen && (
                <div className="absolute right-0 mt-2 w-95 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                      {t("chat.recentMessages")}
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      {t("chat.clickToOpen")}
                    </p>
                  </div>

                  <div className="max-h-[450px] overflow-y-auto">
                    {chatDropdownLoading ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent mx-auto" />
                      </div>
                    ) : chatConversations.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-sm">
                        {t("chat.noConversations")}
                      </div>
                    ) : (
                      chatConversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() =>
                            openConversationInFloatingChat(conv.id)
                          }
                          className="w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                        >
                          <div className="flex gap-3">
                            <SimpleAvatar
                              src={conv.otherUser?.image}
                              name={conv.otherUser?.username || "?"}
                              size={40}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                                  {conv.otherUser?.username || "Utilisateur"}
                                </p>
                                {conv.unreadCount > 0 && (
                                  <span className="min-w-[18px] h-4 flex items-center justify-center text-[9px] font-bold text-white bg-indigo-500 rounded-full px-1">
                                    {conv.unreadCount > 99
                                      ? "99+"
                                      : conv.unreadCount}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate">
                                {conv.listing?.title}
                              </p>
                              {conv.lastMessage && (
                                <p className="text-xs text-slate-400 truncate mt-1">
                                  {conv.lastMessage}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <Link
                      href={`/${locale}/dashboard/owner/messages`}
                      onClick={() => setIsChatDropdownOpen(false)}
                      className="flex items-center justify-between text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                    >
                      <span>{t("chat.viewAll")}</span>{" "}
                      <MdOutlineKeyboardDoubleArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <button
              className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
              onClick={() => setIsMobileSearchOpen(true)}
            >
              <IoSearch size={20} />
            </button>

            {/* NotificationBell - composant réutilisable */}
            <NotificationBell />

            {/* Profile dropdown */}
            <div className="relative profile-dropdown" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-1 sm:gap-3 py-1.5 pl-2 sm:pl-3 pr-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white font-medium overflow-hidden`}
                >
                  {getAvatarUrl() ? (
                    <img
                      src={getAvatarUrl()!}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <span className="text-sm font-medium">{initial}</span>
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {displayUsername}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    {getHeaderRoleLabel()}
                  </p>
                </div>
                <FaChevronDown
                  className={`hidden sm:block text-slate-400 text-xs transition-transform ${isProfileDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50">
                  <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-white font-medium overflow-hidden`}
                      >
                        {getAvatarUrl() ? (
                          <img
                            src={getAvatarUrl()!}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-medium text-lg">{initial}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                          {displayUsername}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                            {getRoleLabel()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <IoPersonOutline className="text-slate-400" size={14} />
                        <span className="text-slate-600 dark:text-slate-400 truncate">
                          {clerkUser?.emailAddresses[0]?.emailAddress}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      href={`/${locale}/dashboard/owner/profile`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <IoPersonOutline size={16} />{" "}
                      <span>{t("profile.myProfile")}</span>
                    </Link>
                    <Link
                      href={`/${locale}/dashboard/owner/settings`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <IoSettingsOutline size={16} />{" "}
                      <span>{t("profile.settings")}</span>
                    </Link>
                    <Link
                      href={`/${locale}/dashboard/owner/wallet`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <Wallet2Icon size={16} />{" "}
                      <span>{t("profile.Wallet")}</span>
                    </Link>
                  </div>

                  <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setShowLogoutModal(true);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <RiLogoutCircleLine size={16} />{" "}
                      <span>{t("profile.logout")}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>

      {/* Logout modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl p-6 text-center border border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <RiLogoutCircleLine className="text-3xl text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {t("logout.confirm")}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              {t("logout.message")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 px-4 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-slate-300 font-medium text-sm transition-colors"
              >
                {t("logout.cancel")}
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm shadow-lg shadow-red-600/20 transition-colors"
              >
                {t("logout.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile search modal */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 p-4 lg:hidden">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder={t("header.searchPlaceholder")}
                className="w-full pl-9 pr-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => {
                setIsMobileSearchOpen(false);
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
            >
              {t("search.cancel")}
            </button>
          </div>
          {searchQuery.length >= 2 && (
            <div className="mt-2 max-h-[calc(100vh-120px)] overflow-y-auto">
              {isSearching ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto" />
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((result, index) => (
                  <Link
                    key={index}
                    href={`/${locale}${result.href}`}
                    onClick={() => {
                      setIsMobileSearchOpen(false);
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="block p-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-slate-200 dark:border-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          result.type === "listing"
                            ? "bg-blue-100 text-blue-700"
                            : result.type === "booking"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        {result.type === "listing" && (
                          <MdOutlineHomeWork size={20} />
                        )}
                        {result.type === "booking" && (
                          <MdOutlineBookOnline size={20} />
                        )}
                        {result.type === "user" && (
                          <IoPersonOutline size={20} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-slate-900 dark:text-white truncate">
                          {result.title}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                          {result.subtitle}
                        </p>
                      </div>
                      {result.status && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${result.statusColor}`}
                        >
                          {result.statusLabel}
                        </span>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  {t("search.noResults")}
                </div>
              )}
            </div>
          )}
        </div>
      )}
          <FloatingChat />

    </div>
  );
}
