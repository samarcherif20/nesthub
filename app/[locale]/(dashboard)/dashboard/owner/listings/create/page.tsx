// app/[locale]/(dashboard)/owner/listings/create/page.tsx
'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import * as React from 'react';

// Composant Map
import MapPickerWrapper from '@/components/ui/maps/MapPickerWrapper';

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
  X,
  Info,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronDown,
  Loader2,
  MapPin,
  TrendingUp,
  Lightbulb,
  Rocket,
  Moon,
  Save,
} from 'lucide-react';

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
  type: 'fixed' | 'per_night';
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

const initial: ListingFormData = {
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

// ─── Static data ──────────────────────────────────────────────────────────────
const propertyTypes = [
  { value: 'APARTMENT', icon: Building2 },
  { value: 'VILLA', icon: Home },
  { value: 'STUDIO', icon: Hotel },
  { value: 'DUPLEX', icon: Layers },
  { value: 'HOUSE', icon: Home },
];

const governorates = [
  'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan',
  'Bizerte', 'Béja', 'Jendouba', 'Le Kef', 'Siliana', 'Kairouan',
  'Kasserine', 'Sidi Bouzid', 'Sousse', 'Monastir', 'Mahdia',
  'Sfax', 'Gafsa', 'Tozeur', 'Kébili', 'Gabès', 'Médenine', 'Tataouine',
];

const equipmentIds = [
  'wifi', 'ac', 'heating', 'kitchen', 'parking', 'pool',
  'gym', 'washer', 'tv', 'balcony', 'dishwasher', 'dryer',
];

const serviceIds = ['cleaning', 'linen', 'pets', 'smoking'];
const houseRuleIds = ['noParties', 'noSmoke', 'noPets', 'quietAfter22'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function Stepper({ value, min = 1, max = 20, onChange }: { value: number; min?: number; max?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center bg-white dark:bg-slate-800 rounded-full px-2 py-1 shadow-sm border border-slate-100 dark:border-slate-700">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-9 h-9 flex items-center justify-center rounded-full text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors active:scale-90"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="w-10 text-center font-bold text-base text-slate-900 dark:text-white tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-9 h-9 flex items-center justify-center rounded-full text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors active:scale-90"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
    >
      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  );
}

function SectionTitle({ num, title }: { num?: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      {num !== undefined && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
          {num}
        </div>
      )}
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function CreateListingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = React.use(params);
  const router = useRouter();
  const { user } = useUser();
  const t = useTranslations('CreateListing');

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ListingFormData>(initial);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [listingId, setListingId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const STEPS = [
    { id: 1, key: 'typeLocation', icon: Building2 },
    { id: 2, key: 'characteristics', icon: Ruler },
    { id: 3, key: 'equipment', icon: Wifi },
    { id: 4, key: 'photos', icon: Camera },
    { id: 5, key: 'pricing', icon: Sparkles },
    { id: 6, key: 'preview', icon: Eye },
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

  // Valider tous les champs de l'étape courante
  const validateStep = useCallback((): boolean => {
    const errors: FieldError[] = [];
    
    if (step === 1) {
      const titleError = validateField('title', form.title);
      if (titleError) errors.push({ field: 'title', message: titleError });
      
      const descError = validateField('description', form.description);
      if (descError) errors.push({ field: 'description', message: descError });
      
      const govError = validateField('governorate', form.governorate);
      if (govError) errors.push({ field: 'governorate', message: govError });
      
      const delError = validateField('delegation', form.delegation);
      if (delError) errors.push({ field: 'delegation', message: delError });
      
      const streetError = validateField('street', form.street);
      if (streetError) errors.push({ field: 'street', message: streetError });
      
      const locError = validateField('location', null);
      if (locError) errors.push({ field: 'location', message: locError });
    }
    
    if (step === 2) {
      const roomsError = validateField('rooms', form.rooms);
      if (roomsError) errors.push({ field: 'rooms', message: roomsError });
      
      const bathsError = validateField('bathrooms', form.bathrooms);
      if (bathsError) errors.push({ field: 'bathrooms', message: bathsError });
      
      const guestsError = validateField('maxGuests', form.maxGuests);
      if (guestsError) errors.push({ field: 'maxGuests', message: guestsError });
    }
    
    if (step === 4) {
      const photosError = validateField('photos', null);
      if (photosError) errors.push({ field: 'photos', message: photosError });
    }
    
    if (step === 5) {
      const priceNightError = validateField('pricePerNight', form.pricePerNight);
      if (priceNightError) errors.push({ field: 'pricePerNight', message: priceNightError });
      
      const priceMonthError = validateField('pricePerMonth', form.pricePerMonth);
      if (priceMonthError) errors.push({ field: 'pricePerMonth', message: priceMonthError });
    }
    
    setFieldErrors(errors);
    return errors.length === 0;
  }, [step, form, validateField]);

  // Vérifier si l'étape est valide (sans afficher les erreurs)
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

  // ── Load draft from localStorage ─────────────────────────────────────
  useEffect(() => {
    try {
      const d = localStorage.getItem('listing_draft');
      if (d) setForm(p => ({ ...p, ...JSON.parse(d) }));
    } catch { }
  }, []);

  // ── Nettoyer les URLs objet au démontage ────────────────────────────
  useEffect(() => {
    return () => {
      form.photos.forEach(photo => {
        if (photo.url && photo.url.startsWith('blob:')) {
          URL.revokeObjectURL(photo.url);
        }
        if (photo.thumbnailUrl && photo.thumbnailUrl.startsWith('blob:')) {
          URL.revokeObjectURL(photo.thumbnailUrl);
        }
      });
    };
  }, [form.photos]);

  // ── Upload photos to Vercel Blob ─────────────────────────────────────
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
          uploadedPhotos.push({
            ...photo,
            url: data.url,
            thumbnailUrl: data.thumbnailUrl,
            file: undefined,
          });
        } else {
          throw new Error(`Échec upload photo ${i + 1}`);
        }
      } else {
        uploadedPhotos.push(photo);
      }
    }
    
    return uploadedPhotos;
  }, []);

  // ── Sauvegarder le brouillon ─────────────────────────────────────────
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
      toast.success(t('success.draftSaved'));
    } catch (e) {
      console.error(e);
      toast.error(t('error.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [form, listingId, saving, uploadPhotos, t]);

  // Auto-save toutes les 30 secondes
  useEffect(() => {
    const id = setInterval(() => {
      if (form.title || form.photos.length > 0) saveDraft();
    }, 30000);
    return () => clearInterval(id);
  }, [form, saveDraft]);

  const upd = useCallback((u: Partial<ListingFormData>) => setForm(p => ({ ...p, ...u })), []);

  // ── Navigation ────────────────────────────────────────────────────────
  const goToNextStep = () => {
    if (validateStep()) {
      setStep(s => Math.min(STEPS.length, s + 1));
    }
  };

  const goToPrevStep = () => {
    setStep(s => Math.max(1, s - 1));
  };

  // ── Publier l'annonce ─────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!validateStep()) return;
    
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
        const d = await r.json();
        localStorage.removeItem('listing_draft');
        toast.success(t('success.published'));
        router.push(`/${locale}/dashboard/owner/listings`);
      } else {
        const error = await r.json();
        toast.error(error.error || t('error.publishFailed'));
      }
    } catch (e) {
      console.error(e);
      toast.error(t('error.publishFailed'));
    } finally {
      setSaving(false);
    }
  };

  // ── Photo handling ────────────────────────────────────────────────────
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newPhotos = Array.from(files).slice(0, 20 - form.photos.length).map(file => ({
      url: URL.createObjectURL(file),
      thumbnailUrl: URL.createObjectURL(file),
      isMain: form.photos.length === 0,
      file,
    }));
    upd({ photos: [...form.photos, ...newPhotos] });
    // Revalider les photos
    const error = validateField('photos', null);
    setFieldErrors(prev => {
      const filtered = prev.filter(e => e.field !== 'photos');
      if (error) return [...filtered, { field: 'photos', message: error }];
      return filtered;
    });
  };

  const removePhoto = (idx: number) => {
    const newPhotos = form.photos.filter((_, i) => i !== idx);
    if (newPhotos.length > 0 && !newPhotos.some(p => p.isMain)) {
      newPhotos[0].isMain = true;
    }
    upd({ photos: newPhotos });
    // Revalider les photos
    const error = validateField('photos', null);
    setFieldErrors(prev => {
      const filtered = prev.filter(e => e.field !== 'photos');
      if (error) return [...filtered, { field: 'photos', message: error }];
      return filtered;
    });
  };

  const setMainPhoto = (idx: number) => {
    upd({ photos: form.photos.map((p, i) => ({ ...p, isMain: i === idx })) });
    // Revalider les photos
    const error = validateField('photos', null);
    setFieldErrors(prev => {
      const filtered = prev.filter(e => e.field !== 'photos');
      if (error) return [...filtered, { field: 'photos', message: error }];
      return filtered;
    });
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  const equipmentIcons: Record<string, any> = {
    wifi: Wifi, ac: Wind, heating: Flame, kitchen: Utensils,
    parking: Car, pool: Waves, gym: Dumbbell,
    washer: WashingMachine, tv: Tv, balcony: Trees,
    dishwasher: Utensils, dryer: Fan,
  };

  const serviceIcons: Record<string, any> = {
    cleaning: Sparkles, linen: Sparkles, pets: Home, smoking: EyeOff,
  };

  const ruleIcons: Record<string, any> = {
    noParties: Sparkles, noSmoke: EyeOff, noPets: Home, quietAfter22: Moon,
  };

  return (
    <div className="h-full flex flex-col bg-light dark:bg-slate-950 overflow-hidden">
      {/* Header fixe */}
      <div className="flex-shrink-0  bg-light dark:bg-slate-950 backdrop-blur-sm z-10 px-6 sm:px-8 lg:px-10 py-3">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                {t('pageTitle')}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t('stepOf', { current: step, total: STEPS.length })} · {t(`steps.${STEPS[step - 1].key}`)}
              </p>
            </div>
            <button
              type="button"
              onClick={saveDraft}
              disabled={saving}
              className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? t('saving') : t('saveDraft')}
              {lastSaved && !saving && (
                <span className="text-xs text-slate-400">
                  {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>

          {/* Step dots */}
          <div className="flex items-center justify-between mt-3">
            {STEPS.map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => s.id < step && setStep(s.id)}
                  className={`flex flex-col items-center gap-1 transition-all ${s.id <= step ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${s.id < step ? 'bg-blue-600 text-white shadow-md' :
                      s.id === step ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-md ring-2 ring-blue-100 dark:ring-blue-900' :
                        'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}>
                    {s.id < step ? <Check size={14} /> : <Icon size={14} />}
                  </div>
                  <span className={`hidden md:block text-[10px] font-bold uppercase tracking-wider ${s.id <= step ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                    {t(`steps.${s.key}`)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenu scrollable uniquement si nécessaire */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-8 lg:px-10 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Content area */}
            <div className="lg:col-span-2 space-y-6">

              {/* ══════ STEP 1 : Type & Location ══════════════════════ */}
              {step === 1 && (
                <>
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm">
                    <SectionTitle num={1} title={t('step1.typeTitle')} />
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {propertyTypes.map(pt => {
                        const Icon = pt.icon;
                        return (
                          <label key={pt.value} className="cursor-pointer group">
                            <input type="radio" name="type" value={pt.value}
                              checked={form.type === pt.value}
                              onChange={e => upd({ type: e.target.value })}
                              className="sr-only" />
                            <div className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200
                              ${form.type === pt.value
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                                : 'border-transparent bg-slate-50 dark:bg-slate-800 hover:border-slate-200'
                              }`}>
                              <Icon size={22} className={`transition-colors ${form.type === pt.value ? 'text-blue-600' : 'text-slate-400'}`} />
                              <span className={`text-xs font-bold text-center ${form.type === pt.value ? 'text-blue-700' : 'text-slate-500'}`}>
                                {t(`propertyTypes.${pt.value}`)}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm">
                    <SectionTitle num={2} title={t('step1.titleSectionTitle')} />
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                          {t('step1.titleLabel')} <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={form.title}
                          onChange={e => upd({ title: e.target.value })}
                          onBlur={() => handleBlur('title', form.title)}
                          placeholder={t('step1.titlePlaceholder')}
                          maxLength={100}
                          className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-lg py-2.5 px-4 text-base focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all
                            ${getFieldError('title') ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'}`}
                        />
                        {getFieldError('title') && <p className="text-xs text-rose-500 mt-1">{getFieldError('title')}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                          {t('step1.descriptionLabel')} <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          value={form.description}
                          onChange={e => upd({ description: e.target.value })}
                          onBlur={() => handleBlur('description', form.description)}
                          placeholder={t('step1.descriptionPlaceholder')}
                          rows={4}
                          maxLength={2000}
                          className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-lg py-2.5 px-4 text-base focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none resize-none
                            ${getFieldError('description') ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'}`}
                        />
                        {getFieldError('description') && <p className="text-xs text-rose-500 mt-1">{getFieldError('description')}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm">
                    <SectionTitle num={3} title={t('step1.locationTitle')} />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                          {t('step1.governorate')} <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={form.governorate}
                          onChange={e => upd({ governorate: e.target.value })}
                          onBlur={() => handleBlur('governorate', form.governorate)}
                          className={`w-full appearance-none bg-slate-50 dark:bg-slate-800 border rounded-lg py-2.5 px-4 pr-8 text-base focus:ring-2 focus:ring-blue-500/30 outline-none
                            ${getFieldError('governorate') ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'}`}
                        >
                          <option value="">{t('step1.choose')}</option>
                          {governorates.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        {getFieldError('governorate') && <p className="text-xs text-rose-500 mt-1">{getFieldError('governorate')}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                          {t('step1.delegation')} <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={form.delegation}
                          onChange={e => upd({ delegation: e.target.value })}
                          onBlur={() => handleBlur('delegation', form.delegation)}
                          placeholder={t('step1.delegationPlaceholder')}
                          className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-lg py-2.5 px-4 text-base focus:ring-2 focus:ring-blue-500/30 outline-none
                            ${getFieldError('delegation') ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'}`}
                        />
                        {getFieldError('delegation') && <p className="text-xs text-rose-500 mt-1">{getFieldError('delegation')}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                          {t('step1.street')} <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={form.street}
                          onChange={e => upd({ street: e.target.value })}
                          onBlur={() => handleBlur('street', form.street)}
                          placeholder={t('step1.streetPlaceholder')}
                          className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-lg py-2.5 px-4 text-base focus:ring-2 focus:ring-blue-500/30 outline-none
                            ${getFieldError('street') ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'}`}
                        />
                        {getFieldError('street') && <p className="text-xs text-rose-500 mt-1">{getFieldError('street')}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                        {t('step1.exactLocation')} <span className="text-rose-500">*</span>
                      </label>
                      <div className="h-64 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                        <MapPickerWrapper
                          latitude={form.latitude}
                          longitude={form.longitude}
                          onLocationChange={(lat, lng) => {
                            upd({ latitude: lat, longitude: lng });
                            handleBlur('location', null);
                          }}
                          onAddressChange={(address) => console.log('Address:', address)}
                        />
                      </div>
                      {getFieldError('location') && <p className="text-xs text-rose-500 mt-1">{getFieldError('location')}</p>}
                    </div>
                  </div>
                </>
              )}

              {/* ══════ STEP 2 : Characteristics ══════════════════════ */}
              {step === 2 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm">
                  <SectionTitle title={t('step2.title')} />
                  <div className="space-y-4">
                    {[
                      { key: 'rooms', icon: Bed, value: form.rooms, set: (v: number) => upd({ rooms: v }) },
                      { key: 'bathrooms', icon: Bath, value: form.bathrooms, set: (v: number) => upd({ bathrooms: v }) },
                      { key: 'maxGuests', icon: Users, value: form.maxGuests, set: (v: number) => upd({ maxGuests: v }) },
                    ].map(row => {
                      const Icon = row.icon;
                      return (
                        <div key={row.key} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <Icon size={16} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-slate-900 dark:text-white">{t(`step2.${row.key}`)}</p>
                              <p className="text-xs text-slate-400">{t(`step2.${row.key}Desc`)}</p>
                            </div>
                          </div>
                          <Stepper value={row.value} min={1} max={row.key === 'maxGuests' ? 30 : 20} onChange={row.set} />
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">{t('step2.surface')}</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={form.surfaceArea || ''}
                          onChange={e => upd({ surfaceArea: e.target.value ? Number(e.target.value) : null })}
                          placeholder="120"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 pr-12 text-base outline-none focus:ring-2 focus:ring-blue-500/30"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">m²</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">{t('step2.floor')}</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={form.floorNumber ?? ''}
                          onChange={e => upd({ floorNumber: e.target.value ? Number(e.target.value) : null })}
                          placeholder="0"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 pr-10 text-base outline-none focus:ring-2 focus:ring-blue-500/30"
                        />
                        <ArrowUp size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                        <ArrowUp size={16} className="text-violet-600 dark:text-violet-400" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{t('step2.elevator')}</p>
                        <p className="text-xs text-slate-400">{t('step2.elevatorDesc')}</p>
                      </div>
                    </div>
                    <Toggle checked={form.hasElevator} onChange={v => upd({ hasElevator: v })} />
                  </div>
                </div>
              )}

              {/* ══════ STEP 3 : Equipment ════════════════════════════ */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm">
                    <SectionTitle title={t('step3.equipmentTitle')} />
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                      {equipmentIds.map(id => {
                        const active = !!form.equipment[id];
                        const Icon = equipmentIcons[id] || Check;
                        return (
                          <label key={id} className="cursor-pointer group">
                            <input type="checkbox" checked={active}
                              onChange={e => upd({ equipment: { ...form.equipment, [id]: e.target.checked } })}
                              className="sr-only" />
                            <div className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border-2 transition-all duration-200 ${active
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-transparent bg-slate-50 dark:bg-slate-800 hover:border-slate-200'
                              }`}>
                              <Icon size={18} className={active ? 'text-blue-600' : 'text-slate-400'} />
                              <span className={`text-[9px] font-bold text-center ${active ? 'text-blue-700' : 'text-slate-500'}`}>
                                {t(`equipment.${id}`)}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm">
                    <SectionTitle title={t('step3.servicesTitle')} />
                    <div className="space-y-3">
                      {serviceIds.map(id => {
                        const Icon = serviceIcons[id] || Sparkles;
                        return (
                          <div key={id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                <Icon size={16} className="text-violet-600 dark:text-violet-400" />
                              </div>
                              <div>
                                <p className="font-semibold text-sm text-slate-900 dark:text-white">{t(`services.${id}`)}</p>
                                <p className="text-xs text-slate-400">{t(`services.${id}Desc`)}</p>
                              </div>
                            </div>
                            <Toggle checked={!!form.services[id]} onChange={v => upd({ services: { ...form.services, [id]: v } })} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm">
                    <SectionTitle title={t('step3.rulesTitle')} />
                    <div className="space-y-3 mb-4">
                      {houseRuleIds.map(id => {
                        const Icon = ruleIcons[id] || X;
                        return (
                          <div key={id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Icon size={16} className="text-slate-400" />
                              <span className="font-semibold text-sm text-slate-900 dark:text-white">{t(`houseRules.${id}`)}</span>
                            </div>
                            <Toggle checked={!!form.houseRules[id]} onChange={v => upd({ houseRules: { ...form.houseRules, [id]: v } })} />
                          </div>
                        );
                      })}
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">{t('step3.customRulesLabel')}</label>
                      <textarea
                        value={form.customRules}
                        onChange={e => upd({ customRules: e.target.value })}
                        placeholder={t('step3.customRulesPlaceholder')}
                        rows={3}
                        maxLength={500}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-base outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ══════ STEP 4 : Photos ════════════════════════════════ */}
              {step === 4 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm">
                  <SectionTitle title={t('step4.title')} />

                  <div
                    onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={e => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
                    onClick={() => fileRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all duration-200
                      ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-blue-300'}`}
                  >
                    <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
                    <Camera size={28} className="text-blue-500 mb-2" />
                    <p className="font-bold text-base text-slate-900 dark:text-white">{t('step4.dropHere')}</p>
                    <p className="text-xs text-slate-400 text-center mt-1">{t('step4.dropHint')}</p>
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700">
                      <Info size={12} />
                      {form.photos.length}/20
                    </div>
                  </div>

                  {getFieldError('photos') && (
                    <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-900/15 border border-rose-200 rounded-lg">
                      <p className="text-xs text-rose-600">{getFieldError('photos')}</p>
                    </div>
                  )}

                  {form.photos.length > 0 && (
                    <div className="mt-5">
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {form.photos.map((photo, idx) => (
                          <div key={idx} className={`relative group rounded-lg overflow-hidden aspect-square bg-slate-100 ${photo.isMain ? 'ring-2 ring-blue-500' : ''}`}>
                            <img src={photo.url} alt="" className="w-full h-full object-cover" />
                            {photo.isMain && (
                              <div className="absolute top-2 left-2">
                                <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Main</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              {!photo.isMain && (
                                <button type="button" onClick={() => setMainPhoto(idx)} className="w-6 h-6 rounded-full bg-white/90 text-amber-500 flex items-center justify-center text-xs">
                                  <Star size={12} />
                                </button>
                              )}
                              <button type="button" onClick={() => removePhoto(idx)} className="w-6 h-6 rounded-full bg-white/90 text-rose-500 flex items-center justify-center text-xs">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {form.photos.length < 20 && (
                          <button type="button" onClick={() => fileRef.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-all">
                            <Plus size={20} />
                            <span className="text-[9px] font-bold">{t('step4.add')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ══════ STEP 5 : Pricing ══════════════════════════════ */}
              {step === 5 && (
                <div className="space-y-5">
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm">
                    <SectionTitle title={t('step5.rentalTypeTitle')} />
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg gap-1">
                      {['SHORT_TERM', 'LONG_TERM', 'BOTH'].map(rt => (
                        <button key={rt} type="button" onClick={() => upd({ rentalType: rt })}
                          className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${form.rentalType === rt ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                          {t(`step5.${rt}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm">
                    <SectionTitle title={t('step5.pricesTitle')} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(form.rentalType === 'SHORT_TERM' || form.rentalType === 'BOTH') && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Sun size={16} className="text-blue-500" />
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('step5.pricePerNight')} <span className="text-rose-500">*</span></label>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <input type="number" value={form.pricePerNight || ''} onChange={e => upd({ pricePerNight: e.target.value ? Number(e.target.value) : null })}
                              onBlur={() => handleBlur('pricePerNight', form.pricePerNight)}
                              placeholder="0" className={`w-full text-2xl font-black bg-transparent border-none outline-none ${getFieldError('pricePerNight') ? 'text-rose-500' : 'text-slate-900'}`} />
                            <span className="text-xs font-bold text-slate-400">TND / nuit</span>
                          </div>
                          {getFieldError('pricePerNight') && <p className="text-xs text-rose-500 mt-1">{getFieldError('pricePerNight')}</p>}
                        </div>
                      )}
                      {(form.rentalType === 'LONG_TERM' || form.rentalType === 'BOTH') && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar size={16} className="text-purple-500" />
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('step5.pricePerMonth')} <span className="text-rose-500">*</span></label>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <input type="number" value={form.pricePerMonth || ''} onChange={e => upd({ pricePerMonth: e.target.value ? Number(e.target.value) : null })}
                              onBlur={() => handleBlur('pricePerMonth', form.pricePerMonth)}
                              placeholder="0" className={`w-full text-2xl font-black bg-transparent border-none outline-none ${getFieldError('pricePerMonth') ? 'text-rose-500' : 'text-slate-900'}`} />
                            <span className="text-xs font-bold text-slate-400">TND / mois</span>
                          </div>
                          {getFieldError('pricePerMonth') && <p className="text-xs text-rose-500 mt-1">{getFieldError('pricePerMonth')}</p>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm">
                    <SectionTitle title={t('step5.feesTitle')} />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Shield size={16} className="text-emerald-500" />
                          <div>
                            <p className="font-bold text-sm text-slate-900 dark:text-white">{t('step5.deposit')}</p>
                            <p className="text-xs text-slate-400">{t('step5.depositDesc')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {form.securityDeposit !== null && (
                            <input type="number" value={form.securityDeposit} onChange={e => upd({ securityDeposit: Number(e.target.value) })}
                              className="w-20 bg-white border rounded py-1.5 px-2 text-sm text-right" />
                          )}
                          <Toggle checked={form.securityDeposit !== null} onChange={v => upd({ securityDeposit: v ? 500 : null })} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Sparkles size={16} className="text-blue-500" />
                          <div>
                            <p className="font-bold text-sm text-slate-900 dark:text-white">{t('step5.cleaningFee')}</p>
                            <p className="text-xs text-slate-400">{t('step5.cleaningFeeDesc')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {form.cleaningFee !== null && (
                            <input type="number" value={form.cleaningFee} onChange={e => upd({ cleaningFee: Number(e.target.value) })}
                              className="w-20 bg-white border rounded py-1.5 px-2 text-sm text-right" />
                          )}
                          <Toggle checked={form.cleaningFee !== null} onChange={v => upd({ cleaningFee: v ? 50 : null })} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ══════ STEP 6 : Preview ══════════════════════════════ */}
              {step === 6 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm">
                  <div className="relative h-56 bg-gradient-to-br from-blue-500 to-purple-600">
                    {(() => {
                      const mainPhoto = form.photos.find(p => p.isMain) || form.photos[0];
                      const imageUrl = mainPhoto?.url;
                      const getDisplayUrl = (url: string) => {
                        if (!url) return null;
                        if (url.startsWith('blob:')) return url;
                        return `/api/listings/image?url=${encodeURIComponent(url)}`;
                      };
                      const displayUrl = getDisplayUrl(imageUrl);
                      return displayUrl ? <img src={displayUrl} alt={form.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={40} className="text-white/30" /></div>;
                    })()}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <div>
                        <span className="inline-block bg-white/20 text-white text-[9px] font-bold px-2 py-0.5 rounded-full mb-1">{t(`propertyTypes.${form.type}`)}</span>
                        <h3 className="text-white text-base font-bold">{form.title || t('preview.noTitle')}</h3>
                        <div className="flex items-center gap-1 text-white/70 text-xs mt-0.5"><MapPin size={12} />{form.governorate}{form.delegation ? `, ${form.delegation}` : ''}</div>
                      </div>
                      <div className="bg-white/90 rounded-lg px-3 py-1.5 text-right">
                        <p className="font-black text-blue-700 text-base">{form.pricePerNight || form.pricePerMonth || '---'} TND</p>
                        <p className="text-[9px] text-slate-500">{form.rentalType === 'LONG_TERM' ? `/ mois` : `/ nuit`}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex gap-4 text-xs text-slate-500 pb-3 border-b">
                      <span><Bed size={14} className="inline mr-1.5" />{form.rooms} chambres</span>
                      <span><Bath size={14} className="inline mr-1.5" />{form.bathrooms} sdb</span>
                      <span><Users size={14} className="inline mr-1.5" />{form.maxGuests} pers</span>
                      {form.surfaceArea && <span><Ruler size={14} className="inline mr-1.5" />{form.surfaceArea} m²</span>}
                    </div>
                    {form.description && <p className="text-sm text-slate-600 mt-3 line-clamp-2">{form.description}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* ── Sidebar compacte ─────────────────────────────────── */}
            <div className="hidden lg:block">
              <div className="sticky top-4 space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb size={16} className="text-blue-500" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t('sidebar.tipTitle')}</h3>
                  </div>
                  <ul className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-500">
                        <Check size={12} className="text-blue-500 shrink-0 mt-0.5" />
                        {t(`sidebar.tip${i}`)}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 to-purple-700 rounded-xl p-4 text-white">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-2">{t('sidebar.whyNesthub')}</p>
                  <ul className="space-y-1.5">
                    {[
                      { icon: Shield, key: 'benefit1' },
                      { icon: Users, key: 'benefit2' },
                      { icon: Sparkles, key: 'benefit3' },
                    ].map(b => {
                      const Icon = b.icon;
                      return (
                        <li key={b.key} className="flex items-center gap-2 text-xs text-blue-50">
                          <Icon size={12} /> {t(`sidebar.${b.key}`)}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom navigation fixe ────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-light dark:bg-slate-950 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-6 sm:px-8 lg:px-10 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={goToPrevStep}
            disabled={step === 1}
            className="flex items-center gap-2 text-sm text-slate-500 disabled:opacity-30 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft size={16} />
            {t('nav.previous')}
          </button>

          <div className="flex items-center gap-1.5">
            {STEPS.map(s => (
              <div key={s.id} className={`h-1.5 rounded-full transition-all duration-300 ${s.id === step ? 'w-5 bg-blue-600' : s.id < step ? 'w-3 bg-blue-300' : 'w-3 bg-slate-200'}`} />
            ))}
          </div>

          {step === STEPS.length ? (
            <button
              type="button"
              onClick={handlePublish}
              disabled={saving || !isStepValid}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-full font-bold text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
              {saving ? t('publishing') : t('publish')}
            </button>
          ) : (
            <button
              type="button"
              onClick={goToNextStep}
              disabled={!isStepValid}
              className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm transition-all
                ${isStepValid ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
            >
              {t('nav.continue')}
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}