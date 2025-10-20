import React, { useEffect, useMemo, useState } from 'react';
import { fetchTeacherTimetable, fetchStudentTimetable, fetchTimetableBySection, fetchTimetableViewSettingsBySection } from '../services/api';

interface TimetableEntry {
  day_of_week: string;
  start_time: string;
  end_time: string;
  course_name?: string;
  course_code?: string;
  teacher_name?: string;
  course_id?: number | string;
  room?: string;
  classroom?: string;
  class_type?: string;
  type?: 'lecture' | 'lab' | 'tutorial';
  section?: string;
}

interface StudentInfo {
  student_id: number;
  name: string;
  roll_number: string;
  department_id: number;
  section_id?: number;
  department?: { name: string };
  section?: { section_name: string; semester: number };
}

interface DaySchedule {
  day: string;
  entries: TimetableEntry[];
  totalClasses: number;
  totalHours: number;
}

interface WeekStats {
  totalClasses: number;
  totalHours: number;
  lectureCount: number;
  labCount: number;
  tutorialCount: number;
  busyDays: number;
}

const dayColumns = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const subjectColors = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-green-100 text-green-800 border-green-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-red-100 text-red-800 border-red-200',
  'bg-yellow-100 text-yellow-800 border-yellow-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-pink-100 text-pink-800 border-pink-200',
  'bg-gray-100 text-gray-800 border-gray-200',
];

