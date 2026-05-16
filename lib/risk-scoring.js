/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  🎯  NestHub — Moteur de Risk Scoring IA                                    ║
 * ║  Version ULTIMATE — Tous les bugs corrigés + améliorations                  ║
 * ║                                                                              ║
 * ║  Corrections v2 :                                                            ║
 * ║  - Score de base 50 → 35 (inconnu = risqué par défaut)                     ║
 * ║  - Timeout IA (8s) + validation score 0-100                                 ║
 * ║  - Cron intelligent (skip users actifs récents, batch par priorité)         ║
 * ║  - Patterns temporels dans le prompt IA                                     ║
 * ║  - prisma.findMany() paginé + filtré (pas de full table scan)               ║
 * ║  - Alertes automatiques si score chute brutalement                          ║
 * ║  - Rate limiting entre appels IA (évite ban API)                            ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API_URL = "https://models.inference.ai.azure.com/chat/completions";
const AI_TIMEOUT_MS = 8_000;
const CRON_BATCH_SIZE = 50; // Users traités par batch dans le cron
const CRON_DELAY_MS = 150; // Pause entre chaque appel IA (évite rate limit)

// ═══════════════════════════════════════════════════════════════════════════════
// 🔢  PARTIE 1 — FALLBACK MÉTIER (si IA down)
//     Score de base = 35 (inconnu = légèrement risqué par défaut)
//     Logique : un inconnu non vérifié doit PROUVER sa fiabilité
// ═══════════════════════════════════════════════════════════════════════════════

