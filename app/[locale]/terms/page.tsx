// app/[locale]/terms/page.tsx
import { prisma } from "@/lib/prisma";
import TermsClient from "./TermsClient";
import { termsContent } from "../shared-content/terms-content";

function parseDbContent(raw: string): any | null {
  if (!raw || raw.trim() === "") return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.sections && Array.isArray(parsed.sections)) return parsed;
    if (parsed.content && typeof parsed.content === "string") {
      try { const inner = JSON.parse(parsed.content); if (inner.sections) return inner; } catch {}
    }
  } catch {}
  return null;
}

function buildContent(src: typeof termsContent) {
  const s = src.sections;
  const get = (id: string) => s.find((x: any) => x.id === id) || {} as any;
  const intro = get("introduction");
  const serv  = get("services");
  const oblig = get("obligations");
  const paiem = get("paiements");
  const resp  = get("responsabilite");
  const resil = get("resiliation");
  const donn  = get("donnees");
  return {
    version:   src.version,
    lastUpdate: src.lastUpdate,
    introduction: { title: intro.title||"", p1: intro.p1||"", p2: intro.p2||"", warning: intro.warning||"" },
    services:     { title: serv.title||"", description: serv.description||"", items: (serv.items||[]).map((i:any)=>i.text||"") },
    obligations: {
      title: oblig.title||"",
      owners:     { title: oblig.owners?.title||"",  items: (oblig.owners?.items||[]).map((i:any)=>i.text||"") },
      tenants:    { title: oblig.tenants?.title||"", items: (oblig.tenants?.items||[]).map((i:any)=>i.text||"") },
      prohibited: { title: oblig.prohibited?.title||"", text: oblig.prohibited?.text||"" },
    },
    paiements: { title: paiem.title||"", quote: paiem.quote||"", items: (paiem.items||[]).map((i:any)=>({ key: i.key||"", title: i.title||"", text: i.text||"" })) },
    responsabilite: { title: resp.title||"", description: resp.description||"", items: (resp.items||[]).map((i:any)=>i.text||"") },
    resiliation: { title: resil.title||"", description: resil.description||"", process: resil.process||"", reasons: (resil.items||[]).map((i:any)=>({ title: i.title||"", desc: i.desc||"" })) },
    donnees: { title: donn.title||"", description: donn.description||"", footer: donn.footer||"", rights: (donn.items||[]).map((i:any)=>({ title: i.title||"", desc: i.desc||"" })) },
  };
}

function sec(sections: any[], id: string): any {
  return sections.find((s: any) => s.id === id) || {};
}

export default async function TermsPage() {
  const page = await prisma.staticPage.findUnique({ where: { type: "TERMS" } });
  if (!page) return <TermsClient pageData={{ title: termsContent.title, updatedAt: termsContent.lastUpdate, content: buildContent(termsContent) }} />;

  const structured = parseDbContent(page.htmlContent);
  if (!structured) return <TermsClient pageData={{ title: termsContent.title, updatedAt: termsContent.lastUpdate, content: buildContent(termsContent) }} />;

  const s     = structured.sections;
  const intro = sec(s, "introduction");
  const serv  = sec(s, "services");
  const oblig = sec(s, "obligations");
  const paiem = sec(s, "paiements");
  const resp  = sec(s, "responsabilite");
  const resil = sec(s, "resiliation");
  const donn  = sec(s, "donnees");

  return (
    <TermsClient
      pageData={{
        title:     page.title,
        updatedAt: page.updatedAt,
        status:    page.status,
        content:   buildContent({ ...termsContent, version: structured.version || termsContent.version, lastUpdate: page.updatedAt.toISOString(), sections: structured.sections }),
      }}
    />
  );
}