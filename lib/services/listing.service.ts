// lib/services/listing.service.ts - CORRECTION COMPLÈTE POUR LES IMAGES

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { CreateListingInput, UpdateListingInput } from '@/lib/validations/listing';

export class ListingService {
  
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

  static async createListing(ownerId: string, data: CreateListingInput) {
    const slug = await this.generateUniqueSlug(data.title);
    
    const photosToCreate = (data.photos || [])
      .filter(photo => photo.url && !photo.url.startsWith('blob:'))
      .map((photo, index) => ({
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl || photo.url,
        type: 'IMAGE' as const,
        position: index,
        isMain: photo.isMain || index === 0,
      }));
    
    const listing = await prisma.listing.create({
      data: {
        title: data.title,
        slug,
        description: data.description || '',
        type: data.type,
        status: data.status,
        governorate: data.governorate,
        delegation: data.delegation,
        street: data.street || '',
        neighborhood: data.neighborhood || '',
        postalCode: data.postalCode || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        rooms: data.rooms,
        bathrooms: data.bathrooms,
        maxGuests: data.maxGuests || 2,
        surfaceArea: data.surfaceArea || null,
        floorNumber: data.floorNumber || null,
        hasElevator: data.hasElevator,
        rentalType: data.rentalType,
        pricePerNight: data.pricePerNight || null,
        pricePerMonth: data.pricePerMonth || null,
        securityDeposit: data.securityDeposit || null,
        equipment: data.equipment || {},
        services: data.services || {},
        houseRules: data.houseRules || {},
        customRules: data.customRules || '',
        ownerId,
        publishedAt: data.status === 'ACTIVE' ? new Date() : null,
        photos: { create: photosToCreate },
      },
      include: { photos: true },
    });

    await prisma.listingHistory.create({
      data: {
        listingId: listing.id,
        actionType: 'CREATE',
        fieldName: 'listing',
        oldValue: null,
        newValue: { title: data.title, type: data.type },
        changedBy: ownerId,
      },
    });

    return listing;
  }

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
            stats: { select: { averageRating: true, totalReviews: true } },
          },
        },
        photos: { orderBy: { position: 'asc' } },
        availability: {
          where: { date: { gte: new Date() } },
          take: 90,
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!listing) return null;

    if (incrementViews) {
      await prisma.$transaction([
        prisma.listing.update({ where: { id }, data: { viewCount: { increment: 1 } } }),
        prisma.listingStats.upsert({
          where: { listingId_date: { listingId: id, date: new Date(new Date().setHours(0, 0, 0, 0)) } },
          update: { views: { increment: 1 } },
          create: { listingId: id, date: new Date(new Date().setHours(0, 0, 0, 0)), views: 1 },
        }),
      ]);
    }

    return listing;
  }

  /**
   * ✅ CORRIGÉ : Gestion correcte des photos dans l'historique
   */
  static async updateListing(
    id: string, 
    ownerId: string, 
    data: UpdateListingInput, 
    newPhotos?: any[]
  ) {
    // Récupérer l'annonce existante
    const existing = await prisma.listing.findUnique({
      where: { id },
      select: { 
        ownerId: true, 
        title: true,
        description: true,
        type: true,
        status: true,
        governorate: true,
        delegation: true,
        street: true,
        rooms: true,
        bathrooms: true,
        maxGuests: true,
        surfaceArea: true,
        hasElevator: true,
        rentalType: true,
        pricePerNight: true,
        pricePerMonth: true,
        securityDeposit: true,
        equipment: true,
      },
    });

    if (!existing) throw new Error('Annonce non trouvée');
    if (existing.ownerId !== ownerId) throw new Error('Non autorisé');

    // Récupérer les photos existantes pour comparer
    const existingPhotos = await prisma.listingMedia.findMany({
      where: { listingId: id },
      select: { url: true, isMain: true, position: true },
    });

    let slugUpdate = {};
    if (data.title && data.title !== existing.title) {
      const newSlug = await this.generateUniqueSlug(data.title, id);
      slugUpdate = { slug: newSlug };
    }

    const updateData: any = {
      ...slugUpdate,
      updatedAt: new Date(),
    };

    const changes: any[] = [];

    // Vérifier chaque champ
    if (data.title !== undefined && data.title !== existing.title) {
      changes.push({
        fieldName: 'title',
        oldValue: existing.title,
        newValue: data.title,
      });
      updateData.title = data.title;
    }
    
    if (data.description !== undefined && data.description !== existing.description) {
      changes.push({
        fieldName: 'description',
        oldValue: existing.description,
        newValue: data.description,
      });
      updateData.description = data.description;
    }
    
    if (data.type !== undefined && data.type !== existing.type) {
      changes.push({
        fieldName: 'type',
        oldValue: existing.type,
        newValue: data.type,
      });
      updateData.type = data.type;
    }
    
    if (data.status !== undefined && data.status !== existing.status) {
      changes.push({
        fieldName: 'status',
        oldValue: existing.status,
        newValue: data.status,
      });
      updateData.status = data.status;
      if (data.status === 'ACTIVE') updateData.publishedAt = new Date();
    }
    
    if (data.governorate !== undefined && data.governorate !== existing.governorate) {
      changes.push({
        fieldName: 'governorate',
        oldValue: existing.governorate,
        newValue: data.governorate,
      });
      updateData.governorate = data.governorate;
    }
    
    if (data.delegation !== undefined && data.delegation !== existing.delegation) {
      changes.push({
        fieldName: 'delegation',
        oldValue: existing.delegation,
        newValue: data.delegation,
      });
      updateData.delegation = data.delegation;
    }
    
    if (data.street !== undefined && data.street !== existing.street) {
      changes.push({
        fieldName: 'street',
        oldValue: existing.street,
        newValue: data.street,
      });
      updateData.street = data.street;
    }
    
    if (data.rooms !== undefined && data.rooms !== existing.rooms) {
      changes.push({
        fieldName: 'rooms',
        oldValue: existing.rooms,
        newValue: data.rooms,
      });
      updateData.rooms = data.rooms;
    }
    
    if (data.bathrooms !== undefined && data.bathrooms !== existing.bathrooms) {
      changes.push({
        fieldName: 'bathrooms',
        oldValue: existing.bathrooms,
        newValue: data.bathrooms,
      });
      updateData.bathrooms = data.bathrooms;
    }
    
    if (data.maxGuests !== undefined && data.maxGuests !== existing.maxGuests) {
      changes.push({
        fieldName: 'maxGuests',
        oldValue: existing.maxGuests,
        newValue: data.maxGuests,
      });
      updateData.maxGuests = data.maxGuests;
    }
    
    if (data.surfaceArea !== undefined && data.surfaceArea !== existing.surfaceArea) {
      changes.push({
        fieldName: 'surfaceArea',
        oldValue: existing.surfaceArea,
        newValue: data.surfaceArea,
      });
      updateData.surfaceArea = data.surfaceArea;
    }
    
    if (data.hasElevator !== undefined && data.hasElevator !== existing.hasElevator) {
      changes.push({
        fieldName: 'hasElevator',
        oldValue: existing.hasElevator,
        newValue: data.hasElevator,
      });
      updateData.hasElevator = data.hasElevator;
    }
    
    if (data.rentalType !== undefined && data.rentalType !== existing.rentalType) {
      changes.push({
        fieldName: 'rentalType',
        oldValue: existing.rentalType,
        newValue: data.rentalType,
      });
      updateData.rentalType = data.rentalType;
    }
    
    if (data.pricePerNight !== undefined && data.pricePerNight !== existing.pricePerNight) {
      changes.push({
        fieldName: 'pricePerNight',
        oldValue: existing.pricePerNight,
        newValue: data.pricePerNight,
      });
      updateData.pricePerNight = data.pricePerNight;
    }
    
    if (data.pricePerMonth !== undefined && data.pricePerMonth !== existing.pricePerMonth) {
      changes.push({
        fieldName: 'pricePerMonth',
        oldValue: existing.pricePerMonth,
        newValue: data.pricePerMonth,
      });
      updateData.pricePerMonth = data.pricePerMonth;
    }
    
    if (data.securityDeposit !== undefined && data.securityDeposit !== existing.securityDeposit) {
      changes.push({
        fieldName: 'securityDeposit',
        oldValue: existing.securityDeposit,
        newValue: data.securityDeposit,
      });
      updateData.securityDeposit = data.securityDeposit;
    }
    
    if (data.equipment !== undefined) {
      const oldEquipment = existing.equipment as Record<string, boolean> || {};
      const newEquipment = data.equipment as Record<string, boolean>;
      const hasEquipmentChanges = JSON.stringify(oldEquipment) !== JSON.stringify(newEquipment);
      
      if (hasEquipmentChanges) {
        changes.push({
          fieldName: 'equipment',
          oldValue: oldEquipment,
          newValue: newEquipment,
        });
        updateData.equipment = newEquipment as Prisma.JsonValue;
      }
    }

    // Mettre à jour l'annonce
    const updatedListing = await prisma.listing.update({
      where: { id },
      data: updateData,
    });

    // ✅ Enregistrer les changements dans l'historique
    for (const change of changes) {
      await prisma.listingHistory.create({
        data: {
          listingId: id,
          actionType: change.fieldName === 'status' ? 'STATUS_CHANGE' : 
                      change.fieldName === 'pricePerNight' || change.fieldName === 'pricePerMonth' ? 'PRICE_UPDATE' :
                      change.fieldName === 'equipment' ? 'EQUIPMENT_UPDATE' : 'UPDATE',
          fieldName: change.fieldName,
          oldValue: change.oldValue,
          newValue: change.newValue,
          changedBy: ownerId,
        },
      });
    }

    // ✅ Gérer les photos - Version CORRIGÉE
    if (newPhotos !== undefined) {
      // Vérifier si les photos ont réellement changé
      const newPhotoUrls = newPhotos.map(p => p.url).sort();
      const oldPhotoUrls = existingPhotos.map(p => p.url).sort();
      const hasPhotoChanges = JSON.stringify(newPhotoUrls) !== JSON.stringify(oldPhotoUrls);
      
      if (hasPhotoChanges) {
        // Supprimer les anciennes photos
        await prisma.listingMedia.deleteMany({
          where: { listingId: id },
        });
        
        // Ajouter les nouvelles photos
        const photosToCreate = newPhotos
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
          
          // ✅ Enregistrer l'historique des photos avec les URLs des premières photos
          const firstOldPhotoUrl = oldPhotoUrls[0] || null;
          const firstNewPhotoUrl = newPhotoUrls[0] || null;
          
          await prisma.listingHistory.create({
            data: {
              listingId: id,
              actionType: 'PHOTO_UPDATE',
              fieldName: 'photos',
              // ✅ Stocker les URLs des photos pour l'affichage
              oldValue: firstOldPhotoUrl,
              newValue: firstNewPhotoUrl,
              changedBy: ownerId,
            },
          });
        }
      }
    }

    // Retourner l'annonce avec les photos
    return prisma.listing.findUnique({
      where: { id },
      include: { photos: { orderBy: { position: 'asc' } } },
    });
  }

  static async archiveListing(id: string, ownerId: string) {
    const existing = await prisma.listing.findUnique({
      where: { id },
      select: { ownerId: true, status: true },
    });

    if (!existing) throw new Error('Annonce non trouvée');
    if (existing.ownerId !== ownerId) throw new Error('Non autorisé');
    if (existing.status === 'ARCHIVED') throw new Error('Annonce déjà archivée');

    const listing = await prisma.listing.update({
      where: { id },
      data: { status: 'ARCHIVED', isArchived: true, archivedAt: new Date() },
    });

    await prisma.listingHistory.create({
      data: {
        listingId: id,
        actionType: 'STATUS_CHANGE',
        fieldName: 'status',
        oldValue: existing.status,
        newValue: 'ARCHIVED',
        changedBy: ownerId,
      },
    });

    return listing;
  }

  static async restoreListing(id: string, ownerId: string) {
    const existing = await prisma.listing.findUnique({
      where: { id },
      select: { ownerId: true, status: true },
    });

    if (!existing) throw new Error('Annonce non trouvée');
    if (existing.ownerId !== ownerId) throw new Error('Non autorisé');
    if (existing.status !== 'ARCHIVED') throw new Error('Cette annonce n\'est pas archivée');

    const listing = await prisma.listing.update({
      where: { id },
      data: { status: 'INACTIVE', isArchived: false, archivedAt: null },
    });

    await prisma.listingHistory.create({
      data: {
        listingId: id,
        actionType: 'STATUS_CHANGE',
        fieldName: 'status',
        oldValue: 'ARCHIVED',
        newValue: 'INACTIVE',
        changedBy: ownerId,
      },
    });

    return listing;
  }

  static async deleteListing(id: string, ownerId: string) {
    const existing = await prisma.listing.findUnique({
      where: { id },
      include: { bookings: { where: { status: { in: ['PENDING', 'CONFIRMED'] } } } },
    });

    if (!existing) throw new Error('Annonce non trouvée');
    if (existing.ownerId !== ownerId) throw new Error('Non autorisé');
    
    if (existing.bookings.length > 0) {
      throw new Error('Impossible de supprimer: des réservations sont en cours');
    }

    return prisma.listing.delete({ where: { id } });
  }

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
          photos: { orderBy: { position: 'asc' } },
          stats: { orderBy: { date: 'desc' }, take: 1 },
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