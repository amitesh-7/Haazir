import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface StudentProfileProps {
  studentId?: string;
}

interface StudentData {
  user_id: number;
  email: string;
  name: string;
  roll_number: string;
  department_name: string;
  year: number;
  contact_number?: string;
  parent_name?: string;
  parent_contact?: string;
  address?: string;
  profile_picture?: string;
  gpa?: number;
  total_credits?: number;
  attendance_percentage?: number;
}

interface AttendanceData {
  date: string;
  status: 'present' | 'absent' | 'late';
  course: string;
}

interface GradeData {
  course: string;
  grade: string;
  credits: number;
  points: number;
}

const StudentProfileDashboard: React.FC<StudentProfileProps> = ({ studentId }) => {
  const { id } = useParams<{ id: string }>();
  const currentStudentId = studentId || id;
  
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'grades' | 'performance'>('overview');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'semester' | 'year'>('month');

  // Mock data - replace with actual API calls
  const mockStudentData: StudentData = {
    user_id: parseInt(currentStudentId || '1'),
    email: 'john.doe@student.edu',
    name: 'John Doe',
    roll_number: 'CS2021001',
    department_name: 'Computer Science',
    year: 3,
    contact_number: '+1 234 567 8900',
    parent_name: 'Jane Doe',
    parent_contact: '+1 234 567 8901',
    address: '123 University Ave, College Town, ST 12345',
    gpa: 3.75,
    total_credits: 85,
    attendance_percentage: 87.5
  };

  const mockAttendanceData: AttendanceData[] = [
    { date: '2025-01-15', status: 'present', course: 'Data Structures' },
    { date: '2025-01-15', status: 'present', course: 'Database Systems' },
    { date: '2025-01-14', status: 'absent', course: 'Machine Learning' },
    { date: '2025-01-14', status: 'present', course: 'Web Development' },
    { date: '2025-01-13', status: 'late', course: 'Software Engineering' },
  ];

  const mockGradeData: GradeData[] = [
    { course: 'Data Structures', grade: 'A-', credits: 4, points: 3.7 },
    { course: 'Database Systems', grade: 'B+', credits: 3, points: 3.3 },
    { course: 'Machine Learning', grade: 'A', credits: 4, points: 4.0 },
    { course: 'Web Development', grade: 'B', credits: 3, points: 3.0 },
    { course: 'Software Engineering', grade: 'A-', credits: 4, points: 3.7 },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStudent(mockStudentData);
      setLoading(false);
    }, 1000);
  }, [currentStudentId]);

  // Chart data configurations
  const attendanceChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Attendance %',
        data: [85, 88, 92, 87, 85, 90, 88, 91, 89, 87, 92, 88],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
      }
    ]
  };

  const gradeDistributionData = {
    labels: ['A', 'B+', 'B', 'B-', 'C+', 'C'],
    datasets: [{
      data: [35, 25, 20, 15, 3, 2],
      backgroundColor: [
        '#10b981',
        '#3b82f6',
        '#f59e0b',
        '#ef4444',
        '#8b5cf6',
        '#6b7280'
      ],
      borderWidth: 3,
      borderColor: '#fff'
    }]
  };

  const performanceRadarData = {
    labels: ['Attendance', 'Assignments', 'Exams', 'Projects', 'Participation', 'Overall'],
    datasets: [{
      label: 'Performance',
      data: [87, 92, 85, 90, 88, 89],
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 2,
      pointBackgroundColor: 'rgb(59, 130, 246)',
    }]
  };

  const semesterGpaData = {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
    datasets: [{
      label: 'GPA',
      data: [3.2, 3.4, 3.6, 3.7, 3.8, 3.75],
      backgroundColor: 'rgba(168, 85, 247, 0.8)',
      borderColor: 'rgb(168, 85, 247)',
      borderWidth: 2,
      borderRadius: 8,
    }]
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-xl text-gray-600">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Student Not Found</h1>
          <p className="text-gray-600 mt-2">The requested student profile could not be found.</p>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Student Info Card */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-center">
            <div className="h-24 w-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
              {student.name.split(' ').map(n => n[0]).join('')}
            </div>
            <h2 className="text-2xl font-bold text-white">{student.name}</h2>
            <p className="text-blue-100">{student.roll_number}</p>
            <p className="text-blue-100">{student.department_name}</p>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
              <span className="text-gray-600">{student.email}</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-gray-600">{student.contact_number}</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-gray-600 text-sm">{student.address}</span>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Emergency Contact</h4>
              <p className="text-gray-600">{student.parent_name}</p>
              <p className="text-gray-600">{student.parent_contact}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats and Charts */}
      <div className="lg:col-span-2 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Current GPA</p>
                <p className="text-3xl font-bold">{student.gpa}</p>
                <p className="text-green-100 text-sm">Out of 4.0</p>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Attendance</p>
                <p className="text-3xl font-bold">{student.attendance_percentage}%</p>
                <p className="text-blue-100 text-sm">This semester</p>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Credits</p>
                <p className="text-3xl font-bold">{student.total_credits}</p>
                <p className="text-purple-100 text-sm">Completed</p>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Grade Distribution</h3>
          <div className="h-80">
            <Doughnut 
              data={gradeDistributionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right' as const,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Attendance Analytics</h3>
          <div className="flex space-x-2">
            {['week', 'month', 'semester', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range as any)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 capitalize ${
                  timeRange === range
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance Chart */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-6">Monthly Attendance Trend</h4>
        <div className="h-80">
          <Line 
            data={attendanceChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    callback: function(value) {
                      return value + '%';
                    }
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-6">Recent Attendance</h4>
        <div className="space-y-3">
          {mockAttendanceData.map((record, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${
                  record.status === 'present' ? 'bg-green-500' :
                  record.status === 'late' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <div>
                  <p className="font-medium text-gray-900">{record.course}</p>
                  <p className="text-sm text-gray-500">{record.date}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                record.status === 'present' ? 'bg-green-100 text-green-800' :
                record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {record.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGrades = () => (
    <div className="space-y-6">
      {/* GPA Trend */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">GPA Progression</h3>
        <div className="h-80">
          <Bar 
            data={semesterGpaData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 4,
                }
              }
            }}
          />
        </div>
      </div>

      {/* Course Grades */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Current Semester Grades</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockGradeData.map((grade, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {grade.course}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      grade.grade.startsWith('A') ? 'bg-green-100 text-green-800' :
                      grade.grade.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {grade.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {grade.credits}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {grade.points.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      {/* Performance Radar */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Performance Overview</h3>
        <div className="h-96">
          <Radar 
            data={performanceRadarData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                r: {
                  beginAtZero: true,
                  max: 100,
                }
              }
            }}
          />
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Assignment Completion', value: 92, color: 'blue' },
          { title: 'Quiz Average', value: 85, color: 'green' },
          { title: 'Project Quality', value: 90, color: 'purple' },
          { title: 'Class Participation', value: 88, color: 'orange' },
          { title: 'Lab Performance', value: 94, color: 'pink' },
          { title: 'Peer Reviews', value: 87, color: 'indigo' },
        ].map((metric, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-xl p-6">
            <h4 className="font-semibold text-gray-900 mb-4">{metric.title}</h4>
            <div className="flex items-end space-x-4">
              <span className="text-3xl font-bold text-gray-900">{metric.value}%</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`bg-gradient-to-r from-${metric.color}-500 to-${metric.color}-600 h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${metric.value}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <button className="p-2 hover:bg-white rounded-lg transition-colors duration-200">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Student Profile
              </h1>
              <p className="text-gray-600 mt-1">
                Comprehensive academic and performance analytics
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl shadow-xl p-1">
            <div className="flex space-x-1">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'attendance', label: 'Attendance', icon: '📅' },
                { id: 'grades', label: 'Grades', icon: '📝' },
                { id: 'performance', label: 'Performance', icon: '🎯' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'attendance' && renderAttendance()}
          {activeTab === 'grades' && renderGrades()}
          {activeTab === 'performance' && renderPerformance()}
        </div>
      </div>
    </div>
  );
};

export default StudentProfileDashboard;