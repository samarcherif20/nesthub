// app/api/listings/[id]/pois/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const searchParams = req.nextUrl.searchParams;
    const radius = parseInt(searchParams.get("radius") || "2000");

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { latitude: true, longitude: true, title: true },
    });

    if (!listing?.latitude || !listing?.longitude) {
      return NextResponse.json(
        { error: "Coordonnées non disponibles" },
        { status: 404 },
      );
    }

    const lat = listing.latitude;
    const lng = listing.longitude;

    // Boîte de délimitation en degrés
    const latMin = lat - radius / 111000;
    const latMax = lat + radius / 111000;
    const lngMin = lng - radius / (111000 * Math.cos((lat * Math.PI) / 180));
    const lngMax = lng + radius / (111000 * Math.cos((lat * Math.PI) / 180));

    // Requête Overpass unifiée pour tous les types de POIs
    const query = `[out:json];
    (
      node(${latMin},${lngMin},${latMax},${lngMax})["amenity"="restaurant"];
      node(${latMin},${lngMin},${latMax},${lngMax})["amenity"="cafe"];
      node(${latMin},${lngMin},${latMax},${lngMax})["shop"="supermarket"];
      node(${latMin},${lngMin},${latMax},${lngMax})["amenity"="pharmacy"];
      node(${latMin},${lngMin},${latMax},${lngMax})["amenity"="hospital"];
      node(${latMin},${lngMin},${latMax},${lngMax})["leisure"="park"];
      node(${latMin},${lngMin},${latMax},${lngMax})["amenity"="bank"];
      node(${latMin},${lngMin},${latMax},${lngMax})["amenity"="fuel"];
      node(${latMin},${lngMin},${latMax},${lngMax})["natural"="beach"];
      node(${latMin},${lngMin},${latMax},${lngMax})["tourism"="attraction"];
      node(${latMin},${lngMin},${latMax},${lngMax})["amenity"="fast_food"];
      node(${latMin},${lngMin},${latMax},${lngMax})["amenity"="school"];
      node(${latMin},${lngMin},${latMax},${lngMax})["amenity"="university"];
      node(${latMin},${lngMin},${latMax},${lngMax})["amenity"="police"];
      node(${latMin},${lngMin},${latMax},${lngMax})["amenity"="parking"];
    );
    out body;`;

    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    console.log("🔍 Requête Overpass:", overpassUrl);

    const response = await fetch(overpassUrl, {
      headers: {
        "User-Agent": "NestHub-App/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();

    // Mapping des catégories
    const categoryMap: Record<
      string,
      { icon: string; color: string; category: string }
    > = {
      restaurant: { icon: "🍽️", color: "#ef4444", category: "restaurant" },
      cafe: { icon: "☕", color: "#8b5cf6", category: "cafe" },
      fast_food: { icon: "🍔", color: "#f97316", category: "restaurant" },
      supermarket: { icon: "🛒", color: "#10b981", category: "supermarket" },
      pharmacy: { icon: "💊", color: "#ec489a", category: "pharmacy" },
      hospital: { icon: "🏥", color: "#3b82f6", category: "hospital" },
      park: { icon: "🌳", color: "#22c55e", category: "park" },
      bank: { icon: "🏦", color: "#6366f1", category: "bank" },
      fuel: { icon: "⛽", color: "#f97316", category: "fuel" },
      beach: { icon: "🏖️", color: "#0ea5e9", category: "beach" },
      attraction: { icon: "🎯", color: "#f59e0b", category: "attraction" },
      school: { icon: "🏫", color: "#14b8a6", category: "school" },
      university: { icon: "🎓", color: "#14b8a6", category: "school" },
      police: { icon: "👮", color: "#1e293b", category: "police" },
      parking: { icon: "🅿️", color: "#6b7280", category: "parking" },
    };

    const allPOIs: any[] = [];
    const seen = new Set();

    if (data.elements) {
      for (const element of data.elements) {
        // Déterminer le type de POI
        let poiType = "";
        if (element.tags.amenity === "restaurant") poiType = "restaurant";
        else if (element.tags.amenity === "cafe") poiType = "cafe";
        else if (element.tags.amenity === "fast_food") poiType = "fast_food";
        else if (element.tags.shop === "supermarket") poiType = "supermarket";
        else if (element.tags.amenity === "pharmacy") poiType = "pharmacy";
        else if (element.tags.amenity === "hospital") poiType = "hospital";
        else if (element.tags.leisure === "park") poiType = "park";
        else if (element.tags.amenity === "bank") poiType = "bank";
        else if (element.tags.amenity === "fuel") poiType = "fuel";
        else if (element.tags.natural === "beach") poiType = "beach";
        else if (element.tags.tourism === "attraction") poiType = "attraction";
        else if (element.tags.amenity === "school") poiType = "school";
        else if (element.tags.amenity === "university") poiType = "university";
        else if (element.tags.amenity === "police") poiType = "police";
        else if (element.tags.amenity === "parking") poiType = "parking";
        else continue;

        const config = categoryMap[poiType];
        if (!config) continue;

        // Éviter les doublons
        const uniqueKey = `${poiType}_${element.id}`;
        if (seen.has(uniqueKey)) continue;
        seen.add(uniqueKey);

        // Calcul de la distance en km
        const R = 6371;
        const dLat = ((element.lat - lat) * Math.PI) / 180;
        const dLng = ((element.lon - lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat * Math.PI) / 180) *
            Math.cos((element.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        // Limiter au rayon demandé
        if (distance * 1000 > radius) continue;

        allPOIs.push({
          id: uniqueKey,
          lat: element.lat,
          lon: element.lon,
          name:
            element.tags.name ||
            element.tags.brand ||
            config.category.charAt(0).toUpperCase() + config.category.slice(1),
          category: config.category,
          icon: config.icon,
          color: config.color,
          distance: parseFloat(distance.toFixed(2)),
          duration: Math.round(distance * 12),
        });
      }
    }

    // Trier par distance et limiter
    const sortedPOIs = allPOIs
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 30);

    console.log(`✅ ${sortedPOIs.length} POIs trouvés`);

    return NextResponse.json({
      success: true,
      center: { lat, lng },
      pois: sortedPOIs,
      total: sortedPOIs.length,
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
