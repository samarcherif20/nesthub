"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";

export interface Listing {
  id: string;
  title: string;
  location: string;
  pricePerNight: number;
  image: string;
  images: string[];
  latitude: number;
  longitude: number;
  governorate: string;
  delegation: string;
  type: string;
  isVerified: boolean;
  bedrooms: number;
  bathrooms: number;
  rating?: number;
  reviewCount?: number;
  maxGuests?: number;
  trustScore?: number;
  trustLabel?: string;
  trustBadge?: string;
  scamProbability?: number;
  viewCount?: number;
  bookingCount?: number;
  favoriteCount?: number;
}

export interface FilterState {
  searchTerm: string;
  priceRange: [number, number];
  selectedType: string;
  minRating: number;
  sortBy: string;
}

export function useMapData() {
  const { user, isLoaded } = useUser();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [L, setL] = useState<any>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    priceRange: [0, 5000],
    selectedType: "all",
    minRating: 0,
    sortBy: "relevance",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Initialiser Leaflet
  useEffect(() => {
    import("leaflet").then((leaflet) => {
      setL(leaflet);
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });
    });
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

  // Fonction de tri
  const sortListings = useCallback(
    (listingsToSort: Listing[], sortBy: string) => {
      const sorted = [...listingsToSort];

      switch (sortBy) {
        case "price_asc":
          return sorted.sort(
            (a, b) => (a.pricePerNight || 0) - (b.pricePerNight || 0),
          );
        case "price_desc":
          return sorted.sort(
            (a, b) => (b.pricePerNight || 0) - (a.pricePerNight || 0),
          );
        case "rating":
          return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));

        default:
          return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      }
    },
    [],
  );

  // Charger les annonces depuis l'API
  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "/api/listings?page=1&pageSize=100&status=ACTIVE",
      );
      const data = await response.json();

      const listingsWithCoords = (data.listings || [])
        .filter((l: any) => l.latitude && l.longitude)
        .map((l: any) => {
          const firstPhoto = l.photos?.[0]?.url || l.image || "";

          // Calculer la note moyenne à partir des reviews
          let avgRating = undefined;
          if (l.reviews && l.reviews.length > 0) {
            const sum = l.reviews.reduce(
              (acc: number, review: any) => acc + (review.rating || 0),
              0,
            );
            avgRating = parseFloat((sum / l.reviews.length).toFixed(1));
          }

          return {
            id: l.id,
            title: l.title,
            location: `${l.governorate || ""}, ${l.delegation || ""}`,
            pricePerNight: l.pricePerNight || 0,
            image: firstPhoto,
            images: l.photos?.map((p: any) => p.url) || [],
            latitude: l.latitude,
            longitude: l.longitude,
            governorate: l.governorate,
            delegation: l.delegation,
            type: l.type,
            isVerified: l.isVerified || false,
            bedrooms: l.rooms || 1,
            bathrooms: l.bathrooms || 1,
            rating: avgRating,
            reviewCount: l.reviews?.length || 0,
            maxGuests: l.maxGuests || 2,
            trustScore: l.trustScore,
            trustLabel: l.trustLabel,
            trustBadge: l.trustBadge,
            scamProbability: l.scamProbability,
            viewCount: l.viewCount,
            bookingCount: l.bookingCount,
            favoriteCount: l.favoriteCount,
          };
        });

      setListings(listingsWithCoords);

      // Appliquer le tri initial
      const sorted = sortListings(listingsWithCoords, filters.sortBy);
      setFilteredListings(sorted);
    } catch (err) {
      console.error("Erreur chargement:", err);
      setError("Erreur lors du chargement des annonces");
    } finally {
      setLoading(false);
    }
  }, [filters.sortBy, sortListings]);

  // Charger au montage
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Filtrer ET trier les annonces (sans appeler l'API)
  useEffect(() => {
    if (listings.length === 0) return;

    let filtered = [...listings];

    // Filtre par recherche
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(searchLower) ||
          l.governorate?.toLowerCase().includes(searchLower) ||
          l.delegation?.toLowerCase().includes(searchLower),
      );
    }

    // Filtre par prix
    filtered = filtered.filter(
      (l) =>
        (l.pricePerNight || 0) >= filters.priceRange[0] &&
        (l.pricePerNight || 0) <= filters.priceRange[1],
    );

    // Filtre par type
    if (filters.selectedType !== "all") {
      filtered = filtered.filter((l) => l.type === filters.selectedType);
    }

    // Filtre par note minimum
    if (filters.minRating > 0) {
      filtered = filtered.filter((l) => (l.rating || 0) >= filters.minRating);
    }

    // Appliquer le tri
    const sorted = sortListings(filtered, filters.sortBy);

    setFilteredListings(sorted);
  }, [filters, listings, sortListings]);

  // ✅ TOGGLE FAVORITE AVEC API BDD
  const toggleFavorite = useCallback(
    async (listingId: string) => {
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

  const updateSearchTerm = (term: string) => {
    setFilters((prev) => ({ ...prev, searchTerm: term }));
  };

  const updatePriceRange = (range: [number, number]) => {
    setFilters((prev) => ({ ...prev, priceRange: range }));
  };

  const updateSelectedType = (type: string) => {
    setFilters((prev) => ({ ...prev, selectedType: type }));
  };

  const updateMinRating = (rating: number) => {
    setFilters((prev) => ({ ...prev, minRating: rating }));
  };

  const updateSortBy = (sortBy: string) => {
    setFilters((prev) => ({ ...prev, sortBy }));
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: "",
      priceRange: [0, 5000],
      selectedType: "all",
      minRating: 0,
      sortBy: "relevance",
    });
  };

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const getUserLocation = useCallback((mapInstance: any) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          if (mapInstance) {
            mapInstance.setView([latitude, longitude], 14);
          }
        },
        (error) => {
          console.error("Erreur géolocalisation:", error);
        },
      );
    }
  }, []);

  const openInGoogleMaps = (listing: Listing) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`;
    window.open(url, "_blank");
  };

  const getDirections = (listing: Listing) => {
    if (userLocation) {
      const url = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${listing.latitude},${listing.longitude}`;
      window.open(url, "_blank");
    } else {
      openInGoogleMaps(listing);
    }
  };

  return {
    listings,
    filteredListings,
    loading,
    error,
    favorites,
    L,
    imageErrors,
    filters,
    showFilters,
    userLocation,
    setShowFilters,
    toggleFavorite,
    updateSearchTerm,
    updatePriceRange,
    updateSelectedType,
    updateMinRating,
    updateSortBy,
    resetFilters,
    handleImageError,
    getUserLocation,
    openInGoogleMaps,
    getDirections,
    refetchListings: fetchListings,
    totalListings: listings.length,
    filteredCount: filteredListings.length,
    favoritesCount: favorites.length,
  };
}