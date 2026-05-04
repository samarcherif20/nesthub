// components/ui/SearchBar.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  IoSearch,
  IoCloseOutline,
  IoLocationOutline,
  IoHomeOutline,
  IoArrowForwardOutline,
  IoTrendingUpOutline,
  IoTimeOutline,
  IoSparklesOutline,
} from "react-icons/io5";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  title: string;
  location?: string;
  image?: string;
  pricePerNight?: number;
  type?: string;
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
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches
  useEffect(() => {
    try {
      const saved = localStorage.getItem("recentSearches");
      if (saved) setRecentSearches(JSON.parse(saved).slice(0, 4));
    } catch {}
  }, []);

  const saveRecentSearch = (query: string) => {
    try {
      const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 4);
      setRecentSearches(updated);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
    } catch {}
  };

  // Click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setShowResults(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&limit=5`
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
    saveRecentSearch(searchQuery);
    setShowResults(false);
    setSearchQuery("");
    onResultClick?.();
    router.push(`/fr/listings/${listingId}`);
  };

  const handleFullSearch = () => {
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery);
      setShowResults(false);
      router.push(`/fr/search?q=${encodeURIComponent(searchQuery)}`);
      onResultClick?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleFullSearch();
  };

  const handleRecentClick = (query: string) => {
    setSearchQuery(query);
    setShowResults(false);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  const showDropdown = isFocused && (showResults || (searchQuery.length < 2 && recentSearches.length > 0));

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* ── Input ── */}
      <div className="relative group">
        <IoSearch
          className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-base transition-colors ${
            isFocused
              ? "text-indigo-500 dark:text-indigo-400"
              : "text-gray-400 dark:text-gray-500"
          }`}
        />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            if (searchQuery.length >= 2) setShowResults(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={t("search.placeholder")}
          className="w-full pl-10 pr-20 py-2.5 bg-transparent text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all rounded-xl"
        />

        {/* Right side: clear button + shortcut hint */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery("");
                setResults([]);
                inputRef.current?.focus();
              }}
              className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <IoCloseOutline className="text-gray-400 dark:text-gray-500 text-base" />
            </button>
          ) : (
            <div className="hidden ">
            </div>
          )}

          {/* Search button when query exists */}
          {searchQuery.trim().length >= 2 && (
            <button
              onClick={handleFullSearch}
              className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center transition-colors shadow-sm shadow-indigo-500/20"
            >
              <IoArrowForwardOutline className="text-white text-xs" />
            </button>
          )}
        </div>

        {/* Loading bar */}
        {isLoading && (
          <div className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800">
            <div className="h-full w-1/3 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-full animate-[loadSlide_1s_ease-in-out_infinite]" />
          </div>
        )}
      </div>

      {/* ── Dropdown ── */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl shadow-gray-200/50 dark:shadow-black/30 border border-gray-200 dark:border-gray-800 overflow-hidden z-50">

          {/* Recent searches (shown when input is empty/short) */}
          {searchQuery.length < 2 && recentSearches.length > 0 && (
            <div>
              <div className="px-4 py-2.5 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <IoTimeOutline className="text-gray-400 dark:text-gray-500 text-sm" />
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Recherches récentes
                  </p>
                </div>
                <button
                  onClick={clearRecent}
                  className="text-[10px] font-bold text-gray-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                >
                  Effacer
                </button>
              </div>
              {recentSearches.map((query, i) => (
                <button
                  key={i}
                  onClick={() => handleRecentClick(query)}
                  className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <IoTimeOutline className="text-gray-400 dark:text-gray-500 text-sm" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{query}</span>
                </button>
              ))}
            </div>
          )}

          {/* Search results */}
          {searchQuery.length >= 2 && (
            <>
              {isLoading ? (
                <div className="p-6 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-200 dark:border-indigo-800 border-t-indigo-500 animate-spin" />
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
                    Recherche en cours…
                  </p>
                </div>
              ) : results.length > 0 ? (
                <div>
                  {/* Results header */}
                  <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                    <IoSparklesOutline className="text-indigo-500 text-sm" />
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {results.length} résultat{results.length > 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Result items */}
                  <div className="max-h-[320px] overflow-y-auto">
                    {results.map((result, index) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result.id)}
                        className="w-full px-4 py-3 text-left hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors flex items-center gap-3 group border-b border-gray-50 dark:border-gray-800/50 last:border-0"
                      >
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700 group-hover:border-indigo-200 dark:group-hover:border-indigo-800/50 transition-colors">
                          {result.image ? (
                            <img
                              src={`/api/listings/image?url=${encodeURIComponent(result.image)}`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40">
                              <IoHomeOutline className="text-indigo-400 dark:text-indigo-600 text-lg" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {result.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {result.location && (
                              <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 font-medium">
                                <IoLocationOutline className="text-[10px]" />
                                <span className="truncate max-w-[150px]">{result.location}</span>
                              </span>
                            )}
                            {result.type && (
                              <>
                                <span className="text-gray-300 dark:text-gray-700 text-[10px]">·</span>
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                  {result.type}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        {result.pricePerNight && (
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                              {result.pricePerNight} <span className="text-xs font-bold">TND</span>
                            </p>
                            <p className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">
                              /nuit
                            </p>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* See all */}
                  <button
                    onClick={handleFullSearch}
                    className="w-full px-4 py-3 text-center border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors group flex items-center justify-center gap-2"
                  >
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      Voir tous les résultats
                    </span>
                    <IoArrowForwardOutline className="text-indigo-600 dark:text-indigo-400 text-xs group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              ) : (
                /* No results */
                <div className="p-6 text-center">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3 border border-gray-200 dark:border-gray-700">
                    <IoSearch className="text-gray-400 dark:text-gray-500 text-lg" />
                  </div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Aucun résultat
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                    Aucune propriété ne correspond à « {searchQuery} »
                  </p>
                  <button
                    onClick={handleFullSearch}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1 mx-auto"
                  >
                    Rechercher sur la page complète
                    <IoArrowForwardOutline className="text-[10px]" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Loading animation keyframe */}
      <style>{`
        @keyframes loadSlide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%);  }
        }
      `}</style>
    </div>
  );
}