// hooks/useCompare.ts
import { useState, useEffect, useCallback } from "react";

export interface CompareListing {
  id: string;
  title: string;
  location: string;
  governorate: string;
  delegation: string;
  pricePerNight: number;
  rating: number;
  reviewCount: number;
  image: string;
  images: string[];
  type: string;
  isVerified: boolean;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  surfaceArea: number;
  amenities: string[];
  equipment: Record<string, unknown>;
  description: string;
}

export type SortKey = "rating" | "price" | "beds" | "guests";

export type AlertType = "success" | "error" | "info" | "warning";

export interface AlertState {
  type: AlertType;
  message: string;
}

export const EQUIPMENT_FR: Record<string, string> = {
  wifi: "Wi-Fi",
  parking: "Parking",
  swimmingPool: "Piscine",
  airConditioning: "Climatisation",
  kitchen: "Cuisine équipée",
  tv: "Télévision",
  heating: "Chauffage",
  washingMachine: "Machine à laver",
  dryer: "Sèche-linge",
  dishwasher: "Lave-vaisselle",
  oven: "Four",
  microwave: "Micro-ondes",
  coffeeMaker: "Cafetière",
  refrigerator: "Réfrigérateur",
  balcony: "Balcon",
  garden: "Jardin",
  terrace: "Terrasse",
  beachAccess: "Accès plage",
  seaView: "Vue mer",
  mountainView: "Vue montagne",
  cityView: "Vue ville",
  elevator: "Ascenseur",
  gym: "Salle de sport",
  sauna: "Sauna",
  jacuzzi: "Jacuzzi",
  fireplace: "Cheminée",
  barbecue: "Barbecue",
  babyBed: "Lit bébé",
  allowedPets: "Animaux acceptés",
  workDesk: "Bureau",
  allowedSmoking: "Fumeurs acceptés",
  eventsAllowed: "Événements autorisés",
  concierge: "Conciergerie",
  airportShuttle: "Navette aéroport",
  dailyCleaning: "Ménage quotidien",
  breakfast: "Petit-déjeuner",
  ac: "Climatisation",
  pool: "Piscine",
};

export const formatAmenityName = (amenity: string): string => {
  const lowerKey = amenity.toLowerCase();
  if (EQUIPMENT_FR[lowerKey]) {
    return EQUIPMENT_FR[lowerKey];
  }
  if (lowerKey === "ac") return "Climatisation";
  if (lowerKey === "pool") return "Piscine";
  if (lowerKey === "wifi") return "Wi-Fi";
  if (lowerKey === "tv") return "Télévision";
  const formatted = amenity
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim();
  return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
};

export const extractAmenities = (equipment: Record<string, unknown>): string[] => {
  if (!equipment) return [];
  if (Array.isArray(equipment)) {
    return equipment as string[];
  }
  return Object.keys(equipment).filter(
    (k) => equipment[k] === true || equipment[k] === "true"
  );
};

export const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return "https://placehold.co/600x400/e2e8f0/6366f1?text=NestHub";
  if (url.startsWith("http") && !url.includes("vercel-storage.com")) return url;
  if (url.includes("vercel-storage.com"))
    return `/api/listings/image?url=${encodeURIComponent(url)}`;
  if (url.startsWith("/api/listings/image")) return url;
  return "https://placehold.co/600x400/e2e8f0/6366f1?text=NestHub";
};

export const computeScore = (listing: CompareListing): number => {
  const ratingScore = (listing.rating / 5) * 40;
  const priceScore = Math.max(0, 20 - listing.pricePerNight / 200);
  const amenityScore = Math.min(listing.amenities.length * 2, 20);
  const reviewScore = Math.min(listing.reviewCount / 10, 20);
  return Math.round(ratingScore + priceScore + amenityScore + reviewScore);
};

