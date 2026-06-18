// hooks/useUserProfile.ts
"use client";

import { useState, useEffect, useCallback } from "react";

export type Listing = {
  id: string;
  title: string;
  location: string;
  image: string | null;
  images?: string[];
  guests: number;
  bedrooms: number;
  baths: number;
  rating: number;
  priceDisplay: string;
  pricePerNight: number;
  pricePerMonth: number;
  rentalType: string;
  summary: string;
  ownerId?: string;
};

export type Review = {
  id: string;
  author: string;
  role: string;
  avatar?: string;
  rating: number;
  date: string;
  comment: string;
  targetType: string;
};

export type ProfileData = {
  id: string;
  username: string;
  role: "TENANT" | "PROPERTY_OWNER" | "BOTH";
  roleDisplay: string;
  roleBadgeText: string;
  location: string;
  bio: string;
  memberSince: Date;
  profession: string | null;
  languages: string[];
  acceptsForeigners: boolean;
  isIdentityVerified: boolean;
  isEmailVerified: boolean;
  phoneVerified: boolean;
  profilePictureUrl: string | null;
  stats: {
    reliabilityScore: number;
    trustLabel: string;
    totalReviews: number;
    averageRating: number;
    responseRate: number;
    responseTime: string;
    totalListings: number;
  };
};

export function useUserProfile(username: string) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!username) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/users/profile/${username}`);
      if (!res.ok) throw new Error("Profil non trouvé");
      const data = await res.json();

      setProfile(data.profile);
      setListings(data.listings || []);
      setReviews(data.reviews || []);
      setIsHost(data.isHost);
    } catch (err) {
      console.error("Erreur:", err);
      setError("Profil non trouvé");
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // NOTE GLOBALE = moyenne des avis REÇUS
  const averageRating = profile?.stats.averageRating || 0;
  
  // Nombre total d'avis reçus
  const totalReviews = profile?.stats.totalReviews || 0;
  
  // Nombre total d'annonces
  const totalListings = profile?.stats.totalListings || 0;
  
  // Taux de réponse
  const responseRate = profile?.stats.responseRate || 0;
  
  // Temps de réponse
  const responseTime = profile?.stats.responseTime || "< 1h";
  
  // Score de fiabilité
  const reliabilityScore = profile?.stats.reliabilityScore || 50;

  // Vérifications
  const isIdentityVerified = profile?.isIdentityVerified || false;
  const isEmailVerified = profile?.isEmailVerified || false;
  const isPhoneVerified = profile?.phoneVerified || false;
  const acceptsForeigners = profile?.acceptsForeigners || false;

  // Langues
  const languages = profile?.languages || [];

  // Bio
  const bio = profile?.bio || "Aucune biographie pour le moment.";

  // Localisation
  const location = profile?.location || "Localisation non spécifiée";

  return {
    // Données brutes
    profile,
    listings,
    reviews,
    isHost,
    isLoading,
    error,
    
    // Statistiques calculées
    averageRating,
    totalReviews,
    totalListings,
    responseRate,
    responseTime,
    reliabilityScore,
    
    // Vérifications
    isIdentityVerified,
    isEmailVerified,
    isPhoneVerified,
    acceptsForeigners,
    
    // Autres
    languages,
    bio,
    location,
    
    // Fonction pour recharger
    refetch: fetchProfile,
  };
}