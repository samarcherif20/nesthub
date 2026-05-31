// app/api/bookings/[id]/receipt/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { generateReceiptPDF } from "@/lib/receipt-pdf-generator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    // Récupérer l'utilisateur courant
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Récupérer la réservation
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        listing: true,
        tenant: true,
        owner: true,
        payments: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 });
    }

    // Vérifier que l'utilisateur est soit le locataire, soit le propriétaire, soit admin
    const isTenant = booking.tenantId === currentUser.id;
    const isOwner = booking.ownerId === currentUser.id;
    const isAdmin = currentUser.role === "ADMIN";

    if (!isTenant && !isOwner && !isAdmin) {
      return NextResponse.json({ error: "Accès refusé - Vous n'êtes pas autorisé à voir ce reçu" }, { status: 403 });
    }

    const nights = booking.totalNights || Math.ceil(
      (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const paidPayment = booking.payments.find(p => p.status === "PAID");

    const receiptData = {
      reference: booking.reference,
      bookingId: booking.id,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: nights,
      guests: booking.guests || 1,
      totalPrice: booking.totalPrice || 0,
      cleaningFee: booking.cleaningFee || 0,
      serviceFee: booking.serviceFee || 0,
      pricePerNight: booking.pricePerNight || 0,
      listing: {
        title: booking.listing.title,
        governorate: booking.listing.governorate || "",
        delegation: booking.listing.delegation || "",
      },
      tenant: {
        firstName: booking.tenant.firstName || "",
        lastName: booking.tenant.lastName || "",
        email: booking.tenant.email || "",
      },
      owner: {
        firstName: booking.owner?.firstName || "",
        lastName: booking.owner?.lastName || "",
        email: booking.owner?.email || "",
      },
      payment: {
        status: paidPayment?.status || "PENDING",
        providerTransactionId: paidPayment?.providerTransactionId,
        paidAt: paidPayment?.paidAt,
      },
      createdAt: new Date(),
    };

    const pdfBase64 = await generateReceiptPDF(receiptData);
    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="recu_${booking.reference || booking.id.slice(-8)}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[Receipt API] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}