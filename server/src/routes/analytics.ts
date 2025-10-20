import { Router } from 'express';
import { 
    getStudentAnalytics, 
    getClassAttendanceAnalytics,
    exportAttendanceData
} from '../controllers/analyticsController';
import { authMiddleware, teacherOrCoordinator } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get student analytics - accessible by the student themselves or coordinators/teachers
router.get('/student/:studentId?', getStudentAnalytics);

// Get class attendance analytics - for teachers and coordinators
router.get('/class/:scheduleId', teacherOrCoordinator, getClassAttendanceAnalytics);

// Export attendance data as CSV
router.get('/export', exportAttendanceData);

export default router;