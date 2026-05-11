const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function moderateWithAI(systemPrompt, userContent) {
  try {
    const response = await fetch(
      "https://models.inference.ai.azure.com/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GITHUB_TOKEN}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          response_format: { type: "json_object" },
          temperature: 0,
          max_tokens: 1000,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `GitHub API ${response.status}: ${await response.text()}`,
      );
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error("❌ [AI LISTING] Erreur:", error.message);
    return null;
  }
}

async function updateListingTrustScore(listingId) {
  try {
    console.log(`🏠 [AI LISTING] Analyse annonce ${listingId}...`);

    // 1. Récupérer toutes les données de l'annonce
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        owner: {
          include: { stats: true },
        },
        photos: true,
        bookings: {
          include: { review: true },
        },
        listingReports: true,
        conversations: true,
      },
    });

    if (!listing) {
      console.error(`❌ [AI LISTING] Annonce ${listingId} non trouvée`);
      return null;
    }

    // 2. Calculer les métriques
    const completedBookings = listing.bookings.filter(
      (b) => b.status === "COMPLETED",
    );
    const averageRating =
      completedBookings.length > 0
        ? completedBookings.reduce(
            (sum, b) => sum + (b.review?.rating || 0),
            0,
          ) / completedBookings.length
        : 0;

    const daysSinceCreated = Math.floor(
      (Date.now() - new Date(listing.createdAt).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    // 3. Analyser avec l'IA
    const systemPrompt = `Tu es un système d'évaluation de fiabilité pour des annonces de location en Tunisie.

Analyse cette annonce et retourne un JSON avec exactement cette structure :
{
  "listingScore": 85,
  "trustLabel": "Excellente",
  "trustBadge": "green",
  "scamProbability": 5,
  "scamFlags": ["prix_suspect"],
  "suggestions": ["Ajouter plus de photos", "Compléter la description"],
  "reasoning": "Explication de 2-3 phrases"
}

SCORING (0-100) :
- 0-30 : Suspecte (trustLabel: "Suspecte", trustBadge: "red")
- 31-50 : Incomplète (trustLabel: "Incomplète", trustBadge: "orange") 
- 51-70 : Correcte (trustLabel: "Correcte", trustBadge: "gray")
- 71-85 : Fiable (trustLabel: "Fiable", trustBadge: "blue")
- 86-100 : Excellente (trustLabel: "Excellente", trustBadge: "green")

SCAM FLAGS: prix_suspect, photos_manquantes, description_vague, proprietaire_nouveau, localisation_imprecise, equipements_excessifs, contact_externe, urgence_artificielle

SUGGESTIONS: ajouter_photos, completer_description, preciser_localisation, ajuster_prix, verifier_equipements, ameliorer_regles, contacter_proprietaire

Prix de référence Tunisie (TND/nuit) :
- Studio Tunis centre : 80-150 TND
- Appartement Sousse : 100-200 TND  
- Villa Hammamet : 200-400 TND
- Maison Djerba : 150-300 TND`;

    const listingProfile = `ANNONCE:
- ID: ${listing.id}
- Titre: ${listing.title}
- Slug: ${listing.slug}  
- Type: ${listing.type}
- Statut: ${listing.status}

DESCRIPTION:
${listing.description || "Pas de description"}

LOCALISATION:
- Gouvernorat: ${listing.governorate}
- Délégation: ${listing.delegation}
- Adresse: ${listing.street || "Non spécifiée"}
- Quartier: ${listing.neighborhood || "Non spécifié"}
- Coordonnées: ${listing.latitude ? `${listing.latitude}, ${listing.longitude}` : "Non géolocalisée"}

CARACTÉRISTIQUES:
- Chambres: ${listing.rooms}
- Salles de bain: ${listing.bathrooms}
- Invités max: ${listing.maxGuests || "Non spécifié"}
- Surface: ${listing.surfaceArea} m²
- Étage: ${listing.floorNumber}
- Ascenseur: ${listing.hasElevator}
- Balcon: ${listing.hasBalcony}
- Jardin: ${listing.hasGarden}
- Garage: ${listing.hasGarage}
- Meublé: ${listing.isFurnished}

PRIX:
- Type location: ${listing.rentalType}
- Prix/nuit: ${listing.pricePerNight || "Non défini"} TND
- Prix/mois: ${listing.pricePerMonth || "Non défini"} TND
- Caution: ${listing.securityDeposit || 0} TND
- Frais ménage: ${listing.cleaningFee || 0} TND

ÉQUIPEMENTS:
${JSON.stringify(listing.equipment) || "Aucun équipement listé"}

RÈGLES:
- Animaux: ${listing.petsAllowed}
- Fumeur: ${listing.smokingAllowed}
- Règles custom: ${listing.customRules || "Aucune"}
- Règles maison: ${JSON.stringify(listing.houseRules) || "Non spécifiées"}

PHOTOS:
- Nombre de photos: ${listing.photos.length}
- Photo principale: ${listing.photos.find((p) => p.isMain) ? "Oui" : "Non"}

PROPRIÉTAIRE:
- Score fiabilité: ${listing.owner.riskScore || 50}
- Email vérifié: ${listing.owner.isEmailVerified}
- Téléphone vérifié: ${listing.owner.isPhoneVerified}
- Identité vérifiée: ${listing.owner.isIdentityVerified}
- Compte créé: ${listing.owner.createdAt.toISOString()}

HISTORIQUE:
- Créé il y a: ${daysSinceCreated} jours
- Réservations terminées: ${completedBookings.length}
- Note moyenne: ${averageRating.toFixed(1)}/5
- Signalements: ${listing.listingReports.length}
- Conversations: ${listing.conversations.length}
- Vues: ${listing.viewCount}
- Favoris: ${listing.favoriteCount}

ÉTAT:
- Archivée: ${listing.isArchived}
- Bloquée: ${listing.isBlocked}
- Raison blocage: ${listing.blockReason || "Aucune"}`;

    const result = await moderateWithAI(systemPrompt, listingProfile);

    if (!result) {
      console.log(
        `⚠️ [AI LISTING] Échec IA pour ${listingId}, score par défaut`,
      );
      return 50;
    }

    // 4. Sauvegarder le résultat
    await prisma.listing.update({
      where: { id: listingId },
      data: {
        trustScore: result.listingScore,
        trustLabel: result.trustLabel,
        trustBadge: result.trustBadge,
        scamProbability: result.scamProbability || 0,
        scamFlags: result.scamFlags || [],
        lastScoredAt: new Date(),
      },
    });

    console.log(
      `✅ [AI LISTING] Score mis à jour pour "${listing.title}": ${result.listingScore} (${result.trustLabel})`,
    );
    console.log(`🎯 [AI LISTING] Raison: ${result.reasoning}`);

    if (result.scamFlags?.length > 0) {
      console.log(`🚩 [AI LISTING] Signaux: ${result.scamFlags.join(", ")}`);
    }

    if (result.suggestions?.length > 0) {
      console.log(
        `💡 [AI LISTING] Suggestions: ${result.suggestions.join(", ")}`,
      );
    }

    return result.listingScore;
  } catch (error) {
    console.error(`❌ [AI LISTING] Erreur pour ${listingId}:`, error.message);
    return null;
  }
}

module.exports = { updateListingTrustScore };
