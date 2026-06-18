"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";

export interface Listing {
  id: string;
  title: string;
  description?: string;
  location: string;
  price: number;
  rating: number;
  reviewCount: number;
  image: string;
  type: string;
  badges: string[];
  isVerified: boolean;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  amenities: string[];
  pricePerNight?: number;
  pricePerMonth?: number;
  createdAt?: string;
  viewCount?: number;
  trustScore?: number;
  trustLabel?: string;
  trustBadge?: string;
}

export const categories = [
  { id: "all", name: "Tous", icon: "FaHome", type: null },
  { id: "Villa", name: "Villas", icon: "MdOutlineVilla", type: "VILLA" },
  {
    id: "Appartement",
    name: "Appartements",
    icon: "TbBuildingCommunity",
    type: "APARTMENT",
  },
  { id: "Maison", name: "Maisons", icon: "FaHome", type: "HOUSE" },
  { id: "Studio", name: "Studios", icon: "FaCity", type: "STUDIO" },
  { id: "Duplex", name: "Duplex", icon: "GiModernCity", type: "DUPLEX" },
];

export const allAmenities = [
  "WiFi",
  "Climatisation",
  "Chauffage",
  "Cuisine équipée",
  "Parking",
  "Piscine",
  "Salle de sport",
  "Lave-linge",
  "Télévision",
  "Balcon",
  "Lave-vaisselle",
  "Sèche-linge",
];

// Mapping des équipements vers les clés API
const equipmentMap: Record<string, string> = {
  WiFi: "wifi",
  Climatisation: "airConditioning",
  Chauffage: "heating",
  "Cuisine équipée": "kitchen",
  Parking: "parking",
  Piscine: "swimmingPool",
  "Salle de sport": "gym",
  "Lave-linge": "washingMachine",
  Télévision: "tv",
  Balcon: "balcony",
  "Lave-vaisselle": "dishwasher",
  "Sèche-linge": "dryer",
};

const pip = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

