'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  IoPersonOutline, 
  IoLogOutOutline, 
  IoSettingsOutline,
  IoHeartOutline,
  IoHomeOutline,
  IoChevronDown,
  IoCloseOutline
} from 'react-icons/io5'

export default function UserMenu() {
  const { user, isSignedIn } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const role = user?.publicMetadata?.role as string
    setUserRole(role)
  }, [user])

  const handleLogoutClick = () => {
    setIsOpen(false)
    setShowLogoutModal(true)
  }

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true)
    await signOut()
    router.push('/fr/login')
  }

  const handleCancelLogout = () => {
    setShowLogoutModal(false)
  }

  if (!isSignedIn) {
    return (
      <Link href="/fr/login">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-700 transition">
          Se connecter
        </button>
      </Link>
    )
  }

  const isOwner = userRole === 'PROPERTY_OWNER'
  const dashboardLink = isOwner ? '/fr/dashboard/owner' : '/fr/dashboard/renter'

  const profileImage = user?.imageUrl
  const userInitial = user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0) || 'U'
  const displayName = user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'Utilisateur'
  const userEmail = user?.emailAddresses[0]?.emailAddress

  return (
    <>
      <div className="relative">
        {/* Bouton profil */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
        >
          <div className="relative">
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="h-9 w-9 rounded-full object-cover border-2 border-blue-500"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                {userInitial}
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          
          <div className="hidden md:block text-left">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {displayName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isOwner ? 'Propriétaire' : 'Locataire'}
            </p>
          </div>
          
          <IoChevronDown className={`hidden md:block text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Menu déroulant */}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
                <div className="flex items-center gap-3">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="h-12 w-12 rounded-full object-cover border-2 border-blue-500"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {userInitial}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                      {userEmail}
                    </p>
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      {isOwner ? 'Propriétaire' : 'Locataire'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-2">
                <Link
                  href={dashboardLink}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  onClick={() => setIsOpen(false)}
                >
                  <IoHomeOutline className="text-lg text-blue-500" />
                  Tableau de bord
                </Link>
                
                <Link
                  href="/fr/favorites"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  onClick={() => setIsOpen(false)}
                >
                  <IoHeartOutline className="text-lg text-red-500" />
                  Mes favoris
                </Link>
                
                <Link
                  href="/fr/profile"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  onClick={() => setIsOpen(false)}
                >
                  <IoPersonOutline className="text-lg text-purple-500" />
                  Mon profil
                </Link>
                
                <Link
                  href="/fr/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  onClick={() => setIsOpen(false)}
                >
                  <IoSettingsOutline className="text-lg text-gray-500" />
                  Paramètres
                </Link>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700"></div>

              {/* Bouton déconnexion - ouvre le modal */}
              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition font-medium"
              >
                <IoLogOutOutline className="text-lg" />
                Se déconnecter
              </button>
            </div>
          </>
        )}
      </div>

      {/* Modal de confirmation de déconnexion */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCancelLogout} />
          
          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Déconnexion
              </h3>
              <button
                onClick={handleCancelLogout}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <IoCloseOutline className="text-xl text-gray-500" />
              </button>
            </div>
            
            {/* Body */}
            <div className="px-6 py-4">
              <p className="text-gray-600 dark:text-gray-300">
                Êtes-vous sûr de vouloir vous déconnecter ?
              </p>
            </div>
            
            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={handleCancelLogout}
                className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoggingOut ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Déconnexion...
                  </>
                ) : (
                  'Déconnexion'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}