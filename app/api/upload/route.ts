import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Le fichier doit être une image' },
        { status: 400 }
      )
    }

    // Convertir le fichier en buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Créer un nom de fichier unique
    const timestamp = Date.now()
    const ext = path.extname(file.name)
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}${ext}`
    
    // Chemin de sauvegarde
    const uploadDir = path.join(process.cwd(), 'public/uploads')
    
    // Créer le dossier s'il n'existe pas
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      // Le dossier existe déjà
    }

    // Sauvegarder le fichier
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // URL publique de l'image
    const imageUrl = `/uploads/${filename}`

    return NextResponse.json({ url: imageUrl })
  } catch (error) {
    console.error('Erreur upload:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload' },
      { status: 500 }
    )
  }
}