import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const recipientId = searchParams.get("userId");

    if (!recipientId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, firstName: true, lastName: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hasBlockedUser = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: currentUser.id,
          blockedId: recipientId
        }
      }
    });

    const isBlockedByUser = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: recipientId,
          blockedId: currentUser.id
        }
      }
    });

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { firstName: true, lastName: true }
    });

    const recipientName = recipient 
      ? `${recipient.firstName || ""} ${recipient.lastName || ""}`.trim()
      : "cet utilisateur";

    return NextResponse.json({
      hasBlockedUser: !!hasBlockedUser,
      isBlockedByUser: !!isBlockedByUser,
      recipientName
    });
  } catch (error) {
    console.error("Error in block-status API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}