// components/maps/MapPickerWrapper.tsx
'use client';

import dynamic from 'next/dynamic';
import { Loader2, MapPin } from 'lucide-react';

// Import dynamique sans SSR (OBLIGATOIRE pour Leaflet)
const MapPicker = dynamic(() => import('./MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <Loader2 size={32} className="text-blue-500 animate-spin mx-auto mb-2" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Chargement de la carte...</p>
      </div>
    </div>
  ),
});

interface MapPickerWrapperProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  onAddressChange?: (address: string) => void;
  className?: string;
}

export default function MapPickerWrapper(props: MapPickerWrapperProps) {
  return <MapPicker {...props} />;
}