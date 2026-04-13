// app/fr/favorites/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  IoHeart, 
  IoNotificationsOutline, 
  IoPersonOutline,
  IoAdd,
  IoStar,
  IoLocationOutline,
  IoCheckmarkCircle,
  IoGitCompare
} from 'react-icons/io5'
import { useFavorites, favoriteLists } from './hooks/useFavorites'

export default function FavoritesPage() {
  const {
    favorites,
    selectedForCompare,
    selectedList,
    loading,
    setSelectedList,
    removeFavorite,
    toggleCompare,
    compareCount
  } = useFavorites()

  // Évite l'erreur d'hydratation
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-on-surface-variant">Chargement de vos favoris...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl fixed top-0 w-full z-50">
        <nav className="flex justify-between items-center px-8 py-4 max-w-full mx-auto">
          <div className="flex items-center gap-8">
            <Link href="/fr" className="text-2xl font-black tracking-tighter text-blue-700 dark:text-blue-400 font-headline">
              NESTHUB
            </Link>
            <div className="hidden md:flex gap-6">
              <Link href="/fr/search" className="text-slate-500 dark:text-slate-400 font-medium font-headline hover:text-blue-500 transition-colors">
                Explorer
              </Link>
              <Link href="#" className="text-slate-500 dark:text-slate-400 font-medium font-headline hover:text-blue-500 transition-colors">
                Propriétés
              </Link>
              <Link href="/fr/favorites" className="text-blue-700 dark:text-blue-400 font-extrabold border-b-2 border-blue-600 pb-1 font-headline">
                Favoris
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-all">
              <IoNotificationsOutline className="text-xl" />
            </button>
            <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-all">
              <IoPersonOutline className="text-xl" />
            </button>
          </div>
        </nav>
      </header>

      <main className="pt-24 pb-32 max-w-7xl mx-auto px-6">
        {/* Header Section */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
            <h1 className="text-5xl font-headline font-extrabold tracking-tight text-on-surface mb-2">
              Mes favoris
            </h1>
            <p className="text-on-surface-variant font-medium">
              {favorites.length} propriété{favorites.length > 1 ? 's' : ''} enregistrée{favorites.length > 1 ? 's' : ''}
            </p>
          </div>
          <button className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-3 rounded-full font-headline font-bold flex items-center gap-2 shadow-lg hover:opacity-90 active:scale-95 transition-all">
            <IoAdd className="text-xl" />
            Créer une liste
          </button>
        </section>

        {/* Tabs Section */}
        <section className="mb-12">
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {favoriteLists.map(list => (
              <button
                key={list.id}
                onClick={() => setSelectedList(list.id)}
                className={`px-6 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
                  selectedList === list.id
                    ? 'bg-primary text-on-primary shadow-md'
                    : 'bg-surface-container-highest text-on-surface hover:bg-surface-variant'
                }`}
              >
                {list.name} ({list.count})
              </button>
            ))}
          </div>
        </section>

        {/* Listings Grid */}
        {favorites.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-lowest rounded-2xl">
            <div className="text-6xl mb-4">❤️</div>
            <h3 className="text-xl font-semibold mb-2">Aucun favori</h3>
            <p className="text-on-surface-variant mb-6">
              Vous n'avez pas encore ajouté de propriétés à vos favoris
            </p>
            <Link 
              href="/fr/search"
              className="inline-block bg-primary text-on-primary px-6 py-3 rounded-full font-semibold hover:opacity-90 transition"
            >
              Découvrir des annonces
            </Link>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {favorites.map((listing) => (
              <div key={listing.id} className="group flex flex-col bg-surface-container-lowest rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img 
                    alt={listing.title} 
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
                    src={listing.image}
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={() => removeFavorite(listing.id)}
                      className="w-10 h-10 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center text-primary shadow-sm active:scale-90 transition-all"
                    >
                      <IoHeart className="text-red-500 text-xl" />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    {listing.isVerified && (
                      <span className="bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-lg text-primary text-xs font-bold font-label flex items-center gap-1">
                        <IoCheckmarkCircle className="text-sm" />
                        PROPRIÉTAIRE VÉRIFIÉ
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <Link href={`/fr/listings/${listing.id}`}>
                      <h3 className="text-xl font-headline font-bold text-on-surface hover:text-primary transition-colors">
                        {listing.title}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-md">
                      <IoStar className="text-yellow-500 text-sm" />
                      <span className="text-sm font-bold">{listing.rating}</span>
                    </div>
                  </div>
                  <p className="text-on-surface-variant text-sm mb-4 flex items-center gap-1">
                    <IoLocationOutline className="text-sm" />
                    {listing.location} • {listing.bedrooms} Ch, {listing.bathrooms} Sdb
                  </p>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-headline font-black text-primary">
                        {listing.price.toLocaleString()}
                      </span>
                      <span className="text-sm font-bold text-on-surface-variant font-label">TND</span>
                    </div>
                    <button 
                      onClick={() => toggleCompare(listing.id)}
                      className={`px-3 py-1 rounded-full text-sm font-semibold transition-all ${
                        selectedForCompare.includes(listing.id)
                          ? 'bg-primary text-white'
                          : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
                      }`}
                    >
                      Comparer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>

      {/* Floating Action Button: Comparer */}
      {compareCount > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40">
          <button className="bg-secondary-container text-on-secondary-container px-10 py-4 rounded-full font-headline font-bold flex items-center gap-3 shadow-2xl hover:scale-105 transition-all backdrop-blur-md border border-white/20">
            <IoGitCompare className="text-xl" />
            Comparer ({compareCount})
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-slate-950 w-full py-12 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 border-t border-slate-100 dark:border-slate-800 space-y-6 md:space-y-0 pt-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="font-manrope font-bold text-slate-900 dark:text-white text-lg">NESTHUB</span>
            <span className="text-slate-500 text-sm font-inter">© 2024 NESTHUB Tunisia. L'immobilier de prestige.</span>
          </div>
          <div className="flex gap-8">
            <Link href="#" className="text-slate-500 hover:text-purple-600 transition-colors text-sm font-inter">À propos</Link>
            <Link href="#" className="text-slate-500 hover:text-purple-600 transition-colors text-sm font-inter">Contact</Link>
            <Link href="#" className="text-slate-500 hover:text-purple-600 transition-colors text-sm font-inter">Mentions légales</Link>
            <Link href="#" className="text-blue-600 font-semibold text-sm font-inter">TND Currency</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}