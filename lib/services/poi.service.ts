// lib/services/poi.service.ts
import { IconType } from "react-icons";
import {
  FaUmbrellaBeach,
  FaStore,
  FaPills,
  FaGasPump,
  FaTrain,
  FaBus,
  FaParking,
  FaTree,
  FaUtensils,
  FaCoffee,
  FaDumbbell,
  FaSwimmer,
  FaHospital,
  FaSchool,
  FaUniversity,
  FaShieldAlt,
  FaMosque,
  FaChurch,
  FaFilm,
  FaLandmark,
  FaMoneyBillWave,
  FaCar,
  FaTaxi,
} from "react-icons/fa";
import {
  MdLocalGroceryStore,
  MdLocalPharmacy,
  MdLocalHospital,
  MdFastfood,
} from "react-icons/md";
import { GiGymBag } from "react-icons/gi";
import { PiFilmReelFill } from "react-icons/pi";

//  Configuration des POIs - utilisation de IconType
export const POI_CATEGORIES: Record<
  string,
  {
    icon: IconType;
    color: string;
    label: string;
    searchTerms: string[];
    maxDistance: number;
  }
> = {
  beach: {
    icon: FaUmbrellaBeach,
    color: "#0ea5e9",
    label: "Plage",
    searchTerms: ["beach", "plage"],
    maxDistance: 10,
  },
  supermarket: {
    icon: MdLocalGroceryStore,
    color: "#10b981",
    label: "Supermarché",
    searchTerms: ["supermarket", "grocery"],
    maxDistance: 3,
  },
  restaurant: {
    icon: FaUtensils,
    color: "#ef4444",
    label: "Restaurant",
    searchTerms: ["restaurant", "fast food"],
    maxDistance: 2,
  },
  cafe: {
    icon: FaCoffee,
    color: "#f59e0b",
    label: "Café",
    searchTerms: ["cafe", "coffee"],
    maxDistance: 2,
  },
  pharmacy: {
    icon: FaPills,
    color: "#ec489a",
    label: "Pharmacie",
    searchTerms: ["pharmacy"],
    maxDistance: 3,
  },
  hospital: {
    icon: FaHospital,
    color: "#ef4444",
    label: "Hôpital",
    searchTerms: ["hospital"],
    maxDistance: 10,
  },
  school: {
    icon: FaSchool,
    color: "#14b8a6",
    label: "École",
    searchTerms: ["school"],
    maxDistance: 5,
  },
  university: {
    icon: FaUniversity,
    color: "#8b5cf6",
    label: "Université",
    searchTerms: ["university"],
    maxDistance: 10,
  },
  bank: {
    icon: FaLandmark,
    color: "#f59e0b",
    label: "Banque",
    searchTerms: ["bank"],
    maxDistance: 5,
  },
  atm: {
    icon: FaMoneyBillWave,
    color: "#f59e0b",
    label: "Distributeur",
    searchTerms: ["atm"],
    maxDistance: 2,
  },
  station: {
    icon: FaTrain,
    color: "#64748b",
    label: "Gare",
    searchTerms: ["station", "train"],
    maxDistance: 10,
  },
  bus: {
    icon: FaBus,
    color: "#64748b",
    label: "Arrêt bus",
    searchTerms: ["bus"],
    maxDistance: 1,
  },
  taxi: {
    icon: FaTaxi,
    color: "#f97316",
    label: "Taxi",
    searchTerms: ["taxi"],
    maxDistance: 3,
  },
  parking: {
    icon: FaParking,
    color: "#6b7280",
    label: "Parking",
    searchTerms: ["parking"],
    maxDistance: 1,
  },
  park: {
    icon: FaTree,
    color: "#22c55e",
    label: "Parc",
    searchTerms: ["park"],
    maxDistance: 3,
  },
  gym: {
    icon: FaDumbbell,
    color: "#8b5cf6",
    label: "Salle de sport",
    searchTerms: ["gym", "fitness"],
    maxDistance: 5,
  },
  pool: {
    icon: FaSwimmer,
    color: "#06b6d4",
    label: "Piscine",
    searchTerms: ["pool", "swimming"],
    maxDistance: 5,
  },
  cinema: {
    icon: FaFilm,
    color: "#a855f7",
    label: "Cinéma",
    searchTerms: ["cinema", "movie"],
    maxDistance: 10,
  },
  mosque: {
    icon: FaMosque,
    color: "#10b981",
    label: "Mosquée",
    searchTerms: ["mosque"],
    maxDistance: 3,
  },
  church: {
    icon: FaChurch,
    color: "#f59e0b",
    label: "Église",
    searchTerms: ["church"],
    maxDistance: 3,
  },
  police: {
    icon: FaShieldAlt,
    color: "#3b82f6",
    label: "Commissariat",
    searchTerms: ["police"],
    maxDistance: 10,
  },
  fuel: {
    icon: FaGasPump,
    color: "#f97316",
    label: "Station essence",
    searchTerms: ["fuel", "gas"],
    maxDistance: 5,
  },
};

