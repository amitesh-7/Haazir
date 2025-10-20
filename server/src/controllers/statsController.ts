import { Request, Response } from "express";
import { QueryTypes } from "sequelize";
import { sequelize } from "../config/database";

// Cache for stats to prevent excessive database queries
interface StatsCache {
  data: {
    studentsOnline: number;
    classesActive: number;
    attendanceRate: number;
    institutionsConnected: number;
  };
  timestamp: number;
}

let statsCache: StatsCache | null = null;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache

export const getLiveStats = async (req: Request, res: Response) => {
  try {
    // Check if we have valid cached data
    const now = Date.now();
    if (statsCache && now - statsCache.timestamp < CACHE_DURATION) {
      console.log("📄 Returning cached stats data");
      return res.json(statsCache.data);
    }

    console.log("🔍 Fetching fresh stats data from database");
    // Get total students count
    const studentsResult = (await sequelize.query(
      "SELECT COUNT(*) as count FROM students",
      { type: QueryTypes.SELECT }
    )) as [{ count: string }];

    // Get active classes (classes scheduled for today)
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

    const activeClassesResult = (await sequelize.query(
      `SELECT COUNT(*) as count FROM timetable 
       WHERE day_of_week = ?`,
      {
        replacements: [today],
        type: QueryTypes.SELECT,
      }
    )) as [{ count: string }];

    // Calculate attendance rate (average attendance for the current month)
    const attendanceRateResult = (await sequelize.query(
      `SELECT 
         COALESCE(
           ROUND(
             (COUNT(CASE WHEN status = 'present' THEN 1 END) * 100.0 / 
              NULLIF(COUNT(*), 0)
             ), 1
           ), 0
         ) as rate 
       FROM attendance 
       WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`,
      { type: QueryTypes.SELECT }
    )) as [{ rate: string }];

    // Get total institutions (departments count)
    const institutionsResult = (await sequelize.query(
      "SELECT COUNT(*) as count FROM departments",
      { type: QueryTypes.SELECT }
    )) as [{ count: string }];

    const stats = {
      studentsOnline: parseInt(studentsResult[0].count) || 0,
      classesActive: parseInt(activeClassesResult[0].count) || 0,
      attendanceRate: parseFloat(attendanceRateResult[0].rate) || 0,
      institutionsConnected: parseInt(institutionsResult[0].count) || 0,
    };

    // Cache the results
    statsCache = {
      data: stats,
      timestamp: now,
    };

    console.log("✅ Stats cached for 2 minutes");
    res.json(stats);
  } catch (error) {
    console.error("Error fetching live stats:", error);
    // Return fallback stats if there's an error
    res.json({
      studentsOnline: 0,
      classesActive: 0,
      attendanceRate: 0,
      institutionsConnected: 0,
    });
  }
};

export const getBasicStats = async (req: Request, res: Response) => {
  try {
    // Get basic counts for dashboard
    const [studentsResult, teachersResult, coursesResult, departmentsResult] =
      await Promise.all([
        sequelize.query("SELECT COUNT(*) as count FROM students", {
          type: QueryTypes.SELECT,
        }),
        sequelize.query("SELECT COUNT(*) as count FROM teachers", {
          type: QueryTypes.SELECT,
        }),
        sequelize.query("SELECT COUNT(*) as count FROM courses", {
          type: QueryTypes.SELECT,
        }),
        sequelize.query("SELECT COUNT(*) as count FROM departments", {
          type: QueryTypes.SELECT,
        }),
      ]);

    const stats = {
      students: parseInt((studentsResult[0] as { count: string }).count) || 0,
      teachers: parseInt((teachersResult[0] as { count: string }).count) || 0,
      courses: parseInt((coursesResult[0] as { count: string }).count) || 0,
      departments:
        parseInt((departmentsResult[0] as { count: string }).count) || 0,
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching basic stats:", error);
    res.status(500).json({
      message: "Failed to fetch statistics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
