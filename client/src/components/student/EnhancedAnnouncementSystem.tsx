import React, { useState, useEffect, useMemo } from 'react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'general' | 'urgent' | 'academic' | 'event' | 'deadline' | 'maintenance';
  author: string;
  author_role: 'coordinator' | 'teacher' | 'admin';
  created_at: string;
  updated_at?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  target_audience: 'all' | 'students' | 'teachers' | 'coordinators' | 'specific';
  target_courses?: string[];
  target_departments?: string[];
  is_pinned: boolean;
  read_status: boolean;
  expires_at?: string;
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
}

interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  announcement_types: {
    general: boolean;
    urgent: boolean;
    academic: boolean;
    event: boolean;
    deadline: boolean;
    maintenance: boolean;
  };
}

const EnhancedAnnouncementSystem: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    announcement_types: {
      general: true,
      urgent: true,
      academic: true,
      event: true,
      deadline: true,
      maintenance: true
    }
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [announcements, selectedType, selectedPriority, searchTerm, showUnreadOnly]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API calls
      const mockAnnouncements: Announcement[] = [
        {
          id: '1',
          title: '🚨 Important: Final Exam Schedule Released',
          message: 'The final examination schedule for the Fall 2024 semester has been released. Please check your schedule carefully and note the exam dates and venues. All exams will be conducted in-person unless otherwise specified. Students must arrive at least 15 minutes before the exam starts.',
          type: 'urgent',
          author: 'Dr. Sarah Johnson',
          author_role: 'coordinator',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
          target_audience: 'students',
          is_pinned: true,
          read_status: false,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          attachments: [
            {
              id: '1',
              name: 'Final_Exam_Schedule_Fall2024.pdf',
              url: '/attachments/exam-schedule.pdf',
              type: 'application/pdf'
            }
          ]
        },
        {
          id: '2',
          title: '📚 Library Extended Hours During Finals',
          message: 'The library will extend its operating hours during the final examination period. New timings: Monday-Sunday 6:00 AM - 12:00 AM. Additional study spaces have been set up in the cafeteria area.',
          type: 'general',
          author: 'Library Administration',
          author_role: 'admin',
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          priority: 'medium',
          target_audience: 'all',
          is_pinned: false,
          read_status: true
        },
        {
          id: '3',
          title: '🎉 Annual Tech Fest 2024 - Registration Open',
          message: 'Join us for the most exciting tech event of the year! Registration is now open for various competitions including coding contests, robotics, and innovation challenges. Prize pool worth $10,000. Register before December 15th.',
          type: 'event',
          author: 'Student Council',
          author_role: 'admin',
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          priority: 'medium',
          target_audience: 'students',
          is_pinned: false,
          read_status: false,
          expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          title: '⚠️ System Maintenance - December 20th',
          message: 'The student portal and LMS will be temporarily unavailable on December 20th from 2:00 AM to 6:00 AM for scheduled maintenance. Please plan your submissions accordingly.',
          type: 'maintenance',
          author: 'IT Department',
          author_role: 'admin',
          created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
          target_audience: 'all',
          is_pinned: false,
          read_status: true
        },
        {
          id: '5',
          title: '📝 Assignment Deadline Extension - CS301',
          message: 'Due to technical issues with the submission portal, the deadline for CS301 Database Design assignment has been extended to December 18th, 11:59 PM. No further extensions will be granted.',
          type: 'academic',
          author: 'Prof. Michael Chen',
          author_role: 'teacher',
          created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
          target_audience: 'specific',
          target_courses: ['CS301'],
          is_pinned: false,
          read_status: false,
          expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '6',
          title: '🍕 Free Pizza Day at Cafeteria',
          message: 'Celebrate the end of midterms with free pizza! Visit the main cafeteria on Friday from 12:00 PM to 2:00 PM. First come, first served. Limited quantities available.',
          type: 'general',
          author: 'Cafeteria Management',
          author_role: 'admin',
          created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
          priority: 'low',
          target_audience: 'all',
          is_pinned: false,
          read_status: true,
          expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      setAnnouncements(mockAnnouncements);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = announcements;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(announcement => announcement.type === selectedType);
    }

    // Filter by priority
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(announcement => announcement.priority === selectedPriority);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(announcement =>
        announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by read status
    if (showUnreadOnly) {
      filtered = filtered.filter(announcement => !announcement.read_status);
    }

    // Sort: pinned first, then by date
    filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setFilteredAnnouncements(filtered);
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'urgent': return '🚨';
      case 'academic': return '📚';
      case 'event': return '🎉';
      case 'deadline': return '⏰';
      case 'maintenance': return '⚙️';
      default: return '📢';
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'academic': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'event': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'deadline': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'maintenance': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const markAsRead = (id: string) => {
    setAnnouncements(prev => 
      prev.map(announcement => 
        announcement.id === id 
          ? { ...announcement, read_status: true }
          : announcement
      )
    );
  };

  const openAnnouncementModal = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsModalOpen(true);
    if (!announcement.read_status) {
      markAsRead(announcement.id);
    }
  };

  const stats = useMemo(() => {
    const unreadCount = announcements.filter(a => !a.read_status).length;
    const urgentCount = announcements.filter(a => a.priority === 'high' || a.priority === 'critical').length;
    const pinnedCount = announcements.filter(a => a.is_pinned).length;
    const todayCount = announcements.filter(a => {
      const today = new Date();
      const announcementDate = new Date(a.created_at);
      return announcementDate.toDateString() === today.toDateString();
    }).length;

    return { unreadCount, urgentCount, pinnedCount, todayCount };
  }, [announcements]);

  const formatRelativeTime = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-xl text-gray-600">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Announcements 📢
          </h1>
          <p className="text-gray-600 text-lg">Stay updated with the latest news and notifications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Unread</p>
                <p className="text-3xl font-bold text-red-600">{stats.unreadCount}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Urgent</p>
                <p className="text-3xl font-bold text-orange-600">{stats.urgentCount}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Pinned</p>
                <p className="text-3xl font-bold text-indigo-600">{stats.pinnedCount}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Today</p>
                <p className="text-3xl font-bold text-green-600">{stats.todayCount}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="urgent">Urgent</option>
                <option value="academic">Academic</option>
                <option value="event">Events</option>
                <option value="deadline">Deadlines</option>
                <option value="maintenance">Maintenance</option>
                <option value="general">General</option>
              </select>

              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showUnreadOnly}
                  onChange={(e) => setShowUnreadOnly(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Unread only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">No announcements found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            filteredAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className={`bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-200 cursor-pointer ${
                  !announcement.read_status ? 'border-l-4 border-indigo-500' : ''
                }`}
                onClick={() => openAnnouncementModal(announcement)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {/* Pin indicator */}
                        {announcement.is_pinned && (
                          <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 5a2 2 0 012-2h6a2 2 0 012 2v16l-5-3-5 3V5z" />
                          </svg>
                        )}
                        
                        {/* Type badge */}
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(announcement.type)}`}>
                          <span className="mr-1">{getTypeIcon(announcement.type)}</span>
                          {announcement.type.toUpperCase()}
                        </span>
                        
                        {/* Priority indicator */}
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(announcement.priority)}`}></div>
                        
                        {/* Unread indicator */}
                        {!announcement.read_status && (
                          <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                        )}
                      </div>

                      <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-1">
                        {announcement.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {announcement.message}
                      </p>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>📝 {announcement.author}</span>
                          <span>🕒 {formatRelativeTime(announcement.created_at)}</span>
                          {announcement.attachments && announcement.attachments.length > 0 && (
                            <span className="flex items-center">
                              📎 {announcement.attachments.length} attachment{announcement.attachments.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        
                        {announcement.expires_at && (
                          <span className="text-orange-500">
                            🕒 Expires {formatRelativeTime(announcement.expires_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Announcement Detail Modal */}
        {isModalOpen && selectedAnnouncement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(selectedAnnouncement.type)}`}>
                      <span className="mr-1">{getTypeIcon(selectedAnnouncement.type)}</span>
                      {selectedAnnouncement.type.toUpperCase()}
                    </span>
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(selectedAnnouncement.priority)}`}></div>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {selectedAnnouncement.title}
                </h2>

                <div className="flex items-center space-x-6 text-sm text-gray-600 mb-6">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {selectedAnnouncement.author} ({selectedAnnouncement.author_role})
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(selectedAnnouncement.created_at).toLocaleString()}
                  </span>
                  {selectedAnnouncement.target_audience !== 'all' && (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Target: {selectedAnnouncement.target_audience}
                    </span>
                  )}
                </div>

                <div className="prose max-w-none mb-6">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {selectedAnnouncement.message}
                  </p>
                </div>

                {selectedAnnouncement.attachments && selectedAnnouncement.attachments.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Attachments</h3>
                    <div className="space-y-2">
                      {selectedAnnouncement.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <span className="font-medium text-gray-900">{attachment.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAnnouncement.expires_at && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-orange-800 font-medium">
                        This announcement expires on {new Date(selectedAnnouncement.expires_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedAnnouncementSystem;