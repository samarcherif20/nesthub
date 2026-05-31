import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API_URL = "https://models.inference.ai.azure.com/chat/completions";
const MODEL_NAME = "gpt-4o-mini";

// Prix de référence par région (TND/nuit)
const REGION_PRICES: Record<string, { min: number; max: number; avg: number }> =
  {
    Tunis: { min: 80, max: 500, avg: 200 },
    Ariana: { min: 70, max: 450, avg: 180 },
    "Ben Arous": { min: 70, max: 450, avg: 180 },
    Sousse: { min: 60, max: 400, avg: 150 },
    Hammamet: { min: 70, max: 450, avg: 180 },
    Nabeul: { min: 60, max: 400, avg: 150 },
    Monastir: { min: 55, max: 380, avg: 140 },
    Mahdia: { min: 50, max: 350, avg: 130 },
    Sfax: { min: 50, max: 350, avg: 120 },
    Djerba: { min: 65, max: 420, avg: 160 },
    Tozeur: { min: 55, max: 380, avg: 140 },
    Tabarka: { min: 60, max: 400, avg: 150 },
    Bizerte: { min: 50, max: 350, avg: 130 },
    default: { min: 50, max: 300, avg: 100 },
  };

// Points d'intérêt en Tunisie pour les calculs de distance
const POINTS_OF_INTEREST = {
  plages: {
    "Plage Hammamet": { lat: 36.4, lng: 10.6167 },
    "Plage Sousse": { lat: 35.8333, lng: 10.6333 },
    "Plage Mahdia": { lat: 35.5, lng: 11.0667 },
    "Plage Monastir": { lat: 35.7667, lng: 10.8333 },
    "Plage Djerba": { lat: 33.8, lng: 10.85 },
    "Plage Tabarka": { lat: 36.95, lng: 8.75 },
    "Plage Nabeul": { lat: 36.45, lng: 10.7333 },
    "Plage La Marsa": { lat: 36.8667, lng: 10.3333 },
    "Plage Gammarth": { lat: 36.9, lng: 10.2833 },
    "Plage Sidi Bou Said": { lat: 36.8667, lng: 10.35 },
  },
  centres: {
    "Tunis Centre": { lat: 36.8065, lng: 10.1815 },
    "Sfax Centre": { lat: 34.7333, lng: 10.7667 },
    "Sousse Centre": { lat: 35.8333, lng: 10.6333 },
    "Hammamet Centre": { lat: 36.4, lng: 10.6167 },
    "Djerba Centre": { lat: 33.8, lng: 10.85 },
    "Monastir Centre": { lat: 35.7667, lng: 10.8333 },
    "Nabeul Centre": { lat: 36.45, lng: 10.7333 },
  },
  aeroports: {
    "Aéroport Tunis-Carthage": { lat: 36.851, lng: 10.2272 },
    "Aéroport Monastir": { lat: 35.7583, lng: 10.7547 },
    "Aéroport Djerba": { lat: 33.875, lng: 10.7755 },
    "Aéroport Enfidha": { lat: 36.0758, lng: 10.4386 },
    "Aéroport Tabarka": { lat: 36.98, lng: 8.8769 },
  },
};

// Calcul de distance entre deux points (km)
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Trouver la plage la plus proche
function getNearestBeach(
  lat: number,
  lng: number,
): { name: string; distance: number } {
  let nearest = { name: "Aucune", distance: Infinity };
  for (const [name, coords] of Object.entries(POINTS_OF_INTEREST.plages)) {
    const distance = calculateDistance(lat, lng, coords.lat, coords.lng);
    if (distance < nearest.distance) {
      nearest = { name, distance };
    }
  }
  return nearest;
}

// Trouver le centre-ville le plus proche
function getNearestCityCenter(
  lat: number,
  lng: number,
): { name: string; distance: number } {
  let nearest = { name: "Aucun", distance: Infinity };
  for (const [name, coords] of Object.entries(POINTS_OF_INTEREST.centres)) {
    const distance = calculateDistance(lat, lng, coords.lat, coords.lng);
    if (distance < nearest.distance) {
      nearest = { name, distance };
    }
  }
  return nearest;
}

