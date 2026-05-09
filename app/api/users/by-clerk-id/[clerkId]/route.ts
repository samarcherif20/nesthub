// app/api/users/by-clerk-id/[clerkId]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clerkId: string }> }, // ← ICI : params est une Promise
) {
  try {
    // ✅ Il faut attendre params
    const { clerkId } = await params;

    console.log("🔍 API DB - Recherche pour clerkId:", clerkId);

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        role: true,
        status: true,
        suspendedUntil: true,
        isEmailVerified: true,
        deletedAt: true,
        failedLoginAttempts: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        bio: true,
        profession: true,
        cinNumber: true,
        dateOfBirth: true,
        governorate: true,
        delegation: true,
        spokenLanguages: true,
        gender: true,
        profilePictureUrl: true,
        email: true,
        username: true,
      },
    });

    if (!user) {
      console.log("❌ Utilisateur non trouvé pour clerkId:", clerkId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("✅ Utilisateur trouvé:", user);
    return NextResponse.json(user);
  } catch (error) {
    console.error("❌ Erreur API DB:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
