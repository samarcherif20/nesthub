// app/api/disputes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { onDisputeOpened } from "@/lib/risk-scoring";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { bookingId, type, subject, description, evidence, priority } = await request.json();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: true, tenant: true, owner: true }
    });

    if (!booking) {
      return NextResponse.json({ error: "Reservation non trouvee" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouve" }, { status: 404 });
    }

    const isTenant = booking.tenantId === user.id;
    const isOwner = booking.ownerId === user.id;

    if (!isTenant && !isOwner) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const existing = await prisma.dispute.findFirst({
      where: { bookingId }
    });

    if (existing) {
      return NextResponse.json({ error: "Un litige existe deja pour cette reservation" }, { status: 400 });
    }

    const fullDescription = subject 
      ? `Sujet: ${subject}\n\nDescription: ${description}` 
      : description;

    const finalPriority = priority || "MEDIUM";

    const dispute = await prisma.dispute.create({
      data: {
        bookingId,
        openedBy: user.id,
        type,
        description: fullDescription,
        evidence: evidence || [],
        status: "OPEN",
        priority: finalPriority,
      }
    });
    
    await onDisputeOpened(dispute.id);

    const otherUserId = isTenant ? booking.ownerId : booking.tenantId;
    if (otherUserId) {
      await prisma.notification.create({
        data: {
          userId: otherUserId,
          type: "DISPUTE_OPENED",
          title: "Nouveau litige ouvert",
          content: `Un litige a ete ouvert concernant ${booking.listing.title}`,
          data: { disputeId: dispute.id }
        }
      });
    }

    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: "DISPUTE_OPENED_ADMIN",
          title: "Nouveau litige a traiter",
          content: `${isTenant ? "Locataire" : "Proprietaire"} a ouvert un litige pour "${booking.listing.title}" (Priorite: ${finalPriority})`,
          data: { disputeId: dispute.id }
        }
      });
    }

    return NextResponse.json({ success: true, dispute }, { status: 201 });
  } catch (error) {
    console.error("Erreur creation litige:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET - Recuperer les litiges
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouve" }, { status: 404 });
    }

    const disputes = await prisma.dispute.findMany({
      where: {
        OR: [
          { openedBy: user.id },
          { booking: { ownerId: user.id } },
          { booking: { tenantId: user.id } }
        ]
      },
      include: {
        booking: {
          include: {
            listing: { 
              select: { 
                id: true, 
                title: true, 
                governorate: true, 
                delegation: true
              } 
            },
            tenant: { 
              select: { 
                id: true, 
                firstName: true, 
                lastName: true, 
                username: true, 
                email: true 
              } 
            },
            owner: { 
              select: { 
                id: true, 
                firstName: true, 
                lastName: true, 
                username: true 
              } 
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(disputes);
  } catch (error) {
    console.error("Erreur recuperation litiges:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}