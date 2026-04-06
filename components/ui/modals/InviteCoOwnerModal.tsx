// components/ui/modals/InviteCoHostModal.tsx
'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { useTranslations } from 'next-intl';
import { UserPlus, Mail, Shield, Calendar, Users, Send, Home, Building2, CheckCircle, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Listing {
  id: string;
  title: string;
  type: string;
  governorate: string;
}

interface InviteCoHostModalProps {
  isOpen: boolean;
  onClose: () => void;
  listings: Listing[];
  onSuccess?: () => void;
}

export default function InviteCoHostModal({
  isOpen,
  onClose,
  listings,
  onSuccess,
}: InviteCoHostModalProps) {
  const t = useTranslations('admin.team.inviteModal');
  
  const [selectedListingId, setSelectedListingId] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('CO_HOST');
  const [permissions, setPermissions] = useState({
    canEdit: false,
    canManageBookings: true,
    canViewRevenue: false,
    canManageTeam: false,
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedListingId('');
      setEmail('');
      setName('');
      setRole('CO_HOST');
      setPermissions({
        canEdit: false,
        canManageBookings: true,
        canViewRevenue: false,
        canManageTeam: false,
      });
      setMessage('');
      setLoading(false);
    }
  }, [isOpen]);

  const roles = [
    { value: 'CO_HOST', label: 'Co-hôte', description: 'Gestion des réservations et du calendrier', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { value: 'MANAGER', label: 'Gestionnaire', description: 'Gestion complète sauf finances', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { value: 'VIEWER', label: 'Observateur', description: 'Consultation seule', icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  ];

  const selectedListing = listings.find(l => l.id === selectedListingId);
  const selectedRole = roles.find(r => r.value === role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListingId) {
      toast.error('Veuillez sélectionner une annonce');
      return;
    }
    if (!email) {
      toast.error('Email requis');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/owner/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: selectedListingId,
          email,
          name,
          role,
          permissions,
          message,
        }),
      });

      if (res.ok) {
        toast.success(`Invitation envoyée à ${email}`);
        onSuccess?.();
        onClose();
      } else {
        const error = await res.json();
        toast.error(error.error || "Erreur lors de l'envoi");
      }
    } catch (error) {
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={true}
      className="max-w-md"
      title={
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600">
            <UserPlus size={14} />
          </div>
          <div>
            <h2 className="text-slate-900 dark:text-white text-sm font-semibold">
              Inviter un co-hôte
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Sélectionnez l'annonce et définissez les permissions
            </p>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-3 space-y-3">
        {/* Sélection de l'annonce */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Annonce concernée <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Home size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedListingId}
              onChange={e => setSelectedListingId(e.target.value)}
              required
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition-all appearance-none"
            >
              <option value="">Sélectionner une annonce</option>
              {listings.map(listing => (
                <option key={listing.id} value={listing.id}>
                  {listing.title} - {listing.governorate}
                </option>
              ))}
            </select>
          </div>
          {!selectedListingId && (
            <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1">
              <AlertCircle size={10} />
              Veuillez sélectionner une annonce
            </p>
          )}
          {selectedListing && (
            <div className="mt-1.5 p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-md flex items-center gap-1.5 border border-purple-200 dark:border-purple-800">
              <CheckCircle size={11} className="text-purple-600" />
              <span className="text-[11px] text-purple-700 dark:text-purple-400 font-medium truncate">
                {selectedListing.title}
              </span>
            </div>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Email de l'invité <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nom@exemple.com"
              required
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none"
            />
          </div>
        </div>

        {/* Nom (optionnel) */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Nom (optionnel)
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Jean Dupont"
            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none"
          />
        </div>

        {/* Section de sélection du rôle */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Niveau de permission
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {roles.map(r => {
              const Icon = r.icon;
              const isSelected = role === r.value;
              return (
                <div
                  key={r.value}
                  className={`flex items-center p-2 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? `${r.border} ${r.bg}`
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-purple-300'
                  }`}
                  onClick={() => setRole(r.value)}
                >
                  <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm mr-2.5">
                    <Icon size={13} className={isSelected ? r.color : 'text-slate-400'} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-semibold ${isSelected ? r.color : 'text-slate-700 dark:text-slate-300'}`}>
                      {r.label}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{r.description}</p>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 ${isSelected ? 'border-purple-500 bg-purple-500' : 'border-slate-300 dark:border-slate-600'}`}>
                      {isSelected && <CheckCircle size={8} className="text-white m-auto mt-[1px]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Permissions granulaires - checkbox avant le texte, 2 colonnes */}
        {(role === 'MANAGER' || role === 'CO_HOST') && (
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Permissions spécifiques</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.canEdit}
                  onChange={e => setPermissions(p => ({ ...p, canEdit: e.target.checked }))}
                  className="w-3.5 h-3.5 text-purple-600 focus:ring-purple-500 rounded"
                />
                <span className="text-[11px]">Modifier l'annonce</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.canManageBookings}
                  onChange={e => setPermissions(p => ({ ...p, canManageBookings: e.target.checked }))}
                  className="w-3.5 h-3.5 text-purple-600 focus:ring-purple-500 rounded"
                />
                <span className="text-[11px]">Gérer les réservations</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.canViewRevenue}
                  onChange={e => setPermissions(p => ({ ...p, canViewRevenue: e.target.checked }))}
                  className="w-3.5 h-3.5 text-purple-600 focus:ring-purple-500 rounded"
                />
                <span className="text-[11px]">Voir les revenus</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.canManageTeam}
                  onChange={e => setPermissions(p => ({ ...p, canManageTeam: e.target.checked }))}
                  className="w-3.5 h-3.5 text-purple-600 focus:ring-purple-500 rounded"
                />
                <span className="text-[11px]">Gérer l'équipe</span>
              </label>
            </div>
          </div>
        )}

        {/* Message personnalisé */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Message personnalisé (optionnel)
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Bonjour ! J'aimerais que tu m'aides à gérer mon annonce..."
            rows={2}
            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none resize-none"
          />
        </div>

        {/* Information sur l'invitation */}
        <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
          <p className="text-[10px] text-purple-700 dark:text-purple-400 flex items-start gap-1">
            <Mail size={10} className="shrink-0 mt-0.5" />
            L'invité recevra un email avec les instructions pour rejoindre NESTHUB.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || !selectedListingId || !email}
            className="px-2.5 py-1 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-medium transition-all disabled:opacity-50 flex items-center gap-1"
          >
            {loading ? (
              <>
                <span className="inline-block w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Envoi...</span>
              </>
            ) : (
              <>
                <Send size={11} />
                <span>Envoyer l'invitation</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}