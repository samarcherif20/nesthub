'use client'

import { useState, useEffect } from 'react'
import { IoNotificationsOutline, IoCloseOutline } from 'react-icons/io5'
import Link from 'next/link'

interface Notification {
  id: string
  title: string
  message: string
  type: 'booking' | 'favorite' | 'message' | 'system'
  isRead: boolean
  createdAt: string
}

export default function NotificationMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Nouvelle réservation',
      message: 'Vous avez reçu une demande de réservation',
      type: 'booking',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Favori ajouté',
      message: 'Quelqu\'un a ajouté votre annonce en favori',
      type: 'favorite',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Nouveau message',
      message: 'Vous avez un nouveau message',
      type: 'message',
      isRead: true,
      createdAt: new Date().toISOString(),
    },
  ])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    )
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'booking': return 'text-blue-500'
      case 'favorite': return 'text-red-500'
      case 'message': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'booking': return '📅'
      case 'favorite': return '❤️'
      case 'message': return '💬'
      default: return '🔔'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors relative"
      >
        <IoNotificationsOutline className="text-xl text-on-surface-variant" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs text-gray-500">({unreadCount} non lues)</span>
                )}
              </h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Tout marquer comme lu
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <IoCloseOutline className="text-lg text-gray-500" />
                </button>
              </div>
            </div>

            {/* Liste des notifications */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-3xl mb-2">🔔</div>
                  <p className="text-sm">Aucune notification</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer ${
                      !notif.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div className="flex gap-3">
                      <div className="text-xl">{getIcon(notif.type)}</div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${!notif.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(notif.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
              <Link
                href="/fr/notifications"
                className="block text-center text-sm text-blue-600 py-2 hover:underline"
                onClick={() => setIsOpen(false)}
              >
                Voir toutes les notifications
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}