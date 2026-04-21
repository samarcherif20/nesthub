// app/api/listings/availability/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api/withAuth";

// GET - Public (pas de withAuth)
export async function GET(request: NextRequest) {
  try {
    console.log("🔵 [GET /api/listings/availability] Début de la requête");

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");
    const year = parseInt(
      searchParams.get("year") || new Date().getFullYear().toString(),
    );
    const month = parseInt(
      searchParams.get("month") || (new Date().getMonth() + 1).toString(),
    );

    console.log(
      `📊 Paramètres: listingId=${listingId}, year=${year}, month=${month}`,
    );

    if (!listingId) {
      console.log("❌ Aucun listingId fourni");
      return NextResponse.json({ error: "listingId requis" }, { status: 400 });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);

    console.log(
      `📅 Période: ${startDate.toISOString()} -> ${endDate.toISOString()}`,
    );

    // ✅ AJOUTER pendingBookings
    const [blockedDates, bookings, pricingRules, pendingBookings] =
      await Promise.all([
        prisma.blockedDate.findMany({
          where: {
            listingId: listingId,
            OR: [
              { startDate: { gte: startDate, lte: endDate } },
              { endDate: { gte: startDate, lte: endDate } },
            ],
          },
        }),
        prisma.booking.findMany({
          where: {
            listingId: listingId,
            status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
            OR: [
              { checkIn: { gte: startDate, lte: endDate } },
              { checkOut: { gte: startDate, lte: endDate } },
            ],
          },
          include: {
            tenant: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        }),
        prisma.pricingRule.findMany({
          where: {
            listingId: listingId,
            isActive: true,
            OR: [
              { startDate: { gte: startDate, lte: endDate } },
              { endDate: { gte: startDate, lte: endDate } },
            ],
          },
        }),
        // ✅ NOUVEAU: Récupérer les pending bookings (offres acceptées en attente de paiement)
        prisma.pendingBooking.findMany({
          where: {
            listingId: listingId,
            expiresAt: { gt: new Date() }, // Non expirées
            isReleased: false,
          },
        }),
      ]);

    // ✅ Convertir les pending bookings en format blockedDates pour le frontend
    const pendingBlockedDates = pendingBookings.flatMap((pb) => {
      const dates = pb.dates as string[];
      return dates.map((dateStr) => ({
        id: `pending-${pb.id}-${dateStr}`,
        listingId: pb.listingId,
        startDate: new Date(dateStr),
        endDate: new Date(dateStr),
        reason: `⏳ En attente de paiement - Expire ${new Date(pb.expiresAt).toLocaleString()}`,
        isRecurring: false,
        blockedById: "",
        createdAt: new Date(),
      }));
    });

    // ✅ Fusionner toutes les dates bloquées
    const allBlockedDates = [...blockedDates, ...pendingBlockedDates];

    console.log(`📊 Résultats:`);
    console.log(`   - blockedDates: ${blockedDates.length}`);
    console.log(`   - pendingBlockedDates: ${pendingBlockedDates.length}`);
    console.log(`   - bookings: ${bookings.length}`);
    console.log(`   - pricingRules: ${pricingRules.length}`);

    // Log détaillé des blockedDates
    if (allBlockedDates.length > 0) {
      console.log("📅 Toutes les dates bloquées (y compris pending):");
      allBlockedDates.forEach((bd, i) => {
        console.log(
          `   ${i + 1}. id=${bd.id}, startDate=${bd.startDate}, endDate=${bd.endDate}, reason=${bd.reason}`,
        );
      });
    } else {
      console.log("⚠️ Aucune date bloquée trouvée");
    }

    // Log détaillé des pricingRules
    if (pricingRules.length > 0) {
      console.log("💰 pricingRules détaillés:");
      pricingRules.forEach((pr, i) => {
        console.log(
          `   ${i + 1}. id=${pr.id}, startDate=${pr.startDate}, endDate=${pr.endDate}, fixedPrice=${pr.fixedPrice}`,
        );
      });
    } else {
      console.log("⚠️ Aucune règle de prix trouvée");
    }

    // Log détaillé des bookings
    if (bookings.length > 0) {
      console.log("🏠 bookings détaillés:");
      bookings.forEach((b, i) => {
        console.log(
          `   ${i + 1}. id=${b.id}, checkIn=${b.checkIn}, checkOut=${b.checkOut}, status=${b.status}`,
        );
      });
    } else {
      console.log("⚠️ Aucune réservation trouvée");
    }

    const response = {
      blockedDates: allBlockedDates,
      bookings,
      pricingRules,
    };

    console.log("✅ Réponse envoyée avec succès");
    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ [GET /api/listings/availability] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Modifications (réservé aux propriétaires)
export const POST = withAuth(
  async (request: NextRequest) => {
    console.log("🔵 [POST /api/listings/availability] Début de la requête");

    const user = (request as any).user;
    console.log(`👤 Utilisateur: ${user.id}, role: ${user.role}`);

    const body = await request.json();
    console.log("📦 Body reçu:", JSON.stringify(body, null, 2));

    const { listingId, action, dates, reason, customPrice, minStay } = body;

    console.log(`📊 Action: ${action}, listingId: ${listingId}`);
    console.log(`📅 Dates: ${dates?.join(", ")}`);
    if (reason) console.log(`💬 Raison: ${reason}`);
    if (customPrice) console.log(`💰 Prix spécial: ${customPrice}`);

    const listing = await prisma.listing.findFirst({
      where: { id: listingId, ownerId: user.id },
    });

    if (!listing) {
      console.log(
        `❌ Annonce non trouvée ou non autorisée: listingId=${listingId}, ownerId=${user.id}`,
      );
      return NextResponse.json(
        { error: "Annonce non trouvée ou non autorisée" },
        { status: 404 },
      );
    }

    console.log(`✅ Annonce trouvée: ${listing.title} (${listing.id})`);

    if (action === "block") {
      console.log(`🔒 Blocage de ${dates.length} date(s)`);
      let blockedCount = 0;

      for (const dateStr of dates) {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        console.log(
          `   Traitement de la date: ${dateStr} -> ${date.toISOString()}`,
        );

        const existing = await prisma.blockedDate.findFirst({
          where: { listingId, startDate: date, endDate: date },
        });

        if (existing) {
          console.log(`   ⚠️ Date déjà bloquée, mise à jour de la raison`);
          await prisma.blockedDate.update({
            where: { id: existing.id },
            data: { reason: reason || existing.reason },
          });
        } else {
          console.log(`   ✅ Création d'un nouveau blocage`);
          await prisma.blockedDate.create({
            data: {
              listingId,
              startDate: date,
              endDate: date,
              reason: reason || null,
              blockedById: user.id,
            },
          });
          blockedCount++;
        }
      }

      console.log(`✅ ${blockedCount} nouvelles dates bloquées`);
      return NextResponse.json({
        success: true,
        message: `${dates.length} date(s) bloquée(s)`,
        blockedCount,
      });
    }

    if (action === "unblock") {
      console.log(`🔓 Déblocage de ${dates.length} date(s)`);
      let unblockedCount = 0;

      for (const dateStr of dates) {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        console.log(`   Suppression du blocage pour: ${dateStr}`);

        const result = await prisma.blockedDate.deleteMany({
          where: { listingId, startDate: date, endDate: date },
        });

        if (result.count > 0) {
          unblockedCount++;
          console.log(`   ✅ Blocage supprimé`);
        } else {
          console.log(`   ⚠️ Aucun blocage trouvé pour cette date`);
        }
      }

      console.log(`✅ ${unblockedCount} dates débloquées`);
      return NextResponse.json({
        success: true,
        message: `${dates.length} date(s) débloquée(s)`,
        unblockedCount,
      });
    }

    if (action === "setPrice") {
      const price = parseFloat(customPrice);
      console.log(
        `💰 Application d'un prix spécial: ${price} TND pour ${dates.length} date(s)`,
      );

      if (isNaN(price) || price <= 0) {
        console.log(`❌ Prix invalide: ${customPrice}`);
        return NextResponse.json({ error: "Prix invalide" }, { status: 400 });
      }

      let priceCount = 0;

      for (const dateStr of dates) {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        console.log(`   Traitement de la date: ${dateStr}`);

        const existing = await prisma.pricingRule.findFirst({
          where: { listingId, startDate: date, endDate: date },
        });

        if (existing) {
          console.log(`   ⚠️ Règle existante, mise à jour du prix`);
          await prisma.pricingRule.update({
            where: { id: existing.id },
            data: { fixedPrice: price, isActive: true },
          });
        } else {
          console.log(`   ✅ Création d'une nouvelle règle de prix`);
          await prisma.pricingRule.create({
            data: {
              listingId,
              name: `Prix spécial ${dateStr}`,
              fixedPrice: price,
              startDate: date,
              endDate: date,
              isActive: true,
              priority: 10,
            },
          });
          priceCount++;
        }
      }

      console.log(`✅ ${priceCount} nouvelles règles de prix créées`);
      return NextResponse.json({
        success: true,
        message: `Prix appliqué à ${dates.length} date(s)`,
        priceCount,
      });
    }

    console.log(`❌ Action non reconnue: ${action}`);
    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
  },
  { requiredRole: "OWNER" },
);
