// app/api/users/vacation-mode/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    const { enabled, message } = await req.json();

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.update({
      where: { clerkId },
      data: {
        vacationMode: enabled,
        vacationMessage: message || null,
      },
    });

    return NextResponse.json({ 
      success: true, 
      vacationMode: user.vacationMode,
      vacationMessage: user.vacationMessage,
    });
  } catch (error) {
    console.error("[POST /api/users/vacation-mode] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}