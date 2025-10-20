/**
 * AI Timetable Generator - Hard Constraints
 * Essential constraints that MUST be satisfied for a valid timetable
 */

import { Constraint, CSPAssignment, CourseSession, TimeSlot } from './types';

// ==================== NO TEACHER CLASH ====================

export class NoTeacherClashConstraint extends Constraint {
  name = 'NoTeacherClash';
  type = 'hard' as const;
  weight = 1000; // Maximum weight for hard constraints

  isViolated(assignment: CSPAssignment, session?: CourseSession, timeSlot?: TimeSlot): boolean {
    if (!session || !timeSlot) return false;

    // Check if any other session has the same teacher at the same time
    for (const [sessionId, assignedSlot] of Object.entries(assignment)) {
      if (sessionId === session.id) continue; // Skip the current session
      
      // Get session details from sessionId (format: "BCS210_Theory_A_1")
      const [courseCode, sessionType, sectionName, sessionNum] = sessionId.split('_');
      
      // We need to get teacher info - for now we'll check time overlap
      if (this.timeSlotsOverlap(assignedSlot, timeSlot)) {
        // Need to check if sessions have the same teacher
        // This will be enhanced when we have full session data
        const existingSession = this.getSessionFromId(sessionId);
        if (existingSession && existingSession.teacher_id === session.teacher_id) {
          return true; // Violation: Same teacher, overlapping time
        }
      }
    }

    return false;
  }

  getViolationCost(assignment: CSPAssignment): number {
    // Hard constraints return maximum cost when violated
    return this.isAnyViolated(assignment) ? this.weight : 0;
  }

  getAffectedSessions(session: CourseSession): string[] {
    // Return all sessions with the same teacher
    // This would be populated from the full session list
    return [];
  }

  private timeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
    if (slot1.day !== slot2.day) return false;
    
    const start1 = this.timeToMinutes(slot1.start_time);
    const end1 = this.timeToMinutes(slot1.end_time);
    const start2 = this.timeToMinutes(slot2.start_time);
    const end2 = this.timeToMinutes(slot2.end_time);
    
    return start1 < end2 && start2 < end1;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private isAnyViolated(assignment: CSPAssignment): boolean {
    const sessions = Object.keys(assignment);
    for (let i = 0; i < sessions.length; i++) {
      for (let j = i + 1; j < sessions.length; j++) {
        const session1 = this.getSessionFromId(sessions[i]);
        const session2 = this.getSessionFromId(sessions[j]);
        
        if (session1 && session2 && 
            session1.teacher_id === session2.teacher_id &&
            this.timeSlotsOverlap(assignment[sessions[i]], assignment[sessions[j]])) {
          return true;
        }
      }
    }
    return false;
  }

  private getSessionFromId(sessionId: string): CourseSession | null {
    // This would be enhanced to get full session data
    // For now, return null - will be implemented with full context
    return null;
  }
}

// ==================== NO SECTION CLASH ====================

export class NoSectionClashConstraint extends Constraint {
  name = 'NoSectionClash';
  type = 'hard' as const;
  weight = 1000;

  isViolated(assignment: CSPAssignment, session?: CourseSession, timeSlot?: TimeSlot): boolean {
    if (!session || !timeSlot) return false;

    // Check if any other session for the same section overlaps in time
    for (const [sessionId, assignedSlot] of Object.entries(assignment)) {
      if (sessionId === session.id) continue;
      
      const existingSession = this.getSessionFromId(sessionId);
      if (existingSession && 
          existingSession.section === session.section &&
          this.timeSlotsOverlap(assignedSlot, timeSlot)) {
        return true; // Violation: Same section, overlapping time
      }
    }

    return false;
  }

  getViolationCost(assignment: CSPAssignment): number {
    return this.isAnyViolated(assignment) ? this.weight : 0;
  }

  getAffectedSessions(session: CourseSession): string[] {
    // Return all sessions for the same section
    return [];
  }

  private timeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
    if (slot1.day !== slot2.day) return false;
    
    const start1 = this.timeToMinutes(slot1.start_time);
    const end1 = this.timeToMinutes(slot1.end_time);
    const start2 = this.timeToMinutes(slot2.start_time);
    const end2 = this.timeToMinutes(slot2.end_time);
    
    return start1 < end2 && start2 < end1;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private isAnyViolated(assignment: CSPAssignment): boolean {
    const sessions = Object.keys(assignment);
    for (let i = 0; i < sessions.length; i++) {
      for (let j = i + 1; j < sessions.length; j++) {
        const session1 = this.getSessionFromId(sessions[i]);
        const session2 = this.getSessionFromId(sessions[j]);
        
        if (session1 && session2 && 
            session1.section === session2.section &&
            this.timeSlotsOverlap(assignment[sessions[i]], assignment[sessions[j]])) {
          return true;
        }
      }
    }
    return false;
  }

  private getSessionFromId(sessionId: string): CourseSession | null {
    return null; // Will be implemented with full context
  }
}

// ==================== RESPECT WORKING HOURS ====================

export class RespectWorkingHoursConstraint extends Constraint {
  name = 'RespectWorkingHours';
  type = 'hard' as const;
  weight = 1000;

  constructor(
    private workingStartTime: string = '08:00',
    private workingEndTime: string = '17:00',
    private workingDays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  ) {
    super();
  }

  isViolated(assignment: CSPAssignment, session?: CourseSession, timeSlot?: TimeSlot): boolean {
    if (!timeSlot) return false;

    // Check if time slot is within working hours
    const slotStart = this.timeToMinutes(timeSlot.start_time);
    const slotEnd = this.timeToMinutes(timeSlot.end_time);
    const workStart = this.timeToMinutes(this.workingStartTime);
    const workEnd = this.timeToMinutes(this.workingEndTime);

    // Check time bounds
    if (slotStart < workStart || slotEnd > workEnd) {
      return true;
    }

    // Check working days
    if (!this.workingDays.includes(timeSlot.day)) {
      return true;
    }

    return false;
  }

