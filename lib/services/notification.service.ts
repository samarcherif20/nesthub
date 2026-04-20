// services/notification.service.ts
import { prisma } from "@/lib/prisma";
import { NotificationType, NotificationChannel } from "@prisma/client";

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  data?: Record<string, any>;
  bookingId?: string;
  alertId?: string;
}

export class NotificationService {
  static async createInAppNotification(params: CreateNotificationParams) {
    const { userId, type, title, content, data, bookingId, alertId } = params;
    
    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        content,
        data: data || {},
        channels: [NotificationChannel.IN_APP],
        isRead: false,
        createdAt: new Date(),
      },
    });
  }

  static async getUserNotifications(userId: string, limit = 20, offset = 0) {
    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    
    return { notifications, totalCount, unreadCount };
  }

  static async markAsRead(notificationId: string, userId: string) {
    return await prisma.notification.update({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  static async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}