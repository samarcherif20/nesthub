import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const infoRequest = await prisma.infoRequest.findUnique({
      where: { id },
    });

    if (!infoRequest) {
      return NextResponse.json(
        { error: "Demande non trouvée" },
        { status: 404 },
      );
    }

    if (infoRequest.ownerId !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const updated = await prisma.infoRequest.update({
      where: { id },
      data: { status, respondedAt: new Date() },
    });

    // Créer une notification pour le locataire
    await prisma.notification.create({
      data: {
        userId: infoRequest.tenantId,
        type:
          status === "ACCEPTED"
            ? "INFO_REQUEST_ACCEPTED"
            : "INFO_REQUEST_REJECTED",
        title: status === "ACCEPTED" ? "Demande acceptée" : "Demande refusée",
        content:
          status === "ACCEPTED"
            ? "Votre demande d'information a été acceptée par le propriétaire"
            : "Votre demande d'information a été refusée par le propriétaire",
        data: { infoRequestId: id },
        channels: ["IN_APP", "EMAIL"],
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
