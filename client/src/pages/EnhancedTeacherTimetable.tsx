import React, { useEffect, useMemo, useState } from 'react';
import { fetchTeacherTimetable, fetchTimetableViewSettingsBySection } from '../services/api';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  BookOpen,
  Filter,
  Download,
  Share2,
  Bell,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  List,
  Zap,
  TrendingUp,
  Star,
  AlertCircle,
  CheckCircle,
  Coffee,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Search,
  RefreshCw,
} from 'lucide-react';

interface TimetableEntry {
  schedule_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  course_name: string;
  course_code: string;
  class_type: string;
  classroom: string;
  section: string;
}

interface ClassStats {
  totalClasses: number;
  lecturesCount: number;
  labsCount: number;
  tutorialsCount: number;
  busiestDay: string;
  avgClassesPerDay: number;
  totalHours: number;
}

const EnhancedTeacherTimetable: React.FC = () => {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline'>('list');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'lecture' | 'lab' | 'tutorial'>('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showStats, setShowStats] = useState(true);

  // View settings
  const [gridView, setGridView] = useState(true);
  const [gridStart, setGridStart] = useState("08:00");
  const [gridEnd, setGridEnd] = useState("18:00");
  const [slotMinutes, setSlotMinutes] = useState(30);
  const [breakEnabled, setBreakEnabled] = useState(true);
  const [breakStart, setBreakStart] = useState("12:00");
  const [breakEnd, setBreakEnd] = useState("13:00");

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    const startTime = new Date(`1970-01-01T${gridStart}:00`);
    const endTime = new Date(`1970-01-01T${gridEnd}:00`);
    let currentTime = new Date(startTime);
    
    while (currentTime <= endTime) {
      slots.push(currentTime.toTimeString().substring(0, 5));
      currentTime.setMinutes(currentTime.getMinutes() + slotMinutes);
    }
    
    return slots;
  }, [gridStart, gridEnd, slotMinutes]);

  // Calculate statistics
  const stats: ClassStats = useMemo(() => {
    const dayCount: { [key: string]: number } = {};
    let totalMinutes = 0;
    
    timetable.forEach(entry => {
      dayCount[entry.day_of_week] = (dayCount[entry.day_of_week] || 0) + 1;
      
      const [startHour, startMin] = entry.start_time.split(':').map(Number);
      const [endHour, endMin] = entry.end_time.split(':').map(Number);
      totalMinutes += (endHour * 60 + endMin) - (startHour * 60 + startMin);
    });

    const busiestDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
    
    return {
      totalClasses: timetable.length,
      lecturesCount: timetable.filter(e => e.class_type?.toLowerCase() === 'lecture').length,
      labsCount: timetable.filter(e => e.class_type?.toLowerCase() === 'lab').length,
      tutorialsCount: timetable.filter(e => e.class_type?.toLowerCase() === 'tutorial').length,
      busiestDay,
      avgClassesPerDay: timetable.length / 6,
      totalHours: totalMinutes / 60,
    };
  }, [timetable]);

  // Filter timetable
  const filteredTimetable = useMemo(() => {
    return timetable.filter(entry => {
      const matchesSearch = entry.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.classroom.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || entry.class_type?.toLowerCase() === filterType;
      const matchesDay = !selectedDay || entry.day_of_week === selectedDay;
      
      return matchesSearch && matchesType && matchesDay;
    });
  }, [timetable, searchQuery, filterType, selectedDay]);

  // Organize by day
  const organizedTimetable = useMemo(() => {
    return days.map(day => ({
      day,
      classes: filteredTimetable
        .filter(entry => entry.day_of_week === day)
        .sort((a, b) => a.start_time.localeCompare(b.start_time))
    }));
  }, [filteredTimetable]);

  // Get current class
  const getCurrentClass = () => {
    const now = currentTime.toTimeString().substring(0, 5);
    const today = days[currentTime.getDay() - 1];
    
    return timetable.find(entry => 
      entry.day_of_week === today &&
      entry.start_time <= now &&
      entry.end_time > now
    );
  };

  // Get next class
  const getNextClass = () => {
    const now = currentTime.toTimeString().substring(0, 5);
    const today = days[currentTime.getDay() - 1];
    
    return timetable
      .filter(entry => entry.day_of_week === today && entry.start_time > now)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))[0];
  };

  // Get time period
  const getTimePeriod = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return { icon: Sunrise, label: 'Morning', color: 'text-amber-500' };
    if (hour < 17) return { icon: Sun, label: 'Afternoon', color: 'text-orange-500' };
    if (hour < 20) return { icon: Sunset, label: 'Evening', color: 'text-purple-500' };
    return { icon: Moon, label: 'Night', color: 'text-indigo-500' };
  };

  // Class type styling
  const getClassTypeStyle = (classType: string) => {
    const type = classType?.toLowerCase() || 'lecture';
    const styles = {
      lecture: {
        gradient: 'from-blue-500 via-blue-600 to-indigo-600',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-300',
        icon: '🎓',
        glow: 'shadow-blue-500/50',
      },
      lab: {
        gradient: 'from-purple-500 via-purple-600 to-pink-600',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-300',
        icon: '🔬',
        glow: 'shadow-purple-500/50',
      },
      tutorial: {
        gradient: 'from-green-500 via-emerald-600 to-teal-600',
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-300',
        icon: '📚',
        glow: 'shadow-green-500/50',
      },
    };
    return styles[type as keyof typeof styles] || styles.lecture;
  };

  // Load data
  const loadCoordinatorViewSettings = async (teacherId: string) => {
    try {
      const sectionId = 1;
      const settings = await fetchTimetableViewSettingsBySection(sectionId);
      
      if (settings) {
        setGridView(settings.gridView);
        setGridStart(settings.gridStart);
        setGridEnd(settings.gridEnd);
        setSlotMinutes(settings.slotMinutes);
        setBreakEnabled(settings.breakEnabled);
        setBreakStart(settings.breakStart);
        setBreakEnd(settings.breakEnd);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  useEffect(() => {
    const getTimetable = async () => {
      try {
        const rawUser = localStorage.getItem('user');
        const user = rawUser ? JSON.parse(rawUser) : null;
        const teacherId = user?.profile?.teacher_id || user?.user_id || user?.id;
        
        if (teacherId) {
          await loadCoordinatorViewSettings(String(teacherId));
          const data = await fetchTeacherTimetable(String(teacherId));
          
          const mapped = (Array.isArray(data) ? data : []).map((e: any) => ({
            day_of_week: e.day_of_week,
            course_name: e.course?.course_name ?? e.course_name ?? 'Unknown Course',
            course_code: e.course?.course_code ?? e.course_code ?? 'N/A',
            start_time: e.start_time,
            end_time: e.end_time,
            schedule_id: e.schedule_id ?? e.id,
            class_type: e.class_type || 'Lecture',
            classroom: e.classroom || 'TBA',
            section: e.section?.section_name || e.section_id || 'N/A',
          }));
          
          setTimetable(mapped);
        }
      } catch (err) {
        setError('Failed to fetch timetable');
      } finally {
        setLoading(false);
      }
    };

    getTimetable();
  }, []);

  const currentClass = getCurrentClass();
  const nextClass = getNextClass();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md mx-4">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-8 border-indigo-200 rounded-full animate-spin"></div>
              <div className="w-20 h-20 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              <Calendar className="w-8 h-8 text-indigo-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Loading Schedule</h3>
              <p className="text-gray-600">Fetching your timetable data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md">
          <div className="text-center">
            <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <h3 className="text-3xl font-bold text-gray-800 mb-4">Oops!</h3>
            <p className="text-gray-600 mb-8">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <RefreshCw className="w-5 h-5 inline mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      {/* Enhanced Header with Live Status */}
      <div className="mb-8">
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-purple-100">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex-1 min-w-[300px]">
              <h1 className="text-4xl md:text-5xl font-black mb-3">
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  📅 My Teaching Schedule
                </span>
              </h1>
              <p className="text-gray-600 text-lg">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span className="text-xl font-semibold text-purple-600">
                  {currentTime.toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Current Class Status */}
            {currentClass ? (
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-6 h-6 animate-pulse" />
                  <span className="font-bold text-lg">ONGOING NOW</span>
                </div>
                <h3 className="text-2xl font-bold mb-1">{currentClass.course_name}</h3>
                <div className="space-y-1 text-sm opacity-90">
                  <div>📍 {currentClass.classroom}</div>
                  <div>⏰ {currentClass.start_time} - {currentClass.end_time}</div>
                </div>
              </div>
            ) : nextClass ? (
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Bell className="w-6 h-6" />
                  <span className="font-bold text-lg">NEXT CLASS</span>
                </div>
                <h3 className="text-2xl font-bold mb-1">{nextClass.course_name}</h3>
                <div className="space-y-1 text-sm opacity-90">
                  <div>📍 {nextClass.classroom}</div>
                  <div>⏰ {nextClass.start_time} - {nextClass.end_time}</div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-6 h-6" />
                  <span className="font-bold text-lg">NO MORE CLASSES</span>
                </div>
                <p className="text-lg">Enjoy your free time! 🎉</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
            <BookOpen className="w-8 h-8 mb-3 opacity-80" />
            <div className="text-4xl font-bold mb-2">{stats.totalClasses}</div>
            <div className="text-blue-100">Total Classes</div>
            <div className="text-sm mt-2 opacity-80">{stats.totalHours.toFixed(1)} hours/week</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
            <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
            <div className="text-4xl font-bold mb-2">{stats.busiestDay}</div>
            <div className="text-purple-100">Busiest Day</div>
            <div className="text-sm mt-2 opacity-80">{stats.avgClassesPerDay.toFixed(1)} avg/day</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
            <Star className="w-8 h-8 mb-3 opacity-80" />
            <div className="text-4xl font-bold mb-2">{stats.lecturesCount}</div>
            <div className="text-green-100">Lectures</div>
            <div className="text-sm mt-2 opacity-80">{stats.labsCount} Labs • {stats.tutorialsCount} Tutorials</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-xl">
            <Coffee className="w-8 h-8 mb-3 opacity-80" />
            <div className="text-4xl font-bold mb-2">{breakEnabled ? 'Yes' : 'No'}</div>
            <div className="text-orange-100">Break Time</div>
            {breakEnabled && (
              <div className="text-sm mt-2 opacity-80">{breakStart} - {breakEnd}</div>
            )}
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="bg-white rounded-3xl shadow-xl p-6 mb-8 border border-purple-100">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search courses, rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
              />
            </div>
          </div>

          {/* Filter Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-medium"
          >
            <option value="all">All Types</option>
            <option value="lecture">🎓 Lectures</option>
            <option value="lab">🔬 Labs</option>
            <option value="tutorial">📚 Tutorials</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                viewMode === 'timeline'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Timeline
            </button>
          </div>

          {/* Action Buttons */}
          <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Day Filter */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedDay(null)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              !selectedDay
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Days
          </button>
          {days.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedDay === day
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {day.substring(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredTimetable.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-16 text-center">
          <Calendar className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h3 className="text-3xl font-bold text-gray-800 mb-4">No Classes Found</h3>
          <p className="text-gray-600 text-lg">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <>
          {/* Enhanced Grid View */}
          {viewMode === 'grid' && (
            <div className="bg-white rounded-3xl shadow-xl border border-purple-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                      <th className="p-4 text-left text-white font-bold min-w-[120px] sticky left-0 bg-gradient-to-r from-indigo-600 to-purple-600">
                        <Clock className="w-5 h-5 inline mr-2" />
                        Time
                      </th>
                      {days.map(day => (
                        <th key={day} className="p-4 text-center text-white font-bold min-w-[220px]">
                          <div>{day}</div>
                          <div className="text-xs opacity-80 mt-1">
                            {organizedTimetable.find(d => d.day === day)?.classes.length || 0} classes
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map(timeSlot => {
                      const isBreakTime = breakEnabled && timeSlot >= breakStart && timeSlot < breakEnd;
                      const timePeriod = getTimePeriod(timeSlot);
                      
                      return (
                        <tr key={timeSlot} className={`border-b border-gray-100 transition-all hover:bg-purple-50 ${
                          isBreakTime ? 'bg-orange-50' : ''
                        }`}>
                          <td className={`p-4 font-semibold sticky left-0 ${
                            isBreakTime ? 'bg-orange-100' : 'bg-gray-50'
                          } border-r border-gray-200`}>
                            <div className="flex items-center gap-2">
                              {isBreakTime ? (
                                <Coffee className="w-5 h-5 text-orange-600" />
                              ) : (
                                <timePeriod.icon className={`w-5 h-5 ${timePeriod.color}`} />
                              )}
                              <span className={isBreakTime ? 'text-orange-700' : 'text-gray-700'}>
                                {timeSlot}
                              </span>
                            </div>
                            {isBreakTime && (
                              <div className="text-xs text-orange-600 mt-1 font-medium">
                                Break Time 🍽️
                              </div>
                            )}
                          </td>
                          {days.map(day => {
                            const classForTimeSlot = filteredTimetable.find(entry => 
                              entry.day_of_week === day && 
                              entry.start_time <= timeSlot && 
                              entry.end_time > timeSlot
                            );

                            return (
                              <td key={`${day}-${timeSlot}`} className={`p-2 min-h-[80px] relative ${
                                isBreakTime ? 'bg-orange-50' : ''
                              }`}>
                                {classForTimeSlot ? (
                                  <div className={`bg-gradient-to-br ${getClassTypeStyle(classForTimeSlot.class_type).gradient} text-white p-4 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-200 cursor-pointer`}>
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-2xl">{getClassTypeStyle(classForTimeSlot.class_type).icon}</span>
                                      <span className="text-xs bg-white/30 px-2 py-1 rounded-full font-medium">
                                        {classForTimeSlot.class_type}
                                      </span>
                                    </div>
                                    <h4 className="font-bold text-sm mb-2 line-clamp-2">
                                      {classForTimeSlot.course_name}
                                    </h4>
                                    <div className="text-xs space-y-1 opacity-90">
                                      <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {classForTimeSlot.classroom}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        Section {classForTimeSlot.section}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {classForTimeSlot.start_time} - {classForTimeSlot.end_time}
                                      </div>
                                    </div>
                                  </div>
                                ) : isBreakTime ? (
                                  <div className="flex items-center justify-center h-full">
                                    <Coffee className="w-8 h-8 text-orange-300" />
                                  </div>
                                ) : null}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Enhanced List View */}
          {viewMode === 'list' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {organizedTimetable.map(({ day, classes }) => (
                <div key={day} className="bg-white rounded-3xl shadow-xl border border-purple-100 overflow-hidden transform hover:scale-105 transition-all duration-300">
                  <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold mb-1">{day}</h3>
                        <p className="text-purple-100">{classes.length} classes scheduled</p>
                      </div>
                      <Calendar className="w-10 h-10 opacity-50" />
                    </div>
                  </div>
                  <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
                    {classes.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg font-medium">No classes today</p>
                        <p className="text-gray-400 text-sm mt-2">Enjoy your free day! 🎉</p>
                      </div>
                    ) : (
                      classes.map(classItem => {
                        const style = getClassTypeStyle(classItem.class_type);
                        const period = getTimePeriod(classItem.start_time);
                        
                        return (
                          <div
                            key={classItem.schedule_id}
                            className={`rounded-2xl p-5 bg-gradient-to-br ${style.gradient} text-white shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-200 cursor-pointer`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <span className="text-3xl">{style.icon}</span>
                              <div className="text-right">
                                <div className="bg-white/30 px-3 py-1 rounded-full text-xs font-bold mb-1">
                                  {classItem.class_type}
                                </div>
                                <div className="flex items-center gap-1 text-xs opacity-90">
                                  <period.icon className="w-3 h-3" />
                                  {period.label}
                                </div>
                              </div>
                            </div>
                            <h4 className="text-xl font-bold mb-1 line-clamp-2">
                              {classItem.course_name}
                            </h4>
                            <p className="text-sm opacity-90 mb-3">{classItem.course_code}</p>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2 bg-white/20 rounded-lg p-2">
                                <Clock className="w-4 h-4" />
                                <span>{classItem.start_time}</span>
                              </div>
                              <div className="flex items-center gap-2 bg-white/20 rounded-lg p-2">
                                <Clock className="w-4 h-4" />
                                <span>{classItem.end_time}</span>
                              </div>
                              <div className="flex items-center gap-2 bg-white/20 rounded-lg p-2">
                                <MapPin className="w-4 h-4" />
                                <span>{classItem.classroom}</span>
                              </div>
                              <div className="flex items-center gap-2 bg-white/20 rounded-lg p-2">
                                <Users className="w-4 h-4" />
                                <span>{classItem.section}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Timeline View */}
          {viewMode === 'timeline' && (
            <div className="space-y-6">
              {organizedTimetable.map(({ day, classes }) => (
                <div key={day} className="bg-white rounded-3xl shadow-xl p-8 border border-purple-100">
                  <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {day}
                  </h2>
                  {classes.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3" />
                      <p>No classes scheduled</p>
                    </div>
                  ) : (
                    <div className="relative pl-8 border-l-4 border-purple-200 space-y-8">
                      {classes.map((classItem, index) => {
                        const style = getClassTypeStyle(classItem.class_type);
                        const period = getTimePeriod(classItem.start_time);
                        
                        return (
                          <div key={classItem.schedule_id} className="relative">
                            <div className={`absolute -left-[42px] w-8 h-8 rounded-full bg-gradient-to-br ${style.gradient} flex items-center justify-center text-white shadow-lg`}>
                              {index + 1}
                            </div>
                            <div className={`bg-gradient-to-br ${style.gradient} text-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-200`}>
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <span className="text-4xl">{style.icon}</span>
                                  <div>
                                    <h3 className="text-2xl font-bold">{classItem.course_name}</h3>
                                    <p className="text-sm opacity-90">{classItem.course_code}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="bg-white/30 px-3 py-1 rounded-full text-sm font-bold">
                                    {classItem.class_type}
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white/20 rounded-xl p-3">
                                  <Clock className="w-5 h-5 mb-2" />
                                  <div className="text-xs opacity-80">Start Time</div>
                                  <div className="font-bold">{classItem.start_time}</div>
                                </div>
                                <div className="bg-white/20 rounded-xl p-3">
                                  <Clock className="w-5 h-5 mb-2" />
                                  <div className="text-xs opacity-80">End Time</div>
                                  <div className="font-bold">{classItem.end_time}</div>
                                </div>
                                <div className="bg-white/20 rounded-xl p-3">
                                  <MapPin className="w-5 h-5 mb-2" />
                                  <div className="text-xs opacity-80">Classroom</div>
                                  <div className="font-bold">{classItem.classroom}</div>
                                </div>
                                <div className="bg-white/20 rounded-xl p-3">
                                  <Users className="w-5 h-5 mb-2" />
                                  <div className="text-xs opacity-80">Section</div>
                                  <div className="font-bold">{classItem.section}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EnhancedTeacherTimetable;
