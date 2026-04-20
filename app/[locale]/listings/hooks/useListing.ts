'use client'

import { useState, useEffect } from 'react'

export interface ListingDetail {
  id: string
  title: string
  description: string
  location: string
  governorate: string
  delegation: string
  price: number
  pricePerNight: number
  rating: number
  reviewCount: number
  images: string[]
  type: string
  badges: string[]
  isVerified: boolean
  bedrooms: number
  bathrooms: number
  maxGuests: number
  surfaceArea: number
  amenities: string[]
  houseRules: string[]
  owner: {
    id: string
    name: string
    avatar: string
    isVerified: boolean
    memberSince: string
    responseRate: number
    responseTime: string
    totalReviews: number
  }

  // ⭐ disponibilité journalière
  availability: {
    date: string
    isAvailable: boolean
  }[]

  // ⭐ périodes bloquées
  blockedDates: {
    startDate: string
    endDate: string
  }[]
}

// Fonction pour les URLs d'images avec fallback
const getImageUrl = (photoUrl: string | null | undefined): string | null => {
  if (!photoUrl) return null
  if (photoUrl.includes('vercel-storage.com')) {
    return `/api/listings/image?url=${encodeURIComponent(photoUrl)}`
  }
  return photoUrl
}

export function useListing(id: string) {
  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return
      
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/listings/${id}`)
        
        if (!response.ok) {
          throw new Error('Annonce non trouvée')
        }
        
        const data = await response.json()
        console.log('📦 Données reçues de l\'API:', data)
        
        // 📸 Récupérer les URLs des photos
        const photoUrls = (data.photos || [])
          .map((p: any) => p.url)
          .filter((url: string) => url && url.trim() !== '')
        
        const images = photoUrls
          .map((url: string) => getImageUrl(url))
          .filter((url: string | null): url is string => url !== null)
        
        console.log('🖼️ Images trouvées:', images.length)
        
        // 🏠 Transformer les équipements
        let amenitiesArray: string[] = []
        if (data.equipment) {
          if (typeof data.equipment === 'object') {
            amenitiesArray = Object.keys(data.equipment)
              .filter(key => data.equipment[key] === true)
          } else if (Array.isArray(data.equipment)) {
            amenitiesArray = data.equipment
          }
        }
        
        // 🏷️ Badges dynamiques
        const badges: string[] = []
        if (data.owner?.isIdentityVerified) badges.push('Vérifié')
        if (data.type === 'VILLA') badges.push('Luxe')
        
        // 👤 Nom du propriétaire
        const ownerName = data.owner?.username 
          || `${data.owner?.firstName || ''} ${data.owner?.lastName || ''}`.trim() 
          || 'Propriétaire'
        
        const formattedListing: ListingDetail = {
          id: data.id,
          title: data.title || 'Sans titre',
          description: data.description || 'Aucune description disponible.',
          location: `${data.governorate || ''}, ${data.delegation || ''}`
            .replace(/^, /, '')
            .replace(/, $/, '') || 'Emplacement non spécifié',
          governorate: data.governorate || '',
          delegation: data.delegation || '',
          price: data.pricePerNight || 0,
          pricePerNight: data.pricePerNight || 0,
          rating: 4.5,
          reviewCount: 0,
          images: images,
          type: data.type?.toLowerCase() || 'appartement',
          badges: badges,
          isVerified: data.owner?.isIdentityVerified || false,
          bedrooms: data.rooms || 1,
          bathrooms: data.bathrooms || 1,
          maxGuests: data.maxGuests || 2,
          surfaceArea: data.surfaceArea || 0,
          amenities: amenitiesArray,
          houseRules: [
            'Arrivée : 15:00 - 20:00',
            'Départ avant 11:00',
            'Logement non-fumeur',
            'Pas de fête ou événement'
          ],
          owner: {
            id: data.owner?.id || '',
            name: ownerName,
            avatar: data.owner?.profilePictureUrl || '',
            isVerified: data.owner?.isIdentityVerified || false,
            memberSince: data.owner?.createdAt
              ? new Date(data.owner.createdAt).getFullYear().toString()
              : '2024',
            responseRate: 98,
            responseTime: "moins d'une heure",
            totalReviews: 0
          },

          // ⭐ DONNÉES CALENDRIER DEPUIS L’API
          availability: data.availability || [],
          blockedDates: data.blockedDates || []
        }
        
        console.log('✅ Listing formaté:', formattedListing)
        setListing(formattedListing)

      } catch (err) {
        console.error('Erreur chargement annonce:', err)
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }
    
    fetchListing()
  }, [id])

  const calculateTotalPrice = () => {
    if (!checkIn || !checkOut || !listing) return 0
    const nights = Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
    )
    return nights * listing.pricePerNight
  }

  const getAvailableDates = () => {
    return listing?.availability
      .filter(a => a.isAvailable)
      .map(a => a.date) || []
  }

  return {
    listing,
    loading,
    error,
    selectedImage,
    setSelectedImage,
    showAllPhotos,
    setShowAllPhotos,
    checkIn,
    setCheckIn,
    checkOut,
    setCheckOut,
    guests,
    setGuests,
    calculateTotalPrice,
    getAvailableDates,
  }
}