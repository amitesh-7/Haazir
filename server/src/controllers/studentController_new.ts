import { Request, Response } from "express";
import Student from "../models/Student";
import User from "../models/User";
import Department from "../models/Department";
import Course from "../models/Course";
import Section from "../models/Section";
import { Request as ExRequest, Response as ExResponse } from "express";

// Get all students
export const getAllStudents = async (req: Request, res: Response) => {
  try {
    const students = await Student.findAll({
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
        {
          model: Section,
          as: "section",
          attributes: ["section_name", "description"],
        },
      ],
    });
    res.status(200).json(students);
  } catch (error: any) {
    console.error("Get students error:", error);
    res
      .status(500)
      .json({ message: "Error retrieving students", error: error.message });
  }
};

// Get student by ID
export const getStudentById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const student = await Student.findByPk(id, {
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
        {
          model: Section,
          as: "section",
          attributes: ["section_name", "description"],
        },
      ],
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(student);
  } catch (error: any) {
    console.error("Get student error:", error);
    res
      .status(500)
      .json({ message: "Error retrieving student", error: error.message });
  }
};

// Create a new student
export const createStudent = async (req: Request, res: Response) => {
  const {
    user_id,
    name,
    roll_number,
    department_id,
    semester,
    contact_number,
    parent_name,
    parent_contact,
    address,
  } = req.body;

  try {
    // Validate required fields
    if (!user_id || !name || !roll_number || !department_id || !semester) {
      return res.status(400).json({
        message:
          "user_id, name, roll_number, department_id and semester are required",
      });
    }

    const newStudent = await Student.create({
      user_id,
      name,
      roll_number,
      department_id,
      semester,
      year: semester, // Set year to same value as semester for backward compatibility
      contact_number: contact_number ?? null,
      parent_name: parent_name ?? null,
      parent_contact: parent_contact ?? null,
      address: address ?? null,
    });

    res.status(201).json({
      message: "Student created successfully",
      student: newStudent,
    });
  } catch (error: any) {
    console.error("Create student error:", error);
    res.status(500).json({
      message: "Error creating student",
      error: error.message,
    });
  }
};

// Update student
export const updateStudent = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    roll_number,
    department_id,
    section_id,
    semester,
    contact_number,
    parent_name,
    parent_contact,
    address,
  } = req.body;

  try {
    const student = await Student.findByPk(id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    await student.update({
      name: name ?? student.name,
      roll_number: roll_number ?? student.roll_number,
      department_id: department_id ?? student.department_id,
      section_id:
        section_id !== undefined
          ? section_id
            ? Number(section_id)
            : null
          : student.section_id,
      semester: semester ?? student.semester,
      contact_number: contact_number ?? student.contact_number,
      parent_name: parent_name ?? student.parent_name,
      parent_contact: parent_contact ?? student.parent_contact,
      address: address ?? student.address,
    });

    res.status(200).json({
      message: "Student updated successfully",
      student,
    });
  } catch (error: any) {
    console.error("Update student error:", error);
    res.status(500).json({
      message: "Error updating student",
      error: error.message,
    });
  }
};

// Delete student
export const deleteStudent = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const student = await Student.findByPk(id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    await student.destroy();

    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error: any) {
    console.error("Delete student error:", error);
    res.status(500).json({
      message: "Error deleting student",
      error: error.message,
    });
  }
};

// Get courses assigned to a student
export const getStudentCourses = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const student = await Student.findByPk(id, {
      include: [
        {
          model: Course,
          as: "courses",
          through: { attributes: [] },
        },
      ],
    });
    if (!student) return res.status(404).json({ message: "Student not found" });
    // @ts-ignore
    const courses = (student as any).courses || [];
    res.status(200).json(courses);
  } catch (error: any) {
    console.error("Get student courses error:", error);
    res.status(500).json({
      message: "Error retrieving student courses",
      error: error.message,
    });
  }
};

