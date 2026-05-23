import { useState, useEffect, useCallback } from "react";
import { useIdentityVerification } from "@/hooks/useIdentityVerification";
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
  vacationMode?: boolean;
  vacationMessage?: string;
  vacationStartDate?: string;
  vacationEndDate?: string;
}

export function useListingTest(id: string) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  const [blockedDates, setBlockedDates] = useState<
    { startDate: string; endDate: string; reason?: string }[]
  >([]);
  const [pendingDates, setPendingDates] = useState<string[]>([]);
  const [pricingRules, setPricingRules] = useState<
    { startDate: string; endDate: string; fixedPrice: number }[]
  >([]);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [pendingInfoRequest, setPendingInfoRequest] = useState(false);
  const { checkCanPerformAction } = useIdentityVerification();
  const fetchAvailability = useCallback(async () => {
    if (!id) return;

    console.log("🔵 fetchAvailability: Début pour listing", id);

    try {
      const now = new Date();
      const allBlockedDates: any[] = [];
      const allPricingRules: any[] = [];
      const allPendingDates: string[] = []; // ← tableau de strings

      for (let i = 0; i < 12; i++) {
        const date = new Date(now);
        date.setMonth(now.getMonth() + i);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        const res = await fetch(
          `/api/listings/availability?listingId=${id}&year=${year}&month=${month}`,
        );

        if (res.ok) {
          const data = await res.json();
          allBlockedDates.push(...(data.blockedDates || []));
          allPricingRules.push(...(data.pricingRules || []));

          // ✅ CONVERSION CORRECTE : transformer les objets en strings
          const pendingData = data.pendingBlockedDates || [];
          for (const item of pendingData) {
            if (item.startDate) {
              const dateStr = new Date(item.startDate)
                .toISOString()
                .split("T")[0];
              allPendingDates.push(dateStr);
            } else if (typeof item === "string") {
              allPendingDates.push(item.split("T")[0]);
            }
          }
        }
      }

      // Supprimer les doublons
      const uniquePendingDates = [...new Set(allPendingDates)];

      console.log(
        `📊 fetchAvailability: ${allBlockedDates.length} dates ROUGES, ${uniquePendingDates.length} dates ORANGES`,
      );
      console.log("🟠 Dates ORANGES:", uniquePendingDates);

      setBlockedDates(allBlockedDates);
      setPendingDates(uniquePendingDates); // ← maintenant ce sont des strings !
      setPricingRules(allPricingRules);
    } catch (error) {
      console.error("❌ Erreur fetchAvailability:", error);
    }
  }, [id]);
  // ✅ CORRECTION: Vérifier si une date est bloquée (utilise les données de l'API)
  const isDateBlocked = useCallback(
    (date: string) => {
      if (!listing) return true;
      if (!date) return false;

      // Vérifier dans blockedDates de l'API
      const isBlockedByAPI = blockedDates.some((blocked) => {
        const blockedStart = new Date(blocked.startDate)
          .toISOString()
          .split("T")[0];
        return blockedStart === date;
      });

      if (isBlockedByAPI) {
        console.log(`📅 ${date} est bloqué par l'API`);
        return true;
      }

      // Vérifier dans pendingDates
      if (pendingDates.includes(date)) {
        console.log(`📅 ${date} est en attente`);
        return true;
      }

      // Vérifier dans listing.blockedDates
      if (listing.blockedDates?.includes(date)) {
        console.log(`📅 ${date} est bloqué par listing.blockedDates`);
        return true;
      }

      // Vérifier dans listing.availability
      if (listing.availability && listing.availability[date] === false) {
        console.log(`📅 ${date} est bloqué par availability`);
        return true;
      }

      return false;
    },
    [listing, blockedDates, pendingDates],
  );

  // ✅ Vérifier si une plage complète est disponible
  const isDateRangeAvailable = useCallback(
    (startDate: string, endDate: string) => {
      if (!startDate || !endDate) return false;

      const start = new Date(startDate);
      const end = new Date(endDate);
      const dates: string[] = [];

      // Générer toutes les dates de la plage (excluant endDate)
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split("T")[0]);
      }

      console.log(
        `🔍 Vérification plage: ${startDate} → ${endDate} (${dates.length} nuits)`,
      );

      // Vérifier chaque date
      for (const date of dates) {
        if (isDateBlocked(date)) {
          console.log(`❌ Plage non disponible: ${date} est bloqué`);
          return false;
        }
      }

      console.log(`✅ Plage disponible: ${startDate} → ${endDate}`);
      return true;
    },
    [isDateBlocked],
  );

  useEffect(() => {
    if (!id) return;

    const fetchListing = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/listings/${id}`);
        const data = await res.json();
 console.log("🔍 DATA BRUTE DE L'API:", {
        hasElevator: data.hasElevator,
        hasBalcony: data.hasBalcony,
        hasGarden: data.hasGarden,
        hasGarage: data.hasGarage,
        isFurnished: data.isFurnished,
        // Affiche aussi tout l'équipement pour voir
        equipment: data.equipment,
      });
        const images = data.photos?.map((p: any) => p.url) ?? data.images ?? [];
        const amenities = extractAmenities(data.equipment ?? {});
        const houseRules = parseHouseRules(data.houseRules, data);

        const formattedReviews =
          data.reviews?.map((review: any) => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            author: review.author || review.reviewer?.username || "Anonyme",
            authorAvatar:
              review.authorAvatar || review.reviewer?.profilePictureUrl,
            date:
              review.date ||
              new Date(review.createdAt).toLocaleDateString("fr-FR", {
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
          location:
            `${data.governorate || ""}, ${data.delegation || ""}`.replace(
              /^, /,
              "",
            ),
          vacationMode: data.vacationMode || false,
          vacationMessage: data.vacationMessage || null,
          vacationStartDate: data.vacationStartDate,
          vacationEndDate: data.vacationEndDate,
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
            name:
              data.owner?.username ?? data.owner?.firstName ?? "Hôte NestHub",
            username: data.owner?.username,
            isVerified: data.owner?.isIdentityVerified ?? true,
            avatar: data.owner?.profilePictureUrl,
            bio:
              data.owner?.bio ||
              "Passionné par l'hospitalité, je serai ravi de vous accueillir et de rendre votre séjour unique.",
            memberSince: data.owner?.createdAt
              ? new Date(data.owner.createdAt).getFullYear()
              : 2023,
          },
          numberOfKitchens: data.numberOfKitchens ?? 1,
          floorNumber: data.floorNumber,
          hasElevator: data.hasElevator, // peut être undefined
          hasBalcony: data.hasBalcony, // peut être undefined
          hasGarden: data.hasGarden, // peut être undefined
          hasGarage: data.hasGarage, // peut être undefined
          isFurnished: data.isFurnished, // peut être undefined
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
console.log("📦 transformedListing après création:", {
  hasElevator: transformedListing.hasElevator,
  hasBalcony: transformedListing.hasBalcony,
  hasGarden: transformedListing.hasGarden,
  hasGarage: transformedListing.hasGarage,
  isFurnished: transformedListing.isFurnished,
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

  useEffect(() => {
    if (id) {
      fetchAvailability();
    }
  }, [id, fetchAvailability]);

  // ✅ Log quand checkIn/checkOut changent
  useEffect(() => {
    if (checkIn && checkOut) {
      const available = isDateRangeAvailable(checkIn, checkOut);
      console.log(
        `📅 Dates sélectionnées: ${checkIn} → ${checkOut}, Disponible: ${available}`,
      );
    } else if (checkIn) {
      console.log(
        `📅 Check-in sélectionné: ${checkIn}, Bloqué: ${isDateBlocked(checkIn)}`,
      );
    }
  }, [checkIn, checkOut, isDateRangeAvailable, isDateBlocked]);

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
  const checkVerificationBeforeInfoRequest = useCallback(() => {
    const { canProceed, needsVerification } =
      checkCanPerformAction("make_booking");

    if (!canProceed || needsVerification) {
      setPendingInfoRequest(true);
      setShowVerificationModal(true);
      return false;
    }
    return true;
  }, [checkCanPerformAction]);

  const handleVerificationComplete = useCallback(async () => {
    setShowVerificationModal(false);
    if (pendingInfoRequest) {
      setPendingInfoRequest(false);
      return true;
    }
    return false;
  }, [pendingInfoRequest]);

  const handleCloseVerificationModal = useCallback(() => {
    setShowVerificationModal(false);
    setPendingInfoRequest(false);
  }, []);
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
    isDateRangeAvailable,
    getAvailableDates,
    blockedDates,
    pendingDates,
    pricingRules,
    fetchAvailability,
    showVerificationModal,
    checkVerificationBeforeInfoRequest,
    handleVerificationComplete,
    handleCloseVerificationModal,
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
