import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';
import { api, fetchRosterForSchedule, submitAttendanceBulk } from '../../services/api';
import { 
    Calendar, 
    Clock, 
    MapPin, 
    Users, 
    CheckCircle, 
    XCircle, 
    Search,
    ChevronLeft,
    Save,
    UserCheck,
    UserX,
    BookOpen,
    Loader
} from 'lucide-react';

interface Student {
    student_id: number;
    name: string;
    roll_number: string;
    status: 'present' | 'absent' | null;
}

interface ClassInfo {
    id: number;
    name: string;
    course_code: string;
    course_name: string;
    time_slot: string;
    classroom: string;
    date: string;
}

const TakeAttendance: React.FC = () => {
    const { theme } = useTheme();
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
    const [attendance, setAttendance] = useState<{ [key: number]: 'present' | 'absent' }>({});
    const [roster, setRoster] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    useEffect(() => {
        loadTodaysClasses();
    }, []);

    const loadTodaysClasses = async () => {
        try {
            const raw = localStorage.getItem('user');
            const parsed = raw ? JSON.parse(raw) : null;
            const teacherId = parsed?.profile?.teacher_id || parsed?.teacher_id || null;
            if (!teacherId) return;
            
            const { data } = await api.get(`/timetable/teacher/${teacherId}/today`);
            const formattedClasses: ClassInfo[] = data.map((e: any) => ({
                id: e.schedule_id,
                name: `${e.course?.course_code ?? ''} ${e.course?.course_name ?? ''}`.trim(),
                course_code: e.course?.course_code || '',
                course_name: e.course?.course_name || '',
                time_slot: e.time_slot || '',
                classroom: e.classroom || 'TBA',
                date: new Date().toISOString().split('T')[0]
            }));
            setClasses(formattedClasses);
        } catch (error) {
            console.error('Error loading classes:', error);
        }
    };

    const handleClassSelect = async (classInfo: ClassInfo) => {
        setSelectedClass(classInfo);
        setAttendance({});
        setRoster([]);
        
        setLoading(true);
        try {
            const data = await fetchRosterForSchedule(classInfo.id, classInfo.date);
            setRoster(data.roster || []);
            
            // Initialize attendance from existing records
            const initial: { [key: number]: 'present' | 'absent' } = {};
            (data.roster || []).forEach((s: any) => {
                if (s.status) {
                    initial[s.student_id] = s.status as 'present' | 'absent';
                }
            });
            setAttendance(initial);
        } catch (e) {
            console.error('Failed to load roster', e);
        } finally {
            setLoading(false);
        }
    };

    const markAttendance = (studentId: number, status: 'present' | 'absent') => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSubmit = async () => {
        if (!selectedClass) return;
        
        setSubmitting(true);
        try {
            const items = Object.entries(attendance).map(([studentId, status]) => ({
                scheduleId: selectedClass.id,
                studentId: parseInt(studentId),
                date: selectedClass.date,
                status
            }));
            
            await submitAttendanceBulk(items);
            alert('Attendance submitted successfully!');
            
            // Reset
            setSelectedClass(null);
            setAttendance({});
            setRoster([]);
            setSearchQuery('');
            
        } catch (error) {
            console.error('Failed to submit attendance:', error);
            alert('Failed to submit attendance. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const markAllPresent = () => {
        const newAttendance: { [key: number]: 'present' | 'absent' } = {};
        filteredRoster.forEach(student => {
            newAttendance[student.student_id] = 'present';
        });
        setAttendance(prev => ({ ...prev, ...newAttendance }));
    };

    const markAllAbsent = () => {
        const newAttendance: { [key: number]: 'present' | 'absent' } = {};
        filteredRoster.forEach(student => {
            newAttendance[student.student_id] = 'absent';
        });
        setAttendance(prev => ({ ...prev, ...newAttendance }));
    };

    const filteredRoster = roster.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const presentCount = Object.values(attendance).filter(s => s === 'present').length;
    const absentCount = Object.values(attendance).filter(s => s === 'absent').length;
    const unmarkedCount = roster.length - Object.keys(attendance).length;

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className={`text-3xl font-bold mb-2 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                        <Users className="inline-block w-8 h-8 mr-3" />
                        Take Attendance
                    </h1>
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        Mark attendance for your classes today
                    </p>
                </motion.div>
                
                <AnimatePresence mode="wait">
                    {!selectedClass ? (
                        /* Class Selection View */
                        <motion.div
                            key="class-selection"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className={`rounded-xl border ${
                                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                            } shadow-lg overflow-hidden`}>
                                <div className={`border-b p-6 ${
                                    theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                                }`}>
                                    <h2 className={`text-xl font-semibold ${
                                        theme === 'dark' ? 'text-white' : 'text-gray-800'
                                    }`}>
                                        Select a Class
                                    </h2>
                                </div>
                                
                                <div className="p-6">
                                    {classes.length === 0 ? (
                                        <div className={`text-center py-16 ${
                                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                        }`}>
                                            <Calendar className="w-20 h-20 mx-auto mb-4 opacity-50" />
                                            <p className="text-lg font-medium">No classes scheduled for today</p>
                                            <p className="text-sm mt-2">Check back later or contact your coordinator</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {classes.map((cls, index) => (
                                                <motion.div
                                                    key={cls.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    onClick={() => handleClassSelect(cls)}
                                                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                                                        theme === 'dark'
                                                            ? 'border-gray-700 hover:border-blue-500 hover:bg-gray-700'
                                                            : 'border-gray-200 hover:border-blue-500 hover:shadow-lg'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <BookOpen className={`w-8 h-8 ${
                                                            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                                                        }`} />
                                                    </div>
                                                    <div className={`font-bold text-lg mb-1 ${
                                                        theme === 'dark' ? 'text-white' : 'text-gray-800'
                                                    }`}>
                                                        {cls.course_code}
                                                    </div>
                                                    <div className={`text-sm mb-4 ${
                                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                                    }`}>
                                                        {cls.course_name}
                                                    </div>
                                                    <div className={`space-y-2 text-sm ${
                                                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                                    }`}>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4" />
                                                            {cls.time_slot}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="w-4 h-4" />
                                                            {cls.classroom}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        /* Attendance Marking View */
                        <motion.div
                            key="attendance-marking"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* Selected Class Header */}
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`mb-6 p-6 rounded-xl border ${
                                    theme === 'dark'
                                        ? 'bg-blue-900/30 border-blue-800'
                                        : 'bg-blue-50 border-blue-200'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className={`text-2xl font-bold ${
                                            theme === 'dark' ? 'text-blue-300' : 'text-blue-800'
                                        }`}>
                                            {selectedClass.course_code} - {selectedClass.course_name}
                                        </h2>
                                        <div className={`flex items-center gap-4 mt-2 text-sm ${
                                            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                                        }`}>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {selectedClass.time_slot}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {selectedClass.classroom}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedClass(null);
                                            setSearchQuery('');
                                        }}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                            theme === 'dark'
                                                ? 'text-blue-300 hover:bg-blue-900/50'
                                                : 'text-blue-600 hover:bg-blue-100'
                                        }`}
                                    >
                                        <ChevronLeft className="inline-block w-5 h-5 mr-1" />
                                        Change Class
                                    </button>
                                </div>
                            </motion.div>

                            {loading ? (
                                <div className={`text-center py-16 rounded-xl border ${
                                    theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                }`}>
                                    <Loader className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
                                    <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                                        Loading student roster...
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Stats & Quick Actions */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={`p-4 rounded-xl border ${
                                                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        Total Students
                                                    </p>
                                                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                        {roster.length}
                                                    </p>
                                                </div>
                                                <Users className={`w-8 h-8 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.1 }}
                                            className={`p-4 rounded-xl border ${
                                                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        Present
                                                    </p>
                                                    <p className="text-2xl font-bold text-green-600">
                                                        {presentCount}
                                                    </p>
                                                </div>
                                                <UserCheck className="w-8 h-8 text-green-600" />
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className={`p-4 rounded-xl border ${
                                                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        Absent
                                                    </p>
                                                    <p className="text-2xl font-bold text-red-600">
                                                        {absentCount}
                                                    </p>
                                                </div>
                                                <UserX className="w-8 h-8 text-red-600" />
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className={`p-4 rounded-xl border ${
                                                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        Unmarked
                                                    </p>
                                                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
                                                        {unmarkedCount}
                                                    </p>
                                                </div>
                                                <Clock className={`w-8 h-8 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`} />
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* Search & Quick Actions */}
                                    <div className={`p-6 rounded-xl border ${
                                        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                    }`}>
                                        <div className="flex flex-col md:flex-row gap-4 items-center">
                                            <div className="flex-1 relative">
                                                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                                }`} />
                                                <input
                                                    type="text"
                                                    placeholder="Search by name or roll number..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                                                        theme === 'dark'
                                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                                            : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                                                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={markAllPresent}
                                                    className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 transition-colors"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                    Mark All Present
                                                </button>
                                                <button
                                                    onClick={markAllAbsent}
                                                    className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2 transition-colors"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                    Mark All Absent
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Student Roster */}
                                    <div className={`rounded-xl border ${
                                        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                    } overflow-hidden`}>
                                        <div className="space-y-1 p-4">
                                            {filteredRoster.map((student, index) => (
                                                <motion.div
                                                    key={student.student_id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.03 }}
                                                    className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                                                        theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <div className="flex items-center flex-1">
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold mr-4 ${
                                                            attendance[student.student_id] === 'present'
                                                                ? 'bg-green-100 text-green-700'
                                                                : attendance[student.student_id] === 'absent'
                                                                ? 'bg-red-100 text-red-700'
                                                                : theme === 'dark'
                                                                ? 'bg-gray-700 text-gray-300'
                                                                : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <div className={`font-medium ${
                                                                theme === 'dark' ? 'text-white' : 'text-gray-800'
                                                            }`}>
                                                                {student.name}
                                                            </div>
                                                            <div className={`text-sm ${
                                                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                                            }`}>
                                                                Roll: {student.roll_number}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => markAttendance(student.student_id, 'present')}
                                                            className={`px-6 py-2 rounded-lg font-medium transition-all ${
                                                                attendance[student.student_id] === 'present'
                                                                    ? 'bg-green-600 text-white shadow-lg scale-105'
                                                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                            }`}
                                                        >
                                                            <CheckCircle className="inline-block w-5 h-5 mr-1" />
                                                            Present
                                                        </button>
                                                        <button
                                                            onClick={() => markAttendance(student.student_id, 'absent')}
                                                            className={`px-6 py-2 rounded-lg font-medium transition-all ${
                                                                attendance[student.student_id] === 'absent'
                                                                    ? 'bg-red-600 text-white shadow-lg scale-105'
                                                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                            }`}
                                                        >
                                                            <XCircle className="inline-block w-5 h-5 mr-1" />
                                                            Absent
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {filteredRoster.length === 0 && (
                                            <div className={`text-center py-12 ${
                                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                            }`}>
                                                <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                                <p>No students found matching your search</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    {Object.keys(attendance).length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex items-center justify-between p-6 rounded-xl border ${
                                                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                            }`}
                                        >
                                            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                <span className="font-semibold text-lg">{Object.keys(attendance).length}</span> / {roster.length} students marked
                                            </div>
                                            <button
                                                onClick={handleSubmit}
                                                disabled={submitting}
                                                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
                                            >
                                                {submitting ? (
                                                    <>
                                                        <Loader className="w-5 h-5 animate-spin" />
                                                        Submitting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-5 h-5" />
                                                        Submit Attendance
                                                    </>
                                                )}
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default TakeAttendance;
