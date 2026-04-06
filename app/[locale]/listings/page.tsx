// app/[locale]/listings/[id]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Home, Building2, Bed, Bath, Users, MapPin, Star, Calendar,
  ChevronLeft, ChevronRight, Loader2, CheckCircle, Shield, Verified,
  ArrowLeft, X, Grid3x3, Wifi, Wind, Utensils, Car, Waves, Tv
} from "lucide-react";
import MapPickerWrapper from "@/components/ui/maps/MapPickerWrapper";

// Fonction pip pour les images
const pip = (url: string) => `/api/listings/image?url=${encodeURIComponent(url)}`;

interface Listing {
  id: string;
  title: string;
  type: string;
  description: string;
  governorate: string;
  delegation: string;
  street: string;
  latitude: number | null;
  longitude: number | null;
  rooms: number;
  bathrooms: number;
  maxGuests: number;
  surfaceArea: number | null;
  equipment: Record<string, boolean>;
  photos: Array<{ id: string; url: string; isMain: boolean; position: number }>;
  pricePerNight: number | null;
  pricePerMonth: number | null;
  status: string;
  viewCount: number;
  bookingCount: number;
  owner: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profilePictureUrl: string | null;
    isIdentityVerified: boolean;
  };
}

export default function PublicListingPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);
  const hasIncremented = useRef(false);

  // ✅ Incrémenter les vues - UNIQUEMENT ICI (page publique)
  useEffect(() => {
    const incrementView = async () => {
      if (hasIncremented.current) return;
      hasIncremented.current = true;
      
      try {
        const response = await fetch(`/api/listings/${id}/view`, { 
          method: 'POST' 
        });
        const data = await response.json();
        console.log('View increment:', data.message);
      } catch (error) {
        console.error('Erreur incrémentation vue:', error);
      }
    };
    
    incrementView();
  }, [id]);

  // Charger les données de l'annonce
  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/listings/${id}`);
        if (res.ok) {
          const data = await res.json();
          setListing(data);
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchListing();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 size={48} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Home size={64} className="mx-auto text-slate-400 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Annonce non trouvée
          </h2>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold">
            <ArrowLeft size={18} />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  const mainPhoto = listing.photos.find(p => p.isMain) || listing.photos[0];
  const pricePerUnit = listing.pricePerNight || listing.pricePerMonth;
  const priceUnit = listing.pricePerNight ? "nuit" : "mois";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Gallery */}
        <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-8">
          <img
            src={pip(mainPhoto?.url)}
            alt={listing.title}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => { setGalleryStartIndex(0); setShowGalleryModal(true); }}
          />
          <button
            onClick={() => setShowGalleryModal(true)}
            className="absolute bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Grid3x3 size={18} />
            Voir toutes les photos ({listing.photos.length})
          </button>
        </div>

        {/* Title & Price */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
              {listing.title}
            </h1>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <MapPin size={18} className="text-indigo-600" />
              <span>{listing.governorate}{listing.delegation ? `, ${listing.delegation}` : ""}</span>
              <div className="flex items-center gap-1 ml-4">
                <Star size={18} className="fill-yellow-400 text-yellow-400" />
                <span>Nouveau</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-indigo-600">{pricePerUnit} TND</span>
            <span className="text-slate-500"> / {priceUnit}</span>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-slate-200 dark:border-slate-800 mb-8">
          <div className="flex items-center gap-3">
            <Bed size={20} className="text-indigo-600" />
            <div>
              <p className="text-xs text-slate-500">Chambres</p>
              <p className="font-bold">{listing.rooms}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Bath size={20} className="text-indigo-600" />
            <div>
              <p className="text-xs text-slate-500">Salles de bain</p>
              <p className="font-bold">{listing.bathrooms}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Users size={20} className="text-indigo-600" />
            <div>
              <p className="text-xs text-slate-500">Voyageurs max</p>
              <p className="font-bold">{listing.maxGuests}</p>
            </div>
          </div>
          {listing.surfaceArea && (
            <div className="flex items-center gap-3">
              <Home size={20} className="text-indigo-600" />
              <div>
                <p className="text-xs text-slate-500">Surface</p>
                <p className="font-bold">{listing.surfaceArea} m²</p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">À propos de ce bien</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            {listing.description || "Aucune description disponible."}
          </p>
        </div>

        {/* Owner Info */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200">
              {listing.owner?.profilePictureUrl ? (
                <img src={pip(listing.owner.profilePictureUrl)} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-indigo-600">
                  {listing.owner?.firstName?.[0] || "U"}
                </div>
              )}
            </div>
            <div>
              <p className="font-bold text-lg">{listing.owner?.firstName} {listing.owner?.lastName}</p>
              {listing.owner?.isIdentityVerified && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                  <Verified size={14} /> Identité vérifiée
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Map */}
        {listing.latitude && listing.longitude && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Localisation</h2>
            <div className="h-[300px] rounded-2xl overflow-hidden">
              <MapPickerWrapper
                latitude={listing.latitude}
                longitude={listing.longitude}
                onLocationChange={() => {}}
                readOnly
              />
            </div>
          </div>
        )}
      </main>

      {/* Gallery Modal */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          <div className="flex justify-between items-center p-4">
            <button onClick={() => setShowGalleryModal(false)} className="p-2 rounded-full bg-white/10 text-white">
              <X size={24} />
            </button>
            <span className="text-white">{galleryStartIndex + 1} / {listing.photos.length}</span>
            <div className="w-10" />
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <img src={pip(listing.photos[galleryStartIndex]?.url)} alt="" className="max-w-full max-h-full object-contain" />
          </div>
          <div className="flex justify-center gap-4 p-4">
            <button
              onClick={() => setGalleryStartIndex(Math.max(0, galleryStartIndex - 1))}
              disabled={galleryStartIndex === 0}
              className="p-3 rounded-full bg-white/10 text-white disabled:opacity-50"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => setGalleryStartIndex(Math.min(listing.photos.length - 1, galleryStartIndex + 1))}
              disabled={galleryStartIndex === listing.photos.length - 1}
              className="p-3 rounded-full bg-white/10 text-white disabled:opacity-50"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}