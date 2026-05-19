"use client";

import dynamic from "next/dynamic";
import { Loader2, MapPin } from "lucide-react";

const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-12 h-12 mx-auto mb-3">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-900"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 dark:border-t-indigo-400 animate-spin"></div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
          Chargement de la carte...
        </p>
      </div>
    </div>
  ),
});

interface ListingMarker {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  status?: string;
  price?: number;
  type?: string;
}

interface MapPickerWrapperProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  onAddressChange?: (address: string) => void;
  onLocationDetected?: (lat: number, lng: number, addressData?: any) => void; // ✅ NOUVEAU
  className?: string;
  readOnly?: boolean;
  markers?: ListingMarker[];
  showAllMarkers?: boolean;
  onMarkerClick?: (listingId: string) => void;
  isGeocoding?: boolean;
  showCurrentLocation?: boolean;
}

export default function MapPickerWrapper(props: MapPickerWrapperProps) {
  return <MapPicker {...props} />;
}