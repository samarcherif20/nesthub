'use client'

import { useState, useEffect } from 'react'
import { IoGitCompare } from 'react-icons/io5'

export default function CompareButton() {
  const [compareCount, setCompareCount] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem('compareList')
    if (saved) {
      setCompareCount(JSON.parse(saved).length)
    }

    const handleCompareUpdate = () => {
      const updated = localStorage.getItem('compareList')
      if (updated) {
        setCompareCount(JSON.parse(updated).length)
      }
    }

    window.addEventListener('compare-updated', handleCompareUpdate)
    return () => window.removeEventListener('compare-updated', handleCompareUpdate)
  }, [])

  if (compareCount === 0) return null

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40">
      <button
        onClick={() => window.location.href = '/fr/compare'}
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-2xl hover:scale-105 transition-transform active:scale-95"
      >
        <IoGitCompare className="text-xl" />
        Comparer ({compareCount})
      </button>
    </div>
  )
}