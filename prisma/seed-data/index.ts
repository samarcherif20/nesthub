import { privacyConfig } from './privacy'
import { termsConfig } from './terms'

// Liste centrale de toutes les pages
export const pagesConfig = [
  privacyConfig,
  termsConfig,
 
  // Ajoute d'autres pages ici facilement
]

// Helper pour obtenir une config par type
export function getPageConfig(type: string) {
  return pagesConfig.find(p => p.type === type)
}

// Helper pour obtenir toutes les pages
export function getAllPages() {
  return pagesConfig
}