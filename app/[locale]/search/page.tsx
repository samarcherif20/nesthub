
'use client'

import Link from 'next/link'
import { useSearch, categories, allAmenities } from './hooks/useSearch'
import { FaHome, FaCity } from 'react-icons/fa'
import { MdOutlineVilla } from 'react-icons/md'
import { TbBuildingCommunity } from 'react-icons/tb'  // ✅ Remplace TbApartment
import { GiHouse } from 'react-icons/gi'  // Alternative pour Maison

// Imports pour les autres icônes
import { 
  IoSearchOutline, 
  IoNotificationsOutline, 
  IoHeartOutline, 
  IoHeart,
  IoGridOutline,
  IoListOutline,
  IoMapOutline,
  IoLocationOutline,
  IoStar,
  IoFilterOutline
} from 'react-icons/io5'

export default function SearchPage() {
  const {
    listings,
    favorites,
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
    setViewMode,
    setPriceRange,
    setSelectedCategory,
    setSortBy,
    setIsFilterOpen,
    setSearchDestination,
    setSearchDates,
    setSearchGuests,
    resetFilters,
    toggleAmenity,
    toggleFavorite,
    handleSearch,
    goToPage,
    totalCount,
    startIndex,
    endIndex
  } = useSearch()

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md shadow-sm">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-8">
            <Link href="/fr" className="text-2xl font-bold tracking-tighter text-blue-700 font-headline">
              NestHub
            </Link>
            <nav className="hidden md:flex gap-6 items-center">
              <Link href="#" className="text-slate-600 hover:text-blue-500 font-medium">Louer</Link>
              <Link href="#" className="text-slate-600 hover:text-blue-500 font-medium">Estimer</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
          <Link href="/fr/favorites">
  <button className="p-2 hover:bg-slate-50 rounded-full relative cursor-pointer">
    <IoHeartOutline className="text-slate-600 text-xl" />
    {favorites.length > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
        {favorites.length}
      </span>
    )}
  </button>
