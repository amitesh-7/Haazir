import { Router } from "express";
import { getLiveStats, getBasicStats } from "../controllers/statsController";

const router = Router();

// Live stats for landing page (public - no auth required)
router.get("/live", getLiveStats);

// Basic stats for dashboard (could be protected if needed)
router.get("/basic", getBasicStats);

export default router;
