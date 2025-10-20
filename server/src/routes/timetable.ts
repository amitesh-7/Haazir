import express from 'express';
import { 
  createTimetableEntry, 
  getTimetableEntries, 
  updateTimetableEntry, 
  deleteTimetableEntry, 
  getTimetableByTeacher, 
  getTodayTimetableByTeacher, 
  getStudentsForSchedule, 
  getTimetableByStudent, 
  getTodayTimetableByStudent, 
  getTimetableBySection,
  saveTimetableViewSettings,
  fetchTimetableViewSettings,
  fetchTimetableViewSettingsBySection,
  // New Smart Timetable Generator functions
  getTimeSlots,
  updateTimeSlot,
  addTimeSlot,
  getCoursesForDepartmentSemester,
  getAvailableTeachers,
  createTimetableRequest,
  getTimetableRequests,
  generateTimetable,
  generateTimetableAI
} from '../controllers/timetableController';
import authenticate from '../middleware/auth';

const router = express.Router();

// Create a new timetable entry
router.post('/', authenticate, createTimetableEntry);

// Get all timetable entries
router.get('/', authenticate, getTimetableEntries);
router.get('/section/:sectionId', authenticate, getTimetableBySection);
router.get('/teacher/:teacherId', authenticate, getTimetableByTeacher);
router.get('/teacher/:teacherId/today', authenticate, getTodayTimetableByTeacher);
router.get('/student/:studentId', authenticate, getTimetableByStudent);
router.get('/student/:studentId/today', authenticate, getTodayTimetableByStudent);
router.get('/:scheduleId/students', authenticate, getStudentsForSchedule);

// Update a timetable entry
router.put('/:scheduleId', authenticate, updateTimetableEntry);

// Delete a timetable entry
router.delete('/:scheduleId', authenticate, deleteTimetableEntry);

// Timetable view settings routes
router.post('/view-settings', authenticate, saveTimetableViewSettings);
router.get('/view-settings/:departmentId/:semester/:sectionId', authenticate, fetchTimetableViewSettings);
router.get('/view-settings/section/:sectionId', authenticate, fetchTimetableViewSettingsBySection);

// ==================== NEW SMART TIMETABLE GENERATOR ROUTES ====================

// Time Slot Management
router.get('/generator/time-slots', authenticate, getTimeSlots);
router.put('/generator/time-slots/:slotId', authenticate, updateTimeSlot);
router.post('/generator/time-slots', authenticate, addTimeSlot);

// Course and Teacher Data
router.get('/generator/courses/:departmentId/:semester', authenticate, getCoursesForDepartmentSemester);
router.get('/generator/teachers', authenticate, getAvailableTeachers);

// Timetable Generation Requests
router.post('/generator/requests', authenticate, createTimetableRequest);
router.get('/generator/requests/:departmentId', authenticate, getTimetableRequests);
router.post('/generator/requests/:requestId/generate', authenticate, generateTimetable);

// AI-Powered Timetable Generation (NEW!)
router.post('/generator/generate-ai', authenticate, generateTimetableAI);

export default router;