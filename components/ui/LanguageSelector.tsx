// components/ui/LanguageSelector.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";

const languages = [
  { code: "ar", name: "العربية", flag: "/flags/tn.png" },
  { code: "fr", name: "Français", flag: "/flags/fr.webp" },
  { code: "de", name: "Deutsch", flag: "/flags/ge.png" },
  { code: "es", name: "Español", flag: "/flags/es.png" },
  { code: "it", name: "Italiano", flag: "/flags/it.png" },
  { code: "en", name: "English", flag: "/flags/en.webp" },
];

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = useLocale();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (newLocale: string) => {
    setIsOpen(false);
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  const currentLanguage =
    languages.find((l) => l.code === currentLocale) || languages[1];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Changer de langue"
      >
        {/* Current Flag Image */}
        <div className="relative w-6 h-7">
          <Image
            src={currentLanguage.flag}
            alt={currentLanguage.name}
            width={24}
            height={18}
            className="object-cover rounded-sm"
          />
        </div>

       

        <svg
          className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-2 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 py-1 animate-fadeIn">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`
                w-full text-left px-4 py-2 flex items-center space-x-3
                hover:bg-gray-50 transition-colors duration-150
                ${currentLocale === language.code ? "bg-blue-50 text-blue-700" : "text-gray-700"}
              `}
            >
              {/* Flag Image */}
              <div className="relative w-6 h-6 shrink-0">
                <Image
                  src={language.flag}
                  alt={language.name}
                  width={24}
                  height={18}
                  className="object-cover rounded-sm"
                />
              </div>

              <span className="flex-1 font-medium">{language.name}</span>

              {currentLocale === language.code && (
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
