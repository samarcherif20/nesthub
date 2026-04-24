// components/ui/modals/ReviewModal.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  IoCloseOutline, 
  IoStar, 
  IoStarOutline, 
  IoCalendarOutline, 
  IoPersonOutline,
  IoCloudUploadOutline,
  IoTrashOutline,
  IoCheckmarkCircle,
  IoSendOutline,
  IoSpeedometerOutline,
  IoChatbubbleOutline,
  IoBusinessOutline,
  IoLocationOutline,
  IoCashOutline,
  IoTimeOutline
} from "react-icons/io5";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  booking: any;
}

// Helper pour les images
const pipListing = (url: string) => `/api/listings/image?url=${encodeURIComponent(url)}`;
const pipAvatar = (url: string) => `/api/users/avatar?url=${encodeURIComponent(url)}`;

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
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setRating(0);
        setCriteria({
          cleanliness: 0,
          communication: 0,
          checkIn: 0,
          accuracy: 0,
          location: 0,
          value: 0,
        });
        setPublicComment("");
        setPrivateNote("");
        setPhotos([]);
        setPhotoPreviews([]);
        setShowSuccess(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      photoPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [photoPreviews]);

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
      const newFiles = Array.from(e.target.files);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPhotos(prev => [...prev, ...newFiles]);
      setPhotoPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
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
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
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
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="text-3xl transition-all hover:scale-110 active:scale-95 focus:outline-none"
          >
            {star <= (hoverRating || value) ? (
              <IoStar className="text-[#005cab] fill-[#005cab]" />
            ) : (
              <IoStarOutline className="text-[#c0c7d6]" />
            )}
          </button>
        ))}
      </div>
    );
  };

  const CriteriaSlider = ({ icon: Icon, label, value, onChange }: { icon: any; label: string; value: number; onChange: (v: number) => void }) => {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Icon className="text-[#005cab] text-sm" />
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </div>
          <span className="text-xs font-bold text-[#005cab]">{value === 0 ? "—" : value.toFixed(1)}</span>
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

  const averageCriteria = Object.values(criteria).reduce((a, b) => a + b, 0) / Object.values(criteria).length;
  // Utiliser UNIQUEMENT le username de l'hôte
  const hostName = booking?.owner?.username || "l'hôte";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
          
          {/* Left Side - Property Recap */}
          <div className="w-full md:w-5/12 bg-gradient-to-br from-[#f1f3fd] to-white p-8 md:p-10 overflow-y-auto">
            <div className="sticky top-10">
              <h2 className="text-2xl font-bold mb-8 leading-tight text-gray-900">
                Laisser un avis sur votre séjour
              </h2>
              
              {/* Property Mini Card */}
              <div className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                <div className="h-48 w-full relative bg-gray-100">
                  {booking?.listing?.photos?.[0] && (
                    <img
                      src={pipListing(booking.listing.photos[0].url)}
                      alt={booking.listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  )}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-xs font-bold text-[#005cab]">
                      {booking?.listing?.delegation || "Emplacement"}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold tracking-[0.05em] text-[#005cab] uppercase mb-1">
                    Séjour passé
                  </p>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {booking?.listing?.title}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <IoCalendarOutline className="text-sm text-[#005cab]" />
                    <span className="text-sm">
                      {booking && formatDate(booking.checkIn)} - {booking && formatDate(booking.checkOut)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {booking?.owner?.profilePictureUrl ? (
                        <img
                          src={pipAvatar(booking.owner.profilePictureUrl)}
                          alt={hostName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <IoPersonOutline className="text-white text-xl" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {hostName}
                      </p>
                      <p className="text-xs text-gray-500">Votre hôte</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Review Form */}
          <div className="w-full md:w-7/12 p-8 md:p-10 overflow-y-auto max-h-[90vh]">
            <div className="space-y-8">
              {/* Close Button */}
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                >
                  <IoCloseOutline className="text-2xl" />
                </button>
              </div>

              {/* Overall Rating */}
              <div className="text-center md:text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 block">
                  Note globale
                </label>
                <div className="flex gap-2 justify-center md:justify-start">
                  <StarRating value={rating} onChange={handleRatingClick} />
                </div>
              </div>

              {/* Detailed Criteria */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Détail des critères
                  </label>
                  {averageCriteria > 0 && (
                    <span className="text-xs font-semibold text-[#005cab]">
                      Moyenne : {averageCriteria.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <CriteriaSlider
                    icon={IoSpeedometerOutline}
                    label="Propreté"
                    value={criteria.cleanliness}
                    onChange={(v) => handleCriteriaChange("cleanliness", v)}
                  />
                  <CriteriaSlider
                    icon={IoChatbubbleOutline}
                    label="Communication"
                    value={criteria.communication}
                    onChange={(v) => handleCriteriaChange("communication", v)}
                  />
                  <CriteriaSlider
                    icon={IoTimeOutline}
                    label="Arrivée"
                    value={criteria.checkIn}
                    onChange={(v) => handleCriteriaChange("checkIn", v)}
                  />
                  <CriteriaSlider
                    icon={IoBusinessOutline}
                    label="Précision"
                    value={criteria.accuracy}
                    onChange={(v) => handleCriteriaChange("accuracy", v)}
                  />
                  <CriteriaSlider
                    icon={IoLocationOutline}
                    label="Emplacement"
                    value={criteria.location}
                    onChange={(v) => handleCriteriaChange("location", v)}
                  />
                  <CriteriaSlider
                    icon={IoCashOutline}
                    label="Qualité-prix"
                    value={criteria.value}
                    onChange={(v) => handleCriteriaChange("value", v)}
                  />
                </div>
              </div>

              {/* Public Comment */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                  Votre commentaire public
                </label>
                <textarea
                  value={publicComment}
                  onChange={(e) => setPublicComment(e.target.value)}
                  rows={4}
                  className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:border-[#005cab] focus:ring-2 focus:ring-[#005cab]/20 resize-none transition-all"
                  placeholder="Partagez votre expérience avec les futurs voyageurs..."
                />
              </div>

              {/* Private Note */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                  Note privée pour {hostName}
                </label>
                <textarea
                  value={privateNote}
                  onChange={(e) => setPrivateNote(e.target.value)}
                  rows={3}
                  className="w-full p-4 bg-gray-50/50 rounded-xl border border-gray-200 focus:border-[#005cab] focus:ring-2 focus:ring-[#005cab]/20 resize-none transition-all italic"
                  placeholder="Conseils ou remerciements personnalisés (visible uniquement par l'hôte)..."
                />
              </div>

              {/* Photo Upload */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                  Photos du séjour
                </label>
                
                {photoPreviews.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-3">
                    {photoPreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Photo ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <IoTrashOutline className="text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <label className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center gap-2 bg-gray-50 hover:bg-[#005cab]/5 hover:border-[#005cab] transition-all cursor-pointer group">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-[#005cab]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <IoCloudUploadOutline className="text-2xl text-[#005cab]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700">Ajouter des photos</p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG - Max 10MB
                    </p>
                  </div>
                </label>
                {photos.length > 0 && (
                  <p className="text-xs text-gray-500">
                    {photos.length} photo{photos.length > 1 ? "s" : ""} sélectionnée{photos.length > 1 ? "s" : ""}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-8 py-3 text-gray-600 font-semibold rounded-full hover:bg-gray-100 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || rating === 0}
                  className="w-full sm:w-auto px-10 py-3 bg-gradient-to-r from-[#005cab] to-[#712ae2] text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <IoSendOutline className="text-sm" />
                      Publier l'avis
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
            <IoCheckmarkCircle className="text-xl" />
            <span className="font-medium">Avis publié avec succès !</span>
          </div>
        </div>
      )}
    </>
  );
}