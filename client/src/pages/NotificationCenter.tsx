import React, { useState, useEffect } from 'react';
import {
  getAllNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearReadNotifications,
  Notification,
  NotificationResponse
} from '../services/api';

type TabType = 'all' | 'unread' | 'read';

const NotificationCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = async (currentPage: number = 1) => {
    try {
      setLoading(true);
      const response: NotificationResponse = await getAllNotifications(currentPage, 20);
      setNotifications(response.notifications);
      setTotal(response.total || 0);
      setTotalPages(response.totalPages || 1);
      setPage(currentPage);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Filter notifications based on active tab and type
  useEffect(() => {
    let filtered = [...notifications];

    // Filter by read status (tab)
    if (activeTab === 'unread') {
      filtered = filtered.filter(n => !n.is_read);
    } else if (activeTab === 'read') {
      filtered = filtered.filter(n => n.is_read);
    }

    // Filter by notification type
    if (selectedType !== 'all') {
      filtered = filtered.filter(n => n.type === selectedType);
    }

    setFilteredNotifications(filtered);
  }, [notifications, activeTab, selectedType]);

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Handle mark as read
  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true);
      await markAllNotificationsAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete notification
  const handleDelete = async (notificationId: number) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setTotal(prev => prev - 1);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Handle clear read notifications
  const handleClearRead = async () => {
    if (!window.confirm('Are you sure you want to clear all read notifications?')) {
      return;
    }

    try {
      setActionLoading(true);
      await clearReadNotifications();
      setNotifications(prev => prev.filter(n => !n.is_read));
      await fetchNotifications(1); // Refresh from server
    } catch (error) {
      console.error('Error clearing read notifications:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchNotifications(newPage);
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'attendance_absent':
        return '⚠️';
      case 'attendance_warning':
        return '🚨';
      case 'grade_update':
        return '📝';
      case 'announcement':
        return '📢';
      default:
        return '🔔';
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    const styles = {
      urgent: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      normal: 'bg-blue-100 text-blue-800 border-blue-300',
      low: 'bg-gray-100 text-gray-800 border-gray-300'
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${styles[priority as keyof typeof styles] || styles.normal}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get unread count for tab
  const getUnreadCount = () => notifications.filter(n => !n.is_read).length;
  const getReadCount = () => notifications.filter(n => n.is_read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <span className="mr-3">🔔</span>
                Notification Center
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your notifications and stay updated
              </p>
            </div>
            <div className="flex gap-2">
              {getUnreadCount() > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Mark All Read
                </button>
              )}
              {getReadCount() > 0 && (
                <button
                  onClick={handleClearRead}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Clear Read
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-blue-900">{total}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <p className="text-sm text-orange-600 font-medium">Unread</p>
              <p className="text-2xl font-bold text-orange-900">{getUnreadCount()}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-green-600 font-medium">Read</p>
              <p className="text-2xl font-bold text-green-900">{getReadCount()}</p>
            </div>
          </div>
        </div>

        {/* Tabs and Filters */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => handleTabChange('all')}
                className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'all'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                All ({total})
              </button>
              <button
                onClick={() => handleTabChange('unread')}
                className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'unread'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Unread ({getUnreadCount()})
              </button>
              <button
                onClick={() => handleTabChange('read')}
                className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'read'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Read ({getReadCount()})
              </button>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Filter:</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              >
                <option value="all">All Types</option>
                <option value="attendance_absent">Absence</option>
                <option value="attendance_warning">Warnings</option>
                <option value="grade_update">Grades</option>
                <option value="announcement">Announcements</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-600">
                {activeTab === 'unread' && 'You have no unread notifications.'}
                {activeTab === 'read' && 'You have no read notifications.'}
                {activeTab === 'all' && 'You have no notifications yet.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-200 p-6 ${
                  !notification.is_read ? 'border-l-4 border-indigo-600' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  {/* Content */}
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Icon */}
                    <span className="text-3xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`text-lg font-semibold text-gray-900 ${!notification.is_read ? 'font-bold' : ''}`}>
                          {notification.title}
                        </h3>
                        {getPriorityBadge(notification.priority)}
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
                        )}
                      </div>

                      <p className="text-gray-700 mb-3 leading-relaxed">
                        {notification.message}
                      </p>

                      {/* Related Data */}
                      {notification.related_data && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200">
                          <p className="text-xs font-semibold text-gray-600 mb-2">Details:</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {notification.related_data.course_name && (
                              <div>
                                <span className="text-gray-600">Course:</span>{' '}
                                <span className="font-medium text-gray-900">{notification.related_data.course_name}</span>
                              </div>
                            )}
                            {notification.related_data.course_code && (
                              <div>
                                <span className="text-gray-600">Code:</span>{' '}
                                <span className="font-medium text-gray-900">{notification.related_data.course_code}</span>
                              </div>
                            )}
                            {notification.related_data.date && (
                              <div>
                                <span className="text-gray-600">Date:</span>{' '}
                                <span className="font-medium text-gray-900">{notification.related_data.date}</span>
                              </div>
                            )}
                            {notification.related_data.time_slot && (
                              <div>
                                <span className="text-gray-600">Time:</span>{' '}
                                <span className="font-medium text-gray-900">{notification.related_data.time_slot}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <p className="text-sm text-gray-500">
                        {formatDate(notification.created_at)}
                        {notification.read_at && (
                          <span className="ml-2">• Read {formatDate(notification.read_at)}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {!notification.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-lg p-4 mt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Page {page} of {totalPages} • Total {total} notifications
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          page === pageNum
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
