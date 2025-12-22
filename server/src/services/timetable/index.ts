/**
 * Timetable Generation Module
 * Exports all timetable-related services and types
 */

// Types
export * from './types';

// Services
export { AdvancedCSPSolver } from './advancedCSPSolver';
export { AITimetableGenerator } from './aiTimetableGenerator';
export { MultiKeyAIManager } from './multiKeyAIManager';
export { UnifiedTimetableService, GenerationMethod } from './unifiedTimetableService';

// Default export
import { UnifiedTimetableService } from './unifiedTimetableService';
export default UnifiedTimetableService;