// Interface pour un POI
export interface POIItem {
  id: string;
  lat: number;
  lon: number;
  name: string;
  category: string;
  icon: IconType;
  color: string;
  distance: number;
}

// Fonction pour chercher les POIs autour d'une position
export async function fetchNearbyPOIs(
  lat: number,
  lng: number,
  maxDistanceKm: number = 3,
): Promise<POIItem[]> {
  const radiusMeters = maxDistanceKm * 1000;

  const overpassQuery = `
    [out:json];
    (
      node["leisure"="park"](around:${radiusMeters},${lat},${lng});
      node["shop"="supermarket"](around:${radiusMeters},${lat},${lng});
      node["amenity"="restaurant"](around:${radiusMeters},${lat},${lng});
      node["amenity"="cafe"](around:${radiusMeters},${lat},${lng});
      node["amenity"="pharmacy"](around:${radiusMeters},${lat},${lng});
      node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      node["amenity"="school"](around:${radiusMeters},${lat},${lng});
      node["amenity"="bank"](around:${radiusMeters},${lat},${lng});
      node["amenity"="fuel"](around:${radiusMeters},${lat},${lng});
      node["railway"="station"](around:${radiusMeters},${lat},${lng});
      node["highway"="bus_stop"](around:${radiusMeters},${lat},${lng});
      node["amenity"="parking"](around:${radiusMeters},${lat},${lng});
      node["natural"="beach"](around:${radiusMeters},${lat},${lng});
      node["amenity"="cinema"](around:${radiusMeters},${lat},${lng});
      node["amenity"="place_of_worship"](around:${radiusMeters},${lat},${lng});
      node["amenity"="police"](around:${radiusMeters},${lat},${lng});
    );
    out body;
  `;

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: overpassQuery,
      headers: { "Content-Type": "text/plain" },
    });

    const data = await response.json();
    const pois: POIItem[] = [];
    const seen = new Set();

    for (const element of data.elements) {
      let category = "supermarket";
      const tags = element.tags || {};

      if (tags.natural === "beach") category = "beach";
      else if (tags.leisure === "park") category = "park";
      else if (tags.shop === "supermarket") category = "supermarket";
      else if (tags.amenity === "restaurant") category = "restaurant";
      else if (tags.amenity === "cafe") category = "cafe";
      else if (tags.amenity === "pharmacy") category = "pharmacy";
      else if (tags.amenity === "hospital") category = "hospital";
      else if (tags.amenity === "school") category = "school";
      else if (tags.amenity === "bank") category = "bank";
      else if (tags.amenity === "fuel") category = "fuel";
      else if (tags.railway === "station") category = "station";
      else if (tags.highway === "bus_stop") category = "bus";
      else if (tags.amenity === "parking") category = "parking";
      else if (tags.amenity === "cinema") category = "cinema";
      else if (tags.amenity === "police") category = "police";
      else if (tags.amenity === "place_of_worship") {
        if (tags.religion === "muslim") category = "mosque";
        else category = "church";
      } else continue;

      const config = POI_CATEGORIES[category];
      if (!config) continue;

      const name = tags.name || tags.brand || config.label;
      const key = `${category}-${name}`;

      if (seen.has(key)) continue;
      seen.add(key);

      const distance = calculateDistance(lat, lng, element.lat, element.lon);

      if (distance > config.maxDistance) continue;

      pois.push({
        id: `${category}-${element.id}`,
        lat: element.lat,
        lon: element.lon,
        name: name,
        category: category,
        icon: config.icon,
        color: config.color,
        distance: parseFloat(distance.toFixed(2)),
      });
    }

    return pois.sort((a, b) => a.distance - b.distance).slice(0, 30);
  } catch (error) {
    console.error("Erreur lors de la recherche des POIs:", error);
    return [];
  }
}

// Calcul de la distance entre deux points en km
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
