"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

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
  hasBalcony: boolean;
  hasGarden: boolean;
  hasGarage: boolean;
  isFurnished: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  numberOfKitchens: number;
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
    file?: File;
  }>;
  rentalType: string;
  pricePerNight: number | null;
  pricePerMonth: number | null;
  securityDeposit: number | null;
  cleaningFee: number | null;
  status: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
  rejectionDetails?: string;
  rejectedAt?: string;
  rejectedBy?: string;
}

// Fonction pour uploader une seule photo
const uploadSinglePhoto = async (
  file: File,
): Promise<{ url: string; thumbnailUrl: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  const uploadRes = await fetch("/api/listings/upload-temp-photo", {
    method: "POST",
    body: formData,
  });
  if (!uploadRes.ok) {
    const error = await uploadRes.json();
    throw new Error(error.error || "Upload failed");
  }
  const data = await uploadRes.json();
  return { url: data.url, thumbnailUrl: data.thumbnailUrl || data.url };
};

// Fonction pour uploader toutes les nouvelles photos
const uploadNewPhotos = async (photos: any[]): Promise<any[]> => {
  const result = [];
  for (const photo of photos) {
    if (photo.file) {
      const { url, thumbnailUrl } = await uploadSinglePhoto(photo.file);
      result.push({
        ...photo,
        url,
        thumbnailUrl,
        file: undefined,
      });
    } else {
      result.push(photo);
    }
  }
  return result;
};

