import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useHistory } from "react-router-dom";
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  Settings,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertTriangle,
  Zap,
} from "lucide-react";
import {
  fetchAllDepartments,
  fetchSectionsByDepartment,
} from "../services/api";
import CourseAssignmentMatrix from "../components/coordinator/CourseAssignmentMatrix";
import ManualTimeConfiguration from "../components/coordinator/ManualTimeConfiguration";
import smartTimetableService from "../services/smartTimetableService";

interface TimeConfig {
  startTime: string;
  endTime: string;
  classDuration: number; // minutes
  lunchBreak: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  workingDays: string[];
}

interface Department {
  department_id: number;
  name: string;
  code: string;
}

interface Section {
  section_id: number;
  department_id: number;
  section_name: string;
  description?: string;
}

interface TimetableSettings {
  working_days: string[];
  start_date: string;
  end_date: string;
  max_teacher_hours: number;
  lunch_break_mandatory: boolean;
  avoid_back_to_back_labs: boolean;
  morning_theory_preference: boolean;
}

interface CourseSession {
  course_id: number;
  course_name?: string;
  course_code?: string;
  session_type: "theory" | "lab" | "tutorial";
  classes_per_week: number;
  teacher_id?: number;
  teacher_name?: string;
  room_preference?: string;
  special_requirements?: string;
  conflicts?: string[];
  semester?: number; // Add semester field to track which semester this course belongs to
  department_id?: number; // Add department field for multi-department support
  department_name?: string; // Add department name for display
}

