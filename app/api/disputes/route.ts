// app/api/disputes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { onDisputeOpened } from "@/lib/risk-scoring"; // ← AJOUTER CETTE LIGNE

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { bookingId, type, description, evidence, refundAmount } = await request.json();

    // Vérifier la réservation
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: true, tenant: true, owner: true }
    });

    if (!booking) {
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const isTenant = booking.tenantId === user.id;
    const isOwner = booking.ownerId === user.id;

    if (!isTenant && !isOwner) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Vérifier si un litige existe déjà
    const existing = await prisma.dispute.findFirst({
      where: { bookingId, status: { in: ["OPEN", "IN_REVIEW"] } }
    });

    if (existing) {
      return NextResponse.json({ error: "Un litige est déjà en cours" }, { status: 400 });
    }

    // Déterminer la priorité (exemple simple)
    const priority = refundAmount && refundAmount > 500 ? "HIGH" : refundAmount && refundAmount > 200 ? "MEDIUM" : "LOW";

    // Créer le litige
    const dispute = await prisma.dispute.create({
      data: {
        bookingId,
        openedBy: user.id,
        type,
        description,
        evidence: evidence || [],
        refundAmount: refundAmount || null,
        status: "OPEN",
        priority,
      }
    });
    await onDisputeOpened(dispute.id);

    // Notifier l'autre partie
    const otherUserId = isTenant ? booking.ownerId : booking.tenantId;
    await prisma.notification.create({
      data: {
        userId: otherUserId!,
        type: "DISPUTE_OPENED",
        title: "⚠️ Nouveau litige ouvert",
        content: `Un litige a été ouvert concernant ${booking.listing.title}`,
        data: { disputeId: dispute.id }
      }
    });

    // Notifier tous les admins
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: "DISPUTE_OPENED_ADMIN",
          title: "🆕 Nouveau litige à traiter",
          content: `${isTenant ? "Locataire" : "Propriétaire"} a ouvert un litige`,
          data: { disputeId: dispute.id }
        }
      });
    }

    return NextResponse.json(dispute, { status: 201 });
  } catch (error) {
    console.error("Erreur création litige:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET - Récupérer les litiges de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const disputes = await prisma.dispute.findMany({
      where: {
        OR: [
          { openedBy: user.id },
          { booking: { tenantId: user.id } },
          { booking: { ownerId: user.id } }
        ]
      },
      include: {
        booking: {
          include: {
            listing: { select: { id: true, title: true, governorate: true, delegation: true, photos: { take: 1 } } },
            tenant: { select: { id: true, firstName: true, lastName: true } },
            owner: { select: { id: true, firstName: true, lastName: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(disputes);
  } catch (error) {
    console.error("Erreur récupération litiges:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}