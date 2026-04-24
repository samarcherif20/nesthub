import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Récupérer les annonces les mieux notées pour les recommandations
    const listings = await prisma.listing.findMany({
      where: { status: 'ACTIVE' },
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: {
        photos: {
          where: { isMain: true },
          take: 1
        }
      }
    })

    const reasons = [
      'Basé sur vos recherches récentes',
      'Tendance du moment',
      'Coup de cœur de notre équipe',
      'Idéal pour vos dates'
    ]

    const recommendations = listings.map((listing, index) => ({
      id: listing.id,
      title: listing.title,
      location: `${listing.governorate}, ${listing.delegation}`,
      pricePerNight: listing.pricePerNight || 0,
      image: listing.photos[0]?.url || '/images/placeholder.jpg',
      reason: reasons[index % reasons.length]
    }))

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error('Erreur recommandations:', error)
    return NextResponse.json({ recommendations: [] })
  }
}