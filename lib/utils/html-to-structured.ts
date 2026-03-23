/**
 * html-to-structured.ts
 * Parse le HTML TipTap et re-mappe dans la structure JSON sections.
 * Merge par TITRE (pas par index) pour éviter l'écrasement en cas d'ajout/réordre.
 */

const SECTION_IDS = ["collecte", "utilisation", "cookies", "droits", "securite", "ia"] as const;

export function htmlToStructured(html: string, existing: any, title?: string): any {
  const parsed = parseHtmlToSections(html);
  const mergedSections = mergeWithExisting(parsed, existing?.sections || []);

  return {
    description: parsed.globalDescription || existing?.description || "",
    sections: mergedSections,
    lastUpdate: new Date().toISOString(),
    version: existing?.version || "1.0",
  };
}

interface ParsedSection {
  title: string;
  description: string;
  warning: string;
  items: { label: string; text: string }[];
}

interface ParseResult {
  globalDescription: string;
  sections: ParsedSection[];
}

function parseHtmlToSections(html: string): ParseResult {
  const result: ParseResult = { globalDescription: "", sections: [] };
  if (!html) return result;

  const firstH2 = html.indexOf("<h2");
  const beforeH2 = firstH2 > 0 ? html.substring(0, firstH2) : "";
  const pInBefore = [...beforeH2.matchAll(/<p[^>]*>(.*?)<\/p>/gi)];
  result.globalDescription = pInBefore.map(m => stripTags(m[1])).join(" ").trim();

  const h2Matches = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)];

  h2Matches.forEach((match, idx) => {
    const sectionStart = match.index! + match[0].length;
    const sectionEnd = idx + 1 < h2Matches.length ? h2Matches[idx + 1].index! : html.length;
    const body = html.substring(sectionStart, sectionEnd);

    // Description : premier <p> qui n'est pas un warning (pas de <strong> seul)
    const allP = [...body.matchAll(/<p[^>]*>(.*?)<\/p>/gi)];
    let description = "";
    let warning = "";
    allP.forEach(p => {
      const text = p[1];
      // Si tout le contenu est dans un <strong>, c'est un warning
      const isWarning = /^<strong[^>]*>.*<\/strong>$/.test(text.trim());
      if (isWarning && !warning) warning = stripTags(text);
      else if (!description) description = stripTags(text);
    });

    // Items : tous les <li>
    const items = [...body.matchAll(/<li[^>]*>(.*?)<\/li>/gi)].map(li => {
      const liContent = li[1];
      const strongMatch = liContent.match(/<strong[^>]*>(.*?)<\/strong>(.*)/i);
      if (strongMatch) {
        return {
          label: stripTags(strongMatch[1]).replace(/:$/, "").trim(),
          text: stripTags(strongMatch[2]).trim(),
        };
      }
      return { label: "", text: stripTags(liContent).trim() };
    });

    result.sections.push({
      title: stripTags(match[1]),
      description,
      warning,
      items,
    });
  });

  return result;
}

/**
 * Merge par TITRE — fuzzy match entre parsed et existing.
 * 
 * Pour chaque section parsée depuis le HTML :
 *   1. Chercher la section existante avec le même titre (fuzzy)
 *   2. Si trouvée → merger les textes, préserver les métadonnées (id, badge, icon...)
 *   3. Si non trouvée → c'est une nouvelle section, l'ajouter avec un id généré
 *
 * Les sections existantes non retrouvées dans le HTML sont SUPPRIMÉES
 * (l'admin les a volontairement effacées).
 */
function mergeWithExisting(parsed: ParseResult, existing: any[]): any[] {
  // Index des sections existantes par titre normalisé pour lookup rapide
  const existingByTitle = new Map<string, any>();
  existing.forEach(s => {
    existingByTitle.set(normalizeTitle(s.title), s);
  });

  return parsed.sections.map((parsedSection, idx) => {
    const normalizedTitle = normalizeTitle(parsedSection.title);

    // Chercher la section existante par titre exact ou fuzzy
    const existingSection = existingByTitle.get(normalizedTitle)
      || findFuzzyMatch(normalizedTitle, existingByTitle)
      || null;

    if (!existingSection) {
      // Nouvelle section ajoutée par l'admin → créer avec id généré
      return {
        id: `section_${idx}_${Date.now()}`,
        title: parsedSection.title,
        description: parsedSection.description,
        ...(parsedSection.warning && { warning: parsedSection.warning }),
        items: parsedSection.items.map(item => ({
          ...(item.label ? { label: item.label } : {}),
          text: item.text,
        })),
      };
    }

    // Section trouvée → merger les textes, préserver les métadonnées
    return {
      ...existingSection, // préserve id, badge, badgeColor, icon, email, etc.
      title: parsedSection.title || existingSection.title,
      description: parsedSection.description || existingSection.description,
      ...(parsedSection.warning && { warning: parsedSection.warning }),
      items: mergeItems(existingSection.items || [], parsedSection.items),
    };
  });
}

/**
 * Merge les items par LABEL/TITRE (pas par index).
 * Items existants non retrouvés → supprimés (admin les a effacés).
 * Nouveaux items → ajoutés avec les métadonnées de l'item existant le plus proche.
 */
function mergeItems(existing: any[], parsed: { label: string; text: string }[]): any[] {
  // Index des items existants par label normalisé
  const existingByLabel = new Map<string, any>();
  existing.forEach(item => {
    const key = normalizeTitle(item.label || item.title || item.name || "");
    if (key) existingByLabel.set(key, item);
  });

  return parsed.map((parsedItem, idx) => {
    const normalizedLabel = normalizeTitle(parsedItem.label);

    const existingItem = normalizedLabel
      ? (existingByLabel.get(normalizedLabel) || findFuzzyMatch(normalizedLabel, existingByLabel))
      : existing[idx] || null; // fallback index si pas de label

    if (!existingItem) {
      // Nouvel item → structure basique
      return parsedItem.label
        ? { label: parsedItem.label, text: parsedItem.text }
        : { text: parsedItem.text };
    }

    // Item trouvé → préserver métadonnées, mettre à jour texte
    const updated: any = { ...existingItem };

    if (parsedItem.text) {
      if ("text" in existingItem) updated.text = parsedItem.text;
      if ("desc" in existingItem) updated.desc = parsedItem.text;
    }
    if (parsedItem.label) {
      if ("label" in existingItem) updated.label = parsedItem.label;
      if ("name" in existingItem) updated.name = parsedItem.label;
      if ("title" in existingItem && !("label" in existingItem)) updated.title = parsedItem.label;
    }

    return updated;
  });
}

/** Normalise un titre pour comparaison (lowercase, sans accents, sans ponctuation) */
function normalizeTitle(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire accents
    .replace(/[^a-z0-9\s]/g, "")     // retire ponctuation
    .replace(/\s+/g, " ")
    .trim();
}

/** Fuzzy match : retourne l'entrée de la Map dont le titre contient ou est contenu dans le titre cherché */
function findFuzzyMatch(normalized: string, map: Map<string, any>): any | null {
  for (const [key, value] of map.entries()) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return value;
    }
  }
  // Essai avec les premiers mots (ex: "collecte" dans "collecte des donnees")
  const firstWord = normalized.split(" ")[0];
  if (firstWord.length > 3) {
    for (const [key, value] of map.entries()) {
      if (key.startsWith(firstWord)) return value;
    }
  }
  return null;
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}