// Trouver l'aéroport le plus proche
function getNearestAirport(
  lat: number,
  lng: number,
): { name: string; distance: number } {
  let nearest = { name: "Aucun", distance: Infinity };
  for (const [name, coords] of Object.entries(POINTS_OF_INTEREST.aeroports)) {
    const distance = calculateDistance(lat, lng, coords.lat, coords.lng);
    if (distance < nearest.distance) {
      nearest = { name, distance };
    }
  }
  return nearest;
}

// Mapping des équipements vers français
const EQUIPMENT_FR: Record<string, string> = {
  wifi: "Wi-Fi",
  parking: "Parking",
  swimmingPool: "Piscine",
  airConditioning: "Climatisation",
  kitchen: "Cuisine équipée",
  tv: "Télévision",
  heating: "Chauffage",
  washingMachine: "Machine à laver",
  dryer: "Sèche-linge",
  dishwasher: "Lave-vaisselle",
  balcony: "Balcon",
  garden: "Jardin",
  elevator: "Ascenseur",
  gym: "Salle de sport",
  jacuzzi: "Jacuzzi",
  fireplace: "Cheminée",
  barbecue: "Barbecue",
  concierge: "Conciergerie",
  beachAccess: "Accès plage",
  seaView: "Vue mer",
};

function formatAmenities(equipment: any): string[] {
  if (!equipment) return [];
  if (Array.isArray(equipment)) return equipment;
  return Object.keys(equipment)
    .filter((k) => equipment[k] === true)
    .map((k) => EQUIPMENT_FR[k] || k);
}

function formatServices(services: any): string[] {
  if (!services) return [];
  if (Array.isArray(services)) return services;
  if (typeof services === "object") {
    return Object.keys(services).filter((k) => services[k] === true);
  }
  return [];
}

function formatHouseRules(rules: any): string[] {
  if (!rules) return [];
  if (Array.isArray(rules)) return rules;
  if (typeof rules === "object") {
    return Object.keys(rules).filter((k) => rules[k] === true);
  }
  return [];
}

