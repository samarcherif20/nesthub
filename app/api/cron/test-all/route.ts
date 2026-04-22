// app/api/cron/test-all/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const authToken = req.headers.get("authorization") || `Bearer ${process.env.CRON_SECRET}`;
  
  const cronJobs = [
    { name: "expire-info-requests", path: "/api/cron/expire-info-requests" },
    { name: "expire-offers", path: "/api/cron/expire-offers" },
    { name: "release-expired-bookings", path: "/api/cron/release-expired-bookings" },
    { name: "reactivate-users", path: "/api/cron/reactivate-users" },
  ];
  
  const results: any = {};
  
  for (const cron of cronJobs) {
    console.log(`🕐 Test de ${cron.name}...`);
    
    try {
      const response = await fetch(`${baseUrl}${cron.path}`, {
        method: "POST",
        headers: {
          "Authorization": authToken,
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      
      results[cron.name] = {
        status: response.status,
        ok: response.ok,
        data: data,
        timestamp: new Date().toISOString(),
      };
      
      console.log(`✅ ${cron.name}: ${response.status}`);
    } catch (error: any) {
      console.log(`❌ ${cron.name}:`, error.message);
      results[cron.name] = {
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    results,
  });
}