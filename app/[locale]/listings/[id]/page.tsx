// app/fr/listings/[id]/page.tsx
'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { 
  IoHeartOutline, 
  IoHeart,
  IoStar,
  IoLocationOutline,
  IoCheckmarkCircle,
  IoShareSocialOutline,
  IoNotificationsOutline,
  IoPersonOutline,
  IoArrowBackOutline,
  IoBedOutline,
  IoBoatOutline,
  IoExpandOutline,
  IoWifi,
  IoCarOutline,
  IoWaterOutline,
  IoRestaurantOutline,
  IoHomeOutline,
  IoSnowOutline,
  IoFlameOutline,
  IoTvOutline,
  IoShirtOutline,
  IoLeafOutline,
  IoCloseOutline,
  IoCalendarOutline,
  IoPeopleOutline,
  IoTimeOutline,
  IoLogOutOutline,
  IoBanOutline,
  IoMailOutline,
  IoDiamondOutline
} from 'react-icons/io5'
import { FaSwimmingPool, FaParking, FaUtensils, FaFireplace } from 'react-icons/fa'
import { TbAirConditioning } from 'react-icons/tb'
import { MdOutlineSquareFoot } from 'react-icons/md'  // ✅ Remplacé
import { useListing } from '../hooks/useListing'
export default function ListingDetailPage() {
  const params = useParams()
  const id = params.id as string
  const {
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
  } = useListing(id)

  const [isFavorite, setIsFavorite] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-on-surface-variant">Chargement de l'annonce...</p>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-xl font-semibold mb-2">Annonce non trouvée</h3>
          <Link href="/fr/search" className="text-blue-600 hover:underline">
            Retour à la recherche
          </Link>
        </div>
      </div>
    )
  }

  const totalPrice = calculateTotalPrice()
  const nights = checkIn && checkOut ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)) : 0
  const cleaningFee = 85
  const serviceFee = Math.round(totalPrice * 0.05)

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface antialiased">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm transition-all duration-300 ease-in-out flex justify-between items-center px-8 h-20 w-full">
        <div className="flex items-center gap-8">
          <Link href="/fr" className="text-xl font-bold tracking-tighter text-blue-900 dark:text-white font-headline">
            NestHub
          </Link>
          <div className="hidden md:flex gap-6">
            <Link href="/fr/search" className="font-manrope tracking-tight text-slate-600 hover:text-blue-600 transition-colors">
              Explorer
            </Link>
            <Link href="#" className="font-manrope tracking-tight text-slate-600 hover:text-blue-600 transition-colors">
              Vendre
            </Link>
            <Link href="/fr/favorites" className="font-manrope tracking-tight text-slate-600 hover:text-blue-600 transition-colors">
              Favoris
            </Link>
            <Link href="#" className="font-manrope tracking-tight text-slate-600 hover:text-blue-600 transition-colors">
              Messages
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-slate-50 rounded-full transition-colors">
            <IoNotificationsOutline className="text-xl text-on-surface-variant" />
          </button>
          <div className="h-10 w-10 rounded-full bg-surface-container-high overflow-hidden border-2 border-white shadow-sm">
            <img alt="Profil" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWgtC4nvS1MTwfCM4JrdsgQfoHYn--1LZFwFiggqJAZL_J7iD21_fcx4YBoLbKgZvu2Sk9hE2gyRaH_Z8GKpuaco4Kou_9vEGctBEKNqzI5eDHFv2jJzF08dbdzDDYj9lyHeNmnzI3rMpIPOsTC-i3q2CT7T2VrDxaFCPep-FK1n1siRJZEcOuxA1aBnL8-gD5A8pQPMebIbSYJHta5cUTjLF1Jhg7BDId9b3Xd6cUhs3x96NU0JrLlQih4mE5uz2FFpIxZyvmxdkd" className="w-full h-full object-cover" />
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-16 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Photo Gallery */}
        <section className="mb-10">
          <div className="grid grid-cols-12 grid-rows-2 gap-3 h-[550px] rounded-2xl overflow-hidden">
            <div className="col-span-12 md:col-span-8 row-span-2 relative group cursor-pointer overflow-hidden" onClick={() => setShowAllPhotos(true)}>
              <img alt={listing.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={listing.images[0]} />
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            {listing.images.slice(1, 5).map((img, idx) => (
              <div key={idx} className="hidden md:block col-span-2 row-span-1 relative group cursor-pointer overflow-hidden" onClick={() => setSelectedImage(idx + 1)}>
                <img alt={`Vue ${idx + 2}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={img} />
                {idx === 3 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <button onClick={() => setShowAllPhotos(true)} className="bg-white text-on-surface px-6 py-3 rounded-full font-semibold shadow-xl hover:bg-surface-container-low transition-all">
                      Voir toutes les photos
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Modal Photos */}
        {showAllPhotos && (
          <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
            <button onClick={() => setShowAllPhotos(false)} className="absolute top-6 right-6 text-white p-2 hover:bg-white/20 rounded-full transition">
              <IoCloseOutline className="text-3xl" />
            </button>
            <div className="relative w-full max-w-5xl mx-auto px-4">
              <img src={listing.images[selectedImage]} alt="" className="w-full h-auto max-h-[80vh] object-contain" />
              <div className="flex justify-center gap-2 mt-4">
                {listing.images.map((img, idx) => (
                  <button key={idx} onClick={() => setSelectedImage(idx)} className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition ${selectedImage === idx ? 'border-white' : 'border-transparent opacity-50'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left Column */}
          <div className="lg:w-[65%] space-y-12">
            {/* Title and Stats */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-4xl font-extrabold font-headline tracking-tight text-blue-900 mb-2">{listing.title}</h1>
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <IoLocationOutline className="text-primary" />
                    <span className="font-medium">{listing.location}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-3 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors">
                    <IoShareSocialOutline className="text-xl" />
                  </button>
                  <button onClick={() => setIsFavorite(!isFavorite)} className="p-3 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors">
                    {isFavorite ? <IoHeart className="text-red-500 text-xl" /> : <IoHeartOutline className="text-xl" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="bg-surface-container-low px-4 py-2 rounded-xl flex items-center gap-2">
                  <IoBedOutline className="text-primary" />
                  <span className="font-medium">{listing.bedrooms} chambres</span>
                </div>
                <div className="bg-surface-container-low px-4 py-2 rounded-xl flex items-center gap-2">
                  <IoBoatOutline className="text-primary" />
                  <span className="font-medium">{listing.bathrooms} SDB</span>
                </div>
                <div className="bg-surface-container-low px-4 py-2 rounded-xl flex items-center gap-2">
                  <TbSquareFoot className="text-primary text-xl" />
                  <span className="font-medium">{listing.surfaceArea}m²</span>
                </div>
                <div className="bg-surface-container-low px-4 py-2 rounded-xl flex items-center gap-2">
                  <FaSwimmingPool className="text-primary" />
                  <span className="font-medium">Piscine</span>
                </div>
              </div>
            </div>

            {/* Host Card */}
            <div className="bg-surface-container-low p-6 rounded-2xl flex items-center justify-between group hover:bg-surface-container-high transition-colors duration-300">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img alt={listing.owner.name} className="h-16 w-16 rounded-full object-cover" src={listing.owner.avatar} />
                  <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full border-2 border-white">
                    <IoCheckmarkCircle className="text-sm" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-on-surface-variant font-medium">Hébergé par</p>
                  <h3 className="text-lg font-bold font-headline">{listing.owner.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="bg-blue-100 text-blue-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded">Propriétaire Vérifié</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-1 text-primary">
                  <IoStar className="text-yellow-500" />
                  <span className="font-bold text-xl">{listing.rating}</span>
                </div>
                <p className="text-xs text-on-surface-variant">Score de confiance</p>
              </div>
            </div>

            {/* Description */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-headline text-blue-900">À propos de ce logement</h2>
              <div className="text-on-surface-variant leading-relaxed space-y-4">
                <p>{listing.description}</p>
              </div>
            </section>

            {/* Amenities */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold font-headline text-blue-900">Ce que propose ce logement</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                {listing.amenities.slice(0, 8).map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <IoCheckmarkCircle className="text-green-500" />
                    <span className="text-on-surface-variant">{amenity}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Rules */}
            <section className="border-t border-outline-variant/20 pt-12">
              <h2 className="text-2xl font-bold font-headline text-blue-900 mb-6">Règlement intérieur</h2>
              <ul className="space-y-4">
                {listing.houseRules.map((rule, idx) => (
                  <li key={idx} className="flex items-center gap-4 text-on-surface-variant">
                    <IoTimeOutline />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Right Column - Booking Widget */}
          <aside className="lg:w-[35%]">
            <div className="sticky top-28 bg-surface-container-lowest p-8 rounded-2xl shadow-xl shadow-blue-900/5 border border-outline-variant/10">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <span className="text-3xl font-extrabold text-blue-900">{listing.pricePerNight} TND</span>
                  <span className="text-on-surface-variant font-medium"> / nuit</span>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold">
                  <IoStar className="text-yellow-500" />
                  <span>{listing.rating}</span>
                  <span className="text-on-surface-variant font-normal">({listing.reviewCount})</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 border border-outline-variant/30 rounded-xl overflow-hidden">
                  <div className="p-3 border-r border-outline-variant/30">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-blue-900">Arrivée</label>
                    <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="w-full text-sm focus:outline-none bg-transparent" />
                  </div>
                  <div className="p-3">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-blue-900">Départ</label>
                    <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="w-full text-sm focus:outline-none bg-transparent" />
                  </div>
                  <div className="col-span-2 p-3 border-t border-outline-variant/30 flex justify-between items-center">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-blue-900">Voyageurs</label>
                      <select value={guests} onChange={(e) => setGuests(parseInt(e.target.value))} className="text-sm focus:outline-none bg-transparent">
                        {Array.from({ length: listing.maxGuests }, (_, i) => i + 1).map(n => (
                          <option key={n} value={n}>{n} voyageur{n > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                    <IoPeopleOutline />
                  </div>
                </div>

                <button className="w-full py-4 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all">
                  Demander à réserver
                </button>
                
                <p className="text-center text-xs text-on-surface-variant">Aucun montant ne vous sera débité pour le moment</p>

                {checkIn && checkOut && nights > 0 && (
                  <div className="pt-6 space-y-4 text-sm text-on-surface-variant">
                    <div className="flex justify-between">
                      <span>{listing.pricePerNight} TND x {nights} nuits</span>
                      <span>{totalPrice} TND</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frais de ménage</span>
                      <span>{cleaningFee} TND</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frais de service</span>
                      <span>{serviceFee} TND</span>
                    </div>
                    <div className="pt-4 border-t border-outline-variant/20 flex justify-between font-bold text-lg text-blue-900">
                      <span>Total</span>
                      <span>{totalPrice + cleaningFee + serviceFee} TND</span>
                    </div>
                  </div>
                )}

                <div className="pt-6">
                  <button className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-primary/20 text-primary font-bold hover:bg-primary/5 transition-all">
                    <IoMailOutline />
                    Contacter le propriétaire
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-slate-950 w-full py-12 border-t border-outline-variant/10">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="font-headline font-extrabold text-blue-900 dark:text-blue-100 text-lg">NestHub</span>
            <p className="font-inter text-sm antialiased text-slate-500 text-center md:text-left">© 2024 NestHub. Propriétés d'exception en Tunisie.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <Link href="#" className="font-inter text-sm antialiased text-slate-500 hover:text-blue-600 transition-all">Mentions Légales</Link>
            <Link href="#" className="font-inter text-sm antialiased text-slate-500 hover:text-blue-600 transition-all">Devises (TND)</Link>
            <Link href="#" className="font-inter text-sm antialiased text-slate-500 hover:text-blue-600 transition-all">Contact</Link>
            <Link href="#" className="font-inter text-sm antialiased text-slate-500 hover:text-blue-600 transition-all">Aide</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}