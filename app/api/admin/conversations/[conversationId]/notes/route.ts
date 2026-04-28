// app/api/admin/conversations/[conversationId]/notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ conversationId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        role: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!admin || admin?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 },
      );
    }

    const { conversationId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Le contenu de la note est requis" },
        { status: 400 },
      );
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { ownerId: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation non trouvée" },
        { status: 404 },
      );
    }

    const note = await prisma.adminNote.create({
      data: {
        content: content.trim(),
        authorId: admin.id,
        targetUserId: conversation.ownerId,
        conversationId: conversationId,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Construire le nom complet avec fallbacks
    let adminDisplayName = "Admin";

    if (note.author.firstName && note.author.lastName) {
      adminDisplayName = `${note.author.firstName} ${note.author.lastName}`;
    } else if (note.author.firstName) {
      adminDisplayName = note.author.firstName;
    } else if (note.author.lastName) {
      adminDisplayName = note.author.lastName;
    } else if (note.author.email) {
      // Nettoie l'email pour n'avoir que la partie avant @
      adminDisplayName = note.author.email.split("@")[0].replace(/\+.*$/, "");
    }

    return NextResponse.json({
      success: true,
      note: {
        id: note.id,
        content: note.content,
        createdAt: note.createdAt,
        adminName: adminDisplayName,
      },
    });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
