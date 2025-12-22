import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export interface TimeSlot {
  slot_id: number;
  slot_name: string;
  start_time: string;
  end_time: string;
  day_order: number;
  is_break: boolean;
  is_active: boolean;
}

export interface Course {
  course_id: number;
  course_name: string;
  course_code: string;
  semester: number;
  department_id?: number;
  department_name?: string;
  department_code?: string;
}

export interface Teacher {
  teacher_id: number;
  name: string;
  department_name?: string;
  email?: string;
}

export interface TimetableRequest {
  request_id?: number;
  request_name: string;
  department_id: number;
  semester: number;
  sections: string[];
  academic_year: string;
  settings: any;
  status?: "draft" | "generating" | "generated" | "active";
  created_at?: string;
  updated_at?: string;
  created_by_name?: string;
  department_name?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: string;
  stats?: any;
}

class SmartTimetableService {
  // ==================== TIME SLOT MANAGEMENT ====================

  /**
   * Get all time slots with their configuration
   */
  async getTimeSlots(): Promise<ApiResponse<TimeSlot[]>> {
    try {
      const response = await api.get("/smart-timetable/generator/time-slots");
      return response.data;
    } catch (error: any) {
      console.error("Error fetching time slots:", error);
      throw new Error(
        error.response?.data?.error || "Failed to fetch time slots"
      );
    }
  }

