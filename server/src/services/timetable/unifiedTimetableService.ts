/**
 * Unified Timetable Generation Service
 * Provides both CSP and AI-based generation methods
 * Handles multiple departments and sections
 * Supports large-scale generation with multi-key AI processing
 */

import { AdvancedCSPSolver } from './advancedCSPSolver';
import { AITimetableGenerator } from './aiTimetableGenerator';
import { MultiKeyAIManager } from './multiKeyAIManager';
import {
  TimetableGenerationRequest,
  TimetableSolution,
  GenerationResult,
  GenerationPreferences,
  TimeConfiguration,
} from './types';

export type GenerationMethod = 'csp' | 'ai' | 'hybrid' | 'auto';

interface UnifiedGenerationOptions {
  method: GenerationMethod;
  cspConfig?: {
    maxTimeMs?: number;
    maxBacktracks?: number;
    enableAC3?: boolean;
  };
  aiConfig?: {
    model?: string;
    temperature?: number;
    useMultiKey?: boolean;  // Enable multi-key processing for large requests
  };
  // If hybrid, which method to prefer
  hybridPreference?: 'csp_primary' | 'ai_primary';
  // Threshold for switching to multi-key processing
  largeScaleThreshold?: number;
}

const DEFAULT_OPTIONS: UnifiedGenerationOptions = {
  method: 'auto',
  hybridPreference: 'csp_primary',
  largeScaleThreshold: 10,  // More than 10 sections triggers multi-key
};

export class UnifiedTimetableService {
  private aiGenerator: AITimetableGenerator;
  private multiKeyManager: MultiKeyAIManager;

  constructor() {
    this.aiGenerator = new AITimetableGenerator();
    this.multiKeyManager = new MultiKeyAIManager();
  }

