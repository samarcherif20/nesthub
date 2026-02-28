// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUB_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const skip = (page - 1) * limit;
    
    // Filters
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }
    
    if (role && role !== 'ALL') {
      where.role = role;
    }
    
    if (status && status !== 'ALL') {
      where.status = status;
    }
    
    // Get users with counts
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
          role: true,
          status: true,
          emailVerified: true,
          phoneVerified: true,
          identityVerified: true,
          reliabilityScore: true,
          fraudScore: true,
          totalBookings: true,
          totalListings: true,
          createdAt: true,
          lastLogin: true,
          _count: {
            select: {
              listings: true,
              bookings: true,
              reviews: true,
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);
    
    // Get stats
    const stats = await prisma.$transaction([
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.user.count({
        where: {
          identityVerified: true,
        },
      }),
      prisma.user.count({
        where: {
          status: 'PENDING',
        },
      }),
    ]);
    
    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        newUsers30d: stats[0],
        verifiedIdentity: totalCount > 0 ? Math.round((stats[1] / totalCount) * 100) : 0,
        pendingApprovals: stats[2],
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { userId, action, reason } = body;
    
    let updateData = {};
    let auditAction = '';
    
    switch (action) {
      case 'SUSPEND':
        updateData = { status: 'SUSPENDED' };
        auditAction = 'SUSPEND_USER';
        break;
      case 'BAN':
        updateData = { status: 'BANNED' };
        auditAction = 'BAN_USER';
        break;
      case 'ACTIVATE':
        updateData = { status: 'ACTIVE' };
        auditAction = 'ACTIVATE_USER';
        break;
      case 'VERIFY_IDENTITY':
        updateData = { identityVerified: true, verificationStatus: 'VERIFIED' };
        auditAction = 'VERIFY_IDENTITY';
        break;
      case 'REJECT_IDENTITY':
        updateData = { identityVerified: false, verificationStatus: 'REJECTED' };
        auditAction = 'REJECT_IDENTITY';
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: auditAction,
        entityType: 'USER',
        entityId: userId,
        reason,
        afterState: updateData,
      },
    });
    
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}