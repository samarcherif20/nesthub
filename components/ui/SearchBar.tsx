// components/ui/SearchBar.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { IoSearch, IoCloseOutline, IoLocationOutline } from "react-icons/io5";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SearchResult {
  id: string;
  title: string;
  location?: string;
  image?: string;
  pricePerNight?: number;
}

interface SearchBarProps {
  onResultClick?: () => void;
  className?: string;
}

export default function SearchBar({
  onResultClick,
  className = "",
}: SearchBarProps) {
  const t = useTranslations();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&limit=5`,
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.listings || []);
        setShowResults(true);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchQuery.length >= 2) {
        handleSearch();
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [searchQuery, handleSearch]);

  const handleResultClick = (listingId: string) => {
    setShowResults(false);
    setSearchQuery("");
    onResultClick?.();
    router.push(`/fr/listings/${listingId}`);
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
          placeholder={t("search.placeholder")}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70"
          >
            <IoCloseOutline className="text-slate-400" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent mx-auto" />
            </div>
          ) : results.length > 0 ? (
            <div>
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t("search.results")}
                </p>
              </div>
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result.id)}
                  className="w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                    {result.image ? (
                      <img
                        src={`/api/listings/image?url=${encodeURIComponent(result.image)}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <IoHomeOutline className="text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {result.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {result.location && (
                        <span className="text-xs text-slate-500 flex items-center gap-0.5">
                          <IoLocationOutline className="text-xs" />
                          {result.location}
                        </span>
                      )}
                      {result.pricePerNight && (
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          {result.pricePerNight} TND/nuit
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              <button
                onClick={() =>
                  router.push(`/fr/search?q=${encodeURIComponent(searchQuery)}`)
                }
                className="w-full p-3 text-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-t border-slate-100 dark:border-slate-800"
              >
                {t("search.seeAll")}
              </button>
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("search.noResults")}
              </p>
              <button
                onClick={() =>
                  router.push(`/fr/search?q=${encodeURIComponent(searchQuery)}`)
                }
                className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {t("search.searchDirectly")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