  /**
   * Generate timetables using the specified method
   */
  async generate(
    request: TimetableGenerationRequest,
    options: Partial<UnifiedGenerationOptions> = {}
  ): Promise<GenerationResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎓 UNIFIED TIMETABLE GENERATION SERVICE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📋 Method: ${opts.method}`);
    console.log(`🏛️  Departments: ${request.departments.map(d => d.name).join(', ')}`);
    console.log(`📚 Sections: ${request.sections.map(s => s.section_name).join(', ')}`);
    console.log(`📖 Courses: ${request.course_assignments.length}`);
    console.log(`🔑 Multi-Key Available: ${this.multiKeyManager.getAvailableKeyCount()} keys`);
    console.log('═══════════════════════════════════════════════════════════');

    // Validate request
    const validation = this.validateRequest(request);
    if (!validation.valid) {
      return {
        success: false,
        method: opts.method === 'auto' ? 'csp' : opts.method,
        solutions: [],
        best_solution_id: null,
        generation_summary: {
          total_attempts: 0,
          successful: 0,
          failed: 1,
          total_time_ms: 0,
          method_details: 'Request validation failed',
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

    // Determine actual method
    let actualMethod = opts.method;
    if (actualMethod === 'auto') {
      actualMethod = this.determineOptimalMethod(request);
      console.log(`🤖 Auto-selected method: ${actualMethod}`);
    }

    switch (actualMethod) {
      case 'csp':
        return this.generateWithCSP(request, opts);
      
      case 'ai':
        return this.generateWithAI(request, opts);
      
      case 'hybrid':
        return this.generateHybrid(request, opts);
      
      default:
        return this.generateWithCSP(request, opts);
    }
  }

  /**
   * Generate using CSP solver only
   */
  async generateWithCSP(
    request: TimetableGenerationRequest,
    options: Partial<UnifiedGenerationOptions> = {}
  ): Promise<GenerationResult> {
    console.log('\n🧮 Starting CSP-based generation...');
    
    const solver = new AdvancedCSPSolver(request, options.cspConfig);
    const result = await solver.solve();
    
    console.log(`✅ CSP generation complete: ${result.solutions.length} solutions`);
    return result;
  }

  /**
   * Generate using AI (Gemini) only
   * Automatically uses multi-key processing for large requests
   */
  async generateWithAI(
    request: TimetableGenerationRequest,
    options: Partial<UnifiedGenerationOptions> = {}
  ): Promise<GenerationResult> {
    const sectionCount = request.sections.length;
    const threshold = options.largeScaleThreshold || DEFAULT_OPTIONS.largeScaleThreshold || 10;
    const useMultiKey = options.aiConfig?.useMultiKey ?? (sectionCount > threshold);

    console.log('\n🤖 Starting AI-based generation...');
    console.log(`   Sections: ${sectionCount}, Threshold: ${threshold}, Multi-Key: ${useMultiKey}`);
    
    // Check availability
    if (!this.aiGenerator.isAvailable() && !this.multiKeyManager.isAvailable()) {
      console.log('⚠️ AI not available, falling back to CSP');
      return this.generateWithCSP(request, options);
    }

    // Use multi-key for large requests
    if (useMultiKey && this.multiKeyManager.isAvailable()) {
      console.log(`🔑 Using Multi-Key AI Manager (${this.multiKeyManager.getAvailableKeyCount()} keys)`);
      const result = await this.multiKeyManager.generateLargeScale(request);
      console.log(`✅ Multi-Key AI generation complete: ${result.solutions.length} solutions`);
      return result;
    }

    // Use single AI generator for smaller requests
    const result = await this.aiGenerator.generate(request);
    console.log(`✅ AI generation complete: ${result.solutions.length} solutions`);
    return result;
  }

  /**
   * Generate using hybrid approach (both CSP and AI)
   */
  async generateHybrid(
    request: TimetableGenerationRequest,
    options: Partial<UnifiedGenerationOptions> = {}
  ): Promise<GenerationResult> {
    console.log('\n🔀 Starting hybrid generation (CSP + AI)...');
    
    const startTime = Date.now();
    const allSolutions: TimetableSolution[] = [];
    const errors: string[] = [];

    // Generate with CSP
    console.log('\n--- Phase 1: CSP Generation ---');
    const cspResult = await this.generateWithCSP(request, options);
    if (cspResult.success) {
      allSolutions.push(...cspResult.solutions);
    } else if (cspResult.errors) {
      errors.push(...cspResult.errors);
    }

    // Generate with AI if available
    if (this.aiGenerator.isAvailable()) {
      console.log('\n--- Phase 2: AI Generation ---');
      const aiResult = await this.generateWithAI(request, options);
      if (aiResult.success) {
        allSolutions.push(...aiResult.solutions);
      } else if (aiResult.errors) {
        errors.push(...aiResult.errors);
      }
    } else {
      console.log('⚠️ AI generation skipped (not available)');
    }

    // Rank and select best solutions
    const rankedSolutions = this.rankSolutions(allSolutions);
    const topSolutions = rankedSolutions.slice(0, 5); // Top 5 solutions

    // Analyze and recommend
    const recommendations = this.analyzeAndRecommend(topSolutions);

    return {
      success: topSolutions.length > 0,
      method: 'hybrid',
      solutions: topSolutions,
      best_solution_id: recommendations.best_overall || null,
      generation_summary: {
        total_attempts: (cspResult.generation_summary?.total_attempts || 0) + 3,
        successful: topSolutions.length,
        failed: (cspResult.generation_summary?.failed || 0) + 
                (allSolutions.length - topSolutions.length),
        total_time_ms: Date.now() - startTime,
        method_details: `Hybrid: ${cspResult.solutions.length} CSP + ${allSolutions.length - cspResult.solutions.length} AI solutions`,
      },
      recommendations,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Determine the optimal generation method based on problem characteristics
   */
  private determineOptimalMethod(request: TimetableGenerationRequest): GenerationMethod {
    // Calculate problem complexity
    const totalSessions = this.countTotalSessions(request);
    const uniqueSections = request.sections.length;
    const uniqueDepartments = request.departments.length;
    const workingDays = request.time_config.working_days.length;
    
    // Estimate available slots
    const slotsPerDay = this.estimateSlotsPerDay(request.time_config);
    const totalSlots = slotsPerDay * workingDays;

    const complexity = (totalSessions * uniqueSections) / totalSlots;

    console.log(`📊 Problem complexity analysis:`);
    console.log(`   - Total sessions: ${totalSessions}`);
    console.log(`   - Sections: ${uniqueSections}`);
    console.log(`   - Departments: ${uniqueDepartments}`);
    console.log(`   - Available slots: ${totalSlots}`);
    console.log(`   - Complexity score: ${complexity.toFixed(2)}`);

    // Decision logic
    if (complexity < 0.3) {
      // Simple problem - CSP is fast enough
      return 'csp';
    } else if (complexity < 0.7) {
      // Medium complexity - try CSP first
      return 'csp';
    } else if (complexity < 1.0) {
      // Complex - hybrid approach
      return this.aiGenerator.isAvailable() ? 'hybrid' : 'csp';
    } else {
      // Very complex - might be over-constrained
      // Use CSP to detect if solvable
      return 'csp';
    }
  }

  /**
   * Validate the generation request
   */
  private validateRequest(request: TimetableGenerationRequest): { valid: boolean; message: string } {
    if (!request.departments || request.departments.length === 0) {
      return { valid: false, message: 'At least one department is required' };
    }

    if (!request.sections || request.sections.length === 0) {
      return { valid: false, message: 'At least one section is required' };
    }

    if (!request.course_assignments || request.course_assignments.length === 0) {
      return { valid: false, message: 'At least one course assignment is required' };
    }

    if (!request.time_config) {
      return { valid: false, message: 'Time configuration is required' };
    }

    if (!request.time_config.working_days || request.time_config.working_days.length === 0) {
      return { valid: false, message: 'At least one working day is required' };
    }

    // Validate time configuration
    const startMinutes = this.timeToMinutes(request.time_config.start_time);
    const endMinutes = this.timeToMinutes(request.time_config.end_time);
    
    if (startMinutes >= endMinutes) {
      return { valid: false, message: 'End time must be after start time' };
    }

    if (request.time_config.class_duration < 30 || request.time_config.class_duration > 180) {
      return { valid: false, message: 'Class duration must be between 30 and 180 minutes' };
    }

    // Check if problem is over-constrained
    const totalSessions = this.countTotalSessions(request);
    const slotsPerDay = this.estimateSlotsPerDay(request.time_config);
    const totalSlots = slotsPerDay * request.time_config.working_days.length;

    // Each section needs its own slots
    const maxSlotsNeeded = Math.max(
      ...Array.from(this.getSessionsPerSection(request).values())
    );

    if (maxSlotsNeeded > totalSlots) {
      return {
        valid: false,
        message: `Problem is over-constrained: A section needs ${maxSlotsNeeded} sessions but only ${totalSlots} time slots available. Reduce classes per week or increase working hours/days.`,
      };
    }

    return { valid: true, message: 'Valid' };
  }

  /**
   * Count total sessions from course assignments
   */
  private countTotalSessions(request: TimetableGenerationRequest): number {
    let total = 0;
    
    for (const course of request.course_assignments) {
      const relevantSections = request.sections.filter(
        s => s.department_id === course.department_id && s.semester === course.semester
      );
      
      const sectionsCount = relevantSections.length || 1;
      
      if (course.sessions.theory.enabled) {
        total += course.sessions.theory.classes_per_week * sectionsCount;
      }
      if (course.sessions.lab.enabled) {
        total += course.sessions.lab.classes_per_week * sectionsCount;
      }
      if (course.sessions.tutorial.enabled) {
        total += course.sessions.tutorial.classes_per_week * sectionsCount;
      }
    }
    
    return total;
  }

  /**
   * Get sessions count per section
   */
  private getSessionsPerSection(request: TimetableGenerationRequest): Map<number, number> {
    const sessionsPerSection = new Map<number, number>();
    
    for (const section of request.sections) {
      sessionsPerSection.set(section.section_id, 0);
    }
    
    for (const course of request.course_assignments) {
      const relevantSections = request.sections.filter(
        s => s.department_id === course.department_id && s.semester === course.semester
      );
      
      for (const section of relevantSections) {
        let sessionCount = sessionsPerSection.get(section.section_id) || 0;
        
        if (course.sessions.theory.enabled) {
          sessionCount += course.sessions.theory.classes_per_week;
        }
        if (course.sessions.lab.enabled) {
          sessionCount += course.sessions.lab.classes_per_week;
        }
        if (course.sessions.tutorial.enabled) {
          sessionCount += course.sessions.tutorial.classes_per_week;
        }
        
        sessionsPerSection.set(section.section_id, sessionCount);
      }
    }
    
    return sessionsPerSection;
  }

  /**
   * Estimate slots per day based on time configuration
   */
  private estimateSlotsPerDay(timeConfig: TimeConfiguration): number {
    const startMinutes = this.timeToMinutes(timeConfig.start_time);
    const endMinutes = this.timeToMinutes(timeConfig.end_time);
    const duration = timeConfig.class_duration;
    
    let totalMinutes = endMinutes - startMinutes;
    
    // Subtract lunch break
    if (timeConfig.lunch_break.enabled) {
      const lunchStart = this.timeToMinutes(timeConfig.lunch_break.start_time);
      const lunchEnd = this.timeToMinutes(timeConfig.lunch_break.end_time);
      totalMinutes -= (lunchEnd - lunchStart);
    }
    
    return Math.floor(totalMinutes / duration);
  }

  /**
   * Rank solutions by quality
   */
  private rankSolutions(solutions: TimetableSolution[]): TimetableSolution[] {
    return solutions.sort((a, b) => {
      // Primary: feasibility (hard constraints)
      if (a.quality.feasibility_score !== b.quality.feasibility_score) {
        return b.quality.feasibility_score - a.quality.feasibility_score;
      }
      // Secondary: overall score
      return b.quality.overall_score - a.quality.overall_score;
    });
  }

  /**
   * Analyze solutions and provide recommendations
   */
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
        reasoning: 'No valid solutions generated',
      };
    }

    // Filter only feasible solutions (no hard constraint violations)
    const feasibleSolutions = solutions.filter(s => s.quality.feasibility_score >= 90);
    const solutionsToConsider = feasibleSolutions.length > 0 ? feasibleSolutions : solutions;

    const bestOverall = solutionsToConsider.reduce((best, curr) => 
      curr.quality.overall_score > best.quality.overall_score ? curr : best
    );

    const bestForTeachers = solutionsToConsider.reduce((best, curr) => 
      curr.quality.teacher_satisfaction > best.quality.teacher_satisfaction ? curr : best
    );

    const bestForStudents = solutionsToConsider.reduce((best, curr) => 
      curr.quality.student_satisfaction > best.quality.student_satisfaction ? curr : best
    );

    const methodBreakdown = new Map<string, number>();
    for (const s of solutions) {
      methodBreakdown.set(s.method, (methodBreakdown.get(s.method) || 0) + 1);
    }

    const methodSummary = Array.from(methodBreakdown.entries())
      .map(([m, c]) => `${c} ${m.toUpperCase()}`)
      .join(', ');

    return {
      best_overall: bestOverall.id,
      best_for_teachers: bestForTeachers.id,
      best_for_students: bestForStudents.id,
      reasoning: `Generated ${solutions.length} solutions (${methodSummary}). ` +
        `Best overall: "${bestOverall.name}" with score ${bestOverall.quality.overall_score.toFixed(1)}. ` +
        `Best for teachers: "${bestForTeachers.name}" (${bestForTeachers.quality.teacher_satisfaction.toFixed(1)}). ` +
        `Best for students: "${bestForStudents.name}" (${bestForStudents.quality.student_satisfaction.toFixed(1)}).`,
    };
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Check if AI generation is available
   */
  isAIAvailable(): boolean {
    return this.aiGenerator.isAvailable();
  }

  /**
   * Get default generation preferences
   */
  static getDefaultPreferences(): GenerationPreferences {
    return {
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
  }

  /**
   * Get default time configuration
   */
  static getDefaultTimeConfig(): TimeConfiguration {
    return {
      working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      start_time: '09:00',
      end_time: '17:00',
      class_duration: 60,
      lunch_break: {
        enabled: true,
        start_time: '12:00',
        end_time: '13:00',
      },
    };
  }
}

export default UnifiedTimetableService;
