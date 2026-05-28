// hooks/useListingDetail.ts
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Listing {
  id: string;
  title: string;
  type: string;
  description: string;
  governorate: string;
  delegation: string;
  street: string;
  latitude: number | null;
  longitude: number | null;
  rooms: number;
  bathrooms: number;
  numberOfKitchens: number;
  maxGuests: number;
  surfaceArea: number | null;
  floorNumber: number | null;
  hasElevator: boolean;
  hasBalcony: boolean;
  hasGarden: boolean;
  hasGarage: boolean;
  isFurnished: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  equipment: Record<string, boolean>;
  services: Record<string, boolean>;
  houseRules: Record<string, boolean>;
  customRules: string;
  photos: Array<{
    id: string;
    url: string;
    thumbnailUrl: string;
    isMain: boolean;
    position: number;
  }>;
  rentalType: string;
  pricePerNight: number | null;
  pricePerMonth: number | null;
  securityDeposit: number | null;
  cleaningFee: number | null;
  status: string;
  viewCount: number;
  bookingCount: number;
  favoriteCount: number;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    profilePictureUrl: string | null;
    isIdentityVerified: boolean;
    createdAt: string;
    bio?: string | null;
    stats?: {
      averageRating: number | null;
      totalReviews: number;
    } | null;
  };
  upcomingBookings?: Booking[];
  pastBookings?: Booking[];
  totalRevenue?: number;
  realOccupancyRate?: number;
  blockedDates?: string[];
  pendingDates?: string[];
  isOwner?: boolean;
}

interface Booking {
  id: string;
  tenantName: string;
  tenantAvatar?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  status: string;
  totalPrice?: number;
}

interface Availability {
  [date: string]: {
    available: boolean;
    price?: number;
    minStay?: number;
  };
}

interface BlockedDate {
  startDate: string;
  endDate: string;
  reason?: string;
}

