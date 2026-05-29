// app/[locale]/(dashboard)/owner/listings/[id]/history/hooks/useListingHistory.ts
import { useState, useEffect, useCallback } from "react";

export interface HistoryEntry {
  id: string;
  actionType: string;
  fieldName: string | null;
  oldValue: any;
  newValue: any;
  createdAt: string;
  isPendingRevision?: boolean;
  changedByUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profilePictureUrl: string | null;
    email: string;
    role?: string; 
    displayName?: string;
    isAdmin?: boolean; 
  };
}

// 🔥 CONFIGURATION DES ACTIONS (labels via t plus tard)
export const ACTION_CONFIG: Record<
  string,
  { icon: string; color: string; bg: string; dotColor: string }
> = {
  PRICE_UPDATE: {
    icon: "Tag",
    color: "text-purple-700",
    bg: "bg-purple-100",
    dotColor: "bg-purple-500",
  },
  STATUS_CHANGE: {
    icon: "CheckCircle",
    color: "text-amber-700",
    bg: "bg-amber-100",
    dotColor: "bg-amber-500",
  },
  PHOTO_UPDATE: {
    icon: "Image",
    color: "text-orange-700",
    bg: "bg-orange-100",
    dotColor: "bg-orange-500",
  },
  EQUIPMENT_UPDATE: {
    icon: "Wrench",
    color: "text-emerald-700",
    bg: "bg-emerald-100",
    dotColor: "bg-emerald-500",
  },
  UPDATE: {
    icon: "FileText",
    color: "text-blue-700",
    bg: "bg-blue-100",
    dotColor: "bg-blue-500",
  },
  PENDING_REVISION: { 
    icon: "Clock",
    color: "text-orange-700",
    bg: "bg-orange-100",
    dotColor: "bg-orange-500",
  },
};

// 🔥 Fonctions helper pour obtenir les labels traduits
export function getActionTypeLabel(actionType: string, t: any): string {
  const labels: Record<string, string> = {
    PRICE_UPDATE: t("actionTypes.priceUpdate"),
    STATUS_CHANGE: t("actionTypes.statusChange"),
    PHOTO_UPDATE: t("actionTypes.photoUpdate"),
    EQUIPMENT_UPDATE: t("actionTypes.equipmentUpdate"),
    UPDATE: t("actionTypes.update"),
    CREATE: t("actionTypes.create"),
    PENDING_REVISION: t("actionTypes.pendingRevision"),
  };
  return labels[actionType] || actionType;
}

export function getFieldLabel(fieldName: string | null, t: any): string {
  const labels: Record<string, string> = {
    title: t("fieldLabels.title"),
    description: t("fieldLabels.description"),
    pricePerNight: t("fieldLabels.pricePerNight"),
    pricePerMonth: t("fieldLabels.pricePerMonth"),
    status: t("fieldLabels.status"),
    equipment: t("fieldLabels.equipment"),
    photos: t("fieldLabels.photos"),
    rooms: t("fieldLabels.rooms"),
    bathrooms: t("fieldLabels.bathrooms"),
    maxGuests: t("fieldLabels.maxGuests"),
    surfaceArea: t("fieldLabels.surfaceArea"),
    hasElevator: t("fieldLabels.hasElevator"),
    rentalType: t("fieldLabels.rentalType"),
    securityDeposit: t("fieldLabels.securityDeposit"),
    cleaningFee: t("fieldLabels.cleaningFee"),
    governorate: t("fieldLabels.governorate"),
    delegation: t("fieldLabels.delegation"),
    street: t("fieldLabels.street"),
  };
  return labels[fieldName || ""] || fieldName || t("fieldLabels.general");
}

export function getEquipmentLabel(eqKey: string, t: any): string {
  const equipmentLabels: Record<string, string> = {
    wifi: t("equipment.wifi"),
    ac: t("equipment.ac"),
    heating: t("equipment.heating"),
    kitchen: t("equipment.kitchen"),
    parking: t("equipment.parking"),
    pool: t("equipment.pool"),
    gym: t("equipment.gym"),
    washer: t("equipment.washer"),
    tv: t("equipment.tv"),
    balcony: t("equipment.balcony"),
    dishwasher: t("equipment.dishwasher"),
    dryer: t("equipment.dryer"),
    coffee: t("equipment.coffee"),
    smartlock: t("equipment.smartlock"),
    speaker: t("equipment.speaker"),
    workplace: t("equipment.workplace"),
    elevator: t("equipment.elevator"),
  };
  return equipmentLabels[eqKey] || eqKey.replace(/([A-Z])/g, " $1").trim();
}

export function getStatusLabel(status: string, t: any): string {
  const statusMap: Record<string, string> = {
    ACTIVE: t("status.active"),
    INACTIVE: t("status.inactive"),
    DRAFT: t("status.draft"),
    ARCHIVED: t("status.archived"),
    REJECTED: t("status.rejected"),
    PENDING_REVIEW: t("status.pendingReview"),
  };
  return statusMap[status] || status;
}

function parseJsonValue(value: any): any {
  if (!value) return value;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    if (
      (value.startsWith("{") && value.endsWith("}")) ||
      (value.startsWith("[") && value.endsWith("]"))
    ) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
  }
  return value;
}

