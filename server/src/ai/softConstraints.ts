/**
 * AI Timetable Generator - Soft Constraints
 * Optimization constraints that improve timetable quality
 */

import { Constraint, CSPAssignment, CourseSession, TimeSlot } from './types';

// ==================== MINIMIZE STUDENT GAPS ====================

export class MinimizeStudentGapsConstraint extends Constraint {
  name = 'MinimizeStudentGaps';
  type = 'soft' as const;
  weight: number;

  constructor(weight: number = 30) {
    super();
    this.weight = weight;
  }

  isViolated(assignment: CSPAssignment, session?: CourseSession, timeSlot?: TimeSlot): boolean {
    // Soft constraints are never "violated" - they just have costs
    return false;
  }

  getViolationCost(assignment: CSPAssignment): number {
    // Calculate total gap minutes for all sections across all days
    let totalGapCost = 0;
    const sectionSchedules = this.groupSessionsBySection(assignment);

    for (const [section, dailySchedules] of Object.entries(sectionSchedules)) {
      for (const [day, sessions] of Object.entries(dailySchedules)) {
        if (sessions.length <= 1) continue; // No gaps possible with 0-1 sessions

        // Sort sessions by start time
        const sortedSessions = sessions.sort((a, b) => 
          this.timeToMinutes(a.timeSlot.start_time) - this.timeToMinutes(b.timeSlot.start_time)
        );

        // Calculate gaps between consecutive sessions
        for (let i = 0; i < sortedSessions.length - 1; i++) {
          const currentEnd = this.timeToMinutes(sortedSessions[i].timeSlot.end_time);
          const nextStart = this.timeToMinutes(sortedSessions[i + 1].timeSlot.start_time);
          const gapMinutes = nextStart - currentEnd;

          if (gapMinutes > 0) {
            // Penalize gaps, with higher penalty for longer gaps
            totalGapCost += Math.pow(gapMinutes / 60, 1.5) * this.weight;
          }
        }
      }
    }

    return totalGapCost;
  }

  getAffectedSessions(session: CourseSession): string[] {
    // Return all sessions for the same section
    return []; // Will be populated with full session context
  }

  private groupSessionsBySection(assignment: CSPAssignment): Record<string, Record<string, Array<{sessionId: string, session: CourseSession, timeSlot: TimeSlot}>>> {
    const result: Record<string, Record<string, Array<{sessionId: string, session: CourseSession, timeSlot: TimeSlot}>>> = {};

    for (const [sessionId, timeSlot] of Object.entries(assignment)) {
      const session = this.getSessionFromId(sessionId);
      if (!session) continue;

      if (!result[session.section]) {
        result[session.section] = {};
      }
      if (!result[session.section][timeSlot.day]) {
        result[session.section][timeSlot.day] = [];
      }

      result[session.section][timeSlot.day].push({
        sessionId,
        session,
        timeSlot
      });
    }

    return result;
  }

