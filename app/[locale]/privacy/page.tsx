// app/[locale]/privacy/page.tsx
import { prisma } from "@/lib/prisma";
import PrivacyClient from "./PrivacyClient";

function parseDbContent(raw: string): any | null {
  if (!raw || raw.trim() === "") return null;
  try {
    const parsed = JSON.parse(raw);
    // Format structuré direct : {description, sections:[...]}
    if (parsed.sections && Array.isArray(parsed.sections)) return parsed;
    // Format wrappé : {content: "{sections:[...]}"} — ne devrait plus arriver
    if (parsed.content && typeof parsed.content === "string") {
      try { const inner = JSON.parse(parsed.content); if (inner.sections) return inner; } catch {}
    }
  } catch {}
  return null;
}

export default async function PrivacyPage() {
  const page = await prisma.staticPage.findUnique({ where: { type: "PRIVACY" } });
  if (!page) return <PrivacyClient />;

  const structured = parseDbContent(page.htmlContent);
  if (!structured) return <PrivacyClient />;

  return (
    <PrivacyClient
      pageData={{
        title: page.title,
        content: {
          description: structured.description || "",
          sections: structured.sections,
          lastUpdate: structured.lastUpdate || page.updatedAt.toISOString(),
          version: structured.version || "1.0",
        },
        updatedAt: page.updatedAt,
        status: page.status,
      }}
    />
  );
}