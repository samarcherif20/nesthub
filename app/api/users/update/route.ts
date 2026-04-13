import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const {
      userId,
      firstName,
      lastName,
      bio,
      phoneNumber,
      phoneVerified,
      phoneVerifiedAt,
      profilePictureUrl,
      isEmailVerified,
      preferredLocale,
    } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { clerkId: userId },
      data: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        bio: bio || undefined,
        phoneNumber: phoneNumber || undefined,
        phoneVerified: phoneVerified ?? undefined,
        phoneVerifiedAt: phoneVerifiedAt
          ? new Date(phoneVerifiedAt)
          : undefined,
        profilePictureUrl: profilePictureUrl || undefined,
        isEmailVerified: isEmailVerified ?? undefined,
        preferredLocale: preferredLocale || undefined,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("❌ Erreur update user:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
