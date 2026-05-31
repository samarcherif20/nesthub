// hooks/useFavorites.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";

export interface FavoriteListing {
  id: string;
  title: string;
  location: string;
  price: number;
  rating?: number | null;
  reviewCount?: number;
  image: string;
  type: string;
  isVerified: boolean;
  bedrooms: number;
  bathrooms: number;
  maxGuests?: number | null;
  trustScore?: number | null;
  amenities?: any;
  pricePerNight?: number;
}

const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return "https://placehold.co/600x400/e2e8f0/1e90ff?text=NestHub";
  if (url.startsWith("/api/listings/image")) return url;
  if (url.includes("vercel-storage.com")) return `/api/listings/image?url=${encodeURIComponent(url)}`;
  if (url.startsWith("http")) return url;
  return "https://placehold.co/600x400/e2e8f0/1e90ff?text=NestHub";
};

export function useFavorites() {
  const { user, isLoaded } = useUser();
  const [favorites, setFavorites] = useState<FavoriteListing[]>([]);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  //  Fonction pour charger les favoris (version complète)
  const loadFavorites = useCallback(async () => {
    if (!isLoaded) return;
    
    setLoading(true);
    setError(null);

    try {
      if (!user) {
        // Non connecté → localStorage
        const savedFavorites = localStorage.getItem("favorites");
        if (!savedFavorites) {
          setFavorites([]);
          setFavoriteIds(new Set());
          setLoading(false);
          return;
        }

        const favoriteIdsArray = JSON.parse(savedFavorites);
        if (favoriteIdsArray.length === 0) {
          setFavorites([]);
          setFavoriteIds(new Set());
          setLoading(false);
          return;
        }

        const listingsPromises = favoriteIdsArray.map(async (id: string) => {
          const response = await fetch(`/api/listings/${id}`);
          if (response.ok) return await response.json();
          return null;
        });

        const listingsData = await Promise.all(listingsPromises);
        const validListings = listingsData.filter((l) => l !== null);

        const userFavorites = validListings.map((listing: any) => {
          let photoUrl: string | null = null;
          if (listing.photos && listing.photos.length > 0) photoUrl = listing.photos[0].url;
          else if (listing.images && listing.images.length > 0) photoUrl = listing.images[0];
          else if (listing.image) photoUrl = listing.image;

          let averageRating = null;
          let reviewCount = 0;
          
          if (listing.bookings && listing.bookings.length > 0) {
            const reviews = listing.bookings
              .filter((b: any) => b.review !== null)
              .map((b: any) => b.review);
            
            if (reviews.length > 0) {
              reviewCount = reviews.length;
              const sum = reviews.reduce((acc: number, review: any) => acc + (review?.rating || 0), 0);
              averageRating = parseFloat((sum / reviewCount).toFixed(1));
            }
          }

          return {
            id: listing.id,
            title: listing.title || "Sans titre",
            location: `${listing.governorate || ""}, ${listing.delegation || ""}`.replace(/^, /, "").replace(/, $/, "") || "Emplacement non spécifié",
            price: listing.pricePerNight || listing.price || 0,
            pricePerNight: listing.pricePerNight || listing.price || 0,
            rating: averageRating,
            reviewCount: reviewCount,
            image: getImageUrl(photoUrl),
            type: listing.type,
            isVerified: listing.owner?.isIdentityVerified || false,
            bedrooms: listing.rooms || 1,
            bathrooms: listing.bathrooms || 1,
            maxGuests: listing.maxGuests,
            trustScore: listing.trustScore,
            amenities: listing.equipment || [],
          };
        });

        setFavorites(userFavorites);
        setFavoriteIds(new Set(userFavorites.map((f) => f.id)));
        setLoading(false);
        return;
      }

      //  Utilisateur connecté → API BDD
      const response = await fetch("/api/users/favorites");
      
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des favoris");
      }

      const data = await response.json();
      
      // Gère le format { success: true, favorites: [...] }
      let favoritesList = [];
      if (data.success && data.favorites && Array.isArray(data.favorites)) {
        favoritesList = data.favorites;
      } else if (Array.isArray(data)) {
        favoritesList = data;
      }
      
      // Appliquer getImageUrl sur chaque image
      const favoritesWithImages = favoritesList.map((fav: any) => ({
        ...fav,
        image: getImageUrl(fav.image),
      }));
      
      setFavorites(favoritesWithImages);
      setFavoriteIds(new Set(favoritesWithImages.map((f: any) => f.id)));
      
    } catch (err) {
      console.error("Erreur chargement favoris:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [user, isLoaded]);

  //  Ajouter aux favoris
  const addFavorite = useCallback(async (listingId: string) => {
    if (!user) {
      // Non connecté → localStorage
      const saved = localStorage.getItem("favorites");
      const updated = saved ? [...JSON.parse(saved), listingId] : [listingId];
      localStorage.setItem("favorites", JSON.stringify(updated));
      setFavoriteIds(new Set(updated));
      window.dispatchEvent(new Event("favorites-updated"));
      //  Recharger les favoris
      await loadFavorites();
      return;
    }

    try {
      const response = await fetch("/api/users/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      
      if (!response.ok) throw new Error("Erreur lors de l'ajout");
      
      //  Recharger les favoris après l'ajout
      await loadFavorites();
      window.dispatchEvent(new Event("favorites-updated"));
    } catch (err) {
      console.error("Erreur ajout favori:", err);
    }
  }, [user, loadFavorites]);

  //  Retirer des favoris
  const removeFavorite = useCallback(async (listingId: string) => {
    if (!user) {
      // Non connecté → localStorage
      const saved = localStorage.getItem("favorites");
      if (saved) {
        const updated = JSON.parse(saved).filter((id: string) => id !== listingId);
        localStorage.setItem("favorites", JSON.stringify(updated));
        setFavoriteIds(new Set(updated));
        window.dispatchEvent(new Event("favorites-updated"));
        //  Recharger les favoris
        await loadFavorites();
      }
    } else {
      try {
        const response = await fetch(`/api/users/favorites?listingId=${listingId}`, {
          method: "DELETE",
        });
        
        if (!response.ok) throw new Error("Erreur lors de la suppression");
        
        //  Recharger les favoris après la suppression
        await loadFavorites();
        window.dispatchEvent(new Event("favorites-updated"));
      } catch (err) {
        console.error("Erreur suppression favori:", err);
      }
    }
    
    setSelectedForCompare((prev) => prev.filter((id) => id !== listingId));
  }, [user, loadFavorites]);

  //  Tout supprimer
  const clearAllFavorites = useCallback(async () => {
    if (!user) {
      localStorage.setItem("favorites", JSON.stringify([]));
      setFavoriteIds(new Set());
      await loadFavorites();
      window.dispatchEvent(new Event("favorites-updated"));
    } else {
      for (const fav of favorites) {
        await removeFavorite(fav.id);
      }
    }
    
    localStorage.removeItem("compare_listings");
    setSelectedForCompare([]);
  }, [user, favorites, removeFavorite, loadFavorites]);

  //  Toggle comparaison
  const toggleCompare = useCallback((listingId: string) => {
    setSelectedForCompare((prev) => {
      const next = prev.includes(listingId) 
        ? prev.filter((id) => id !== listingId) 
        : [...prev, listingId];
      localStorage.setItem("compare_listings", JSON.stringify(next));
      return next;
    });
  }, []);

  //  Vérifier si un listing est en favori
  const isFavorite = useCallback((listingId: string): boolean => {
    return favoriteIds.has(listingId);
  }, [favoriteIds]);

  //  Compter par catégorie
  const getCategoryCounts = useCallback(() => {
    return [
      { id: "all", name: "Tous", count: favorites.length },
      { id: "VILLA", name: "Villas", count: favorites.filter((f) => f.type === "VILLA").length },
      { id: "APARTMENT", name: "Appartements", count: favorites.filter((f) => f.type === "APARTMENT").length },
      { id: "HOUSE", name: "Maisons", count: favorites.filter((f) => f.type === "HOUSE").length },
      { id: "STUDIO", name: "Studios", count: favorites.filter((f) => f.type === "STUDIO").length },
      { id: "DUPLEX", name: "Duplex", count: favorites.filter((f) => f.type === "DUPLEX").length },
    ];
  }, [favorites]);

  //  Chargement initial
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  //  Écouter les mises à jour des favoris depuis d'autres composants
  useEffect(() => {
    const handleFavoritesUpdate = () => {
      loadFavorites();
    };
    window.addEventListener("favorites-updated", handleFavoritesUpdate);
    return () => window.removeEventListener("favorites-updated", handleFavoritesUpdate);
  }, [loadFavorites]);

  //  Charger la comparaison depuis localStorage
  useEffect(() => {
    const savedCompare = localStorage.getItem("compare_listings");
    if (savedCompare) setSelectedForCompare(JSON.parse(savedCompare));
  }, []);

  return {
    favorites,
    selectedForCompare,
    loading,
    error,
    addFavorite,
    removeFavorite,
    toggleCompare,
    clearAllFavorites,
    isFavorite,
    favoriteIds,
    categoryCounts: getCategoryCounts(),
    totalCount: favorites.length,
    compareCount: selectedForCompare.length,
  };
}