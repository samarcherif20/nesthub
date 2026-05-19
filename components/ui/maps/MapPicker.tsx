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
  MapPin,
  Loader2,
  Target,
  Crosshair,
  Locate,
  Navigation,
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
      width: ${readOnly ? "36px" : "48px"};
      height: ${readOnly ? "36px" : "48px"};
      background: linear-gradient(135deg, ${readOnly ? "#6366f1" : "#3b82f6"}, ${readOnly ? "#8b5cf6" : "#8b5cf6"});
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
      border: 3px solid white;
      transition: all 0.3s ease;
      cursor: pointer;
    ">
      <svg style="transform: rotate(45deg); width: ${readOnly ? "18px" : "24px"}; height: ${readOnly ? "18px" : "24px"}; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    </div>
  `,
    iconSize: [readOnly ? 36 : 48, readOnly ? 36 : 48],
    iconAnchor: [readOnly ? 18 : 24, readOnly ? 36 : 48],
  });

// Icône pour les marqueurs secondaires (listings)
const createListingIcon = (status: string) => {
  let color = "#6366f1";
  if (status === "ACTIVE") color = "#10b981";
  else if (status === "INACTIVE") color = "#f59e0b";
  else if (status === "DRAFT") color = "#64748b";
  else if (status === "ARCHIVED") color = "#8b5cf6";
  else if (status === "PENDING_REVIEW") color = "#3b82f6";

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
  onLocationDetected?: (lat: number, lng: number, addressData?: any) => void; // ✅ NOUVEAU

  className?: string;
  readOnly?: boolean;
  markers?: ListingMarker[];
  showAllMarkers?: boolean;
  onMarkerClick?: (listingId: string) => void;
  isGeocoding?: boolean;
}

function MapClickHandler({
  onLocationChange,
  onLocationDetected,
  readOnly,
}: {
  onLocationChange: (lat: number, lng: number) => void;
  onLocationDetected?: (lat: number, lng: number, addressData?: any) => void;
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

// ✅ Composant pour centrer la carte sur tous les marqueurs
function FitBoundsOnMarkers({
  markers,
  enabled,
}: {
  markers: ListingMarker[];
  enabled: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || !markers || markers.length === 0) return;

    // Filtrer les marqueurs valides
    const validMarkers = markers.filter((m) => m.latitude && m.longitude);
    if (validMarkers.length === 0) return;

    // Créer les bounds
    const bounds = L.latLngBounds(
      validMarkers.map((m) => [m.latitude, m.longitude]),
    );

    // Ajuster la vue avec un padding
    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 13,
      animate: true,
      duration: 1,
    });
  }, [markers, enabled, map]);

  return null;
}

function CenterMapOnPosition({
  position,
  readOnly,
}: {
  position: [number, number] | null;
  readOnly?: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (position && !readOnly) {
      map.flyTo(position, 15, {
        duration: 1.2,
      });
    }
  }, [map, position, readOnly]);

  return null;
}

export default function MapPicker({
  latitude,
  longitude,
  onLocationChange,
  onAddressChange,
  onLocationDetected, // ✅ AJOUTE CETTE LIGNE

  className = "",
  readOnly = false,
  markers = [],
  showAllMarkers = false,
  onMarkerClick,
  isGeocoding = false,
}: MapPickerProps) {
  const defaultCenter: [number, number] = [34.0, 9.0];
  const defaultZoom = 6;

  const [isLocating, setIsLocating] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [address, setAddress] = useState<string>("");
  const [hasFittedBounds, setHasFittedBounds] = useState(false);

  const position = useMemo<[number, number] | null>(
    () =>
      latitude !== null && longitude !== null ? [latitude, longitude] : null,
    [latitude, longitude],
  );

  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      try {
        // ✅ Appelle TON API
        const response = await fetch(
          `/api/geocode/reverse?lat=${lat}&lng=${lng}`,
        );
        const data = await response.json();

        if (data.success && data.address) {
          const formattedAddress =
            data.address.fullAddress ||
            `${data.address.street}, ${data.address.delegation}, ${data.address.governorate}`;
          setAddress(formattedAddress);
          if (onAddressChange) {
            onAddressChange(data.address.fullAddress || formattedAddress);
          }
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

      // ✅ Appeler aussi onLocationDetected pour remplir les champs
      if (onLocationDetected) {
        onLocationDetected(lat, lng, null);
      }
    },
    [onLocationChange, reverseGeocode, readOnly, onLocationDetected],
  );

  // Bouton de localisation
  const getCurrentLocation = () => {
    if (readOnly) return;

    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Mettre à jour la position
        handleLocationChange(lat, lng);

        // ✅ Appeler le callback avec les coordonnées et l'adresse
        if (onLocationDetected) {
          try {
            // ✅ APPELLER TON API, PAS NOMINATIM DIRECTEMENT
            const response = await fetch(
              `/api/geocode/reverse?lat=${lat}&lng=${lng}`,
            );
            const data = await response.json();

            if (data.success && data.address) {
              const addressData = {
                governorate: data.address.governorate || "",
                delegation: data.address.delegation || "",
                street: data.address.street || "",
                fullAddress: data.address.fullAddress || "",
                lat,
                lng,
              };

              onLocationDetected(lat, lng, addressData);
            } else {
              onLocationDetected(lat, lng, null);
            }
          } catch (error) {
            console.error("Reverse geocode error:", error);
            onLocationDetected(lat, lng, null);
          }
        }

        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLocating(false);
        let message = "Impossible d'obtenir votre position";
        if (error.code === 1) {
          message = "Veuillez autoriser l'accès à votre position";
        } else if (error.code === 2) {
          message = "Position indisponible, réessayez plus tard";
        } else if (error.code === 3) {
          message = "Délai d'attente dépassé, vérifiez votre connexion";
        }
        alert(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };
  // Mettre à jour l'adresse quand les coordonnées changent
  useEffect(() => {
    if (position) {
      reverseGeocode(position[0], position[1]);
    }
  }, [position, reverseGeocode]);

  // Réinitialiser hasFittedBounds quand les markers changent
  useEffect(() => {
    setHasFittedBounds(false);
  }, [markers.length]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <MapContainer
        center={position || defaultCenter}
        zoom={position ? 15 : defaultZoom}
        style={{ height: "100%", width: "100%" }}
        className="rounded-xl z-0 shadow-sm"
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
          onLocationDetected={onLocationDetected}
          readOnly={readOnly}
        />

        {mapReady && <MapController center={mapCenter} zoom={16} />}

        {mapReady && (
          <CenterMapOnPosition position={position} readOnly={readOnly} />
        )}

        {/* ✅ Centrage automatique sur tous les marqueurs */}
        {mapReady && showAllMarkers && !hasFittedBounds && (
          <FitBoundsOnMarkers markers={markers} enabled={true} />
        )}

        {/* Marqueur principal */}
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

        {/* Marqueurs des propriétés */}
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

      {/* Bouton de localisation */}
      {!readOnly && (
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isLocating}
          className="absolute bottom-4 right-4 z-[20] flex items-center justify-center w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95 border border-slate-200 dark:border-slate-700 group"
          title="Utiliser ma position"
        >
          {isLocating ? (
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
          ) : (
            <Crosshair className="w-5 h-5 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
          )}
        </button>
      )}

      {/* Indicateur de géocodage */}
      {isGeocoding && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[20] animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-indigo-200 dark:border-indigo-800">
            <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Localisation en cours...
            </span>
          </div>
        </div>
      )}

      {/* Affichage de l'adresse */}
      {address && !readOnly && position && (
        <div className="absolute top-4 left-4 right-24 z-[20] pointer-events-none animate-in fade-in slide-in-from-left-2 duration-300">
          <div className="flex items-center gap-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md border border-slate-200 dark:border-slate-700">
            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
            <p className="text-xs text-slate-600 dark:text-slate-300 truncate font-medium">
              {address}
            </p>
          </div>
        </div>
      )}

      {/* Instructions au centre */}
      {!readOnly && !position && !isGeocoding && (
        <div className="absolute inset-0 flex items-center justify-center z-[10] pointer-events-none">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl px-5 py-3 shadow-xl border border-indigo-200 dark:border-indigo-800/50 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-500" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Cliquez sur la carte pour placer le marqueur
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Affichage des coordonnées */}
      {position && !readOnly && (
        <div className="absolute bottom-4 left-4 z-[20] pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <code className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400">
                {position[0].toFixed(6)}, {position[1].toFixed(6)}
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Overlay en mode lecture seule */}
      {readOnly && (
        <div className="absolute bottom-4 left-4 z-[20] pointer-events-none">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1.5 shadow-md border border-slate-200 dark:border-slate-700">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Vue seule
            </p>
          </div>
        </div>
      )}

      {/* Légende des couleurs */}
      {readOnly && showAllMarkers && markers.length > 0 && (
        <div className="absolute bottom-4 left-4 z-[20] bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-xl px-4 py-2 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Active
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Inactive
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-500"></div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Brouillon
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Archivé
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                En attente
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
