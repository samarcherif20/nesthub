// app/api/users/unlock-account/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { clerkUserId } = await request.json()

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Missing clerkUserId' }, { status: 400 })
    }

    // Trouver l'utilisateur par clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Déverrouiller le compte et réinitialiser les tentatives
    const updatedUser = await prisma.user.update({
      where: { clerkId: clerkUserId },
      data: {
        status: 'ACTIVE', 
        failedLoginAttempts: 0, 
        updatedAt: new Date()
      }
    })

    console.log(` Compte déverrouillé: ${user.email}`)

    return NextResponse.json({ 
      success: true, 
      user: { id: updatedUser.id, status: updatedUser.status }
    })
  } catch (error) {
    console.error('Error unlocking account:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}