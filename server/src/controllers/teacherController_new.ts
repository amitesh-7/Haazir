import { Request, Response } from "express";
import { Op } from "sequelize";
import Teacher from "../models/Teacher";
import Attendance from "../models/Attendance";
import Timetable from "../models/Timetable";
import Course from "../models/Course";
import Department from "../models/Department";
import User from "../models/User";
import Student from "../models/Student";

// Get teacher's timetable
export const getTimetable = async (req: Request, res: Response) => {
  try {
    const teacherId = req.params.id;
    const timetable = await Timetable.findAll({
      where: { teacher_id: teacherId },
    });
    res.status(200).json(timetable);
  } catch (error) {
    res.status(500).json({ message: "Error fetching timetable", error });
  }
};

// Take attendance for a class
export const takeAttendance = async (req: Request, res: Response) => {
  const { scheduleId, attendanceData } = req.body;

  try {
    const attendanceRecords = attendanceData.map(
      async (data: { studentId: number; status: string }) => {
        return await Attendance.create({
          schedule_id: scheduleId,
          student_id: data.studentId,
          date: new Date(),
          status: data.status as "present" | "absent",
        });
      }
    );

    await Promise.all(attendanceRecords);
    res.status(201).json({ message: "Attendance recorded successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error recording attendance", error });
  }
};

// View attendance history
export const viewAttendanceHistory = async (req: Request, res: Response) => {
  const teacherId = req.params.id;

  try {
    // Get attendance through teacher's timetable
    const teacherTimetables = await Timetable.findAll({
      where: { teacher_id: teacherId },
    });
    const scheduleIds = teacherTimetables.map((t) => t.schedule_id);
    const attendanceHistory = await Attendance.findAll({
      where: { schedule_id: scheduleIds },
      include: [
        {
          model: Timetable,
          as: "timetable",
          include: [
            {
              model: Course,
              as: "course",
            },
          ],
        },
      ],
    });
    res.status(200).json(attendanceHistory);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching attendance history", error });
  }
};

// Get all teachers
export const getAllTeachers = async (req: Request, res: Response) => {
  try {
    const teachers = await Teacher.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["email", "role"],
        },
        {
          model: Department,
          as: "department",
          attributes: ["name"],
        },
      ],
    });
    res.status(200).json(teachers);
  } catch (error: any) {
    console.error("Get teachers error:", error);
    res
      .status(500)
      .json({ message: "Error retrieving teachers", error: error.message });
  }
};

// Get teachers by department ID
export const getTeachersByDepartment = async (req: Request, res: Response) => {
  const { departmentId } = req.params;

  try {
    const teachers = await Teacher.findAll({
      where: { department_id: departmentId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["email", "role"],
        },
        {
          model: Department,
          as: "department",
          attributes: ["name"],
        },
      ],
    });
    res.status(200).json(teachers);
  } catch (error: any) {
    console.error("Get teachers by department error:", error);
    res.status(500).json({
      message: "Error retrieving teachers by department",
      error: error.message,
    });
  }
};

// Get teachers assigned to a specific course
export const getTeachersByCourse = async (req: Request, res: Response) => {
  const { courseId } = req.params;

  try {
    // Get course with assigned teachers from teacher_courses junction table
    const course = await Course.findByPk(courseId, {
      include: [
        {
          model: Teacher,
          as: "teachers",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["email", "role"],
            },
            {
              model: Department,
              as: "department",
              attributes: ["department_id", "name"],
            },
          ],
        },
      ],
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // @ts-ignore - Sequelize associations are dynamically added
    const teachers = course.teachers || [];

    // Also fetch any timetable entries for these teachers to show schedules
    const teacherIds = teachers.map((t: any) => t.teacher_id);
    let schedules: any[] = [];

    if (teacherIds.length > 0) {
      schedules = await Timetable.findAll({
        where: {
          course_id: courseId,
          teacher_id: teacherIds,
        },
        attributes: [
          "schedule_id",
          "teacher_id",
          "day_of_week",
          "start_time",
          "end_time",
          "classroom",
        ],
        order: [
          ["day_of_week", "ASC"],
          ["start_time", "ASC"],
        ],
      });
    }

    // Group schedules by teacher
    const schedulesByTeacher = new Map();
    schedules.forEach((schedule: any) => {
      const teacherId = schedule.teacher_id;
      if (!schedulesByTeacher.has(teacherId)) {
        schedulesByTeacher.set(teacherId, []);
      }
      schedulesByTeacher.get(teacherId).push({
        schedule_id: schedule.schedule_id,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        classroom: schedule.classroom,
      });
    });

    // Attach schedules to each teacher
    const teachersWithSchedules = teachers.map((teacher: any) => ({
      ...teacher.toJSON(),
      schedules: schedulesByTeacher.get(teacher.teacher_id) || [],
    }));

    res.status(200).json(teachersWithSchedules);
  } catch (error: any) {
    console.error("Get teachers by course error:", error);
    res.status(500).json({
      message: "Error retrieving teachers by course",
      error: error.message,
    });
  }
};

