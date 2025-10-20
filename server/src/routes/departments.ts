import { Router } from 'express';
import { authMiddleware, coordinatorOnly } from '../middleware/auth';
import { getAllDepartments, createDepartment, updateDepartment, deleteDepartment } from '../controllers/departmentController';

const router = Router();

router.use(authMiddleware);

router.get('/', getAllDepartments);
router.post('/', coordinatorOnly, createDepartment);
router.put('/:id', coordinatorOnly, updateDepartment);
router.delete('/:id', coordinatorOnly, deleteDepartment);

export default router;
