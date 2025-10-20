/**
 * AI Timetable Generator - Main Orchestrator
 * Coordinates CSP solving, constraint management, and multiple solution generation
 */

import {
  TimetableGenerationInput,
  TimetableSolution,
  MultiSolutionResult,
  CSPVariable,
  TimeSlot,
  CourseSession,
  CSPAssignment,
  Constraint,
} from "./types";

import { CSPSolver } from "./cspSolver";
import { HardConstraintFactory } from "./hardConstraints";
import { SoftConstraintFactory } from "./softConstraints";

export class AITimetableGenerator {
  private sessionLookup: Map<string, CourseSession> = new Map();

  // ==================== MAIN GENERATION METHOD ====================

  async generateTimetables(
    input: TimetableGenerationInput
  ): Promise<MultiSolutionResult> {
    const startTime = Date.now();

    console.log("🚀 Starting AI timetable generation");
    console.log("📊 Input Summary:", this.getInputSummary(input));

    try {
      // Step 1: Transform input data into CSP format
      const { variables, timeSlots, sessions } = this.prepareCSPData(input);
      console.log(
        "✅ CSP data prepared:",
        variables.length,
        "variables,",
        timeSlots.length,
        "time slots"
      );

      // Step 2: Generate multiple solutions with different optimization goals
      const solutions = await this.generateMultipleSolutions(
        variables,
        timeSlots,
        sessions,
        input
      );

      // Step 3: Analyze and rank solutions
      const recommendations = this.analyzeSolutions(solutions);

      const result: MultiSolutionResult = {
        success: solutions.length > 0,
        solutions: solutions.slice(0, 3), // Return top 3 solutions
        generation_summary: {
          total_solutions_attempted: 5,
          successful_solutions: solutions.length,
          total_generation_time_ms: Date.now() - startTime,
          input_summary: this.getInputSummary(input),
        },
        recommendations,
      };

      console.log("🎉 AI generation completed:", result.generation_summary);
      return result;
    } catch (error) {
      console.error("❌ AI generation failed:", error);
      return {
        success: false,
        solutions: [],
        generation_summary: {
          total_solutions_attempted: 0,
          successful_solutions: 0,
          total_generation_time_ms: Date.now() - startTime,
          input_summary: this.getInputSummary(input),
        },
        recommendations: {
          best_overall: "",
          best_for_teachers: "",
          best_for_students: "",
          reasoning:
            "Generation failed: " +
            (error instanceof Error ? error.message : "Unknown error"),
        },
      };
    }
  }

  // ==================== DATA PREPARATION ====================

  private prepareCSPData(input: TimetableGenerationInput): {
    variables: CSPVariable[];
    timeSlots: TimeSlot[];
    sessions: CourseSession[];
  } {
    // Generate time slots from configuration
    const timeSlots = this.generateTimeSlots(input.timeConfiguration);

    // Convert course assignments to sessions
    const sessions = this.generateSessions(input.courseAssignments);

    // 🚨 CRITICAL CHECK: Verify problem is solvable
    const uniqueSections = new Set(sessions.map((s) => s.section)).size;
    const sessionsPerSection = sessions.length / uniqueSections;
    const requiredSlotsPerSection = Math.ceil(sessionsPerSection);

    console.log("📊 Problem Size Check:");
    console.log(`  - Total sessions: ${sessions.length}`);
    console.log(`  - Unique sections: ${uniqueSections}`);
    console.log(`  - Sessions per section: ~${sessionsPerSection.toFixed(1)}`);
    console.log(`  - Available time slots: ${timeSlots.length}`);
    console.log(`  - Required slots per section: ${requiredSlotsPerSection}`);

    if (requiredSlotsPerSection > timeSlots.length) {
      console.error("🚨 OVERCONSTRAINED PROBLEM!");
      console.error(`  ❌ Need ${requiredSlotsPerSection} slots per section`);
      console.error(`  ❌ Only ${timeSlots.length} slots available`);
      console.error(
        "  💡 Solution: Increase working hours, add more days, or reduce classes per week"
      );
      throw new Error(
        `Problem is overconstrained: Need ${requiredSlotsPerSection} slots but only ${timeSlots.length} available. ` +
          `Please increase working hours (current: ${input.timeConfiguration.start_time}-${input.timeConfiguration.end_time}), ` +
          `add more working days, or reduce classes per week.`
      );
    }

    // Create CSP variables (each session needs a time slot)
    const variables = this.createCSPVariables(sessions, timeSlots);

    // Store session lookup for constraints
    this.sessionLookup.clear();
    sessions.forEach((session) => this.sessionLookup.set(session.id, session));

    return { variables, timeSlots, sessions };
  }

