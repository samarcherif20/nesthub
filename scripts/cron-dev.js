// scripts/cron-dev.js
const cron = require("node-cron");
const http = require("http");
require("dotenv").config();

// Configuration
const API_BASE = "http://localhost:3000";
const SECRET_KEY = process.env.CRON_SECRET || "ton_secret_local_123";

const JOBS = [
  {
    name: "🔄 Réactivation des utilisateurs",
    path: "/api/cron/reactivate-users",
    method: "POST",
    schedule: "0 */6 * * *",
    description: "Toutes les 6 heures",
  },
  {
    name: "⏰ Expiration des demandes d'information",
    path: "/api/cron/expire-info-requests",
    method: "POST",
    schedule: "0 * * * *",
    description: "Toutes les heures",
  },
  {
    name: "💸 Expiration des offres",
    path: "/api/cron/expire-offers",
    method: "POST",
    schedule: "0 * * * *",
    description: "Toutes les heures",
  },
  {
    name: "🔓 Libération des réservations expirées",
    path: "/api/cron/release-expired-bookings",
    method: "POST",
    schedule: "0 * * * *",
    description: "Toutes les heures",
  },
  {
    name: "✅ Vérification des séjours terminés",
    path: "/api/cron/check-completed-bookings",
    method: "GET", // ← GET car l'API supporte les deux
    schedule: "0 10 * * *",
    description: "Tous les jours à 10h",
  },
  {
    name: "🧪 TEST - Tous les jobs",
    path: "/api/cron/test-all",
    method: "GET",
    schedule: "*/5 * * * *",
    description: "Test toutes les 5 minutes",
  },
];

// Fonction pour exécuter un job
function runJob(name, path, method) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 [${new Date().toLocaleString()}] Exécution: ${name}`);
    console.log(`📡 Appel de: ${API_BASE}${path} (${method})`);

    const options = {
      hostname: "localhost",
      port: 3000,
      path: path,
      method: method,
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          console.log(`✅ ${name} - SUCCÈS (${res.statusCode})`);
          try {
            const response = JSON.parse(data);
            console.log(`📦 Réponse:`, response);
          } catch (e) {
            console.log(`📦 Réponse: ${data}`);
          }
          resolve();
        } else {
          console.log(`❌ ${name} - ERREUR (${res.statusCode})`);
          console.log(`📦 Réponse: ${data}`);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on("error", (err) => {
      console.log(`❌ ${name} - ÉCHEC: ${err.message}`);
      reject(err);
    });

    req.on("timeout", () => {
      req.destroy();
      console.log(`❌ ${name} - TIMEOUT (30s)`);
      reject(new Error("Timeout"));
    });

    req.end();
  });
}

// Fonction pour exécuter tous les jobs immédiatement
async function runAllJobs() {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 EXÉCUTION MANUELLE DE TOUS LES JOBS");
  console.log("=".repeat(60));

  for (const job of JOBS) {
    await runJob(job.name, job.path, job.method);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ TOUS LES JOBS EXÉCUTÉS");
  console.log("=".repeat(60));
  process.exit(0);
}

// Fonction pour exécuter un job spécifique
async function runSpecificJob(jobName) {
  const job = JOBS.find(
    (j) => j.name.includes(jobName) || j.path.includes(jobName)
  );
  if (job) {
    await runJob(job.name, job.path, job.method);
  } else {
    console.log(`❌ Job non trouvé: ${jobName}`);
    console.log(`📋 Jobs disponibles:`);
    JOBS.forEach((j) => console.log(`   - ${j.name}`));
  }
  process.exit(0);
}

// Démarrer les cron jobs
function startCronJobs() {
  console.log("\n" + "=".repeat(60));
  console.log("⏰ DÉMARRAGE DES CRON JOBS");
  console.log("=".repeat(60));
  console.log(`🔑 Clé secrète utilisée: ${SECRET_KEY.substring(0, 10)}...\n`);

  JOBS.forEach((job) => {
    if (cron.validate(job.schedule)) {
      cron.schedule(job.schedule, () => {
        runJob(job.name, job.path, job.method);
      });
      console.log(`✅ Planifié: ${job.name}`);
      console.log(`   ⏰ ${job.description} (${job.schedule}) - ${job.method}`);
    } else {
      console.log(`❌ Expression invalide: ${job.name} - ${job.schedule}`);
    }
  });

  console.log("\n" + "=".repeat(60));
  console.log("✅ CRON JOBS EN COURS D'EXÉCUTION");
  console.log("📝 Appuyez sur Ctrl+C pour arrêter");
  console.log("=".repeat(60) + "\n");
}

// Gestion des arguments
const args = process.argv.slice(2);

if (args.includes("--run-all")) {
  runAllJobs();
} else if (args.includes("--run")) {
  const jobName = args[args.indexOf("--run") + 1];
  if (jobName) {
    runSpecificJob(jobName);
  } else {
    console.log('❌ Usage: node scripts/cron-dev.js --run "nom_du_job"');
    process.exit(1);
  }
} else {
  startCronJobs();
  process.stdin.resume();
  process.on("SIGINT", () => {
    console.log("\n\n🛑 Arrêt des cron jobs...");
    process.exit();
  });
}