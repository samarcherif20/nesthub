// lib/dev-cron-trigger.ts
import cron from "node-cron";

const API_BASE = "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET || "dev-secret";

export function startDevCron() {
  // Only run in development
  if (process.env.NODE_ENV !== "development") {
    console.log(" Cron trigger: Not in development mode");
    return;
  }

  console.log("\n Starting Development Cron Triggers...");
  console.log(" Using your existing API routes from app/api/cron/\n");

  // Your EXACT schedule from your config file
  const cronJobs = [
    {
      name: "expire-offers",
      path: "/api/cron/expire-offers",
      schedule: "0 * * * *", // Every hour
    },
    {
      name: "expire-info-requests",
      path: "/api/cron/expire-info-requests",
      schedule: "0 * * * *", // Every hour
    },
    {
      name: "release-expired-bookings",
      path: "/api/cron/release-expired-bookings",
      schedule: "0 * * * *", // Every hour
    },
    {
      name: "check-completed-bookings",
      path: "/api/cron/check-completed-bookings",
      schedule: "0 10 * * *", // Daily at 10 AM
    },
    {
      name: "reactivate-users",
      path: "/api/cron/reactivate-users",
      schedule: "0 */6 * * *", // Every 6 hours
    },
  ];

  // Schedule each job
  cronJobs.forEach((job) => {
    cron.schedule(job.schedule, async () => {
      const timestamp = new Date().toLocaleString();
      console.log(` [${timestamp}] Triggering: ${job.name}...`);

      try {
        const response = await fetch(`${API_BASE}${job.path}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${CRON_SECRET}`,
          },
        });

        const result = await response.json();
        console.log(` ${job.name} completed:`, result);
      } catch (error: any) {
        console.error(` ${job.name} failed:`, error.message);
        console.log(`    Make sure your Next.js app is running on ${API_BASE}`);
      }
    });

    console.log(`    Scheduled: ${job.name} (${job.schedule})`);
  });

  console.log("\n Development cron triggers started!");
  console.log("  Keep this terminal open for cron to work");
  console.log(" Your existing API routes will be called automatically\n");
}
