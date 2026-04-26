// lib/services/poi.service.ts
export interface POI {
  id: string;
  lat: number;
  lon: number;
  name: string;
  type: string;
  category: string;
  icon: string;
  color: string;
  distance?: number; // km
  duration?: {
    walking: number; // minutes
    driving: number; // minutes
  };
}

export interface RouteInfo {
  distance: number; // km
  duration: number; // minutes
  polyline: string; // Encoded polyline pour le tracé
}

const POI_CATEGORIES: Record<
  string,
  { icon: string; color: string; label: string; searchTerms: string[] }
> = {
  beach: {
    icon: "🏖️",
    color: "#0ea5e9",
    label: "Plage",
    searchTerms: ["beach", "plage", "sea", "mer"],
  },
  sea: {
    icon: "🌊",
    color: "#0284c7",
    label: "Mer",
    searchTerms: ["sea", "mer", "ocean", "océan"],
  },
  supermarket: {
    icon: "🛒",
    color: "#f59e0b",
    label: "Supermarché",
    searchTerms: ["supermarket", "marché", "grocery", "épicerie"],
  },
  restaurant: {
    icon: "🍽️",
    color: "#ec4899",
    label: "Restaurant",
    searchTerms: ["restaurant", "café", "bistro"],
  },
  pharmacy: {
    icon: "💊",
    color: "#8b5cf6",
    label: "Pharmacie",
    searchTerms: ["pharmacy", "pharmacie"],
  },
  hospital: {
    icon: "🏥",
    color: "#ef4444",
    label: "Hôpital",
    searchTerms: ["hospital", "hôpital", "clinic"],
  },
  school: {
    icon: "🏫",
    color: "#10b981",
    label: "École",
    searchTerms: ["school", "école", "college"],
  },
  university: {
    icon: "🎓",
    color: "#8b5cf6",
    label: "Université",
    searchTerms: ["university", "université"],
  },
  bank: {
    icon: "🏦",
    color: "#f59e0b",
    label: "Banque",
    searchTerms: ["bank", "banque"],
  },
  atm: {
    icon: "💳",
    color: "#f59e0b",
    label: "Distributeur",
    searchTerms: ["atm", "distributeur"],
  },
  station: {
    icon: "🚉",
    color: "#3b82f6",
    label: "Gare",
    searchTerms: ["station", "gare", "train"],
  },
  bus: {
    icon: "🚏",
    color: "#3b82f6",
    label: "Arrêt bus",
    searchTerms: ["bus", "bus stop"],
  },
  metro: {
    icon: "🚇",
    color: "#3b82f6",
    label: "Métro",
    searchTerms: ["metro", "subway", "métro"],
  },
  taxi: { icon: "🚕", color: "#f97316", label: "Taxi", searchTerms: ["taxi"] },
  park: {
    icon: "🌳",
    color: "#10b981",
    label: "Parc",
    searchTerms: ["park", "parc", "jardin"],
  },
  gym: {
    icon: "💪",
    color: "#ef4444",
    label: "Salle de sport",
    searchTerms: ["gym", "sport", "fitness"],
  },
  pool: {
    icon: "🏊",
    color: "#0ea5e9",
    label: "Piscine",
    searchTerms: ["pool", "piscine", "swimming"],
  },
  cinema: {
    icon: "🎬",
    color: "#8b5cf6",
    label: "Cinéma",
    searchTerms: ["cinema", "cinéma", "movie"],
  },
  mosque: {
    icon: "🕌",
    color: "#10b981",
    label: "Mosquée",
    searchTerms: ["mosque", "mosquée"],
  },
  church: {
    icon: "⛪",
    color: "#8b5cf6",
    label: "Église",
    searchTerms: ["church", "église"],
  },
  police: {
    icon: "👮",
    color: "#3b82f6",
    label: "Commissariat",
    searchTerms: ["police"],
  },
  fuel: {
    icon: "⛽",
    color: "#f97316",
    label: "Station essence",
    searchTerms: ["fuel", "essence", "gazole"],
  },
};

