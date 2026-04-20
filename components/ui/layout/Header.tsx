"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import UserMenu from "@/components/ui/UserMenu";
import {
  IoHeartOutline,
  IoNotificationsOutline,
  IoSearchOutline,
  IoChatbubbleOutline,
  IoHomeOutline,
} from "react-icons/io5";

const gradientText =
  "bg-gradient-to-r from-indigo-600 via-sky-500 to-purple-600 bg-clip-text text-transparent";

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavoritesCount(favorites.length);
  }, []);

  return (
    <>
      {/* Header Desktop */}
      <header className="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm dark:shadow-slate-800/30 transition-all duration-300">
        <div className="px-6 py-2 max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-center">
            <Link href="/fr/search">
              <img
                src="/logo/logo.png"
                alt="NESTHUB"
                className="h-25 w-auto object-contain scale-180 mt-4.5"
              />
            </Link>

            <div className="flex items-center gap-6">
              <Link
                href="/fr/reservations"
                className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition"
              >
                Mes réservations
              </Link>

              <Link href="/fr/favorites">
                <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full relative cursor-pointer transition">
                  <IoHeartOutline className="text-slate-600 dark:text-slate-400 text-xl" />
                  {mounted && favoritesCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {favoritesCount}
                    </span>
                  )}
                </button>
              </Link>

              <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full relative transition">
                <IoNotificationsOutline className="text-slate-600 dark:text-slate-400 text-xl" />
              </button>

              {mounted && <UserMenu />}
              {!mounted && (
                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-slate-700 animate-pulse"></div>
              )}
            </div>
          </div>

          <div className="flex justify-center mt-2">
            <span
              className={`text-base font-bold tracking-wider -ml-270 font-headline -mt-10 ${gradientText}`}
            >
              N E S T H U B
            </span>
          </div>
        </div>
      </header>

      {/* Navigation Mobile */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl md:hidden z-50 rounded-t-3xl shadow-lg">
        <Link
          href="/fr/search"
          className="flex flex-col items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-2xl px-5 py-2"
        >
          <IoSearchOutline className="text-xl" />
          <span className="text-[11px] font-medium mt-1">Explorer</span>
        </Link>
        <Link
          href="/fr/favorites"
          className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-5 py-2"
        >
          <IoHeartOutline className="text-xl" />
          <span className="text-[11px] font-medium mt-1">Favoris</span>
        </Link>
        <Link
          href="#"
          className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-5 py-2"
        >
          <IoChatbubbleOutline className="text-xl" />
          <span className="text-[11px] font-medium mt-1">Messages</span>
        </Link>
        <Link
          href="#"
          className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-5 py-2"
        >
          <IoHomeOutline className="text-xl" />
          <span className="text-[11px] font-medium mt-1">Profil</span>
        </Link>
      </nav>
    </>
  );
}