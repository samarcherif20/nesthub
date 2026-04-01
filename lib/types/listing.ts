// types/listing.ts
import { Listing, ListingMedia, User, UserStats } from '@prisma/client';

export type ListingWithRelations = Listing & {
  owner: Pick<User, 'id' | 'firstName' | 'lastName' | 'profilePictureUrl' | 'isIdentityVerified' | 'createdAt'> & {
    stats?: Pick<UserStats, 'averageRating' | 'totalReviews'> | null;
  };
  photos: ListingMedia[];
  availability?: Array<{
    date: Date;
    isAvailable: boolean;
    customPrice?: number | null;
  }>;
  stats?: Array<{
    date: Date;
    views: number;
    bookings: number;
  }>;
};

export type ListingWithStats = Listing & {
  recentViews: number;
  recentBookings: number;
  mainPhoto?: ListingMedia;
};

export interface ListingFilters {
  governorate?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
  equipment?: string[];
  status?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}

// Type pour les statistiques d'utilisateur avec les notes
export interface UserWithRating {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
  isIdentityVerified: boolean;
  createdAt: Date;
  stats?: {
    averageRating: number | null;
    totalReviews: number;
  } | null;
}

// Type pour la réponse API avec pagination
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}