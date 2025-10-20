import express from "express";
import { authMiddleware } from "../middleware/auth";
import {
  getAllBatches,
  getBatchesBySection,
  createBatch,
  updateBatch,
  deleteBatch,
} from "../controllers/batchController";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all batches
router.get("/", getAllBatches);

// Get batches by section
router.get("/section/:sectionId", getBatchesBySection);

// Create a new batch
router.post("/", createBatch);

// Update a batch
router.put("/:batchId", updateBatch);

// Delete a batch
router.delete("/:batchId", deleteBatch);

export default router;
