/**
 * AI Timetable Generation API Controller
 * Handles AI-powered timetable generation requests
 */

import { Request, Response } from 'express';
import { AITimetableGenerator } from '../ai/aiTimetableGenerator';
import { TimetableGenerationInput } from '../ai/types';

// ==================== AI GENERATION ENDPOINT ====================

export const generateAITimetable = async (req: Request, res: Response) => {
  try {
    console.log('🤖 AI Timetable Generation Request received');
    
    const generationInput: TimetableGenerationInput = req.body;
    
    // Validate input
    const validation = validateGenerationInput(generationInput);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid generation input',
        details: validation.errors
      });
    }

    console.log('✅ Input validation passed');
    console.log('📊 Generating timetable for:', {
      courses: generationInput.courseAssignments.length,
      department: generationInput.metadata.department_name,
      semester: generationInput.metadata.semester
    });

    // Initialize AI generator
    const generator = new AITimetableGenerator();
    
    // Generate multiple timetable solutions
    const result = await generator.generateTimetables(generationInput);
    
    if (result.success && result.solutions.length > 0) {
      console.log('🎉 AI generation successful:', {
        solutions: result.solutions.length,
        best_score: Math.max(...result.solutions.map(s => s.quality.overall_score)).toFixed(1),
        generation_time: result.generation_summary.total_generation_time_ms + 'ms'
      });

      res.json({
        success: true,
        data: result,
        message: `Generated ${result.solutions.length} timetable solutions successfully`
      });
    } else {
      console.log('❌ AI generation failed to produce valid solutions');
      res.status(422).json({
        success: false,
        error: 'Failed to generate valid timetable solutions',
        details: result.recommendations.reasoning,
        data: result
      });
    }

  } catch (error) {
    console.error('❌ AI generation error:', error);
    res.status(500).json({
      success: false,
      error: 'AI timetable generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ==================== SOLUTION ANALYSIS ENDPOINT ====================

export const analyzeTimetableSolution = async (req: Request, res: Response) => {
  try {
    const { solutionId } = req.params;
    const { detailed = false } = req.query;

    console.log(`🔍 Analyzing timetable solution: ${solutionId}`);

    // In a real implementation, this would fetch the solution from database
    // For now, return analysis structure
    
    const analysis = {
      solution_id: solutionId,
      quality_breakdown: {
        feasibility: {
          score: 95,
          hard_constraints_satisfied: 18,
          total_hard_constraints: 19,
          violations: [
            {
              constraint: 'NoTeacherClash',
              sessions_affected: ['BCS210_Theory_A_1', 'BCS211_Lab_A_1'],
              severity: 'high',
              suggestion: 'Move BCS211_Lab_A_1 to different time slot'
            }
          ]
        },
        optimization: {
          score: 82,
          soft_constraints_performance: [
            { name: 'MinimizeStudentGaps', weight: 30, cost: 45, performance: 85 },
            { name: 'BalanceTeacherWorkload', weight: 20, cost: 12, performance: 94 },
            { name: 'PreferMorningTheory', weight: 15, cost: 8, performance: 89 }
          ]
        }
      },
      statistics: {
        teacher_workload: [
          { teacher_name: 'Dr. Smith', total_hours: 12, days_active: 4, gaps_minutes: 60 },
          { teacher_name: 'Prof. Johnson', total_hours: 10, days_active: 3, gaps_minutes: 30 }
        ],
        student_schedule: [
          { section: 'A', daily_hours: [4, 3, 4, 2, 3], total_gaps_minutes: 90 },
          { section: 'B', daily_hours: [3, 4, 3, 4, 2], total_gaps_minutes: 120 }
        ]
      }
    };

    if (detailed) {
      // Add detailed session-by-session analysis
      analysis['detailed_schedule'] = {
        // Detailed breakdown would be added here
      };
    }

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('❌ Solution analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Solution analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ==================== SOLUTION COMPARISON ENDPOINT ====================

export const compareTimetableSolutions = async (req: Request, res: Response) => {
  try {
    const { solutionIds } = req.body;

    if (!Array.isArray(solutionIds) || solutionIds.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 solution IDs required for comparison'
      });
    }

    console.log(`📊 Comparing ${solutionIds.length} timetable solutions`);

    // Mock comparison data
    const comparison = {
      solutions: solutionIds.map((id, index) => ({
        id,
        name: `Solution ${index + 1}`,
        scores: {
          overall: 85 - index * 5,
          teacher_satisfaction: 80 + index * 3,
          student_convenience: 90 - index * 2,
          resource_utilization: 85
        }
      })),
      comparison_matrix: {
        categories: [
          {
            name: 'Teacher Workload Balance',
            winner: solutionIds[1],
            scores: solutionIds.map((id, i) => ({ id, score: 80 + i * 5 }))
          },
          {
            name: 'Student Gap Minimization', 
            winner: solutionIds[0],
            scores: solutionIds.map((id, i) => ({ id, score: 90 - i * 3 }))
          }
        ]
      },
      recommendation: {
        best_overall: solutionIds[0],
        reasoning: 'Solution 1 provides the best balance between teacher and student satisfaction',
        trade_offs: [
          'Solution 1: Better for students but slightly more teacher gaps',
          'Solution 2: Better teacher distribution but longer student gaps'
        ]
      }
    };

    res.json({
      success: true,
      data: comparison
    });

  } catch (error) {
    console.error('❌ Solution comparison error:', error);
    res.status(500).json({
      success: false,
      error: 'Solution comparison failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ==================== OPTIMIZATION PREFERENCES ENDPOINT ====================

export const updateOptimizationPreferences = async (req: Request, res: Response) => {
  try {
    const { preferences } = req.body;

    console.log('🎛️ Updating optimization preferences:', preferences);

    // Validate preferences
    const validPreferences = [
      'minimize_student_gaps',
      'balance_teacher_workload', 
      'prefer_morning_theory',
      'avoid_back_to_back_labs',
      'minimize_daily_transitions'
    ];

    for (const [key, config] of Object.entries(preferences)) {
      if (!validPreferences.includes(key)) {
        return res.status(400).json({
          success: false,
          error: `Invalid preference: ${key}`,
          valid_preferences: validPreferences
        });
      }

      // Validate weight is between 0-100
      if (typeof config === 'object' && config && 'weight' in config) {
        const weight = (config as any).weight;
        if (typeof weight === 'number' && (weight < 0 || weight > 100)) {
          return res.status(400).json({
            success: false,
            error: `Weight for ${key} must be between 0-100`
          });
        }
      }
    }

    // In real implementation, save preferences to database/user profile
    
    res.json({
      success: true,
      message: 'Optimization preferences updated successfully',
      data: { preferences }
    });

  } catch (error) {
    console.error('❌ Preferences update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ==================== INPUT VALIDATION ====================

function validateGenerationInput(input: TimetableGenerationInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate course assignments
  if (!input.courseAssignments || input.courseAssignments.length === 0) {
    errors.push('At least one course assignment is required');
  }

  // Validate time configuration
  if (!input.timeConfiguration) {
    errors.push('Time configuration is required');
  } else {
    if (!input.timeConfiguration.start_time || !input.timeConfiguration.end_time) {
      errors.push('Start time and end time are required');
    }
    
    if (!input.timeConfiguration.working_days || input.timeConfiguration.working_days.length === 0) {
      errors.push('At least one working day is required');
    }
    
    if (!input.timeConfiguration.class_duration || input.timeConfiguration.class_duration <= 0) {
      errors.push('Valid class duration is required');
    }
  }

  // Validate course assignments have teachers assigned
  for (const course of input.courseAssignments || []) {
    if (!course.sessions.theory.teacher_id && course.sessions.theory.classes_per_week > 0) {
      errors.push(`Theory teacher not assigned for course ${course.course_code}`);
    }
    if (!course.sessions.lab.teacher_id && course.sessions.lab.classes_per_week > 0) {
      errors.push(`Lab teacher not assigned for course ${course.course_code}`);
    }
    if (!course.sessions.tutorial.teacher_id && course.sessions.tutorial.classes_per_week > 0) {
      errors.push(`Tutorial teacher not assigned for course ${course.course_code}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}