// hooks/useListingTest.ts
import { useState, useEffect } from "react";

export function useListingTest(id: string) {
  const [listing, setListing] = useState<any>(null);
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
        
        console.log("🔴🔴🔴 TEST - DATA COMPLETE:", data);
        console.log("🔴🔴🔴 TEST - LATITUDE:", data.latitude);
        console.log("🔴🔴🔴 TEST - LONGITUDE:", data.longitude);
        
        const images = data.photos?.map((p: any) => p.url) ?? data.images ?? [];
        
        const transformedListing = {
          id: data.id,
          title: data.title,
          description: data.description,
          location: `${data.governorate || ""}, ${data.delegation || ""}`,
          governorate: data.governorate,
          delegation: data.delegation,
          street: data.street,
          latitude: data.latitude ?? 36.8065,
          longitude: data.longitude ?? 10.1815,
          pricePerNight: data.pricePerNight,
          rating: data.rating ?? 4.5,
          reviewCount: data.reviewCount ?? 0,
          images: images,
          type: data.type,
          isVerified: data.isVerified ?? false,
          bedrooms: data.rooms ?? data.bedrooms ?? 1,
          bathrooms: data.bathrooms ?? 1,
          maxGuests: data.maxGuests ?? 2,
          surfaceArea: data.surfaceArea ?? 0,
          amenities: [],
          equipment: data.equipment ?? {},
          availability: data.availability ?? {},
          blockedDates: data.blockedDates ?? [],
          pendingDates: data.pendingDates ?? [],
          houseRules: [],
          cleaningFee: data.cleaningFee ?? 85,
          owner: {
            name: data.owner?.username ?? "Hôte",
            username: data.owner?.username,
            isVerified: true,
            avatar: data.owner?.profilePictureUrl,
          },
        };
        
        console.log("🔴🔴🔴 TEST - TRANSFORMED LAT:", transformedListing.latitude);
        console.log("🔴🔴🔴 TEST - TRANSFORMED LNG:", transformedListing.longitude);
        
        setListing(transformedListing);
      } catch (error) {
        console.error(error);
        setListing(null);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

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
  };
}