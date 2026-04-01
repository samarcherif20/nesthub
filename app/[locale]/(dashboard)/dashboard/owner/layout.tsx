// app/[locale]/(dashboard)/owner/layout.tsx
"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import { useTranslations } from "next-intl";

// Icônes
import { LuLayoutDashboard } from "react-icons/lu";
import { IoMdNotificationsOutline } from "react-icons/io";
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
import { MdOutlineHomeWork } from "react-icons/md";
import { MdOutlineCalendarMonth } from "react-icons/md";
import { MdOutlineBookOnline } from "react-icons/md";
import { MdOutlineChatBubble } from "react-icons/md";
import { MdOutlineAnalytics } from "react-icons/md";
import { MdOutlineAdd } from "react-icons/md";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// Fonction pip pour les images Vercel Blob
const pipAvatar  = (url: string) =>
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
  "bg-blue-500", "bg-indigo-500", "bg-purple-500", "bg-violet-500",
  "bg-sky-500", "bg-cyan-500", "bg-emerald-500", "bg-teal-500",
];

export default function OwnerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = React.use(params);
  const t = useTranslations("OwnerLayout");
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const pathname = usePathname();

  // États
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsDropdownOpen, setIsNotificationsDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Refs pour les dropdowns
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);

  // Couleur aléatoire pour l'avatar
  const avatarColor = React.useMemo(() => {
    const randomIndex = Math.floor(Math.random() * avatarColors.length);
    return avatarColors[randomIndex];
  }, []);

  // Marquer le composant comme monté
  useEffect(() => {
    setMounted(true);
  }, []);

  // Récupérer les données utilisateur
  useEffect(() => {
    if (!mounted || !clerkUser) {
      setLoading(false);
      return;
    }
    fetch("/api/users/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setAppUser(data.user || data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [clerkUser, mounted]);

  // Vérifier que l'utilisateur est propriétaire ou BOTH
  useEffect(() => {
    if (!mounted) return;
    if (isLoaded && !isSignedIn) {
      router.push(`/${locale}/login`);
    }
    if (isLoaded && isSignedIn && appUser) {
      const role = appUser.role;
      if (role !== "PROPERTY_OWNER" && role !== "BOTH") {
        router.push(`/${locale}/renter/search`);
      }
    }
  }, [isLoaded, isSignedIn, appUser, router, locale, mounted]);

  // Fermer les dropdowns quand on clique en dehors
  useEffect(() => {
    if (!mounted) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(target)) {
        setIsProfileDropdownOpen(false);
      }
      
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(target)) {
        setIsNotificationsDropdownOpen(false);
      }
    };
    
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [mounted]);

  // Reset avatar error when component remounts
  useEffect(() => {
    setAvatarError(false);
  }, [appUser?.profilePictureUrl, clerkUser?.imageUrl]);

  // Fonction de recherche
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

  // Navigation items
  const navItems = [
    { name: t("nav.dashboard"), href: `/${locale}/dashboard/owner`, icon: LuLayoutDashboard },
    { name: t("nav.listings"), href: `/${locale}/dashboard/owner/listings`, icon: MdOutlineHomeWork },
    { name: t("nav.calendar"), href: `/${locale}/dashboard/owner/calendar`, icon: MdOutlineCalendarMonth },
    { name: t("nav.reservations"), href: `/${locale}/dashboard/owner/reservations`, icon: MdOutlineBookOnline },
    { name: t("nav.messages"), href: `/${locale}/dashboard/owner/messages`, icon: MdOutlineChatBubble },
    { name: t("nav.analytics"), href: `/${locale}/dashboard/owner/analytics`, icon: MdOutlineAnalytics },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}/dashboard/owner`) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  // Fonction pour obtenir l'URL de l'avatar (priorité: Blob > Clerk > fallback)
  const getAvatarUrl = () => {
    // Priorité 1: Image depuis Vercel Blob (base de données) - utilise pip pour l'URL
    if (appUser?.profilePictureUrl && !avatarError) {
    return pipAvatar(appUser.profilePictureUrl); // ✅ Utiliser l'API avatar
  }
  // Priorité 2: Image depuis Clerk
  if (clerkUser?.imageUrl && !avatarError) {
    return clerkUser.imageUrl;
  }
  return null;
};
  // Affichage du username
  const displayUsername = appUser?.username || clerkUser?.username || clerkUser?.firstName || "Propriétaire";
  const initial = displayUsername.charAt(0).toUpperCase();
  const isVerified = appUser?.isIdentityVerified === true;

  // Loader
  if (!mounted || !isLoaded || loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f6fb] dark:bg-slate-950">
      <LoadingSpinner />
    </div>
    );
  }

  if (!isSignedIn || (appUser && appUser.role !== "PROPERTY_OWNER" && appUser.role !== "BOTH")) {
    return null;
  }

  const sidebarW = sidebarCollapsed ? "w-20" : "w-64";
  const mainML = sidebarCollapsed ? "ml-20" : "ml-64";

  return (
    <div className="flex h-screen bg-[#f5f6fb] dark:bg-slate-950 overflow-hidden">
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
          ${sidebarW} 
          bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 
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
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ">
                N E S T H U B
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 -mt-0.5">
                {t("sidebar.ownerSuite")}
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
        <div className={`flex flex-col items-center py-6 px-4 border-b border-slate-100 dark:border-slate-800 ${sidebarCollapsed ? "px-2" : ""}`}>
          <div className="relative">
            <div className={`rounded-full overflow-hidden ring-2 ring-blue-100 dark:ring-blue-900 shadow-lg ${sidebarCollapsed ? "w-10 h-10" : "w-14 h-14"}`}>
              {getAvatarUrl() ? (
                <img
                  src={getAvatarUrl()!}
                  alt={displayUsername}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className={`w-full h-full ${avatarColor} flex items-center justify-center text-white font-bold text-lg`}>
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
                {t("sidebar.ownerRole")}
              </p>
              {isVerified && (
                <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                  <GoShieldLock size={10} />
                  {t("sidebar.verified")}
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
              return (
                <li key={item.href} className="group">
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative cursor-pointer ${
                      active
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    }`}
                  >
                    <Icon size={18} />
                    {!sidebarCollapsed && (
                      <span className="font-medium text-sm">{item.name}</span>
                    )}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-50">
                        {item.name}
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-2 pb-4">
          <ul className="space-y-1 px-2">
            <li>
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer"
              >
                <RiLogoutCircleLine size={18} />
                {!sidebarCollapsed && (
                  <span className="font-medium text-sm">{t("sidebar.logout")}</span>
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
          {/* Menu burger mobile */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            aria-label="Ouvrir le menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
                  className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm w-64 xl:w-80 focus:ring-2 focus:ring-blue-300 focus:bg-white dark:focus:bg-slate-700 transition-all outline-none"
                />
              </div>
              {searchQuery.length >= 2 && (
                <div className="absolute right-0 mt-2 w-[450px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50">
                  <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                      {isSearching ? "Recherche..." : `${searchResults.length} résultat(s)`}
                    </p>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {isSearching ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto"></div>
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((result, index) => (
                        <div key={index} className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b last:border-b-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                              <MdOutlineHomeWork size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{result.title}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{result.governorate}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        Aucun résultat
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Search mobile button */}
            <button
              className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
              onClick={() => setIsMobileSearchOpen(true)}
            >
              <IoSearch size={20} />
            </button>

            {/* Notifications dropdown */}
            <div className="relative" ref={notificationsDropdownRef}>
              <button
                onClick={() => setIsNotificationsDropdownOpen(!isNotificationsDropdownOpen)}
                className="relative p-2 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
              >
                <IoMdNotificationsOutline size={20} />
              </button>
              {isNotificationsDropdownOpen && (
                <div className="absolute right-0 mt-2 w-[380px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {t("notifications.title")}
                    </h3>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto p-4 text-center text-slate-500">
                    {t("notifications.empty")}
                  </div>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative profile-dropdown" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-1 sm:gap-3 py-1.5 pl-2 sm:pl-3 pr-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white font-medium overflow-hidden`}>
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
                    {t("header.owner")}
                  </p>
                </div>
                <FaChevronDown className={`hidden sm:block text-slate-400 text-xs transition-transform ${isProfileDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50">
                  <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-white font-medium overflow-hidden`}>
                        {getAvatarUrl() ? (
                          <img 
                            src={getAvatarUrl()!} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                            onError={() => setAvatarError(true)}
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
                            {t("header.ownerBadge")}
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
                      href={`/${locale}/owner/profile`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <IoPersonOutline size={16} />
                      <span>{t("profile.myProfile")}</span>
                    </Link>
                    <Link
                      href={`/${locale}/owner/settings`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <IoSettingsOutline size={16} />
                      <span>{t("profile.settings")}</span>
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
                      <RiLogoutCircleLine size={16} />
                      <span>{t("profile.logout")}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

           
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
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
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto"></div>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((result, index) => (
                  <div key={index} className="p-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                        <MdOutlineHomeWork size={20} />
                      </div>
                      <div>
                        <p className="text-base font-medium">{result.title}</p>
                        <p className="text-sm text-slate-500">{result.governorate}</p>
                      </div>
                    </div>
                  </div>
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
    </div>
  );
}