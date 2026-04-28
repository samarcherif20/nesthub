// hooks/useListingForm.ts - VERSION COMPLÈTE CORRIGÉE

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SeasonalRule {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  multiplier: number;
}

interface ExtraFee {
  id: string;
  label: string;
  amount: number;
  type: "fixed" | "per_night";
}

export interface ListingFormData {
  title: string;
  type: string;
  governorate: string;
  delegation: string;
  street: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
  rooms: number;
  bathrooms: number;
  numberOfKitchens: number;
  maxGuests: number | null;
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
    id?: string;
    url: string;
    thumbnailUrl: string;
    isMain: boolean;
    file?: File;
  }>;
  rentalType: string;
  pricePerNight: number | null;
  pricePerMonth: number | null;
  securityDeposit: number | null;
  cleaningFee: number | null;
  extraFees: ExtraFee[];
  weekendPriceMultiplier: number;
  seasonalRules: SeasonalRule[];
}

interface FieldError {
  field: string;
  message: string;
}

const initialFormData: ListingFormData = {
  title: "",
  type: "APARTMENT",
  governorate: "",
  delegation: "",
  street: "",
  latitude: null,
  longitude: null,
  description: "",
  rooms: 1,
  bathrooms: 1,
  numberOfKitchens: 1,
  maxGuests: null,
  surfaceArea: null,
  floorNumber: null,
  hasElevator: false,
  hasBalcony: false,
  hasGarden: false,
  hasGarage: false,
  isFurnished: false,
  petsAllowed: false,
  smokingAllowed: false,
  equipment: {},
  services: {},
  houseRules: {},
  customRules: "",
  photos: [],
  rentalType: "SHORT_TERM",
  pricePerNight: null,
  pricePerMonth: null,
  securityDeposit: null,
  cleaningFee: null,
  extraFees: [],
  weekendPriceMultiplier: 1.15,
  seasonalRules: [],
};

