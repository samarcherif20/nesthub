import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    
    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { start, end, enabled } = await req.json();

    const existingUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { notificationPreferences: true }
    });

    const existingPrefs = (existingUser?.notificationPreferences as any) || {};
    
    const updatedPrefs = {
      ...existingPrefs,
      quietHours: { start, end, enabled: enabled ?? true },
    };

    await prisma.user.update({
      where: { clerkId },
      data: {
        notificationPreferences: updatedPrefs,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT quiet-hours error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}