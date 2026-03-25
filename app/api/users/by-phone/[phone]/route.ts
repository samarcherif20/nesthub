import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    const { phone } = await params;
    const decodedPhone = decodeURIComponent(phone);
    
    const user = await prisma.user.findFirst({
      where: { phoneNumber: decodedPhone },
      select: {
        id: true,
        email: true,
        username: true,
        phoneNumber: true,
        role: true,
        clerkId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Phone number not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user by phone:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}