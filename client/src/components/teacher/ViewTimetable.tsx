import React, { useEffect, useMemo, useState } from 'react';
import { fetchTeacherTimetable, fetchTimetableViewSettingsBySection } from '../../services/api';

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

const ViewTimetable: React.FC = () => {
    const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // View settings loaded from coordinator's saved settings
    const [gridView, setGridView] = useState(true);
    const [gridStart, setGridStart] = useState("08:00");
    const [gridEnd, setGridEnd] = useState("18:00");
    const [slotMinutes, setSlotMinutes] = useState(30);
    const [breakEnabled, setBreakEnabled] = useState(true);
    const [breakStart, setBreakStart] = useState("12:00");
    const [breakEnd, setBreakEnd] = useState("13:00");

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

    const loadCoordinatorViewSettings = async (teacherId: string) => {
        try {
            // For teachers, we'll try to load settings from any section they teach
            // For simplicity, we'll use default section 1 or try to get from first class
            const sectionId = 1; // You can enhance this to get actual section from teacher's classes
            const settings = await fetchTimetableViewSettingsBySection(sectionId);
            
            if (settings) {
                setGridView(settings.gridView);
                setGridStart(settings.gridStart);
                setGridEnd(settings.gridEnd);
                setSlotMinutes(settings.slotMinutes);
                setBreakEnabled(settings.breakEnabled);
                setBreakStart(settings.breakStart);
                setBreakEnd(settings.breakEnd);
                console.log(`📂 Loaded coordinator view settings for teacher ${teacherId}:`, settings);
            } else {
                console.log(`🔧 Using default view settings for teacher ${teacherId}`);
            }
        } catch (error) {
            console.error('❌ Failed to load coordinator view settings, using defaults:', error);
        }
    };

    useEffect(() => {
        const getTimetable = async () => {
            try {
                const rawUser = localStorage.getItem('user');
                const user = rawUser ? JSON.parse(rawUser) : null;
                const teacherId = user?.profile?.teacher_id || user?.user_id || user?.id;
                let data = [] as any[];
                
                if (teacherId) {
                    // Load coordinator view settings
                    await loadCoordinatorViewSettings(String(teacherId));
                    
                    data = await fetchTeacherTimetable(String(teacherId));
                    // API returns entries with includes; map to table-friendly rows
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
                } else {
                    // Fallback case - this section seems to be legacy code
                    const mappedAll = [].map((e: any) => ({
                        day_of_week: e.dayOfWeek || e.day_of_week,
                        course_name: e.courseId || e.course_name || 'Unknown Course',
                        course_code: e.course?.course_code ?? e.course_code ?? 'N/A',
                        start_time: e.startTime || e.start_time,
                        end_time: e.endTime || e.end_time,
                        schedule_id: e.id || e.schedule_id,
                        class_type: e.classType || e.class_type || 'Lecture',
                        classroom: e.classroom || 'TBA',
                        section: 'N/A',
                    }));
                    setTimetable(mappedAll);
                }
            } catch (err) {
                setError('Failed to fetch timetable');
            } finally {
                setLoading(false);
            }
        };

        getTimetable();
    }, []);

    // Helper function to get class type styling
    const getClassTypeStyle = (classType: string) => {
        switch (classType?.toLowerCase()) {
            case 'lecture':
                return {
                    bg: 'from-blue-500 to-blue-600',
                    text: 'text-blue-50',
                    icon: '🎓',
                    border: 'border-blue-200'
                };
            case 'lab':
                return {
                    bg: 'from-purple-500 to-purple-600',
                    text: 'text-purple-50',
                    icon: '🔬',
                    border: 'border-purple-200'
                };
            case 'tutorial':
                return {
                    bg: 'from-green-500 to-green-600',
                    text: 'text-green-50',
                    icon: '📚',
                    border: 'border-green-200'
                };
            default:
                return {
                    bg: 'from-gray-500 to-gray-600',
                    text: 'text-gray-50',
                    icon: '📝',
                    border: 'border-gray-200'
                };
        }
    };

    // Organize timetable by days
    const organizedTimetable = useMemo(() => {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return days.map(day => ({
            day,
            classes: timetable.filter(entry => entry.day_of_week === day)
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
        }));
    }, [timetable]);

    // Enhanced Loading Component
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center space-y-4">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin"></div>
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                    </div>
                    <p className="text-gray-600 font-medium">Loading your timetable...</p>
                </div>
            </div>
        );
    }

    // Enhanced Error Component
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4">
                    <div className="text-center">
                        <div className="text-6xl mb-4">😔</div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h3>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
            <style>{`
                .card-hover {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .card-hover:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                }
                .time-badge {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                .pulse-animation {
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.8; }
                }
            `}</style>
            
            {/* Enhanced Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                            📅 My Teaching Schedule
                        </h1>
                        <p className="text-gray-600 text-lg">
                            Your weekly class schedule at a glance
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {/* Stats Card */}
                        <div className="bg-white px-6 py-4 rounded-xl shadow-lg border border-gray-100">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{timetable.length}</div>
                                <div className="text-sm text-gray-500">Total Classes</div>
                            </div>
                        </div>
                        
                        {/* View Toggle */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-1 flex">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                    viewMode === 'grid'
                                        ? 'bg-blue-500 text-white shadow-lg'
                                        : 'text-gray-600 hover:text-blue-600'
                                }`}
                            >
                                📊 Grid View
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                    viewMode === 'list'
                                        ? 'bg-blue-500 text-white shadow-lg'
                                        : 'text-gray-600 hover:text-blue-600'
                                }`}
                            >
                                📋 List View
                            </button>
                        </div>
                    </div>
                </div>

                {/* View Settings Info Panel */}
                <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4 text-sm text-blue-800">
                            <span className="font-medium">📐 Grid Settings:</span>
                            <span>{gridStart} - {gridEnd}</span>
                            <span>{slotMinutes}min slots</span>
                            {breakEnabled && (
                                <span className="text-orange-600">
                                    🍽️ Break: {breakStart} - {breakEnd}
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                            📋 Coordinator View Settings Applied
                        </div>
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {timetable.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                    <div className="text-6xl mb-4">📚</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">No Classes Scheduled</h3>
                    <p className="text-gray-600">You don't have any classes scheduled at the moment.</p>
                </div>
            ) : (
                <>
                    {/* Enhanced Grid View with Time Slots */}
                    {viewMode === 'grid' && (
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-blue-600 to-blue-700">
                                            <th className="p-4 text-left text-white font-semibold min-w-[100px] sticky left-0 bg-blue-600">
                                                Time
                                            </th>
                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                                                <th key={day} className="p-4 text-center text-white font-semibold min-w-[200px]">
                                                    {day}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {timeSlots.map((timeSlot, index) => {
                                            const isBreakTime = breakEnabled && 
                                                timeSlot >= breakStart && timeSlot < breakEnd;
                                            
                                            return (
                                                <tr key={timeSlot} 
                                                    className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${
                                                        isBreakTime ? 'bg-orange-50' : ''
                                                    }`}>
                                                    <td className={`p-3 font-medium text-gray-700 sticky left-0 ${
                                                        isBreakTime ? 'bg-orange-50' : 'bg-gray-50'
                                                    } border-r border-gray-200`}>
                                                        <div className="flex items-center gap-2">
                                                            {isBreakTime && <span>🍽️</span>}
                                                            <span className={isBreakTime ? 'text-orange-700' : ''}>
                                                                {timeSlot}
                                                            </span>
                                                        </div>
                                                        {isBreakTime && (
                                                            <div className="text-xs text-orange-600 mt-1">
                                                                Break Time
                                                            </div>
                                                        )}
                                                    </td>
                                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                                                        const classForTimeSlot = timetable.find(entry => 
                                                            entry.day_of_week === day && 
                                                            entry.start_time <= timeSlot && 
                                                            entry.end_time > timeSlot
                                                        );

                                                        return (
                                                            <td key={`${day}-${timeSlot}`} 
                                                                className={`p-2 min-h-[60px] relative ${
                                                                    isBreakTime ? 'bg-orange-50' : ''
                                                                }`}>
                                                                {classForTimeSlot ? (
                                                                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-lg shadow-md">
                                                                        <div className="text-sm font-bold mb-1">
                                                                            {classForTimeSlot.course_name}
                                                                        </div>
                                                                        <div className="text-xs opacity-90 space-y-1">
                                                                            <div>📍 {classForTimeSlot.classroom}</div>
                                                                            <div>👥 {classForTimeSlot.section}</div>
                                                                            <div>📚 {classForTimeSlot.class_type}</div>
                                                                            <div>⏰ {classForTimeSlot.start_time} - {classForTimeSlot.end_time}</div>
                                                                        </div>
                                                                    </div>
                                                                ) : isBreakTime ? (
                                                                    <div className="flex items-center justify-center h-full text-orange-400">
                                                                        <span className="text-2xl">🍽️</span>
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

                    {/* Compact List View */}
                    {viewMode === 'list' && (
                        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                            {organizedTimetable.map(({ day, classes }) => (
                                <div key={day} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                                    <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white p-4 text-center">
                                        <h3 className="font-bold text-lg">{day}</h3>
                                        <p className="text-slate-200 text-sm">{classes.length} classes</p>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        {classes.length === 0 ? (
                                            <div className="text-center py-8 text-gray-400">
                                                <div className="text-2xl mb-2">😌</div>
                                                <p className="text-sm">No classes</p>
                                            </div>
                                        ) : (
                                            classes.map((classItem) => {
                                                const style = getClassTypeStyle(classItem.class_type || 'Lecture');
                                                return (
                                                    <div
                                                        key={classItem.schedule_id}
                                                        className={`card-hover rounded-xl p-4 bg-gradient-to-r ${style.bg} ${style.text} border-2 ${style.border}`}
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-lg">{style.icon}</span>
                                                            <div className="time-badge text-xs px-2 py-1 rounded-full text-white">
                                                                {classItem.start_time} - {classItem.end_time}
                                                            </div>
                                                        </div>
                                                        <h4 className="font-bold text-sm mb-1 line-clamp-2">
                                                            {classItem.course_name}
                                                        </h4>
                                                        <div className="text-xs opacity-90 space-y-1">
                                                            <div>📍 {classItem.classroom}</div>
                                                            <div>👥 Section: {classItem.section}</div>
                                                            <div>📚 {classItem.class_type}</div>
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
                </>
            )}
        </div>
    );
};

export default ViewTimetable;