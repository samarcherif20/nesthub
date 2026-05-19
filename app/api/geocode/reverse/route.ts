import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  console.log(" [API] Reverse geocoding appelé:", { lat, lng });

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat et lng requis" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    //  Augmenter le zoom pour plus de précision
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=fr`,
      {
        headers: {
          'User-Agent': 'NestHubApp/1.0 (contact@nesthub.com)',
          'Accept-Language': 'fr',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        address: {
          governorate: "",
          delegation: "",
          street: "",
          fullAddress: `${lat}, ${lng}`,
        },
      });
    }

    const data = await response.json();
    const address = data.address || {};

    console.log(" Nominatim address details:", address);

    //  Extraire une rue plus précise
    let street = "";
    
    // Essayer différents champs possibles pour la rue
    if (address.road) street = address.road;
    else if (address.pedestrian) street = address.pedestrian;
    else if (address.footway) street = address.footway;
    else if (address.path) street = address.path;
    else if (address.residential) street = address.residential;
    else if (address.street) street = address.street;
    
    // Si pas de rue, essayer le nom du quartier
    if (!street && address.suburb) street = address.suburb;
    if (!street && address.neighbourhood) street = address.neighbourhood;
    if (!street && address.hamlet) street = address.hamlet;
    
    //  Extraire le nom du lieu comme fallback
    if (!street && data.display_name) {
      const parts = data.display_name.split(",");
      // Prendre le premier élément (souvent le nom du lieu)
      street = parts[0]?.trim() || "";
      // Enlever les chiffres si c'est juste un numéro
      if (street.match(/^\d+$/)) {
        street = parts[1]?.trim() || "";
      }
    }

    //  Nettoyer le gouvernorat
    let governorate = address.state || address.region || address.province || "";
    governorate = governorate.replace(/^Gouvernorat\s+/i, "");
    
    //  Délégation
    let delegation = address.city || address.town || address.village || address.district || address.suburb || "";

    console.log(" Résultat final:", { governorate, delegation, street });

    return NextResponse.json({
      success: true,
      address: {
        governorate,
        delegation,
        street,
        fullAddress: data.display_name || `${street}, ${delegation}, ${governorate}`,
      },
    });
  } catch (error) {
    console.error(" Reverse geocoding error:", error);
    return NextResponse.json({
      success: true,
      address: {
        governorate: "",
        delegation: "",
        street: "",
        fullAddress: `${lat}, ${lng}`,
      },
    });
  }
}