/**
 * Unified Timetable Generation Controller
 * Handles requests for both CSP and AI-based timetable generation
 */

import { Request, Response } from 'express';
import { UnifiedTimetableService, GenerationMethod } from '../services/timetable';
import { TimetableGenerationRequest } from '../services/timetable/types';
import SmartTimetableSolution from '../models/SmartTimetableSolution';

// Extend Request interface for authenticated requests
interface AuthenticatedRequest extends Request {
  user?: {
    user_id: number;
    email: string;
    role: string;
    department_id?: number;
  };
}

const timetableService = new UnifiedTimetableService();

/**
 * Generate timetables using the unified service
 * Supports CSP, AI, or Hybrid methods
 */
export const generateUnifiedTimetable = async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('\n' + '═'.repeat(80));
    console.log('🎓 UNIFIED TIMETABLE GENERATION REQUEST');
    console.log('═'.repeat(80));
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('👤 User:', req.user?.email || 'Anonymous');
    
    const { 
      method = 'auto',
      csp_config,
      ai_config,
      ...generationRequest 
    } = req.body;

    // Validate method
    const validMethods: GenerationMethod[] = ['csp', 'ai', 'hybrid', 'auto'];
    if (validMethods.indexOf(method as GenerationMethod) === -1) {
      return res.status(400).json({
        success: false,
        message: `Invalid method. Must be one of: ${validMethods.join(', ')}`,
      });
    }

    // Log request summary
    console.log('\n📋 Generation Request Summary:');
    console.log(`   Method: ${method}`);
    console.log(`   Departments: ${generationRequest.departments?.length || 0}`);
    console.log(`   Sections: ${generationRequest.sections?.length || 0}`);
    console.log(`   Courses: ${generationRequest.course_assignments?.length || 0}`);
    console.log(`   Teachers: ${generationRequest.teachers?.length || 0}`);
    console.log(`   Rooms: ${generationRequest.rooms?.length || 0}`);
    
    // Generate timetables
    const result = await timetableService.generate(
      generationRequest as TimetableGenerationRequest,
      {
        method: method as GenerationMethod,
        cspConfig: csp_config,
        aiConfig: ai_config,
      }
    );

    // Log result summary
    console.log('\n✅ Generation Result:');
    console.log(`   Success: ${result.success}`);
    console.log(`   Solutions: ${result.solutions.length}`);
    console.log(`   Method: ${result.method}`);
    console.log(`   Best Solution: ${result.best_solution_id || 'N/A'}`);
    console.log(`   Time: ${result.generation_summary.total_time_ms}ms`);

    // Transform to frontend-expected format
    const transformedSolutions = result.solutions.map(solution => ({
      id: solution.id,
      name: solution.name,
      optimization: solution.optimization_goal,
      score: solution.quality.overall_score,
      quality: {
        overall: solution.quality.overall_score,
        feasibility: solution.quality.feasibility_score,
        teacherSatisfaction: solution.quality.teacher_satisfaction,
        studentSatisfaction: solution.quality.student_satisfaction,
        roomUtilization: solution.quality.resource_utilization,
        gapScore: solution.quality.optimization_score,
      },
      conflicts: solution.issues.filter(i => i.type === 'hard_violation').length,
      timetable_entries: solution.timetable_entries.map(entry => ({
        day: entry.day,
        timeSlot: entry.time_slot,
        courseId: entry.course_code,
        courseName: entry.course_name,
        courseCode: entry.course_code,
        teacherId: entry.teacher_id,
        teacherName: entry.teacher_name,
        roomId: entry.room_number,
        roomName: entry.room_number,
        sectionId: entry.section_id,
        sectionName: entry.section_name,
        departmentId: entry.department_id,
        departmentName: entry.department_name,
        sessionType: entry.session_type,
        batchId: entry.batch_id,
        batchName: entry.batch_id ? `Batch ${entry.batch_id}` : undefined,
      })),
      metadata: {
        generated_at: solution.generation_info.timestamp,
        method: solution.method,
        statistics: solution.statistics,
      },
    }));

    res.json({
      success: result.success,
      message: result.success 
        ? `Generated ${result.solutions.length} timetable solution(s) using ${result.method} method`
        : 'Failed to generate timetables',
      solutions: transformedSolutions,
      recommendations: result.recommendations,
      summary: {
        method: result.method,
        ...result.generation_summary,
      },
      ai_available: timetableService.isAIAvailable(),
      timestamp: new Date().toISOString(),
      errors: result.errors,
    });

  } catch (error) {
    console.error('❌ Unified Generation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate timetables',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Generate timetables using CSP solver only
 */
export const generateCSPTimetable = async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🧮 CSP Timetable Generation Request');
    
    const result = await timetableService.generate(
      req.body as TimetableGenerationRequest,
      { method: 'csp' }
    );

    res.json({
      ...result,
      message: result.success 
        ? `Generated ${result.solutions.length} CSP solution(s)`
        : 'CSP solver could not find valid solutions',
    });

  } catch (error) {
    console.error('❌ CSP Generation Error:', error);
    res.status(500).json({
      success: false,
      message: 'CSP generation failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Generate timetables using AI (Gemini) only
 */
export const generateAITimetable = async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🤖 AI Timetable Generation Request');

    if (!timetableService.isAIAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'AI generation is not available. Please configure GEMINI_API_KEY.',
        ai_available: false,
      });
    }
    
    const result = await timetableService.generate(
      req.body as TimetableGenerationRequest,
      { method: 'ai' }
    );

    res.json({
      ...result,
      message: result.success 
        ? `Generated ${result.solutions.length} AI solution(s)`
        : 'AI generation failed',
    });

  } catch (error) {
    console.error('❌ AI Generation Error:', error);
    res.status(500).json({
      success: false,
      message: 'AI generation failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Generate timetables using hybrid approach (CSP + AI)
 */
export const generateHybridTimetable = async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔀 Hybrid Timetable Generation Request');
    
    const result = await timetableService.generate(
      req.body as TimetableGenerationRequest,
      { method: 'hybrid' }
    );

    res.json({
      ...result,
      message: result.success 
        ? `Generated ${result.solutions.length} hybrid solution(s)`
        : 'Hybrid generation failed',
    });

  } catch (error) {
    console.error('❌ Hybrid Generation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Hybrid generation failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Check generation capabilities
 */
export const getGenerationCapabilities = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      capabilities: {
        methods: {
          csp: {
            available: true,
            description: 'Constraint Satisfaction Problem solver with AC-3, MRV, LCV heuristics',
            features: [
              'Arc consistency preprocessing',
              'Minimum Remaining Values variable selection',
              'Least Constraining Value ordering',
              'Forward checking',
              'Multiple solution generation',
            ],
          },
          ai: {
            available: timetableService.isAIAvailable(),
            description: 'AI-powered generation using Google Gemini',
            features: [
              'Natural language constraint understanding',
              'Adaptive optimization',
              'Multiple goal support (balanced, teacher-focused, student-focused)',
              'Reasoning explanations',
            ],
          },
          hybrid: {
            available: timetableService.isAIAvailable(),
            description: 'Combined CSP + AI approach for best results',
            features: [
              'CSP for guaranteed constraint satisfaction',
              'AI for quality refinement',
              'Best-of-both solutions',
            ],
          },
          auto: {
            available: true,
            description: 'Automatic method selection based on problem complexity',
          },
        },
        defaults: {
          preferences: UnifiedTimetableService.getDefaultPreferences(),
          time_config: UnifiedTimetableService.getDefaultTimeConfig(),
        },
      },
    });
  } catch (error) {
    console.error('❌ Capabilities Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get capabilities',
    });
  }
};