export const useListingForm = (locale: string) => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ListingFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [listingId, setListingId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const STEPS = [
    { id: 1, key: "typeLocation", icon: "🏠" },
    { id: 2, key: "characteristics", icon: "📏" },
    { id: 3, key: "equipment", icon: "🔧" },
    { id: 4, key: "photos", icon: "📸" },
    { id: 5, key: "pricing", icon: "💰" },
    { id: 6, key: "preview", icon: "👁️" },
  ];

  const validateField = useCallback(
    (field: string, value: any): string | null => {
      switch (field) {
        case "title":
          if (!value?.trim()) return "Le titre est requis";
          if (value.length < 5)
            return "Le titre doit contenir au moins 5 caractères";
          return null;
        case "description":
          if (!value?.trim()) return "La description est requise";
          if (value.length < 20)
            return "La description doit contenir au moins 20 caractères";
          return null;
        case "governorate":
          if (!value) return "Le gouvernorat est requis";
          return null;
        case "delegation":
          if (!value?.trim()) return "La délégation est requise";
          return null;
        case "street":
          if (!value?.trim()) return "La rue est requise";
          return null;
        case "location":
          if (form.latitude === null || form.longitude === null)
            return "La localisation sur la carte est requise";
          return null;
        case "rooms":
          if (value < 1) return "Au moins 1 chambre est requise";
          return null;
        case "bathrooms":
          if (value < 1) return "Au moins 1 salle de bain est requise";
          return null;
        case "numberOfKitchens":
          if (value < 1) return "Au moins 1 cuisine est requise";
          return null;
        case "surfaceArea":
          if (!value || value <= 0) return "La surface est requise";
          return null;
        case "floorNumber":
          if (value === null || value === undefined)
            return "Le numéro d'étage est requis";
          return null;
        case "photos":
          if (form.photos.length === 0) return "Au moins une photo est requise";
          if (!form.photos.some((p) => p.isMain))
            return "Veuillez définir une photo principale";
          return null;
        case "pricePerNight":
          if (
            (form.rentalType === "SHORT_TERM" || form.rentalType === "BOTH") &&
            (!value || value <= 0)
          ) {
            return "Le prix par nuit est requis";
          }
          return null;
        case "pricePerMonth":
          if (
            (form.rentalType === "LONG_TERM" || form.rentalType === "BOTH") &&
            (!value || value <= 0)
          ) {
            return "Le prix par mois est requis";
          }
          return null;
        default:
          return null;
      }
    },
    [
      form.latitude,
      form.longitude,
      form.photos.length,
      form.photos,
      form.rentalType,
    ],
  );

  const isStepValid = useMemo(() => {
    if (step === 1) {
      if (!form.title.trim() || form.title.length < 5) return false;
      if (!form.description.trim() || form.description.length < 20)
        return false;
      if (!form.governorate) return false;
      if (!form.delegation.trim()) return false;
      if (!form.street.trim()) return false;
      if (form.latitude === null || form.longitude === null) return false;
    }
    if (step === 2) {
      if (form.rooms < 1) return false;
      if (form.bathrooms < 1) return false;
      if (form.numberOfKitchens < 1) return false;
      if (!form.surfaceArea || form.surfaceArea <= 0) return false;
      if (form.floorNumber === null || form.floorNumber === undefined)
        return false;
    }
    if (step === 4) {
      if (form.photos.length === 0) return false;
      if (!form.photos.some((p) => p.isMain)) return false;
    }
    if (step === 5) {
      if (
        (form.rentalType === "SHORT_TERM" || form.rentalType === "BOTH") &&
        (!form.pricePerNight || form.pricePerNight <= 0)
      )
        return false;
      if (
        (form.rentalType === "LONG_TERM" || form.rentalType === "BOTH") &&
        (!form.pricePerMonth || form.pricePerMonth <= 0)
      )
        return false;
    }
    return true;
  }, [step, form]);

  const handleBlur = useCallback(
    (field: string, value: any) => {
      const error = validateField(field, value);
      setFieldErrors((prev) => {
        const filtered = prev.filter((e) => e.field !== field);
        if (error) return [...filtered, { field, message: error }];
        return filtered;
      });
    },
    [validateField],
  );

  const getFieldError = useCallback(
    (field: string): string | null => {
      const error = fieldErrors.find((e) => e.field === field);
      return error ? error.message : null;
    },
    [fieldErrors],
  );

  const upd = useCallback(
    (u: Partial<ListingFormData>) => setForm((p) => ({ ...p, ...u })),
    [],
  );

  const uploadSinglePhoto = useCallback(
    async (file: File): Promise<{ url: string; thumbnailUrl: string }> => {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/listings/upload-temp-photo", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) {
        const error = await uploadRes.json();
        throw new Error(error.error || `Échec upload photo`);
      }
      const data = await uploadRes.json();
      return { url: data.url, thumbnailUrl: data.thumbnailUrl || data.url };
    },
    [],
  );

  const uploadPhotos = useCallback(
    async (photos: any[]): Promise<any[]> => {
      if (!photos.some((p) => p.file)) return photos;
      setUploadingPhotos(true);
      const uploadedPhotos = [];
      const totalToUpload = photos.filter((p) => p.file).length;
      let uploaded = 0;
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (photo.file) {
          try {
            const { url, thumbnailUrl } = await uploadSinglePhoto(photo.file);
            uploadedPhotos.push({
              ...photo,
              url,
              thumbnailUrl,
              file: undefined,
            });
            uploaded++;
            toast.loading(`Upload ${uploaded}/${totalToUpload}...`, {
              id: "upload-progress",
            });
          } catch (error) {
            console.error(`Erreur upload photo ${i + 1}:`, error);
            toast.error(`Erreur lors de l'upload de la photo ${i + 1}`);
            throw error;
          }
        } else {
          uploadedPhotos.push(photo);
        }
      }
      toast.dismiss("upload-progress");
      setUploadingPhotos(false);
      return uploadedPhotos;
    },
    [uploadSinglePhoto],
  );

  const saveDraft = useCallback(async () => {
    if (saving || uploadingPhotos) return;
    setSaving(true);
    try {
      let photosToSave = form.photos;
      const newPhotos = form.photos.filter((p) => p.file);
      if (newPhotos.length > 0) photosToSave = await uploadPhotos(form.photos);
      const formWithUrls = { ...form, photos: photosToSave };
      localStorage.setItem("listing_draft", JSON.stringify(formWithUrls));
      if (listingId) {
        await fetch(`/api/listings/${listingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formWithUrls, status: "DRAFT" }),
        });
      } else if (form.title) {
        const r = await fetch("/api/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formWithUrls, status: "DRAFT" }),
        });
        if (r.ok) {
          const d = await r.json();
          setListingId(d.id);
        }
      }
      setLastSaved(new Date());
      toast.success("Brouillon sauvegardé");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }, [form, listingId, saving, uploadingPhotos, uploadPhotos]);

  useEffect(() => {
    const id = setInterval(() => {
      if (form.title || form.photos.length > 0) saveDraft();
    }, 60000);
    return () => clearInterval(id);
  }, [form, saveDraft]);

  useEffect(() => {
    try {
      const d = localStorage.getItem("listing_draft");
      if (d) {
        const parsed = JSON.parse(d);
        const cleanPhotos =
          parsed.photos?.map((p: any) => ({
            ...p,
            file: undefined,
            url: p.url?.startsWith("blob:") ? undefined : p.url,
          })) || [];
        setForm((p) => ({ ...p, ...parsed, photos: cleanPhotos }));
        if (parsed.id) setListingId(parsed.id);
      }
    } catch {}
  }, []);

  useEffect(() => {
    return () => {
      form.photos.forEach((photo) => {
        if (photo.url && photo.url.startsWith("blob:"))
          URL.revokeObjectURL(photo.url);
        if (photo.thumbnailUrl && photo.thumbnailUrl.startsWith("blob:"))
          URL.revokeObjectURL(photo.thumbnailUrl);
      });
    };
  }, [form.photos]);

  const goToNextStep = () => {
    if (isStepValid) {
      saveDraft();
      setStep((s) => Math.min(STEPS.length, s + 1));
    } else {
      validateStep();
    }
  };

  const validateStep = () => {
    const errors: FieldError[] = [];
    if (step === 1) {
      const titleError = validateField("title", form.title);
      if (titleError) errors.push({ field: "title", message: titleError });
      const descError = validateField("description", form.description);
      if (descError) errors.push({ field: "description", message: descError });
      const govError = validateField("governorate", form.governorate);
      if (govError) errors.push({ field: "governorate", message: govError });
      const delError = validateField("delegation", form.delegation);
      if (delError) errors.push({ field: "delegation", message: delError });
      const streetError = validateField("street", form.street);
      if (streetError) errors.push({ field: "street", message: streetError });
      const locError = validateField("location", null);
      if (locError) errors.push({ field: "location", message: locError });
    }
    if (step === 2) {
      const roomsError = validateField("rooms", form.rooms);
      if (roomsError) errors.push({ field: "rooms", message: roomsError });
      const bathsError = validateField("bathrooms", form.bathrooms);
      if (bathsError) errors.push({ field: "bathrooms", message: bathsError });
      const kitchensError = validateField(
        "numberOfKitchens",
        form.numberOfKitchens,
      );
      if (kitchensError)
        errors.push({ field: "numberOfKitchens", message: kitchensError });
      const surfaceError = validateField("surfaceArea", form.surfaceArea);
      if (surfaceError)
        errors.push({ field: "surfaceArea", message: surfaceError });
      const floorError = validateField("floorNumber", form.floorNumber);
      if (floorError)
        errors.push({ field: "floorNumber", message: floorError });
    }
    if (step === 4) {
      const photosError = validateField("photos", null);
      if (photosError) errors.push({ field: "photos", message: photosError });
    }
    if (step === 5) {
      const priceNightError = validateField(
        "pricePerNight",
        form.pricePerNight,
      );
      if (priceNightError)
        errors.push({ field: "pricePerNight", message: priceNightError });
      const priceMonthError = validateField(
        "pricePerMonth",
        form.pricePerMonth,
      );
      if (priceMonthError)
        errors.push({ field: "pricePerMonth", message: priceMonthError });
    }
    setFieldErrors(errors);
    if (errors.length > 0) {
      toast.error(errors[0].message);
      return false;
    }
    return true;
  };

  const goToPrevStep = () => setStep((s) => Math.max(1, s - 1));

  // ✅ PUBLICATION CORRIGÉE - ENVOI EN PENDING_REVIEW
  const handlePublish = async () => {
    if (!isStepValid) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (uploadingPhotos) {
      toast.error("Veuillez attendre la fin de l'upload des photos");
      return;
    }

    if (form.photos.length === 0) {
      toast.error("Ajoutez au moins une photo");
      return;
    }

    if (
      form.rentalType === "SHORT_TERM" &&
      (!form.pricePerNight || form.pricePerNight <= 0)
    ) {
      toast.error("Veuillez saisir un prix par nuit valide");
      return;
    }

    setSaving(true);

    try {
      let finalPhotos = form.photos;
      const hasNewFiles = form.photos.some((p) => p.file);

      if (hasNewFiles) {
        toast.loading("Upload des photos en cours...", {
          id: "upload-progress",
        });
        finalPhotos = await uploadPhotos(form.photos);
        upd({ photos: finalPhotos });
      }

      const formDataToSend = {
        title: form.title,
        type: form.type,
        governorate: form.governorate,
        delegation: form.delegation,
        street: form.street,
        latitude: form.latitude,
        longitude: form.longitude,
        description: form.description,
        rooms: form.rooms,
        bathrooms: form.bathrooms,
        numberOfKitchens: form.numberOfKitchens,
        maxGuests: form.maxGuests,
        surfaceArea: form.surfaceArea,
        floorNumber: form.floorNumber,
        hasElevator: form.hasElevator,
        hasBalcony: form.hasBalcony,
        hasGarden: form.hasGarden,
        hasGarage: form.hasGarage,
        isFurnished: form.isFurnished,
        petsAllowed: form.petsAllowed,
        smokingAllowed: form.smokingAllowed,
        equipment: form.equipment,
        services: form.services,
        houseRules: form.houseRules,
        customRules: form.customRules,
        photos: finalPhotos.map((p) => ({
          url: p.url,
          thumbnailUrl: p.thumbnailUrl,
          isMain: p.isMain,
        })),
        rentalType: form.rentalType,
        pricePerNight: form.pricePerNight ? Number(form.pricePerNight) : null,
        pricePerMonth: form.pricePerMonth ? Number(form.pricePerMonth) : null,
        securityDeposit: form.securityDeposit,
        cleaningFee: form.cleaningFee || 0,
        extraFees: form.extraFees,
        weekendPriceMultiplier: form.weekendPriceMultiplier,
        seasonalRules: form.seasonalRules,
        status: "PENDING_REVIEW",
      };

      console.log("📸 Photos à envoyer:", formDataToSend.photos.length);

      const url = listingId ? `/api/listings/${listingId}` : "/api/listings";
      const method = listingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formDataToSend),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.removeItem("listing_draft");
        toast.dismiss("upload-progress");
        toast.success(
          "Annonce soumise avec succès ! Elle est en attente de validation par l'administrateur.",
        );
        router.push(`/${locale}/dashboard/owner/listings`);
      } else {
        toast.error(
          data.details || data.error || "Erreur lors de la publication",
        );
        console.error("Erreur API:", data);
      }
    } catch (e) {
      console.error("Erreur handlePublish:", e);
      toast.error("Erreur lors de la publication");
    } finally {
      setSaving(false);
      toast.dismiss("upload-progress");
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const remainingSlots = 20 - form.photos.length;
    if (remainingSlots <= 0) {
      toast.error("Maximum 20 photos");
      return;
    }
    const newPhotos = Array.from(files)
      .slice(0, remainingSlots)
      .map((file, index) => ({
        url: URL.createObjectURL(file),
        thumbnailUrl: URL.createObjectURL(file),
        isMain: form.photos.length === 0 && index === 0,
        file: file,
      }));
    upd({ photos: [...form.photos, ...newPhotos] });
    toast.success(`${newPhotos.length} photo(s) ajoutée(s)`);
  };

  const removePhoto = (idx: number) => {
    const photoToRemove = form.photos[idx];
    if (photoToRemove.url && photoToRemove.url.startsWith("blob:"))
      URL.revokeObjectURL(photoToRemove.url);
    if (
      photoToRemove.thumbnailUrl &&
      photoToRemove.thumbnailUrl.startsWith("blob:")
    )
      URL.revokeObjectURL(photoToRemove.thumbnailUrl);
    const newPhotos = form.photos.filter((_, i) => i !== idx);
    if (
      photoToRemove.isMain &&
      newPhotos.length > 0 &&
      !newPhotos.some((p) => p.isMain)
    ) {
      newPhotos[0].isMain = true;
    }
    upd({ photos: newPhotos });
  };

  const setMainPhoto = (idx: number) => {
    upd({ photos: form.photos.map((p, i) => ({ ...p, isMain: i === idx })) });
    toast.success("Photo principale définie");
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return {
    step,
    form,
    saving,
    lastSaved,
    dragActive,
    fieldErrors,
    fileRef,
    STEPS,
    isStepValid,
    progress,
    uploadingPhotos,
    upd,
    handleBlur,
    getFieldError,
    saveDraft,
    goToNextStep,
    goToPrevStep,
    handlePublish,
    handleFiles,
    removePhoto,
    setMainPhoto,
    setDragActive,
    setStep,
    validateStep,
  };
};