export function useCompare() {
  const [mounted, setMounted] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [listings, setListings] = useState<CompareListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("rating");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const showAlert = useCallback((type: AlertType, message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  }, []);

  useEffect(() => setMounted(true), []);

  const fetchListings = useCallback(async (ids: string[]) => {
    setLoading(true);
    try {
      const results = await Promise.all(
        ids.map(async (id) => {
          const res = await fetch(`/api/listings/${id}`);
          if (!res.ok) return null;
          const data = await res.json();

          const imageUrl =
            data.images?.[0] ??
            data.photos?.[0]?.url ??
            data.photos?.[0] ??
            data.image ??
            data.mainImage ??
            "";

          const amenities = extractAmenities(data.equipment ?? {});

          const locationParts = [data.governorate, data.delegation].filter(Boolean);
          const location = locationParts.join(", ") || data.location || "Emplacement non spécifié";

          return {
            id: data.id,
            title: data.title,
            location,
            governorate: data.governorate ?? "",
            delegation: data.delegation ?? "",
            pricePerNight: data.pricePerNight,
            rating: data.rating ?? 4.5,
            reviewCount: data.reviewCount ?? 0,
            image: getImageUrl(imageUrl),
            images: data.images ?? [],
            type: data.type?.toUpperCase() ?? "APPARTEMENT",
            isVerified: data.isVerified ?? false,
            bedrooms: data.bedrooms ?? data.rooms ?? 1,
            bathrooms: data.bathrooms ?? 1,
            maxGuests: data.maxGuests ?? 2,
            surfaceArea: data.surfaceArea ?? 0,
            amenities,
            equipment: data.equipment ?? {},
            description: data.description ?? "",
          } as CompareListing;
        })
      );
      setListings(results.filter((l): l is CompareListing => l !== null));
    } catch {
      showAlert("error", "Erreur lors du chargement des propriétés");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    if (!mounted) return;
    const stored = localStorage.getItem("compare_listings");
    if (stored) {
      const ids: string[] = JSON.parse(stored);
      setCompareIds(ids);
      fetchListings(ids);
    } else {
      setLoading(false);
    }
  }, [mounted, fetchListings]);

  const removeFromCompare = useCallback((id: string, title: string) => {
    setRemovingId(id);
    setTimeout(() => {
      const newIds = compareIds.filter((i) => i !== id);
      setCompareIds(newIds);
      localStorage.setItem("compare_listings", JSON.stringify(newIds));
      setListings((prev) => prev.filter((l) => l.id !== id));
      setRemovingId(null);
      window.dispatchEvent(new Event("favorites-updated"));
      showAlert("info", `"${title}" retiré de la comparaison`);
    }, 300);
  }, [compareIds, showAlert]);

  const clearAll = useCallback(() => {
    setListings([]);
    setCompareIds([]);
    localStorage.removeItem("compare_listings");
    window.dispatchEvent(new Event("favorites-updated"));
    showAlert("info", "Comparaison réinitialisée");
  }, [showAlert]);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareMenu(false);
    showAlert("success", "Lien copié dans le presse-papier !");
  }, [showAlert]);

  const handleImageError = useCallback((id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  }, []);

  const sortedListings = [...listings].sort((a, b) => {
    if (sortKey === "rating") return b.rating - a.rating;
    if (sortKey === "price") return a.pricePerNight - b.pricePerNight;
    if (sortKey === "beds") return b.bedrooms - a.bedrooms;
    if (sortKey === "guests") return b.maxGuests - a.maxGuests;
    return 0;
  });

  const allAmenities = Array.from(
    new Set(listings.flatMap((l) => l.amenities))
  ).sort();

  const bestListing = listings.length > 0
    ? listings.reduce((best, cur) => (computeScore(cur) > computeScore(best) ? cur : best), listings[0])
    : null;

  const avgPrice = listings.length > 0
    ? Math.round(listings.reduce((s, l) => s + l.pricePerNight, 0) / listings.length)
    : 0;
  
  const avgRating = listings.length > 0
    ? (listings.reduce((s, l) => s + l.rating, 0) / listings.length).toFixed(1)
    : "—";
  
  const avgBeds = listings.length > 0
    ? (listings.reduce((s, l) => s + l.bedrooms, 0) / listings.length).toFixed(1)
    : "—";

  const characteristicsRowCount = 1 + allAmenities.length;
  const characteristicsHeight = characteristicsRowCount * 48;

  return {
    // State
    mounted,
    listings: sortedListings,
    loading,
    imageErrors,
    alert,
    sortKey,
    removingId,
    showShareMenu,
    allAmenities,
    bestListing,
    avgPrice,
    avgRating,
    avgBeds,
    characteristicsRowCount,
    characteristicsHeight,
    
    // Actions
    setSortKey,
    setShowShareMenu,
    removeFromCompare,
    clearAll,
    copyLink,
    handleImageError,
    showAlert,
    setAlert,
  };
}