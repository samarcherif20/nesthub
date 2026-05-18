import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      listingId,  // NOUVEAU : ID de l'annonce pour l'historique
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
      rentalType 
    } = body;

    // ============================================
    // 1. RÉCUPÉRATION DES ANNONCES SIMILAIRES
    // ============================================
    const similarListings = await prisma.listing.findMany({
      where: {
        status: "ACTIVE",
        governorate,
        type,
        rooms: { gte: Math.max(1, (rooms || 1) - 1), lte: (rooms || 1) + 1 },
      },
      select: { 
        pricePerNight: true, 
        pricePerMonth: true, 
        surfaceArea: true, 
        rooms: true, 
        isFurnished: true,
        bookingCount: true,      // NOUVEAU
        favoriteCount: true,     // NOUVEAU
        viewCount: true          // NOUVEAU
      },
      take: 10,
    });

    // ============================================
    // 2. DÉTECTION DE LA SAISON PAR DATE
    // ============================================
    const now = new Date();
    const month = now.getMonth();
    const isHighSeason = [5, 6, 7, 8].includes(month); // Juin, Juillet, Août, Septembre
    const isMediumSeason = [3, 4, 9, 10].includes(month); // Avril, Mai, Octobre
    const seasonMultiplier = isHighSeason ? 1.25 : isMediumSeason ? 1.1 : 0.95;
    const seasonText = isHighSeason ? "Haute saison (juin-septembre)" : isMediumSeason ? "Moyenne saison" : "Basse saison";

    // ============================================
    // 3. RÉCUPÉRATION DU SCORE DE FIABILITÉ DU PROPRIÉTAIRE
    // ============================================
    let ownerStats = null;
    let trustMultiplier = 1;
    let averageRating = null;
    
    if (listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { ownerId: true }
      });
      
      if (listing?.ownerId) {
        ownerStats = await prisma.userStats.findUnique({
          where: { userId: listing.ownerId },
          select: { reliabilityScore: true, totalBookings: true, averageRating: true }
        });
        // Score 100 = +10%, Score 0 = -10%
        trustMultiplier = ownerStats?.reliabilityScore 
          ? 1 + ((ownerStats.reliabilityScore - 50) / 500)
          : 1;
      }
      
      // Récupérer la note moyenne du bien
      const reviews = await prisma.review.findMany({
        where: { targetId: listing.ownerId },
        select: { rating: true }
      });
      if (reviews.length > 0) {
        averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
      }
    }

    // ============================================
    // 4. RÉCUPÉRATION DE L'HISTORIQUE DES PRIX
    // ============================================
    let historicalAveragePrice = null;
    let pastBookings = [];
    
    if (listingId) {
      pastBookings = await prisma.booking.findMany({
        where: {
          listingId: listingId,
          status: { in: ["COMPLETED", "CONFIRMED"] },
          createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        },
        select: { pricePerNight: true, totalPrice: true, totalNights: true }
      });
      
      if (pastBookings.length > 0) {
        const avgPrice = pastBookings.reduce((acc, b) => acc + b.pricePerNight, 0) / pastBookings.length;
        historicalAveragePrice = avgPrice;
      }
    }

    // ============================================
    // 5. CALCUL DE LA POPULARITÉ
    // ============================================
    let popularityMultiplier = 1;
    let totalPopularity = 0;
    
    if (similarListings.length > 0) {
      const avgBookingCount = similarListings.reduce((acc, l) => acc + (l.bookingCount || 0), 0) / similarListings.length;
      const avgFavoriteCount = similarListings.reduce((acc, l) => acc + (l.favoriteCount || 0), 0) / similarListings.length;
      totalPopularity = avgBookingCount + avgFavoriteCount;
      popularityMultiplier = totalPopularity > 50 ? 1.1 : totalPopularity > 20 ? 1.05 : 1;
    }

    // ============================================
    // 6. CONSTRUCTION DU CONTEXTE MARCHÉ
    // ============================================
    const marketContext = similarListings.length > 0
      ? `Annonces réelles sur la plateforme : ${similarListings.map(l =>
          `${l.rooms}ch, ${l.surfaceArea}m², meublé:${l.isFurnished}, ${l.pricePerNight ?? "N/A"}TND/nuit, ${l.pricePerMonth ?? "N/A"}TND/mois, ${l.bookingCount || 0} réservations, ${l.favoriteCount || 0} favoris`
        ).join(" | ")}`
      : "Aucune annonce similaire, base toi sur le marché tunisien.";

    const equipmentList = equipment
      ? Object.entries(equipment).filter(([, v]) => v).map(([k]) => k).join(", ") || "aucun"
      : "aucun";

    const jsonFormat =
      rentalType === "SHORT_TERM" ? `{"pricePerNight": 80}` :
      rentalType === "LONG_TERM" ? `{"pricePerMonth": 600}` :
      `{"pricePerNight": 80, "pricePerMonth": 600}`;

    // ============================================
    // 7. APPEL IA GROQ
    // ============================================
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 150,
        messages: [
          {
            role: "system",
            content: `Tu es un expert immobilier en Tunisie. Tu analyses les caractéristiques d'un bien et le marché local pour estimer un prix réaliste. Tu réponds UNIQUEMENT en JSON valide sans aucun texte autour.

FOURCHETTES DE PRIX TUNISIE:

LONGUE DURÉE (TND/mois):
- Tunis / Ariana / Ben Arous: 700 à 2000
- Sousse / Monastir / Nabeul / Hammamet: 500 à 1400
- Sfax: 400 à 1000
- Zones touristiques côtières: 600 à 1600
- Villes intérieures (Kairouan, Gafsa, Kasserine, Sidi Bouzid): 250 à 650
- Sud / zones rurales (Tataouine, Kébili, Tozeur): 200 à 550

COURTE DURÉE (TND/nuit):
- Tunis centre: 80 à 350
- Zones côtières / touristiques: 100 à 450
- Sousse / Monastir: 80 à 280
- Sfax: 60 à 200
- Villes intérieures: 40 à 130

AJUSTEMENTS IMPORTANTS:
- Villa: +25% vs appartement
- Duplex: +15%
- Piscine: +25%
- Meublé complet: +20%
- Jardin privatif: +12%
- Garage: +10%
- Climatisation: +10%
- WiFi fibre: +5%
- Ascenseur: +5%
- Non meublé: -25%
- Studio: -20% vs appartement
- Chaque chambre supplémentaire: +8%
- Chaque 30m² supplémentaire: +5%`,
          },
          {
            role: "user",
            content: `Analyse ce bien immobilier tunisien et donne une estimation de prix réaliste.

BIEN:
- Gouvernorat: ${governorate}
- Type: ${type}
- Chambres: ${rooms}
- Salles de bain: ${bathrooms}
- Surface: ${surfaceArea ?? "non précisée"} m²
- Meublé: ${isFurnished ? "oui" : "non"}
- Balcon/Terrasse: ${hasBalcony ? "oui" : "non"}
- Jardin: ${hasGarden ? "oui" : "non"}
- Garage: ${hasGarage ? "oui" : "non"}
- Ascenseur: ${hasElevator ? "oui" : "non"}
- Équipements: ${equipmentList}
- Type location demandé: ${rentalType}

MARCHÉ LOCAL ACTUEL: ${marketContext}

CONTEXTE SUPPLÉMENTAIRE:
- Saison actuelle: ${seasonText} ${isHighSeason ? "(+25% sur prix)" : isMediumSeason ? "(+10% sur prix)" : "(-5% sur prix)"}
- Score fiabilité propriétaire: ${ownerStats?.reliabilityScore || 50}/100 ${trustMultiplier > 1 ? "(prime de confiance)" : trustMultiplier < 1 ? "(décote)" : ""}
- Popularité du bien: ${totalPopularity > 50 ? "Très populaire (+10%)" : totalPopularity > 20 ? "Populaire (+5%)" : "Standard"}
- ${historicalAveragePrice ? `Prix historique moyen: ${Math.round(historicalAveragePrice)} TND/nuit (basé sur ${pastBookings.length} réservations)` : "Pas d'historique de prix disponible"}
- Note moyenne: ${averageRating ? `${averageRating.toFixed(1)}/5 étoiles` : "Pas encore noté"}

Réponds UNIQUEMENT avec ce JSON:
${jsonFormat}`,
          },
        ],
      }),
    });

    const data = await response.json();
    console.log("Réponse Groq:", JSON.stringify(data));

    const text = data.choices?.[0]?.message?.content || "";

    if (!text || text.trim() === "") {
      throw new Error("Réponse vide de Groq");
    }

    const clean = text.replace(/```json|```/g, "").trim();
    const jsonMatch = clean.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error(`JSON introuvable: ${clean}`);

    let parsed = JSON.parse(jsonMatch[0]);

    let pricePerNight = parsed.pricePerNight ?? null;
    let pricePerMonth = parsed.pricePerMonth ?? null;

    // ============================================
    // 8. APPLICATION DES MULTIPLICATEURS
    // ============================================
    let finalMultiplier = seasonMultiplier * trustMultiplier * popularityMultiplier;
    
    // Si un historique existe, lisser le prix (pondération 70% IA, 30% historique)
    if (historicalAveragePrice && pricePerNight) {
      pricePerNight = (pricePerNight * 0.7) + (historicalAveragePrice * 0.3);
      if (pricePerMonth) {
        pricePerMonth = (pricePerMonth * 0.7) + (historicalAveragePrice * 30 * 0.3);
      }
    }
    
    // Appliquer le multiplicateur final
    if (pricePerNight) pricePerNight = pricePerNight * finalMultiplier;
    if (pricePerMonth) pricePerMonth = pricePerMonth * finalMultiplier;

    // ============================================
    // 9. VALIDATION ET ARRONDI
    // ============================================
    if (pricePerNight) {
      pricePerNight = Math.min(500, Math.max(40, Math.round(pricePerNight / 5) * 5));
    }
    if (pricePerMonth) {
      pricePerMonth = Math.min(2000, Math.max(200, Math.round(pricePerMonth / 50) * 50));
    }

    return NextResponse.json({
      success: true,
      pricePerNight,
      pricePerMonth,
      currency: "TND",
      // NOUVEAU : métriques pour debugging
      meta: {
        seasonMultiplier,
        trustMultiplier,
        popularityMultiplier,
        finalMultiplier,
        historicalPriceUsed: !!historicalAveragePrice,
        similarListingsCount: similarListings.length
      }
    });

  } catch (error) {
    console.error("Erreur IA:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors du calcul IA" },
      { status: 500 }
    );
  }
}