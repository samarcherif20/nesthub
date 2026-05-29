// app/api/admin/disputes/[id]/reject/route.ts
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
            tenant: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Litige non trouvé" }, { status: 404 });
    }

    // Déterminer qui est le demandeur (celui qui a ouvert le litige) et le défendeur
    const isPlaintiffOwner = dispute.openedBy === dispute.booking?.owner?.id;
    const plaintiff = isPlaintiffOwner ? dispute.booking?.owner : dispute.booking?.tenant;
    const defendant = isPlaintiffOwner ? dispute.booking?.tenant : dispute.booking?.owner;

    // Mettre à jour le litige
    const updatedDispute = await prisma.dispute.update({
      where: { id },
      data: {
        status: "REJECTED",
        resolution: `Litige rejeté par l'administrateur ${admin.firstName} ${admin.lastName}. Aucun remboursement accordé.`,
        resolvedAt: new Date(),
        assignedTo: admin.id,
      },
    });

    //  Notification pour le DEMANDEUR (celui qui a ouvert le litige)
    if (plaintiff?.id) {
      await prisma.notification.create({
        data: {
          userId: plaintiff.id,
          type: "DISPUTE_REJECTED",
          title: " Votre litige a été rejeté",
          content: `Bonjour ${plaintiff.firstName}, le litige concernant "${dispute.booking?.listing?.title}" que vous avez ouvert a été rejeté par l'administrateur. Aucun remboursement ne sera effectué.`,
          channels: ["IN_APP", "EMAIL"],
          data: { disputeId: dispute.id },
        },
      });
    }

    //  Notification pour le DÉFENDEUR (celui contre qui le litige a été ouvert)
    if (defendant?.id) {
      await prisma.notification.create({
        data: {
          userId: defendant.id,
          type: "DISPUTE_REJECTED",
          title: " Un litige vous concernant a été rejeté",
          content: `Bonjour ${defendant.firstName}, le litige concernant "${dispute.booking?.listing?.title}" a été rejeté par l'administrateur. Aucune action n'est requise de votre part.`,
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