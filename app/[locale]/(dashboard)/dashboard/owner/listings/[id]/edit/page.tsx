// app/[locale]/(dashboard)/owner/listings/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { toast } from "sonner";

// Icônes React
import {
  Home,
  Building2,
  Hotel,
  Layers,
  Bed,
  Bath,
  Users,
  Ruler,
  ArrowUp,
  Eye,
  Edit,
  Trash2,
  Plus,
  ChevronLeft,
  Star,
  MapPin,
  DollarSign,
  Save,
  Cloud,
  Rocket,
  Camera,
  Sun,
  Sparkles,
  Shield,
  Calendar,
  Loader2,
} from "lucide-react";

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
  floorNumber: number | null;
  hasElevator: boolean;
  equipment: Record<string, boolean>;
  services: Record<string, boolean>;
  houseRules: Record<string, boolean>;
  customRules: string;
  photos: Array<{ id: string; url: string; thumbnailUrl: string; isMain: boolean; position: number }>;
  rentalType: string;
  pricePerNight: number | null;
  pricePerMonth: number | null;
  securityDeposit: number | null;
  cleaningFee: number | null;
  status: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

// Fonction pour obtenir l'URL d'affichage
const getDisplayUrl = (url: string) => {
  if (!url) return null;
  if (url.startsWith('blob:')) return url;
  return `/api/listings/image?url=${encodeURIComponent(url)}`;
};

const propertyTypes = [
  { value: "APARTMENT", label: "Appartement", icon: Building2 },
  { value: "VILLA", label: "Villa", icon: Home },
  { value: "HOUSE", label: "Maison", icon: Home },
  { value: "STUDIO", label: "Studio", icon: Hotel },
  { value: "DUPLEX", label: "Duplex", icon: Layers },
];

const governorates = [
  "Tunis", "Ariana", "Ben Arous", "Manouba", "Nabeul", "Zaghouan",
  "Bizerte", "Béja", "Jendouba", "Le Kef", "Siliana", "Kairouan",
  "Kasserine", "Sidi Bouzid", "Sousse", "Monastir", "Mahdia",
  "Sfax", "Gafsa", "Tozeur", "Kébili", "Gabès", "Médenine", "Tataouine",
];

