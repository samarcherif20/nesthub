import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Fonction pour récupérer l'IP réelle du client
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  
  if (cfConnectingIp) return cfConnectingIp;
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  if (realIp) return realIp;
  return "127.0.0.1";
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const adminId = searchParams.get("adminId");
    const action = searchParams.get("action");
    const targetType = searchParams.get("targetType");
    const dateRange = searchParams.get("dateRange");
    const search = searchParams.get("search") || "";
    const isExport = searchParams.get("export") === "true"; // ✅ Nouveau paramètre

    let where: any = {};

    if (adminId && adminId !== "all") where.adminId = adminId;
    if (action && action !== "all") where.action = action;
    if (targetType && targetType !== "all") where.targetType = targetType;

    if (dateRange && dateRange !== "all") {
      const now = new Date();
      let startDate = new Date();
      if (dateRange === "24h") startDate.setHours(now.getHours() - 24);
      if (dateRange === "7days") startDate.setDate(now.getDate() - 7);
      if (dateRange === "30days") startDate.setDate(now.getDate() - 30);
      where.createdAt = { gte: startDate };
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { targetId: { contains: search, mode: "insensitive" } },
        { admin: { firstName: { contains: search, mode: "insensitive" } } },
        { admin: { lastName: { contains: search, mode: "insensitive" } } },
        { admin: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    // ✅ Pour l'export, on prend TOUS les logs sans pagination
    const take = isExport ? undefined : limit;
    const skip = isExport ? undefined : (page - 1) * limit;

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePictureUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: skip,
      take: take,
    });

    // Pour l'export, on retourne directement les logs formatés
    if (isExport) {
      const formattedLogs = logs.map((log) => ({
        id: log.id,
        adminName: `${log.admin?.firstName || ""} ${log.admin?.lastName || ""}`.trim(),
        adminEmail: log.admin?.email || "",
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        details: JSON.stringify(log.details),
        motif: log.motif || "",
        ipAddress: log.ipAddress || "",
        createdAt: log.createdAt,
      }));
      return NextResponse.json({ logs: formattedLogs });
    }

    const totalCount = await prisma.auditLog.count({ where });

    // Récupérer tous les admins uniques pour le filtre
    const uniqueAdmins = await prisma.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true, email: true, profilePictureUrl: true },
    });

    // Récupérer toutes les actions uniques
    const uniqueActions = await prisma.auditLog.groupBy({
      by: ["action"],
      orderBy: { _count: { action: "desc" } },
    });

    // Stats
    const totalEvents = await prisma.auditLog.count();
    const securityFlags = await prisma.auditLog.count({
      where: { actionType: "MODERATION" },
    });
    const activeAdmins = await prisma.user.count({
      where: { role: "ADMIN", status: "ACTIVE" },
    });

    const currentIp = getClientIp(request);
    
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      adminId: log.adminId,
      adminName: `${log.admin?.firstName || ""} ${log.admin?.lastName || ""}`.trim(),
      adminEmail: log.admin?.email || "",
      adminAvatar: log.admin?.profilePictureUrl || null,
      action: log.action,
      actionType: log.actionType,
      targetType: log.targetType,
      targetId: log.targetId,
      details: log.details,
      motif: log.motif,
      ipAddress: log.ipAddress || currentIp,
      createdAt: log.createdAt,
    }));

    return NextResponse.json({
      logs: formattedLogs,
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      availableAdmins: uniqueAdmins.map(a => ({ 
        id: a.id, 
        name: `${a.firstName || ""} ${a.lastName || ""}`.trim() || a.email,
        avatar: a.profilePictureUrl || null
      })),
      availableActions: uniqueActions.map(a => a.action),
      stats: {
        totalEvents,
        securityFlags,
        activeAdmins,
        trend: "+12%",
      },
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}