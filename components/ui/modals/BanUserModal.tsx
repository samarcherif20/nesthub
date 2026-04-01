// app/[locale]/(dashboard)/owner/layout.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

// Fonction pip pour les images depuis Vercel Blob
const pip = (url: string) =>
  `/api/admin/serve-image?url=${encodeURIComponent(url)}`;

// Interface pour les données utilisateur depuis la base
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

export default function OwnerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const pathname = usePathname();
  const { user: clerkUser } = useUser();
  const locale = params.locale;
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Récupérer les données utilisateur depuis la base
  useEffect(() => {
    const fetchAppUser = async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setAppUser(data);
        }
      } catch (error) {
        console.error('Erreur chargement utilisateur:', error);
      } finally {
        setLoading(false);
      }
    };

    if (clerkUser) {
      fetchAppUser();
    } else {
      setLoading(false);
    }
  }, [clerkUser]);

  const navItems = [
    { href: `/${locale}/owner/dashboard`, label: 'Dashboard', icon: 'dashboard' },
    { href: `/${locale}/owner/listings`, label: 'My Listings', icon: 'home_work' },
    { href: `/${locale}/owner/calendar`, label: 'Calendar', icon: 'calendar_month' },
    { href: `/${locale}/owner/reservations`, label: 'Reservations', icon: 'book_online' },
    { href: `/${locale}/owner/messages`, label: 'Messages', icon: 'chat_bubble' },
    { href: `/${locale}/owner/analytics`, label: 'Analytics', icon: 'monitoring' },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}/owner/dashboard` && pathname === `/${locale}/owner/dashboard`) return true;
    if (href !== `/${locale}/owner/dashboard` && pathname?.startsWith(href)) return true;
    return false;
  };

  // Déterminer le nom d'affichage
  const displayName = appUser?.username || appUser?.firstName || clerkUser?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'Owner';
  const initial = displayName.charAt(0).toUpperCase();

  // Déterminer le statut de vérification
  const isVerified = appUser?.isIdentityVerified === true;
  
  // Déterminer le statut du compte
  const isActiveAccount = appUser?.status === 'ACTIVE';
  const isSuspended = appUser?.status === 'TEMPORARILY_SUSPENDED';
  const isBanned = appUser?.status === 'PERMANENTLY_BANNED';

  if (loading) {
    return (
      <div className="flex">
        <aside className="flex flex-col pt-24 pb-8 px-4 fixed left-0 top-0 h-screen w-64 border-r border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 z-40">
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </aside>
        <main className="flex-1 ml-64 min-h-screen">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex">
      {/* Sidebar - Fixed Left */}
      <aside className="flex flex-col pt-24 pb-8 px-4 fixed left-0 top-0 h-screen w-64 border-r border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 z-40">
        {/* Profile Section */}
        <div className="flex flex-col items-center mb-10 px-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 p-0.5 shadow-lg mb-4">
            <div className="w-full h-full rounded-2xl overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center">
              {appUser?.profilePictureUrl ? (
                <img
                  src={pip(appUser.profilePictureUrl)}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : clerkUser?.imageUrl ? (
                <img
                  src={clerkUser.imageUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-blue-600">{initial}</span>
              )}
            </div>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-['Plus_Jakarta_Sans']">Owner Suite</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-['Inter'] tracking-wide uppercase mt-1">
            Premium Management
          </p>
          
          {/* Badges de statut */}
          <div className="flex flex-col items-center gap-1 mt-2">
            {isVerified && (
              <span className="inline-flex items-center text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                ✓ Vérifié
              </span>
            )}
            
            {isSuspended && (
              <span className="inline-flex items-center text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full">
                ⚠️ Suspendu
              </span>
            )}
            
            {isBanned && (
              <span className="inline-flex items-center text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                🚫 Banni
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 font-['Inter'] text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${isActive(item.href)
                  ? 'text-blue-700 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-900/20 translate-x-1'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }
              `}
            >
              <span 
                className="material-symbols-outlined text-xl"
                style={isActive(item.href) ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Upgrade Card */}
        <div className="mt-auto px-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-5 text-white shadow-xl">
            <p className="text-xs font-semibold text-blue-300 mb-1">PRO PLAN</p>
            <p className="text-sm font-medium mb-4 leading-relaxed">
              Accédez aux statistiques avancées
            </p>
            <button className="w-full bg-white text-slate-900 text-xs font-bold py-2.5 rounded-lg hover:bg-blue-50 transition-colors">
              Upgrade to Pro
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}