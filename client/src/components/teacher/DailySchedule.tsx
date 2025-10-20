import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';
import { Clock, MapPin, Users, BookOpen, Calendar } from 'lucide-react';

interface ScheduleItem {
    id: number;
    time: string;
    course: string;
    courseCode: string;
    room: string;
    students: number;
    type: 'lecture' | 'lab' | 'tutorial';
}

const DailySchedule: React.FC = () => {
    const { theme } = useTheme();
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        // TODO: Fetch actual schedule from API
        setSchedule([
            { id: 1, time: '09:00 - 10:00', course: 'Data Structures', courseCode: 'CS201', room: 'Lab 301', students: 45, type: 'lab' },
            { id: 2, time: '10:00 - 11:00', course: 'Algorithms', courseCode: 'CS202', room: 'Room 205', students: 50, type: 'lecture' },
            { id: 3, time: '11:00 - 12:00', course: 'Database Systems', courseCode: 'CS301', room: 'Lab 401', students: 40, type: 'lab' },
            { id: 4, time: '14:00 - 15:00', course: 'Software Engineering', courseCode: 'CS401', room: 'Room 102', students: 55, type: 'lecture' },
            { id: 5, time: '15:00 - 16:00', course: 'Web Development', courseCode: 'CS302', room: 'Lab 201', students: 35, type: 'tutorial' },
        ]);

        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const getTypeStyle = (type: string) => {
        switch (type) {
            case 'lecture':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'lab':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'tutorial':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const isCurrentClass = (timeSlot: string) => {
        const [start] = timeSlot.split(' - ');
        const [hours, minutes] = start.split(':').map(Number);
        const classTime = new Date();
        classTime.setHours(hours, minutes, 0);
        
        const now = currentTime;
        const diff = classTime.getTime() - now.getTime();
        return diff > -60 * 60 * 1000 && diff < 0; // Current if within last hour
    };

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className={`text-3xl font-bold mb-2 ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                                <Calendar className="inline-block w-8 h-8 mr-3" />
                                Today's Schedule
                            </h1>
                            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        <div className={`px-6 py-3 rounded-xl ${
                            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                        } shadow-lg`}>
                            <p className={`text-sm font-medium ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                Current Time
                            </p>
                            <p className={`text-2xl font-bold ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Schedule List */}
                <div className="space-y-4">
                    {schedule.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-6 rounded-xl border ${
                                isCurrentClass(item.time)
                                    ? theme === 'dark'
                                        ? 'bg-blue-900/30 border-blue-700'
                                        : 'bg-blue-50 border-blue-300'
                                    : theme === 'dark'
                                    ? 'bg-gray-800 border-gray-700'
                                    : 'bg-white border-gray-200'
                            } shadow-lg hover:shadow-xl transition-all`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6 flex-1">
                                    {/* Time */}
                                    <div className={`flex items-center gap-2 ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        <Clock className="w-5 h-5" />
                                        <span className="font-semibold">{item.time}</span>
                                    </div>

                                    {/* Course Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className={`text-lg font-bold ${
                                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                                            }`}>
                                                {item.course}
                                            </h3>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                                                getTypeStyle(item.type)
                                            }`}>
                                                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-6 text-sm">
                                            <span className={`flex items-center gap-2 ${
                                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                                <BookOpen className="w-4 h-4" />
                                                {item.courseCode}
                                            </span>
                                            <span className={`flex items-center gap-2 ${
                                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                                <MapPin className="w-4 h-4" />
                                                {item.room}
                                            </span>
                                            <span className={`flex items-center gap-2 ${
                                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                                <Users className="w-4 h-4" />
                                                {item.students} students
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <button className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                                    isCurrentClass(item.time)
                                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                                        : theme === 'dark'
                                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}>
                                    {isCurrentClass(item.time) ? 'Take Attendance' : 'View Details'}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {schedule.length === 0 && (
                    <div className={`text-center py-16 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                        <Calendar className="w-20 h-20 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No classes scheduled for today</p>
                        <p className="text-sm">Enjoy your day off!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DailySchedule;
