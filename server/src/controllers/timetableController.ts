import { Request, Response } from "express";
import Timetable from "../models/Timetable";
import Course from "../models/Course";
import Student from "../models/Student";
import Attendance from "../models/Attendance";
import Teacher from "../models/Teacher";
import Department from "../models/Department";
import Section from "../models/Section";
import Batch from "../models/Batch";
import SavedTimetable from "../models/SavedTimetable";

// Create a new timetable entry
export const createTimetableEntry = async (req: Request, res: Response) => {
  try {
    const {
      course_id,
      teacher_id,
      section_id,
      day_of_week,
      start_time,
      end_time,
      classroom,
      // batch_id,
      class_type,
      // target_audience,
    } = req.body;

    // Helper function to convert time string to minutes for proper comparison
    const timeToMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const newStartMinutes = timeToMinutes(start_time);
    const newEndMinutes = timeToMinutes(end_time);

    // Simple conflict detection: no overlapping for same teacher/day
    const conflicts = await Timetable.findAll({
      where: {
        teacher_id,
        day_of_week,
      },
      include: [
        {
          model: Section,
          as: "section",
          attributes: ["section_name"],
        },
      ],
    });

    const conflictingClass = conflicts.find((c: any) => {
      const existingStartMinutes = timeToMinutes(c.start_time);
      const existingEndMinutes = timeToMinutes(c.end_time);

      // Two time slots overlap if: new_start < existing_end AND new_end > existing_start
      // Adjacent slots (e.g., 9:30-10:20 and 10:20-11:10) should NOT be considered overlapping
      return (
        newStartMinutes < existingEndMinutes &&
        newEndMinutes > existingStartMinutes
      );
    });

    if (conflictingClass) {
      const sectionName =
        (conflictingClass as any).section?.section_name || "another section";
      return res.status(409).json({
        message: `Time conflict: teacher already has a class in Section ${sectionName} overlapping this time on ${day_of_week}`,
        conflictDetails: {
          section: sectionName,
          time: `${(conflictingClass as any).start_time} - ${
            (conflictingClass as any).end_time
          }`,
        },
      });
    }

    // Check classroom conflicts if classroom is provided
    if (classroom && classroom.trim() !== "") {
      const classroomConflicts = await Timetable.findAll({
        where: {
          classroom: classroom.trim(),
          day_of_week,
        },
      });

      const hasClassroomOverlap = classroomConflicts.some((c: any) => {
        const existingStartMinutes = timeToMinutes(c.start_time);
        const existingEndMinutes = timeToMinutes(c.end_time);

        // Same logic: check for actual overlap, not adjacency
        return (
          newStartMinutes < existingEndMinutes &&
          newEndMinutes > existingStartMinutes
        );
      });

      if (hasClassroomOverlap) {
        return res.status(409).json({
          message:
            "Classroom conflict: room is already booked during this time",
        });
      }
    }

    const newEntry = await Timetable.create({
      course_id,
      teacher_id,
      section_id,
      day_of_week,
      start_time,
      end_time,
      classroom,
      class_type: (class_type || "lecture").toLowerCase(),
    });
    res.status(201).json(newEntry);
  } catch (error: any) {
    console.error("Error creating timetable entry:", error);
    res.status(500).json({
      message: "Error creating timetable entry",
      error: error.message,
    });
  }
};

