// hooks/useListingDetail.ts
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  maxGuests: number;
  surfaceArea: number | null;
  floorNumber: number | null;
  hasElevator: boolean;
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
    stats?: {
      averageRating: number | null;
      totalReviews: number;
    } | null;
  };
  // ✅ Données supplémentaires du propriétaire
  upcomingBookings?: Booking[];
  pastBookings?: Booking[];
  totalRevenue?: number;
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
) {
  const router = useRouter();

  // États existants
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

  // États pour la disponibilité
  const [availability, setAvailability] = useState<Availability>({});
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  // États galerie
  const [zoomLevel, setZoomLevel] = useState(1);
  const slideshowRef = useRef<NodeJS.Timeout | null>(null);
  const [isSlideshow, setIsSlideshow] = useState(false);

  // ✅ STATS CALCULÉES (basées sur les données du listing ET des bookings)
  const occupancyRate = useCallback(() => {
    if (!listing?.bookingCount) return 0;
    // Calcul approximatif basé sur le nombre de réservations et la durée moyenne
    const averageStay = 3; // Jours moyens par réservation
    const totalBookedDays = (listing.bookingCount || 0) * averageStay;
    const daysInYear = 365;
    return Math.min(Math.round((totalBookedDays / daysInYear) * 100), 100);
  }, [listing?.bookingCount]);

  const totalRevenue = useCallback(() => {
    if (!listing?.totalRevenue) return 0;
    return listing.totalRevenue;
  }, [listing?.totalRevenue]);

  const conversionRate = useCallback(() => {
    if (!listing) return "0";
    const views = listing.viewCount || 1;
    const bookingsCount = listing.bookingCount || 0;
    return ((bookingsCount / views) * 100).toFixed(1);
  }, [listing]);

  // Fonction pour charger la disponibilité (liée à l'annonce)
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

          // Traiter les dates bloquées
          if (data.blockedDates && Array.isArray(data.blockedDates)) {
            data.blockedDates.forEach((block: BlockedDate) => {
              const start = new Date(block.startDate);
              const end = new Date(block.endDate);
              for (
                let d = new Date(start);
                d <= end;
                d.setDate(d.getDate() + 1)
              ) {
                const dateStr = d.toISOString().split("T")[0];
                availabilityMap[dateStr] = { available: false };
              }
            });
          }

          // Traiter les réservations existantes
          if (data.bookings && Array.isArray(data.bookings)) {
            data.bookings.forEach((booking: any) => {
              const start = new Date(booking.checkIn);
              const end = new Date(booking.checkOut);
              for (
                let d = new Date(start);
                d < end;
                d.setDate(d.getDate() + 1)
              ) {
                const dateStr = d.toISOString().split("T")[0];
                availabilityMap[dateStr] = { available: false };
              }
            });
          }

          // Traiter les règles de prix
          if (data.pricingRules && Array.isArray(data.pricingRules)) {
            data.pricingRules.forEach((rule: any) => {
              const start = new Date(rule.startDate);
              const end = new Date(rule.endDate);
              for (
                let d = new Date(start);
                d <= end;
                d.setDate(d.getDate() + 1)
              ) {
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
        } else if (setError) {
          const error = await res.json();
          setError(
            error.error || "Erreur lors du chargement de la disponibilité",
          );
        }
      } catch (error) {
        console.error("Error fetching availability:", error);
        if (setError) setError("Erreur de connexion");
      } finally {
        setLoadingAvailability(false);
      }
    },
    [id, setError],
  );

  // Fonction pour mettre à jour la disponibilité
  const updateAvailability = useCallback(
    async (
      date: string,
      updates: { available?: boolean; price?: number; minStay?: number },
    ) => {
      if (!id) return false;

      try {
        setUpdatingAvailability(true);

        const res = await fetch(`/api/listings/availability`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId: id,
            action:
              updates.available === false
                ? "block"
                : updates.price
                  ? "setPrice"
                  : "unblock",
            dates: [date],
            customPrice: updates.price,
          }),
        });

        if (res.ok) {
          // Recharger la disponibilité après modification
          await fetchAvailability(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
          );
          return true;
        } else {
          const error = await res.json();
          if (setError)
            setError(error.error || "Erreur lors de la mise à jour");
          return false;
        }
      } catch (error) {
        console.error("Error updating availability:", error);
        if (setError) setError("Erreur de connexion");
        return false;
      } finally {
        setUpdatingAvailability(false);
      }
    },
    [id, setError, fetchAvailability, currentMonth],
  );

  const isDateAvailable = useCallback(
    (date: string): boolean => {
      const availabilityData = availability[date];
      if (!availabilityData) return true;
      return availabilityData.available !== false;
    },
    [availability],
  );

  const getDatePrice = useCallback(
    (date: string, defaultPrice: number): number => {
      const availabilityData = availability[date];
      return availabilityData?.price || defaultPrice;
    },
    [availability],
  );

  // ✅ UN SEUL APPEL API pour charger le listing ET les bookings
  const fetchListing = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${id}`);
      if (res.ok) {
        const data = await res.json();
        setListing(data);

        // ✅ Récupérer les bookings depuis la même API (si propriétaire)
        if (data.upcomingBookings && data.upcomingBookings.length > 0) {
          setBookings(data.upcomingBookings);
        } else if (data.pastBookings && data.pastBookings.length > 0) {
          setBookings(data.pastBookings);
        }
      } else if (setError) {
        setError("Erreur lors du chargement de l'annonce");
      }
    } catch (error) {
      console.error("Error fetching listing:", error);
      if (setError) setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }, [id, setError]);

  // Charger la disponibilité quand le mois change
  useEffect(() => {
    if (id) {
      fetchAvailability(currentMonth.getFullYear(), currentMonth.getMonth());
    }
  }, [currentMonth, fetchAvailability, id]);

  // Actions existantes
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
        setTimeout(() => {
          router.push(`/${locale}/dashboard/owner/listings`);
        }, 300);
      } else {
        console.error("Error deleting listing:", res.statusText);
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Error deleting listing:", error);
      setIsDeleting(false);
    }
  }, [id, router, locale]);

  const handleToggleStatus = useCallback(async () => {
    if (!listing) return;
    const newStatus = listing.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setListing({ ...listing, status: newStatus });
      }
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  }, [id, listing]);

  // Navigation galerie
  const nextPhoto = useCallback(() => {
    if (!listing) return;
    setGalleryStartIndex((prev) =>
      prev === listing.photos.length - 1 ? 0 : prev + 1,
    );
  }, [listing]);

  const prevPhoto = useCallback(() => {
    if (!listing) return;
    setGalleryStartIndex((prev) =>
      prev === 0 ? listing.photos.length - 1 : prev - 1,
    );
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

  const changeMonth = useCallback(
    (delta: number) => {
      setCurrentMonth(
        new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + delta,
          1,
        ),
      );
    },
    [currentMonth],
  );

  const getCalendarDays = useCallback(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const startOffset = startDay === 0 ? 6 : startDay - 1;

    const days: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }, [currentMonth]);

  const openInExternalMap = useCallback(() => {
    if (!listing?.latitude || !listing?.longitude) return;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`;
    window.open(googleMapsUrl, "_blank");
  }, [listing]);

  // ✅ UN SEUL useEffect pour charger le listing
  useEffect(() => {
    if (id) {
      fetchListing();
    }
  }, [fetchListing, id]);

  // Nettoyage du slideshow
  useEffect(() => {
    return () => {
      if (slideshowRef.current) {
        clearInterval(slideshowRef.current);
      }
    };
  }, []);

  // Données calculées
  const allEquipment = Object.entries(listing?.equipment || {}).filter(
    ([, value]) => value === true,
  );
  const mainEquipment = allEquipment.slice(0, 6);
  const previewPhotos = listing?.photos.slice(0, 3) || [];
  const remainingPhotosCount = (listing?.photos.length || 0) - 3;

  return {
    // États existants
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

    // États de disponibilité
    availability,
    blockedDates,
    loadingAvailability,
    updatingAvailability,

    // ✅ STATS CALCULÉES (liées à l'annonce)
    occupancyRate: occupancyRate(),
    totalRevenue: totalRevenue(),
    conversionRate: conversionRate(),

    // Actions existantes
    handleEdit,
    handleDeleteClick,
    handleConfirmDelete,
    handleToggleStatus,
    nextPhoto,
    prevPhoto,
    toggleSlideshow,
    changeMonth,
    openInExternalMap,

    // Actions de disponibilité
    updateAvailability,
    isDateAvailable,
    getDatePrice,
    fetchAvailability,

    // Données calculées
    allEquipment,
    mainEquipment,
    previewPhotos,
    remainingPhotosCount,
    getCalendarDays,
  };
}
