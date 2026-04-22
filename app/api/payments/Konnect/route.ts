// app/api/payments/konnect/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { offerId, amount, phoneNumber, email } = body;

    // Récupérer l'offre
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { listing: true },
    });

    if (!offer) {
      return NextResponse.json({ error: "Offre non trouvée" }, { status: 404 });
    }

    // Créer une transaction en BDD
    const transaction = await prisma.paymentTransaction.create({
      data: {
        offerId: offer.id,
        userId: userId,
        amount: amount,
        currency: "TND",
        status: "PENDING",
        provider: "KONNECT",
        metadata: {
          phoneNumber,
          email,
          listingTitle: offer.listing.title,
        },
      },
    });

    // Préparer la requête Konnect
    const konnectPayload = {
      amount: Math.round(amount * 1000), // Konnect utilise les millimes
      currency: "TND",
      order_id: transaction.id,
      customer: {
        name: "Client NestHub",
        email: email || "client@nesthub.com",
        phone: phoneNumber || "00000000",
      },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/fr/payment/konnect-callback`,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/konnect`,
      language: "fr",
      metadata: {
        offerId: offer.id,
        userId: userId,
      },
    };

    // Appeler Konnect
    const response = await fetch(`${process.env.KONNECT_BASE_URL}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.KONNECT_API_KEY!,
      },
      body: JSON.stringify(konnectPayload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Konnect error:", error);
      
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: { status: "FAILED", error: error },
      });
      
      return NextResponse.json(
        { error: "Erreur d'initialisation du paiement" },
        { status: 500 }
      );
    }

    const konnectResponse = await response.json();

    // Mettre à jour la transaction avec l'URL de paiement
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        providerTransactionId: konnectResponse.id,
        paymentUrl: konnectResponse.payment_url,
      },
    });

    return NextResponse.json({
      success: true,
      paymentUrl: konnectResponse.payment_url,
      transactionId: transaction.id,
    });
  } catch (error) {
    console.error("Erreur création paiement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}