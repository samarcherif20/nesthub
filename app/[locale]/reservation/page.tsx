'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings?role=guest')
      const data = await response.json()
      setBookings(data.bookings || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Mes réservations</h1>
        
        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Vous n'avez pas encore de réservation</p>
            <Link href="/fr/search" className="inline-block mt-4 text-blue-600 hover:text-blue-700">
              Découvrir des logements →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking: any) => (
              <div key={booking.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{booking.listing?.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(booking.checkIn).toLocaleDateString('fr')} - {new Date(booking.checkOut).toLocaleDateString('fr')}
                    </p>
                    <p className="text-sm mt-1">{booking.guests} voyageurs</p>
                    <p className="text-blue-600 font-semibold mt-2">{booking.totalPrice} TND</p>
                  </div>
                  <div>
                    {booking.status === 'PENDING' && (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">En attente</span>
                    )}
                    {booking.status === 'ACCEPTED' && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Acceptée ✓</span>
                    )}
                    {booking.status === 'REJECTED' && (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Refusée ✗</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}