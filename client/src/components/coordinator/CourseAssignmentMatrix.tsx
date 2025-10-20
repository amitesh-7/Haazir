import React, { useState, useEffect, useRef } from "react";
import {
  User,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle,
  Users,
  Calendar,
  Plus,
  Trash2,
  Save,
  RefreshCw,
} from "lucide-react";
import smartTimetableService, {
  Course,
  Teacher,
} from "../../services/smartTimetableService";

interface CourseSession {
  course_id: number;
  course_name?: string;
  course_code?: string;
  semester?: number; // Add semester field to track which semester this course belongs to
  department_id?: number; // Add department field for multi-department support
  department_name?: string; // Add department name for display
  session_type: "theory" | "lab" | "tutorial";
  classes_per_week: number; // Number of classes per week
  teacher_id?: number;
  teacher_name?: string;
  room_preference?: string;
  special_requirements?: string;
  conflicts?: string[];
}

interface CourseAssignmentMatrixProps {
  departmentIds: number[]; // Changed from single departmentId to array
  semesters: number[]; // Changed from single semester to array of semesters
  sections: string[];
  onAssignmentsChange: (assignments: CourseSession[]) => void;
  onValidationChange: (isValid: boolean) => void;
}

const CourseAssignmentMatrix: React.FC<CourseAssignmentMatrixProps> = ({
  departmentIds, // Changed parameter name
  semesters, // Changed from semester to semesters
  sections,
  onAssignmentsChange,
  onValidationChange,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assignments, setAssignments] = useState<CourseSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["general"])
  );

  // AI Generation state
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiGenerationError, setAiGenerationError] = useState<string | null>(
    null
  );

  // Use refs to track previous values and prevent redundant loads
  const prevDepartmentIdsRef = useRef<string>("");
  const prevSemestersRef = useRef<string>("");
  const isLoadingRef = useRef(false);

  // Load courses and teachers
  useEffect(() => {
    const loadData = async () => {
      // Create stable string representations for comparison
      const deptIdsStr = JSON.stringify(departmentIds.sort());
      const semestersStr = JSON.stringify(semesters.sort());

      // Skip if already loading or if data hasn't changed
      if (
        isLoadingRef.current ||
        (deptIdsStr === prevDepartmentIdsRef.current &&
          semestersStr === prevSemestersRef.current)
      ) {
        return;
      }

      // Mark as loading
      isLoadingRef.current = true;
      prevDepartmentIdsRef.current = deptIdsStr;
      prevSemestersRef.current = semestersStr;

      try {
        setLoading(true);
        setError(null);

        // Load courses for ALL selected departments and semesters
        const allCourses: Course[] = [];
        for (const deptId of departmentIds) {
          for (const sem of semesters) {
            const coursesResponse =
              await smartTimetableService.getCoursesForDepartmentSemester(
                deptId,
                sem
              );

            if (coursesResponse.success && coursesResponse.data) {
              // Add department_id to each course for tracking
              const coursesWithDept = coursesResponse.data.map((c) => ({
                ...c,
                department_id: deptId,
              }));
              allCourses.push(...coursesWithDept);
            }
          }
        }

        setCourses(allCourses);

        // Initialize assignments for each course
        const initialAssignments: CourseSession[] = [];
        allCourses.forEach((course) => {
          // Add theory session by default
          initialAssignments.push({
            course_id: course.course_id,
            course_name: course.course_name,
            course_code: course.course_code,
            semester: course.semester, // Add semester from course data
            department_id: course.department_id, // Add department tracking
            department_name: course.department_name, // Add department name for display
            session_type: "theory",
            classes_per_week: 3, // Default for theory
            conflicts: [],
          });
        });
        setAssignments(initialAssignments);

        // Load available teachers from ALL departments
        const allTeachers: Teacher[] = [];
        for (const deptId of departmentIds) {
          const teachersResponse =
            await smartTimetableService.getAvailableTeachers({
              departmentId: deptId,
            });

          if (teachersResponse.success && teachersResponse.data) {
            allTeachers.push(...teachersResponse.data);
          }
        }
        // Remove duplicate teachers (same teacher_id)
        const uniqueTeachers = Array.from(
          new Map(allTeachers.map((t) => [t.teacher_id, t])).values()
        );
        setTeachers(uniqueTeachers);
      } catch (err: any) {
        console.error("Error loading course assignment data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
        isLoadingRef.current = false; // Reset loading flag
      }
    };

    if (departmentIds.length > 0 && semesters && semesters.length > 0) {
      loadData();
    }
  }, [departmentIds, semesters]);

  // Update parent component when assignments change
  useEffect(() => {
    // Log assignment summary for debugging (only when assignments actually change)
    const assignmentSummary = {
      total: assignments.length,
      theory: assignments.filter((a) => a.session_type === "theory").length,
      lab: assignments.filter((a) => a.session_type === "lab").length,
      tutorial: assignments.filter((a) => a.session_type === "tutorial").length,
    };
    console.log("📚 Assignment Matrix Updated:", assignmentSummary);

    // Log lab assignments specifically
    const labAssignments = assignments.filter((a) => a.session_type === "lab");
    if (labAssignments.length > 0) {
      console.log("🧪 Lab Assignments:");
      labAssignments.forEach((lab) => {
        console.log(
          `  - ${lab.course_code}: ${lab.classes_per_week} classes/week, Semester: ${lab.semester}`
        );
      });
    }

    onAssignmentsChange(assignments);

    // Check validation
    const isValid = validateAssignments();
    onValidationChange(isValid);
  }, [assignments]); // FIXED: Removed callback functions from dependencies

  // Validate assignments
  const validateAssignments = (): boolean => {
    const newConflicts: string[] = [];

    // Check if all courses have teachers assigned
    const unassignedCourses = assignments.filter((a) => !a.teacher_id);
    if (unassignedCourses.length > 0) {
      newConflicts.push(
        `${unassignedCourses.length} courses need teacher assignment`
      );
    }

    // Check for teacher overload (simplified)
    const teacherWorkload = new Map<number, number>();
    assignments.forEach((assignment) => {
      if (assignment.teacher_id) {
        const current = teacherWorkload.get(assignment.teacher_id) || 0;
        teacherWorkload.set(
          assignment.teacher_id,
          current + assignment.classes_per_week
        );
      }
    });

    teacherWorkload.forEach((workload, teacherId) => {
      if (workload > 20) {
        // Max 20 sessions per week
        const teacher = teachers.find((t) => t.teacher_id === teacherId);
        newConflicts.push(
          `${teacher?.name} has ${workload} sessions (max 20 recommended)`
        );
      }
    });

    setConflicts(newConflicts);
    return newConflicts.length === 0;
  };

  // Add new session for a course
  const addSession = (courseId: number) => {
    const course = courses.find((c) => c.course_id === courseId);
    if (!course) return;

    const newSession: CourseSession = {
      course_id: courseId,
      course_name: course.course_name,
      course_code: course.course_code,
      semester: course.semester, // CRITICAL FIX: Include semester field so labs aren't filtered out
      department_id: course.department_id,
      department_name: course.department_name, // Include department name for display
      session_type: "lab",
      classes_per_week: 1,
      conflicts: [],
    };

    console.log(
      `➕ Adding lab session for ${course.course_code} (Semester ${course.semester}) - ${course.department_name}`
    );
    setAssignments((prev) => [...prev, newSession]);
  };

  // Remove session
  const removeSession = (index: number) => {
    setAssignments((prev) => prev.filter((_, i) => i !== index));
  };

  // Update session
  const updateSession = (index: number, updates: Partial<CourseSession>) => {
    setAssignments((prev) =>
      prev.map((session, i) =>
        i === index ? { ...session, ...updates } : session
      )
    );
  };

  // Group assignments by course
  const groupedAssignments = assignments.reduce((groups, session, index) => {
    const key = session.course_id;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push({ ...session, index });
    return groups;
  }, {} as Record<number, (CourseSession & { index: number })[]>);

  // AI Generation Functions
  const isValidForGeneration = (): boolean => {
    // Check if all sessions have assigned teachers
    return assignments.every(
      (session) => session.teacher_id && session.teacher_id > 0
    );
  };

  const handleGenerateAITimetable = async () => {
    if (!isValidForGeneration()) {
      setAiGenerationError(
        "All sessions must have assigned teachers before generating timetable"
      );
      return;
    }

    setIsGeneratingAI(true);
    setAiGenerationError(null);

    try {
      // Prepare the generation input
      const courseAssignments = Object.values(groupedAssignments).map(
        (sessionGroup) => {
          const firstSession = sessionGroup[0];
          const course = courses.find(
            (c) => c.course_id === firstSession.course_id
          );

          return {
            course_id: firstSession.course_id,
            course_code: firstSession.course_code || "",
            course_name: firstSession.course_name || "",
            department_id: firstSession.department_id || departmentIds[0], // Use department from session or first dept
            semester: firstSession.semester || course?.semester || 1, // Use semester from session or course
            sections: sections,
            sessions: {
              theory: {
                teacher_id:
                  sessionGroup.find((s) => s.session_type === "theory")
                    ?.teacher_id || 0,
                teacher_name:
                  sessionGroup.find((s) => s.session_type === "theory")
                    ?.teacher_name || "",
                classes_per_week:
                  sessionGroup.find((s) => s.session_type === "theory")
                    ?.classes_per_week || 0,
                duration_minutes: 60,
              },
              lab: {
                teacher_id:
                  sessionGroup.find((s) => s.session_type === "lab")
                    ?.teacher_id || 0,
                teacher_name:
                  sessionGroup.find((s) => s.session_type === "lab")
                    ?.teacher_name || "",
                classes_per_week:
                  sessionGroup.find((s) => s.session_type === "lab")
                    ?.classes_per_week || 0,
                duration_minutes: 60,
              },
              tutorial: {
                teacher_id:
                  sessionGroup.find((s) => s.session_type === "tutorial")
                    ?.teacher_id || 0,
                teacher_name:
                  sessionGroup.find((s) => s.session_type === "tutorial")
                    ?.teacher_name || "",
                classes_per_week:
                  sessionGroup.find((s) => s.session_type === "tutorial")
                    ?.classes_per_week || 0,
                duration_minutes: 60,
              },
            },
          };
        }
      );

      const generationInput = {
        courseAssignments,
        timeConfiguration: {
          start_time: "08:00",
          end_time: "17:00",
          class_duration: 60,
          lunch_break: {
            start: "12:00",
            end: "13:00",
          },
          working_days: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
          ],
        },
        preferences: {
          hard_constraints: {
            no_teacher_clash: true,
            no_section_clash: true,
            respect_working_hours: true,
            respect_lunch_break: true,
          },
          soft_constraints: {
            minimize_student_gaps: { enabled: true, weight: 30 },
            balance_teacher_workload: { enabled: true, weight: 20 },
            prefer_morning_theory: { enabled: true, weight: 15 },
            avoid_back_to_back_labs: { enabled: true, weight: 25 },
            minimize_daily_transitions: { enabled: true, weight: 10 },
          },
        },
        metadata: {
          request_id: Date.now(),
          department_name: "Computer Science and Engineering",
          semesters: semesters, // Changed to array of semesters
          academic_year: "2024-25",
          created_by: "coordinator",
        },
      };

      console.log("🤖 Sending AI generation request:", generationInput);

      // Make API call to generate AI timetable
      const API_URL =
        process.env.REACT_APP_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${API_URL}/smart-timetable/ai/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(generationInput),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log("🎉 AI timetable generation successful:", result.data);
        alert(
          `Successfully generated ${
            result.data.solutions.length
          } timetable solutions!\n\nBest solution score: ${Math.max(
            ...result.data.solutions.map((s: any) => s.quality.overall_score)
          ).toFixed(1)}/100\n\nGeneration time: ${
            result.data.generation_summary.total_generation_time_ms
          }ms`
        );
      } else {
        throw new Error(result.error || "AI generation failed");
      }
    } catch (error) {
      console.error("❌ AI generation error:", error);
      setAiGenerationError(
        error instanceof Error ? error.message : "AI generation failed"
      );
    } finally {
      setIsGeneratingAI(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-600">
          Loading courses and teachers...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700 font-medium">Error loading data</span>
        </div>
        <p className="text-red-600 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
              Course Assignment Matrix
            </h3>
            <p className="text-gray-600 mt-1">
              Assign teachers to courses and configure session types
            </p>
          </div>
          <div className="text-sm text-gray-500">
            <div>Courses: {courses.length}</div>
            <div>Teachers: {teachers.length}</div>
            <div>Sessions: {assignments.length}</div>
          </div>
        </div>

        {/* Validation Status */}
        {conflicts.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
              <div>
                <h4 className="text-yellow-800 font-medium">
                  Assignment Issues
                </h4>
                <ul className="text-yellow-700 mt-1 space-y-1">
                  {conflicts.map((conflict, index) => (
                    <li key={index} className="text-sm">
                      • {conflict}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {conflicts.length === 0 && assignments.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-green-800 font-medium">
                All assignments look good!
              </span>
            </div>
          </div>
        )}

        {/* Sections Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Applicable Sections
          </label>
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <span
                key={section}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                <Users className="w-3 h-3 mr-1" />
                Section {section}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Course Assignments - Grouped by Semester */}
      <div
        className="space-y-6 border border-gray-200 rounded-lg p-4 bg-gray-50"
      >
        {semesters.map((sem) => {
          const semesterCourses = courses.filter((c) => c.semester === sem);
          if (semesterCourses.length === 0) return null;

          return (
            <div key={sem} className="space-y-4">
              {/* Semester Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg p-4 shadow-md">
                <h3 className="text-xl font-bold flex items-center">
                  <Calendar className="w-6 h-6 mr-2" />
                  Semester {sem}
                </h3>
                <p className="text-indigo-100 text-sm mt-1">
                  {semesterCourses.length} course(s) • Assign teachers and
                  configure sessions
                </p>
              </div>

              {/* Courses for this semester */}
              {semesterCourses.map((course) => (
                <div
                  key={course.course_id}
                  className="bg-white rounded-lg border border-gray-200"
                >
                  {/* Course Header */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {course.course_code} - {course.course_name}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-gray-600">
                            Semester {course.semester}
                          </p>
                          {course.department_name && (
                            <>
                              <span className="text-gray-400">•</span>
                              <p className="text-sm font-medium text-blue-600">
                                {course.department_name}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => addSession(course.course_id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Session
                      </button>
                    </div>
                  </div>

                  {/* Sessions for this course */}
                  <div className="p-4 space-y-4">
                    {groupedAssignments[course.course_id]?.map((session) => (
                      <div
                        key={session.index}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Session Type */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Session Type
                            </label>
                            <select
                              value={session.session_type}
                              onChange={(e) =>
                                updateSession(session.index, {
                                  session_type: e.target.value as
                                    | "theory"
                                    | "lab"
                                    | "tutorial",
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="theory">Theory</option>
                              <option value="lab">Lab</option>
                              <option value="tutorial">Tutorial</option>
                            </select>
                          </div>

                          {/* Sessions per Week */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Sessions/Week
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={session.classes_per_week}
                              onChange={(e) =>
                                updateSession(session.index, {
                                  classes_per_week:
                                    parseInt(e.target.value) || 1,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          {/* Teacher Assignment */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Assigned Teacher
                            </label>
                            <select
                              value={session.teacher_id || ""}
                              onChange={(e) => {
                                const teacherId = e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined;
                                const teacher = teachers.find(
                                  (t) => t.teacher_id === teacherId
                                );
                                updateSession(session.index, {
                                  teacher_id: teacherId,
                                  teacher_name: teacher?.name,
                                });
                              }}
                              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                !session.teacher_id
                                  ? "border-red-300 bg-red-50"
                                  : "border-gray-300"
                              }`}
                            >
                              <option value="">Select Teacher</option>
                              {teachers.map((teacher) => (
                                <option
                                  key={teacher.teacher_id}
                                  value={teacher.teacher_id}
                                >
                                  {teacher.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Room Preference */}
                          <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Room Preference
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., Lab-1, Classroom-A"
                              value={session.room_preference || ""}
                              onChange={(e) =>
                                updateSession(session.index, {
                                  room_preference: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          {/* Special Requirements */}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Special Requirements
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., Projector needed, Computer lab required"
                              value={session.special_requirements || ""}
                              onChange={(e) =>
                                updateSession(session.index, {
                                  special_requirements: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          {/* Remove Button */}
                          <div className="flex items-end">
                            <button
                              onClick={() => removeSession(session.index)}
                              className="w-full inline-flex items-center justify-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Remove
                            </button>
                          </div>
                        </div>

                        {/* Session Summary */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center text-sm text-gray-600 space-x-4">
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {session.classes_per_week} classes/week
                            </span>
                            <span className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              {session.teacher_name || "No teacher assigned"}
                            </span>
                            {session.room_preference && (
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {session.room_preference}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-gray-500">
                        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No sessions configured for this course</p>
                        <button
                          onClick={() => addSession(course.course_id)}
                          className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Add a session
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      {assignments.length > 0 && (
        <div className="flex justify-end gap-3">
          <button
            onClick={() => onAssignmentsChange([])}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-lg font-medium text-blue-900 mb-3">
          Assignment Summary
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-800">Total Sessions:</span>
            <span className="ml-2 text-blue-700">{assignments.length}</span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Weekly Periods:</span>
            <span className="ml-2 text-blue-700">
              {assignments.reduce((sum, a) => sum + a.classes_per_week, 0)}
            </span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Teachers Used:</span>
            <span className="ml-2 text-blue-700">
              {
                new Set(assignments.map((a) => a.teacher_id).filter(Boolean))
                  .size
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseAssignmentMatrix;