// Get courses assigned to a student with teacher information
export const getStudentCourseAssignments = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  try {
    const student = await Student.findByPk(id, {
      include: [
        {
          model: Course,
          as: "courses",
          through: { attributes: [] },
          include: [
            {
              model: Department,
              as: "department",
              attributes: ["name"],
            },
          ],
        },
      ],
    });

    if (!student) return res.status(404).json({ message: "Student not found" });

    // @ts-ignore
    const courses = (student as any).courses || [];

    // For each course, get the assigned teachers from timetable
    const Timetable = require("../models/Timetable").default;
    const Teacher = require("../models/Teacher").default;
    const User = require("../models/User").default;

    const coursesWithTeachers = await Promise.all(
      courses.map(async (course: any) => {
        const timetableEntries = await Timetable.findAll({
          where: { course_id: course.course_id },
          include: [
            {
              model: Teacher,
              as: "teacher",
              include: [
                {
                  model: User,
                  as: "user",
                  attributes: ["email"],
                },
              ],
            },
          ],
          attributes: [
            "schedule_id",
            "day_of_week",
            "start_time",
            "end_time",
            "classroom",
          ],
        });

        return {
          ...course.toJSON(),
          teachers: timetableEntries
            .map((entry: any) => ({
              teacher_id: entry.teacher?.teacher_id,
              name: entry.teacher?.name,
              email: entry.teacher?.user?.email,
              schedule: {
                schedule_id: entry.schedule_id,
                day_of_week: entry.day_of_week,
                start_time: entry.start_time,
                end_time: entry.end_time,
                classroom: entry.classroom,
              },
            }))
            .filter((t: any) => t.teacher_id), // Filter out null teachers
        };
      })
    );

    res.status(200).json(coursesWithTeachers);
  } catch (error: any) {
    console.error("Get student course assignments error:", error);
    res.status(500).json({
      message: "Error retrieving student course assignments",
      error: error.message,
    });
  }
};

