// components/ui/maps/ListingMap.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { renderToString } from "react-dom/server";
import { FaHome, FaWalking, FaCar } from "react-icons/fa";
import {
  LiaUmbrellaBeachSolid,
  LiaStoreSolid,
  LiaPillsSolid,
  LiaUniversitySolid,
  LiaGasPumpSolid,
  LiaTrainSolid,
  LiaBusSolid,
  LiaParkingSolid,
  LiaTreeSolid,
  LiaUtensilsSolid,
  LiaCoffeeSolid,
  LiaDumbbellSolid,
  LiaSwimmerSolid,
  LiaHospitalSymbolSolid,
  LiaSchoolSolid,
  LiaShieldAltSolid,
  LiaMosqueSolid,
  LiaChurchSolid,
} from "react-icons/lia";
import { PiFilmReelFill } from "react-icons/pi";
import { BsBank2 } from "react-icons/bs";
import { GiGymBag } from "react-icons/gi";
import {
  MdFastfood,
  MdLocalCafe,
  MdLocalGasStation,
  MdLocalHospital,
  MdLocalPharmacy,
  MdLocalGroceryStore,
} from "react-icons/md";

// Fix pour les icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface POI {
  id: string;
  lat: number;
  lon: number;
  name: string;
  category: string;
  icon: React.ReactNode;
  color: string;
  distance: number;
  duration?: number;
  drivingDistance?: number;
  drivingDuration?: number;
}

interface ListingMapProps {
  homeLat: number;
  homeLng: number;
  pois: POI[];
  zoom?: number;
  onPoiClick?: (poi: POI) => void;
  showAllDistances?: boolean;
}

// Cache pour les routes
const routeCache = new Map<string, any>();

