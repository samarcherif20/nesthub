import { NextResponse } from "next/server";

export async function GET() {
  // TODO: replace with real DB queries later
  return NextResponse.json({
    pendingVerifications: 0,
    pendingReports: 0,
    activeDisputes: 0,
    unreadNotifications: 0,
    pendingInvitations: 0,
  });
}