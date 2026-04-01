import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export async function POST(request: NextRequest) {
  try {
    // Récupérer le fichier uploadé
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }
    
    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Le fichier doit être une image' },
        { status: 400 }
      );
    }
    
    // Sauvegarder temporairement l'image
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const tempFilePath = join(tmpdir(), `upload_${Date.now()}.jpg`);
    await writeFile(tempFilePath, buffer);
    
    // Envoyer au service Python
    const formDataPython = new FormData();
    const blob = new Blob([buffer], { type: file.type });
    formDataPython.append('file', blob, file.name);
    
    const pythonResponse = await fetch('http://localhost:5000/ocr', {
      method: 'POST',
      body: formDataPython,
    });
    
    const result = await pythonResponse.json();
    
    // Nettoyer
    await unlink(tempFilePath);
    
    if (!pythonResponse.ok) {
      return NextResponse.json(
        { error: result.error || 'Erreur du service OCR' },
        { status: pythonResponse.status }
      );
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Erreur OCR:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement de l\'image' },
      { status: 500 }
    );
  }
}