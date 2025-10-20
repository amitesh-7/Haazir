import React, { useState, useEffect } from 'react';
import { getAttendanceReport } from '../../services/api';

interface AttendanceReportData {
  course_id: number;
  course_name: string;
  course_code: string;
  total_students: number;
  total_classes: number;
  average_attendance_percentage: number;
  date_range: {
    start_date: string;
    end_date: string;
  };
  class_wise_data: Array<{
    date: string;
    present_count: number;
    absent_count: number;
    attendance_percentage: number;
  }>;
  student_wise_data: Array<{
    student_id: number;
    student_name: string;
    student_email: string;
    roll_number: string;
    total_classes: number;
    present: number;
    absent: number;
    attendance_percentage: number;
  }>;
}

interface Course {
  course_id: number;
  course_name: string;
  course_code: string;
}

interface AttendanceReportsDashboardProps {
  courses?: Course[];
}

const AttendanceReportsDashboard: React.FC<AttendanceReportsDashboardProps> = ({ courses = [] }) => {
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reportData, setReportData] = useState<AttendanceReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'classwise' | 'studentwise'>('overview');

  useEffect(() => {
    // Set default date range to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  const loadReport = async () => {
    if (!selectedCourse || !startDate || !endDate) return;

    try {
      setLoading(true);
      const data = await getAttendanceReport(selectedCourse, startDate, endDate);
      setReportData(data);
    } catch (error) {
      console.error('Error loading attendance report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    let csvContent = '';
    
    if (activeTab === 'studentwise') {
      csvContent = 'Student ID,Name,Email,Roll Number,Total Classes,Present,Absent,Attendance %\n';
      reportData.student_wise_data.forEach(student => {
        csvContent += `${student.student_id},"${student.student_name}","${student.student_email}","${student.roll_number}",${student.total_classes},${student.present},${student.absent},${student.attendance_percentage.toFixed(2)}\n`;
      });
    } else if (activeTab === 'classwise') {
      csvContent = 'Date,Present Count,Absent Count,Attendance %\n';
      reportData.class_wise_data.forEach(classData => {
        csvContent += `${classData.date},${classData.present_count},${classData.absent_count},${classData.attendance_percentage.toFixed(2)}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance_report_${reportData.course_code}_${activeTab}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getAttendanceStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Attendance Reports Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Course
            </label>
            <select
              value={selectedCourse || ''}
              onChange={(e) => setSelectedCourse(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a course...</option>
              {courses.map(course => (
                <option key={course.course_id} value={course.course_id}>
                  {course.course_code} - {course.course_name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={loadReport}
              disabled={loading || !selectedCourse}
              className={`w-full px-4 py-2 rounded-md font-medium ${
                loading || !selectedCourse
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {reportData && (
        <>
          {/* Course Overview */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {reportData.course_code} - {reportData.course_name}
              </h2>
              <div className="text-sm text-gray-600">
                {new Date(reportData.date_range.start_date).toLocaleDateString()} - {new Date(reportData.date_range.end_date).toLocaleDateString()}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {reportData.total_students}
                </div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {reportData.total_classes}
                </div>
                <div className="text-sm text-gray-600">Total Classes</div>
              </div>
              
              <div className={`rounded-lg p-4 ${getAttendanceStatusColor(reportData.average_attendance_percentage)}`}>
                <div className="text-2xl font-bold">
                  {reportData.average_attendance_percentage.toFixed(1)}%
                </div>
                <div className="text-sm">Average Attendance</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-600">
                  {reportData.class_wise_data.length}
                </div>
                <div className="text-sm text-gray-600">Classes Conducted</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('classwise')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'classwise'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Class-wise Data
                </button>
                <button
                  onClick={() => setActiveTab('studentwise')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'studentwise'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Student-wise Data
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Attendance Trend Chart Placeholder */}
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Attendance Trend</h3>
                    <p className="text-gray-500">Chart visualization would go here</p>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {reportData.class_wise_data.slice(-3).map((classData, index) => (
                        <div key={index} className="bg-white rounded-lg p-4">
                          <div className="text-sm text-gray-600">{new Date(classData.date).toLocaleDateString()}</div>
                          <div className={`text-lg font-semibold ${
                            classData.attendance_percentage >= 80 ? 'text-green-600' :
                            classData.attendance_percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {classData.attendance_percentage.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {classData.present_count}/{classData.present_count + classData.absent_count} present
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-medium text-green-800 mb-2">High Attendance (≥80%)</h4>
                      <div className="text-2xl font-bold text-green-600">
                        {reportData.student_wise_data.filter(s => s.attendance_percentage >= 80).length}
                      </div>
                      <div className="text-sm text-green-700">
                        {((reportData.student_wise_data.filter(s => s.attendance_percentage >= 80).length / reportData.total_students) * 100).toFixed(1)}% of students
                      </div>
                    </div>
                    
                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="font-medium text-red-800 mb-2">Low Attendance (&lt;60%)</h4>
                      <div className="text-2xl font-bold text-red-600">
                        {reportData.student_wise_data.filter(s => s.attendance_percentage < 60).length}
                      </div>
                      <div className="text-sm text-red-700">
                        {((reportData.student_wise_data.filter(s => s.attendance_percentage < 60).length / reportData.total_students) * 100).toFixed(1)}% of students
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'classwise' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-800">Class-wise Attendance Data</h3>
                    <button
                      onClick={exportToCSV}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      Export CSV
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Present
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Absent
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Attendance %
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.class_wise_data.map((classData, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(classData.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                              {classData.present_count}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                              {classData.absent_count}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                classData.attendance_percentage >= 80 
                                  ? 'bg-green-100 text-green-800'
                                  : classData.attendance_percentage >= 60
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {classData.attendance_percentage.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'studentwise' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-800">Student-wise Attendance Data</h3>
                    <button
                      onClick={exportToCSV}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      Export CSV
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Roll Number
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Classes
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Present
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Absent
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Attendance %
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.student_wise_data
                          .sort((a, b) => b.attendance_percentage - a.attendance_percentage)
                          .map((student, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {student.student_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {student.student_email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {student.roll_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {student.total_classes}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                              {student.present}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                              {student.absent}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                student.attendance_percentage >= 80 
                                  ? 'bg-green-100 text-green-800'
                                  : student.attendance_percentage >= 60
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {student.attendance_percentage.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default AttendanceReportsDashboard;