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
      data: { lastLogin: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating last login:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}