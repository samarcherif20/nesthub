// components/owner/ListingSelector.tsx
'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Home, Building2, Hotel, Check } from 'lucide-react';
import Link from 'next/link';  // ← Correction : import séparé de Link

interface Listing {
  id: string;
  title: string;
  type: string;
  status: string;
  governorate: string;
  pricePerNight: number | null;
  pricePerMonth: number | null;
  photos: { url: string }[];
}

interface ListingSelectorProps {
  selectedListingId: string | null;
  onSelectListing: (listingId: string) => void;
}

const typeIcons: Record<string, any> = {
  APARTMENT: Building2,
  VILLA: Home,
  STUDIO: Hotel,
  DUPLEX: Home,
  HOUSE: Home,
};

export default function ListingSelector({ selectedListingId, onSelectListing }: ListingSelectorProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const res = await fetch('/api/listings');
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings);
        if (data.listings.length > 0 && !selectedListingId) {
          onSelectListing(data.listings[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedListing = listings.find(l => l.id === selectedListingId);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 animate-pulse">
        <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg" />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 text-center border border-slate-200 dark:border-slate-800">
        <Home size={32} className="mx-auto text-slate-400 mb-3" />
        <p className="text-slate-600 dark:text-slate-400 text-sm">Vous n'avez pas encore d'annonce</p>
        <Link href="/owner/listings/create" className="mt-3 inline-block text-primary text-sm font-bold">
          Créer une annonce
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            {selectedListing && (() => {
              const Icon = typeIcons[selectedListing.type] || Home;
              return <Icon size={18} className="text-primary" />;
            })()}
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-900 dark:text-white text-sm">
              {selectedListing?.title || 'Sélectionner une annonce'}
            </p>
            <p className="text-xs text-slate-400">
              {selectedListing?.governorate} • {selectedListing?.pricePerNight || selectedListing?.pricePerMonth} TND/nuit
            </p>
          </div>
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl z-20 max-h-80 overflow-y-auto">
          {listings.map((listing) => {
            const Icon = typeIcons[listing.type] || Home;
            const isSelected = selectedListingId === listing.id;
            return (
              <button
                key={listing.id}
                onClick={() => {
                  onSelectListing(listing.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Icon size={14} className="text-slate-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm text-slate-900 dark:text-white">{listing.title}</p>
                    <p className="text-xs text-slate-400">{listing.governorate}</p>
                  </div>
                </div>
                {isSelected && <Check size={16} className="text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}