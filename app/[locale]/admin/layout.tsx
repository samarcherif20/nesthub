// app/[locale]/admin/layout.tsx
"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import { useTranslations } from "next-intl";

// Icônes
import { LuLayoutDashboard } from "react-icons/lu";
import { IoPersonOutline } from "react-icons/io5";
import { GoShieldLock } from "react-icons/go";
import { IoSettingsOutline } from "react-icons/io5";
import { RiLogoutCircleLine } from "react-icons/ri";
import { IoSearch } from "react-icons/io5";
import {
  FaChevronCircleLeft,
  FaChevronCircleRight,
  FaChevronDown,
} from "react-icons/fa";
import { MdOutlinePeopleAlt } from "react-icons/md";
import { MdOutlineMapsHomeWork } from "react-icons/md";
import { GrMoney } from "react-icons/gr";
import { MdOutlineVerified } from "react-icons/md";
import { PiGavel } from "react-icons/pi";
import { PiFilesDuotone } from "react-icons/pi";
import { RiSettings3Line } from "react-icons/ri";
import { MdOutlineReportGmailerrorred } from "react-icons/md";
import { TiUserAddOutline } from "react-icons/ti";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// ✅ Importer le composant NotificationBell
import NotificationBell from "@/components/ui/notifications/NotificationBell";

// Types
interface Counters {
  pendingVerifications: number;
  pendingReports: number;
  activeDisputes: number;
  unreadNotifications: number;
  pendingInvitations: number;
}

// Couleurs aléatoires pour les initiales
const avatarColors = [
  "bg-indigo-500",
  "bg-indigo-600",
  "bg-indigo-400",
  "bg-purple-500",
  "bg-purple-600",
  "bg-purple-400",
  "bg-violet-500",
  "bg-violet-600",
  "bg-violet-400",
  "bg-sky-500",
  "bg-sky-600",
  "bg-sky-400",
  "bg-blue-500",
  "bg-blue-600",
  "bg-blue-400",
  "bg-fuchsia-500",
  "bg-fuchsia-600",
];

