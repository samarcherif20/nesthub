// Version sans bcryptjs (via Clerk)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAuth, isAuthError } from "@/lib/auth-admin";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const auth = getAdminAuth(request);
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { currentPassword, newPassword } = await request.json();

    // Utiliser Clerk pour changer le mot de passe
    const client = await clerkClient();

    await client.users.updateUser(auth.userId, {
      password: newPassword,
    });

    return NextResponse.json({
      success: true,
      message: "Mot de passe mis à jour avec succès",
    });
  } catch (error) {
    console.error("❌ Error updating password:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 },
    );
  }
}