const SmartTimetableGenerator: React.FC = () => {
  const history = useHistory();
  const [currentStep, setCurrentStep] = useState(1);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<Department[]>(
    []
  );
  const [selectedSemesters, setSelectedSemesters] = useState<number[]>([]);
  const [availableSections, setAvailableSections] = useState<Section[]>([]); // Available sections from DB
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [loadingSections, setLoadingSections] = useState(false); // Loading state for sections
  const [timeConfig, setTimeConfig] = useState<TimeConfig | null>(null);
  const [courseAssignments, setCourseAssignments] = useState<CourseSession[]>(
    []
  );
  const [assignmentsValid, setAssignmentsValid] = useState(false);
  const [timetableSettings, setTimetableSettings] = useState<TimetableSettings>(
    {
      working_days: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ],
      start_date: "",
      end_date: "",
      max_teacher_hours: 18,
      lunch_break_mandatory: true,
      avoid_back_to_back_labs: true,
      morning_theory_preference: true,
    }
  );
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    {
      id: 1,
      title: "Time Configuration",
      icon: Clock,
      description: "Set up class times and working days",
    },
    {
      id: 2,
      title: "Department & Semester",
      icon: Calendar,
      description: "Select department and semesters",
    },
    {
      id: 3,
      title: "Settings & Preferences",
      icon: Settings,
      description: "Configure generation settings",
    },
    {
      id: 4,
      title: "Course Assignment",
      icon: BookOpen,
      description: "Assign teachers to courses",
    },
    {
      id: 5,
      title: "Generate Timetable",
      icon: Zap,
      description: "Review and generate timetable",
    },
  ];

  // Memoize department IDs to prevent infinite re-renders
  const departmentIds = useMemo(
    () => selectedDepartments.map((d) => d.department_id),
    [selectedDepartments]
  );

  useEffect(() => {
    loadDepartments();
  }, []);

  // Load sections when departments are selected
  useEffect(() => {
    const loadSections = async () => {
      if (selectedDepartments.length === 0) {
        setAvailableSections([]);
        setSelectedSections([]);
        return;
      }

      try {
        setLoadingSections(true);
        const allSections: Section[] = [];

        // Fetch sections from all selected departments
        for (const dept of selectedDepartments) {
          const response = await fetchSectionsByDepartment(dept.department_id);
          console.log(`Sections for ${dept.name}:`, response);

          if (Array.isArray(response)) {
            allSections.push(...response);
          }
        }

        // Keep ALL sections (do NOT remove duplicates)
        // Different departments can have sections with same name (e.g., CS Section A ≠ EE Section A)
        setAvailableSections(allSections);
        console.log("Available sections loaded:", allSections);
      } catch (error: any) {
        console.error("Error loading sections:", error);
        setError(`Failed to load sections: ${error.message}`);
      } finally {
        setLoadingSections(false);
      }
    };

    loadSections();
  }, [selectedDepartments]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchAllDepartments();
      console.log("Department API response:", response);

      if (Array.isArray(response)) {
        setDepartments(response);
        console.log("Departments loaded:", response.length);
      } else {
        console.error("Invalid response format:", response);
        setError("Invalid response format from server");
      }
    } catch (error: any) {
      console.error("Error loading departments:", error);
      setError(`Failed to load departments: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleSemester = (semester: number) => {
    setSelectedSemesters((prev) =>
      prev.includes(semester)
        ? prev.filter((s) => s !== semester)
        : [...prev, semester]
    );
  };

  const toggleSection = (section: string) => {
    setSelectedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNext = (): boolean => {
    switch (currentStep) {
      case 1:
        return timeConfig !== null && timeConfig.workingDays.length > 0;
      case 2:
        return selectedDepartments.length > 0 && selectedSemesters.length > 0;
      case 3:
        return (
          selectedSections.length > 0 &&
          timetableSettings.start_date !== "" &&
          timetableSettings.end_date !== ""
        );
      case 4:
        return assignmentsValid && courseAssignments.length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const getStepValidationMessage = (): string | null => {
    switch (currentStep) {
      case 1:
        if (!timeConfig) return "Please configure time settings";
        if (timeConfig.workingDays.length === 0)
          return "Please select at least one working day";
        return null;
      case 2:
        if (selectedDepartments.length === 0)
          return "Please select at least one department";
        if (selectedSemesters.length === 0)
          return "Please select at least one semester";
        return null;
      case 3:
        if (selectedSections.length === 0)
          return "Please select at least one section";
        if (!timetableSettings.start_date)
          return "Please set semester start date";
        if (!timetableSettings.end_date) return "Please set semester end date";
        return null;
      case 4:
        if (courseAssignments.length === 0)
          return "Please configure course assignments";
        if (!assignmentsValid)
          return "Please ensure all courses have assigned teachers";
        return null;
      default:
        return null;
    }
  };

  const generateTimetable = async () => {
    if (selectedDepartments.length === 0 || selectedSemesters.length === 0)
      return;

    setGenerating(true);
    setError(null);

    try {
      console.log("🚀 Preparing AI timetable generation request...");
      console.log(
        `📚 Selected Departments: ${selectedDepartments
          .map((d) => d.name)
          .join(", ")}`
      );

      // Group course assignments by course to match backend expected format
      const courseGroupMap = new Map<number, any>();

      courseAssignments.forEach((assignment) => {
        if (!courseGroupMap.has(assignment.course_id)) {
          courseGroupMap.set(assignment.course_id, {
            course_id: assignment.course_id,
            course_code: assignment.course_code || "",
            course_name: assignment.course_name || "",
            department_id: assignment.department_id, // Use the course's actual department
            semester: assignment.semester || selectedSemesters[0],
            sections: selectedSections,
            sessions: {
              theory: {
                teacher_id: 0,
                teacher_name: "",
                classes_per_week: 0,
                duration_minutes: 60,
              },
              lab: {
                teacher_id: 0,
                teacher_name: "",
                classes_per_week: 0,
                duration_minutes: 60,
              },
              tutorial: {
                teacher_id: 0,
                teacher_name: "",
                classes_per_week: 0,
                duration_minutes: 60,
              },
            },
          });
        }

        const courseData = courseGroupMap.get(assignment.course_id);
        const sessionType = assignment.session_type;

        courseData.sessions[sessionType] = {
          teacher_id: assignment.teacher_id || 0,
          teacher_name: assignment.teacher_name || "",
          classes_per_week: assignment.classes_per_week || 0,
          duration_minutes: timeConfig?.classDuration || 60,
        };
      });

      const courseAssignmentsArray = Array.from(courseGroupMap.values());

      // Prepare AI generation input matching backend types
      const aiGenerationInput = {
        courseAssignments: courseAssignmentsArray,
        timeConfiguration: {
          start_time: timeConfig?.startTime || "08:00",
          end_time: timeConfig?.endTime || "17:00",
          class_duration: timeConfig?.classDuration || 60,
          lunch_break: {
            start: timeConfig?.lunchBreak?.startTime || "12:00",
            end: timeConfig?.lunchBreak?.endTime || "13:00",
          },
          working_days: timeConfig?.workingDays || [
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
            respect_lunch_break: timetableSettings.lunch_break_mandatory,
            max_classes_per_day: 8,
          },
          soft_constraints: {
            minimize_student_gaps: { enabled: true, weight: 70 },
            balance_teacher_workload: { enabled: true, weight: 80 },
            prefer_morning_theory: {
              enabled: timetableSettings.morning_theory_preference,
              weight: 60,
            },
            avoid_back_to_back_labs: {
              enabled: timetableSettings.avoid_back_to_back_labs,
              weight: 90,
            },
            minimize_daily_transitions: { enabled: true, weight: 50 },
          },
        },
        metadata: {
          request_id: Date.now(),
          department_names: selectedDepartments.map((d) => d.name).join(", "), // Changed to comma-separated list
          semester: selectedSemesters[0],
          academic_year: new Date().getFullYear().toString(),
          created_by: "coordinator",
        },
      };

      console.log("📊 Generation Input:", {
        courses: aiGenerationInput.courseAssignments.length,
        sections: selectedSections.length,
        semesters: selectedSemesters.length,
        workingDays: aiGenerationInput.timeConfiguration.working_days.length,
      });

      // Call backend API for AI generation
      console.log("🤖 Calling backend AI timetable generator...");
      const response = await fetch(
        "http://localhost:5000/api/timetable/generator/generate-ai",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(aiGenerationInput),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Backend error: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();

      console.log("✅ Backend AI generation completed:", {
        success: result.success,
        solutions: result.solutions?.length || 0,
        time: result.generation_summary?.total_generation_time_ms + "ms",
      });

      if (
        !result.success ||
        !result.solutions ||
        result.solutions.length === 0
      ) {
        throw new Error("No solutions generated by AI");
      }

      // Transform backend format to frontend format
      const transformedSolutions = result.solutions.map((solution: any) => ({
        id: solution.id,
        name: solution.name,
        score: solution.quality.overall_score,
        optimization: solution.name.toLowerCase().includes("teacher")
          ? "teacher-focused"
          : solution.name.toLowerCase().includes("student")
          ? "student-focused"
          : "balanced",
        conflicts: solution.quality.hard_constraint_violations || 0,
        quality: {
          overall_score: solution.quality.overall_score,
          teacher_satisfaction: solution.quality.teacher_workload_score || 90,
          student_satisfaction: solution.quality.student_gap_score || 90,
          resource_utilization:
            solution.quality.resource_utilization_score || 95,
        },
        timetable_entries: solution.schedule.map((entry: any) => ({
          day: entry.time_slot_id.split("_")[0],
          timeSlot: entry.time_slot_id.split("_")[1],
          courseCode: entry.session_id.split("_")[0],
          courseName: entry.session_id.split("_")[1] || "Course",
          teacherName: entry.session_id.split("_")[2] || "Teacher",
          roomNumber: entry.room_id || "TBD",
          sessionType: entry.session_id.includes("Lab")
            ? "lab"
            : entry.session_id.includes("Tutorial")
            ? "tutorial"
            : "theory",
          section: entry.session_id.split("_")[3] || "A",
          semester: parseInt(entry.session_id.split("_")[4]) || 1,
        })),
        generation_time:
          (result.generation_summary.total_generation_time_ms / 1000).toFixed(
            1
          ) + "s",
        metadata: {
          total_classes: solution.schedule.length,
          teachers_involved: new Set(
            solution.schedule.map((s: any) => s.session_id.split("_")[2])
          ).size,
          rooms_used: 6,
          conflicts_resolved: solution.quality.hard_constraint_violations || 0,
        },
      }));

      console.log("🎉 Solutions transformed:", transformedSolutions.length);

      // Navigate to results page
      history.push("/timetable/results", {
        solutions: transformedSolutions,
        inputData: aiGenerationInput,
        generatedBy: "backend-ai-algorithms",
        generationSummary: {
          total_generation_time_ms:
            result.generation_summary.total_generation_time_ms,
          solutions_generated: transformedSolutions.length,
          best_score: Math.max(
            ...transformedSolutions.map((s: any) => s.score)
          ),
        },
      });
    } catch (error: any) {
      console.error("❌ AI Timetable generation error:", error);
      setError(
        error.message || "Timetable generation failed. Please try again."
      );

      // Fallback to client-side if backend fails
      console.log("⚠️ Falling back to client-side generation...");
      generateTimetableClientSide();
    } finally {
      setGenerating(false);
    }
  };

  // Fallback client-side generation
  const generateTimetableClientSide = () => {
    console.log("🔄 Using client-side fallback generation...");
    console.log(
      `📚 Departments: ${selectedDepartments.map((d) => d.name).join(", ")}`
    );
    // Keep the existing mock generation as fallback
    const generationInput = {
      department_ids: selectedDepartments.map((d) => d.department_id), // Changed to array
      semesters: selectedSemesters,
      sections: selectedSections,
      course_assignments: courseAssignments.map((assignment) => ({
        course_id: assignment.course_id,
        course_name: assignment.course_name,
        course_code: assignment.course_code,
        session_type: assignment.session_type,
        classes_per_week: assignment.classes_per_week,
        teacher_id: assignment.teacher_id,
        teacher_name: assignment.teacher_name,
        semester: assignment.semester,
        department_id: assignment.department_id, // Include department info
        department_name: assignment.department_name, // Include department name
      })),
      time_configuration: timeConfig,
    };

    const mockSolutions = generateMockSolutions(generationInput);
    history.push("/timetable/results", {
      solutions: mockSolutions,
      inputData: generationInput,
      generatedBy: "client-side-fallback",
    });
  };

  // Generate mock solutions with realistic timetable data
  const generateMockSolutions = (input: any) => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    // Generate time slots from user's time configuration
    const generateTimeSlots = () => {
      if (!input.time_configuration) {
        return [
          "09:00-10:00",
          "10:00-11:00",
          "11:00-12:00",
          "14:00-15:00",
          "15:00-16:00",
        ];
      }

      const { startTime, endTime, classDuration, lunchBreak } =
        input.time_configuration;
      const slots: string[] = [];

      // Convert time to minutes
      const timeToMinutes = (time: string) => {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
      };

      // Convert minutes to time string
      const minutesToTime = (mins: number) => {
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        return `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`;
      };

      const startMins = timeToMinutes(startTime);
      const endMins = timeToMinutes(endTime);
      const lunchStartMins = lunchBreak.enabled
        ? timeToMinutes(lunchBreak.startTime)
        : -1;
      const lunchEndMins = lunchBreak.enabled
        ? timeToMinutes(lunchBreak.endTime)
        : -1;

      let currentMins = startMins;

      while (currentMins + classDuration <= endMins) {
        // Skip lunch break
        if (
          lunchBreak.enabled &&
          currentMins >= lunchStartMins &&
          currentMins < lunchEndMins
        ) {
          currentMins = lunchEndMins;
          continue;
        }

        // Don't start a class that would overlap with lunch
        if (
          lunchBreak.enabled &&
          currentMins < lunchStartMins &&
          currentMins + classDuration > lunchStartMins
        ) {
          currentMins = lunchEndMins;
          continue;
        }

        slots.push(
          `${minutesToTime(currentMins)}-${minutesToTime(
            currentMins + classDuration
          )}`
        );
        currentMins += classDuration;
      }

      return slots;
    };

    const timeSlots = generateTimeSlots();
    console.log("📅 Generated time slots from config:", timeSlots);

    const rooms = [
      "Room 101",
      "Room 102",
      "Room 103",
      "Lab 201",
      "Lab 202",
      "Lab 203",
    ];

    const generateEntries = (
      semester: number,
      sectionId: string,
      sectionOffset: number = 0,
      existingEntries: any[] = [] // Pass entries from other sections to check teacher conflicts
    ) => {
      const entries: any[] = [];

      // Filter courses for THIS semester only
      const semesterCourses = input.course_assignments.filter(
        (course: any) => course.semester === semester
      );

      console.log(
        `🔍 Semester ${semester}, Section ${sectionId}: Found ${semesterCourses.length} courses`,
        semesterCourses.map((c: any) => c.course_code)
      );

      // Limit classes per day (max 4-5 classes to leave room for breaks and self-study)
      const maxClassesPerDay = 5;
      const maxTotalSlots = days.length * maxClassesPerDay; // Total available slots in the week

      // Calculate total classes needed
      const totalClassesNeeded = semesterCourses.reduce(
        (sum: any, course: any) => sum + course.classes_per_week,
        0
      );

      console.log(
        `📊 Semester ${semester}, Section ${sectionId}: Need ${totalClassesNeeded} classes, ${maxTotalSlots} slots available`
      );

      // CRITICAL FIX: Start from different position for each section using sectionOffset
      // This ensures different sections get different time slot distributions
      let slotCounter = sectionOffset;

      semesterCourses.forEach((course: any, courseIdx: number) => {
        const classesNeeded = course.classes_per_week;
        let assigned = 0;
        let attempts = 0;
        const maxAttempts = maxTotalSlots * 5; // Prevent infinite loops

        console.log(
          `📝 Processing ${course.course_code} (${course.session_type}): Need ${classesNeeded} classes per week`
        );

        // Try to spread classes across different days
        while (assigned < classesNeeded && attempts < maxAttempts) {
          attempts++;

          // Use modulo to cycle through days and slots, but offset creates different patterns
          const dayIndex =
            (Math.floor(slotCounter / timeSlots.length) + sectionOffset) %
            days.length;
          const slotIndex =
            (slotCounter + courseIdx * sectionOffset) % timeSlots.length;

          // Check if this day already has max classes
          const classesOnThisDay = entries.filter(
            (e) => e.day === days[dayIndex]
          ).length;

          if (classesOnThisDay >= maxClassesPerDay) {
            slotCounter++;
            continue;
          }

          // Check if this specific time slot is already taken on this day FOR THIS SECTION
          const slotTaken = entries.some(
            (e) =>
              e.day === days[dayIndex] && e.timeSlot === timeSlots[slotIndex]
          );

          if (slotTaken) {
            slotCounter++;
            continue;
          }

          // NEW CONSTRAINT: For theory classes, prevent same course on same day
          // This spreads theory classes across the week for better learning
          if (course.session_type === "theory") {
            const sameCourseOnThisDay = entries.some(
              (e) =>
                e.courseCode === course.course_code &&
                e.day === days[dayIndex] &&
                e.sessionType === "theory"
            );

            if (sameCourseOnThisDay) {
              console.log(
                `⏭️ Skipping ${course.course_code} on ${days[dayIndex]} - already scheduled this day`
              );
              slotCounter++;
              continue;
            }
          }

          // CRITICAL: Check for teacher conflicts across ALL sections
          // A teacher cannot teach multiple sections at the same time!
          const teacherConflict = existingEntries.some(
            (e) =>
              e.teacherName === course.teacher_name &&
              e.day === days[dayIndex] &&
              e.timeSlot === timeSlots[slotIndex]
          );

          if (teacherConflict && course.teacher_name) {
            // Skip this slot - teacher is already teaching another section
            slotCounter++;
            continue;
          }

          // Different room assignment for each section to avoid conflicts
          const roomOffset = sectionOffset % 3;
          const roomNumber =
            course.session_type === "lab"
              ? rooms[3 + ((slotCounter + roomOffset) % 3)]
              : rooms[(slotCounter + roomOffset) % 3];

          const entry = {
            day: days[dayIndex],
            timeSlot: timeSlots[slotIndex],
            courseCode: course.course_code || `COURSE-${course.course_id}`,
            courseName: course.course_name || "Course Name",
            teacherName: course.teacher_name || "Teacher TBD",
            teacherId: course.teacher_id, // Add teacher ID for better conflict tracking
            roomNumber: roomNumber,
            sessionType: course.session_type, // CRITICAL: Preserve session type (theory/lab/tutorial)
            section: sectionId,
            semester: semester, // Add semester field
            department_id: course.department_id, // Add department ID for filtering
            department_name: course.department_name, // Add department name for display
          };

          entries.push(entry);
          assigned++;
          slotCounter++;

          // Log lab sessions specifically
          if (course.session_type === "lab") {
            console.log(
              `🧪 LAB Added: ${entry.courseCode} on ${entry.day} at ${entry.timeSlot} in ${entry.roomNumber}`
            );
          }
        }

        if (assigned < classesNeeded) {
          console.warn(
            `⚠️ Could only assign ${assigned}/${classesNeeded} classes for ${course.course_code} (${course.session_type}) in Section ${sectionId}`
          );
        } else {
          console.log(
            `✅ Successfully assigned ${assigned} classes for ${course.course_code} (${course.session_type})`
          );
        }
      });

      // Count session types for verification
      const sessionTypeCounts = {
        theory: entries.filter((e) => e.sessionType === "theory").length,
        lab: entries.filter((e) => e.sessionType === "lab").length,
        tutorial: entries.filter((e) => e.sessionType === "tutorial").length,
      };

      console.log(
        `✅ Generated ${entries.length} entries for Semester ${semester}, Section ${sectionId}:`,
        `Theory: ${sessionTypeCounts.theory}, Lab: ${sessionTypeCounts.lab}, Tutorial: ${sessionTypeCounts.tutorial}`
      );
      return entries;
    };

    // Generate entries for ALL selected semesters, sections with different offsets to avoid conflicts
    const generateAllSectionEntries = () => {
      const allEntries: any[] = [];

      // Loop through each semester
      input.semesters.forEach((semester: number) => {
        // Loop through each section
        input.sections.forEach((section: string, sectionIndex: number) => {
          // CRITICAL: Each section gets a DIFFERENT offset to create DIFFERENT schedules
          // Using larger offset values to ensure significant differences between sections
          const offset = (semester - 1) * 7 + sectionIndex * 13; // Prime numbers for better distribution
          console.log(`🔧 Generating Section ${section} with offset ${offset}`);

          // CRITICAL FIX: Pass existing entries to check for teacher conflicts across sections
          const entries = generateEntries(
            semester,
            section,
            offset,
            allEntries
          );
          allEntries.push(...entries);

          console.log(
            `📚 Semester ${semester}, Section ${section}: ${entries.length} entries (offset: ${offset})`
          );
        });
      });

      // Validate no teacher conflicts
      const teacherConflicts = findTeacherConflicts(allEntries);
      if (teacherConflicts.length > 0) {
        console.warn("⚠️ Teacher conflicts detected:", teacherConflicts);
      } else {
        console.log(
          "✅ No teacher conflicts - all teachers have valid schedules!"
        );
      }

      console.log(
        `🎓 Generated ${allEntries.length} total entries for ${input.semesters.length} semesters and ${input.sections.length} sections`
      );
      console.log("📝 Sample entry:", allEntries[0]);
      return allEntries;
    };

    // Helper function to find teacher conflicts
    const findTeacherConflicts = (entries: any[]) => {
      const conflicts: any[] = [];
      const timeSlotMap = new Map<string, any[]>();

      entries.forEach((entry) => {
        const key = `${entry.teacherName}|${entry.day}|${entry.timeSlot}`;
        if (!timeSlotMap.has(key)) {
          timeSlotMap.set(key, []);
        }
        timeSlotMap.get(key)?.push(entry);
      });

      timeSlotMap.forEach((entries, key) => {
        if (entries.length > 1) {
          conflicts.push({
            teacher: entries[0].teacherName,
            day: entries[0].day,
            timeSlot: entries[0].timeSlot,
            sections: entries.map((e) => e.section),
            courses: entries.map((e) => e.courseCode),
          });
        }
      });

      return conflicts;
    };

    // Generate 3 different solutions
    const solutions = [
      {
        id: "solution-1",
        name: "Balanced Optimization",
        score: 92.5,
        optimization: "balanced",
        conflicts: 0,
        quality: {
          overall_score: 92.5,
          teacher_satisfaction: 90.0,
          student_satisfaction: 91.5,
          resource_utilization: 95.0,
        },
        timetable_entries: generateAllSectionEntries(),
        generation_time: "1.2s",
        metadata: {
          total_classes:
            input.course_assignments.reduce(
              (sum: number, c: any) => sum + c.classes_per_week,
              0
            ) *
            input.sections.length *
            input.semesters.length,
          teachers_involved: new Set(
            input.course_assignments.map((c: any) => c.teacher_id)
          ).size,
          rooms_used: 6,
          conflicts_resolved: 0,
        },
      },
      {
        id: "solution-2",
        name: "Teacher-Optimized",
        score: 95.8,
        optimization: "teacher-focused",
        conflicts: 0,
        quality: {
          overall_score: 95.8,
          teacher_satisfaction: 98.2,
          student_satisfaction: 89.0,
          resource_utilization: 92.3,
        },
        timetable_entries: generateAllSectionEntries(),
        generation_time: "1.5s",
        metadata: {
          total_classes:
            input.course_assignments.reduce(
              (sum: number, c: any) => sum + c.classes_per_week,
              0
            ) *
            input.sections.length *
            input.semesters.length,
          teachers_involved: new Set(
            input.course_assignments.map((c: any) => c.teacher_id)
          ).size,
          rooms_used: 6,
          conflicts_resolved: 0,
        },
      },
      {
        id: "solution-3",
        name: "Student-Optimized",
        score: 89.3,
        optimization: "student-focused",
        conflicts: 0,
        quality: {
          overall_score: 89.3,
          teacher_satisfaction: 85.4,
          student_satisfaction: 96.7,
          resource_utilization: 88.0,
        },
        timetable_entries: generateAllSectionEntries(),
        generation_time: "0.9s",
        metadata: {
          total_classes:
            input.course_assignments.reduce(
              (sum: number, c: any) => sum + c.classes_per_week,
              0
            ) *
            input.sections.length *
            input.semesters.length,
          teachers_involved: new Set(
            input.course_assignments.map((c: any) => c.teacher_id)
          ).size,
          rooms_used: 5,
          conflicts_resolved: 0,
        },
      },
    ];

    return solutions;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Manual Time Configuration
            </h3>
            <p className="text-gray-600 mb-6">
              Set up your class schedule manually. Configure start/end times,
              class duration, lunch break, and working days.
            </p>
            <ManualTimeConfiguration
              onConfigChange={setTimeConfig}
              initialConfig={timeConfig || undefined}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Department Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Select Department
              </h3>

              {/* Debug Info */}
              <div className="mb-4 p-3 bg-gray-100 rounded-md text-sm">
                <strong>Debug Info:</strong>
                <div>Departments loaded: {departments.length}</div>
                <div>Loading: {loading ? "Yes" : "No"}</div>
                <div>Error: {error || "None"}</div>
                <div>
                  Token: {localStorage.getItem("token") ? "Present" : "Missing"}
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept) => (
                  <div
                    key={dept.department_id}
                    onClick={() => {
                      // Toggle department selection
                      if (
                        selectedDepartments.some(
                          (d) => d.department_id === dept.department_id
                        )
                      ) {
                        setSelectedDepartments(
                          selectedDepartments.filter(
                            (d) => d.department_id !== dept.department_id
                          )
                        );
                      } else {
                        setSelectedDepartments([...selectedDepartments, dept]);
                      }
                    }}
                    className={`
                      border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
                      ${
                        selectedDepartments.some(
                          (d) => d.department_id === dept.department_id
                        )
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                          : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {dept.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {dept.code || "No code"}
                        </div>
                      </div>
                      <div
                        className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center
                        ${
                          selectedDepartments.some(
                            (d) => d.department_id === dept.department_id
                          )
                            ? "bg-blue-500 border-blue-500"
                            : "border-gray-300"
                        }
                      `}
                      >
                        {selectedDepartments.some(
                          (d) => d.department_id === dept.department_id
                        ) && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedDepartments.length > 0 && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-green-800 font-medium">
                      Selected ({selectedDepartments.length}):{" "}
                      {selectedDepartments.map((d) => d.name).join(", ")}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Semester Selection */}
            {selectedDepartments.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Select Semesters
                </h3>

                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                    <button
                      key={semester}
                      onClick={() => toggleSemester(semester)}
                      className={`
                        px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                        ${
                          selectedSemesters.includes(semester)
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }
                      `}
                    >
                      Sem {semester}
                    </button>
                  ))}
                </div>

                {selectedSemesters.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-blue-800 text-sm">
                      Selected:{" "}
                      {selectedSemesters.map((s) => `Semester ${s}`).join(", ")}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Section Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-blue-600" />
                Select Sections
              </h3>

              {loadingSections ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading sections...</p>
                </div>
              ) : availableSections.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                  <p className="text-gray-700">
                    No sections found for the selected department(s).
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Please ensure sections are created in the database for the
                    selected departments.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 mb-4 text-sm">
                    Select sections from the available departments. Sections are
                    organized by department below.
                  </p>

                  {/* Group sections by department for better visualization */}
                  {selectedDepartments.map((dept) => {
                    const deptSections = availableSections.filter(
                      (s) => s.department_id === dept.department_id
                    );

                    if (deptSections.length === 0) return null;

                    return (
                      <div key={dept.department_id} className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                          {dept.name} - {dept.code}
                        </h4>
                        <div className="grid grid-cols-6 md:grid-cols-12 gap-3">
                          {deptSections.map((section) => (
                            <button
                              key={section.section_id}
                              onClick={() =>
                                toggleSection(section.section_name)
                              }
                              className={`
                                px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                                ${
                                  selectedSections.includes(
                                    section.section_name
                                  )
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }
                              `}
                              title={`${dept.code} - Section ${
                                section.section_name
                              }${
                                section.description
                                  ? ": " + section.description
                                  : ""
                              }`}
                            >
                              {section.section_name}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {selectedSections.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <span className="text-blue-800 text-sm font-medium">
                        Selected Sections ({selectedSections.length}):{" "}
                        {selectedSections.join(", ")}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Academic Year and Date Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Academic Year Settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester Start Date
                  </label>
                  <input
                    type="date"
                    value={timetableSettings.start_date}
                    onChange={(e) =>
                      setTimetableSettings((prev) => ({
                        ...prev,
                        start_date: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester End Date
                  </label>
                  <input
                    type="date"
                    value={timetableSettings.end_date}
                    onChange={(e) =>
                      setTimetableSettings((prev) => ({
                        ...prev,
                        end_date: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Max Teacher Hours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Teacher Hours per Week
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="40"
                    value={timetableSettings.max_teacher_hours}
                    onChange={(e) =>
                      setTimetableSettings((prev) => ({
                        ...prev,
                        max_teacher_hours: parseInt(e.target.value) || 18,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Generation Preferences */}
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  AI Generation Preferences
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-gray-700">
                      Constraint Preferences
                    </h5>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={timetableSettings.lunch_break_mandatory}
                        onChange={(e) =>
                          setTimetableSettings((prev) => ({
                            ...prev,
                            lunch_break_mandatory: e.target.checked,
                          }))
                        }
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Mandatory lunch break
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={timetableSettings.avoid_back_to_back_labs}
                        onChange={(e) =>
                          setTimetableSettings((prev) => ({
                            ...prev,
                            avoid_back_to_back_labs: e.target.checked,
                          }))
                        }
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Avoid back-to-back lab sessions
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={timetableSettings.morning_theory_preference}
                        onChange={(e) =>
                          setTimetableSettings((prev) => ({
                            ...prev,
                            morning_theory_preference: e.target.checked,
                          }))
                        }
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Prefer theory classes in morning
                      </span>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-gray-700">
                      Optimization Goals
                    </h5>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Teacher workload balance
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Student schedule optimization
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Minimize room conflicts
                      </span>
                    </label>
                  </div>
                </div>

                {/* AI Generation Settings */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="text-sm font-medium text-blue-900 mb-3">
                    🤖 AI Generation Settings
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-blue-700 mb-1">
                        Max Solutions to Generate
                      </label>
                      <select
                        className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        defaultValue="5"
                      >
                        <option value="3">3 Solutions</option>
                        <option value="5">5 Solutions</option>
                        <option value="10">10 Solutions</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-blue-700 mb-1">
                        Generation Timeout
                      </label>
                      <select
                        className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        defaultValue="10"
                      >
                        <option value="5">5 minutes</option>
                        <option value="10">10 minutes</option>
                        <option value="15">15 minutes</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-blue-700 mb-1">
                        Quality Threshold
                      </label>
                      <select
                        className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        defaultValue="80"
                      >
                        <option value="70">70%</option>
                        <option value="80">80%</option>
                        <option value="90">90%</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return selectedDepartments.length > 0 &&
          selectedSemesters.length > 0 &&
          selectedSections.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
              Course Assignment Matrix
            </h3>
            <p className="text-gray-600 mb-6">
              Assign teachers to courses and configure the number of classes per
              week for each session type.
            </p>
            <CourseAssignmentMatrix
              departmentIds={departmentIds}
              semesters={selectedSemesters} // Pass all selected semesters
              sections={selectedSections}
              onAssignmentsChange={setCourseAssignments}
              onValidationChange={setAssignmentsValid}
            />
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Configuration Required
            </h3>
            <p className="text-gray-600">
              Please complete department, semester, and section selection first.
            </p>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-4">
                📊 Generation Summary & Configuration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                {/* Basic Info */}
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-800 border-b border-blue-300 pb-1">
                    Basic Configuration
                  </h4>
                  <div>
                    <span className="font-medium text-gray-700">
                      Departments ({selectedDepartments.length}):
                    </span>
                    <span className="ml-2 text-gray-900">
                      {selectedDepartments.map((d) => d.name).join(", ")}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Semesters:
                    </span>
                    <span className="ml-2 text-gray-900">
                      {selectedSemesters.join(", ")}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Sections:</span>
                    <span className="ml-2 text-gray-900">
                      {selectedSections.join(", ")}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Academic Period:
                    </span>
                    <span className="ml-2 text-gray-900 text-xs">
                      {timetableSettings.start_date} to{" "}
                      {timetableSettings.end_date}
                    </span>
                  </div>
                </div>

                {/* Time Configuration */}
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-800 border-b border-blue-300 pb-1">
                    Time Configuration
                  </h4>
                  <div>
                    <span className="font-medium text-gray-700">
                      Working Days:
                    </span>
                    <span className="ml-2 text-gray-900">
                      {timeConfig?.workingDays.length || 0} days
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Daily Hours:
                    </span>
                    <span className="ml-2 text-gray-900">
                      {timeConfig?.startTime} - {timeConfig?.endTime}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Class Duration:
                    </span>
                    <span className="ml-2 text-gray-900">
                      {timeConfig?.classDuration} minutes
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Lunch Break:
                    </span>
                    <span className="ml-2 text-gray-900">
                      {timeConfig?.lunchBreak.enabled
                        ? `${timeConfig.lunchBreak.startTime} - ${timeConfig.lunchBreak.endTime}`
                        : "Disabled"}
                    </span>
                  </div>
                </div>

                {/* Course Load */}
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-800 border-b border-blue-300 pb-1">
                    Course Load
                  </h4>
                  <div>
                    <span className="font-medium text-gray-700">
                      Total Courses:
                    </span>
                    <span className="ml-2 text-gray-900">
                      {courseAssignments.length} configured
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Total Classes/Week:
                    </span>
                    <span className="ml-2 text-gray-900">
                      {courseAssignments.reduce(
                        (sum, ca) => sum + ca.classes_per_week,
                        0
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Max Teacher Hours:
                    </span>
                    <span className="ml-2 text-gray-900">
                      {timetableSettings.max_teacher_hours}/week
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Theory/Lab Ratio:
                    </span>
                    <span className="ml-2 text-gray-900">
                      {
                        courseAssignments.filter(
                          (ca) => ca.session_type === "theory"
                        ).length
                      }
                      :
                      {
                        courseAssignments.filter(
                          (ca) => ca.session_type === "lab"
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Preferences Summary */}
              <div className="mt-4 p-3 bg-blue-100 rounded-md">
                <h5 className="text-sm font-medium text-blue-900 mb-2">
                  🎯 Active Preferences
                </h5>
                <div className="flex flex-wrap gap-2">
                  {timetableSettings.lunch_break_mandatory && (
                    <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded">
                      Mandatory Lunch
                    </span>
                  )}
                  {timetableSettings.avoid_back_to_back_labs && (
                    <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded">
                      No Back-to-Back Labs
                    </span>
                  )}
                  {timetableSettings.morning_theory_preference && (
                    <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded">
                      Morning Theory
                    </span>
                  )}
                  <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded">
                    AI-Powered Generation
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            )}

            {/* AI Test Button - No Auth Required */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                🤖 Test AI Generation
              </h4>
              <p className="text-sm text-blue-700 mb-3">
                Test the AI timetable generation system without authentication
              </p>
              <button
                onClick={async () => {
                  try {
                    console.log("🧪 Testing AI endpoint...");
                    setError(null);

                    const response = await fetch(
                      `${
                        process.env.REACT_APP_API_URL ||
                        "http://localhost:5000/api"
                      }/ai-generate-test`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          test: true,
                          courses: courseAssignments.length,
                          sections: selectedSections.length,
                          departments: selectedDepartments
                            .map((d) => d.name)
                            .join(", "),
                        }),
                      }
                    );

                    const result = await response.json();
                    console.log("✅ AI Test Result:", result);

                    if (result.success) {
                      alert(
                        `🎉 AI Test Successful!\n\nGenerated ${
                          result.data.solutions.length
                        } solutions:\n${result.data.solutions
                          .map(
                            (s: any) =>
                              `• ${s.name}: ${s.quality.overall_score}% score`
                          )
                          .join("\n")}\n\nGeneration time: ${
                          result.data.generation_summary
                            .total_generation_time_ms
                        }ms`
                      );
                    } else {
                      alert("❌ AI Test Failed: " + result.message);
                    }
                  } catch (error) {
                    console.error("❌ Test Error:", error);
                    setError("Connection Error: " + (error as Error).message);
                  }
                }}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                🧪 Test AI Generation (No Auth)
              </button>
            </div>

            <button
              onClick={generateTimetable}
              disabled={generating || !canProceedToNext()}
              className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                generating || !canProceedToNext()
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {generating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating AI Timetable...
                </div>
              ) : (
                "🤖 Generate AI Timetable"
              )}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Smart Timetable Generator
              </h1>
              <p className="text-gray-600 mt-1">
                Create intelligent, conflict-free timetables with manual time
                configuration
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              <span className="text-sm text-gray-500">
                Step {currentStep} of {steps.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      isCompleted
                        ? "bg-green-500 border-green-500 text-white"
                        : isActive
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="ml-3 hidden md:block">
                    <div
                      className={`text-sm font-medium ${
                        isActive
                          ? "text-blue-600"
                          : isCompleted
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {step.description}
                    </div>
                  </div>

                  {index < steps.length - 1 && (
                    <ChevronRight className="w-5 h-5 text-gray-400 mx-4" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-6">{renderStepContent()}</div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md transition-colors ${
              currentStep === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </button>

          {/* Validation Message */}
          <div className="flex-1 text-center">
            {!canProceedToNext() && getStepValidationMessage() && (
              <div className="inline-flex items-center px-3 py-1 bg-yellow-100 border border-yellow-300 rounded-md">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-800">
                  {getStepValidationMessage()}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={nextStep}
            disabled={currentStep === steps.length || !canProceedToNext()}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md transition-colors ${
              currentStep === steps.length || !canProceedToNext()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartTimetableGenerator;
