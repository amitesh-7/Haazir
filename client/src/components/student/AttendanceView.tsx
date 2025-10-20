import React from 'react';
import { Link } from 'react-router-dom';

interface AttendanceViewProps {
    attendanceData?: any[];
}

const AttendanceView: React.FC<AttendanceViewProps> = ({ attendanceData = [] }) => {
    const totalClasses = attendanceData.length;
    const presentClasses = attendanceData.filter(record => record.status === 'present').length;
    const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
    
    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Attendance Overview</h2>
                <Link 
                    to="/student/attendance" 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    View Full Attendance
                </Link>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-blue-600">{totalClasses}</div>
                    <div className="text-sm text-blue-700">Total Classes</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-green-600">{presentClasses}</div>
                    <div className="text-sm text-green-700">Classes Attended</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-purple-600">{attendancePercentage}%</div>
                    <div className="text-sm text-purple-700">Attendance Rate</div>
                </div>
            </div>

            {/* Recent Records */}
            {attendanceData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-4">📊</div>
                    <p>No attendance records found</p>
                    <p className="text-sm mt-2">Your attendance will appear here once classes begin</p>
                </div>
            ) : (
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Attendance</h3>
                    <div className="space-y-3">
                        {attendanceData.slice(0, 5).map((record: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full mr-3 ${
                                        record.status === 'present' ? 'bg-green-500' : 'bg-red-500'
                                    }`}></div>
                                    <div>
                                        <div className="font-medium text-gray-800">
                                            {new Date(record.date).toLocaleDateString()}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {record.course_name || 'Course Name'}
                                        </div>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                    record.status === 'present' 
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {record.status === 'present' ? '✓ Present' : '✗ Absent'}
                                </span>
                            </div>
                        ))}
                        {attendanceData.length > 5 && (
                            <div className="text-center pt-4">
                                <Link 
                                    to="/student/attendance" 
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                    View all {attendanceData.length} records →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceView;
