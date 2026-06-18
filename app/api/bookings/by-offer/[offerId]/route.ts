// app/api/bookings/by-offer/[offerId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { offerId: string } },
) {
  try {
    const { offerId } = await params;

    const booking = await prisma.booking.findFirst({
      where: { offerId: offerId },
      select: {
        id: true,
        paymentStatus: true,
        escrowStatus: true,
        status: true,
        totalPrice: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ booking: null, isPaid: false });
    }

    const isPaid =
      booking.paymentStatus === "RELEASED" ||
      booking.paymentStatus === "PAID" ||
      booking.escrowStatus === "RELEASED" ||
      booking.escrowStatus === "PAID_MANUALLY";

    return NextResponse.json({ booking, isPaid });
  } catch (error) {
    console.error("Error fetching booking by offer:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
