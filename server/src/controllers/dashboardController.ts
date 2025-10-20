import { Request, Response } from "express";
import { Op, QueryTypes } from "sequelize";
import { sequelize } from "../config/database";
import User from "../models/User";
import Student from "../models/Student";
import Teacher from "../models/Teacher";
import Course from "../models/Course";
import Department from "../models/Department";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Get counts for dashboard overview
    const [
      totalStudents,
      totalTeachers,
      totalCourses,
      totalDepartments,
      activeUsers,
      recentStudents,
      recentTeachers,
    ] = await Promise.all([
      Student.count(),
      Teacher.count(),
      Course.count(),
      Department.count(),
      User.count({
        where: {
          created_at: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }), // Last 30 days
      Student.findAll({
        limit: 5,
        order: [["created_at", "DESC"]],
        include: [{ model: Department, as: "department" }],
      }),
      Teacher.findAll({
        limit: 5,
        order: [["created_at", "DESC"]],
        include: [
          { model: Department, as: "department" },
          { model: User, as: "user", attributes: ["email"] },
        ],
      }),
    ]);

    // Get simple counts first
    let studentsByDepartment: any[] = [];
    try {
      studentsByDepartment = await sequelize.query(
        `
                SELECT 
                    COALESCE(d.department_name, 'No Department') as department_name,
                    COUNT(s.student_id) as student_count
                FROM departments d
                LEFT JOIN students s ON d.department_id = s.department_id
                GROUP BY d.department_id, d.department_name
                UNION ALL
                SELECT 'No Department' as department_name, COUNT(*) as student_count 
                FROM students WHERE department_id NOT IN (SELECT department_id FROM departments)
                ORDER BY student_count DESC
            `,
        { type: QueryTypes.SELECT }
      );
    } catch (error) {
      console.log("Department query failed, using fallback:", error);
      studentsByDepartment = [
        { department_name: "Total", student_count: totalStudents },
      ];
    }

    const dashboardData = {
      overview: {
        totalStudents,
        totalTeachers,
        totalCourses,
        totalDepartments,
        activeUsers,
      },
      recentActivity: {
        recentStudents: recentStudents.map((student) => ({
          id: student.student_id,
          name: student.name,
          rollNumber: student.roll_number,
          department: (student as any).department?.department_name || "N/A",
          createdAt: student.created_at
            ? student.created_at.toISOString()
            : new Date().toISOString(),
        })),
        recentTeachers: recentTeachers.map((teacher) => ({
          id: teacher.teacher_id,
          name: teacher.name,
          email: (teacher as any).user?.email || "N/A",
          department: (teacher as any).department?.department_name || "N/A",
          createdAt: teacher.created_at
            ? teacher.created_at.toISOString()
            : new Date().toISOString(),
        })),
      },
      statistics: {
        departmentBreakdown: studentsByDepartment,
      },
    };

    res.json(dashboardData);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      message: "Error fetching dashboard statistics",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
};

export const getSystemHealth = async (req: Request, res: Response) => {
  try {
    // Check database connectivity
    const dbCheck = await User.findOne({ limit: 1 });

    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        authentication: "active",
      },
      version: "1.0.0",
    };

    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Database connection failed",
    });
  }
};