// Composant pour le cercle de rayon - VISUEL AMÉLIORÉ
function RadiusCircle({
  center,
  radiusKm = 3,
  showAllDistances = false,
}: {
  center: [number, number];
  radiusKm: number;
  showAllDistances?: boolean;
}) {
  const [opacity, setOpacity] = useState(0.3);
  const [pulseScale, setPulseScale] = useState(1);
  const map = useMap();

  useEffect(() => {
    if (!map || !center || center.length < 2) return;

    // Animation d'opacité pulsante
    const interval = setInterval(() => {
      setOpacity((prev) => (prev === 0.3 ? 0.7 : 0.3));
    }, 1300);

    // Animation d'échelle pour le mode étendu
    let direction = 0.02;
    const pulseInterval = setInterval(() => {
      setPulseScale((prev) => {
        let newVal = prev + direction;
        if (newVal >= 1.1) {
          direction = -0.02;
          newVal = 1.1;
        } else if (newVal <= 0.95) {
          direction = 0.02;
          newVal = 0.95;
        }
        return newVal;
      });
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(pulseInterval);
    };
  }, [map, center]);

  if (!center || center.length < 2 || !center[0] || !center[1]) return null;

  const isExtended = showAllDistances;

  return (
    <>
      {/* Cercle principal */}
      <Circle
        center={[center[0], center[1]]}
        radius={radiusKm * 1000}
        pathOptions={{
          color: isExtended ? "#f97316" : "#ef4444",
          fillColor: isExtended ? "#f97316" : "#ef4444",
          fillOpacity: 0.05,
          weight: isExtended ? 3 : 2.5,
          dashArray: isExtended ? "4, 4" : "8, 8",
          opacity: isExtended ? 0.9 : opacity,
        }}
      />

      {/* Anneau extérieur pulsant en mode étendu */}
      {isExtended && (
        <Circle
          center={[center[0], center[1]]}
          radius={radiusKm * 1000 * pulseScale}
          pathOptions={{
            color: "#f97316",
            fillColor: "transparent",
            fillOpacity: 0,
            weight: 2,
            opacity: 0.5,
          }}
        />
      )}
    </>
  );
}

// Icône PIN pour le logement
const createHomePinIcon = () => {
  const homeIcon = renderToString(
    <FaHome className="text-white" style={{ fontSize: "18px" }} />,
  );
  return L.divIcon({
    html: `<div style="position: relative; width: 44px; height: 44px;">
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 44C22 44 38 28 38 16C38 7.2 30.8 0 22 0C13.2 0 6 7.2 6 16C6 28 22 44 22 44Z" fill="url(#homeGradient)" stroke="white" stroke-width="2"/>
        <defs>
          <linearGradient id="homeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#38bdf8"/>
            <stop offset="100%" style="stop-color:#a855f7"/>
          </linearGradient>
        </defs>
      </svg>
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -65%); text-align: center; pointer-events: none; color: white;">
        ${homeIcon}
      </div>
    </div>`,
    className: "home-marker",
    iconSize: [44, 44],
    popupAnchor: [0, -22],
  });
};

// Icône PIN pour les POIs (avec opacité différente si hors rayon)
const createPoiPinIcon = (
  color: string,
  iconHtml: string,
  isOutOfRadius: boolean = false,
) => {
  const finalColor = isOutOfRadius ? `${color}99` : color; // Ajoute 60% d'opacité
  return L.divIcon({
    html: `<div style="position: relative; width: 32px; height: 32px; cursor: pointer; transition: transform 0.2s; ${isOutOfRadius ? "opacity: 0.7;" : ""}">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">
        <path d="M16 32C16 32 28 20 28 12C28 5.4 22.6 0 16 0C9.4 0 4 5.4 4 12C4 20 16 32 16 32Z" fill="${finalColor}" stroke="white" stroke-width="2"/>
      </svg>
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -65%); text-align: center; pointer-events: none; color: white; display: flex; align-items: center; justify-content: center; font-size: 14px;">
        ${iconHtml}
      </div>
    </div>`,
    className: "poi-marker",
    iconSize: [28, 28],
    popupAnchor: [0, -16],
  });
};

// Version hover (normale, pas d'opacité réduite)
const createPoiPinIconHover = (color: string, iconHtml: string) => {
  return L.divIcon({
    html: `<div style="position: relative; width: 38px; height: 38px; cursor: pointer; transition: transform 0.2s; transform: scale(1.1);">
      <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));">
        <path d="M19 38C19 38 33 24 33 14C33 6.2 26.8 0 19 0C11.2 0 5 6.2 5 14C5 24 19 38 19 38Z" fill="${color}" stroke="white" stroke-width="2.5"/>
      </svg>
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -65%); text-align: center; pointer-events: none; color: white; display: flex; align-items: center; justify-content: center; font-size: 16px;">
        ${iconHtml}
      </div>
    </div>`,
    className: "poi-marker-hover",
    iconSize: [38, 38],
    popupAnchor: [0, -19],
  });
};

// Fonction pour obtenir l'itinéraire avec cache
async function fetchRealRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  mode: "walking" | "driving" = "walking",
): Promise<{
  coordinates: [number, number][];
  distance: number;
  duration: number;
} | null> {
  const cacheKey = `${startLat},${startLng}-${endLat},${endLng}-${mode}`;

  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey);
  }

  try {
    const profile = mode === "walking" ? "walking" : "driving";
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/${profile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
    );
    const data = await response.json();

    if (data.code === "Ok" && data.routes && data.routes[0]) {
      const route = data.routes[0];
      const coordinates = route.geometry.coordinates.map(
        (coord: number[]) => [coord[1], coord[0]] as [number, number],
      );
      const distance = route.distance / 1000;
      const duration = Math.round(route.duration / 60);

      const result = { coordinates, distance, duration };
      routeCache.set(cacheKey, result);
      return result;
    }
    return null;
  } catch (error) {
    console.error(`Erreur lors du calcul d'itinéraire (${mode}):`, error);
    return null;
  }
}

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

