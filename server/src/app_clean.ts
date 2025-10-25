import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Initialize models and associations BEFORE routes
import "./models";

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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
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

console.log("🔒 CORS allowed origins:", Array.from(allowedOriginSet));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        // Allow requests without origin (mobile apps, curl, etc.)
        console.log("✅ CORS: Allowing request with no origin");
        return callback(null, true);
      }

      const normalizedOrigin = normalizeOrigin(origin);

      if (normalizedOrigin && allowedOriginSet.has(normalizedOrigin)) {
        console.log(`✅ CORS: Allowing origin: ${normalizedOrigin}`);
        return callback(null, true);
      }

      if (
        process.env.NODE_ENV !== "production" &&
        normalizedOrigin?.startsWith("http://localhost")
      ) {
        console.log(`✅ CORS: Allowing localhost origin: ${normalizedOrigin}`);
        return callback(null, true);
      }

      console.warn(`❌ CORS: Blocking origin: ${origin}`);
      console.warn("Allowed origins set:", Array.from(allowedOriginSet));
      return callback(null, false);
    },
    credentials: true,
    optionsSuccessStatus: 204,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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
app.use("/api/smart-timetable", smartTimetableRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/student-enrollment", studentEnrollmentRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/upload", uploadRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Default route
app.get("/", (req, res) => {
  res.json({ message: "Haazir API Server is running!" });
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err);
    res.status(500).json({
      error: err?.message || "Internal server error",
      stack:
        process.env.NODE_ENV !== "production" && err?.stack
          ? err.stack
          : undefined,
    });
  }
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server (only in non-production environment)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  });
}

// Export for Vercel serverless
export default app;