export async function fetchNearbyPOIs(
  lat: number,
  lng: number,
  radius: number = 2000,
): Promise<POI[]> {
  const queries = Object.entries(POI_CATEGORIES)
    .map(([key, config]) => {
      const terms = config.searchTerms.map((term) => `"${term}"`).join("|");
      return `(node["name"~"${terms}"](around:${radius},${lat},${lng}); way["name"~"${terms}"](around:${radius},${lat},${lng});)`;
    })
    .join("");

  const overpassQuery = `
    [out:json];
    (
      ${queries}
      node["leisure"="park"](around:${radius},${lat},${lng});
      node["tourism"="attraction"](around:${radius},${lat},${lng});
      node["shop"="supermarket"](around:${radius},${lat},${lng});
      node["amenity"="restaurant"](around:${radius},${lat},${lng});
      node["amenity"="cafe"](around:${radius},${lat},${lng});
      node["amenity"="pharmacy"](around:${radius},${lat},${lng});
      node["amenity"="hospital"](around:${radius},${lat},${lng});
      node["amenity"="school"](around:${radius},${lat},${lng});
      node["amenity"="university"](around:${radius},${lat},${lng});
      node["amenity"="bank"](around:${radius},${lat},${lng});
      node["amenity"="atm"](around:${radius},${lat},${lng});
      node["amenity"="fuel"](around:${radius},${lat},${lng});
      node["railway"="station"](around:${radius},${lat},${lng});
      node["highway"="bus_stop"](around:${radius},${lat},${lng});
      node["station"="subway"](around:${radius},${lat},${lng});
      node["amenity"="parking"](around:${radius},${lat},${lng});
      node["leisure"="fitness_centre"](around:${radius},${lat},${lng});
      node["leisure"="swimming_pool"](around:${radius},${lat},${lng});
      node["amenity"="cinema"](around:${radius},${lat},${lng});
      node["amenity"="place_of_worship"](around:${radius},${lat},${lng});
      node["amenity"="police"](around:${radius},${lat},${lng});
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

    const pois: POI[] = [];
    const seen = new Set();

    for (const element of data.elements) {
      const lat = element.lat;
      const lon = element.lon;

      let category = "other";
      for (const [key, config] of Object.entries(POI_CATEGORIES)) {
        if (element.tags) {
          const tags = Object.values(element.tags).join(" ").toLowerCase();
          if (config.searchTerms.some((term) => tags.includes(term))) {
            category = key;
            break;
          }
        }
      }

      const name =
        element.tags?.name ||
        element.tags?.brand ||
        POI_CATEGORIES[category]?.label ||
        "Point d'intérêt";
      const key = `${category}-${name}`;

      if (!seen.has(key)) {
        seen.add(key);
        const config = POI_CATEGORIES[category] || POI_CATEGORIES.supermarket;

        pois.push({
          id: `${category}-${element.id}`,
          lat: lat,
          lon: lon,
          name: name,
          type: category,
          category: category,
          icon: config.icon,
          color: config.color,
          distance: calculateDistance(lat, lon, lat, lng),
        });
      }
    }

    return pois
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, 20);
  } catch (error) {
    console.error("Error fetching POIs:", error);
    return [];
  }
}

export async function getRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  mode: "walking" | "driving" = "walking",
): Promise<RouteInfo | null> {
  try {
    const profile = mode === "walking" ? "foot" : "drive";
    const url = `https://router.project-osrm.org/route/v1/${profile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=polyline`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.code === "Ok" && data.routes?.[0]) {
      const route = data.routes[0];
      return {
        distance: route.distance / 1000, // km
        duration: Math.round(route.duration / 60), // minutes
        polyline: route.geometry,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching route:", error);
    return null;
  }
}

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
