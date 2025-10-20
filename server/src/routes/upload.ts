import { Router } from 'express';
import { authMiddleware, coordinatorOnly } from '../middleware/auth';
import { upload, importStudentsCsv } from '../controllers/uploadController';

const router = Router();

router.use(authMiddleware);

// POST /api/upload/students - CSV import
router.post('/students', coordinatorOnly, upload.single('file'), importStudentsCsv);

export default router;