function getRegionPrice(governorate: string) {
  return REGION_PRICES[governorate] || REGION_PRICES.default;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { prompt, listingIds } = await req.json();

    if (!listingIds || listingIds.length === 0) {
      return NextResponse.json(
        { error: "Aucun logement à comparer" },
        { status: 400 },
      );
    }

    // 1. Récupérer les listings depuis Prisma
    const listings = await prisma.listing.findMany({
      where: { id: { in: listingIds }, status: "ACTIVE" },
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
            isIdentityVerified: true,
            isEmailVerified: true,
            isPhoneVerified: true,
            vacationMode: true,
            stats: true,
          },
        },
        photos: {
          take: 5,
          orderBy: { position: "asc" },
        },
        favorites: true,
        stats: {
          orderBy: { date: "desc" },
          take: 30,
        },
        bookings: {
          where: {
            review: { isNot: null },
            status: { in: ["COMPLETED", "CONFIRMED"] },
          },
          include: {
            review: {
              select: { rating: true, comment: true, createdAt: true },
            },
          },
        },
      },
    });

    if (listings.length === 0) {
      return NextResponse.json(
        { error: "Aucun logement trouvé" },
        { status: 404 },
      );
    }

    // 2. Calculer les métriques pour chaque listing avec les distances
    const enrichedListings = listings.map((listing) => {
      const regionPrice = getRegionPrice(listing.governorate);

      const reviews = listing.bookings
        .filter((b) => b.review !== null)
        .map((b) => b.review);

      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + (r?.rating || 0), 0) /
            reviews.length
          : 0;

      const recentViews =
        listing.stats?.reduce((sum, s) => sum + s.views, 0) || 0;
      const viewTrend =
        recentViews > 100
          ? "croissante"
          : recentViews > 50
            ? "stable"
            : "décroissante";
      const conversionRate =
        listing.viewCount > 0
          ? (listing.bookingCount / listing.viewCount) * 100
          : 0;

      const priceScore = listing.pricePerNight
        ? listing.pricePerNight <= regionPrice.avg * 0.8
          ? "excellent"
          : listing.pricePerNight <= regionPrice.avg
            ? "bon"
            : listing.pricePerNight <= regionPrice.avg * 1.2
              ? "correct"
              : "élevé"
        : "non défini";

      //  Calcul des distances
      let nearestBeach = null;
      let distanceToBeach = null;
      let nearestCity = null;
      let distanceToCity = null;
      let nearestAirport = null;
      let distanceToAirport = null;
      let beachProximityCategory = "Non spécifié";

      if (listing.latitude && listing.longitude) {
        const beach = getNearestBeach(listing.latitude, listing.longitude);
        nearestBeach = beach.name;
        distanceToBeach = beach.distance;

        const city = getNearestCityCenter(listing.latitude, listing.longitude);
        nearestCity = city.name;
        distanceToCity = city.distance;

        const airport = getNearestAirport(listing.latitude, listing.longitude);
        nearestAirport = airport.name;
        distanceToAirport = airport.distance;

        if (distanceToBeach <= 1)
          beachProximityCategory = "Front de mer (<1km)";
        else if (distanceToBeach <= 3)
          beachProximityCategory = "Très proche plage (1-3km)";
        else if (distanceToBeach <= 5)
          beachProximityCategory = "Proche plage (3-5km)";
        else if (distanceToBeach <= 10)
          beachProximityCategory = "À proximité plage (5-10km)";
        else beachProximityCategory = "Éloigné de la plage (>10km)";
      }

      const servicesList = formatServices(listing.services);
      const houseRulesList = formatHouseRules(listing.houseRules);

      return {
        id: listing.id,
        title: listing.title,
        description: listing.description,
        type: listing.type,
        governorate: listing.governorate,
        delegation: listing.delegation,
        latitude: listing.latitude,
        longitude: listing.longitude,
        hasCoordinates: !!(listing.latitude && listing.longitude),
        rooms: listing.rooms,
        bathrooms: listing.bathrooms,
        maxGuests: listing.maxGuests,
        surfaceArea: listing.surfaceArea,
        floorNumber: listing.floorNumber,
        hasElevator: listing.hasElevator,
        hasBalcony: listing.hasBalcony,
        hasGarden: listing.hasGarden,
        hasGarage: listing.hasGarage,
        numberOfKitchens: listing.numberOfKitchens,
        isFurnished: listing.isFurnished,
        petsAllowed: listing.petsAllowed,
        smokingAllowed: listing.smokingAllowed,
        rentalType: listing.rentalType,
        pricePerNight: listing.pricePerNight,
        pricePerMonth: listing.pricePerMonth,
        securityDeposit: listing.securityDeposit,
        cleaningFee: listing.cleaningFee,
        weekendPriceMultiplier: listing.weekendPriceMultiplier,
        amenities: formatAmenities(listing.equipment),
        services: servicesList,
        houseRules: houseRulesList,
        viewCount: listing.viewCount,
        bookingCount: listing.bookingCount,
        favoriteCount: listing.favoriteCount,
        conversionRate: conversionRate.toFixed(1),
        viewTrend,
        trustScore: listing.trustScore,
        trustLabel: listing.trustLabel,
        scamProbability: listing.scamProbability,
        photosCount: listing.photos.length,
        owner: {
          name: `${listing.owner.firstName || ""} ${listing.owner.lastName || ""}`.trim(),
          isVerified: listing.owner.isIdentityVerified,
          onVacation: listing.owner.vacationMode,
          responseRate: listing.owner.stats?.reliabilityScore || 50,
        },
        reviews: {
          count: reviews.length,
          avgRating: avgRating.toFixed(1),
          recentComments: reviews
            .slice(-2)
            .map((r) => r?.comment)
            .filter(Boolean),
        },
        priceComparison: {
          regionAvg: regionPrice.avg,
          regionMin: regionPrice.min,
          regionMax: regionPrice.max,
          score: priceScore,
          isBelowAvg: listing.pricePerNight
            ? listing.pricePerNight < regionPrice.avg
            : false,
        },
        //  NOUVEAUX CHAMPS DE DISTANCE
        nearestBeach,
        distanceToBeach,
        beachProximityCategory,
        nearestCity,
        distanceToCity,
        nearestAirport,
        distanceToAirport,
        createdAt: listing.createdAt,
        daysSinceCreated: Math.floor(
          (Date.now() - new Date(listing.createdAt).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      };
    });

    // 3. Construire le prompt pour l'IA avec TOUTES les informations
    const listingsContext = enrichedListings
      .map(
        (l, idx) => `
                          LOGEMENT ${idx + 1} : ${l.title}                         
 ID: ${l.id}
 Type: ${l.type}
 Localisation: ${l.governorate} - ${l.delegation}
 Coordonnées GPS: ${l.hasCoordinates ? ` ${l.latitude}, ${l.longitude}` : " Non"}

  PROXIMITÉ ET DISTANCES:
   - Plage la plus proche: ${l.nearestBeach || "Non spécifiée"} à ${l.distanceToBeach !== null ? `${l.distanceToBeach} km` : "N/A"}
   - Catégorie: ${l.beachProximityCategory || "N/A"}
   - Centre-ville proche: ${l.nearestCity || "Non spécifié"} à ${l.distanceToCity !== null ? `${l.distanceToCity} km` : "N/A"}
   - Aéroport proche: ${l.nearestAirport || "Non spécifié"} à ${l.distanceToAirport !== null ? `${l.distanceToAirport} km` : "N/A"}

  CARACTÉRISTIQUES:
   - Chambres: ${l.rooms}
   - Salles de bain: ${l.bathrooms}
   - Capacité max: ${l.maxGuests} personnes
   - Surface: ${l.surfaceArea} m²
   - Étage: ${l.floorNumber}${l.hasElevator ? " (avec ascenseur)" : ""}
   - Cuisines: ${l.numberOfKitchens}

  ÉQUIPEMENTS & SERVICES:
   - Meublé: ${l.isFurnished ? " Oui" : " Non"}
   - Balcon: ${l.hasBalcony ? " Oui" : " Non"}
   - Jardin: ${l.hasGarden ? " Oui" : " Non"}
   - Garage: ${l.hasGarage ? " Oui" : " Non"}
   - Animaux acceptés: ${l.petsAllowed ? " Oui" : " Non"}
   - Fumeurs acceptés: ${l.smokingAllowed ? " Oui" : " Non"}
   - Équipements: ${l.amenities.length ? l.amenities.join(", ") : "Aucun"}
   - Services: ${l.services.length ? l.services.join(", ") : "Aucun"}

  TARIFS:
   - Location: ${l.rentalType}
   - Prix/nuit: ${l.pricePerNight || "Non défini"} TND
   - Prix/mois: ${l.pricePerMonth || "Non défini"} TND
   - Caution: ${l.securityDeposit || "Non défini"} TND
   - Frais ménage: ${l.cleaningFee || 0} TND
   - Multiplicateur weekend: ${l.weekendPriceMultiplier || 1.15}

  STATISTIQUES & PERFORMANCE:
   - Vues: ${l.viewCount}
   - Réservations: ${l.bookingCount}
   - Favoris: ${l.favoriteCount}
   - Taux conversion: ${l.conversionRate}%
   - Tendance vues: ${l.viewTrend}
   - Âge annonce: ${l.daysSinceCreated} jours

  PROPRIÉTAIRE:
   - Nom: ${l.owner.name || "Non renseigné"}
   - Identité vérifiée: ${l.owner.isVerified ? " Oui" : " Non"}
   - Mode vacances: ${l.owner.onVacation ? "⚠️ Oui" : " Non"}
   - Taux réponse: ${l.owner.responseRate}%

  AVIS & NOTE:
   - Nombre avis: ${l.reviews.count}
   - Note moyenne: ${l.reviews.avgRating}/5
   - Score NESTHUB: ${l.trustScore || "Non évalué"}/100
   - Label confiance: ${l.trustLabel || "Non évalué"}
   - Risque fraude: ${l.scamProbability || 0}%
   - Derniers avis: ${l.reviews.recentComments.join(" | ") || "Aucun"}

  PRIX vs RÉGION (${l.governorate}):
   - Prix régional moyen: ${l.priceComparison.regionAvg} TND
   - Fourchette: ${l.priceComparison.regionMin} - ${l.priceComparison.regionMax} TND
   - Position: ${l.priceComparison.score === "excellent" ? "💰 Très attractif" : l.priceComparison.score === "élevé" ? "⚠️ Au-dessus du marché" : "Correct"}

  DESCRIPTION:
   ${l.description?.substring(0, 400) || "Non disponible"}${l.description && l.description.length > 400 ? "..." : ""}

  PHOTOS: ${l.photosCount} photo(s)
`,
      )
      .join("\n");

    // 4. Système prompt pour l'IA (version améliorée)
    const systemPrompt = `Tu es un expert en location de biens immobiliers en Tunisie, spécialisé dans l'analyse comparative.

Tu peux répondre à TOUS types de questions sur les logements :
- Prix et budget
- Équipements (piscine, wifi, climatisation, parking...)
- Localisation et distances (plage, centre-ville, aéroport)
- Capacité (nombre de personnes, chambres)
- Avis et notes
- Fiabilité du propriétaire
- Rapport qualité-prix
- Et toute autre question spécifique de l'utilisateur

Retourne UNIQUEMENT un JSON avec cette structure :
{
  "analysis": "Analyse détaillée répondant précisément à la question de l'utilisateur",
  "recommendation": "Logement recommandé avec justification",
  "scores": { "listing_id": 85 },
  "bestMatch": "id",
  "pros": [],
  "cons": [],
  "summary": "Résumé court",
  "priceAdvice": "Conseil prix",
  "trustAdvice": "Avis fiabilité",
  "locationAdvice": "Avis sur la localisation (si pertinent)"
}`;

    const userPrompt = prompt || "Compare ces logements";

    const fullPrompt = `
 QUESTION DE L'UTILISATEUR :
"${userPrompt}"

 LOGEMENTS À COMPARER (${enrichedListings.length} logements) :

${listingsContext}

 TÂCHE : Réponds PRÉCISÉMENT à la question de l'utilisateur en analysant les logements ci-dessus.

 CONSIGNES :
- Si l'utilisateur demande "le moins cher" → compare les prix
- Si l'utilisateur demande "le plus proche de la plage" → compare les distances
- Si l'utilisateur demande "avec piscine" → vérifie les équipements
- Si l'utilisateur demande "pour 4 personnes" → vérifie la capacité
- Si l'utilisateur demande "le mieux noté" → compare les notes
- Si l'utilisateur demande "le plus fiable" → compare les scores de confiance
- Si l'utilisateur demande une combinaison de critères → prends tout en compte

 IMPORTANT : Retourne UNIQUEMENT le JSON demandé, sans texte avant ou après.`;

    if (!GITHUB_TOKEN) {
      console.error(" GITHUB_TOKEN manquant");
      return handleFallbackAnalysis(enrichedListings, userPrompt);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(GITHUB_API_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          "api-key": `${GITHUB_TOKEN}`,
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: fullPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 4000,
        }),
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(
          `GitHub API ${response.status}: ${errText.substring(0, 200)}`,
        );
      }

      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content;

      if (!raw) throw new Error("Réponse IA vide");

      let cleanJson = raw;
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleanJson = jsonMatch[0];

      const result = JSON.parse(cleanJson);

      if (!result.scores) {
        result.scores = {};
        enrichedListings.forEach((listing: any) => {
          result.scores[listing.id] = 50;
        });
      }

      if (!result.bestMatch && enrichedListings.length > 0) {
        result.bestMatch = enrichedListings[0].id;
      }

      return NextResponse.json({
        success: true,
        ...result,
        listings: enrichedListings,
      });
    } catch (error) {
      clearTimeout(timer);
      console.error(" Erreur IA:", error);
      return handleFallbackAnalysis(enrichedListings, userPrompt);
    }
  } catch (error) {
    console.error(" Erreur API compare:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse" },
      { status: 500 },
    );
  }
}

