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
    
    console.log(" [RESPOND] ID reçu:", id);
    
    const body = await request.json();
    console.log(" [RESPOND] Body reçu:", body);
    
    const { status } = body;
    console.log(" [RESPOND] Status extrait:", status);

    if (!status) {
      return NextResponse.json(
        { error: "Le champ 'status' est requis. Utilisez 'ACCEPTED' ou 'REJECTED'" },
        { status: 400 }
      );
    }

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: "Status invalide. Utilisez 'ACCEPTED' ou 'REJECTED'" },
        { status: 400 }
      );
    }

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
      include: {
        listing: {
          select: { id: true, title: true },
        },
        tenant: {
          select: { id: true, username: true },
        },
      },
    });

    if (!infoRequest) {
      return NextResponse.json(
        { error: "Demande non trouvée" },
        { status: 404 },
      );
    }

    if (infoRequest.ownerId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    //  MODIFICATION: Si la demande est déjà dans le bon statut, retourner succès
    if (infoRequest.status === status) {
      console.log(` [RESPOND] Demande déjà ${status}, retour direct`);
      return NextResponse.json(infoRequest);
    }

    //  MODIFICATION: Si la demande n'est plus PENDING mais status différent, erreur
    if (infoRequest.status !== "PENDING") {
      const statusText = infoRequest.status === "ACCEPTED" ? "acceptée" : "refusée";
      return NextResponse.json(
        { error: `Cette demande a déjà été ${statusText}` },
        { status: 400 },
      );
    }

    // Mettre à jour la demande
    const updated = await prisma.infoRequest.update({
      where: { id },
      data: { status, respondedAt: new Date() },
    });

    console.log(` [RESPOND] Demande ${id} mise à jour: ${status}`);

    // Vérifier si une notification existe déjà
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: infoRequest.tenantId,
        type: status === "ACCEPTED" ? "INFO_REQUEST_ACCEPTED" : "INFO_REQUEST_REJECTED",
        data: { path: ["infoRequestId"], equals: infoRequest.id }
      }
    });

    // Créer une notification seulement si elle n'existe pas
    if (!existingNotification) {
      await prisma.notification.create({
        data: {
          userId: infoRequest.tenantId,
          type: status === "ACCEPTED" ? "INFO_REQUEST_ACCEPTED" : "INFO_REQUEST_REJECTED",
          title: status === "ACCEPTED" ? " Demande acceptée" : " Demande refusée",
          content: status === "ACCEPTED"
            ? `Votre demande d'information pour "${infoRequest.listing.title}" a été acceptée par le propriétaire`
            : `Votre demande d'information pour "${infoRequest.listing.title}" a été refusée par le propriétaire`,
          data: {
            infoRequestId: infoRequest.id,
            listingId: infoRequest.listingId,
            listingTitle: infoRequest.listing.title,
            tenantId: infoRequest.tenantId,
            tenantUsername: infoRequest.tenant?.username,
            checkIn: infoRequest.checkIn,
            checkOut: infoRequest.checkOut,
            guests: infoRequest.guests,
            status: status,
          },
          channels: ["IN_APP"],
        },
      });
      console.log(` [RESPOND] Notification envoyée au locataire ${infoRequest.tenantId}`);
    } else {
      console.log(` [RESPOND] Notification déjà existante pour ${infoRequest.tenantId}`);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error(" Erreur dans respond:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}