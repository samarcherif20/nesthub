'use client'

import { useState, useEffect, useCallback } from 'react'

export interface HomeListing {
  id: string
  title: string
  location: string
  pricePerNight: number
  rating: number
  reviewCount: number
  image: string
  type: string
  isVerified: boolean
  bedrooms: number
  bathrooms: number
  maxGuests: number
  features: string[]
  trustScore: number
}

export interface Recommendation {
  id: string
  title: string
  location: string
  pricePerNight: number
  image: string
  reason: string
}

export function useHomepage() {
  const [featuredListings, setFeaturedListings] = useState<HomeListing[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<HomeListing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useState({
    destination: '',
    checkIn: '',
    checkOut: '',
    guests: 2,
    minPrice: 300,
    maxPrice: 800
  })

  // Fonction pour les images
  const getImageUrl = useCallback((url: string | null | undefined): string => {
    if (!url) return 'https://placehold.co/600x400/e2e8f0/1e90ff?text=NestHub'
    if (url.includes('vercel-storage.com')) {
      return `/api/listings/image?url=${encodeURIComponent(url)}`
    }
    return url
  }, [])

  // Charger les annonces en vedette
  const fetchFeaturedListings = useCallback(async () => {
    try {
      const response = await fetch('/api/listings?page=1&pageSize=6&sortBy=rating')
      const data = await response.json()
      
      if (response.ok && data.listings) {
        const formatted = data.listings.map((item: any) => ({
          id: item.id,
          title: item.title,
          location: `${item.governorate || ''}, ${item.delegation || ''}`.replace(/^, /, '').replace(/, $/, ''),
          pricePerNight: item.pricePerNight || 0,
          rating: item.rating || 4.5,
          reviewCount: item.reviewCount || 0,
          image: getImageUrl(item.photos?.[0]?.url),
          type: item.type?.toLowerCase() || 'appartement',
          isVerified: item.isVerified || false,
          bedrooms: item.rooms || 1,
          bathrooms: item.bathrooms || 1,
          maxGuests: item.maxGuests || 2,
          features: [],
          trustScore: Math.floor(85 + Math.random() * 14)
        }))
        setFeaturedListings(formatted)
      }
    } catch (error) {
      console.error('Erreur chargement annonces vedettes:', error)
    }
  }, [getImageUrl])

  // Charger les recommandations IA
  const fetchRecommendations = useCallback(async () => {
    try {
      const response = await fetch('/api/homepage/recommendations')
      const data = await response.json()
      
      if (response.ok && data.recommendations) {
        setRecommendations(data.recommendations)
      } else {
        // Fallback: utiliser les annodes vedettes
        setRecommendations(featuredListings.slice(0, 3).map(l => ({
          id: l.id,
          title: l.title,
          location: l.location,
          pricePerNight: l.pricePerNight,
          image: l.image,
          reason: 'Sélectionné pour vous'
        })))
      }
    } catch (error) {
      console.error('Erreur chargement recommandations:', error)
    }
  }, [featuredListings])

  // Charger les derniers consultés (depuis localStorage)
  const loadRecentlyViewed = useCallback(() => {
    const stored = localStorage.getItem('recently_viewed')
    if (stored) {
      const ids = JSON.parse(stored)
      // Récupérer les détails des annonces récemment consultées
      const fetchRecent = async () => {
        const recentListings = await Promise.all(
          ids.slice(0, 3).map(async (id: string) => {
            const response = await fetch(`/api/listings/${id}`)
            if (response.ok) {
              const data = await response.json()
              return {
                id: data.id,
                title: data.title,
                location: `${data.governorate || ''}, ${data.delegation || ''}`,
                pricePerNight: data.pricePerNight || 0,
                rating: data.rating || 4.5,
                reviewCount: data.reviewCount || 0,
                image: getImageUrl(data.images?.[0] || data.photos?.[0]?.url),
                type: data.type?.toLowerCase() || 'appartement',
                isVerified: data.isVerified || false,
                bedrooms: data.rooms || 1,
                bathrooms: data.bathrooms || 1,
                maxGuests: data.maxGuests || 2,
                features: [],
                trustScore: 90
              }
            }
            return null
          })
        )
        setRecentlyViewed(recentListings.filter(l => l !== null) as HomeListing[])
      }
      fetchRecent()
    }
  }, [getImageUrl])

  // Recherche
  const handleSearch = useCallback(async () => {
    const params = new URLSearchParams()
    if (searchParams.destination) params.set('governorate', searchParams.destination)
    if (searchParams.minPrice) params.set('minPrice', searchParams.minPrice.toString())
    if (searchParams.maxPrice) params.set('maxPrice', searchParams.maxPrice.toString())
    if (searchParams.guests > 1) params.set('guests', searchParams.guests.toString())
    
    window.location.href = `/fr/search?${params.toString()}`
  }, [searchParams])

  // Initialisation
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await fetchFeaturedListings()
      setLoading(false)
    }
    init()
    loadRecentlyViewed()
  }, [fetchFeaturedListings, loadRecentlyViewed])

  useEffect(() => {
    if (featuredListings.length > 0) {
      fetchRecommendations()
    }
  }, [featuredListings, fetchRecommendations])

  return {
    featuredListings,
    recommendations,
    recentlyViewed,
    loading,
    searchParams,
    setSearchParams,
    handleSearch,
    getImageUrl
  }
}