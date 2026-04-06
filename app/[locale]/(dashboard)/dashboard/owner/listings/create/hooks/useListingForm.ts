// hooks/useListingForm.ts
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
  type: 'fixed' | 'per_night';
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
  maxGuests: number;
  surfaceArea: number | null;
  floorNumber: number | null;
  hasElevator: boolean;
  equipment: Record<string, boolean>;
  services: Record<string, boolean>;
  houseRules: Record<string, boolean>;
  customRules: string;
  photos: Array<{ id?: string; url: string; thumbnailUrl: string; isMain: boolean; file?: File }>;
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
  title: '',
  type: 'APARTMENT',
  governorate: '',
  delegation: '',
  street: '',
  latitude: null,
  longitude: null,
  description: '',
  rooms: 1,
  bathrooms: 1,
  maxGuests: 2,
  surfaceArea: null,
  floorNumber: null,
  hasElevator: false,
  equipment: {},
  services: {},
  houseRules: {},
  customRules: '',
  photos: [],
  rentalType: 'SHORT_TERM',
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

  const STEPS = [
    { id: 1, key: 'typeLocation' },
    { id: 2, key: 'characteristics' },
    { id: 3, key: 'equipment' },
    { id: 4, key: 'photos' },
    { id: 5, key: 'pricing' },
    { id: 6, key: 'preview' },
  ];

  // Validation d'un champ spécifique
  const validateField = useCallback((field: string, value: any): string | null => {
    switch (field) {
      case 'title':
        if (!value?.trim()) return 'Le titre est requis';
        if (value.length < 5) return 'Le titre doit contenir au moins 5 caractères';
        return null;
      case 'description':
        if (!value?.trim()) return 'La description est requise';
        if (value.length < 20) return 'La description doit contenir au moins 20 caractères';
        return null;
      case 'governorate':
        if (!value) return 'Le gouvernorat est requis';
        return null;
      case 'delegation':
        if (!value?.trim()) return 'La délégation est requise';
        return null;
      case 'street':
        if (!value?.trim()) return 'La rue est requise';
        return null;
      case 'location':
        if (form.latitude === null || form.longitude === null) return 'La localisation sur la carte est requise';
        return null;
      case 'rooms':
        if (value < 1) return 'Au moins 1 chambre est requise';
        return null;
      case 'bathrooms':
        if (value < 1) return 'Au moins 1 salle de bain est requise';
        return null;
      case 'maxGuests':
        if (value < 1) return 'Au moins 1 voyageur est requis';
        return null;
      case 'photos':
        if (form.photos.length === 0) return 'Au moins une photo est requise';
        if (!form.photos.some(p => p.isMain)) return 'Veuillez définir une photo principale';
        return null;
      case 'pricePerNight':
        if ((form.rentalType === 'SHORT_TERM' || form.rentalType === 'BOTH') && (!value || value <= 0)) {
          return 'Le prix par nuit est requis';
        }
        return null;
      case 'pricePerMonth':
        if ((form.rentalType === 'LONG_TERM' || form.rentalType === 'BOTH') && (!value || value <= 0)) {
          return 'Le prix par mois est requis';
        }
        return null;
      default:
        return null;
    }
  }, [form.latitude, form.longitude, form.photos.length, form.photos, form.rentalType]);

  // Vérifier si l'étape est valide
  const isStepValid = useMemo(() => {
    if (step === 1) {
      if (!form.title.trim() || form.title.length < 5) return false;
      if (!form.description.trim() || form.description.length < 20) return false;
      if (!form.governorate) return false;
      if (!form.delegation.trim()) return false;
      if (!form.street.trim()) return false;
      if (form.latitude === null || form.longitude === null) return false;
    }
    if (step === 2) {
      if (form.rooms < 1) return false;
      if (form.bathrooms < 1) return false;
      if (form.maxGuests < 1) return false;
    }
    if (step === 4) {
      if (form.photos.length === 0) return false;
      if (!form.photos.some(p => p.isMain)) return false;
    }
    if (step === 5) {
      if ((form.rentalType === 'SHORT_TERM' || form.rentalType === 'BOTH') && (!form.pricePerNight || form.pricePerNight <= 0)) return false;
      if ((form.rentalType === 'LONG_TERM' || form.rentalType === 'BOTH') && (!form.pricePerMonth || form.pricePerMonth <= 0)) return false;
    }
    return true;
  }, [step, form]);

  const handleBlur = useCallback((field: string, value: any) => {
    const error = validateField(field, value);
    setFieldErrors(prev => {
      const filtered = prev.filter(e => e.field !== field);
      if (error) return [...filtered, { field, message: error }];
      return filtered;
    });
  }, [validateField]);

  const getFieldError = useCallback((field: string): string | null => {
    const error = fieldErrors.find(e => e.field === field);
    return error ? error.message : null;
  }, [fieldErrors]);

  const upd = useCallback((u: Partial<ListingFormData>) => setForm(p => ({ ...p, ...u })), []);

  // Upload photos
  const uploadPhotos = useCallback(async (photos: any[]) => {
    const uploadedPhotos = [];
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      if (photo.file) {
        const formData = new FormData();
        formData.append('photos', photo.file);
        const uploadRes = await fetch('/api/listings/upload-temp-photo', {
          method: 'POST',
          body: formData,
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          uploadedPhotos.push({ ...photo, url: data.url, thumbnailUrl: data.thumbnailUrl, file: undefined });
        } else {
          throw new Error(`Échec upload photo ${i + 1}`);
        }
      } else {
        uploadedPhotos.push(photo);
      }
    }
    return uploadedPhotos;
  }, []);

  // Sauvegarder le brouillon
  const saveDraft = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const uploadedPhotos = await uploadPhotos(form.photos);
      const formWithUrls = { ...form, photos: uploadedPhotos };
      localStorage.setItem('listing_draft', JSON.stringify(formWithUrls));
      
      if (listingId) {
        await fetch(`/api/listings/${listingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formWithUrls, status: 'DRAFT' }),
        });
      } else if (form.title) {
        const r = await fetch('/api/listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formWithUrls, status: 'DRAFT' }),
        });
        if (r.ok) {
          const d = await r.json();
          setListingId(d.id);
        }
      }
      setLastSaved(new Date());
      toast.success('Brouillon sauvegardé');
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }, [form, listingId, saving, uploadPhotos]);

  // Auto-save
  useEffect(() => {
    const id = setInterval(() => {
      if (form.title || form.photos.length > 0) saveDraft();
    }, 30000);
    return () => clearInterval(id);
  }, [form, saveDraft]);

  // Charger le brouillon
  useEffect(() => {
    try {
      const d = localStorage.getItem('listing_draft');
      if (d) setForm(p => ({ ...p, ...JSON.parse(d) }));
    } catch { }
  }, []);

  // Nettoyer les URLs
  useEffect(() => {
    return () => {
      form.photos.forEach(photo => {
        if (photo.url && photo.url.startsWith('blob:')) URL.revokeObjectURL(photo.url);
        if (photo.thumbnailUrl && photo.thumbnailUrl.startsWith('blob:')) URL.revokeObjectURL(photo.thumbnailUrl);
      });
    };
  }, [form.photos]);

  const goToNextStep = () => {
    if (isStepValid) setStep(s => Math.min(STEPS.length, s + 1));
  };

  const goToPrevStep = () => setStep(s => Math.max(1, s - 1));

  const handlePublish = async () => {
    if (!isStepValid) return;
    setSaving(true);
    try {
      const uploadedPhotos = await uploadPhotos(form.photos);
      const formWithUrls = { ...form, photos: uploadedPhotos, status: 'ACTIVE' };
      const r = await fetch(listingId ? `/api/listings/${listingId}` : '/api/listings', {
        method: listingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formWithUrls),
      });
      if (r.ok) {
        localStorage.removeItem('listing_draft');
        toast.success('Annonce publiée avec succès');
        router.push(`/${locale}/dashboard/owner/listings`);
      } else {
        const error = await r.json();
        toast.error(error.error || 'Erreur lors de la publication');
      }
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la publication');
    } finally {
      setSaving(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newPhotos = Array.from(files).slice(0, 20 - form.photos.length).map(file => ({
      url: URL.createObjectURL(file),
      thumbnailUrl: URL.createObjectURL(file),
      isMain: form.photos.length === 0,
      file,
    }));
    upd({ photos: [...form.photos, ...newPhotos] });
    const error = validateField('photos', null);
    setFieldErrors(prev => {
      const filtered = prev.filter(e => e.field !== 'photos');
      if (error) return [...filtered, { field: 'photos', message: error }];
      return filtered;
    });
  };

  const removePhoto = (idx: number) => {
    const newPhotos = form.photos.filter((_, i) => i !== idx);
    if (newPhotos.length > 0 && !newPhotos.some(p => p.isMain)) newPhotos[0].isMain = true;
    upd({ photos: newPhotos });
    const error = validateField('photos', null);
    setFieldErrors(prev => {
      const filtered = prev.filter(e => e.field !== 'photos');
      if (error) return [...filtered, { field: 'photos', message: error }];
      return filtered;
    });
  };

  const setMainPhoto = (idx: number) => {
    upd({ photos: form.photos.map((p, i) => ({ ...p, isMain: i === idx })) });
    const error = validateField('photos', null);
    setFieldErrors(prev => {
      const filtered = prev.filter(e => e.field !== 'photos');
      if (error) return [...filtered, { field: 'photos', message: error }];
      return filtered;
    });
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
  };
};