// app/api/webhooks/konnect/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-konnect-signature");

    // Vérifier la signature (optionnel mais recommandé)
    if (process.env.KONNECT_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac("sha256", process.env.KONNECT_WEBHOOK_SECRET!)
        .update(rawBody)
        .digest("hex");

      if (signature !== expectedSignature) {
        console.error("Signature webhook invalide");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);

    if (event.type === "payment.success") {
      const { order_id, id, amount, status } = event.data;

      // Mettre à jour la transaction
      const transaction = await prisma.$transaction(async (tx) => {
        const updatedTransaction = await tx.paymentTransaction.update({
          where: { id: order_id },
          data: {
            status: "SUCCESS",
            providerTransactionId: id,
            paidAt: new Date(),
          },
          include: { offer: { include: { listing: true, infoRequest: true } } },
        });

        // Mettre à jour l'offre
        await tx.offer.update({
          where: { id: updatedTransaction.offerId },
          data: { status: "PAID" },
        });

        // Créer la réservation
        const booking = await tx.booking.create({
          data: {
            offerId: updatedTransaction.offerId,
            listingId: updatedTransaction.offer.listingId,
            tenantId: updatedTransaction.userId,
            ownerId: updatedTransaction.offer.ownerId,
            checkIn: updatedTransaction.offer.checkIn,
            checkOut: updatedTransaction.offer.checkOut,
            guests: updatedTransaction.offer.guests,
            totalNights: updatedTransaction.offer.nights,
            pricePerNight: updatedTransaction.offer.pricePerNight,
            totalPrice: updatedTransaction.amount,
            cleaningFee: updatedTransaction.offer.cleaningFee,
            serviceFee: updatedTransaction.offer.serviceFee,
            totalWithFees: updatedTransaction.amount,
            status: "CONFIRMED",
            paymentStatus: "PAID",
            infoRequestId: updatedTransaction.offer.infoRequestId,
          },
        });

        // Supprimer le pending booking
        await tx.pendingBooking.deleteMany({
          where: { offerId: updatedTransaction.offerId },
        });

        // Notifier le locataire
        await tx.notification.create({
          data: {
            userId: updatedTransaction.userId,
            type: "PAYMENT_SUCCESS",
            title: "✅ Paiement confirmé !",
            content: `Votre paiement de ${updatedTransaction.amount} TND pour "${updatedTransaction.offer.listing.title}" a été confirmé.`,
            channels: ["IN_APP", "EMAIL"],
          },
        });

        // Notifier le propriétaire
        await tx.notification.create({
          data: {
            userId: updatedTransaction.offer.ownerId,
            type: "BOOKING_CONFIRMED",
            title: "🎉 Nouvelle réservation confirmée !",
            content: `Un client a réservé "${updatedTransaction.offer.listing.title}" du ${updatedTransaction.offer.checkIn.toLocaleDateString()} au ${updatedTransaction.offer.checkOut.toLocaleDateString()}.`,
            channels: ["IN_APP", "EMAIL"],
          },
        });

        return updatedTransaction;
      });

      console.log(`✅ Paiement ${order_id} confirmé par webhook`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erreur webhook:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}