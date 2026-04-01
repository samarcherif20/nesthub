// lib/validations/listing.ts
import { z } from 'zod';

// Schéma pour les frais supplémentaires
const extraFeeSchema = z.object({
  id: z.string(),
  label: z.string(),
  amount: z.number(),
  type: z.enum(['fixed', 'per_night']),
});

// Schéma pour les règles saisonnières
const seasonalRuleSchema = z.object({
  id: z.string(),
  label: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  multiplier: z.number(),
});

// Schéma de base pour une annonce (pour la création)
export const listingBaseSchema = z.object({
  title: z.string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(100, 'Le titre ne peut pas dépasser 100 caractères'),
  
  description: z.string()
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .optional()
    .default(''),
  
  type: z.enum(['APARTMENT', 'VILLA', 'STUDIO', 'DUPLEX', 'HOUSE', 'ROOM']),
  
  // Localisation
  governorate: z.string().min(1, 'Le gouvernorat est requis'),
  delegation: z.string().min(1, 'La délégation est requise'),
  street: z.string().optional().default(''),
  neighborhood: z.string().optional().default(''),
  postalCode: z.string().optional().default(''),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  
  // Caractéristiques
  rooms: z.number()
    .min(1, 'Au moins 1 chambre')
    .max(20, 'Maximum 20 chambres')
    .default(1),
  
  bathrooms: z.number()
    .min(1, 'Au moins 1 salle de bain')
    .max(10, 'Maximum 10 salles de bain')
    .default(1),
  
  maxGuests: z.number()
    .min(1, 'Au moins 1 voyageur')
    .max(30, 'Maximum 30 voyageurs')
    .default(2),
  
  surfaceArea: z.number()
    .positive('La surface doit être positive')
    .optional()
    .nullable(),
  
  floorNumber: z.number()
    .min(0, 'L\'étage doit être 0 ou plus')
    .optional()
    .nullable(),
  
  hasElevator: z.boolean().default(false),
  
  // Prix
  rentalType: z.enum(['SHORT_TERM', 'LONG_TERM', 'BOTH']).default('SHORT_TERM'),
  pricePerNight: z.number()
    .positive('Le prix par nuit doit être positif')
    .optional()
    .nullable(),
  pricePerMonth: z.number()
    .positive('Le prix par mois doit être positif')
    .optional()
    .nullable(),
  securityDeposit: z.number()
    .positive('La caution doit être positive')
    .optional()
    .nullable(),
  cleaningFee: z.number()
    .positive('Les frais de ménage doivent être positifs')
    .optional()
    .nullable(),
  extraFees: z.array(extraFeeSchema).optional().default([]),
  weekendPriceMultiplier: z.number().min(0).max(2).default(1.15),
  seasonalRules: z.array(seasonalRuleSchema).optional().default([]),
  
  // Équipements et règles
  equipment: z.record(z.string(), z.boolean()).optional().default({}),
  services: z.record(z.string(), z.boolean()).optional().default({}),
  houseRules: z.record(z.string(), z.boolean()).optional().default({}),
  customRules: z.string().max(500).optional().default(''),
  
  // Photos
  photos: z.array(z.any()).optional().default([]),
  
  // Statut
  status: z.enum(['DRAFT', 'ACTIVE']).default('DRAFT'),
});

// ✅ Schéma pour la mise à jour (accepte null et undefined)
export const updateListingSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().max(2000).optional(),
  type: z.enum(['APARTMENT', 'VILLA', 'STUDIO', 'DUPLEX', 'HOUSE', 'ROOM']).optional(),
  governorate: z.string().optional(),
  delegation: z.string().optional(),
  street: z.string().optional(),
  neighborhood: z.string().optional(),
  postalCode: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  rooms: z.number().min(1).max(20).optional(),
  bathrooms: z.number().min(1).max(10).optional(),
  maxGuests: z.number().min(1).max(30).optional(),
  surfaceArea: z.number().nullable().optional(),
  floorNumber: z.number().nullable().optional(),
  hasElevator: z.boolean().optional(),
  rentalType: z.enum(['SHORT_TERM', 'LONG_TERM', 'BOTH']).optional(),
  pricePerNight: z.number().nullable().optional(),
  pricePerMonth: z.number().nullable().optional(),
  securityDeposit: z.number().nullable().optional(),
  cleaningFee: z.number().nullable().optional(),
  extraFees: z.array(extraFeeSchema).optional(),
  weekendPriceMultiplier: z.number().min(0).max(2).optional(),
  seasonalRules: z.array(seasonalRuleSchema).optional(),
  equipment: z.record(z.string(), z.boolean()).optional(),
  services: z.record(z.string(), z.boolean()).optional(),
  houseRules: z.record(z.string(), z.boolean()).optional(),
  customRules: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
});

// Schéma pour la création
export const createListingSchema = listingBaseSchema;

// Schéma pour la recherche
export const searchListingsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(10),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED', 'ALL']).default('ACTIVE'),
  governorate: z.string().optional(),
  type: z.enum(['APARTMENT', 'VILLA', 'STUDIO', 'DUPLEX', 'HOUSE', 'ROOM']).optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minRooms: z.coerce.number().min(1).optional(),
  search: z.string().optional(),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type SearchListingsInput = z.infer<typeof searchListingsSchema>;