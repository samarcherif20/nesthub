// seed-data/privacy.ts
import { termsContent } from "@/app/[locale]/shared-content/terms-content";

export const privacyConfig = {
  type: termsContent.type,
  title: termsContent.title,
  slug: termsContent.slug,
  // Pas besoin de getHtml ici car on stocke du JSON, pas du HTML
  getJson: () => ({
    sections: termsContent.sections,
    lastUpdate: termsContent.lastUpdate,
    version: termsContent.version,
  }),
};
