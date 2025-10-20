import { Request, Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import { sequelize } from '../config/database';
import Student from '../models/Student';
import Course from '../models/Course';
import Attendance from '../models/Attendance';
import Timetable from '../models/Timetable';

// Get detailed attendance analytics for a student
export const getStudentAnalytics = async (req: any, res: Response) => {
    try {
        const userId = req.user?.user_id;
        const { studentId } = req.params;
        
        // If no studentId provided and user is a student, use their own profile
        let targetStudentId = studentId;
        if (!targetStudentId && req.user?.role === 'student') {
            const student = await Student.findOne({ where: { user_id: userId } });
            if (!student) {
                return res.status(404).json({ message: 'Student profile not found' });
            }
            targetStudentId = student.student_id;
        }
        
        if (!targetStudentId) {
            return res.status(400).json({ message: 'Student ID is required' });
        }

        // Get overall attendance statistics
        const attendanceStats = await sequelize.query(`
            SELECT 
                COUNT(*) as total_classes,
                COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
                COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
                ROUND(
                    (COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / COUNT(*)), 2
                ) as attendance_percentage
            FROM attendance a
            WHERE a.student_id = :studentId
        `, {
            replacements: { studentId: targetStudentId },
            type: QueryTypes.SELECT
        });

        // Get course-wise attendance breakdown
        const courseWiseStats = await sequelize.query(`
            SELECT 
                c.course_name,
                c.course_code,
                COUNT(*) as total_classes,
                COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
                ROUND(
                    (COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / COUNT(*)), 2
                ) as attendance_percentage
            FROM attendance a
            JOIN timetable t ON a.schedule_id = t.schedule_id
            JOIN courses c ON t.course_id = c.course_id
            WHERE a.student_id = :studentId
            GROUP BY c.course_id, c.course_name, c.course_code
            ORDER BY c.course_name
        `, {
            replacements: { studentId: targetStudentId },
            type: QueryTypes.SELECT
        });

        // Get monthly attendance trend (last 6 months)
        const monthlyTrend = await sequelize.query(`
            SELECT 
                strftime('%Y-%m', a.date) as month,
                COUNT(*) as total_classes,
                COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
                ROUND(
                    (COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / COUNT(*)), 2
                ) as attendance_percentage
            FROM attendance a
            WHERE a.student_id = :studentId
            AND a.date >= date('now', '-6 months')
            GROUP BY strftime('%Y-%m', a.date)
            ORDER BY month DESC
        `, {
            replacements: { studentId: targetStudentId },
            type: QueryTypes.SELECT
        });

        // Get recent attendance records (last 30 days)
        const recentAttendance = await sequelize.query(`
            SELECT 
                a.date,
                a.status,
                c.course_name,
                c.course_code,
                t.start_time,
                t.end_time,
                t.classroom
            FROM attendance a
            JOIN timetable t ON a.schedule_id = t.schedule_id
            JOIN courses c ON t.course_id = c.course_id
            WHERE a.student_id = :studentId
            AND a.date >= date('now', '-30 days')
            ORDER BY a.date DESC, t.start_time DESC
            LIMIT 50
        `, {
            replacements: { studentId: targetStudentId },
            type: QueryTypes.SELECT
        });

        const analytics = {
            overall: attendanceStats[0] || { total_classes: 0, present_count: 0, absent_count: 0, attendance_percentage: 0 },
            courseWise: courseWiseStats,
            monthlyTrend: monthlyTrend,
            recentAttendance: recentAttendance,
            warnings: [] as Array<{ type: string; message: string }>
        };

        // Add warnings based on attendance percentage
        const overallPercentage = Number((analytics.overall as any).attendance_percentage) || 0;
        if (overallPercentage < 75) {
            analytics.warnings.push({
                type: 'critical',
                message: `Overall attendance (${overallPercentage}%) is below the minimum requirement of 75%`
            });
        } else if (overallPercentage < 80) {
            analytics.warnings.push({
                type: 'warning',
                message: `Overall attendance (${overallPercentage}%) is approaching the minimum requirement`
            });
        }

        // Add course-specific warnings
        courseWiseStats.forEach((course: any) => {
            const coursePercentage = Number(course.attendance_percentage) || 0;
            if (coursePercentage < 75) {
                analytics.warnings.push({
                    type: 'critical',
                    message: `${course.course_name} attendance (${coursePercentage}%) is below minimum requirement`
                });
            }
        });

        res.json(analytics);
    } catch (error: any) {
        console.error('Error fetching student analytics:', error);
        res.status(500).json({ 
            message: 'Error fetching analytics', 
            error: error.message 
        });
    }
};

// Get class-wise attendance summary for teachers
export const getClassAttendanceAnalytics = async (req: any, res: Response) => {
    try {
        const userId = req.user?.user_id;
        const { scheduleId } = req.params;

        // Verify teacher owns this schedule
        const schedule = await Timetable.findOne({
            where: { schedule_id: scheduleId },
            include: [
                { model: Course, as: 'course' },
                { 
                    model: sequelize.models.Teacher, 
                    as: 'teacher',
                    where: { user_id: userId }
                }
            ]
        });

        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found or access denied' });
        }

        // Get attendance statistics for this class
        const classStats = await sequelize.query(`
            SELECT 
                COUNT(DISTINCT a.date) as total_sessions,
                COUNT(DISTINCT a.student_id) as total_students_enrolled,
                COUNT(*) as total_attendance_records,
                COUNT(CASE WHEN a.status = 'present' THEN 1 END) as total_present,
                COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as total_absent,
                ROUND(
                    (COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / COUNT(*)), 2
                ) as overall_attendance_percentage
            FROM attendance a
            WHERE a.schedule_id = :scheduleId
        `, {
            replacements: { scheduleId },
            type: QueryTypes.SELECT
        });

        // Get student-wise attendance for this class
        const studentWiseStats = await sequelize.query(`
            SELECT 
                s.student_id,
                s.name,
                s.roll_number,
                COUNT(*) as total_classes_attended,
                COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
                COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
                ROUND(
                    (COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / COUNT(*)), 2
                ) as attendance_percentage
            FROM students s
            JOIN attendance a ON s.student_id = a.student_id
            WHERE a.schedule_id = :scheduleId
            GROUP BY s.student_id, s.name, s.roll_number
            ORDER BY s.name
        `, {
            replacements: { scheduleId },
            type: QueryTypes.SELECT
        });

        // Get date-wise attendance summary
        const dateWiseStats = await sequelize.query(`
            SELECT 
                a.date,
                COUNT(*) as total_students,
                COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
                COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
                ROUND(
                    (COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / COUNT(*)), 2
                ) as attendance_percentage
            FROM attendance a
            WHERE a.schedule_id = :scheduleId
            GROUP BY a.date
            ORDER BY a.date DESC
            LIMIT 30
        `, {
            replacements: { scheduleId },
            type: QueryTypes.SELECT
        });

        res.json({
            schedule: {
                course_name: (schedule as any).course.course_name,
                course_code: (schedule as any).course.course_code,
                day_of_week: schedule.day_of_week,
                start_time: schedule.start_time,
                end_time: schedule.end_time,
                classroom: schedule.classroom
            },
            overall: classStats[0] || {},
            studentWise: studentWiseStats,
            dateWise: dateWiseStats
        });
    } catch (error: any) {
        console.error('Error fetching class analytics:', error);
        res.status(500).json({ 
            message: 'Error fetching class analytics', 
            error: error.message 
        });
    }
};

