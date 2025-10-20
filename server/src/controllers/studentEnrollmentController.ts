import { Request, Response } from "express";
import { Op } from "sequelize";
import { Student, Section, Batch, Department, User } from "../models";

// Get unassigned students (students without section) by department
export const getUnassignedStudents = async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params;

    const students = await Student.findAll({
      where: {
        department_id: departmentId,
        section_id: null,
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["email"],
        },
        {
          model: Department,
          as: "department",
          attributes: ["name"],
        },
      ],
      order: [["name", "ASC"]],
    });

    res.json({
      success: true,
      data: students,
      count: students.length,
    });
  } catch (error: any) {
    console.error("Error fetching unassigned students:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unassigned students",
      error: error.message,
    });
  }
};

// Bulk enroll students to a section
export const bulkEnrollStudentsToSection = async (req: Request, res: Response) => {
  try {
    const { studentIds, sectionId } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Student IDs array is required",
      });
    }

    if (!sectionId) {
      return res.status(400).json({
        success: false,
        message: "Section ID is required",
      });
    }

    // Verify section exists
    const section = await Section.findByPk(sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // Bulk update students
    const result = await Student.update(
      { section_id: sectionId, batch_id: null }, // Reset batch when changing section
      {
        where: {
          student_id: {
            [Op.in]: studentIds,
          },
        },
      }
    );

    // Get updated students for response
    const updatedStudents = await Student.findAll({
      where: {
        student_id: {
          [Op.in]: studentIds,
        },
      },
      include: [
        {
          model: Section,
          as: "section",
          attributes: ["section_name", "semester"],
        },
      ],
    });

    res.json({
      success: true,
      message: `Successfully enrolled ${result[0]} students to section`,
      data: updatedStudents,
      count: result[0],
    });
  } catch (error: any) {
    console.error("Error enrolling students to section:", error);
    res.status(500).json({
      success: false,
      message: "Failed to enroll students to section",
      error: error.message,
    });
  }
};

// Get students in a section (for batch bifurcation)
export const getStudentsBySection = async (req: Request, res: Response) => {
  try {
    const { sectionId } = req.params;
    const { includeBatched } = req.query;

    const whereClause: any = {
      section_id: sectionId,
    };

    // If includeBatched is false, only get students without batch assignment
    if (includeBatched === "false") {
      whereClause.batch_id = null;
    }

    const students = await Student.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["email"],
        },
        {
          model: Section,
          as: "section",
          attributes: ["section_name", "semester"],
        },
        {
          model: Batch,
          as: "batch",
          attributes: ["batch_name", "batch_size"],
          required: false, // Left join
        },
      ],
      order: [["name", "ASC"]],
    });

    res.json({
      success: true,
      data: students,
      count: students.length,
    });
  } catch (error: any) {
    console.error("Error fetching students by section:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch students",
      error: error.message,
    });
  }
};

// Bulk assign students to batches
export const bulkAssignStudentsToBatches = async (req: Request, res: Response) => {
  try {
    const { assignments } = req.body;
    // assignments format: [{ studentId: 1, batchId: 1 }, { studentId: 2, batchId: 2 }]

    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Assignments array is required",
      });
    }

    const results: Array<{ studentId: any; batchId: any; success: boolean }> = [];
    const errors: string[] = [];

    for (const assignment of assignments) {
      try {
        const { studentId, batchId } = assignment;

        if (!studentId || !batchId) {
          errors.push(`Invalid assignment: ${JSON.stringify(assignment)}`);
          continue;
        }

        // Verify batch exists
        const batch = await Batch.findByPk(batchId);
        if (!batch) {
          errors.push(`Batch ${batchId} not found`);
          continue;
        }

        // Update student
        const [affectedRows] = await Student.update(
          { batch_id: batchId },
          {
            where: { student_id: studentId },
          }
        );

        if (affectedRows > 0) {
          results.push({ studentId, batchId, success: true });
        } else {
          errors.push(`Student ${studentId} not found or not updated`);
        }
      } catch (error: any) {
        errors.push(`Error processing assignment ${JSON.stringify(assignment)}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `Processed ${assignments.length} assignments`,
      results: {
        successful: results.length,
        failed: errors.length,
        details: results,
        errors: errors,
      },
    });
  } catch (error: any) {
    console.error("Error assigning students to batches:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign students to batches",
      error: error.message,
    });
  }
};

// Auto-distribute students to batches evenly
export const autoDistributeStudentsToBatches = async (req: Request, res: Response) => {
  try {
    const { sectionId, batchIds } = req.body;

    if (!sectionId) {
      return res.status(400).json({
        success: false,
        message: "Section ID is required",
      });
    }

    if (!batchIds || !Array.isArray(batchIds) || batchIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Batch IDs array is required",
      });
    }

    // Get students in section without batch assignment
    const students = await Student.findAll({
      where: {
        section_id: sectionId,
        batch_id: null,
      },
      order: [["name", "ASC"]], // Consistent ordering for fair distribution
    });

    if (students.length === 0) {
      return res.json({
        success: true,
        message: "No unassigned students found in section",
        data: [],
      });
    }

    // Verify all batches exist and belong to the section
    const batches = await Batch.findAll({
      where: {
        batch_id: {
          [Op.in]: batchIds,
        },
        section_id: sectionId,
      },
    });

    if (batches.length !== batchIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some batches not found or don't belong to the specified section",
      });
    }

    // Distribute students evenly
    const assignments: Array<{ studentId: number; batchId: any }> = [];
    const batchCount = batchIds.length;

    students.forEach((student, index) => {
      const batchIndex = index % batchCount;
      const batchId = batchIds[batchIndex];
      assignments.push({
        studentId: student.student_id,
        batchId: batchId,
      });
    });

    // Execute bulk assignment
    const results: Array<{ studentId: number; batchId: any }> = [];
    for (const assignment of assignments) {
      try {
        await Student.update(
          { batch_id: assignment.batchId },
          {
            where: { student_id: assignment.studentId },
          }
        );
        results.push(assignment);
      } catch (error: any) {
        console.error(`Error assigning student ${assignment.studentId}:`, error);
      }
    }

    // Get distribution summary
    const distribution = await Promise.all(
      batchIds.map(async (batchId) => {
        const count = await Student.count({
          where: {
            section_id: sectionId,
            batch_id: batchId,
          },
        });
        const batch = batches.find(b => b.batch_id === batchId);
        return {
          batchId,
          batchName: batch?.batch_name,
          studentCount: count,
        };
      })
    );

    res.json({
      success: true,
      message: `Successfully distributed ${results.length} students to ${batchCount} batches`,
      data: {
        assignments: results,
        distribution: distribution,
        totalStudents: results.length,
      },
    });
  } catch (error: any) {
    console.error("Error auto-distributing students:", error);
    res.status(500).json({
      success: false,
      message: "Failed to auto-distribute students",
      error: error.message,
    });
  }
};

// Remove students from batch (set batch_id to null)
export const removeStudentsFromBatch = async (req: Request, res: Response) => {
  try {
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Student IDs array is required",
      });
    }

    const result = await Student.update(
      { batch_id: null },
      {
        where: {
          student_id: {
            [Op.in]: studentIds,
          },
        },
      }
    );

    res.json({
      success: true,
      message: `Successfully removed ${result[0]} students from their batches`,
      count: result[0],
    });
  } catch (error: any) {
    console.error("Error removing students from batch:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove students from batch",
      error: error.message,
    });
  }
};