// Get all timetable entries
export const getTimetableEntries = async (req: Request, res: Response) => {
  try {
    const entries = await Timetable.findAll({
      attributes: [
        "schedule_id",
        "course_id",
        "teacher_id",
        "day_of_week",
        "start_time",
        "end_time",
        "classroom",
        "section_id",
        // "batch_id",
        "class_type",
        // "target_audience", // Include target_audience field
        "created_at",
        "updated_at",
      ],
      include: [
        {
          model: Course,
          as: "course",
          attributes: ["course_id", "course_code", "course_name"],
          required: false, // LEFT JOIN
        },
        {
          model: Teacher,
          as: "teacher",
          attributes: ["teacher_id", "name"],
          required: false, // LEFT JOIN
        },
        {
          model: Section,
          as: "section",
          attributes: ["section_id", "section_name", "description"],
          required: false, // LEFT JOIN
        },
        {
          model: Batch,
          as: "batch",
          attributes: ["batch_id", "batch_name"],
          required: false, // LEFT JOIN to include timetable entries without batches
        },
      ],
    });
    res.status(200).json(entries);
  } catch (error: any) {
    console.error("Error fetching timetable entries:", error);
    res.status(500).json({
      message: "Error fetching timetable entries",
      error: error.message || "Unknown error",
    });
  }
};

// Get timetable entries for a teacher
export const getTimetableByTeacher = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.params;
    const entries = await Timetable.findAll({
      where: { teacher_id: teacherId },
      include: [
        {
          model: Course,
          as: "course",
          attributes: ["course_id", "course_code", "course_name"],
        },
        { model: Teacher, as: "teacher", attributes: ["teacher_id", "name"] },
        {
          model: Section,
          as: "section",
          attributes: ["section_id", "section_name", "description"],
        },
      ],
    });
    res.status(200).json(entries);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching teacher timetable", error });
  }
};

// Get timetable entries for a section
export const getTimetableBySection = async (req: Request, res: Response) => {
  try {
    const { sectionId } = req.params;
    const entries = await Timetable.findAll({
      where: { section_id: sectionId },
      attributes: [
        "schedule_id",
        "course_id",
        "teacher_id",
        "day_of_week",
        "start_time",
        "end_time",
        "classroom",
        "section_id",
        // "batch_id",
        "class_type",
        // "target_audience",
        "created_at",
        "updated_at",
      ],
      include: [
        {
          model: Course,
          as: "course",
          attributes: ["course_id", "course_code", "course_name"],
          required: false,
        },
        {
          model: Teacher,
          as: "teacher",
          attributes: ["teacher_id", "name"],
          required: false,
        },
        {
          model: Section,
          as: "section",
          attributes: ["section_id", "section_name", "description"],
          required: false,
        },
        {
          model: Batch,
          as: "batch",
          attributes: ["batch_id", "batch_name"],
          required: false,
        },
      ],
      order: [
        ["day_of_week", "ASC"],
        ["start_time", "ASC"],
      ],
    });
    res.status(200).json(entries);
  } catch (error: any) {
    console.error("Error fetching section timetable:", error);
    res.status(500).json({
      message: "Error fetching section timetable",
      error: error.message || "Unknown error",
    });
  }
};

// Get timetable entries for a student (based on enrolled courses)
export const getTimetableByStudent = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params as any;
    const student = await Student.findByPk(studentId, {
      include: [
        {
          model: Course,
          as: "courses",
          through: { attributes: [] },
          attributes: ["course_id"],
        },
      ],
    });
    if (!student) return res.status(404).json({ message: "Student not found" });

    // @ts-ignore
    const courseIds: number[] = ((student as any).courses || []).map(
      (c: any) => c.course_id
    );
    if (!courseIds.length) return res.status(200).json([]);

    const entries = await Timetable.findAll({
      where: { course_id: courseIds },
      include: [
        {
          model: Course,
          as: "course",
          attributes: ["course_id", "course_code", "course_name"],
        },
        { model: Teacher, as: "teacher", attributes: ["teacher_id", "name"] },
        {
          model: Section,
          as: "section",
          attributes: ["section_id", "section_name", "description"],
        },
      ],
      order: [
        ["day_of_week", "ASC"],
        ["start_time", "ASC"],
      ],
    });

    return res.status(200).json(entries);
  } catch (error: any) {
    console.error("Get student timetable error:", error);
    return res.status(500).json({
      message: "Error fetching student timetable",
      error: error.message,
    });
  }
};

