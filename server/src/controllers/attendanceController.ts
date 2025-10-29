import { Request, Response } from "express";
import { Op, Sequelize } from "sequelize";
import Attendance from "../models/Attendance";
import Timetable from "../models/Timetable";
import Student from "../models/Student";
import Course from "../models/Course";
import Teacher from "../models/Teacher";
import Department from "../models/Department";
import Section from "../models/Section";
import SmartAttendanceRecord from "../models/SmartAttendanceRecord";
import AttendanceSession from "../models/AttendanceSession";

// Mark attendance for a specific class
export const markAttendance = async (req: Request, res: Response) => {
  const { scheduleId, studentId, status } = req.body;

  try {
    const attendanceRecord = await Attendance.create({
      schedule_id: scheduleId,
      student_id: studentId,
      date: new Date(),
      status,
    });
    res.status(201).json(attendanceRecord);
  } catch (error) {
    res.status(500).json({ message: "Error marking attendance", error });
  }
};

// Bulk mark attendance: accepts an array of { schedule_id, student_id, date, status }
export const markAttendanceBulk = async (req: Request, res: Response) => {
  try {
    const items = Array.isArray(req.body) ? req.body : req.body?.items;
    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "Provide an array of attendance items" });
    }
    const results: any[] = [];
    for (const item of items) {
      const schedule_id = item.schedule_id ?? item.scheduleId;
      const student_id = item.student_id ?? item.studentId;
      const date = item.date || new Date().toISOString().split("T")[0];
      const status = item.status;
      if (!schedule_id || !student_id || !status) {
        results.push({ ...item, statusCode: 400, message: "Missing fields" });
        continue;
      }
      try {
        const rec = await Attendance.create({
          schedule_id,
          student_id,
          date,
          status,
        });
        results.push({ ...item, statusCode: 201, result: rec });
      } catch (err: any) {
        const msg = (err?.message || "").toLowerCase();
        if (msg.includes("unique")) {
          results.push({
            ...item,
            statusCode: 409,
            message: "Duplicate attendance",
          });
        } else {
          results.push({ ...item, statusCode: 500, message: "Error saving" });
        }
      }
    }
    return res.status(207).json({ results });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Error in bulk attendance", error: error.message });
  }
};

