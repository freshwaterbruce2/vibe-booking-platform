import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export interface BookingNotification {
  id: string;
  type: 'booking_confirmed' | 'booking_cancelled' | 'check_in_reminder' | 'review_request' | 'promotion';
  title: string;
  message: string;
  bookingId?: string;
  userId: string;
  createdAt: string;
  read: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  bookingReminders: boolean;
  promotionalOffers: boolean;
}

class NotificationService {
  private notifications: Map<string, BookingNotification[]> = new Map();
  private subscribers: Map<string, ((notifications: BookingNotification[]) => void)[]> = new Map();

  async sendBookingConfirmation(userId: string, bookingId: string, confirmationNumber: string, hotelName: string): Promise<void> {
    try {
      const notification: BookingNotification = {
        id: `booking-confirmed-${Date.now()}`,
        type: 'booking_confirmed',
        title: 'Booking Confirmed!',
        message: `Your reservation at ${hotelName} has been confirmed. Confirmation number: ${confirmationNumber}`,
        bookingId,
        userId,
        createdAt: new Date().toISOString(),
        read: false,
        actionUrl: `/my-bookings`,
        priority: 'high'
      };

      await this.addNotification(userId, notification);
      
      // Show success toast
      toast.success(`Booking confirmed at ${hotelName}!`, {
        description: `Confirmation: ${confirmationNumber}`,
        duration: 5000,
      });

      logger.info('Booking confirmation notification sent', {
        userId,
        bookingId,
        confirmationNumber,
        hotelName
      });
    } catch (error) {
      logger.error('Failed to send booking confirmation notification:', error);
    }
  }

  async sendBookingCancellation(userId: string, bookingId: string, hotelName: string, refundAmount?: number): Promise<void> {
    try {
      const refundText = refundAmount ? ` A refund of $${refundAmount.toLocaleString()} has been processed.` : '';
      
      const notification: BookingNotification = {
        id: `booking-cancelled-${Date.now()}`,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: `Your reservation at ${hotelName} has been cancelled.${refundText}`,
        bookingId,
        userId,
        createdAt: new Date().toISOString(),
        read: false,
        actionUrl: `/my-bookings`,
        priority: 'medium'
      };

      await this.addNotification(userId, notification);
      
      // Show cancellation toast
      toast.success('Booking cancelled successfully', {
        description: refundAmount ? `Refund of $${refundAmount.toLocaleString()} processed` : 'Your booking has been cancelled',
        duration: 4000,
      });

      logger.info('Booking cancellation notification sent', {
        userId,
        bookingId,
        hotelName,
        refundAmount
      });
    } catch (error) {
      logger.error('Failed to send booking cancellation notification:', error);
    }
  }

  async sendCheckInReminder(userId: string, bookingId: string, hotelName: string, checkInDate: string): Promise<void> {
    try {
      const checkInDateObj = new Date(checkInDate);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Only send if check-in is within 24 hours
      if (checkInDateObj.getTime() <= tomorrow.getTime()) {
        const notification: BookingNotification = {
          id: `check-in-reminder-${Date.now()}`,
          type: 'check_in_reminder',
          title: 'Check-in Reminder',
          message: `Don't forget! Your check-in at ${hotelName} is tomorrow (${checkInDateObj.toLocaleDateString()}).`,
          bookingId,
          userId,
          createdAt: new Date().toISOString(),
          read: false,
          actionUrl: `/my-bookings`,
          priority: 'medium'
        };

        await this.addNotification(userId, notification);
        
        logger.info('Check-in reminder sent', {
          userId,
          bookingId,
          hotelName,
          checkInDate
        });
      }
    } catch (error) {
      logger.error('Failed to send check-in reminder:', error);
    }
  }

  async sendReviewRequest(userId: string, bookingId: string, hotelName: string): Promise<void> {
    try {
      const notification: BookingNotification = {
        id: `review-request-${Date.now()}`,
        type: 'review_request',
        title: 'Share Your Experience',
        message: `How was your stay at ${hotelName}? Help other travelers by leaving a review.`,
        bookingId,
        userId,
        createdAt: new Date().toISOString(),
        read: false,
        actionUrl: `/my-bookings`,
        priority: 'low'
      };

      await this.addNotification(userId, notification);
      
      logger.info('Review request sent', {
        userId,
        bookingId,
        hotelName
      });
    } catch (error) {
      logger.error('Failed to send review request:', error);
    }
  }

  async sendPromotionalNotification(userId: string, title: string, message: string, actionUrl?: string): Promise<void> {
    try {
      const notification: BookingNotification = {
        id: `promotion-${Date.now()}`,
        type: 'promotion',
        title,
        message,
        userId,
        createdAt: new Date().toISOString(),
        read: false,
        actionUrl,
        priority: 'low'
      };

      await this.addNotification(userId, notification);
      
      logger.info('Promotional notification sent', {
        userId,
        title
      });
    } catch (error) {
      logger.error('Failed to send promotional notification:', error);
    }
  }