// Card d'information au survol
function HoverCard({
  poi,
  walkingData,
  drivingData,
  position,
  onMouseLeave,
  showAllDistances = false,
  t,
}: {
  poi: POI;
  walkingData: any;
  drivingData: any;
  position: { x: number; y: number };
  onMouseLeave: () => void;
  showAllDistances?: boolean;
  t: any;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onMouseLeave();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onMouseLeave]);

  if (!poi) return null;

  const isInRadius = poi.distance <= 3;
  const isExtended = showAllDistances;

  return (
    <div
      ref={cardRef}
      onMouseLeave={onMouseLeave}
      className={`fixed z-[2000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl shadow-2xl border p-4 min-w-[220px] animate-in fade-in zoom-in-95 duration-200 ${
        isExtended && !isInRadius
          ? "border-orange-500/50 bg-gradient-to-br from-white to-orange-50/30 dark:from-slate-900 dark:to-orange-950/20"
          : "border-gray-200/80 dark:border-gray-700"
      }`}
      style={{
        left: Math.min(position.x + 15, window.innerWidth - 250),
        top: Math.max(position.y - 120, 20),
      }}
    >
      <div className="flex items-center gap-3 mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
          style={{ backgroundColor: `${poi.color}20` }}
        >
          <span className="text-xl">{getIconForCategory(poi.category)}</span>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">
            {poi.name}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {poi.category}
            </p>
            {!isInRadius && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                +{poi.distance.toFixed(1)} {t("distanceKm")}
              </span>
            )}
            {isExtended && isInRadius && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
                ✓ {t("inRadius")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaWalking className="text-green-500 text-sm" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {t("walking")}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500">
              (
              {walkingData?.duration ||
                poi.duration ||
                Math.round((poi.distance || 0) * 12)}{" "}
              min)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaCar className="text-blue-500 text-sm" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {t("driving")}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500">
              ({drivingData?.duration || "-"} min)
            </span>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700 my-2" />

        <button
          onClick={() => {
            const url = `https://www.google.com/maps/dir/${poi.lat},${poi.lon}`;
            window.open(url, "_blank");
          }}
          className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <FaWalking className="text-sm" />
          {t("openInGoogleMaps")}
        </button>
      </div>
    </div>
  );
}

// Mapping des catégories
const getIconForCategory = (category: string): React.ReactNode => {
  const icons: Record<string, React.ReactNode> = {
    beach: <LiaUmbrellaBeachSolid style={{ fontSize: "18px" }} />,
    supermarket: <MdLocalGroceryStore style={{ fontSize: "18px" }} />,
    pharmacy: <MdLocalPharmacy style={{ fontSize: "18px" }} />,
    bank: <BsBank2 style={{ fontSize: "16px" }} />,
    atm: <BsBank2 style={{ fontSize: "16px" }} />,
    fuel: <MdLocalGasStation style={{ fontSize: "18px" }} />,
    station: <LiaTrainSolid style={{ fontSize: "18px" }} />,
    bus: <LiaBusSolid style={{ fontSize: "18px" }} />,
    taxi: <LiaBusSolid style={{ fontSize: "18px" }} />,
    parking: <LiaParkingSolid style={{ fontSize: "18px" }} />,
    park: <LiaTreeSolid style={{ fontSize: "18px" }} />,
    restaurant: <MdFastfood style={{ fontSize: "18px" }} />,
    cafe: <MdLocalCafe style={{ fontSize: "18px" }} />,
    cinema: <PiFilmReelFill style={{ fontSize: "16px" }} />,
    gym: <GiGymBag style={{ fontSize: "16px" }} />,
    pool: <LiaSwimmerSolid style={{ fontSize: "18px" }} />,
    hospital: <MdLocalHospital style={{ fontSize: "18px" }} />,
    school: <LiaSchoolSolid style={{ fontSize: "18px" }} />,
    university: <LiaUniversitySolid style={{ fontSize: "18px" }} />,
    police: <LiaShieldAltSolid style={{ fontSize: "18px" }} />,
    mosque: <LiaMosqueSolid style={{ fontSize: "18px" }} />,
    church: <LiaChurchSolid style={{ fontSize: "18px" }} />,
  };
  return icons[category] || <LiaStoreSolid style={{ fontSize: "18px" }} />;
};

