import React, { useState, useEffect } from 'react';
import { 
  getAttendanceDatesForTeacher, 
  getAttendanceHistory,
  getTeacherTimetableForAttendance 
} from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface AttendanceDate {
  date: string;
  total_records: number;
  present_count: number;
  absent_count: number;
  attendance_percentage: number;
}

interface CalendarDay {
  day: number;
  date: string;
  attendance?: AttendanceDate;
}

interface TimetableSlot {
  schedule_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  classroom: string;
  class_type: string;
  course: {
    course_id: number;
    course_name: string;
    course_code: string;
  };
}

interface AttendanceHistoryData {
  attendance_history: {
    [date: string]: {
      [scheduleId: string]: {
        timetable: TimetableSlot;
        students: Array<{
          student: {
            student_id: number;
            name: string;
            roll_number: string;
            email: string;
            department: {
              name: string;
            };
          };
          status: 'present' | 'absent';
          marked_at: string;
        }>;
        summary: {
          total: number;
          present: number;
          absent: number;
          percentage: number;
        };
      };
    };
  };
  teacher_timetable: TimetableSlot[];
}

const AttendanceHistoryCalendar: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [attendanceDates, setAttendanceDates] = useState<AttendanceDate[]>([]);
  const [historyData, setHistoryData] = useState<AttendanceHistoryData | null>(null);
  const [teacherTimetable, setTeacherTimetable] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Get current month's first and last day
  const getMonthRange = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0]
    };
  };

  // Load attendance dates for the current month
  const loadAttendanceDates = async (date: Date) => {
    if (!user?.teacherId && !user?.profile?.teacher_id) return;

    try {
      setLoading(true);
      const teacherId = user.teacherId || user.profile.teacher_id;
      const { start, end } = getMonthRange(date);
      
      const data = await getAttendanceDatesForTeacher(teacherId, start, end);
      setAttendanceDates(data.attendance_dates || []);
    } catch (error) {
      console.error('Error loading attendance dates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load teacher's timetable
  const loadTeacherTimetable = async () => {
    if (!user?.teacherId && !user?.profile?.teacher_id) return;

    try {
      const teacherId = user.teacherId || user.profile.teacher_id;
      const data = await getTeacherTimetableForAttendance(teacherId);
      setTeacherTimetable(data.timetable_slots || []);
    } catch (error) {
      console.error('Error loading teacher timetable:', error);
    }
  };

  // Load attendance history for selected date and class
  const loadAttendanceHistory = async () => {
    if (!selectedDate || !selectedClass || (!user?.teacherId && !user?.profile?.teacher_id)) return;

    try {
      setLoading(true);
      const teacherId = user.teacherId || user.profile.teacher_id;
      
      const data = await getAttendanceHistory(teacherId, selectedDate, selectedClass);
      setHistoryData(data);
      
      // Extract preview data for the selected date and class
      if (data.attendance_history[selectedDate] && data.attendance_history[selectedDate][selectedClass]) {
        setPreviewData(data.attendance_history[selectedDate][selectedClass]);
      } else {
        setPreviewData(null);
      }
    } catch (error) {
      console.error('Error loading attendance history:', error);
      setPreviewData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceDates(currentDate);
    loadTeacherTimetable();
  }, [currentDate, user]);

  useEffect(() => {
    if (selectedDate && selectedClass) {
      loadAttendanceHistory();
    }
  }, [selectedDate, selectedClass]);

  // Generate calendar days
  const generateCalendarDays = (): (CalendarDay | null)[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (CalendarDay | null)[] = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = new Date(year, month, day).toISOString().split('T')[0];
      const attendanceData = attendanceDates.find(d => d.date === dateStr);
      
      days.push({
        day,
        date: dateStr,
        attendance: attendanceData
      });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
    setSelectedDate('');
    setSelectedClass('');
    setPreviewData(null);
  };

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedClass('');
    setPreviewData(null);
  };

  const handleClassSelect = (scheduleId: string) => {
    setSelectedClass(scheduleId);
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Attendance History</h1>
        <p className="text-gray-600">View past attendance records by selecting a date and class</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          {/* Calendar Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-600"
              >
                ← Previous
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-600"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {weekDays.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays().map((dayData, index) => (
              <div key={index} className="h-16 border border-gray-100">
                {dayData && (
                  <button
                    onClick={() => handleDateSelect(dayData.date)}
                    className={`w-full h-full p-1 text-left hover:bg-blue-50 ${
                      selectedDate === dayData.date ? 'bg-blue-100 border-blue-300' : ''
                    } ${dayData.attendance ? 'cursor-pointer' : 'cursor-default opacity-50'}`}
                    disabled={!dayData.attendance}
                  >
                    <div className="text-sm font-medium">{dayData.day}</div>
                    {dayData.attendance && (
                      <div className={`text-xs px-1 py-0.5 rounded mt-1 ${getAttendanceColor(dayData.attendance.attendance_percentage)}`}>
                        {dayData.attendance.attendance_percentage.toFixed(0)}%
                      </div>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-100 rounded"></div>
              <span>Good (≥80%)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-100 rounded"></div>
              <span>Average (60-79%)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-100 rounded"></div>
              <span>Poor (&lt;60%)</span>
            </div>
          </div>
        </div>

        {/* Class Selection and Preview */}
        <div className="space-y-6">
          {/* Class Selection */}
          {selectedDate && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Select Class - {new Date(selectedDate).toLocaleDateString()}
              </h3>
              
              <div className="space-y-2">
                {teacherTimetable.map(slot => (
                  <button
                    key={slot.schedule_id}
                    onClick={() => handleClassSelect(slot.schedule_id.toString())}
                    className={`w-full text-left p-3 rounded-lg border ${
                      selectedClass === slot.schedule_id.toString()
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-800">{slot.course.course_name}</div>
                    <div className="text-sm text-gray-600">
                      {slot.start_time} - {slot.end_time} | {slot.classroom}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Attendance Preview */}
          {previewData && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance Preview</h3>
              
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-lg font-bold text-green-600">{previewData.summary.present}</div>
                  <div className="text-sm text-gray-600">Present</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <div className="text-lg font-bold text-red-600">{previewData.summary.absent}</div>
                  <div className="text-sm text-gray-600">Absent</div>
                </div>
              </div>

              <div className={`rounded-lg p-3 mb-4 ${getAttendanceColor(previewData.summary.percentage)}`}>
                <div className="text-lg font-bold">{previewData.summary.percentage.toFixed(1)}%</div>
                <div className="text-sm">Overall Attendance</div>
              </div>

              {/* Student List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {previewData.students.map((studentData: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium text-sm">{studentData.student.name}</div>
                      <div className="text-xs text-gray-500">{studentData.student.roll_number}</div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      studentData.status === 'present' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {studentData.status.charAt(0).toUpperCase() + studentData.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading attendance data...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistoryCalendar;