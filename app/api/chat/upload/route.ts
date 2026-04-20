import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('files') as File;
    const conversationId = formData.get('conversationId') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file' }, { status: 400 });
    }

    // ✅ Changer access: 'private'
    const blob = await put(`chat/${conversationId}/${Date.now()}-${file.name}`, file, {
      access: 'private',  // ← MODIFIÉ de 'public' à 'private'
      addRandomSuffix: true,
    });

    console.log(`📎 Fichier uploadé: ${blob.url}`);

    return NextResponse.json({ 
      success: true, 
      url: blob.url,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}