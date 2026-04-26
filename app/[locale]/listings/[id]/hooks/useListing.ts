// hooks/useListing.ts
import { useState, useEffect, useCallback } from "react";

export interface Owner {
  name: string;
  isVerified: boolean;
  username?: string;
  avatar?: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  location: string;
  governorate: string;
  delegation: string;
  street?: string;
  latitude?: number;
  longitude?: number;
  pricePerNight: number;
  rating: number;
  reviewCount: number;
  images: string[];
  type: string;
  isVerified: boolean;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  surfaceArea: number;
  amenities: string[];
  equipment: Record<string, unknown>;
  availability: Record<string, boolean>;
  blockedDates: string[];
  houseRules: string[];
  owner: Owner;
  pendingDates: string[];
  cleaningFee?: number;
}

export interface BookingData {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  message: string;
}

export function useListing(id: string) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  // Fetch listing data
  useEffect(() => {
    if (!id) return;

    const fetchListing = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/listings/${id}`);
        if (!res.ok) throw new Error("Failed to fetch listing");
        const data = await res.json();

        console.log("📦 Données reçues de l'API:", data);
        console.log("📍 Coordonnées brutes:", {
          lat: data.latitude,
          lng: data.longitude,
        });

        // Transform data to match Listing interface
        const transformedListing: Listing = {
          id: data.id,
          title: data.title,
          description: data.description,
          location:
            `${data.governorate || ""}, ${data.delegation || ""}`.replace(
              /^, /,
              "",
            ),
          governorate: data.governorate,
          delegation: data.delegation,
          street: data.street,
          latitude: data.latitude,
          longitude: data.longitude,
          pricePerNight: data.pricePerNight,
          rating: data.rating ?? 4.5,
          reviewCount: data.reviewCount ?? 0,
          images: data.images ?? data.photos?.map((p: any) => p.url) ?? [],
          type: data.type,
          isVerified: data.isVerified ?? false,
          bedrooms: data.bedrooms ?? data.rooms ?? 1,
          bathrooms: data.bathrooms ?? 1,
          maxGuests: data.maxGuests ?? 2,
          surfaceArea: data.surfaceArea ?? 0,
          amenities: extractAmenities(data.equipment ?? {}),
          equipment: data.equipment ?? {},
          availability: data.availability ?? {},
          blockedDates: data.blockedDates ?? [],
          pendingDates: data.pendingDates ?? [],
          houseRules: data.houseRules ?? defaultHouseRules,
          cleaningFee: data.cleaningFee ?? 85,
          owner: {
            name:
              data.owner?.username ?? data.owner?.firstName ?? "Hôte NestHub",
            username: data.owner?.username,
            isVerified: data.owner?.isIdentityVerified ?? true,
            avatar: data.owner?.profilePictureUrl,
          },
        };

        console.log("📍 Coordonnées dans transformedListing:", {
          latitude: transformedListing.latitude,
          longitude: transformedListing.longitude,
        });

        setListing(transformedListing);
      } catch (error) {
        console.error("Error fetching listing:", error);
        setListing(null);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const calculateTotalPrice = useCallback((): number => {
    if (!listing || !checkIn || !checkOut) return 0;
    const nights = nightsBetween(checkIn, checkOut);
    const basePrice = listing.pricePerNight * nights;
    const cleaningFee = listing.cleaningFee ?? 85;
    const serviceFee = Math.round(basePrice * 0.05);
    return basePrice + cleaningFee + serviceFee;
  }, [listing, checkIn, checkOut]);

  const resetDates = useCallback(() => {
    setCheckIn("");
    setCheckOut("");
  }, []);

  const isDateBlocked = useCallback(
    (date: string): boolean => {
      if (!listing) return true;
      if (listing.blockedDates?.includes(date)) return true;
      if (listing.availability && listing.availability[date] === false)
        return true;
      return false;
    },
    [listing],
  );

  const getAvailableDates = useCallback((): string[] => {
    if (!listing) return [];
    const today = new Date();
    const dates: string[] = [];
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      if (!isDateBlocked(dateStr)) {
        dates.push(dateStr);
      }
    }
    return dates;
  }, [listing, isDateBlocked]);

  return {
    // State
    listing,
    loading,
    selectedImage,
    setSelectedImage,
    showAllPhotos,
    setShowAllPhotos,
    checkIn,
    setCheckIn,
    checkOut,
    setCheckOut,
    guests,
    setGuests,

    // Computed values
    nights: nightsBetween(checkIn, checkOut),
    basePrice: listing
      ? listing.pricePerNight * nightsBetween(checkIn, checkOut)
      : 0,
    cleaningFee: listing?.cleaningFee ?? 85,
    serviceFee: listing
      ? Math.round(
          listing.pricePerNight * nightsBetween(checkIn, checkOut) * 0.05,
        )
      : 0,
    totalToPay: calculateTotalPrice(),

    // Actions
    calculateTotalPrice,
    resetDates,
    isDateBlocked,
    getAvailableDates,
  };
}

// Helper functions
function nightsBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function extractAmenities(equipment: Record<string, unknown>): string[] {
  if (!equipment) return [];
  if (Array.isArray(equipment)) {
    return equipment as string[];
  }
  return Object.keys(equipment).filter(
    (k) => equipment[k] === true || equipment[k] === "true",
  );
}

const defaultHouseRules = [
  "Arrivée à partir de 15h00",
  "Départ avant 11h00",
  "Animaux non acceptés",
  "Fêtes et événements interdits",
  "Fumeurs acceptés à l'extérieur uniquement",
];
