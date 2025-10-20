import { Router, Request, Response } from "express";
import {
  getTimeSlots,
  updateTimeSlot,
  addTimeSlot,
  getCoursesForDepartmentSemester,
  getAvailableTeachers,
  createTimetableRequest,
  getTimetableRequests,
  generateTimetable,
  // Existing routes
  createTimetableEntry,
  getTimetableByTeacher,
  getTimetableByStudent,
  getTimetableEntries,
  updateTimetableEntry,
  deleteTimetableEntry,
  getTimetableBySection,
  saveTimetableViewSettings,
  fetchTimetableViewSettingsBySection,
} from "../controllers/timetableController";

import { authMiddleware } from "../middleware/auth";
import TimetableExportService from "../services/timetableExportService";
import GeminiTimetableService from "../services/geminiTimetableService";
import SmartTimetableSolution from "../models/SmartTimetableSolution";

// Extend Request interface for authenticated requests
interface AuthenticatedRequest extends Request {
  user?: {
    user_id: number;
    email: string;
    role: string;
    department_id?: number;
  };
}

const router = Router();

// Initialize export service (simplified version)
const exportService = new TimetableExportService({} as any);

// ==================== EXISTING ROUTES ====================
router.post("/entries", authMiddleware, createTimetableEntry);
router.get("/teacher/:teacherId", getTimetableByTeacher);
router.get("/student/:rollNo", getTimetableByStudent);
router.get("/", getTimetableEntries);
router.put("/entries/:id", authMiddleware, updateTimetableEntry);
router.delete("/entries/:id", authMiddleware, deleteTimetableEntry);
router.get("/section/:sectionId", getTimetableBySection);
router.post("/save-grid", authMiddleware, saveTimetableViewSettings);
router.get("/saved/:sectionId", fetchTimetableViewSettingsBySection);

// ==================== NEW SMART TIMETABLE GENERATOR ROUTES ====================

// Time Slot Management
router.get("/generator/time-slots", authMiddleware, getTimeSlots);
router.put("/generator/time-slots/:slotId", authMiddleware, updateTimeSlot);
router.post("/generator/time-slots", authMiddleware, addTimeSlot);

// Course and Teacher Data
router.get(
  "/generator/courses/:departmentId/:semester",
  authMiddleware,
  getCoursesForDepartmentSemester
);
router.get("/generator/teachers", authMiddleware, getAvailableTeachers);

// Timetable Generation Requests
router.post("/generator/requests", authMiddleware, createTimetableRequest);
router.get(
  "/generator/requests/:departmentId",
  authMiddleware,
  getTimetableRequests
);
router.post(
  "/generator/requests/:requestId/generate",
  authMiddleware,
  generateTimetable
);

// ==================== AI ROUTES (GEMINI INTEGRATION) ====================

