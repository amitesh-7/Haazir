import { Request, Response } from "express";
import NotificationService from "../services/NotificationService";

/**
 * Get all notifications for the authenticated user with pagination
 */
export const getAllNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const result = await NotificationService.getAllNotifications(
      userId,
      limit,
      offset
    );

    return res.status(200).json({
      notifications: result.notifications,
      total: result.total,
      page,
      totalPages: Math.ceil(result.total / limit)
    });
  } catch (error: any) {
    console.error("Error fetching all notifications:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch notifications" });
  }
};

/**
 * Get unread notifications for the authenticated user
 */
export const getUnreadNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const notifications = await NotificationService.getUnreadNotifications(userId);

    return res.status(200).json({ notifications });
  } catch (error: any) {
    console.error("Error fetching unread notifications:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch unread notifications" });
  }
};

/**
 * Get unread notification count for the authenticated user
 */
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const count = await NotificationService.getUnreadCount(userId);

    return res.status(200).json({ count });
  } catch (error: any) {
    console.error("Error fetching unread count:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch unread count" });
  }
};

/**
 * Mark a specific notification as read
 */
export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const notificationId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (isNaN(notificationId)) {
      return res.status(400).json({ error: "Invalid notification ID" });
    }

    const notification = await NotificationService.markAsRead(notificationId, userId);

    if (!notification) {
      return res.status(404).json({ error: "Notification not found or unauthorized" });
    }

    return res.status(200).json({ 
      message: "Notification marked as read",
      notification 
    });
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({ error: error.message || "Failed to mark notification as read" });
  }
};

/**
 * Mark all notifications as read for the authenticated user
 */
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const count = await NotificationService.markAllAsRead(userId);

    return res.status(200).json({ 
      message: `${count} notification(s) marked as read`,
      count 
    });
  } catch (error: any) {
    console.error("Error marking all notifications as read:", error);
    return res.status(500).json({ error: error.message || "Failed to mark all notifications as read" });
  }
};

/**
 * Delete a specific notification
 */
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const notificationId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (isNaN(notificationId)) {
      return res.status(400).json({ error: "Invalid notification ID" });
    }

    const deleted = await NotificationService.deleteNotification(notificationId, userId);

    if (!deleted) {
      return res.status(404).json({ error: "Notification not found or unauthorized" });
    }

    return res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({ error: error.message || "Failed to delete notification" });
  }
};

/**
 * Clear all read notifications for the authenticated user
 */
export const clearReadNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const count = await NotificationService.clearReadNotifications(userId);

    return res.status(200).json({ 
      message: `${count} read notification(s) cleared`,
      count 
    });
  } catch (error: any) {
    console.error("Error clearing read notifications:", error);
    return res.status(500).json({ error: error.message || "Failed to clear read notifications" });
  }
};