function calculateFallbackRiskScore(m) {
  // Base 35 : inconnu non vérifié. Il faut mériter la confiance.
  let score = 35;

  // ── Vérifications (+45 max) ───────────────────────────────────────────────
  if (m.emailVerified) score += 10;
  if (m.phoneVerified) score += 10;
  if (m.identityVerified) score += 25; // Vérification identité = signal fort

  // ── Ancienneté du compte (+8 max) ────────────────────────────────────────
  const months = Math.min(m.accountAgeMonths, 12);
  score += Math.floor(months * 0.67); // +0.67 par mois → +8 après 1 an

  // ── Historique réservations (+20 max) ────────────────────────────────────
  score += Math.min(m.completedBookings * 4, 20);

  // ── Note moyenne (+15 max) ───────────────────────────────────────────────
  if (m.averageRating >= 4.5) score += 15;
  else if (m.averageRating >= 4.0) score += 10;
  else if (m.averageRating >= 3.0) score += 5;
  else if (m.averageRating > 0) score -= 5; // Notes < 3 = malus

  // ── Malus comportementaux ─────────────────────────────────────────────────
  // Annulations : pondérées par rapport aux réservations totales
  const totalBookings = m.completedBookings + m.cancellations;
  if (totalBookings > 0) {
    const cancelRate = m.cancellations / totalBookings;
    if (cancelRate > 0.5) score -= 20;
    else if (cancelRate > 0.3) score -= 12;
    else if (cancelRate > 0.1) score -= 5;
  }

  score -= Math.min(m.disputes * 20, 40); // Litiges — très grave
  score -= Math.min(m.reports * 15, 30); // Signalements
  score -= Math.min(m.blockedMessages * 5, 25); // Messages bloqués
  score -= Math.min(m.suspiciousListings * 15, 30); // Annonces suspectes

  // ── Pattern : nouveau compte + activité élevée = red flag ────────────────
  if (m.accountAgeMonths < 1 && m.completedBookings > 3) score -= 15;

  // ── Tentatives login échouées ─────────────────────────────────────────────
  if (m.failedLoginAttempts > 10) score -= 15;
  else if (m.failedLoginAttempts > 5) score -= 8;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getTrustLevel(score) {
  if (score >= 86) return { label: "Très fiable", badge: "green" };
  if (score >= 71) return { label: "Fiable", badge: "blue" };
  if (score >= 51) return { label: "Neutre", badge: "gray" };
  if (score >= 31) return { label: "Risqué", badge: "orange" };
  return { label: "Très risqué", badge: "red" };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🧠  PARTIE 2 — PROMPT IA (risk scoring)
// ═══════════════════════════════════════════════════════════════════════════════

const RISK_SCORING_PROMPT = `
Tu es NestHub Risk Analyzer, expert en évaluation de fiabilité d'utilisateurs
sur une plateforme immobilière tunisienne.

OBJECTIF : Calculer un score de fiabilité (0-100) basé sur TOUS les signaux.

━━━ DIMENSIONS D'ANALYSE ━━━

1. VÉRIFICATIONS D'IDENTITÉ
   - Email, téléphone, CIN : chaque vérification renforce significativement la fiabilité
   - Absence des 3 = profil à haut risque

2. HISTORIQUE RÉSERVATIONS
   - Réservations complétées : signal positif fort
   - Taux d'annulation : >50% = très suspect, >30% = risqué, <10% = bon
   - Pattern temporel : beaucoup d'annulations sur une courte période = fraude potentielle

3. AVIS REÇUS
   - Note moyenne : sur 5
   - Analyse textuelle : sentiment, sincérité, cohérence
   - Divergence note/texte : note élevée + texte négatif = faux avis

4. ANCIENNETÉ ET ACTIVITÉ
   - Compte récent (<1 mois) + forte activité = red flag potentiel
   - Compte ancien + zéro activité = profil dormant à surveiller

5. SIGNALEMENTS ET LITIGES
   - Chaque litige ouvert pèse lourd
   - Signalements multiples = pattern de comportement problématique
   - Nature des signalements : harcèlement > spam en termes de gravité

6. MESSAGES BLOQUÉS PAR MODÉRATION
   - Tentatives de partage numéro/email = contournement plateforme
   - Tentatives d'arnaque = signal très grave
   - 1-2 messages bloqués = possible erreur, >5 = comportement intentionnel

7. ANNONCES SUSPECTES (propriétaires)
   - Prix anormalement bas = appât arnaque
   - Flags de scam détectés = très grave

8. PATTERNS COMPORTEMENTAUX
   - Nouveau compte + nombreuses réservations = possible fraude
   - Tentatives login échouées > 10 = compte compromis potentiel
   - Compte en mode vacation prolongé = inactivité suspecte

━━━ RÈGLES SCORING ━━━
86-100 → Très fiable (badge: green)
71-85  → Fiable      (badge: blue)
51-70  → Neutre      (badge: gray)
31-50  → Risqué      (badge: orange)
0-30   → Très risqué (badge: red)

BASE PAR DÉFAUT : Un utilisateur non vérifié sans historique commence à ~35 (risqué).
Il doit prouver sa fiabilité. Ne pas être "gentil" avec les profils vides.

━━━ FLAGS DISPONIBLES ━━━
nouveau_compte, verification_manquante, annulations_frequentes, avis_negatifs,
messages_bloques, tentative_arnaque_chat, fraude_suspectee, prix_annonce_anormal,
litiges_en_cours, signalements_recus, pattern_temporel_suspect, compte_compromis,
inactif_longtemps, taux_annulation_eleve

━━━ STRENGTHS DISPONIBLES ━━━
verification_complete, bon_historique_paiement, avis_positifs_sinceres,
compte_ancien_actif, communication_saine, zero_incident, proprietaire_fiable,
bonne_reputation, engagement_plateforme

━━━ FORMAT JSON STRICT ━━━
{
  "riskScore": <entier 0-100>,
  "trustLabel": "Très fiable|Fiable|Neutre|Risqué|Très risqué",
  "trustBadge": "green|blue|gray|orange|red",
  "flags": ["flag1", "flag2"],
  "strengths": ["strength1", "strength2"],
  "reasoning": "Explication détaillée et nuancée en français (2-3 phrases)"
}
`.trim();

// ═══════════════════════════════════════════════════════════════════════════════
// 🤖  PARTIE 3 — APPEL IA avec timeout et validation
// ═══════════════════════════════════════════════════════════════════════════════

async function callAIRiskScoring(userProfile) {
  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN manquant");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch(GITHUB_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: RISK_SCORING_PROMPT },
          { role: "user", content: userProfile },
        ],
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: 600,
      }),
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`API ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Réponse IA vide");

    const parsed = JSON.parse(raw);

    // ── Validation stricte ────────────────────────────────────────────────
    const score = Number(parsed.riskScore);
    if (isNaN(score) || score < 0 || score > 100) {
      throw new Error(`Score IA invalide : ${parsed.riskScore}`);
    }

    const VALID_BADGES = ["green", "blue", "gray", "orange", "red"];
    if (!VALID_BADGES.includes(parsed.trustBadge)) {
      // Recalculer le badge si l'IA hallucine
      parsed.trustBadge = getTrustLevel(score).badge;
      parsed.trustLabel = getTrustLevel(score).label;
    }

    return {
      riskScore: Math.round(score),
      trustLabel: parsed.trustLabel || getTrustLevel(score).label,
      trustBadge: parsed.trustBadge,
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      reasoning: parsed.reasoning || "",
    };
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊  PARTIE 4 — COLLECTE DONNÉES UTILISATEUR
// ═══════════════════════════════════════════════════════════════════════════════

async function collectUserData(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      stats: true,
      tenantBookings: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          review: { select: { rating: true, comment: true } },
        },
      },
      ownerBookings: {
        select: { id: true, status: true, createdAt: true },
      },
      reviewsReceived: {
        select: { rating: true, comment: true, createdAt: true },
        take: 10,
        orderBy: { createdAt: "desc" },
      },
      sentChatMessages: {
        where: { isBlocked: true },
        select: { content: true, blockedReason: true, createdAt: true },
        take: 20,
        orderBy: { createdAt: "desc" },
      },
      openedDisputes: {
        where: { status: { not: "RESOLVED" } },
        select: { id: true, type: true, createdAt: true },
      },
      reportsReceived: {
        select: { reason: true, description: true, createdAt: true },
        take: 5,
        orderBy: { createdAt: "desc" },
      },
      listings: {
        select: {
          title: true,
          status: true,
          pricePerNight: true,
          scamFlags: true,
          trustScore: true,
        },
      },
    },
  });

  if (!user) return null;

  // ── Métriques calculées ───────────────────────────────────────────────────
  const completedBookings = user.tenantBookings.filter(
    (b) => b.status === "COMPLETED",
  );
  const cancelledBookings = user.tenantBookings.filter(
    (b) => b.status === "CANCELLED",
  );
  const suspiciousListings = user.listings.filter(
    (l) =>
      l.scamFlags?.length > 0 || (l.trustScore !== null && l.trustScore < 50),
  );

  const averageRating =
    user.reviewsReceived.length > 0
      ? user.reviewsReceived.reduce((s, r) => s + r.rating, 0) /
        user.reviewsReceived.length
      : 0;

  const accountAgeDays = Math.floor(
    (Date.now() - new Date(user.createdAt).getTime()) / 86_400_000,
  );
  const accountAgeMonths = Math.floor(accountAgeDays / 30);

  // ── Pattern temporel : annulations groupées ───────────────────────────────
  const last30daysCancels = cancelledBookings.filter((b) => {
    const days = (Date.now() - new Date(b.createdAt).getTime()) / 86_400_000;
    return days <= 30;
  }).length;

  const metrics = {
    completedBookings: completedBookings.length,
    cancellations: cancelledBookings.length,
    disputes: user.openedDisputes.length,
    reports: user.reportsReceived.length,
    averageRating,
    accountAgeDays,
    accountAgeMonths,
    blockedMessages: user.sentChatMessages.length,
    suspiciousListings: suspiciousListings.length,
    emailVerified: user.isEmailVerified ?? false,
    phoneVerified: user.isPhoneVerified ?? false,
    identityVerified: user.isIdentityVerified ?? false,
    failedLoginAttempts: user.failedLoginAttempts ?? 0,
    last30daysCancels,
  };

  const rawData = {
    reviews: user.reviewsReceived.slice(0, 5).map((r) => ({
      rating: r.rating,
      comment: r.comment?.slice(0, 200) ?? null,
    })),
    blockedMessages: user.sentChatMessages.slice(0, 5).map((m) => ({
      reason: m.blockedReason ?? "modéré",
      excerpt: m.content?.slice(0, 80) ?? "",
    })),
    reports: user.reportsReceived.slice(0, 3).map((r) => ({
      reason: r.reason,
      description: r.description?.slice(0, 100) ?? "",
    })),
    suspiciousListings: suspiciousListings.map((l) => ({
      title: l.title,
      price: l.pricePerNight,
      flags: l.scamFlags ?? [],
    })),
    cancelPattern: {
      total: cancelledBookings.length,
      last30days: last30daysCancels,
      isGrouped: last30daysCancels >= 3,
    },
  };

  return { user, metrics, rawData };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏗️  PARTIE 5 — CONSTRUCTION DU PROFIL TEXTE POUR L'IA
// ═══════════════════════════════════════════════════════════════════════════════

function buildUserProfile(user, metrics, rawData) {
  const cancelRate =
    metrics.completedBookings + metrics.cancellations > 0
      ? (
          (metrics.cancellations /
            (metrics.completedBookings + metrics.cancellations)) *
          100
        ).toFixed(1)
      : "0";

  return `
