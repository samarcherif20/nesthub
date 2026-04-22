// app/fr/payment/konnect-callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const transactionId = searchParams.get("order_id");
  const status = searchParams.get("status");

  if (!transactionId) {
    return NextResponse.redirect(new URL("/fr/payment/error", req.url));
  }

  // Récupérer la transaction
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    return NextResponse.redirect(new URL("/fr/payment/error", req.url));
  }

  if (status === "success" || transaction.status === "SUCCESS") {
    return NextResponse.redirect(
      new URL(`/fr/payment/success?transactionId=${transactionId}`, req.url)
    );
  }

  return NextResponse.redirect(new URL("/fr/payment/error", req.url));
}