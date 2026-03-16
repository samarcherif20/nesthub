import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function PUT(req: Request) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const { username, phoneNumber, bio } = body;

    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        phoneNumber,
        bio,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}