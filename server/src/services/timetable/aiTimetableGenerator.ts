/**
 * AI-Powered Timetable Generator using Google Gemini
 * Generates timetables using natural language understanding and optimization
 * Handles multiple departments and sections intelligently
 */

import dotenv from 'dotenv';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import {
  TimetableGenerationRequest,
  TimetableSolution,
  GenerationResult,
  TimetableEntry,
  QualityMetrics,
  SolutionStatistics,
  SolutionIssue,
  ScheduleSession,
  TimeSlot,
  AIPromptContext,
  AIGeneratedSchedule,
} from './types';

dotenv.config();

interface GeminiConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxOutputTokens: number;
}

const DEFAULT_CONFIG: GeminiConfig = {
  apiKey: process.env.GEMINI_API_KEY || '',
  model: 'gemini-2.0-flash-exp',
  temperature: 0.2,
  maxOutputTokens: 8192,
};

export class AITimetableGenerator {
  private config: GeminiConfig;
  private genAI: GoogleGenerativeAI | null = null;
  private request!: TimetableGenerationRequest;
  private sessions: ScheduleSession[] = [];
  private timeSlots: TimeSlot[] = [];
  private startTime = 0;

  constructor(config: Partial<GeminiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (this.config.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.config.apiKey);
    }
  }

  /**
   * Check if AI generation is available
   */
  isAvailable(): boolean {
    return this.genAI !== null && this.config.apiKey.length > 0;
  }

  /**
   * Main method to generate timetables using AI
   */
  async generate(request: TimetableGenerationRequest): Promise<GenerationResult> {
    this.startTime = Date.now();
    this.request = request;

    console.log('🤖 Starting AI Timetable Generation with Gemini...');

    if (!this.isAvailable()) {
      console.log('⚠️ Gemini API not available, falling back to CSP solver');
      return this.createFallbackResult('Gemini API key not configured');
    }

    try {
      // Prepare data
      this.prepareData();
      console.log(`📊 Prepared ${this.sessions.length} sessions, ${this.timeSlots.length} time slots`);

      // Validate problem
      const validation = this.validateProblem();
      if (!validation.valid) {
        return this.createFallbackResult(validation.message);
      }

      // Generate solutions with different optimization goals
      const solutions: TimetableSolution[] = [];
      const optimizationGoals = [
        { name: 'AI Balanced Schedule', goal: 'balanced', description: 'AI-optimized balanced timetable' },
        { name: 'AI Teacher-Optimized', goal: 'teacher_focused', description: 'AI-optimized for teacher convenience' },
        { name: 'AI Student-Optimized', goal: 'student_focused', description: 'AI-optimized for student convenience' },
      ];

      for (const opt of optimizationGoals) {
        console.log(`\n🎯 AI Generating: ${opt.name}`);
        
        try {
          const solution = await this.generateWithAI(opt.goal, opt.name, opt.description);
          if (solution) {
            solutions.push(solution);
            console.log(`✅ ${opt.name}: Score ${solution.quality.overall_score.toFixed(1)}`);
          } else {
            console.log(`❌ ${opt.name}: AI generation failed`);
          }
        } catch (error) {
          console.error(`❌ ${opt.name} error:`, error);
        }
      }

      // Analyze and return
      const recommendations = this.analyzeAndRecommend(solutions);

      return {
        success: solutions.length > 0,
        method: 'ai',
        solutions,
        best_solution_id: recommendations.best_overall || null,
        generation_summary: {
          total_attempts: optimizationGoals.length,
          successful: solutions.length,
          failed: optimizationGoals.length - solutions.length,
          total_time_ms: Date.now() - this.startTime,
          method_details: 'Google Gemini AI with prompt engineering',
        },
        recommendations,
      };

    } catch (error) {
      console.error('❌ AI Generation error:', error);
      return this.createFallbackResult(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Generate a single solution using Gemini AI
   */
  private async generateWithAI(
    goal: string,
    name: string,
    description: string
  ): Promise<TimetableSolution | null> {
    if (!this.genAI) return null;

    const model = this.genAI.getGenerativeModel({
      model: this.config.model,
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxOutputTokens,
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });

    // Build the prompt
    const prompt = this.buildPrompt(goal);
    
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the AI response
      const schedule = this.parseAIResponse(text);
      
      if (!schedule || schedule.entries.length === 0) {
        console.log('⚠️ AI returned invalid or empty schedule');
        return null;
      }

      // Convert to solution format
      return this.convertToSolution(schedule, goal, name, description);

    } catch (error) {
      console.error('Gemini API error:', error);
      return null;
    }
  }

  /**
   * Build comprehensive prompt for Gemini
   */
  private buildPrompt(goal: string): string {
    const context = this.buildContext();
    
    const goalInstructions = this.getGoalInstructions(goal);

    return `You are an expert university timetable scheduler. Generate an optimal timetable following ALL constraints strictly.

## DEPARTMENTS AND SECTIONS
${context.departments.map(d => `- ${d}`).join('\n')}

Sections to schedule:
${context.sections.map(s => `- ${s}`).join('\n')}

## COURSES TO SCHEDULE
${context.courses.map(c => `Course: ${c.code} - ${c.name}
  Sessions: ${c.sessions.join(', ')}`).join('\n\n')}

## AVAILABLE TIME SLOTS
Working Days: ${this.request.time_config.working_days.join(', ')}
Time: ${this.request.time_config.start_time} to ${this.request.time_config.end_time}
Class Duration: ${this.request.time_config.class_duration} minutes
Lunch Break: ${this.request.time_config.lunch_break.start_time} to ${this.request.time_config.lunch_break.end_time}

Available slots per day:
${context.time_slots.join('\n')}

## TEACHERS
${context.teachers.map(t => `- ${t}`).join('\n')}

## HARD CONSTRAINTS (MUST BE SATISFIED)
1. NO TEACHER CLASH: A teacher cannot have two classes at the same time
2. NO SECTION CLASH: A section cannot have two classes at the same time
3. WITHIN WORKING HOURS: All classes must be within ${this.request.time_config.start_time}-${this.request.time_config.end_time}
4. NO LUNCH OVERLAP: No classes during ${this.request.time_config.lunch_break.start_time}-${this.request.time_config.lunch_break.end_time}
${this.request.preferences.hard_constraints.max_classes_per_day_student ? `5. MAX ${this.request.preferences.hard_constraints.max_classes_per_day_student} CLASSES PER DAY per section` : ''}

## OPTIMIZATION GOAL: ${goal.toUpperCase()}
${goalInstructions}

## SOFT CONSTRAINTS (OPTIMIZE FOR)
${context.preferences.join('\n')}

## CRITICAL RULE
🚨 EACH SESSION OF THE SAME COURSE MUST BE ON DIFFERENT DAYS! 🚨
Example: If BCS-101 has 3 theory classes per week, schedule them on Monday, Wednesday, Friday - NOT all on Monday!

## OUTPUT FORMAT
Return ONLY a valid JSON object with this exact structure:
{
  "schedule": [
    {
      "session_id": "COURSE_TYPE_SECTION_NUM",
      "day": "Monday",
      "time": "09:00",
      "room": "Room-101"
    }
  ],
  "reasoning": "Brief explanation of optimization choices",
  "confidence": 0.95
}

SESSION IDs to schedule (copy exactly):
${this.sessions.map(s => s.session_id).join('\n')}

Generate the complete schedule now. Return ONLY the JSON, no markdown code blocks or extra text.`;
  }

  /**
   * Build context for the prompt
   */
  private buildContext(): AIPromptContext {
    // Departments
    const departments = this.request.departments.map(d => `${d.name} (${d.code})`);

    // Sections with details
    const sections = this.request.sections.map(s => 
      `${s.section_name} - Dept: ${this.request.departments.find(d => d.department_id === s.department_id)?.name}, Semester: ${s.semester}`
    );

    // Courses with sessions
    const courses = this.request.course_assignments.map(c => {
      const sessionList: string[] = [];
      
      if (c.sessions.theory.enabled && c.sessions.theory.classes_per_week > 0) {
        sessionList.push(`${c.sessions.theory.classes_per_week}x Theory by ${c.sessions.theory.teacher_name}`);
      }
      if (c.sessions.lab.enabled && c.sessions.lab.classes_per_week > 0) {
        sessionList.push(`${c.sessions.lab.classes_per_week}x Lab by ${c.sessions.lab.teacher_name}`);
      }
      if (c.sessions.tutorial.enabled && c.sessions.tutorial.classes_per_week > 0) {
        sessionList.push(`${c.sessions.tutorial.classes_per_week}x Tutorial by ${c.sessions.tutorial.teacher_name}`);
      }

      return {
        code: c.course_code,
        name: c.course_name,
        sessions: sessionList,
      };
    });

    // Teachers with their courses
    const teacherMap = new Map<string, string[]>();
    for (const c of this.request.course_assignments) {
      if (c.sessions.theory.teacher_name) {
        if (!teacherMap.has(c.sessions.theory.teacher_name)) {
          teacherMap.set(c.sessions.theory.teacher_name, []);
        }
        teacherMap.get(c.sessions.theory.teacher_name)!.push(`${c.course_code} Theory`);
      }
      if (c.sessions.lab.teacher_name) {
        if (!teacherMap.has(c.sessions.lab.teacher_name)) {
          teacherMap.set(c.sessions.lab.teacher_name, []);
        }
        teacherMap.get(c.sessions.lab.teacher_name)!.push(`${c.course_code} Lab`);
      }
    }
    const teachers = Array.from(teacherMap.entries()).map(([name, courses]) => 
      `${name}: ${courses.join(', ')}`
    );

    // Time slots
    const slotsPerDay: string[] = [];
    const { time_config } = this.request;
    let currentMinutes = this.timeToMinutes(time_config.start_time);
    const endMinutes = this.timeToMinutes(time_config.end_time);
    const lunchStart = this.timeToMinutes(time_config.lunch_break.start_time);
    const lunchEnd = this.timeToMinutes(time_config.lunch_break.end_time);

    while (currentMinutes + time_config.class_duration <= endMinutes) {
      const slotEnd = currentMinutes + time_config.class_duration;
      if (!(currentMinutes < lunchEnd && slotEnd > lunchStart)) {
        slotsPerDay.push(`${this.minutesToTime(currentMinutes)} - ${this.minutesToTime(slotEnd)}`);
      }
      currentMinutes += time_config.class_duration;
    }

    // Preferences
    const preferences: string[] = [];
    const { soft_constraints } = this.request.preferences;
    
    if (soft_constraints.minimize_student_gaps.enabled) {
      preferences.push(`- Minimize gaps between classes for students (weight: ${soft_constraints.minimize_student_gaps.weight})`);
    }
    if (soft_constraints.minimize_teacher_gaps.enabled) {
      preferences.push(`- Minimize gaps for teachers (weight: ${soft_constraints.minimize_teacher_gaps.weight})`);
    }
    if (soft_constraints.balance_daily_load.enabled) {
      preferences.push(`- Balance classes evenly across days (weight: ${soft_constraints.balance_daily_load.weight})`);
    }
    if (soft_constraints.prefer_morning_theory.enabled) {
      preferences.push(`- Schedule theory classes in morning (weight: ${soft_constraints.prefer_morning_theory.weight})`);
    }
    if (soft_constraints.prefer_afternoon_labs.enabled) {
      preferences.push(`- Schedule labs in afternoon (weight: ${soft_constraints.prefer_afternoon_labs.weight})`);
    }
    if (soft_constraints.same_course_different_days.enabled) {
      preferences.push(`- Different days for same course sessions (weight: ${soft_constraints.same_course_different_days.weight})`);
    }

    return {
      departments,
      sections,
      courses,
      teachers,
      time_slots: slotsPerDay,
      constraints: [],
      preferences,
    };
  }

  /**
   * Get goal-specific instructions
   */
  private getGoalInstructions(goal: string): string {
    switch (goal) {
      case 'teacher_focused':
        return `PRIORITIZE TEACHER CONVENIENCE:
- Minimize gaps in teacher schedules
- Keep teacher classes on fewer days if possible
- Avoid back-to-back classes for teachers
- Compact teacher schedules (consecutive slots)`;

      case 'student_focused':
        return `PRIORITIZE STUDENT CONVENIENCE:
- Minimize gaps between classes for each section
- Balance classes evenly across the week
- Avoid too many classes on one day
- Prefer reasonable start times (not too early)`;

      case 'balanced':
      default:
        return `BALANCE ALL STAKEHOLDERS:
- Fair balance between teacher and student preferences
- Reasonable distribution across the week
- Minimize gaps for both teachers and students
- Efficient resource utilization`;
    }
  }

  /**
   * Parse AI response to extract schedule
   */
  private parseAIResponse(text: string): AIGeneratedSchedule | null {
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.slice(7);
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.slice(3);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.slice(0, -3);
      }
      cleanText = cleanText.trim();

      const parsed = JSON.parse(cleanText);
      
      if (parsed.schedule && Array.isArray(parsed.schedule)) {
        return {
          entries: parsed.schedule,
          reasoning: parsed.reasoning,
          confidence: parsed.confidence,
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.log('Raw response:', text.substring(0, 500));
      return null;
    }
  }

  /**
   * Convert AI schedule to solution format
   */
  private convertToSolution(
    aiSchedule: AIGeneratedSchedule,
    goal: string,
    name: string,
    description: string
  ): TimetableSolution | null {
    const entries: TimetableEntry[] = [];
    const sessionMap = new Map(this.sessions.map(s => [s.session_id, s]));

    for (const entry of aiSchedule.entries) {
      const session = sessionMap.get(entry.session);
      if (!session) {
        console.warn(`Session not found: ${entry.session}`);
        continue;
      }

      // Find matching time slot
      const slot = this.timeSlots.find(s => 
        s.day === entry.day && s.start_time === entry.time
      );
      
      if (!slot) {
        console.warn(`Time slot not found: ${entry.day} ${entry.time}`);
        continue;
      }

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
        room_number: entry.room || this.assignRoom(session),
      });
    }

    if (entries.length === 0) {
      return null;
    }

    // Calculate quality
    const quality = this.calculateQuality(entries);

    // Calculate statistics
    const statistics = this.calculateStatistics(entries);

    // Identify issues
    const issues = this.identifyIssues(entries);

    return {
      id: `ai_${goal}_${Date.now()}`,
      name,
      description: description + (aiSchedule.reasoning ? ` - ${aiSchedule.reasoning}` : ''),
      method: 'ai',
      optimization_goal: goal,
      timetable_entries: entries,
      quality,
      statistics,
      issues,
      generation_info: {
        method: 'AI Generation',
        model: this.config.model,
        generation_time_ms: Date.now() - this.startTime,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Calculate quality metrics for AI-generated schedule
   */
  private calculateQuality(entries: TimetableEntry[]): QualityMetrics {
    // Check hard constraints
    let teacherClashes = 0;
    let sectionClashes = 0;

    // Teacher clashes
    const teacherSlots = new Map<string, Set<string>>();
    for (const entry of entries) {
      const key = `${entry.teacher_id}`;
      const slotKey = `${entry.day}_${entry.start_time}`;
      
      if (!teacherSlots.has(key)) {
        teacherSlots.set(key, new Set());
      }
      if (teacherSlots.get(key)!.has(slotKey)) {
        teacherClashes++;
      }
      teacherSlots.get(key)!.add(slotKey);
    }

    // Section clashes
    const sectionSlots = new Map<string, Set<string>>();
    for (const entry of entries) {
      const key = `${entry.section_id}`;
      const slotKey = `${entry.day}_${entry.start_time}`;
      
      if (!sectionSlots.has(key)) {
        sectionSlots.set(key, new Set());
      }
      if (sectionSlots.get(key)!.has(slotKey)) {
        sectionClashes++;
      }
      sectionSlots.get(key)!.add(slotKey);
    }

    const feasibility_score = (teacherClashes + sectionClashes) === 0 
      ? 100 
      : Math.max(0, 100 - (teacherClashes + sectionClashes) * 15);

    // Soft constraint scores
    const studentGapScore = this.calculateStudentGapScore(entries);
    const teacherGapScore = this.calculateTeacherGapScore(entries);
    const balanceScore = this.calculateBalanceScore(entries);
    const differentDaysScore = this.calculateDifferentDaysScore(entries);

    const optimization_score = (studentGapScore + teacherGapScore + balanceScore + differentDaysScore) / 4;

    const teacher_satisfaction = teacherGapScore;
    const student_satisfaction = studentGapScore;
    const resource_utilization = this.calculateUtilization(entries);

    const overall_score = 
      feasibility_score * 0.4 + 
      optimization_score * 0.25 + 
      teacher_satisfaction * 0.175 + 
      student_satisfaction * 0.175;

    return {
      overall_score,
      feasibility_score,
      optimization_score,
      teacher_satisfaction,
      student_satisfaction,
      resource_utilization,
      breakdown: {
        hard_constraints: [
          { name: 'No Teacher Clash', satisfied: teacherClashes === 0, violations: teacherClashes },
          { name: 'No Section Clash', satisfied: sectionClashes === 0, violations: sectionClashes },
        ],
        soft_constraints: [
          { name: 'Student Gaps', score: studentGapScore, weight: 25, weighted_score: studentGapScore * 0.25 },
          { name: 'Teacher Gaps', score: teacherGapScore, weight: 25, weighted_score: teacherGapScore * 0.25 },
          { name: 'Daily Balance', score: balanceScore, weight: 25, weighted_score: balanceScore * 0.25 },
          { name: 'Different Days', score: differentDaysScore, weight: 25, weighted_score: differentDaysScore * 0.25 },
        ],
      },
    };
  }

  private calculateStudentGapScore(entries: TimetableEntry[]): number {
    const sectionDays = new Map<string, number[]>();
    
    for (const entry of entries) {
      const key = `${entry.section_id}_${entry.day}`;
      if (!sectionDays.has(key)) {
        sectionDays.set(key, []);
      }
      const slotIndex = this.timeSlots.findIndex(s => s.start_time === entry.start_time && s.day === entry.day);
      if (slotIndex >= 0) {
        sectionDays.get(key)!.push(slotIndex);
      }
    }

    let totalGaps = 0;
    let totalPairs = 0;

    for (const slots of sectionDays.values()) {
      if (slots.length > 1) {
        slots.sort((a, b) => a - b);
        for (let i = 1; i < slots.length; i++) {
          totalGaps += slots[i] - slots[i-1] - 1;
          totalPairs++;
        }
      }
    }

    const avgGap = totalPairs > 0 ? totalGaps / totalPairs : 0;
    return Math.max(0, 100 - avgGap * 25);
  }

  private calculateTeacherGapScore(entries: TimetableEntry[]): number {
    const teacherDays = new Map<string, number[]>();
    
    for (const entry of entries) {
      const key = `${entry.teacher_id}_${entry.day}`;
      if (!teacherDays.has(key)) {
        teacherDays.set(key, []);
      }
      const slotIndex = this.timeSlots.findIndex(s => s.start_time === entry.start_time && s.day === entry.day);
      if (slotIndex >= 0) {
        teacherDays.get(key)!.push(slotIndex);
      }
    }

    let totalGaps = 0;
    let totalPairs = 0;

    for (const slots of teacherDays.values()) {
      if (slots.length > 1) {
        slots.sort((a, b) => a - b);
        for (let i = 1; i < slots.length; i++) {
          totalGaps += slots[i] - slots[i-1] - 1;
          totalPairs++;
        }
      }
    }

    const avgGap = totalPairs > 0 ? totalGaps / totalPairs : 0;
    return Math.max(0, 100 - avgGap * 25);
  }

  private calculateBalanceScore(entries: TimetableEntry[]): number {
    const sectionDailyCount = new Map<number, Map<string, number>>();
    
    for (const entry of entries) {
      if (!sectionDailyCount.has(entry.section_id)) {
        sectionDailyCount.set(entry.section_id, new Map());
      }
      const dayMap = sectionDailyCount.get(entry.section_id)!;
      dayMap.set(entry.day, (dayMap.get(entry.day) || 0) + 1);
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

  private calculateDifferentDaysScore(entries: TimetableEntry[]): number {
    const courseGroups = new Map<string, Set<string>>();
    
    for (const entry of entries) {
      const key = `${entry.course_code}_${entry.section_id}`;
      if (!courseGroups.has(key)) {
        courseGroups.set(key, new Set());
      }
      courseGroups.get(key)!.add(entry.day);
    }

    let goodCount = 0;
    let totalCount = 0;

    for (const [key, days] of courseGroups) {
      const entriesForCourse = entries.filter(e => 
        `${e.course_code}_${e.section_id}` === key
      ).length;
      
      if (entriesForCourse > 1) {
        const maxPossibleDays = Math.min(entriesForCourse, this.request.time_config.working_days.length);
        goodCount += days.size;
        totalCount += maxPossibleDays;
      }
    }

    return totalCount > 0 ? (goodCount / totalCount) * 100 : 100;
  }

  private calculateUtilization(entries: TimetableEntry[]): number {
    const usedSlots = new Set(entries.map(e => `${e.day}_${e.start_time}`));
    return (usedSlots.size / this.timeSlots.length) * 100;
  }

  private calculateStatistics(entries: TimetableEntry[]): SolutionStatistics {
    const teacherWorkloads = new Map<number, any>();
    const sectionSchedules = new Map<number, any>();

    for (const entry of entries) {
      // Teacher
      if (!teacherWorkloads.has(entry.teacher_id)) {
        teacherWorkloads.set(entry.teacher_id, {
          teacher_id: entry.teacher_id,
          teacher_name: entry.teacher_name,
          total_hours: 0,
          daily_hours: {},
          gaps_minutes: 0,
          consecutive_classes: 0,
        });
      }
      const tw = teacherWorkloads.get(entry.teacher_id)!;
      tw.total_hours += this.request.time_config.class_duration / 60;
      tw.daily_hours[entry.day] = (tw.daily_hours[entry.day] || 0) + this.request.time_config.class_duration / 60;

      // Section
      if (!sectionSchedules.has(entry.section_id)) {
        sectionSchedules.set(entry.section_id, {
          section_id: entry.section_id,
          section_name: entry.section_name,
          total_hours: 0,
          daily_hours: {},
          gaps_minutes: 0,
          first_class_times: {},
          last_class_times: {},
        });
      }
      const ss = sectionSchedules.get(entry.section_id)!;
      ss.total_hours += this.request.time_config.class_duration / 60;
      ss.daily_hours[entry.day] = (ss.daily_hours[entry.day] || 0) + this.request.time_config.class_duration / 60;
    }

    return {
      total_sessions: this.sessions.length,
      sessions_scheduled: entries.length,
      sessions_failed: this.sessions.length - entries.length,
      unique_teachers: teacherWorkloads.size,
      unique_sections: sectionSchedules.size,
      unique_rooms: new Set(entries.map(e => e.room_number)).size,
      slots_used: new Set(entries.map(e => `${e.day}_${e.start_time}`)).size,
      slots_available: this.timeSlots.length,
      utilization_percentage: (entries.length / this.timeSlots.length) * 100,
      teacher_workloads: Array.from(teacherWorkloads.values()),
      section_schedules: Array.from(sectionSchedules.values()),
    };
  }

  private identifyIssues(entries: TimetableEntry[]): SolutionIssue[] {
    const issues: SolutionIssue[] = [];

    // Check for missing sessions
    const scheduledSessions = new Set(entries.map(e => 
      `${e.course_code}_${e.session_type}_${e.section_name}`
    ));

    const missingSessions = this.sessions.filter(s => {
      const key = `${s.course_code}_${s.session_type}_${s.section_name}`;
      return !scheduledSessions.has(key);
    });

    if (missingSessions.length > 0) {
      issues.push({
        type: 'hard_violation',
        severity: 'critical',
        constraint: 'Complete Schedule',
        message: `${missingSessions.length} sessions not scheduled by AI`,
        affected_sessions: missingSessions.map(s => s.session_id),
        suggestion: 'Some sessions may need manual scheduling',
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
        reasoning: 'No valid AI solutions generated',
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
      reasoning: `AI generated ${solutions.length} solutions. Best: "${bestOverall.name}" (${bestOverall.quality.overall_score.toFixed(1)}). ` +
        `For teachers: "${bestForTeachers.name}". For students: "${bestForStudents.name}".`,
    };
  }

  // Helper methods

  private prepareData(): void {
    this.timeSlots = this.generateTimeSlots();
    this.sessions = this.generateSessions();
  }

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
        const isLunch = lunchStart >= 0 && !(currentMinutes >= lunchEnd || slotEnd <= lunchStart);

        if (!isLunch) {
          slots.push({
            id: `${day.substring(0, 3).toUpperCase()}_${this.minutesToTime(currentMinutes)}`,
            day,
            day_index: dayIndex,
            start_time: this.minutesToTime(currentMinutes),
            end_time: this.minutesToTime(slotEnd),
            slot_index: slotIndex,
            is_lunch: false,
            is_break: false,
          });
          slotIndex++;
        }

        currentMinutes += duration;
      }
    });

    return slots;
  }

  private generateSessions(): ScheduleSession[] {
    const sessions: ScheduleSession[] = [];
    
    for (const course of this.request.course_assignments) {
      const relevantSections = this.request.sections.filter(
        s => s.department_id === course.department_id && s.semester === course.semester
      );

      for (const section of relevantSections) {
        // Theory
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

        // Lab
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

        // Tutorial
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

  private validateProblem(): { valid: boolean; message: string } {
    const sessionsBySection = new Map<number, ScheduleSession[]>();
    for (const session of this.sessions) {
      if (!sessionsBySection.has(session.section_id)) {
        sessionsBySection.set(session.section_id, []);
      }
      sessionsBySection.get(session.section_id)!.push(session);
    }

    for (const [sectionId, sectionSessions] of sessionsBySection) {
      if (sectionSessions.length > this.timeSlots.length) {
        const section = this.request.sections.find(s => s.section_id === sectionId);
        return {
          valid: false,
          message: `Section ${section?.section_name || sectionId} has ${sectionSessions.length} sessions but only ${this.timeSlots.length} time slots available.`,
        };
      }
    }

    return { valid: true, message: 'OK' };
  }

  private assignRoom(session: ScheduleSession): string {
    if (session.requires_lab_room) {
      return `Lab-${(session.course_id % 5) + 1}`;
    }
    return `Room-${100 + (session.section_id % 10)}`;
  }

  private createFallbackResult(reason: string): GenerationResult {
    return {
      success: false,
      method: 'ai',
      solutions: [],
      best_solution_id: null,
      generation_summary: {
        total_attempts: 0,
        successful: 0,
        failed: 0,
        total_time_ms: Date.now() - this.startTime,
        method_details: 'AI generation not available',
      },
      recommendations: {
        best_overall: '',
        best_for_teachers: '',
        best_for_students: '',
        reasoning: reason,
      },
      errors: [reason],
    };
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

export default AITimetableGenerator;