PROFIL UTILISATEUR :
- Âge du compte : ${metrics.accountAgeDays} jours (${metrics.accountAgeMonths} mois)
- Statut : ${user.status}
- Dernière connexion : ${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString("fr-FR") : "jamais"}
- Tentatives login échouées : ${metrics.failedLoginAttempts}

VÉRIFICATIONS :
- Email vérifié     : ${metrics.emailVerified ? "✅ OUI" : "❌ NON"}
- Téléphone vérifié : ${metrics.phoneVerified ? "✅ OUI" : "❌ NON"}
- Identité vérifiée : ${metrics.identityVerified ? "✅ OUI" : "❌ NON"}

RÉSERVATIONS :
- Terminées         : ${metrics.completedBookings}
- Annulations       : ${metrics.cancellations} (taux : ${cancelRate}%)
- Annulations/30j   : ${metrics.last30daysCancels} ${rawData.cancelPattern.isGrouped ? "⚠️ Pattern groupé suspect" : ""}

AVIS REÇUS :
- Nombre : ${user.reviewsReceived?.length ?? 0}
- Moyenne : ${metrics.averageRating.toFixed(1)}/5
${rawData.reviews.length > 0 ? `- Détails :\n${rawData.reviews.map((r) => `  [${r.rating}/5] "${r.comment ?? "sans commentaire"}"`).join("\n")}` : "- Aucun avis"}