</Link>
            <button className="p-2 hover:bg-slate-50 rounded-full relative">
              <IoNotificationsOutline className="text-slate-600 text-xl" />
            </button>
            <div className="h-10 w-10 rounded-full border-2 border-primary overflow-hidden">
              <img alt="Profil" src="https://lh3.googleusercontent.com/aida-public/AB6AXuASeRrq8XMgF9ZARsr1CCG9QTTK3bwreRbTJ1_SOX2kjk1n61tNwN1T_elBwS9qF-nTMZH51MNpP1aJGz1CJ62wtLHHPD8meSBrevHiAlSQnsk_VFDLHsHCsWb6TGGYNg3P56mfpRwaJwoUyOPWH-ve2n51epOqetJR1-gsOVUUo8LVNlZTfXcg2dGbFnPD1af8mu_y6_Uo5_lmZ79OxlGv22iHt-bcXKNBH-_Y_M83RF8_uLeSTpNiMWf1znHCW6AsRSzyy2WqBSLG" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-32">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 mb-12">
          <div className="relative h-[480px] w-full rounded-2xl overflow-hidden mb-[-80px] shadow-xl">
            <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuSOcHlc9X1DdNnMm2HQoLo-hw5CeTaVurUHqgjjy31qswZa6glxoG6ls9F-aecsza7AOc7bBiRekQJVTA3bs1JggWxJWhpn5NLCnjca4uVkTp9Z_apWHFRoH8yXjd2GkTfMkzOo6U_r9p4U6DCI9_PuAe2-5FCX7pvzpNMjZVrFCckGsi-AygMzB9U57kI_NlLhYPWdunLD3pZCRf-szzLy76BSF5lrzOhJRxYHr9nap9xcOMKQrXOtce0eOZNHxeXVImc7JZ_GC0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <div className="absolute bottom-32 left-12 max-w-2xl">
              <h1 className="font-headline text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
                Le luxe méditerranéen, <br/>organisé pour vous.
              </h1>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="relative z-10 max-w-5xl mx-auto">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-4 flex flex-col md:flex-row items-center gap-2 border border-white/40">
              <div className="flex-1 w-full px-6 py-2">
                <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Zone</label>
                <input 
                  value={searchDestination}
                  onChange={(e) => setSearchDestination(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full bg-transparent border-none p-0 text-gray-900 font-semibold focus:ring-0 placeholder:text-slate-400" 
                  placeholder="Où voulez-vous habiter ?" 
                  type="text"
                />
              </div>
              <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
              <div className="flex-1 w-full px-6 py-2">
                <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Dates</label>
                <div className="flex gap-2">
                  <input 
                    type="date" 
                    value={searchDates.checkIn}
                    onChange={(e) => setSearchDates({ ...searchDates, checkIn: e.target.value })}
                    className="w-full bg-transparent text-sm text-gray-900 font-semibold focus:ring-0"
                    placeholder="Arrivée"
                  />
                  <span className="text-gray-400">→</span>
                  <input 
                    type="date" 
                    value={searchDates.checkOut}
                    onChange={(e) => setSearchDates({ ...searchDates, checkOut: e.target.value })}
                    className="w-full bg-transparent text-sm text-gray-900 font-semibold focus:ring-0"
                    placeholder="Départ"
                  />
                </div>
              </div>
              <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
              <div className="flex-1 w-full px-6 py-2">
                <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">personnes</label>
                <select 
                  value={searchGuests}
                  onChange={(e) => setSearchGuests(parseInt(e.target.value))}
                  className="w-full bg-transparent text-gray-900 font-semibold focus:ring-0"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <option key={n} value={n}>{n} personne{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={handleSearch}
                className="w-full md:w-auto h-16 px-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-95"
              >
                <IoSearchOutline className="text-xl" />
                Rechercher
              </button>
            </div>
          </div>
        </section>

        {/* Categories avec React Icons */}
       {/* Categories avec React Icons */}
<section className="max-w-7xl mx-auto px-6 mb-12">
  <div className="flex items-center gap-8 overflow-x-auto no-scrollbar py-4">
    {categories.map(cat => (
      <button
        key={cat.id}
        onClick={() => {
          setSelectedCategory(cat.id)
          handleSearch()
        }}
        className={`flex flex-col items-center gap-2 min-w-fit pb-2 transition-all ${
          selectedCategory === cat.id ? 'border-b-2 border-blue-600' : 'opacity-60 hover:opacity-100'
        }`}
      >
        <span className="text-2xl">
          {cat.id === 'all' && <FaHome className={selectedCategory === cat.id ? 'text-blue-600' : ''} />}
          {cat.id === 'Villa' && <MdOutlineVilla className={selectedCategory === cat.id ? 'text-blue-600' : ''} />}
          {cat.id === 'Appartement' && <TbBuildingCommunity className={selectedCategory === cat.id ? 'text-blue-600' : ''} />}
          {cat.id === 'Maison' && <FaHome className={selectedCategory === cat.id ? 'text-blue-600' : ''} />}
          {cat.id === 'Studio' && <FaCity className={selectedCategory === cat.id ? 'text-blue-600' : ''} />}
        </span>
        <span className={`text-sm ${selectedCategory === cat.id ? 'font-semibold text-blue-600' : 'font-medium'}`}>
          {cat.name}
        </span>
      </button>
    ))}
  </div>
</section>

        {/* Results */}
        <section className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
            <div>
              <h2 className="font-headline text-3xl font-extrabold tracking-tight text-gray-900">
                {searchDestination ? `Résultats pour "${searchDestination}"` : 'Dernières pépites pour vous'}
              </h2>
              <p className="text-slate-500 mt-1">
                {totalCount} logement{totalCount > 1 ? 's' : ''} trouvé{totalCount > 1 ? 's' : ''}
                {totalCount > 0 && ` · ${startIndex}-${endIndex}`}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>
                  <IoGridOutline className="text-xl" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>
                  <IoListOutline className="text-xl" />
                </button>
              </div>

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white">
                <option value="relevance">Pertinence</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="rating">Meilleures notes</option>
              </select>

              <button onClick={() => setIsFilterOpen(true)} className="lg:hidden px-4 py-2 border border-gray-200 rounded-xl text-sm flex items-center gap-2">
                <IoFilterOutline className="text-lg" />
                Filtres
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="hidden lg:block lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24 border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg">Filtres</h3>
                  <button onClick={resetFilters} className="text-sm text-blue-600 hover:underline">Réinitialiser</button>
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-semibold mb-3">Prix max: {priceRange[1]} TND</label>
                  <input 
  type="range" 
  min="0" 
  max="5000" 
  step="50" 
  value={priceRange[1]} 
  onChange={(e) => {
    const newMax = parseInt(e.target.value)
    setPriceRange([priceRange[0], newMax])
  }} 
  className="w-full h-2 bg-blue-200 rounded-lg cursor-pointer"
/>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>0 TND</span>
                    <span>1250 TND</span>
                    <span>2500 TND</span>
                    <span>3750 TND</span>
                    <span>5000+ TND</span>
                  </div>
                </div>

                <div className="mb-8">
                  <h4 className="font-semibold mb-3">Équipements</h4>
                  <div className="space-y-2">
                    {allAmenities.map(amenity => (
                      <label key={amenity} className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedAmenities.includes(amenity)} 
                          onChange={() => toggleAmenity(amenity)} 
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleSearch}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  Appliquer
                </button>
              </div>
            </aside>

            {/* Results Grid/List */}
            <main className="flex-1">
              {listings.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold mb-2">Aucun résultat trouvé</h3>
                  <p className="text-gray-500">Essayez de modifier vos filtres ou votre recherche</p>
                  <button 
                    onClick={resetFilters}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                  >
                    Réinitialiser tous les filtres
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {listings.map((listing) => (
                    <ListingCard 
                      key={listing.id} 
                      listing={listing} 
                      isFavorite={favorites.includes(listing.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {listings.map((listing) => (
                    <ListingRow 
                      key={listing.id} 
                      listing={listing}
                      isFavorite={favorites.includes(listing.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-12">
                  <button 
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 border rounded-xl transition ${
                      currentPage === 1 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    ← Précédent
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`px-4 py-2 rounded-xl transition ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  
                  <button 
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 border rounded-xl transition ${
                      currentPage === totalPages 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    Suivant →
                  </button>
                </div>
              )}
            </main>
          </div>
        </section>
      </main>

      {/* Floating Map Button */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40">
        <button 
          onClick={() => alert('🗺️ Vue carte - À venir dans le Sprint 2!')}
          className="bg-gray-900 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-2xl hover:scale-105 transition-transform active:scale-95"
        >
          <IoMapOutline className="text-xl" />
          Afficher la carte
        </button>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-2 bg-white/80 backdrop-blur-xl md:hidden z-50 rounded-t-3xl shadow-lg">
        <Link href="/fr/search" className="flex flex-col items-center justify-center bg-blue-50 text-blue-700 rounded-2xl px-5 py-2">
          <IoSearchOutline className="text-xl" />
          <span className="text-[11px] font-medium mt-1">Explorer</span>
        </Link>
        <Link href="#" className="flex flex-col items-center justify-center text-slate-500 px-5 py-2">
          <IoHeartOutline className="text-xl" />
          <span className="text-[11px] font-medium mt-1">Favoris</span>
        </Link>
        <Link href="#" className="flex flex-col items-center justify-center text-slate-500 px-5 py-2">
          <span className="text-xl">✉️</span>
          <span className="text-[11px] font-medium mt-1">Messages</span>
        </Link>
        <Link href="#" className="flex flex-col items-center justify-center text-slate-500 px-5 py-2">
          <span className="text-xl">👤</span>
          <span className="text-[11px] font-medium mt-1">Profil</span>
        </Link>
      </nav>
    </div>
  )
}

// Composant Carte
function ListingCard({ listing, isFavorite, onToggleFavorite }: { listing: any; isFavorite: boolean; onToggleFavorite: (id: string, e: React.MouseEvent) => void }) {
  return (
    <Link href={`/fr/listings/${listing.id}`} className="group cursor-pointer">
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 mb-4 shadow-sm group-hover:shadow-xl transition-all">
        <img src={listing.image} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-4 left-4 flex gap-2">
          {listing.badges.map((badge: string) => (
            <span key={badge} className="bg-white/90 backdrop-blur-md text-blue-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase">{badge}</span>
          ))}
        </div>
        <button 
          onClick={(e) => onToggleFavorite(listing.id, e)}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/40 transition"
        >
          {isFavorite ? (
            <IoHeart className="text-red-500 text-xl" />
          ) : (
            <IoHeartOutline className="text-xl" />
          )}
        </button>
      </div>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-headline text-lg font-bold text-gray-900">{listing.title}</h3>
          <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
            <IoLocationOutline className="text-[16px]" />
            {listing.location}
          </div>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
          <IoStar className="text-amber-500 text-[16px]" />
          <span className="text-sm font-bold">{listing.rating}</span>
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-xl font-extrabold text-blue-600">{listing.price.toLocaleString()}</span>
        <span className="text-[11px] font-bold text-slate-400 uppercase">TND / NUIT</span>
      </div>
    </Link>
  )
}

// Composant Ligne
function ListingRow({ listing, isFavorite, onToggleFavorite }: { listing: any; isFavorite: boolean; onToggleFavorite: (id: string, e: React.MouseEvent) => void }) {
  return (
    <Link href={`/fr/listings/${listing.id}`}>
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-4 flex gap-4">
        <div className="relative">
          <img src={listing.image} alt={listing.title} className="w-36 h-36 object-cover rounded-lg" />
          <button 
            onClick={(e) => onToggleFavorite(listing.id, e)}
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/40 transition"
          >
            {isFavorite ? (
              <IoHeart className="text-red-500 text-sm" />
            ) : (
              <IoHeartOutline className="text-sm" />
            )}
          </button>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{listing.title}</h3>
              <p className="text-gray-500 text-sm">📍 {listing.location}</p>
              <div className="flex gap-2 mt-1 text-xs text-gray-500">
                <span>🛏️ {listing.bedrooms} lits</span>
                <span>🚽 {listing.bathrooms} sdb</span>
                <span>👥 {listing.maxGuests} pers.</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-blue-600">{listing.price} TND</div>
              <div className="text-sm text-gray-500">/nuit</div>
              <div className="flex items-center gap-1 mt-1">
                <IoStar className="text-amber-500 text-sm" />
                {listing.rating}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-3">
            {listing.amenities.slice(0, 4).map((a: string) => (
              <span key={a} className="text-xs bg-gray-100 px-2 py-1 rounded">✓ {a}</span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}