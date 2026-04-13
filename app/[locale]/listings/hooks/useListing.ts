// app/fr/listings/hooks/useListing.ts
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
  availability: {
    date: string
    isAvailable: boolean
  }[]
}

// Données mockées pour une annonce
const MOCK_LISTING: ListingDetail = {
  id: '1',
  title: 'Villa Dar Carthage - Luxe et Sérénité',
  description: `Magnifique villa contemporaine située à La Marsa, offrant une vue imprenable sur la mer Méditerranée. 
  
Cette propriété d'exception dispose de 5 chambres spacieuses, chacune avec salle de bain privative, une grande piscine à débordement, un jardin paysager de 1000m² et un accès direct à la plage.

La villa est entièrement équipée avec les dernières technologies : domotique, climatisation réversible, chauffage au sol, et système de sécurité haut de gamme.

Idéalement située à 10 minutes de Tunis et de l'aéroport international, ce bien rare allie luxe, confort et tranquillité.`,
  location: 'La Marsa, Tunis',
  governorate: 'Tunis',
  delegation: 'La Marsa',
  price: 1250,
  pricePerNight: 1250,
  rating: 4.9,
  reviewCount: 24,
  images: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAW1OdAsZiopGkxNAWGtwSqnpKReXX1KlQw6MdRgzsohilAVFD6lyraPoi0tx6CCCuW3mYom-_-lzf7AA5iEDswMqanR8krjd17lm6v6OPf5Q2eNocxOAA9tBNBmDL6vYyy3dWFA24ufQlBWmKRm_xK9Y8ySUNMQ44qvViHFLEFA6AP6gDGiLGcNWQIo1il8AHC7x7mGaIPjXolOgekEKCshw8gCpbrjjuv0tVIHXxeAYAX7RM7p67ciKoZ2eiRGhcdQQEd7WNgl-11',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD4vkIBFXKOc_63Qb8t_wsKlf_ZZblpslDdopszWsPXs3QV9QF9W59Zt099XRhFH1wz96YXkt2DgFZbRjRF-xeaSUHUZfB4MQG4ldAF-p50bOyHOp4r_-7tQvuxS0Qa8vFPj2TNePBioAbNG7eKaZGNecEWoT21J5cNwUAeDSsg6WHSmZFcxSGoBFKGQp3G0WrZR_ix_GMOEzWKt4G4ZdbTqNdATW5uH2pt1EjenrgJZBA4_LeeR-_CYMNcteymBBS12iJ2dbnQ9ywB',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBReS63oe72TqaEkK8ZtqaXROC-P8zpSt6icVA8uES_FM_pWI7XFrK9jVYQY5Ue80k4uamAkbKGUKGffHHCdCcnKNmhHHGlZvk1mClEIb99LRxwzjMCIB6YkWMbXaFa7capXvY55NNS1F8E2_zZJpdgEXODThsL4tmmZaGCrD6BFacGHe7qeJ22SvX8IMcT_o9_3NQtZfSr8J9ZTDiDdmJ8PvPpCSsE2SWboPwtlX9d-OTGxiko1qZ9BQP4DtXKlMjW4tn8CxBb881L',
    'https://picsum.photos/id/104/800/600',
    'https://picsum.photos/id/106/800/600',
  ],
  type: 'Villa',
  badges: ['Luxe', 'Vue mer'],
  isVerified: true,
  bedrooms: 5,
  bathrooms: 4,
  maxGuests: 10,
  surfaceArea: 350,
  amenities: ['WiFi', 'Piscine', 'Parking', 'Climatisation', 'Cuisine équipée', 'Jardin', 'Terrasse', 'Balcon', 'Lave-linge', 'Télévision', 'Chauffage', 'Eau chaude'],
  houseRules: [
    'Non-fumeurs',
    'Pas de fête ou événement',
    'Pas d\'animaux',
    'Respecter le voisinage',
    'Rendre les clés à 11h',
  ],
  owner: {
    id: 'owner1',
    name: 'Ahmed Ben Salah',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    isVerified: true,
    memberSince: '2019',
    responseRate: 98,
    responseTime: 'moins d\'une heure',
    totalReviews: 127,
  },
  availability: Array.from({ length: 90 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return {
      date: date.toISOString().split('T')[0],
      isAvailable: Math.random() > 0.3,
    }
  }),
}

export function useListing(id: string) {
  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)

  useEffect(() => {
    // Simuler un chargement API
    const loadListing = () => {
      setLoading(true)
      setTimeout(() => {
        setListing(MOCK_LISTING)
        setLoading(false)
      }, 500)
    }
    loadListing()
  }, [id])

  const calculateTotalPrice = () => {
    if (!checkIn || !checkOut || !listing) return 0
    const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    return nights * listing.pricePerNight
  }

  const getAvailableDates = () => {
    return listing?.availability.filter(a => a.isAvailable).map(a => a.date) || []
  }

  return {
    listing,
    loading,
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