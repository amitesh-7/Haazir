import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

// Initialize models and associations BEFORE routes
import "./models";

// Import middleware
import { apiLimiter, authLimiter } from "./middleware/rateLimiter";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { securityHeaders, sanitizeRequest, preventParamPollution } from "./middleware/security";
import logger from "./utils/logger";
import { cacheService } from "./services/CacheService";

// Import routes
import authRoutes from "./routes/auth";
import attendanceRoutes from "./routes/attendance";
import attendanceStatsRoutes from "./routes/attendanceStats";
import analyticsRoutes from "./routes/analytics";
import batchRoutes from "./routes/batches";
import courseRoutes from "./routes/courses_new";
import dashboardRoutes from "./routes/dashboard";
import dataEntryRoutes from "./routes/dataEntry";
import departmentRoutes from "./routes/departments";
import notificationRoutes from "./routes/notifications";
import savedTimetableRoutes from "./routes/savedTimetables";
import sectionRoutes from "./routes/sections";
import smartAttendanceRoutes from "./routes/smartAttendance";
import smartTimetableRoutes from "./routes/smartTimetableRoutesSimple";
import statsRoutes from "./routes/stats";
import studentEnrollmentRoutes from "./routes/studentEnrollment";
import studentRoutes from "./routes/students_new";
import teacherRoutes from "./routes/teachers_new";
import timetableRoutes from "./routes/timetable";
import uploadRoutes from "./routes/upload";
import dualVerificationRoutes from "./routes/dualVerification";

const app = express();
const PORT = process.env.PORT || 5000;

// Log startup
logger.info('Starting Haazir API Server', { port: PORT, env: process.env.NODE_ENV });

// Security middleware - apply first
app.use(securityHeaders);
app.use(sanitizeRequest);
app.use(preventParamPollution(['ids', 'fields'])); // Allow array params for these

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// CORS Configuration - Allow frontend and localhost
const normalizeOrigin = (value?: string | null) =>
  value ? value.trim().replace(/\/$/, "") : undefined;

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "https://haazir-six.vercel.app",
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
]
  .map(normalizeOrigin)
  .filter(Boolean) as string[];

const allowedOriginSet = new Set(allowedOrigins);

logger.info('CORS configuration loaded', { origins: Array.from(allowedOriginSet) });

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        // Allow requests without origin (mobile apps, curl, etc.)
        return callback(null, true);
      }

      const normalizedOrigin = normalizeOrigin(origin);

      if (normalizedOrigin && allowedOriginSet.has(normalizedOrigin)) {
        return callback(null, true);
      }

      if (
        process.env.NODE_ENV !== "production" &&
        normalizedOrigin?.startsWith("http://localhost")
      ) {
        return callback(null, true);
      }

      logger.warn('CORS blocked origin', { origin, allowed: Array.from(allowedOriginSet) });
      return callback(null, false);
    },
    credentials: true,
    optionsSuccessStatus: 204,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Apply rate limiting to all API routes
app.use("/api/", apiLimiter);

// Apply stricter rate limiting to auth routes
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/attendance-stats", attendanceStatsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/data-entry", dataEntryRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/saved-timetables", savedTimetableRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/smart-attendance", smartAttendanceRoutes);
app.use("/api/smart-attendance/dual-verify", dualVerificationRoutes);
app.use("/api/smart-timetable", smartTimetableRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/student-enrollment", studentEnrollmentRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/upload", uploadRoutes);

// Health check endpoint with detailed status
app.get("/api/health", (req, res) => {
  const healthData = {
    status: "healthy", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "2.0.0",
    environment: process.env.NODE_ENV || "development",
    cache: cacheService.getStats(),
  };
  
  res.json({ 
    success: true,
    data: healthData,
    meta: { timestamp: new Date().toISOString() },
  });
});

// Default route
app.get("/", (req, res) => {
  res.json({ 
    success: true,
    data: { message: "Haazir API Server is running!" },
    meta: { timestamp: new Date().toISOString() },
  });
});

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// Start server (only in non-production environment)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    logger.info('Server started successfully', {
      port: PORT,
      apiUrl: `http://localhost:${PORT}/api`,
      healthCheck: `http://localhost:${PORT}/api/health`,
    });
  });
}

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  cacheService.destroy();
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Export for Vercel serverless
export default app;
