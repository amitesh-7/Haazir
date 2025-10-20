import React, { useState, useRef } from 'react';
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
  ArcElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ReportGeneratorProps {
  data: any[];
  reportType: 'students' | 'attendance' | 'grades' | 'analytics';
  onClose: () => void;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ data, reportType, onClose }) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [reportConfig, setReportConfig] = useState({
    includeCharts: true,
    includeSummary: true,
    includeDetails: true,
    dateRange: 'all',
    customFields: [] as string[],
  });
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const generateCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    ).join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateExcel = async (data: any[], filename: string) => {
    // Mock Excel generation - in real implementation, use libraries like xlsx
    const csvContent = data.map(row => Object.values(row).join('\t')).join('\n');
    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDF = async () => {
    // Mock PDF generation - in real implementation, use libraries like jsPDF or react-pdf
    const element = reportRef.current;
    if (!element) return;

    // In a real implementation, you would use html2canvas and jsPDF
    // For now, we'll simulate the PDF generation
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 1000;
    
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'black';
      ctx.font = '20px Arial';
      ctx.fillText(`${reportType.toUpperCase()} REPORT`, 50, 50);
      ctx.font = '14px Arial';
      ctx.fillText(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80);
      ctx.fillText(`Total Records: ${data.length}`, 50, 100);
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${reportType}-report.pdf`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    
    try {
      const filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}`;
      
      switch (selectedFormat) {
        case 'csv':
          generateCSV(data, `${filename}.csv`);
          break;
        case 'excel':
          await generateExcel(data, filename);
          break;
        case 'pdf':
          await generatePDF();
          break;
      }
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onClose();
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const renderPreview = () => {
    if (reportType === 'students') {
      const departmentCounts = data.reduce((acc, student) => {
        const dept = student.department_name || 'Unknown';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {});

      const chartData = {
        labels: Object.keys(departmentCounts),
        datasets: [{
          data: Object.values(departmentCounts),
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
          ],
        }]
      };

      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl">
              <h4 className="font-semibold text-blue-900">Total Students</h4>
              <p className="text-2xl font-bold text-blue-600">{data.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl">
              <h4 className="font-semibold text-green-900">Departments</h4>
              <p className="text-2xl font-bold text-green-600">{Object.keys(departmentCounts).length}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl">
              <h4 className="font-semibold text-purple-900">Average Year</h4>
              <p className="text-2xl font-bold text-purple-600">
                {(data.reduce((sum, s) => sum + (s.year || 0), 0) / data.length).toFixed(1)}
              </p>
            </div>
          </div>

          {reportConfig.includeCharts && (
            <div className="bg-white p-4 rounded-xl border">
              <h4 className="font-semibold mb-4">Students by Department</h4>
              <div className="h-64">
                <Doughnut 
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom' }
                    }
                  }}
                />
              </div>
            </div>
          )}

          {reportConfig.includeDetails && (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h4 className="font-semibold">Student Details</h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.slice(0, 10).map((student, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">{student.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{student.email}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{student.department_name}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{student.year}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.length > 10 && (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    ... and {data.length - 10} more records
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Report Preview</h3>
        <p className="text-gray-500">Configure your report settings and preview will appear here</p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white capitalize">Generate {reportType} Report</h2>
              <p className="text-blue-100 mt-1">Create comprehensive reports with charts and analytics</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex">
          {/* Configuration Panel */}
          <div className="w-1/3 border-r border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h3>
            
            {/* Format Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: 'pdf', label: 'PDF Report', icon: '📄', desc: 'Formatted document with charts' },
                  { value: 'excel', label: 'Excel Spreadsheet', icon: '📊', desc: 'Data in spreadsheet format' },
                  { value: 'csv', label: 'CSV File', icon: '📋', desc: 'Comma-separated values' },
                ].map((format) => (
                  <label
                    key={format.value}
                    className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedFormat === format.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={format.value}
                      checked={selectedFormat === format.value}
                      onChange={(e) => setSelectedFormat(e.target.value as any)}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{format.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900">{format.label}</div>
                        <div className="text-xs text-gray-500">{format.desc}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Report Options */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Include in Report
              </label>
              <div className="space-y-3">
                {[
                  { key: 'includeSummary', label: 'Summary Statistics', desc: 'Key metrics and totals' },
                  { key: 'includeCharts', label: 'Charts & Graphs', desc: 'Visual data representation' },
                  { key: 'includeDetails', label: 'Detailed Data', desc: 'Complete record listings' },
                ].map((option) => (
                  <label key={option.key} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reportConfig[option.key as keyof typeof reportConfig] as boolean}
                      onChange={(e) => setReportConfig(prev => ({
                        ...prev,
                        [option.key]: e.target.checked
                      }))}
                      className="mt-1 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={reportConfig.dateRange}
                onChange={(e) => setReportConfig(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 ${
                generating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:shadow-lg'
              }`}
            >
              {generating ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  <span>Generate Report</span>
                </div>
              )}
            </button>
          </div>

          {/* Preview Panel */}
          <div className="flex-1 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Report Preview</h3>
              <div className="text-sm text-gray-500">
                {data.length} records • {selectedFormat.toUpperCase()} format
              </div>
            </div>

            <div ref={reportRef} className="bg-gray-50 rounded-xl p-6 min-h-96">
              {renderPreview()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;