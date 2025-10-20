import React, { useEffect, useState } from "react";
import {
  fetchSectionsByDepartment,
  createSection,
  updateSection,
  deleteSection,
  fetchAllDepartments,
  fetchBatchesBySection,
  createBatch,
  updateBatch,
  deleteBatch,
} from "../../services/api";

interface SectionManagementProps {
  departmentId: string;
}

const SectionManagement: React.FC<SectionManagementProps> = ({
  departmentId,
}) => {
  const [sections, setSections] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionSemester, setNewSectionSemester] = useState("");
  const [newSectionDescription, setNewSectionDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSemester, setEditSemester] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Batch management states
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
  );
  const [batches, setBatches] = useState<any[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchSuccess, setBatchSuccess] = useState<string | null>(null);
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchSize, setNewBatchSize] = useState(30);
  const [newBatchDescription, setNewBatchDescription] = useState("");
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [editBatchName, setEditBatchName] = useState("");
  const [editBatchSize, setEditBatchSize] = useState(30);
  const [editBatchDescription, setEditBatchDescription] = useState("");

  const loadSections = async () => {
    if (!departmentId) return;
    setLoading(true);
    setError(null);
    try {
      const sectionsData = await fetchSectionsByDepartment(departmentId);
      setSections(sectionsData);
    } catch (e: any) {
      setError(e?.message || "Failed to load sections");
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const deps = await fetchAllDepartments();
      setDepartments(deps);
    } catch (e) {
      console.warn("Failed to load departments");
    }
  };

  useEffect(() => {
    loadSections();
    loadDepartments();
  }, [departmentId]);

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) return;
    try {
      setError(null);
      await createSection({
        department_id: Number(departmentId),
        section_name: newSectionName.trim(),
        semester: newSectionSemester ? parseInt(newSectionSemester) : undefined,
        description: newSectionDescription.trim() || "",
      });
      setNewSectionName("");
      setNewSectionSemester("");
      setNewSectionDescription("");
      await loadSections();
    } catch (e: any) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to create section"
      );
    }
  };

  const startEdit = (section: any) => {
    setEditingId(section.section_id);
    setEditName(section.section_name);
    setEditSemester(section.semester ? section.semester.toString() : "");
    setEditDescription(section.description || "");
  };

  const handleUpdateSection = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      setError(null);
      await updateSection(editingId, {
        section_name: editName.trim(),
        semester: editSemester ? parseInt(editSemester) : undefined,
        description: editDescription.trim() || "",
      });
      setEditingId(null);
      setEditName("");
      setEditSemester("");
      setEditDescription("");
      await loadSections();
    } catch (e: any) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to update section"
      );
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this section? Students in this section will need to be reassigned."
      )
    ) {
      return;
    }
    try {
      setError(null);
      await deleteSection(sectionId);
      await loadSections();
    } catch (e: any) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to delete section"
      );
    }
  };

  const getDepartmentName = () => {
    const dept = departments.find(
      (d) => String(d.department_id || d.id) === String(departmentId)
    );
    return dept?.name || dept?.department_name || "Unknown Department";
  };

  // Batch management functions
  const loadBatches = async (sectionId: string) => {
    setBatchLoading(true);
    setBatchError(null);
    try {
      const batchesData = await fetchBatchesBySection(sectionId);
      setBatches(batchesData);
    } catch (e: any) {
      setBatchError(
        e?.response?.data?.message || e?.message || "Failed to load batches"
      );
      setBatches([]);
    } finally {
      setBatchLoading(false);
    }
  };

  const selectSection = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    setBatchSuccess(null);
    setBatchError(null);
    loadBatches(sectionId);
  };

  const handleCreateBatch = async () => {
    if (!selectedSectionId || !newBatchName.trim()) {
      setBatchError("Please enter a batch name");
      return;
    }

    try {
      setBatchError(null);
      const batchData = {
        section_id: parseInt(selectedSectionId),
        batch_name: newBatchName.trim(),
        batch_size: newBatchSize,
        description: newBatchDescription.trim(),
      };

      await createBatch(batchData);
      setBatchSuccess(`Batch "${newBatchName}" created successfully!`);

      // Reset form
      setNewBatchName("");
      setNewBatchSize(30);
      setNewBatchDescription("");

      // Reload batches
      await loadBatches(selectedSectionId);

      // Clear success message after 3 seconds
      setTimeout(() => setBatchSuccess(null), 3000);
    } catch (error: any) {
      setBatchError(error?.response?.data?.message || "Failed to create batch");
    }
  };

  const startEditBatch = (batch: any) => {
    setEditingBatchId(batch.batch_id.toString());
    setEditBatchName(batch.batch_name);
    setEditBatchSize(batch.batch_size);
    setEditBatchDescription(batch.description || "");
  };

  const handleUpdateBatch = async () => {
    if (!editingBatchId || !editBatchName.trim()) return;

    try {
      setBatchError(null);
      await updateBatch(editingBatchId, {
        batch_name: editBatchName.trim(),
        batch_size: editBatchSize,
        description: editBatchDescription.trim(),
      });

      setBatchSuccess("Batch updated successfully!");
      setEditingBatchId(null);
      setEditBatchName("");
      setEditBatchSize(30);
      setEditBatchDescription("");

      // Reload batches
      if (selectedSectionId) {
        await loadBatches(selectedSectionId);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setBatchSuccess(null), 3000);
    } catch (error: any) {
      setBatchError(error?.response?.data?.message || "Failed to update batch");
    }
  };

  const handleDeleteBatch = async (batchId: string, batchName: string) => {
    if (
      !window.confirm(`Are you sure you want to delete batch "${batchName}"?`)
    ) {
      return;
    }

    try {
      setBatchError(null);
      await deleteBatch(batchId);
      setBatchSuccess(`Batch "${batchName}" deleted successfully!`);

      // Reload batches
      if (selectedSectionId) {
        await loadBatches(selectedSectionId);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setBatchSuccess(null), 3000);
    } catch (error: any) {
      setBatchError(error?.response?.data?.message || "Failed to delete batch");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800">
          📋 Sections for {getDepartmentName()}
        </h3>
        <div className="text-sm text-gray-500">
          Total:{" "}
          <span className="font-semibold text-blue-600">{sections.length}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            {error}
          </div>
        </div>
      )}

      {/* Add new section */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-700 mb-3">➕ Add New Section</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <input
              type="text"
              placeholder="Section name (e.g., A, B, Morning, Evening)"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={50}
            />
          </div>
          <div>
            <select
              value={newSectionSemester}
              onChange={(e) => setNewSectionSemester(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Semester (Optional)</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>
          <div>
            <input
              type="text"
              placeholder="Description (optional)"
              value={newSectionDescription}
              onChange={(e) => setNewSectionDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <button
              onClick={handleCreateSection}
              disabled={!newSectionName.trim() || loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Add Section
            </button>
          </div>
        </div>
      </div>

      {/* Sections list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading sections...</span>
        </div>
      ) : sections.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📚</div>
          <p>No sections created yet</p>
          <p className="text-sm">Add your first section above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section: any) => {
            const isEditing = editingId === section.section_id;
            return (
              <div
                key={section.section_id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-lg">
                      {section.section_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          maxLength={50}
                          placeholder="Section name"
                        />
                        <select
                          value={editSemester}
                          onChange={(e) => setEditSemester(e.target.value)}
                          className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Semester (Optional)</option>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                            <option key={sem} value={sem}>
                              Semester {sem}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Description (optional)"
                          className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          Section {section.section_name}
                          {section.semester && (
                            <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              Sem {section.semester}
                            </span>
                          )}
                        </h4>
                        {section.description && (
                          <p className="text-sm text-gray-600">
                            {section.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleUpdateSection}
                        disabled={!editName.trim()}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditName("");
                          setEditSemester("");
                          setEditDescription("");
                        }}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(section)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => selectSection(section.section_id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Manage Batches
                      </button>
                      <button
                        onClick={() => handleDeleteSection(section.section_id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Batch Management Section */}
      {selectedSectionId && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">
              🗂️ Batch Management for{" "}
              {
                sections.find(
                  (s) => s.section_id === parseInt(selectedSectionId)
                )?.section_name
              }
            </h3>
            <button
              onClick={() => {
                setSelectedSectionId(null);
                setBatches([]);
                setBatchError(null);
                setBatchSuccess(null);
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              ✕ Close
            </button>
          </div>

          {/* Batch Error/Success Messages */}
          {batchError && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                {batchError}
              </div>
            </div>
          )}

          {batchSuccess && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                {batchSuccess}
              </div>
            </div>
          )}

          {/* Create New Batch Form */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-3">Create New Batch</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Name *
                </label>
                <input
                  type="text"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  placeholder="e.g., Batch A, Group 1, Tutorial Alpha"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Size
                </label>
                <input
                  type="number"
                  value={newBatchSize}
                  onChange={(e) =>
                    setNewBatchSize(parseInt(e.target.value) || 30)
                  }
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newBatchDescription}
                  onChange={(e) => setNewBatchDescription(e.target.value)}
                  placeholder="Optional description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <button
              onClick={handleCreateBatch}
              disabled={!newBatchName.trim()}
              className="mt-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              ➕ Create Batch
            </button>
          </div>

          {/* Existing Batches List */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3">
              Existing Batches ({batches.length})
            </h4>
            {batchLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <span className="ml-2 text-gray-600">Loading batches...</span>
              </div>
            ) : batches.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No batches found for this section. Create some batches for
                tutorial/lab classes.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {batches.map((batch) => {
                  const isEditingBatch =
                    editingBatchId === batch.batch_id.toString();
                  return (
                    <div
                      key={batch.batch_id}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      {isEditingBatch ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editBatchName}
                            onChange={(e) => setEditBatchName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <input
                            type="number"
                            value={editBatchSize}
                            onChange={(e) =>
                              setEditBatchSize(parseInt(e.target.value) || 30)
                            }
                            min="1"
                            max="100"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <input
                            type="text"
                            value={editBatchDescription}
                            onChange={(e) =>
                              setEditBatchDescription(e.target.value)
                            }
                            placeholder="Description"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={handleUpdateBatch}
                              disabled={!editBatchName.trim()}
                              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingBatchId(null);
                                setEditBatchName("");
                                setEditBatchSize(30);
                                setEditBatchDescription("");
                              }}
                              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="mb-3">
                            <h5 className="font-medium text-gray-800">
                              {batch.batch_name}
                            </h5>
                            <p className="text-sm text-gray-600">
                              Size: {batch.batch_size} students
                            </p>
                            {batch.description && (
                              <p className="text-xs text-gray-500 mt-1">
                                {batch.description}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEditBatch(batch)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteBatch(
                                  batch.batch_id.toString(),
                                  batch.batch_name
                                )
                              }
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">
          💡 Section Management Tips
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>
            • Sections help organize students within a department (e.g., A, B,
            Morning, Evening)
          </li>
          <li>
            • You can assign sections to specific semesters for better
            organization
          </li>
          <li>• Each section name must be unique within the department</li>
          <li>
            • Students can be assigned to sections when creating or editing
            their profiles
          </li>
          <li>• Deleting a section will unassign students from it</li>
        </ul>
      </div>
    </div>
  );
};

export default SectionManagement;