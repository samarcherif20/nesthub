// app/api/admin/contact/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [messages, total] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {  // ✅ AJOUTER CETTE SECTION - inclure les infos utilisateur
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profilePictureUrl: true, // ← IMAGE DE PROFIL
            },
          },
        },
      }),
      prisma.contactMessage.count({ where }),
    ]);

    // ✅ Formater les messages avec les infos utilisateur
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      fullName: msg.fullName,
      email: msg.email,
      phone: msg.phone,
      userId: msg.userId,
      userProfilePictureUrl: msg.user?.profilePictureUrl || null, // ← CLÉ POUR L'IMAGE
      userFirstName: msg.user?.firstName || null,
      userLastName: msg.user?.lastName || null,
      message: msg.message,
      status: msg.status,
      reply: msg.reply,
      repliedAt: msg.repliedAt,
      createdAt: msg.createdAt,
    }));

    return NextResponse.json({
      messages: formattedMessages, // ← UTILISER LES MESSAGES FORMATÉS
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}