  private generateTimeSlots(
    timeConfig: TimetableGenerationInput["timeConfiguration"]
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const startMinutes = this.timeToMinutes(timeConfig.start_time);
    const endMinutes = this.timeToMinutes(timeConfig.end_time);
    const duration = timeConfig.class_duration;
    const lunchStart = this.timeToMinutes(timeConfig.lunch_break.start);
    const lunchEnd = this.timeToMinutes(timeConfig.lunch_break.end);

    for (const day of timeConfig.working_days) {
      let currentMinutes = startMinutes;

      while (currentMinutes + duration <= endMinutes) {
        const slotEnd = currentMinutes + duration;

        // Skip lunch break slots
        if (!(currentMinutes < lunchEnd && slotEnd > lunchStart)) {
          const slot: TimeSlot = {
            id: `${day.substring(0, 3).toUpperCase()}_${this.minutesToTime(
              currentMinutes
            )}`,
            day: day,
            start_time: this.minutesToTime(currentMinutes),
            end_time: this.minutesToTime(slotEnd),
            duration_minutes: duration,
            is_lunch_break: false,
          };
          slots.push(slot);
        }

        currentMinutes += duration;
      }
    }

    console.log("⏰ Generated", slots.length, "time slots");
    return slots;
  }

  private generateSessions(
    courseAssignments: TimetableGenerationInput["courseAssignments"],
    targetSections?: string[]
  ): CourseSession[] {
    const sessions: CourseSession[] = [];

    for (const course of courseAssignments) {
      // Filter sections if targetSections is provided (for per-section generation)
      const sectionsToSchedule = targetSections || course.sections;

      for (const section of sectionsToSchedule) {
        // Generate theory sessions (only if teacher is assigned and classes > 0)
        if (
          course.sessions.theory.teacher_id &&
          course.sessions.theory.classes_per_week > 0
        ) {
          for (let i = 1; i <= course.sessions.theory.classes_per_week; i++) {
            sessions.push({
              id: `${course.course_code}_Theory_${section}_${i}`,
              course_id: course.course_id,
              course_code: course.course_code,
              course_name: course.course_name,
              session_type: "theory",
              section: section,
              teacher_id: course.sessions.theory.teacher_id,
              teacher_name: course.sessions.theory.teacher_name,
              department_id: course.department_id,
              semester: course.semester,
              duration_minutes: course.sessions.theory.duration_minutes,
              classes_per_week: course.sessions.theory.classes_per_week,
              session_number: i,
            });
          }
        }

        // Generate lab sessions (only if teacher is assigned and classes > 0)
        if (
          course.sessions.lab.teacher_id &&
          course.sessions.lab.classes_per_week > 0
        ) {
          for (let i = 1; i <= course.sessions.lab.classes_per_week; i++) {
            sessions.push({
              id: `${course.course_code}_Lab_${section}_${i}`,
              course_id: course.course_id,
              course_code: course.course_code,
              course_name: course.course_name,
              session_type: "lab",
              section: section,
              teacher_id: course.sessions.lab.teacher_id,
              teacher_name: course.sessions.lab.teacher_name,
              department_id: course.department_id,
              semester: course.semester,
              duration_minutes: course.sessions.lab.duration_minutes,
              classes_per_week: course.sessions.lab.classes_per_week,
              session_number: i,
            });
          }
        }

        // Generate tutorial sessions
        for (let i = 1; i <= course.sessions.tutorial.classes_per_week; i++) {
          sessions.push({
            id: `${course.course_code}_Tutorial_${section}_${i}`,
            course_id: course.course_id,
            course_code: course.course_code,
            course_name: course.course_name,
            session_type: "tutorial",
            section: section,
            teacher_id: course.sessions.tutorial.teacher_id,
            teacher_name: course.sessions.tutorial.teacher_name,
            department_id: course.department_id,
            semester: course.semester,
            duration_minutes: course.sessions.tutorial.duration_minutes,
            classes_per_week: course.sessions.tutorial.classes_per_week,
            session_number: i,
          });
        }
      }
    }

    console.log("📚 Generated", sessions.length, "sessions");
    return sessions;
  }