// Get teacher by ID
export const getTeacherById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const teacher = await Teacher.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["email", "role"],
        },
        {
          model: Department,
          as: "department",
          attributes: ["name"],
        },
      ],
    });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.status(200).json(teacher);
  } catch (error: any) {
    console.error("Get teacher error:", error);
    res
      .status(500)
      .json({ message: "Error retrieving teacher", error: error.message });
  }
};

// Create new teacher
export const createTeacher = async (req: Request, res: Response) => {
  const { name, department_id } = req.body;

  try {
    // Note: This is a simplified version. In a complete implementation,
    // you would also create a User record and link it with user_id
    res.status(501).json({
      message:
        "Teacher creation requires user account creation - use registration endpoint instead",
    });
  } catch (error: any) {
    console.error("Create teacher error:", error);
    res
      .status(500)
      .json({ message: "Error creating teacher", error: error.message });
  }
};

// Update teacher
export const updateTeacher = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, department_id } = req.body;

  try {
    const teacher = await Teacher.findByPk(id);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    await teacher.update({ name, department_id });

    res.status(200).json(teacher);
  } catch (error: any) {
    console.error("Update teacher error:", error);
    res
      .status(500)
      .json({ message: "Error updating teacher", error: error.message });
  }
};

// Delete teacher
export const deleteTeacher = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const teacher = await Teacher.findByPk(id, {
      include: [{ model: User, as: "user" }],
    });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // First, delete all timetable entries for this teacher
    await Timetable.destroy({
      where: { teacher_id: id },
    });

    // Get the user_id before deleting the teacher
    const userId = (teacher as any).user_id;

    // Delete the teacher record
    await teacher.destroy();

    // Finally, delete the associated user record
    if (userId) {
      await User.destroy({
        where: { user_id: userId },
      });
    }

    res
      .status(200)
      .json({ message: "Teacher and associated user deleted successfully" });
  } catch (error: any) {
    console.error("Delete teacher error:", error);
    res
      .status(500)
      .json({ message: "Error deleting teacher", error: error.message });
  }
};

