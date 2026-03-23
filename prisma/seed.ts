// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { privacyContent } from '../app/[locale]/shared-content/privacy-content'
import { termsContent }   from '../app/[locale]/shared-content/terms-content'

const prisma = new PrismaClient()

async function seedPage(data: {
  type: string;
  title: string;
  slug: string;
  description?: string;
  sections: any[];
  lastUpdate: string;
  version: string;
}) {
  const htmlContent = JSON.stringify({
    description: data.description || "",
    sections:    data.sections,
    lastUpdate:  data.lastUpdate,
    version:     data.version,
  })

  await prisma.staticPage.deleteMany({ where: { type: data.type } })

  const created = await prisma.staticPage.create({
    data: {
      type:        data.type,
      title:       data.title,
      slug:        data.slug,
      htmlContent,
      status:      'published',
      version:     1,
    }
  })

  console.log(`✅ ${data.type} créé (${created.htmlContent.length} caractères)`)
  console.log(`📝 Aperçu: ${created.htmlContent.substring(0, 100)}...`)
}

async function main() {
  console.log('🌱 Seeding...\n')

  // PRIVACY
  await seedPage({
    type:        privacyContent.type,
    title:       privacyContent.title,
    slug:        privacyContent.slug,
    description: privacyContent.description,
    sections:    privacyContent.sections,
    lastUpdate:  privacyContent.lastUpdate,
    version:     privacyContent.version,
  })

  // TERMS
  await seedPage({
    type:     termsContent.type,
    title:    termsContent.title,
    slug:     termsContent.slug,
    sections: termsContent.sections,
    lastUpdate: termsContent.lastUpdate,
    version:  termsContent.version,
  })

  console.log('\n🎉 Terminé!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())