  private async addNotification(userId: string, notification: BookingNotification): Promise<void> {
    // Get existing notifications for user
    const userNotifications = this.notifications.get(userId) || [];
    
    // Add new notification at the beginning
    userNotifications.unshift(notification);
    
    // Keep only the most recent 50 notifications per user
    if (userNotifications.length > 50) {
      userNotifications.splice(50);
    }
    
    // Store updated notifications
    this.notifications.set(userId, userNotifications);
    
    // Persist to localStorage for demo purposes
    try {
      localStorage.setItem(`notifications-${userId}`, JSON.stringify(userNotifications));
    } catch (error) {
      logger.warn('Failed to persist notifications to localStorage:', { error: error instanceof Error ? error.message : String(error) });
    }
    
    // Notify subscribers
    this.notifySubscribers(userId, userNotifications);
  }

  async getUserNotifications(userId: string, limit?: number): Promise<BookingNotification[]> {
    try {
      // Try to load from localStorage first
      const stored = localStorage.getItem(`notifications-${userId}`);
      if (stored) {
        const notifications = JSON.parse(stored) as BookingNotification[];
        this.notifications.set(userId, notifications);
      }
      
      const userNotifications = this.notifications.get(userId) || [];
      return limit ? userNotifications.slice(0, limit) : userNotifications;
    } catch (error) {
      logger.error('Failed to get user notifications:', error);
      return [];
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const notifications = await this.getUserNotifications(userId);
      return notifications.filter(n => !n.read).length;
    } catch (error) {
      logger.error('Failed to get unread count:', error);
      return 0;
    }
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      const userNotifications = await this.getUserNotifications(userId);
      const notification = userNotifications.find(n => n.id === notificationId);
      
      if (notification) {
        notification.read = true;
        this.notifications.set(userId, userNotifications);
        
        // Persist to localStorage
        localStorage.setItem(`notifications-${userId}`, JSON.stringify(userNotifications));
        
        // Notify subscribers
        this.notifySubscribers(userId, userNotifications);
      }
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      const userNotifications = await this.getUserNotifications(userId);
      userNotifications.forEach(notification => {
        notification.read = true;
      });
      
      this.notifications.set(userId, userNotifications);
      
      // Persist to localStorage
      localStorage.setItem(`notifications-${userId}`, JSON.stringify(userNotifications));
      
      // Notify subscribers
      this.notifySubscribers(userId, userNotifications);
    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error);
    }
  }

  async clearNotifications(userId: string): Promise<void> {
    try {
      this.notifications.set(userId, []);
      localStorage.removeItem(`notifications-${userId}`);
      
      // Notify subscribers
      this.notifySubscribers(userId, []);
    } catch (error) {
      logger.error('Failed to clear notifications:', error);
    }
  }

  subscribe(userId: string, callback: (notifications: BookingNotification[]) => void): () => void {
    const userSubscribers = this.subscribers.get(userId) || [];
    userSubscribers.push(callback);
    this.subscribers.set(userId, userSubscribers);
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(userId) || [];
      const index = subscribers.indexOf(callback);
      if (index > -1) {
        subscribers.splice(index, 1);
        this.subscribers.set(userId, subscribers);
      }
    };
  }

  private notifySubscribers(userId: string, notifications: BookingNotification[]): void {
    const subscribers = this.subscribers.get(userId) || [];
    subscribers.forEach(callback => {
      try {
        callback(notifications);
      } catch (error) {
        logger.error('Error notifying subscriber:', error);
      }
    });
  }

  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const stored = localStorage.getItem(`notification-preferences-${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Default preferences
      return {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
        bookingReminders: true,
        promotionalOffers: false
      };
    } catch (error) {
      logger.error('Failed to get notification preferences:', error);
      return {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
        bookingReminders: true,
        promotionalOffers: false
      };
    }
  }

  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      const current = await this.getUserPreferences(userId);
      const updated = { ...current, ...preferences };
      
      localStorage.setItem(`notification-preferences-${userId}`, JSON.stringify(updated));
      
      logger.info('Notification preferences updated', { userId });
    } catch (error) {
      logger.error('Failed to update notification preferences:', error);
    }
  }

  // Booking status tracking methods
  async trackBookingStatus(bookingId: string, newStatus: string, userId?: string): Promise<void> {
    try {
      if (!userId) return;

      const statusMessages = {
        confirmed: 'Your booking has been confirmed',
        checked_in: 'Welcome! You have successfully checked in',
        checked_out: 'Thank you for your stay! Check-out completed',
        cancelled: 'Your booking has been cancelled',
        completed: 'Your stay is complete. We hope you enjoyed it!'
      };

      const message = statusMessages[newStatus as keyof typeof statusMessages];
      if (message) {
        toast.success(message, {
          duration: 4000,
        });
      }

      logger.info('Booking status tracked', {
        bookingId,
        newStatus,
        userId
      });
    } catch (error) {
      logger.error('Failed to track booking status:', error);
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;