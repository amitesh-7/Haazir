import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';
import { fetchAttendanceHistory } from '../../services/api';
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface AttendanceRecord {
    attendance_id: number;
    date: string;
    status: 'present' | 'absent' | 'late';
    course_name: string;
    course_code?: string;
}

const AttendanceHistory: React.FC = () => {
    const { theme } = useTheme();
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<'all' | 'present' | 'absent' | 'late'>('all');

    useEffect(() => {
        const getAttendanceHistory = async () => {
            try {
                const studentId = localStorage.getItem('studentId');
                if (!studentId) {
                    setError('No student selected for history');
                    return;
                }
                const data = await fetchAttendanceHistory(studentId);
                setAttendanceRecords(data);
            } catch (err) {
                setError('Failed to fetch attendance history');
            } finally {
                setLoading(false);
            }
        };

        getAttendanceHistory();
    }, []);

    const filteredRecords = filter === 'all' 
        ? attendanceRecords 
        : attendanceRecords.filter(r => r.status === filter);

    const stats = {
        total: attendanceRecords.length,
        present: attendanceRecords.filter(r => r.status === 'present').length,
        absent: attendanceRecords.filter(r => r.status === 'absent').length,
        late: attendanceRecords.filter(r => r.status === 'late').length,
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'present':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'absent':
                return <XCircle className="w-5 h-5 text-red-500" />;
            case 'late':
                return <Clock className="w-5 h-5 text-yellow-500" />;
            default:
                return <AlertCircle className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            present: 'bg-green-100 text-green-800 border-green-200',
            absent: 'bg-red-100 text-red-800 border-red-200',
            late: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        };
        return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
            }`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Loading attendance history...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
            }`}>
                <div className={`p-6 rounded-lg border ${
                    theme === 'dark' 
                        ? 'bg-red-900/20 border-red-800 text-red-300' 
                        : 'bg-red-50 border-red-200 text-red-600'
                }`}>
                    <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-lg font-semibold">{error}</p>
                </div>
            </div>
        );
    }

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
                        <Calendar className="inline-block w-8 h-8 mr-3" />
                        Attendance History
                    </h1>
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        View and analyze your attendance records
                    </p>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Classes', value: stats.total, color: 'blue', icon: Calendar },
                        { label: 'Present', value: stats.present, color: 'green', icon: CheckCircle },
                        { label: 'Absent', value: stats.absent, color: 'red', icon: XCircle },
                        { label: 'Late', value: stats.late, color: 'yellow', icon: Clock },
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
                                } shadow-lg`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className={`text-sm font-medium ${
                                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                            {stat.label}
                                        </p>
                                        <p className={`text-3xl font-bold mt-1 ${
                                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        }`}>
                                            {stat.value}
                                        </p>
                                    </div>
                                    <Icon className={`w-12 h-12 text-${stat.color}-500 opacity-50`} />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2 mb-6">
                    {['all', 'present', 'absent', 'late'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                filter === f
                                    ? theme === 'dark'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-blue-500 text-white'
                                    : theme === 'dark'
                                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Records Table */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`rounded-xl border ${
                        theme === 'dark'
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-white border-gray-200'
                    } shadow-lg overflow-hidden`}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}>
                                <tr>
                                    <th className={`px-6 py-4 text-left text-sm font-semibold ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Date
                                    </th>
                                    <th className={`px-6 py-4 text-left text-sm font-semibold ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Course
                                    </th>
                                    <th className={`px-6 py-4 text-left text-sm font-semibold ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredRecords.map((record, index) => (
                                    <tr
                                        key={record.attendance_id}
                                        className={`transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                                    >
                                        <td className={`px-6 py-4 ${
                                            theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                        }`}>
                                            {new Date(record.date).toLocaleDateString()}
                                        </td>
                                        <td className={`px-6 py-4 ${
                                            theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                        }`}>
                                            {record.course_name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(record.status)}
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                                                    getStatusBadge(record.status)
                                                }`}>
                                                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {filteredRecords.length === 0 && (
                    <div className={`text-center py-12 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                        <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No records found</p>
                        <p className="text-sm">Try changing the filter</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceHistory;