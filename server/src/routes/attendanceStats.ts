import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import { sequelize } from "../models";
import { QueryTypes } from "sequelize";

const router = Router();

// Get detailed attendance stats for a student
router.get("/student/:studentId/detailed-stats", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    // Get course-wise attendance stats
    const courseStats: any[] = await sequelize.query(
      `
      SELECT 
        c.course_id,
        c.course_name,
        c.course_code,
        COUNT(*) as total_classes,
        SUM(CASE WHEN sar.status = 'present' THEN 1 ELSE 0 END) as attended_classes,
        SUM(CASE WHEN sar.status = 'absent' THEN 1 ELSE 0 END) as absent_classes,
        ROUND((SUM(CASE WHEN sar.status = 'present' THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric * 100), 0) as attendance_percentage
      FROM smart_attendance_records sar
      JOIN timetable_slots ts ON sar.schedule_id = ts.slot_id
      JOIN courses c ON ts.course_id = c.course_id
      WHERE sar.student_id = :studentId
      GROUP BY c.course_id, c.course_name, c.course_code
      ORDER BY c.course_code
      `,
      {
        replacements: { studentId },
        type: QueryTypes.SELECT,
      }
    );

    if (!courseStats || courseStats.length === 0) {
      return res.json({
        overall_attendance: 0,
        total_classes: 0,
        total_present: 0,
        total_absent: 0,
        courses: [],
        weekly_trend: [],
      });
    }

    // Calculate overall stats
    const totalClasses = courseStats.reduce((sum, c) => sum + parseInt(c.total_classes), 0);
    const totalPresent = courseStats.reduce((sum, c) => sum + parseInt(c.attended_classes), 0);
    const totalAbsent = totalClasses - totalPresent;
    const overallAttendance = Math.round((totalPresent / totalClasses) * 100);

    // Process courses with calculator
    const courses = courseStats.map((course) => {
      const total = parseInt(course.total_classes);
      const present = parseInt(course.attended_classes);
      const absent = parseInt(course.absent_classes);
      const percentage = parseInt(course.attendance_percentage);

      // Calculate classes needed for 75% or can skip
      let classesNeeded = 0;
      let canSkip = 0;

      if (percentage < 75) {
        classesNeeded = Math.ceil((0.75 * total - present) / 0.25);
      } else {
        canSkip = Math.floor((present - 0.75 * total) / 0.75);
      }

      return {
        course_id: course.course_id,
        course_name: course.course_name,
        course_code: course.course_code,
        total_classes: total,
        attended_classes: present,
        absent_classes: absent,
        attendance_percentage: percentage,
        classes_needed_for_75: classesNeeded,
        classes_can_skip: Math.max(0, canSkip),
      };
    });

    // Calculate weekly trend (last 6 weeks)
    const weeklyTrend: Array<{ week: string; percentage: number }> = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i + 1) * 7);
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - i * 7);

      const weekData: any[] = await sequelize.query(
        `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
        FROM smart_attendance_records
        WHERE student_id = :studentId
          AND date >= :weekStart
          AND date < :weekEnd
        `,
        {
          replacements: {
            studentId,
            weekStart: weekStart.toISOString().split("T")[0],
            weekEnd: weekEnd.toISOString().split("T")[0],
          },
          type: QueryTypes.SELECT,
        }
      );

      const weekTotal = parseInt(weekData[0]?.total || "0");
      const weekPresent = parseInt(weekData[0]?.present || "0");
      const weekPercentage = weekTotal > 0 ? Math.round((weekPresent / weekTotal) * 100) : 0;

      weeklyTrend.push({
        week: `Week ${6 - i}`,
        percentage: weekPercentage,
      });
    }

    res.json({
      overall_attendance: overallAttendance,
      total_classes: totalClasses,
      total_present: totalPresent,
      total_absent: totalAbsent,
      courses,
      weekly_trend: weeklyTrend,
    });
  } catch (error: any) {
    console.error("Error fetching detailed stats:", error);
    res.status(500).json({ error: error.message || "Failed to fetch detailed stats" });
  }
});

