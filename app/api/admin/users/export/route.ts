import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminAuth, isAuthError } from '@/lib/auth-admin';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Prisma, UserRole, AccountStatus } from '@prisma/client';

// Types
interface ExportFilters {
  search?: string;
  role?: string;
  status?: string;
  verificationStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  minReliability?: string;
  maxFraud?: string;
}

interface ExportBody {
  filters?: ExportFilters;
  selectedUsers?: string[];
}

interface ExportUser {
  [key: string]: string | number | boolean | null;
}

// POST - Export
export async function POST(request: NextRequest) {
  try {
    const auth = getAdminAuth(request);
    
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.error }, 
        { status: auth.status }
      );
    }

    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'csv';
    
    const body = await request.json() as ExportBody;
    const { filters, selectedUsers } = body;

    // Construction WHERE
    const where: Prisma.UserWhereInput = {};
    
    if (selectedUsers && selectedUsers.length > 0) {
      where.id = { in: selectedUsers };
    } else if (filters) {
      if (filters.search) {
        where.OR = [
          { email: { contains: filters.search, mode: Prisma.QueryMode.insensitive } },
          { firstName: { contains: filters.search, mode: Prisma.QueryMode.insensitive } },
          { lastName: { contains: filters.search, mode: Prisma.QueryMode.insensitive } },
        ];
      }
      if (filters.role && filters.role !== 'ALL') {
        where.role = filters.role as UserRole;
      }
      if (filters.status && filters.status !== 'ALL') {
        where.status = filters.status as AccountStatus;
      }
    }

    // Récupérer les utilisateurs
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        status: true,
        isEmailVerified: true,
        isIdentityVerified: true,
        createdAt: true,
        lastLogin: true,
        stats: {
          select: {
            reliabilityScore: true,
            fraudScore: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transformer pour l'export
    const exportUsers: ExportUser[] = users.map(user => ({
      ID: user.id.slice(-8),
      Email: user.email,
      Prénom: user.firstName || '',
      Nom: user.lastName || '',
      Téléphone: user.phoneNumber || '',
      Rôle: user.role,
      Statut: user.status,
      'Email vérifié': user.isEmailVerified ? 'Oui' : 'Non',
      'Identité vérifiée': user.isIdentityVerified ? 'Oui' : 'Non',
      'Score fiabilité': user.stats?.reliabilityScore ?? 50,
      'Score fraude': user.stats?.fraudScore ?? 0,
      'Date inscription': new Date(user.createdAt).toLocaleDateString('fr-FR'),
      'Dernière connexion': user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fr-FR') : 'Jamais',
    }));

    if (format === 'pdf') {
      return await generatePDF(exportUsers);
    } else {
      return await generateCSV(exportUsers);
    }
    
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'export' },
      { status: 500 }
    );
  }
}

// Génération CSV
async function generateCSV(users: ExportUser[]) {
  if (users.length === 0) {
    return NextResponse.json(
      { error: 'Aucun utilisateur à exporter' },
      { status: 400 }
    );
  }

  const headers = Object.keys(users[0]);
  
  const csvRows = [
    headers.join(','),
    ...users.map(user => 
      headers.map(header => {
        const value = user[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      }).join(',')
    )
  ];
  
  const csv = csvRows.join('\n');
  const date = new Date().toISOString().split('T')[0];
  const filename = `utilisateurs_${date}_${users.length}_utilisateurs.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

// Génération PDF
async function generatePDF(users: ExportUser[]) {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  
  const page = pdfDoc.addPage([842, 595]);
  const { width, height } = page.getSize();
  
  // Titre
  page.drawText('Liste des utilisateurs', {
    x: 50,
    y: height - 50,
    size: 24,
    font: timesRomanBold,
    color: rgb(0, 0, 0.8),
  });
  
  const date = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  
  page.drawText(`Export du ${date} - ${users.length} utilisateurs`, {
    x: 50,
    y: height - 80,
    size: 12,
    font: timesRomanFont,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  // Tableau
  const startY = height - 120;
  const rowHeight = 20;
  const colWidths = [80, 150, 100, 80, 80, 80];
  const headers = ['ID', 'Email', 'Nom', 'Rôle', 'Statut', 'Inscription'];
  
  headers.forEach((header, i) => {
    const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
    page.drawText(header, {
      x,
      y: startY,
      size: 10,
      font: timesRomanBold,
      color: rgb(0, 0, 0),
    });
  });
  
  page.drawLine({
    start: { x: 50, y: startY - 5 },
    end: { x: 50 + colWidths.reduce((a, b) => a + b, 0), y: startY - 5 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  
  const displayUsers = users.slice(0, 50);
  
  displayUsers.forEach((user, rowIndex) => {
    const y = startY - (rowIndex + 1) * rowHeight - 10;
    
    const rowData = [
      String(user.ID),
      String(user.Email),
      `${user.Prénom} ${user.Nom}`,
      String(user.Rôle),
      String(user.Statut),
      String(user['Date inscription']),
    ];
    
    rowData.forEach((cell, colIndex) => {
      const x = 50 + colWidths.slice(0, colIndex).reduce((a, b) => a + b, 0);
      page.drawText(String(cell).substring(0, 20), {
        x,
        y,
        size: 8,
        font: timesRomanFont,
        color: rgb(0.2, 0.2, 0.2),
      });
    });
  });
  
  if (users.length > 50) {
    page.drawText(`... et ${users.length - 50} autres utilisateurs`, {
      x: 50,
      y: startY - (52 * rowHeight) - 20,
      size: 10,
      font: timesRomanFont,
      color: rgb(0.5, 0, 0),
    });
  }
  
  const pdfBytes = await pdfDoc.save();
  const pdfDate = new Date().toISOString().split('T')[0];
  const filename = `utilisateurs_${pdfDate}_${users.length}_utilisateurs.pdf`;

  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

// GET - Documentation
export async function GET() {
  return NextResponse.json({ 
    message: 'Route d\'export - Utilisez POST avec les filtres',
    usage: {
      method: 'POST',
      params: { format: 'csv | pdf' },
      body: {
        filters: {
          search: 'string',
          role: 'ALL | ADMIN | PROPERTY_OWNER | TENANT',
          status: 'ALL | ACTIVE | PENDING_VALIDATION | TEMPORARILY_SUSPENDED | PERMANENTLY_BANNED',
        },
        selectedUsers: ['user-id-1', 'user-id-2']
      }
    }
  });
}