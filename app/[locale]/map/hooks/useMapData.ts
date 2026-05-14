"use client";

import { useState, useEffect, useCallback } from "react";

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
}

export interface FilterState {
  searchTerm: string;
  priceRange: [number, number];
  selectedType: string;
  minRating: number;
}

export function useMapData() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [L, setL] = useState<any>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    priceRange: [0, 5000],
    selectedType: "all",
    minRating: 0,
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

  // Charger les favoris
  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) {
      setFavorites(JSON.parse(saved));
    }

    const handleFavoritesUpdate = () => {
      const updated = localStorage.getItem("favorites");
      if (updated) {
        setFavorites(JSON.parse(updated));
      }
    };

    window.addEventListener("favorites-updated", handleFavoritesUpdate);
    return () =>
      window.removeEventListener("favorites-updated", handleFavoritesUpdate);
  }, []);

  // Charger les annonces
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await fetch("/api/listings?page=1&pageSize=100");
        const data = await response.json();

        const listingsWithCoords = (data.listings || [])
          .filter((l: any) => l.latitude && l.longitude)
          .map((l: any) => {
            const firstPhoto = l.photos?.[0]?.url || l.image || "";
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
              rating: l.rating || 4.5,
              reviewCount: l.reviewCount || 0,
              maxGuests: l.maxGuests || 2,
            };
          });

        setListings(listingsWithCoords);
        setFilteredListings(listingsWithCoords);
      } catch (error) {
        console.error("Erreur chargement:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  // Filtrer les annonces
  useEffect(() => {
    let filtered = [...listings];

    if (filters.searchTerm) {
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          l.governorate?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          l.delegation?.toLowerCase().includes(filters.searchTerm.toLowerCase()),
      );
    }

    filtered = filtered.filter(
      (l) =>
        l.pricePerNight >= filters.priceRange[0] && l.pricePerNight <= filters.priceRange[1],
    );

    if (filters.selectedType !== "all") {
      filtered = filtered.filter((l) => l.type === filters.selectedType);
    }

    if (filters.minRating > 0) {
      filtered = filtered.filter((l) => (l.rating || 0) >= filters.minRating);
    }

    setFilteredListings(filtered);
  }, [filters, listings]);

  const toggleFavorite = useCallback((listingId: string) => {
    setFavorites((prev) => {
      const newFavorites = prev.includes(listingId)
        ? prev.filter((id) => id !== listingId)
        : [...prev, listingId];
      localStorage.setItem("favorites", JSON.stringify(newFavorites));
      window.dispatchEvent(new Event("favorites-updated"));
      return newFavorites;
    });
  }, []);

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

  const resetFilters = () => {
    setFilters({
      searchTerm: "",
      priceRange: [0, 5000],
      selectedType: "all",
      minRating: 0,
    });
  };

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  // ✅ NOUVELLE FONCTION : Récupérer la position de l'utilisateur
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
        }
      );
    }
  }, []);

  // ✅ NOUVELLE FONCTION : Ouvrir dans Google Maps
  const openInGoogleMaps = (listing: Listing) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`;
    window.open(url, "_blank");
  };

  // ✅ NOUVELLE FONCTION : Itinéraire depuis position utilisateur
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
    resetFilters,
    handleImageError,
    getUserLocation,
    openInGoogleMaps,
    getDirections,
    totalListings: listings.length,
    filteredCount: filteredListings.length,
    favoritesCount: favorites.length,
  };
}