// seed-data/privacy.ts
import { privacyContent } from "@/app/[locale]/shared-content/privacy-content";

export const privacyConfig = {
  type: privacyContent.type,
  title: privacyContent.title,
  slug: privacyContent.slug,
  // Pas besoin de getHtml ici car on stocke du JSON, pas du HTML
  getJson: () => ({
    description: privacyContent.description,
    sections: privacyContent.sections,
    lastUpdate: privacyContent.lastUpdate,
    version: privacyContent.version
  })
};