// Export attendance data as CSV
export const exportAttendanceData = async (req: any, res: Response) => {
    try {
        const { studentId, scheduleId, startDate, endDate } = req.query;
        const userId = req.user?.user_id;
        const userRole = req.user?.role;

        let whereClause = '';
        const replacements: any = {};

        // Build query based on user role and parameters
        if (userRole === 'student') {
            // Students can only export their own data
            const student = await Student.findOne({ where: { user_id: userId } });
            if (!student) {
                return res.status(404).json({ message: 'Student profile not found' });
            }
            whereClause = 'WHERE a.student_id = :studentId';
            replacements.studentId = student.student_id;
        } else if (userRole === 'teacher' && scheduleId) {
            // Teachers can export data for their classes
            whereClause = 'WHERE a.schedule_id = :scheduleId';
            replacements.scheduleId = scheduleId;
        } else if (userRole === 'coordinator') {
            // Coordinators can export any data
            if (studentId) {
                whereClause = 'WHERE a.student_id = :studentId';
                replacements.studentId = studentId;
            } else if (scheduleId) {
                whereClause = 'WHERE a.schedule_id = :scheduleId';
                replacements.scheduleId = scheduleId;
            }
        }

        // Add date filters if provided
        if (startDate) {
            whereClause += whereClause ? ' AND' : 'WHERE';
            whereClause += ' a.date >= :startDate';
            replacements.startDate = startDate;
        }
        if (endDate) {
            whereClause += whereClause ? ' AND' : 'WHERE';
            whereClause += ' a.date <= :endDate';
            replacements.endDate = endDate;
        }

        const exportData = await sequelize.query(`
            SELECT 
                a.date,
                s.name as student_name,
                s.roll_number,
                c.course_code,
                c.course_name,
                t.day_of_week,
                t.start_time,
                t.end_time,
                t.classroom,
                a.status,
                teach.name as teacher_name
            FROM attendance a
            JOIN students s ON a.student_id = s.student_id
            JOIN timetable t ON a.schedule_id = t.schedule_id
            JOIN courses c ON t.course_id = c.course_id
            JOIN teachers teach ON t.teacher_id = teach.teacher_id
            ${whereClause}
            ORDER BY a.date DESC, s.name, t.start_time
        `, {
            replacements,
            type: QueryTypes.SELECT
        });

        // Convert to CSV format
        if (exportData.length === 0) {
            return res.status(404).json({ message: 'No attendance data found for the specified criteria' });
        }

        const csvHeaders = [
            'Date', 'Student Name', 'Roll Number', 'Course Code', 'Course Name',
            'Day', 'Start Time', 'End Time', 'Classroom', 'Status', 'Teacher'
        ];

        const csvRows = exportData.map((row: any) => [
            row.date,
            row.student_name,
            row.roll_number,
            row.course_code,
            row.course_name,
            row.day_of_week,
            row.start_time,
            row.end_time,
            row.classroom || '',
            row.status,
            row.teacher_name
        ]);

        const csvContent = [
            csvHeaders.join(','),
            ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="attendance-export-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);

    } catch (error: any) {
        console.error('Error exporting attendance data:', error);
        res.status(500).json({ 
            message: 'Error exporting data', 
            error: error.message 
        });
    }
};