/**
 * Compare multiple solutions
 */
export const compareSolutions = async (req: Request, res: Response) => {
  try {
    const { solution_ids } = req.body;

    if (!solution_ids || !Array.isArray(solution_ids) || solution_ids.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least 2 solution IDs to compare',
      });
    }

    // Fetch solutions from database
    const solutions = await (SmartTimetableSolution as any).findAll({
      where: {
        solutionId: solution_ids,
      },
    });

    if (solutions.length < 2) {
      return res.status(404).json({
        success: false,
        message: 'Could not find enough solutions to compare',
      });
    }

    // Calculate comparison metrics
    const comparison = solutions.map((sol: any) => ({
      id: sol.solutionId,
      name: sol.solutionName,
      overall_score: sol.overallScore,
      quality: sol.qualityMetrics,
      conflicts: sol.conflicts,
      optimization_type: sol.optimizationType,
    }));

    // Determine winner for each category
    const winners = {
      overall: comparison.reduce((best: any, curr: any) => 
        curr.overall_score > best.overall_score ? curr : best
      ).id,
      teacher_satisfaction: comparison.reduce((best: any, curr: any) => 
        (curr.quality?.teacher_satisfaction || 0) > (best.quality?.teacher_satisfaction || 0) ? curr : best
      ).id,
      student_satisfaction: comparison.reduce((best: any, curr: any) => 
        (curr.quality?.student_satisfaction || 0) > (best.quality?.student_satisfaction || 0) ? curr : best
      ).id,
      fewest_conflicts: comparison.reduce((best: any, curr: any) => 
        (curr.conflicts || 0) < (best.conflicts || Infinity) ? curr : best
      ).id,
    };

    res.json({
      success: true,
      comparison,
      winners,
      recommendation: winners.overall,
    });

  } catch (error) {
    console.error('❌ Comparison Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to compare solutions',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Validate generation request before processing
 */
export const validateRequest = async (req: Request, res: Response) => {
  try {
    const request = req.body as Partial<TimetableGenerationRequest>;
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!request.departments || request.departments.length === 0) {
      issues.push('At least one department is required');
    }
    if (!request.sections || request.sections.length === 0) {
      issues.push('At least one section is required');
    }
    if (!request.course_assignments || request.course_assignments.length === 0) {
      issues.push('At least one course assignment is required');
    }
    if (!request.time_config) {
      issues.push('Time configuration is required');
    }

    // Check for potential issues
    if (request.teachers && request.teachers.length === 0) {
      warnings.push('No teachers specified - will use defaults from course assignments');
    }
    if (request.rooms && request.rooms.length === 0) {
      warnings.push('No rooms specified - room allocation will be skipped');
    }

    // Estimate complexity
    let complexity = 'low';
    if (request.course_assignments && request.sections) {
      const totalSessions = request.course_assignments.reduce((sum, c) => {
        let sessions = 0;
        if (c.sessions?.theory?.enabled) sessions += c.sessions.theory.classes_per_week;
        if (c.sessions?.lab?.enabled) sessions += c.sessions.lab.classes_per_week;
        if (c.sessions?.tutorial?.enabled) sessions += c.sessions.tutorial.classes_per_week;
        return sum + sessions;
      }, 0);

      const sectionCount = request.sections.length;
      const totalWithSections = totalSessions * sectionCount;

      if (totalWithSections > 100) complexity = 'high';
      else if (totalWithSections > 50) complexity = 'medium';
    }

    res.json({
      success: issues.length === 0,
      valid: issues.length === 0,
      issues,
      warnings,
      complexity,
      recommended_method: complexity === 'high' ? 'hybrid' : 'csp',
    });

  } catch (error) {
    console.error('❌ Validation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate request',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export default {
  generateUnifiedTimetable,
  generateCSPTimetable,
  generateAITimetable,
  generateHybridTimetable,
  getGenerationCapabilities,
  compareSolutions,
  validateRequest,
};
