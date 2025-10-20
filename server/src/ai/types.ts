/**
 * AI Timetable Generator - Core Data Types
 * Comprehensive type definitions for CSP-based timetable generation
 */

// ==================== BASIC TYPES ====================

export interface TimeSlot {
  id: string;                    // "MON_08:00"
  day: string;                   // "Monday"
  start_time: string;            // "08:00"
  end_time: string;              // "09:00"
  duration_minutes: number;      // 60
  is_lunch_break: boolean;       // false
}

export interface CourseSession {
  id: string;                    // "BCS210_Theory_A_1"
  course_id: number;             // 1
  course_code: string;           // "BCS-210"
  course_name: string;           // "Discrete Structure"
  session_type: 'theory' | 'lab' | 'tutorial';
  section: string;               // "A"
  teacher_id: number;            // 123
  teacher_name: string;          // "Dr. Smith"
  department_id: number;         // 1
  semester: number;              // 3
  duration_minutes: number;      // 60
  classes_per_week: number;      // 2
  session_number: number;        // 1 (for multiple sessions per week)
}

export interface TimetableAssignment {
  session_id: string;            // "BCS210_Theory_A_1"
  time_slot_id: string;          // "MON_08:00"
  room_id?: number;              // Optional room assignment
}

// ==================== CSP TYPES ====================

export interface CSPVariable {
  id: string;                    // Session ID
  session: CourseSession;        // Session details
  domain: TimeSlot[];            // Available time slots for this session
}

export interface CSPAssignment {
  [sessionId: string]: TimeSlot; // Maps session to assigned time slot
}

export abstract class Constraint {
  abstract name: string;
  abstract type: 'hard' | 'soft';
  abstract weight: number;       // For soft constraints (1-100)
  
  // Check if assignment violates this constraint
  abstract isViolated(assignment: CSPAssignment, session?: CourseSession, timeSlot?: TimeSlot): boolean;
  
  // Calculate violation cost for soft constraints
  abstract getViolationCost(assignment: CSPAssignment): number;
  
  // Get affected sessions for constraint propagation
  abstract getAffectedSessions(session: CourseSession): string[];
}

// ==================== GENERATION INPUT ====================

export interface TimetableGenerationInput {
  // Course assignments from CourseAssignmentMatrix
  courseAssignments: {
    course_id: number;
    course_code: string;
    course_name: string;
    department_id: number;
    semester: number;
    sections: string[];            // ["A", "B"]
    sessions: {
      theory: {
        teacher_id: number;
        teacher_name: string;
        classes_per_week: number;
        duration_minutes: number;
      };
      lab: {
        teacher_id: number;
        teacher_name: string;
        classes_per_week: number;
        duration_minutes: number;
      };
      tutorial: {
        teacher_id: number;
        teacher_name: string;
        classes_per_week: number;
        duration_minutes: number;
      };
    };
  }[];

  // Time configuration from manual setup
  timeConfiguration: {
    start_time: string;            // "08:00"
    end_time: string;              // "17:00"
    class_duration: number;        // 60 minutes
    lunch_break: {
      start: string;               // "12:00"
      end: string;                 // "13:00"
    };
    working_days: string[];        // ["Monday", "Tuesday", ...]
  };

  // Generation preferences
  preferences: {
    hard_constraints: {
      no_teacher_clash: boolean;
      no_section_clash: boolean;
      respect_working_hours: boolean;
      respect_lunch_break: boolean;
      max_classes_per_day?: number;
    };
    soft_constraints: {
      minimize_student_gaps: { enabled: boolean; weight: number; };
      balance_teacher_workload: { enabled: boolean; weight: number; };
      prefer_morning_theory: { enabled: boolean; weight: number; };
      avoid_back_to_back_labs: { enabled: boolean; weight: number; };
      minimize_daily_transitions: { enabled: boolean; weight: number; };
    };
  };

  // Request metadata
  metadata: {
    request_id: number;
    department_name: string;
    semester: number;
    academic_year: string;
    created_by: string;
  };
}

// ==================== GENERATION OUTPUT ====================

export interface TimetableSolution {
  id: string;                    // "solution_1"
  name: string;                  // "Teacher-Optimized Schedule"
  description: string;           // "Balanced teacher workload, some student gaps"
  
  // The actual timetable
  schedule: TimetableAssignment[];
  
  // Quality metrics
  quality: {
    feasibility_score: number;    // 0-100 (hard constraints satisfied)
    optimization_score: number;   // 0-100 (soft constraints satisfied)
    teacher_satisfaction: number; // 0-100
    student_convenience: number;  // 0-100
    resource_utilization: number; // 0-100
    overall_score: number;        // 0-100 (weighted average)
  };
  
  // Detailed statistics
  statistics: {
    total_sessions: number;
    sessions_scheduled: number;
    hard_violations: number;
    soft_violations: number;
    teacher_workload: {
      teacher_id: number;
      teacher_name: string;
      total_hours: number;
      days_active: number;
      max_daily_hours: number;
      gaps_minutes: number;
    }[];
    student_schedule: {
      section: string;
      total_hours: number;
      daily_hours: number[];
      total_gaps_minutes: number;
      longest_gap_minutes: number;
    }[];
  };
  
  // Issues and warnings
  issues: {
    hard_violations: {
      constraint: string;
      affected_sessions: string[];
      description: string;
    }[];
    soft_violations: {
      constraint: string;
      impact_score: number;
      description: string;
    }[];
    warnings: {
      type: 'overload' | 'underutilization' | 'gap' | 'other';
      message: string;
      affected_entities: string[];
    }[];
  };
  
  // Generation metadata
  generation_info: {
    algorithm: string;             // "CSP_Backtracking"
    generation_time_ms: number;
    iterations: number;
    optimization_goal: string;     // "teacher_workload" | "student_convenience" | "balanced"
    timestamp: Date;
  };
}

export interface MultiSolutionResult {
  success: boolean;
  solutions: TimetableSolution[];
  generation_summary: {
    total_solutions_attempted: number;
    successful_solutions: number;
    total_generation_time_ms: number;
    input_summary: {
      total_courses: number;
      total_sessions: number;
      total_teachers: number;
      total_sections: number;
      available_time_slots: number;
    };
  };
  recommendations: {
    best_overall: string;          // Solution ID
    best_for_teachers: string;     // Solution ID
    best_for_students: string;     // Solution ID
    reasoning: string;
  };
}

// ==================== CSP ALGORITHM TYPES ====================

export interface CSPSolverConfig {
  algorithm: 'backtracking' | 'forward_checking' | 'arc_consistency';
  heuristics: {
    variable_ordering: 'most_constrained_first' | 'least_constraining_value' | 'random';
    value_ordering: 'least_constraining_value' | 'most_constraining_value' | 'random';
    constraint_propagation: boolean;
    backjumping: boolean;
  };
  limits: {
    max_iterations: number;
    max_time_ms: number;
    max_backtracks: number;
  };
  optimization: {
    enable_optimization: boolean;
    optimization_method: 'weighted_sum' | 'lexicographic' | 'pareto';
    max_optimization_iterations: number;
  };
}

export interface CSPSolutionStep {
  step: number;
  action: 'assign' | 'unassign' | 'propagate' | 'backtrack';
  session_id?: string;
  time_slot_id?: string;
  reason: string;
  constraint_violations: number;
  domains_reduced: number;
}

export interface CSPSolutionTrace {
  steps: CSPSolutionStep[];
  final_assignment: CSPAssignment;
  total_backtracks: number;
  total_propagations: number;
  solution_time_ms: number;
}