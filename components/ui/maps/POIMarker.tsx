// components/ui/maps/POIMarker.tsx
"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Icônes personnalisées
const createCustomIcon = (color: string, icon: string) => {
  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      color: white;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      border: 2px solid white;
      transition: transform 0.2s;
    ">${icon}</div>`,
    className: "custom-marker",
    iconSize: [36, 36],
    popupAnchor: [0, -18],
  });
};

const homeIcon = L.divIcon({
  html: `<div style="
    background: linear-gradient(135deg, #005cab, #712ae2);
    color: white;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    border: 3px solid white;
  ">🏠</div>`,
  className: "home-marker",
  iconSize: [48, 48],
  popupAnchor: [0, -24],
});

interface POI {
  id: string;
  lat: number;
  lon: number;
  name: string;
  icon: string;
  color: string;
  distance?: number;
  duration?: number;
  polyline?: string;
}

interface POIMarkerProps {
  pois: POI[];
  homeLat: number;
  homeLng: number;
  onRouteClick?: (poi: POI) => void;
}

function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

export function POIMarkers({ pois, homeLat, homeLng, onRouteClick }: POIMarkerProps) {
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [hoveredPoi, setHoveredPoi] = useState<POI | null>(null);

  const routeCoordinates = selectedPoi?.polyline 
    ? decodePolyline(selectedPoi.polyline)
    : [];

  return (
    <>
      {/* Marqueur du logement */}
      <Marker position={[homeLat, homeLng]} icon={homeIcon}>
        <Popup>
          <div className="text-center">
            <p className="font-bold">📍 Votre logement</p>
            <p className="text-xs text-gray-500">Point de départ</p>
          </div>
        </Popup>
      </Marker>

      {/* Marqueurs des POIs */}
      {pois.map((poi) => (
        <Marker
          key={poi.id}
          position={[poi.lat, poi.lon]}
          icon={createCustomIcon(poi.color, poi.icon)}
          eventHandlers={{
            mouseover: () => setHoveredPoi(poi),
            mouseout: () => setHoveredPoi(null),
            click: () => {
              setSelectedPoi(poi);
              onRouteClick?.(poi);
            },
          }}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{poi.icon}</span>
                <h3 className="font-bold text-gray-900">{poi.name}</h3>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Distance:</span>
                  <span className="font-medium">{poi.distance?.toFixed(1)} km</span>
                </div>
                {poi.duration && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">À pied:</span>
                    <span className="font-medium text-green-600">{poi.duration} min</span>
                  </div>
                )}
                <button
                  onClick={() => onRouteClick?.(poi)}
                  className="w-full mt-2 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg text-xs font-semibold hover:opacity-90 transition"
                >
                  Voir l'itinéraire
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Tracé de l'itinéraire */}
      {routeCoordinates.length > 0 && (
        <Polyline
          positions={routeCoordinates}
          color="#712ae2"
          weight={4}
          opacity={0.8}
          dashArray="10, 10"
        />
      )}

      {/* Tooltip hover pour afficher la distance */}
      {hoveredPoi && (
        <div
          className="fixed z-[1000] bg-black/80 text-white px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap pointer-events-none"
          style={{
            left: "50%",
            bottom: "20px",
            transform: "translateX(-50%)",
          }}
        >
          🚶 {hoveredPoi.duration || Math.round((hoveredPoi.distance || 0) * 12)} min · 📍 {hoveredPoi.distance?.toFixed(1)} km
        </div>
      )}
    </>
  );
}