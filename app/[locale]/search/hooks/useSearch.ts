"use client";

import { useState, useEffect, useCallback } from "react";

export interface Listing {
  id: string;
  title: string;
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

// ✅ FONCTION PIP POUR LES IMAGES
const pip = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

export function useSearch() {
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

  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("favorites");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ✅ FONCTION POUR NETTOYER LES URLs PROXIFIÉES
  const cleanImageUrl = useCallback(
    (photoUrl: string | null | undefined): string | null => {
      if (!photoUrl) return null;

      // Si c'est déjà une URL proxifiée, extraire l'URL réelle
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

  // ✅ FONCTION getImageUrl CORRIGÉE
  const getImageUrl = useCallback(
    (photoUrl: string | null | undefined) => {
      if (!photoUrl) return "/images/placeholder.jpg";

      // Nettoyer l'URL au cas où elle serait déjà proxifiée
      const cleanUrl = cleanImageUrl(photoUrl);
      if (!cleanUrl) return "/images/placeholder.jpg";

      // Appliquer pip UNIQUEMENT aux URLs Vercel (comme dans la partie propriétaire)
      if (cleanUrl.includes("vercel-storage.com")) {
        return pip(cleanUrl);
      }

      return cleanUrl;
    },
    [cleanImageUrl],
  );

  // Fonction de recherche corrigée
  const fetchListings = useCallback(
    async (params: {
      page: number;
      category: string;
      amenities: string[];
      price: [number, number];
      destination: string;
      checkIn?: string; // ← AJOUTE
      checkOut?: string; // ← AJOUTE
      guests: number;
      sort: string;
    }) => {
      setLoading(true);
      try {
        const urlParams = new URLSearchParams();
        urlParams.set("page", params.page.toString());
        urlParams.set("pageSize", itemsPerPage.toString());

        if (params.destination.trim() !== "") {
          // Utilise le nouveau paramètre searchLocation
          urlParams.set("searchLocation", params.destination.trim());
        }
        if (params.checkIn && params.checkOut) {
          urlParams.set("checkIn", params.checkIn);
          urlParams.set("checkOut", params.checkOut);
        }

        // Catégorie
        const selectedCat = categories.find((c) => c.id === params.category);
        if (selectedCat && selectedCat.type && selectedCat.id !== "all") {
          urlParams.set("type", selectedCat.type);
        }

        // Prix
        if (params.price[1] < 5000) {
          urlParams.set("maxPrice", params.price[1].toString());
        }
        if (params.price[0] > 0) {
          urlParams.set("minPrice", params.price[0].toString());
        }

        // Nombre de voyageurs
        if (params.guests > 1) {
          urlParams.set("guests", params.guests.toString());
        }

        // Tri
        if (params.sort !== "relevance") {
          urlParams.set("sortBy", params.sort);
        }

        // Équipements
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
            // 🔥 Récupérer l'URL de la première photo et la nettoyer
            let rawPhotoUrl = item.photos?.[0]?.url;

            // Nettoyer l'URL si elle est déjà proxifiée
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
              location: `${item.governorate || ""}, ${item.delegation || ""}`
                .replace(/^, /, "")
                .replace(/, $/, ""),
              price: item.pricePerNight || item.pricePerMonth || 0,
              pricePerNight: item.pricePerNight,
              pricePerMonth: item.pricePerMonth,
              rating: item.rating || 4.5,
              reviewCount: item.reviewCount || 0,
              // 🔥 Appliquer getImageUrl sur la photo nettoyée
              image: getImageUrl(cleanPhotoUrl),
              type: item.type?.toLowerCase() || "appartement",
              badges: item.isVerified ? ["Vérifié"] : [],
              isVerified: item.isVerified || false,
              bedrooms: item.rooms || 1,
              bathrooms: item.bathrooms || 1,
              maxGuests: item.maxGuests || 2,
              amenities: item.equipment || [],
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

  // Chargement initial uniquement (1 seule fois au montage)
  useEffect(() => {
    fetchListings({
      page: currentPage,
      category: selectedCategory,
      amenities: selectedAmenities,
      price: priceRange,
      destination: searchDestination,
      guests: searchGuests,
      sort: sortBy,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← Tableau de dépendances VIDE !

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
    fetchListings({
      page: 1,
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
    selectedCategory,
    selectedAmenities,
    priceRange,
    searchDestination,
    searchDates, 
    searchGuests,
    sortBy,
    fetchListings,
  ]);
  const resetFilters = useCallback(() => {
    setSelectedCategory("all");
    setSelectedAmenities([]);
    setPriceRange([0, 5000]);
    setSortBy("relevance");
    setSearchDestination("");
    setSearchDates({ checkIn: "", checkOut: "" }); // ← déjà présent
    setSearchGuests(1);
    setCurrentPage(1);
    fetchListings({
      page: 1,
      category: "all",
      amenities: [],
      price: [0, 5000],
      destination: "",
      checkIn: "", // ← AJOUTE
      checkOut: "", // ← AJOUTE
      guests: 1,
      sort: "relevance",
    });
  }, [fetchListings]);

  const toggleFavorite = useCallback(
    (listingId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setFavorites((prev) => {
        const newFavorites = prev.includes(listingId)
          ? prev.filter((id) => id !== listingId)
          : [...prev, listingId];

        localStorage.setItem("favorites", JSON.stringify(newFavorites));
        window.dispatchEvent(new Event("favorites-updated"));
        return newFavorites;
      });
    },
    [],
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
