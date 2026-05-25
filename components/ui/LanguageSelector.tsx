// components/ui/LanguageSelector.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import { ChevronDown, Check } from "lucide-react";

const languages = [
  { code: "ar", name: "العربية", flag: "/flags/tn.png" },
  { code: "fr", name: "Français", flag: "/flags/fr.webp" },
  { code: "de", name: "Deutsch", flag: "/flags/ge.png" },
  { code: "es", name: "Español", flag: "/flags/es.png" },
  { code: "it", name: "Italiano", flag: "/flags/it.png" },
  { code: "en", name: "English", flag: "/flags/en.webp" },
];

const setLanguageCookie = (locale: string) => {
  document.cookie = `preferred-language=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
};

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = useLocale();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (newLocale: string) => {
    setIsOpen(false);
    setLanguageCookie(newLocale);
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  const currentLanguage = languages.find((l) => l.code === currentLocale) || languages[1];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative group flex h-11 w-auto items-center justify-center gap-2 rounded-full px-4 transition-all duration-500 hover:scale-110 hover:shadow-xl overflow-hidden"
        aria-label="Changer de langue"
      >
        {/* Gradient background animé (comme ThemeSwitcher) */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-500/30 via-indigo-500/30 to-purple-600/30 backdrop-blur-md transition-all duration-500 group-hover:from-sky-500/50 group-hover:via-indigo-500/50 group-hover:to-purple-600/50" />

        {/* Bordure lumineuse */}
        <div className="absolute inset-0 rounded-full  transition-all duration-300" />

        {/* Inner glow effect */}
        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-white/20 to-transparent" />
        </div>

        {/* Flag */}
        <div className="relative z-10 w-5 h-5 rounded-full overflow-hidden shadow-sm">
          <Image
            src={currentLanguage.flag}
            alt={currentLanguage.name}
            width={20}
            height={20}
            className="object-cover w-full h-full"
          />
        </div>

        {/* Language code */}
        <span className="relative z-10 text-xs font-semibold text-white/90">
          {currentLanguage.code.toUpperCase()}
        </span>

        {/* Chevron icon */}
        <ChevronDown
          className={`relative z-10 h-3.5 w-3.5 text-white/70 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute ml-9 mt-3 w-56 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/30 shadow-2xl z-50 py-2 overflow-hidden">
          {languages.map((language) => {
            const isActive = currentLocale === language.code;
            return (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`
                  w-full text-left px-4 py-2.5 flex items-center gap-3
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-600/10"
                      : "hover:bg-slate-50/80"
                  }
                `}
              >
                {/* Flag */}
                <div className="relative w-6 h-6 rounded-full overflow-hidden shadow-sm flex-shrink-0">
                  <Image
                    src={language.flag}
                    alt={language.name}
                    width={24}
                    height={24}
                    className="object-cover w-full h-full"
                  />
                </div>

                {/* Language name */}
                <span className={`flex-1 text-sm font-medium ${
                  isActive ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent" : "text-slate-700"
                }`}>
                  {language.name}
                </span>

                {/* Check icon for active language */}
                {isActive && (
                  <Check className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}