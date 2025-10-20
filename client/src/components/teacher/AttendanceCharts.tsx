import React from 'react';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react';

interface UnifiedAttendanceRecord {
  id: number;
  student_id: number;
  student_name: string;
  roll_number: string;
  course_name: string;
  course_code: string;
  date: string;
  status: 'present' | 'absent';
  method: 'manual' | 'smart';
  time_slot?: string;
  verified_by_face?: boolean;
  confidence_score?: number;
}

interface AttendanceChartsProps {
  records: UnifiedAttendanceRecord[];
  theme?: 'light' | 'dark';
}

const AttendanceCharts: React.FC<AttendanceChartsProps> = ({ records, theme = 'light' }) => {
  // Process data for charts
  const processDataForCharts = () => {
    // Group by date
    const dateMap = new Map<string, {
      total: number;
      present: number;
      absent: number;
      manual: number;
      smart: number;
    }>();

    records.forEach(record => {
      const date = new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (!dateMap.has(date)) {
        dateMap.set(date, { total: 0, present: 0, absent: 0, manual: 0, smart: 0 });
      }
      
      const stats = dateMap.get(date)!;
      stats.total++;
      
      if (record.status === 'present') stats.present++;
      if (record.status === 'absent') stats.absent++;
      if (record.method === 'manual') stats.manual++;
      if (record.method === 'smart') stats.smart++;
    });

    // Sort by date
    const sortedEntries = Array.from(dateMap.entries()).sort((a, b) => {
      return new Date(a[0]).getTime() - new Date(b[0]).getTime();
    });

    return {
      dates: sortedEntries.map(([date]) => date),
      present: sortedEntries.map(([, stats]) => stats.present),
      absent: sortedEntries.map(([, stats]) => stats.absent),
      manual: sortedEntries.map(([, stats]) => stats.manual),
      smart: sortedEntries.map(([, stats]) => stats.smart),
      attendanceRate: sortedEntries.map(([, stats]) => 
        stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0
      )
    };
  };

  const chartData = processDataForCharts();

  // Calculate overall stats
  const totalPresent = records.filter(r => r.status === 'present').length;
  const totalAbsent = records.filter(r => r.status === 'absent').length;
  const totalManual = records.filter(r => r.method === 'manual').length;
  const totalSmart = records.filter(r => r.method === 'smart').length;

  // Theme colors
  const textColor = theme === 'dark' ? '#e5e7eb' : '#374151';
  const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';

  // 1. Line Chart - Attendance Trend Over Time
  const lineChartData = {
    labels: chartData.dates,
    datasets: [
      {
        label: 'Attendance Rate (%)',
        data: chartData.attendanceRate,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: { color: textColor, font: { size: 12, weight: 'bold' as const } }
      },
      title: {
        display: true,
        text: 'Attendance Rate Trend',
        color: textColor,
        font: { size: 16, weight: 'bold' as const }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        callbacks: {
          label: function(context: any) {
            return `Attendance: ${context.parsed.y}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { color: textColor, callback: (value: any) => `${value}%` },
        grid: { color: gridColor }
      },
      x: {
        ticks: { color: textColor },
        grid: { color: gridColor }
      }
    }
  };

  // 2. Bar Chart - Present vs Absent by Date
  const barChartData = {
    labels: chartData.dates,
    datasets: [
      {
        label: 'Present',
        data: chartData.present,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2,
      },
      {
        label: 'Absent',
        data: chartData.absent,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 2,
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: { color: textColor, font: { size: 12, weight: 'bold' as const } }
      },
      title: {
        display: true,
        text: 'Present vs Absent Comparison',
        color: textColor,
        font: { size: 16, weight: 'bold' as const }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: textColor },
        grid: { color: gridColor }
      },
      x: {
        ticks: { color: textColor },
        grid: { display: false }
      }
    }
  };

  // 3. Pie Chart - Overall Status Distribution
  const pieChartData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: [totalPresent, totalAbsent],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
      }
    ]
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: { color: textColor, font: { size: 12, weight: 'bold' as const }, padding: 15 }
      },
      title: {
        display: true,
        text: 'Status Distribution',
        color: textColor,
        font: { size: 16, weight: 'bold' as const }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        callbacks: {
          label: function(context: any) {
            const total = totalPresent + totalAbsent;
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      }
    }
  };

  // 4. Doughnut Chart - Method Distribution (Manual vs Smart)
  const doughnutChartData = {
    labels: ['Smart Attendance', 'Manual Attendance'],
    datasets: [
      {
        data: [totalSmart, totalManual],
        backgroundColor: [
          'rgba(147, 51, 234, 0.8)',
          'rgba(59, 130, 246, 0.8)',
        ],
        borderColor: [
          'rgb(147, 51, 234)',
          'rgb(59, 130, 246)',
        ],
        borderWidth: 2,
      }
    ]
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: { color: textColor, font: { size: 12, weight: 'bold' as const }, padding: 15 }
      },
      title: {
        display: true,
        text: 'Method Distribution',
        color: textColor,
        font: { size: 16, weight: 'bold' as const }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        callbacks: {
          label: function(context: any) {
            const total = totalSmart + totalManual;
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      }
    }
  };

  // 5. Stacked Bar Chart - Method Comparison by Date
  const stackedBarChartData = {
    labels: chartData.dates,
    datasets: [
      {
        label: 'Smart',
        data: chartData.smart,
        backgroundColor: 'rgba(147, 51, 234, 0.8)',
        borderColor: 'rgb(147, 51, 234)',
        borderWidth: 2,
      },
      {
        label: 'Manual',
        data: chartData.manual,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
      }
    ]
  };

  const stackedBarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: { color: textColor, font: { size: 12, weight: 'bold' as const } }
      },
      title: {
        display: true,
        text: 'Smart vs Manual by Date',
        color: textColor,
        font: { size: 16, weight: 'bold' as const }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
      }
    },
    scales: {
      x: {
        stacked: true,
        ticks: { color: textColor },
        grid: { display: false }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: { color: textColor },
        grid: { color: gridColor }
      }
    }
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-md">
        <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No data available for charts</p>
        <p className="text-gray-400 text-sm mt-2">Add attendance records to see visualizations</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - Attendance Trend */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-6 h-6 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Attendance Trend</h3>
          </div>
          <div style={{ height: '300px' }}>
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Bar Chart - Present vs Absent */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-6 h-6 text-green-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Daily Comparison</h3>
          </div>
          <div style={{ height: '300px' }}>
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        {/* Pie Chart - Status Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center mb-4">
            <PieChart className="w-6 h-6 text-red-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Status Split</h3>
          </div>
          <div style={{ height: '300px' }}>
            <Pie data={pieChartData} options={pieChartOptions} />
          </div>
        </div>

        {/* Doughnut Chart - Method Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center mb-4">
            <Activity className="w-6 h-6 text-purple-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Method Split</h3>
          </div>
          <div style={{ height: '300px' }}>
            <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
          </div>
        </div>
      </div>

      {/* Full Width Stacked Bar Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
        <div className="flex items-center mb-4">
          <BarChart3 className="w-6 h-6 text-indigo-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Method Timeline Comparison</h3>
        </div>
        <div style={{ height: '350px' }}>
          <Bar data={stackedBarChartData} options={stackedBarChartOptions} />
        </div>
      </div>
    </div>
  );
};

export default AttendanceCharts;
