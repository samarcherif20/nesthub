// hooks/useListingTest.ts
import { useState, useEffect } from "react";

export interface Owner {
  name: string;
  isVerified: boolean;
  username?: string;
  avatar?: string;
  bio?: string;
  memberSince?: number;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  author: string;
  authorAvatar?: string;
  date: string;
  createdAt: string;
}

export interface ReviewScores {
  cleanliness: number;
  accuracy: number;
  communication: number;
  location: number;
  checkin: number;
  value: number;
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
  maxGuests?: number;
  surfaceArea: number;
  amenities: string[];
  equipment: Record<string, unknown>;
  availability: Record<string, boolean>;
  blockedDates: string[];
  houseRules: string[];
  owner: Owner;
  pendingDates: string[];
  cleaningFee?: number;
  reviews?: Review[];
  reviewScores?: ReviewScores;

  numberOfKitchens?: number;
  floorNumber?: number;
  hasElevator?: boolean;
  hasBalcony?: boolean;
  hasGarden?: boolean;
  hasGarage?: boolean;
  isFurnished?: boolean;
  petsAllowed?: boolean;
  smokingAllowed?: boolean;
  services?: Record<string, boolean>;
  customRules?: string;
  rentalType?: string;
  pricePerMonth?: number;
  securityDeposit?: number;
  weekendPriceMultiplier?: number;
  extraFees?: any[];
  seasonalRules?: any[];
}