// Get detailed attendance for a specific course
router.get("/student/:studentId/course/:courseId/detailed", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { studentId, courseId } = req.params;

    // Get course info and attendance stats
    const courseData: any[] = await sequelize.query(
      `
      SELECT 
        c.course_id,
        c.course_name,
        c.course_code,
        COUNT(*) as total_classes,
        SUM(CASE WHEN sar.status = 'present' THEN 1 ELSE 0 END) as attended_classes,
        SUM(CASE WHEN sar.status = 'absent' THEN 1 ELSE 0 END) as absent_classes,
        ROUND((SUM(CASE WHEN sar.status = 'present' THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric * 100), 0) as attendance_percentage
      FROM smart_attendance_records sar
      JOIN timetable_slots ts ON sar.schedule_id = ts.slot_id
      JOIN courses c ON ts.course_id = c.course_id
      WHERE sar.student_id = :studentId AND c.course_id = :courseId
      GROUP BY c.course_id, c.course_name, c.course_code
      `,
      {
        replacements: { studentId, courseId },
        type: QueryTypes.SELECT,
      }
    );

    if (!courseData || courseData.length === 0) {
      // Get course name even if no attendance
      const course: any[] = await sequelize.query(
        `SELECT course_id, course_name, course_code FROM courses WHERE course_id = :courseId`,
        {
          replacements: { courseId },
          type: QueryTypes.SELECT,
        }
      );

      if (!course || course.length === 0) {
        return res.status(404).json({ error: "Course not found" });
      }

      return res.json({
        course_id: parseInt(courseId),
        course_name: course[0].course_name,
        course_code: course[0].course_code,
        total_classes: 0,
        attended_classes: 0,
        absent_classes: 0,
        attendance_percentage: 0,
        classes_needed_for_75: 0,
        classes_can_skip: 0,
        recent_attendance: [],
        monthly_breakdown: [],
      });
    }

    const course = courseData[0];
    const totalClasses = parseInt(course.total_classes);
    const attendedClasses = parseInt(course.attended_classes);
    const absentClasses = parseInt(course.absent_classes);
    const attendancePercentage = parseInt(course.attendance_percentage);

    // Calculate classes needed/can skip
    let classesNeeded = 0;
    let canSkip = 0;

    if (attendancePercentage < 75) {
      classesNeeded = Math.ceil((0.75 * totalClasses - attendedClasses) / 0.25);
    } else {
      canSkip = Math.floor((attendedClasses - 0.75 * totalClasses) / 0.75);
    }

    // Recent attendance (last 10)
    const recentAttendance: any[] = await sequelize.query(
      `
      SELECT 
        sar.date,
        sar.status,
        sar.created_at as marked_at
      FROM smart_attendance_records sar
      JOIN timetable_slots ts ON sar.schedule_id = ts.slot_id
      WHERE sar.student_id = :studentId AND ts.course_id = :courseId
      ORDER BY sar.date DESC
      LIMIT 10
      `,
      {
        replacements: { studentId, courseId },
        type: QueryTypes.SELECT,
      }
    );

    // Monthly breakdown (last 6 months)
    const monthlyBreakdown: Array<{ month: string; present: number; absent: number; percentage: number }> = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthData: any[] = await sequelize.query(
        `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN sar.status = 'present' THEN 1 ELSE 0 END) as present,
          SUM(CASE WHEN sar.status = 'absent' THEN 1 ELSE 0 END) as absent
        FROM smart_attendance_records sar
        JOIN timetable_slots ts ON sar.schedule_id = ts.slot_id
        WHERE sar.student_id = :studentId 
          AND ts.course_id = :courseId
          AND sar.date >= :monthStart
          AND sar.date <= :monthEnd
        `,
        {
          replacements: {
            studentId,
            courseId,
            monthStart: monthStart.toISOString().split("T")[0],
            monthEnd: monthEnd.toISOString().split("T")[0],
          },
          type: QueryTypes.SELECT,
        }
      );

      const present = parseInt(monthData[0]?.present || "0");
      const absent = parseInt(monthData[0]?.absent || "0");
      const total = parseInt(monthData[0]?.total || "0");
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      monthlyBreakdown.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        present,
        absent,
        percentage,
      });
    }

    res.json({
      course_id: parseInt(courseId),
      course_name: course.course_name,
      course_code: course.course_code,
      total_classes: totalClasses,
      attended_classes: attendedClasses,
      absent_classes: absentClasses,
      attendance_percentage: attendancePercentage,
      classes_needed_for_75: classesNeeded,
      classes_can_skip: Math.max(0, canSkip),
      recent_attendance: recentAttendance,
      monthly_breakdown: monthlyBreakdown,
    });
  } catch (error: any) {
    console.error("Error fetching course detailed stats:", error);
    res.status(500).json({ error: error.message || "Failed to fetch course details" });
  }
});

export default router;
