import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const { conversationId, revealedInfo, tenant, owner } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId requis" },
        { status: 400 },
      );
    }

    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    };

    const message =
      `🔓 **INFORMATIONS DÉCRYPTÉES** 🔓\n\n` +
      `✅ **Paiement confirmé** pour le séjour du ${formatDate(revealedInfo.checkIn)} au ${formatDate(revealedInfo.checkOut)}\n\n` +
      `**📍 Informations d'accès débloquées :**\n` +
      `${revealedInfo.exactAddress ? `• Adresse exacte : ${revealedInfo.exactAddress}\n` : ""}` +
      `${revealedInfo.accessCode ? `• Code d'accès : ${revealedInfo.accessCode}\n` : ""}` +
      `${revealedInfo.checkinInstructions ? `• Instructions d'arrivée : ${revealedInfo.checkinInstructions}\n` : ""}` +
      `${revealedInfo.ownerPhone ? `• Contact de l'hôte : ${revealedInfo.ownerPhone}\n` : ""}\n\n` +
      `**👤 Détails des voyageurs :**\n` +
      `• ${tenant?.firstName} ${tenant?.lastName}\n` +
      `${tenant?.phone ? `• Téléphone : ${tenant.phone}\n` : ""}` +
      `${tenant?.email ? `• Email : ${tenant.email}\n` : ""}\n\n` +
      `**🏠 Informations sur le logement :**\n` +
      `• ${revealedInfo.listingTitle}\n` +
      `${revealedInfo.listingLocation ? `• ${revealedInfo.listingLocation}\n` : ""}\n\n` +
      `**💰 Récapitulatif financier :**\n` +
      `• ${revealedInfo.nights} nuit(s) × ${revealedInfo.pricePerNight} TND = ${(revealedInfo.pricePerNight * revealedInfo.nights).toLocaleString("fr-FR")} TND\n` +
      `${revealedInfo.cleaningFee > 0 ? `• Frais de ménage : ${revealedInfo.cleaningFee.toLocaleString("fr-FR")} TND\n` : ""}` +
      `${revealedInfo.serviceFee > 0 ? `• Frais de service : ${revealedInfo.serviceFee.toLocaleString("fr-FR")} TND\n` : ""}` +
      `• **Total payé : ${revealedInfo.totalPrice.toLocaleString("fr-FR")} TND**\n\n` +
      `Ces informations sont désormais disponibles dans votre espace de réservation. 🎉`;

    const systemMessage = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        content: message,
        isSystem: true,
        type: "text",
        isRead: false,
      },
    });

    return NextResponse.json({ success: true, message: systemMessage });
  } catch (error) {
    console.error("❌ Erreur envoi notification:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
