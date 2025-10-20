import { Router } from "express";
import {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  getTeachersByDepartment,
  getTeachersByCourse,
  updateTeacher,
  deleteTeacher,
  getTeacherCourses,
  assignCoursesToTeacher,
  removeCourseFromTeacher,
} from "../controllers/teacherController_new";
import { authMiddleware, coordinatorOnly } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Route to get all teachers
router.get("/", getAllTeachers);

// Route to get teachers by department
router.get("/department/:departmentId", getTeachersByDepartment);

// Route to get teachers assigned to a specific course
router.get("/course/:courseId", getTeachersByCourse);

// Route to get a teacher by ID
router.get("/:id", getTeacherById);

// Route to create a new teacher (coordinator only)
router.post("/", coordinatorOnly, createTeacher);

// Route to update a teacher (coordinator only)
router.put("/:id", coordinatorOnly, updateTeacher);

// Route to delete a teacher (coordinator only)
router.delete("/:id", coordinatorOnly, deleteTeacher);

// Route to get courses assigned to a teacher
router.get("/:id/courses", getTeacherCourses);

// Route to assign courses to a teacher (coordinator only)
router.post("/:id/courses", coordinatorOnly, assignCoursesToTeacher);

// Route to remove course from teacher (coordinator only)
router.delete(
  "/:id/courses/:courseId",
  coordinatorOnly,
  removeCourseFromTeacher
);

export default router;
