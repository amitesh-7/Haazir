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
}

export default new SmartTimetableService();