// Get roster (students) for a schedule, with optional attendance status for a specific date
export const getStudentsForSchedule = async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params as any;
    const dateParam =
      (req.query.date as string) || new Date().toISOString().split("T")[0];

    const schedule = await Timetable.findByPk(scheduleId);
    if (!schedule)
      return res.status(404).json({ message: "Schedule not found" });

    const courseId = (schedule as any).course_id;
    const course = await Course.findByPk(courseId, {
      include: [
        {
          model: Student,
          as: "students",
          through: { attributes: [] },
          attributes: ["student_id", "name", "roll_number", "department_id"],
        },
      ],
    });

    if (!course)
      return res.status(404).json({ message: "Course not found for schedule" });
    const students = ((course as any).students || []) as any[];

    // Load existing attendance for the same schedule + date
    const existing = await Attendance.findAll({
      where: { schedule_id: scheduleId, date: dateParam },
      attributes: ["student_id", "status"],
    });
    const byStudent = new Map<number, string>();
    existing.forEach((a: any) => byStudent.set(a.student_id, a.status));

    const roster = students.map((s: any) => ({
      student_id: s.student_id,
      name: s.name,
      roll_number: s.roll_number,
      status: byStudent.get(s.student_id) || null,
    }));

    return res
      .status(200)
      .json({ date: dateParam, schedule_id: scheduleId, roster });
  } catch (error: any) {
    console.error("Roster fetch error:", error);
    return res
      .status(500)
      .json({ message: "Error loading roster", error: error.message });
  }
};

// Get today's classes for a teacher
export const getTodayTimetableByTeacher = async (
  req: Request,
  res: Response
) => {
  try {
    const { teacherId } = req.params;
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const today = dayNames[new Date().getDay()];
    const entries = await Timetable.findAll({
      where: { teacher_id: teacherId, day_of_week: today },
      include: [
        {
          model: Course,
          as: "course",
          attributes: ["course_id", "course_code", "course_name"],
        },
        { model: Teacher, as: "teacher", attributes: ["teacher_id", "name"] },
      ],
      order: [["start_time", "ASC"]],
    });
    res.status(200).json(entries);
  } catch (error) {
    res.status(500).json({ message: "Error fetching today classes", error });
  }
};

export const updateTimetableEntry = async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const {
      course_id,
      teacher_id,
      section_id,
      day_of_week,
      start_time,
      end_time,
      classroom,
      // batch_id,
      class_type,
      // target_audience,
    } = req.body;

    console.log("🔄 Updating timetable entry:", {
      scheduleId,
      course_id,
      teacher_id,
      section_id,
      day_of_week,
      start_time,
      end_time,
      classroom,
      // batch_id,
      class_type,
      // target_audience,
    });

    // Helper function to convert time string to minutes for proper comparison
    const timeToMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const newStartMinutes = timeToMinutes(start_time);
    const newEndMinutes = timeToMinutes(end_time);

    // Conflict detection, excluding self
    const conflicts = await Timetable.findAll({
      where: {
        teacher_id,
        day_of_week,
      },
    });

    const hasOverlap = conflicts.some((c: any) => {
      if (c.schedule_id === Number(scheduleId)) return false; // Exclude self

      const existingStartMinutes = timeToMinutes(c.start_time);
      const existingEndMinutes = timeToMinutes(c.end_time);

      // Two time slots overlap if: new_start < existing_end AND new_end > existing_start
      return (
        newStartMinutes < existingEndMinutes &&
        newEndMinutes > existingStartMinutes
      );
    });

    if (hasOverlap) {
      return res.status(409).json({
        message:
          "Time conflict: teacher already has a class overlapping this time on the selected day",
      });
    }

    // Check classroom conflicts if classroom is provided
    if (classroom && classroom.trim() !== "") {
      const classroomConflicts = await Timetable.findAll({
        where: {
          classroom: classroom.trim(),
          day_of_week,
        },
      });

      const hasClassroomOverlap = classroomConflicts.some((c: any) => {
        if (c.schedule_id === Number(scheduleId)) return false; // Exclude self

        const existingStartMinutes = timeToMinutes(c.start_time);
        const existingEndMinutes = timeToMinutes(c.end_time);

        // Same logic: check for actual overlap, not adjacency
        return (
          newStartMinutes < existingEndMinutes &&
          newEndMinutes > existingStartMinutes
        );
      });

      if (hasClassroomOverlap) {
        return res.status(409).json({
          message:
            "Classroom conflict: room is already booked during this time",
        });
      }
    }

    const [count] = await Timetable.update(
      {
        course_id,
        teacher_id,
        section_id,
        day_of_week,
        start_time,
        end_time,
        classroom,
        // batch_id: batch_id || null,
        class_type: class_type || "lecture",
        // target_audience: target_audience || "Section",
      },
      { where: { schedule_id: scheduleId } }
    );

    console.log("✅ Update result:", { count, scheduleId });
    if (count === 0)
      return res.status(404).json({ message: "Timetable entry not found" });
    const updated = await Timetable.findOne({
      where: { schedule_id: scheduleId },
    });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating timetable entry", error });
  }
};