  /**
   * Update time slot active status
   */
  async updateTimeSlot(
    slotId: number,
    isActive: boolean
  ): Promise<ApiResponse<TimeSlot>> {
    try {
      const response = await api.put(
        `/smart-timetable/generator/time-slots/${slotId}`,
        {
          is_active: isActive,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error updating time slot:", error);
      throw new Error(
        error.response?.data?.error || "Failed to update time slot"
      );
    }
  }

  /**
   * Add new custom time slot
   */
  async addTimeSlot(timeSlot: {
    slot_name: string;
    start_time: string;
    end_time: string;
    is_break?: boolean;
  }): Promise<ApiResponse<TimeSlot>> {
    try {
      const response = await api.post(
        "/smart-timetable/generator/time-slots",
        timeSlot
      );
      return response.data;
    } catch (error: any) {
      console.error("Error adding time slot:", error);
      throw new Error(error.response?.data?.error || "Failed to add time slot");
    }
  }

  // ==================== COURSE AND TEACHER DATA ====================

  /**
   * Get courses for specific department and semester
   */
  async getCoursesForDepartmentSemester(
    departmentId: number,
    semester: number
  ): Promise<ApiResponse<Course[]>> {
    try {
      const response = await api.get(
        `/smart-timetable/generator/courses/${departmentId}/${semester}`
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      throw new Error(error.response?.data?.error || "Failed to fetch courses");
    }
  }

  /**
   * Get available teachers for department/course
   */
  async getAvailableTeachers(params: {
    departmentId: number;
    courseId?: number;
  }): Promise<ApiResponse<Teacher[]>> {
    try {
      const queryParams = new URLSearchParams({
        departmentId: params.departmentId.toString(),
        ...(params.courseId && { courseId: params.courseId.toString() }),
      });

      const response = await api.get(
        `/smart-timetable/generator/teachers?${queryParams}`
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching teachers:", error);
      throw new Error(
        error.response?.data?.error || "Failed to fetch teachers"
      );
    }
  }

  // ==================== TIMETABLE GENERATION REQUESTS ====================

  /**
   * Create new timetable generation request
   */
  async createTimetableRequest(
    request: Omit<
      TimetableRequest,
      "request_id" | "status" | "created_at" | "updated_at"
    >
  ): Promise<ApiResponse<TimetableRequest>> {
    try {
      const response = await api.post(
        "/smart-timetable/generator/requests",
        request
      );
      return response.data;
    } catch (error: any) {
      console.error("Error creating timetable request:", error);
      throw new Error(
        error.response?.data?.error || "Failed to create timetable request"
      );
    }
  }

  /**
   * Get all timetable requests for a department
   */
  async getTimetableRequests(
    departmentId: number
  ): Promise<ApiResponse<TimetableRequest[]>> {
    try {
      const response = await api.get(
        `/smart-timetable/generator/requests/${departmentId}`
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching timetable requests:", error);
      throw new Error(
        error.response?.data?.error || "Failed to fetch timetable requests"
      );
    }
  }

  /**
   * Start timetable generation for a request
   */
  async generateTimetable(requestId: number): Promise<
    ApiResponse<{
      message: string;
      status: string;
      estimated_time: string;
    }>
  > {
    try {
      const response = await api.post(
        `/smart-timetable/generator/requests/${requestId}/generate`
      );
      return response.data;
    } catch (error: any) {
      console.error("Error generating timetable:", error);
      throw new Error(
        error.response?.data?.error || "Failed to start timetable generation"
      );
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Format time string for display
   */
  formatTime(timeString: string): string {
    try {
      const time = new Date(`2000-01-01T${timeString}`);
      return time.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return timeString;
    }
  }

  /**
   * Calculate duration between two times
   */
  calculateDuration(startTime: string, endTime: string): string {
    try {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      const diffMs = end.getTime() - start.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffMinutes < 60) {
        return `${diffMinutes}m`;
      } else {
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
      }
    } catch {
      return "N/A";
    }
  }

  /**
   * Validate time slot data
   */
  validateTimeSlot(timeSlot: Partial<TimeSlot>): string | null {
    if (!timeSlot.slot_name?.trim()) {
      return "Slot name is required";
    }

    if (!timeSlot.start_time || !timeSlot.end_time) {
      return "Start time and end time are required";
    }

    try {
      const start = new Date(`2000-01-01T${timeSlot.start_time}`);
      const end = new Date(`2000-01-01T${timeSlot.end_time}`);

      if (end <= start) {
        return "End time must be after start time";
      }

      const diffMs = end.getTime() - start.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffMinutes < 5) {
        return "Time slot must be at least 5 minutes long";
      }

      if (diffMinutes > 480) {
        return "Time slot cannot be longer than 8 hours";
      }
    } catch {
      return "Invalid time format";
    }

    return null;
  }

  /**
   * Check for time slot conflicts
   */
  checkTimeSlotConflicts(
    newSlot: { start_time: string; end_time: string },
    existingSlots: TimeSlot[]
  ): TimeSlot[] {
    const conflicts: TimeSlot[] = [];

    try {
      const newStart = new Date(`2000-01-01T${newSlot.start_time}`);
      const newEnd = new Date(`2000-01-01T${newSlot.end_time}`);

      for (const slot of existingSlots) {
        if (!slot.is_active) continue;

        const slotStart = new Date(`2000-01-01T${slot.start_time}`);
        const slotEnd = new Date(`2000-01-01T${slot.end_time}`);

        // Check for overlap: new_start < existing_end AND new_end > existing_start
        if (newStart < slotEnd && newEnd > slotStart) {
          conflicts.push(slot);
        }
      }
    } catch (error) {
      console.error("Error checking time slot conflicts:", error);
    }

    return conflicts;
  }

  // ==================== UNIFIED TIMETABLE GENERATION ====================

  /**
   * Get generation capabilities (available methods, defaults)
   */
  async getGenerationCapabilities(): Promise<ApiResponse<any>> {
    try {
      const response = await api.get("/smart-timetable/unified/capabilities");
      return response.data;
    } catch (error: any) {
      console.error("Error fetching capabilities:", error);
      throw new Error(
        error.response?.data?.error || "Failed to fetch generation capabilities"
      );
    }
  }

  /**
   * Validate generation request before processing
   */
  async validateGenerationRequest(request: any): Promise<ApiResponse<{
    valid: boolean;
    issues: string[];
    warnings: string[];
    complexity: string;
    recommended_method: string;
  }>> {
    try {
      const response = await api.post("/smart-timetable/unified/validate", request);
      return response.data;
    } catch (error: any) {
      console.error("Error validating request:", error);
      throw new Error(
        error.response?.data?.error || "Failed to validate request"
      );
    }
  }

  /**
   * Generate timetables using unified service
   * @param request Generation request data
   * @param method Generation method: 'csp', 'ai', 'hybrid', or 'auto'
   */
  async generateUnifiedTimetable(
    request: any,
    method: 'csp' | 'ai' | 'hybrid' | 'auto' = 'auto'
  ): Promise<ApiResponse<any>> {
    try {
      const response = await api.post("/smart-timetable/unified/generate", {
        ...request,
        method,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error generating unified timetable:", error);
      throw new Error(
        error.response?.data?.error || "Failed to generate timetable"
      );
    }
  }

  /**
   * Generate timetables using CSP solver only
   */
  async generateCSPTimetable(request: any): Promise<ApiResponse<any>> {
    try {
      const response = await api.post("/smart-timetable/unified/generate/csp", request);
      return response.data;
    } catch (error: any) {
      console.error("Error generating CSP timetable:", error);
      throw new Error(
        error.response?.data?.error || "Failed to generate CSP timetable"
      );
    }
  }

  /**
   * Generate timetables using AI (Gemini) only
   */
  async generateAITimetable(request: any): Promise<ApiResponse<any>> {
    try {
      const response = await api.post("/smart-timetable/unified/generate/ai", request);
      return response.data;
    } catch (error: any) {
      console.error("Error generating AI timetable:", error);
      throw new Error(
        error.response?.data?.error || "Failed to generate AI timetable"
      );
    }
  }

  /**
   * Generate timetables using hybrid approach (CSP + AI)
   */
  async generateHybridTimetable(request: any): Promise<ApiResponse<any>> {
    try {
      const response = await api.post("/smart-timetable/unified/generate/hybrid", request);
      return response.data;
    } catch (error: any) {
      console.error("Error generating hybrid timetable:", error);
      throw new Error(
        error.response?.data?.error || "Failed to generate hybrid timetable"
      );
    }
  }

  /**
   * Compare multiple solutions
   */
  async compareSolutions(solutionIds: string[]): Promise<ApiResponse<any>> {
    try {
      const response = await api.post("/smart-timetable/unified/compare", {
        solution_ids: solutionIds,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error comparing solutions:", error);
      throw new Error(
        error.response?.data?.error || "Failed to compare solutions"
      );
    }
  }

  /**
   * Build unified generation request from UI data
   * Accepts either separate arguments (legacy) or a single object (new)
   */
  buildUnifiedRequest(
    dataOrDepartments: any,
    sections?: { section_id: number; department_id: number; section_name: string; semester?: number }[],
    courseAssignments?: any[],
    timeConfig?: any,
    preferences?: any
  ): any {
    // Check if called with new object format
    if (dataOrDepartments && typeof dataOrDepartments === 'object' && 'departments' in dataOrDepartments) {
      const data = dataOrDepartments;
      
      // Direct mapping from the new format
      return {
        departments: data.departments || [],
        sections: data.departments?.flatMap((d: any) => d.sections || []) || [],
        teachers: [], // Will be extracted from course assignments
        rooms: [], // Optional - can be added later
        course_assignments: data.courseAssignments || [],
        time_configuration: data.timeConfiguration || {
          working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          start_time: '09:00',
          end_time: '17:00',
          class_duration: 60,
          lunch_break: { enabled: true, start: '12:00', end: '13:00' },
        },
        preferences: data.preferences || {
          optimization_goal: 'balanced',
          hard_constraints: {
            no_teacher_clash: true,
            no_section_clash: true,
            respect_working_hours: true,
            respect_lunch_break: true,
            max_classes_per_day: 8,
          },
          soft_constraints: {
            minimize_student_gaps: { enabled: true, weight: 70 },
            balance_teacher_workload: { enabled: true, weight: 80 },
            prefer_morning_theory: { enabled: true, weight: 60 },
            avoid_back_to_back_labs: { enabled: true, weight: 90 },
            minimize_daily_transitions: { enabled: true, weight: 50 },
          },
        },
        method: data.method || 'auto',
        metadata: data.metadata || {},
      };
    }

    // Legacy format - separate arguments
    const departments = dataOrDepartments as { department_id: number; name: string; code?: string }[];
    
    // Transform sections to match backend format
    const formattedSections = (sections || []).map(s => ({
      section_id: s.section_id,
      department_id: s.department_id,
      section_name: s.section_name,
      semester: s.semester || 1,
    }));

    // Transform departments
    const formattedDepartments = (departments || []).map(d => ({
      department_id: d.department_id,
      name: d.name,
      code: d.code || d.name.substring(0, 3).toUpperCase(),
    }));

    // Group and transform course assignments
    const courseMap = new Map<number, any>();
    (courseAssignments || []).forEach(assignment => {
      if (!courseMap.has(assignment.course_id)) {
        courseMap.set(assignment.course_id, {
          course_id: assignment.course_id,
          course_code: assignment.course_code || `C${assignment.course_id}`,
          course_name: assignment.course_name || 'Course',
          department_id: assignment.department_id || departments[0]?.department_id,
          semester: assignment.semester || 1,
          sessions: {
            theory: { enabled: false, classes_per_week: 0, duration_minutes: 60, teacher_id: null, teacher_name: '' },
            lab: { enabled: false, classes_per_week: 0, duration_minutes: 120, teacher_id: null, teacher_name: '' },
            tutorial: { enabled: false, classes_per_week: 0, duration_minutes: 60, teacher_id: null, teacher_name: '' },
          },
        });
      }

      const course = courseMap.get(assignment.course_id);
      const sessionType = assignment.session_type as 'theory' | 'lab' | 'tutorial';
      
      course.sessions[sessionType] = {
        enabled: true,
        classes_per_week: assignment.classes_per_week || 1,
        duration_minutes: sessionType === 'lab' ? 120 : (timeConfig?.classDuration || 60),
        teacher_id: assignment.teacher_id || null,
        teacher_name: assignment.teacher_name || '',
      };
    });

    // Build time configuration
    const formattedTimeConfig = {
      working_days: timeConfig?.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      start_time: timeConfig?.startTime || '09:00',
      end_time: timeConfig?.endTime || '17:00',
      class_duration: timeConfig?.classDuration || 60,
      lunch_break: {
        enabled: timeConfig?.lunchBreak?.enabled ?? true,
        start_time: timeConfig?.lunchBreak?.startTime || '12:00',
        end_time: timeConfig?.lunchBreak?.endTime || '13:00',
      },
    };

    // Build preferences
    const formattedPreferences = preferences || {
      hard_constraints: {
        no_teacher_clash: true,
        no_section_clash: true,
        no_room_clash: true,
        respect_working_hours: true,
        respect_lunch_break: true,
        max_classes_per_day_student: 6,
        max_classes_per_day_teacher: 5,
      },
      soft_constraints: {
        minimize_student_gaps: { enabled: true, weight: 30 },
        minimize_teacher_gaps: { enabled: true, weight: 25 },
        balance_daily_load: { enabled: true, weight: 20 },
        prefer_morning_theory: { enabled: true, weight: 15 },
        prefer_afternoon_labs: { enabled: true, weight: 10 },
        avoid_back_to_back_labs: { enabled: true, weight: 15 },
        same_course_different_days: { enabled: true, weight: 25 },
        teacher_preference_slots: { enabled: false, weight: 10 },
      },
      optimization_goal: 'balanced',
    };

    return {
      departments: formattedDepartments,
      sections: formattedSections,
      teachers: [], // Will be extracted from course assignments
      rooms: [], // Optional - can be added later
      course_assignments: Array.from(courseMap.values()),
      time_config: formattedTimeConfig,
      preferences: formattedPreferences,
    };
  }
}

export default new SmartTimetableService();
