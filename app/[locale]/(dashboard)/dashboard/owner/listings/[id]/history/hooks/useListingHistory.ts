// app/[locale]/(dashboard)/owner/listings/[id]/history/hooks/useListingHistory.ts
import { useState, useEffect, useCallback } from "react";

export interface HistoryEntry {
  id: string;
  actionType: string;
  fieldName: string | null;
  oldValue: any;
  newValue: any;
  createdAt: string;
  changedByUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profilePictureUrl: string | null;
    email: string;
  };
}

export const ACTION_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string; dotColor: string }> = {
  PRICE_UPDATE: { label: "Tarification", icon: "Tag", color: "text-purple-700", bg: "bg-purple-100", dotColor: "bg-purple-500" },
  STATUS_CHANGE: { label: "Statut", icon: "CheckCircle", color: "text-amber-700", bg: "bg-amber-100", dotColor: "bg-amber-500" },
  PHOTO_UPDATE: { label: "Médias", icon: "Image", color: "text-orange-700", bg: "bg-orange-100", dotColor: "bg-orange-500" },
  EQUIPMENT_UPDATE: { label: "Équipements", icon: "Wrench", color: "text-emerald-700", bg: "bg-emerald-100", dotColor: "bg-emerald-500" },
  UPDATE: { label: "Modification", icon: "FileText", color: "text-blue-700", bg: "bg-blue-100", dotColor: "bg-blue-500" },
};

export const STATUS_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  ACTIVE: { label: "Publiée", icon: "CheckCircle", color: "text-emerald-600" },
  INACTIVE: { label: "Masquée", icon: "EyeOff", color: "text-amber-600" },
  DRAFT: { label: "Brouillon", icon: "AlertCircle", color: "text-slate-500" },
  ARCHIVED: { label: "Archivée", icon: "Archive", color: "text-purple-600" },
};

export const FIELD_LABELS: Record<string, string> = {
  title: "Titre", description: "Description", pricePerNight: "Prix par nuit",
  pricePerMonth: "Prix par mois", status: "Statut", equipment: "Équipements",
  photos: "Photos", rooms: "Chambres", bathrooms: "Salles de bain",
  maxGuests: "Capacité max", surfaceArea: "Surface", governorate: "Gouvernorat",
  delegation: "Délégation", street: "Rue", hasElevator: "Ascenseur",
  rentalType: "Type de location", securityDeposit: "Caution", cleaningFee: "Frais ménage",
};

export function formatValue(value: any, fieldName?: string): string {
  if (value === null || value === undefined) return "—";
  if (fieldName === "status") return STATUS_LABELS[value]?.label || value;
  if (fieldName === "hasElevator") return value ? "Oui" : "Non";
  if (fieldName === "rentalType") {
    const map: Record<string, string> = { SHORT_TERM: "Court terme", LONG_TERM: "Long terme", BOTH: "Les deux" };
    return map[value] || value;
  }
  if (typeof value === "object") {
    if (fieldName === "equipment") {
      const active = Object.entries(value).filter(([, v]) => v).map(([k]) => k);
      return active.length ? active.map(k => FIELD_LABELS[k] || k).join(", ") : "Aucun";
    }
    return JSON.stringify(value);
  }
  if (typeof value === "number") return `${value.toLocaleString("fr-FR")} TND`;
  return String(value);
}

export function getDateGroup(date: string): string {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export function getTimeKey(date: string): string {
  return new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function pip(url: string) {
  if (!url || url === 'null' || url === 'undefined') return null;
  if (url.includes('photos') || url.includes('photo')) return null;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return null;
  return `/api/listings/image?url=${encodeURIComponent(url)}`;
}

export function useListingHistory(listingId: string) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [listingTitle, setListingTitle] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [days, setDays] = useState<number>(30);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetch(`/api/listings/${listingId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => data && setListingTitle(data.title))
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
      }
    } catch (error) {
      console.error(error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [listingId, days, filterType]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const totalPages = Math.ceil(history.length / itemsPerPage);
  const paginatedHistory = history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const groupedHistory = paginatedHistory.reduce((acc, entry) => {
    const dateKey = getDateGroup(entry.createdAt);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, HistoryEntry[]>);

  const filterOptions = [
    { value: "", label: "Toutes", dotColor: "bg-slate-400" },
    { value: "EQUIPMENT_UPDATE", label: "Équipements", dotColor: "bg-emerald-500" },
    { value: "PRICE_UPDATE", label: "Tarifs", dotColor: "bg-purple-500" },
    { value: "STATUS_CHANGE", label: "Statut", dotColor: "bg-amber-500" },
    { value: "PHOTO_UPDATE", label: "Photos", dotColor: "bg-orange-500" },
    { value: "UPDATE", label: "Général", dotColor: "bg-blue-500" },
  ];

  const periodOptions = [
    { label: "30 derniers jours", days: 30 },
    { label: "Trimestre", days: 90 },
    { label: "Année", days: 365 },
    { label: "Tout", days: 9999 },
  ];

  return {
    history,
    loading,
    listingTitle,
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
  };
}