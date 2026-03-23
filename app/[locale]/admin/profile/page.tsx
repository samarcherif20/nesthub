// app/[locale]/admin/profile/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useAdminProfile } from './hooks/useAdminProfile';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';
import { 
  IoPersonOutline, 
  IoShieldOutline, 
  IoKeyOutline, 
  IoTimeOutline,
  IoLockClosedOutline,
  IoLockOpenOutline,
  IoDesktopOutline,
  IoPhonePortraitOutline,
  IoLaptopOutline,
  IoGlobeOutline,
  IoMailOutline,
  IoCallOutline,
  IoCameraOutline,
  IoSaveOutline,
  IoCloseOutline,
  IoChevronForward,
  IoChevronDown,
} from 'react-icons/io5';
import { MdOutlineVerified, MdOutlineSecurity } from 'react-icons/md';
import { BsShieldCheck, BsShieldLock } from 'react-icons/bs';

export default function AdminProfilePage() {
  const t = useTranslations('admin.profile');
  const router = useRouter();
  const { 
    profile, 
    sessions, 
    loading, 
    error, 
    success, 
    setError,
    updateProfile,
    updatePassword,
    toggle2FA,
    terminateSession,
    terminateAllSessions,
  } = useAdminProfile();

  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    bio: '',
  });
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [passwordStrength, setPasswordStrength] = useState(0);

  React.useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (name === 'new') {
      calculatePasswordStrength(value);
    }
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(formData);
    setIsEditing(false);
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    await updatePassword(passwordData.current, passwordData.new);
    setPasswordData({ current: '', new: '', confirm: '' });
    setPasswordStrength(0);
  };

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes('iphone') || device.toLowerCase().includes('android')) {
      return <IoPhonePortraitOutline className="w-5 h-5" />;
    }
    if (device.toLowerCase().includes('macbook') || device.toLowerCase().includes('laptop')) {
      return <IoLaptopOutline className="w-5 h-5" />;
    }
    return <IoDesktopOutline className="w-5 h-5" />;
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-slate-200';
    if (passwordStrength === 1) return 'bg-red-500';
    if (passwordStrength === 2) return 'bg-amber-500';
    if (passwordStrength === 3) return 'bg-emerald-500';
    return 'bg-emerald-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return 'Très faible';
    if (passwordStrength === 1) return 'Faible';
    if (passwordStrength === 2) return 'Moyen';
    if (passwordStrength === 3) return 'Fort';
    return 'Très fort';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Profil non trouvé</h1>
          <button
            onClick={() => router.push('/admin/users')}
            className="text-primary hover:underline"
          >
            Retour aux utilisateurs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Mon Profil
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gérez vos informations personnelles et paramètres de sécurité
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            profile.role === 'ADMIN' 
              ? 'bg-primary/10 text-primary border border-primary/20' 
              : 'bg-slate-100 text-slate-600'
          }`}>
            {profile.role === 'ADMIN' ? 'Super-Admin' : profile.role}
          </span>
        </div>
      </div>

      {/* Alertes */}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} />}

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-4 text-sm font-medium transition-colors relative ${
              activeTab === 'general'
                ? 'text-primary border-b-2 border-primary'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <IoPersonOutline className="w-4 h-4" />
              Informations Générales
            </div>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-4 text-sm font-medium transition-colors relative ${
              activeTab === 'security'
                ? 'text-primary border-b-2 border-primary'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <IoShieldOutline className="w-4 h-4" />
              Sécurité & Accès
            </div>
          </button>
        </div>
      </div>

      {/* Contenu des tabs */}
      {activeTab === 'general' ? (
        <div className="space-y-6">
          {/* Profile Header Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-800 shadow-lg overflow-hidden bg-slate-200">
                  {profile.profilePictureUrl ? (
                    <Image
                      src={profile.profilePictureUrl}
                      alt={`${profile.firstName} ${profile.lastName}`}
                      width={96}
                      height={96}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-2xl font-bold">
                      {profile.firstName?.[0]}{profile.lastName?.[0]}
                    </div>
                  )}
                </div>
                <button className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all">
                  <IoCameraOutline className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">
                    {profile.firstName} {profile.lastName}
                  </h2>
                </div>
                <p className="text-sm text-slate-500">
                  ID: <span className="font-mono">{profile.id.slice(-8)}</span> • 
                  Inscrit depuis {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                {isEditing ? 'Annuler' : 'Modifier le profil'}
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 text-primary mb-3">
                <IoLockOpenOutline className="w-5 h-5" />
                <h4 className="font-bold text-sm">Statut du compte</h4>
              </div>
              <p className="text-2xl font-bold text-emerald-500">Actif</p>
              <p className="text-xs text-slate-500 mt-1">
                Dernière connexion: {profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 text-primary mb-3">
                <IoShieldOutline className="w-5 h-5" />
                <h4 className="font-bold text-sm">Niveau d'accès</h4>
              </div>
              <p className="text-2xl font-bold">Niveau {profile.stats?.accessLevel || 5}</p>
              <p className="text-xs text-slate-500 mt-1">Accès complet à toutes les zones</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 text-primary mb-3">
                <IoTimeOutline className="w-5 h-5" />
                <h4 className="font-bold text-sm">Actions totales</h4>
              </div>
              <p className="text-2xl font-bold">{profile.stats?.totalActions || 0}</p>
              <p className="text-xs text-slate-500 mt-1">
                {profile.stats?.actionsThisMonth || 0} modifications ce mois
              </p>
            </div>
          </div>

          {/* Form Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold">Détails du compte</h3>
              <p className="text-sm text-slate-500">
                {isEditing ? 'Modifiez vos informations personnelles' : 'Vos informations personnelles'}
              </p>
            </div>
            <form onSubmit={handleSubmitProfile} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* System Info (Read Only) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Identifiant Système
                  </label>
                  <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 font-mono text-sm flex items-center justify-between">
                    {profile.id.slice(-8)}
                    <IoLockClosedOutline className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-400">Non modifiable</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Date d'inscription
                  </label>
                  <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 text-sm flex items-center justify-between">
                    {new Date(profile.createdAt).toLocaleDateString()}
                    <IoTimeOutline className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* Editable Fields */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
                      isEditing
                        ? 'border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-primary'
                        : 'border-transparent bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 cursor-default'
                    }`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
                      isEditing
                        ? 'border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-primary'
                        : 'border-transparent bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 cursor-default'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Email
                  </label>
                  <div className="relative">
                    <IoMailOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
                        isEditing
                          ? 'border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-primary'
                          : 'border-transparent bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 cursor-default'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Téléphone
                  </label>
                  <div className="relative">
                    <IoCallOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Non renseigné"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
                        isEditing
                          ? 'border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-primary'
                          : 'border-transparent bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 cursor-default'
                      }`}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Bio / Note
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    disabled={!isEditing}
                    rows={3}
                    placeholder="Ajoutez une note..."
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
                      isEditing
                        ? 'border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-primary'
                        : 'border-transparent bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 cursor-default resize-none'
                    }`}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-2.5 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-2"
                  >
                    <IoSaveOutline className="w-4 h-4" />
                    Sauvegarder
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Change Password Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold">Changer le mot de passe</h3>
              <p className="text-sm text-slate-500">Mettez à jour votre mot de passe régulièrement</p>
            </div>
            <form onSubmit={handleSubmitPassword} className="p-6 space-y-5 max-w-md">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  name="current"
                  value={passwordData.current}
                  onChange={handlePasswordChange}
                  className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  name="new"
                  value={passwordData.new}
                  onChange={handlePasswordChange}
                  className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Entrez un nouveau mot de passe"
                />
                {passwordData.new && (
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-500">
                        Force: <span className={`font-bold ${
                          passwordStrength === 0 ? 'text-slate-500' :
                          passwordStrength === 1 ? 'text-red-500' :
                          passwordStrength === 2 ? 'text-amber-500' :
                          'text-emerald-500'
                        }`}>{getPasswordStrengthText()}</span>
                      </span>
                      <span className="text-xs text-slate-400">Min. 8 caractères</span>
                    </div>
                    <div className="flex gap-1 h-1.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full transition-colors ${
                            i <= passwordStrength ? getPasswordStrengthColor() : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Confirmer le nouveau mot de passe
                </label>
                <input
                  type="password"
                  name="confirm"
                  value={passwordData.confirm}
                  onChange={handlePasswordChange}
                  className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Confirmez le nouveau mot de passe"
                />
                {passwordData.confirm && passwordData.new !== passwordData.confirm && (
                  <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                )}
              </div>
              <button
                type="submit"
                disabled={!passwordData.current || !passwordData.new || !passwordData.confirm || passwordData.new !== passwordData.confirm}
                className="bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-6 rounded-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mettre à jour le mot de passe
              </button>
            </form>
          </div>

          {/* 2FA Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <BsShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">Double Authentification (2FA)</h3>
                  <p className="text-sm text-slate-500">
                    Sécurisez votre compte avec une couche de sécurité supplémentaire.
                    Une fois activée, vous aurez besoin d'un code depuis votre application d'authentification.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={false} // À connecter avec l'API
                  onChange={(e) => toggle2FA(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="mt-4 pl-16">
              <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500 mr-2"></span>
                Désactivé
              </span>
            </div>
          </div>

          {/* Active Sessions Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Sessions Actives</h3>
                <p className="text-sm text-slate-500">Gérez vos sessions connectées</p>
              </div>
              {sessions.length > 1 && (
                <button
                  onClick={terminateAllSessions}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Déconnecter tous les appareils
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {sessions.map((session) => (
                <div key={session.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex gap-4 items-center">
                    <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg">
                      {getDeviceIcon(session.device)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold">{session.device} - {session.browser}</p>
                        {session.isCurrent && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                            Actuelle
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        <IoGlobeOutline className="inline w-3 h-3 mr-1" />
                        {session.location} • IP: {session.ip} • Dernière activité: {session.lastActive}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => terminateSession(session.id)}
                    disabled={session.isCurrent}
                    className={`text-xs font-bold px-3 py-1.5 rounded transition-colors ${
                      session.isCurrent
                        ? 'text-slate-400 cursor-not-allowed'
                        : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                    }`}
                  >
                    {session.isCurrent ? 'Session actuelle' : 'Déconnecter'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}