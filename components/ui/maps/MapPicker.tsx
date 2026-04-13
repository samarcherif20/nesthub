// components/ui/maps/MapPicker.tsx
"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import {
  Search,
  MapPin,
  Crosshair,
  Loader2,
  Navigation,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import "leaflet/dist/leaflet.css";

// Fix pour les icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Icône pour le marqueur principal (sélection)
const createCustomIcon = (readOnly: boolean = false) =>
  L.divIcon({
    className: "custom-marker",
    html: `
    <div style="
      width: ${readOnly ? "36px" : "40px"};
      height: ${readOnly ? "36px" : "40px"};
      background: linear-gradient(135deg, ${readOnly ? "#6366f1" : "#3b82f6"}, ${readOnly ? "#8b5cf6" : "#8b5cf6"});
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 ${readOnly ? "3" : "4"}px 12px rgba(${readOnly ? "99, 102, 241" : "59, 130, 246"}, 0.4);
      border: 3px solid white;
      transition: all 0.3s ease;
    ">
      <svg style="transform: rotate(45deg); width: ${readOnly ? "18px" : "20px"}; height: ${readOnly ? "18px" : "20px"}; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    </div>
  `,
    iconSize: [readOnly ? 36 : 40, readOnly ? 36 : 40],
    iconAnchor: [readOnly ? 18 : 20, readOnly ? 36 : 40],
  });

// Icône pour les marqueurs secondaires (listings)
const createListingIcon = (status: string) => {
  let color = "#6366f1"; // indigo par défaut
  if (status === "ACTIVE")
    color = "#10b981"; // vert
  else if (status === "INACTIVE")
    color = "#f59e0b"; // orange
  else if (status === "DRAFT")
    color = "#64748b"; // gris
  else if (status === "ARCHIVED")
    color = "#8b5cf6"; // violet
  else if (status === "PENDING_REVIEW") color = "#3b82f6"; // bleu

  return L.divIcon({
    className: "custom-marker-listing",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, ${color}, ${color});
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        border: 2px solid white;
        cursor: pointer;
        transition: all 0.2s ease;
      ">
        <svg style="transform: rotate(45deg); width: 14px; height: 14px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </div>
      <div style="
        position: absolute;
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 6px solid ${color};
      "></div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 28],
  });
};

interface ListingMarker {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  status?: string;
  price?: number;
  type?: string;
}

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  onAddressChange?: (address: string) => void;
  className?: string;
  readOnly?: boolean;
  // NOUVELLES PROPS
  markers?: ListingMarker[];
  showAllMarkers?: boolean;
  onMarkerClick?: (listingId: string) => void;
}

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

