import express from 'express';
import { getDashboardStats, getSystemHealth } from '../controllers/dashboardController';
import authenticate from '../middleware/auth';

const router = express.Router();

// Get dashboard statistics (for coordinators)
router.get('/stats', authenticate, getDashboardStats);

// Get system health information
router.get('/health', authenticate, getSystemHealth);

export default router;