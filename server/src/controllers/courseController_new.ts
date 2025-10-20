import { Request, Response } from "express";
import Course from "../models/Course";
import Department from "../models/Department";
import { ValidationError, UniqueConstraintError } from "sequelize";

// Get all courses
export const getAllCourses = async (req: Request, res: Response) => {
  try {
    const { department_id } = req.query as { department_id?: string };
    const where: any = {};
    if (department_id) where.department_id = department_id;
    const courses = await Course.findAll({
      where,
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["name"],
        },
      ],
    });
    res.status(200).json(courses);
  } catch (error: any) {
    console.error("Get courses error:", error);
    res
      .status(500)
      .json({ message: "Error retrieving courses", error: error.message });
  }
};

// Get course by ID
export const getCourseById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const course = await Course.findByPk(id, {
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["name"],
        },
      ],
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json(course);
  } catch (error: any) {
    console.error("Get course error:", error);
    res
      .status(500)
      .json({ message: "Error retrieving course", error: error.message });
  }
};

// Create a new course
export const createCourse = async (req: Request, res: Response) => {
  const { course_code, course_name, department_id, semester } = req.body as {
    course_code?: string;
    course_name?: string;
    department_id?: number | string;
    semester?: number | string;
  };

  try {
    // Validate required fields
    if (!course_code || !course_name || !department_id) {
      return res.status(400).json({
        message: "course_code, course_name, and department_id are required",
      });
    }

    // Optional semester validation
    let semesterNum: number | undefined = undefined;
    if (
      semester !== undefined &&
      semester !== null &&
      `${semester}`.trim() !== ""
    ) {
      semesterNum = parseInt(String(semester), 10);
      if (Number.isNaN(semesterNum) || semesterNum < 1 || semesterNum > 8) {
        return res
          .status(400)
          .json({ message: "semester must be an integer between 1 and 8" });
      }
    }

    const newCourse = await Course.create({
      course_code,
      course_name,
      department_id:
        typeof department_id === "string"
          ? parseInt(department_id, 10)
          : department_id,
      semester: semesterNum,
    });

    res.status(201).json({
      message: "Course created successfully",
      course: newCourse,
    });
  } catch (error: any) {
    console.error("Create course error:", error);
    if (error instanceof UniqueConstraintError) {
      return res
        .status(409)
        .json({
          message: "Course code already exists in this department",
          error: error.message,
        });
    }
    if (error instanceof ValidationError) {
      return res
        .status(400)
        .json({ message: "Invalid course data", error: error.message });
    }
    res
      .status(500)
      .json({ message: "Error creating course", error: error.message });
  }
};

// Update course
export const updateCourse = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { course_code, course_name, department_id, semester } = req.body as {
    course_code?: string;
    course_name?: string;
    department_id?: number | string;
    semester?: number | string;
  };

  try {
    const course = await Course.findByPk(id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Optional semester validation
    let semesterNum: number | undefined = undefined;
    if (
      semester !== undefined &&
      semester !== null &&
      `${semester}`.trim() !== ""
    ) {
      semesterNum = parseInt(String(semester), 10);
      if (Number.isNaN(semesterNum) || semesterNum < 1 || semesterNum > 8) {
        return res
          .status(400)
          .json({ message: "semester must be an integer between 1 and 8" });
      }
    }

    await course.update({
      course_code: course_code ?? course.course_code,
      course_name: course_name ?? course.course_name,
      department_id:
        department_id !== undefined
          ? typeof department_id === "string"
            ? parseInt(department_id, 10)
            : department_id
          : course.department_id,
      semester: semesterNum !== undefined ? semesterNum : course.semester,
    });

    res.status(200).json({
      message: "Course updated successfully",
      course,
    });
  } catch (error: any) {
    console.error("Update course error:", error);
    if (error instanceof UniqueConstraintError) {
      return res
        .status(409)
        .json({
          message: "Course code already exists in this department",
          error: error.message,
        });
    }
    if (error instanceof ValidationError) {
      return res
        .status(400)
        .json({ message: "Invalid course data", error: error.message });
    }
    res
      .status(500)
      .json({ message: "Error updating course", error: error.message });
  }
};

// Delete course
export const deleteCourse = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const course = await Course.findByPk(id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    await course.destroy();

    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error: any) {
    console.error("Delete course error:", error);
    res.status(500).json({
      message: "Error deleting course",
      error: error.message,
    });
  }
};
