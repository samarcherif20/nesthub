import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      query,
      governorate,
      delegation,
      checkIn,
      checkOut,
      guests = 1,
      minPrice,
      maxPrice,
      type,
      minRooms,
      equipment,
      sortBy = 'relevance',
      page = 1,
      pageSize = 12
    } = body

    // Construction du filtre
    const filters: any = {
      status: 'ACTIVE',
      isArchived: false,
      isBlocked: false,
    }

    // Filtre par localisation
    if (governorate) filters.governorate = governorate
    if (delegation) filters.delegation = delegation
    
    // Filtre par type de logement
    if (type && type !== 'all') {
      filters.type = type.toUpperCase()
    }
    
    // Filtre par nombre de chambres
    if (minRooms && minRooms > 0) {
      filters.rooms = { gte: minRooms }
    }
    
    // Filtre par capacité d'accueil
    if (guests && guests > 0) {
      filters.maxGuests = { gte: guests }
    }
    
    // Filtre par prix
    if (minPrice !== undefined || maxPrice !== undefined) {
      filters.OR = [
        { pricePerNight: { gte: minPrice || 0, lte: maxPrice || 1000000 } },
        { pricePerMonth: { gte: minPrice || 0, lte: maxPrice || 1000000 } }
      ]
    }

    // Filtre par équipements (recherche dans le JSON)
    if (equipment && equipment.length > 0) {
      // Pour chaque équipement, on vérifie s'il existe dans le JSON
      equipment.forEach((eq: string) => {
        filters[`equipment_${eq}`] = {
          path: ['$', eq],
          equals: true
        }
      })
    }

    // Recherche textuelle
    if (query && query.trim()) {
      filters.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { street: { contains: query, mode: 'insensitive' } },
        { neighborhood: { contains: query, mode: 'insensitive' } }
      ]
    }

    // Vérification des disponibilités (si dates fournies)
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn)
      const checkOutDate = new Date(checkOut)
      
      filters.NOT = {
        blockedDates: {
          some: {
            OR: [
              { startDate: { lte: checkOutDate }, endDate: { gte: checkInDate } }
            ]
          }
        }
      }
    }

    // Tri
    let orderBy: any = {}
    switch (sortBy) {
      case 'price_asc':
        orderBy = { pricePerNight: 'asc' }
        break
      case 'price_desc':
        orderBy = { pricePerNight: 'desc' }
        break
      case 'rating':
        orderBy = { reviews: { _avg: { rating: 'desc' } } }
        break
      default:
        orderBy = { createdAt: 'desc' }
    }

    // Pagination
    const skip = (page - 1) * pageSize

    // Exécution de la requête
    const [listings, totalCount] = await Promise.all([
      prisma.listing.findMany({
        where: filters,
        include: {
          photos: {
            where: { isMain: true },
            take: 1
          },
          owner: {
            select: {
              firstName: true,
              lastName: true,
              profilePictureUrl: true,
              isIdentityVerified: true
            }
          },
          reviews: {
            select: { rating: true }
          }
        },
        orderBy,
        skip,
        take: pageSize
      }),
      prisma.listing.count({ where: filters })
    ])

    // Calcul des notes moyennes et formatage
    const formattedListings = listings.map(listing => {
      const averageRating = listing.reviews.length > 0
        ? listing.reviews.reduce((acc, r) => acc + r.rating, 0) / listing.reviews.length
        : 4.5
      
      return {
        id: listing.id,
        title: listing.title,
        description: listing.description,
        location: `${listing.governorate}, ${listing.delegation}`,
        pricePerNight: listing.pricePerNight,
        pricePerMonth: listing.pricePerMonth,
        rating: Number(averageRating.toFixed(1)),
        reviewCount: listing.reviews.length,
        image: listing.photos[0]?.url || '/images/placeholder.jpg',
        type: listing.type.toLowerCase(),
        isVerified: listing.owner?.isIdentityVerified || false,
        bedrooms: listing.rooms,
        bathrooms: listing.bathrooms,
        maxGuests: listing.maxGuests,
        amenities: listing.equipment as string[],
        createdAt: listing.createdAt,
        owner: {
          name: `${listing.owner?.firstName || ''} ${listing.owner?.lastName || ''}`,
          avatar: listing.owner?.profilePictureUrl
        }
      }
    })

    return NextResponse.json({
      listings: formattedListings,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    })
  } catch (error) {
    console.error('Erreur de recherche:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la recherche' },
      { status: 500 }
    )
  }
}