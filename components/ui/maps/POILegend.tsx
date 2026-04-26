// components/ui/maps/POILegend.tsx
"use client";

import { useState } from "react";

const POI_GROUPS = [
  {
    category: "Commodités",
    items: ["supermarket", "pharmacy", "bank", "atm", "fuel"],
  },
  {
    category: "Transports",
    items: ["station", "bus", "metro", "taxi", "parking"],
  },
  {
    category: "Loisirs",
    items: [
      "beach",
      "sea",
      "park",
      "restaurant",
      "cafe",
      "cinema",
      "gym",
      "pool",
    ],
  },
  {
    category: "Services",
    items: ["hospital", "school", "university", "police", "mosque", "church"],
  },
];

const POI_DISPLAY: Record<string, { icon: string; label: string }> = {
  beach: { icon: "🏖️", label: "Plage" },
  sea: { icon: "🌊", label: "Mer" },
  supermarket: { icon: "🛒", label: "Supermarché" },
  pharmacy: { icon: "💊", label: "Pharmacie" },
  bank: { icon: "🏦", label: "Banque" },
  atm: { icon: "💳", label: "Distributeur" },
  fuel: { icon: "⛽", label: "Station essence" },
  station: { icon: "🚉", label: "Gare" },
  bus: { icon: "🚏", label: "Arrêt bus" },
  metro: { icon: "🚇", label: "Métro" },
  taxi: { icon: "🚕", label: "Taxi" },
  parking: { icon: "🅿️", label: "Parking" },
  park: { icon: "🌳", label: "Parc" },
  restaurant: { icon: "🍽️", label: "Restaurant" },
  cafe: { icon: "☕", label: "Café" },
  cinema: { icon: "🎬", label: "Cinéma" },
  gym: { icon: "💪", label: "Salle de sport" },
  pool: { icon: "🏊", label: "Piscine" },
  hospital: { icon: "🏥", label: "Hôpital" },
  school: { icon: "🏫", label: "École" },
  university: { icon: "🎓", label: "Université" },
  police: { icon: "👮", label: "Commissariat" },
  mosque: { icon: "🕌", label: "Mosquée" },
  church: { icon: "⛪", label: "Église" },
};

export function POILegend({
  pois,
  onFilterChange,
}: {
  pois: any[];
  onFilterChange?: (types: string[]) => void;
}) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const toggleFilter = (type: string) => {
    const newFilters = activeFilters.includes(type)
      ? activeFilters.filter((t) => t !== type)
      : [...activeFilters, type];
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const counts = pois.reduce(
    (acc, poi) => {
      acc[poi.category] = (acc[poi.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="absolute bottom-4 left-4 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-lg p-4 max-w-[260px] border border-gray-100 dark:border-slate-700">
      <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <span className="text-lg">📍</span> À proximité
      </h4>

      {POI_GROUPS.map((group) => (
        <div key={group.category} className="mb-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {group.category}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.items.map((item) => {
              const config = POI_DISPLAY[item];
              if (!config) return null;
              const count = counts[item] || 0;
              if (count === 0) return null;

              return (
                <button
                  key={item}
                  onClick={() => toggleFilter(item)}
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                    activeFilters.includes(item)
                      ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  <span>{config.icon}</span>
                  <span>{config.label}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {activeFilters.length > 0 && (
        <button
          onClick={() => {
            setActiveFilters([]);
            onFilterChange?.([]);
          }}
          className="w-full mt-2 py-1.5 text-[10px] font-semibold text-gray-500 hover:text-red-500 transition"
        >
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );
}
