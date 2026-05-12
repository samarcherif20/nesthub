import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    
    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Désactiver le compte (changer status en INACTIVE)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: "INACTIVE",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deactivating account:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}