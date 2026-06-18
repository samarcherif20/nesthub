'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { TbLink, TbX } from 'react-icons/tb'

interface LinkModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (url: string) => void
  initialUrl?: string
}

export default function LinkModal({ isOpen, onClose, onSave, initialUrl = '' }: LinkModalProps) {
  const t = useTranslations("LinkModal")
  const [url, setUrl] = useState(initialUrl)

  useEffect(() => {
    setUrl(initialUrl)
  }, [initialUrl])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      onSave(url)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-96 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <TbLink className="text-primary" />
            {t("title")}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
            <TbX className="text-xl" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{t("urlLabel")}</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
              autoFocus
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              {t("add")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}