  private createCSPVariables(
    sessions: CourseSession[],
    timeSlots: TimeSlot[]
  ): CSPVariable[] {
    return sessions.map((session) => ({
      id: session.id,
      session: session,
      domain: [...timeSlots], // Each session can potentially be assigned to any time slot
    }));
  }

  // ==================== MULTIPLE SOLUTION GENERATION ====================

  private async generateMultipleSolutions(
    variables: CSPVariable[],
    timeSlots: TimeSlot[],
    sessions: CourseSession[],
    input: TimetableGenerationInput
  ): Promise<TimetableSolution[]> {
    const solutions: TimetableSolution[] = [];

    // Generate 5 different solutions with different optimization priorities
    const optimizationConfigs = [
      {
        name: "Teacher-Optimized",
        goal: "teacher_workload",
        description: "Balanced teacher workload, concentrated schedules",
      },
      {
        name: "Student-Optimized",
        goal: "student_convenience",
        description: "Minimal gaps for students, convenient daily schedules",
      },
      {
        name: "Balanced Schedule",
        goal: "balanced",
        description: "Good compromise between teacher and student preferences",
      },
      {
        name: "Morning-Focused",
        goal: "morning_theory",
        description: "Theory classes in morning, labs in afternoon",
      },
      {
        name: "Compact Schedule",
        goal: "minimize_transitions",
        description: "Minimal daily transitions, efficient resource use",
      },
    ];

    for (let index = 0; index < optimizationConfigs.length; index++) {
      const config = optimizationConfigs[index];
      console.log(`🎯 Generating solution ${index + 1}: ${config.name}`);

      try {
        const solution = await this.generateSingleSolution(
          variables,
          sessions,
          input,
          config.goal,
          config.name,
          config.description
        );

        if (solution) {
          solutions.push(solution);
          console.log(
            `✅ Generated ${
              config.name
            } - Quality: ${solution.quality.overall_score.toFixed(1)}`
          );
        } else {
          console.log(`❌ Failed to generate ${config.name}`);
        }
      } catch (error) {
        console.error(`❌ Error generating ${config.name}:`, error);
      }
    }

    return solutions;
  }

