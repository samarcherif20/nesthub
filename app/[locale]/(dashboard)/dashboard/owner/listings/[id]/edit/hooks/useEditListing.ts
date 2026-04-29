// hooks/useEditListing.ts
import { useState, useEffect, useCallback } from "react";
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

// 🔥 Fonction pour convertir null en undefined (supprime les champs null)
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

export function useEditListing(id: string, locale: string) {
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning" | "info";
    message: string;
  } | null>(null);

  const showAlert = useCallback(
    (type: "success" | "error" | "warning" | "info", message: string) => {
      setAlert({ type, message });
      setTimeout(() => setAlert(null), 5000);
    },
    [],
  );

  const fetchListing = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${id}`);
      if (res.ok) {
        const data = await res.json();
        setListing(data);
      } else {
        showAlert("error", "Annonce non trouvée");
        router.push(`/${locale}/dashboard/owner/listings`);
      }
    } catch {
      showAlert("error", "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [id, locale, router, showAlert]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  const setField = useCallback(
    (field: keyof Listing, value: any) => {
      if (listing) setListing({ ...listing, [field]: value });
    },
    [listing],
  );

  // 🔥 FONCTION SAVE CORRIGÉE
  const save = useCallback(
    async (
      extraData?: Partial<Listing>,
      redirectAfterSave: boolean = false,
    ) => {
      if (!listing) return;
      setSaving(true);
      try {
        const dataToSend = { ...listing, ...extraData };
        delete dataToSend.status;
        const cleanData = removeNullFields(dataToSend);

        const res = await fetch(`/api/listings/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanData),
        });

        if (res.ok) {
          const data = await res.json();
          setListing(data);
          setLastSaved(new Date());

          if (listing.status === "ACTIVE") {
            showAlert(
              "success",
              "Modifications envoyées pour validation. L'annonce reste visible en attendant l'approbation de l'admin.",
            );
          } else {
            showAlert("success", "Modifications enregistrées avec succès");
          }

          if (redirectAfterSave) {
            router.push(`/${locale}/dashboard/owner/listings`);
          }
        } else {
          const error = await res.json();
          showAlert("error", error.error || "Erreur lors de l'enregistrement");
        }
      } catch {
        showAlert("error", "Erreur de connexion");
      } finally {
        setSaving(false);
      }
    },
    [listing, id, showAlert, locale, router],
  );

  const handleFileChange = useCallback(
    async (files: FileList | null) => {
      if (!files || !listing) return;
      setUploadingPhotos(true);
      try {
        const uploaded = [];
        const currentPhotos = listing.photos || [];
        for (const file of Array.from(files).slice(
          0,
          20 - currentPhotos.length,
        )) {
          const fd = new FormData();
          fd.append("photos", file);
          const res = await fetch("/api/listings/upload-temp-photo", {
            method: "POST",
            body: fd,
          });
          if (res.ok) {
            const data = await res.json();
            uploaded.push({
              id: data.id ?? crypto.randomUUID(),
              url: data.url,
              thumbnailUrl: data.thumbnailUrl ?? data.url,
              isMain: currentPhotos.length === 0 && uploaded.length === 0,
              position: currentPhotos.length + uploaded.length,
            });
          }
        }
        if (uploaded.length > 0) {
          const updatedPhotos = [...currentPhotos, ...uploaded];
          setListing({ ...listing, photos: updatedPhotos });
          showAlert("success", `${uploaded.length} photo(s) ajoutée(s)`);
        }
      } catch {
        showAlert("error", "Erreur lors de l'upload des photos");
      } finally {
        setUploadingPhotos(false);
      }
    },
    [listing, showAlert],
  );

  const removePhoto = useCallback(
    (photoId: string) => {
      if (!listing) return;
      const currentPhotos = listing.photos || [];
      const filtered = currentPhotos.filter((p) => p.id !== photoId);
      if (filtered.length > 0 && !filtered.some((p) => p.isMain)) {
        filtered[0].isMain = true;
      }
      setListing({ ...listing, photos: filtered });
      showAlert("success", "Photo supprimée");
    },
    [listing, showAlert],
  );

  const setMainPhoto = useCallback(
    (photoId: string) => {
      if (!listing) return;
      const currentPhotos = listing.photos || [];
      setListing({
        ...listing,
        photos: currentPhotos.map((p) => ({ ...p, isMain: p.id === photoId })),
      });
      showAlert("success", "Photo principale mise à jour");
    },
    [listing, showAlert],
  );

  // ✅ FONCTION SAVEANDRESUBMIT CORRIGÉE
  const saveAndResubmit = useCallback(async () => {
    if (!listing) return;

    setSaving(true);
    try {
      const cleanData = removeNullFields(listing);
      delete cleanData.status;

      const saveRes = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanData),
      });

      if (!saveRes.ok) {
        const error = await saveRes.json();
        throw new Error(error.error || "Erreur lors de la sauvegarde");
      }

      const resubmitRes = await fetch(`/api/listings/${id}/resubmit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (resubmitRes.ok) {
        showAlert(
          "success",
          "✅ Modifications sauvegardées et soumises pour validation",
        );
        router.push(`/${locale}/dashboard/owner/listings`);
      } else {
        const error = await resubmitRes.json();
        showAlert("error", error.error || "Erreur lors de la soumission");
      }
    } catch (error: any) {
      console.error(error);
      showAlert("error", error.message || "Erreur lors de l'opération");
    } finally {
      setSaving(false);
    }
  }, [listing, id, showAlert, locale, router]);

  // 🔥 QUALITY SCORE CORRIGÉ - Protection contre photos undefined
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
    alert,
    setAlert,
    setField,
    save,
    handleFileChange,
    removePhoto,
    setMainPhoto,
    saveAndResubmit,
  };
}