// Get today's timetable entries for a student
export const getTodayTimetableByStudent = async (
  req: Request,
  res: Response
) => {
  try {
    const { studentId } = req.params as any;
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.

    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const todayName = dayNames[today];

    const student = await Student.findByPk(studentId, {
      include: [
        {
          model: Course,
          as: "courses",
          through: { attributes: [] },
          attributes: ["course_id", "course_name", "course_code"],
        },
      ],
    });

    if (!student) return res.status(404).json({ message: "Student not found" });

    // @ts-ignore
    const courseIds: number[] = ((student as any).courses || []).map(
      (c: any) => c.course_id
    );

    if (!courseIds.length) return res.status(200).json([]);

    const entries = await Timetable.findAll({
      where: {
        course_id: courseIds,
        day_of_week: todayName,
      },
      include: [
        {
          model: Course,
          as: "course",
          attributes: ["course_id", "course_name", "course_code"],
        },
        {
          model: Teacher,
          as: "teacher",
          attributes: ["teacher_id", "name", "email"],
        },
      ],
      order: [["start_time", "ASC"]],
    });

    console.log(
      `Found ${entries.length} timetable entries for student ${studentId} on ${todayName}`
    );
    res.status(200).json(entries);
  } catch (error) {
    console.error("Error fetching student today timetable:", error);
    res.status(500).json({ message: "Error fetching timetable", error });
  }
};

// Delete a timetable entry
export const deleteTimetableEntry = async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const deleted = await Timetable.destroy({
      where: { schedule_id: scheduleId },
    });
    if (deleted === 0)
      return res.status(404).json({ message: "Timetable entry not found" });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting timetable entry", error });
  }
};

