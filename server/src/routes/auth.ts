import { Router } from 'express';
import { register, login, logout, getProfile, changePassword } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/profile', authMiddleware, getProfile);
router.put('/change-password', authMiddleware, changePassword);

export default router;