// Get attendance records for a specific student
export const getAttendanceByStudent = async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const { date, schedule_id } = req.query;

  try {
    const whereClause: any = { student_id: studentId };

    // Add optional filters
    if (date) {
      whereClause.date = date;
    }
    if (schedule_id) {
      whereClause.schedule_id = schedule_id;
    }

    // Query regular attendance records
    const attendanceRecords = await Attendance.findAll({
      where: whereClause,
      include: [
        {
          model: Timetable,
          as: "timetable",
          include: [
            {
              model: Course,
              as: "course",
            },
            {
              model: Teacher,
              as: "teacher",
              attributes: ["teacher_id", "name", "department_id"], // Fixed: don't include email
            },
          ],
        },
      ],
      order: [["date", "DESC"]],
    });

    // Query smart attendance records (without includes since associations aren't set up)
    const smartAttendanceRecordsRaw = await SmartAttendanceRecord.findAll({
      where: whereClause,
      order: [["date", "DESC"]],
    });

    // Manually fetch related data for smart attendance records
    const smartAttendanceRecords = await Promise.all(
      smartAttendanceRecordsRaw.map(async (record: any) => {
        const timetable = await Timetable.findOne({
          where: { schedule_id: record.schedule_id },
          include: [
            {
              model: Course,
              as: "course",
            },
            {
              model: Teacher,
              as: "teacher",
              attributes: ["teacher_id", "name", "department_id"],
            },
          ],
        });

        // Format to match regular attendance record structure
        return {
          ...record.toJSON(),
          timetable: timetable ? timetable.toJSON() : null,
        };
      })
    );

    // Merge both records
    const mergedRecords = [...attendanceRecords, ...smartAttendanceRecords];

    // Sort by date descending
    mergedRecords.sort((a: any, b: any) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    console.log(
      `Found ${attendanceRecords.length} regular + ${smartAttendanceRecords.length} smart attendance records for student ${studentId}`,
      { filters: { date, schedule_id } }
    );
    res.status(200).json(mergedRecords);
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    res.status(500).json({
      message: "Error fetching attendance records",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}; // Get attendance records for a specific class
export const getAttendanceByClass = async (req: Request, res: Response) => {
  const { scheduleId } = req.params;

  try {
    const attendanceRecords = await Attendance.findAll({
      where: { schedule_id: scheduleId },
    });
    res.status(200).json(attendanceRecords);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching attendance records", error });
  }
};

/**
 * Get students who should attend a specific timetable slot
 * This function determines which students need attendance tracking for a given schedule
 */
export const getStudentsForTimetableSlot = async (
  req: Request,
  res: Response
) => {
  try {
    const { schedule_id } = req.params;

    console.log("🔍 Fetching students for timetable slot:", schedule_id);

    // Get the timetable slot with course and section information
    const timetableSlot = (await Timetable.findByPk(schedule_id, {
      include: [
        {
          model: Course,
          as: "course",
          include: [
            {
              model: Department,
              as: "department",
              attributes: ["department_id", "name"],
            },
          ],
        },
        {
          model: Teacher,
          as: "teacher",
          attributes: ["teacher_id", "name", "department_id"],
        },
        {
          model: Section,
          as: "section",
          attributes: [
            "section_id",
            "section_name",
            "semester",
            "department_id",
          ],
          include: [
            {
              model: Department,
              as: "department",
              attributes: ["department_id", "name"],
            },
          ],
        },
      ],
    })) as any;

    if (!timetableSlot) {
      return res.status(404).json({ message: "Timetable slot not found" });
    }

    console.log("📋 Timetable slot details:", {
      schedule_id: timetableSlot.schedule_id,
      course_id: timetableSlot.course_id,
      section_id: timetableSlot.section_id,
      course_semester: timetableSlot.course?.semester,
      course_department: timetableSlot.course?.department_id,
    });

    // Build query to find students matching the timetable criteria
    const studentWhere: any = {};

    // Match by department from course
    if (timetableSlot.course?.department_id) {
      studentWhere.department_id = timetableSlot.course.department_id;
    }

    // Match by semester from course
    if (timetableSlot.course?.semester) {
      studentWhere.semester = timetableSlot.course.semester;
    }

    // Match by section from timetable (most specific filter)
    if (timetableSlot.section_id) {
      studentWhere.section_id = timetableSlot.section_id;
    }

    console.log("🔎 Searching for students with criteria:", studentWhere);

    // Fetch all students matching the criteria
    const eligibleStudents = (await Student.findAll({
      where: studentWhere,
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["department_id", "name"],
        },
        {
          model: Section,
          as: "section",
          attributes: ["section_id", "section_name", "semester"],
        },
      ],
      order: [
        ["roll_number", "ASC"],
        ["name", "ASC"],
      ],
    })) as any[];

    console.log(`✅ Found ${eligibleStudents.length} eligible students`);

    // Get existing attendance for this schedule and date (today)
    const today = new Date().toISOString().split("T")[0];
    const existingAttendance = await Attendance.findAll({
      where: {
        schedule_id: schedule_id,
        date: today,
      },
    });

    const attendanceMap = new Map();
    existingAttendance.forEach((record: any) => {
      attendanceMap.set(record.student_id, record.status);
    });

    // Add attendance status to students
    const studentsWithAttendance = eligibleStudents.map((student: any) => ({
      ...student.toJSON(),
      attendance_status: attendanceMap.get(student.student_id) || null,
      attendance_marked: attendanceMap.has(student.student_id),
    }));

    res.json({
      timetableSlot: {
        schedule_id: timetableSlot.schedule_id,
        course: {
          course_id: timetableSlot.course?.course_id,
          course_name: timetableSlot.course?.course_name,
          course_code: timetableSlot.course?.course_code,
          semester: timetableSlot.course?.semester,
          department: timetableSlot.course?.department,
        },
        section: timetableSlot.section
          ? {
              section_id: timetableSlot.section.section_id,
              section_name: timetableSlot.section.section_name,
              semester: timetableSlot.section.semester,
              department: timetableSlot.section.department,
            }
          : null,
        teacher: timetableSlot.teacher,
        day_of_week: timetableSlot.day_of_week,
        start_time: timetableSlot.start_time,
        end_time: timetableSlot.end_time,
        classroom: timetableSlot.classroom,
      },
      eligibleStudents: studentsWithAttendance,
      totalStudents: studentsWithAttendance.length,
      filterCriteria: {
        department_id: studentWhere.department_id || "any",
        semester: studentWhere.semester || "any",
        section_id: studentWhere.section_id || "any",
      },
      attendanceDate: today,
      attendanceMarked: existingAttendance.length,
      attendancePending:
        studentsWithAttendance.length - existingAttendance.length,
    });
  } catch (error) {
    console.error("❌ Error getting students for timetable slot:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    res.status(500).json({
      message: "Error fetching students for attendance",
      error: error instanceof Error ? error.message : "Unknown error",
      details: error instanceof Error ? error.stack : String(error),
    });
  }
};