// AI Generation - Simple test without authentication for development
router.post("/ai/generate-test", async (req: Request, res: Response) => {
  try {
    console.log("🤖 AI Generate Test Route Hit (No Auth)!");
    console.log("Request body:", req.body);

    const geminiService = new GeminiTimetableService();

    // Generate solutions using Gemini API
    const solutions = await geminiService.generateTimetables(req.body);

    res.json({
      success: true,
      message: "AI timetable generation completed successfully!",
      solutions,
      timestamp: new Date().toISOString(),
      powered_by: "Google Gemini AI",
    });
  } catch (error) {
    console.error("❌ AI Generation Error:", error);

    // Provide fallback solutions on error
    const geminiService = new GeminiTimetableService();
    const fallbackSolutions = geminiService.generateFallbackSolutions();

    res.status(200).json({
      success: true,
      message: "Generated fallback solutions (Gemini API unavailable)",
      solutions: fallbackSolutions,
      timestamp: new Date().toISOString(),
      fallback: true,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// AI Generation - With authentication for production use
router.post(
  "/ai/generate",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log("🤖 AI Generate Route Hit!");
      console.log("Request body:", req.body);
      console.log("User:", req.user);

      const geminiService = new GeminiTimetableService();

      // Add user context to request for personalized generation
      const requestWithContext = {
        ...req.body,
        user: {
          id: req.user?.user_id,
          role: req.user?.role,
          department: req.user?.department_id,
        },
      };

      // Generate solutions using Gemini API
      const solutions = await geminiService.generateTimetables(
        requestWithContext
      );

      res.json({
        success: true,
        message: "AI timetable generation completed successfully!",
        solutions,
        timestamp: new Date().toISOString(),
        powered_by: "Google Gemini AI",
        generated_for: req.user?.role || "user",
      });
    } catch (error) {
      console.error("❌ AI Generation Error:", error);

      // Provide fallback solutions on error
      const geminiService = new GeminiTimetableService();
      const fallbackSolutions = geminiService.generateFallbackSolutions();

      res.status(200).json({
        success: true,
        message: "Generated fallback solutions (Gemini API unavailable)",
        solutions: fallbackSolutions,
        timestamp: new Date().toISOString(),
        fallback: true,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// ==================== EXPORT & SAVE ROUTES ====================

// Save timetable solution to Supabase database
router.post(
  "/solutions/save",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log("💾 Save Timetable Solution Route Hit!");
      console.log("Request body:", JSON.stringify(req.body, null, 2));

      const { solution, metadata } = req.body;

      if (!solution) {
        return res.status(400).json({
          success: false,
          message: "Missing required field: solution",
        });
      }

      if (!metadata?.institutionName || !metadata?.academicYear) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required metadata: institutionName and academicYear",
        });
      }

      // Create new record in Supabase database
      const savedSolution = await SmartTimetableSolution.create({
        solutionId: solution.id || `solution-${Date.now()}`,
        institutionName: metadata.institutionName,
        academicYear: metadata.academicYear,
        description: metadata.description || "",
        solutionName: solution.name,
        optimizationType: solution.optimization,
        overallScore: solution.score,
        conflicts: solution.conflicts || 0,
        qualityMetrics: solution.quality,
        timetableEntries: solution.timetable_entries, // CRITICAL: Save the actual entries
        metadata: solution.metadata,
        departmentId: metadata.departmentId || null,
        semester: metadata.semester || null,
        createdBy: req.user?.user_id,
      });

      console.log("✅ Timetable solution saved to Supabase:", {
        id: savedSolution.id,
        solution_id: savedSolution.solutionId,
        institution: savedSolution.institutionName,
        academic_year: savedSolution.academicYear,
        score: savedSolution.overallScore,
        entries_count: savedSolution.timetableEntries?.length || 0,
      });

      res.json({
        success: true,
        message: "Timetable solution saved successfully to database",
        data: {
          id: savedSolution.id,
          solution_id: savedSolution.solutionId,
          saved_at: savedSolution.createdAt,
        },
      });
    } catch (error) {
      console.error("❌ Save Solution Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to save timetable solution",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Get saved timetable solutions from Supabase database
router.get(
  "/solutions/saved",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log("📋 Get Saved Solutions Route Hit!");

      const { department_id, semester, limit = 50 } = req.query;

      // Build query filters
      const whereClause: any = {};

      if (department_id) {
        whereClause.departmentId = parseInt(department_id as string);
      }

      if (semester) {
        whereClause.semester = parseInt(semester as string);
      }

      // Query database for saved solutions
      const savedSolutions = await SmartTimetableSolution.findAll({
        where: whereClause,
        order: [["createdAt", "DESC"]],
        limit: parseInt(limit as string),
        attributes: [
          "id",
          "solutionId",
          "institutionName",
          "academicYear",
          "description",
          "solutionName",
          "optimizationType",
          "overallScore",
          "conflicts",
          "qualityMetrics",
          "timetableEntries",
          "metadata",
          "departmentId",
          "semester",
          "createdBy",
          "createdAt",
          "updatedAt",
        ],
      });

      console.log("📋 Found saved timetables:", savedSolutions.length);

      // Format the response to match frontend expectations
      const formattedSolutions = savedSolutions.map((solution) => ({
        id: solution.id,
        solution_id: solution.solutionId,
        institution_name: solution.institutionName,
        academic_year: solution.academicYear,
        description: solution.description,
        solution_data: {
          name: solution.solutionName,
          optimization: solution.optimizationType,
          score: solution.overallScore,
          conflicts: solution.conflicts,
          quality: solution.qualityMetrics,
          timetable_entries: solution.timetableEntries, // CRITICAL: Include entries
          metadata: solution.metadata,
        },
        department_id: solution.departmentId,
        semester: solution.semester,
        created_by: solution.createdBy,
        created_at: solution.createdAt,
        updated_at: solution.updatedAt,
      }));

      res.json({
        success: true,
        data: formattedSolutions,
        message: `Retrieved ${formattedSolutions.length} saved solution(s) from database`,
      });
    } catch (error) {
      console.error("❌ Get Saved Solutions Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve saved solutions",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Export timetable solution
router.post(
  "/solutions/export",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    console.log("\n" + "=".repeat(80));
    console.log("📤 EXPORT ENDPOINT HIT!");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Method:", req.method);
    console.log("URL:", req.url);
    console.log("=".repeat(80));

    try {
      console.log("📤 Export Timetable Solution Route Hit!");
      console.log("User:", req.user);
      console.log("Auth header:", req.headers.authorization);

      const { solution, format, metadata } = req.body;

      console.log("📋 Export format:", format);
      console.log("📊 Solution to export:", solution?.name || "Unknown");
      console.log("📊 Solution ID:", solution?.id || "No ID");
      console.log(
        "📊 Solution has timetable_entries:",
        Array.isArray(solution?.timetable_entries)
      );
      console.log(
        "📊 Number of entries:",
        solution?.timetable_entries?.length || 0
      );

      if (!solution || !format) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: solution, format",
        });
      }

      const exportOptions = {
        format: format as "pdf" | "csv" | "excel" | "json",
        include_metadata: true,
        group_by: "day" as "day" | "teacher" | "section",
        orientation: "landscape" as "portrait" | "landscape",
        institution_name:
          metadata?.institutionName || "Educational Institution",
        academic_year: metadata?.academicYear || "2024-25",
      };

      try {
        let result;
        switch (format.toLowerCase()) {
          case "json":
            const jsonData = {
              ...solution,
              export_metadata: {
                exported_at: new Date().toISOString(),
                exported_by: req.user?.email,
                exportFormat: "json",
                ...exportOptions,
              },
            };

            res.setHeader("Content-Type", "application/json");
            res.setHeader(
              "Content-Disposition",
              `attachment; filename="timetable_${
                solution.id || "export"
              }_${Date.now()}.json"`
            );
            return res.send(JSON.stringify(jsonData, null, 2));

          case "csv":
            console.log("🔄 Starting CSV export...");
            result = await exportService.exportToCSV(solution, exportOptions);
            console.log("CSV export result:", result);
            if (result.success && result.filePath) {
              console.log(
                "✅ CSV file created, sending download:",
                result.filePath
              );
              res.setHeader("Content-Type", "text/csv");
              res.setHeader(
                "Content-Disposition",
                `attachment; filename="timetable_${
                  solution.id || "export"
                }_${Date.now()}.csv"`
              );
              return res.download(result.filePath);
            } else {
              console.error("❌ CSV export failed:", result.message);
              return res.status(500).json({
                success: false,
                message: result.message || "CSV export failed",
              });
            }

          case "excel":
          case "xlsx":
            console.log("🔄 Starting Excel export...");
            result = await exportService.exportToExcel(solution, exportOptions);
            console.log("Excel export result:", result);
            if (result.success && result.filePath) {
              console.log(
                "✅ Excel file created, sending download:",
                result.filePath
              );

              // Check if file exists before sending
              const fs = require("fs");
              if (!fs.existsSync(result.filePath)) {
                console.error("❌ File doesn't exist:", result.filePath);
                return res.status(500).json({
                  success: false,
                  message: "Generated file not found",
                });
              }

              res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              );
              res.setHeader(
                "Content-Disposition",
                `attachment; filename="timetable_${
                  solution.id || "export"
                }_${Date.now()}.xlsx"`
              );

              // Use download with error callback
              return res.download(result.filePath, (err) => {
                if (err) {
                  console.error("❌ Error sending file:", err);
                  if (!res.headersSent) {
                    res.status(500).json({
                      success: false,
                      message: "Error sending file: " + err.message,
                    });
                  }
                } else {
                  console.log("✅ File sent successfully");
                }
              });
            } else {
              console.error("❌ Excel export failed:", result.message);
              return res.status(500).json({
                success: false,
                message: result.message || "Excel export failed",
              });
            }

          case "html":
          case "pdf":
            console.log("🔄 Starting HTML/PDF export...");
            result = await exportService.exportToPDF(solution, exportOptions);
            console.log("HTML/PDF export result:", result);
            if (result.success && result.filePath) {
              console.log(
                "✅ HTML file created, sending download:",
                result.filePath
              );
              res.setHeader("Content-Type", "text/html");
              res.setHeader(
                "Content-Disposition",
                `attachment; filename="timetable_${
                  solution.id || "export"
                }_${Date.now()}.html"`
              );
              return res.download(result.filePath);
            } else {
              console.error("❌ HTML/PDF export failed:", result.message);
              return res.status(500).json({
                success: false,
                message: result.message || "HTML/PDF export failed",
              });
            }

          default:
            return res.status(400).json({
              success: false,
              message:
                "Unsupported export format. Supported: json, csv, excel, html",
            });
        }

        // This should not be reached if all cases return properly
        console.error("⚠️ Export completed but no response sent");
        if (result && result.success) {
          res.json(result);
        } else {
          res.status(500).json({
            success: false,
            message: "Export failed",
            error: result?.message || "Unknown error",
          });
        }
      } catch (exportError) {
        console.error("💥 Export processing error:");
        console.error(
          "Error name:",
          exportError instanceof Error ? exportError.name : typeof exportError
        );
        console.error(
          "Error message:",
          exportError instanceof Error
            ? exportError.message
            : String(exportError)
        );
        console.error(
          "Error stack:",
          exportError instanceof Error ? exportError.stack : "No stack trace"
        );
        console.error("Full error object:", exportError);

        res.status(500).json({
          success: false,
          message: "Export processing failed",
          error:
            exportError instanceof Error
              ? exportError.message
              : "Unknown error",
          details:
            exportError instanceof Error
              ? exportError.stack
              : String(exportError),
        });
      }
    } catch (error) {
      console.error("❌ Export Solution Error:");
      console.error(
        "Error name:",
        error instanceof Error ? error.name : typeof error
      );
      console.error(
        "Error message:",
        error instanceof Error ? error.message : String(error)
      );
      console.error(
        "Error stack:",
        error instanceof Error ? error.stack : "No stack trace"
      );
      console.error("Full error object:", error);

      res.status(500).json({
        success: false,
        message: "Failed to export timetable solution",
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : String(error),
      });
    }
  }
);

export default router;