// Get courses assigned to a teacher
export const getTeacherCourses = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Get teacher with assigned courses from teacher_courses junction table
    const teacher = await Teacher.findByPk(id, {
      include: [
        {
          model: Course,
          as: "courses",
          include: [
            {
              model: Department,
              as: "department",
              attributes: ["department_id", "name"],
            },
          ],
        },
      ],
    });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // @ts-ignore - Sequelize associations are dynamically added
    const courses = teacher.courses || [];

    // Also fetch any timetable entries for these courses to show schedules
    const courseIds = courses.map((c: any) => c.course_id);
    let schedules: any[] = [];

    if (courseIds.length > 0) {
      schedules = await Timetable.findAll({
        where: {
          teacher_id: id,
          course_id: courseIds,
        },
        attributes: [
          "schedule_id",
          "course_id",
          "day_of_week",
          "start_time",
          "end_time",
          "classroom",
          "section_id",
        ],
        include: [
          {
            model: require("../models").Section,
            as: "section",
            attributes: ["section_id", "section_name"],
            include: [
              {
                model: Department,
                as: "department",
                attributes: ["department_id", "name"],
              },
            ],
          },
        ],
        order: [
          ["day_of_week", "ASC"],
          ["start_time", "ASC"],
        ],
      });
    }

    // Group schedules by course
    const schedulesByCourse = new Map();
    schedules.forEach((schedule: any) => {
      const courseId = schedule.course_id;
      if (!schedulesByCourse.has(courseId)) {
        schedulesByCourse.set(courseId, []);
      }
      schedulesByCourse.get(courseId).push({
        schedule_id: schedule.schedule_id,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        classroom: schedule.classroom,
        section_id: schedule.section_id,
        section: schedule.section
          ? {
              section_id: schedule.section.section_id,
              section_name: schedule.section.section_name,
              department: schedule.section.department
                ? {
                    department_id: schedule.section.department.department_id,
                    name: schedule.section.department.name,
                  }
                : null,
            }
          : null,
      });
    });

    // Calculate enrolled students for each course
    const coursesWithSchedulesAndStudents = await Promise.all(
      courses.map(async (course: any) => {
        const courseSchedules = schedulesByCourse.get(course.course_id) || [];

        // Get unique section IDs from schedules
        const sectionIds = [
          ...new Set(
            courseSchedules
              .filter((s: any) => s.section_id)
              .map((s: any) => Number(s.section_id))
          ),
        ] as number[];

        let enrolledStudents = 0;

        if (sectionIds.length > 0) {
          // Count students by department, semester, and sections
          enrolledStudents = (await Student.count({
            where: {
              department_id: course.department_id,
              semester: course.semester,
              section_id: { [Op.in]: sectionIds },
            },
          })) as number;
        } else if (course.department_id && course.semester) {
          // If no specific sections, count all students in department and semester
          enrolledStudents = await Student.count({
            where: {
              department_id: course.department_id,
              semester: course.semester,
            },
          });
        }

        console.log(
          `📊 Course ${
            course.course_code
          }: ${enrolledStudents} students (Dept: ${
            course.department_id
          }, Sem: ${course.semester}, Sections: [${sectionIds.join(", ")}])`
        );

        return {
          ...course.toJSON(),
          schedules: courseSchedules,
          enrolled_students: enrolledStudents,
        };
      })
    );

    // Calculate total students across all courses (unique students)
    const allSectionIds = new Set<number>();
    const departmentSemesterPairs = new Set<string>();

    courses.forEach((course: any) => {
      const courseSchedules = schedulesByCourse.get(course.course_id) || [];
      courseSchedules.forEach((schedule: any) => {
        if (schedule.section_id) {
          allSectionIds.add(schedule.section_id);
        }
      });
      if (course.department_id && course.semester) {
        departmentSemesterPairs.add(
          `${course.department_id}-${course.semester}`
        );
      }
    });

    let totalUniqueStudents = 0;
    if (allSectionIds.size > 0) {
      totalUniqueStudents = (await Student.count({
        where: {
          section_id: { [Op.in]: Array.from(allSectionIds) },
        },
        distinct: true,
        col: "student_id",
      })) as number;
    }

    console.log(
      `👥 Total unique students across all courses: ${totalUniqueStudents}`
    );

    res.status(200).json(coursesWithSchedulesAndStudents);
  } catch (error: any) {
    console.error("Get teacher courses error:", error);
    res.status(500).json({
      message: "Error retrieving teacher courses",
      error: error.message,
    });
  }
};

// Assign courses to a teacher (REPLACES existing assignments)
export const assignCoursesToTeacher = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { courseIds } = req.body; // Just array of course IDs, no schedule data

  try {
    console.log(
      "🎯 Assigning courses to teacher (using teacher_courses table):",
      {
        teacherId: id,
        courseIds,
      }
    );

    // Verify teacher exists
    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Verify all courses exist
    const courses = await Course.findAll({
      where: { course_id: courseIds },
    });

    if (courses.length !== courseIds.length) {
      return res.status(400).json({ message: "Some courses not found" });
    }

    // Use Sequelize's association method to set courses
    // This will automatically handle the junction table (teacher_courses)
    // @ts-ignore - Sequelize associations are dynamically added
    await teacher.setCourses(courses);

    console.log(
      `✅ Updated teacher course assignments (${courses.length} courses)`
    );

    res.status(200).json({
      message: "Teacher course assignments updated successfully",
      note: "Course assignments saved to teacher_courses table. These are NOT timetable entries yet. Use Timetable Management to schedule actual classes.",
      totalCourses: courses.length,
      assignedCourses: courses.map((c: any) => ({
        course_id: c.course_id,
        course_code: c.course_code,
        course_name: c.course_name,
      })),
    });
  } catch (error: any) {
    console.error("Update course assignments error:", error);
    res.status(500).json({
      message: "Error updating teacher course assignments",
      error: error.message,
    });
  }
};

// Remove course assignment from teacher
export const removeCourseFromTeacher = async (req: Request, res: Response) => {
  const { id, courseId } = req.params;

  try {
    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Use Sequelize's association method to remove the course
    // @ts-ignore - Sequelize associations are dynamically added
    await teacher.removeCourse(course);

    console.log(`✅ Removed course ${courseId} from teacher ${id}`);

    res.status(200).json({
      message: "Course removed from teacher successfully",
      note: "Only the assignment was removed. Any existing timetable entries remain unchanged.",
    });
  } catch (error: any) {
    console.error("Remove course error:", error);
    res.status(500).json({
      message: "Error removing course from teacher",
      error: error.message,
    });
  }
};
