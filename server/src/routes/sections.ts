import express from "express";
import { authMiddleware } from "../middleware/auth";
import {
  getSectionsByDepartment,
  getAllSections,
  createSection,
  updateSection,
  deleteSection,
} from "../controllers/sectionController";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all sections
router.get("/", getAllSections);

// Get sections by department
router.get("/department/:departmentId", getSectionsByDepartment);

// Get sections by department and semester
router.get("/department/:departmentId/semester/:semester", getSectionsByDepartment);

// Create a new section
router.post("/", createSection);

// Update a section
router.put("/:sectionId", updateSection);

// Delete a section
router.delete("/:sectionId", deleteSection);

export default router;