// Fallback sans IA (basé sur règles métier)
function handleFallbackAnalysis(listings: any[], userPrompt: string) {
  const scores: Record<string, number> = {};
  let bestScore = -1;
  let bestId = "";

  const wantsBeach =
    userPrompt.toLowerCase().includes("plage") ||
    userPrompt.toLowerCase().includes("mer") ||
    userPrompt.toLowerCase().includes("bord de mer");

  const wantsPool = userPrompt.toLowerCase().includes("piscine");
  const wantsCheap =
    userPrompt.toLowerCase().includes("moins cher") ||
    userPrompt.toLowerCase().includes("prix");
  const wantsRating =
    userPrompt.toLowerCase().includes("mieux noté") ||
    userPrompt.toLowerCase().includes("meilleure note");

  for (const listing of listings) {
    let score = 70;

    if (
      listing.pricePerNight &&
      listing.pricePerNight < listing.priceComparison.regionAvg
    ) {
      score += 15;
    } else if (
      listing.pricePerNight &&
      listing.pricePerNight > listing.priceComparison.regionAvg * 1.3
    ) {
      score -= 10;
    }

    if (listing.reviews.avgRating >= 4.5) score += 20;
    else if (listing.reviews.avgRating >= 4.0) score += 15;

    if (listing.trustScore && listing.trustScore >= 85) score += 20;
    else if (listing.trustScore && listing.trustScore >= 70) score += 15;

    if (wantsPool && listing.amenities.includes("Piscine")) score += 25;

    if (wantsBeach && listing.distanceToBeach !== null) {
      if (listing.distanceToBeach <= 1) score += 25;
      else if (listing.distanceToBeach <= 3) score += 20;
      else if (listing.distanceToBeach <= 5) score += 15;
      else if (listing.distanceToBeach <= 10) score += 10;
    }

    if (wantsCheap && listing.pricePerNight) {
      score += Math.max(0, 30 - listing.pricePerNight / 10);
    }

    if (wantsRating && listing.reviews.avgRating) {
      score += listing.reviews.avgRating * 5;
    }

    if (listing.owner.onVacation) score -= 15;
    if (!listing.owner.isVerified) score -= 10;
    if (listing.photosCount < 5) score -= 10;

    scores[listing.id] = Math.min(100, Math.max(0, Math.round(score)));

    if (score > bestScore) {
      bestScore = score;
      bestId = listing.id;
    }
  }

  const bestListing = listings.find((l: any) => l.id === bestId);

  const pros = [];
  const cons = [];

  if (bestListing) {
    if (
      bestListing.pricePerNight &&
      bestListing.pricePerNight < bestListing.priceComparison.regionAvg
    ) {
      pros.push(` Prix attractif : ${bestListing.pricePerNight} TND/nuit`);
    }
    if (bestListing.reviews.avgRating >= 4.5) {
      pros.push(` Excellente note : ${bestListing.reviews.avgRating}/5`);
    }
    if (bestListing.trustScore && bestListing.trustScore >= 85) {
      pros.push(` Score de confiance élevé : ${bestListing.trustScore}/100`);
    }
    if (bestListing.amenities.includes("Piscine")) {
      pros.push(` Piscine disponible`);
    }
    if (
      bestListing.distanceToBeach !== null &&
      bestListing.distanceToBeach <= 3
    ) {
      pros.push(
        ` Proche de la plage : ${bestListing.distanceToBeach} km (${bestListing.nearestBeach})`,
      );
    }
    if (bestListing.maxGuests >= 4) {
      pros.push(` Capacité ${bestListing.maxGuests} personnes`);
    }

    if (
      bestListing.pricePerNight &&
      bestListing.pricePerNight > bestListing.priceComparison.regionAvg * 1.2
    ) {
      cons.push(` Prix élevé : ${bestListing.pricePerNight} TND/nuit`);
    }
    if (!bestListing.owner.isVerified) cons.push(`⚠️ Propriétaire non vérifié`);
    if (bestListing.photosCount < 5)
      cons.push(`📸 Peu de photos (${bestListing.photosCount}/5+)`);
  }

  let analysis = ` ANALYSE COMPARATIVE\n\n`;
  analysis += ` MEILLEUR CHOIX : ${bestListing?.title} (Score: ${bestScore}/100)\n\n`;
  analysis += ` POINTS FORTS :\n${pros.map((p) => `   • ${p}`).join("\n")}\n\n`;
  if (cons.length > 0) {
    analysis += ` POINTS À CONSIDÉRER :\n${cons.map((c) => `   • ${c}`).join("\n")}\n\n`;
  }
  analysis += ` SCORES :\n${listings.map((l: any) => `   • ${l.title} : ${scores[l.id]}/100`).join("\n")}\n\n`;
  analysis += ` CONCLUSION : ${bestListing?.title} répond le mieux à votre recherche.`;

  return NextResponse.json({
    success: true,
    analysis,
    recommendation: `${bestListing?.title} est recommandé avec un score de ${bestScore}/100.`,
    scores,
    bestMatch: bestId,
    pros,
    cons,
    summary: `${bestListing?.title} : ${bestListing?.amenities.length} équipements, ${bestListing?.reviews.avgRating}/5 , ${bestListing?.pricePerNight} TND/nuit`,
    priceAdvice:
      bestListing?.priceComparison.score === "excellent"
        ? " Bonne affaire"
        : " Prix correct",
    trustAdvice:
      bestListing?.trustScore && bestListing.trustScore >= 85
        ? " Très fiable"
        : " Fiable",
    locationAdvice:
      bestListing?.distanceToBeach !== null && bestListing.distanceToBeach <= 3
        ? ` Excellente localisation à ${bestListing.distanceToBeach} km de la plage`
        : "Localisation correcte",
    listings,
  });
}