const DEFAULT_COUNTERS: Counters = {
  pendingVerifications: 0,
  pendingReports: 0,
  activeDisputes: 0,
  unreadNotifications: 0,
  pendingInvitations: 0,
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "fr";
  const tLayout = useTranslations("admin");

  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  // États
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Couleur aléatoire pour les initiales
  const avatarColor = React.useMemo(() => {
    const randomIndex = Math.floor(Math.random() * avatarColors.length);
    return avatarColors[randomIndex];
  }, []);

  const [counters, setCounters] = useState<Counters>(DEFAULT_COUNTERS);

  const getUsername = () => {
    if (user?.username) return user.username;
    if (user?.emailAddresses[0]?.emailAddress) {
      const email = user.emailAddresses[0].emailAddress;
      return email.split("@")[0];
    }
    return null;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Charger les compteurs depuis l'API
  useEffect(() => {
    if (!mounted) return;

    const fetchCounters = async () => {
      try {
        const res = await fetch("/api/admin/counters");
        if (res.ok) {
          const data = await res.json();
          setCounters(data);
        }
      } catch (error) {
        console.error("Error fetching counters:", error);
      }
    };

    fetchCounters();
    const interval = setInterval(fetchCounters, 30000);
    return () => clearInterval(interval);
  }, [mounted]);

  // Vérifier que l'utilisateur est admin
  useEffect(() => {
    if (!mounted) return;

    if (isLoaded && !isSignedIn) {
      router.push(`/${locale}/login`);
    }

    if (isLoaded && isSignedIn) {
      const userRole = user?.publicMetadata?.role;
      if (userRole !== "ADMIN") {
        router.push(`/${locale}/login`);
      }
    }
  }, [isLoaded, isSignedIn, user, router, locale, mounted]);

  // Fermer les dropdowns
  useEffect(() => {
    if (!mounted) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".profile-dropdown")) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [mounted]);

  // Fonction de recherche
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/admin/search?q=${query}`);
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

  // Navigation items
  const navItems = [
    {
      name: tLayout("dashboard"),
      href: `/${locale}/admin/dashboard`,
      icon: <LuLayoutDashboard size={18} />,
    },
    {
      name: tLayout("users"),
      href: `/${locale}/admin/users`,
      icon: <MdOutlinePeopleAlt size={18} />,
    },
    {
      name: "Invitations",
      href: `/${locale}/admin/invitation`,
      icon: <TiUserAddOutline size={18} />,
    },
    {
      name: tLayout("properties"),
      href: `/${locale}/admin/properties`,
      icon: <MdOutlineMapsHomeWork size={18} />,
    },
    {
      name: tLayout("transactions"),
      href: `/${locale}/admin/transactions`,
      icon: <GrMoney size={18} />,
    },
    {
      name: tLayout("verifications"),
      href: `/${locale}/admin/verifications`,
      icon: <MdOutlineVerified size={18} />,
      count: counters.pendingVerifications,
      countColor: "bg-primary",
    },
    {
      name: tLayout("reports"),
      href: `/${locale}/admin/reports`,
      icon: <MdOutlineReportGmailerrorred size={18} />,
      count: counters.pendingReports,
      countColor: "bg-red-500",
    },
    {
      name: tLayout("disputes"),
      href: `/${locale}/admin/disputes`,
      icon: <PiGavel size={18} />,
      count: counters.activeDisputes,
      countColor: "bg-amber-500",
    },
    {
      name: tLayout("staticPages"),
      href: `/${locale}/admin/static-page`,
      icon: <PiFilesDuotone size={18} />,
    },
    {
      name: tLayout("settings"),
      href: `/${locale}/admin/settings`,
      icon: <RiSettings3Line size={18} />,
    },
  ];

  const mainNavItems = navItems.slice(0, -2);
  const settingsNavItems = navItems.slice(-2);

  const isActive = (href: string) => {
    if (href === `/${locale}/admin/dashboard`) return pathname === href;
    return pathname.startsWith(href);
  };

  if (!mounted || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9ff] dark:bg-slate-950">
        <LoadingSpinner size="lg" color="primary" />
      </div>
    );
  }

  if (!isSignedIn || user?.publicMetadata?.role !== "ADMIN") {
    return null;
  }

  const sidebarW = isSidebarOpen ? "w-64" : "w-64 lg:w-20";

  return (
    <div className="flex h-screen bg-[#f9f9ff] dark:bg-slate-950 overflow-hidden">
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
          {isSidebarOpen && (
            <div className="flex flex-col">
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                N E S T H U B
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">
                {tLayout("adminPanel")}
              </p>
            </div>
          )}
        </div>

        {/* Toggle sidebar button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all z-10 shadow-md hidden lg:flex cursor-pointer"
        >
          {isSidebarOpen ? (
            <FaChevronCircleLeft size={14} />
          ) : (
            <FaChevronCircleRight size={14} />
          )}
        </button>

        {/* Navigation principale */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {mainNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative cursor-pointer ${
                    isActive(item.href)
                      ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                      : "text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  {isSidebarOpen && (
                    <>
                      <span className="font-medium text-sm">{item.name}</span>
                      {item.count !== undefined && item.count > 0 && (
                        <span
                          className={`ml-auto ${item.countColor} text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center`}
                        >
                          {item.count > 99 ? "99+" : item.count}
                        </span>
                      )}
                    </>
                  )}
                  {!isSidebarOpen &&
                    item.count !== undefined &&
                    item.count > 0 && (
                      <span
                        className={`absolute -top-1 -right-1 ${item.countColor} text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center`}
                      >
                        {item.count > 9 ? "9+" : item.count}
                      </span>
                    )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Paramètres en bas */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-2 pb-4">
          <ul className="space-y-1 px-2">
            {settingsNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
                    isActive(item.href)
                      ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                      : "text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  {isSidebarOpen && (
                    <span className="font-medium text-sm">{item.name}</span>
                  )}
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer"
              >
                <RiLogoutCircleLine size={18} />
                {isSidebarOpen && (
                  <span className="font-medium text-sm">
                    {tLayout("logout")}
                  </span>
                )}
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors cursor-pointer"
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
            {/* Recherche desktop */}
            <div className="relative hidden lg:block">
              <div className="relative">
                <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={tLayout("searchPlaceholder")}
                  className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm w-64 xl:w-80 focus:ring-2 focus:ring-indigo-300 focus:bg-white dark:focus:bg-slate-700 transition-all"
                />
              </div>

              {searchQuery.length >= 2 && (
                <div className="absolute right-0 mt-2 w-[450px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50">
                  <div className="px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                      {isSearching
                        ? "Recherche..."
                        : `${searchResults.length} résultat(s)`}
                    </p>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {isSearching ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mx-auto"></div>
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((result, index) => (
                        <div
                          key={index}
                          className="px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer border-b last:border-b-0"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                result.type === "user"
                                  ? "bg-indigo-100 text-indigo-700"
                                  : result.type === "property"
                                    ? "bg-emerald-100 text-emerald-600"
                                    : "bg-amber-100 text-amber-600"
                              }`}
                            >
                              {result.type === "user" ? (
                                <MdOutlinePeopleAlt size={16} />
                              ) : result.type === "property" ? (
                                <MdOutlineMapsHomeWork size={16} />
                              ) : (
                                <GrMoney size={16} />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {result.name}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {result.email || result.id || result.amount}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        {tLayout("noResults")}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              onClick={() => setIsMobileSearchOpen(true)}
            >
              <IoSearch size={20} />
            </button>

            {/* 🔔 NotificationBell - Remplacer l'ancien système de notifications */}
            <NotificationBell />

            {/* Ligne verticale */}
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

            {/* Profil */}
            <div className="relative profile-dropdown">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-1 sm:gap-3 py-1.5 pl-2 sm:pl-3 pr-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${avatarColor} flex items-center justify-center text-white font-medium overflow-hidden flex-shrink-0`}
                >
                  {user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs sm:text-sm font-medium">
                      {user?.firstName?.[0]}
                      {user?.lastName?.[0]}
                    </span>
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    Administrateur
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
                        className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-white font-medium overflow-hidden flex-shrink-0 text-lg`}
                      >
                        {user?.imageUrl ? (
                          <img
                            src={user.imageUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>
                            {user?.firstName?.[0]}
                            {user?.lastName?.[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium">
                            ADMIN
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <IoPersonOutline
                          className="text-slate-400 flex-shrink-0"
                          size={14}
                        />
                        <span className="text-slate-600 dark:text-slate-400 truncate">
                          {user?.emailAddresses[0]?.emailAddress}
                        </span>
                      </div>
                      {getUsername() && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-slate-400 flex-shrink-0">
                            @
                          </span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-medium truncate">
                            {getUsername()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="py-1">
                    <Link
                      href={`/${locale}/admin/profile`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    >
                      <IoPersonOutline size={16} />{" "}
                      <span>{tLayout("myProfile")}</span>
                    </Link>
                    <Link
                      href={`/${locale}/admin/settings/security`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    >
                      <GoShieldLock size={16} />{" "}
                      <span>{tLayout("security")}</span>
                    </Link>
                    <Link
                      href={`/${locale}/admin/settings`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    >
                      <IoSettingsOutline size={16} />{" "}
                      <span>{tLayout("settings")}</span>
                    </Link>
                  </div>
                  <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setShowLogoutModal(true);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <RiLogoutCircleLine size={16} />{" "}
                      <span>{tLayout("logout")}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Contenu principal */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>

      {/* Modal recherche mobile */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 p-4 lg:hidden">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder={tLayout("searchPlaceholder")}
                className="w-full pl-9 pr-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-300"
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => {
                setIsMobileSearchOpen(false);
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
            >
              {tLayout("cancel")}
            </button>
          </div>
          {searchQuery.length >= 2 && (
            <div className="mt-2 max-h-[calc(100vh-120px)] overflow-y-auto">
              {isSearching ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mx-auto"></div>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer border-b"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          result.type === "user"
                            ? "bg-indigo-100 text-indigo-700"
                            : result.type === "property"
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-amber-100 text-amber-600"
                        }`}
                      >
                        {result.type === "user" ? (
                          <MdOutlinePeopleAlt size={20} />
                        ) : result.type === "property" ? (
                          <MdOutlineMapsHomeWork size={20} />
                        ) : (
                          <GrMoney size={20} />
                        )}
                      </div>
                      <div>
                        <p className="text-base font-medium">{result.name}</p>
                        <p className="text-sm text-slate-500">
                          {result.email || result.id || result.amount}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  {tLayout("noResults")}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal déconnexion */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl p-6 text-center border border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <RiLogoutCircleLine className="text-3xl text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {tLayout("confirmLogout")}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              {tLayout("logoutMessage")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 px-4 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-300 font-medium text-sm transition-colors"
              >
                {tLayout("cancel")}
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm shadow-lg shadow-red-600/20 transition-colors"
              >
                {tLayout("logout")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