export function useSearch() {
  const { user, isLoaded } = useUser();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [listings, setListings] = useState<Listing[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("relevance");

  const [searchDestination, setSearchDestination] = useState("");
  const [searchDates, setSearchDates] = useState({ checkIn: "", checkOut: "" });
  const [searchGuests, setSearchGuests] = useState(1);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [totalPages, setTotalPages] = useState(1);

  const [isMounted, setIsMounted] = useState(false);

  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Charger les favoris depuis l'API BDD ou localStorage
  const loadFavorites = useCallback(async () => {
    if (!isLoaded) return;

    try {
      if (user) {
        // Utilisateur connecté → API BDD
        const response = await fetch("/api/users/favorites");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setFavorites(data.favorites.map((f: any) => f.id));
          }
        }
      } else {
        // Non connecté → localStorage
        const saved = localStorage.getItem("favorites");
        if (saved) {
          setFavorites(JSON.parse(saved));
        }
      }
    } catch (err) {
      console.error("Erreur chargement favoris:", err);
    }
  }, [user, isLoaded]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  useEffect(() => {
    const handleFavoritesUpdate = () => loadFavorites();
    window.addEventListener("favorites-updated", handleFavoritesUpdate);
    return () =>
      window.removeEventListener("favorites-updated", handleFavoritesUpdate);
  }, [loadFavorites]);

  const cleanImageUrl = useCallback(
    (photoUrl: string | null | undefined): string | null => {
      if (!photoUrl) return null;

      if (photoUrl.startsWith("/api/listings/image")) {
        try {
          const urlParams = new URLSearchParams(photoUrl.split("?")[1]);
          const realUrl = urlParams.get("url");
          if (realUrl) {
            return decodeURIComponent(realUrl);
          }
        } catch (e) {
          console.error("Erreur nettoyage URL:", e);
        }
      }
      return photoUrl;
    },
    [],
  );

  const getImageUrl = useCallback(
    (photoUrl: string | null | undefined) => {
      if (!photoUrl) return "/images/placeholder.jpg";

      const cleanUrl = cleanImageUrl(photoUrl);
      if (!cleanUrl) return "/images/placeholder.jpg";

      if (cleanUrl.includes("vercel-storage.com")) {
        return pip(cleanUrl);
      }

      return cleanUrl;
    },
    [cleanImageUrl],
  );

  const fetchListings = useCallback(
    async (params: {
      page: number;
      category: string;
      amenities: string[];
      price: [number, number];
      destination: string;
      checkIn?: string;
      checkOut?: string;
      guests: number;
      sort: string;
    }) => {
      setLoading(true);
      try {
        const urlParams = new URLSearchParams();
        urlParams.set("page", params.page.toString());
        urlParams.set("pageSize", itemsPerPage.toString());

        if (params.destination.trim() !== "") {
          urlParams.set("searchLocation", params.destination.trim());
        }
        if (params.checkIn && params.checkOut) {
          urlParams.set("checkIn", params.checkIn);
          urlParams.set("checkOut", params.checkOut);
        }

        const selectedCat = categories.find((c) => c.id === params.category);
        if (selectedCat && selectedCat.type && selectedCat.id !== "all") {
          urlParams.set("type", selectedCat.type);
        }

        if (params.price[1] < 5000) {
          urlParams.set("maxPrice", params.price[1].toString());
        }
        if (params.price[0] > 0) {
          urlParams.set("minPrice", params.price[0].toString());
        }

        if (params.guests > 1) {
          urlParams.set("guests", params.guests.toString());
        }

        if (params.sort !== "relevance") {
          urlParams.set("sortBy", params.sort);
        }

        if (params.amenities.length > 0) {
          const equipmentKeys = params.amenities.map(
            (a) => equipmentMap[a] || a.toLowerCase(),
          );
          urlParams.set("equipment", equipmentKeys.join(","));
        }

        const response = await fetch(`/api/listings?${urlParams.toString()}`);
        const data = await response.json();

        if (response.ok && data.listings) {
          const formattedListings = data.listings.map((item: any) => {
            let rawPhotoUrl = item.photos?.[0]?.url;
            let cleanPhotoUrl = rawPhotoUrl;

            if (
              cleanPhotoUrl &&
              cleanPhotoUrl.startsWith("/api/listings/image")
            ) {
              try {
                const urlParams = new URLSearchParams(
                  cleanPhotoUrl.split("?")[1],
                );
                const realUrl = urlParams.get("url");
                if (realUrl) {
                  cleanPhotoUrl = decodeURIComponent(realUrl);
                }
              } catch (e) {
                console.error("Erreur parsing URL:", e);
              }
            }

            return {
              id: item.id,
              title: item.title,
              description: item.description,
              location: `${item.governorate || ""}, ${item.delegation || ""}`
                .replace(/^, /, "")
                .replace(/, $/, ""),
              price: item.pricePerNight || item.pricePerMonth || 0,
              pricePerNight: item.pricePerNight,
              pricePerMonth: item.pricePerMonth,
              rating: item.rating,
              reviewCount: item.reviewCount,
              image: getImageUrl(cleanPhotoUrl),
              type: item.type?.toLowerCase() || "appartement",
              badges: item.isVerified ? ["Vérifié"] : [],
              isVerified: item.isVerified || false,
              bedrooms: item.rooms,
              bathrooms: item.bathrooms,
              maxGuests: item.maxGuests,
              amenities: item.equipment || [],
              createdAt: item.createdAt,
              viewCount: item.viewCount,
              trustScore: item.trustScore,
              trustLabel: item.trustLabel,
              trustBadge: item.trustBadge,
            };
          });

          setListings(formattedListings);
          setTotalCount(data.pagination.totalCount);
          setTotalPages(data.pagination.totalPages);
        } else {
          setListings([]);
          setTotalCount(0);
          setTotalPages(1);
        }
      } catch (error) {
        console.error("Erreur chargement:", error);
        setListings([]);
      } finally {
        setLoading(false);
      }
    },
    [getImageUrl],
  );

 useEffect(() => {
  fetchListings({
    page: currentPage,
    category: selectedCategory,
    amenities: selectedAmenities,
    price: priceRange,
    destination: searchDestination,
    checkIn: searchDates.checkIn || undefined,
    checkOut: searchDates.checkOut || undefined,
    guests: searchGuests,
    sort: sortBy,
  });
}, [
  currentPage,
  selectedCategory,
  selectedAmenities,
  priceRange[1],
  searchDestination,
  searchDates.checkIn,
  searchDates.checkOut,
  searchGuests,
  sortBy,
]);
const selectCategory = useCallback((categoryId: string) => {
  setSelectedCategory(categoryId);
  setCurrentPage(1);
}, []);

  const toggleAmenity = useCallback((amenity: string) => {
  setSelectedAmenities((prev) =>
    prev.includes(amenity)
      ? prev.filter((a) => a !== amenity)
      : [...prev, amenity],
  );
  setCurrentPage(1);
}, []);
 const handleSearch = useCallback(() => {
  setCurrentPage(1);
}, []);
const resetFilters = useCallback(() => {
  setSelectedCategory("all");
  setSelectedAmenities([]);
  setPriceRange([0, 5000]);
  setSortBy("relevance");
  setSearchDestination("");
  setSearchDates({ checkIn: "", checkOut: "" });
  setSearchGuests(1);
  setCurrentPage(1);
}, []);
  //  TOGGLE FAVORITE AVEC API BDD
  const toggleFavorite = useCallback(
    async (listingId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const wasFavorite = favorites.includes(listingId);

      // Optimistic update
      setFavorites((prev) =>
        wasFavorite
          ? prev.filter((id) => id !== listingId)
          : [...prev, listingId],
      );

      try {
        if (user) {
          // Utilisateur connecté → API BDD
          if (wasFavorite) {
            await fetch(`/api/users/favorites?listingId=${listingId}`, {
              method: "DELETE",
            });
          } else {
            await fetch("/api/users/favorites", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ listingId }),
            });
          }
        } else {
          // Non connecté → localStorage
          const saved = localStorage.getItem("favorites");
          const updated = wasFavorite
            ? JSON.parse(saved || "[]").filter((id: string) => id !== listingId)
            : [...(JSON.parse(saved || "[]")), listingId];
          localStorage.setItem("favorites", JSON.stringify(updated));
        }

        window.dispatchEvent(new Event("favorites-updated"));
      } catch (err) {
        // Rollback en cas d'erreur
        console.error("Erreur toggle favorite:", err);
        setFavorites((prev) =>
          wasFavorite
            ? [...prev, listingId]
            : prev.filter((id) => id !== listingId),
        );
      }
    },
    [favorites, user],
  );

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return {
    listings,
    favorites,
    loading,
    viewMode,
    priceRange,
    selectedCategory,
    selectedAmenities,
    sortBy,
    isFilterOpen,
    currentPage,
    totalPages,
    searchDestination,
    searchDates,
    searchGuests,
    isMounted,
    totalCount,
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, totalCount),
    setViewMode,
    setPriceRange,
    setSelectedCategory,
    selectCategory,
    setSortBy,
    setIsFilterOpen,
    setSearchDestination,
    setSearchDates,
    setSearchGuests,
    resetFilters,
    toggleAmenity,
    toggleFavorite,
    handleSearch,
    goToPage,
    categories,
    allAmenities,
  };
}