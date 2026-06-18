// components/ui/maps/POILegend.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  IoRestaurantOutline,
  IoCafeOutline,
  IoCartOutline,
  IoBusinessOutline,
  IoCashOutline,
  IoTrainOutline,
  IoBusOutline,
  IoLeafOutline,
  IoLibraryOutline,
  IoShieldCheckmarkOutline,
  IoLocationOutline,
  IoCloseOutline,
  IoGlobeOutline,
  IoRadioButtonOnOutline,
} from "react-icons/io5";
import {
  FaParking,
  FaSchool,
  FaUniversity,
  FaMosque,
  FaChurch,
  FaTaxi,
  FaSwimmer,
  FaDumbbell,
} from "react-icons/fa";
import {
  MdLocalHospital,
  MdLocalPharmacy,
  MdLocalGasStation,
} from "react-icons/md";
import { TbBeach } from "react-icons/tb";
import { PiFilmReelFill } from "react-icons/pi";

const POI_GROUPS = [
  {
    category: "Commodités",
    items: ["supermarket", "pharmacy", "bank", "atm", "fuel"],
  },
  {
    category: "Transports",
    items: ["station", "bus", "taxi", "parking"],
  },
  {
    category: "Loisirs",
    items: ["beach", "park", "restaurant", "cafe", "cinema", "gym", "pool"],
  },
  {
    category: "Services",
    items: ["hospital", "school", "university", "police", "mosque", "church"],
  },
];

const POI_DISPLAY: Record<
  string,
  { icon: React.ReactNode; label: string; color: string }
> = {
  beach: { icon: <TbBeach />, label: "Plage", color: "#0ea5e9" },
  supermarket: {
    icon: <IoCartOutline />,
    label: "Supermarché",
    color: "#10b981",
  },
  pharmacy: { icon: <MdLocalPharmacy />, label: "Pharmacie", color: "#ec489a" },
  bank: { icon: <IoBusinessOutline />, label: "Banque", color: "#f59e0b" },
  atm: { icon: <IoCashOutline />, label: "Distributeur", color: "#f59e0b" },
  fuel: { icon: <MdLocalGasStation />, label: "Station", color: "#f97316" },
  station: { icon: <IoTrainOutline />, label: "Gare", color: "#64748b" },
  bus: { icon: <IoBusOutline />, label: "Bus", color: "#64748b" },
  taxi: { icon: <FaTaxi />, label: "Taxi", color: "#64748b" },
  parking: { icon: <FaParking />, label: "Parking", color: "#64748b" },
  park: { icon: <IoLeafOutline />, label: "Parc", color: "#22c55e" },
  restaurant: {
    icon: <IoRestaurantOutline />,
    label: "Restaurant",
    color: "#ef4444",
  },
  cafe: { icon: <IoCafeOutline />, label: "Café", color: "#f59e0b" },
  cinema: { icon: <PiFilmReelFill />, label: "Cinéma", color: "#a855f7" },
  gym: { icon: <FaDumbbell />, label: "Sport", color: "#8b5cf6" },
  pool: { icon: <FaSwimmer />, label: "Piscine", color: "#06b6d4" },
  hospital: { icon: <MdLocalHospital />, label: "Hôpital", color: "#ef4444" },
  school: { icon: <IoLibraryOutline />, label: "École", color: "#14b8a6" },
  university: { icon: <FaUniversity />, label: "Université", color: "#14b8a6" },
  police: {
    icon: <IoShieldCheckmarkOutline />,
    label: "Police",
    color: "#3b82f6",
  },
  mosque: { icon: <FaMosque />, label: "Mosquée", color: "#10b981" },
  church: { icon: <FaChurch />, label: "Église", color: "#f59e0b" },
};

export function POILegend({
  pois,
  onFilterChange,
  onToggleDistance,
  showAllDistances = false,
}: {
  pois: any[];
  onFilterChange?: (types: string[]) => void;
  onToggleDistance?: () => void;
  showAllDistances?: boolean;
}) {
  const t = useTranslations("POILegend");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  const toggleFilter = (type: string) => {
    const newFilters = activeFilters.includes(type)
      ? activeFilters.filter((t) => t !== type)
      : [...activeFilters, type];
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    onFilterChange?.([]);
  };

  // Compter les POIs dans le rayon (3km) et hors rayon
  const poisInRadius = pois.filter((p) => p.distance <= 3).length;
  const poisOutRadius = pois.filter((p) => p.distance > 3).length;

  const counts = pois.reduce(
    (acc, poi) => {
      acc[poi.category] = (acc[poi.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Mode minimisé
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="absolute bottom-4 left-4 z-10 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-lg p-3 hover:scale-105 transition-all duration-300 group"
      >
        <div className="flex items-center gap-2">
          <IoLocationOutline className="text-lg" />
          <span className="text-xs font-semibold">{pois.length} lieux</span>
        </div>
      </button>
    );
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "Commodités":
        return t("categories.commodities");
      case "Transports":
        return t("categories.transport");
      case "Loisirs":
        return t("categories.leisure");
      default:
        return t("categories.services");
    }
  };

  return (
    <div className="absolute bottom-4 left-4 z-10 bg-gray/20 dark:bg-slate-950/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-3 max-w-[260px] transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
            <IoLocationOutline className="text-white text-xs" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-800 dark:text-white">
              {t("nearby")}
            </h4>
            <p className="text-[9px] text-gray-500 dark:text-gray-400">
              {t("stats", { inRadius: poisInRadius, outRadius: poisOutRadius })}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <IoCloseOutline className="text-lg" />
        </button>
      </div>

      {/* Bouton pour afficher tous les POIs */}
      <button
        onClick={onToggleDistance}
        className={`w-full mb-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
          showAllDistances
            ? "bg-indigo-500 text-white shadow-md"
            : "bg-white/10 text-indigo-700 dark:text-gray-300 hover:bg-white/20"
        }`}
      >
        {showAllDistances ? t("hideDistant") : t("showMore")}
      </button>

      {/* Indicateur de rayon 3km */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
        <IoRadioButtonOnOutline className="text-[10px] text-indigo-400" />
        <span className="text-[9px] text-gray-500 dark:text-gray-400">
          {t("radiusInfo")}
        </span>
      </div>

      {/* Groups */}
      <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar">
        {POI_GROUPS.map((group) => {
          const hasItems = group.items.some((item) => counts[item] > 0);
          if (!hasItems) return null;

          return (
            <div key={group.category}>
              <p className="text-[9px] font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                {getCategoryLabel(group.category)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map((item) => {
                  const config = POI_DISPLAY[item];
                  if (!config) return null;
                  const count = counts[item] || 0;
                  if (count === 0) return null;

                  const isActive = activeFilters.includes(item);

                  return (
                    <button
                      key={item}
                      onClick={() => toggleFilter(item)}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-white/30 dark:bg-white/20 text-gray-900 dark:text-white shadow-sm"
                          : "bg-white/10 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-white/10"
                      }`}
                    >
                      <span
                        className="text-sm"
                        style={{
                          color: isActive ? "currentColor" : config.color,
                        }}
                      >
                        {config.icon}
                      </span>
                      <span className="text-[11px]">{config.label}</span>
                      <span className="text-[9px] text-gray-500 dark:text-gray-500">
                        ({count})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {activeFilters.length > 0 && (
        <button
          onClick={clearAllFilters}
          className="w-full mt-3 pt-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition flex items-center justify-center gap-1 border-t border-white/20"
        >
          <IoCloseOutline className="text-xs" />
          {t("clear", { count: activeFilters.length })}
        </button>
      )}
    </div>
  );
}
