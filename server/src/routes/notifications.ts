import express from "express";
import {
  getAllNotifications,
  getUnreadNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearReadNotifications,
} from "../controllers/notificationController";
import authMiddleware from "../middleware/auth";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/notifications
 * Get all notifications for the authenticated user (paginated)
 * Query params: page, limit
 */
router.get("/", getAllNotifications);

/**
 * GET /api/notifications/unread
 * Get only unread notifications for the authenticated user
 */
router.get("/unread", getUnreadNotifications);

/**
 * GET /api/notifications/count
 * Get unread notification count for badge
 */
router.get("/count", getUnreadCount);

/**
 * PUT /api/notifications/:id/read
 * Mark a specific notification as read
 */
router.put("/:id/read", markNotificationAsRead);

/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications as read for the authenticated user
 */
router.put("/mark-all-read", markAllNotificationsAsRead);

/**
 * DELETE /api/notifications/:id
 * Delete a specific notification
 */
router.delete("/:id", deleteNotification);

/**
 * DELETE /api/notifications/clear-read
 * Clear all read notifications for the authenticated user
 */
router.delete("/clear-read", clearReadNotifications);

export default router;
