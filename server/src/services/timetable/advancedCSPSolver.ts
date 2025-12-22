/**
 * Advanced CSP Timetable Solver
 * Implements Arc Consistency (AC-3), MRV heuristic, and proper backtracking
 * Handles multiple departments and sections
 */

import {
  TimetableGenerationRequest,
  TimetableSolution,
  GenerationResult,
  ScheduleSession,
  TimeSlot,
  TimetableEntry,
  QualityMetrics,
  SolutionStatistics,
  SolutionIssue,
  CSPState,
  ConstraintViolation,
} from './types';

interface CSPConfig {
  maxIterations: number;
  maxTimeMs: number;
  maxBacktracks: number;
  enableAC3: boolean;
  enableMRV: boolean;
  enableLCV: boolean;
  enableForwardChecking: boolean;
}

const DEFAULT_CONFIG: CSPConfig = {
  maxIterations: 100000,
  maxTimeMs: 120000,  // 2 minutes
  maxBacktracks: 10000,
  enableAC3: true,
  enableMRV: true,
  enableLCV: true,
  enableForwardChecking: true,
};

export class AdvancedCSPSolver {
  private request: TimetableGenerationRequest;
  private config: CSPConfig;
  private sessions: ScheduleSession[] = [];
  private timeSlots: TimeSlot[] = [];
  private sessionMap: Map<string, ScheduleSession> = new Map();
  
  // Statistics
  private backtracks = 0;
  private iterations = 0;
  private propagations = 0;
  private startTime = 0;

