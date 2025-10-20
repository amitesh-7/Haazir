import { Router } from 'express';
import { 
    markAttendance, 
    getAttendanceByStudent, 
    getAttendanceByClass,
    markAttendanceBulk,
    getStudentsForTimetableSlot,
    getAttendanceReport,
    getStudentAttendanceSummary,
    enrollStudentsInCourse,
    markTimetableAttendance,
    getAttendanceHistory,
    getAttendanceDatesForTeacher,
    getUnifiedAttendance
} from '../controllers/attendanceController';
import authenticate from '../middleware/auth';

const router = Router();

// Existing routes
router.post('/', authenticate, markAttendance);
router.post('/bulk', authenticate, markAttendanceBulk);
router.get('/student/:studentId', authenticate, getAttendanceByStudent);
router.get('/class/:scheduleId', authenticate, getAttendanceByClass);
router.get('/history/:studentId', authenticate, getAttendanceByStudent);

// New enhanced attendance routes
router.get('/timetable/:schedule_id/students', authenticate, getStudentsForTimetableSlot);
router.post('/timetable/:schedule_id/mark', authenticate, markTimetableAttendance);
router.get('/report/course/:course_id', authenticate, getAttendanceReport);
router.get('/summary/student/:student_id', authenticate, getStudentAttendanceSummary);
router.post('/course/:course_id/enroll', authenticate, enrollStudentsInCourse);

// Attendance history routes
router.get('/history', authenticate, getAttendanceHistory);
router.get('/dates/teacher/:teacher_id', authenticate, getAttendanceDatesForTeacher);

// Unified attendance route (Manual + Smart combined)
router.get('/unified', authenticate, getUnifiedAttendance);

export default router;