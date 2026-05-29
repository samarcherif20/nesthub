// app/api/admin/disputes/[id]/resolve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    const admin = await prisma.user.findUnique({ 
      where: { clerkId: userId },
      select: { id: true, role: true, firstName: true, lastName: true }
    });
    
    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            listing: true,
            tenant: true,
            owner: true,
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Litige non trouvé" }, { status: 404 });
    }

    // Déterminer qui est le demandeur et qui est le défendeur
    const isReporterOwner = dispute.openedBy === dispute.booking?.ownerId;
    const plaintiff = isReporterOwner ? dispute.booking?.owner : dispute.booking?.tenant;
    const defendant = isReporterOwner ? dispute.booking?.tenant : dispute.booking?.owner;

    //  Mise à jour SANS argent
    const updatedDispute = await prisma.dispute.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolution: `Litige résolu par l'administrateur ${admin.firstName} ${admin.lastName}.`,
        resolvedAt: new Date(),
        assignedTo: admin.id,
      },
    });

    // Notification pour le demandeur
    if (plaintiff?.id) {
      await prisma.notification.create({
        data: {
          userId: plaintiff.id,
          type: "DISPUTE_RESOLVED",
          title: " Votre litige a été résolu",
          content: `Bonjour ${plaintiff.firstName}, le litige que vous avez ouvert concernant "${dispute.booking?.listing?.title}" a été résolu par l'administrateur.`,
          channels: ["IN_APP", "EMAIL"],
          data: { disputeId: dispute.id },
        },
      });
    }

    // Notification pour le défendeur
    if (defendant?.id) {
      await prisma.notification.create({
        data: {
          userId: defendant.id,
          type: "DISPUTE_RESOLVED",
          title: " Un litige vous concernant a été résolu",
          content: `Bonjour ${defendant.firstName}, le litige concernant "${dispute.booking?.listing?.title}" a été résolu par l'administrateur.`,
          channels: ["IN_APP", "EMAIL"],
          data: { disputeId: dispute.id },
        },
      });
    }

    return NextResponse.json({ success: true, dispute: updatedDispute });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}