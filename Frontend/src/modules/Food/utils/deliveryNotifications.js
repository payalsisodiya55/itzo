const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}

/**
 * Delivery Notifications Utility Functions
 * Centralized management for delivery notifications
 */

const DELIVERY_NOTIFICATIONS_KEY = 'delivery_notifications'

/**
 * Get all notifications (Legacy function, no longer uses localStorage)
 * @returns {Array} - Empty array
 */
export const getDeliveryNotifications = () => {
  return []
}

/**
 * Save notifications (Legacy function, no-op)
 * @param {Array} notifications - Array of notifications
 */
export const saveDeliveryNotifications = (notifications) => {
  // No-op
}

/**
 * Get unread notification count
 * @returns {number} - 0
 */
export const getUnreadDeliveryNotificationCount = () => {
  return 0
}

/**
 * Add a new notification
 * @param {Object} notification - Notification object
 */
export const addDeliveryNotification = (notification) => {
  return notification
}

/**
 * Mark notification as read
 * @param {number} notificationId - Notification ID
 */
export const markDeliveryNotificationAsRead = (notificationId) => {
  // No-op
}