  private async generateSingleSolution(
    variables: CSPVariable[],
    sessions: CourseSession[],
    input: TimetableGenerationInput,
    optimizationGoal: string,
    solutionName: string,
    description: string
  ): Promise<TimetableSolution | null> {
    // Create constraints based on optimization goal
    const constraints = this.createConstraints(input, optimizationGoal);

    // Create fresh variable copies with full domains
    const freshVariables = variables.map((v) => ({
      ...v,
      domain: [...v.domain],
    }));

    // Initialize CSP solver
    const solver = new CSPSolver(freshVariables, constraints);

    // Solve the CSP
    const { assignment, trace } = await solver.solve();

    if (!assignment || Object.keys(assignment).length === 0) {
      return null;
    }

    // Calculate quality metrics
    const quality = this.calculateQualityMetrics(
      assignment,
      constraints,
      sessions
    );

    // Generate statistics
    const statistics = this.generateStatistics(assignment, sessions);

    // Identify issues
    const issues = this.identifyIssues(assignment, constraints, sessions);

    return {
      id: `solution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: solutionName,
      description: description,
      schedule: Object.entries(assignment).map(([sessionId, timeSlot]) => ({
        session_id: sessionId,
        time_slot_id: timeSlot.id,
      })),
      quality,
      statistics,
      issues,
      generation_info: {
        algorithm: "CSP_Backtracking",
        generation_time_ms: trace.solution_time_ms,
        iterations: trace.steps.length,
        optimization_goal: optimizationGoal,
        timestamp: new Date(),
      },
    };
  }

  // ==================== CONSTRAINT CREATION ====================

  private createConstraints(
    input: TimetableGenerationInput,
    optimizationGoal: string
  ): Constraint[] {
    const constraints: Constraint[] = [];

    // Add hard constraints
    const hardConstraints = HardConstraintFactory.createStandardHardConstraints(
      {
        start: input.timeConfiguration.start_time,
        end: input.timeConfiguration.end_time,
        days: input.timeConfiguration.working_days,
      },
      {
        start: input.timeConfiguration.lunch_break.start,
        end: input.timeConfiguration.lunch_break.end,
      }
    );
    constraints.push(...hardConstraints);

    // Add soft constraints based on optimization goal
    let softConstraints = SoftConstraintFactory.createStandardSoftConstraints();

    // Adjust weights based on optimization goal
    softConstraints = this.adjustConstraintWeights(
      softConstraints,
      optimizationGoal
    );
    constraints.push(...softConstraints);

    return constraints;
  }

  private adjustConstraintWeights(
    constraints: Constraint[],
    goal: string
  ): Constraint[] {
    return constraints.map((constraint) => {
      // Adjust weight based on optimization goal
      switch (goal) {
        case "teacher_workload":
          if (constraint.name === "BalanceTeacherWorkload")
            constraint.weight *= 2;
          if (constraint.name === "AvoidBackToBackLabs")
            constraint.weight *= 1.5;
          break;

        case "student_convenience":
          if (constraint.name === "MinimizeStudentGaps") constraint.weight *= 2;
          if (constraint.name === "MinimizeDailyTransitions")
            constraint.weight *= 1.5;
          break;

        case "morning_theory":
          if (constraint.name === "PreferMorningTheory") constraint.weight *= 3;
          break;

        case "minimize_transitions":
          if (constraint.name === "MinimizeDailyTransitions")
            constraint.weight *= 2;
          break;

        case "balanced":
        default:
          // Keep standard weights
          break;
      }

      return constraint;
    });
  }

  // ==================== QUALITY METRICS ====================

  private calculateQualityMetrics(
    assignment: CSPAssignment,
    constraints: Constraint[],
    sessions: CourseSession[]
  ): TimetableSolution["quality"] {
    let hardViolations = 0;
    let softCost = 0;

    for (const constraint of constraints) {
      if (constraint.type === "hard") {
        // Count hard violations
        for (const [sessionId, timeSlot] of Object.entries(assignment)) {
          const session = this.sessionLookup.get(sessionId);
          if (session && constraint.isViolated(assignment, session, timeSlot)) {
            hardViolations++;
          }
        }
      } else {
        // Accumulate soft constraint costs
        softCost += constraint.getViolationCost(assignment);
      }
    }

    const feasibility_score =
      hardViolations === 0 ? 100 : Math.max(0, 100 - hardViolations * 10);
    const optimization_score = Math.max(0, 100 - softCost / 10); // Normalize soft cost

    return {
      feasibility_score,
      optimization_score,
      teacher_satisfaction: this.calculateTeacherSatisfaction(
        assignment,
        sessions
      ),
      student_convenience: this.calculateStudentConvenience(
        assignment,
        sessions
      ),
      resource_utilization: this.calculateResourceUtilization(
        assignment,
        sessions
      ),
      overall_score:
        feasibility_score * 0.4 +
        optimization_score * 0.3 +
        this.calculateTeacherSatisfaction(assignment, sessions) * 0.15 +
        this.calculateStudentConvenience(assignment, sessions) * 0.15,
    };
  }

  private calculateTeacherSatisfaction(
    assignment: CSPAssignment,
    sessions: CourseSession[]
  ): number {
    // Implementation would calculate teacher workload balance, schedule compactness, etc.
    return 75; // Placeholder
  }

  private calculateStudentConvenience(
    assignment: CSPAssignment,
    sessions: CourseSession[]
  ): number {
    // Implementation would calculate gap minimization, daily balance, etc.
    return 80; // Placeholder
  }

  private calculateResourceUtilization(
    assignment: CSPAssignment,
    sessions: CourseSession[]
  ): number {
    // Implementation would calculate room usage efficiency, time slot utilization, etc.
    return 85; // Placeholder
  }

  // ==================== UTILITY METHODS ====================

  private generateStatistics(
    assignment: CSPAssignment,
    sessions: CourseSession[]
  ): TimetableSolution["statistics"] {
    return {
      total_sessions: sessions.length,
      sessions_scheduled: Object.keys(assignment).length,
      hard_violations: 0, // Would be calculated
      soft_violations: 0, // Would be calculated
      teacher_workload: [], // Would be calculated
      student_schedule: [], // Would be calculated
    };
  }

  private identifyIssues(
    assignment: CSPAssignment,
    constraints: Constraint[],
    sessions: CourseSession[]
  ): TimetableSolution["issues"] {
    return {
      hard_violations: [],
      soft_violations: [],
      warnings: [],
    };
  }

  private analyzeSolutions(solutions: TimetableSolution[]) {
    if (solutions.length === 0) {
      return {
        best_overall: "",
        best_for_teachers: "",
        best_for_students: "",
        reasoning: "No solutions generated",
      };
    }

    const bestOverall = solutions.reduce((best, current) =>
      current.quality.overall_score > best.quality.overall_score
        ? current
        : best
    );

    const bestForTeachers = solutions.reduce((best, current) =>
      current.quality.teacher_satisfaction > best.quality.teacher_satisfaction
        ? current
        : best
    );

    const bestForStudents = solutions.reduce((best, current) =>
      current.quality.student_convenience > best.quality.student_convenience
        ? current
        : best
    );

    return {
      best_overall: bestOverall.id,
      best_for_teachers: bestForTeachers.id,
      best_for_students: bestForStudents.id,
      reasoning: `Analyzed ${
        solutions.length
      } solutions. Best overall score: ${bestOverall.quality.overall_score.toFixed(
        1
      )}`,
    };
  }

  private getInputSummary(input: TimetableGenerationInput) {
    const totalSessions = input.courseAssignments.reduce((sum, course) => {
      return (
        sum +
        course.sections.length *
          (course.sessions.theory.classes_per_week +
            course.sessions.lab.classes_per_week +
            course.sessions.tutorial.classes_per_week)
      );
    }, 0);

    const uniqueTeachers = new Set([
      ...input.courseAssignments.map((c) => c.sessions.theory.teacher_id),
      ...input.courseAssignments.map((c) => c.sessions.lab.teacher_id),
      ...input.courseAssignments.map((c) => c.sessions.tutorial.teacher_id),
    ]);

    const availableSlots = this.calculateAvailableTimeSlots(
      input.timeConfiguration
    );

    return {
      total_courses: input.courseAssignments.length,
      total_sessions: totalSessions,
      total_teachers: uniqueTeachers.size,
      total_sections: input.courseAssignments.reduce(
        (sum, course) => sum + course.sections.length,
        0
      ),
      available_time_slots: availableSlots,
    };
  }

  private calculateAvailableTimeSlots(
    timeConfig: TimetableGenerationInput["timeConfiguration"]
  ): number {
    const dailySlots = Math.floor(
      (this.timeToMinutes(timeConfig.end_time) -
        this.timeToMinutes(timeConfig.start_time) -
        (this.timeToMinutes(timeConfig.lunch_break.end) -
          this.timeToMinutes(timeConfig.lunch_break.start))) /
        timeConfig.class_duration
    );
    return dailySlots * timeConfig.working_days.length;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  }
}
