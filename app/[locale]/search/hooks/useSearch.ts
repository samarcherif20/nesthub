// app/fr/search/hooks/useSearch.ts
'use client'

import { useState, useMemo } from 'react'

// Types
export interface Listing {
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
  maxGuests: number
  amenities: string[]
}

// Données mockées (à remplacer par API plus tard)
const MOCK_LISTINGS: Listing[] = [
  {
    id: '1',
    title: 'Villa Dar Carthage',
    location: 'La Marsa, Tunis',
    price: 1250,
    rating: 4.9,
    reviewCount: 24,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfuoFpvqayhB8CCjTp3eZUR4wT9YwVYR0WlsxLBgdMq8IRDT409e-ZkEJxqqYu8GM3A3kpYngob5mYQPltMexoVSIJtoJJH35MO-nC0n0dF2KZQziDl6br0cnHhkM9Tkb2Uq8n1QNI8QhF2HA-OcbI7yHCdLWImA7kUklrt_5laU2oJWiu8hDDNGuqpg7OqCeHK8pGfzW1LVS0_xWMuGEXJoL6_bTFCSNb3ZpiZewUnudwEPDKlu51t4Q0xVt3yp9IPusCHlrA-SW_',
    type: 'Villa',
    badges: ['Luxe'],
    isVerified: true,
    bedrooms: 4,
    bathrooms: 3,
    maxGuests: 8,
    amenities: ['WiFi', 'Piscine', 'Parking', 'Climatisation']
  },
  {
    id: '2',
    title: 'Penthouse Azur',
    location: 'Gammarth, Tunis',
    price: 890,
    rating: 4.8,
    reviewCount: 12,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKGDipaDP7XFxGSXqYuzwVTFR_IEmz9bVizwMdU1gk0_kNAT21rqb_RnSlqRAjC1rHNCGP-INVciWpq1wQiIuTyd2NcM55W3hkIqSpcoOpoKJSBddxRDa9YCmcH5Suzc8pRWK-v3AIYnobkK1j_87NWSnCxSoDNpy9ereIv_t-lVb-5zrKduGySDpPiPrQF_ENF07yfgjl61i8JvznmPsFI1cH0JU9z1uVY7cwjvnV8o_fVdEJDXvl9ajyj5-7pHdUiojLP6QOszDP',
    type: 'Appartement',
    badges: ['Vérifié'],
    isVerified: true,
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 6,
    amenities: ['WiFi', 'Piscine', 'Parking', 'Climatisation', 'Balcon']
  },
  {
    id: '3',
    title: 'Riad El Hana',
    location: 'Hammamet, Nabeul',
    price: 650,
    rating: 4.9,
    reviewCount: 8,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_CePMz52LGvGZj-0qKmtwkIboWQ9s-tMjKU-fYuQXksBAxulm7ir8xbHeGtT6sK8jueDoHNEttwb0gJH3AUZNqUvP-Ez6LYGsO117KTwq1M3mwhPHlIJeqTyK9TBNGcV1aKLeBmbQOvdkpugMVm6Telc51qqGPrInMhLh3XJ_slM_5xY574na5SP86897jQuPVfD1csZnChv7eXFKhLofDmvl_OwZTuXuzNB5IgsE1bYxkznuUWsQe4bE3T1Rf5Q7obG0CnrG3KET',
    type: 'Maison',
    badges: ['Authentique'],
    isVerified: false,
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 6,
    amenities: ['WiFi', 'Jardin', 'Climatisation']
  },
  {
    id: '4',
    title: 'Appartement Vue Mer',
    location: 'La Goulette, Tunis',
    price: 450,
    rating: 4.7,
    reviewCount: 34,
    image: 'https://picsum.photos/id/103/400/300',
    type: 'Appartement',
    badges: ['Nouveau'],
    isVerified: true,
    bedrooms: 2,
    bathrooms: 1,
    maxGuests: 4,
    amenities: ['WiFi', 'Climatisation', 'Balcon']
  },
  {
    id: '5',
    title: 'Villa Méditerranée',
    location: 'Sidi Bou Saïd, Tunis',
    price: 2100,
    rating: 5.0,
    reviewCount: 45,
    image: 'https://picsum.photos/id/104/400/300',
    type: 'Villa',
    badges: ['Luxe', 'Vue mer'],
    isVerified: true,
    bedrooms: 5,
    bathrooms: 4,
    maxGuests: 10,
    amenities: ['WiFi', 'Piscine', 'Parking', 'Climatisation', 'Jardin', 'Terrasse']
  },
  {
    id: '6',
    title: 'Studio Moderne',
    location: 'Centre Urbain Nord, Tunis',
    price: 180,
    rating: 4.5,
    reviewCount: 18,
    image: 'https://picsum.photos/id/106/400/300',
    type: 'Studio',
    badges: ['Économique'],
    isVerified: false,
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    amenities: ['WiFi', 'Climatisation']
  }
]

