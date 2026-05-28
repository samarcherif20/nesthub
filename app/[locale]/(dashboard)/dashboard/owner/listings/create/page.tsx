// app/[locale]/dashboard/owner/listings/create/page.tsx
"use client";
import { usePriceRecommendation } from "@/hooks/usePriceRecommendation";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import * as React from "react";
import Link from "next/link";

// Composant Map
import MapPickerWrapper from "@/components/ui/maps/MapPickerWrapper";

// Icônes React
import {
  Home,
  Building2,
  Hotel,
  Layers,
  Bed,
  Bath,
  Users,
  Ruler,
  ArrowUp,
  Wifi,
  Wind,
  Flame,
  Utensils,
  Car,
  Waves,
  Dumbbell,
  Tv,
  Trees,
  WashingMachine,
  Fan,
  Shield,
  Sparkles,
  Sun,
  Calendar,
  Star,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  Trash2,
  Image as ImageIcon,
  Camera,
  Info,
  Eye,
  Loader2,
  MapPin,
  Lightbulb,
  Rocket,
  Moon,
  Save,
  PartyPopper,
  Dog,
  Ban,
  Headphones,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// ─── Types ────────────────────────────────────────────────────────────────────
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

interface ListingFormData {
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

const initial: ListingFormData = {
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

// ─── Static data ──────────────────────────────────────────────────────────────
const propertyTypes = [
  { value: "APARTMENT", icon: Building2, labelKey: "apartment" },
  { value: "VILLA", icon: Home, labelKey: "villa" },
  { value: "STUDIO", icon: Hotel, labelKey: "studio" },
  { value: "DUPLEX", icon: Layers, labelKey: "duplex" },
  { value: "HOUSE", icon: Home, labelKey: "house" },
];

const governorates = [
  "Tunis",
  "Ariana",
  "Ben Arous",
  "Manouba",
  "Nabeul",
  "Zaghouan",
  "Bizerte",
  "Béja",
  "Jendouba",
  "Le Kef",
  "Siliana",
  "Kairouan",
  "Kasserine",
  "Sidi Bouzid",
  "Sousse",
  "Monastir",
  "Mahdia",
  "Sfax",
  "Gafsa",
  "Tozeur",
  "Kébili",
  "Gabès",
  "Médenine",
  "Tataouine",
];

const equipmentIds = [
  { id: "wifi", labelKey: "wifi" },
  { id: "ac", labelKey: "ac" },
  { id: "heating", labelKey: "heating" },
  { id: "kitchen", labelKey: "kitchen" },
  { id: "parking", labelKey: "parking" },
  { id: "pool", labelKey: "pool" },
  { id: "gym", labelKey: "gym" },
  { id: "washer", labelKey: "washer" },
  { id: "tv", labelKey: "tv" },
  { id: "dishwasher", labelKey: "dishwasher" },
  { id: "dryer", labelKey: "dryer" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function Stepper({
  value,
  min = 1,
  max = 20,
  onChange,
  t,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg px-2 py-1 shadow-sm border border-slate-100 dark:border-slate-700">
      <button
        type="button"
        aria-label={t("aria.decrease")}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-all active:scale-90 cursor-pointer"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="w-10 text-center font-bold text-base text-slate-900 dark:text-white tabular-nums">
        {value}
      </span>
      <button
        type="button"
        aria-label={t("aria.increase")}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-all active:scale-90 cursor-pointer"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  t,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  t: (key: string) => string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={checked ? t("aria.disable") : t("aria.enable")}
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40 cursor-pointer ${checked ? "bg-sky-600" : "bg-slate-200 dark:bg-slate-700"}`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? "translate-x-6" : "translate-x-0"}`}
      />
    </button>
  );
}

function SectionTitle({ num, title }: { num?: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      {num !== undefined && (
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 via-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
          {num}
        </div>
      )}
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
        {title}
      </h2>
    </div>
  );
}

const getDisplayUrl = (url: string) => {
  if (!url) return null;
  if (url.startsWith("blob:")) return url;
  if (url.startsWith("/api/")) return url;
  return `/api/listings/image?url=${encodeURIComponent(url)}`;
};

function Tooltip({
  children,
  text,
}: {
  children: React.ReactNode;
  text: string;
}) {
  return (
    <span className="group relative inline-block">
      {children}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {text}
      </span>
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FONCTION DE GEOCODAGE
// ═══════════════════════════════════════════════════════════════════
const geocodeAddress = async (
  address: string,
  t: (key: string) => string,
): Promise<{ lat: number; lng: number } | null> => {
  try {
    console.log("🔍 [GEOCODAGE] Appel API pour:", address);
    if (!address || address.length < 10) return null;

    const response = await fetch(
      `/api/geocode?address=${encodeURIComponent(address)}`,
    );

    if (!response.ok) {
      if (response.status === 429) toast.error(t("toast.tooManyRequests"));
      return null;
    }

    const data = await response.json();

    if (data.success && data.results && data.results.length > 0) {
      const firstResult = data.results[0];
      return { lat: firstResult.lat, lng: firstResult.lon };
    }

    toast.warning(t("toast.addressNotFound"));
    return null;
  } catch (error) {
    console.error("❌ [GEOCODAGE] Erreur:", error);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════
export default function CreateListingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = React.use(params);
  const router = useRouter();
  const { user } = useUser();
  const { getRecommendation, loading: aiLoading } = usePriceRecommendation();
  const [recommendedPrice, setRecommendedPrice] = useState<number | null>(null);
  const [recommendedPriceMonth, setRecommendedPriceMonth] = useState<
    number | null
  >(null);
  const t = useTranslations("CreateListing");

  // ============================================
  // TOUS LES useState
  // ============================================
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ListingFormData>(initial);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [listingId, setListingId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const formRef = useRef(form);
  const [uploadCount, setUploadCount] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [isPageLoading, setIsPageLoading] = useState(true);

  // ============================================
  // TOUS LES useEffect (AVANT le return)
  // ============================================
  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  // Charger brouillon
  useEffect(() => {
    try {
      const draft = localStorage.getItem("listing_draft");
      if (draft) {
        const parsed = JSON.parse(draft);
        setForm((p) => ({ ...p, ...parsed }));
        if (parsed.id) setListingId(parsed.id);
      }
    } catch {}
  }, []);

  // Nettoyer URLs blob
  useEffect(() => {
    return () => {
      form.photos.forEach((photo) => {
        if (photo.url?.startsWith("blob:")) URL.revokeObjectURL(photo.url);
        if (photo.thumbnailUrl?.startsWith("blob:"))
          URL.revokeObjectURL(photo.thumbnailUrl);
      });
      if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
    };
  }, [form.photos]);

  // Détecter modifications non sauvegardées
  useEffect(() => {
    const hasChanges =
      form.title !== "" ||
      form.description !== "" ||
      form.photos.length > 0 ||
      form.governorate !== "" ||
      form.delegation !== "" ||
      form.street !== "";
    setHasUnsavedChanges(hasChanges);
  }, [form]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = t("alerts.unsavedChanges");
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, t]);

  // ============================================
  // STEPS
  // ============================================
  const STEPS = [
    {
      id: 1,
      key: "typeLocation",
      icon: Building2,
      title: t("steps.typeLocation"),
    },
    {
      id: 2,
      key: "characteristics",
      icon: Ruler,
      title: t("steps.characteristics"),
    },
    { id: 3, key: "equipment", icon: Wifi, title: t("steps.equipment") },
    { id: 4, key: "photos", icon: Camera, title: t("steps.photos") },
    { id: 5, key: "pricing", icon: Sparkles, title: t("steps.pricing") },
    { id: 6, key: "preview", icon: Eye, title: t("steps.preview") },
  ];

  // ============================================
  // TOUS LES useCallback et useMemo
  // ============================================
  const upd = useCallback(
    (u: Partial<ListingFormData>) => setForm((p) => ({ ...p, ...u })),
    [],
  );

  const validateField = useCallback(
    (field: string, value: any): string | null => {
      switch (field) {
        case "title":
          if (!value?.trim()) return t("validation.titleRequired");
          if (value.length < 5) return t("validation.titleMinLength");
          return null;
        case "description":
          if (!value?.trim()) return t("validation.descriptionRequired");
          if (value.length < 20) return t("validation.descriptionMinLength");
          return null;
        case "governorate":
          if (!value) return t("validation.governorateRequired");
          return null;
        case "delegation":
          if (!value?.trim()) return t("validation.delegationRequired");
          return null;
        case "street":
          if (!value?.trim()) return t("validation.streetRequired");
          return null;
        case "location":
          if (form.latitude === null || form.longitude === null)
            return t("validation.locationRequired");
          return null;
        case "rooms":
          if (value < 1) return t("validation.roomsRequired");
          return null;
        case "bathrooms":
          if (value < 1) return t("validation.bathroomsRequired");
          return null;
        case "numberOfKitchens":
          if (value < 1) return t("validation.kitchensRequired");
          return null;
        case "surfaceArea":
          if (!value || value <= 0) return t("validation.surfaceRequired");
          return null;
        case "floorNumber":
          if (value === null || value === undefined)
            return t("validation.floorRequired");
          return null;
        case "photos":
          if (form.photos.length === 0) return t("validation.photosRequired");
          if (!form.photos.some((p) => p.isMain))
            return t("validation.mainPhotoRequired");
          return null;
        case "pricePerNight":
          if (
            (form.rentalType === "SHORT_TERM" || form.rentalType === "BOTH") &&
            (!value || value <= 0)
          ) {
            return t("validation.pricePerNightRequired");
          }
          return null;
        case "pricePerMonth":
          if (
            (form.rentalType === "LONG_TERM" || form.rentalType === "BOTH") &&
            (!value || value <= 0)
          ) {
            return t("validation.pricePerMonthRequired");
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
      t,
    ],
  );

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

  const handleAIPriceRecommendation = async () => {
    const result = await getRecommendation({
      governorate: form.governorate,
      type: form.type,
      rooms: form.rooms,
      bathrooms: form.bathrooms,
      surfaceArea: form.surfaceArea,
      equipment: form.equipment,
      hasBalcony: form.hasBalcony,
      hasGarden: form.hasGarden,
      hasGarage: form.hasGarage,
      hasElevator: form.hasElevator,
      isFurnished: form.isFurnished,
      rentalType: form.rentalType,
    });

    if (result) {
      setRecommendedPrice(result.pricePerNight);
      setRecommendedPriceMonth(result.pricePerMonth);
      toast.success(
        t("toast.priceRecommendation", {
          night: result.pricePerNight,
          month: result.pricePerMonth,
        }),
      );
    }
  };

  const handleGeocodeOnEnter = useCallback(async () => {
    const currentForm = formRef.current;

    if (!currentForm.governorate?.trim()) {
      toast.warning(t("toast.selectGovernorateFirst"));
      return;
    }
    if (!currentForm.delegation?.trim()) {
      toast.warning(t("toast.fillDelegationFirst"));
      return;
    }
    if (!currentForm.street?.trim()) {
      toast.warning(t("toast.fillStreetFirst"));
      return;
    }

    if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);

    geocodeTimeoutRef.current = setTimeout(async () => {
      const latestForm = formRef.current;
      const fullAddress = `${latestForm.street.trim()}, ${latestForm.delegation.trim()}, ${latestForm.governorate.trim()}, Tunisie`;

      setIsGeocoding(true);
      try {
        const coords = await geocodeAddress(fullAddress, t);
        if (coords) {
          upd({ latitude: coords.lat, longitude: coords.lng });
          setTimeout(() => {
            const error = validateField("location", null);
            if (!error)
              setFieldErrors((prev) =>
                prev.filter((e) => e.field !== "location"),
              );
            toast.success(t("toast.positionFound"));
          }, 100);
        }
      } catch (error) {
        console.error("Erreur géocodage:", error);
      } finally {
        setIsGeocoding(false);
        geocodeTimeoutRef.current = null;
      }
    }, 800);
  }, [upd, validateField, t]);

  const validateStep = useCallback((): boolean => {
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
  }, [step, form, validateField]);

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

  const stepCompletion = useMemo(
    () => ({
      1:
        form.title &&
        form.description &&
        form.governorate &&
        form.latitude !== null,
      2:
        form.rooms > 0 &&
        form.bathrooms > 0 &&
        form.numberOfKitchens > 0 &&
        form.surfaceArea &&
        form.surfaceArea > 0 &&
        form.floorNumber !== null,
      3: true,
      4: form.photos.length > 0 && form.photos.some((p) => p.isMain),
      5:
        (form.pricePerNight !== null && form.pricePerNight > 0) ||
        (form.pricePerMonth !== null && form.pricePerMonth > 0),
      6: true,
    }),
    [form],
  );

  const uploadSinglePhoto = useCallback(
    async (file: File): Promise<{ url: string; thumbnailUrl: string }> => {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/listings/upload-temp-photo", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) throw new Error(t("toast.uploadFailed"));
      const data = await uploadRes.json();
      return { url: data.url, thumbnailUrl: data.thumbnailUrl || data.url };
    },
    [t],
  );

  const uploadPhotos = useCallback(
    async (photos: any[]) => {
      const uploadedPhotos = [];
      for (const photo of photos) {
        if (photo.file) {
          const { url, thumbnailUrl } = await uploadSinglePhoto(photo.file);
          uploadedPhotos.push({ ...photo, url, thumbnailUrl, file: undefined });
        } else {
          uploadedPhotos.push(photo);
        }
      }
      return uploadedPhotos;
    },
    [uploadSinglePhoto],
  );

  const saveDraft = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const uploadedPhotos = await uploadPhotos(form.photos);
      const formWithUrls = { ...form, photos: uploadedPhotos };
      localStorage.setItem("listing_draft", JSON.stringify(formWithUrls));

      let response;
      if (listingId) {
        response = await fetch(`/api/listings/${listingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formWithUrls, status: "DRAFT" }),
        });
      } else if (form.title) {
        response = await fetch("/api/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formWithUrls, status: "DRAFT" }),
        });
      }

      if (response && response.ok) {
        const data = await response.json();
        if (!listingId && data.id) {
          setListingId(data.id);
          const draft = JSON.parse(
            localStorage.getItem("listing_draft") || "{}",
          );
          draft.id = data.id;
          localStorage.setItem("listing_draft", JSON.stringify(draft));
        }
        setLastSaved(new Date());
        toast.success(t("toast.draftSaved"));
      }
    } catch (e) {
      console.error(e);
      toast.error(t("toast.saveError"));
    } finally {
      setSaving(false);
    }
  }, [form, listingId, saving, uploadPhotos, t]);

  const goToNextStep = () => {
    if (validateStep()) setStep((s) => Math.min(STEPS.length, s + 1));
  };
  const goToPrevStep = () => setStep((s) => Math.max(1, s - 1));

  const handlePublish = async () => {
    if (!validateStep()) return;
    setSaving(true);

    const loadingId = toast.loading(t("toast.publishing"), {
      position: "top-center",
    });

    try {
      const uploadedPhotos = await uploadPhotos(form.photos);
      const formWithUrls = {
        ...form,
        photos: uploadedPhotos,
        status: "PENDING_REVIEW",
      };
      const url = listingId ? `/api/listings/${listingId}` : "/api/listings";
      const method = listingId ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formWithUrls),
      });
      const data = await response.json();

      toast.dismiss(loadingId);

      if (response.ok) {
        localStorage.removeItem("listing_draft");
        toast.success(t("toast.published"), {
          duration: 3000,
          position: "top-center",
        });
        router.push(`/${locale}/dashboard/owner/listings`);
      } else {
        toast.error(data.details || data.error || t("toast.publishError"), {
          duration: 4000,
          position: "top-center",
        });
      }
    } catch (e) {
      toast.dismiss(loadingId);
      console.error("Erreur publication:", e);
      toast.error(t("toast.publishError"), {
        duration: 4000,
        position: "top-center",
      });
    } finally {
      setSaving(false);
    }
  };
  const handleFiles = async (files: FileList | null) => {
    if (!files) return;

    const filesArray = Array.from(files).slice(0, 20 - form.photos.length);
    const totalFiles = filesArray.length;

    setUploadCount(totalFiles);
    setUploadedCount(0);

    const newPhotos = [];
    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      try {
        const { url, thumbnailUrl } = await uploadSinglePhoto(file);
        newPhotos.push({
          url,
          thumbnailUrl,
          isMain: form.photos.length === 0 && newPhotos.length === 0,
          file: undefined,
        });
        setUploadedCount(i + 1);
      } catch (error) {
        console.error("Erreur upload:", error);
        toast.error(t("toast.uploadError"));
      }
    }

    upd({ photos: [...form.photos, ...newPhotos] });

    setTimeout(() => {
      setUploadCount(0);
      setUploadedCount(0);
    }, 500);
  };

  const removePhoto = (idx: number) => {
    const newPhotos = form.photos.filter((_, i) => i !== idx);
    if (newPhotos.length > 0 && !newPhotos.some((p) => p.isMain))
      newPhotos[0].isMain = true;
    upd({ photos: newPhotos });
    toast.success(t("toast.photoRemoved"));
  };

  const setMainPhoto = (idx: number) => {
    upd({ photos: form.photos.map((p, i) => ({ ...p, isMain: i === idx })) });
    toast.success(t("toast.mainPhotoSet"));
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  const equipmentIcons: Record<string, any> = {
    wifi: Wifi,
    ac: Wind,
    heating: Flame,
    kitchen: Utensils,
    parking: Car,
    pool: Waves,
    gym: Dumbbell,
    washer: WashingMachine,
    tv: Tv,
    balcony: Trees,
    dishwasher: Utensils,
    dryer: Fan,
  };

  // ============================================
  // RETURN CONDITIONNEL (APRÈS TOUS LES HOOKS)
  // ============================================
  if (isPageLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner className="mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">{t("loading")}</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER PRINCIPAL
  // ============================================
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-800">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">
            <Link
              href={`/${locale}/dashboard/owner/listings`}
              className="hover:text-indigo-600 transition-colors"
            >
              {t("breadcrumb.myListings")}
            </Link>
            <ChevronRight size={12} />
            <span className="text-black dark:text-white">
              {t("breadcrumb.newListing")}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                {t("title")}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t("stepInfo", {
                  step,
                  total: STEPS.length,
                  title: STEPS[step - 1].title,
                })}
              </p>
            </div>
            <Tooltip text={t("tooltip.saveDraft")}>
              <button
                type="button"
                onClick={saveDraft}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-sky-600 hover:bg-sky-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {saving ? t("button.saving") : t("button.draft")}
                {lastSaved && !saving && (
                  <span className="text-xs text-slate-400">
                    {lastSaved.toLocaleTimeString(locale, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </button>
            </Tooltip>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-4">
            <div
              className="h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-violet-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Steps */}
          <div className="flex items-center justify-between mt-4">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isComplete =
                stepCompletion[s.id as keyof typeof stepCompletion];
              const isCurrentStep = s.id === step;
              const isPastStep = s.id < step;

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => isPastStep && setStep(s.id)}
                  className={`flex flex-col items-center gap-1 transition-all ${s.id <= step ? "cursor-pointer" : "cursor-default"} relative`}
                >
                  <div className="relative">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        isPastStep
                          ? "bg-emerald-500 text-white shadow-md"
                          : isCurrentStep
                            ? "bg-gradient-to-br from-sky-400 via-indigo-500 to-violet-600 text-white shadow-md"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                      }`}
                    >
                      {/* ✅ Icône verte (✓) seulement sur l'étape actuelle si complétée */}
                      {isCurrentStep && isComplete ? (
                        <Check size={14} />
                      ) : isPastStep ? (
                        <Check size={14} />
                      ) : (
                        <Icon size={14} />
                      )}
                    </div>
                    {/* ✅ Pastille verte uniquement sur l'étape actuelle si complétée */}
                    {isCurrentStep && isComplete && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                    )}
                  </div>
                  <span
                    className={`hidden md:block text-[10px] font-bold uppercase tracking-wider ${
                      s.id <= step
                        ? "text-sky-600 dark:text-sky-400"
                        : "text-slate-400"
                    }`}
                  >
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenu scrollable - LE RESTE DE TON JSX */}
      {/* ... (le reste du JSX reste identique, avec t() pour toutes les traductions) ... */}
      <div className="flex-1 overflow-y-auto py-8 transition-all duration-300 animate-fadeIn">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* STEP 1 : TYPE & LOCALISATION */}
              {step === 1 && (
                <>
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <SectionTitle num={1} title={t("propertyType.title")} />
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {propertyTypes.map((pt) => {
                        const Icon = pt.icon;
                        return (
                          <label
                            key={pt.value}
                            className="cursor-pointer group"
                          >
                            <input
                              type="radio"
                              name="type"
                              value={pt.value}
                              checked={form.type === pt.value}
                              onChange={(e) => upd({ type: e.target.value })}
                              className="sr-only"
                            />
                            <div
                              className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 ${form.type === pt.value ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20 shadow-sm" : "border-transparent bg-slate-50 dark:bg-slate-800 hover:border-slate-200"}`}
                            >
                              <Icon
                                size={22}
                                className={`transition-colors ${form.type === pt.value ? "text-sky-600" : "text-slate-400"}`}
                              />
                              <span
                                className={`text-xs font-bold text-center ${form.type === pt.value ? "text-sky-700" : "text-slate-500"}`}
                              >
                                {t(`propertyType.${pt.labelKey}`)}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <SectionTitle
                      num={2}
                      title={t("titleAndDescription.title")}
                    />
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-1 mb-1.5">
                          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            {t("titleAndDescription.listingTitle")}
                          </label>
                          <Tooltip text={t("tooltip.required")}>
                            <span className="text-rose-500 text-xs">*</span>
                          </Tooltip>
                        </div>
                        <input
                          type="text"
                          value={form.title}
                          onChange={(e) => upd({ title: e.target.value })}
                          onBlur={() => handleBlur("title", form.title)}
                          placeholder={t(
                            "titleAndDescription.titlePlaceholder",
                          )}
                          maxLength={100}
                          className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-lg py-3 px-4 text-base focus:ring-2 focus:ring-sky-500/30 outline-none ${getFieldError("title") ? "border-rose-500" : "border-slate-200 dark:border-slate-700"}`}
                        />
                        {getFieldError("title") && (
                          <p className="text-xs text-rose-500 mt-1">
                            {getFieldError("title")}
                          </p>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1 mb-1.5">
                          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            {t("titleAndDescription.description")}
                          </label>
                        </div>
                        <div className="relative">
                          <textarea
                            value={form.description}
                            onChange={(e) =>
                              upd({ description: e.target.value })
                            }
                            onBlur={() =>
                              handleBlur("description", form.description)
                            }
                            placeholder={t(
                              "titleAndDescription.descriptionPlaceholder",
                            )}
                            rows={4}
                            maxLength={2000}
                            className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-lg py-3 px-4 text-base focus:ring-2 focus:ring-sky-500/30 outline-none resize-none ${getFieldError("description") ? "border-rose-500" : "border-slate-200 dark:border-slate-700"}`}
                          />
                          <span
                            className={`absolute bottom-3 right-3 text-[10px] ${
                              form.description.length > 1800
                                ? "text-amber-500 font-semibold"
                                : "text-slate-400"
                            }`}
                          >
                            {form.description.length}/2000
                          </span>
                        </div>
                        {getFieldError("description") && (
                          <p className="text-xs text-rose-500 mt-1">
                            {getFieldError("description")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <SectionTitle num={3} title={t("location.title")} />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                          {t("location.governorate")}{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={form.governorate}
                          onChange={(e) => upd({ governorate: e.target.value })}
                          onBlur={() =>
                            handleBlur("governorate", form.governorate)
                          }
                          className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border rounded-lg py-3 px-4 pr-8 text-base focus:ring-2 focus:ring-sky-500/30 outline-none"
                        >
                          <option value="">{t("location.select")}</option>
                          {governorates.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                        {getFieldError("governorate") && (
                          <p className="text-xs text-rose-500 mt-1">
                            {getFieldError("governorate")}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                          {t("location.delegation")}{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={form.delegation}
                            onChange={(e) =>
                              upd({ delegation: e.target.value })
                            }
                            onBlur={() =>
                              handleBlur("delegation", form.delegation)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleGeocodeOnEnter();
                              }
                            }}
                            placeholder={t("location.delegationPlaceholder")}
                            className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg py-3 px-4 pr-10 text-base focus:ring-2 focus:ring-sky-500/30 outline-none"
                          />
                          {isGeocoding && (
                            <Loader2
                              size={16}
                              className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-sky-500"
                            />
                          )}
                        </div>
                        {getFieldError("delegation") && (
                          <p className="text-xs text-rose-500 mt-1">
                            {getFieldError("delegation")}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                          {t("location.street")}{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={form.street}
                            onChange={(e) => upd({ street: e.target.value })}
                            onBlur={() => handleBlur("street", form.street)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleGeocodeOnEnter();
                              }
                            }}
                            placeholder={t("location.streetPlaceholder")}
                            className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg py-3 px-4 pr-10 text-base focus:ring-2 focus:ring-sky-500/30 outline-none"
                          />
                          {isGeocoding && (
                            <Loader2
                              size={16}
                              className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-sky-500"
                            />
                          )}
                        </div>
                        {getFieldError("street") && (
                          <p className="text-xs text-rose-500 mt-1">
                            {getFieldError("street")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Lightbulb
                          size={12}
                          className="text-sky-500 shrink-0"
                        />
                        <span>{t("location.helpText")}</span>
                        <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px] font-mono font-bold">
                          {t("location.enterKey")}
                        </kbd>
                        <span>{t("location.helpTextEnd")}</span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                        {t("location.exactPosition")}{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <div className="h-64 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                        <MapPickerWrapper
                          key={`${form.latitude}-${form.longitude}-${isGeocoding}`}
                          latitude={form.latitude}
                          longitude={form.longitude}
                          onLocationChange={(lat, lng) => {
                            upd({ latitude: lat, longitude: lng });
                            handleBlur("location", null);
                          }}
                          onLocationDetected={(lat, lng, addressData) => {
                            if (addressData) {
                              upd({
                                governorate:
                                  addressData.governorate || form.governorate,
                                delegation:
                                  addressData.delegation || form.delegation,
                                street: addressData.street || form.street,
                                latitude: lat,
                                longitude: lng,
                              });
                              if (addressData.governorate)
                                handleBlur(
                                  "governorate",
                                  addressData.governorate,
                                );
                              if (addressData.delegation)
                                handleBlur(
                                  "delegation",
                                  addressData.delegation,
                                );
                              if (addressData.street)
                                handleBlur("street", addressData.street);
                              handleBlur("location", null);
                              toast.success(t("toast.positionAndAddressFound"));
                            }
                          }}
                          onAddressChange={(address) =>
                            console.log("Address:", address)
                          }
                          isGeocoding={isGeocoding}
                          showCurrentLocation={true}
                          readOnly={false}
                        />
                      </div>
                      {getFieldError("location") && (
                        <p className="text-xs text-rose-500 mt-1">
                          {getFieldError("location")}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* STEP 2 : Caractéristiques */}
              {step === 2 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                  <SectionTitle title={t("characteristics.title")} />
                  <div className="space-y-4">
                    {[
                      {
                        key: "rooms",
                        icon: Bed,
                        label: t("characteristics.bedrooms"),
                        value: form.rooms,
                        set: (v: number) => upd({ rooms: v }),
                      },
                      {
                        key: "bathrooms",
                        icon: Bath,
                        label: t("characteristics.bathrooms"),
                        value: form.bathrooms,
                        set: (v: number) => upd({ bathrooms: v }),
                      },
                      {
                        key: "numberOfKitchens",
                        icon: Utensils,
                        label: t("characteristics.kitchens"),
                        value: form.numberOfKitchens,
                        set: (v: number) => upd({ numberOfKitchens: v }),
                      },
                    ].map((row) => {
                      const Icon = row.icon;
                      return (
                        <div
                          key={row.key}
                          className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                              <Icon
                                size={16}
                                className="text-sky-600 dark:text-sky-400"
                              />
                            </div>
                            <p className="font-bold text-sm">{row.label}</p>
                          </div>
                          <Stepper
                            value={row.value}
                            min={1}
                            max={10}
                            onChange={row.set}
                            t={t}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Users
                          size={16}
                          className="text-purple-600 dark:text-purple-400"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-sm">
                          {t("characteristics.guestCapacity")}
                        </p>
                        <p className="text-xs text-slate-500">
                          {t("characteristics.optional")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const current = form.maxGuests ?? 0;
                          upd({ maxGuests: Math.max(0, current - 1) });
                        }}
                        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="w-12 text-center font-bold text-base">
                        {form.maxGuests === null ? "—" : form.maxGuests}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const current = form.maxGuests ?? 0;
                          upd({ maxGuests: Math.min(50, current + 1) });
                        }}
                        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => upd({ maxGuests: null })}
                        className="ml-1 px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded cursor-pointer"
                      >
                        {t("characteristics.clear")}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 mt-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                      <Trees size={16} className="text-emerald-500" />
                      <span className="font-bold text-sm">
                        {t("characteristics.balcony")}
                      </span>
                      <Toggle
                        checked={form.hasBalcony}
                        onChange={(v) => upd({ hasBalcony: v })}
                        t={t}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                      <Trees size={16} className="text-emerald-500" />
                      <span className="font-bold text-sm">
                        {t("characteristics.garden")}
                      </span>
                      <Toggle
                        checked={form.hasGarden}
                        onChange={(v) => upd({ hasGarden: v })}
                        t={t}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                      <Car size={16} className="text-emerald-500" />
                      <span className="font-bold text-sm">
                        {t("characteristics.garage")}
                      </span>
                      <Toggle
                        checked={form.hasGarage}
                        onChange={(v) => upd({ hasGarage: v })}
                        t={t}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                        {t("characteristics.surface")}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={form.surfaceArea || ""}
                          onChange={(e) =>
                            upd({
                              surfaceArea: e.target.value
                                ? Number(e.target.value)
                                : null,
                            })
                          }
                          onBlur={() =>
                            handleBlur("surfaceArea", form.surfaceArea)
                          }
                          placeholder="120"
                          className="w-full bg-slate-50 border rounded-lg py-3 px-4 pr-12 outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          m²
                        </span>
                      </div>
                      {getFieldError("surfaceArea") && (
                        <p className="text-xs text-rose-500 mt-1">
                          {getFieldError("surfaceArea")}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                        {t("characteristics.floor")}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={form.floorNumber ?? ""}
                          onChange={(e) =>
                            upd({
                              floorNumber: e.target.value
                                ? Number(e.target.value)
                                : null,
                            })
                          }
                          onBlur={() =>
                            handleBlur("floorNumber", form.floorNumber)
                          }
                          placeholder={t("characteristics.floorPlaceholder")}
                          className="w-full bg-slate-50 border rounded-lg py-3 px-4 pr-10 outline-none"
                        />
                        <ArrowUp
                          size={14}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                      </div>
                      {getFieldError("floorNumber") && (
                        <p className="text-xs text-rose-500 mt-1">
                          {getFieldError("floorNumber")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                    <ArrowUp size={16} className="text-violet-600" />
                    <span className="font-bold text-sm">
                      {t("characteristics.elevator")}
                    </span>
                    <Toggle
                      checked={form.hasElevator}
                      onChange={(v) => upd({ hasElevator: v })}
                      t={t}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3 : Équipements */}
              {step === 3 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                  <SectionTitle title={t("equipment.title")} />
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3">
                    {equipmentIds.map((equip) => {
                      const active = !!form.equipment[equip.id];
                      const Icon = equipmentIcons[equip.id] || Check;
                      return (
                        <label key={equip.id} className="cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={(e) =>
                              upd({
                                equipment: {
                                  ...form.equipment,
                                  [equip.id]: e.target.checked,
                                },
                              })
                            }
                            className="sr-only"
                          />
                          <div
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 ${
                              active
                                ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20"
                                : "border-transparent bg-slate-50 dark:bg-slate-800 hover:border-slate-200"
                            }`}
                          >
                            <Icon
                              size={20}
                              className={
                                active ? "text-sky-600" : "text-slate-400"
                              }
                            />
                            <span
                              className={`text-[10px] font-semibold text-center ${active ? "text-sky-700" : "text-slate-500"}`}
                            >
                              {t(`equipment.${equip.labelKey}`)}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                      <Sparkles size={16} className="text-violet-600" />
                      <div className="text-center">
                        <p className="font-semibold text-sm">
                          {t("equipment.furnished")}
                        </p>
                        <p className="text-xs text-slate-500">
                          {t("equipment.furnishedDesc")}
                        </p>
                      </div>
                      <Toggle
                        checked={form.isFurnished}
                        onChange={(v) => upd({ isFurnished: v })}
                        t={t}
                      />
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                      <PartyPopper size={16} className="text-slate-500" />
                      <span className="font-semibold text-sm">
                        {t("houseRules.noParties")}
                      </span>
                      <Toggle
                        checked={!!form.houseRules.noParties}
                        onChange={(v) =>
                          upd({
                            houseRules: { ...form.houseRules, noParties: v },
                          })
                        }
                        t={t}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                      <Moon size={16} className="text-slate-500" />
                      <span className="font-semibold text-sm">
                        {t("houseRules.quietHours")}
                      </span>
                      <Toggle
                        checked={!!form.houseRules.quietAfter22}
                        onChange={(v) =>
                          upd({
                            houseRules: { ...form.houseRules, quietAfter22: v },
                          })
                        }
                        t={t}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                      <Dog size={16} className="text-slate-500" />
                      <span className="font-semibold text-sm">
                        {t("houseRules.petsAllowed")}
                      </span>
                      <Toggle
                        checked={form.petsAllowed}
                        onChange={(v) => upd({ petsAllowed: v })}
                        t={t}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                      <Ban size={16} className="text-slate-500" />
                      <span className="font-semibold text-sm">
                        {t("houseRules.smokingAllowed")}
                      </span>
                      <Toggle
                        checked={form.smokingAllowed}
                        onChange={(v) => upd({ smokingAllowed: v })}
                        t={t}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4 : Photos */}
              {step === 4 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                  <SectionTitle title={t("photos.title")} />
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragActive(false);
                      handleFiles(e.dataTransfer.files);
                    }}
                    onClick={() => fileRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all duration-200 ${
                      uploadCount > 0
                        ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20"
                        : dragActive
                          ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20"
                          : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-sky-300"
                    }`}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFiles(e.target.files)}
                      disabled={uploadCount > 0}
                    />

                    {uploadCount > 0 ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2
                          size={40}
                          className="animate-spin text-sky-500"
                        />
                        <div className="text-center">
                          <p className="font-bold text-base text-sky-600 dark:text-sky-400">
                            {t("photos.uploading")}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {uploadedCount} / {uploadCount} {t("photos.photos")}
                          </p>
                        </div>
                        <div className="w-48 h-1.5 bg-sky-200 dark:bg-sky-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sky-500 rounded-full transition-all duration-300"
                            style={{
                              width: `${(uploadedCount / uploadCount) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <Camera size={28} className="text-sky-500 mb-2" />
                        <p className="font-bold text-base">
                          {t("photos.dropzone")}
                        </p>
                        <p className="text-xs text-slate-500 text-center mt-1">
                          {t("photos.formatInfo")}
                        </p>
                      </>
                    )}

                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                      <Info size={12} /> {form.photos.length}/20
                    </div>
                  </div>
                  {getFieldError("photos") && (
                    <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                      <p className="text-xs text-rose-600">
                        {getFieldError("photos")}
                      </p>
                    </div>
                  )}
                  {form.photos.length > 0 && (
                    <div className="mt-5">
                      <p className="text-xs text-slate-500 mb-3">
                        {t("photos.clickStar")}
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {form.photos.map((photo, idx) => (
                          <div
                            key={idx}
                            className={`relative group rounded-lg overflow-hidden aspect-square bg-slate-100 ${photo.isMain ? "ring-2 ring-sky-500" : ""}`}
                          >
                            <img
                              src={getDisplayUrl(photo.url)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            {photo.isMain && (
                              <div className="absolute top-2 left-2">
                                <span className="bg-sky-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                  {t("photos.main")}
                                </span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              {!photo.isMain && (
                                <Tooltip text={t("photos.setMain")}>
                                  <button
                                    type="button"
                                    onClick={() => setMainPhoto(idx)}
                                    className="w-6 h-6 rounded-full bg-white/90 text-amber-500 flex items-center justify-center text-xs hover:scale-110"
                                  >
                                    <Star size={12} />
                                  </button>
                                </Tooltip>
                              )}
                              <Tooltip text={t("photos.delete")}>
                                <button
                                  type="button"
                                  onClick={() => removePhoto(idx)}
                                  className="w-6 h-6 rounded-full bg-white/90 text-rose-500 flex items-center justify-center text-xs hover:scale-110"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </Tooltip>
                            </div>
                          </div>
                        ))}
                        {form.photos.length < 20 && (
                          <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="aspect-square rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:border-sky-300 hover:text-sky-500"
                          >
                            <Plus size={20} />
                            <span className="text-[9px] font-bold">
                              {t("photos.add")}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 5 : Tarifs */}
              {step === 5 && (
                <div className="space-y-5">
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <SectionTitle title={t("rentalType.title")} />
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg gap-1">
                      {["SHORT_TERM", "LONG_TERM", "BOTH"].map((rt) => (
                        <button
                          key={rt}
                          type="button"
                          onClick={() => upd({ rentalType: rt })}
                          className={`flex-1 py-2 rounded-md text-sm font-bold transition-all cursor-pointer ${form.rentalType === rt ? "bg-white dark:bg-slate-700 text-sky-600 shadow-sm" : "text-slate-500"}`}
                        >
                          {t(`rentalType.${rt.toLowerCase()}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <SectionTitle title={t("pricing.title")} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(form.rentalType === "SHORT_TERM" ||
                        form.rentalType === "BOTH") && (
                        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-sky-50 via-indigo-50/30 to-sky-50 dark:from-sky-950/20 dark:via-indigo-950/10 dark:to-sky-950/20 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-sky-200/50 dark:hover:shadow-sky-900/20">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                          <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shadow-md animate-pulse">
                                <Sparkles size={14} className="text-white" />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
                                {t("pricing.aiRecommendation")}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-black text-sky-700 dark:text-sky-300">
                                {recommendedPrice || "—"}
                              </span>
                              <span className="text-xs font-bold text-slate-400">
                                {t("pricing.perNight")}
                              </span>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button
                                type="button"
                                onClick={handleAIPriceRecommendation}
                                disabled={aiLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-sky-600 bg-white/70 dark:bg-slate-800/70 rounded-lg border border-sky-200 dark:border-sky-800 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-all disabled:opacity-50"
                              >
                                {aiLoading ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Sparkles size={12} />
                                )}
                                {aiLoading
                                  ? t("pricing.calculating")
                                  : t("pricing.estimate")}
                              </button>
                              {recommendedPrice && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    upd({ pricePerNight: recommendedPrice })
                                  }
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-emerald-600 bg-white/70 dark:bg-slate-800/70 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all"
                                >
                                  <Check size={12} /> {t("pricing.apply")}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {(form.rentalType === "SHORT_TERM" ||
                        form.rentalType === "BOTH") && (
                        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 transition-all hover:shadow-md">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                              <Sun size={14} className="text-amber-500" />
                            </div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                              {t("pricing.yourPrice")}
                            </label>
                            <Tooltip text={t("tooltip.required")}>
                              <span className="text-rose-500 text-[10px]">
                                *
                              </span>
                            </Tooltip>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <input
                              type="number"
                              value={form.pricePerNight || ""}
                              onChange={(e) =>
                                upd({
                                  pricePerNight: e.target.value
                                    ? Number(e.target.value)
                                    : null,
                                })
                              }
                              onBlur={() =>
                                handleBlur("pricePerNight", form.pricePerNight)
                              }
                              placeholder="0"
                              className="w-full text-2xl font-black bg-transparent border-none outline-none"
                            />
                            <span className="text-xs font-bold text-slate-400">
                              {t("pricing.perNightShort")}
                            </span>
                          </div>
                          {getFieldError("pricePerNight") && (
                            <p className="text-[10px] text-rose-500 mt-1">
                              {getFieldError("pricePerNight")}
                            </p>
                          )}
                        </div>
                      )}

                      {(form.rentalType === "LONG_TERM" ||
                        form.rentalType === "BOTH") && (
                        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 via-indigo-50/30 to-purple-50 dark:from-purple-950/20 dark:via-indigo-950/10 dark:to-purple-950/20 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-purple-200/50 dark:hover:shadow-purple-900/20">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                          <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center shadow-md animate-pulse">
                                <Sparkles size={14} className="text-white" />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                                {t("pricing.aiRecommendation")}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-black text-purple-700 dark:text-purple-300">
                                {recommendedPriceMonth || "—"}
                              </span>
                              <span className="text-xs font-bold text-slate-400">
                                {t("pricing.perMonth")}
                              </span>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button
                                type="button"
                                onClick={handleAIPriceRecommendation}
                                disabled={aiLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-purple-600 bg-white/70 dark:bg-slate-800/70 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all disabled:opacity-50"
                              >
                                {aiLoading ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Sparkles size={12} />
                                )}
                                {aiLoading
                                  ? t("pricing.calculating")
                                  : t("pricing.estimate")}
                              </button>
                              {recommendedPriceMonth && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    upd({
                                      pricePerMonth: recommendedPriceMonth,
                                    })
                                  }
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-emerald-600 bg-white/70 dark:bg-slate-800/70 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all"
                                >
                                  <Check size={12} /> {t("pricing.apply")}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {(form.rentalType === "LONG_TERM" ||
                        form.rentalType === "BOTH") && (
                        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 transition-all hover:shadow-md">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                              <Calendar size={14} className="text-purple-500" />
                            </div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                              {t("pricing.yourPrice")}
                            </label>
                            <Tooltip text={t("tooltip.required")}>
                              <span className="text-rose-500 text-[10px]">
                                *
                              </span>
                            </Tooltip>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <input
                              type="number"
                              value={form.pricePerMonth || ""}
                              onChange={(e) =>
                                upd({
                                  pricePerMonth: e.target.value
                                    ? Number(e.target.value)
                                    : null,
                                })
                              }
                              onBlur={() =>
                                handleBlur("pricePerMonth", form.pricePerMonth)
                              }
                              placeholder="0"
                              className="w-full text-2xl font-black bg-transparent border-none outline-none"
                            />
                            <span className="text-xs font-bold text-slate-400">
                              {t("pricing.perMonthShort")}
                            </span>
                          </div>
                          {getFieldError("pricePerMonth") && (
                            <p className="text-[10px] text-rose-500 mt-1">
                              {getFieldError("pricePerMonth")}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <SectionTitle title={t("additionalFees.title")} />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                        <Shield size={16} className="text-emerald-500" />
                        <div>
                          <p className="font-bold text-sm">
                            {t("additionalFees.securityDeposit")}
                          </p>
                          <p className="text-xs text-slate-500">
                            {t("additionalFees.securityDepositDesc")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {form.securityDeposit !== null && (
                            <input
                              type="number"
                              value={form.securityDeposit}
                              onChange={(e) =>
                                upd({ securityDeposit: Number(e.target.value) })
                              }
                              className="w-20 bg-white border rounded py-1.5 px-2 text-sm text-right"
                            />
                          )}
                          <Toggle
                            checked={form.securityDeposit !== null}
                            onChange={(v) =>
                              upd({ securityDeposit: v ? 500 : null })
                            }
                            t={t}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                        <Sparkles size={16} className="text-sky-500" />
                        <div>
                          <p className="font-bold text-sm">
                            {t("additionalFees.cleaningFee")}
                          </p>
                          <p className="text-xs text-slate-500">
                            {t("additionalFees.cleaningFeeDesc")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {form.cleaningFee !== null && (
                            <input
                              type="number"
                              value={form.cleaningFee}
                              onChange={(e) =>
                                upd({ cleaningFee: Number(e.target.value) })
                              }
                              className="w-20 bg-white border rounded py-1.5 px-2 text-sm text-right"
                            />
                          )}
                          <Toggle
                            checked={form.cleaningFee !== null}
                            onChange={(v) =>
                              upd({ cleaningFee: v ? 50 : null })
                            }
                            t={t}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6 : Aperçu */}
              {step === 6 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
                  <div className="relative h-64 bg-gradient-to-br from-sky-400 via-indigo-500 to-violet-600">
                    {(() => {
                      const mainPhoto =
                        form.photos.find((p) => p.isMain) || form.photos[0];
                      const imageUrl = mainPhoto?.url;
                      const displayUrl = getDisplayUrl(imageUrl);
                      return displayUrl ? (
                        <img
                          src={displayUrl}
                          alt={form.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={40} className="text-white/30" />
                        </div>
                      );
                    })()}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <div>
                        <span className="inline-block bg-white/20 text-white text-[9px] font-bold px-2 py-0.5 rounded-full mb-1">
                          {propertyTypes.find((p) => p.value === form.type)
                            ?.labelKey
                            ? t(
                                `propertyType.${propertyTypes.find((p) => p.value === form.type)!.labelKey}`,
                              )
                            : t("propertyType.property")}
                        </span>
                        <h3 className="text-white text-base font-bold">
                          {form.title || t("preview.untitled")}
                        </h3>
                        <div className="flex items-center gap-1 text-white/70 text-xs mt-0.5">
                          <MapPin size={12} />
                          {form.governorate}
                          {form.delegation ? `, ${form.delegation}` : ""}
                        </div>
                      </div>
                      <div className="bg-white/90 rounded-lg px-3 py-1.5 text-right">
                        <p className="font-black text-sky-700 text-base">
                          {form.pricePerNight || form.pricePerMonth || "---"}{" "}
                          TND
                        </p>
                        <p className="text-[9px] text-slate-500">
                          {form.rentalType === "LONG_TERM"
                            ? t("pricing.perMonthShort")
                            : t("pricing.perNightShort")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500 pb-3 border-b border-slate-100">
                      <span className="flex items-center gap-1.5">
                        <Bed size={14} className="text-slate-400" />{" "}
                        {form.rooms} {t("characteristics.bedroomsShort")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Bath size={14} className="text-slate-400" />{" "}
                        {form.bathrooms} {t("characteristics.bathroomsShort")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Utensils size={14} className="text-slate-400" />{" "}
                        {form.numberOfKitchens}{" "}
                        {t("characteristics.kitchensShort")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users size={14} className="text-slate-400" />{" "}
                        {form.maxGuests === null ? "—" : form.maxGuests}{" "}
                        {t("characteristics.guests")}
                      </span>
                      {form.surfaceArea && (
                        <span className="flex items-center gap-1.5">
                          <Ruler size={14} className="text-slate-400" />{" "}
                          {form.surfaceArea} m²
                        </span>
                      )}
                      {form.floorNumber !== null && (
                        <span className="flex items-center gap-1.5">
                          <ArrowUp size={14} className="text-slate-400" />{" "}
                          {form.floorNumber === 0
                            ? t("characteristics.groundFloor")
                            : `${form.floorNumber} ${t("characteristics.floorAbbr")}`}
                        </span>
                      )}
                    </div>

                    {Object.keys(form.equipment).filter(
                      (key) => form.equipment[key],
                    ).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {Object.entries(form.equipment)
                          .filter(([, active]) => active)
                          .slice(0, 4)
                          .map(([key]) => {
                            const equip = equipmentIds.find(
                              (e) => e.id === key,
                            );
                            const Icon = equipmentIcons[key] || Check;
                            return (
                              <span
                                key={key}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[11px] font-medium"
                              >
                                <Icon size={12} />{" "}
                                {equip ? t(`equipment.${equip.labelKey}`) : key}
                              </span>
                            );
                          })}
                        {Object.keys(form.equipment).filter(
                          (key) => form.equipment[key],
                        ).length > 4 && (
                          <span className="text-[11px] font-medium text-slate-500 px-2 py-1">
                            +
                            {Object.keys(form.equipment).filter(
                              (key) => form.equipment[key],
                            ).length - 4}
                          </span>
                        )}
                      </div>
                    )}
                    {form.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 pt-1">
                        {form.description}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar conseils */}
            <div className="hidden lg:block">
              <div className="sticky top-4 space-y-5">
                <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-sky-100 dark:border-sky-900/40">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center">
                      <Lightbulb size={14} className="text-white" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {t("tips.title")}
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-xs">
                      <Check
                        size={12}
                        className="text-sky-500 shrink-0 mt-0.5"
                      />
                      {t("tips.qualityPhotos")}
                    </li>
                    <li className="flex items-start gap-2 text-xs">
                      <Check
                        size={12}
                        className="text-sky-500 shrink-0 mt-0.5"
                      />
                      {t("tips.catchyTitle")}
                    </li>
                    <li className="flex items-start gap-2 text-xs">
                      <Check
                        size={12}
                        className="text-sky-500 shrink-0 mt-0.5"
                      />
                      {t("tips.quickResponses")}
                    </li>
                    <li className="flex items-start gap-2 text-xs">
                      <Check
                        size={12}
                        className="text-sky-500 shrink-0 mt-0.5"
                      />
                      {t("tips.competitivePrice")}
                    </li>
                  </ul>
                  <div className="mt-3 pt-2 border-t border-sky-100 dark:border-sky-800/50">
                    <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                      {t("tips.moreBookings")}
                    </span>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl p-5 text-white">
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-400 via-indigo-500 to-violet-600" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <Rocket size={14} className="text-white" />
                      <p className="text-[9px] font-black uppercase tracking-wider text-white/80">
                        NESTHUB
                      </p>
                    </div>
                    <ul className="space-y-1.5">
                      <li className="flex items-center gap-2 text-xs text-white/90">
                        <Shield size={11} /> {t("benefits.securePayment")}
                      </li>
                      <li className="flex items-center gap-2 text-xs text-white/90">
                        <Headphones size={11} /> {t("benefits.support247")}
                      </li>
                      <li className="flex items-center gap-2 text-xs text-white/90">
                        <Sparkles size={11} /> {t("benefits.insurance")}
                      </li>
                      <li className="flex items-center gap-2 text-xs text-white/90">
                        <Rocket size={11} /> {t("benefits.maxVisibility")}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation bas */}
      <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-800 py-4">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <button
            type="button"
            onClick={goToPrevStep}
            disabled={step === 1}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-slate-600 disabled:opacity-30 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft size={16} /> {t("navigation.previous")}
          </button>
          <div className="flex items-center gap-1.5">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${s.id === step ? "w-5 bg-gradient-to-r from-sky-400 via-indigo-500 to-violet-600" : s.id < step ? "w-3 bg-sky-400" : "w-3 bg-slate-300 dark:bg-slate-700"}`}
              />
            ))}
          </div>
          {step === STEPS.length ? (
            <button
              type="button"
              onClick={handlePublish}
              disabled={saving || !isStepValid}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-sky-400 via-indigo-500 to-violet-600 hover:from-sky-500 hover:via-indigo-600 hover:to-violet-700 text-white font-bold text-sm rounded-lg shadow-md disabled:opacity-50 transition-all"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Rocket size={14} />
              )}
              {saving ? t("button.publishing") : t("button.publish")}
            </button>
          ) : (
            <button
              type="button"
              onClick={goToNextStep}
              disabled={!isStepValid || uploadCount > 0}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                isStepValid && uploadCount === 0
                  ? "bg-gradient-to-r from-sky-400 via-indigo-500 to-violet-600 hover:from-sky-500 hover:via-indigo-600 hover:to-violet-700 text-white shadow-md"
                  : "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
              }`}
            >
              {uploadCount > 0 ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ChevronRight size={14} />
              )}
              {t("navigation.continue")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
