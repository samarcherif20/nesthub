import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId, role, email, remember } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Mettre à jour la préférence de l'utilisateur (optionnel)
    if (remember) {
      await prisma.user.update({
        where: { id: userId },
        data: { preferredRole: role === "owner" ? "PROPERTY_OWNER" : "TENANT" },
      });
    }

    // Créer une session ou rediriger
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error confirming role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}