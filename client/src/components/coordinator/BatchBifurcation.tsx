import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shuffle, 
  AlertCircle, 
  CheckCircle, 
  Loader, 
  Plus,
  Minus,
  UserCheck,
  BarChart3,
  ArrowRight
} from 'lucide-react';
import { 
  getStudentsBySection,
  fetchBatchesBySection,
  bulkAssignStudentsToBatches,
  autoDistributeStudentsToBatches,
  removeStudentsFromBatch,
  createBatch
} from '../../services/api';

interface Student {
  student_id: number;
  name: string;
  roll_number: string;
  semester: number;
  user: { email: string };
  section: { section_name: string; semester: number };
  batch?: { batch_name: string; batch_size: number };
}

interface Batch {
  batch_id: number;
  batch_name: string;
  batch_size: number;
  description?: string;
}

interface BatchBifurcationProps {
  sectionId: string | number;
  sectionName: string;
  onBifurcationComplete?: () => void;
}

const BatchBifurcation: React.FC<BatchBifurcationProps> = ({
  sectionId,
  sectionName,
  onBifurcationComplete
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [targetBatch, setTargetBatch] = useState<string>('');
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchSize, setNewBatchSize] = useState(30);

  useEffect(() => {
    if (sectionId) {
      loadData();
    }
  }, [sectionId]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [studentsData, batchesData] = await Promise.all([
        getStudentsBySection(sectionId, true),
        fetchBatchesBySection(sectionId)
      ]);

      const allStudents = studentsData.data || [];
      setStudents(allStudents);
      setBatches(batchesData || []);
      
      // Filter unassigned students
      const unassigned = allStudents.filter((s: Student) => !s.batch);
      setUnassignedStudents(unassigned);
    } catch (err: any) {
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async () => {
    if (!newBatchName.trim()) {
      setError('Batch name is required');
      return;
    }

    try {
      await createBatch({
        section_id: Number(sectionId),
        batch_name: newBatchName.trim(),
        batch_size: newBatchSize,
        description: `Batch for ${sectionName}`
      });

      setSuccess(`Created batch "${newBatchName}" successfully`);
      setNewBatchName('');
      setNewBatchSize(30);
      setShowCreateBatch(false);
      await loadData();
    } catch (err: any) {
      setError(`Failed to create batch: ${err.message}`);
    }
  };

  const handleStudentToggle = (studentId: number) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectAllUnassigned = () => {
    if (selectedStudents.size === unassignedStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(unassignedStudents.map(s => s.student_id)));
    }
  };

  const handleManualAssignment = async () => {
    if (selectedStudents.size === 0) {
      setError('Please select at least one student');
      return;
    }

    if (!targetBatch) {
      setError('Please select a target batch');
      return;
    }

    setProcessing(true);
    setError('');
    try {
      const assignments = Array.from(selectedStudents).map(studentId => ({
        studentId,
        batchId: Number(targetBatch)
      }));

      const result = await bulkAssignStudentsToBatches(assignments);
      
      setSuccess(`Successfully assigned ${result.results.successful} students to batch`);
      setSelectedStudents(new Set());
      setTargetBatch('');
      await loadData();
      
      if (onBifurcationComplete) {
        onBifurcationComplete();
      }
    } catch (err: any) {
      setError(`Assignment failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleAutoDistribution = async () => {
    if (batches.length === 0) {
      setError('No batches available for distribution');
      return;
    }

    if (unassignedStudents.length === 0) {
      setError('No unassigned students to distribute');
      return;
    }

    setProcessing(true);
    setError('');
    try {
      const batchIds = batches.map(b => b.batch_id);
      const result = await autoDistributeStudentsToBatches(sectionId, batchIds);
      
      setSuccess(`Successfully distributed ${result.data.totalStudents} students across ${batchIds.length} batches`);
      await loadData();
      
      if (onBifurcationComplete) {
        onBifurcationComplete();
      }
    } catch (err: any) {
      setError(`Auto-distribution failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveFromBatch = async (studentIds: number[]) => {
    setProcessing(true);
    setError('');
    try {
      const result = await removeStudentsFromBatch(studentIds);
      setSuccess(`Successfully removed ${result.count} students from their batches`);
      await loadData();
    } catch (err: any) {
      setError(`Failed to remove students: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const getBatchStats = () => {
    return batches.map(batch => {
      const studentsInBatch = students.filter(s => s.batch?.batch_name === batch.batch_name);
      return {
        ...batch,
        currentSize: studentsInBatch.length,
        utilization: ((studentsInBatch.length / batch.batch_size) * 100).toFixed(1)
      };
    });
  };

  const batchStats = getBatchStats();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Shuffle className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Batch Bifurcation</h2>
            <p className="text-gray-600">Distribute students from {sectionName} into batches</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {unassignedStudents.length} unassigned • {students.length} total students
        </div>
      </div>

      {/* Mode Selection */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="mode"
                value="manual"
                checked={mode === 'manual'}
                onChange={(e) => setMode(e.target.value as 'manual' | 'auto')}
                className="w-4 h-4 text-purple-600 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Manual Assignment</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="mode"
                value="auto"
                checked={mode === 'auto'}
                onChange={(e) => setMode(e.target.value as 'manual' | 'auto')}
                className="w-4 h-4 text-purple-600 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Auto Distribution</span>
            </label>
          </div>
          <button
            onClick={() => setShowCreateBatch(!showCreateBatch)}
            className="flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Plus className="w-4 h-4" />
            <span>Create Batch</span>
          </button>
        </div>

        {/* Create Batch Form */}
        {showCreateBatch && (
          <div className="border-t pt-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Name
                </label>
                <input
                  type="text"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  placeholder="e.g., Batch A, Group 1"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Size
                </label>
                <input
                  type="number"
                  value={newBatchSize}
                  onChange={(e) => setNewBatchSize(Number(e.target.value))}
                  min="1"
                  max="100"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleCreateBatch}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                >
                  Create Batch
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-green-700 text-sm">{success}</span>
        </div>
      )}

      {/* Batch Statistics */}
      {batches.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Batch Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batchStats.map((batch) => (
              <div key={batch.batch_id} className="bg-white p-3 rounded-lg border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">{batch.batch_name}</span>
                  <span className="text-sm text-gray-600">{batch.currentSize}/{batch.batch_size}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(Number(batch.utilization), 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{batch.utilization}% filled</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader className="w-8 h-8 animate-spin text-purple-600" />
          <span className="ml-2 text-gray-600">Loading students...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Unassigned Students */}
          <div className="border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Unassigned Students ({unassignedStudents.length})
                </h3>
                {mode === 'manual' && unassignedStudents.length > 0 && (
                  <button
                    onClick={handleSelectAllUnassigned}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    {selectedStudents.size === unassignedStudents.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {unassignedStudents.length === 0 ? (
                <div className="p-8 text-center">
                  <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">All students are assigned to batches</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {unassignedStudents.map((student) => (
                    <div
                      key={student.student_id}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        selectedStudents.has(student.student_id)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => mode === 'manual' && handleStudentToggle(student.student_id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {mode === 'manual' && (
                            <input
                              type="checkbox"
                              checked={selectedStudents.has(student.student_id)}
                              onChange={() => handleStudentToggle(student.student_id)}
                              className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-600">{student.roll_number}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Assigned Students by Batch */}
          <div className="border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900">
                Assigned Students ({students.length - unassignedStudents.length})
              </h3>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {batches.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No batches created yet</p>
                </div>
              ) : (
                <div className="p-2">
                  {batches.map((batch) => {
                    const batchStudents = students.filter(s => s.batch?.batch_name === batch.batch_name);
                    return (
                      <div key={batch.batch_id} className="mb-4">
                        <div className="flex items-center justify-between p-2 bg-gray-100 rounded-t">
                          <span className="font-medium text-gray-900">{batch.batch_name}</span>
                          <span className="text-sm text-gray-600">{batchStudents.length} students</span>
                        </div>
                        {batchStudents.length > 0 && (
                          <div className="border border-t-0 rounded-b p-2 space-y-1">
                            {batchStudents.map((student) => (
                              <div key={student.student_id} className="flex items-center justify-between p-2 bg-white border border-gray-100 rounded text-sm">
                                <div>
                                  <span className="font-medium">{student.name}</span>
                                  <span className="text-gray-600 ml-2">({student.roll_number})</span>
                                </div>
                                <button
                                  onClick={() => handleRemoveFromBatch([student.student_id])}
                                  className="text-red-600 hover:text-red-800"
                                  title="Remove from batch"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!loading && (
        <div className="mt-6 flex justify-end space-x-4">
          {mode === 'manual' && (
            <>
              <select
                value={targetBatch}
                onChange={(e) => setTargetBatch(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={selectedStudents.size === 0}
              >
                <option value="">Select Target Batch</option>
                {batches.map(batch => (
                  <option key={batch.batch_id} value={batch.batch_id}>
                    {batch.batch_name} ({batchStats.find(b => b.batch_id === batch.batch_id)?.currentSize || 0}/{batch.batch_size})
                  </option>
                ))}
              </select>
              <button
                onClick={handleManualAssignment}
                disabled={selectedStudents.size === 0 || !targetBatch || processing}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                <span>Assign to Batch</span>
              </button>
            </>
          )}

          {mode === 'auto' && (
            <button
              onClick={handleAutoDistribution}
              disabled={batches.length === 0 || unassignedStudents.length === 0 || processing}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Shuffle className="w-4 h-4" />
              )}
              <span>Auto Distribute</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchBifurcation;