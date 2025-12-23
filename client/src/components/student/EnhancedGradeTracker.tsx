import React, { useState, useEffect, useMemo } from "react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { getStudentCourses } from "../../services/api";

interface GradeRecord {
  id: string;
  course_id: string;
  course_name: string;
  course_code: string;
  semester: string;
  academic_year: string;
  assignment_type: "assignment" | "quiz" | "midterm" | "final" | "project" | "presentation";
  assignment_name: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
  submission_date: string;
  feedback?: string;
  weight: number; // Weightage in final grade (percentage)
}

interface CourseGrade {
  course_id: string;
  course_name: string;
  course_code: string;
  semester: string;
  academic_year: string;
  current_grade: string;
  current_percentage: number;
  credits: number;
  assignments_completed: number;
  total_assignments: number;
  records: GradeRecord[];
}

interface SemesterSummary {
  semester: string;
  academic_year: string;
  gpa: number;
  total_credits: number;
  courses: CourseGrade[];
  total_courses: number;
  completed_courses: number;
}

const EnhancedGradeTracker: React.FC = () => {
  const [gradeRecords, setGradeRecords] = useState<GradeRecord[]>([]);
  const [courseGrades, setCourseGrades] = useState<CourseGrade[]>([]);
  const [semesterSummaries, setSemesterSummaries] = useState<SemesterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<
    "overview" | "courses" | "assignments" | "analytics"
  >("overview");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");

  useEffect(() => {
    loadGradeData();
  }, []);

  const loadGradeData = async () => {
    try {
      setLoading(true);

      // Get current user info
      const raw = localStorage.getItem("user");
      const user = raw ? JSON.parse(raw) : null;

      if (!user) {
        throw new Error("User not found. Please log in again.");
      }

      const studentId = user?.profile?.student_id || user?.user_id || user?.id;

      // Fetch student's enrolled courses from database
      const enrolledCourses = await getStudentCourses(studentId);

      if (!enrolledCourses || enrolledCourses.length === 0) {
        console.log("No courses assigned to this student");
        setGradeRecords([]);
        setCourseGrades([]);
        setSemesterSummaries([]);
        setLoading(false);
        return;
      }

      // Generate mock grade records for the enrolled courses
      const mockGradeRecords: GradeRecord[] = [];
      const assignmentTypes: GradeRecord["assignment_type"][] = [
        "assignment",
        "quiz",
        "midterm",
        "final",
        "project",
        "presentation",
      ];
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const semester = currentMonth >= 7 ? "Fall" : "Spring";
      const academicYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;

      enrolledCourses.forEach((course: any, courseIndex: number) => {
        // Generate 3-5 random assignments per course
        const numAssignments = Math.floor(Math.random() * 3) + 3; // 3 to 5 assignments

        for (let i = 0; i < numAssignments; i++) {
          const assignmentType =
            assignmentTypes[Math.floor(Math.random() * assignmentTypes.length)];
          const marksObtained = Math.floor(Math.random() * 30) + 70; // 70-100
          const totalMarks = 100;
          const percentage = (marksObtained / totalMarks) * 100;
          const weight =
            assignmentType === "final"
              ? 30
              : assignmentType === "midterm"
              ? 25
              : assignmentType === "project"
              ? 20
              : assignmentType === "assignment"
              ? 15
              : 10;

          // Generate random date in the past 3 months
          const daysAgo = Math.floor(Math.random() * 90);
          const submissionDate = new Date();
          submissionDate.setDate(submissionDate.getDate() - daysAgo);

          mockGradeRecords.push({
            id: `${courseIndex}_${i}`,
            course_id: course.course_id.toString(),
            course_name: course.course_name || course.name,
            course_code: course.course_code || course.code,
            semester: semester,
            academic_year: academicYear,
            assignment_type: assignmentType,
            assignment_name: `${assignmentType.charAt(0).toUpperCase() + assignmentType.slice(1)} ${
              i + 1
            }`,
            marks_obtained: marksObtained,
            total_marks: totalMarks,
            percentage: percentage,
            grade: getLetterGrade(percentage),
            submission_date: submissionDate.toISOString().split("T")[0],
            feedback:
              percentage >= 85
                ? "Excellent work!"
                : percentage >= 70
                ? "Good job!"
                : "Needs improvement",
            weight: weight,
          });
        }
      });

      setGradeRecords(mockGradeRecords);
      processGradeData(mockGradeRecords);
    } catch (error) {
      console.error("Error loading grade data:", error);
      // If error, show empty state
      setGradeRecords([]);
      setCourseGrades([]);
      setSemesterSummaries([]);
    } finally {
      setLoading(false);
    }
  };

  const processGradeData = (records: GradeRecord[]) => {
    // Group by course
    const courseMap = new Map<string, CourseGrade>();

    records.forEach((record) => {
      const courseKey = `${record.course_id}_${record.semester}_${record.academic_year}`;

      if (!courseMap.has(courseKey)) {
        courseMap.set(courseKey, {
          course_id: record.course_id,
          course_name: record.course_name,
          course_code: record.course_code,
          semester: record.semester,
          academic_year: record.academic_year,
          current_grade: "A-",
          current_percentage: 0,
          credits: 3,
          assignments_completed: 0,
          total_assignments: 8,
          records: [],
        });
      }

      const course = courseMap.get(courseKey)!;
      course.records.push(record);
      course.assignments_completed++;
    });

    // Calculate course grades
    const courses = Array.from(courseMap.values()).map((course) => {
      const totalWeightedMarks = course.records.reduce(
        (sum, record) => sum + (record.percentage * record.weight) / 100,
        0
      );
      const totalWeight = course.records.reduce((sum, record) => sum + record.weight, 0);

      course.current_percentage = totalWeight > 0 ? (totalWeightedMarks / totalWeight) * 100 : 0;
      course.current_grade = getLetterGrade(course.current_percentage);

      return course;
    });

    setCourseGrades(courses);

    // Group by semester
    const semesterMap = new Map<string, SemesterSummary>();

    courses.forEach((course) => {
      const semesterKey = `${course.semester}_${course.academic_year}`;

      if (!semesterMap.has(semesterKey)) {
        semesterMap.set(semesterKey, {
          semester: course.semester,
          academic_year: course.academic_year,
          gpa: 0,
          total_credits: 0,
          courses: [],
          total_courses: 0,
          completed_courses: 0,
        });
      }

      const semester = semesterMap.get(semesterKey)!;
      semester.courses.push(course);
      semester.total_courses++;
      semester.total_credits += course.credits;

      if (course.assignments_completed >= course.total_assignments * 0.8) {
        semester.completed_courses++;
      }
    });

    // Calculate GPA for each semester
    const semesters = Array.from(semesterMap.values()).map((semester) => {
      const totalGradePoints = semester.courses.reduce(
        (sum, course) => sum + getGradePoints(course.current_grade) * course.credits,
        0
      );
      semester.gpa = semester.total_credits > 0 ? totalGradePoints / semester.total_credits : 0;
      return semester;
    });

    setSemesterSummaries(semesters);
  };

  const getLetterGrade = (percentage: number): string => {
    if (percentage >= 90) return "A";
    if (percentage >= 85) return "A-";
    if (percentage >= 80) return "B+";
    if (percentage >= 75) return "B";
    if (percentage >= 70) return "B-";
    if (percentage >= 65) return "C+";
    if (percentage >= 60) return "C";
    if (percentage >= 55) return "C-";
    if (percentage >= 50) return "D";
    return "F";
  };

  const getGradePoints = (grade: string): number => {
    const gradeMap: Record<string, number> = {
      A: 4.0,
      "A-": 3.7,
      "B+": 3.3,
      B: 3.0,
      "B-": 2.7,
      "C+": 2.3,
      C: 2.0,
      "C-": 1.7,
      D: 1.0,
      F: 0.0,
    };
    return gradeMap[grade] || 0.0;
  };

  const getGradeColor = (grade: string): string => {
    if (grade.startsWith("A")) return "text-green-600 bg-green-50 border-green-200";
    if (grade.startsWith("B")) return "text-blue-600 bg-blue-50 border-blue-200";
    if (grade.startsWith("C")) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (grade === "D") return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getAssignmentTypeIcon = (type: string): string => {
    switch (type) {
      case "assignment":
        return "📝";
      case "quiz":
        return "❓";
      case "midterm":
        return "📋";
      case "final":
        return "🎯";
      case "project":
        return "🚀";
      case "presentation":
        return "🎤";
      default:
        return "📄";
    }
  };

  const overallStats = useMemo(() => {
    const totalCredits = semesterSummaries.reduce((sum, sem) => sum + sem.total_credits, 0);
    const totalGradePoints = semesterSummaries.reduce(
      (sum, sem) => sum + sem.gpa * sem.total_credits,
      0
    );
    const overallGPA = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

    return {
      overallGPA: Math.round(overallGPA * 100) / 100,
      totalCredits,
      totalCourses: courseGrades.length,
      completedAssignments: gradeRecords.length,
      averageGrade:
        courseGrades.length > 0
          ? courseGrades.reduce((sum, course) => sum + course.current_percentage, 0) /
            courseGrades.length
          : 0,
    };
  }, [semesterSummaries, courseGrades, gradeRecords]);

  const chartData = useMemo(() => {
    // Grade distribution chart
    const gradeDistribution = courseGrades.reduce((acc, course) => {
      const grade = course.current_grade.charAt(0);
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const gradeDistributionChart = {
      labels: Object.keys(gradeDistribution).sort(),
      datasets: [
        {
          label: "Number of Courses",
          data: Object.keys(gradeDistribution)
            .sort()
            .map((key) => gradeDistribution[key]),
          backgroundColor: ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"],
          borderWidth: 0,
        },
      ],
    };

    // Performance trends chart
    const sortedRecords = [...gradeRecords].sort(
      (a, b) => new Date(a.submission_date).getTime() - new Date(b.submission_date).getTime()
    );

    const performanceTrend = {
      labels: sortedRecords.map((record) =>
        new Date(record.submission_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      ),
      datasets: [
        {
          label: "Performance (%)",
          data: sortedRecords.map((record) => record.percentage),
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    };

    return { gradeDistributionChart, performanceTrend };
  }, [courseGrades, gradeRecords]);

  const filteredData = useMemo(() => {
    let filtered = gradeRecords;

    if (selectedSemester !== "all") {
      filtered = filtered.filter(
        (record) => `${record.semester}_${record.academic_year}` === selectedSemester
      );
    }

    if (selectedCourse !== "all") {
      filtered = filtered.filter((record) => record.course_id === selectedCourse);
    }

    return filtered;
  }, [gradeRecords, selectedSemester, selectedCourse]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-xl text-gray-600">Loading your grades...</p>
        </div>
      </div>
    );
  }

  // Show empty state if no courses are assigned
  if (!loading && courseGrades.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center p-6">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Courses Found</h2>
          <p className="text-gray-600 mb-4">
            You are not enrolled in any courses yet. Please contact your coordinator to get enrolled
            in courses.
          </p>
          <div className="text-sm text-gray-500">
            Once you're enrolled, your grades and assignments will appear here.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - Mobile Optimized */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2 sm:mb-4">
            Grade Tracker 📊
          </h1>
          <p className="text-gray-600 text-sm sm:text-lg">
            Track your academic performance and progress
          </p>
        </div>

        {/* Overall Stats - Mobile Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm font-medium">Overall GPA</p>
                <p className="text-xl sm:text-3xl font-bold text-green-600">
                  {overallStats.overallGPA}
                </p>
                <p className="text-xs text-gray-400 mt-1 hidden sm:block">Out of 4.0</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                <span className="text-lg sm:text-2xl">🎓</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm font-medium">Total Credits</p>
                <p className="text-xl sm:text-3xl font-bold text-blue-600">
                  {overallStats.totalCredits}
                </p>
                <p className="text-xs text-gray-400 mt-1 hidden sm:block">Credit hours</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                <span className="text-lg sm:text-2xl">📚</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm font-medium">Courses</p>
                <p className="text-xl sm:text-3xl font-bold text-purple-600">
                  {overallStats.totalCourses}
                </p>
                <p className="text-xs text-gray-400 mt-1 hidden sm:block">This semester</p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-100 rounded-full">
                <span className="text-lg sm:text-2xl">📖</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm font-medium">Average</p>
                <p className="text-xl sm:text-3xl font-bold text-indigo-600">
                  {Math.round(overallStats.averageGrade)}%
                </p>
                <p className="text-xs text-gray-400 mt-1 hidden sm:block">Course average</p>
              </div>
              <div className="p-2 sm:p-3 bg-indigo-100 rounded-full">
                <span className="text-lg sm:text-2xl">📈</span>
              </div>
            </div>
          </div>
        </div>

        {/* View Selection - Mobile Optimized */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center sm:space-x-4 overflow-x-auto pb-2 sm:pb-0">
              <div className="bg-gray-100 rounded-xl p-1 flex-shrink-0">
                <div className="flex space-x-1">
                  {["overview", "courses", "assignments", "analytics"].map((view) => (
                    <button
                      key={view}
                      onClick={() => setSelectedView(view as any)}
                      className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 capitalize whitespace-nowrap ${
                        selectedView === view
                          ? "bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-md"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      {view}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filters - Mobile Grid */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4">
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                <option value="all">All Semesters</option>
                {semesterSummaries.map((sem) => (
                  <option
                    key={`${sem.semester}_${sem.academic_year}`}
                    value={`${sem.semester}_${sem.academic_year}`}
                  >
                    {sem.semester} {sem.academic_year}
                  </option>
                ))}
              </select>

              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                <option value="all">All Courses</option>
                {courseGrades.map((course) => (
                  <option key={course.course_id} value={course.course_id}>
                    {course.course_code} - {course.course_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content based on selected view */}
        {selectedView === "overview" && (
          <div className="space-y-4 sm:space-y-8">
            {/* Semester Summaries - Mobile Optimized */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {semesterSummaries.map((semester) => (
                <div
                  key={`${semester.semester}_${semester.academic_year}`}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6"
                >
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                      {semester.semester} {semester.academic_year}
                    </h3>
                    <div className="text-right">
                      <div className="text-xl sm:text-2xl font-bold text-purple-600">
                        {semester.gpa.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">GPA</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center mb-3 sm:mb-4">
                    <div>
                      <div className="text-base sm:text-lg font-semibold text-blue-600">
                        {semester.total_courses}
                      </div>
                      <div className="text-xs text-gray-500">Courses</div>
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-semibold text-green-600">
                        {semester.total_credits}
                      </div>
                      <div className="text-xs text-gray-500">Credits</div>
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-semibold text-indigo-600">
                        {semester.completed_courses}
                      </div>
                      <div className="text-xs text-gray-500">Completed</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {semester.courses.slice(0, 3).map((course) => (
                      <div
                        key={course.course_id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-xs sm:text-sm">{course.course_code}</div>
                          <div className="text-xs text-gray-500 truncate">{course.course_name}</div>
                        </div>
                        <div
                          className={`px-2 py-1 rounded-lg text-xs font-semibold border flex-shrink-0 ml-2 ${getGradeColor(
                            course.current_grade
                          )}`}
                        >
                          {course.current_grade}
                        </div>
                      </div>
                    ))}
                    {semester.courses.length > 3 && (
                      <div className="text-center text-xs sm:text-sm text-gray-500 mt-2">
                        +{semester.courses.length - 3} more courses
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedView === "courses" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {courseGrades.map((course) => (
              <div
                key={course.course_id}
                className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6"
              >
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                      {course.course_code}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                      {course.course_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {course.semester} {course.academic_year} • {course.credits} cr
                    </p>
                  </div>
                  <div
                    className={`px-2 sm:px-3 py-1 sm:py-2 rounded-xl text-base sm:text-lg font-bold border flex-shrink-0 ml-2 ${getGradeColor(
                      course.current_grade
                    )}`}
                  >
                    {course.current_grade}
                  </div>
                </div>

                <div className="mb-3 sm:mb-4">
                  <div className="flex justify-between text-xs sm:text-sm mb-1">
                    <span>Progress</span>
                    <span>{Math.round(course.current_percentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(course.current_percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-4 text-center">
                  <div>
                    <div className="text-base sm:text-lg font-semibold text-blue-600">
                      {course.assignments_completed}
                    </div>
                    <div className="text-xs text-gray-500">Completed</div>
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-semibold text-gray-600">
                      {course.total_assignments}
                    </div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedView === "assignments" && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                Assignment History
              </h3>

              {/* Mobile Card View for Assignments */}
              <div className="block sm:hidden space-y-3">
                {filteredData.map((record) => (
                  <div key={record.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{getAssignmentTypeIcon(record.assignment_type)}</span>
                        <div>
                          <div className="font-medium text-sm">{record.assignment_name}</div>
                          <div className="text-xs text-gray-500">{record.course_code}</div>
                        </div>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-lg text-xs font-semibold border ${getGradeColor(
                          record.grade
                        )}`}
                      >
                        {record.grade}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-600">
                      <span className="bg-gray-100 px-2 py-0.5 rounded capitalize">
                        {record.assignment_type}
                      </span>
                      <span>
                        {record.marks_obtained}/{record.total_marks} ({record.percentage}%)
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(record.submission_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View for Assignments */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">
                        Assignment
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">
                        Course
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">
                        Type
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">
                        Score
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">
                        Grade
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((record) => (
                      <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <span className="mr-2">
                              {getAssignmentTypeIcon(record.assignment_type)}
                            </span>
                            <div>
                              <div className="font-medium text-gray-900">
                                {record.assignment_name}
                              </div>
                              {record.feedback && (
                                <div className="text-xs text-gray-500 mt-1">{record.feedback}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm font-medium">{record.course_code}</div>
                          <div className="text-xs text-gray-500">{record.course_name}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                            {record.assignment_type}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm font-medium">
                            {record.marks_obtained}/{record.total_marks}
                          </div>
                          <div className="text-xs text-gray-500">{record.percentage}%</div>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getGradeColor(
                              record.grade
                            )}`}
                          >
                            {record.grade}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {new Date(record.submission_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {selectedView === "analytics" && (
          <div className="space-y-4 sm:space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
              {/* Grade Distribution - Mobile Optimized */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                  Grade Distribution
                </h3>
                <div className="h-48 sm:h-64">
                  <Doughnut
                    data={chartData.gradeDistributionChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "bottom" as const,
                          labels: {
                            boxWidth: 12,
                            padding: 8,
                            font: { size: 11 },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Performance Trend - Mobile Optimized */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                  Performance Trend
                </h3>
                <div className="h-48 sm:h-64">
                  <Line
                    data={chartData.performanceTrend}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          ticks: {
                            callback: function (value) {
                              return value + "%";
                            },
                          },
                        },
                      },
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Performance Insights - Mobile Optimized */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                Performance Insights
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                <div className="text-center p-3 sm:p-4 bg-green-50 rounded-xl">
                  <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🎯</div>
                  <div className="text-xs sm:text-sm font-medium text-green-800">
                    Strongest Subject
                  </div>
                  <div className="text-base sm:text-lg font-bold text-green-600">
                    {courseGrades.length > 0
                      ? courseGrades.reduce((best, course) =>
                          course.current_percentage > best.current_percentage ? course : best
                        ).course_code
                      : "N/A"}
                  </div>
                </div>

                <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-xl">
                  <div className="text-xl sm:text-2xl mb-1 sm:mb-2">📈</div>
                  <div className="text-xs sm:text-sm font-medium text-blue-800">
                    Average Improvement
                  </div>
                  <div className="text-base sm:text-lg font-bold text-blue-600">+2.3%</div>
                </div>

                <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-xl sm:col-span-2 lg:col-span-1">
                  <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🏆</div>
                  <div className="text-xs sm:text-sm font-medium text-purple-800">Class Rank</div>
                  <div className="text-base sm:text-lg font-bold text-purple-600">Top 15%</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedGradeTracker;