const EnhancedMyTimetable: React.FC = () => {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDay, setSelectedDay] = useState<string>(
    dayColumns[new Date().getDay() - 1] || 'Monday'
  );
  const [colorMap, setColorMap] = useState<Record<string, string>>({});

  // View settings loaded from coordinator's saved settings
  const [gridView, setGridView] = useState(true);
  const [gridStart, setGridStart] = useState("08:00");
  const [gridEnd, setGridEnd] = useState("18:00");
  const [slotMinutes, setSlotMinutes] = useState(30);
  const [breakEnabled, setBreakEnabled] = useState(true);
  const [breakStart, setBreakStart] = useState("12:00");
  const [breakEnd, setBreakEnd] = useState("13:00");

  useEffect(() => {
    loadTimetableData();
  }, []);

  useEffect(() => {
    generateColorMap();
  }, [entries]);

  // Generate dynamic time slots based on grid settings
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    const startTime = new Date(`1970-01-01T${gridStart}:00`);
    const endTime = new Date(`1970-01-01T${gridEnd}:00`);
    
    let currentTime = new Date(startTime);
    
    while (currentTime <= endTime) {
      const timeString = currentTime.toTimeString().substring(0, 5);
      slots.push(timeString);
      currentTime.setMinutes(currentTime.getMinutes() + slotMinutes);
    }
    
    return slots;
  }, [gridStart, gridEnd, slotMinutes]);
  const loadCoordinatorViewSettings = async (sectionId: number) => {
    try {
      const settings = await fetchTimetableViewSettingsBySection(sectionId);
      
      if (settings) {
        setGridView(settings.gridView);
        setGridStart(settings.gridStart);
        setGridEnd(settings.gridEnd);
        setSlotMinutes(settings.slotMinutes);
        setBreakEnabled(settings.breakEnabled);
        setBreakStart(settings.breakStart);
        setBreakEnd(settings.breakEnd);
        console.log(`📂 Loaded coordinator view settings for section ${sectionId}:`, settings);
      } else {
        console.log(`🔧 Using default view settings for section ${sectionId}`);
      }
    } catch (error) {
      console.error('❌ Failed to load coordinator view settings, using defaults:', error);
    }
  };

  const loadTimetableData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const raw = localStorage.getItem('user');
      const user = raw ? JSON.parse(raw) : null;
      
      if (!user) {
        throw new Error('User not found. Please log in again.');
      }
      
      const role = user?.role;
      let data: any[] = [];
      
      if (role === 'teacher') {
        const id = user?.profile?.teacher_id || user?.user_id || user?.id;
        data = await fetchTeacherTimetable(String(id));
      } else {
        // For students, try multiple approaches to get timetable
        const studentId = user?.profile?.student_id || user?.user_id || user?.id;
        
        try {
          // First try student-specific timetable
          data = await fetchStudentTimetable(String(studentId));
        } catch (studentError) {
          console.log('Student-specific timetable not found, trying section-based...');
          
          // If that fails, try section-based timetable
          if (user?.profile?.section_id) {
            data = await fetchTimetableBySection(user.profile.section_id);
          } else {
            throw new Error('You are not enrolled in any section. Please contact your coordinator to get enrolled.');
          }
        }
        
        // Set student info for display
        const studentInfoData = {
          student_id: user?.profile?.student_id || user?.user_id,
          name: user?.profile?.name || user?.name,
          roll_number: user?.profile?.roll_number || 'N/A',
          department_id: user?.profile?.department_id,
          section_id: user?.profile?.section_id,
          department: user?.profile?.department,
          section: user?.profile?.section,
        };
        setStudentInfo(studentInfoData);

        // Load coordinator's view settings for this student's section
        if (user?.profile?.section_id) {
          await loadCoordinatorViewSettings(user.profile.section_id);
        }
      }
      
      const mapped: TimetableEntry[] = (Array.isArray(data) ? data : []).map((e: any) => {
        const classType = e.class_type?.toLowerCase();
        const type: 'lecture' | 'lab' | 'tutorial' = 
          classType === 'lab' ? 'lab' : 
          classType === 'tutorial' ? 'tutorial' : 'lecture';
        
        return {
          day_of_week: e.day_of_week || e.day,
          start_time: e.start_time,
          end_time: e.end_time,
          course_name: e.course?.course_name || e.course_name,
          course_code: e.course?.course_code || e.course_code,
          teacher_name: e.teacher?.name || e.teacher_name,
          course_id: e.course_id,
          room: e.classroom || e.room || 'TBA',
          classroom: e.classroom || e.room || 'TBA',
          class_type: e.class_type || 'Lecture',
          type,
          section: e.section?.section_name || user?.profile?.section?.section_name || 'N/A',
        };
      });
      
      setEntries(mapped);
    } catch (err: any) {
      setError(err?.message || 'Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const generateColorMap = () => {
    const uniqueCourses = Array.from(new Set(entries.map(e => e.course_code || e.course_name).filter(Boolean)));
    const newColorMap: Record<string, string> = {};
    
    uniqueCourses.forEach((course, index) => {
      newColorMap[course as string] = subjectColors[index % subjectColors.length];
    });
    
    setColorMap(newColorMap);
  };

  const groupedByDay = useMemo(() => {
    const grouped: Record<string, TimetableEntry[]> = {};
    
    dayColumns.forEach(day => {
      grouped[day] = entries.filter(entry => entry.day_of_week === day);
    });
    
    return grouped;
  }, [entries]);

  const daySchedules = useMemo((): DaySchedule[] => {
    return dayColumns.map(day => {
      const dayEntries = groupedByDay[day] || [];
      const totalHours = dayEntries.reduce((acc, entry) => {
        const start = new Date(`2000-01-01 ${entry.start_time}`);
        const end = new Date(`2000-01-01 ${entry.end_time}`);
        return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0);
      
      return {
        day,
        entries: dayEntries,
        totalClasses: dayEntries.length,
        totalHours: Math.round(totalHours * 10) / 10
      };
    });
  }, [groupedByDay]);

  const weekStats = useMemo((): WeekStats => {
    const totalClasses = entries.length;
    const totalHours = daySchedules.reduce((acc, day) => acc + day.totalHours, 0);
    const lectureCount = entries.filter(e => e.type === 'lecture').length;
    const labCount = entries.filter(e => e.type === 'lab').length;
    const tutorialCount = entries.filter(e => e.type === 'tutorial').length;
    const busyDays = daySchedules.filter(day => day.totalClasses > 0).length;

    return {
      totalClasses,
      totalHours: Math.round(totalHours * 10) / 10,
      lectureCount,
      labCount,
      tutorialCount,
      busyDays
    };
  }, [entries, daySchedules]);

  const getTimeSlotEntries = (day: string, timeSlot: string) => {
    const dayEntries = groupedByDay[day] || [];
    return dayEntries.filter(entry => {
      const startHour = parseInt(entry.start_time.split(':')[0]);
      const slotHour = parseInt(timeSlot.split(':')[0]);
      const endHour = parseInt(entry.end_time.split(':')[0]);
      return startHour <= slotHour && slotHour < endHour;
    });
  };

  // Check if a time slot is within break time
  const isBreakTime = (timeSlot: string) => {
    if (!breakEnabled) return false;
    
    const slotTime = new Date(`1970-01-01T${timeSlot}:00`);
    const breakStartTime = new Date(`1970-01-01T${breakStart}:00`);
    const breakEndTime = new Date(`1970-01-01T${breakEnd}:00`);
    
    return slotTime >= breakStartTime && slotTime < breakEndTime;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const minute = minutes || '00';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute} ${ampm}`;
  };

  const getCurrentTimeSlot = () => {
    const now = new Date();
    const currentHour = now.getHours();
    return `${currentHour.toString().padStart(2, '0')}:00`;
  };

  const isCurrentTime = (timeSlot: string, day: string) => {
    const today = dayColumns[new Date().getDay() - 1];
    const currentTimeSlot = getCurrentTimeSlot();
    return day === today && timeSlot === currentTimeSlot;
  };

  const getClassTypeIcon = (type?: string) => {
    switch (type) {
      case 'lab':
        return '🔬';
      case 'tutorial':
        return '📝';
      default:
        return '📚';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-xl text-gray-600">Loading your timetable...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading timetable</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
                <button 
                  onClick={loadTimetableData}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                My Timetable 📅
              </h1>
              <p className="text-gray-600 text-lg">Your weekly class schedule at a glance</p>
            </div>
            
            {/* Student Info Card */}
            {studentInfo && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {studentInfo.name?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{studentInfo.name}</h3>
                    <p className="text-sm text-gray-500">Roll: {studentInfo.roll_number}</p>
                    {studentInfo.section && (
                      <p className="text-sm text-blue-600">
                        Section: {studentInfo.section.section_name} | Semester: {studentInfo.section.semester}
                      </p>
                    )}
                    {studentInfo.department && (
                      <p className="text-sm text-gray-500">{studentInfo.department.name}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Classes</p>
                <p className="text-2xl font-bold text-blue-600">{weekStats.totalClasses}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Hours</p>
                <p className="text-2xl font-bold text-green-600">{weekStats.totalHours}h</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Lectures</p>
                <p className="text-2xl font-bold text-purple-600">{weekStats.lectureCount}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <span className="text-lg">📚</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Labs</p>
                <p className="text-2xl font-bold text-orange-600">{weekStats.labCount}</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-full">
                <span className="text-lg">🔬</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Tutorials</p>
                <p className="text-2xl font-bold text-indigo-600">{weekStats.tutorialCount}</p>
              </div>
              <div className="p-2 bg-indigo-100 rounded-full">
                <span className="text-lg">📝</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Busy Days</p>
                <p className="text-2xl font-bold text-red-600">{weekStats.busyDays}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-4">
              <div className="bg-gray-100 rounded-xl p-1">
                <div className="flex space-x-1">
                  {['week', 'day'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode as any)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 capitalize ${
                        viewMode === mode
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {mode} View
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Day Selector for Day View */}
            {viewMode === 'day' && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Select Day:</span>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {dayColumns.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Grid Settings Display (Read-only) */}
            <div className="flex items-center space-x-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              <span className="text-gray-500 font-medium">Grid Format:</span>
              <span>{formatTime(gridStart)} - {formatTime(gridEnd)}</span>
              <span>•</span>
              <span>{slotMinutes}min slots</span>
              {breakEnabled && (
                <>
                  <span>•</span>
                  <span>Break: {formatTime(breakStart)} - {formatTime(breakEnd)}</span>
                </>
              )}
            </div>

            {/* Current Time Indicator */}
            <div className="text-sm text-gray-500">
              Current time: {formatTime(getCurrentTimeSlot())}
            </div>
          </div>
        </div>

        {/* Timetable Content */}
        {viewMode === 'week' ? (
          /* Week View */
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Weekly Schedule</h3>
              
              {entries.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg">No classes scheduled</p>
                  <p className="text-sm text-gray-400 mt-1">Your timetable will appear here once classes are assigned</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="w-20 text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-3 bg-gray-50">
                          Time
                        </th>
                        {dayColumns.map(day => (
                          <th key={day} className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider p-3 bg-gray-50">
                            <div>{day}</div>
                            <div className="text-xs text-gray-400 font-normal mt-1">
                              {daySchedules.find(d => d.day === day)?.totalClasses || 0} classes
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map(timeSlot => (
                        <tr key={timeSlot} className={`border-t border-gray-200 ${
                          timeSlots.some(ts => dayColumns.some(day => isCurrentTime(ts, day) && ts === timeSlot))
                            ? 'bg-yellow-50'
                            : ''
                        }`}>
                          <td className="p-3 text-sm font-medium text-gray-900 bg-gray-50">
                            {formatTime(timeSlot)}
                          </td>
                          {dayColumns.map(day => {
                            const slotEntries = getTimeSlotEntries(day, timeSlot);
                            const isBreak = isBreakTime(timeSlot);
                            const isCurrent = isCurrentTime(timeSlot, day);
                            
                            return (
                              <td key={`${day}-${timeSlot}`} className={`p-2 border-l border-gray-200 ${
                                isCurrent ? 'bg-yellow-100' : 
                                isBreak ? 'bg-orange-50' : ''
                              }`}>
                                {isBreak ? (
                                  <div className="p-3 rounded-lg bg-orange-100 text-orange-800 border border-orange-200 text-xs text-center">
                                    <div className="font-semibold">🍽️ Break Time</div>
                                    <div className="text-xs opacity-75">
                                      {formatTime(breakStart)} - {formatTime(breakEnd)}
                                    </div>
                                  </div>
                                ) : (
                                  slotEntries.map((entry, idx) => (
                                  <div
                                    key={idx}
                                    className={`mb-1 p-3 rounded-lg border text-xs ${
                                      colorMap[entry.course_code || entry.course_name || ''] || subjectColors[0]
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-semibold">
                                        {getClassTypeIcon(entry.type)} {entry.course_code}
                                      </span>
                                      <span className="text-xs opacity-75">
                                        {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                                      </span>
                                    </div>
                                    <div className="font-medium line-clamp-1 mb-1">
                                      {entry.course_name}
                                    </div>
                                    {entry.teacher_name && (
                                      <div className="text-xs opacity-75 mb-1">
                                        👨‍🏫 {entry.teacher_name}
                                      </div>
                                    )}
                                    {entry.room && (
                                      <div className="text-xs opacity-75">
                                        📍 {entry.room}
                                      </div>
                                    )}
                                  </div>
                                  ))
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Day View */
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                {selectedDay} Schedule
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({daySchedules.find(d => d.day === selectedDay)?.totalClasses || 0} classes, {daySchedules.find(d => d.day === selectedDay)?.totalHours || 0}h)
                </span>
              </h3>
              
              {groupedByDay[selectedDay]?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg">No classes on {selectedDay}</p>
                  <p className="text-sm text-gray-400 mt-1">Enjoy your free day!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedByDay[selectedDay]?.sort((a, b) => a.start_time.localeCompare(b.start_time)).map((entry, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-xl p-6 ${
                        colorMap[entry.course_code || entry.course_name || ''] || subjectColors[0]
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className="text-2xl mr-3">{getClassTypeIcon(entry.type)}</span>
                            <div>
                              <h4 className="text-lg font-semibold">
                                {entry.course_name}
                              </h4>
                              <p className="text-sm opacity-75">
                                {entry.course_code} • {entry.type ? entry.type.charAt(0).toUpperCase() + entry.type.slice(1) : 'Class'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm">
                                {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                              </span>
                            </div>
                            
                            {entry.teacher_name && (
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="text-sm">{entry.teacher_name}</span>
                              </div>
                            )}
                            
                            {entry.room && (
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-sm">{entry.room}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                            entry.type === 'lecture' ? 'bg-blue-100 text-blue-800' :
                            entry.type === 'lab' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {entry.type}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        {entries.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Legend</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(colorMap).map(([course, colorClass]) => (
                <div key={course} className={`px-3 py-2 rounded-lg border text-sm font-medium ${colorClass}`}>
                  {course}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedMyTimetable;