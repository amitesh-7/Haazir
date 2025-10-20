import React, { useState, useEffect } from 'react';
import { Download, Upload, FileSpreadsheet, Info, CheckCircle, AlertCircle, AlertTriangle, FileText, Eye, Zap, Target, X } from 'lucide-react';
import { downloadStudentTemplate, downloadTeacherTemplate, getValidationRules, parseUploadedFile, validateSingleRecord, bulkImportData, fetchAllDepartments } from '../../services/api';

interface ValidationRule {
  required?: boolean;
  unique?: boolean;
  pattern?: string;
  enum?: string[];
  message?: string;
}

interface ValidationRules {
  [key: string]: ValidationRule;
}

interface ParsedData {
  row: number;
  data: any;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
  correctedData?: any;
}

interface ParseResult {
  success: boolean;
  data: ParsedData[];
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    warningRows: number;
    suggestionsCount: number;
    autoCorrectionsCount: number;
  };
  columnMapping: { [key: string]: string };
  detectedType: 'student' | 'teacher' | 'unknown';
  batchValidation: {
    hasBatchDuplicates: boolean;
    duplicateFields: string[];
  };
}

interface TemplateDownloadProps {
  type: 'student' | 'teacher';
  onUpload?: (file: File) => void;
}

const SmartDataEntry: React.FC = () => {
  // Utility function to generate department code from name (matching backend)
  const generateDepartmentCode = (departmentName: string): string => {
    const mapping: { [key: string]: string } = {
      'Computer Science and Engineering': 'CSE',
      'Computer Science': 'CSE',
      'Electrical Engineering': 'EE',
      'Electronics Engineering': 'EE',
      'Mechanical Engineering': 'ME',
      'Civil Engineering': 'CE',
      'Information Technology': 'IT',
      'Electronics and Communication Engineering': 'ECE',
      'Chemical Engineering': 'CHE',
      'Biotechnology': 'BT',
      'Mathematics': 'MATH',
      'Physics': 'PHY',
      'Chemistry': 'CHEM'
    };

    // Check for exact match first
    if (mapping[departmentName]) {
      return mapping[departmentName];
    }

    // Generate code from initials if no mapping found
    return departmentName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 4); // Limit to 4 characters
  };
  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [validationRules, setValidationRules] = useState<ValidationRules>({});
  const [showValidation, setShowValidation] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [showParseResult, setShowParseResult] = useState(false);
  const [data, setData] = useState<ParsedData[]>([]);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [bulkEditField, setBulkEditField] = useState<string>('');
  const [bulkEditValue, setBulkEditValue] = useState<string>('');
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [history, setHistory] = useState<ParsedData[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv' | 'json'>('excel');
  const [exportOptions, setExportOptions] = useState({
    includeValidationReport: true,
    includeOnlyValid: false,
    includeOriginalData: true,
    includeCorrectedData: true
  });

  // Auto-generation settings
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [autoGenerateMode, setAutoGenerateMode] = useState(false);
  const [currentYear] = useState(new Date().getFullYear());

  // Load departments on component mount
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const depts = await fetchAllDepartments();
        setDepartments(depts);
        console.log('✅ Departments loaded:', depts);
      } catch (error) {
        console.error('Failed to load departments:', error);
        // Set empty array on error so component still works
        setDepartments([]);
      }
    };
    loadDepartments();
  }, []);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'z' && !event.shiftKey) {
          event.preventDefault();
          undo();
        } else if ((event.key === 'y') || (event.key === 'z' && event.shiftKey)) {
          event.preventDefault();
          redo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  const handleDownloadTemplate = async (type: 'student' | 'teacher') => {
    try {
      setDownloadLoading(true);
      
      let response;
      if (type === 'student') {
        response = await downloadStudentTemplate(
          selectedDepartment?.department_id,
          undefined, // section - not used in current implementation
          autoGenerateMode
        );
      } else {
        response = await downloadTeacherTemplate();
      }

      // Create blob and download
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_template${autoGenerateMode ? '_auto' : ''}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Failed to download template. Please try again.');
    } finally {
      setDownloadLoading(false);
    }
  };

    const saveToHistory = (newData: ParsedData[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newData]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setParseResult(prev => prev ? { ...prev, data: [...previousState] } : null);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setParseResult(prev => prev ? { ...prev, data: [...nextState] } : null);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const toggleRowSelection = (rowIndex: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(rowIndex)) {
      newSelection.delete(rowIndex);
    } else {
      newSelection.add(rowIndex);
    }
    setSelectedRows(newSelection);
  };

  const selectAllRows = () => {
    if (!parseResult?.data) return;
    const allRows = new Set(parseResult.data.map((_, index) => index));
    setSelectedRows(allRows);
  };

  const clearSelection = () => {
    setSelectedRows(new Set());
  };

  const applyBulkCorrections = () => {
    if (!parseResult?.data || selectedRows.size === 0) return;
    
    saveToHistory(parseResult.data);
    
    const updatedData = parseResult.data.map((row, index) => {
      if (selectedRows.has(index) && row.correctedData) {
        return {
          ...row,
          data: { ...row.data, ...row.correctedData },
          correctedData: undefined,
          errors: row.errors.filter(error => !error.includes('corrected'))
        };
      }
      return row;
    });
    
    setParseResult({ ...parseResult, data: updatedData });
    setSelectedRows(new Set());
  };

  const ignoreBulkWarnings = () => {
    if (!parseResult?.data || selectedRows.size === 0) return;
    
    saveToHistory(parseResult.data);
    
    const updatedData = parseResult.data.map((row, index) => {
      if (selectedRows.has(index)) {
        return {
          ...row,
          warnings: []
        };
      }
      return row;
    });
    
    setParseResult({ ...parseResult, data: updatedData });
    setSelectedRows(new Set());
  };

  // Export utility functions
  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header] || '';
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');
    
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

  const exportToJSON = (data: any, filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateValidationReport = () => {
    if (!parseResult) return null;
    
    const { data, summary } = parseResult;
    const report = {
      summary: {
        totalRecords: summary.totalRows,
        validRecords: summary.validRows,
        recordsWithErrors: summary.errorRows,
        recordsWithWarnings: summary.warningRows,
        autoCorrections: summary.autoCorrectionsCount || 0,
        suggestions: summary.suggestionsCount || 0,
        exportDate: new Date().toISOString()
      },
      validationDetails: data.map(row => ({
        rowNumber: row.row,
        status: row.errors.length > 0 ? 'Error' : row.warnings.length > 0 ? 'Warning' : 'Valid',
        errors: row.errors,
        warnings: row.warnings,
        suggestions: row.suggestions || [],
        hasCorrectedData: !!row.correctedData,
        originalData: row.data,
        correctedData: row.correctedData || null
      })),
      errorSummary: {
        commonErrors: getCommonIssues(data.flatMap(row => row.errors)),
        commonWarnings: getCommonIssues(data.flatMap(row => row.warnings))
      }
    };
    
    return report;
  };

  const getCommonIssues = (issues: string[]) => {
    const issueCounts = issues.reduce((acc, issue) => {
      acc[issue] = (acc[issue] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(issueCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }));
  };

  const prepareExportData = () => {
    if (!parseResult?.data) return [];
    
    let dataToExport = parseResult.data;
    
    if (exportOptions.includeOnlyValid) {
      dataToExport = dataToExport.filter(row => row.errors.length === 0);
    }
    
    return dataToExport.map(row => {
      const exportRow: any = {};
      
      if (exportOptions.includeOriginalData) {
        Object.keys(row.data).forEach(key => {
          exportRow[`original_${key}`] = row.data[key];
        });
      }
      
      if (exportOptions.includeCorrectedData && row.correctedData) {
        Object.keys(row.correctedData).forEach(key => {
          exportRow[`corrected_${key}`] = row.correctedData[key];
        });
      } else if (!exportOptions.includeOriginalData) {
        Object.keys(row.data).forEach(key => {
          exportRow[key] = row.correctedData?.[key] || row.data[key];
        });
      }
      
      exportRow.row_number = row.row;
      exportRow.status = row.errors.length > 0 ? 'Error' : row.warnings.length > 0 ? 'Warning' : 'Valid';
      exportRow.error_count = row.errors.length;
      exportRow.warning_count = row.warnings.length;
      
      return exportRow;
    });
  };

  const handleExport = async () => {
    if (!parseResult) return;
    
    setExportLoading(true);
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const baseFilename = `${parseResult.detectedType}-data-${timestamp}`;
      
      const exportData = prepareExportData();
      
      if (exportFormat === 'csv') {
        exportToCSV(exportData, `${baseFilename}.csv`);
        
        if (exportOptions.includeValidationReport) {
          const report = generateValidationReport();
          if (report) exportToJSON(report, `${baseFilename}-validation-report.json`);
        }
      } else if (exportFormat === 'json') {
        const fullExport = {
          metadata: {
            exportDate: new Date().toISOString(),
            dataType: parseResult.detectedType,
            totalRecords: parseResult.summary.totalRows,
            exportOptions
          },
          data: exportData,
          validationReport: exportOptions.includeValidationReport ? generateValidationReport() : null
        };
        
        exportToJSON(fullExport, `${baseFilename}.json`);
      } else if (exportFormat === 'excel') {
        // For Excel, we'll use CSV format for now
        exportToCSV(exportData, `${baseFilename}.csv`);
        
        if (exportOptions.includeValidationReport) {
          const report = generateValidationReport();
          if (report) exportToJSON(report, `${baseFilename}-validation-report.json`);
        }
      }
      
      setShowExportModal(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const applyBulkEdit = async () => {
    if (!parseResult?.data || selectedRows.size === 0 || !bulkEditField || !bulkEditValue) return;
    
    saveToHistory(parseResult.data);
    
    const updatedData = [...parseResult.data];
    
    for (const rowIndex of Array.from(selectedRows)) {
      updatedData[rowIndex].data[bulkEditField] = bulkEditValue;
      
      // Validate the updated row
      try {
        const response = await validateSingleRecord(updatedData[rowIndex].data, parseResult.detectedType as 'student' | 'teacher');
        if (response.data.success) {
          updatedData[rowIndex].errors = response.data.validation.errors || [];
          updatedData[rowIndex].warnings = response.data.validation.warnings || [];
          updatedData[rowIndex].suggestions = response.data.validation.suggestions || [];
          updatedData[rowIndex].correctedData = response.data.validation.correctedData || null;
        }
      } catch (error) {
        console.error('Validation error:', error);
      }
    }
    
    setParseResult({ ...parseResult, data: updatedData });
    setSelectedRows(new Set());
    setShowBulkEdit(false);
    setBulkEditField('');
    setBulkEditValue('');
  };

  const generateSuggestions = (field: string, value: string) => {
    if (!parseResult?.data || value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Get all unique values for this field from the dataset
    const fieldValues = parseResult.data
      .map(row => row.data[field])
      .filter(val => val && typeof val === 'string')
      .map(val => val.toString().toLowerCase());
    
    const uniqueValues = Array.from(new Set(fieldValues));
    
    // Find values that start with or contain the input
    const matches = uniqueValues
      .filter(val => 
        val.toLowerCase().includes(value.toLowerCase()) && 
        val.toLowerCase() !== value.toLowerCase()
      )
      .slice(0, 5); // Limit to 5 suggestions
    
    // Add some common suggestions based on field type
    const commonSuggestions: { [key: string]: string[] } = {
      'department': ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology'],
      'gender': ['Male', 'Female', 'Other'],
      'status': ['Active', 'Inactive', 'Pending'],
      'role': ['Student', 'Teacher', 'Admin'],
    };
    
    const fieldKey = field.toLowerCase();
    if (commonSuggestions[fieldKey]) {
      const commonMatches = commonSuggestions[fieldKey]
        .filter(val => 
          val.toLowerCase().includes(value.toLowerCase()) &&
          val.toLowerCase() !== value.toLowerCase()
        );
      matches.push(...commonMatches);
    }
    
    const finalSuggestions = Array.from(new Set(matches)).slice(0, 5);
    setSuggestions(finalSuggestions);
    setShowSuggestions(finalSuggestions.length > 0);
  };

  const startCellEdit = (rowIndex: number, field: string, currentValue: string) => {
    setEditingCell({ rowIndex, field });
    setEditValue(currentValue || '');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const cancelCellEdit = () => {
    setEditingCell(null);
    setEditValue('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const saveCellEdit = async (rowIndex: number, field: string, newValue: string) => {
    if (!parseResult?.data) return;

    const updatedData = [...parseResult.data];
    const oldValue = updatedData[rowIndex].data[field];
    
    // Save current state to history before making changes
    saveToHistory(updatedData);
    
    // Update the cell value
    updatedData[rowIndex].data[field] = newValue;
    
    // Validate the updated row
    try {
      const response = await validateSingleRecord(updatedData[rowIndex].data, parseResult.detectedType as 'student' | 'teacher');
      if (response.data.success) {
        updatedData[rowIndex].errors = response.data.validation.errors || [];
        updatedData[rowIndex].warnings = response.data.validation.warnings || [];
        updatedData[rowIndex].suggestions = response.data.validation.suggestions || [];
        updatedData[rowIndex].correctedData = response.data.validation.correctedData || null;
      }
    } catch (error) {
      console.error('Validation error:', error);
      // Add a basic validation error if API call fails
      updatedData[rowIndex].errors = [...(updatedData[rowIndex].errors || []), 'Validation failed for this change'];
    }
    
    setParseResult({ ...parseResult, data: updatedData });
    setEditingCell(null);
    setEditValue('');
  };

  const applyAutoCorrection = (rowIndex: number) => {
    if (!parseResult?.data) return;
    
    // Save current state to history
    saveToHistory(parseResult.data);
    
    const updatedData = [...parseResult.data];
    const row = updatedData[rowIndex];
    
    if (row.correctedData) {
      // Apply the auto-corrections to the original data
      row.data = { ...row.data, ...row.correctedData };
      row.correctedData = undefined;
      
      // Remove corrected errors from the errors array
      row.errors = row.errors.filter(error => !error.includes('corrected'));
      
      setParseResult({ ...parseResult, data: updatedData });
    }
  };

  const applyAllAutoCorrections = () => {
    if (!parseResult?.data) return;
    
    // Save current state to history
    saveToHistory(parseResult.data);
    
    const updatedData = parseResult.data.map(row => {
      if (row.correctedData) {
        return {
          ...row,
          data: { ...row.data, ...row.correctedData },
          correctedData: undefined,
          errors: row.errors.filter(error => !error.includes('corrected'))
        };
      }
      return row;
    });
    
    setParseResult({ ...parseResult, data: updatedData });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadFile(file);
    setParseResult(null);
    setShowParseResult(false);
  };

  const handleProcessFile = async () => {
    if (!uploadFile) return;

    try {
      setUploadLoading(true);
      const response = await parseUploadedFile(
        uploadFile, 
        autoGenerateMode, 
        selectedDepartment?.department_id
      );
      setParseResult(response.data.parseResult);
      setShowParseResult(true);
    } catch (error: any) {
      console.error('Error processing file:', error);
      const errorMessage = error.response?.data?.error || 'Failed to process file. Please try again.';
      alert(errorMessage);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleImportData = async () => {
    if (!parseResult?.data || parseResult.summary.errorRows > 0) {
      alert('Cannot import data with errors. Please fix all errors first.');
      return;
    }

    // Check if auto-generate mode is enabled but no department is selected
    if (autoGenerateMode && !selectedDepartment) {
      alert('Please select a department for auto-generation mode.');
      return;
    }

    try {
      setUploadLoading(true);
      
      // Filter only valid rows
      const validData = parseResult.data
        .filter(row => row.errors.length === 0)
        .map(row => row.data);

      if (validData.length === 0) {
        alert('No valid data to import.');
        return;
      }

      console.log('🔄 Importing valid data...', validData);
      console.log('🎯 Auto-generate mode:', autoGenerateMode);
      console.log('🏢 Selected department:', selectedDepartment);
      
      const response = await bulkImportData(
        validData, 
        parseResult.detectedType as 'student' | 'teacher',
        autoGenerateMode,
        selectedDepartment?.department_id
      );
      
      console.log('✅ Data imported successfully:', response);
      
      if (response.success) {
        let message = `Successfully imported ${response.imported} ${parseResult.detectedType}(s)!`;
        if (autoGenerateMode) {
          message += `\n🎯 Auto-generated roll numbers and emails for all students!`;
        }
        if (response.failed > 0) {
          message += `\n⚠️ ${response.failed} records failed to import.`;
        }
        alert(message);
        
        // Reset the form
        setParseResult(null);
        setShowParseResult(false);
        setUploadFile(null);
      } else {
        alert('Import failed. Please try again.');
      }
      
    } catch (error: any) {
      console.error('❌ Error importing data:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to import data. Please try again.';
      alert(`Import failed: ${errorMessage}`);
    } finally {
      setUploadLoading(false);
    }
  };

  const loadValidationRules = async (type: 'student' | 'teacher') => {
    try {
      const response = await getValidationRules(type);
      setValidationRules(response.data.validationRules);
    } catch (error) {
      console.error('Error loading validation rules:', error);
    }
  };

  const toggleValidationRules = async () => {
    if (!showValidation) {
      await loadValidationRules(activeTab);
    }
    setShowValidation(!showValidation);
  };

  const renderValidationRules = () => {
    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Info className="w-5 h-5 mr-2 text-blue-500" />
          Validation Rules for {activeTab === 'student' ? 'Students' : 'Teachers'}
        </h3>
        <div className="grid gap-4">
          {Object.entries(validationRules).map(([field, rules]) => (
            <div key={field} className="border-l-4 border-blue-400 pl-4">
              <h4 className="font-medium text-gray-900 capitalize">
                {field.replace('_', ' ')}
                {rules.required && <span className="text-red-500 ml-1">*</span>}
              </h4>
              <div className="text-sm text-gray-600 mt-1 space-y-1">
                {rules.required && (
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Required field
                  </div>
                )}
                {rules.unique && (
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 text-orange-500" />
                    Must be unique
                  </div>
                )}
                {rules.pattern && (
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 text-blue-500" />
                    Format: {rules.message || 'Must match pattern'}
                  </div>
                )}
                {rules.enum && (
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-purple-500" />
                    Valid values: {rules.enum.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderParseResult = () => {
    if (!parseResult) return null;

    const { summary, detectedType, columnMapping, data } = parseResult;
    
    return (
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FileText className="w-6 h-6 mr-2 text-green-500" />
          Parse Results
        </h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.totalRows}</div>
            <div className="text-sm text-blue-800">Total Rows</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{summary.validRows}</div>
            <div className="text-sm text-green-800">Valid Rows</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">{summary.warningRows}</div>
            <div className="text-sm text-yellow-800">Warnings</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{summary.errorRows}</div>
            <div className="text-sm text-red-800">Errors</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{summary.suggestionsCount || 0}</div>
            <div className="text-sm text-purple-800">Suggestions</div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-indigo-600">{summary.autoCorrectionsCount || 0}</div>
            <div className="text-sm text-indigo-800">Auto-fixes</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={applyAllAutoCorrections}
              disabled={!parseResult?.data?.some(row => row.correctedData)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Apply All Auto-corrections</span>
            </button>
            
            {selectedRows.size > 0 && (
              <>
                <button
                  onClick={applyBulkCorrections}
                  disabled={!Array.from(selectedRows).some(i => parseResult?.data?.[i]?.correctedData)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Apply Selected ({selectedRows.size})</span>
                </button>
                <button
                  onClick={ignoreBulkWarnings}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Ignore Warnings ({selectedRows.size})</span>
                </button>
                <button
                  onClick={() => setShowBulkEdit(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                >
                  <Target className="w-4 h-4" />
                  <span>Bulk Edit ({selectedRows.size})</span>
                </button>
                <button
                  onClick={clearSelection}
                  className="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600"
                >
                  Clear
                </button>
              </>
            )}
            
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-1"
              title="Undo (Ctrl+Z)"
            >
              <span>↶</span>
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-1"
              title="Redo (Ctrl+Y)"
            >
              <span>↷</span>
            </button>
            <button
              onClick={() => setShowValidation(!showValidation)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>{showValidation ? 'Hide' : 'Show'} Details</span>
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              disabled={!parseResult?.data?.length}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>
            
            {/* Quick Export Buttons */}
            {parseResult?.data?.length && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => {
                    const data = prepareExportData();
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    exportToCSV(data, `${parseResult.detectedType}-data-${timestamp}.csv`);
                  }}
                  className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm"
                  title="Quick export as CSV"
                >
                  CSV
                </button>
                <button
                  onClick={() => {
                    const report = generateValidationReport();
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    if (report) exportToJSON(report, `validation-report-${timestamp}.json`);
                  }}
                  className="bg-orange-600 text-white px-3 py-2 rounded hover:bg-orange-700 text-sm"
                  title="Export validation report"
                >
                  Report
                </button>
              </div>
            )}
          </div>
          <div className="text-sm text-gray-600">
            {selectedRows.size > 0 ? (
              <div className="flex items-center space-x-4">
                <span>{selectedRows.size} selected</span>
                <button
                  onClick={selectAllRows}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Select All
                </button>
              </div>
            ) : (
              <span>Showing {Math.min(10, parseResult?.data?.length || 0)} of {parseResult?.data?.length || 0} records</span>
            )}
          </div>
        </div>

        {/* Detection Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-medium text-gray-900 mb-2">Enhanced Validation Results</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-gray-600">Detected Type: </span>
              <span className={`font-medium ${
                detectedType === 'student' ? 'text-blue-600' : 
                detectedType === 'teacher' ? 'text-green-600' : 'text-red-600'
              }`}>
                {detectedType.charAt(0).toUpperCase() + detectedType.slice(1)}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Columns Mapped: </span>
              <span className="font-medium text-gray-900">{Object.keys(columnMapping).length}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Batch Duplicates: </span>
              <span className={`font-medium ${
                parseResult.batchValidation?.hasBatchDuplicates ? 'text-red-600' : 'text-green-600'
              }`}>
                {parseResult.batchValidation?.hasBatchDuplicates ? 'Found' : 'None'}
              </span>
            </div>
          </div>
          
          {parseResult.batchValidation?.hasBatchDuplicates && (
            <div className="mt-3 p-3 bg-red-50 rounded border-l-4 border-red-400">
              <p className="text-red-800 text-sm">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Duplicate values found in: {parseResult.batchValidation.duplicateFields.join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Column Mapping */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Column Mapping</h3>
          <div className="grid gap-2">
            {Object.entries(columnMapping).map(([dbField, fileColumn]) => (
              <div key={dbField} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm font-medium text-gray-900">{dbField.replace('_', ' ')}</span>
                <span className="text-sm text-gray-600">→ {fileColumn}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Preview */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Data Preview</h3>
          <div className="max-h-96 overflow-y-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === parseResult?.data?.length && parseResult?.data?.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          selectAllRows();
                        } else {
                          clearSelection();
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  {Object.keys(columnMapping).map(field => (
                    <th key={field} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {field.replace('_', ' ')}
                    </th>
                  ))}
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Issues</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Suggestions</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Auto-fixes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parseResult?.data?.slice(0, 10).map((row, index) => {
                  return (
                    <tr 
                      key={index} 
                      className={`${selectedRows.has(index) ? 'bg-blue-50' : ''} ${row.errors.length > 0 ? 'bg-red-50' : row.warnings.length > 0 ? 'bg-yellow-50' : 'bg-green-50'}`}
                    >
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(index)}
                          onChange={() => toggleRowSelection(index)}
                          className="rounded border-gray-300"
                        />
                      </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{row.row}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center space-x-1">
                        {row.errors.length > 0 ? (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        ) : row.warnings.length > 0 ? (
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {row.suggestions && row.suggestions.length > 0 && (
                          <Target className="w-3 h-3 text-purple-500" />
                        )}
                        {row.correctedData && (
                          <Zap className="w-3 h-3 text-indigo-500" />
                        )}
                      </div>
                    </td>
                    {Object.keys(columnMapping).map(field => {
                      const isEditing = editingCell?.rowIndex === index && editingCell?.field === field;
                      const cellValue = row.data[field] || '';
                      const hasCorrection = row.correctedData && row.correctedData[field] !== cellValue;
                      
                      return (
                        <td key={field} className="px-4 py-2 text-sm relative">
                          {isEditing ? (
                            <div className="relative">
                              <div className="flex items-center space-x-1">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => {
                                    setEditValue(e.target.value);
                                    generateSuggestions(field, e.target.value);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      saveCellEdit(index, field, editValue);
                                    } else if (e.key === 'Escape') {
                                      cancelCellEdit();
                                    } else if (e.key === 'ArrowDown' && showSuggestions && suggestions.length > 0) {
                                      e.preventDefault();
                                      // Focus on first suggestion (could be enhanced with navigation)
                                    }
                                  }}
                                  onBlur={(e) => {
                                    // Delay to allow clicking on suggestions
                                    setTimeout(() => {
                                      if (!e.currentTarget.parentElement?.contains(document.activeElement)) {
                                        saveCellEdit(index, field, editValue);
                                      }
                                    }, 150);
                                  }}
                                  className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                  autoFocus
                                />
                              </div>
                              
                              {/* Auto-suggestions dropdown */}
                              {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-32 overflow-y-auto">
                                  {suggestions.map((suggestion, i) => (
                                    <div
                                      key={i}
                                      onClick={() => {
                                        setEditValue(suggestion);
                                        setSuggestions([]);
                                        setShowSuggestions(false);
                                        saveCellEdit(index, field, suggestion);
                                      }}
                                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span>{suggestion}</span>
                                        <Target className="w-3 h-3 text-blue-500" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div
                              onClick={() => startCellEdit(index, field, cellValue)}
                              className="cursor-pointer hover:bg-gray-50 p-1 rounded min-h-[24px] group relative"
                            >
                              <span className={hasCorrection ? 'line-through text-gray-400' : 'text-gray-900'}>
                                {cellValue || '-'}
                              </span>
                              {hasCorrection && (
                                <div className="text-green-600 font-medium">
                                  → {row.correctedData[field]}
                                </div>
                              )}
                              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs text-blue-500">✎</span>
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2 text-sm">
                      {[...row.errors, ...row.warnings].slice(0, 2).map((issue, i) => (
                        <div key={i} className={`text-xs ${
                          row.errors.includes(issue) ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {issue}
                        </div>
                      ))}
                      {(row.errors.length + row.warnings.length) > 2 && (
                        <div className="text-xs text-gray-500">
                          +{(row.errors.length + row.warnings.length) - 2} more
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {row.suggestions && row.suggestions.slice(0, 2).map((suggestion, i) => (
                        <div key={i} className="text-xs text-purple-600 mb-1">
                          {suggestion}
                        </div>
                      ))}
                      {row.suggestions && row.suggestions.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{row.suggestions.length - 2} more
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {row.correctedData && (
                        <div className="flex items-center space-x-2">
                          <div className="text-xs text-indigo-600">
                            <Zap className="w-3 h-3 inline mr-1" />
                            Auto-corrected
                          </div>
                          <button
                            onClick={() => applyAutoCorrection(index)}
                            className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
                          >
                            Apply
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {data.length > 10 && (
            <p className="text-sm text-gray-500 mt-2">
              Showing first 10 rows of {data.length} total rows
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={handleImportData}
            disabled={summary.errorRows > 0 || uploadLoading}
            className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Upload className="w-5 h-5" />
            <span>
              {uploadLoading ? 'Importing...' : `Import Valid Data (${summary.validRows} rows)`}
            </span>
          </button>
          <button
            onClick={() => setShowParseResult(false)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back to Upload
          </button>
        </div>

        {summary.errorRows > 0 && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg">
            <p className="text-red-800 text-sm">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Please fix the {summary.errorRows} error(s) in your file before importing.
              Download the corrected template and try again.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Data Entry</h1>
        <p className="text-gray-600">
          Download Excel templates, fill with data, and upload for intelligent processing
        </p>
      </div>

      {/* Department Selection & Auto-Generation Mode */}
      <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">🎯 Smart Auto-Generation</h2>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="auto-generate"
              checked={autoGenerateMode}
              onChange={(e) => setAutoGenerateMode(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="auto-generate" className="text-sm font-medium text-gray-700">
              Enable Auto-Generation
            </label>
          </div>
        </div>

        {autoGenerateMode && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Department
              </label>
              <select
                value={selectedDepartment?.department_id || ''}
                onChange={(e) => {
                  const dept = departments.find(d => d.department_id === parseInt(e.target.value));
                  setSelectedDepartment(dept);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Choose a department...</option>
                {departments.map((dept) => (
                  <option key={dept.department_id} value={dept.department_id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedDepartment && (
              <div className="bg-white p-4 rounded border">
                <h3 className="font-medium text-gray-900 mb-2">Auto-Generation Preview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Roll Number Format:</span>
                    <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">
                      {currentYear}{generateDepartmentCode(selectedDepartment.name)}001
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email Format:</span>
                    <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">
                      rollnumber.firstname@hazir.com
                    </span>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  💡 Only upload essential details (Name, Phone, Address, etc.). Roll numbers and emails will be auto-generated!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('student')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'student'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Student Data Entry
            </button>
            <button
              onClick={() => setActiveTab('teacher')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'teacher'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Teacher Data Entry
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Download Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Download className="w-6 h-6 mr-2 text-blue-500" />
            Step 1: Download Template
          </h2>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Download the Excel template for {activeTab === 'student' ? 'student' : 'teacher'} data entry. 
              The template includes validation rules, examples, and reference data.
            </p>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Template Features:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Pre-configured validation rules</li>
                <li>• Example data in each column</li>
                <li>• Reference sheets for departments/sections</li>
                <li>• Detailed instructions</li>
                <li>• Error prevention guidelines</li>
              </ul>
            </div>

            <button
              onClick={() => handleDownloadTemplate(activeTab)}
              disabled={downloadLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {downloadLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>Download {activeTab === 'student' ? 'Student' : 'Teacher'} Template</span>
                </>
              )}
            </button>

            <button
              onClick={toggleValidationRules}
              className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2"
            >
              <Info className="w-4 h-4" />
              <span>{showValidation ? 'Hide' : 'Show'} Validation Rules</span>
            </button>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Upload className="w-6 h-6 mr-2 text-green-500" />
            Step 2: Upload Filled Data
          </h2>

          <div className="space-y-4">
            <p className="text-gray-600">
              Upload your completed Excel file for intelligent processing and validation.
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="file-upload"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <Upload className="w-12 h-12 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-gray-500">
                  Excel (.xlsx, .xls) or CSV files
                </span>
              </label>
            </div>

            {uploadFile && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-green-900">
                    File selected: {uploadFile.name}
                  </span>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  Size: {(uploadFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            )}

            <button
              onClick={handleProcessFile}
              disabled={!uploadFile || uploadLoading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {uploadLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  <span>Parse & Preview Data</span>
                </>
              )}
            </button>

            <div className="text-xs text-gray-500 space-y-1">
              <p>• Files will be validated automatically</p>
              <p>• Errors will be highlighted for correction</p>
              <p>• Preview before final import</p>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Rules Section */}
      {showValidation && renderValidationRules()}

      {/* Parse Results Section */}
      {showParseResult && renderParseResult()}

      {/* Process Flow - only show if not showing parse results */}
      {!showParseResult && (
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Smart Processing Flow</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                1
              </div>
              <h3 className="font-medium text-gray-900">Download</h3>
              <p className="text-sm text-gray-600">Get template with rules</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-2">
                2
              </div>
              <h3 className="font-medium text-gray-900">Fill Data</h3>
              <p className="text-sm text-gray-600">Complete the template</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                3
              </div>
              <h3 className="font-medium text-gray-900">Upload & Validate</h3>
              <p className="text-sm text-gray-600">Intelligent processing</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                4
              </div>
              <h3 className="font-medium text-gray-900">Import</h3>
              <p className="text-sm text-gray-600">Bulk data insertion</p>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Export Data</h3>
            
            <div className="space-y-4">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {['excel', 'csv', 'json'].map(format => (
                    <button
                      key={format}
                      onClick={() => setExportFormat(format as 'excel' | 'csv' | 'json')}
                      className={`p-2 text-sm border rounded ${
                        exportFormat === format 
                          ? 'bg-blue-100 border-blue-500 text-blue-700' 
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Export Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Export Options</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeValidationReport}
                      onChange={(e) => setExportOptions({...exportOptions, includeValidationReport: e.target.checked})}
                      className="rounded border-gray-300 mr-2"
                    />
                    <span className="text-sm">Include validation report</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeOnlyValid}
                      onChange={(e) => setExportOptions({...exportOptions, includeOnlyValid: e.target.checked})}
                      className="rounded border-gray-300 mr-2"
                    />
                    <span className="text-sm">Export only valid records</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeOriginalData}
                      onChange={(e) => setExportOptions({...exportOptions, includeOriginalData: e.target.checked})}
                      className="rounded border-gray-300 mr-2"
                    />
                    <span className="text-sm">Include original data</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeCorrectedData}
                      onChange={(e) => setExportOptions({...exportOptions, includeCorrectedData: e.target.checked})}
                      className="rounded border-gray-300 mr-2"
                    />
                    <span className="text-sm">Include corrected data</span>
                  </label>
                </div>
              </div>
              
              {/* Export Summary */}
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium text-gray-900 mb-2">Export Summary</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Total records: {parseResult?.summary.totalRows || 0}</div>
                  <div>Valid records: {parseResult?.summary.validRows || 0}</div>
                  <div>Records with errors: {parseResult?.summary.errorRows || 0}</div>
                  <div>Records with warnings: {parseResult?.summary.warningRows || 0}</div>
                  {exportOptions.includeOnlyValid && (
                    <div className="text-blue-600 font-medium">
                      Will export: {parseResult?.summary.validRows || 0} valid records only
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={exportLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {exportLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEdit && selectedRows.size > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Bulk Edit ({selectedRows.size} records)
              </h3>
              <button
                onClick={() => setShowBulkEdit(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Apply changes to all selected records. Only fields you modify will be updated.
              </p>

              {/* Bulk Edit Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="Leave empty to keep current values"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    id="bulk-department"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    placeholder="Leave empty to keep current values"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    id="bulk-section"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester
                  </label>
                  <input
                    type="number"
                    placeholder="Leave empty to keep current values"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    id="bulk-semester"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    placeholder="Leave empty to keep current values"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    id="bulk-phone"
                  />
                </div>
              </div>

              {/* Preview of affected records */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-2">Selected Records</h4>
                <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {parseResult?.data.filter((_, index) => selectedRows.has(index)).map((row, index) => (
                    <div key={index} className="text-sm text-gray-600 py-1">
                      {row.data.name || row.data.full_name || `Row ${index + 1}`} - {row.data.email}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowBulkEdit(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Apply bulk edits
                  const department = (document.getElementById('bulk-department') as HTMLInputElement)?.value;
                  const section = (document.getElementById('bulk-section') as HTMLInputElement)?.value;
                  const semester = (document.getElementById('bulk-semester') as HTMLInputElement)?.value;
                  const phone = (document.getElementById('bulk-phone') as HTMLInputElement)?.value;

                  if (!department && !section && !semester && !phone) {
                    alert('Please enter at least one field to update.');
                    return;
                  }

                  const newData = [...(parseResult?.data || [])];
                  selectedRows.forEach((rowIndex) => {
                    if (department) newData[rowIndex].data.department = department;
                    if (section) newData[rowIndex].data.section = section;
                    if (semester) newData[rowIndex].data.semester = semester;
                    if (phone) newData[rowIndex].data.phone = phone;
                  });

                  setParseResult(prev => prev ? { ...prev, data: newData } : null);
                  setShowBulkEdit(false);
                  setSelectedRows(new Set());
                  
                  alert(`Updated ${selectedRows.size} records successfully!`);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
              >
                <Target className="w-4 h-4" />
                <span>Apply Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartDataEntry;