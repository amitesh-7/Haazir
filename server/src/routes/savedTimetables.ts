import { Router } from "express";
import authMiddleware from "../middleware/auth";
import {
  getSavedTimetables,
  getSavedTimetableById,
  createSavedTimetable,
  updateSavedTimetable,
  deleteSavedTimetable,
} from "../controllers/savedTimetableController";

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Routes
router.get("/", getSavedTimetables);
router.get("/:id", getSavedTimetableById);
router.post("/", createSavedTimetable);
router.put("/:id", updateSavedTimetable);
router.delete("/:id", deleteSavedTimetable);

export default router;
