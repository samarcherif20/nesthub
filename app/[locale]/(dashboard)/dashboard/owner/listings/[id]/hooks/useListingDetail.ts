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
}

interface Booking {
  id: string;
  tenantName: string;
  tenantAvatar?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  status: string;
}

export function useListingDetail(id: string, locale: string) {
  const router = useRouter();

  // États
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
  
  // États galerie
  const [zoomLevel, setZoomLevel] = useState(1);
  const slideshowRef = useRef<NodeJS.Timeout | null>(null);
  const [isSlideshow, setIsSlideshow] = useState(false);

  // Fonctions de fetch
  const fetchListing = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${id}`);
      if (res.ok) {
        const data = await res.json();
        setListing(data);
      }
    } catch (error) {
      console.error("Error fetching listing:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch(`/api/bookings?listingId=${id}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  }, [id]);

  // Actions
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

  // Diaporama
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

  // Calendrier
  const changeMonth = useCallback((delta: number) => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1),
    );
  }, [currentMonth]);

  const getCalendarDays = useCallback(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const startOffset = startDay === 0 ? 6 : startDay - 1;

    const days = [];
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }, [currentMonth]);

  // Map
  const openInExternalMap = useCallback(() => {
    if (!listing?.latitude || !listing?.longitude) return;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`;
    window.open(googleMapsUrl, "_blank");
  }, [listing]);

  // Effets
  useEffect(() => {
    fetchListing();
    fetchBookings();
  }, [fetchListing, fetchBookings]);

  useEffect(() => {
    return () => {
      if (slideshowRef.current) {
        clearInterval(slideshowRef.current);
      }
    };
  }, []);

  // Stats calculées
  const allEquipment = Object.entries(listing?.equipment || {}).filter(
    ([, value]) => value === true,
  );
  const mainEquipment = allEquipment.slice(0, 6);
  const previewPhotos = listing?.photos.slice(0, 3) || [];
  const remainingPhotosCount = (listing?.photos.length || 0) - 3;

  return {
    // États
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
    
    // Actions
    handleEdit,
    handleDeleteClick,
    handleConfirmDelete,
    handleToggleStatus,
    nextPhoto,
    prevPhoto,
    toggleSlideshow,
    changeMonth,
    openInExternalMap,
    
    // Données calculées
    allEquipment,
    mainEquipment,
    previewPhotos,
    remainingPhotosCount,
    getCalendarDays,
  };
}