  constructor(request: TimetableGenerationRequest, config: Partial<CSPConfig> = {}) {
    this.request = request;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Main solve method - generates multiple solutions with different optimization goals
   */
  async solve(): Promise<GenerationResult> {
    this.startTime = Date.now();
    const solutions: TimetableSolution[] = [];
    const errors: string[] = [];

    console.log('🧮 Starting Advanced CSP Solver...');
    console.log(`📊 Departments: ${this.request.departments.map(d => d.name).join(', ')}`);
    console.log(`📊 Sections: ${this.request.sections.map(s => s.section_name).join(', ')}`);

    try {
      // Step 1: Prepare data
      this.prepareData();
      console.log(`✅ Prepared ${this.sessions.length} sessions, ${this.timeSlots.length} time slots`);

      // Validate problem is solvable
      const validation = this.validateProblem();
      if (!validation.valid) {
        return {
          success: false,
          method: 'csp',
          solutions: [],
          best_solution_id: null,
          generation_summary: {
            total_attempts: 0,
            successful: 0,
            failed: 1,
            total_time_ms: Date.now() - this.startTime,
            method_details: 'Problem validation failed',
          },
          recommendations: {
            best_overall: '',
            best_for_teachers: '',
            best_for_students: '',
            reasoning: validation.message,
          },
          errors: [validation.message],
        };
      }

      // Step 2: Generate solutions with different optimization goals
      const optimizationGoals = [
        { name: 'Balanced Schedule', goal: 'balanced', description: 'Equal weight to all preferences' },
        { name: 'Teacher-Optimized', goal: 'teacher_focused', description: 'Minimizes teacher gaps and workload issues' },
        { name: 'Student-Optimized', goal: 'student_focused', description: 'Minimizes student gaps, balanced daily load' },
      ];

      for (const opt of optimizationGoals) {
        console.log(`\n🎯 Generating: ${opt.name}`);
        this.resetStats();

        const solution = await this.generateSingleSolution(opt.goal, opt.name, opt.description);
        if (solution) {
          solutions.push(solution);
          console.log(`✅ ${opt.name}: Score ${solution.quality.overall_score.toFixed(1)}`);
        } else {
          console.log(`❌ ${opt.name}: Failed to generate`);
          errors.push(`Failed to generate ${opt.name}`);
        }
      }

      // Step 3: Analyze and return results
      const recommendations = this.analyzeAndRecommend(solutions);

      return {
        success: solutions.length > 0,
        method: 'csp',
        solutions,
        best_solution_id: recommendations.best_overall || null,
        generation_summary: {
          total_attempts: optimizationGoals.length,
          successful: solutions.length,
          failed: optimizationGoals.length - solutions.length,
          total_time_ms: Date.now() - this.startTime,
          method_details: `CSP Solver with AC-3, MRV heuristic`,
        },
        recommendations,
        errors: errors.length > 0 ? errors : undefined,
      };

    } catch (error) {
      console.error('❌ CSP Solver error:', error);
      return {
        success: false,
        method: 'csp',
        solutions: [],
        best_solution_id: null,
        generation_summary: {
          total_attempts: 1,
          successful: 0,
          failed: 1,
          total_time_ms: Date.now() - this.startTime,
          method_details: 'CSP Solver encountered an error',
        },
        recommendations: {
          best_overall: '',
          best_for_teachers: '',
          best_for_students: '',
          reasoning: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Prepare sessions and time slots from request
   */
  private prepareData(): void {
    this.timeSlots = this.generateTimeSlots();
    this.sessions = this.generateSessions();
    
    // Build session lookup map
    this.sessionMap.clear();
    this.sessions.forEach(s => this.sessionMap.set(s.session_id, s));
  }

  /**
   * Generate all time slots based on configuration
   */
  private generateTimeSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const { time_config } = this.request;
    
    const startMinutes = this.timeToMinutes(time_config.start_time);
    const endMinutes = this.timeToMinutes(time_config.end_time);
    const duration = time_config.class_duration;
    const lunchStart = time_config.lunch_break.enabled 
      ? this.timeToMinutes(time_config.lunch_break.start_time) 
      : -1;
    const lunchEnd = time_config.lunch_break.enabled 
      ? this.timeToMinutes(time_config.lunch_break.end_time) 
      : -1;

    time_config.working_days.forEach((day, dayIndex) => {
      let currentMinutes = startMinutes;
      let slotIndex = 0;

      while (currentMinutes + duration <= endMinutes) {
        const slotEnd = currentMinutes + duration;
        
        // Check if this slot overlaps with lunch break
        const isLunch = lunchStart >= 0 && 
          !(currentMinutes >= lunchEnd || slotEnd <= lunchStart);

        if (!isLunch) {
          const slot: TimeSlot = {
            id: `${day.substring(0, 3).toUpperCase()}_${this.minutesToTime(currentMinutes)}`,
            day,
            day_index: dayIndex,
            start_time: this.minutesToTime(currentMinutes),
            end_time: this.minutesToTime(slotEnd),
            slot_index: slotIndex,
            is_lunch: false,
            is_break: false,
          };
          slots.push(slot);
          slotIndex++;
        }

        currentMinutes += duration;
      }
    });

    return slots;
  }

  /**
   * Generate all sessions from course assignments
   */
  private generateSessions(): ScheduleSession[] {
    const sessions: ScheduleSession[] = [];
    
    for (const course of this.request.course_assignments) {
      // Get sections for this course (same department and semester)
      const relevantSections = this.request.sections.filter(
        s => s.department_id === course.department_id && s.semester === course.semester
      );

      for (const section of relevantSections) {
        // Theory sessions
        if (course.sessions.theory.enabled && course.sessions.theory.teacher_id) {
          for (let i = 1; i <= course.sessions.theory.classes_per_week; i++) {
            sessions.push({
              session_id: `${course.course_code}_Theory_${section.section_name}_${i}`,
              course_id: course.course_id,
              course_code: course.course_code,
              course_name: course.course_name,
              session_type: 'theory',
              session_number: i,
              section_id: section.section_id,
              section_name: section.section_name,
              department_id: course.department_id,
              department_name: course.department_name || '',
              semester: course.semester,
              teacher_id: course.sessions.theory.teacher_id!,
              teacher_name: course.sessions.theory.teacher_name,
              duration_minutes: course.sessions.theory.duration_minutes,
              requires_lab_room: false,
            });
          }
        }

        // Lab sessions
        if (course.sessions.lab.enabled && course.sessions.lab.teacher_id) {
          for (let i = 1; i <= course.sessions.lab.classes_per_week; i++) {
            sessions.push({
              session_id: `${course.course_code}_Lab_${section.section_name}_${i}`,
              course_id: course.course_id,
              course_code: course.course_code,
              course_name: course.course_name,
              session_type: 'lab',
              session_number: i,
              section_id: section.section_id,
              section_name: section.section_name,
              department_id: course.department_id,
              department_name: course.department_name || '',
              semester: course.semester,
              teacher_id: course.sessions.lab.teacher_id!,
              teacher_name: course.sessions.lab.teacher_name,
              duration_minutes: course.sessions.lab.duration_minutes,
              requires_lab_room: true,
            });
          }
        }

        // Tutorial sessions
        if (course.sessions.tutorial.enabled && course.sessions.tutorial.teacher_id) {
          for (let i = 1; i <= course.sessions.tutorial.classes_per_week; i++) {
            sessions.push({
              session_id: `${course.course_code}_Tutorial_${section.section_name}_${i}`,
              course_id: course.course_id,
              course_code: course.course_code,
              course_name: course.course_name,
              session_type: 'tutorial',
              session_number: i,
              section_id: section.section_id,
              section_name: section.section_name,
              department_id: course.department_id,
              department_name: course.department_name || '',
              semester: course.semester,
              teacher_id: course.sessions.tutorial.teacher_id!,
              teacher_name: course.sessions.tutorial.teacher_name,
              duration_minutes: course.sessions.tutorial.duration_minutes,
              requires_lab_room: false,
            });
          }
        }
      }
    }

    return sessions;
  }

  /**
   * Validate the problem is solvable
   */
  private validateProblem(): { valid: boolean; message: string } {
    // Group sessions by section
    const sessionsBySection = new Map<string, ScheduleSession[]>();
    for (const session of this.sessions) {
      const key = `${session.section_id}`;
      if (!sessionsBySection.has(key)) {
        sessionsBySection.set(key, []);
      }
      sessionsBySection.get(key)!.push(session);
    }

    // Check if any section has more sessions than available slots
    for (const [sectionKey, sectionSessions] of sessionsBySection) {
      if (sectionSessions.length > this.timeSlots.length) {
        return {
          valid: false,
          message: `Section ${sectionKey} has ${sectionSessions.length} sessions but only ${this.timeSlots.length} time slots available. Please reduce classes or add more time slots.`,
        };
      }
    }

    // Check teacher load
    const sessionsByTeacher = new Map<number, ScheduleSession[]>();
    for (const session of this.sessions) {
      if (!sessionsByTeacher.has(session.teacher_id)) {
        sessionsByTeacher.set(session.teacher_id, []);
      }
      sessionsByTeacher.get(session.teacher_id)!.push(session);
    }

    for (const [teacherId, teacherSessions] of sessionsByTeacher) {
      if (teacherSessions.length > this.timeSlots.length) {
        const teacherName = teacherSessions[0].teacher_name;
        return {
          valid: false,
          message: `Teacher ${teacherName} has ${teacherSessions.length} sessions but only ${this.timeSlots.length} time slots available.`,
        };
      }
    }

    return { valid: true, message: 'Problem is valid' };
  }

  /**
   * Generate a single solution with specific optimization goal
   */
  private async generateSingleSolution(
    goal: string,
    name: string,
    description: string
  ): Promise<TimetableSolution | null> {
    // Initialize CSP state
    const state: CSPState = {
      assignments: new Map(),
      domains: new Map(),
      unassigned: this.sessions.map(s => s.session_id),
    };

    // Initialize domains - each session can go to any time slot initially
    for (const session of this.sessions) {
      state.domains.set(session.session_id, [...this.timeSlots]);
    }

    // Apply AC-3 for initial domain reduction
    if (this.config.enableAC3) {
      this.applyAC3(state);
    }

    // Apply initial constraint propagation
    this.propagateInitialConstraints(state);

    // Run backtracking search
    const success = await this.backtrack(state, goal);

    if (!success || state.assignments.size !== this.sessions.length) {
      return null;
    }

    // Convert solution to output format
    return this.createSolution(state, goal, name, description);
  }

  /**
   * Arc Consistency Algorithm (AC-3)
   */
  private applyAC3(state: CSPState): boolean {
    // Build arcs: pairs of sessions that share a constraint
    const arcs: [string, string][] = [];
    
    for (let i = 0; i < this.sessions.length; i++) {
      for (let j = i + 1; j < this.sessions.length; j++) {
        const s1 = this.sessions[i];
        const s2 = this.sessions[j];
        
        // Add arc if sessions share a constraint (same teacher or same section)
        if (s1.teacher_id === s2.teacher_id || s1.section_id === s2.section_id) {
          arcs.push([s1.session_id, s2.session_id]);
          arcs.push([s2.session_id, s1.session_id]);
        }
      }
    }

    // Process arcs
    while (arcs.length > 0) {
      const [xi, xj] = arcs.shift()!;
      if (this.revise(state, xi, xj)) {
        const domain = state.domains.get(xi);
        if (!domain || domain.length === 0) {
          return false; // Domain wipeout - no solution possible
        }
        
        // Add all arcs (xk, xi) where xk != xj
        for (const session of this.sessions) {
          if (session.session_id !== xi && session.session_id !== xj) {
            const s1 = this.sessionMap.get(xi)!;
            const sk = session;
            if (s1.teacher_id === sk.teacher_id || s1.section_id === sk.section_id) {
              arcs.push([session.session_id, xi]);
            }
          }
        }
      }
      this.propagations++;
    }

    return true;
  }

  /**
   * Revise domain of xi based on constraint with xj
   */
  private revise(state: CSPState, xi: string, xj: string): boolean {
    let revised = false;
    const domainXi = state.domains.get(xi) || [];
    const domainXj = state.domains.get(xj) || [];
    
    const s1 = this.sessionMap.get(xi)!;
    const s2 = this.sessionMap.get(xj)!;
    
    // Check if they share a constraint
    const sameTeacher = s1.teacher_id === s2.teacher_id;
    const sameSection = s1.section_id === s2.section_id;
    
    if (!sameTeacher && !sameSection) {
      return false;
    }

    // Filter domain of xi
    const newDomain: TimeSlot[] = [];
    for (const slotXi of domainXi) {
      // Check if there exists at least one value in xj domain that is consistent
      let hasConsistentValue = false;
      for (const slotXj of domainXj) {
        if (!this.slotsConflict(slotXi, slotXj)) {
          hasConsistentValue = true;
          break;
        }
      }
      if (hasConsistentValue) {
        newDomain.push(slotXi);
      } else {
        revised = true;
      }
    }
    
    if (revised) {
      state.domains.set(xi, newDomain);
    }
    
    return revised;
  }

  /**
   * Check if two time slots conflict
   */
  private slotsConflict(slot1: TimeSlot, slot2: TimeSlot): boolean {
    return slot1.id === slot2.id; // Same slot = conflict
  }

  /**
   * Apply initial constraint propagation based on preferences
   */
  private propagateInitialConstraints(state: CSPState): void {
    const { preferences } = this.request;

    // Apply "same course different days" constraint
    if (preferences.soft_constraints.same_course_different_days.enabled) {
      // Group sessions by course and section
      const courseGroups = new Map<string, ScheduleSession[]>();
      for (const session of this.sessions) {
        const key = `${session.course_code}_${session.section_id}`;
        if (!courseGroups.has(key)) {
          courseGroups.set(key, []);
        }
        courseGroups.get(key)!.push(session);
      }

      // For courses with multiple sessions, prefer different days
      // (This is soft, so we just reorder domains, not remove values)
    }
  }

  /**
   * Main backtracking algorithm with heuristics
   */
  private async backtrack(state: CSPState, goal: string): Promise<boolean> {
    this.iterations++;

    // Check limits
    if (Date.now() - this.startTime > this.config.maxTimeMs) {
      console.log('⏰ Time limit reached');
      return false;
    }
    if (this.backtracks > this.config.maxBacktracks) {
      console.log('🔄 Backtrack limit reached');
      return false;
    }

    // Check if complete
    if (state.unassigned.length === 0) {
      return true;
    }

    // Select variable using MRV (Minimum Remaining Values) heuristic
    const sessionId = this.selectVariable(state);
    if (!sessionId) return false;

    const session = this.sessionMap.get(sessionId)!;
    const domain = state.domains.get(sessionId) || [];
    
    // Order domain values using LCV (Least Constraining Value) heuristic
    const orderedDomain = this.orderDomainValues(state, sessionId, domain, goal);

    for (const slot of orderedDomain) {
      // Check if assignment is consistent
      if (this.isConsistent(state, session, slot)) {
        // Make assignment
        state.assignments.set(sessionId, slot);
        state.unassigned = state.unassigned.filter(id => id !== sessionId);
        
        // Save domains for backtracking
        const savedDomains = new Map(state.domains);
        
        // Forward checking - reduce domains of related sessions
        if (this.config.enableForwardChecking) {
          this.forwardCheck(state, session, slot);
        }

        // Check for domain wipeout
        let wipeout = false;
        for (const [sid, dom] of state.domains) {
          if (state.unassigned.indexOf(sid) !== -1 && dom.length === 0) {
            wipeout = true;
            break;
          }
        }

        if (!wipeout) {
          // Recursive call
          if (await this.backtrack(state, goal)) {
            return true;
          }
        }

        // Backtrack
        state.assignments.delete(sessionId);
        state.unassigned.push(sessionId);
        state.domains = savedDomains;
        this.backtracks++;
      }
    }

    return false;
  }

  /**
   * Select next variable using MRV heuristic
   */
  private selectVariable(state: CSPState): string | null {
    if (!this.config.enableMRV) {
      return state.unassigned[0] || null;
    }

    let minRemaining = Infinity;
    let selected: string | null = null;
    let minDegree = Infinity; // Tie-breaker: most constrained (highest degree)

    for (const sessionId of state.unassigned) {
      const domain = state.domains.get(sessionId) || [];
      const degree = this.getDegree(state, sessionId);
      
      if (domain.length < minRemaining || 
          (domain.length === minRemaining && degree > minDegree)) {
        minRemaining = domain.length;
        minDegree = degree;
        selected = sessionId;
      }
    }

    return selected;
  }

  /**
   * Get degree of a variable (number of constraints with unassigned variables)
   */
  private getDegree(state: CSPState, sessionId: string): number {
    const session = this.sessionMap.get(sessionId)!;
    let degree = 0;
    
    for (const otherId of state.unassigned) {
      if (otherId !== sessionId) {
        const other = this.sessionMap.get(otherId)!;
        if (session.teacher_id === other.teacher_id || 
            session.section_id === other.section_id) {
          degree++;
        }
      }
    }
    
    return degree;
  }

  /**
   * Order domain values using LCV heuristic and optimization preferences
   */
  private orderDomainValues(
    state: CSPState,
    sessionId: string,
    domain: TimeSlot[],
    goal: string
  ): TimeSlot[] {
    if (!this.config.enableLCV) {
      return domain;
    }

    const session = this.sessionMap.get(sessionId)!;
    const { preferences } = this.request;

    // Score each slot
    const scored = domain.map(slot => {
      let score = 0;

      // LCV: Prefer values that rule out fewer choices for neighbors
      const constrainingCount = this.countConstraining(state, sessionId, slot);
      score -= constrainingCount * 10;

      // Preference: Morning theory
      if (preferences.soft_constraints.prefer_morning_theory.enabled && 
          session.session_type === 'theory') {
        if (slot.slot_index < 3) {
          score += preferences.soft_constraints.prefer_morning_theory.weight;
        }
      }

      // Preference: Afternoon labs
      if (preferences.soft_constraints.prefer_afternoon_labs.enabled && 
          session.session_type === 'lab') {
        if (slot.slot_index >= 3) {
          score += preferences.soft_constraints.prefer_afternoon_labs.weight;
        }
      }

      // Same course different days
      if (preferences.soft_constraints.same_course_different_days.enabled) {
        const sameCourseAssignments = Array.from(state.assignments.entries())
          .filter(([id, _]) => {
            const s = this.sessionMap.get(id)!;
            return s.course_code === session.course_code && 
                   s.section_id === session.section_id;
          });
        
        const usedDays = new Set(sameCourseAssignments.map(([_, s]) => s.day));
        if (!usedDays.has(slot.day)) {
          score += preferences.soft_constraints.same_course_different_days.weight;
        }
      }

      // Goal-specific preferences
      if (goal === 'teacher_focused') {
        // Prefer compact schedules for teachers
        const teacherAssignments = Array.from(state.assignments.entries())
          .filter(([id, _]) => this.sessionMap.get(id)!.teacher_id === session.teacher_id);
        
        if (teacherAssignments.length > 0) {
          const sameDayAssignments = teacherAssignments
            .filter(([_, s]) => s.day === slot.day);
          if (sameDayAssignments.length > 0) {
            score += 5; // Prefer same day (compact schedule)
          }
        }
      }

      if (goal === 'student_focused') {
        // Prefer balanced distribution across days
        const sectionAssignments = Array.from(state.assignments.entries())
          .filter(([id, _]) => this.sessionMap.get(id)!.section_id === session.section_id);
        
        const classesPerDay = new Map<string, number>();
        for (const [_, s] of sectionAssignments) {
          classesPerDay.set(s.day, (classesPerDay.get(s.day) || 0) + 1);
        }
        
        const currentDayCount = classesPerDay.get(slot.day) || 0;
        const avgClasses = sectionAssignments.length / this.request.time_config.working_days.length;
        
        if (currentDayCount < avgClasses) {
          score += 5; // Prefer days with fewer classes
        }
      }

      return { slot, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    
    return scored.map(s => s.slot);
  }

  /**
   * Count how many domain values would be ruled out by this assignment
   */
  private countConstraining(state: CSPState, sessionId: string, slot: TimeSlot): number {
    const session = this.sessionMap.get(sessionId)!;
    let count = 0;

    for (const otherId of state.unassigned) {
      if (otherId !== sessionId) {
        const other = this.sessionMap.get(otherId)!;
        const domain = state.domains.get(otherId) || [];
        
        // Check if this assignment would remove slot from other's domain
        if ((session.teacher_id === other.teacher_id || 
             session.section_id === other.section_id) &&
            domain.some(s => s.id === slot.id)) {
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Check if assigning slot to session is consistent with all constraints
   */
  private isConsistent(state: CSPState, session: ScheduleSession, slot: TimeSlot): boolean {
    const { preferences } = this.request;

    // Hard constraint: No teacher clash
    if (preferences.hard_constraints.no_teacher_clash) {
      for (const [id, assignedSlot] of state.assignments) {
        const other = this.sessionMap.get(id)!;
        if (other.teacher_id === session.teacher_id && assignedSlot.id === slot.id) {
          return false;
        }
      }
    }

    // Hard constraint: No section clash
    if (preferences.hard_constraints.no_section_clash) {
      for (const [id, assignedSlot] of state.assignments) {
        const other = this.sessionMap.get(id)!;
        if (other.section_id === session.section_id && assignedSlot.id === slot.id) {
          return false;
        }
      }
    }

    // Hard constraint: Max classes per day for section
    if (preferences.hard_constraints.max_classes_per_day_student) {
      const sectionClasses = Array.from(state.assignments.entries())
        .filter(([id, s]) => 
          this.sessionMap.get(id)!.section_id === session.section_id && 
          s.day === slot.day
        );
      
      if (sectionClasses.length >= preferences.hard_constraints.max_classes_per_day_student) {
        return false;
      }
    }

    // Hard constraint: Max classes per day for teacher
    if (preferences.hard_constraints.max_classes_per_day_teacher) {
      const teacherClasses = Array.from(state.assignments.entries())
        .filter(([id, s]) => 
          this.sessionMap.get(id)!.teacher_id === session.teacher_id && 
          s.day === slot.day
        );
      
      if (teacherClasses.length >= preferences.hard_constraints.max_classes_per_day_teacher) {
        return false;
      }
    }

    return true;
  }

  /**
   * Forward checking - reduce domains of related variables
   */
  private forwardCheck(state: CSPState, session: ScheduleSession, slot: TimeSlot): void {
    for (const otherId of state.unassigned) {
      const other = this.sessionMap.get(otherId)!;
      
      // If same teacher or same section, remove the assigned slot from domain
      if (other.teacher_id === session.teacher_id || 
          other.section_id === session.section_id) {
        const domain = state.domains.get(otherId) || [];
        state.domains.set(otherId, domain.filter(s => s.id !== slot.id));
      }
    }
  }

  /**
   * Convert CSP state to solution format
   */
  private createSolution(
    state: CSPState,
    goal: string,
    name: string,
    description: string
  ): TimetableSolution {
    // Convert assignments to timetable entries
    const entries: TimetableEntry[] = [];
    
    for (const [sessionId, slot] of state.assignments) {
      const session = this.sessionMap.get(sessionId)!;
      entries.push({
        day: slot.day,
        day_index: slot.day_index,
        time_slot: `${slot.start_time}-${slot.end_time}`,
        start_time: slot.start_time,
        end_time: slot.end_time,
        course_code: session.course_code,
        course_name: session.course_name,
        session_type: session.session_type,
        teacher_id: session.teacher_id,
        teacher_name: session.teacher_name,
        section_name: session.section_name,
        section_id: session.section_id,
        department_id: session.department_id,
        department_name: session.department_name,
        semester: session.semester,
        room_number: this.assignRoom(session),
      });
    }

    // Calculate quality metrics
    const quality = this.calculateQuality(state, entries);

    // Calculate statistics
    const statistics = this.calculateStatistics(state, entries);

    // Identify issues
    const issues = this.identifyIssues(state, entries);

    return {
      id: `csp_${goal}_${Date.now()}`,
      name,
      description,
      method: 'csp',
      optimization_goal: goal,
      timetable_entries: entries,
      quality,
      statistics,
      issues,
      generation_info: {
        method: 'CSP Solver',
        algorithm: 'Backtracking with AC-3, MRV, LCV',
        generation_time_ms: Date.now() - this.startTime,
        iterations: this.iterations,
        backtracks: this.backtracks,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Assign room based on session type
   */
  private assignRoom(session: ScheduleSession): string {
    if (session.requires_lab_room) {
      return `Lab-${(session.course_id % 5) + 1}`;
    }
    return `Room-${100 + (session.section_id % 10)}`;
  }

  /**
   * Calculate real quality metrics
   */
  private calculateQuality(state: CSPState, entries: TimetableEntry[]): QualityMetrics {
    const hardConstraintResults: { name: string; satisfied: boolean; violations: number }[] = [];
    const softConstraintResults: { name: string; score: number; weight: number; weighted_score: number }[] = [];

    // Check hard constraints
    let hardViolations = 0;
    
    // Teacher clashes
    const teacherClashes = this.countTeacherClashes(state);
    hardConstraintResults.push({ name: 'No Teacher Clash', satisfied: teacherClashes === 0, violations: teacherClashes });
    hardViolations += teacherClashes;

    // Section clashes
    const sectionClashes = this.countSectionClashes(state);
    hardConstraintResults.push({ name: 'No Section Clash', satisfied: sectionClashes === 0, violations: sectionClashes });
    hardViolations += sectionClashes;

    const feasibility_score = hardViolations === 0 ? 100 : Math.max(0, 100 - hardViolations * 20);

    // Calculate soft constraint scores
    const { preferences } = this.request;

    // Student gaps
    if (preferences.soft_constraints.minimize_student_gaps.enabled) {
      const gapScore = this.calculateStudentGapScore(state);
      const weight = preferences.soft_constraints.minimize_student_gaps.weight;
      softConstraintResults.push({ 
        name: 'Minimize Student Gaps', 
        score: gapScore, 
        weight, 
        weighted_score: gapScore * weight / 100 
      });
    }

    // Teacher gaps
    if (preferences.soft_constraints.minimize_teacher_gaps.enabled) {
      const gapScore = this.calculateTeacherGapScore(state);
      const weight = preferences.soft_constraints.minimize_teacher_gaps.weight;
      softConstraintResults.push({ 
        name: 'Minimize Teacher Gaps', 
        score: gapScore, 
        weight, 
        weighted_score: gapScore * weight / 100 
      });
    }

    // Daily balance
    if (preferences.soft_constraints.balance_daily_load.enabled) {
      const balanceScore = this.calculateDailyBalanceScore(state);
      const weight = preferences.soft_constraints.balance_daily_load.weight;
      softConstraintResults.push({ 
        name: 'Balance Daily Load', 
        score: balanceScore, 
        weight, 
        weighted_score: balanceScore * weight / 100 
      });
    }

    // Same course different days
    if (preferences.soft_constraints.same_course_different_days.enabled) {
      const diffDaysScore = this.calculateDifferentDaysScore(state);
      const weight = preferences.soft_constraints.same_course_different_days.weight;
      softConstraintResults.push({ 
        name: 'Same Course Different Days', 
        score: diffDaysScore, 
        weight, 
        weighted_score: diffDaysScore * weight / 100 
      });
    }

    // Calculate weighted optimization score
    const totalWeight = softConstraintResults.reduce((sum, c) => sum + c.weight, 0) || 1;
    const weightedSum = softConstraintResults.reduce((sum, c) => sum + c.weighted_score, 0);
    const optimization_score = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 100;

    // Calculate teacher and student satisfaction
    const teacher_satisfaction = this.calculateTeacherSatisfaction(state);
    const student_satisfaction = this.calculateStudentSatisfaction(state);
    const resource_utilization = this.calculateResourceUtilization(state);

    // Overall score
    const overall_score = 
      feasibility_score * 0.35 + 
      optimization_score * 0.25 + 
      teacher_satisfaction * 0.2 + 
      student_satisfaction * 0.2;

    return {
      overall_score,
      feasibility_score,
      optimization_score,
      teacher_satisfaction,
      student_satisfaction,
      resource_utilization,
      breakdown: {
        hard_constraints: hardConstraintResults,
        soft_constraints: softConstraintResults,
      },
    };
  }

  private countTeacherClashes(state: CSPState): number {
    let clashes = 0;
    const teacherSlots = new Map<string, Set<string>>();

    for (const [sessionId, slot] of state.assignments) {
      const session = this.sessionMap.get(sessionId)!;
      const key = `${session.teacher_id}`;
      
      if (!teacherSlots.has(key)) {
        teacherSlots.set(key, new Set());
      }
      
      if (teacherSlots.get(key)!.has(slot.id)) {
        clashes++;
      }
      teacherSlots.get(key)!.add(slot.id);
    }

    return clashes;
  }

  private countSectionClashes(state: CSPState): number {
    let clashes = 0;
    const sectionSlots = new Map<string, Set<string>>();

    for (const [sessionId, slot] of state.assignments) {
      const session = this.sessionMap.get(sessionId)!;
      const key = `${session.section_id}`;
      
      if (!sectionSlots.has(key)) {
        sectionSlots.set(key, new Set());
      }
      
      if (sectionSlots.get(key)!.has(slot.id)) {
        clashes++;
      }
      sectionSlots.get(key)!.add(slot.id);
    }

    return clashes;
  }

  private calculateStudentGapScore(state: CSPState): number {
    // Group by section and day, calculate gaps
    const sectionDays = new Map<string, TimeSlot[]>();
    
    for (const [sessionId, slot] of state.assignments) {
      const session = this.sessionMap.get(sessionId)!;
      const key = `${session.section_id}_${slot.day}`;
      
      if (!sectionDays.has(key)) {
        sectionDays.set(key, []);
      }
      sectionDays.get(key)!.push(slot);
    }

    let totalGaps = 0;
    let totalPairs = 0;

    for (const slots of sectionDays.values()) {
      if (slots.length > 1) {
        slots.sort((a, b) => a.slot_index - b.slot_index);
        for (let i = 1; i < slots.length; i++) {
          const gap = slots[i].slot_index - slots[i-1].slot_index - 1;
          totalGaps += gap;
          totalPairs++;
        }
      }
    }

    // Score: 100 if no gaps, decreases with more gaps
    const avgGap = totalPairs > 0 ? totalGaps / totalPairs : 0;
    return Math.max(0, 100 - avgGap * 25);
  }

  private calculateTeacherGapScore(state: CSPState): number {
    const teacherDays = new Map<string, TimeSlot[]>();
    
    for (const [sessionId, slot] of state.assignments) {
      const session = this.sessionMap.get(sessionId)!;
      const key = `${session.teacher_id}_${slot.day}`;
      
      if (!teacherDays.has(key)) {
        teacherDays.set(key, []);
      }
      teacherDays.get(key)!.push(slot);
    }

    let totalGaps = 0;
    let totalPairs = 0;

    for (const slots of teacherDays.values()) {
      if (slots.length > 1) {
        slots.sort((a, b) => a.slot_index - b.slot_index);
        for (let i = 1; i < slots.length; i++) {
          const gap = slots[i].slot_index - slots[i-1].slot_index - 1;
          totalGaps += gap;
          totalPairs++;
        }
      }
    }

    const avgGap = totalPairs > 0 ? totalGaps / totalPairs : 0;
    return Math.max(0, 100 - avgGap * 25);
  }

  private calculateDailyBalanceScore(state: CSPState): number {
    const sectionDailyCount = new Map<number, Map<string, number>>();
    
    for (const [sessionId, slot] of state.assignments) {
      const session = this.sessionMap.get(sessionId)!;
      
      if (!sectionDailyCount.has(session.section_id)) {
        sectionDailyCount.set(session.section_id, new Map());
      }
      
      const dayMap = sectionDailyCount.get(session.section_id)!;
      dayMap.set(slot.day, (dayMap.get(slot.day) || 0) + 1);
    }

    let totalVariance = 0;
    let sectionCount = 0;

    for (const dayMap of sectionDailyCount.values()) {
      const counts = Array.from(dayMap.values());
      if (counts.length > 0) {
        const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
        const variance = counts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / counts.length;
        totalVariance += variance;
        sectionCount++;
      }
    }

    const avgVariance = sectionCount > 0 ? totalVariance / sectionCount : 0;
    return Math.max(0, 100 - avgVariance * 20);
  }

  private calculateDifferentDaysScore(state: CSPState): number {
    // Group sessions by course and section
    const courseGroups = new Map<string, TimeSlot[]>();
    
    for (const [sessionId, slot] of state.assignments) {
      const session = this.sessionMap.get(sessionId)!;
      const key = `${session.course_code}_${session.section_id}`;
      
      if (!courseGroups.has(key)) {
        courseGroups.set(key, []);
      }
      courseGroups.get(key)!.push(slot);
    }

    let goodCount = 0;
    let totalCount = 0;

    for (const slots of courseGroups.values()) {
      if (slots.length > 1) {
        const uniqueDays = new Set(slots.map(s => s.day)).size;
        const maxPossibleDays = Math.min(slots.length, this.request.time_config.working_days.length);
        goodCount += uniqueDays;
        totalCount += maxPossibleDays;
      }
    }

    return totalCount > 0 ? (goodCount / totalCount) * 100 : 100;
  }

  private calculateTeacherSatisfaction(state: CSPState): number {
    // Based on: compact schedule, no extreme days, reasonable gaps
    const teacherMetrics = new Map<number, { days: Set<string>; gaps: number; maxDaily: number }>();
    
    for (const [sessionId, slot] of state.assignments) {
      const session = this.sessionMap.get(sessionId)!;
      
      if (!teacherMetrics.has(session.teacher_id)) {
        teacherMetrics.set(session.teacher_id, { days: new Set(), gaps: 0, maxDaily: 0 });
      }
      
      teacherMetrics.get(session.teacher_id)!.days.add(slot.day);
    }

    let satisfactionSum = 0;
    for (const metrics of teacherMetrics.values()) {
      // Prefer fewer teaching days (compact schedule)
      const dayScore = Math.max(0, 100 - (metrics.days.size - 3) * 15);
      satisfactionSum += dayScore;
    }

    return teacherMetrics.size > 0 ? satisfactionSum / teacherMetrics.size : 100;
  }

  private calculateStudentSatisfaction(state: CSPState): number {
    // Based on: minimal gaps, balanced days, reasonable start/end times
    return this.calculateStudentGapScore(state) * 0.5 + this.calculateDailyBalanceScore(state) * 0.5;
  }

  private calculateResourceUtilization(state: CSPState): number {
    const usedSlots = new Set<string>();
    for (const slot of state.assignments.values()) {
      usedSlots.add(slot.id);
    }
    
    return (usedSlots.size / this.timeSlots.length) * 100;
  }

  private calculateStatistics(state: CSPState, entries: TimetableEntry[]): SolutionStatistics {
    const teacherWorkloads: Map<number, any> = new Map();
    const sectionSchedules: Map<number, any> = new Map();

    for (const [sessionId, slot] of state.assignments) {
      const session = this.sessionMap.get(sessionId)!;
      
      // Teacher workload
      if (!teacherWorkloads.has(session.teacher_id)) {
        teacherWorkloads.set(session.teacher_id, {
          teacher_id: session.teacher_id,
          teacher_name: session.teacher_name,
          total_hours: 0,
          daily_hours: {},
          gaps_minutes: 0,
          consecutive_classes: 0,
        });
      }
      const tw = teacherWorkloads.get(session.teacher_id)!;
      tw.total_hours += session.duration_minutes / 60;
      tw.daily_hours[slot.day] = (tw.daily_hours[slot.day] || 0) + session.duration_minutes / 60;

      // Section schedule
      if (!sectionSchedules.has(session.section_id)) {
        sectionSchedules.set(session.section_id, {
          section_id: session.section_id,
          section_name: session.section_name,
          total_hours: 0,
          daily_hours: {},
          gaps_minutes: 0,
          first_class_times: {},
          last_class_times: {},
        });
      }
      const ss = sectionSchedules.get(session.section_id)!;
      ss.total_hours += session.duration_minutes / 60;
      ss.daily_hours[slot.day] = (ss.daily_hours[slot.day] || 0) + session.duration_minutes / 60;
    }

    return {
      total_sessions: this.sessions.length,
      sessions_scheduled: state.assignments.size,
      sessions_failed: this.sessions.length - state.assignments.size,
      unique_teachers: teacherWorkloads.size,
      unique_sections: sectionSchedules.size,
      unique_rooms: new Set(entries.map(e => e.room_number)).size,
      slots_used: new Set(Array.from(state.assignments.values()).map(s => s.id)).size,
      slots_available: this.timeSlots.length,
      utilization_percentage: (state.assignments.size / this.timeSlots.length) * 100,
      teacher_workloads: Array.from(teacherWorkloads.values()),
      section_schedules: Array.from(sectionSchedules.values()),
    };
  }

  private identifyIssues(state: CSPState, entries: TimetableEntry[]): SolutionIssue[] {
    const issues: SolutionIssue[] = [];
    
    // Check for sessions not scheduled
    if (state.assignments.size < this.sessions.length) {
      const unscheduled = this.sessions
        .filter(s => !state.assignments.has(s.session_id))
        .map(s => s.session_id);
      
      issues.push({
        type: 'hard_violation',
        severity: 'critical',
        constraint: 'Complete Schedule',
        message: `${unscheduled.length} sessions could not be scheduled`,
        affected_sessions: unscheduled,
        suggestion: 'Add more time slots or reduce class requirements',
      });
    }

    return issues;
  }

  private analyzeAndRecommend(solutions: TimetableSolution[]): {
    best_overall: string;
    best_for_teachers: string;
    best_for_students: string;
    reasoning: string;
  } {
    if (solutions.length === 0) {
      return {
        best_overall: '',
        best_for_teachers: '',
        best_for_students: '',
        reasoning: 'No valid solutions were generated',
      };
    }

    const bestOverall = solutions.reduce((best, curr) => 
      curr.quality.overall_score > best.quality.overall_score ? curr : best
    );

    const bestForTeachers = solutions.reduce((best, curr) => 
      curr.quality.teacher_satisfaction > best.quality.teacher_satisfaction ? curr : best
    );

    const bestForStudents = solutions.reduce((best, curr) => 
      curr.quality.student_satisfaction > best.quality.student_satisfaction ? curr : best
    );

    return {
      best_overall: bestOverall.id,
      best_for_teachers: bestForTeachers.id,
      best_for_students: bestForStudents.id,
      reasoning: `Generated ${solutions.length} solutions. Best overall: "${bestOverall.name}" with score ${bestOverall.quality.overall_score.toFixed(1)}. ` +
        `Best for teachers: "${bestForTeachers.name}". Best for students: "${bestForStudents.name}".`,
    };
  }

  private resetStats(): void {
    this.backtracks = 0;
    this.iterations = 0;
    this.propagations = 0;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const hoursStr = hours < 10 ? '0' + hours : String(hours);
    const minsStr = mins < 10 ? '0' + mins : String(mins);
    return `${hoursStr}:${minsStr}`;
  }
}

export default AdvancedCSPSolver;
