import { Router } from "express";
import {
  getUnassignedStudents,
  bulkEnrollStudentsToSection,
  getStudentsBySection,
  bulkAssignStudentsToBatches,
  autoDistributeStudentsToBatches,
  removeStudentsFromBatch,
} from "../controllers/studentEnrollmentController";

const router = Router();

// Get unassigned students by department
router.get("/unassigned/:departmentId", getUnassignedStudents);

// Bulk enroll students to section
router.post("/bulk-enroll-section", bulkEnrollStudentsToSection);

// Get students by section (for batch bifurcation)
router.get("/section/:sectionId", getStudentsBySection);

// Bulk assign students to batches
router.post("/bulk-assign-batches", bulkAssignStudentsToBatches);

// Auto-distribute students to batches evenly
router.post("/auto-distribute-batches", autoDistributeStudentsToBatches);

// Remove students from batch
router.post("/remove-from-batch", removeStudentsFromBatch);

export default router;