export function formatValue(value: any, fieldName?: string | null, t?: any): string {
  if (value === null || value === undefined) return "—";

  const parsed = parseJsonValue(value);

  if (fieldName === "status") {
    if (typeof parsed === "object" && parsed.status) {
      return getStatusLabel(parsed.status, t);
    }
    if (typeof parsed === "string") {
      return getStatusLabel(parsed, t);
    }
  }

  if (fieldName === "equipment" && typeof parsed === "object") {
    const active = Object.entries(parsed)
      .filter(([, v]) => v === true)
      .map(([k]) => getEquipmentLabel(k, t));
    return active.length ? active.join(", ") : t("equipment.none");
  }

  if (fieldName === "hasElevator") {
    const boolValue = typeof parsed === "object" ? parsed.hasElevator : parsed;
    return boolValue === true || boolValue === "true" ? t("boolean.yes") : t("boolean.no");
  }

  if (fieldName === "rentalType") {
    const valueStr = typeof parsed === "object" ? parsed.rentalType : parsed;
    const map: Record<string, string> = {
      SHORT_TERM: t("rentalTypes.shortTerm"),
      LONG_TERM: t("rentalTypes.longTerm"),
      BOTH: t("rentalTypes.both"),
    };
    return map[valueStr] || valueStr;
  }

  if (
    fieldName === "pricePerNight" ||
    fieldName === "pricePerMonth" ||
    fieldName === "securityDeposit" ||
    fieldName === "cleaningFee"
  ) {
    const num = typeof parsed === "number" ? parsed : parseFloat(parsed);
    if (!isNaN(num)) return `${num.toLocaleString("fr-FR")} ${t("currency.tnd")}`;
  }

  if (typeof parsed === "number") return parsed.toLocaleString("fr-FR");
  if (typeof parsed === "string") return parsed;
  if (typeof parsed === "object") {
    if (parsed.status) return getStatusLabel(parsed.status, t);
    if (parsed.title) return parsed.title;
    return JSON.stringify(parsed);
  }

  return String(parsed);
}

export function getDateGroup(date: string): string {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function getTimeKey(date: string): string {
  return new Date(date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function pip(url: string | null | undefined): string | undefined {
  if (!url || url === "null" || url === "undefined") return undefined;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return undefined;
  return `/api/listings/image?url=${encodeURIComponent(url)}`;
}

export function useListingHistory(listingId: string, setError?: (error: string) => void, t?: any) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [listingTitle, setListingTitle] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [days, setDays] = useState<number>(30);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const getUserDisplayName = useCallback((user: HistoryEntry["changedByUser"]): string => {
    if (user.isAdmin && user.displayName) {
      return user.displayName;
    }
    if (user.displayName) {
      return user.displayName;
    }
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    if (user.email) {
      return user.email.split("@")[0];
    }
    return t ? t("user.default") : "Utilisateur";
  }, [t]);

  useEffect(() => {
    fetch(`/api/listings/${listingId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setListingTitle(data.title))
      .catch(() => {});
  }, [listingId]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/listings/${listingId}/history?days=${days}`;
      if (filterType) url += `&actionType=${filterType}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
        setCurrentPage(1);
      } else {
        setHistory([]);
        if (setError) setError(t ? t("errors.loadFailed") : "Erreur lors du chargement de l'historique");
      }
    } catch (error) {
      console.error(error);
      setHistory([]);
      if (setError) setError(t ? t("errors.networkError") : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }, [listingId, days, filterType, setError, t]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const totalPages = Math.ceil(history.length / itemsPerPage);
  const paginatedHistory = history.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const groupedHistory = paginatedHistory.reduce(
    (acc, entry) => {
      const dateKey = getDateGroup(entry.createdAt);
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(entry);
      return acc;
    },
    {} as Record<string, HistoryEntry[]>,
  );

  const filterOptions = [
    { value: "", label: t ? t("filters.all") : "Toutes", dotColor: "bg-slate-400" },
    { value: "EQUIPMENT_UPDATE", label: t ? t("filters.equipment") : "Équipements", dotColor: "bg-emerald-500" },
    { value: "PRICE_UPDATE", label: t ? t("filters.prices") : "Tarifs", dotColor: "bg-purple-500" },
    { value: "STATUS_CHANGE", label: t ? t("filters.status") : "Statut", dotColor: "bg-amber-500" },
    { value: "PHOTO_UPDATE", label: t ? t("filters.photos") : "Photos", dotColor: "bg-orange-500" },
    { value: "UPDATE", label: t ? t("filters.general") : "Général", dotColor: "bg-blue-500" },
    { value: "PENDING_REVISION", label: t ? t("filters.pending") : "En attente", dotColor: "bg-orange-500" },
  ];

  const periodOptions = [
    { label: t ? t("periods.last30Days") : "30 derniers jours", days: 30 },
    { label: t ? t("periods.quarter") : "Trimestre", days: 90 },
    { label: t ? t("periods.year") : "Année", days: 365 },
    { label: t ? t("periods.all") : "Tout", days: 9999 },
  ];

  return {
    history,
    loading,
    listingTitle,
    setListingTitle,
    filterType,
    setFilterType,
    days,
    setDays,
    currentPage,
    setCurrentPage,
    totalPages,
    groupedHistory,
    filterOptions,
    periodOptions,
    getUserDisplayName,
  };
}