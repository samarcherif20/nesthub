// lib/services/listing.service.ts
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { CreateListingInput, UpdateListingInput } from '@/lib/validations/listing';

export class ListingService {
  
  /**
   * Génère un slug unique pour une annonce
   */
  static async generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    while (await prisma.listing.findFirst({
      where: { slug, id: { not: excludeId } }
    })) {
      slug = `${baseSlug}-${counter++}`;
    }
    
    return slug;
  }

  /**
   * Crée une nouvelle annonce avec ses photos
   */
  static async createListing(ownerId: string, data: CreateListingInput) {
    const slug = await this.generateUniqueSlug(data.title);
    
    // Filtrer les photos valides (pas de blob URLs)
    const photosToCreate = (data.photos || [])
      .filter(photo => photo.url && !photo.url.startsWith('blob:'))
      .map((photo, index) => ({
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl || photo.url,
        type: 'IMAGE' as const,
        position: index,
        isMain: photo.isMain || index === 0,
      }));
    
    return prisma.listing.create({
      data: {
        title: data.title,
        slug,
        description: data.description || '',
        type: data.type,
        status: data.status,
        
        // Localisation
        governorate: data.governorate,
        delegation: data.delegation,
        street: data.street || '',
        neighborhood: data.neighborhood || '',
        postalCode: data.postalCode || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        
        // Caractéristiques
        rooms: data.rooms,
        bathrooms: data.bathrooms,
        maxGuests: data.maxGuests || 2,
        surfaceArea: data.surfaceArea || null,
        floorNumber: data.floorNumber || null,
        hasElevator: data.hasElevator,
        
        // Prix
        rentalType: data.rentalType,
        pricePerNight: data.pricePerNight || null,
        pricePerMonth: data.pricePerMonth || null,
        securityDeposit: data.securityDeposit || null,
        
        // Équipements et règles
        equipment: data.equipment || {},
        services: data.services || {},
        houseRules: data.houseRules || {},
        customRules: data.customRules || '',
        
        // Relations
        ownerId,
        
        publishedAt: data.status === 'ACTIVE' ? new Date() : null,
        
        // ✅ Créer les photos directement
        photos: {
          create: photosToCreate,
        },
      },
      include: {
        photos: true,
      },
    });
  }

  /**
   * Récupère une annonce par son ID avec toutes ses relations
   */
  static async getListingById(id: string, incrementViews: boolean = true) {
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
            isIdentityVerified: true,
            createdAt: true,
            stats: {
              select: {
                averageRating: true,
                totalReviews: true,
              },
            },
          },
        },
        photos: {
          orderBy: { position: 'asc' },
        },
        availability: {
          where: {
            date: {
              gte: new Date(),
            },
          },
          take: 90,
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!listing) return null;

    if (incrementViews) {
      await prisma.$transaction([
        prisma.listing.update({
          where: { id },
          data: { viewCount: { increment: 1 } },
        }),
        prisma.listingStats.upsert({
          where: {
            listingId_date: {
              listingId: id,
              date: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
          update: { views: { increment: 1 } },
          create: {
            listingId: id,
            date: new Date(new Date().setHours(0, 0, 0, 0)),
            views: 1,
          },
        }),
      ]);
    }

    return listing;
  }

  /**
   * Met à jour une annonce
   */
  static async updateListing(id: string, ownerId: string, data: UpdateListingInput) {
    const existing = await prisma.listing.findUnique({
      where: { id },
      select: { ownerId: true, title: true },
    });

    if (!existing) throw new Error('Annonce non trouvée');
    if (existing.ownerId !== ownerId) throw new Error('Non autorisé');

    let slugUpdate = {};
    if (data.title && data.title !== existing.title) {
      const newSlug = await this.generateUniqueSlug(data.title, id);
      slugUpdate = { slug: newSlug };
    }

    const updateData: any = {
      ...slugUpdate,
      updatedAt: new Date(),
    };

    // Ajouter les champs un par un
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'ACTIVE') updateData.publishedAt = new Date();
    }
    if (data.governorate !== undefined) updateData.governorate = data.governorate;
    if (data.delegation !== undefined) updateData.delegation = data.delegation;
    if (data.street !== undefined) updateData.street = data.street;
    if (data.neighborhood !== undefined) updateData.neighborhood = data.neighborhood;
    if (data.rooms !== undefined) updateData.rooms = data.rooms;
    if (data.bathrooms !== undefined) updateData.bathrooms = data.bathrooms;
    if (data.maxGuests !== undefined) updateData.maxGuests = data.maxGuests;
    if (data.surfaceArea !== undefined) updateData.surfaceArea = data.surfaceArea;
    if (data.floorNumber !== undefined) updateData.floorNumber = data.floorNumber;
    if (data.hasElevator !== undefined) updateData.hasElevator = data.hasElevator;
    if (data.rentalType !== undefined) updateData.rentalType = data.rentalType;
    if (data.pricePerNight !== undefined) updateData.pricePerNight = data.pricePerNight;
    if (data.pricePerMonth !== undefined) updateData.pricePerMonth = data.pricePerMonth;
    if (data.securityDeposit !== undefined) updateData.securityDeposit = data.securityDeposit;
    if (data.customRules !== undefined) updateData.customRules = data.customRules;
    if (data.equipment !== undefined) updateData.equipment = data.equipment as Prisma.JsonValue;
    if (data.services !== undefined) updateData.services = data.services as Prisma.JsonValue;
    if (data.houseRules !== undefined) updateData.houseRules = data.houseRules as Prisma.JsonValue;

    // Gérer les photos si envoyées
    if (data.photos !== undefined) {
      // Supprimer les anciennes photos
      await prisma.listingMedia.deleteMany({
        where: { listingId: id },
      });
      
      // Ajouter les nouvelles photos
      const photosToCreate = (data.photos || [])
        .filter(photo => photo.url && !photo.url.startsWith('blob:'))
        .map((photo, index) => ({
          listingId: id,
          url: photo.url,
          thumbnailUrl: photo.thumbnailUrl || photo.url,
          type: 'IMAGE' as const,
          position: index,
          isMain: photo.isMain || index === 0,
        }));
      
      if (photosToCreate.length > 0) {
        await prisma.listingMedia.createMany({
          data: photosToCreate,
        });
      }
    }

    return prisma.listing.update({
      where: { id },
      data: updateData,
      include: {
        photos: true,
      },
    });
  }

  /**
   * Archive une annonce
   */
  static async archiveListing(id: string, ownerId: string) {
    const existing = await prisma.listing.findUnique({
      where: { id },
      select: { ownerId: true, status: true },
    });

    if (!existing) throw new Error('Annonce non trouvée');
    if (existing.ownerId !== ownerId) throw new Error('Non autorisé');
    if (existing.status === 'ARCHIVED') throw new Error('Annonce déjà archivée');

    return prisma.listing.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        isArchived: true,
        archivedAt: new Date(),
      },
    });
  }

  /**
   * Restaure une annonce archivée
   */
  static async restoreListing(id: string, ownerId: string) {
    const existing = await prisma.listing.findUnique({
      where: { id },
      select: { ownerId: true, status: true },
    });

    if (!existing) throw new Error('Annonce non trouvée');
    if (existing.ownerId !== ownerId) throw new Error('Non autorisé');
    if (existing.status !== 'ARCHIVED') throw new Error('Cette annonce n\'est pas archivée');

    return prisma.listing.update({
      where: { id },
      data: {
        status: 'INACTIVE',
        isArchived: false,
        archivedAt: null,
      },
    });
  }

  /**
   * Supprime définitivement une annonce
   */
  static async deleteListing(id: string, ownerId: string) {
    const existing = await prisma.listing.findUnique({
      where: { id },
      include: {
        bookings: {
          where: { status: { in: ['PENDING', 'CONFIRMED'] } },
        },
      },
    });

    if (!existing) throw new Error('Annonce non trouvée');
    if (existing.ownerId !== ownerId) throw new Error('Non autorisé');
    
    if (existing.bookings.length > 0) {
      throw new Error('Impossible de supprimer: des réservations sont en cours');
    }

    return prisma.listing.delete({ where: { id } });
  }

  /**
   * Récupère les annonces d'un propriétaire
   */
  static async getMyListings(ownerId: string, filters: {
    status?: string;
    page?: number;
    pageSize?: number;
    search?: string;
  }) {
    const { status, page = 1, pageSize = 10, search } = filters;
    
    const where: Prisma.ListingWhereInput = { ownerId };
    
    if (status && status !== 'ALL') {
      where.status = status as any;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * pageSize;
    
    const [listings, totalCount] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          photos: {
            orderBy: { position: 'asc' },
          },
          stats: {
            orderBy: { date: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.listing.count({ where }),
    ]);

    return {
      listings: listings.map(listing => ({
        ...listing,
        recentViews: listing.stats[0]?.views || 0,
        recentBookings: listing.stats[0]?.bookings || 0,
        mainPhoto: listing.photos.find(p => p.isMain) || listing.photos[0],
      })),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }
}

export default ListingService;