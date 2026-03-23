'use client'

import React, { useState, useRef } from 'react'
import { TbPhoto, TbX, TbUpload, TbLoader } from 'react-icons/tb'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (url: string) => void
}

export default function ImageModal({ isOpen, onClose, onSave }: ImageModalProps) {
  const [url, setUrl] = useState('')
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url')
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image (JPG, PNG, GIF)')
      return
    }

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 5MB')
      return
    }

    // Créer une prévisualisation
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Simuler un upload (à remplacer par ton API d'upload)
    handleUpload(file)
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    
    try {
      // TODO: Remplacer par ton API d'upload
      // Exemple avec fetch:
      // const formData = new FormData()
      // formData.append('image', file)
      // const res = await fetch('/api/upload', { method: 'POST', body: formData })
      // const data = await res.json()
      // onSave(data.url)
      
      // Simulation d'upload (à supprimer quand tu auras ta vraie API)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Pour la démo, on utilise une URL temporaire
      const fakeUrl = URL.createObjectURL(file)
      onSave(fakeUrl)
      
      setPreview(null)
      setUploading(false)
      onClose()
    } catch (error) {
      console.error('Erreur upload:', error)
      alert('Erreur lors de l\'upload')
      setUploading(false)
    }
  }

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      onSave(url)
      setUrl('')
      onClose()
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-96 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <TbPhoto className="text-primary" />
            Ajouter une image
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
            <TbX className="text-xl" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('url')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'url'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            URL
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Upload
          </button>
        </div>

        {activeTab === 'url' ? (
          <form onSubmit={handleUrlSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">URL de l'image</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
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
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Ajouter
              </button>
            </div>
          </form>
        ) : (
          <div className="py-4">
            {/* Input file caché */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {uploading ? (
              <div className="text-center py-8">
                <TbLoader className="text-4xl text-primary animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-600 dark:text-slate-400">Upload en cours...</p>
              </div>
            ) : preview ? (
              <div className="text-center">
                <img 
                  src={preview} 
                  alt="Prévisualisation" 
                  className="max-h-40 mx-auto mb-4 rounded-lg border border-slate-200 dark:border-slate-700"
                />
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Image prête à être uploadée</p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setPreview(null)}
                    className="px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Changer
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div 
                  onClick={handleBrowseClick}
                  className="mb-4 p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-primary transition-colors"
                >
                  <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                    <TbUpload className="text-3xl text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Glissez une image ou cliquez pour parcourir
                  </p>
                  <p className="text-xs text-slate-400">
                    PNG, JPG, GIF • Max 5MB
                  </p>
                </div>
                
                <button
                  onClick={handleBrowseClick}
                  className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Choisir un fichier
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}