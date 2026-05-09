import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "UserId is required" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0 },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resetting login attempts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}