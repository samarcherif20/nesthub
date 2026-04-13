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
}

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
  const [shouldRedirect, setShouldRedirect] = useState(false);

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
        setListing(await res.json());
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

  // ✅ MODIFIER LA FONCTION SAVE
  const save = useCallback(
    async (
      extraData?: Partial<Listing>,
      redirectAfterSave: boolean = false,
    ) => {
      if (!listing) return;
      setSaving(true);
      try {
        const res = await fetch(`/api/listings/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...listing, ...extraData }),
        });
        if (res.ok) {
          const data = await res.json();
          setListing(data);
          setLastSaved(new Date());
          showAlert("success", "Modifications enregistrées avec succès");

          // ✅ REDIRECTION APRÈS SAUVEGARDE
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
        for (const file of Array.from(files).slice(
          0,
          20 - listing.photos.length,
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
              isMain: listing.photos.length === 0 && uploaded.length === 0,
              position: listing.photos.length + uploaded.length,
            });
          }
        }
        if (uploaded.length > 0) {
          const updatedPhotos = [...listing.photos, ...uploaded];
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
      const filtered = listing.photos.filter((p) => p.id !== photoId);
      if (filtered.length > 0 && !filtered.some((p) => p.isMain))
        filtered[0].isMain = true;
      setListing({ ...listing, photos: filtered });
      showAlert("success", "Photo supprimée");
    },
    [listing, showAlert],
  );

  const setMainPhoto = useCallback(
    (photoId: string) => {
      if (!listing) return;
      setListing({
        ...listing,
        photos: listing.photos.map((p) => ({ ...p, isMain: p.id === photoId })),
      });
      showAlert("success", "Photo principale mise à jour");
    },
    [listing, showAlert],
  );

  const qualityScore = listing
    ? Math.min(
        85 +
          (listing.photos.length || 0) * 2 +
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
  };
}
