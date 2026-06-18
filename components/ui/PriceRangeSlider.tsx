// components/ui/PriceRangeSlider.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";

interface PriceRangeSliderProps {
  minPrice: string;
  maxPrice: string;
  onMinChange: (val: string) => void;
  onMaxChange: (val: string) => void;
  minLimit?: number;
  maxLimit?: number;
  isLoading?: boolean;
}

export function PriceRangeSlider({
  minPrice,
  maxPrice,
  onMinChange,
  onMaxChange,
  minLimit = 0,
  maxLimit = 10000,
  isLoading = false,
}: PriceRangeSliderProps) {
  const t = useTranslations("PriceRangeSlider");

  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);
  const [isDragging, setIsDragging] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchroniser avec les props (quand les filtres sont réinitialisés)
  useEffect(() => {
    if (!isDragging) {
      setLocalMin(minPrice);
      setLocalMax(maxPrice);
    }
  }, [minPrice, maxPrice, isDragging]);

  // Fonction avec debounce pour éviter trop d'appels API
  const debouncedOnMinChange = useCallback(
    (value: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onMinChange(value);
      }, 300);
    },
    [onMinChange],
  );

  const debouncedOnMaxChange = useCallback(
    (value: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onMaxChange(value);
      }, 300);
    },
    [onMaxChange],
  );

  const min = parseInt(localMin) || minLimit;
  const max = parseInt(localMax) || maxLimit;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
            <div className="h-4 w-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1" />
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="h-4 w-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1" />
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  const handleMinChange = (value: string) => {
    const numValue = parseInt(value) || minLimit;
    if (numValue <= max) {
      setLocalMin(value);
      debouncedOnMinChange(value);
    }
  };

  const handleMaxChange = (value: string) => {
    const numValue = parseInt(value) || maxLimit;
    if (numValue >= min) {
      setLocalMax(value);
      debouncedOnMaxChange(value);
    }
  };

  const handleSliderMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (val <= max) {
      setLocalMin(val.toString());
      debouncedOnMinChange(val.toString());
    }
  };

  const handleSliderMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (val >= min) {
      setLocalMax(val.toString());
      debouncedOnMaxChange(val.toString());
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            {t("min")}
          </span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              TND
            </span>
            <input
              type="number"
              value={localMin}
              onChange={(e) => handleMinChange(e.target.value)}
              placeholder={minLimit.toString()}
              min={minLimit}
              max={maxLimit}
              className="w-full pl-12 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        </div>
        <div className="flex-1">
          <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            {t("max")}
          </span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              TND
            </span>
            <input
              type="number"
              value={localMax}
              onChange={(e) => handleMaxChange(e.target.value)}
              placeholder={maxLimit.toString()}
              min={minLimit}
              max={maxLimit}
              className="w-full pl-12 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Double Slider */}
      <div className="relative pt-4 pb-2">
        {/* Background bar */}
        <div className="relative h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full">
          {/* Selected range bar */}
          <div
            className="absolute h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
            style={{
              left: `${((min - minLimit) / (maxLimit - minLimit)) * 100}%`,
              right: `${
                100 - ((max - minLimit) / (maxLimit - minLimit)) * 100
              }%`,
            }}
          />
        </div>

        {/* Min slider thumb */}
        <input
          type="range"
          min={minLimit}
          max={maxLimit}
          value={min}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onChange={handleSliderMinChange}
          className="absolute top-4 left-0 w-full h-1.5 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
        />

        {/* Max slider thumb */}
        <input
          type="range"
          min={minLimit}
          max={maxLimit}
          value={max}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onChange={handleSliderMaxChange}
          className="absolute top-4 left-0 w-full h-1.5 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
        />
      </div>

      {/* Price labels */}
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>{minLimit.toLocaleString()} TND</span>
        <span className="text-indigo-600 dark:text-indigo-400 font-medium">
          {min.toLocaleString()} - {max.toLocaleString()} TND
        </span>
        <span>{maxLimit.toLocaleString()} TND</span>
      </div>
    </div>
  );
}