  private getSessionFromId(sessionId: string): CourseSession | null {
    // Will be implemented with full session context
    return null;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

// ==================== BALANCE TEACHER WORKLOAD ====================

export class BalanceTeacherWorkloadConstraint extends Constraint {
  name = 'BalanceTeacherWorkload';
  type = 'soft' as const;
  weight: number;

  constructor(weight: number = 20) {
    super();
    this.weight = weight;
  }

  isViolated(assignment: CSPAssignment): boolean {
    return false; // Soft constraint
  }

  getViolationCost(assignment: CSPAssignment): number {
    const teacherWorkloads = this.calculateTeacherWorkloads(assignment);
    
    if (teacherWorkloads.length === 0) return 0;

    // Calculate workload variance (higher variance = worse balance)
    const totalHours = teacherWorkloads.reduce((sum, w) => sum + w.totalHours, 0);
    const averageHours = totalHours / teacherWorkloads.length;
    
    let variance = 0;
    for (const workload of teacherWorkloads) {
      variance += Math.pow(workload.totalHours - averageHours, 2);
    }
    variance /= teacherWorkloads.length;

    // Also penalize teachers with too many teaching days or too few
    let dayDistributionPenalty = 0;
    for (const workload of teacherWorkloads) {
      if (workload.activeDays > 5) {
        dayDistributionPenalty += (workload.activeDays - 5) * 10; // Penalty for too many days
      }
      if (workload.activeDays < 3 && workload.totalHours > 6) {
        dayDistributionPenalty += (3 - workload.activeDays) * 5; // Penalty for too few days with many hours
      }
    }

    return (Math.sqrt(variance) + dayDistributionPenalty) * this.weight;
  }

  getAffectedSessions(session: CourseSession): string[] {
    // Return all sessions for the same teacher
    return [];
  }

  private calculateTeacherWorkloads(assignment: CSPAssignment): Array<{
    teacherId: number;
    totalHours: number;
    activeDays: number;
    maxDailyHours: number;
    dailyHours: Record<string, number>;
  }> {
    const teacherMap: Record<number, {
      totalHours: number;
      dailyHours: Record<string, number>;
    }> = {};

    for (const [sessionId, timeSlot] of Object.entries(assignment)) {
      const session = this.getSessionFromId(sessionId);
      if (!session) continue;

      if (!teacherMap[session.teacher_id]) {
        teacherMap[session.teacher_id] = {
          totalHours: 0,
          dailyHours: {}
        };
      }

      const hours = session.duration_minutes / 60;
      teacherMap[session.teacher_id].totalHours += hours;
      
      if (!teacherMap[session.teacher_id].dailyHours[timeSlot.day]) {
        teacherMap[session.teacher_id].dailyHours[timeSlot.day] = 0;
      }
      teacherMap[session.teacher_id].dailyHours[timeSlot.day] += hours;
    }

    return Object.entries(teacherMap).map(([teacherId, data]) => ({
      teacherId: parseInt(teacherId),
      totalHours: data.totalHours,
      activeDays: Object.keys(data.dailyHours).length,
      maxDailyHours: Math.max(...Object.values(data.dailyHours)),
      dailyHours: data.dailyHours
    }));
  }

  private getSessionFromId(sessionId: string): CourseSession | null {
    return null; // Will be implemented with full session context
  }
}

// ==================== PREFER MORNING THEORY ====================

export class PreferMorningTheoryConstraint extends Constraint {
  name = 'PreferMorningTheory';
  type = 'soft' as const;
  weight: number;

  constructor(weight: number = 15, private morningEndTime: string = '12:00') {
    super();
    this.weight = weight;
  }

  isViolated(assignment: CSPAssignment): boolean {
    return false; // Soft constraint
  }

  getViolationCost(assignment: CSPAssignment): number {
    let cost = 0;

    for (const [sessionId, timeSlot] of Object.entries(assignment)) {
      const session = this.getSessionFromId(sessionId);
      if (!session || session.session_type !== 'theory') continue;

      const sessionStart = this.timeToMinutes(timeSlot.start_time);
      const morningEnd = this.timeToMinutes(this.morningEndTime);

      // Penalize theory sessions scheduled after morning
      if (sessionStart >= morningEnd) {
        // Higher penalty for later in the day
        const hoursAfterMorning = (sessionStart - morningEnd) / 60;
        cost += Math.pow(hoursAfterMorning, 1.2) * this.weight;
      }
    }

    return cost;
  }

  getAffectedSessions(session: CourseSession): string[] {
    return session.session_type === 'theory' ? [session.id] : [];
  }

  private getSessionFromId(sessionId: string): CourseSession | null {
    return null; // Will be implemented with full session context
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

// ==================== AVOID BACK-TO-BACK LABS ====================

export class AvoidBackToBackLabsConstraint extends Constraint {
  name = 'AvoidBackToBackLabs';
  type = 'soft' as const;
  weight: number;

  constructor(weight: number = 25) {
    super();
    this.weight = weight;
  }

  isViolated(assignment: CSPAssignment): boolean {
    return false; // Soft constraint
  }

  getViolationCost(assignment: CSPAssignment): number {
    let cost = 0;
    const teacherSchedules = this.groupSessionsByTeacherAndDay(assignment);

    for (const [teacherId, dailySchedules] of Object.entries(teacherSchedules)) {
      for (const [day, sessions] of Object.entries(dailySchedules)) {
        const labSessions = sessions.filter(s => s.session.session_type === 'lab');
        
        if (labSessions.length <= 1) continue;

        // Sort lab sessions by start time
        const sortedLabs = labSessions.sort((a, b) => 
          this.timeToMinutes(a.timeSlot.start_time) - this.timeToMinutes(b.timeSlot.start_time)
        );

        // Check for back-to-back labs
        for (let i = 0; i < sortedLabs.length - 1; i++) {
          const currentEnd = this.timeToMinutes(sortedLabs[i].timeSlot.end_time);
          const nextStart = this.timeToMinutes(sortedLabs[i + 1].timeSlot.start_time);
          
          // If labs are back-to-back (no gap or minimal gap)
          if (nextStart - currentEnd <= 15) { // 15 minutes or less
            cost += this.weight;
          }
        }
      }
    }

    return cost;
  }

  getAffectedSessions(session: CourseSession): string[] {
    return session.session_type === 'lab' ? [session.id] : [];
  }

  private groupSessionsByTeacherAndDay(assignment: CSPAssignment): Record<string, Record<string, Array<{sessionId: string, session: CourseSession, timeSlot: TimeSlot}>>> {
    const result: Record<string, Record<string, Array<{sessionId: string, session: CourseSession, timeSlot: TimeSlot}>>> = {};

    for (const [sessionId, timeSlot] of Object.entries(assignment)) {
      const session = this.getSessionFromId(sessionId);
      if (!session) continue;

      const teacherKey = session.teacher_id.toString();
      if (!result[teacherKey]) {
        result[teacherKey] = {};
      }
      if (!result[teacherKey][timeSlot.day]) {
        result[teacherKey][timeSlot.day] = [];
      }

      result[teacherKey][timeSlot.day].push({
        sessionId,
        session,
        timeSlot
      });
    }

    return result;
  }

  private getSessionFromId(sessionId: string): CourseSession | null {
    return null; // Will be implemented with full session context
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

// ==================== MINIMIZE DAILY TRANSITIONS ====================

export class MinimizeDailyTransitionsConstraint extends Constraint {
  name = 'MinimizeDailyTransitions';
  type = 'soft' as const;
  weight: number;

  constructor(weight: number = 10) {
    super();
    this.weight = weight;
  }

  isViolated(assignment: CSPAssignment): boolean {
    return false; // Soft constraint
  }

  getViolationCost(assignment: CSPAssignment): number {
    let cost = 0;
    const sectionSchedules = this.groupSessionsBySection(assignment);

    for (const [section, dailySchedules] of Object.entries(sectionSchedules)) {
      for (const [day, sessions] of Object.entries(dailySchedules)) {
        if (sessions.length <= 1) continue;

        // Sort sessions by start time
        const sortedSessions = sessions.sort((a, b) => 
          this.timeToMinutes(a.timeSlot.start_time) - this.timeToMinutes(b.timeSlot.start_time)
        );

        // Count transitions between different session types or courses
        for (let i = 0; i < sortedSessions.length - 1; i++) {
          const current = sortedSessions[i].session;
          const next = sortedSessions[i + 1].session;

          // Penalize transitions between different courses
          if (current.course_id !== next.course_id) {
            cost += this.weight * 0.5;
          }

          // Penalize transitions between different session types
          if (current.session_type !== next.session_type) {
            cost += this.weight * 0.3;
          }

          // Heavy penalty for theory→lab→theory patterns
          if (i < sortedSessions.length - 2) {
            const afterNext = sortedSessions[i + 2].session;
            if (current.session_type === 'theory' && 
                next.session_type === 'lab' && 
                afterNext.session_type === 'theory') {
              cost += this.weight * 2;
            }
          }
        }
      }
    }

    return cost;
  }

  getAffectedSessions(session: CourseSession): string[] {
    return [session.id]; // All sessions can affect transitions
  }

  private groupSessionsBySection(assignment: CSPAssignment): Record<string, Record<string, Array<{sessionId: string, session: CourseSession, timeSlot: TimeSlot}>>> {
    const result: Record<string, Record<string, Array<{sessionId: string, session: CourseSession, timeSlot: TimeSlot}>>> = {};

    for (const [sessionId, timeSlot] of Object.entries(assignment)) {
      const session = this.getSessionFromId(sessionId);
      if (!session) continue;

      if (!result[session.section]) {
        result[session.section] = {};
      }
      if (!result[session.section][timeSlot.day]) {
        result[session.section][timeSlot.day] = [];
      }

      result[session.section][timeSlot.day].push({
        sessionId,
        session,
        timeSlot
      });
    }

    return result;
  }

  private getSessionFromId(sessionId: string): CourseSession | null {
    return null; // Will be implemented with full session context
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

// ==================== SOFT CONSTRAINT FACTORY ====================

export class SoftConstraintFactory {
  static createStandardSoftConstraints(): Constraint[] {
    return [
      new MinimizeStudentGapsConstraint(30),
      new BalanceTeacherWorkloadConstraint(20),
      new PreferMorningTheoryConstraint(15),
      new AvoidBackToBackLabsConstraint(25),
      new MinimizeDailyTransitionsConstraint(10)
    ];
  }

  static createCustomSoftConstraints(config: any): Constraint[] {
    const constraints: Constraint[] = [];

    if (config.minimize_student_gaps?.enabled) {
      constraints.push(new MinimizeStudentGapsConstraint(
        config.minimize_student_gaps.weight || 30
      ));
    }

    if (config.balance_teacher_workload?.enabled) {
      constraints.push(new BalanceTeacherWorkloadConstraint(
        config.balance_teacher_workload.weight || 20
      ));
    }

    if (config.prefer_morning_theory?.enabled) {
      constraints.push(new PreferMorningTheoryConstraint(
        config.prefer_morning_theory.weight || 15,
        config.prefer_morning_theory.morning_end_time || '12:00'
      ));
    }

    if (config.avoid_back_to_back_labs?.enabled) {
      constraints.push(new AvoidBackToBackLabsConstraint(
        config.avoid_back_to_back_labs.weight || 25
      ));
    }

    if (config.minimize_daily_transitions?.enabled) {
      constraints.push(new MinimizeDailyTransitionsConstraint(
        config.minimize_daily_transitions.weight || 10
      ));
    }

    return constraints;
  }
}