/**
 * Get attendance report for a specific course and date range
 */
export const getAttendanceReport = async (req: Request, res: Response) => {
  try {
    const { course_id } = req.params;
    const { start_date, end_date, section_id } = req.query;

    const whereClause: any = {};

    if (start_date && end_date) {
      whereClause.date = {
        [Op.between]: [start_date, end_date],
      };
    }

    const timetableWhere: any = {
      course_id: course_id,
    };

    if (section_id) {
      timetableWhere.section_id = section_id;
    }

    const attendanceRecords = (await Attendance.findAll({
      where: whereClause,
      include: [
        {
          model: Timetable,
          as: "timetable",
          where: timetableWhere,
          include: [
            {
              model: Course,
              as: "course",
            },
            {
              model: Teacher,
              as: "teacher",
            },
          ],
        },
        {
          model: Student,
          as: "student",
          include: [{ model: Department, as: "department" }],
        },
      ],
      order: [
        ["date", "DESC"],
        ["student_id", "ASC"],
      ],
    })) as any[];

    // Group by date and student for better reporting
    const groupedAttendance = attendanceRecords.reduce(
      (acc: any, record: any) => {
        const dateKey = record.date.toISOString().split("T")[0];
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push({
          student: record.student,
          status: record.status,
          timetable: record.timetable,
        });
        return acc;
      },
      {}
    );

    res.json({
      course_id,
      date_range: { start_date, end_date },
      section_id,
      total_records: attendanceRecords.length,
      attendance_by_date: groupedAttendance,
    });
  } catch (error) {
    console.error("Error generating attendance report:", error);
    res.status(500).json({
      message: "Error generating attendance report",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get student's attendance summary (includes both manual and smart attendance)
 */
export const getStudentAttendanceSummary = async (
  req: Request,
  res: Response
) => {
  try {
    const { student_id } = req.params;
    const { start_date, end_date } = req.query;

    console.log("📊 Fetching attendance summary for student:", student_id);
    console.log("📅 Date range:", { start_date, end_date });

    const whereClause: any = {
      student_id,
    };

    if (start_date && end_date) {
      whereClause.date = {
        [Op.between]: [start_date, end_date],
      };
    }

    // Fetch manual attendance records
    const manualAttendanceRecords = (await Attendance.findAll({
      where: whereClause,
      include: [
        {
          model: Timetable,
          as: "timetable",
          include: [
            {
              model: Course,
              as: "course",
            },
            {
              model: Teacher,
              as: "teacher",
            },
          ],
        },
      ],
      order: [["date", "DESC"]],
    })) as any[];

    console.log(
      "✅ Manual attendance records:",
      manualAttendanceRecords.length
    );

    // Fetch smart attendance records
    const smartWhereClause: any = {
      student_id,
    };

    if (start_date && end_date) {
      smartWhereClause.created_at = {
        [Op.between]: [start_date, end_date],
      };
    }

    const smartAttendanceRecords = (await SmartAttendanceRecord.findAll({
      where: smartWhereClause,
      include: [
        {
          model: AttendanceSession,
          as: "session",
          include: [
            {
              model: Timetable,
              as: "timetable",
              include: [
                {
                  model: Course,
                  as: "course",
                },
                {
                  model: Teacher,
                  as: "teacher",
                },
              ],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    })) as any[];

    console.log("✅ Smart attendance records:", smartAttendanceRecords.length);

    // Combine both records into a unified format
    const allRecords = [
      ...manualAttendanceRecords.map((record: any) => ({
        attendance_id: record.attendance_id,
        date: record.date,
        status: record.status,
        type: "manual",
        timetable: record.timetable,
      })),
      ...smartAttendanceRecords.map((record: any) => ({
        attendance_id: record.record_id,
        date: record.created_at
          ? new Date(record.created_at).toISOString().split("T")[0]
          : null,
        status: record.status,
        type: "smart",
        verification_method: record.verification_method,
        timetable: record.session?.timetable,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log("✅ Total combined records:", allRecords.length);

    // Calculate summary statistics
    const totalClasses = allRecords.length;
    const presentCount = allRecords.filter(
      (record) => record.status === "present"
    ).length;
    const absentCount = allRecords.filter(
      (record) => record.status === "absent"
    ).length;
    const attendancePercentage =
      totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;

    // Group by course
    const courseWiseAttendance = allRecords.reduce((acc: any, record: any) => {
      const courseId = record.timetable?.course_id;
      const courseName = record.timetable?.course?.course_name;

      if (courseId && !acc[courseId]) {
        acc[courseId] = {
          course_name: courseName || "Unknown Course",
          total_classes: 0,
          present: 0,
          absent: 0,
          percentage: 0,
        };
      }

      if (courseId) {
        acc[courseId].total_classes++;
        if (record.status === "present") {
          acc[courseId].present++;
        } else {
          acc[courseId].absent++;
        }

        acc[courseId].percentage =
          (acc[courseId].present / acc[courseId].total_classes) * 100;
      }

      return acc;
    }, {});

    res.json({
      student_id,
      date_range: { start_date, end_date },
      summary: {
        total_classes: totalClasses,
        present: presentCount,
        absent: absentCount,
        attendance_percentage: Math.round(attendancePercentage * 100) / 100,
      },
      course_wise_attendance: courseWiseAttendance,
      recent_attendance: allRecords.slice(0, 10), // Last 10 records
    });
  } catch (error) {
    console.error("❌ Error getting student attendance summary:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    res.status(500).json({
      message: "Error fetching student attendance summary",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Enroll students in courses (helper function for setting up attendance relationships)
 */
/**
 * Mark attendance for a specific timetable slot and date (Enhanced version)
 */
export const markTimetableAttendance = async (req: Request, res: Response) => {
  try {
    const { schedule_id } = req.params;
    const { date, attendance_records } = req.body;

    // Validate input
    if (!date || !Array.isArray(attendance_records)) {
      return res.status(400).json({
        message: "Date and attendance_records array are required",
      });
    }

    // Verify timetable slot exists
    const timetableSlot = await Timetable.findByPk(schedule_id, {
      include: [
        {
          model: Course,
          as: "course",
          attributes: ["course_id", "course_name", "course_code"],
        },
      ],
    });
    if (!timetableSlot) {
      return res.status(404).json({ message: "Timetable slot not found" });
    }

    // VALIDATION: Check if the selected date matches the timetable's day_of_week
    const selectedDate = new Date(date);
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const selectedDayOfWeek = dayNames[selectedDate.getDay()];
    const scheduledDayOfWeek = (timetableSlot as any).day_of_week;

    if (selectedDayOfWeek.toLowerCase() !== scheduledDayOfWeek.toLowerCase()) {
      return res.status(400).json({
        message:
          "Date mismatch: Selected date doesn't match the schedule's day of week",
        details: {
          selected_date: date,
          selected_day: selectedDayOfWeek,
          scheduled_day: scheduledDayOfWeek,
          course_name: (timetableSlot as any).course?.course_name,
          hint: `This class is scheduled for ${scheduledDayOfWeek}, but ${date} is a ${selectedDayOfWeek}. Please select the correct date.`,
        },
      });
    }

    const results: any[] = [];
    const errors: any[] = [];
    const duplicates: any[] = [];

    // Process each attendance record
    for (const record of attendance_records) {
      const { student_id, status } = record;

      try {
        // Check if attendance already exists for this schedule_id, student, and date
        const existingAttendance = await Attendance.findOne({
          where: {
            schedule_id,
            student_id,
            date,
          },
        });

        if (existingAttendance) {
          // Check if this is the exact same record (same status)
          if (existingAttendance.status === status) {
            duplicates.push({
              student_id,
              status: "duplicate",
              message: `Attendance already marked as ${status} for this class`,
              attendance_id: existingAttendance.attendance_id,
            });
            continue; // Skip to next student
          }

          // Update existing attendance if status changed
          await existingAttendance.update({ status });
          results.push({
            student_id,
            status: "updated",
            attendance_status: status,
            previous_status: existingAttendance.status,
            attendance_id: existingAttendance.attendance_id,
          });
        } else {
          // Additional check: Find if student has ANY attendance for this course on this date
          // to prevent multiple entries for same course on same day
          const anyExistingForCourse = await Attendance.findOne({
            where: {
              student_id,
              date,
            },
            include: [
              {
                model: Timetable,
                as: "timetable",
                where: {
                  course_id: (timetableSlot as any).course_id,
                },
                required: true,
              },
            ],
          });

          if (anyExistingForCourse) {
            duplicates.push({
              student_id,
              status: "duplicate",
              message: `Attendance already marked for course ${
                (timetableSlot as any).course?.course_name
              } on this date`,
              existing_attendance_id: anyExistingForCourse.attendance_id,
            });
            continue; // Skip to next student
          }

          // Create new attendance record
          const newAttendance = await Attendance.create({
            schedule_id: Number(schedule_id),
            student_id,
            date,
            status,
          });
          results.push({
            student_id,
            status: "created",
            attendance_status: status,
            attendance_id: newAttendance.attendance_id,
          });
        }
      } catch (error: any) {
        errors.push({
          student_id,
          error: error?.message || "Unknown error",
        });
      }
    }

    res.json({
      message: "Attendance marking completed",
      successful_records: results.length,
      failed_records: errors.length,
      duplicate_records: duplicates.length,
      results,
      errors,
      duplicates,
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({
      message: "Error marking attendance",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const enrollStudentsInCourse = async (req: Request, res: Response) => {
  try {
    const { course_id } = req.params;
    const { student_ids } = req.body;

    if (!Array.isArray(student_ids)) {
      return res.status(400).json({
        message: "student_ids must be an array",
      });
    }

    const course = await Course.findByPk(course_id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const results: any[] = [];
    const errors: any[] = [];

    for (const student_id of student_ids) {
      try {
        const student = await Student.findByPk(student_id);
        if (!student) {
          errors.push({ student_id, error: "Student not found" });
          continue;
        }

        // Use Sequelize association method to add student to course
        await (course as any).addStudent(student);
        results.push({ student_id, status: "enrolled" });
      } catch (error: any) {
        if (error?.name === "SequelizeUniqueConstraintError") {
          results.push({ student_id, status: "already_enrolled" });
        } else {
          errors.push({ student_id, error: error?.message || "Unknown error" });
        }
      }
    }

    res.json({
      message: "Student enrollment completed",
      course_id,
      successful_enrollments: results.length,
      failed_enrollments: errors.length,
      results,
      errors,
    });
  } catch (error) {
    console.error("Error enrolling students:", error);
    res.status(500).json({
      message: "Error enrolling students in course",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getAttendanceHistory = async (req: Request, res: Response) => {
  try {
    const { teacher_id, date, schedule_id } = req.query;

    if (!teacher_id) {
      return res.status(400).json({ message: "teacher_id is required" });
    }

    // Build query conditions
    const whereConditions: any = {};
    const timetableConditions: any = { teacher_id: Number(teacher_id) };

    if (date) {
      whereConditions.date = date;
    }

    if (schedule_id) {
      whereConditions.schedule_id = schedule_id;
      timetableConditions.schedule_id = schedule_id;
    }

    // Get attendance records with related data
    const attendanceRecords = await Attendance.findAll({
      where: whereConditions,
      include: [
        {
          model: Student,
          attributes: ["student_id", "name", "roll_number", "email"],
          include: [
            {
              model: Department,
              attributes: ["name"],
            },
          ],
        },
        {
          model: Timetable,
          where: timetableConditions,
          attributes: [
            "schedule_id",
            "day_of_week",
            "start_time",
            "end_time",
            "classroom",
            "class_type",
          ],
          include: [
            {
              model: Course,
              attributes: ["course_id", "course_name", "course_code"],
            },
            {
              model: Teacher,
              attributes: ["teacher_id", "name", "email"],
            },
          ],
        },
      ],
      order: [
        ["date", "DESC"],
        ["created_at", "DESC"],
      ],
    });

    // Group attendance by date and timetable slot
    const groupedAttendance = attendanceRecords.reduce(
      (acc: any, record: any) => {
        const recordDate = record.date;
        const scheduleId = record.schedule_id;

        if (!acc[recordDate]) {
          acc[recordDate] = {};
        }

        if (!acc[recordDate][scheduleId]) {
          acc[recordDate][scheduleId] = {
            timetable: record.timetable,
            students: [],
            summary: {
              total: 0,
              present: 0,
              absent: 0,
              percentage: 0,
            },
          };
        }

        acc[recordDate][scheduleId].students.push({
          student: record.student,
          status: record.status,
          marked_at: record.created_at,
        });

        // Update summary
        acc[recordDate][scheduleId].summary.total++;
        if (record.status === "present") {
          acc[recordDate][scheduleId].summary.present++;
        } else {
          acc[recordDate][scheduleId].summary.absent++;
        }

        acc[recordDate][scheduleId].summary.percentage =
          (acc[recordDate][scheduleId].summary.present /
            acc[recordDate][scheduleId].summary.total) *
          100;

        return acc;
      },
      {}
    );

    // Get teacher's timetable slots for context
    const teacherTimetable = await Timetable.findAll({
      where: { teacher_id: Number(teacher_id) },
      include: [
        {
          model: Course,
          attributes: ["course_id", "course_name", "course_code"],
        },
      ],
      attributes: [
        "schedule_id",
        "day_of_week",
        "start_time",
        "end_time",
        "classroom",
        "class_type",
      ],
      order: [
        ["day_of_week", "ASC"],
        ["start_time", "ASC"],
      ],
    });

    res.json({
      attendance_history: groupedAttendance,
      teacher_timetable: teacherTimetable,
      filter_applied: {
        teacher_id,
        date: date || null,
        schedule_id: schedule_id || null,
      },
    });
  } catch (error) {
    console.error("Error fetching attendance history:", error);
    res.status(500).json({
      message: "Error fetching attendance history",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getAttendanceDatesForTeacher = async (
  req: Request,
  res: Response
) => {
  try {
    const { teacher_id } = req.params;
    const { start_date, end_date } = req.query;

    if (!teacher_id) {
      return res.status(400).json({ message: "teacher_id is required" });
    }

    // Build date range conditions
    const dateConditions: any = {};
    if (start_date && end_date) {
      dateConditions.date = {
        [Op.between]: [start_date, end_date],
      };
    } else if (start_date) {
      dateConditions.date = {
        [Op.gte]: start_date,
      };
    } else if (end_date) {
      dateConditions.date = {
        [Op.lte]: end_date,
      };
    }

    // Get unique dates where teacher has marked attendance
    const attendanceDates = await Attendance.findAll({
      attributes: [
        "date",
        [
          Sequelize.fn("COUNT", Sequelize.col("attendance_id")),
          "total_records",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("CASE WHEN status = 'present' THEN 1 ELSE 0 END")
          ),
          "present_count",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("CASE WHEN status = 'absent' THEN 1 ELSE 0 END")
          ),
          "absent_count",
        ],
      ],
      where: dateConditions,
      include: [
        {
          model: Timetable,
          where: { teacher_id: Number(teacher_id) },
          attributes: [],
          required: true,
        },
      ],
      group: ["date"],
      order: [["date", "DESC"]],
    });

    // Format the response to include percentage
    const formattedDates = attendanceDates.map((record: any) => {
      const totalRecords = parseInt(record.getDataValue("total_records"));
      const presentCount = parseInt(record.getDataValue("present_count"));
      const absentCount = parseInt(record.getDataValue("absent_count"));
      const percentage =
        totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

      return {
        date: record.date,
        total_records: totalRecords,
        present_count: presentCount,
        absent_count: absentCount,
        attendance_percentage: Math.round(percentage * 100) / 100,
      };
    });

    res.json({
      teacher_id,
      attendance_dates: formattedDates,
      date_range: {
        start_date: start_date || null,
        end_date: end_date || null,
      },
    });
  } catch (error) {
    console.error("Error fetching attendance dates:", error);
    res.status(500).json({
      message: "Error fetching attendance dates",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get unified attendance records (Manual + Smart) for a teacher
 * Merges data from Attendance and SmartAttendanceRecord tables
 */
export const getUnifiedAttendance = async (req: Request, res: Response) => {
  try {
    const {
      schedule_id,
      date,
      method,
      status,
      teacher_id,
      student_id,
      start_date,
      end_date,
    } = req.query;

    console.log("📊 Fetching unified attendance:", {
      schedule_id,
      date,
      method,
      status,
      teacher_id,
      student_id,
    });

    // Build where clause for timetable
    const timetableWhere: any = {};
    if (teacher_id) {
      timetableWhere.teacher_id = teacher_id;
    }

    // Build where clause for attendance records
    const attendanceWhere: any = {};
    if (student_id) {
      attendanceWhere.student_id = student_id;
    }
    if (schedule_id) {
      attendanceWhere.schedule_id = schedule_id;
    }
    if (date) {
      attendanceWhere.date = date;
    }
    if (start_date && end_date) {
      attendanceWhere.date = {
        [Op.between]: [start_date, end_date],
      };
    }
    if (status && status !== "all") {
      attendanceWhere.status = status;
    }

    // Fetch manual attendance records
    let manualRecords: any[] = [];
    if (!method || method === "all" || method === "manual") {
      const manualAttendance = await Attendance.findAll({
        where: attendanceWhere,
        include: [
          {
            model: Timetable,
            as: "timetable",
            where: timetableWhere,
            include: [
              {
                model: Course,
                as: "course",
                attributes: ["course_id", "course_code", "course_name"],
              },
              {
                model: Teacher,
                as: "teacher",
                attributes: ["teacher_id", "name"],
              },
            ],
          },
          {
            model: Student,
            as: "student",
            attributes: ["student_id", "name", "roll_number"],
          },
        ],
        order: [["date", "DESC"]],
      });

      manualRecords = manualAttendance.map((record: any) => ({
        id: record.attendance_id,
        student_id: record.student_id,
        student_name: record.student?.name || "Unknown",
        roll_number: record.student?.roll_number || "N/A",
        course_name: record.timetable?.course?.course_name || "Unknown",
        course_code: record.timetable?.course?.course_code || "N/A",
        teacher_name: record.timetable?.teacher?.name || "Unknown",
        date: record.date,
        status: record.status,
        method: "manual",
        time_slot:
          record.timetable?.start_time && record.timetable?.end_time
            ? `${record.timetable.start_time} - ${record.timetable.end_time}`
            : null,
        verified_by_face: false,
        confidence_score: null,
      }));
    }

    // Fetch smart attendance records
    let smartRecords: any[] = [];
    if (!method || method === "all" || method === "smart") {
      const smartWhere: any = {};
      if (student_id) {
        smartWhere.student_id = student_id;
      }
      if (schedule_id) {
        smartWhere.schedule_id = schedule_id;
      }
      if (date) {
        smartWhere.date = date;
      }
      if (start_date && end_date) {
        smartWhere.date = {
          [Op.between]: [start_date, end_date],
        };
      }
      if (status && status !== "all") {
        smartWhere.status = status;
      }

      const smartAttendance = await SmartAttendanceRecord.findAll({
        where: smartWhere,
        include: [
          {
            model: Timetable,
            as: "schedule",
            where: timetableWhere,
            include: [
              {
                model: Course,
                as: "course",
                attributes: ["course_id", "course_code", "course_name"],
              },
              {
                model: Teacher,
                as: "teacher",
                attributes: ["teacher_id", "name"],
              },
            ],
          },
          {
            model: Student,
            as: "student",
            attributes: ["student_id", "name", "roll_number"],
          },
        ],
        order: [["date", "DESC"]],
      });

      smartRecords = smartAttendance.map((record: any) => ({
        id: record.record_id,
        student_id: record.student_id,
        student_name: record.student?.name || "Unknown",
        roll_number: record.student?.roll_number || "N/A",
        course_name: record.schedule?.course?.course_name || "Unknown",
        course_code: record.schedule?.course?.course_code || "N/A",
        teacher_name: record.schedule?.teacher?.name || "Unknown",
        date: record.date,
        status: record.status,
        method: "smart",
        time_slot:
          record.schedule?.start_time && record.schedule?.end_time
            ? `${record.schedule.start_time} - ${record.schedule.end_time}`
            : null,
        verified_by_face:
          record.verified_by_scan || record.verified_by_class_photo || false,
        confidence_score: null,
      }));
    }

    // Merge and sort by date (most recent first)
    const allRecords = [...manualRecords, ...smartRecords].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Calculate statistics
    const stats = {
      total: allRecords.length,
      present: allRecords.filter((r) => r.status === "present").length,
      absent: allRecords.filter((r) => r.status === "absent").length,
      manual: manualRecords.length,
      smart: smartRecords.length,
      attendance_rate:
        allRecords.length > 0
          ? (allRecords.filter((r) => r.status === "present").length /
              allRecords.length) *
            100
          : 0,
    };

    console.log("✅ Unified attendance fetched:", {
      total: stats.total,
      manual: stats.manual,
      smart: stats.smart,
    });

    res.json({
      success: true,
      records: allRecords,
      stats,
      filters: {
        schedule_id,
        date,
        method,
        status,
        teacher_id,
        start_date,
        end_date,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching unified attendance:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching unified attendance",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
