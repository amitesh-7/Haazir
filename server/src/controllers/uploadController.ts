import { Request, Response } from "express";
import multer from "multer";
import { parse } from "csv-parse";
import User from "../models/User";
import Student from "../models/Student";
import Department from "../models/Department";
import bcrypt from "bcryptjs";

// Multer setup for in-memory storage (no disk writes)
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

type Row = {
  email: string;
  name: string;
  roll_number: string;
  semester?: string; // required (updated from year)
  department_id?: string; // numeric id
  department_name?: string; // alternative, exact name match
  contact_number?: string;
  parent_name?: string;
  parent_contact?: string;
  address?: string;
};

export const importStudentsCsv = async (req: Request, res: Response) => {
  try {
    const file = (req as any).file as { buffer: Buffer } | undefined;
    if (!file) {
      return res
        .status(400)
        .json({ message: 'CSV file is required under field name "file"' });
    }

    const content = file.buffer.toString("utf-8");

    const rows: Row[] = await new Promise((resolve, reject) => {
      const out: Row[] = [];
      parse(content, { columns: true, skip_empty_lines: true, trim: true })
        .on("readable", function (this: any) {
          let record;
          while ((record = this.read())) {
            out.push(record as Row);
          }
        })
        .on("error", reject)
        .on("end", () => resolve(out));
    });

    if (!rows.length) {
      return res.status(400).json({ message: "CSV appears to be empty" });
    }

    const results: Array<{
      row: number;
      email?: string;
      roll_number?: string;
      status: "created" | "skipped" | "error";
      reason?: string;
    }> = [];

    // Preload departments by code and id for faster lookup
    const departments = await Department.findAll();
    const depById = new Map<number, Department>();
    const depByName = new Map<string, Department>();
    departments.forEach((d: any) => {
      depById.set(d.department_id, d);
      if (d.name) depByName.set(String(d.name).toLowerCase(), d);
    });

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNum = i + 1; // human friendly
      const email = (r.email || "").trim().toLowerCase();
      const name = (r.name || "").trim();
      const rollNumber = (r.roll_number || "").trim();
      const deptName = (r.department_name || "").trim().toLowerCase();
      const deptIdStr = (r.department_id || "").trim();
      const semesterStr = (r.semester || "").trim();

      // Basic validation
      if (
        !email ||
        !name ||
        !rollNumber ||
        (!deptName && !deptIdStr) ||
        !semesterStr
      ) {
        results.push({
          row: rowNum,
          email,
          roll_number: rollNumber,
          status: "error",
          reason: "Missing required fields",
        });
        continue;
      }
      const semester = Number(semesterStr);
      if (!Number.isFinite(semester) || semester < 1 || semester > 8) {
        results.push({
          row: rowNum,
          email,
          roll_number: rollNumber,
          status: "error",
          reason: "Invalid semester (must be 1-8)",
        });
        continue;
      }

      // Resolve department
      let departmentId: number | null = null;
      if (deptIdStr) {
        const id = Number(deptIdStr);
        if (!Number.isFinite(id) || !depById.get(id)) {
          results.push({
            row: rowNum,
            email,
            roll_number: rollNumber,
            status: "error",
            reason: "Invalid department_id",
          });
          continue;
        }
        departmentId = id;
      } else if (deptName) {
        const d = depByName.get(deptName);
        if (!d) {
          results.push({
            row: rowNum,
            email,
            roll_number: rollNumber,
            status: "error",
            reason: "Unknown department_name",
          });
          continue;
        }
        departmentId = (d as any).department_id;
      }

      try {
        // Skip if email already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          results.push({
            row: rowNum,
            email,
            roll_number: rollNumber,
            status: "skipped",
            reason: "User email exists",
          });
          continue;
        }

        // Create user with temp password = roll number (can be improved)
        const password_hash = await bcrypt.hash(rollNumber, 10);
        const user = await User.create({
          email,
          password_hash,
          role: "student",
        });

        // Create student
        await Student.create({
          user_id: (user as any).user_id,
          name,
          roll_number: rollNumber,
          department_id: departmentId!,
          semester,
          year: semester, // Set year to same value as semester for backward compatibility
          contact_number: (r.contact_number || "").trim() || null,
          parent_name: (r.parent_name || "").trim() || null,
          parent_contact: (r.parent_contact || "").trim() || null,
          address: (r.address || "").trim() || null,
        });
        results.push({
          row: rowNum,
          email,
          roll_number: rollNumber,
          status: "created",
        });
      } catch (err: any) {
        let reason = err?.message || "Unknown error";
        if (
          reason.includes("UNIQUE") ||
          reason.toLowerCase().includes("unique")
        ) {
          reason = "Duplicate roll_number or email";
        }
        results.push({
          row: rowNum,
          email,
          roll_number: rollNumber,
          status: "error",
          reason,
        });
      }
    }

    const summary = {
      total: rows.length,
      created: results.filter((r) => r.status === "created").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      errors: results.filter((r) => r.status === "error").length,
      results,
    };

    return res.status(200).json(summary);
  } catch (error: any) {
    console.error("CSV import error:", error);
    return res
      .status(500)
      .json({ message: "Error importing students", error: error.message });
  }
};