LITIGES ET SIGNALEMENTS :
- Litiges ouverts  : ${metrics.disputes}
- Signalements     : ${metrics.reports}
${rawData.reports.length > 0 ? `- Détails signalements :\n${rawData.reports.map((r) => `  [${r.reason}] ${r.description}`).join("\n")}` : ""}

MODÉRATION CHAT :
- Messages bloqués : ${metrics.blockedMessages}
${rawData.blockedMessages.length > 0 ? `- Exemples :\n${rawData.blockedMessages.map((m) => `  [${m.reason}] "${m.excerpt}"`).join("\n")}` : ""}

ANNONCES (propriétaire) :
- Total annonces    : ${user.listings?.length ?? 0}
- Annonces suspectes: ${metrics.suspiciousListings}
${rawData.suspiciousListings.length > 0 ? `- Détails :\n${rawData.suspiciousListings.map((l) => `  "${l.title}" — ${l.price} TND/nuit — Flags: ${l.flags.join(", ")}`).join("\n")}` : ""}
`.trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💾  PARTIE 6 — SAUVEGARDE EN BASE
// ═══════════════════════════════════════════════════════════════════════════════

async function saveRiskScore(userId, result, method = "ai") {
  // Sécurité : toujours valider avant d'écrire
  const score = Math.max(0, Math.min(100, Math.round(result.riskScore)));

  await prisma.user.update({
    where: { id: userId },
    data: { riskScore: score },
  });

  await prisma.userStats.upsert({
    where: { userId },
    create: {
      userId,
      reliabilityScore: score,
      trustLabel: result.trustLabel,
      trustBadge: result.trustBadge,
      scamFlags: result.flags ?? [],
      lastScoredAt: new Date(),
    },
    update: {
      reliabilityScore: score,
      trustLabel: result.trustLabel,
      trustBadge: result.trustBadge,
      scamFlags: result.flags ?? [],
      lastScoredAt: new Date(),
    },
  });

  const methodIcon = method === "ai" ? "🤖" : "📐";
  console.log(
    `✅ [RISK] ${score}/100 — ${result.trustLabel} ${methodIcon} (${method})`,
  );
  if (result.reasoning) {
    console.log(`   💬 ${result.reasoning}`);
  }
  if (result.flags?.length > 0) {
    console.log(`   🚩 Flags : ${result.flags.join(", ")}`);
  }
  if (result.strengths?.length > 0) {
    console.log(`   💪 Forces : ${result.strengths.join(", ")}`);
  }

  return score;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚨  PARTIE 7 — ALERTE SI CHUTE BRUTALE DU SCORE
// ═══════════════════════════════════════════════════════════════════════════════

async function checkScoreAlert(userId, oldScore, newScore) {
  const drop = (oldScore ?? 50) - newScore;

  // Chute de plus de 20 points → alerte admin
  if (drop >= 20) {
    console.warn(
      `🚨 [RISK ALERT] User ${userId} : score chute de ${oldScore} → ${newScore} (-${drop} pts)`,
    );

    // Ici : envoyer webhook Slack/Discord ou créer une tâche admin
    // await notifyAdmin({ userId, oldScore, newScore, drop });
  }

  // Score passe sous 30 → signaler automatiquement
  if (newScore < 30 && (oldScore ?? 100) >= 30) {
    console.warn(
      `🔴 [RISK ALERT] User ${userId} passe en TRÈS RISQUÉ (${newScore})`,
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯  PARTIE 8 — FONCTION PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════════

async function updateUserRiskScore(userId, triggerEvent = "MANUAL") {
  console.log(`\n🔍 [RISK] Analyse ${userId} — déclencheur : ${triggerEvent}`);

  try {
    // 1. Collecter les données
    const userData = await collectUserData(userId);
    if (!userData) {
      console.error(`❌ [RISK] Utilisateur ${userId} introuvable`);
      return null;
    }

    const { user, metrics, rawData } = userData;
    const oldScore = user.stats?.reliabilityScore ?? null;

    // 2. Construire le profil texte
    const userProfile = buildUserProfile(user, metrics, rawData);

    // 3. Tentative IA
    let result;
    let method = "ai";

    try {
      result = await callAIRiskScoring(userProfile);
    } catch (aiErr) {
      console.warn(
        `⚠️ [RISK] IA indisponible (${aiErr.message}) → fallback métier`,
      );
      method = "fallback";

      const fallbackScore = calculateFallbackRiskScore(metrics);
      const trust = getTrustLevel(fallbackScore);
      result = {
        riskScore: fallbackScore,
        trustLabel: trust.label,
        trustBadge: trust.badge,
        flags: [],
        strengths: [],
        reasoning: "Score calculé par règles métier (IA indisponible)",
      };
    }

    // 4. Sauvegarder
    const finalScore = await saveRiskScore(userId, result, method);

    // 5. Vérifier les alertes
    await checkScoreAlert(userId, oldScore, finalScore);

    return finalScore;
  } catch (err) {
    console.error(`❌ [RISK] Erreur critique pour ${userId} :`, err.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⚡  PARTIE 9 — DÉCLENCHEURS AUTOMATIQUES PAR ÉVÉNEMENT
// ═══════════════════════════════════════════════════════════════════════════════

const TRIGGER_EVENTS = {
  BOOKING_COMPLETED: "BOOKING_COMPLETED",
  BOOKING_CANCELLED: "BOOKING_CANCELLED",
  REVIEW_CREATED: "REVIEW_CREATED",
  DISPUTE_OPENED: "DISPUTE_OPENED",
  REPORT_CREATED: "REPORT_CREATED",
  USER_VERIFIED: "USER_VERIFIED",
  LISTING_FLAGGED: "LISTING_FLAGGED",
  MESSAGE_BLOCKED: "MESSAGE_BLOCKED",
};

async function onBookingCompleted(bookingId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { tenantId: true, ownerId: true },
  });
  if (!booking) return;
  await updateUserRiskScore(booking.tenantId, TRIGGER_EVENTS.BOOKING_COMPLETED);
  if (booking.ownerId) {
    await updateUserRiskScore(
      booking.ownerId,
      TRIGGER_EVENTS.BOOKING_COMPLETED,
    );
  }
}

async function onBookingCancelled(bookingId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { tenantId: true },
  });
  if (booking)
    await updateUserRiskScore(
      booking.tenantId,
      TRIGGER_EVENTS.BOOKING_CANCELLED,
    );
}

async function onReviewCreated(reviewId) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { targetId: true },
  });
  if (review)
    await updateUserRiskScore(review.targetId, TRIGGER_EVENTS.REVIEW_CREATED);
}

async function onDisputeOpened(disputeId) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    select: {
      openedBy: true,
      booking: { select: { tenantId: true, ownerId: true } },
    },
  });
  if (!dispute) return;
  const toUpdate = new Set(
    [
      dispute.openedBy,
      dispute.booking?.tenantId,
      dispute.booking?.ownerId,
    ].filter(Boolean),
  );
  for (const uid of toUpdate) {
    await updateUserRiskScore(uid, TRIGGER_EVENTS.DISPUTE_OPENED);
  }
}

async function onReportCreated(reportId) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { reportedId: true },
  });
  if (report)
    await updateUserRiskScore(report.reportedId, TRIGGER_EVENTS.REPORT_CREATED);
}

async function onUserVerified(userId) {
  await updateUserRiskScore(userId, TRIGGER_EVENTS.USER_VERIFIED);
}

async function onMessageBlocked(userId) {
  await updateUserRiskScore(userId, TRIGGER_EVENTS.MESSAGE_BLOCKED);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🕐  PARTIE 10 — CRON INTELLIGENT (pas de full table scan)
//
//  Stratégie par priorité :
//  1. Users JAMAIS scorés → traiter en premier
//  2. Users scorés il y a > 7 jours ET ont eu de l'activité récente
//  3. Users à haut risque (score < 40) → re-scorer chaque 3 jours
//  On ne re-score PAS les users inactifs récemment scorés → économie IA
// ═══════════════════════════════════════════════════════════════════════════════

async function dailyRiskScoreUpdate() {
  console.log(`\n🕐 [CRON] Mise à jour quotidienne des scores de risque`);
  console.log(`   ${new Date().toLocaleString("fr-FR")}`);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 86_400_000);
  const oneDayAgo = new Date(now.getTime() - 1 * 86_400_000);

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  // ── Priorité 1 : jamais scorés ────────────────────────────────────────────
  const neverScored = await prisma.user.findMany({
    where: {
      OR: [{ stats: null }, { stats: { lastScoredAt: null } }],
      status: { not: "PERMANENTLY_BANNED" },
    },
    select: { id: true },
    take: CRON_BATCH_SIZE,
  });

  console.log(`   📋 Jamais scorés : ${neverScored.length}`);
  for (const { id } of neverScored) {
    const result = await updateUserRiskScore(id, "CRON_NEVER_SCORED");
    result !== null ? processed++ : errors++;
    await new Promise((r) => setTimeout(r, CRON_DELAY_MS));
  }

  // ── Priorité 2 : haut risque → re-scorer toutes les 3 jours ─────────────
  const highRisk = await prisma.user.findMany({
    where: {
      riskScore: { lt: 40 },
      stats: { lastScoredAt: { lt: threeDaysAgo } },
      status: { not: "PERMANENTLY_BANNED" },
    },
    select: { id: true },
    take: CRON_BATCH_SIZE,
  });

  console.log(`   🔴 Haut risque à re-scorer : ${highRisk.length}`);
  for (const { id } of highRisk) {
    const result = await updateUserRiskScore(id, "CRON_HIGH_RISK");
    result !== null ? processed++ : errors++;
    await new Promise((r) => setTimeout(r, CRON_DELAY_MS));
  }

  // ── Priorité 3 : actifs récemment, scorés il y a > 7 jours ──────────────
  const activeStale = await prisma.user.findMany({
    where: {
      lastLogin: { gte: oneDayAgo }, // Connecté dans les 24h
      stats: { lastScoredAt: { lt: sevenDaysAgo } }, // Score périmé
      riskScore: { gte: 40 }, // Score correct (pas déjà traité)
      status: { not: "PERMANENTLY_BANNED" },
    },
    select: { id: true },
    take: CRON_BATCH_SIZE,
    orderBy: { lastLogin: "desc" },
  });

  console.log(`   🟡 Actifs avec score périmé : ${activeStale.length}`);
  for (const { id } of activeStale) {
    const result = await updateUserRiskScore(id, "CRON_ACTIVE_STALE");
    result !== null ? processed++ : errors++;
    await new Promise((r) => setTimeout(r, CRON_DELAY_MS));
  }

  // ── Résumé ────────────────────────────────────────────────────────────────
  console.log(`\n✅ [CRON] Terminé`);
  console.log(
    `   Traités : ${processed} | Erreurs : ${errors} | Ignorés : ${skipped}`,
  );
  console.log(`   Appels IA économisés (users inactifs non re-scorés) ✅\n`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📤  EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  // Fonction principale
  updateUserRiskScore,

  // Fallback (utile pour tests unitaires)
  calculateFallbackRiskScore,
  getTrustLevel,

  // Déclencheurs événements
  onBookingCompleted,
  onBookingCancelled,
  onReviewCreated,
  onDisputeOpened,
  onReportCreated,
  onUserVerified,
  onMessageBlocked,

  // Cron
  dailyRiskScoreUpdate,

  // Constantes
  TRIGGER_EVENTS,
};
