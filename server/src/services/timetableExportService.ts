import { Request, Response } from "express";
import { Pool } from "pg";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

interface SavedTimetableSolution {
  id?: number;
  solution_id: string;
  department_id: number;
  semester: number;
  solution_data: any;
  quality_metrics?: any;
  metadata?: any;
  created_by?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface ExportOptions {
  format: "pdf" | "csv" | "excel" | "json";
  include_metadata?: boolean;
  group_by?: "day" | "teacher" | "section";
  orientation?: "portrait" | "landscape";
  institution_name?: string;
  academic_year?: string;
}

class TimetableExportService {
  private db: Pool | null;

  constructor(db: Pool | null = null) {
    this.db = db;
  }

  // Save timetable solution to database
  async saveTimetableSolution(
    solutionData: SavedTimetableSolution
  ): Promise<{ success: boolean; id?: number; message: string }> {
    try {
      const query = `
        INSERT INTO timetable_solutions 
        (solution_id, department_id, semester, solution_data, quality_metrics, metadata, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (solution_id) 
        DO UPDATE SET 
          solution_data = EXCLUDED.solution_data,
          quality_metrics = EXCLUDED.quality_metrics,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
        RETURNING id;
      `;

      const values = [
        solutionData.solution_id,
        solutionData.department_id,
        solutionData.semester,
        JSON.stringify(solutionData.solution_data),
        JSON.stringify(solutionData.quality_metrics || {}),
        JSON.stringify(solutionData.metadata || {}),
        solutionData.created_by,
      ];

      const result = await this.db.query(query, values);

      return {
        success: true,
        id: result.rows[0].id,
        message: "Timetable solution saved successfully",
      };
    } catch (error) {
      console.error("Error saving timetable solution:", error);
      return {
        success: false,
        message:
          "Failed to save timetable solution: " + (error as Error).message,
      };
    }
  }

  // Get saved timetable solutions
  async getSavedSolutions(
    departmentId?: number,
    semester?: number
  ): Promise<{
    success: boolean;
    data?: SavedTimetableSolution[];
    message: string;
  }> {
    try {
      let query = `
        SELECT id, solution_id, department_id, semester, solution_data, quality_metrics, metadata, created_by, created_at, updated_at
        FROM timetable_solutions
      `;
      const values: any[] = [];

      if (departmentId || semester) {
        const conditions: string[] = [];
        if (departmentId) {
          conditions.push(`department_id = $${values.length + 1}`);
          values.push(departmentId);
        }
        if (semester) {
          conditions.push(`semester = $${values.length + 1}`);
          values.push(semester);
        }
        query += ` WHERE ${conditions.join(" AND ")}`;
      }

      query += ` ORDER BY created_at DESC`;

      const result = await this.db.query(query, values);

      return {
        success: true,
        data: result.rows.map((row) => ({
          ...row,
          solution_data:
            typeof row.solution_data === "string"
              ? JSON.parse(row.solution_data)
              : row.solution_data,
          quality_metrics:
            typeof row.quality_metrics === "string"
              ? JSON.parse(row.quality_metrics)
              : row.quality_metrics,
          metadata:
            typeof row.metadata === "string"
              ? JSON.parse(row.metadata)
              : row.metadata,
        })),
        message: "Solutions retrieved successfully",
      };
    } catch (error) {
      console.error("Error retrieving solutions:", error);
      return {
        success: false,
        message: "Failed to retrieve solutions: " + (error as Error).message,
      };
    }
  }

  // Export timetable to PDF (simplified version - will need pdfkit package)
  async exportToPDF(
    solution: any,
    options: ExportOptions
  ): Promise<{ success: boolean; filePath?: string; message: string }> {
    try {
      // For now, return a simple HTML-to-PDF conversion message
      // TODO: Implement proper PDF generation with pdfkit or puppeteer

      const fileName = `timetable_${solution.id}_${Date.now()}.html`;
      const filePath = path.join(__dirname, "../../exports", fileName);

      // Ensure exports directory exists
      const exportDir = path.dirname(filePath);
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      // Generate HTML version for now
      const htmlContent = this.generateHTMLTimetable(solution, options);
      fs.writeFileSync(filePath, htmlContent);

      return {
        success: true,
        filePath,
        message:
          "HTML timetable exported successfully (PDF export requires additional setup)",
      };
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      return {
        success: false,
        message: "Failed to export timetable: " + (error as Error).message,
      };
    }
  }

