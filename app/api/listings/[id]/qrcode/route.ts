// app/api/listings/[id]/qrcode/route.ts
import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { createCanvas, loadImage } from 'canvas';
import path from 'path';
import fs from 'fs';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const baseUrl = searchParams.get('baseUrl') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const locale = searchParams.get('locale') || 'fr';
    const withGradient = searchParams.get('gradient') !== 'false';
    const withLogo = searchParams.get('logo') !== 'false';
    
    const url = `${baseUrl}/${locale}/dashboard/owner/listings/${id}`;
    const size = 600;
    
    // 1. Générer le QR code en noir
    const qrBuffer = await QRCode.toBuffer(url, {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#000000', light: '#ffffff' }
    });
    
    // 2. Charger l'image QR
    const qrImage = await loadImage(qrBuffer);
    
    // 3. Créer le canvas
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // 4. Fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    // 5. Dessiner le QR code
    ctx.drawImage(qrImage, 0, 0, size, size);
    
    // 6. Appliquer le dégradé
    if (withGradient) {
      const imageData = ctx.getImageData(0, 0, size, size);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // Si le pixel est noir (QR code)
        if (data[i] < 50 && data[i+1] < 50 && data[i+2] < 50) {
          const x = (i / 4) % size;
          const y = Math.floor((i / 4) / size);
          const t = (x + y) / (size * 2);
          
          // Dégradé indigo → violet → cyan
          let r, g, b;
          if (t < 0.33) {
            const t2 = t / 0.33;
            r = Math.round(79 + (124 - 79) * t2);
            g = Math.round(70 + (58 - 70) * t2);
            b = Math.round(229 + (237 - 229) * t2);
          } else if (t < 0.66) {
            const t2 = (t - 0.33) / 0.33;
            r = Math.round(124 + (139 - 124) * t2);
            g = Math.round(58 + (92 - 58) * t2);
            b = Math.round(237 + (246 - 237) * t2);
          } else {
            const t2 = (t - 0.66) / 0.34;
            r = Math.round(139 + (6 - 139) * t2);
            g = Math.round(92 + (182 - 92) * t2);
            b = Math.round(246 + (212 - 246) * t2);
          }
          
          data[i] = r;
          data[i+1] = g;
          data[i+2] = b;
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }
    
    // 7. Ajouter le logo NestHub au centre (agrandi)
    if (withLogo) {
      // Chemins possibles pour le logo
      const possiblePaths = [
        path.join(process.cwd(), 'public', 'logo', 'logo.png'),
        path.join(process.cwd(), 'public', 'logo', 'logo.svg'),
        path.join(process.cwd(), 'public', 'logo', 'nesthub-logo.png'),
        path.join(process.cwd(), 'public', 'logo.png'),
        path.join(process.cwd(), 'public', 'nesthub-logo.png'),
        path.join(process.cwd(), 'public', 'images', 'logo.png'),
      ];
      
      let logoPath = null;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          logoPath = p;
          break;
        }
      }
      
      if (logoPath && fs.existsSync(logoPath)) {
        const logo = await loadImage(logoPath);
        // Logo plus grand: 100px au lieu de 80px
        const logoSize = 150;
        const logoX = (size - logoSize) / 2;
        const logoY = (size - logoSize) / 2;
        
        // Cercle blanc autour du logo (plus grand)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, logoSize / 2 + 10, 0, 2 * Math.PI);
        ctx.fill();
        
        // Ombre légère
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        
        // Dessiner le logo
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
        
        // Réinitialiser l'ombre
        ctx.shadowBlur = 0;
        
        console.log(' Logo trouvé et ajouté:', logoPath);
      } else {
        console.log(' Logo non trouvé dans:', possiblePaths);
      }
    }
    
    // 8. Convertir en dataURL
    const dataUrl = canvas.toDataURL('image/png');
    
    return NextResponse.json({ qrCode: dataUrl, url });
    
  } catch (error) {
    console.error('[GET /api/listings/:id/qrcode] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}