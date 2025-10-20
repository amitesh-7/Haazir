import React from 'react';

interface AnalyticsProps {
    attendanceData: any[];
}

const Analytics: React.FC<AnalyticsProps> = ({ attendanceData }) => {
    const totalDays = attendanceData.length;
    const presentDays = attendanceData.filter((record: any) => record.status === 'present').length;
    const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : '0';

    return (
        <div className="p-4 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-4">Attendance Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-100 rounded">
                    <h3 className="font-semibold">Total Days</h3>
                    <p className="text-2xl font-bold">{totalDays}</p>
                </div>
                <div className="p-4 bg-green-100 rounded">
                    <h3 className="font-semibold">Present Days</h3>
                    <p className="text-2xl font-bold">{presentDays}</p>
                </div>
                <div className="p-4 bg-yellow-100 rounded">
                    <h3 className="font-semibold">Attendance Rate</h3>
                    <p className="text-2xl font-bold">{attendancePercentage}%</p>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