export default function ListingMap({
  homeLat,
  homeLng,
  pois,
  zoom = 16,
  onPoiClick,
  showAllDistances = false,
}: ListingMapProps) {
  const t = useTranslations("ListingMap");
  const position: [number, number] = [homeLat, homeLng];
  const mapRef = useRef<L.Map | null>(null);

  const [hoveredPoi, setHoveredPoi] = useState<POI | null>(null);
  const [walkingRouteData, setWalkingRouteData] = useState<any>(null);
  const [drivingRouteData, setDrivingRouteData] = useState<any>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filtrer les POIs
  const displayedPois = showAllDistances
    ? pois
    : pois.filter((poi) => poi.distance <= 3);
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);
  // Charger les itinéraires
  useEffect(() => {
    if (!hoveredPoi) {
      setWalkingRouteData(null);
      setDrivingRouteData(null);
      return;
    }

    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

    hoverTimeoutRef.current = setTimeout(async () => {
      const [walking, driving] = await Promise.all([
        fetchRealRoute(
          homeLat,
          homeLng,
          hoveredPoi.lat,
          hoveredPoi.lon,
          "walking",
        ),
        fetchRealRoute(
          homeLat,
          homeLng,
          hoveredPoi.lat,
          hoveredPoi.lon,
          "driving",
        ),
      ]);
      if (walking) setWalkingRouteData(walking);
      if (driving) setDrivingRouteData(driving);
    }, 200);

    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, [hoveredPoi, homeLat, homeLng]);

  const handleMouseLeave = useCallback(() => {
    setHoveredPoi(null);
    setWalkingRouteData(null);
    setDrivingRouteData(null);
  }, []);

  // Trier les POIs
  const sortedPois = [...displayedPois].sort((a, b) => {
    const aInRadius = a.distance <= 3;
    const bInRadius = b.distance <= 3;
    if (aInRadius && !bInRadius) return -1;
    if (!aInRadius && bInRadius) return 1;
    return a.distance - b.distance;
  });

  return (
    <>
      <MapContainer
        ref={mapRef}
        center={position}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        className="rounded-2xl z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RadiusCircle
          center={position}
          radiusKm={3}
          showAllDistances={showAllDistances}
        />

        <Marker position={position} icon={createHomePinIcon()}>
          <Popup>
            <div className="p-2">
              <strong>{t("yourProperty")}</strong>
              <p className="text-xs text-gray-500 mt-1">
                {showAllDistances ? t("extendedModeActive") : t("radius3km")}
              </p>
            </div>
          </Popup>
        </Marker>

        {sortedPois.map((poi) => {
          const iconHtml = renderToString(getIconForCategory(poi.category));
          const isInRadius = poi.distance <= 3;
          const isOutOfRadius = showAllDistances && !isInRadius;

          return (
            <Marker
              key={poi.id}
              position={[poi.lat, poi.lon]}
              icon={
                hoveredPoi?.id === poi.id
                  ? createPoiPinIconHover(poi.color, iconHtml)
                  : createPoiPinIcon(poi.color, iconHtml, isOutOfRadius)
              }
              eventHandlers={{
                mouseover: (e) => {
                  setHoveredPoi(poi);
                  setHoverPosition({
                    x: e.originalEvent.clientX,
                    y: e.originalEvent.clientY,
                  });
                },
                mouseout: handleMouseLeave,
                click: () => onPoiClick?.(poi),
              }}
            />
          );
        })}

        {walkingRouteData && hoveredPoi && (
          <Polyline
            positions={walkingRouteData.coordinates}
            color="#22c55e"
            weight={4}
            opacity={0.8}
            className="walking-route"
          />
        )}
      </MapContainer>

      {hoveredPoi && (
        <HoverCard
          poi={hoveredPoi}
          walkingData={walkingRouteData}
          drivingData={drivingRouteData}
          position={hoverPosition}
          onMouseLeave={handleMouseLeave}
          showAllDistances={showAllDistances}
          t={t}
        />
      )}
    </>
  );
}