  getViolationCost(assignment: CSPAssignment): number {
    let violations = 0;
    for (const [sessionId, timeSlot] of Object.entries(assignment)) {
      if (this.isViolated(assignment, undefined, timeSlot)) {
        violations++;
      }
    }
    return violations * this.weight;
  }

  getAffectedSessions(session: CourseSession): string[] {
    return []; // All sessions are potentially affected
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

// ==================== RESPECT LUNCH BREAK ====================

export class RespectLunchBreakConstraint extends Constraint {
  name = 'RespectLunchBreak';
  type = 'hard' as const;
  weight = 1000;

  constructor(
    private lunchStartTime: string = '12:00',
    private lunchEndTime: string = '13:00'
  ) {
    super();
  }

  isViolated(assignment: CSPAssignment, session?: CourseSession, timeSlot?: TimeSlot): boolean {
    if (!timeSlot) return false;

    // Check if time slot overlaps with lunch break
    const slotStart = this.timeToMinutes(timeSlot.start_time);
    const slotEnd = this.timeToMinutes(timeSlot.end_time);
    const lunchStart = this.timeToMinutes(this.lunchStartTime);
    const lunchEnd = this.timeToMinutes(this.lunchEndTime);

    // Check for overlap
    return slotStart < lunchEnd && slotEnd > lunchStart;
  }

  getViolationCost(assignment: CSPAssignment): number {
    let violations = 0;
    for (const [sessionId, timeSlot] of Object.entries(assignment)) {
      if (this.isViolated(assignment, undefined, timeSlot)) {
        violations++;
      }
    }
    return violations * this.weight;
  }

  getAffectedSessions(session: CourseSession): string[] {
    return []; // All sessions are potentially affected
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

// ==================== NO ROOM CLASH ====================

export class NoRoomClashConstraint extends Constraint {
  name = 'NoRoomClash';
  type = 'hard' as const;
  weight = 1000;

  isViolated(assignment: CSPAssignment, session?: CourseSession, timeSlot?: TimeSlot): boolean {
    if (!session || !timeSlot) return false;

    // Check if any other session uses the same room at the same time
    // This would be enhanced when room assignments are implemented
    for (const [sessionId, assignedSlot] of Object.entries(assignment)) {
      if (sessionId === session.id) continue;
      
      const existingSession = this.getSessionFromId(sessionId);
      if (existingSession && 
          existingSession.session_type === 'lab' && 
          session.session_type === 'lab' &&
          this.timeSlotsOverlap(assignedSlot, timeSlot)) {
        return true; // Violation: Both labs, overlapping time
      }
    }

    return false;
  }

  getViolationCost(assignment: CSPAssignment): number {
    return this.isAnyViolated(assignment) ? this.weight : 0;
  }

  getAffectedSessions(session: CourseSession): string[] {
    // Return sessions that might conflict (same room type)
    return [];
  }

  private timeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
    if (slot1.day !== slot2.day) return false;
    
    const start1 = this.timeToMinutes(slot1.start_time);
    const end1 = this.timeToMinutes(slot1.end_time);
    const start2 = this.timeToMinutes(slot2.start_time);
    const end2 = this.timeToMinutes(slot2.end_time);
    
    return start1 < end2 && start2 < end1;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private isAnyViolated(assignment: CSPAssignment): boolean {
    const sessions = Object.keys(assignment);
    for (let i = 0; i < sessions.length; i++) {
      for (let j = i + 1; j < sessions.length; j++) {
        const session1 = this.getSessionFromId(sessions[i]);
        const session2 = this.getSessionFromId(sessions[j]);
        
        if (session1 && session2 && 
            session1.session_type === 'lab' && session2.session_type === 'lab' &&
            this.timeSlotsOverlap(assignment[sessions[i]], assignment[sessions[j]])) {
          return true;
        }
      }
    }
    return false;
  }

  private getSessionFromId(sessionId: string): CourseSession | null {
    return null; // Will be implemented with full context
  }
}

// ==================== CONSTRAINT FACTORY ====================

export class HardConstraintFactory {
  static createStandardHardConstraints(
    workingHours: { start: string; end: string; days: string[] },
    lunchBreak: { start: string; end: string }
  ): Constraint[] {
    return [
      new NoTeacherClashConstraint(),
      new NoSectionClashConstraint(),
      new RespectWorkingHoursConstraint(
        workingHours.start, 
        workingHours.end, 
        workingHours.days
      ),
      new RespectLunchBreakConstraint(
        lunchBreak.start, 
        lunchBreak.end
      ),
      new NoRoomClashConstraint()
    ];
  }

  static createCustomHardConstraints(config: any): Constraint[] {
    const constraints: Constraint[] = [];

    if (config.no_teacher_clash) {
      constraints.push(new NoTeacherClashConstraint());
    }

    if (config.no_section_clash) {
      constraints.push(new NoSectionClashConstraint());
    }

    if (config.respect_working_hours) {
      constraints.push(new RespectWorkingHoursConstraint(
        config.working_hours?.start || '08:00',
        config.working_hours?.end || '17:00',
        config.working_hours?.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      ));
    }

    if (config.respect_lunch_break) {
      constraints.push(new RespectLunchBreakConstraint(
        config.lunch_break?.start || '12:00',
        config.lunch_break?.end || '13:00'
      ));
    }

    if (config.no_room_clash) {
      constraints.push(new NoRoomClashConstraint());
    }

    return constraints;
  }
}