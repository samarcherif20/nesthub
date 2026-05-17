import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      governorate,
      type,
      rooms,
      bathrooms,
      surfaceArea,
      equipment,
      hasBalcony,
      hasGarden,
      hasGarage,
      hasElevator,
      isFurnished,
      rentalType,
    } = body;

    // ========== RECHERCHE D'ANNONCES SIMILAIRES ==========
    const similarListings = await prisma.listing.findMany({
      where: {
        status: "ACTIVE",
        governorate: governorate,
        type: type,
        pricePerNight: { not: null, gt: 0, lt: 500 },
      },
      select: {
        pricePerNight: true,
        pricePerMonth: true,
        rooms: true,
        surfaceArea: true,
        isFurnished: true,
      },
      take: 10,
    });

    // Construire le contexte du marché
    let marketContext = "";
    if (similarListings.length > 0) {
      const prices = similarListings
        .map((l) => l.pricePerNight)
        .filter(Boolean);
      const avgPrice =
        prices.length > 0
          ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
          : 0;
      marketContext = `Prix moyen dans la zone: environ ${avgPrice} TND par nuit.`;
    } else {
      marketContext =
        "Aucune annonce similaire trouvée en base. Utilise ta connaissance du marché tunisien.";
    }

    const equipmentList = equipment
      ? Object.entries(equipment)
          .filter(([, v]) => v)
          .map(([k]) => k)
          .join(", ") || "aucun"
      : "aucun";

    // ========== PROMPT SIMPLIFIÉ ==========
    const prompt = `Estime le prix de location pour ce bien en Tunisie:

Gouvernorat: ${governorate}
Type: ${type}
Chambres: ${rooms}
Surface: ${surfaceArea || 70} m²
Meublé: ${isFurnished ? "oui" : "non"}
Équipements: ${equipmentList}
Balcon: ${hasBalcony ? "oui" : "non"}
Jardin: ${hasGarden ? "oui" : "non"}
Garage: ${hasGarage ? "oui" : "non"}

${marketContext}

Règles de prix TUNISIE:
- Prix nuit: entre 40 et 250 TND
- Prix mois: entre 300 et 1500 TND (environ 10x le prix nuit)
- Zones chères: Tunis, Sousse, Hammamet, Djerba (+20%)
- Zones modérées: Nabeul, Monastir, Sfax (prix moyen)
- Zones économiques: intérieur du pays (-20%)

Réponds UNIQUEMENT au format JSON:
${rentalType === "SHORT_TERM" ? `{"pricePerNight": 80}` : rentalType === "LONG_TERM" ? `{"pricePerMonth": 600}` : `{"pricePerNight": 80, "pricePerMonth": 600}`}`;

    // ========== APPEL GEMINI ==========
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY manquante");
      // Fallback: prix par défaut
      return NextResponse.json({
        success: true,
        pricePerNight: rentalType !== "LONG_TERM" ? 70 : null,
        pricePerMonth: rentalType !== "SHORT_TERM" ? 650 : null,
        currency: "TND",
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 150,
          },
        }),
      },
    );

    const data = await response.json();

    // Extraction de la réponse
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!text) {
      throw new Error("Gemini réponse vide");
    }

    // Nettoyer et parser le JSON
    const clean = text.replace(/```json|```/g, "").trim();
    const jsonMatch = clean.match(/\{[\s\S]*?\}/);

    if (!jsonMatch) {
      throw new Error("JSON non trouvé");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validation et bornage des prix
    let pricePerNight = parsed.pricePerNight ?? null;
    let pricePerMonth = parsed.pricePerMonth ?? null;

    if (pricePerNight) {
      pricePerNight = Math.min(
        300,
        Math.max(30, Math.round(pricePerNight / 5) * 5),
      );
    }
    if (pricePerMonth) {
      pricePerMonth = Math.min(
        1500,
        Math.max(300, Math.round(pricePerMonth / 50) * 50),
      );
    }

    return NextResponse.json({
      success: true,
      pricePerNight: pricePerNight,
      pricePerMonth: pricePerMonth,
      currency: "TND",
    });
  } catch (error) {
    console.error("Erreur IA:", error);
    // Fallback en cas d'erreur
    return NextResponse.json({
      success: true,
      pricePerNight: 70,
      pricePerMonth: 650,
      currency: "TND",
    });
  }
}
