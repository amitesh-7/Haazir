import { Request, Response } from "express";
import Section from "../models/Section";
import Department from "../models/Department";

// Get all sections for a department
export const getSectionsByDepartment = async (req: Request, res: Response) => {
  try {
    const { departmentId, semester } = req.params;

    const whereClause: any = { department_id: departmentId };

    // If semester is provided in the route, filter by it
    if (semester) {
      whereClause.semester = semester;
    }

    const sections = await Section.findAll({
      where: whereClause,
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["department_id", "name"],
        },
      ],
      order: [["section_name", "ASC"]],
    });

    res.json(sections);
  } catch (error: any) {
    console.error("Error fetching sections:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch sections", error: error.message });
  }
};

// Get all sections
export const getAllSections = async (req: Request, res: Response) => {
  try {
    const sections = await Section.findAll({
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["department_id", "name"],
        },
      ],
      order: [
        ["department_id", "ASC"],
        ["section_name", "ASC"],
      ],
    });

    res.json(sections);
  } catch (error: any) {
    console.error("Error fetching all sections:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch sections", error: error.message });
  }
};

// Create a new section
export const createSection = async (req: Request, res: Response) => {
  try {
    const { department_id, section_name, semester, description } = req.body;

    if (!department_id || !section_name) {
      return res
        .status(400)
        .json({ message: "Department ID and section name are required" });
    }

    // Check if section with the same name AND semester already exists
    const existingSection = await Section.findOne({
      where: {
        department_id,
        section_name: section_name.trim(),
        semester: semester || null,
      },
    });

    if (existingSection) {
      return res.status(409).json({
        message: `Section "${section_name.trim()}" already exists for Semester ${
          semester || "unspecified"
        }`,
      });
    }

    const section = await Section.create({
      department_id,
      section_name: section_name.trim(),
      semester: semester || null,
      description: description?.trim() || null,
    });

    const sectionWithDepartment = await Section.findByPk(section.section_id, {
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["department_id", "name"],
        },
      ],
    });

    res.status(201).json(sectionWithDepartment);
  } catch (error: any) {
    console.error("Error creating section:", error);
    res
      .status(500)
      .json({ message: "Failed to create section", error: error.message });
  }
};

// Update a section
export const updateSection = async (req: Request, res: Response) => {
  try {
    const { sectionId } = req.params;
    const { section_name, semester, description } = req.body;

    const section = await Section.findByPk(sectionId);
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    // Check if updating section_name or semester to avoid duplicates
    if (section_name || semester !== undefined) {
      const newSectionName = section_name
        ? section_name.trim()
        : section.section_name;
      const newSemester =
        semester !== undefined ? semester || null : section.semester;

      // Check if another section with the same name AND semester exists in the same department
      const existingSection = await Section.findOne({
        where: {
          department_id: section.department_id,
          section_name: newSectionName,
          semester: newSemester,
        },
      });

      // If exists and it's not the current section being updated
      if (
        existingSection &&
        existingSection.section_id !== section.section_id
      ) {
        return res.status(409).json({
          message: `Section "${newSectionName}" already exists for Semester ${
            newSemester || "unspecified"
          }`,
        });
      }
    }

    if (section_name) {
      section.section_name = section_name.trim();
    }
    if (semester !== undefined) {
      section.semester = semester || null;
    }
    if (description !== undefined) {
      section.description = description?.trim() || null;
    }

    await section.save();

    const updatedSection = await Section.findByPk(sectionId, {
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["department_id", "name"],
        },
      ],
    });

    res.json(updatedSection);
  } catch (error: any) {
    console.error("Error updating section:", error);
    res
      .status(500)
      .json({ message: "Failed to update section", error: error.message });
  }
};

// Delete a section
export const deleteSection = async (req: Request, res: Response) => {
  try {
    const { sectionId } = req.params;

    const section = await Section.findByPk(sectionId);
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    await section.destroy();
    res.json({ message: "Section deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting section:", error);
    res
      .status(500)
      .json({ message: "Failed to delete section", error: error.message });
  }
};
