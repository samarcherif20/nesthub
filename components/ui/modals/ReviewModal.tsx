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
  IoTimeOutline,
  IoHomeOutline
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
  const [imgError, setImgError] = useState(false);

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
        setImgError(false);
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
            className="text-2xl transition-all hover:scale-110 active:scale-95 focus:outline-none"
          >
            {star <= (hoverRating || value) ? (
              <IoStar className="text-amber-500 fill-amber-500 dark:text-amber-400 dark:fill-amber-400" />
            ) : (
              <IoStarOutline className="text-slate-300 dark:text-slate-600" />
            )}
          </button>
        ))}
      </div>
    );
  };

  const CriteriaSlider = ({ icon: Icon, label, value, onChange }: { icon: any; label: string; value: number; onChange: (v: number) => void }) => {
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Icon className="text-indigo-500 dark:text-indigo-400 text-xs" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
          </div>
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{value === 0 ? "—" : value.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="5"
          step="0.5"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500 dark:accent-indigo-400"
        />
      </div>
    );
  };

  const averageCriteria = Object.values(criteria).reduce((a, b) => a + b, 0) / Object.values(criteria).length;
  const hostName = booking?.owner?.username || booking?.owner?.firstName || "l'hôte";
  
  const listingImage = booking?.listing?.photos?.[0]?.url || booking?.listing?.image;
  const ownerAvatar = booking?.owner?.profilePictureUrl;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="max-w-4xl w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
          
          {/* Left Side - Property Recap - DARK MODE */}
          <div className="w-full md:w-5/12 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30 p-6 md:p-8 overflow-y-auto">
            <div className="sticky top-10">
              <h2 className="text-xl font-bold mb-6 leading-tight text-gray-900 dark:text-white">
                Laisser un avis
              </h2>
              
              {/* Property Mini Card */}
              <div className="group relative bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                <div className="h-40 w-full relative bg-gray-100 dark:bg-slate-700">
                  {listingImage && !imgError ? (
                    <img
                      src={pipListing(listingImage)}
                      alt={booking?.listing?.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center">
                      <IoHomeOutline className="text-4xl text-indigo-300 dark:text-indigo-600" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      {booking?.listing?.delegation || "Emplacement"}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase mb-1">
                    Séjour passé
                  </p>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5 line-clamp-2">
                    {booking?.listing?.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 mb-3">
                    <IoCalendarOutline className="text-xs text-indigo-500 dark:text-indigo-400" />
                    <span className="text-xs">
                      {booking && formatDate(booking.checkIn)} - {booking && formatDate(booking.checkOut)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-slate-700">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                      {ownerAvatar ? (
                        <img
                          src={pipAvatar(ownerAvatar)}
                          alt={hostName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <IoPersonOutline className="text-white text-sm" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">
                        {hostName}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-500">Votre hôte</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Review Form - DARK MODE */}
          <div className="w-full md:w-7/12 p-6 md:p-8 overflow-y-auto max-h-[90vh]">
            <div className="space-y-6">
              {/* Close Button */}
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
                >
                  <IoCloseOutline className="text-xl" />
                </button>
              </div>

              {/* Overall Rating */}
              <div className="text-center md:text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500 mb-3 block">
                  Note globale
                </label>
                <div className="flex gap-1.5 justify-center md:justify-start">
                  <StarRating value={rating} onChange={handleRatingClick} />
                </div>
              </div>

              {/* Detailed Criteria */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500">
                    Détail des critères
                  </label>
                  {averageCriteria > 0 && (
                    <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                      Moy. {averageCriteria.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
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
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500 block">
                  Commentaire public
                </label>
                <textarea
                  value={publicComment}
                  onChange={(e) => setPublicComment(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  placeholder="Partagez votre expérience avec les futurs voyageurs..."
                />
              </div>

              {/* Private Note */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500 block">
                  Note privée pour {hostName}
                </label>
                <textarea
                  value={privateNote}
                  onChange={(e) => setPrivateNote(e.target.value)}
                  rows={2}
                  className="w-full p-3 bg-gray-50/50 dark:bg-slate-800/30 rounded-xl border border-gray-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 italic"
                  placeholder="Conseils ou remerciements personnalisés (visible uniquement par l'hôte)..."
                />
              </div>

              {/* Photo Upload - Optionnel */}
              {photoPreviews.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Photo ${index + 1}`}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-slate-700"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <IoTrashOutline className="text-[10px]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <label className="flex items-center justify-center gap-2 p-2 rounded-lg border border-dashed border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-pointer group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <IoCloudUploadOutline className="text-indigo-500 dark:text-indigo-400 text-sm group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">Ajouter des photos</span>
              </label>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-4 border-t border-gray-100 dark:border-slate-700">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || rating === 0}
                  className="w-full sm:w-auto px-8 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white text-xs font-bold rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <IoSendOutline className="text-xs" />
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
          <div className="bg-emerald-500 text-white px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2">
            <IoCheckmarkCircle className="text-base" />
            <span className="text-xs font-medium">Avis publié avec succès !</span>
          </div>
        </div>
      )}
    </>
  );
}