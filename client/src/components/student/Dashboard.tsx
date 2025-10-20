import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import AttendanceView from './AttendanceView';
import Analytics from './Analytics';
import ViewTimetable from './ViewTimetable';

const Dashboard: React.FC = () => {
    const { user } = useAuth();

    // Mock data for now - replace with actual API calls
    const mockAttendanceData = [
        { date: '2024-01-15', status: 'present' },
        { date: '2024-01-16', status: 'absent' },
        { date: '2024-01-17', status: 'present' },
    ];

    const mockTimetableData = [
        { day: 'Monday', time: '9:00-10:00', subject: 'Mathematics', teacher: 'Dr. Smith' },
        { day: 'Tuesday', time: '10:00-11:00', subject: 'Physics', teacher: 'Dr. Johnson' },
    ];

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">Welcome, {user?.email || 'Student'}!</h1>
            <div className="mt-6">
                <AttendanceView attendanceData={mockAttendanceData} />
            </div>
            <div className="mt-6">
                <Analytics attendanceData={mockAttendanceData} />
            </div>
            <div className="mt-6">
                <ViewTimetable timetableData={mockTimetableData} />
            </div>
        </div>
    );
};

export default Dashboard;