// Assign a course to a student
export const assignCourseToStudent = async (req: Request, res: Response) => {
  const { id } = req.params; // student id
  const { course_id, teacher_id, schedule_data } = req.body;
  try {
    if (!course_id)
      return res.status(400).json({ message: "course_id is required" });

    const student = await Student.findByPk(id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const course = await Course.findByPk(course_id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Assign course to student
    // @ts-ignore
    await (student as any).addCourse(course);

    // If teacher and schedule data are provided, create/update timetable entry
    if (teacher_id && schedule_data) {
      const Teacher = require("../models/Teacher").default;
      const Timetable = require("../models/Timetable").default;

      const teacher = await Teacher.findByPk(teacher_id);
      if (!teacher) {
        console.warn("Teacher not found, proceeding without timetable entry");
      } else {
        // Check if timetable entry already exists for this course and teacher
        const existingEntry = await Timetable.findOne({
          where: {
            course_id: course_id,
            teacher_id: teacher_id,
          },
        });

        if (
          !existingEntry &&
          schedule_data.day_of_week &&
          schedule_data.start_time &&
          schedule_data.end_time
        ) {
          // Create new timetable entry
          await Timetable.create({
            course_id: course_id,
            teacher_id: teacher_id,
            day_of_week: schedule_data.day_of_week,
            start_time: schedule_data.start_time,
            end_time: schedule_data.end_time,
            classroom: schedule_data.classroom || "",
          });
        }
      }
    }

    res
      .status(200)
      .json({ message: "Course assigned to student successfully" });
  } catch (error: any) {
    console.error("Assign course error:", error);
    res.status(500).json({
      message: "Error assigning course to student",
      error: error.message,
    });
  }
};

// Remove a course from a student
export const removeCourseFromStudent = async (req: Request, res: Response) => {
  const { id, courseId } = req.params;
  try {
    const student = await Student.findByPk(id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    const course = await Course.findByPk(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    // @ts-ignore
    await (student as any).removeCourse(course);
    res
      .status(200)
      .json({ message: "Course removed from student successfully" });
  } catch (error: any) {
    console.error("Remove course error:", error);
    res.status(500).json({
      message: "Error removing course from student",
      error: error.message,
    });
  }
};

// Student updates their own profile (contact info, address, optionally name)
export const updateSelfProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const student = await Student.findOne({ where: { user_id: userId } });
    if (!student)
      return res.status(404).json({ message: "Student profile not found" });

    const { name, contact_number, parent_name, parent_contact, address } =
      req.body;

    await student.update({
      name: name ?? student.name,
      contact_number: contact_number ?? student.contact_number,
      parent_name: parent_name ?? student.parent_name,
      parent_contact: parent_contact ?? student.parent_contact,
      address: address ?? student.address,
    });

    return res.status(200).json({ message: "Profile updated", student });
  } catch (error: any) {
    console.error("Self profile update error:", error);
    return res
      .status(500)
      .json({ message: "Error updating profile", error: error.message });
  }
};

// Get students by section
export const getStudentsBySection = async (req: Request, res: Response) => {
  const { sectionId } = req.params;

  try {
    const students = await Student.findAll({
      where: { section_id: sectionId },
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
        {
          model: Section,
          as: "section",
          attributes: ["section_name", "description", "semester"],
        },
      ],
    });

    res.status(200).json(students);
  } catch (error: any) {
    console.error("Get students by section error:", error);
    res.status(500).json({ 
      message: "Error retrieving students by section", 
      error: error.message 
    });
  }
};

// Get unassigned students (students without a section or from specific department)
export const getUnassignedStudents = async (req: Request, res: Response) => {
  const { department_id } = req.query;

  try {
    const whereClause: any = { section_id: null };
    
    if (department_id) {
      whereClause.department_id = department_id;
    }

    const students = await Student.findAll({
      where: whereClause,
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

    res.status(200).json(students);
  } catch (error: any) {
    console.error("Get unassigned students error:", error);
    res.status(500).json({ 
      message: "Error retrieving unassigned students", 
      error: error.message 
    });
  }
};

// Enroll student in section
export const enrollStudentInSection = async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const { section_id } = req.body;

  try {
    // Check if student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if section exists
    const section = await Section.findByPk(section_id);
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    // Check if student is already enrolled in a section
    if (student.section_id) {
      return res.status(400).json({ 
        message: "Student is already enrolled in a section" 
      });
    }

    // Enroll student
    await student.update({ section_id });

    // Return updated student with section details
    const updatedStudent = await Student.findByPk(studentId, {
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
        {
          model: Section,
          as: "section",
          attributes: ["section_name", "description", "semester"],
        },
      ],
    });

    res.status(200).json({ 
      message: "Student enrolled successfully", 
      student: updatedStudent 
    });
  } catch (error: any) {
    console.error("Enroll student error:", error);
    res.status(500).json({ 
      message: "Error enrolling student", 
      error: error.message 
    });
  }
};

// Unenroll student from section
export const unenrollStudentFromSection = async (req: Request, res: Response) => {
  const { studentId } = req.params;

  try {
    // Check if student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Unenroll student
    await student.update({ section_id: null });

    // Return updated student
    const updatedStudent = await Student.findByPk(studentId, {
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

    res.status(200).json({ 
      message: "Student unenrolled successfully", 
      student: updatedStudent 
    });
  } catch (error: any) {
    console.error("Unenroll student error:", error);
    res.status(500).json({ 
      message: "Error unenrolling student", 
      error: error.message 
    });
  }
};

// Bulk enroll students in section
export const bulkEnrollStudents = async (req: Request, res: Response) => {
  const { student_ids, section_id } = req.body;

  try {
    // Validate input
    if (!Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({ message: "Invalid student IDs array" });
    }

    if (!section_id) {
      return res.status(400).json({ message: "Section ID is required" });
    }

    // Check if section exists
    const section = await Section.findByPk(section_id);
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    // Get students to enroll
    const students = await Student.findAll({
      where: { student_id: student_ids }
    });

    if (students.length !== student_ids.length) {
      return res.status(400).json({ message: "Some students not found" });
    }

    // Check if any student is already enrolled
    const alreadyEnrolled = students.filter(student => student.section_id !== null);
    if (alreadyEnrolled.length > 0) {
      return res.status(400).json({ 
        message: "Some students are already enrolled in sections",
        alreadyEnrolled: alreadyEnrolled.map(s => ({ 
          student_id: s.student_id, 
          name: s.name 
        }))
      });
    }

    // Bulk update students
    await Student.update(
      { section_id },
      { where: { student_id: student_ids } }
    );

    // Return updated students
    const updatedStudents = await Student.findAll({
      where: { student_id: student_ids },
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
        {
          model: Section,
          as: "section",
          attributes: ["section_name", "description", "semester"],
        },
      ],
    });

    res.status(200).json({ 
      message: `${student_ids.length} students enrolled successfully`, 
      students: updatedStudents 
    });
  } catch (error: any) {
    console.error("Bulk enroll students error:", error);
    res.status(500).json({ 
      message: "Error enrolling students", 
      error: error.message 
    });
  }
};
