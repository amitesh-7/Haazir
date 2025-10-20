import React, { useState, useEffect, useMemo } from "react";
import {
  fetchTimetable,
  fetchTimetableBySection,
  createTimetableEntry,
  updateTimetableEntryApi,
  deleteTimetableEntry,
  fetchAllDepartments,
  fetchSectionsByDepartment,
  fetchSectionsByDepartmentAndSemester,
  fetchAllCourses,
  fetchAllTeachers,
  fetchTeachersByCourse,
  fetchBatchesBySection,
  createBatch,
  saveTimetableViewSettings,
  fetchTimetableViewSettings,
} from "../../services/api";

interface TimetableEntry {
  id: string;
  courseId: string;
  teacherId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  classroom: string;
  classType?: string; // "Lecture", "Tutorial", "Lab"
  targetAudience?: string; // "Section", "Batch"
  batchId?: string; // Only for Tutorial and Lab
}

interface NewTimetableEntry {
  courseId: string;
  teacherId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  classroom: string;
  sectionId?: string; // Required for backend
  classType?: string; // "Lecture", "Tutorial", "Lab"
  targetAudience?: string; // "Section", "Batch"
  batchId?: string; // Only for Tutorial and Lab
}

const TimetableManagement: React.FC = () => {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  // Start with loading disabled; enable only when fetching via Load from DB
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to access the timetable management.");
      setLoading(false);
      return;
    }
  }, []);

  // View modes and filters
  const [gridView, setGridView] = useState(true);
  const [filterDept, setFilterDept] = useState("");
  const [filterCourse, setFilterCourse] = useState("");

  // Grid settings with persistence per department-semester
  const [gridStart, setGridStart] = useState("08:00");
  const [gridEnd, setGridEnd] = useState("18:00");
  const [slotMinutes, setSlotMinutes] = useState(30);

  // Batch mode
  const [batchMode, setBatchMode] = useState(false);
  const [selectedCells, setSelectedCells] = useState<
    Array<{ day: string; start: string }>
  >([]);

  // Auto-save functionality for time slot selections
  const [autoSavedSlots, setAutoSavedSlots] = useState<{
    [sectionKey: string]: Array<{ day: string; start: string }>;
  }>(() => {
    try {
      const saved = localStorage.getItem("autoSavedTimeSlots");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  // Modal states
  const [editOpen, setEditOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<TimetableEntry | null>(null);
  const [editError, setEditError] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);

  // Form states
  const [newEntry, setNewEntry] = useState<NewTimetableEntry>({
    courseId: "",
    teacherId: "",
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    classroom: "",
    sectionId: "",
    classType: "",
    targetAudience: "",
    batchId: "",
  });

  const [batchCourseId, setBatchCourseId] = useState("");
  const [batchTeacherId, setBatchTeacherId] = useState("");
  const [batchError, setBatchError] = useState("");
  const [batchResults, setBatchResults] = useState<string[]>([]);

  // Save/Load functionality
  const [savedTimetables, setSavedTimetables] = useState<
    Array<{
      id: string;
      name: string;
      data: TimetableEntry[];
      context?: {
        department: string;
        semester: string;
        section: string;
      };
      gridSettings: {
        gridStart: string;
        gridEnd: string;
        breakEnabled: boolean;
        breakStart: string;
        breakEnd: string;
        slotMinutes: number;
      };
      createdAt: string;
    }>
  >([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showLoadDBModal, setShowLoadDBModal] = useState(false);
  const [saveModalName, setSaveModalName] = useState("");
  const [saveError, setSaveError] = useState("");
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Break settings (controlled by view control settings)
  const [breakEnabled, setBreakEnabled] = useState(true);
  const [breakStart, setBreakStart] = useState("12:00");
  const [breakEnd, setBreakEnd] = useState("13:00");

  // Dynamic data - loaded from API
  const [departments, setDepartments] = useState<
    Array<{ department_id: number; name: string }>
  >([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]);
  const [sections, setSections] = useState<
    Array<{
      section_id: number;
      section_name: string;
      department_id: number;
      semester: number;
    }>
  >([]);
  const [batches, setBatches] = useState<
    Array<{ batch_id: number; batch_name: string; section_id: number }>
  >([]);

  // Current timetable context
  const [currentDepartment, setCurrentDepartment] = useState("");
  const [currentSemester, setCurrentSemester] = useState("");
  const [currentSection, setCurrentSection] = useState("");

  // Helper function to get department-semester key for view settings
  const getDeptSemKey = () => {
    if (!currentDepartment || !currentSemester) return null;
    return `${currentDepartment}-${currentSemester}`;
  };

  // Save view control settings to database
  const saveViewControlSettings = async () => {
    if (!currentDepartment || !currentSemester) {
      console.log("⚠️ Cannot save settings: missing department or semester");
      return;
    }

    // Get department ID
    const selectedDept = departments.find((d) => d.name === currentDepartment);
    if (!selectedDept) {
      console.log("⚠️ Cannot save settings: department not found");
      return;
    }

    // Get section ID if section is selected
    let sectionId = "all";
    if (currentSection) {
      const selectedSection = sections.find(
        (s) => s.section_name === currentSection
      );
      if (selectedSection) {
        sectionId = String(selectedSection.section_id);
      }
    }

    const settings = {
      gridView,
      gridStart,
      gridEnd,
      slotMinutes,
      breakEnabled,
      breakStart,
      breakEnd,
    };

    try {
      await saveTimetableViewSettings(
        selectedDept.department_id,
        currentSemester,
        sectionId,
        settings
      );
      console.log(
        `📾 Saved view controls to database for section ${
          currentSection || "all"
        }:`,
        settings
      );
    } catch (error) {
      console.error("❌ Failed to save view settings:", error);
    }
  };

  // Load view control settings for current department-semester from database
  const loadViewControlSettings = async () => {
    if (!currentDepartment || !currentSemester) return;

    // Get department ID
    const selectedDept = departments.find((d) => d.name === currentDepartment);
    if (!selectedDept) {
      console.log("⚠️ Cannot load settings: department not found");
      return;
    }

    // Get section ID if section is selected
    let sectionId = "all";
    if (currentSection) {
      const selectedSection = sections.find(
        (s) => s.section_name === currentSection
      );
      if (selectedSection) {
        sectionId = String(selectedSection.section_id);
      }
    }

    try {
      const settings = await fetchTimetableViewSettings(
        selectedDept.department_id,
        currentSemester,
        sectionId
      );

      if (settings) {
        setGridView(settings.gridView);
        setGridStart(settings.gridStart);
        setGridEnd(settings.gridEnd);
        setSlotMinutes(settings.slotMinutes);
        setBreakEnabled(settings.breakEnabled);
        setBreakStart(settings.breakStart);
        setBreakEnd(settings.breakEnd);
        console.log(
          `📂 Restored view controls from database for ${currentDepartment}-${currentSemester}-${
            currentSection || "all"
          }:`,
          settings
        );
      } else {
        // Set default values for new department-semester combination
        setGridView(true);
        setGridStart("08:00");
        setGridEnd("18:00");
        setSlotMinutes(30);
        setBreakEnabled(true);
        setBreakStart("12:00");
        setBreakEnd("13:00");
        console.log(
          `🔧 Set default view controls for new ${currentDepartment}-${currentSemester}-${
            currentSection || "all"
          }`
        );
      }
    } catch (error) {
      console.error("❌ Failed to load view settings:", error);
      // Fall back to defaults
      setGridView(true);
      setGridStart("08:00");
      setGridEnd("18:00");
      setSlotMinutes(30);
      setBreakEnabled(true);
      setBreakStart("12:00");
      setBreakEnd("13:00");
    }
  };

  // Memoized data to prevent unnecessary re-renders and API calls
  const memoizedDepartments = useMemo(() => departments, [departments]);
  const memoizedCourses = useMemo(() => courses, [courses]);
  const memoizedTeachers = useMemo(() => allTeachers, [allTeachers]);

  // Cache for course-teacher combinations to prevent redundant API calls
  const [courseTeacherCache, setCourseTeacherCache] = useState<{
    [courseId: string]: any[];
  }>({});

  // Load departments on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load departments, courses, and teachers in parallel
        const [departmentsData, coursesData, teachersData] = await Promise.all([
          fetchAllDepartments(),
          fetchAllCourses(),
          fetchAllTeachers(),
        ]);

        setDepartments(departmentsData || []);
        setCourses(coursesData || []);
        setTeachers(teachersData || []);
        setAllTeachers(teachersData || []);
        setFilteredTeachers(teachersData || []);

        // Don't auto-select department - let users choose
        // This prevents confusion and ensures intentional selection
        console.log(
          `Loaded ${departmentsData?.length || 0} departments, ${
            coursesData?.length || 0
          } courses, ${teachersData?.length || 0} teachers`
        );

        setInitialLoadComplete(true);
        setError(""); // Clear any previous errors on successful load
      } catch (error: any) {
        console.error("Error loading initial data:", error);
        if (error.response?.status === 401) {
          setError(
            "Authentication required. Please log in to access the system."
          );
        } else if (error.response?.status === 403) {
          setError(
            "Access denied. You don't have permission to view this data."
          );
        } else {
          setError(
            "Failed to load data. Please check your connection and try again."
          );
        }
        setInitialLoadComplete(true);
      }
    };
    loadInitialData();
  }, []);

  // Load view control settings when department, semester, or section changes
  useEffect(() => {
    if (currentDepartment && currentSemester && initialLoadComplete) {
      loadViewControlSettings();
    }
  }, [currentDepartment, currentSemester, currentSection, initialLoadComplete]);

  // Auto-save view control settings when they change
  useEffect(() => {
    if (currentDepartment && currentSemester && initialLoadComplete) {
      // Use a small timeout to debounce rapid changes
      const saveTimeout = setTimeout(() => {
        saveViewControlSettings();
      }, 300);

      return () => clearTimeout(saveTimeout);
    }
  }, [
    gridView,
    gridStart,
    gridEnd,
    slotMinutes,
    breakEnabled,
    breakStart,
    breakEnd,
    currentDepartment,
    currentSemester,
    initialLoadComplete,
  ]);

  // Load sections when department and semester change
  useEffect(() => {
    const loadSections = async () => {
      if (
        currentDepartment &&
        currentSemester &&
        departments.length > 0 &&
        initialLoadComplete
      ) {
        try {
          const selectedDept = departments.find(
            (d) => d.name === currentDepartment
          );

          if (selectedDept) {
            const sectionsData = await fetchSectionsByDepartmentAndSemester(
              selectedDept.department_id,
              currentSemester
            );

            setSections(sectionsData || []);
            // Auto-select first section if available
            if (sectionsData && sectionsData.length > 0) {
              setCurrentSection(sectionsData[0].section_name);
            } else {
              setCurrentSection("");
            }
          } else {
            setSections([]);
            setCurrentSection("");
          }
        } catch (error: any) {
          console.error("Error loading sections:", error);
          if (error.response?.status === 401) {
            setError(
              "Authentication required. Please log in to access sections."
            );
          } else if (error.response?.status === 403) {
            setError(
              "Access denied. You don't have permission to view sections."
            );
          } else if (error.response?.status === 404) {
            // 404 is expected when no sections exist for a department/semester
            setSections([]);
            setCurrentSection("");
          } else {
            setError(
              "Failed to load sections for selected department and semester."
            );
          }
          setSections([]);
          setCurrentSection("");
        }
      } else if (!currentDepartment || !currentSemester) {
        setSections([]);
        setCurrentSection("");
      }
    };

    // Only load sections when currentDepartment or currentSemester changes AND initial load is complete
    if (initialLoadComplete) {
      loadSections();
    }
  }, [currentDepartment, currentSemester, initialLoadComplete, departments]);

  // Load batches when section changes
  useEffect(() => {
    const loadBatches = async () => {
      if (currentSection && sections.length > 0) {
        try {
          const selectedSection = sections.find(
            (s) => s.section_name === currentSection
          );

          if (selectedSection) {
            let batchesData = await fetchBatchesBySection(
              selectedSection.section_id
            );

            // If no batches exist, create default batches
            if (!batchesData || batchesData.length === 0) {
              try {
                console.log(
                  `Creating default batches for section ${selectedSection.section_name}`
                );

                // Create default batches: P1, P2 for practicals/labs and T1, T2 for tutorials
                const defaultBatches = [
                  { batch_name: "P1", description: "Practical Group 1" },
                  { batch_name: "P2", description: "Practical Group 2" },
                  { batch_name: "T1", description: "Tutorial Group 1" },
                  { batch_name: "T2", description: "Tutorial Group 2" },
                ];

                const createdBatches: any[] = [];
                for (const batch of defaultBatches) {
                  try {
                    const newBatch = await createBatch({
                      section_id: selectedSection.section_id,
                      batch_name: batch.batch_name,
                      batch_size: 30, // Default batch size
                      description: batch.description,
                    });
                    createdBatches.push(newBatch);
                  } catch (createError: any) {
                    console.warn(
                      `Failed to create batch ${batch.batch_name}:`,
                      createError
                    );
                  }
                }

                setBatches(createdBatches);
                console.log(`Created ${createdBatches.length} default batches`);
              } catch (createError: any) {
                console.error("Error creating default batches:", createError);
                setBatches([]);
              }
            } else {
              setBatches(batchesData);
            }

            // Automatically load timetable for the selected section
            console.log(
              `Auto-loading timetable for section: ${selectedSection.section_name}`
            );
            try {
              const timetableData = await fetchTimetableBySection(
                selectedSection.section_id
              );
              console.log("📥 RAW TIMETABLE DATA FROM BACKEND:", timetableData);
              console.log(
                `📊 Loaded ${timetableData?.length || 0} classes for section ${
                  selectedSection.section_name
                }`
              );

              // Log each entry with teacher info
              if (timetableData && timetableData.length > 0) {
                console.log("📋 TIMETABLE ENTRIES BREAKDOWN:");
                timetableData.forEach((entry: any, idx: number) => {
                  console.log(
                    `  [${idx + 1}] ${
                      entry.teacherName || "Unknown Teacher"
                    } - ${entry.day} ${entry.start}-${entry.end}`
                  );
                });
              }

              setTimetable(timetableData || []);
            } catch (timetableError: any) {
              console.warn("Error auto-loading timetable:", timetableError);
              // Don't show error to user for auto-loading, they can manually load if needed
              setTimetable([]);
            }
          } else {
            setBatches([]);
            setTimetable([]); // Clear timetable when no section is selected
          }
        } catch (error: any) {
          console.error("Error loading batches:", error);
          setBatches([]);
          setTimetable([]);
        }
      } else {
        setBatches([]);
        setTimetable([]); // Clear timetable when no section is selected
      }
    };

    loadBatches();
  }, [currentSection, sections]);

  // Auto-save selected time slots for the current section (only when cells actually change)
  useEffect(() => {
    if (currentSection && currentDepartment && currentSemester) {
      const sectionKey = `${currentDepartment}-${currentSemester}-${currentSection}`;

      // Check if selectedCells actually changed from what's saved
      const currentSaved = autoSavedSlots[sectionKey] || [];
      const selectedCellsString = JSON.stringify(selectedCells.sort());
      const currentSavedString = JSON.stringify(currentSaved.sort());

      // Only save if there's an actual change
      if (selectedCellsString !== currentSavedString) {
        const savedSlots = {
          ...autoSavedSlots,
          [sectionKey]: selectedCells,
        };

        setAutoSavedSlots(savedSlots);
        localStorage.setItem("autoSavedTimeSlots", JSON.stringify(savedSlots));
        setLastAutoSave(new Date());

        console.log(
          `🔄 Auto-saved ${selectedCells.length} time slots for section: ${sectionKey}`
        );
      }
    }
  }, [selectedCells, currentSection, currentDepartment, currentSemester]);

  // Load auto-saved time slots when section changes
  useEffect(() => {
    if (currentSection && currentDepartment && currentSemester) {
      const sectionKey = `${currentDepartment}-${currentSemester}-${currentSection}`;

      // Load from current autoSavedSlots state (already initialized from localStorage)
      if (autoSavedSlots[sectionKey] && autoSavedSlots[sectionKey].length > 0) {
        setSelectedCells(autoSavedSlots[sectionKey]);
        console.log(
          `✅ Restored ${autoSavedSlots[sectionKey].length} auto-saved time slots for section: ${sectionKey}`,
          autoSavedSlots[sectionKey]
        );
      } else {
        setSelectedCells([]);
        console.log(
          `🔄 No auto-saved time slots found for section: ${sectionKey}`
        );
      }
    } else {
      // Clear selections when no section is selected
      setSelectedCells([]);
      console.log("🧹 Cleared selections - no section selected");
    }
  }, [currentSection, currentDepartment, currentSemester, autoSavedSlots]);

  const dayOptions = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const dayColumns = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Helper function to add minutes to time
  const addMinutesToTime = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(":").map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, "0")}:${newMins
      .toString()
      .padStart(2, "0")}`;
  };

  // Helper function to get class type styling
  const getClassTypeStyle = (classType?: string) => {
    switch (classType?.toLowerCase()) {
      case "lecture":
        return {
          bg: "from-blue-500 to-indigo-600",
          bgHover: "from-blue-600 to-indigo-700",
          text: "text-blue-50",
          badge: "bg-blue-200 text-blue-800",
          icon: "🎓",
          border: "border-blue-300",
        };
      case "lab":
        return {
          bg: "from-purple-500 to-pink-600",
          bgHover: "from-purple-600 to-pink-700",
          text: "text-purple-50",
          badge: "bg-purple-200 text-purple-800",
          icon: "🔬",
          border: "border-purple-300",
        };
      case "tutorial":
        return {
          bg: "from-emerald-500 to-green-600",
          bgHover: "from-emerald-600 to-green-700",
          text: "text-emerald-50",
          badge: "bg-emerald-200 text-emerald-800",
          icon: "📝",
          border: "border-emerald-300",
        };
      default:
        return {
          bg: "from-gray-500 to-slate-600",
          bgHover: "from-gray-600 to-slate-700",
          text: "text-gray-50",
          badge: "bg-gray-200 text-gray-800",
          icon: "📚",
          border: "border-gray-300",
        };
    }
  };

  // Time slot formatting helper
  const formatTimeSlot = (startTime: string, slotDuration: number) => {
    const start = startTime;
    const end = addMinutesToTime(startTime, slotDuration);
    return `${start} - ${end}`;
  };

  // Computed values
  const filteredTimetable = useMemo(() => {
    console.log("🔍 TIMETABLE FILTERING DEBUG:");
    console.log("  Raw timetable entries:", timetable.length);
    console.log("  Active filterDept:", filterDept);
    console.log("  Active filterCourse:", filterCourse);

    const filtered = timetable.filter((entry) => {
      if (filterDept) {
        const course = courses.find(
          (c) => String(c.course_id) === String(entry.courseId)
        );
        if (!course) {
          console.log("  ❌ Entry filtered out (course not found):", entry);
          return false;
        }
        if (String(course.department_id) !== String(filterDept)) {
          console.log("  ❌ Entry filtered out (department mismatch):", {
            entry,
            course_dept: course.department_id,
            filter_dept: filterDept,
          });
          return false;
        }
      }
      if (filterCourse && String(entry.courseId) !== String(filterCourse)) {
        console.log("  ❌ Entry filtered out (course mismatch):", {
          entry,
          entry_courseId: entry.courseId,
          filter_courseId: filterCourse,
        });
        return false;
      }
      return true;
    });

    console.log("  ✅ Filtered timetable entries:", filtered.length);
    console.log("  Filtered entries:", filtered);

    // Help find specific entries by day and time
    const tuesdayClasses = filtered.filter((e: any) => e.day === "Tuesday");
    if (tuesdayClasses.length > 0) {
      console.log("  📅 Tuesday classes:", tuesdayClasses.length);
      tuesdayClasses.forEach((cls: any, idx: number) => {
        console.log(
          `    [${idx + 1}] ${cls.teacherName || "Unknown"} - ${cls.start}-${
            cls.end
          } (${cls.courseName || cls.courseId})`
        );
      });
    }

    return filtered;
  }, [timetable, filterDept, filterCourse, courses]);

  const gridSlots = useMemo(() => {
    const start = new Date(`1970-01-01T${gridStart}:00`);
    const end = new Date(`1970-01-01T${gridEnd}:00`);
    if (start >= end || slotMinutes <= 0)
      return { firstHalf: [], break: [], secondHalf: [] };

    const breakStartTime = breakEnabled
      ? new Date(`1970-01-01T${breakStart}:00`)
      : null;
    const breakEndTime = breakEnabled
      ? new Date(`1970-01-01T${breakEnd}:00`)
      : null;

    // Validation: break end must be after break start
    if (
      breakEnabled &&
      breakStartTime &&
      breakEndTime &&
      breakEndTime <= breakStartTime
    ) {
      return { firstHalf: [], break: [], secondHalf: [] };
    }

    const firstHalf: string[] = [];
    const secondHalf: string[] = [];
    const breakSlots: string[] = [];

    // Generate time slots with unified break period handling
    let current = new Date(start);
    let iterationCount = 0;
    const maxIterations = 200;

    while (current < end && iterationCount < maxIterations) {
      iterationCount++;
      const timeStr = current.toTimeString().slice(0, 5);
      let slotEndTime = new Date(current.getTime() + slotMinutes * 60000);

      // Don't let slot extend beyond grid end time
      if (slotEndTime > end) {
        slotEndTime = new Date(end.getTime());
      }

      // Calculate actual duration
      const actualDuration = Math.round(
        (slotEndTime.getTime() - current.getTime()) / 60000
      );

      // Skip slots with zero or negative duration
      if (actualDuration <= 0) {
        current = new Date(
          current.getTime() + Math.max(slotMinutes * 60000, 60000)
        );
        continue;
      }

      const slotRange = formatTimeSlot(timeStr, actualDuration);

      // Unified break slot handling
      if (breakEnabled && breakStartTime && breakEndTime) {
        // Check if current slot overlaps with break period
        const slotStart = current;
        const slotEnd = slotEndTime;

        if (slotEnd <= breakStartTime) {
          // Slot is completely before break period
          firstHalf.push(slotRange);
        } else if (slotStart >= breakEndTime) {
          // Slot is completely after break period
          secondHalf.push(slotRange);
        } else {
          // Slot overlaps with break period - handle as unified break
          if (slotStart < breakStartTime && slotEnd > breakStartTime) {
            // Slot starts before break and extends into break
            // Split: add pre-break portion to first half
            const preBreakDuration = Math.round(
              (breakStartTime.getTime() - slotStart.getTime()) / 60000
            );
            if (preBreakDuration > 0) {
              const preBreakSlot = formatTimeSlot(timeStr, preBreakDuration);
              firstHalf.push(preBreakSlot);
            }

            // Add unified break slot if not already added
            if (breakSlots.length === 0) {
              const breakDuration = Math.round(
                (breakEndTime.getTime() - breakStartTime.getTime()) / 60000
              );
              const unifiedBreakSlot = formatTimeSlot(
                breakStartTime.toTimeString().slice(0, 5),
                breakDuration
              );
              breakSlots.push(unifiedBreakSlot);
            }

            // Jump to break end for next iteration
            current = new Date(breakEndTime.getTime());
            continue;
          } else if (slotStart >= breakStartTime && slotEnd <= breakEndTime) {
            // Slot is completely within break period
            // Add unified break slot if not already added
            if (breakSlots.length === 0) {
              const breakDuration = Math.round(
                (breakEndTime.getTime() - breakStartTime.getTime()) / 60000
              );
              const unifiedBreakSlot = formatTimeSlot(
                breakStartTime.toTimeString().slice(0, 5),
                breakDuration
              );
              breakSlots.push(unifiedBreakSlot);
            }

            // Jump to break end for next iteration
            current = new Date(breakEndTime.getTime());
            continue;
          } else if (
            slotStart >= breakStartTime &&
            slotStart < breakEndTime &&
            slotEnd > breakEndTime
          ) {
            // Slot starts in break and extends beyond break
            // Add unified break slot if not already added
            if (breakSlots.length === 0) {
              const breakDuration = Math.round(
                (breakEndTime.getTime() - breakStartTime.getTime()) / 60000
              );
              const unifiedBreakSlot = formatTimeSlot(
                breakStartTime.toTimeString().slice(0, 5),
                breakDuration
              );
              breakSlots.push(unifiedBreakSlot);
            }

            // Add post-break portion to second half
            const postBreakStart = breakEndTime.toTimeString().slice(0, 5);
            const postBreakDuration = Math.round(
              (slotEnd.getTime() - breakEndTime.getTime()) / 60000
            );
            if (postBreakDuration > 0) {
              const postBreakSlot = formatTimeSlot(
                postBreakStart,
                postBreakDuration
              );
              secondHalf.push(postBreakSlot);
            }
          } else {
            // Edge case: slot completely encompasses break period
            // Add unified break slot
            if (breakSlots.length === 0) {
              const breakDuration = Math.round(
                (breakEndTime.getTime() - breakStartTime.getTime()) / 60000
              );
              const unifiedBreakSlot = formatTimeSlot(
                breakStartTime.toTimeString().slice(0, 5),
                breakDuration
              );
              breakSlots.push(unifiedBreakSlot);
            }
          }
        }
      } else {
        // No break enabled, all slots go to first half
        firstHalf.push(slotRange);
      }

      // Advance to next slot
      current = slotEndTime;
    }

    return { firstHalf, break: breakSlots, secondHalf };
  }, [gridStart, gridEnd, slotMinutes, breakEnabled, breakStart, breakEnd]);

  const byDayAndSlot = useMemo(() => {
    const map: { [day: string]: { [time: string]: TimetableEntry[] } } = {};
    dayColumns.forEach((d) => (map[d] = {}));
    filteredTimetable.forEach((e) => {
      if (!map[e.dayOfWeek]) map[e.dayOfWeek] = {};
      if (!map[e.dayOfWeek][e.startTime]) map[e.dayOfWeek][e.startTime] = [];
      map[e.dayOfWeek][e.startTime].push(e);
    });
    return map;
  }, [filteredTimetable, dayColumns]);

  // Timetable is automatically loaded when department/semester/section is selected

  // Refresh current section's timetable data from database
  const refreshTimetable = async () => {
    if (currentSection && sections.length > 0) {
      const selectedSection = sections.find(
        (s) => s.section_name === currentSection
      );
      if (selectedSection) {
        try {
          console.log(`🔄 Refreshing timetable for section: ${currentSection}`);
          const timetableData = await fetchTimetableBySection(
            selectedSection.section_id
          );
          setTimetable(timetableData || []);
          console.log(
            `✅ Refreshed ${timetableData?.length || 0} classes for section ${
              selectedSection.section_name
            }`
          );
        } catch (error: any) {
          console.error("Error refreshing timetable:", error);
          setError(`Failed to refresh timetable: ${error.message}`);
        }
      }
    }
  };

  // Save current timetable with grid settings
  const saveTimetable = () => {
    if (!saveModalName.trim()) {
      setSaveError("Please enter a name for the timetable");
      return;
    }

    // Check if name already exists
    const existingName = savedTimetables.find(
      (t) => t.name.toLowerCase() === saveModalName.trim().toLowerCase()
    );
    if (existingName) {
      setSaveError(
        "A timetable with this name already exists. Please choose a different name."
      );
      return;
    }

    // Ensure we have section context for meaningful save
    if (!currentDepartment || !currentSemester || !currentSection) {
      setSaveError(
        "Please select department, semester, and section before saving timetable"
      );
      return;
    }

    try {
      setSaveError(""); // Clear any previous errors

      const newTimetable = {
        id: Date.now().toString(),
        name: saveModalName.trim(),
        data: [...timetable], // Save current timetable (already filtered for current section)
        context: {
          department: currentDepartment,
          semester: currentSemester,
          section: currentSection,
        },
        gridSettings: {
          gridStart,
          gridEnd,
          breakEnabled,
          breakStart,
          breakEnd,
          slotMinutes,
        },
        createdAt: new Date().toISOString(),
      };

      const updated = [...savedTimetables, newTimetable];
      setSavedTimetables(updated);
      localStorage.setItem("savedTimetables", JSON.stringify(updated));
      setSaveModalName("");
      setSaveError("");
      setShowSaveModal(false);

      console.log(
        `Successfully saved timetable: ${newTimetable.name} for ${currentDepartment} - ${currentSection}`
      );
    } catch (error: any) {
      console.error("Error saving timetable:", error);
      setSaveError("Failed to save timetable. Please try again.");
    }
  };

  const handleSave = saveTimetable;

  // Load saved timetable with grid settings
  const loadSavedTimetable = (timetableId: string) => {
    const savedData = savedTimetables.find((t) => t.id === timetableId);
    if (savedData) {
      setTimetable([...savedData.data]);

      // Restore grid settings if available
      if (savedData.gridSettings) {
        setGridStart(savedData.gridSettings.gridStart);
        setGridEnd(savedData.gridSettings.gridEnd);
        setBreakEnabled(savedData.gridSettings.breakEnabled);
        setBreakStart(savedData.gridSettings.breakStart);
        setBreakEnd(savedData.gridSettings.breakEnd);
        setSlotMinutes(savedData.gridSettings.slotMinutes);
      }

      // Show context information if available
      if (savedData.context) {
        console.log(
          `Loaded timetable for: ${savedData.context.department} - Semester ${savedData.context.semester} - Section ${savedData.context.section}`
        );
      }

      setShowLoadModal(false);
    }
  };

  const handleLoad = loadSavedTimetable;

  const handleDeleteSaved = (timetableId: string) => {
    if (confirm("Are you sure you want to delete this saved timetable?")) {
      const updated = savedTimetables.filter((t) => t.id !== timetableId);
      setSavedTimetables(updated);
      localStorage.setItem("savedTimetables", JSON.stringify(updated));
    }
  };

  // Delete saved timetable
  const deleteSavedTimetable = (slotName: string) => {
    const newSavedTimetables = { ...savedTimetables };
    delete newSavedTimetables[slotName];
    setSavedTimetables(newSavedTimetables);
    localStorage.setItem("savedTimetables", JSON.stringify(newSavedTimetables));
  };

  // Event handlers
  const handleChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewEntry({ ...newEntry, [name]: value });

    // When course is selected, filter teachers
    if (name === "courseId" && value) {
      try {
        // Check cache first
        if (courseTeacherCache[value]) {
          setFilteredTeachers(courseTeacherCache[value]);
          setNewEntry((prev) => ({ ...prev, courseId: value, teacherId: "" }));
        } else {
          // Fetch from API and cache the result
          const courseTeachers = await fetchTeachersByCourse(value);
          const teachersData = courseTeachers || [];
          setCourseTeacherCache((prev) => ({ ...prev, [value]: teachersData }));
          setFilteredTeachers(teachersData);
          setNewEntry((prev) => ({ ...prev, courseId: value, teacherId: "" }));
        }
      } catch (error: any) {
        console.error("Error fetching teachers for course:", error);
        // Fallback to all teachers if specific course teachers fetch fails
        setFilteredTeachers(allTeachers);
      }
    } else if (name === "courseId" && !value) {
      // Reset to all teachers when no course is selected
      setFilteredTeachers(allTeachers);
      setNewEntry((prev) => ({ ...prev, courseId: "", teacherId: "" }));
    }
  };

  const handleEditChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (editEntry) {
      const { name, value } = e.target;
      setEditEntry({ ...editEntry, [name]: value });

      // When course is selected in edit mode, filter teachers
      if (name === "courseId" && value) {
        try {
          // Check cache first
          if (courseTeacherCache[value]) {
            setFilteredTeachers(courseTeacherCache[value]);
            setEditEntry((prev) =>
              prev ? { ...prev, courseId: value, teacherId: "" } : null
            );
          } else {
            // Fetch from API and cache the result
            const courseTeachers = await fetchTeachersByCourse(value);
            const teachersData = courseTeachers || [];
            setCourseTeacherCache((prev) => ({
              ...prev,
              [value]: teachersData,
            }));
            setFilteredTeachers(teachersData);
            setEditEntry((prev) =>
              prev ? { ...prev, courseId: value, teacherId: "" } : null
            );
          }
        } catch (error: any) {
          console.error("Error fetching teachers for course:", error);
          // Fallback to all teachers if specific course teachers fetch fails
          setFilteredTeachers(allTeachers);
        }
      } else if (name === "courseId" && !value) {
        // Reset to all teachers when no course is selected
        setFilteredTeachers(allTeachers);
        setEditEntry((prev) =>
          prev ? { ...prev, courseId: "", teacherId: "" } : null
        );
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (
      !newEntry.courseId ||
      !newEntry.teacherId ||
      !newEntry.dayOfWeek ||
      !newEntry.startTime ||
      !newEntry.endTime ||
      !newEntry.classroom
    ) {
      setError("Please fill in all required fields");
      return;
    }

    // Validate time range
    if (newEntry.startTime >= newEntry.endTime) {
      setError("End time must be after start time");
      return;
    }

    // Note: Batch validation removed as batch functionality is not yet implemented in database
    // Will be added when target_audience and batch_id columns are added to timetable table

    try {
      setError(""); // Clear any previous errors
      // Get section ID from currentSection
      const selectedSection = sections.find(
        (s) => s.section_name === currentSection
      );
      const sectionId = selectedSection
        ? String(selectedSection.section_id)
        : "";

      if (!sectionId) {
        setError("Please select a valid section before adding classes");
        return;
      }

      console.log(
        "Creating timetable entry for section:",
        currentSection,
        "with ID:",
        sectionId
      );
      await createTimetableEntry({ ...newEntry, sectionId });

      // Reset form
      setNewEntry({
        courseId: "",
        teacherId: "",
        dayOfWeek: "",
        startTime: "",
        endTime: "",
        classroom: "",
        sectionId: "",
        classType: "",
        targetAudience: "",
        batchId: "",
      });

      console.log("Class created successfully, reloading timetable...");
      // Reload timetable to show the new entry
      if (selectedSection) {
        try {
          const updatedTimetable = await fetchTimetableBySection(
            selectedSection.section_id
          );
          setTimetable(updatedTimetable || []);
          console.log(
            `Reloaded ${updatedTimetable?.length || 0} classes after creation`
          );
        } catch (reloadError: any) {
          console.error(
            "Error reloading timetable after creation:",
            reloadError
          );
          // Fall back to refresh function
          await refreshTimetable();
        }
      } else {
        await refreshTimetable();
      }
    } catch (err: any) {
      console.error("Error creating timetable entry:", err);
      const errorMessage =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create timetable entry";
      setError(errorMessage);
    }
  };

  const openEdit = async (entry: TimetableEntry) => {
    setEditEntry({ ...entry });
    setEditError("");
    setError(""); // Clear any global errors
    setEditOpen(true);

    // Load teachers for the selected course using cache
    if (entry.courseId) {
      try {
        // Check cache first
        if (courseTeacherCache[entry.courseId]) {
          setFilteredTeachers(courseTeacherCache[entry.courseId]);
        } else {
          // Fetch from API and cache the result
          const courseTeachers = await fetchTeachersByCourse(entry.courseId);
          const teachersData = courseTeachers || [];
          setCourseTeacherCache((prev) => ({
            ...prev,
            [entry.courseId]: teachersData,
          }));
          setFilteredTeachers(teachersData);
        }
      } catch (error: any) {
        console.error("Error fetching teachers for course:", error);
        setFilteredTeachers(allTeachers);
        // Don't show error to user for this background operation
      }
    } else {
      setFilteredTeachers(allTeachers);
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEntry) return;

    // Validate required fields
    if (
      !editEntry.courseId ||
      !editEntry.teacherId ||
      !editEntry.dayOfWeek ||
      !editEntry.startTime ||
      !editEntry.endTime ||
      !editEntry.classroom
    ) {
      setEditError("Please fill in all required fields");
      return;
    }

    // Validate time range
    if (editEntry.startTime >= editEntry.endTime) {
      setEditError("End time must be after start time");
      return;
    }

    // Note: Batch validation removed as batch functionality is not yet implemented in database
    // Will be added when target_audience and batch_id columns are added to timetable table

    try {
      setEditError(""); // Clear any previous errors
      console.log("Updating timetable entry:", editEntry.id);
      await updateTimetableEntryApi(editEntry.id, {
        courseId: editEntry.courseId,
        teacherId: editEntry.teacherId,
        dayOfWeek: editEntry.dayOfWeek,
        startTime: editEntry.startTime,
        endTime: editEntry.endTime,
        classroom: editEntry.classroom,
        classType: editEntry.classType,
        targetAudience: editEntry.targetAudience,
        batchId: editEntry.batchId,
      });

      // Close modal and reset
      setEditOpen(false);
      setEditEntry(null);
      setFilteredTeachers(allTeachers); // Reset filtered teachers

      console.log("Entry updated successfully, reloading timetable...");
      // Reload timetable to show the updated entry
      if (currentSection && sections.length > 0) {
        const selectedSection = sections.find(
          (s) => s.section_name === currentSection
        );
        if (selectedSection) {
          try {
            const updatedTimetable = await fetchTimetableBySection(
              selectedSection.section_id
            );
            setTimetable(updatedTimetable || []);
            console.log(
              `Reloaded ${updatedTimetable?.length || 0} classes after edit`
            );
          } catch (reloadError: any) {
            console.error("Error reloading timetable after edit:", reloadError);
            // Fall back to general reload
            await refreshTimetable();
          }
        } else {
          await refreshTimetable();
        }
      } else {
        await refreshTimetable();
      }
    } catch (e: any) {
      console.error("Error updating timetable entry:", e);
      const msg =
        e?.response?.status === 409
          ? e.response.data?.message || "Time conflict for teacher"
          : e?.response?.data?.error ||
            e?.message ||
            "Failed to update timetable entry";
      setEditError(msg);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    try {
      setError(""); // Clear any previous errors
      console.log("Deleting timetable entry:", id);
      await deleteTimetableEntry(id);

      console.log("Entry deleted successfully, reloading timetable...");
      // Reload timetable to remove the deleted entry
      if (currentSection && sections.length > 0) {
        const selectedSection = sections.find(
          (s) => s.section_name === currentSection
        );
        if (selectedSection) {
          try {
            const updatedTimetable = await fetchTimetableBySection(
              selectedSection.section_id
            );
            setTimetable(updatedTimetable || []);
            console.log(
              `Reloaded ${updatedTimetable?.length || 0} classes after deletion`
            );
          } catch (reloadError: any) {
            console.error(
              "Error reloading timetable after deletion:",
              reloadError
            );
            // Fall back to general reload
            await refreshTimetable();
          }
        } else {
          await refreshTimetable();
        }
      } else {
        await refreshTimetable();
      }

      console.log(`Successfully deleted timetable entry with ID: ${id}`);
    } catch (err: any) {
      console.error("Error deleting timetable entry:", err);
      const errorMessage =
        err?.response?.data?.error || err?.message || "Failed to delete entry";
      setError(errorMessage);
    }
  };

  // Batch operations
  const isCellSelected = (day: string, start: string) =>
    selectedCells.some((c) => c.day === day && c.start === start);

  const toggleSelectCell = (day: string, start: string) => {
    setSelectedCells((prev) => {
      const exists = prev.some((c) => c.day === day && c.start === start);
      if (exists)
        return prev.filter((c) => !(c.day === day && c.start === start));
      return [...prev, { day, start }];
    });
  };

  const clearSelection = () => {
    setSelectedCells([]);

    // Also clear auto-saved data for current section
    if (currentSection && currentDepartment && currentSemester) {
      const sectionKey = `${currentDepartment}-${currentSemester}-${currentSection}`;
      const updatedSlots = { ...autoSavedSlots };
      delete updatedSlots[sectionKey];
      setAutoSavedSlots(updatedSlots);
      localStorage.setItem("autoSavedTimeSlots", JSON.stringify(updatedSlots));
      console.log(
        `🧹 Cleared auto-saved time slots for section: ${sectionKey}`
      );
    }
  };

  const openBatchAdd = () => {
    setBatchError("");
    setBatchResults([]);
    setBatchCourseId("");
    setBatchTeacherId("");
    setBatchOpen(true);
  };

  const submitBatch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!batchCourseId || !batchTeacherId) {
      setBatchError("Please select both course and teacher");
      return;
    }

    if (selectedCells.length === 0) {
      setBatchError("Please select at least one time slot");
      return;
    }

    // Check if section is selected
    if (!currentSection) {
      setBatchError("Please select a section before creating batch entries");
      return;
    }

    try {
      setBatchError(""); // Clear any previous errors

      const selectedSection = sections.find(
        (s) => s.section_name === currentSection
      );

      if (!selectedSection) {
        setBatchError("Invalid section selected");
        return;
      }

      const entries = selectedCells.map((cell) => ({
        courseId: batchCourseId,
        teacherId: batchTeacherId,
        dayOfWeek: cell.day,
        startTime: cell.start,
        endTime: addMinutesToTime(cell.start, slotMinutes),
        classroom: "",
        sectionId: String(selectedSection.section_id),
      }));

      // Create entries one by one (simplified batch operation)
      const results: string[] = [];
      for (const entry of entries) {
        try {
          await createTimetableEntry(entry);
          results.push("Success");
        } catch (err: any) {
          const errorMsg =
            err?.response?.data?.error || err?.message || "Unknown error";
          results.push(`Failed: ${errorMsg}`);
        }
      }

      setBatchResults(results);
      clearSelection();
      setBatchMode(false);
      await refreshTimetable();
    } catch (err: any) {
      console.error("Batch operation error:", err);
      const errorMessage =
        err?.response?.data?.error || err?.message || "Batch operation failed";
      setBatchError(errorMessage);
    }
  };

  const openAddForCell = (day: string, start: string) => {
    setNewEntry({
      courseId: "",
      teacherId: "",
      dayOfWeek: day,
      startTime: start,
      endTime: addMinutesToTime(start, slotMinutes),
      classroom: "",
      classType: "",
      targetAudience: "",
      batchId: "",
    });
    setAddOpen(true);
  };

  // Simple function to open add modal with day and time pre-filled
  const openAddClass = (day: string, start: string) => {
    // Check if department, semester, and section are selected
    if (!currentDepartment || !currentSemester || !currentSection) {
      setError(
        "Please select department, semester, and section before adding classes"
      );
      return;
    }

    setNewEntry({
      courseId: "",
      teacherId: "",
      dayOfWeek: day,
      startTime: start,
      endTime: addMinutesToTime(start, slotMinutes),
      classroom: "",
      classType: "",
      targetAudience: "",
      batchId: "",
    });
    setAddOpen(true);
  };

  const openAddLecture = (day: string, start: string) => {
    // Check if department, semester, and section are selected
    if (!currentDepartment || !currentSemester || !currentSection) {
      setError(
        "Please select department, semester, and section before adding classes"
      );
      return;
    }

    setNewEntry({
      courseId: "",
      teacherId: "",
      dayOfWeek: day,
      startTime: start,
      endTime: addMinutesToTime(start, slotMinutes),
      classroom: "",
      classType: "Lecture",
      targetAudience: "Section", // Lecture is for whole section
      batchId: "",
    });
    setAddOpen(true);
  };

  const openAddTutorial = (day: string, start: string) => {
    // Check if department, semester, and section are selected
    if (!currentDepartment || !currentSemester || !currentSection) {
      setError(
        "Please select department, semester, and section before adding classes"
      );
      return;
    }

    setNewEntry({
      courseId: "",
      teacherId: "",
      dayOfWeek: day,
      startTime: start,
      endTime: addMinutesToTime(start, slotMinutes),
      classroom: "",
      classType: "Tutorial",
      targetAudience: "Batch", // Tutorial is for specific batch
      batchId: "",
    });
    setAddOpen(true);
  };

  const openAddLab = (day: string, start: string) => {
    // Check if department, semester, and section are selected
    if (!currentDepartment || !currentSemester || !currentSection) {
      setError(
        "Please select department, semester, and section before adding classes"
      );
      return;
    }

    setNewEntry({
      courseId: "",
      teacherId: "",
      dayOfWeek: day,
      startTime: start,
      endTime: addMinutesToTime(start, slotMinutes),
      classroom: "",
      classType: "Lab",
      targetAudience: "Batch", // Lab is for specific batch
      batchId: "",
    });
    setAddOpen(true);
  };
  const createFromModal = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (
      !newEntry.courseId ||
      !newEntry.teacherId ||
      !newEntry.dayOfWeek ||
      !newEntry.startTime ||
      !newEntry.endTime ||
      !newEntry.classroom
    ) {
      setError("Please fill in all required fields");
      return;
    }

    // Validate time range
    if (newEntry.startTime >= newEntry.endTime) {
      setError("End time must be after start time");
      return;
    }

    // Note: Batch validation removed as batch functionality is not yet implemented in database
    // Will be added when target_audience and batch_id columns are added to timetable table

    try {
      setError(""); // Clear any previous errors
      // Get section ID from currentSection
      const selectedSection = sections.find(
        (s) => s.section_name === currentSection
      );
      const sectionId = selectedSection
        ? String(selectedSection.section_id)
        : "";

      if (!sectionId) {
        setError("Please select a valid section before adding classes");
        return;
      }

      console.log(
        "Creating timetable entry from modal for section:",
        currentSection,
        "with ID:",
        sectionId
      );
      await createTimetableEntry({ ...newEntry, sectionId });

      // Close modal and reset form
      setAddOpen(false);
      setNewEntry({
        courseId: "",
        teacherId: "",
        dayOfWeek: "",
        startTime: "",
        endTime: "",
        classroom: "",
        classType: "",
        targetAudience: "",
        batchId: "",
      });

      console.log(
        "Class created successfully from modal, reloading timetable..."
      );
      // Reload timetable to show the new entry
      if (selectedSection) {
        try {
          const updatedTimetable = await fetchTimetableBySection(
            selectedSection.section_id
          );
          setTimetable(updatedTimetable || []);
          console.log(
            `Reloaded ${
              updatedTimetable?.length || 0
            } classes after modal creation`
          );
        } catch (reloadError: any) {
          console.error(
            "Error reloading timetable after modal creation:",
            reloadError
          );
          // Fall back to general reload
          await refreshTimetable();
        }
      } else {
        await refreshTimetable();
      }
    } catch (err: any) {
      console.error("Error creating timetable entry from modal:", err);
      console.log("🔴 ERROR DETAILS:");
      console.log("  Status:", err?.response?.status);
      console.log("  Response data:", err?.response?.data);
      console.log("  Full response:", err?.response);

      // Get the detailed error message from server response
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create entry";
      const conflictDetails = err?.response?.data?.conflictDetails;

      console.log("  Parsed error message:", errorMessage);
      console.log("  Conflict details:", conflictDetails);

      setError(errorMessage);

      // Find the selected teacher name for better error message
      const selectedTeacher = teachers.find(
        (t: any) => t.teacher_id === parseInt(newEntry.teacherId)
      );
      const teacherName = selectedTeacher?.name || "Selected teacher";

      // Enhanced conflict message with section and time details
      let conflictMsg = `❌ Unable to add class:\n\n${errorMessage}\n\nTeacher: ${teacherName}\nDay: ${newEntry.dayOfWeek}\nTime: ${newEntry.startTime} - ${newEntry.endTime}`;

      if (conflictDetails) {
        conflictMsg += `\n\n⚠️ CONFLICT DETAILS:`;
        conflictMsg += `\nConflicting Section: ${conflictDetails.section}`;
        conflictMsg += `\nConflicting Time: ${conflictDetails.time}`;
        conflictMsg += `\n\n🔍 Look for this class in the timetable grid!`;
        conflictMsg += `\nClear all filters to see all classes.`;
      }

      conflictMsg += `\n\n💡 Solutions:\n• Choose a different time slot\n• Select a different teacher\n• Remove the conflicting class first`;

      // Show alert with the conflict details
      alert(conflictMsg);

      // Auto-clear filters to help user see the conflicting class
      if (conflictDetails && (filterDept || filterCourse)) {
        const clearFilters = window.confirm(
          "🔍 Want to clear filters to see the conflicting class?\n\nThis will show all classes in the timetable."
        );
        if (clearFilters) {
          setFilterDept("");
          setFilterCourse("");
        }
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <h2 className="text-xl font-semibold text-gray-800">
            Loading Timetable
          </h2>
          <p className="text-gray-600">
            Please wait while we fetch your schedule...
          </p>
          <p className="text-gray-500 text-sm">
            If this takes too long, click "Load from DB" again or check server
            status.
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !timetable.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Error Loading Timetable
            </h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main component with enhanced styling
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <style>{`
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        .scrollbar-thumb-blue-200::-webkit-scrollbar-thumb {
          background-color: #bfdbfe;
          border-radius: 9999px;
        }
        .scrollbar-track-gray-100::-webkit-scrollbar-track {
          background-color: #f3f4f6;
        }
        .scrollbar-thin::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .scroll-smooth {
          scroll-behavior: smooth;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
        .border-3 {
          border-width: 3px;
        }
        .ring-3 {
          --tw-ring-width: 3px;
        }
        /* Sticky column shadow effect */
        .sticky-col-shadow {
          box-shadow: 4px 0 6px -1px rgba(0, 0, 0, 0.1);
        }
        /* Prevent sticky header flicker */
        thead th.sticky {
          position: sticky;
          top: 0;
        }
        tbody td.sticky {
          position: sticky;
          left: 0;
        }
        @media (max-width: 768px) {
          .table-auto {
            table-layout: auto;
          }
        }
      `}</style>
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              📅 Timetable Management
            </h1>
            <p className="text-gray-600 text-lg">
              Create and manage class schedules with ease
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border">
              <span className="text-sm text-gray-500">Total Classes</span>
              <div className="text-2xl font-bold text-blue-600">
                {timetable.length}
              </div>
            </div>

            {/* Action Buttons - Standardized Sizing */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => (window.location.href = "/timetable/generate")}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 min-w-[160px] justify-center"
              >
                <span className="text-xl">🤖</span>
                AI Generator
              </button>
              <button
                onClick={() => {
                  if (!currentDepartment || !currentSemester || !currentSection) {
                    setError(
                      "Please select department, semester, and section before adding classes"
                    );
                    return;
                  }
                  setAddOpen(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 min-w-[160px] justify-center"
              >
                <span className="text-xl">+</span>
                Add Class
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Department & Section Context */}
      <div className="mb-6 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">🏫</span>
            Timetable Context
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Department Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              {departments.length === 0 ? (
                <div className="w-full px-4 py-3 border border-amber-300 rounded-lg bg-amber-50 text-amber-800">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <span>
                      No departments found. Please create departments first.
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-amber-600">
                      Go to Department Management to create departments.
                    </span>
                  </div>
                </div>
              ) : (
                <select
                  value={currentDepartment}
                  onChange={(e) => setCurrentDepartment(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.department_id} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Semester Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester
              </label>
              {!currentDepartment ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  Please select a department first
                </div>
              ) : (
                <select
                  value={currentSemester}
                  onChange={(e) => setCurrentSemester(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Section Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section
              </label>
              {!currentDepartment || !currentSemester ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  Please select department and semester first
                </div>
              ) : sections.length === 0 ? (
                <div className="w-full px-4 py-3 border border-amber-300 rounded-lg bg-amber-50 text-amber-800">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <span>
                      No sections found for this department and semester.
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-amber-600">
                      Go to Department Management to create sections for{" "}
                      {currentDepartment} Semester {currentSemester}.
                    </span>
                  </div>
                </div>
              ) : (
                <select
                  value={currentSection}
                  onChange={(e) => setCurrentSection(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                >
                  <option value="">Select Section</option>
                  {sections.map((section) => (
                    <option
                      key={section.section_id}
                      value={section.section_name}
                    >
                      {section.section_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Quick Setup Guide */}
          {departments.length === 0 && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <h3 className="font-semibold text-blue-800 mb-2">
                    First Time Setup Required
                  </h3>
                  <p className="text-blue-700 mb-3">
                    To create timetables, you'll need to set up departments and
                    sections first.
                  </p>
                  <div className="space-y-2 text-sm text-blue-600">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-800">
                        1
                      </span>
                      <span>
                        Go to <strong>Department Management</strong> to create
                        departments
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-800">
                        2
                      </span>
                      <span>Create sections within each department</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-800">
                        3
                      </span>
                      <span>
                        Return here to create timetables for specific sections
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Current Context Display */}
          {currentDepartment && currentSemester && currentSection && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-blue-800">
                <span className="text-lg">📚</span>
                <span className="font-medium">
                  Managing timetable for: {currentDepartment} - Semester{" "}
                  {currentSemester} - {currentSection}
                </span>
                {lastAutoSave && (
                  <span className="ml-auto text-sm text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Auto-saved at {lastAutoSave.toLocaleTimeString()}
                  </span>
                )}
              </div>
              {selectedCells.length > 0 && (
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm text-blue-600 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1">
                      📝 {selectedCells.length} time slot
                      {selectedCells.length !== 1 ? "s" : ""} selected
                    </span>
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Auto-saving
                    </span>
                  </div>
                  {currentSection && (
                    <div className="text-xs text-gray-500">
                      Section: {currentSection}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-red-600">{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="ml-auto text-red-400 hover:text-red-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Controls Panel */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            View Controls
          </h2>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-center gap-6">
            {/* View Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                View Mode:
              </span>
              <div className="bg-gray-100 rounded-xl p-1 flex">
                <button
                  onClick={() => setGridView(true)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    gridView
                      ? "bg-white text-blue-600 shadow-md"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  📅 Grid
                </button>
                <button
                  onClick={() => setGridView(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    !gridView
                      ? "bg-white text-blue-600 shadow-md"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  📋 List
                </button>
              </div>
            </div>

            {/* Time Range Controls */}
            {gridView && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Time Range:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={gridStart}
                      onChange={(e) => setGridStart(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="time"
                      value={gridEnd}
                      onChange={(e) => setGridEnd(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Slot Duration:
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={slotMinutes}
                      onChange={(e) =>
                        setSlotMinutes(parseInt(e.target.value, 10) || 60)
                      }
                      min="1"
                      max="480"
                      placeholder="60"
                      className="w-20 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                    />
                    <span className="text-sm text-gray-600">minutes</span>
                  </div>
                </div>
              </div>
            )}

            {/* Batch Mode Controls */}
            {gridView && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setBatchMode(!batchMode)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    batchMode
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {batchMode ? "📝 Selecting..." : "📝 Batch Mode"}
                </button>

                {batchMode && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={clearSelection}
                      disabled={!selectedCells.length}
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-all duration-200"
                    >
                      Clear ({selectedCells.length})
                    </button>
                    <button
                      onClick={openBatchAdd}
                      disabled={!selectedCells.length}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200"
                    >
                      Batch Add ({selectedCells.length})
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Break Period Controls */}
            {gridView && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="enableBreak"
                    checked={breakEnabled}
                    onChange={(e) => setBreakEnabled(e.target.checked)}
                    className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label
                    htmlFor="enableBreak"
                    className="text-sm font-medium text-orange-800"
                  >
                    ☕ Enable Break Period
                  </label>
                </div>

                {breakEnabled && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-orange-700">Start:</span>
                      <input
                        type="time"
                        value={breakStart}
                        onChange={(e) => {
                          const newBreakStart = e.target.value;
                          setBreakStart(newBreakStart);
                          // Auto-adjust break end if it's now before or equal to start
                          if (breakEnd <= newBreakStart) {
                            // Add 30 minutes to the new start time
                            const [hours, minutes] = newBreakStart
                              .split(":")
                              .map(Number);
                            const newMinutes = minutes + 30;
                            const newHours =
                              hours + Math.floor(newMinutes / 60);
                            const adjustedEnd = `${String(newHours).padStart(
                              2,
                              "0"
                            )}:${String(newMinutes % 60).padStart(2, "0")}`;
                            setBreakEnd(adjustedEnd);
                          }
                        }}
                        min={gridStart}
                        max={gridEnd}
                        className="px-2 py-1 border border-orange-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-orange-700">End:</span>
                      <input
                        type="time"
                        value={breakEnd}
                        onChange={(e) => {
                          const newBreakEnd = e.target.value;
                          setBreakEnd(newBreakEnd);
                          // Auto-adjust break start if end is now before or equal to start
                          if (newBreakEnd <= breakStart) {
                            // Subtract 30 minutes from the new end time
                            const [hours, minutes] = newBreakEnd
                              .split(":")
                              .map(Number);
                            const totalMinutes = hours * 60 + minutes - 30;
                            const newHours = Math.floor(totalMinutes / 60);
                            const newMinutes = totalMinutes % 60;
                            const adjustedStart = `${String(newHours).padStart(
                              2,
                              "0"
                            )}:${String(newMinutes).padStart(2, "0")}`;
                            setBreakStart(adjustedStart);
                          }
                        }}
                        min={gridStart}
                        max={gridEnd}
                        className="px-2 py-1 border border-orange-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                      Break: {breakStart} - {breakEnd}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-gray-700">
                Filters:
              </span>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Department:</span>
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
                >
                  <option value="">All Departments</option>
                  {departments.map((d: any) => (
                    <option key={d.department_id} value={d.department_id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Course:</span>
                <select
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
                >
                  <option value="">All Courses</option>
                  {courses
                    .filter(
                      (c: any) =>
                        !filterDept ||
                        String(c.department_id) === String(filterDept)
                    )
                    .map((c: any) => (
                      <option key={c.course_id} value={c.course_id}>
                        {c.course_code} — {c.course_name}
                      </option>
                    ))}
                </select>
              </div>

              {(filterDept || filterCourse) && (
                <>
                  <button
                    onClick={() => {
                      setFilterDept("");
                      setFilterCourse("");
                    }}
                    className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                  >
                    Clear Filters
                  </button>

                  {/* Filter Warning Badge */}
                  <div className="ml-auto flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-lg">
                    <svg
                      className="w-5 h-5 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div className="text-sm">
                      <span className="font-medium text-yellow-800">
                        Filters Active:{" "}
                      </span>
                      <span className="text-yellow-700">
                        Showing {filteredTimetable.length} of {timetable.length}{" "}
                        classes
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Grid View with Responsive Design */}
      {gridView && (
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden backdrop-blur-sm">
          {/* Mobile-friendly scroll hint */}
          <div className="md:hidden bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 text-center">
            <p className="text-xs text-gray-600 font-medium">
              👉 Scroll horizontally to view all time slots
            </p>
          </div>

          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-gray-100 scroll-smooth">
            <table
              className="min-w-full table-auto"
              style={{ minWidth: "max(100%, 1200px)" }}
            >
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50">
                  <th className="w-32 sm:w-36 md:w-40 p-4 text-left font-bold text-gray-800 border-b-2 border-blue-200 sticky left-0 bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 z-20 shadow-lg">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xs md:text-sm">
                          📅
                        </span>
                      </div>
                      <span className="text-sm md:text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Day
                      </span>
                    </div>
                  </th>
                  {/* Enhanced First Half Header */}
                  {gridSlots.firstHalf.length > 0 && (
                    <>
                      <th
                        colSpan={gridSlots.firstHalf.length}
                        className="p-3 text-center font-bold text-blue-900 border-b-2 border-blue-300 bg-gradient-to-r from-blue-100 to-blue-200"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              📚
                            </span>
                          </div>
                          <span className="text-lg font-bold">
                            Morning Sessions
                          </span>
                        </div>
                      </th>
                    </>
                  )}
                  {/* Enhanced Break Header */}
                  {breakEnabled && (
                    <th className="p-3 text-center font-bold text-orange-900 border-b-2 border-orange-300 bg-gradient-to-r from-orange-100 to-amber-200">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            ☕
                          </span>
                        </div>
                        <span className="text-lg font-bold">Break Time</span>
                      </div>
                    </th>
                  )}
                  {/* Enhanced Second Half Header */}
                  {gridSlots.secondHalf.length > 0 && (
                    <th
                      colSpan={gridSlots.secondHalf.length}
                      className="p-3 text-center font-bold text-green-900 border-b-2 border-green-300 bg-gradient-to-r from-green-100 to-emerald-200"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            📖
                          </span>
                        </div>
                        <span className="text-lg font-bold">
                          Afternoon Sessions
                        </span>
                      </div>
                    </th>
                  )}
                </tr>
                {/* Enhanced Time slot headers row */}
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="w-32 sm:w-36 md:w-40 p-4 text-left font-bold text-gray-800 border-b-2 border-gray-300 sticky left-0 bg-gradient-to-r from-gray-50 to-gray-100 z-20 shadow-lg">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xs md:text-sm">
                          ⏰
                        </span>
                      </div>
                      <span className="text-sm md:text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Time
                      </span>
                    </div>
                  </th>
                  {/* Enhanced First Half Time Headers */}
                  {gridSlots.firstHalf.map((slot) => (
                    <th
                      key={`first-${slot}`}
                      className="p-2 md:p-3 text-center font-medium text-blue-800 border-b-2 border-gray-300 min-w-[120px] md:min-w-[140px]"
                    >
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs">🕐</span>
                          <span>{slot}</span>
                        </div>
                      </div>
                    </th>
                  ))}
                  {/* Enhanced Dynamic Break Time Headers */}
                  {gridSlots.break.map((slot) => (
                    <th
                      key={`break-${slot}`}
                      className="p-3 text-center font-medium text-orange-800 border-b-2 border-gray-300 min-w-[140px]"
                    >
                      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs">☕</span>
                          <span>{slot}</span>
                        </div>
                      </div>
                    </th>
                  ))}
                  {/* Enhanced Fallback Break Header */}
                  {breakEnabled && gridSlots.break.length === 0 && (
                    <th className="p-3 text-center font-medium text-orange-800 border-b-2 border-gray-300 min-w-[140px]">
                      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-2 rounded-xl text-sm font-bold shadow-md">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs">☕</span>
                          <span>
                            {breakStart} - {breakEnd}
                          </span>
                        </div>
                      </div>
                    </th>
                  )}
                  {/* Enhanced Second Half Time Headers */}
                  {gridSlots.secondHalf.map((slot) => (
                    <th
                      key={`second-${slot}`}
                      className="p-3 text-center font-medium text-green-800 border-b-2 border-gray-300 min-w-[140px]"
                    >
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs">🕐</span>
                          <span>{slot}</span>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gridSlots.firstHalf.length === 0 &&
                gridSlots.secondHalf.length === 0 ? (
                  <tr>
                    <td
                      className="p-8 text-center text-red-600 bg-red-50 border border-red-200 rounded-lg"
                      colSpan={
                        [
                          ...gridSlots.firstHalf,
                          ...gridSlots.break,
                          ...gridSlots.secondHalf,
                        ].length + 1
                      }
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-2xl">⚠️</span>
                        <span className="font-medium">
                          Invalid time range or slot size
                        </span>
                        <span className="text-sm text-red-500">
                          Please adjust the time range and slot duration
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {/* Render each day as a row with enhanced styling */}
                    {dayColumns.map((day, dayIndex) => (
                      <tr
                        key={day}
                        className={`group hover:bg-gradient-to-r hover:from-blue-25 hover:to-purple-25 transition-all duration-300 ${
                          dayIndex % 2 === 0 ? "bg-gray-25" : "bg-white"
                        } border-b border-gray-100`}
                      >
                        {/* Enhanced Day name column */}
                        <td className="w-32 sm:w-36 md:w-40 p-3 md:p-4 font-medium whitespace-nowrap border-b border-gray-100 sticky left-0 z-10 shadow-[4px_0_6px_-1px_rgba(0,0,0,0.1)]" style={{ backgroundColor: dayIndex % 2 === 0 ? '#FAFAFA' : '#FFFFFF' }}>
                          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 md:px-4 py-2 md:py-3 rounded-xl text-xs md:text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform group-hover:scale-105">
                            <div className="flex items-center gap-2 md:gap-3">
                              <div className="w-6 h-6 md:w-8 md:h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                <span className="text-sm md:text-lg font-bold">
                                  📅
                                </span>
                              </div>
                              <span className="text-xs md:text-base font-bold">
                                {day}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Enhanced First Half Time Slots */}
                        {gridSlots.firstHalf.map((slot) => {
                          const slotStartTime = slot.split(" - ")[0];
                          const cellEntries =
                            byDayAndSlot[day]?.[slotStartTime] || [];
                          const main = cellEntries[0];
                          const isSelected =
                            batchMode &&
                            cellEntries.length === 0 &&
                            isCellSelected(day, slotStartTime);
                          const classStyle = getClassTypeStyle(main?.classType);

                          return (
                            <td
                              key={`${day}-first-${slot}`}
                              className={`p-2 md:p-3 border-b border-gray-100 align-top transition-all duration-300 ${
                                isSelected
                                  ? "ring-3 ring-blue-400 ring-opacity-50 bg-blue-50 shadow-lg"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              {cellEntries.length > 0 ? (
                                <div
                                  className={`group cursor-pointer bg-gradient-to-br ${classStyle.bg} hover:${classStyle.bgHover} p-2 md:p-3 rounded-xl border-2 ${classStyle.border} transition-all duration-300 hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1`}
                                  onClick={() => openEdit(main)}
                                >
                                  {/* Class type badge */}
                                  {main.classType && (
                                    <div
                                      className={`inline-flex items-center gap-1 ${classStyle.badge} px-2 py-1 rounded-lg text-xs font-bold mb-2`}
                                    >
                                      <span>{classStyle.icon}</span>
                                      <span>{main.classType}</span>
                                    </div>
                                  )}

                                  {/* Course code */}
                                  <div
                                    className={`font-bold ${classStyle.text} text-sm mb-1 tracking-wide`}
                                  >
                                    {courses.find(
                                      (c) =>
                                        String(c.course_id) ===
                                        String(main.courseId)
                                    )?.course_code || main.courseId}
                                  </div>

                                  {/* Course name */}
                                  <div
                                    className={`${classStyle.text} text-xs mb-2 font-medium opacity-90 line-clamp-2`}
                                  >
                                    {
                                      courses.find(
                                        (c) =>
                                          String(c.course_id) ===
                                          String(main.courseId)
                                      )?.course_name
                                    }
                                  </div>

                                  {/* Teacher name */}
                                  <div
                                    className={`${classStyle.text} text-xs mb-1 opacity-80 flex items-center gap-1`}
                                  >
                                    <span>👨‍🏫</span>
                                    {
                                      teachers.find(
                                        (t) =>
                                          String(t.teacher_id) ===
                                          String(main.teacherId)
                                      )?.name
                                    }
                                  </div>

                                  {/* Classroom */}
                                  {main.classroom && (
                                    <div
                                      className={`${classStyle.text} text-xs opacity-70 flex items-center gap-1`}
                                    >
                                      <span>📍</span>
                                      <span>{main.classroom}</span>
                                    </div>
                                  )}

                                  {/* Hover overlay */}
                                  <div className="absolute inset-0 bg-white bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-xl"></div>
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    batchMode
                                      ? toggleSelectCell(day, slotStartTime)
                                      : openAddClass(day, slotStartTime)
                                  }
                                  className={`w-full h-16 md:h-20 border-3 border-dashed transition-all duration-300 rounded-xl flex flex-col items-center justify-center cursor-pointer group ${
                                    isSelected
                                      ? "border-blue-500 bg-blue-100 shadow-lg scale-105"
                                      : "border-blue-200 hover:border-blue-400 hover:bg-blue-50 hover:scale-102"
                                  }`}
                                >
                                  <div
                                    className={`transition-all duration-300 ${
                                      isSelected
                                        ? "text-blue-600"
                                        : "text-blue-300 group-hover:text-blue-500"
                                    }`}
                                  >
                                    <div className="text-2xl mb-1">
                                      {batchMode
                                        ? isSelected
                                          ? "✓"
                                          : "+"
                                        : "+"}
                                    </div>
                                    <div className="text-xs font-medium">
                                      {batchMode
                                        ? isSelected
                                          ? "Selected"
                                          : "Select"
                                        : "Add Class"}
                                    </div>
                                  </div>
                                </button>
                              )}
                            </td>
                          );
                        })}

                        {/* Dynamic Break Period Slots */}
                        {gridSlots.break.map((slot) => {
                          const cellEntries =
                            byDayAndSlot[day]?.[slot.split(" - ")[0]] || [];
                          const main = cellEntries[0];
                          const isSelected =
                            batchMode &&
                            cellEntries.length === 0 &&
                            isCellSelected(day, slot.split(" - ")[0]);

                          return (
                            <td
                              key={`${day}-break-${slot}`}
                              className={`p-2 border-b border-gray-100 align-top transition-all duration-200 ${
                                isSelected
                                  ? "ring-2 ring-orange-400 bg-orange-50"
                                  : ""
                              }`}
                            >
                              {cellEntries.length > 0 ? (
                                <div
                                  className="cursor-pointer bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 p-2 rounded-lg border border-orange-200 transition-all duration-200 hover:shadow-md transform hover:scale-105"
                                  onClick={() => openEdit(main)}
                                >
                                  <div className="font-bold text-orange-900 text-xs mb-1">
                                    {courses.find(
                                      (c) =>
                                        String(c.course_id) ===
                                        String(main.courseId)
                                    )?.course_code || main.courseId}
                                  </div>
                                  <div className="text-xs text-orange-800 mb-1 font-medium">
                                    {
                                      courses.find(
                                        (c) =>
                                          String(c.course_id) ===
                                          String(main.courseId)
                                      )?.course_name
                                    }
                                  </div>
                                  <div className="text-xs text-orange-700">
                                    {teachers.find(
                                      (t) =>
                                        String(t.teacher_id) ===
                                        String(main.teacherId)
                                    )?.name || main.teacherId}
                                  </div>
                                  <div className="text-xs text-orange-600 mt-1">
                                    {main.classroom || "TBA"}
                                  </div>
                                  {main.classType && (
                                    <div className="text-xs text-orange-600 mt-1 bg-orange-200 px-1 rounded">
                                      {main.classType}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    openAddForCell(day, slot.split(" - ")[0])
                                  }
                                  className={`w-full h-16 border-2 border-dashed border-orange-200 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 hover:border-orange-400 hover:bg-orange-50 ${
                                    isSelected
                                      ? "border-orange-400 bg-orange-50"
                                      : ""
                                  }`}
                                >
                                  <span className="text-2xl text-orange-300 hover:text-orange-500">
                                    ☕
                                  </span>
                                  <span className="ml-2 text-sm text-orange-400 hover:text-orange-600">
                                    Break Slot
                                  </span>
                                </button>
                              )}
                            </td>
                          );
                        })}

                        {/* Fallback Break Period for non-dynamic display */}
                        {breakEnabled && gridSlots.break.length === 0 && (
                          <td className="p-2 border-b border-gray-100 align-middle">
                            <div className="w-full h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center text-orange-700 font-semibold shadow-sm">
                              ☕ Break
                            </div>
                          </td>
                        )}

                        {/* Second Half Time Slots */}
                        {gridSlots.secondHalf.map((slot) => {
                          const cellEntries =
                            byDayAndSlot[day]?.[slot.split(" - ")[0]] || [];
                          const main = cellEntries[0];
                          const isSelected =
                            batchMode &&
                            cellEntries.length === 0 &&
                            isCellSelected(day, slot.split(" - ")[0]);

                          return (
                            <td
                              key={`${day}-second-${slot}`}
                              className={`p-2 border-b border-gray-100 align-top transition-all duration-200 ${
                                isSelected
                                  ? "ring-2 ring-green-400 bg-green-50"
                                  : ""
                              }`}
                            >
                              {cellEntries.length > 0 ? (
                                <div
                                  className="cursor-pointer bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 p-2 rounded-lg border border-green-200 transition-all duration-200 hover:shadow-md transform hover:scale-105"
                                  onClick={() => openEdit(main)}
                                >
                                  <div className="font-bold text-green-900 text-xs mb-1">
                                    {courses.find(
                                      (c) =>
                                        String(c.course_id) ===
                                        String(main.courseId)
                                    )?.course_code || main.courseId}
                                  </div>
                                  <div className="text-xs text-green-800 mb-1 font-medium">
                                    {
                                      courses.find(
                                        (c) =>
                                          String(c.course_id) ===
                                          String(main.courseId)
                                      )?.course_name
                                    }
                                  </div>
                                  <div className="text-xs text-green-700">
                                    {
                                      teachers.find(
                                        (t) =>
                                          String(t.teacher_id) ===
                                          String(main.teacherId)
                                      )?.name
                                    }
                                  </div>
                                  {main.classroom && (
                                    <div className="text-xs text-green-600 mt-1">
                                      📍 {main.classroom}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    openAddClass(day, slot.split(" - ")[0])
                                  }
                                  className={`w-full h-16 border-2 border-dashed border-green-200 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 hover:border-green-400 hover:bg-green-50 ${
                                    isSelected
                                      ? "border-green-400 bg-green-50"
                                      : ""
                                  }`}
                                >
                                  <span className="text-2xl text-green-300 hover:text-green-500">
                                    +
                                  </span>
                                  <span className="ml-2 text-sm text-green-400 hover:text-green-600">
                                    Add Class
                                  </span>
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* List View */}
      {!gridView && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">📋</span>
              Schedule List
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left p-4 font-semibold text-gray-700">
                    ID
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    Course
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    Teacher
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    Day
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    Time
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    Room
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTimetable.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-4xl">📅</span>
                        <span className="text-lg font-medium">
                          No classes scheduled
                        </span>
                        <span className="text-sm">
                          Add a new class to get started
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTimetable.map((entry: any, index: number) => (
                    <tr
                      key={entry.id}
                      className={`hover:bg-blue-50 transition-colors duration-200 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-25"
                      }`}
                    >
                      <td className="p-4 border-b border-gray-100">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          #{entry.id}
                        </span>
                      </td>
                      <td className="p-4 border-b border-gray-100">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">
                            {courses.find(
                              (c) =>
                                String(c.course_id) === String(entry.courseId)
                            )?.course_code || entry.courseId}
                          </span>
                          <span className="text-sm text-gray-600">
                            {
                              courses.find(
                                (c) =>
                                  String(c.course_id) === String(entry.courseId)
                              )?.course_name
                            }
                          </span>
                        </div>
                      </td>
                      <td className="p-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">👨‍🏫</span>
                          <span className="text-gray-900">
                            {teachers.find(
                              (t) => String(t.id) === String(entry.teacherId)
                            )?.name || entry.teacherId}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 border-b border-gray-100">
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                          {entry.dayOfWeek}
                        </span>
                      </td>
                      <td className="p-4 border-b border-gray-100">
                        <div className="flex items-center gap-1 text-gray-900">
                          <span className="text-sm">🕐</span>
                          <span className="font-medium">
                            {entry.startTime} - {entry.endTime}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 border-b border-gray-100">
                        {entry.classroom ? (
                          <div className="flex items-center gap-1 text-gray-900">
                            <span>📍</span>
                            <span>{entry.classroom}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">
                            No room assigned
                          </span>
                        )}
                      </td>
                      <td className="p-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <button
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                            onClick={() => openEdit(entry)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                            onClick={() => handleDelete(entry.id)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enhanced Edit Modal */}
      {editOpen && editEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="text-3xl">✏️</span>
                  Edit Class Schedule
                </h2>
                <button
                  onClick={() => setEditOpen(false)}
                  className="text-white hover:text-gray-200 text-2xl transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {editError && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-red-600 text-2xl">⚠️</span>
                    <div>
                      <h3 className="font-semibold text-red-800">Error</h3>
                      <p className="text-red-600">{editError}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={submitEdit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📚 Course
                    </label>
                    <select
                      name="courseId"
                      value={editEntry.courseId}
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {courses.map((c: any) => (
                        <option key={c.course_id} value={c.course_id}>
                          {c.course_code} — {c.course_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      👨‍🏫 Teacher
                    </label>
                    <select
                      name="teacherId"
                      value={editEntry.teacherId}
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={!editEntry.courseId}
                    >
                      <option value="">
                        {!editEntry.courseId
                          ? "Select a course first"
                          : filteredTeachers.length === 0
                          ? "No teachers assigned to this course"
                          : "Select teacher"}
                      </option>
                      {filteredTeachers.map((t: any) => (
                        <option
                          key={t.teacher_id || t.id}
                          value={t.teacher_id || t.id}
                        >
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📅 Day of Week
                    </label>
                    <select
                      name="dayOfWeek"
                      value={editEntry.dayOfWeek}
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {dayOptions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🕐 Start Time
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      value={editEntry.startTime}
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🕐 End Time
                    </label>
                    <input
                      type="time"
                      name="endTime"
                      value={editEntry.endTime}
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📍 Classroom (Optional)
                    </label>
                    <input
                      type="text"
                      name="classroom"
                      value={editEntry.classroom}
                      onChange={handleEditChange}
                      placeholder="e.g., Room 101, Lab A, Hall 3"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setEditOpen(false)}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {addOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="text-3xl">+</span>
                  Add New Class
                </h2>
                <button
                  onClick={() => setAddOpen(false)}
                  className="text-white hover:text-gray-200 text-2xl transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={createFromModal} className="space-y-6">
                {/* Class Type Information */}
                {newEntry.classType && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {newEntry.classType === "Lecture"
                            ? "📚"
                            : newEntry.classType === "Tutorial"
                            ? "👥"
                            : "🔬"}
                        </span>
                        <div>
                          <div className="font-bold text-blue-800">
                            {newEntry.classType}
                          </div>
                          <div className="text-sm text-blue-600">
                            {newEntry.targetAudience === "Section"
                              ? "For entire section"
                              : "For specific batch"}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1"></div>
                      <div className="text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                        {newEntry.dayOfWeek} • {newEntry.startTime} -{" "}
                        {newEntry.endTime}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📚 Course
                    </label>
                    <select
                      name="courseId"
                      value={newEntry.courseId}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select course</option>
                      {courses
                        .filter(
                          (c: any) => c.semester === parseInt(currentSemester)
                        )
                        .map((c: any) => (
                          <option key={c.course_id} value={c.course_id}>
                            {c.course_code} — {c.course_name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      👨‍🏫 Teacher
                    </label>
                    <select
                      name="teacherId"
                      value={newEntry.teacherId}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                      disabled={!newEntry.courseId}
                    >
                      <option value="">
                        {!newEntry.courseId
                          ? "Select a course first"
                          : filteredTeachers.length === 0
                          ? "No teachers assigned to this course"
                          : "Select teacher"}
                      </option>
                      {filteredTeachers.map((t: any) => (
                        <option
                          key={t.teacher_id || t.id}
                          value={t.teacher_id || t.id}
                        >
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Class Type Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🎯 Class Type
                    </label>
                    <select
                      name="classType"
                      value={newEntry.classType}
                      onChange={(e) => {
                        const selectedType = e.target.value;
                        setNewEntry({
                          ...newEntry,
                          classType: selectedType,
                          targetAudience:
                            selectedType === "Lecture" ? "Section" : "Batch",
                          batchId:
                            selectedType === "Lecture" ? "" : newEntry.batchId,
                        });
                      }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select class type</option>
                      <option value="Lecture">
                        📚 Lecture (Entire Section)
                      </option>
                      <option value="Tutorial">
                        👥 Tutorial (Specific Batch)
                      </option>
                      <option value="Lab">🔬 Lab (Specific Batch)</option>
                    </select>
                  </div>

                  {/* Batch Selection - Only show for Lab and Tutorial */}
                  {(newEntry.classType === "Lab" ||
                    newEntry.classType === "Tutorial") && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        👥 Select Batch
                      </label>
                      <select
                        name="batchId"
                        value={newEntry.batchId}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      >
                        <option value="">
                          {batches.length === 0
                            ? "No batches available for this section"
                            : "Select batch"}
                        </option>
                        {batches.map((batch) => (
                          <option key={batch.batch_id} value={batch.batch_id}>
                            {batch.batch_name}
                          </option>
                        ))}
                      </select>
                      {batches.length === 0 && (
                        <p className="mt-2 text-sm text-amber-600">
                          💡 Create batches in Department → Sections section
                          first
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📅 Day of Week
                    </label>
                    <select
                      name="dayOfWeek"
                      value={newEntry.dayOfWeek}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select day</option>
                      {dayOptions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🕐 Start Time
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      value={newEntry.startTime}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🕐 End Time
                    </label>
                    <input
                      type="time"
                      name="endTime"
                      value={newEntry.endTime}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📍 Classroom (Optional)
                    </label>
                    <input
                      type="text"
                      name="classroom"
                      value={newEntry.classroom}
                      onChange={handleChange}
                      placeholder="e.g., Room 101, Lab A, Hall 3"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setAddOpen(false)}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    Add Class
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Batch Modal */}
      {batchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="text-3xl">📝</span>
                  Batch Add Classes
                </h2>
                <button
                  onClick={() => setBatchOpen(false)}
                  className="text-white hover:text-gray-200 text-2xl transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {batchError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-red-600 text-xl">⚠️</span>
                    <div>
                      <h3 className="font-semibold text-red-800">Error</h3>
                      <p className="text-red-600">{batchError}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={submitBatch} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📚 Course
                  </label>
                  <select
                    value={batchCourseId}
                    onChange={(e) => setBatchCourseId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select course</option>
                    {courses
                      .filter(
                        (c: any) => c.semester === parseInt(currentSemester)
                      )
                      .map((c: any) => (
                        <option key={c.course_id} value={c.course_id}>
                          {c.course_code} — {c.course_name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    👨‍🏫 Teacher
                  </label>
                  <select
                    value={batchTeacherId}
                    onChange={(e) => setBatchTeacherId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select teacher</option>
                    {teachers.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-purple-800">
                      Selected Time Slots
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                        {selectedCells.length} slot
                        {selectedCells.length !== 1 ? "s" : ""}
                      </span>
                      {selectedCells.length > 0 && lastAutoSave && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          Auto-saved
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedCells.length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedCells.map((cell, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-lg p-2 border border-purple-100 flex items-center justify-between"
                        >
                          <div className="text-sm font-medium text-purple-700">
                            📅 {cell.day} at {cell.start}
                          </div>
                          <button
                            onClick={() =>
                              toggleSelectCell(cell.day, cell.start)
                            }
                            className="text-purple-400 hover:text-purple-600 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-purple-500 text-sm">
                      👆 Click on time slots in the grid above to select them
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setBatchOpen(false)}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!batchCourseId || !batchTeacherId}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
                  >
                    Add {selectedCells.length} Classes
                  </button>
                </div>
              </form>

              {batchResults.length > 0 && (
                <div className="mt-6 bg-green-50 rounded-xl p-4">
                  <h3 className="font-semibold text-green-800 mb-2">
                    Batch Results:
                  </h3>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {batchResults.map((result, index) => (
                      <div key={index} className="text-sm text-green-700">
                        ✅ {result}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setBatchOpen(false)}
                    className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableManagement;
