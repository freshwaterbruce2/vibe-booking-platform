import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Calendar, Star, Gift, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService, type BookingNotification } from '@/services/notificationService';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

interface NotificationDropdownProps {
  className?: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className = '' }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      
      // Subscribe to notification updates
      const unsubscribe = notificationService.subscribe(user.id, (updatedNotifications) => {
        setNotifications(updatedNotifications);
        setUnreadCount(updatedNotifications.filter(n => !n.read).length);
      });

      return unsubscribe;
    }
  }, [user?.id]);

  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [userNotifications, count] = await Promise.all([
        notificationService.getUserNotifications(user.id, 10),
        notificationService.getUnreadCount(user.id)
      ]);

      setNotifications(userNotifications);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user?.id) return;
    
    await notificationService.markAsRead(user.id, notificationId);
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    
    await notificationService.markAllAsRead(user.id);
  };

  const handleClearAll = async () => {
    if (!user?.id) return;
    
    await notificationService.clearNotifications(user.id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'booking_cancelled':
        return <X className="w-4 h-4 text-red-600" />;
      case 'check_in_reminder':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'review_request':
        return <Star className="w-4 h-4 text-yellow-600" />;
      case 'promotion':
        return <Gift className="w-4 h-4 text-purple-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative hover:bg-slate-100 transition-colors"
      >
        <Bell className="h-5 w-5 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-luxury-lg border border-slate-200 z-20 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
                {notifications.length > 0 && (
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={handleClearAll}
                      className="text-xs text-red-600 hover:text-red-800 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin w-5 h-5 border-2 border-slate-200 border-t-slate-600 rounded-full mx-auto"></div>
                  <p className="text-sm text-slate-600 mt-2">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-900 mb-1">No notifications yet</p>
                  <p className="text-xs text-slate-600">
                    You'll see booking updates and important messages here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-4 hover:bg-slate-50 transition-colors cursor-pointer border-l-4',
                        notification.read ? 'opacity-60' : '',
                        getPriorityColor(notification.priority)
                      )}
                      onClick={() => {
                        if (!notification.read) {
                          handleMarkAsRead(notification.id);
                        }
                        if (notification.actionUrl) {
                          window.location.href = notification.actionUrl;
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900 mb-1">
                                {notification.title}
                              </p>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {notification.message}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0"></div>
                            )}
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <p className="text-xs text-slate-500">
                              {formatRelativeTime(notification.createdAt)}
                            </p>
                            {notification.actionUrl && (
                              <span className="text-xs text-blue-600 hover:text-blue-800">
                                View →
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 10 && (
              <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 rounded-b-xl text-center">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    window.location.href = '/profile';
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;