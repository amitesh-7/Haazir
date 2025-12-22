/**
 * Unified Timetable Generation Types
 * Supports both CSP and AI-based generation with multi-department/section handling
 */

// ==================== INPUT TYPES ====================

export interface Department {
  department_id: number;
  name: string;
  code: string;
}

export interface Section {
  section_id: number;
  section_name: string;
  department_id: number;
  semester: number;
  student_count?: number;
}

export interface Teacher {
  teacher_id: number;
  name: string;
  email: string;
  department_id: number;
  max_hours_per_day?: number;
  max_hours_per_week?: number;
  preferred_days?: string[];
  preferred_time_slots?: string[];
  unavailable_slots?: string[];
}

export interface Room {
  room_id: number;
  room_number: string;
  room_type: 'classroom' | 'lab' | 'seminar_hall';
  capacity: number;
  building?: string;
  floor?: number;
  has_projector?: boolean;
  has_ac?: boolean;
}

export interface CourseAssignment {
  course_id: number;
  course_code: string;
  course_name: string;
  department_id: number;
  department_name?: string;
  semester: number;
  credits?: number;
  sessions: {
    theory: SessionConfig;
    lab: SessionConfig;
    tutorial: SessionConfig;
  };
}

export interface SessionConfig {
  enabled: boolean;
  teacher_id: number | null;
  teacher_name: string;
  classes_per_week: number;
  duration_minutes: number;
  requires_lab?: boolean;
  batch_wise?: boolean; // For labs - split by batch
}

export interface TimeConfiguration {
  working_days: string[];
  start_time: string;       // "08:00"
  end_time: string;         // "17:00"
  class_duration: number;   // minutes
  lunch_break: {
    enabled: boolean;
    start_time: string;
    end_time: string;
  };
  short_break?: {
    enabled: boolean;
    after_slots: number;
    duration: number;
  };
}

export interface GenerationPreferences {
  // Hard constraints (must be satisfied)
  hard_constraints: {
    no_teacher_clash: boolean;
    no_section_clash: boolean;
    no_room_clash: boolean;
    respect_working_hours: boolean;
    respect_lunch_break: boolean;
    max_classes_per_day_student?: number;
    max_classes_per_day_teacher?: number;
  };
  // Soft constraints (optimize but can violate)
  soft_constraints: {
    minimize_student_gaps: { enabled: boolean; weight: number };
    minimize_teacher_gaps: { enabled: boolean; weight: number };
    balance_daily_load: { enabled: boolean; weight: number };
    prefer_morning_theory: { enabled: boolean; weight: number };
    prefer_afternoon_labs: { enabled: boolean; weight: number };
    avoid_back_to_back_labs: { enabled: boolean; weight: number };
    same_course_different_days: { enabled: boolean; weight: number };
    teacher_preference_slots: { enabled: boolean; weight: number };
  };
  // Optimization goal
  optimization_goal: 'balanced' | 'teacher_focused' | 'student_focused' | 'resource_efficient';
}

export interface TimetableGenerationRequest {
  request_id?: number;
  request_name?: string;
  departments: Department[];
  semesters?: number[];
  sections: Section[];
  course_assignments: CourseAssignment[];
  time_config: TimeConfiguration;
  preferences: GenerationPreferences;
  rooms?: Room[];
  teachers?: Teacher[];
  metadata?: {
    academic_year: string;
    created_by: number;
    institution_name?: string;
  };
}

// ==================== INTERNAL PROCESSING TYPES ====================

export interface TimeSlot {
  id: string;                 // "MON_09:00"
  day: string;                // "Monday"
  day_index: number;          // 0-6
  start_time: string;         // "09:00"
  end_time: string;           // "10:00"
  slot_index: number;         // Position in day (0, 1, 2...)
  is_lunch: boolean;
  is_break: boolean;
}

export interface ScheduleSession {
  session_id: string;         // "CS101_Theory_A_1"
  course_id: number;
  course_code: string;
  course_name: string;
  session_type: 'theory' | 'lab' | 'tutorial';
  session_number: number;     // 1, 2, 3... for multiple sessions/week
  section_id: number;
  section_name: string;
  department_id: number;
  department_name: string;
  semester: number;
  teacher_id: number;
  teacher_name: string;
  duration_minutes: number;
  requires_lab_room: boolean;
  batch_id?: number;          // For lab batches
}

