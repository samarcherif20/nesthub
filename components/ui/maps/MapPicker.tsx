// components/maps/MapPicker.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, Crosshair, Loader2 } from 'lucide-react';

import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet dans Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Icône personnalisée
const customIcon = L.divIcon({
  className: 'custom-marker',
  html: `
    <div style="
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      border: 3px solid white;
    ">
      <svg style="transform: rotate(45deg); width: 20px; height: 20px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  onAddressChange?: (address: string) => void;
  className?: string;
}

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

// Composant pour gérer les clics sur la carte
function MapClickHandler({ 
  onLocationChange 
}: { 
  onLocationChange: (lat: number, lng: number) => void 
}) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Composant pour recentrer la carte
function MapController({ 
  center, 
  zoom 
}: { 
  center: [number, number] | null; 
  zoom?: number 
}) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || map.getZoom(), {
        duration: 1,
      });
    }
  }, [center, zoom, map]);
  
  return null;
}

// Hook debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

export default function MapPicker({
  latitude,
  longitude,
  onLocationChange,
  onAddressChange,
  className = '',
}: MapPickerProps) {
  // Centre par défaut sur la Tunisie
  const defaultCenter: [number, number] = [34.0, 9.0];
  const defaultZoom = 6;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [mapReady, setMapReady] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 500);
  
  const position: [number, number] | null = 
    latitude !== null && longitude !== null 
      ? [latitude, longitude] 
      : null;

  // Recherche d'adresses
  useEffect(() => {
    const searchAddress = async () => {
      if (!debouncedSearch || debouncedSearch.length < 3) {
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `format=json&q=${encodeURIComponent(debouncedSearch)}&countrycodes=tn&limit=5`,
          {
            headers: {
              'Accept-Language': 'fr,en',
            },
          }
        );
        const data = await response.json();
        setSearchResults(data);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };
    
    searchAddress();
  }, [debouncedSearch]);

  // Reverse geocoding
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` +
        `format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'fr,en',
          },
        }
      );
      const data = await response.json();
      if (data.display_name && onAddressChange) {
        onAddressChange(data.display_name);
      }
      return data;
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return null;
    }
  }, [onAddressChange]);

  // Gérer le changement de position
  const handleLocationChange = useCallback((lat: number, lng: number) => {
    onLocationChange(lat, lng);
    setMapCenter([lat, lng]);
    reverseGeocode(lat, lng);
  }, [onLocationChange, reverseGeocode]);

  // Sélectionner un résultat de recherche
  const handleSelectResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    handleLocationChange(lat, lng);
    setSearchQuery(result.display_name.split(',')[0]);
    setShowResults(false);
    setSearchResults([]);
  };

  // Obtenir la position actuelle
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleLocationChange(position.coords.latitude, position.coords.longitude);
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLocating(false);
        alert('Impossible d\'obtenir votre position');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Fermer les résultats de recherche
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Barre de recherche */}
      <div ref={searchRef} className="absolute top-3 left-3 right-3 z-[1000]">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {isSearching ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Search size={18} />
            )}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            placeholder="Rechercher une adresse en Tunisie..."
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-12 shadow-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 text-sm"
          />
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={isLocating}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
            title="Utiliser ma position"
          >
            {isLocating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Crosshair size={16} />
            )}
          </button>
        </div>
        
        {/* Résultats de recherche */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={result.place_id}
                type="button"
                onClick={() => handleSelectResult(result)}
                className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0"
              >
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {result.display_name.split(',')[0]}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {result.display_name.split(',').slice(1).join(',')}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Conteneur de la carte */}
      <MapContainer
        center={position || defaultCenter}
        zoom={position ? 15 : defaultZoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-xl z-0"
        whenReady={() => setMapReady(true)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapClickHandler onLocationChange={handleLocationChange} />
        {mapReady && <MapController center={mapCenter} zoom={16} />}
        
        {position && (
          <Marker 
            position={position} 
            icon={customIcon}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const pos = marker.getLatLng();
                handleLocationChange(pos.lat, pos.lng);
              },
            }}
          />
        )}
      </MapContainer>
      
      {/* Instructions */}
      {!position && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] pointer-events-none">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur rounded-xl px-4 py-3 shadow-lg border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              <span className="font-semibold text-slate-900 dark:text-white">
                Cliquez sur la carte
              </span>
              {' '}pour placer le marqueur ou utilisez la recherche
            </p>
          </div>
        </div>
      )}
      
      {/* Affichage des coordonnées */}
      {position && (
        <div className="absolute bottom-4 right-4 z-[1000]">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur rounded-lg px-3 py-2 shadow-lg border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              📍 {position[0].toFixed(6)}, {position[1].toFixed(6)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}