import { Router } from "express";
import {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentCourses,
  getStudentCourseAssignments,
  assignCourseToStudent,
  removeCourseFromStudent,
  updateSelfProfile,
  getStudentsBySection,
  getUnassignedStudents,
  enrollStudentInSection,
  unenrollStudentFromSection,
  bulkEnrollStudents,
} from "../controllers/studentController_new";
import {
  authMiddleware,
  coordinatorOnly,
  studentOnly,
} from "../middleware/auth";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Route to get all students
router.get("/", getAllStudents);

// Student self-profile update (must be before parameterized routes to avoid shadowing)
router.put("/me/profile", authMiddleware, studentOnly, updateSelfProfile);

// Student Enrollment Routes - MUST be before /:id routes to avoid parameter conflicts
// Get unassigned students
router.get("/unassigned", coordinatorOnly, getUnassignedStudents);

// Get students by section
router.get("/section/:sectionId", coordinatorOnly, getStudentsBySection);

// Bulk enroll students (specific route)
router.post("/bulk-enroll", coordinatorOnly, bulkEnrollStudents);

// Route to get a student by ID
router.get("/:id", getStudentById);

// Courses assigned to a student
router.get("/:id/courses", getStudentCourses);

// Courses assigned to a student with teacher information
router.get("/:id/course-assignments", getStudentCourseAssignments);
router.post("/:id/courses", coordinatorOnly, assignCourseToStudent);
router.delete(
  "/:id/courses/:courseId",
  coordinatorOnly,
  removeCourseFromStudent
);

// Route to create a new student (coordinator only)
router.post("/", coordinatorOnly, createStudent);

// Route to update a student (coordinator only)
router.put("/:id", coordinatorOnly, updateStudent);

// Route to delete a student (coordinator only)
router.delete("/:id", coordinatorOnly, deleteStudent);

// Enroll student in section
router.put("/:studentId/enroll", coordinatorOnly, enrollStudentInSection);

// Unenroll student from section
router.put("/:studentId/unenroll", coordinatorOnly, unenrollStudentFromSection);

export default router;
