import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const formData = await req.formData();
    const audio = formData.get("audio") as File;
    const conversationId = formData.get("conversationId") as string;
    const recipientId = formData.get("recipientId") as string;
    const duration = formData.get("duration") as string;

    if (!audio || !conversationId || !recipientId) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 },
      );
    }

    console.log("🎤 Upload message vocal pour conversation:", conversationId);
    console.log("📊 Durée reçue brute:", duration);

    const audioBuf = await audio.arrayBuffer().then((b) => Buffer.from(b));
    const ts = Date.now();

    // ✅ GARDER access: "private"
    const blob = await put(
      `voice/${conversationId}/${ts}-${audio.name}`,
      audioBuf,
      {
        access: "private",
        contentType: "audio/webm",
        addRandomSuffix: true,
      },
    );

    console.log("✅ Upload vocal réussi:", blob.url);

    const sender = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profilePictureUrl: true,
      },
    });

    if (!sender) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { ownerId: true, tenantId: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation non trouvée" },
        { status: 404 },
      );
    }

    const finalReceiverId =
      conversation.ownerId === sender.id
        ? conversation.tenantId
        : conversation.ownerId;

    const durationInt = parseInt(duration, 10) || 0;
    console.log("📊 Durée sauvegardée:", durationInt);

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: sender.id,
        receiverId: finalReceiverId,
        content: "🎤 Message vocal",
        type: "voice",
        voiceUrl: blob.url,
        duration: durationInt,
        isBlocked: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
          },
        },
      },
    });

    console.log(`✅ Message vocal créé: ${message.id}`);

    const formattedMessage = {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      senderName:
        `${message.sender.firstName || ""} ${message.sender.lastName || ""}`.trim(),
      senderImage: message.sender.profilePictureUrl,
      createdAt: message.createdAt.toISOString(),
      isBlocked: message.isBlocked,
      isRead: message.isRead,
      type: message.type,
      voiceUrl: message.voiceUrl,
      duration: message.duration,
    };

    if (global.io) {
      const roomName = `conv:${conversationId}`;
      console.log(`📡 Émission du message vocal à la room: ${roomName}`);
      global.io.to(roomName).emit("new-message", formattedMessage);
    }

    return NextResponse.json({
      success: true,
      message: formattedMessage,
    });
  } catch (error) {
    console.error("[messages/voice] POST Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const voiceUrl = req.nextUrl.searchParams.get("url");

    if (!voiceUrl) {
      return NextResponse.json({ error: "URL manquante" }, { status: 400 });
    }

    console.log("🎵 Récupération audio");

    const response = await fetch(voiceUrl, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    if (!response.ok) {
      console.error("Erreur fetch blob:", response.status);
      return NextResponse.json({ error: "Audio non trouvé" }, { status: 404 });
    }

    const buffer = await response.arrayBuffer();
    console.log("🎵 Audio récupéré, taille:", buffer.byteLength, "bytes");

    // ✅ Détecter le type MIME réel
    const contentType = response.headers.get("content-type") || "audio/ogg";
    console.log("🎵 Content-Type original:", contentType);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/ogg",  // ✅ Plus compatible
        "Content-Length": buffer.byteLength.toString(),
        "Cache-Control": "public, max-age=3600",
        "Accept-Ranges": "bytes",
      },
    });
  } catch (error) {
    console.error("[messages/voice] GET Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}