export interface ScheduleAssignment {
  session: ScheduleSession;
  time_slot: TimeSlot;
  room?: Room;
}

// ==================== OUTPUT TYPES ====================

export interface TimetableEntry {
  day: string;
  day_index: number;
  time_slot: string;          // "09:00-10:00"
  start_time: string;
  end_time: string;
  course_code: string;
  course_name: string;
  session_type: 'theory' | 'lab' | 'tutorial';
  teacher_id: number;
  teacher_name: string;
  section_name: string;
  section_id: number;
  department_id: number;
  department_name: string;
  semester: number;
  room_number?: string;
  batch_id?: number;
}

export interface QualityMetrics {
  overall_score: number;          // 0-100
  feasibility_score: number;      // Hard constraints satisfaction
  optimization_score: number;     // Soft constraints satisfaction
  teacher_satisfaction: number;
  student_satisfaction: number;
  resource_utilization: number;
  breakdown: {
    hard_constraints: {
      name: string;
      satisfied: boolean;
      violations: number;
    }[];
    soft_constraints: {
      name: string;
      score: number;
      weight: number;
      weighted_score: number;
    }[];
  };
}

export interface SolutionStatistics {
  total_sessions: number;
  sessions_scheduled: number;
  sessions_failed: number;
  unique_teachers: number;
  unique_sections: number;
  unique_rooms: number;
  slots_used: number;
  slots_available: number;
  utilization_percentage: number;
  teacher_workloads: {
    teacher_id: number;
    teacher_name: string;
    total_hours: number;
    daily_hours: Record<string, number>;
    gaps_minutes: number;
    consecutive_classes: number;
  }[];
  section_schedules: {
    section_id: number;
    section_name: string;
    total_hours: number;
    daily_hours: Record<string, number>;
    gaps_minutes: number;
    first_class_times: Record<string, string>;
    last_class_times: Record<string, string>;
  }[];
}

export interface SolutionIssue {
  type: 'hard_violation' | 'soft_violation' | 'warning';
  severity: 'critical' | 'major' | 'minor';
  constraint: string;
  message: string;
  affected_sessions: string[];
  suggestion?: string;
}

export interface TimetableSolution {
  id: string;
  name: string;
  description: string;
  method: 'csp' | 'ai' | 'hybrid';
  optimization_goal: string;
  
  // The timetable entries
  timetable_entries: TimetableEntry[];
  
  // Quality assessment
  quality: QualityMetrics;
  
  // Statistics
  statistics: SolutionStatistics;
  
  // Issues found
  issues: SolutionIssue[];
  
  // Generation info
  generation_info: {
    method: string;
    algorithm?: string;
    model?: string;
    generation_time_ms: number;
    iterations?: number;
    backtracks?: number;
    timestamp: string;
  };
}

export interface GenerationResult {
  success: boolean;
  method: 'csp' | 'ai' | 'hybrid';
  solutions: TimetableSolution[];
  best_solution_id: string | null;
  generation_summary: {
    total_attempts: number;
    successful: number;
    failed: number;
    total_time_ms: number;
    method_details: string;
  };
  recommendations: {
    best_overall: string;
    best_for_teachers: string;
    best_for_students: string;
    reasoning: string;
  };
  errors?: string[];
}

// ==================== CSP SPECIFIC TYPES ====================

export interface CSPDomain {
  session_id: string;
  possible_slots: TimeSlot[];
}

export interface CSPState {
  assignments: Map<string, TimeSlot>;  // session_id -> TimeSlot
  domains: Map<string, TimeSlot[]>;    // session_id -> possible TimeSlots
  unassigned: string[];                // session_ids not yet assigned
}

export interface ConstraintViolation {
  constraint_name: string;
  session_ids: string[];
  description: string;
}

// ==================== AI SPECIFIC TYPES ====================

export interface AIPromptContext {
  departments: string[];
  sections: string[];
  courses: {
    code: string;
    name: string;
    sessions: string[];
  }[];
  teachers: string[];
  time_slots: string[];
  constraints: string[];
  preferences: string[];
}

export interface AIGeneratedSchedule {
  entries: {
    session: string;
    day: string;
    time: string;
    room?: string;
  }[];
  reasoning?: string;
  confidence?: number;
}
