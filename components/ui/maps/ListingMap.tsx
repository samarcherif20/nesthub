// components/ui/maps/ListingMap.tsx
"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

// Fix pour les icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ✅ Utilise le même type que NearbyPOI dans page.tsx
interface POI {
  id: string;
  lat: number;
  lon: number;
  name: string;
  category: string; // ✅ Requis, pas optionnel
  icon: string;
  color: string;
  distance: number;
  duration?: number;
}

interface ListingMapProps {
  homeLat: number;
  homeLng: number;
  pois: POI[];
  zoom?: number;
  onPoiClick?: (poi: POI) => void;
}

// Icône pour le logement
const createHomeIcon = () =>
  L.divIcon({
    html: `<div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2px solid white;">🏠</div>`,
    iconSize: [40, 40],
    popupAnchor: [0, -20],
  });

// Icône pour les POIs
const createPoiIcon = (color: string, icon: string) =>
  L.divIcon({
    html: `<div style="background-color: ${color}; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); border: 2px solid white;">${icon}</div>`,
    iconSize: [32, 32],
    popupAnchor: [0, -16],
  });

// Composant pour centrer la carte
function FitBounds({
  homeLat,
  homeLng,
  pois,
}: {
  homeLat: number;
  homeLng: number;
  pois: POI[];
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (pois.length > 0) {
      const bounds = L.latLngBounds([[homeLat, homeLng]]);
      pois.forEach((poi) => bounds.extend([poi.lat, poi.lon]));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView([homeLat, homeLng], 14);
    }
  }, [map, homeLat, homeLng, pois]);

  return null;
}

export default function ListingMap({
  homeLat,
  homeLng,
  pois,
  zoom = 14,
  onPoiClick,
}: ListingMapProps) {
  const position: [number, number] = [homeLat, homeLng];

  console.log("🗺️ ListingMap rendu avec:", {
    homeLat,
    homeLng,
    poisCount: pois.length,
  });

  return (
    <MapContainer
      center={position}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      className="rounded-2xl z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Marqueur du logement */}
      <Marker position={position} icon={createHomeIcon()}>
        <Popup>
          <div className="p-2">
            <strong>📍 Votre logement</strong>
          </div>
        </Popup>
      </Marker>

      {/* Marqueurs des POIs */}
      {pois.map((poi) => (
        <Marker
          key={poi.id}
          position={[poi.lat, poi.lon]}
          icon={createPoiIcon(poi.color, poi.icon)}
          eventHandlers={{
            click: () => onPoiClick?.(poi),
          }}
        >
          <Popup>
            <div className="p-2 min-w-[180px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{poi.icon}</span>
                <strong className="text-sm">{poi.name}</strong>
              </div>
              {poi.distance && (
                <div className="text-xs text-gray-500 mb-2">
                  📍 À {poi.distance.toFixed(1)} km • 🚶{" "}
                  {Math.round(poi.distance * 12)} min
                </div>
              )}
              <button
                onClick={() => onPoiClick?.(poi)}
                className="w-full py-1 bg-indigo-500 text-white rounded-lg text-xs font-semibold hover:bg-indigo-600 transition"
              >
                Voir l'itinéraire
              </button>
            </div>
          </Popup>
        </Marker>
      ))}

      <FitBounds homeLat={homeLat} homeLng={homeLng} pois={pois} />
    </MapContainer>
  );
}
