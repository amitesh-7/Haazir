import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { 
    Calendar, 
    Users, 
    Clock, 
    TrendingUp, 
    BookOpen, 
    CheckCircle,
    AlertCircle,
    ArrowRight
} from 'lucide-react';

const Dashboard: React.FC = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [stats, setStats] = useState({
        todayClasses: 0,
        totalStudents: 0,
        attendanceRate: 0,
        upcomingClass: null as any
    });

    useEffect(() => {
        // Load dashboard stats
        // TODO: Replace with actual API calls
        setStats({
            todayClasses: 5,
            totalStudents: 150,
            attendanceRate: 87,
            upcomingClass: {
                name: 'Data Structures',
                time: '10:00 AM',
                room: 'Lab 301'
            }
        });
    }, []);

    const quickActions = [
        { icon: Calendar, label: 'Take Attendance', color: 'blue', path: '/teacher/attendance' },
        { icon: Users, label: 'View Students', color: 'green', path: '/teacher/students' },
        { icon: BookOpen, label: 'View Timetable', color: 'purple', path: '/teacher/timetable' },
        { icon: Clock, label: 'Attendance History', color: 'orange', path: '/teacher/history' },
    ];

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
            <div className="max-w-7xl mx-auto">
                {/* Welcome Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className={`text-3xl font-bold mb-2 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                        Welcome back, {user?.name || 'Teacher'}! 👋
                    </h1>
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        Here's your overview for today
                    </p>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: "Today's Classes", value: stats.todayClasses, icon: Calendar, color: 'blue' },
                        { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'green' },
                        { label: 'Attendance Rate', value: `${stats.attendanceRate}%`, icon: TrendingUp, color: 'purple' },
                        { label: 'Active Courses', value: 6, icon: BookOpen, color: 'orange' },
                    ].map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className={`p-6 rounded-xl border ${
                                    theme === 'dark'
                                        ? 'bg-gray-800 border-gray-700'
                                        : 'bg-white border-gray-200'
                                } shadow-lg hover:shadow-xl transition-shadow`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <Icon className={`w-8 h-8 text-${stat.color}-500`} />
                                    <span className={`text-3xl font-bold ${
                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        {stat.value}
                                    </span>
                                </div>
                                <p className={`text-sm font-medium ${
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                    {stat.label}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Upcoming Class */}
                {stats.upcomingClass && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-6 rounded-xl border mb-8 ${
                            theme === 'dark'
                                ? 'bg-blue-900/20 border-blue-800'
                                : 'bg-blue-50 border-blue-200'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Clock className="w-12 h-12 text-blue-500" />
                                <div>
                                    <h3 className={`text-lg font-bold ${
                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        Next Class: {stats.upcomingClass.name}
                                    </h3>
                                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                                        {stats.upcomingClass.time} • {stats.upcomingClass.room}
                                    </p>
                                </div>
                            </div>
                            <button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
                                Take Attendance
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Quick Actions */}
                <div className="mb-8">
                    <h2 className={`text-xl font-bold mb-4 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {quickActions.map((action, index) => {
                            const Icon = action.icon;
                            return (
                                <motion.button
                                    key={action.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`p-6 rounded-xl border text-left ${
                                        theme === 'dark'
                                            ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                                            : 'bg-white border-gray-200 hover:bg-gray-50'
                                    } transition-all group`}
                                >
                                    <Icon className={`w-10 h-10 text-${action.color}-500 mb-3 group-hover:scale-110 transition-transform`} />
                                    <p className={`font-semibold ${
                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        {action.label}
                                    </p>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`rounded-xl border ${
                        theme === 'dark'
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-white border-gray-200'
                    } p-6`}
                >
                    <h2 className={`text-xl font-bold mb-4 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                        Recent Activity
                    </h2>
                    <div className="space-y-4">
                        {[
                            { text: 'Attendance marked for CS101', time: '2 hours ago', icon: CheckCircle, color: 'green' },
                            { text: 'New assignment posted', time: '5 hours ago', icon: BookOpen, color: 'blue' },
                            { text: 'Student query resolved', time: 'Yesterday', icon: AlertCircle, color: 'orange' },
                        ].map((activity, index) => {
                            const Icon = activity.icon;
                            return (
                                <div
                                    key={index}
                                    className={`flex items-center gap-4 p-4 rounded-lg ${
                                        theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
                                    }`}
                                >
                                    <Icon className={`w-6 h-6 text-${activity.color}-500`} />
                                    <div className="flex-1">
                                        <p className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                                            {activity.text}
                                        </p>
                                        <p className={`text-sm ${
                                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                            {activity.time}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;