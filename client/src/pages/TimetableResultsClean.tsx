import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  Download,
  Save,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Filter,
  Eye,
  RefreshCw,
  ArrowLeft,
  Grid3X3,
  Award,
  Target,
  FileDown,
  Database,
  FileText,
  Table,
  FolderOpen,
  Upload,
} from "lucide-react";
import { useLocation, useHistory } from "react-router-dom";

interface TimetableEntry {
  day: string;
  timeSlot: string;
  courseCode: string;
  courseName: string;
  teacherName: string;
  roomNumber: string;
  sessionType: "theory" | "lab" | "tutorial";
  section: string;
  semester?: number; // Add optional semester field
  department_id?: number; // Add department ID for filtering
  department_name?: string; // Add department name for display
}

interface TimetableSolution {
  id: string;
  name: string;
  score: number;
  optimization: string;
  conflicts: number;
  quality: {
    overall_score: number;
    teacher_satisfaction: number;
    student_satisfaction: number;
    resource_utilization: number;
  };
  timetable_entries: TimetableEntry[];
  generation_time: string;
  metadata: {
    total_classes: number;
    teachers_involved: number;
    rooms_used: number;
    conflicts_resolved: number;
  };
}

const TimetableResults: React.FC = () => {
  const location = useLocation();
  const history = useHistory();
  const [solutions, setSolutions] = useState<TimetableSolution[]>([]);
  const [selectedSolution, setSelectedSolution] =
    useState<TimetableSolution | null>(null);
  const [viewMode, setViewMode] = useState<
    "overview" | "detailed" | "comparison"
  >("overview");
  const [selectedSections, setSelectedSections] = useState<string[]>(["A"]);
  const [availableSections, setAvailableSections] = useState<string[]>([
    "A",
    "B",
    "C",
  ]);
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [availableSemesters, setAvailableSemesters] = useState<number[]>([1]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | null
  >(null);
  const [availableDepartments, setAvailableDepartments] = useState<
    Array<{ id: number; name: string }>
  >([]);

  // Export/Save state
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<
    "pdf" | "excel" | "csv" | "json"
  >("excel");
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [savedTimetables, setSavedTimetables] = useState<any[]>([]);
  const [saveMetadata, setSaveMetadata] = useState({
    institutionName: "",
    academicYear: "2024-25",
    description: "",
  });
  const [dataSource, setDataSource] = useState<"real" | "mock">("mock");

  useEffect(() => {
    const state = location.state as any;
    console.log("🔍 TimetableResults received state:", state);

    if (
      state?.solutions &&
      Array.isArray(state.solutions) &&
      state.solutions.length > 0
    ) {
      console.log(
        "✅ Using real solutions from Gemini:",
        state.solutions.length,
        "solutions"
      );
      setSolutions(state.solutions);
      setSelectedSolution(state.solutions[0]);
      setDataSource("real");

      // Extract available sections and semesters from the generated data
      const sections = new Set<string>();
      const semesters = new Set<number>();
      const departments = new Map<number, string>();

      console.log(
        "🔍 Extracting data from timetable entries:",
        state.solutions[0]?.timetable_entries?.length,
        "entries"
      );
      console.log(
        "🔍 Sample entry:",
        state.solutions[0]?.timetable_entries?.[0]
      );

      state.solutions[0]?.timetable_entries?.forEach((entry: any) => {
        if (entry.section) sections.add(entry.section);
        if (entry.semester) semesters.add(entry.semester);
        if (entry.department_id && entry.department_name) {
          console.log(
            `🏢 Found department: ${entry.department_id} - ${entry.department_name}`
          );
          departments.set(entry.department_id, entry.department_name);
        } else if (entry.department_id || entry.department_name) {
          console.warn("⚠️ Partial department data:", {
            dept_id: entry.department_id,
            dept_name: entry.department_name,
          });
        }
      });
      const sectionArray = Array.from(sections).sort();
      const semesterArray = Array.from(semesters).sort((a, b) => a - b);
      const departmentArray = Array.from(departments.entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));

      if (sectionArray.length > 0) {
        setAvailableSections(sectionArray);
        setSelectedSections([sectionArray[0]]);
      }
      if (semesterArray.length > 0) {
        setAvailableSemesters(semesterArray);
        setSelectedSemester(semesterArray[0]);
      }
      if (departmentArray.length > 0) {
        setAvailableDepartments(departmentArray);
        setSelectedDepartmentId(departmentArray[0].id);
      }
      console.log("📋 Available sections:", sectionArray);
      console.log("📚 Available semesters:", semesterArray);
      console.log("🏢 Available departments:", departmentArray);
    } else {
      console.log("⚠️ No valid solutions found in state, loading mock data");
      console.log("State details:", {
        hasState: !!state,
        hasSolutions: !!state?.solutions,
        isArray: Array.isArray(state?.solutions),
        length: state?.solutions?.length,
      });
      loadMockSolutions();
      setDataSource("mock");
    }
  }, [location.state]);

  const loadMockSolutions = () => {
    const mockSolutions: TimetableSolution[] = [
      {
        id: "solution-1",
        name: "Teacher-Optimized Solution",
        score: 95.5,
        optimization: "teacher-focused",
        conflicts: 0,
        quality: {
          overall_score: 95.5,
          teacher_satisfaction: 98.2,
          student_satisfaction: 89.1,
          resource_utilization: 91.7,
        },
        timetable_entries: generateMockTimetableEntries(),
        generation_time: "1.2s",
        metadata: {
          total_classes: 42,
          teachers_involved: 8,
          rooms_used: 12,
          conflicts_resolved: 15,
        },
      },
      {
        id: "solution-2",
        name: "Student-Optimized Solution",
        score: 92.8,
        optimization: "student-focused",
        conflicts: 1,
        quality: {
          overall_score: 92.8,
          teacher_satisfaction: 85.4,
          student_satisfaction: 96.7,
          resource_utilization: 88.3,
        },
        timetable_entries: generateMockTimetableEntries(),
        generation_time: "1.5s",
        metadata: {
          total_classes: 42,
          teachers_involved: 8,
          rooms_used: 11,
          conflicts_resolved: 12,
        },
      },
      {
        id: "solution-3",
        name: "Balanced Solution",
        score: 89.3,
        optimization: "balanced",
        conflicts: 2,
        quality: {
          overall_score: 89.3,
          teacher_satisfaction: 91.2,
          student_satisfaction: 92.8,
          resource_utilization: 94.1,
        },
        timetable_entries: generateMockTimetableEntries(),
        generation_time: "0.9s",
        metadata: {
          total_classes: 42,
          teachers_involved: 8,
          rooms_used: 10,
          conflicts_resolved: 18,
        },
      },
    ];
    setSolutions(mockSolutions);
    setSelectedSolution(mockSolutions[0]);
  };

  // Export functionality
  const handleExport = async () => {
    if (!selectedSolution) return;

    try {
      setIsExporting(true);

      // For JSON format, handle directly on client side
      if (exportFormat === "json") {
        const jsonData = {
          ...selectedSolution,
          export_metadata: {
            institution_name: saveMetadata.institutionName,
            academic_year: saveMetadata.academicYear,
            exported_at: new Date().toISOString(),
            format: "json",
          },
        };
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
          type: "application/json",
        });
        downloadFile(
          blob,
          `timetable-${selectedSolution.name
            .toLowerCase()
            .replace(/\s+/g, "-")}-${Date.now()}.json`
        );
        setShowExportModal(false);
        setIsExporting(false);
        return;
      }

      // For other formats, call the API
      const response = await fetch("/api/smart-timetable/solutions/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          solution: selectedSolution,
          format: exportFormat,
          metadata: saveMetadata,
        }),
      });

      if (!response.ok) {
        // Try to parse error message, but handle non-JSON responses
        let errorMessage = "Export failed";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } else {
            const errorText = await response.text();
            console.error("Server error response:", errorText);
            errorMessage = `Export failed (${response.status})`;
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
          errorMessage = `Export failed with status ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      // Handle file download
      const blob = await response.blob();
      const filename = `timetable-${selectedSolution.name
        .toLowerCase()
        .replace(/\s+/g, "-")}-${Date.now()}.${
        exportFormat === "excel" ? "xlsx" : exportFormat
      }`;
      downloadFile(blob, filename);

      setShowExportModal(false);
      alert("Export completed successfully!");
    } catch (error) {
      console.error("Export error:", error);
      alert(
        `Export failed: ${
          error instanceof Error ? error.message : "Please try again."
        }`
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Save functionality
  const handleSave = async () => {
    if (!selectedSolution) return;

    if (!saveMetadata.institutionName || !saveMetadata.academicYear) {
      alert("Please fill in Institution Name and Academic Year");
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch("/api/smart-timetable/solutions/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          solution: selectedSolution,
          metadata: saveMetadata,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Save failed");
      }

      const result = await response.json();
      alert("Timetable saved successfully!");
      setShowSaveModal(false);
    } catch (error) {
      console.error("Save error:", error);
      alert(
        `Save failed: ${
          error instanceof Error ? error.message : "Please try again."
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Load saved timetables
  const handleLoadSaved = async () => {
    try {
      setIsLoading(true);
      setShowLoadModal(true);

      const response = await fetch("/api/smart-timetable/solutions/saved", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load saved timetables");
      }

      const result = await response.json();
      setSavedTimetables(result.data || []);
    } catch (error) {
      console.error("Load error:", error);
      alert(
        `Failed to load saved timetables: ${
          error instanceof Error ? error.message : "Please try again."
        }`
      );
      setShowLoadModal(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Load a specific saved timetable
  const handleSelectSavedTimetable = (savedTimetable: any) => {
    console.log("📥 Loading saved timetable:", savedTimetable);
    console.log(
      "📊 Timetable entries:",
      savedTimetable.solution_data?.timetable_entries
    );
    console.log(
      "📊 First entry:",
      savedTimetable.solution_data?.timetable_entries?.[0]
    );

    const entries = savedTimetable.solution_data?.timetable_entries || [];

    // Extract unique sections and semesters from loaded data
    const loadedSections = Array.from(
      new Set(entries.map((e: any) => e.section).filter(Boolean))
    );
    const loadedSemesters = Array.from(
      new Set(entries.map((e: any) => e.semester).filter(Boolean))
    );

    console.log("📋 Loaded sections:", loadedSections);
    console.log("📋 Loaded semesters:", loadedSemesters);

    // Convert saved format to solution format
    const solution: TimetableSolution = {
      id: savedTimetable.solution_id,
      name: savedTimetable.solution_data?.name || "Loaded Solution",
      score: savedTimetable.solution_data?.score || 0,
      optimization: savedTimetable.solution_data?.optimization || "balanced",
      conflicts: savedTimetable.solution_data?.conflicts || 0,
      quality: savedTimetable.solution_data?.quality || {
        overall_score: 0,
        teacher_satisfaction: 0,
        student_satisfaction: 0,
        resource_utilization: 0,
      },
      timetable_entries: entries,
      generation_time: "Loaded from database",
      metadata: savedTimetable.solution_data?.metadata || {
        total_classes: 0,
        teachers_involved: 0,
        rooms_used: 0,
        conflicts_resolved: 0,
      },
    };

    console.log("✅ Converted solution:", solution);
    console.log(
      "✅ Converted entries count:",
      solution.timetable_entries.length
    );
    console.log("✅ First converted entry:", solution.timetable_entries[0]);

    // Update available sections and semesters
    if (loadedSections.length > 0) {
      setAvailableSections(loadedSections as string[]);
      setSelectedSections(loadedSections as string[]); // ✅ SELECT ALL SECTIONS!
      console.log("✅ Set sections to:", loadedSections);
    }

    if (loadedSemesters.length > 0) {
      setAvailableSemesters(loadedSemesters as number[]);
      setSelectedSemester(loadedSemesters[0] as number); // Select first semester by default
      console.log("✅ Set semester to:", loadedSemesters[0]);
    }

    setSolutions([solution]);
    setSelectedSolution(solution);
    setShowLoadModal(false);
    setDataSource("real");
    alert("Timetable loaded successfully!");
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const generateMockTimetableEntries = (): TimetableEntry[] => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const timeSlots = [
      "09:00-10:00",
      "10:00-11:00",
      "11:00-12:00",
      "14:00-15:00",
      "15:00-16:00",
    ];
    const courses = [
      { code: "CS301", name: "Data Structures", type: "theory" },
      { code: "CS302", name: "Database Systems", type: "theory" },
      { code: "CS303L", name: "DS Lab", type: "lab" },
      { code: "CS304L", name: "DB Lab", type: "lab" },
    ];
    const teachers = [
      "Dr. Smith",
      "Prof. Johnson",
      "Dr. Wilson",
      "Prof. Brown",
    ];
    const sections = ["A", "B", "C"];

    const entries: TimetableEntry[] = [];

    days.forEach((day) => {
      timeSlots.forEach((timeSlot) => {
        sections.forEach((section) => {
          if (Math.random() > 0.3) {
            const course = courses[Math.floor(Math.random() * courses.length)];
            entries.push({
              day,
              timeSlot,
              courseCode: course.code,
              courseName: course.name,
              teacherName:
                teachers[Math.floor(Math.random() * teachers.length)],
              roomNumber:
                course.type === "lab"
                  ? `Lab-${Math.floor(Math.random() * 5) + 1}`
                  : `Room-${Math.floor(Math.random() * 20) + 101}`,
              sessionType: course.type as "theory" | "lab" | "tutorial",
              section,
            });
          }
        });
      });
    });

    return entries;
  };

  const renderSolutionCard = (solution: TimetableSolution, index: number) => {
    const isSelected = selectedSolution?.id === solution.id;
    const optimizationIcon =
      solution.optimization === "teacher-focused"
        ? Users
        : solution.optimization === "student-focused"
        ? BookOpen
        : Target;
    const OptIcon = optimizationIcon;

    return (
      <div
        key={solution.id}
        onClick={() => setSelectedSolution(solution)}
        className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
          isSelected
            ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 ring-4 ring-blue-200 shadow-lg"
            : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-xl hover:bg-gray-50"
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div
              className={`p-2 rounded-lg ${
                solution.optimization === "teacher-focused"
                  ? "bg-purple-100 text-purple-600"
                  : solution.optimization === "student-focused"
                  ? "bg-green-100 text-green-600"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              <OptIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {solution.name}
              </h3>
              <p className="text-sm text-gray-600 capitalize">
                {solution.optimization.replace("-", " ")} optimization
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`flex items-center px-3 py-1 rounded-full ${
                solution.score >= 90
                  ? "bg-green-100 text-green-800"
                  : solution.score >= 80
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <Award className="w-4 h-4 mr-1" />
              <span className="text-sm font-bold">{solution.score}%</span>
            </div>
            {solution.conflicts === 0 ? (
              <div className="bg-green-100 p-1 rounded-full">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            ) : (
              <div className="bg-yellow-100 p-1 rounded-full flex items-center">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-xs ml-1 font-semibold">
                  {solution.conflicts}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="text-xl font-bold text-blue-700">
              {solution.quality?.teacher_satisfaction || 0}%
            </div>
            <div className="text-xs text-blue-600 font-medium">
              Teacher Satisfaction
            </div>
            <div className="w-full bg-blue-200 rounded-full h-1.5 mt-1">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${solution.quality?.teacher_satisfaction || 0}%`,
                }}
              ></div>
            </div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="text-xl font-bold text-green-700">
              {solution.quality?.student_satisfaction || 0}%
            </div>
            <div className="text-xs text-green-600 font-medium">
              Student Satisfaction
            </div>
            <div className="w-full bg-green-200 rounded-full h-1.5 mt-1">
              <div
                className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${solution.quality?.student_satisfaction || 0}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Classes:</span>
            <span>{solution.metadata?.total_classes || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Teachers:</span>
            <span>{solution.metadata?.teachers_involved || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Generation Time:</span>
            <span>{solution.generation_time || "N/A"}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSolution(solution);
                setShowExportModal(true);
              }}
              className="flex items-center justify-center min-w-[100px] px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSolution(solution);
                setShowSaveModal(true);
              }}
              className="flex items-center justify-center min-w-[100px] px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </button>
          </div>
          <button
            onClick={() => setSelectedSolution(solution)}
            className={`flex items-center justify-center min-w-[130px] px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              isSelected
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Eye className="w-4 h-4 mr-2" />
            {isSelected ? "Selected" : "View Details"}
          </button>
        </div>

        {isSelected && (
          <div className="absolute top-3 right-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTimetableGrid = () => {
    if (!selectedSolution) return null;

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    // Extract unique time slots from actual data instead of hardcoding
    const timeSlots = Array.from(
      new Set(
        selectedSolution.timetable_entries
          .filter((e) => selectedSections.includes(e.section))
          .map((e) => e.timeSlot)
      )
    ).sort((a, b) => {
      // Sort by start time
      const aStart = a.split("-")[0];
      const bStart = b.split("-")[0];
      return aStart.localeCompare(bStart);
    });

    // Fallback to default if no time slots found
    if (timeSlots.length === 0) {
      timeSlots.push(
        "09:00-10:00",
        "10:00-11:00",
        "11:00-12:00",
        "14:00-15:00",
        "15:00-16:00"
      );
    }

    console.log("📊 Rendering timetable with time slots:", timeSlots);
    console.log("📋 Total entries:", selectedSolution.timetable_entries.length);

    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
        {/* Grid Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Grid3X3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{selectedSolution.name}</h3>
                <p className="text-blue-100 text-sm">
                  Weekly Timetable Preview • Score: {selectedSolution.score}%
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {selectedSolution.metadata?.total_classes || 0}
                </div>
                <div className="text-xs text-blue-100">Total Classes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {selectedSolution.metadata?.teachers_involved || 0}
                </div>
                <div className="text-xs text-blue-100">Teachers</div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center justify-center min-w-[100px] px-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white text-sm font-medium hover:bg-opacity-30 transition-colors"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </button>
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="flex items-center justify-center min-w-[100px] px-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white text-sm font-medium hover:bg-opacity-30 transition-colors"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </button>
                <div className="w-px h-6 bg-white bg-opacity-30"></div>
                <Filter className="w-5 h-5 text-blue-200" />
                {availableDepartments.length > 0 && (
                  <select
                    value={selectedDepartmentId || ""}
                    onChange={(e) =>
                      setSelectedDepartmentId(Number(e.target.value))
                    }
                    className="bg-white bg-opacity-20 text-white border border-white border-opacity-30 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                  >
                    {availableDepartments.map((dept) => (
                      <option
                        key={dept.id}
                        value={dept.id}
                        className="text-gray-900"
                      >
                        {dept.name}
                      </option>
                    ))}
                  </select>
                )}
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(Number(e.target.value))}
                  className="bg-white bg-opacity-20 text-white border border-white border-opacity-30 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                >
                  {availableSemesters.map((sem) => (
                    <option key={sem} value={sem} className="text-gray-900">
                      Semester {sem}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedSections[0]}
                  onChange={(e) => setSelectedSections([e.target.value])}
                  className="bg-white bg-opacity-20 text-white border border-white border-opacity-30 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                >
                  {availableSections.map((section) => (
                    <option
                      key={section}
                      value={section}
                      className="text-gray-900"
                    >
                      Section {section}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Timetable Grid */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 text-left text-sm font-bold text-gray-700 bg-gray-100 border-r border-gray-200 min-w-[120px]">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>Time Slot</span>
                  </div>
                </th>
                {days.map((day) => (
                  <th
                    key={day}
                    className="p-4 text-center text-sm font-bold text-gray-700 min-w-[180px] border-r border-gray-200 last:border-r-0"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{day}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((timeSlot) => (
                <tr
                  key={timeSlot}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4 bg-gray-50 text-sm font-semibold text-gray-700 border-r border-gray-200 sticky left-0">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>{timeSlot}</span>
                    </div>
                  </td>
                  {days.map((day) => {
                    const entry = selectedSolution.timetable_entries.find(
                      (e) => {
                        // Debug log for first timeslot only to avoid spam
                        if (timeSlot === timeSlots[0] && day === days[0]) {
                          console.log("🔍 Searching for:", {
                            day,
                            timeSlot,
                            selectedSections,
                            selectedSemester,
                          });
                          console.log("🔍 Sample entry:", e);
                          console.log("🔍 Entry fields:", {
                            entryDay: e.day,
                            entryTimeSlot: e.timeSlot,
                            entrySection: e.section,
                            entrySemester: e.semester,
                          });
                        }
                        return (
                          e.day === day &&
                          e.timeSlot === timeSlot &&
                          selectedSections.includes(e.section) &&
                          (e.semester === selectedSemester || !e.semester) &&
                          (!selectedDepartmentId ||
                            e.department_id === selectedDepartmentId ||
                            !e.department_id)
                        );
                      }
                    );

                    const cellClass =
                      entry?.sessionType === "lab"
                        ? "bg-gradient-to-br from-purple-100 to-purple-200 border-l-purple-600"
                        : entry?.sessionType === "tutorial"
                        ? "bg-gradient-to-br from-orange-100 to-orange-200 border-l-orange-600"
                        : "bg-gradient-to-br from-blue-100 to-blue-200 border-l-blue-600";

                    const badgeClass =
                      entry?.sessionType === "lab"
                        ? "bg-purple-600 text-white"
                        : entry?.sessionType === "tutorial"
                        ? "bg-orange-600 text-white"
                        : "bg-blue-600 text-white";

                    return (
                      <td
                        key={`${day}-${timeSlot}`}
                        className="p-2 h-24 min-w-[180px] border-r border-gray-100 last:border-r-0"
                      >
                        {entry ? (
                          <div
                            className={`h-full p-3 rounded-lg shadow-sm border-l-4 transition-all duration-200 hover:shadow-md cursor-pointer ${cellClass}`}
                          >
                            <div className="font-bold text-gray-900 text-sm mb-1 flex items-center">
                              <BookOpen className="w-3 h-3 mr-1 text-gray-700" />
                              {entry.courseCode}
                            </div>
                            <div className="text-gray-900 text-xs mb-1 truncate font-semibold">
                              {entry.courseName}
                            </div>
                            <div className="text-gray-800 text-xs flex items-center mb-1 font-medium">
                              <Users className="w-3 h-3 mr-1 text-gray-700" />
                              {entry.teacherName}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-800 text-xs flex items-center font-medium">
                                📍 {entry.roomNumber}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-bold ${badgeClass}`}
                              >
                                {entry.sessionType.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">Free</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Grid Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h4 className="text-sm font-semibold text-gray-700">Legend:</h4>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-l-blue-500 rounded"></div>
                <span className="text-xs text-gray-600">Theory</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-l-purple-500 rounded"></div>
                <span className="text-xs text-gray-600">Lab</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-l-orange-500 rounded"></div>
                <span className="text-xs text-gray-600">Tutorial</span>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>Section: {selectedSections[0]}</span>
              <span>•</span>
              <span>
                Generated: {selectedSolution.generation_time || "N/A"}
              </span>
              <span>•</span>
              <span
                className={`px-2 py-1 rounded-full ${
                  selectedSolution.conflicts === 0
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {selectedSolution.conflicts === 0
                  ? "✅ No Conflicts"
                  : `⚠️ ${selectedSolution.conflicts} Conflicts`}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => history.goBack()}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Generator
              </button>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-gray-900">
                    AI Timetable Results
                  </h1>
                  {dataSource === "real" ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      ✨ Gemini AI Generated
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                      🔧 Demo Data
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mt-1">
                  {dataSource === "real"
                    ? "Real AI-generated solutions based on your input data"
                    : "Demo timetable solutions for testing (no real data received)"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleLoadSaved}
                className="inline-flex items-center justify-center min-w-[140px] px-6 py-2.5 border border-green-300 rounded-lg text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Load Saved
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                disabled={!selectedSolution}
                className="inline-flex items-center justify-center min-w-[140px] px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
              <button
                onClick={() => setShowSaveModal(true)}
                disabled={!selectedSolution}
                className="inline-flex items-center justify-center min-w-[140px] px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Mode Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "overview", name: "Overview", icon: BarChart3 },
                { id: "detailed", name: "Detailed View", icon: Eye },
                {
                  id: "comparison",
                  name: "Compare Solutions",
                  icon: RefreshCw,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id as any)}
                  className={`${
                    viewMode === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        {solutions.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Grid3X3 className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Solutions Available
            </h3>
            <p className="text-gray-600 mb-6">
              Generate AI timetable solutions first to view and compare them
              here.
            </p>
            <button
              onClick={() => history.goBack()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Generator
            </button>
          </div>
        ) : (
          viewMode === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Generated Solutions ({solutions.length})
                </h2>
                <div className="space-y-4">
                  {solutions.map((solution, index) =>
                    renderSolutionCard(solution, index)
                  )}
                </div>
              </div>
              <div className="lg:col-span-2">{renderTimetableGrid()}</div>
            </div>
          )
        )}

        {solutions.length > 0 &&
          viewMode === "detailed" &&
          selectedSolution && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {selectedSolution.name}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedSolution.quality?.overall_score || 0}%
                    </div>
                    <div className="text-sm text-gray-600">Overall Score</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedSolution.quality?.teacher_satisfaction || 0}%
                    </div>
                    <div className="text-sm text-gray-600">
                      Teacher Satisfaction
                    </div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedSolution.quality?.student_satisfaction || 0}%
                    </div>
                    <div className="text-sm text-gray-600">
                      Student Satisfaction
                    </div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {selectedSolution.quality?.resource_utilization || 0}%
                    </div>
                    <div className="text-sm text-gray-600">
                      Resource Utilization
                    </div>
                  </div>
                </div>
              </div>
              {renderTimetableGrid()}
            </div>
          )}

        {solutions.length > 0 && viewMode === "comparison" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Solution Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Solution
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">
                      Overall Score
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">
                      Teacher Satisfaction
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">
                      Student Satisfaction
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">
                      Conflicts
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">
                      Generation Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {solutions.map((solution) => (
                    <tr
                      key={solution.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {solution.name}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {solution.optimization.replace("-", " ")}
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-sm font-medium ${
                            (solution.quality?.overall_score || 0) >= 90
                              ? "bg-green-100 text-green-800"
                              : (solution.quality?.overall_score || 0) >= 80
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {solution.quality?.overall_score || 0}%
                        </span>
                      </td>
                      <td className="text-center py-3 px-4 text-gray-900">
                        {solution.quality?.teacher_satisfaction || 0}%
                      </td>
                      <td className="text-center py-3 px-4 text-gray-900">
                        {solution.quality?.student_satisfaction || 0}%
                      </td>
                      <td className="text-center py-3 px-4">
                        {solution.conflicts === 0 ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-yellow-600">
                            {solution.conflicts}
                          </span>
                        )}
                      </td>
                      <td className="text-center py-3 px-4 text-gray-900">
                        {solution.generation_time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Export Timetable
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="excel">Excel (.xlsx)</option>
                  <option value="csv">CSV (.csv)</option>
                  <option value="json">JSON (.json)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institution Name
                </label>
                <input
                  type="text"
                  value={saveMetadata.institutionName}
                  onChange={(e) =>
                    setSaveMetadata({
                      ...saveMetadata,
                      institutionName: e.target.value,
                    })
                  }
                  placeholder="Enter institution name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year / Session
                </label>
                <input
                  type="text"
                  value={saveMetadata.academicYear}
                  onChange={(e) =>
                    setSaveMetadata({
                      ...saveMetadata,
                      academicYear: e.target.value,
                    })
                  }
                  placeholder="2024-25"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {selectedSolution && (
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    <strong>Exporting:</strong> {selectedSolution.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Score:</strong> {selectedSolution.score}%
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="min-w-[100px] px-6 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="min-w-[140px] px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium transition-colors"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 mr-2" />
                    Export
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Save Timetable
              </h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institution Name *
                </label>
                <input
                  type="text"
                  value={saveMetadata.institutionName}
                  onChange={(e) =>
                    setSaveMetadata({
                      ...saveMetadata,
                      institutionName: e.target.value,
                    })
                  }
                  placeholder="Enter institution name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year / Session *
                </label>
                <input
                  type="text"
                  value={saveMetadata.academicYear}
                  onChange={(e) =>
                    setSaveMetadata({
                      ...saveMetadata,
                      academicYear: e.target.value,
                    })
                  }
                  placeholder="2024-25"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={saveMetadata.description}
                  onChange={(e) =>
                    setSaveMetadata({
                      ...saveMetadata,
                      description: e.target.value,
                    })
                  }
                  placeholder="Add any notes or description for this timetable..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {selectedSolution && (
                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Saving:</strong> {selectedSolution.name}
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Overall Score:</strong> {selectedSolution.score}%
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Conflicts:</strong> {selectedSolution.conflicts}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="min-w-[100px] px-6 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={
                  isSaving ||
                  !saveMetadata.institutionName ||
                  !saveMetadata.academicYear
                }
                className="min-w-[160px] px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium transition-colors"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Save Timetable
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Saved Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Database className="w-5 h-5 mr-2 text-green-600" />
                Load Saved Timetable
              </h3>
              <button
                onClick={() => setShowLoadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">
                  Loading saved timetables...
                </span>
              </div>
            ) : savedTimetables.length === 0 ? (
              <div className="text-center py-12">
                <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">
                  No saved timetables found
                </p>
                <p className="text-gray-400 text-sm">
                  Generate and save a timetable to see it here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedTimetables.map((saved) => (
                  <div
                    key={saved.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                    onClick={() => handleSelectSavedTimetable(saved)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {saved.solution_data?.name || "Unnamed Solution"}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Saved:{" "}
                            {new Date(saved.created_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center capitalize">
                            <Target className="w-4 h-4 mr-1" />
                            {saved.solution_data?.optimization?.replace(
                              "-",
                              " "
                            ) || "Balanced"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              (saved.solution_data?.score || 0) >= 90
                                ? "bg-green-100 text-green-800"
                                : (saved.solution_data?.score || 0) >= 80
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            Score: {saved.solution_data?.score || 0}%
                          </span>
                          {saved.solution_data?.conflicts === 0 ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              No Conflicts
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                              {saved.solution_data?.conflicts} Conflicts
                            </span>
                          )}
                        </div>
                      </div>
                      <button className="ml-4 min-w-[100px] px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center transition-colors">
                        <Upload className="w-4 h-4 mr-1" />
                        Load
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowLoadModal(false)}
                className="min-w-[100px] px-6 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableResults;
