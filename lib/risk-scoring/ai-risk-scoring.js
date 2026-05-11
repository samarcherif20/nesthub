const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function moderateWithAI(systemPrompt, userContent) {
  try {
    const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('❌ [AI RISK] Erreur:', error.message);
    return null;
  }
}

async function updateUserRiskScore(userId) {
  try {
    console.log(`🔍 [AI RISK] Analyse utilisateur ${userId}...`);

    // 1. Récupérer toutes les données utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        stats: true,
        tenantBookings: {
          include: {
            review: true,
            listing: true
          }
        },
        reviewsReceived: true,
        verificationRequests: true,
        adminNotes: true,
        userActions: true,
        // Pour les messages bloqués
        sentChatMessages: {
          where: { isBlocked: true },
          take: 50
        }
      }
    });

    if (!user) {
      console.error(`❌ [AI RISK] Utilisateur ${userId} non trouvé`);
      return null;
    }

    // 2. Calculer les métriques
    const completedBookings = user.tenantBookings.filter(b => b.status === 'COMPLETED');
    const cancelledBookings = user.tenantBookings.filter(b => b.status === 'CANCELLED');
    const averageRating = user.reviewsReceived.length > 0 
      ? user.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / user.reviewsReceived.length 
      : 0;

    const accountAgeDays = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    const blockedMessages = user.sentChatMessages.map(m => ({
      content: m.content,
      reason: m.blockedReason || 'moderé',
      date: m.createdAt.toISOString()
    }));

    // 3. Analyser avec l'IA
    const systemPrompt = `Tu es un système d'évaluation de risque pour une plateforme de location en Tunisie.

Analyse ce profil utilisateur et retourne un JSON avec exactement cette structure :
{
  "riskScore": 85,
  "trustLabel": "Très fiable",
  "trustBadge": "green", 
  "flags": ["nouveau_compte", "verification_manquante"],
  "strengths": ["bon_historique_paiement", "avis_positifs"],
  "reasoning": "Explication de 2-3 phrases"
}

SCORING (0-100) :
- 0-30 : Très risqué (trustLabel: "Très risqué", trustBadge: "red")
- 31-50 : Risqué (trustLabel: "Risqué", trustBadge: "orange") 
- 51-70 : Neutre (trustLabel: "Neutre", trustBadge: "gray")
- 71-85 : Fiable (trustLabel: "Fiable", trustBadge: "blue")
- 86-100 : Très fiable (trustLabel: "Très fiable", trustBadge: "green")

FLAGS POSSIBLES: nouveau_compte, verification_manquante, annulations_frequentes, avis_negatifs, messages_bloques, actions_admin, fraude_suspectee

STRENGTHS POSSIBLES: verification_complete, bon_historique_paiement, avis_positifs, compte_ancien, communication_saine, zero_incident`;

    const userProfile = `PROFIL UTILISATEUR:
- ID: ${user.id}
- Email: ${user.email}
- Créé le: ${user.createdAt.toISOString()}
- Âge du compte: ${accountAgeDays} jours
- Statut: ${user.status}

VÉRIFICATIONS:
- Email vérifié: ${user.isEmailVerified}
- Téléphone vérifié: ${user.isPhoneVerified}  
- Identité vérifiée: ${user.isIdentityVerified}
- Score risque actuel: ${user.riskScore || 50}

HISTORIQUE RÉSERVATIONS:
- Réservations terminées: ${completedBookings.length}
- Annulations: ${cancelledBookings.length}
- Note moyenne reçue: ${averageRating.toFixed(1)}/5 (${user.reviewsReceived.length} avis)

ACTIONS ADMIN:
- Demandes de vérification: ${user.verificationRequests.length}
- Notes admin: ${user.adminNotes.length}
- Actions disciplinaires: ${user.userActions.length}

MODÉRATION CHAT:
- Messages bloqués: ${blockedMessages.length}
${blockedMessages.length > 0 ? 
`- Détails messages bloqués: ${JSON.stringify(blockedMessages.slice(0, 5), null, 2)}` 
: ''}

STATISTIQUES:
- Dernière connexion: ${user.lastLogin || 'jamais'}
- Tentatives login échouées: ${user.failedLoginAttempts}
- Mode vacances: ${user.vacationMode}`;

    const result = await moderateWithAI(systemPrompt, userProfile);
    
    if (!result) {
      console.log(`⚠️ [AI RISK] Échec IA pour ${userId}, conservation score actuel`);
      return user.riskScore || 50;
    }

    // 4. Sauvegarder le résultat
    await prisma.user.update({
      where: { id: userId },
      data: { riskScore: result.riskScore }
    });

    await prisma.userStats.upsert({
      where: { userId },
      create: {
        userId,
        reliabilityScore: result.riskScore,
        trustLabel: result.trustLabel,
        trustBadge: result.trustBadge,
        scamFlags: result.flags || [],
        lastScoredAt: new Date(),
        totalBookings: completedBookings.length,
        totalReviews: user.reviewsReceived.length,
        averageRating: averageRating,
        cancellationCount: cancelledBookings.length,
      },
      update: {
        reliabilityScore: result.riskScore,
        trustLabel: result.trustLabel,
        trustBadge: result.trustBadge,
        scamFlags: result.flags || [],
        lastScoredAt: new Date(),
        totalBookings: completedBookings.length,
        totalReviews: user.reviewsReceived.length,
        averageRating: averageRating,
        cancellationCount: cancelledBookings.length,
      },
    });

    console.log(`✅ [AI RISK] Score mis à jour pour ${user.email}: ${result.riskScore} (${result.trustLabel})`);
    console.log(`🎯 [AI RISK] Raison: ${result.reasoning}`);
    
    if (result.flags?.length > 0) {
      console.log(`🚩 [AI RISK] Signaux: ${result.flags.join(', ')}`);
    }

    return result.riskScore;

  } catch (error) {
    console.error(`❌ [AI RISK] Erreur pour ${userId}:`, error.message);
    return null;
  }
}

module.exports = { updateUserRiskScore };