// Catégories disponibles
export const categories = [
  { id: 'all', name: 'Tous', icon: 'FaHome' },
  { id: 'Villa', name: 'Villas', icon: 'MdOutlineVilla' },
  { id: 'Appartement', name: 'Appartements', icon: 'TbApartment' },
  { id: 'Maison', name: 'Maisons', icon: 'FaHome' },
  { id: 'Studio', name: 'Studios', icon: 'FaCity' },
]

// Équipements disponibles
export const allAmenities = [
  'WiFi', 
  'Climatisation', 
  'Parking', 
  'Piscine', 
  'Cuisine équipée', 
  'Jardin', 
  'Terrasse', 
  'Balcon'
]

export function useSearch() {
  // États d'affichage
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  
  // États des filtres
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('relevance')
  
  // États de recherche
  const [searchDestination, setSearchDestination] = useState('')
  const [searchDates, setSearchDates] = useState({ checkIn: '', checkOut: '' })
  const [searchGuests, setSearchGuests] = useState(1)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6
  
  // Favoris (localStorage)
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('favorites')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  // Logique de filtrage
  const filteredListings = useMemo(() => {
    let results = [...MOCK_LISTINGS]

    // Filtre par destination
    if (searchDestination) {
      results = results.filter(l => 
        l.location.toLowerCase().includes(searchDestination.toLowerCase())
      )
    }

    // Filtre par catégorie
    if (selectedCategory !== 'all') {
      results = results.filter(l => l.type === selectedCategory)
    }

    // Filtre par prix
    results = results.filter(l => l.price >= priceRange[0] && l.price <= priceRange[1])

    // Filtre par équipements
    if (selectedAmenities.length > 0) {
      results = results.filter(l => 
        selectedAmenities.every(amenity => l.amenities.includes(amenity))
      )
    }

    // Tri
    switch (sortBy) {
      case 'price_asc':
        results.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        results.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        results.sort((a, b) => b.rating - a.rating)
        break
      default:
        // Pertinence (ordre original)
        break
    }

    return results
  }, [searchDestination, selectedCategory, priceRange, selectedAmenities, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage)
  const paginatedListings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredListings.slice(start, start + itemsPerPage)
  }, [filteredListings, currentPage])

  // Actions
  const resetFilters = () => {
    setPriceRange([0, 5000])
    setSelectedAmenities([])
    setSelectedCategory('all')
    setSortBy('relevance')
    setSearchDestination('')
    setSearchDates({ checkIn: '', checkOut: '' })
    setSearchGuests(1)
    setCurrentPage(1)
  }

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity) 
        : [...prev, amenity]
    )
    setCurrentPage(1)
  }

  const toggleFavorite = (listingId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setFavorites(prev => {
      const newFavorites = prev.includes(listingId)
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
      
      localStorage.setItem('favorites', JSON.stringify(newFavorites))
      return newFavorites
    })
  }

  const handleSearch = () => {
    setCurrentPage(1)
    console.log('Recherche:', { searchDestination, searchDates, searchGuests })
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Retourner tout ce dont l'UI a besoin
  return {
    // Données
    listings: paginatedListings,
    allListings: filteredListings,
    favorites,
    
    // États
    viewMode,
    priceRange,
    selectedCategory,
    selectedAmenities,
    sortBy,
    isFilterOpen,
    currentPage,
    totalPages,
    searchDestination,
    searchDates,
    searchGuests,
    
    // Setters
    setViewMode,
    setPriceRange,
    setSelectedCategory,
    setSortBy,
    setIsFilterOpen,
    setSearchDestination,
    setSearchDates,
    setSearchGuests,
    
    // Actions
    resetFilters,
    toggleAmenity,
    toggleFavorite,
    handleSearch,
    goToPage,
    
    // Constantes
    categories,
    allAmenities,
    
    // Infos
    totalCount: filteredListings.length,
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, filteredListings.length)
  }
}