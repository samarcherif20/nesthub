/* eslint-disable @typescript-eslint/no-require-imports */
const translate = require("google-translate-api-x");
const fs = require("fs");
const path = require("path");

const MESSAGES_DIR = path.join(__dirname, "..", "messages");

const TARGETS = [
  { code: "ar", file: "ar.json", name: "Arabe" },
 /* { code: "en", file: "en.json", name: "Anglais" },
  { code: "es", file: "es.json", name: "Espagnol" },
  { code: "de", file: "de.json", name: "Allemand" },
  { code: "it", file: "it.json", name: "Italien" },*/
];

async function translateObject(obj, targetLang) {
  const result = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "object" && value !== null) {
      result[key] = await translateObject(value, targetLang);
    } else if (typeof value === "string") {
      const res = await translate(value, { from: "fr", to: targetLang });
      result[key] = res.text;
      process.stdout.write(".");
      await new Promise((r) => setTimeout(r, 300));
    } else {
      result[key] = value;
    }
  }

  return result;
}

async function main() {
  console.log("Traduction avec Google Translate\n");

  const source = JSON.parse(
    fs.readFileSync(path.join(MESSAGES_DIR, "fr.json"), "utf8"),
  );

  for (const target of TARGETS) {
    console.log(`\n ${target.name}...`);
    const translated = await translateObject(source, target.code);
    fs.writeFileSync(
      path.join(MESSAGES_DIR, target.file),
      JSON.stringify(translated, null, 2),
    );
    console.log(`  ${target.file}`);
  }

  console.log("\n Terminé !");
}

main().catch(console.error);
