// app/api/admin/payouts/mark-paid/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { payoutId } = await req.json();

    if (!payoutId) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    await prisma.booking.update({
      where: { id: payoutId },
      data: {
        escrowStatus: "PAID_MANUALLY",
        paymentStatus: "PAID_MANUALLY",
        note: "Virement manuel effectué par l'admin",
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}