// app/api/conversations/unread-count/route.ts
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ count: 0 });
    }

    const user = await prisma.user.findFirst({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ count: 0 });
    }

    // Compter les messages non lus
    const unreadCount = await prisma.message.count({
      where: {
        receiverId: user.id,
        isRead: false,
        conversation: {
          status: "OPEN"
        }
      }
    });

    return NextResponse.json({ count: unreadCount });
  } catch (error) {
    console.error("[unread-count] Erreur:", error);
    return NextResponse.json({ count: 0 });
  }
}