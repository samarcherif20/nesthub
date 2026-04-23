// components/ui/modals/ReviewModal.tsx
"use client";

import { useState } from "react";
import { IoCloseOutline, IoStar, IoStarOutline } from "react-icons/io5";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  booking: any;
}

export function ReviewModal({ isOpen, onClose, onSubmit, booking }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [criteria, setCriteria] = useState({
    cleanliness: 0,
    communication: 0,
    checkIn: 0,
    accuracy: 0,
    location: 0,
    value: 0,
  });
  const [publicComment, setPublicComment] = useState("");
  const [privateNote, setPrivateNote] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleRatingClick = (value: number) => {
    setRating(value);
  };

  const handleCriteriaChange = (criterion: string, value: number) => {
    setCriteria(prev => ({ ...prev, [criterion]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Veuillez donner une note globale");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        rating,
        criteria,
        publicComment,
        privateNote,
        photos,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(star)}
            className="text-3xl transition-all hover:scale-110 active:scale-95"
          >
            {star <= value ? (
              <IoStar className="text-[#005cab] fill-[#005cab]" />
            ) : (
              <IoStarOutline className="text-[#c0c7d6]" />
            )}
          </button>
        ))}
      </div>
    );
  };

  const CriteriaSlider = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs font-bold text-[#005cab]">{value.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="5"
          step="0.5"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-[#e5e8f1] rounded-full appearance-none cursor-pointer accent-[#005cab]"
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        {/* Left Side - Property Recap */}
        <div className="w-full md:w-5/12 bg-[#f1f3fd] p-8 md:p-10 overflow-y-auto">
          <div className="sticky top-10">
            <h2 className="text-2xl font-bold mb-8 leading-tight">
              Laisser un avis sur votre séjour
            </h2>
            
            {/* Property Mini Card */}
            <div className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
              <div className="h-48 w-full relative">
                {booking?.listing.photos[0] && (
                  <img
                    src={`/api/listings/image?url=${encodeURIComponent(booking.listing.photos[0].url)}`}
                    alt={booking.listing.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                )}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[#005cab]">
                  {booking?.listing.delegation}
                </div>
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold tracking-[0.05em] text-[#005cab] uppercase mb-1">
                  Séjour passé
                </p>
                <h3 className="text-lg font-bold mb-2">{booking?.listing.title}</h3>
                <div className="flex items-center gap-3 text-[#404753] mb-4">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  <span className="text-sm">
                    {booking && formatDate(booking.checkIn)} - {booking && formatDate(booking.checkOut)}
                  </span>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-[#e5e8f1]">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                    {booking?.owner.profilePictureUrl ? (
                      <img
                        src={booking.owner.profilePictureUrl}
                        alt={booking.owner.firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#d4e3ff] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#005cab]">person</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {booking?.owner.firstName} {booking?.owner.lastName}
                    </p>
                    <p className="text-xs text-[#404753]">Votre hôte</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Review Form */}
        <div className="w-full md:w-7/12 p-8 md:p-12 overflow-y-auto max-h-[90vh]">
          <div className="space-y-8">
            {/* Close Button */}
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <IoCloseOutline className="text-2xl" />
              </button>
            </div>

            {/* Overall Rating */}
            <div className="text-center md:text-left">
              <label className="text-xs font-bold uppercase tracking-wider text-[#404753] mb-4 block">
                Note globale
              </label>
              <div className="flex gap-2 justify-center md:justify-start">
                <StarRating value={rating} onChange={handleRatingClick} />
              </div>
            </div>

            {/* Detailed Criteria */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#404753] mb-6 block">
                Détail des critères
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                <CriteriaSlider
                  label="Propreté"
                  value={criteria.cleanliness}
                  onChange={(v) => handleCriteriaChange("cleanliness", v)}
                />
                <CriteriaSlider
                  label="Communication"
                  value={criteria.communication}
                  onChange={(v) => handleCriteriaChange("communication", v)}
                />
                <CriteriaSlider
                  label="Arrivée"
                  value={criteria.checkIn}
                  onChange={(v) => handleCriteriaChange("checkIn", v)}
                />
                <CriteriaSlider
                  label="Précision"
                  value={criteria.accuracy}
                  onChange={(v) => handleCriteriaChange("accuracy", v)}
                />
                <CriteriaSlider
                  label="Emplacement"
                  value={criteria.location}
                  onChange={(v) => handleCriteriaChange("location", v)}
                />
                <CriteriaSlider
                  label="Qualité-prix"
                  value={criteria.value}
                  onChange={(v) => handleCriteriaChange("value", v)}
                />
              </div>
            </div>

            {/* Public Comment */}
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-[#404753] block">
                Votre commentaire public
              </label>
              <textarea
                value={publicComment}
                onChange={(e) => setPublicComment(e.target.value)}
                className="w-full min-h-[160px] p-5 bg-[#e5e8f1] rounded-xl border-none focus:ring-4 focus:ring-[#005cab]/20 resize-none transition-all duration-300"
                placeholder="Partagez votre expérience avec les futurs voyageurs..."
              />
            </div>

            {/* Private Note */}
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-[#404753] block">
                Note privée pour {booking?.owner.firstName}
              </label>
              <textarea
                value={privateNote}
                onChange={(e) => setPrivateNote(e.target.value)}
                className="w-full min-h-[100px] p-5 bg-[#e5e8f1]/50 rounded-xl border-none focus:ring-4 focus:ring-[#005cab]/20 resize-none transition-all duration-300 italic"
                placeholder="Conseils ou remerciements personnalisés..."
              />
            </div>

            {/* Photo Upload */}
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-[#404753] block">
                Photos du séjour
              </label>
              <label className="border-2 border-dashed border-[#c0c7d6] rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-white hover:bg-[#005cab]/5 transition-colors cursor-pointer group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-[#0075d6]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[#005cab]">add_a_photo</span>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">Glissez-déposez vos photos</p>
                  <p className="text-xs text-[#404753]">
                    ou cliquez pour parcourir vos fichiers (max 10Mo)
                  </p>
                </div>
              </label>
              {photos.length > 0 && (
                <div className="flex gap-2 mt-2">
                  <p className="text-xs text-[#404753]">{photos.length} photo(s) sélectionnée(s)</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-8 border-t border-[#e5e8f1]">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-8 py-4 text-[#404753] font-semibold rounded-full hover:bg-[#e5e8f1] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-[#005cab] to-[#712ae2] text-white font-bold rounded-full shadow-lg hover:shadow-[#005cab]/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {submitting ? "Envoi en cours..." : "Publier l'avis"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}