function MapClickHandler({
  onLocationChange,
  readOnly,
}: {
  onLocationChange: (lat: number, lng: number) => void;
  readOnly?: boolean;
}) {
  useMapEvents({
    click(e) {
      if (!readOnly) {
        onLocationChange(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function MapController({
  center,
  zoom,
}: {
  center: [number, number] | null;
  zoom?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || map.getZoom(), {
        duration: 1.5,
      });
    }
  }, [center, zoom, map]);

  return null;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function MapPicker({
  latitude,
  longitude,
  onLocationChange,
  onAddressChange,
  className = "",
  readOnly = false,
  markers = [],
  showAllMarkers = false,
  onMarkerClick,
}: MapPickerProps) {
  const defaultCenter: [number, number] = [34.0, 9.0];
  const defaultZoom = 6;

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 500);

  const position = useMemo<[number, number] | null>(
    () =>
      latitude !== null && longitude !== null ? [latitude, longitude] : null,
    [latitude, longitude],
  );

  // Recherche d'adresses
  useEffect(() => {
    if (readOnly) return;

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
              "Accept-Language": "fr,en",
            },
          },
        );
        const data = await response.json();
        setSearchResults(data);
        setShowResults(true);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    searchAddress();
  }, [debouncedSearch, readOnly]);

  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?` +
            `format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              "Accept-Language": "fr,en",
            },
          },
        );
        const data = await response.json();
        if (data.display_name && onAddressChange) {
          onAddressChange(data.display_name);
        }
        return data;
      } catch (error) {
        console.error("Reverse geocode error:", error);
        return null;
      }
    },
    [onAddressChange],
  );

  const handleLocationChange = useCallback(
    (lat: number, lng: number) => {
      if (readOnly) return;
      onLocationChange(lat, lng);
      setMapCenter([lat, lng]);
      reverseGeocode(lat, lng);
    },
    [onLocationChange, reverseGeocode, readOnly],
  );

  const handleSelectResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    handleLocationChange(lat, lng);
    setSearchQuery(result.display_name.split(",")[0]);
    setShowResults(false);
    setSearchResults([]);
  };

  const getCurrentLocation = () => {
    if (readOnly) return;

    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleLocationChange(
          position.coords.latitude,
          position.coords.longitude,
        );
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLocating(false);
        alert("Impossible d'obtenir votre position");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Centrer la carte sur tous les marqueurs quand showAllMarkers est actif
  useEffect(() => {
    if (!mapReady || !showAllMarkers || markers.length === 0) return;

    const bounds = L.latLngBounds(
      markers.map((m) => [m.latitude, m.longitude]),
    );
    const map = document.querySelector(".leaflet-container") as any;
    if (map && map._leaflet_map) {
      map._leaflet_map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers, showAllMarkers, mapReady]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Barre de recherche - Masquée en mode lecture seule */}
      {!readOnly && (
        <div ref={searchRef} className="absolute top-3 left-3 right-3 z-[20]">
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
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-12 shadow-lg focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 text-sm font-medium"
            />
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isLocating}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
              title="Utiliser ma position"
            >
              {isLocating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Navigation size={16} />
              )}
            </button>
          </div>

          {/* Résultats de recherche */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto backdrop-blur-sm z-[20]">
              {searchResults.map((result) => (
                <button
                  key={result.place_id}
                  type="button"
                  onClick={() => handleSelectResult(result)}
                  className="w-full px-4 py-3 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0 group"
                >
                  <div className="flex items-start gap-3">
                    <MapPin
                      size={16}
                      className="text-indigo-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {result.display_name.split(",")[0]}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {result.display_name.split(",").slice(1).join(",")}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conteneur de la carte */}
      <MapContainer
        center={position || defaultCenter}
        zoom={position ? 15 : defaultZoom}
        style={{ height: "100%", width: "100%" }}
        className="rounded-xl z-0"
        whenReady={() => setMapReady(true)}
        dragging={!readOnly}
        touchZoom={!readOnly}
        doubleClickZoom={!readOnly}
        scrollWheelZoom={!readOnly}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler
          onLocationChange={handleLocationChange}
          readOnly={readOnly}
        />
        {mapReady && <MapController center={mapCenter} zoom={16} />}

        {/* Marqueur principal (sélectionné) */}
        {position && (
          <Marker
            position={position}
            icon={createCustomIcon(readOnly)}
            draggable={!readOnly}
            eventHandlers={{
              dragend: (e) => {
                if (!readOnly) {
                  const marker = e.target;
                  const pos = marker.getLatLng();
                  handleLocationChange(pos.lat, pos.lng);
                }
              },
            }}
          />
        )}

        {/* Marqueurs supplémentaires (tous les listings) */}
        {showAllMarkers &&
          markers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.latitude, marker.longitude]}
              icon={createListingIcon(marker.status || "ACTIVE")}
              eventHandlers={{
                click: () => {
                  if (onMarkerClick) {
                    onMarkerClick(marker.id);
                  }
                },
              }}
            >
              <Popup>
                <div className="p-2 min-w-[180px]">
                  <p className="font-bold text-sm text-slate-900 dark:text-white">
                    {marker.title}
                  </p>
                  {marker.price && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                      {marker.price.toLocaleString()} TND
                    </p>
                  )}
                  <button
                    onClick={() => {
                      if (onMarkerClick) onMarkerClick(marker.id);
                    }}
                    className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    Voir les détails →
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {/* Instructions - Masquées en mode lecture seule */}
      {!readOnly && !position && (
        <div className="absolute bottom-4 left-4 right-4 z-[5] pointer-events-none">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-xl px-4 py-3 shadow-lg border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              <span className="font-semibold text-slate-900 dark:text-white">
                Cliquez sur la carte
              </span>{" "}
              pour placer le marqueur
            </p>
          </div>
        </div>
      )}

      {/* Affichage des coordonnées */}
      {position && (
        <div className="absolute bottom-4 right-4 z-[5]">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-lg px-3 py-2 shadow-lg border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-600 dark:text-slate-300 font-mono font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              {position[0].toFixed(6)}, {position[1].toFixed(6)}
            </p>
          </div>
        </div>
      )}

      {/* Overlay en mode lecture seule */}
      {readOnly && (
        <div className="absolute bottom-4 left-4 z-[5] pointer-events-none">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Vue seule
            </p>
          </div>
        </div>
      )}

      {/* Légende des couleurs en mode lecture seule avec marqueurs */}
      {readOnly && showAllMarkers && markers.length > 0 && (
        <div className="absolute bottom-4 left-4 z-[5] bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-xl px-4 py-3 shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Légende
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Active
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Inactive
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-slate-500"></div>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Brouillon
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Archivé
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                En attente
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
