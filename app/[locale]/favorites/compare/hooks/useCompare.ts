"use client";

import { useState, useEffect, useCallback } from "react";

export interface CompareListing {
  id: string;
  title: string;
  location: string;
  governorate: string;
  delegation: string;
  pricePerNight: number;
  pricePerMonth?: number;
  securityDeposit?: number;
  cleaningFee?: number;
  weekendPriceMultiplier?: number;
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
  floorNumber?: number;
  hasElevator: boolean;
  hasBalcony: boolean;
  hasGarden: boolean;
  hasGarage: boolean;
  numberOfKitchens: number;
  isFurnished: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  amenities: string[];
  equipment: Record<string, unknown>;
  services: string[];
  houseRules: string[];
  description: string;
  trustScore?: number;
  trustLabel?: string;
  trustBadge?: string;
  scamProbability?: number;
  scamFlags?: string[];
  collection?: string;
  viewCount: number;
  bookingCount: number;
  favoriteCount: number;
  createdAt: string;
  updatedAt: string;
}

export type SortKey = "rating" | "price" | "beds" | "guests";

export const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return "https://placehold.co/600x400/e2e8f0/6366f1?text=NestHub";
  if (url.startsWith("http") && !url.includes("vercel-storage.com")) return url;
  if (url.includes("vercel-storage.com"))
    return `/api/listings/image?url=${encodeURIComponent(url)}`;
  if (url.startsWith("/api/listings/image")) return url;
  return "https://placehold.co/600x400/e2e8f0/6366f1?text=NestHub";
};

// Fonction pour encoder les URLs des avatars
export const getAvatarUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  if (url.startsWith("http") && url.includes("vercel-storage.com")) {
    return `/api/listings/image?url=${encodeURIComponent(url)}`;
  }
  if (url.startsWith("/api/listings/image")) return url;
  return url;
};

