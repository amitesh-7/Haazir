import express from 'express';
import dataEntryController from '../controllers/dataEntryController';
import { authMiddleware as authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

// Excel template generation routes
router.get('/templates/student', authenticateToken, dataEntryController.generateStudentTemplate.bind(dataEntryController));
router.get('/templates/teacher', authenticateToken, dataEntryController.generateTeacherTemplate.bind(dataEntryController));

// File upload and parsing routes
router.post('/parse', authenticateToken, upload.single('file'), dataEntryController.parseUploadedFile.bind(dataEntryController));

// Enhanced validation routes
router.post('/validate', authenticateToken, dataEntryController.validateDataWithSuggestions.bind(dataEntryController));
router.post('/validate-batch', authenticateToken, dataEntryController.validateBatchWithSuggestions.bind(dataEntryController));

// Bulk import route
router.post('/import', authenticateToken, dataEntryController.bulkImportData.bind(dataEntryController));

// Validation rules routes
router.get('/validation-rules/:type', authenticateToken, dataEntryController.getValidationRules.bind(dataEntryController));

export default router;