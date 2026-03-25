import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { oldClerkId, newClerkId } = await req.json();

  if (!oldClerkId || !newClerkId) {
    return NextResponse.json({ error: "Missing IDs" }, { status: 400 });
  }

  if (oldClerkId === newClerkId) {
    return NextResponse.json({ success: true, message: "IDs already match" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: oldClerkId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { clerkId: oldClerkId },
      data: { 
        clerkId: newClerkId,
        updatedAt: new Date()
      },
    });

    console.log(`✅ ClerkId updated: ${oldClerkId} → ${newClerkId}`);
    return NextResponse.json({ success: true, user: updated });

  } catch (error: any) {
    console.error("❌ Error updating clerkId:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}