export default function EditListingPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = React.use(params);
  const router = useRouter();
  const { user } = useUser();
  const t = useTranslations("EditListing");

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [activeSection, setActiveSection] = useState("details");

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const res = await fetch(`/api/listings/${id}`);
      if (res.ok) {
        const data = await res.json();
        setListing(data);
      } else {
        toast.error("Annonce non trouvée");
        router.push(`/${locale}/dashboard/owner/listings`);
      }
    } catch (error) {
      console.error("Error fetching listing:", error);
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  // Mise à jour des données (sans les photos)
  const updateListing = async (updatedData: Partial<Listing>) => {
    if (!listing) return;
    setSaving(true);
    try {
      // Ne pas envoyer les photos dans la mise à jour
      const { photos, stats, ...dataToSend } = { ...listing, ...updatedData };
      
      const res = await fetch(`/api/listings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      
      if (res.ok) {
        const data = await res.json();
        setListing(data);
        setLastSaved(new Date());
        toast.success("Modifications enregistrées");
      } else {
        const error = await res.json();
        toast.error(error.error || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Error updating listing:", error);
      toast.error("Erreur serveur");
    } finally {
      setSaving(false);
    }
  };

  // Upload d'une photo
  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const formData = new FormData();
    formData.append('photo', file);
    
    try {
      const res = await fetch(`/api/listings/${id}/upload-photo`, {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        const newPhoto = await res.json();
        setListing(prev => prev ? {
          ...prev,
          photos: [...prev.photos, newPhoto]
        } : null);
        toast.success("Photo ajoutée");
      } else {
        toast.error("Erreur lors de l'ajout");
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Erreur serveur");
    }
  };

  // Suppression d'une photo
  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Supprimer cette photo ?")) return;
    
    try {
      const res = await fetch(`/api/listings/${id}/photos?photoId=${photoId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setListing(prev => prev ? {
          ...prev,
          photos: prev.photos.filter(p => p.id !== photoId)
        } : null);
        toast.success("Photo supprimée");
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast.error("Erreur serveur");
    }
  };

  // Définir la photo principale
  const handleSetMainPhoto = async (photoId: string) => {
    if (!listing) return;
    
    try {
      // Mettre à jour localement
      setListing({
        ...listing,
        photos: listing.photos.map(p => ({
          ...p,
          isMain: p.id === photoId
        }))
      });
      
      // Appeler l'API pour réorganiser
      const newOrder = listing.photos.map(p => p.id);
      const index = newOrder.indexOf(photoId);
      if (index !== -1) {
        newOrder.splice(index, 1);
        newOrder.unshift(photoId);
      }
      
      await fetch(`/api/listings/${id}/photos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoIds: newOrder }),
      });
      
      toast.success("Photo principale définie");
    } catch (error) {
      console.error("Error setting main photo:", error);
      toast.error("Erreur");
      // Recharger les données
      fetchListing();
    }
  };

  const handleInputChange = (field: keyof Listing, value: any) => {
    if (listing) {
      setListing({ ...listing, [field]: value });
    }
  };

  const sections = [
    { id: "details", label: "Détails", icon: Edit },
    { id: "photos", label: "Photos", icon: Camera },
    { id: "pricing", label: "Tarification", icon: DollarSign },
    { id: "publish", label: "Publication", icon: Rocket },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f8f7] dark:bg-[#10221b]">
        <Loader2 size={48} className="animate-spin text-[#0df293]" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f8f7] dark:bg-[#10221b]">
        <div className="text-center">
          <Home size={64} className="mx-auto text-slate-400 mb-4" />
          <h2 className="text-xl font-bold mb-2">Annonce non trouvée</h2>
          <Link
            href={`/${locale}/dashboard/owner/listings`}
            className="text-[#0df293] hover:underline"
          >
            Retour aux annonces
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f8f7] dark:bg-[#10221b] pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  Modifier l'annonce
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Cloud size={14} />
                  Sauvegarde auto active
                </p>
              </div>

              <nav className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                          isActive
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold"
                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <Icon size={18} className={isActive ? "text-blue-600" : ""} />
                        <span className="text-sm">{section.label}</span>
                      </button>
                    );
                  })}
                </div>
              </nav>

              <button
                onClick={() => updateListing({})}
                disabled={saving}
                className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin mx-auto" />
                ) : (
                  "Enregistrer le brouillon"
                )}
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-[#0df293] font-semibold mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0df293]"></span>
                  {activeSection === "details" && "Étape 1 sur 4"}
                  {activeSection === "photos" && "Étape 2 sur 4"}
                  {activeSection === "pricing" && "Étape 3 sur 4"}
                  {activeSection === "publish" && "Étape 4 sur 4"}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  {activeSection === "details" && "Détails de la propriété"}
                  {activeSection === "photos" && "Galerie photos"}
                  {activeSection === "pricing" && "Tarification"}
                  {activeSection === "publish" && "Publication"}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                  {activeSection === "details" && "Mettez à jour les informations de base de votre bien."}
                  {activeSection === "photos" && "Ajoutez ou modifiez les photos de votre bien."}
                  {activeSection === "pricing" && "Définissez les tarifs et les frais supplémentaires."}
                  {activeSection === "publish" && "Gérez le statut de publication de votre annonce."}
                </p>
              </div>

              {/* Details Section */}
              {activeSection === "details" && (
                <div className="space-y-8">
                  {/* Property Type */}
                  <div>
                    <label className="text-sm font-bold text-slate-500 dark:text-slate-400 block mb-4">
                      Type de propriété
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {propertyTypes.map((type) => {
                        const Icon = type.icon;
                        const isSelected = listing.type === type.value;
                        return (
                          <button
                            key={type.value}
                            onClick={() => handleInputChange("type", type.value)}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                              isSelected
                                ? "border-[#0df293] bg-[#0df293]/5"
                                : "border-transparent bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700"
                            }`}
                          >
                            <Icon size={24} className={isSelected ? "text-[#0df293]" : "text-slate-400"} />
                            <span className={`text-sm font-medium ${isSelected ? "text-[#0df293]" : "text-slate-600 dark:text-slate-400"}`}>
                              {type.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-bold text-slate-500 dark:text-slate-400 block mb-2">
                        Titre de l'annonce
                      </label>
                      <input
                        type="text"
                        value={listing.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-4 focus:ring-[#0df293]/20 transition-all text-slate-900 dark:text-white"
                        placeholder="Ex: Magnifique villa avec vue mer"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-500 dark:text-slate-400 block mb-2">
                        Description
                      </label>
                      <textarea
                        value={listing.description || ""}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        rows={6}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-4 focus:ring-[#0df293]/20 transition-all text-slate-900 dark:text-white resize-none"
                        placeholder="Décrivez les atouts de votre logement..."
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="text-sm font-bold text-slate-500 dark:text-slate-400 block mb-4">
                      Emplacement
                    </label>
                    <div className="relative rounded-2xl overflow-hidden h-64 shadow-lg">
                      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                        <div className="text-center">
                          <MapPin size={48} className="text-blue-500 mx-auto mb-2" />
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {listing.governorate}{listing.delegation ? `, ${listing.delegation}` : ""}
                          </p>
                          <p className="text-xs text-slate-500">{listing.street}</p>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-6">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-xl flex items-center gap-4 w-full">
                          <MapPin size={20} className="text-blue-600" />
                          <div className="flex-1">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                              Adresse actuelle
                            </p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {listing.street || listing.delegation || listing.governorate || "Adresse non définie"}
                            </p>
                          </div>
                          <button className="text-blue-600 text-sm font-bold hover:underline">
                            Modifier
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Characteristics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-bold text-slate-500 block mb-2">Chambres</label>
                      <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <Bed size={18} className="text-slate-400" />
                        <input
                          type="number"
                          value={listing.rooms}
                          onChange={(e) => handleInputChange("rooms", parseInt(e.target.value))}
                          className="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white"
                          min={1}
                          max={20}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-500 block mb-2">Salles de bain</label>
                      <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <Bath size={18} className="text-slate-400" />
                        <input
                          type="number"
                          value={listing.bathrooms}
                          onChange={(e) => handleInputChange("bathrooms", parseInt(e.target.value))}
                          className="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white"
                          min={1}
                          max={10}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-500 block mb-2">Voyageurs max</label>
                      <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <Users size={18} className="text-slate-400" />
                        <input
                          type="number"
                          value={listing.maxGuests}
                          onChange={(e) => handleInputChange("maxGuests", parseInt(e.target.value))}
                          className="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white"
                          min={1}
                          max={30}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-500 block mb-2">Surface (m²)</label>
                      <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <Ruler size={18} className="text-slate-400" />
                        <input
                          type="number"
                          value={listing.surfaceArea || ""}
                          onChange={(e) => handleInputChange("surfaceArea", e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white"
                          placeholder="120"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-500 block mb-2">Étage</label>
                      <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <ArrowUp size={18} className="text-slate-400" />
                        <input
                          type="number"
                          value={listing.floorNumber || ""}
                          onChange={(e) => handleInputChange("floorNumber", e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white"
                          placeholder="0 (RDC)"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div className="flex items-center gap-2">
                        <ArrowUp size={18} className="text-slate-400" />
                        <span className="text-sm font-medium">Ascenseur</span>
                      </div>
                      <button
                        onClick={() => handleInputChange("hasElevator", !listing.hasElevator)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          listing.hasElevator ? "bg-[#0df293]" : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                            listing.hasElevator ? "translate-x-6" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Photos Section */}
              {activeSection === "photos" && (
                <div className="space-y-6">
                  {/* Upload button */}
                  <div className="flex justify-between items-center">
                    <input
                      type="file"
                      accept="image/*"
                      id="photo-upload"
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(e.target.files)}
                    />
                    <button
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      <Plus size={18} />
                      Ajouter une photo
                    </button>
                    <p className="text-xs text-slate-500">
                      {listing.photos.length}/20 photos
                    </p>
                  </div>

                  {/* Photo grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {listing.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className={`relative group rounded-xl overflow-hidden aspect-square bg-slate-100 dark:bg-slate-800 ${
                          photo.isMain ? "ring-2 ring-[#0df293] ring-offset-2 dark:ring-offset-slate-900" : ""
                        }`}
                      >
                        <img
                          src={getDisplayUrl(photo.url) || ""}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        {photo.isMain && (
                          <div className="absolute top-2 left-2">
                            <span className="bg-[#0df293] text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Principale
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                        <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                          {!photo.isMain && (
                            <button
                              onClick={() => handleSetMainPhoto(photo.id)}
                              className="w-7 h-7 rounded-full bg-white/90 text-amber-500 flex items-center justify-center shadow-md hover:bg-white"
                              title="Définir comme principale"
                            >
                              <Star size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="w-7 h-7 rounded-full bg-white/90 text-rose-500 flex items-center justify-center shadow-md hover:bg-white"
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {listing.photos.length < 20 && (
                      <button
                        onClick={() => document.getElementById('photo-upload')?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-[#0df293] hover:text-[#0df293] transition-all"
                      >
                        <Plus size={24} />
                        <span className="text-[10px] font-bold uppercase">Ajouter</span>
                      </button>
                    )}
                  </div>

                  {/* Photo tips */}
                  <div className="p-6 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl text-white">
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-2">
                      Conseils photo
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <Sun size={16} className="shrink-0 mt-0.5" />
                        <p className="text-sm">Privilégiez la lumière naturelle</p>
                      </li>
                      <li className="flex items-start gap-2">
                        <Sparkles size={16} className="shrink-0 mt-0.5" />
                        <p className="text-sm">Rangez l'intérieur pour un rendu épuré</p>
                      </li>
                      <li className="flex items-start gap-2">
                        <Camera size={16} className="shrink-0 mt-0.5" />
                        <p className="text-sm">Utilisez le format paysage</p>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Pricing Section */}
              {activeSection === "pricing" && (
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-bold text-slate-500 block mb-2">Type de location</label>
                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-full w-fit">
                      {["SHORT_TERM", "LONG_TERM", "BOTH"].map((type) => (
                        <button
                          key={type}
                          onClick={() => handleInputChange("rentalType", type)}
                          className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                            listing.rentalType === type
                              ? "bg-white dark:bg-slate-700 text-[#0df293] shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {type === "SHORT_TERM" && "Court terme"}
                          {type === "LONG_TERM" && "Long terme"}
                          {type === "BOTH" && "Les deux"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Sun size={18} className="text-blue-500" />
                        <label className="text-xs font-bold uppercase text-slate-400">Prix par nuit</label>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <input
                          type="number"
                          value={listing.pricePerNight || ""}
                          onChange={(e) => handleInputChange("pricePerNight", e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full text-2xl font-bold bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white"
                          placeholder="0"
                        />
                        <span className="text-sm font-bold text-slate-400">TND / nuit</span>
                      </div>
                    </div>
                    <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar size={18} className="text-purple-500" />
                        <label className="text-xs font-bold uppercase text-slate-400">Prix par mois</label>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <input
                          type="number"
                          value={listing.pricePerMonth || ""}
                          onChange={(e) => handleInputChange("pricePerMonth", e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full text-2xl font-bold bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white"
                          placeholder="0"
                        />
                        <span className="text-sm font-bold text-slate-400">TND / mois</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Shield size={18} className="text-emerald-600" />
                        <div>
                          <p className="font-bold text-sm">Caution</p>
                          <p className="text-xs text-slate-400">Dépôt de garantie remboursable</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {listing.securityDeposit !== null && (
                          <input
                            type="number"
                            value={listing.securityDeposit}
                            onChange={(e) => handleInputChange("securityDeposit", parseFloat(e.target.value))}
                            className="w-20 bg-white dark:bg-slate-700 rounded-lg py-1.5 px-2 text-sm text-right"
                          />
                        )}
                        <button
                          onClick={() => handleInputChange("securityDeposit", listing.securityDeposit === null ? 500 : null)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            listing.securityDeposit !== null ? "bg-[#0df293]" : "bg-slate-300"
                          }`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            listing.securityDeposit !== null ? "translate-x-6" : "translate-x-0"
                          }`} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Sparkles size={18} className="text-blue-600" />
                        <div>
                          <p className="font-bold text-sm">Frais de ménage</p>
                          <p className="text-xs text-slate-400">Facturés une fois par séjour</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {listing.cleaningFee !== null && (
                          <input
                            type="number"
                            value={listing.cleaningFee}
                            onChange={(e) => handleInputChange("cleaningFee", parseFloat(e.target.value))}
                            className="w-20 bg-white dark:bg-slate-700 rounded-lg py-1.5 px-2 text-sm text-right"
                          />
                        )}
                        <button
                          onClick={() => handleInputChange("cleaningFee", listing.cleaningFee === null ? 50 : null)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            listing.cleaningFee !== null ? "bg-[#0df293]" : "bg-slate-300"
                          }`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            listing.cleaningFee !== null ? "translate-x-6" : "translate-x-0"
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Publish Section */}
              {activeSection === "publish" && (
                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-3 h-3 rounded-full ${listing.status === "ACTIVE" ? "bg-green-500" : "bg-amber-500"}`} />
                      <p className="font-bold">
                        Statut actuel : {listing.status === "ACTIVE" ? "Publié" : listing.status === "DRAFT" ? "Brouillon" : "Inactif"}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      {listing.status !== "ACTIVE" && (
                        <button
                          onClick={() => updateListing({ status: "ACTIVE" })}
                          className="px-6 py-3 bg-[#0df293] text-slate-900 rounded-xl font-bold hover:bg-[#0df293]/80 transition-colors"
                        >
                          Publier l'annonce
                        </button>
                      )}
                      {listing.status === "ACTIVE" && (
                        <button
                          onClick={() => updateListing({ status: "INACTIVE" })}
                          className="px-6 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors"
                        >
                          Désactiver l'annonce
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-6 bg-[#0df293]/10 rounded-xl border border-[#0df293]/30">
                    <div className="flex items-center gap-3 mb-4">
                      <Rocket size={20} className="text-[#0df293]" />
                      <p className="font-bold text-[#0df293]">Prêt à être publié</p>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      Votre annonce sera visible par tous les locataires une fois publiée.
                    </p>
                    <Link
                      href={`/${locale}/dashboard/owner/listings/${listing.id}`}
                      className="inline-flex items-center gap-2 text-[#0df293] font-semibold hover:underline"
                    >
                      <Eye size={16} />
                      Prévisualiser l'annonce
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <button
                onClick={() => router.push(`/${locale}/dashboard/owner/listings`)}
                className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold hover:text-slate-700 transition-colors"
              >
                <ChevronLeft size={18} />
                Retour
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => updateListing({})}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Sauvegarder
                </button>
                <Link
                  href={`/${locale}/dashboard/owner/listings/${listing.id}`}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0df293] to-emerald-500 text-slate-900 rounded-xl font-bold hover:opacity-90 transition-all"
                >
                  <Eye size={16} />
                  Prévisualiser
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Auto-save indicator */}
      {lastSaved && (
        <div className="fixed bottom-8 right-8 hidden lg:flex items-center gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2 rounded-full shadow-2xl border border-white/20">
          <div className="flex items-center gap-2 pl-4 pr-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
              Dernière modif il y a {Math.floor((Date.now() - lastSaved.getTime()) / 1000)}s
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
          <button
            onClick={() => updateListing({})}
            className="bg-[#0df293] text-slate-900 p-3 rounded-full flex items-center justify-center hover:bg-[#0df293]/80 transition-colors"
          >
            <Save size={16} />
          </button>
        </div>
      )}
    </div>
  );
}