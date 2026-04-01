// app/[locale]/(dashboard)/owner/listings/create/page.tsx
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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
  ChevronUp,
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
function Stepper({
  value, min = 1, max = 20, onChange,
}: { value: number; min?: number; max?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center bg-white dark:bg-slate-800 rounded-full px-1 py-1 shadow-sm border border-slate-100 dark:border-slate-700">
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
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  );
}

function SectionTitle({ num, title }: { num?: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {num !== undefined && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/25">
          {num}
        </div>
      )}
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function CreateListingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
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
  const fileRef = useRef<HTMLInputElement>(null);

  const STEPS = [
    { id: 1, key: 'typeLocation', icon: Building2 },
    { id: 2, key: 'characteristics', icon: Ruler },
    { id: 3, key: 'equipment', icon: Wifi },
    { id: 4, key: 'photos', icon: Camera },
    { id: 5, key: 'pricing', icon: Sparkles },
    { id: 6, key: 'preview', icon: Eye },
  ];

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

  // ── Sauvegarder le brouillon avec upload des photos ──────────────────
  const saveDraft = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    
    try {
      // 1. Uploader les photos
      const uploadedPhotos = await uploadPhotos(form.photos);
      
      // 2. Mettre à jour le formulaire avec les vraies URLs
      const formWithUrls = { ...form, photos: uploadedPhotos };
      localStorage.setItem('listing_draft', JSON.stringify(formWithUrls));
      
      // 3. Envoyer à l'API
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

  // ── Publier l'annonce avec upload des photos ─────────────────────────
  const handlePublish = async () => {
    setSaving(true);
    try {
      // 1. Uploader les photos
      const uploadedPhotos = await uploadPhotos(form.photos);
      
      // 2. Créer/publier l'annonce avec les vraies URLs
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
  };

  const removePhoto = (idx: number) => {
    const newPhotos = form.photos.filter((_, i) => i !== idx);
    if (newPhotos.length > 0 && !newPhotos.some(p => p.isMain)) {
      newPhotos[0].isMain = true;
    }
    upd({ photos: newPhotos });
  };

  const setMainPhoto = (idx: number) => {
    upd({ photos: form.photos.map((p, i) => ({ ...p, isMain: i === idx })) });
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
    <div className="min-h-screen bg-[#f5f6fb] dark:bg-slate-950 pb-32 ">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Progress header ─────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="text-2xl font-black  text-slate-900 dark:text-white">
                {t('pageTitle')}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {t('stepOf', { current: step, total: STEPS.length })} · {t(`steps.${STEPS[step - 1].key}`)}
              </p>
            </div>
            <button
              type="button"
              onClick={saveDraft}
              disabled={saving}
              className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 transition-opacity"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? t('saving') : t('saveDraft')}
              {lastSaved && !saving && (
                <span className="text-xs text-slate-400 font-normal ml-1">
                  {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
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
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${s.id < step ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' :
                      s.id === step ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/30 ring-4 ring-blue-100 dark:ring-blue-900' :
                        'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}>
                    {s.id < step
                      ? <Check size={14} />
                      : <Icon size={14} />
                    }
                  </div>
                  <span className={`hidden md:block text-[10px] font-bold uppercase tracking-wider ${s.id <= step ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                    }`}>
                    {t(`steps.${s.key}`)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main grid ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Content area */}
          <div className="lg:col-span-2">

            {/* ══════ STEP 1 : Type & Location ══════════════════════ */}
            {step === 1 && (
              <div className="space-y-8">

                {/* Property type */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-[0_4px_0_0_rgba(0,0,0,0.04),0_8px_16px_-4px_rgba(0,0,0,0.06)]">
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
                          <div className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all duration-200
                            ${form.type === pt.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md shadow-blue-500/15'
                              : 'border-transparent bg-slate-50 dark:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-600'
                            }`}>
                            <Icon size={28} className={`transition-colors ${form.type === pt.value ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                              }`} />
                            <span className={`text-xs font-bold text-center leading-tight ${form.type === pt.value ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'
                              }`}>
                              {t(`propertyTypes.${pt.value}`)}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Title & Description */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-[0_4px_0_0_rgba(0,0,0,0.04),0_8px_16px_-4px_rgba(0,0,0,0.06)]">
                  <SectionTitle num={2} title={t('step1.titleSectionTitle')} />
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                        {t('step1.titleLabel')}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={form.title}
                          onChange={e => upd({ title: e.target.value })}
                          placeholder={t('step1.titlePlaceholder')}
                          maxLength={100}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 px-4 pr-16 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 text-sm"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 tabular-nums">
                          {form.title.length}/100
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                        {t('step1.descriptionLabel')}
                      </label>
                      <div className="relative">
                        <textarea
                          value={form.description}
                          onChange={e => upd({ description: e.target.value })}
                          placeholder={t('step1.descriptionPlaceholder')}
                          rows={4}
                          maxLength={2000}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 px-4 pb-8 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 text-sm resize-none"
                        />
                        <span className="absolute bottom-3 right-4 text-xs text-slate-400 tabular-nums">
                          {form.description.length}/2000
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location avec carte interactive */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-[0_4px_0_0_rgba(0,0,0,0.04),0_8px_16px_-4px_rgba(0,0,0,0.06)]">
                  <SectionTitle num={3} title={t('step1.locationTitle')} />

                  {/* Champs de localisation */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                        {t('step1.governorate')}
                      </label>
                      <div className="relative">
                        <select
                          value={form.governorate}
                          onChange={e => upd({ governorate: e.target.value })}
                          className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 px-4 pr-10 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white text-sm"
                        >
                          <option value="">{t('step1.choose')}</option>
                          {governorates.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                        {t('step1.delegation')}
                      </label>
                      <input
                        type="text"
                        value={form.delegation}
                        onChange={e => upd({ delegation: e.target.value })}
                        placeholder={t('step1.delegationPlaceholder')}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                        {t('step1.street')}
                      </label>
                      <input
                        type="text"
                        value={form.street}
                        onChange={e => upd({ street: e.target.value })}
                        placeholder={t('step1.streetPlaceholder')}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 text-sm"
                      />
                    </div>
                  </div>

                  {/* Carte interactive */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                      {t('step1.exactLocation')}
                    </label>
                    <div className="h-80 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                      <MapPickerWrapper
                        latitude={form.latitude}
                        longitude={form.longitude}
                        onLocationChange={(lat, lng) => upd({ latitude: lat, longitude: lng })}
                        onAddressChange={(address) => {
                          // Optionnel: Parser l'adresse et remplir les champs automatiquement
                          console.log('Address:', address);
                        }}
                      />
                    </div>

                    {/* Indication de position sélectionnée */}
                    {form.latitude !== null && form.longitude !== null && (
                      <div className="flex items-center gap-2 mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
                        <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <p className="text-sm text-emerald-700 dark:text-emerald-400">
                          {t('step1.positionSelected')}: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
                        </p>
                      </div>
                    )}

                    {/* Avertissement si pas de position */}
                    {(form.latitude === null || form.longitude === null) && (
                      <div className="flex items-center gap-2 mt-3 p-3 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                        <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          {t('step1.mapClickHint')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ══════ STEP 2 : Characteristics ══════════════════════ */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-[0_4px_0_0_rgba(0,0,0,0.04),0_8px_16px_-4px_rgba(0,0,0,0.06)]">
                  <SectionTitle title={t('step2.title')} />
                  <div className="space-y-4">
                    {[
                      { key: 'rooms', icon: Bed, value: form.rooms, set: (v: number) => upd({ rooms: v }), max: 20 },
                      { key: 'bathrooms', icon: Bath, value: form.bathrooms, set: (v: number) => upd({ bathrooms: v }), max: 10 },
                      { key: 'maxGuests', icon: Users, value: form.maxGuests, set: (v: number) => upd({ maxGuests: v }), max: 30 },
                    ].map(row => {
                      const Icon = row.icon;
                      return (
                        <div key={row.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <Icon size={20} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-sm">{t(`step2.${row.key}`)}</p>
                              <p className="text-xs text-slate-400">{t(`step2.${row.key}Desc`)}</p>
                            </div>
                          </div>
                          <Stepper value={row.value} min={1} max={row.max} onChange={row.set} />
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                        {t('step2.surface')}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={form.surfaceArea || ''}
                          onChange={e => upd({ surfaceArea: e.target.value ? Number(e.target.value) : null })}
                          placeholder="120"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 pr-12 focus:ring-2 focus:ring-blue-500/30 outline-none text-slate-900 dark:text-white text-sm"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">m²</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                        {t('step2.floor')}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={form.floorNumber ?? ''}
                          onChange={e => upd({ floorNumber: e.target.value ? Number(e.target.value) : null })}
                          placeholder="0"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 pr-10 focus:ring-2 focus:ring-blue-500/30 outline-none text-slate-900 dark:text-white text-sm"
                        />
                        <ArrowUp size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {/* Elevator */}
                  <div className="mt-4 flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                        <ArrowUp size={20} className="text-violet-600 dark:text-violet-400" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{t('step2.elevator')}</p>
                        <p className="text-xs text-slate-400">{t('step2.elevatorDesc')}</p>
                      </div>
                    </div>
                    <Toggle checked={form.hasElevator} onChange={v => upd({ hasElevator: v })} />
                  </div>
                </div>
              </div>
            )}

            {/* ══════ STEP 3 : Equipment ════════════════════════════ */}
            {step === 3 && (
              <div className="space-y-6">

                {/* Equipment */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-[0_4px_0_0_rgba(0,0,0,0.04),0_8px_16px_-4px_rgba(0,0,0,0.06)]">
                  <SectionTitle title={t('step3.equipmentTitle')} />
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {equipmentIds.map(id => {
                      const active = !!form.equipment[id];
                      const Icon = equipmentIcons[id] || Check;
                      return (
                        <label key={id} className="cursor-pointer group">
                          <input type="checkbox" checked={active}
                            onChange={e => upd({ equipment: { ...form.equipment, [id]: e.target.checked } })}
                            className="sr-only" />
                          <div className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all duration-200 ${active
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm shadow-blue-500/15'
                              : 'border-transparent bg-slate-50 dark:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-600'
                            }`}>
                            <Icon size={22} className={active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />
                            <span className={`text-[10px] font-bold text-center leading-tight ${active ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}>
                              {t(`equipment.${id}`)}
                            </span>
                            {active && <Check size={10} className="text-blue-600 dark:text-blue-400 mt-0.5" />}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Services */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-[0_4px_0_0_rgba(0,0,0,0.04),0_8px_16px_-4px_rgba(0,0,0,0.06)]">
                  <SectionTitle title={t('step3.servicesTitle')} />
                  <div className="space-y-3">
                    {serviceIds.map(id => {
                      const Icon = serviceIcons[id] || Sparkles;
                      return (
                        <div key={id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                              <Icon size={18} className="text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-slate-900 dark:text-white">{t(`services.${id}`)}</p>
                              <p className="text-xs text-slate-400">{t(`services.${id}Desc`)}</p>
                            </div>
                          </div>
                          <Toggle
                            checked={!!form.services[id]}
                            onChange={v => upd({ services: { ...form.services, [id]: v } })}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* House Rules */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-[0_4px_0_0_rgba(0,0,0,0.04),0_8px_16px_-4px_rgba(0,0,0,0.06)]">
                  <SectionTitle title={t('step3.rulesTitle')} />
                  <div className="space-y-3 mb-5">
                    {houseRuleIds.map(id => {
                      const Icon = ruleIcons[id] || X;
                      return (
                        <div key={id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                          <div className="flex items-center gap-3">
                            <Icon size={18} className="text-slate-400" />
                            <span className="font-semibold text-sm text-slate-900 dark:text-white">{t(`houseRules.${id}`)}</span>
                          </div>
                          <Toggle
                            checked={!!form.houseRules[id]}
                            onChange={v => upd({ houseRules: { ...form.houseRules, [id]: v } })}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                      {t('step3.customRulesLabel')}
                    </label>
                    <textarea
                      value={form.customRules}
                      onChange={e => upd({ customRules: e.target.value })}
                      placeholder={t('step3.customRulesPlaceholder')}
                      rows={3}
                      maxLength={500}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500/30 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-sm resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ══════ STEP 4 : Photos ════════════════════════════════ */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-[0_4px_0_0_rgba(0,0,0,0.04),0_8px_16px_-4px_rgba(0,0,0,0.06)]">
                  <SectionTitle title={t('step4.title')} />

                  {/* Drop zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={e => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
                    onClick={() => fileRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all duration-200
                      ${dragActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.01]'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                      }`}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={e => handleFiles(e.target.files)}
                    />
                    <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 shadow-sm">
                      <Camera size={32} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-base">{t('step4.dropHere')}</p>
                    <p className="text-sm text-slate-400 mt-1 text-center max-w-xs">{t('step4.dropHint')}</p>
                    <div className="flex items-center gap-3 mt-4">
                      <span className="h-px w-16 bg-slate-200 dark:bg-slate-700" />
                      <span className="text-xs text-slate-400 font-medium">{t('step4.or')}</span>
                      <span className="h-px w-16 bg-slate-200 dark:bg-slate-700" />
                    </div>
                    <button type="button"
                      className="mt-4 px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-full shadow-sm hover:shadow-md transition-all active:scale-95">
                      {t('step4.browseFiles')}
                    </button>
                    {/* Count indicator */}
                    <div className={`absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${form.photos.length >= 5
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      }`}>
                      <Info size={12} />
                      {form.photos.length}/20
                    </div>
                  </div>

                  {/* Min 5 warning */}
                  {form.photos.length < 5 && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/50 rounded-xl text-amber-700 dark:text-amber-400 text-xs font-medium mt-4">
                      <AlertCircle size={16} className="shrink-0" />
                      {t('step4.minPhotosWarning', { count: 5 - form.photos.length })}
                    </div>
                  )}

                  {/* Photo grid */}
                  {form.photos.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          {t('step4.yourPhotos')}
                          <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-black">
                            {form.photos.length}
                          </span>
                        </p>
                        <p className="text-xs text-slate-400">{t('step4.dragReorder')}</p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {form.photos.map((photo, idx) => (
                          <div key={idx} className={`relative group rounded-xl overflow-hidden aspect-square bg-slate-100 dark:bg-slate-800 ${photo.isMain ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : ''
                            }`}>
                            <img src={photo.url} alt="" className="w-full h-full object-cover" />
                            {photo.isMain && (
                              <div className="absolute top-2 left-2">
                                <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg">
                                  {t('step4.mainPhoto')}
                                </span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                            <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                              {!photo.isMain && (
                                <button type="button" onClick={() => setMainPhoto(idx)}
                                  className="w-7 h-7 rounded-full bg-white/90 text-amber-500 flex items-center justify-center shadow-md hover:bg-white transition-colors"
                                  title={t('step4.setMain')}>
                                  <Star size={14} />
                                </button>
                              )}
                              <button type="button" onClick={() => removePhoto(idx)}
                                className="w-7 h-7 rounded-full bg-white/90 text-rose-500 flex items-center justify-center shadow-md hover:bg-white transition-colors"
                                title={t('step4.delete')}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {/* Add more button */}
                        {form.photos.length < 20 && (
                          <button type="button" onClick={() => fileRef.current?.click()}
                            className="aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-500 transition-all">
                            <Plus size={24} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{t('step4.add')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Photo tips */}
                <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-6 text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-10" />
                  <p className="text-xs font-black uppercase tracking-widest text-blue-200 mb-2">{t('step4.tipsTitle')}</p>
                  <ul className="space-y-2.5">
                    {[1, 2, 3].map(i => (
                      <li key={i} className="flex items-start gap-2.5">
                        {i === 1 && <Sun size={18} className="text-blue-200 shrink-0 mt-0.5" />}
                        {i === 2 && <Sparkles size={18} className="text-blue-200 shrink-0 mt-0.5" />}
                        {i === 3 && <Camera size={18} className="text-blue-200 shrink-0 mt-0.5" />}
                        <p className="text-sm text-blue-50">{t(`step4.tip${i}`)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* ══════ STEP 5 : Pricing ══════════════════════════════ */}
            {step === 5 && (
              <div className="space-y-5">

                {/* Rental type */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-[0_4px_0_0_rgba(0,0,0,0.04),0_8px_16px_-4px_rgba(0,0,0,0.06)]">
                  <SectionTitle title={t('step5.rentalTypeTitle')} />
                  <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-full gap-1">
                    {['SHORT_TERM', 'LONG_TERM', 'BOTH'].map(rt => (
                      <button
                        key={rt}
                        type="button"
                        onClick={() => upd({ rentalType: rt })}
                        className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${form.rentalType === rt
                            ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                          }`}>
                        {t(`step5.${rt}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prices */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-[0_4px_0_0_rgba(0,0,0,0.04),0_8px_16px_-4px_rgba(0,0,0,0.06)]">
                  <SectionTitle title={t('step5.pricesTitle')} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {(form.rentalType === 'SHORT_TERM' || form.rentalType === 'BOTH') && (
                      <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-3">
                          <Sun size={18} className="text-blue-500" />
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('step5.pricePerNight')}</label>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <input
                            type="number"
                            value={form.pricePerNight || ''}
                            onChange={e => upd({ pricePerNight: e.target.value ? Number(e.target.value) : null })}
                            placeholder="0"
                            className="w-full text-2xl font-black bg-transparent border-none focus:ring-0 outline-none text-slate-900 dark:text-white placeholder:text-slate-300"
                          />
                          <span className="text-sm font-bold text-slate-400 whitespace-nowrap">TND / {t('step5.night')}</span>
                        </div>
                        <div className="h-px bg-gradient-to-r from-blue-500/30 to-transparent mt-2" />
                        <p className="text-xs text-slate-400 italic mt-2">{t('step5.localAvg', { price: 145 })}</p>
                      </div>
                    )}
                    {(form.rentalType === 'LONG_TERM' || form.rentalType === 'BOTH') && (
                      <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar size={18} className="text-purple-500" />
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('step5.pricePerMonth')}</label>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <input
                            type="number"
                            value={form.pricePerMonth || ''}
                            onChange={e => upd({ pricePerMonth: e.target.value ? Number(e.target.value) : null })}
                            placeholder="0"
                            className="w-full text-2xl font-black bg-transparent border-none focus:ring-0 outline-none text-slate-900 dark:text-white placeholder:text-slate-300"
                          />
                          <span className="text-sm font-bold text-slate-400 whitespace-nowrap">TND / {t('step5.month')}</span>
                        </div>
                        <div className="h-px bg-gradient-to-r from-purple-500/30 to-transparent mt-2" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Fees */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-[0_4px_0_0_rgba(0,0,0,0.04),0_8px_16px_-4px_rgba(0,0,0,0.06)]">
                  <SectionTitle title={t('step5.feesTitle')} />
                  <div className="space-y-4">
                    {/* Security deposit */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <Shield size={18} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-white">{t('step5.deposit')}</p>
                          <p className="text-xs text-slate-400">{t('step5.depositDesc')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {form.securityDeposit !== null && (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={form.securityDeposit}
                              onChange={e => upd({ securityDeposit: Number(e.target.value) })}
                              className="w-20 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg py-1.5 px-2 text-sm text-right outline-none focus:ring-2 focus:ring-blue-500/30"
                            />
                            <span className="text-xs font-bold text-slate-400">TND</span>
                          </div>
                        )}
                        <Toggle
                          checked={form.securityDeposit !== null}
                          onChange={v => upd({ securityDeposit: v ? 500 : null })}
                        />
                      </div>
                    </div>

                    {/* Cleaning fee */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Sparkles size={18} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-white">{t('step5.cleaningFee')}</p>
                          <p className="text-xs text-slate-400">{t('step5.cleaningFeeDesc')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {form.cleaningFee !== null && (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={form.cleaningFee}
                              onChange={e => upd({ cleaningFee: Number(e.target.value) })}
                              className="w-20 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg py-1.5 px-2 text-sm text-right outline-none focus:ring-2 focus:ring-blue-500/30"
                            />
                            <span className="text-xs font-bold text-slate-400">TND</span>
                          </div>
                        )}
                        <Toggle
                          checked={form.cleaningFee !== null}
                          onChange={v => upd({ cleaningFee: v ? 50 : null })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seasonal pricing */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/20 rounded-full -translate-y-24 translate-x-10" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles size={16} className="text-yellow-400" />
                      <p className="text-xs font-black uppercase tracking-widest text-yellow-400">{t('step5.smartPricing')}</p>
                    </div>
                    <h3 className="text-xl font-bold mb-1">{t('step5.seasonalTitle')}</h3>
                    <p className="text-slate-300 text-sm mb-5">{t('step5.seasonalDesc')}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'weekend', icon: Calendar, val: form.weekendPriceMultiplier, set: (v: number) => upd({ weekendPriceMultiplier: v }) },
                        { key: 'summer', icon: Sun, val: form.seasonalRules[0]?.multiplier ?? 1.4, set: (v: number) => upd({ seasonalRules: [{ id: 'summer', label: t('step5.summer'), startDate: '06-01', endDate: '08-31', multiplier: v }] }) },
                      ].map(row => {
                        const Icon = row.icon;
                        return (
                          <div key={row.key} className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon size={16} className="text-purple-300" />
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">{t(`step5.${row.key}`)}</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-2xl font-black text-white">+{Math.round((row.val - 1) * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min={0} max={100}
                              value={Math.round((row.val - 1) * 100)}
                              onChange={e => row.set(1 + Number(e.target.value) / 100)}
                              className="w-full mt-2 accent-purple-400"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Revenue estimate */}
                <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/15 border border-blue-200 dark:border-blue-800/50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30">
                    <TrendingUp size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-blue-700 dark:text-blue-400 text-sm">{t('step5.estimatedRevenue')}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                      {t('step5.estimatedRevenueDesc', { min: 1200, max: 2800 })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ══════ STEP 6 : Preview ══════════════════════════════ */}
            {step === 6 && (
              <div className="space-y-5">
                <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-[0_4px_0_0_rgba(0,0,0,0.04),0_8px_16px_-4px_rgba(0,0,0,0.06)]">
                 {/* Hero photo */}
<div className="relative aspect-[16/9] bg-gradient-to-br from-blue-500 to-purple-600">
  {(() => {
    const mainPhoto = form.photos.find(p => p.isMain) || form.photos[0];
    const imageUrl = mainPhoto?.url;
    
    // ✅ Fonction pour obtenir l'URL d'affichage
    const getDisplayUrl = (url: string) => {
      if (!url) return null;
      // Si c'est une URL blob locale, l'utiliser directement
      if (url.startsWith('blob:')) return url;
      // Sinon, passer par l'API pour les images privées
      return `/api/listings/image?url=${encodeURIComponent(url)}`;
    };
    
    const displayUrl = getDisplayUrl(imageUrl);
    
    return displayUrl ? (
      <img
        src={displayUrl}
        alt={form.title || t('preview.noTitle')}
        className="w-full h-full object-cover"
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center">
        <ImageIcon size={48} className="text-white/30" />
      </div>
    );
  })()}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                      <div>
                        <span className="inline-block bg-white/20 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full mb-2">
                          {t(`propertyTypes.${form.type}`)}
                        </span>
                        <h2 className="text-white text-xl font-bold shadow-sm">
                          {form.title || t('preview.noTitle')}
                        </h2>
                        {(form.governorate || form.delegation) && (
                          <div className="flex items-center gap-1 text-white/80 text-sm mt-0.5">
                            <MapPin size={14} />
                            {form.governorate}{form.delegation ? `, ${form.delegation}` : ''}
                          </div>
                        )}
                      </div>
                      <div className="bg-white/90 backdrop-blur rounded-xl px-4 py-2 text-right shadow-lg">
                        <p className="font-black text-blue-700 text-lg">
                          {form.pricePerNight || form.pricePerMonth || '---'} TND
                        </p>
                        <p className="text-xs text-slate-500">
                          {form.rentalType === 'LONG_TERM' ? `/ ${t('step5.month')}` : `/ ${t('step5.night')}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-sm">
                        <Bed size={16} />
                        <span className="font-medium">{form.rooms} {t('preview.rooms')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-sm">
                        <Bath size={16} />
                        <span className="font-medium">{form.bathrooms} {t('preview.bathrooms')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-sm">
                        <Users size={16} />
                        <span className="font-medium">{form.maxGuests} {t('preview.guests')}</span>
                      </div>
                      {form.surfaceArea && (
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-sm">
                          <Ruler size={16} />
                          <span className="font-medium">{form.surfaceArea} m²</span>
                        </div>
                      )}
                    </div>

                    {form.description && (
                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-4">{form.description}</p>
                    )}

                    {/* Equipment chips */}
                    {Object.keys(form.equipment).filter(k => form.equipment[k]).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {Object.keys(form.equipment).filter(k => form.equipment[k]).map(k => {
                          const Icon = equipmentIcons[k] || Check;
                          return (
                            <span key={k} className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-xs font-medium">
                              <Icon size={10} />
                              {t(`equipment.${k}`)}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Map preview in Step 6 */}
                    {form.latitude !== null && form.longitude !== null && (
                      <div className="mt-6">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                          <MapPin size={16} className="text-blue-500" />
                          {t('preview.location')}
                        </h3>
                        <div className="h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                          <MapPickerWrapper
                            latitude={form.latitude}
                            longitude={form.longitude}
                            onLocationChange={() => {}} // Read-only in preview
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Publish notice */}
                <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
                  <Check size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">{t('preview.readyTitle')}</p>
                    <p className="text-emerald-600 dark:text-emerald-500 text-xs mt-0.5">{t('preview.readyDesc')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar (desktop) ─────────────────────────────────── */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {/* Tip card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-[0_4px_0_0_rgba(0,0,0,0.04),0_8px_16px_-4px_rgba(0,0,0,0.06)]">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  <Lightbulb size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className=" font-bold text-slate-900 dark:text-white mb-3">{t('sidebar.tipTitle')}</h3>
                <ul className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check size={16} className="text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-slate-500 dark:text-slate-400 text-sm">{t(`sidebar.tip${i}`)}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Why NestHub card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 to-purple-700 rounded-2xl p-5 text-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-10" />
                <p className="text-xs font-black uppercase tracking-widest text-blue-200 mb-2 relative z-10">{t('sidebar.whyNesthub')}</p>
                <ul className="space-y-2.5 relative z-10">
                  {[
                    { icon: Shield, key: 'benefit1' },
                    { icon: Users, key: 'benefit2' },
                    { icon: Sparkles, key: 'benefit3' },
                  ].map(b => {
                    const Icon = b.icon;
                    return (
                      <li key={b.key} className="flex items-center gap-2.5">
                        <Icon size={16} className="text-blue-200" />
                        <span className="text-sm text-blue-50">{t(`sidebar.${b.key}`)}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fixed bottom nav ────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => { setStep(s => Math.max(1, s - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={step === 1}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold disabled:opacity-30 hover:text-slate-900 dark:hover:text-white transition-colors text-sm"
          >
            <ChevronLeft size={18} />
            {t('nav.previous')}
          </button>

          <div className="flex items-center gap-1.5">
            {STEPS.map(s => (
              <div key={s.id} className={`h-1.5 rounded-full transition-all duration-300 ${s.id === step ? 'w-6 bg-blue-600' : s.id < step ? 'w-3 bg-blue-300 dark:bg-blue-700' : 'w-3 bg-slate-200 dark:bg-slate-700'
                }`} />
            ))}
          </div>

          {step === STEPS.length ? (
            <button
              type="button"
              onClick={handlePublish}
              disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t('publishing')}
                </>
              ) : (
                <>
                  {t('publish')}
                  <Rocket size={16} />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setStep(s => Math.min(STEPS.length, s + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {t('nav.continue')}
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}