import { Router } from 'express';
import { authMiddleware, coordinatorOnly } from '../middleware/auth';
import { 
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
} from '../controllers/courseController_new';

const router = Router();

router.use(authMiddleware);

router.get('/', getAllCourses);
router.get('/:id', getCourseById);
router.post('/', coordinatorOnly, createCourse);
router.put('/:id', coordinatorOnly, updateCourse);
router.delete('/:id', coordinatorOnly, deleteCourse);

export default router;