  // Export timetable to Excel
  async exportToExcel(
    solution: any,
    options: ExportOptions
  ): Promise<{ success: boolean; filePath?: string; message: string }> {
    try {
      const workbook = XLSX.utils.book_new();

      // Main timetable sheet
      const timetableData = this.formatTimetableForExcel(
        solution.timetable_entries || [],
        options
      );
      const worksheet = XLSX.utils.json_to_sheet(timetableData);

      // Set column widths
      const colWidths = [
        { wch: 12 }, // Day
        { wch: 15 }, // Time Slot
        { wch: 12 }, // Course Code
        { wch: 30 }, // Course Name
        { wch: 20 }, // Teacher
        { wch: 10 }, // Room
        { wch: 12 }, // Session Type
        { wch: 10 }, // Section
      ];
      worksheet["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, "Timetable");

      // Summary sheet
      if (options.include_metadata) {
        const summaryData = [
          { Metric: "Solution Name", Value: solution.name },
          { Metric: "Optimization Type", Value: solution.optimization },
          { Metric: "Overall Score", Value: `${solution.score}%` },
          { Metric: "Conflicts", Value: solution.conflicts },
          {
            Metric: "Teacher Satisfaction",
            Value: `${solution.quality?.teacher_satisfaction || 0}%`,
          },
          {
            Metric: "Student Satisfaction",
            Value: `${solution.quality?.student_satisfaction || 0}%`,
          },
          {
            Metric: "Resource Utilization",
            Value: `${solution.quality?.resource_utilization || 0}%`,
          },
          {
            Metric: "Total Classes",
            Value: solution.metadata?.total_classes || 0,
          },
          {
            Metric: "Teachers Involved",
            Value: solution.metadata?.teachers_involved || 0,
          },
          { Metric: "Rooms Used", Value: solution.metadata?.rooms_used || 0 },
          { Metric: "Institution", Value: options.institution_name || "N/A" },
          { Metric: "Academic Year", Value: options.academic_year || "N/A" },
        ];
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        summarySheet["!cols"] = [{ wch: 25 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
      }

      const fileName = `timetable_${solution.id}_${Date.now()}.xlsx`;
      const filePath = path.join(__dirname, "../../exports", fileName);

      // Ensure exports directory exists
      const exportDir = path.dirname(filePath);
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      XLSX.writeFile(workbook, filePath);

      return {
        success: true,
        filePath,
        message: "Excel file exported successfully",
      };
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      return {
        success: false,
        message: "Failed to export Excel: " + (error as Error).message,
      };
    }
  }

  // Export timetable to CSV
  async exportToCSV(
    solution: any,
    options: ExportOptions
  ): Promise<{ success: boolean; filePath?: string; message: string }> {
    try {
      const timetableData = this.formatTimetableForExcel(
        solution.timetable_entries || [],
        options
      );
      const worksheet = XLSX.utils.json_to_sheet(timetableData);

      const fileName = `timetable_${solution.id}_${Date.now()}.csv`;
      const filePath = path.join(__dirname, "../../exports", fileName);

      // Ensure exports directory exists
      const exportDir = path.dirname(filePath);
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      XLSX.writeFile(
        { Sheets: { Timetable: worksheet }, SheetNames: ["Timetable"] },
        filePath,
        { bookType: "csv" }
      );

      return {
        success: true,
        filePath,
        message: "CSV file exported successfully",
      };
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      return {
        success: false,
        message: "Failed to export CSV: " + (error as Error).message,
      };
    }
  }

  // Helper method to draw timetable grid in PDF
  private generateHTMLTimetable(solution: any, options: ExportOptions): string {
    const groupedEntries = this.groupTimetableEntries(
      solution.timetable_entries || [],
      options.group_by || "day"
    );

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Timetable - ${solution.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .info { margin-bottom: 20px; }
          .group { margin-bottom: 20px; }
          .group-title { font-weight: bold; font-size: 14px; margin-bottom: 10px; }
          .entry { margin-bottom: 8px; padding: 5px; border-left: 3px solid #007bff; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${options.institution_name || "Educational Institution"}</h1>
          <h2>Class Timetable</h2>
          <p>Academic Year: ${options.academic_year || "Current"}</p>
        </div>
        
        <div class="info">
          <h3>Solution Information</h3>
          <p><strong>Name:</strong> ${solution.name}</p>
          <p><strong>Optimization:</strong> ${solution.optimization}</p>
          <p><strong>Overall Score:</strong> ${solution.score}%</p>
          <p><strong>Conflicts:</strong> ${solution.conflicts}</p>
        </div>
    `;

    if (options.include_metadata && solution.quality) {
      html += `
        <div class="info">
          <h3>Quality Metrics</h3>
          <p>Teacher Satisfaction: ${solution.quality.teacher_satisfaction}%</p>
          <p>Student Satisfaction: ${solution.quality.student_satisfaction}%</p>
          <p>Resource Utilization: ${solution.quality.resource_utilization}%</p>
        </div>
      `;
    }

    html += "<h3>Timetable Schedule</h3>";

    Object.keys(groupedEntries).forEach((groupKey) => {
      html += `
        <div class="group">
          <div class="group-title">${groupKey}</div>
      `;

      groupedEntries[groupKey].forEach((entry: any) => {
        html += `
          <div class="entry">
            <strong>${entry.timeSlot}</strong> - ${entry.courseCode} (${entry.courseName})<br>
            Teacher: ${entry.teacherName}, Room: ${entry.roomNumber}, Section: ${entry.section}
          </div>
        `;
      });

      html += "</div>";
    });

    html += "</body></html>";
    return html;
  }

  // Helper method to format timetable data for Excel/CSV
  private formatTimetableForExcel(entries: any[], options: ExportOptions) {
    if (!Array.isArray(entries) || entries.length === 0) {
      return [
        {
          Day: "No data",
          "Time Slot": "",
          "Course Code": "",
          "Course Name": "",
          Teacher: "",
          Room: "",
          "Session Type": "",
          Section: "",
        },
      ];
    }

    return entries.map((entry) => ({
      Day: entry.day || "",
      "Time Slot": entry.timeSlot || entry.time_slot || "",
      "Course Code": entry.courseCode || entry.course_code || "",
      "Course Name": entry.courseName || entry.course_name || "",
      Teacher: entry.teacherName || entry.teacher_name || "",
      Room: entry.roomNumber || entry.room_number || entry.classroom || "",
      "Session Type":
        entry.sessionType || entry.session_type || entry.class_type || "",
      Section: entry.section || "",
    }));
  }

  // Helper method to group timetable entries
  private groupTimetableEntries(entries: any[], groupBy: string) {
    return entries.reduce((groups: any, entry: any) => {
      let key = "";
      switch (groupBy) {
        case "teacher":
          key = entry.teacherName;
          break;
        case "section":
          key = entry.section;
          break;
        case "day":
        default:
          key = entry.day;
          break;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(entry);
      return groups;
    }, {});
  }
}

export default TimetableExportService;
