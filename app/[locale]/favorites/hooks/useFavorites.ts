// app/fr/favorites/hooks/useFavorites.ts
'use client'

import { useState, useEffect } from 'react'

export interface FavoriteListing {
  id: string
  title: string
  location: string
  price: number
  rating: number
  reviewCount: number
  image: string
  type: string
  badges: string[]
  isVerified: boolean
  bedrooms: number
  bathrooms: number
}

// Données mockées des favoris
const MOCK_FAVORITES: FavoriteListing[] = [
  {
    id: '1',
    title: 'Palais des Jasmins',
    location: 'Sidi Bou Saïd, Tunis',
    price: 1200000,
    rating: 4.9,
    reviewCount: 24,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAW1OdAsZiopGkxNAWGtwSqnpKReXX1KlQw6MdRgzsohilAVFD6lyraPoi0tx6CCCuW3mYom-_-lzf7AA5iEDswMqanR8krjd17lm6v6OPf5Q2eNocxOAA9tBNBmDL6vYyy3dWFA24ufQlBWmKRm_xK9Y8ySUNMQ44qvViHFLEFA6AP6gDGiLGcNWQIo1il8AHC7x7mGaIPjXolOgekEKCshw8gCpbrjjuv0tVIHXxeAYAX7RM7p67ciKoZ2eiRGhcdQQEd7WNgl-11',
    type: 'Villa',
    badges: ['Luxe'],
    isVerified: true,
    bedrooms: 5,
    bathrooms: 4
  },
  {
    id: '2',
    title: "L'Oasis Bleue",
    location: 'Hammamet Sud',
    price: 850000,
    rating: 4.7,
    reviewCount: 12,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD4vkIBFXKOc_63Qb8t_wsKlf_ZZblpslDdopszWsPXs3QV9QF9W59Zt099XRhFH1wz96YXkt2DgFZbRjRF-xeaSUHUZfB4MQG4ldAF-p50bOyHOp4r_-7tQvuxS0Qa8vFPj2TNePBioAbNG7eKaZGNecEWoT21J5cNwUAeDSsg6WHSmZFcxSGoBFKGQp3G0WrZR_ix_GMOEzWKt4G4ZdbTqNdATW5uH2pt1EjenrgJZBA4_LeeR-_CYMNcteymBBS12iJ2dbnQ9ywB',
    type: 'Villa',
    badges: [],
    isVerified: false,
    bedrooms: 4,
    bathrooms: 3
  },
  {
    id: '3',
    title: 'Résidence Azure',
    location: 'Gammarth Supérieur',
    price: 2100000,
    rating: 5.0,
    reviewCount: 8,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBReS63oe72TqaEkK8ZtqaXROC-P8zpSt6icVA8uES_FM_pWI7XFrK9jVYQY5Ue80k4uamAkbKGUKGffHHCdCcnKNmhHHGlZvk1mClEIb99LRxwzjMCIB6YkWMbXaFa7capXvY55NNS1F8E2_zZJpdgEXODThsL4tmmZaGCrD6BFacGHe7qeJ22SvX8IMcT_o9_3NQtZfSr8J9ZTDiDdmJ8PvPpCSsE2SWboPwtlX9d-OTGxiko1qZ9BQP4DtXKlMjW4tn8CxBb881L',
    type: 'Villa',
    badges: ['Luxe'],
    isVerified: true,
    bedrooms: 6,
    bathrooms: 5
  }
]

// Listes de favoris
export const favoriteLists = [
  { id: 'all', name: 'Tous', count: 3 },
  { id: 'villas', name: 'Villas de rêve', count: 2 },
  { id: 'appartements', name: 'Appartements Tunis', count: 1 }
]

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteListing[]>([])
  const [selectedList, setSelectedList] = useState('all')
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Charger les favoris depuis localStorage
  useEffect(() => {
    const loadFavorites = () => {
      const savedFavorites = localStorage.getItem('favorites')
      if (savedFavorites) {
        const favoriteIds = JSON.parse(savedFavorites)
        const userFavorites = MOCK_FAVORITES.filter(fav => 
          favoriteIds.includes(fav.id)
        )
        setFavorites(userFavorites)
      } else {
        setFavorites([])
      }
      setLoading(false)
    }
    
    loadFavorites()
  }, [])

  // Filtrer par liste sélectionnée
  const filteredFavorites = favorites.filter(fav => {
    if (selectedList === 'all') return true
    if (selectedList === 'villas') return fav.type === 'Villa'
    if (selectedList === 'appartements') return fav.type === 'Appartement'
    return true
  })

  const removeFavorite = (listingId: string) => {
    // Mettre à jour l'état
    setFavorites(prev => prev.filter(fav => fav.id !== listingId))
    
    // Mettre à jour localStorage
    const saved = localStorage.getItem('favorites')
    if (saved) {
      const favoritesIds = JSON.parse(saved).filter((id: string) => id !== listingId)
      localStorage.setItem('favorites', JSON.stringify(favoritesIds))
    }
    
    // Retirer de la comparaison si présent
    setSelectedForCompare(prev => prev.filter(id => id !== listingId))
  }

  const toggleCompare = (listingId: string) => {
    setSelectedForCompare(prev => 
      prev.includes(listingId)
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    )
  }

  const clearCompare = () => {
    setSelectedForCompare([])
  }

  return {
    // Données
    favorites: filteredFavorites,
    allFavorites: favorites,
    selectedForCompare,
    selectedList,
    loading,
    
    // Setters
    setSelectedList,
    
    // Actions
    removeFavorite,
    toggleCompare,
    clearCompare,
    
    // Constantes
    favoriteLists,
    
    // Infos
    totalCount: favorites.length,
    compareCount: selectedForCompare.length
  }
}