export function useListingDetail(
  id: string,
  locale: string,
  setError?: (error: string) => void,
  t?: (key: string, params?: any) => string,
) {
  const router = useRouter();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [availability, setAvailability] = useState<Availability>({});
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const slideshowRef = useRef<NodeJS.Timeout | null>(null);
  const [isSlideshow, setIsSlideshow] = useState(false);

  // STATS CALCULÉES
  const occupancyRate = useCallback(() => {
    if (listing?.realOccupancyRate !== undefined && listing?.realOccupancyRate > 0) {
      return listing.realOccupancyRate;
    }
    if (!listing?.bookingCount) return 0;
    const averageStay = 3;
    const totalBookedDays = (listing.bookingCount || 0) * averageStay;
    const daysInYear = 365;
    return Math.min(Math.round((totalBookedDays / daysInYear) * 100), 100);
  }, [listing?.bookingCount, listing?.realOccupancyRate]);

  const totalRevenue = useCallback(() => {
    return listing?.totalRevenue || 0;
  }, [listing?.totalRevenue]);

  const conversionRate = useCallback(() => {
    if (!listing) return "0";
    const views = listing.viewCount || 1;
    const bookingsCount = listing.bookingCount || 0;
    return ((bookingsCount / views) * 100).toFixed(1);
  }, [listing]);

  const fetchAvailability = useCallback(
    async (year: number, month: number) => {
      if (!id) return;
      try {
        setLoadingAvailability(true);
        const res = await fetch(
          `/api/listings/availability?listingId=${id}&year=${year}&month=${month + 1}`,
        );
        if (res.ok) {
          const data = await res.json();
          const availabilityMap: Availability = {};
          if (data.blockedDates && Array.isArray(data.blockedDates)) {
            data.blockedDates.forEach((block: BlockedDate) => {
              const start = new Date(block.startDate);
              const end = new Date(block.endDate);
              for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split("T")[0];
                availabilityMap[dateStr] = { available: false };
              }
            });
          }
          if (data.bookings && Array.isArray(data.bookings)) {
            data.bookings.forEach((booking: any) => {
              const start = new Date(booking.checkIn);
              const end = new Date(booking.checkOut);
              for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split("T")[0];
                availabilityMap[dateStr] = { available: false };
              }
            });
          }
          if (data.pricingRules && Array.isArray(data.pricingRules)) {
            data.pricingRules.forEach((rule: any) => {
              const start = new Date(rule.startDate);
              const end = new Date(rule.endDate);
              for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split("T")[0];
                if (!availabilityMap[dateStr]) {
                  availabilityMap[dateStr] = { available: true };
                }
                if (rule.fixedPrice) {
                  availabilityMap[dateStr].price = rule.fixedPrice;
                }
              }
            });
          }
          setAvailability(availabilityMap);
          setBlockedDates(data.blockedDates || []);
        }
      } catch (error) {
        console.error("Error fetching availability:", error);
      } finally {
        setLoadingAvailability(false);
      }
    },
    [id],
  );

  const updateAvailability = useCallback(
    async (date: string, updates: { available?: boolean; price?: number; minStay?: number }) => {
      if (!id) return false;
      try {
        setUpdatingAvailability(true);
        const res = await fetch(`/api/listings/availability`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId: id,
            action: updates.available === false ? "block" : updates.price ? "setPrice" : "unblock",
            dates: [date],
            customPrice: updates.price,
          }),
        });
        if (res.ok) {
          await fetchAvailability(currentMonth.getFullYear(), currentMonth.getMonth());
          toast.success(t ? t("toast.availabilityUpdated") : "Disponibilité mise à jour");
          return true;
        } else {
          toast.error(t ? t("toast.availabilityUpdateFailed") : "Erreur lors de la mise à jour");
          return false;
        }
      } catch (error) {
        console.error("Error updating availability:", error);
        toast.error(t ? t("toast.networkError") : "Erreur de connexion");
        return false;
      } finally {
        setUpdatingAvailability(false);
      }
    },
    [id, fetchAvailability, currentMonth, t],
  );

  const fetchListing = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${id}`);
      if (res.ok) {
        const data = await res.json();

        const listingData = {
          ...data,
          hasBalcony: data.hasBalcony ?? false,
          hasGarden: data.hasGarden ?? false,
          hasGarage: data.hasGarage ?? false,
          isFurnished: data.isFurnished ?? false,
          petsAllowed: data.petsAllowed ?? false,
          smokingAllowed: data.smokingAllowed ?? false,
          numberOfKitchens: data.numberOfKitchens ?? 1,
          maxGuests: data.maxGuests ?? null,
          surfaceArea: data.surfaceArea ?? null,
          floorNumber: data.floorNumber ?? null,
          realOccupancyRate: data.realOccupancyRate ?? 0,
          hasElevator: data.hasElevator ?? false,
        };

        setListing(listingData);

        if (data.upcomingBookings && data.upcomingBookings.length > 0) {
          setBookings(data.upcomingBookings);
        }

        if (data.pastBookings && data.pastBookings.length > 0 && bookings.length === 0) {
          setBookings(data.pastBookings);
        }
      } else if (setError) {
        setError(t ? t("errors.loadFailed") : "Erreur lors du chargement de l'annonce");
      }
    } catch (error) {
      console.error("Error fetching listing:", error);
      if (setError) setError(t ? t("toast.networkError") : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }, [id, setError, bookings.length, t]);

  useEffect(() => {
    if (id) {
      fetchAvailability(currentMonth.getFullYear(), currentMonth.getMonth());
    }
  }, [currentMonth, fetchAvailability, id]);

  const handleEdit = useCallback(() => {
    router.push(`/${locale}/dashboard/owner/listings/${id}/edit`);
  }, [router, locale, id]);

  const handleDeleteClick = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      if (res.ok) {
        setShowDeleteModal(false);
        toast.success(t ? t("toast.listingDeleted") : "Annonce supprimée avec succès");
        setTimeout(() => {
          router.push(`/${locale}/dashboard/owner/listings`);
        }, 300);
      } else {
        toast.error(t ? t("toast.deleteFailed") : "Erreur lors de la suppression");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast.error(t ? t("toast.networkError") : "Erreur de connexion");
      setIsDeleting(false);
    }
  }, [id, router, locale, t]);

const handleToggleStatus = useCallback(async () => {
  if (!listing) return;
  const newStatus = listing.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  try {
    const res = await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "TOGGLE_STATUS",
        status: newStatus,
      }),
    });
    if (res.ok) {
      setListing({ ...listing, status: newStatus });
      // ✅ SUPPRIME LE TOAST ICI (il est déjà dans la page)
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error toggling status:", error);
    return false;
  }
}, [id, listing]);

  const nextPhoto = useCallback(() => {
    if (!listing) return;
    setGalleryStartIndex((prev) => (prev === listing.photos.length - 1 ? 0 : prev + 1));
  }, [listing]);

  const prevPhoto = useCallback(() => {
    if (!listing) return;
    setGalleryStartIndex((prev) => (prev === 0 ? listing.photos.length - 1 : prev - 1));
  }, [listing]);

  const toggleSlideshow = useCallback(() => {
    if (isSlideshow) {
      if (slideshowRef.current) {
        clearInterval(slideshowRef.current);
        slideshowRef.current = null;
      }
      setIsSlideshow(false);
    } else {
      setIsSlideshow(true);
      slideshowRef.current = setInterval(() => {
        nextPhoto();
      }, 3000);
    }
  }, [isSlideshow, nextPhoto]);

  const changeMonth = useCallback((delta: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  }, [currentMonth]);

  const getCalendarDays = useCallback(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    const startOffset = startDay === 0 ? 6 : startDay - 1;
    const days: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [currentMonth]);

  const openInExternalMap = useCallback(() => {
    if (!listing?.latitude || !listing?.longitude) return;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`;
    window.open(googleMapsUrl, "_blank");
  }, [listing]);

  useEffect(() => {
    if (id) {
      fetchListing();
    }
  }, [fetchListing, id]);

  useEffect(() => {
    return () => {
      if (slideshowRef.current) {
        clearInterval(slideshowRef.current);
      }
    };
  }, []);

  const getHouseRulesList = useCallback(() => {
    if (!listing?.houseRules) return [];
    const rulesList: string[] = [];
    if (listing.houseRules.noParties) rulesList.push(t ? t("houseRules.noParties") : "Pas de fêtes ou d'événements");
    if (listing.houseRules.noSmoking) rulesList.push(t ? t("houseRules.noSmoking") : "Logement non-fumeur");
    if (listing.houseRules.noPets) rulesList.push(t ? t("houseRules.noPets") : "Animaux non acceptés");
    if (listing.houseRules.quietAfter22) rulesList.push(t ? t("houseRules.quietAfter22") : "Silence après 22h");
    if (listing.houseRules.checkInAfter) rulesList.push(`${t ? t("houseRules.checkInAfter") : "Arrivée à partir de"} ${listing.houseRules.checkInAfter}`);
    if (listing.houseRules.checkOutBefore) rulesList.push(`${t ? t("houseRules.checkOutBefore") : "Départ avant"} ${listing.houseRules.checkOutBefore}`);
    if (listing.customRules) rulesList.push(listing.customRules);
    if (rulesList.length === 0) {
      rulesList.push(t ? t("houseRules.defaultCheckIn") : "Arrivée à partir de 15h00");
      rulesList.push(t ? t("houseRules.defaultCheckOut") : "Départ avant 11h00");
    }
    return rulesList;
  }, [listing, t]);

  const allEquipment = Object.entries(listing?.equipment || {}).filter(([, value]) => value === true);
  const mainEquipment = allEquipment.slice(0, 6);
  const previewPhotos = listing?.photos.slice(0, 3) || [];
  const remainingPhotosCount = (listing?.photos.length || 0) - 3;

  return {
    listing,
    loading,
    showGalleryModal,
    setShowGalleryModal,
    galleryStartIndex,
    showFullDescription,
    setShowFullDescription,
    showAllAmenities,
    setShowAllAmenities,
    bookings,
    currentMonth,
    showDeleteModal,
    setShowDeleteModal,
    isDeleting,
    zoomLevel,
    setZoomLevel,
    isSlideshow,
    availability,
    blockedDates,
    loadingAvailability,
    updatingAvailability,
    occupancyRate: occupancyRate(),
    totalRevenue: totalRevenue(),
    conversionRate: conversionRate(),
    handleEdit,
    handleDeleteClick,
    handleConfirmDelete,
    handleToggleStatus,
    nextPhoto,
    prevPhoto,
    toggleSlideshow,
    changeMonth,
    openInExternalMap,
    updateAvailability,
    fetchAvailability,
    allEquipment,
    mainEquipment,
    previewPhotos,
    remainingPhotosCount,
    getCalendarDays,
    getHouseRulesList,
    setListing, // ✅ AJOUTER CETTE LIGNE

  };
}