export function useListingTest(id: string) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  useEffect(() => {
    if (!id) return;

    const fetchListing = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/listings/${id}`);
        const data = await res.json();

        console.log("🔴 LISTING DATA:", data);
        console.log("🔴 maxGuests:", data.maxGuests);
        console.log("🔴 cleaningFee:", data.cleaningFee);
        console.log("🔴 reviews count:", data.reviews?.length || 0);
        console.log("🔴 owner bio:", data.owner?.bio);

        const images = data.photos?.map((p: any) => p.url) ?? data.images ?? [];
        const amenities = extractAmenities(data.equipment ?? {});
        const houseRules = parseHouseRules(data.houseRules, data);

        // Formater les reviews
        const formattedReviews = data.reviews?.map((review: any) => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          author: review.author || review.reviewer?.username || "Anonyme",
          authorAvatar: review.authorAvatar || review.reviewer?.profilePictureUrl,
          date: review.date || new Date(review.createdAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          createdAt: review.createdAt,
        })) ?? [];

        const transformedListing: Listing = {
          id: data.id,
          title: data.title,
          description: data.description,
          location: `${data.governorate || ""}, ${data.delegation || ""}`.replace(/^, /, ""),
          governorate: data.governorate,
          delegation: data.delegation,
          street: data.street,
          latitude: data.latitude,
          longitude: data.longitude,
          pricePerNight: data.pricePerNight,
          rating: data.rating ?? 4.5,
          reviewCount: data.reviewCount ?? 0,
          images: images,
          type: data.type,
          isVerified: data.isVerified ?? false,
          bedrooms: data.rooms ?? data.bedrooms ?? 1,
          bathrooms: data.bathrooms ?? 1,
          maxGuests: data.maxGuests ?? undefined,
          surfaceArea: data.surfaceArea ?? 0,
          amenities: amenities,
          equipment: data.equipment ?? {},
          availability: data.availability ?? {},
          blockedDates: data.blockedDates ?? [],
          pendingDates: data.pendingDates ?? [],
          houseRules: houseRules,
          cleaningFee: data.cleaningFee ?? 85,
          owner: {
            name: data.owner?.username ?? data.owner?.firstName ?? "Hôte NestHub",
            username: data.owner?.username,
            isVerified: data.owner?.isIdentityVerified ?? true,
            avatar: data.owner?.profilePictureUrl,
            bio: data.owner?.bio || "Passionné par l'hospitalité, je serai ravi de vous accueillir et de rendre votre séjour unique.",
            memberSince: data.owner?.createdAt ? new Date(data.owner.createdAt).getFullYear() : 2023,
          },
          numberOfKitchens: data.numberOfKitchens ?? 1,
          floorNumber: data.floorNumber,
          hasElevator: data.hasElevator ?? false,
          hasBalcony: data.hasBalcony ?? false,
          hasGarden: data.hasGarden ?? false,
          hasGarage: data.hasGarage ?? false,
          isFurnished: data.isFurnished ?? false,
          petsAllowed: data.petsAllowed ?? false,
          smokingAllowed: data.smokingAllowed ?? false,
          services: data.services ?? {},
          customRules: data.customRules ?? "",
          rentalType: data.rentalType ?? "SHORT_TERM",
          pricePerMonth: data.pricePerMonth,
          securityDeposit: data.securityDeposit,
          weekendPriceMultiplier: data.weekendPriceMultiplier ?? 1.15,
          extraFees: data.extraFees ?? [],
          seasonalRules: data.seasonalRules ?? [],
          reviews: formattedReviews,
          reviewScores: data.reviewScores || {
            cleanliness: 4.5,
            accuracy: 4.5,
            communication: 4.5,
            location: 4.5,
            checkin: 4.5,
            value: 4.5,
          },
        };

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

  const nights = (() => {
    if (!checkIn || !checkOut) return 0;
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const basePrice = listing ? listing.pricePerNight * nights : 0;
  const cleaningFee = listing?.cleaningFee ?? 85;
  const serviceFee = listing ? Math.round((basePrice + cleaningFee) * 0.05) : 0;
  const totalToPay = basePrice + cleaningFee + serviceFee;

  const calculateTotalPrice = () => totalToPay;

  const resetDates = () => {
    setCheckIn("");
    setCheckOut("");
  };

  const isDateBlocked = (date: string) => {
    if (!listing) return true;
    if (listing.blockedDates?.includes(date)) return true;
    if (listing.availability && listing.availability[date] === false) return true;
    return false;
  };

  const getAvailableDates = () => {
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
  };

  return {
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
    nights,
    basePrice,
    cleaningFee,
    serviceFee,
    totalToPay,
    calculateTotalPrice,
    resetDates,
    isDateBlocked,
    getAvailableDates,
  };
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

function parseHouseRules(houseRulesData: unknown, fullData: any): string[] {
  const rules: string[] = [];

  if (Array.isArray(houseRulesData) && houseRulesData.length > 0) {
    return houseRulesData;
  }

  if (houseRulesData && typeof houseRulesData === "object") {
    const rulesObj = houseRulesData as Record<string, unknown>;

    if (rulesObj.checkIn && typeof rulesObj.checkIn === "string") {
      rules.push(`Arrivée à partir de ${rulesObj.checkIn}`);
    }
    if (rulesObj.checkOut && typeof rulesObj.checkOut === "string") {
      rules.push(`Départ avant ${rulesObj.checkOut}`);
    }
    if (rulesObj.noSmoking === true) {
      rules.push("Interdiction de fumer dans le logement");
    }
    if (rulesObj.noPets === true) {
      rules.push("Animaux non autorisés");
    }
    if (rulesObj.noParties === true) {
      rules.push("Fêtes et événements interdits");
    }
    if (rulesObj.quietHours && typeof rulesObj.quietHours === "string") {
      rules.push(`Calme après ${rulesObj.quietHours}`);
    }
  }

  if (fullData.petsAllowed === true) {
    rules.push("Animaux acceptés");
  }
  if (fullData.smokingAllowed === true) {
    rules.push("Fumeurs acceptés (à l'extérieur)");
  }
  if (fullData.childrenAllowed === true) {
    rules.push("Enfants bienvenus");
  }

  if (fullData.customRules && typeof fullData.customRules === "string") {
    const customLines = fullData.customRules
      .split("\n")
      .map((s: string) => s.trim())
      .filter(Boolean);
    for (const line of customLines) {
      rules.push(line);
    }
  }

  return rules;
}