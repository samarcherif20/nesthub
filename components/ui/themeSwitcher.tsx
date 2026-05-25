// components/ui/ThemeSwitcher.tsx
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative group flex h-11 w-11 items-center justify-center rounded-full transition-all duration-500 hover:scale-110 hover:shadow-xl overflow-hidden"
      aria-label="Changer de thème"
    >
      {/* Gradient background animé */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-500/30 via-indigo-500/30 to-purple-600/30 backdrop-blur-md transition-all duration-500 group-hover:from-sky-500/50 group-hover:via-indigo-500/50 group-hover:to-purple-600/50" />

      {/* Bordure lumineuse */}
      <div className="absolute inset-0 rounded-full  transition-all duration-300" />

      {/* Inner glow effect */}
      <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-white/20 to-transparent" />
      </div>

      {/* Pulse ring */}
      <div className="absolute inset-0 rounded-full group-hover:animate-pulse-ring opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Icône */}
      {isDark ? (
        <Sun className="relative z-10 h-5 w-5 text-white/80 transition-all duration-300 group-hover:rotate-90 group-hover:scale-110 group-hover:text-amber-300" />
      ) : (
        <Moon className="relative z-10 h-5 w-5 text-white/80 transition-all duration-300 group-hover:-rotate-12 group-hover:scale-110 group-hover:text-indigo-300" />
      )}
    </button>
  );
}
