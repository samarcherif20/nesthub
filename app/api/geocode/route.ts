// app/api/geocode/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "L'adresse est requise" },
        { status: 400 }
      );
    }

    console.log(" [GEOCODE] Recherche pour:", address);

    // Utiliser Nominatim (OpenStreetMap) avec un User-Agent
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5&countrycodes=tn&addressdetails=1`,
      {
        headers: {
          "User-Agent": "NestHub-App/1.0",
          "Accept-Language": "fr",
        },
        next: { revalidate: 0 },
      }
    );

    if (!response.ok) {
      console.error(" [GEOCODE] Erreur HTTP:", response.status);
      return NextResponse.json(
        { error: "Erreur lors du géocodage" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("📡 [GEOCODE] Résultats:", data?.length || 0);

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Aucun résultat trouvé" },
        { status: 404 }
      );
    }

    const results = data.map((item: any) => ({
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      displayName: item.display_name,
      type: item.type,
      importance: item.importance,
    }));

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
    });
  } catch (error) {
    console.error(" [GEOCODE] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}