export const extractAmenities = (
  equipment: Record<string, unknown>,
): string[] => {
  if (!equipment) return [];
  if (Array.isArray(equipment)) return equipment as string[];
  return Object.keys(equipment).filter(
    (k) => equipment[k] === true || equipment[k] === "true",
  );
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
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [sortKey, setSortKey] = useState<SortKey>("rating");
  const [showShareMenu, setShowShareMenu] = useState(false);

  // IA States
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [userPrompt, setUserPrompt] = useState("");
  const [aiRecommendedId, setAiRecommendedId] = useState<string | null>(null);
  const [aiScores, setAiScores] = useState<Record<string, number>>({});

  // Review dynamique pour le expertChoice
  const [dynamicReview, setDynamicReview] = useState<{
    comment: string;
    author: string;
    initial: string;
    rating: number;
    date: string;

    profilePicture?: string | null;
  } | null>(null);

  useEffect(() => setMounted(true), []);

// Dans useCompare.ts - Modifie fetchReviewForListing

const fetchReviewForListing = useCallback(
  async (listingId: string, listingTitle: string, listingRating: number) => {
    try {
      const response = await fetch(
        `/api/reviews?listingId=${listingId}&limit=1`,
      );
      if (response.ok) {
        const data = await response.json();
        if (data.reviews && data.reviews.length > 0) {
          const review = data.reviews[0];
          const profilePictureUrl = review.reviewer?.profilePictureUrl
            ? getAvatarUrl(review.reviewer.profilePictureUrl)
            : null;
          
          // PRIORITÉ: username > firstName + lastName > email > "Client vérifié"
          let authorName = "Client vérifié";
          
          if (review.reviewer?.username) {
            authorName = review.reviewer.username;
          } else if (review.reviewer?.firstName) {
            authorName = `${review.reviewer.firstName} ${review.reviewer.lastName || ""}`.trim();
          } else if (review.reviewer?.email) {
            authorName = review.reviewer.email.split('@')[0];
          }
          
          return {
            comment: review.comment || `Séjour exceptionnel dans "${listingTitle}" ! Je recommande vivement ce logement.`,
            author: authorName,  
            initial: (review.reviewer?.firstName?.charAt(0) || review.reviewer?.username?.charAt(0) || listingTitle.charAt(0)).toUpperCase(),
            rating: review.rating || listingRating,
            date: new Date(review.createdAt).getFullYear().toString(),
            profilePicture: profilePictureUrl,
          };
        }
      }
      return null;
    } catch (error) {
      console.error("Erreur fetch review:", error);
      return null;
    }
  },
  [],
);

  // Mettre à jour dynamicReview avec profilePicture
  const updateReviewForExpertChoice = useCallback(
    async (listingId: string, listingTitle: string, listingRating: number) => {
      const reviewData = await fetchReviewForListing(
        listingId,
        listingTitle,
        listingRating,
      );
      if (reviewData) {
        setDynamicReview(reviewData);
      } else {
        // Avis par défaut
        setDynamicReview({
          comment: `"${listingTitle} est une propriété exceptionnelle. Avec ${listingRating || 4.5}/5 étoiles, c'est un choix parfait pour un séjour de qualité. Je recommande vivement !"`,
          author: "Client vérifié",
          initial: listingTitle.charAt(0).toUpperCase(),
          rating: listingRating || 4.5,
          date: new Date().getFullYear().toString(),
          profilePicture: null,
        });
      }
    },
    [fetchReviewForListing],
  );

  const fetchListings = useCallback(
    async (ids: string[]) => {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.all(
          ids.map(async (id) => {
            const res = await fetch(`/api/listings/${id}`);
            if (!res.ok) return null;
            const data = await res.json();

            const imageUrl = data.photos?.[0]?.url || data.image || "";
            const amenities = extractAmenities(data.equipment ?? {});

            return {
              id: data.id,
              title: data.title,
              location:
                `${data.governorate || ""}, ${data.delegation || ""}`.replace(
                  /^, /,
                  "",
                ),
              governorate: data.governorate ?? "",
              delegation: data.delegation ?? "",
              pricePerNight: data.pricePerNight,
              rating: data.rating,
              reviewCount: data.reviewCount,
              image: getImageUrl(imageUrl),
              images: data.images ?? [],
              type: data.type,
              isVerified: data.isVerified ?? false,
              bedrooms: data.rooms ?? 1,
              bathrooms: data.bathrooms ?? 1,
              maxGuests: data.maxGuests,
              surfaceArea: data.surfaceArea,
              hasBalcony: data.hasBalcony,
              hasGarden: data.hasGarden,
              hasGarage: data.hasGarage,
              hasElevator: data.hasElevator,
              numberOfKitchens: data.numberOfKitchens,
              isFurnished: data.isFurnished,
              petsAllowed: data.petsAllowed,
              amenities,
              equipment: data.equipment ?? {},
              description: data.description ?? "",
              trustScore: data.trustScore,
              viewCount: data.viewCount,
              bookingCount: data.bookingCount,
              favoriteCount: data.favoriteCount,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
            } as CompareListing;
          }),
        );
        const validListings = results.filter(
          (l): l is CompareListing => l !== null,
        );
        setListings(validListings);

        // Initialiser l'avis pour le premier listing
        if (validListings.length > 0) {
          const firstListing = validListings[0];
          await updateReviewForExpertChoice(
            firstListing.id,
            firstListing.title,
            firstListing.rating,
          );
        }
      } catch (error) {
        console.error("Erreur chargement:", error);
        setError("Erreur lors du chargement des propriétés");
      } finally {
        setLoading(false);
      }
    },
    [updateReviewForExpertChoice],
  );

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

  // Fonction de suppression standard
  const removeFromCompare = useCallback(
    (id: string) => {
      const newIds = compareIds.filter((i) => i !== id);
      setCompareIds(newIds);
      localStorage.setItem("compare_listings", JSON.stringify(newIds));
      setListings((prev) => prev.filter((l) => l.id !== id));
    },
    [compareIds],
  );

  // Alias pour la suppression avec confirmation (même fonction, juste pour la clarté)
  const removeFromCompareWithConfirm = useCallback(
    (id: string) => {
      removeFromCompare(id);
    },
    [removeFromCompare],
  );

  const clearAll = useCallback(() => {
    setListings([]);
    setCompareIds([]);
    setDynamicReview(null);
    localStorage.removeItem("compare_listings");
  }, []);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareMenu(false);
  }, []);

  const handleImageError = useCallback((id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  }, []);

  // Analyse IA
  const analyzeWithAI = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || listings.length === 0) return;

      setAiLoading(true);
      try {
        const response = await fetch("/api/ai/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            listingIds: listings.map((l) => l.id),
          }),
        });

        const data = await response.json();
        if (data.success) {
          setAiAnalysis(data);
          if (data.bestMatch) {
            setAiRecommendedId(data.bestMatch);
            // Mettre à jour l'avis pour le nouveau expertChoice
            const recommendedListing = listings.find(
              (l) => l.id === data.bestMatch,
            );
            if (recommendedListing) {
              await updateReviewForExpertChoice(
                recommendedListing.id,
                recommendedListing.title,
                recommendedListing.rating,
              );
            }
          }
          if (data.scores) {
            setAiScores(data.scores);
          }
          return { success: true, message: "Analyse IA terminée !" };
        } else {
          return {
            success: false,
            message: data.error || "Erreur lors de l'analyse",
          };
        }
      } catch (error) {
        console.error("Erreur analyse IA:", error);
        return { success: false, message: "Erreur lors de l'analyse IA" };
      } finally {
        setAiLoading(false);
      }
    },
    [listings, updateReviewForExpertChoice],
  );

  const getListingScore = useCallback(
    (listingId: string, fallbackScore: number): number => {
      if (aiScores[listingId]) {
        return aiScores[listingId];
      }
      return fallbackScore;
    },
    [aiScores],
  );

  const isRecommendedByAI = useCallback(
    (listingId: string): boolean => {
      return aiRecommendedId === listingId;
    },
    [aiRecommendedId],
  );

  const allAmenities = Array.from(
    new Set(listings.flatMap((l) => l.amenities)),
  ).sort();
  const avgPrice = listings.length
    ? Math.round(
        listings.reduce((s, l) => s + l.pricePerNight, 0) / listings.length,
      )
    : 0;
  const avgRating = listings.length
    ? (
        listings.reduce((s, l) => s + (l.rating || 0), 0) / listings.length
      ).toFixed(1)
    : "—";
  const avgBeds = listings.length
    ? (listings.reduce((s, l) => s + l.bedrooms, 0) / listings.length).toFixed(
        1,
      )
    : "—";

  return {
    mounted,
    listings,
    loading,
    error,
    imageErrors,
    sortKey,
    showShareMenu,
    allAmenities,
    bestListing: listings[0],
    avgPrice,
    avgRating,
    avgBeds,
    aiAnalysis,
    aiLoading,
    showAiPanel,
    userPrompt,
    aiRecommendedId,
    aiScores,
    dynamicReview,
    setSortKey,
    setShowShareMenu,
    setShowAiPanel,
    setUserPrompt,
    removeFromCompare,
    removeFromCompareWithConfirm,
    clearAll,
    copyLink,
    handleImageError,
    analyzeWithAI,
    getListingScore,
    isRecommendedByAI,
  };
}