const removeNullFields = (obj: any): any => {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      if (typeof value === "object" && !Array.isArray(value)) {
        result[key] = removeNullFields(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
};

export function useEditListing(
  id: string,
  locale: string,
  setToast?: (
    toast: { type: "success" | "error"; message: string } | null,
  ) => void,
) {
  const router = useRouter();
  const t = useTranslations("EditListing");
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const showToast = useCallback(
    (type: "success" | "error", message: string) => {
      if (setToast) {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
      }
    },
    [setToast],
  );

  const fetchListing = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${id}`);
      if (res.ok) {
        const data = await res.json();
        const cleanPhotos =
          data.photos?.map((p: any) => ({
            ...p,
            file: undefined,
          })) || [];
        setListing({ ...data, photos: cleanPhotos });
      } else {
        showToast("error", t("toast.listingNotFound"));
        router.push(`/${locale}/dashboard/owner/listings`);
      }
    } catch {
      showToast("error", t("toast.loadingError"));
    } finally {
      setLoading(false);
    }
  }, [id, locale, router, showToast, t]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  const setField = useCallback(
    (field: keyof Listing, value: any) => {
      if (listing) setListing({ ...listing, [field]: value });
    },
    [listing],
  );

  const save = useCallback(
    async (
      extraData?: Partial<Listing>,
      redirectAfterSave: boolean = false,
    ) => {
      if (!listing) return;
      setSaving(true);
      try {
        let finalPhotos = listing.photos;
        const hasNewFiles = listing.photos.some((p) => p.file);
        if (hasNewFiles) {
          setUploadingPhotos(true);
          finalPhotos = await uploadNewPhotos(listing.photos);
          setUploadingPhotos(false);
        }

        const dataToSend = { ...listing, ...extraData, photos: finalPhotos };
        delete dataToSend.status;

        if (dataToSend.photos) {
          dataToSend.photos = dataToSend.photos.map((photo: any) => ({
            id: photo.id,
            url: photo.url,
            thumbnailUrl: photo.thumbnailUrl,
            isMain: photo.isMain,
            position: photo.position,
          }));
        }

        const cleanData = removeNullFields(dataToSend);

        const res = await fetch(`/api/listings/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanData),
        });

        if (res.ok) {
          const data = await res.json();
          const cleanDataPhotos =
            data.photos?.map((p: any) => ({
              ...p,
              file: undefined,
            })) || [];
          setListing({ ...data, photos: cleanDataPhotos });
          setLastSaved(new Date());

          if (listing.status === "ACTIVE") {
            showToast("success", t("toast.changesPendingValidation"));
          } else {
            showToast("success", t("toast.changesSaved"));
          }

          if (redirectAfterSave) {
            setTimeout(() => {
              router.push(`/${locale}/dashboard/owner/listings`);
            }, 2000);
          }
          return true;
        } else {
          const error = await res.json();
          showToast("error", error.error || t("toast.saveError"));
          return false;
        }
      } catch (error) {
        console.error("Save error:", error);
        showToast("error", t("toast.connectionError"));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [listing, id, showToast, locale, router, t],
  );

  const handleFileChange = useCallback(
    (files: FileList | null) => {
      if (!files || !listing) return;

      const currentPhotos = listing.photos || [];
      const remainingSlots = 20 - currentPhotos.length;
      if (remainingSlots <= 0) {
        showToast("error", t("photos.maxReached"));
        return;
      }

      const newFiles = Array.from(files).slice(0, remainingSlots);

      const newPhotos = newFiles.map((file, index) => ({
        id: crypto.randomUUID(),
        url: URL.createObjectURL(file),
        thumbnailUrl: URL.createObjectURL(file),
        isMain: currentPhotos.length === 0 && index === 0,
        position: currentPhotos.length + index,
        file: file,
      }));

      setListing({ ...listing, photos: [...currentPhotos, ...newPhotos] });
      showToast("success", t("photos.added", { count: newFiles.length }));
    },
    [listing, showToast, t],
  );

  const removePhoto = useCallback(
    (photoId: string) => {
      if (!listing) return;
      const currentPhotos = listing.photos || [];
      const photoToRemove = currentPhotos.find((p) => p.id === photoId);
      if (photoToRemove?.url?.startsWith("blob:")) {
        URL.revokeObjectURL(photoToRemove.url);
      }
      if (photoToRemove?.thumbnailUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(photoToRemove.thumbnailUrl);
      }

      const filtered = currentPhotos.filter((p) => p.id !== photoId);
      if (filtered.length > 0 && !filtered.some((p) => p.isMain)) {
        filtered[0].isMain = true;
      }
      setListing({ ...listing, photos: filtered });
      showToast("success", t("photos.removed"));
    },
    [listing, showToast, t],
  );

  const setMainPhoto = useCallback(
    (photoId: string) => {
      if (!listing) return;
      const currentPhotos = listing.photos || [];
      setListing({
        ...listing,
        photos: currentPhotos.map((p) => ({ ...p, isMain: p.id === photoId })),
      });
      showToast("success", t("photos.mainUpdated"));
    },
    [listing, showToast, t],
  );

  const saveAndResubmit = useCallback(async () => {
    if (!listing) return;

    setSaving(true);
    try {
      let finalPhotos = listing.photos;
      const hasNewFiles = listing.photos.some((p) => p.file);
      if (hasNewFiles) {
        setUploadingPhotos(true);
        finalPhotos = await uploadNewPhotos(listing.photos);
        setUploadingPhotos(false);
      }

      const cleanData = removeNullFields({ ...listing, photos: finalPhotos });
      delete cleanData.status;

      const saveRes = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanData),
      });

      if (!saveRes.ok) {
        const error = await saveRes.json();
        throw new Error(error.error || t("toast.saveError"));
      }

      const resubmitRes = await fetch(`/api/listings/${id}/resubmit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (resubmitRes.ok) {
        showToast("success", t("toast.resubmitted"));

        setTimeout(() => {
          router.push(`/${locale}/dashboard/owner/listings`);
        }, 2000);
      } else {
        const error = await resubmitRes.json();
        showToast("error", error.error || t("toast.submissionError"));
      }
    } catch (error: any) {
      console.error(error);
      showToast("error", error.message || t("toast.operationError"));
    } finally {
      setSaving(false);
      setUploadingPhotos(false);
    }
  }, [listing, id, showToast, locale, router, t]);

  const qualityScore = listing
    ? Math.min(
        85 +
          (listing.photos?.length || 0) * 2 +
          (listing.description?.length || 0) / 100,
        98,
      )
    : 0;

  return {
    listing,
    loading,
    saving,
    lastSaved,
    uploadingPhotos,
    qualityScore,
    setField,
    save,
    handleFileChange,
    removePhoto,
    setMainPhoto,
    saveAndResubmit,
  };
}