// Save timetable view settings for a section
export const saveTimetableViewSettings = async (
  req: Request,
  res: Response
) => {
  try {
    const { department_id, semester, section_id, grid_settings } = req.body;
    const user_id = (req as any).user?.user_id;

    if (!user_id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check if settings already exist for this section
    const existing = await SavedTimetable.findOne({
      where: {
        department: department_id.toString(),
        semester: semester.toString(),
        section: section_id.toString(),
      },
    });

    if (existing) {
      // Update existing settings
      await existing.update({
        gridSettings: grid_settings,
      });

      res.status(200).json({
        message: "Timetable view settings updated successfully",
        data: existing,
      });
    } else {
      // Create new settings
      const name = `Section ${section_id} - Semester ${semester} View Settings`;
      const newSettings = await SavedTimetable.create({
        name,
        department: department_id.toString(),
        semester: semester.toString(),
        section: section_id.toString(),
        entries: [],
        gridSettings: grid_settings,
        createdBy: user_id,
      });

      res.status(201).json({
        message: "Timetable view settings saved successfully",
        data: newSettings,
      });
    }
  } catch (error: any) {
    console.error("Error saving timetable view settings:", error);
    res.status(500).json({
      message: "Error saving timetable view settings",
      error: error.message,
    });
  }
};

// Fetch timetable view settings for a section
export const fetchTimetableViewSettings = async (
  req: Request,
  res: Response
) => {
  try {
    const { departmentId, semester, sectionId } = req.params;

    const settings = await SavedTimetable.findOne({
      where: {
        department: departmentId.toString(),
        semester: semester.toString(),
        section: sectionId.toString(),
      },
      order: [["updatedAt", "DESC"]],
    });

    if (settings) {
      res.status(200).json(settings.gridSettings);
    } else {
      // Return null if no settings found - let frontend use defaults
      res.status(200).json(null);
    }
  } catch (error: any) {
    console.error("Error fetching timetable view settings:", error);
    res.status(500).json({
      message: "Error fetching timetable view settings",
      error: error.message,
    });
  }
};

// Fetch timetable view settings by section ID only (for students)
export const fetchTimetableViewSettingsBySection = async (
  req: Request,
  res: Response
) => {
  try {
    const { sectionId } = req.params;

    const settings = await SavedTimetable.findOne({
      where: {
        section: sectionId.toString(),
      },
      order: [["updatedAt", "DESC"]],
    });

    if (settings) {
      res.status(200).json(settings.gridSettings);
    } else {
      // Return null if no settings found - let frontend use defaults
      res.status(200).json(null);
    }
  } catch (error: any) {
    console.error("Error fetching timetable view settings by section:", error);
    res.status(500).json({
      message: "Error fetching timetable view settings by section",
      error: error.message,
    });
  }
};

// ==================== NEW SMART TIMETABLE GENERATOR METHODS ====================

import { QueryTypes } from "sequelize";
import { sequelize } from "../config/database";

interface TimeSlot {
  slot_id: number;
  slot_name: string;
  start_time: string;
  end_time: string;
  day_order: number;
  is_break: boolean;
  is_active: boolean;
}

// Helper function for raw queries
const query = async (sql: string, values?: any[]) => {
  const results = await sequelize.query(sql, {
    bind: values,
    type: QueryTypes.SELECT,
  });
  return { rows: results as any[] };
};

// Get all time slots with their current configuration
export const getTimeSlots = async (req: Request, res: Response) => {
  try {
    console.log("🕐 Fetching time slots configuration...");

    const result = await query(
      "SELECT * FROM time_slots ORDER BY day_order ASC"
    );

    const timeSlots = result.rows as TimeSlot[];
    console.log(`✅ Found ${timeSlots.length} time slots`);

    res.json({
      success: true,
      data: timeSlots,
      stats: {
        total_slots: timeSlots.length,
        active_slots: timeSlots.filter((slot) => slot.is_active).length,
        break_slots: timeSlots.filter((slot) => slot.is_break).length,
        teaching_slots: timeSlots.filter(
          (slot) => slot.is_active && !slot.is_break
        ).length,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching time slots:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch time slots",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update time slot configuration (enable/disable slots)
export const updateTimeSlot = async (req: Request, res: Response) => {
  try {
    const { slotId } = req.params;
    const { is_active } = req.body;

    console.log(`🔄 Updating time slot ${slotId} - active: ${is_active}`);

    const result = await query(
      "UPDATE time_slots SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE slot_id = $2 RETURNING *",
      [is_active, slotId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Time slot not found",
      });
    }

    console.log("✅ Time slot updated successfully");

    res.json({
      success: true,
      data: result.rows[0],
      message: `Time slot ${is_active ? "enabled" : "disabled"} successfully`,
    });
  } catch (error) {
    console.error("❌ Error updating time slot:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update time slot",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Add new custom time slot
export const addTimeSlot = async (req: Request, res: Response) => {
  try {
    const { slot_name, start_time, end_time, is_break = false } = req.body;

    console.log("➕ Adding new time slot:", slot_name);

    // Get the next day_order
    const orderResult = await query(
      "SELECT COALESCE(MAX(day_order), 0) + 1 as next_order FROM time_slots"
    );
    const nextOrder = (orderResult.rows[0] as any).next_order;

    const result = await query(
      `
      INSERT INTO time_slots (slot_name, start_time, end_time, day_order, is_break, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *
    `,
      [slot_name, start_time, end_time, nextOrder, is_break]
    );

    console.log("✅ Time slot added successfully");

    res.json({
      success: true,
      data: result.rows[0],
      message: "Time slot added successfully",
    });
  } catch (error) {
    console.error("❌ Error adding time slot:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add time slot",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get courses for a specific department and semester
export const getCoursesForDepartmentSemester = async (
  req: Request,
  res: Response
) => {
  try {
    const { departmentId, semester } = req.params;

    console.log(
      `📚 Fetching courses for department ${departmentId}, semester ${semester}`
    );

    const result = await query(
      `
      SELECT 
        c.course_id,
        c.course_name,
        c.course_code,
        c.semester,
        c.department_id,
        d.name as department_name
      FROM courses c
      JOIN departments d ON c.department_id = d.department_id
      WHERE c.department_id = $1 AND c.semester = $2
      ORDER BY c.course_code
    `,
      [departmentId, semester]
    );

    const courses = result.rows as any[];
    console.log(`✅ Found ${courses.length} courses`);

    res.json({
      success: true,
      data: courses,
      stats: {
        total_courses: courses.length,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching courses:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch courses",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get teachers available for a specific course/department
export const getAvailableTeachers = async (req: Request, res: Response) => {
  try {
    const { departmentId, courseId } = req.query;

    console.log(
      `👨‍🏫 Fetching available teachers for department ${departmentId}, course ${courseId}`
    );

    let queryText = `
      SELECT 
        t.teacher_id,
        t.name,
        d.name as department_name,
        u.email
      FROM teachers t
      JOIN departments d ON t.department_id = d.department_id
      JOIN users u ON t.user_id = u.user_id
      WHERE t.department_id = $1
      ORDER BY t.name
    `;

    const result = await query(queryText, [departmentId]);

    const teachers = result.rows as any[];
    console.log(`✅ Found ${teachers.length} available teachers`);

    res.json({
      success: true,
      data: teachers,
      stats: {
        total_teachers: teachers.length,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching teachers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch teachers",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Create new timetable generation request
export const createTimetableRequest = async (req: Request, res: Response) => {
  try {
    const {
      request_name,
      department_id,
      semester,
      sections,
      academic_year,
      settings,
    } = req.body;

    const created_by = (req as any).user?.user_id;

    console.log("📋 Creating timetable request:", request_name);

    const result = await query(
      `
      INSERT INTO timetable_requests 
      (request_name, department_id, semester, sections, academic_year, settings, created_by, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')
      RETURNING *
    `,
      [
        request_name,
        department_id,
        semester,
        sections,
        academic_year,
        JSON.stringify(settings),
        created_by,
      ]
    );

    const timetableRequest = result.rows[0] as any;
    console.log(
      "✅ Timetable request created with ID:",
      timetableRequest.request_id
    );

    res.json({
      success: true,
      data: timetableRequest,
      message: "Timetable request created successfully",
    });
  } catch (error) {
    console.error("❌ Error creating timetable request:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create timetable request",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get all timetable requests for a department
export const getTimetableRequests = async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params;

    console.log(
      `📋 Fetching timetable requests for department ${departmentId}`
    );

    const result = await query(
      `
      SELECT 
        tr.*,
        d.name as department_name,
        u.name as created_by_name
      FROM timetable_requests tr
      JOIN departments d ON tr.department_id = d.department_id
      JOIN users u ON tr.created_by = u.user_id
      WHERE tr.department_id = $1
      ORDER BY tr.created_at DESC
    `,
      [departmentId]
    );

    const requests = result.rows as any[];
    console.log(`✅ Found ${requests.length} timetable requests`);

    res.json({
      success: true,
      data: requests,
      stats: {
        total_requests: requests.length,
        draft: requests.filter((r: any) => r.status === "draft").length,
        generated: requests.filter((r: any) => r.status === "generated").length,
        active: requests.filter((r: any) => r.status === "active").length,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching timetable requests:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch timetable requests",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Basic timetable generation (placeholder for now)
// ==================== AI-POWERED TIMETABLE GENERATION ====================
import GeminiTimetableService from "../services/geminiTimetableService";

export const generateTimetableAI = async (req: Request, res: Response) => {
  try {
    const generationInput: any = req.body;

    console.log("🚀 Starting University-Wide Timetable Generation");
    console.log("📊 Input:", {
      courses: generationInput.courseAssignments?.length || 0,
      sections: generationInput.sections?.length || 0,
      days: generationInput.timeConfiguration?.working_days?.length || 0,
    });

    // **ENHANCEMENT**: If courseAssignments is provided, use it
    // Otherwise, fetch ALL courses from ALL departments for university-wide scheduling
    let courseAssignments = generationInput.courseAssignments || [];

    if (courseAssignments.length === 0) {
      console.log(
        "📚 No courses provided - fetching ALL courses from ALL departments..."
      );

      // This would fetch all courses - but for now, use provided data
      // You can implement this to query the database for all courses
      console.log("⚠️ Using provided course assignments only");
    } else {
      console.log(
        `✅ Using ${courseAssignments.length} provided course assignments`
      );
    }

    // Create Gemini generator instance (which uses CSP solver)
    const generator = new GeminiTimetableService();

    // Generate timetables using CSP solver
    const startTime = Date.now();
    const solutions = await generator.generateTimetables(generationInput);
    const generationTime = Date.now() - startTime;

    console.log("✅ Timetable generation completed:", {
      success: solutions.length > 0,
      solutions: solutions.length,
      time: generationTime + "ms",
    });

    res.json({
      success: solutions.length > 0,
      solutions: solutions,
      generation_summary: {
        total_solutions_attempted: solutions.length,
        successful_solutions: solutions.length,
        total_generation_time_ms: generationTime,
        input_summary: {
          total_courses: courseAssignments.length,
          total_sections: generationInput.sections?.length || 0,
          available_days:
            generationInput.timeConfiguration?.working_days?.length ||
            generationInput.time_configuration?.workingDays?.length ||
            0,
        },
      },
    });
  } catch (error) {
    console.error("❌ Gemini timetable generation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate timetable",
      details: error instanceof Error ? error.message : "Unknown error",
      solutions: [],
      generation_summary: {
        total_solutions_attempted: 0,
        successful_solutions: 0,
        total_generation_time_ms: 0,
        input_summary: {},
      },
    });
  }
};

export const generateTimetable = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;

    console.log(`⚡ Starting timetable generation for request ${requestId}`);

    // Update request status to generating
    await query(
      "UPDATE timetable_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE request_id = $2",
      ["generating", requestId]
    );

    // Placeholder for actual generation algorithm
    // This will be implemented in the next phase

    // For now, just update status to generated
    setTimeout(async () => {
      await query(
        "UPDATE timetable_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE request_id = $2",
        ["generated", requestId]
      );
    }, 3000);

    console.log("✅ Timetable generation started");

    res.json({
      success: true,
      message: "Timetable generation started",
      status: "generating",
      estimated_time: "2-3 minutes",
    });
  } catch (error) {
    console.error("❌ Error generating timetable:", error);
    res.status(500).json({
      success: false,
      error: "Failed to start timetable generation",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
