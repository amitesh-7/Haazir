import { Request, Response } from "express";
import { SavedTimetable } from "../models";

// Get all saved timetables
export const getSavedTimetables = async (req: Request, res: Response) => {
  try {
    const savedTimetables = await SavedTimetable.findAll({
      order: [["createdAt", "DESC"]],
      attributes: [
        "id",
        "name",
        "semester",
        "department",
        "section",
        "createdAt",
        "createdBy",
      ],
    });

    // Add entries count to each timetable
    const timetablesWithCount = await Promise.all(
      savedTimetables.map(async (timetable: any) => {
        const fullTimetable = await SavedTimetable.findByPk(timetable.id);
        return {
          ...timetable.toJSON(),
          entriesCount: fullTimetable?.entries?.length || 0,
        };
      })
    );

    res.json(timetablesWithCount);
  } catch (error) {
    console.error("Error fetching saved timetables:", error);
    res.status(500).json({
      error: "Failed to fetch saved timetables",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get a specific saved timetable by ID
export const getSavedTimetableById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const savedTimetable = await SavedTimetable.findByPk(id);

    if (!savedTimetable) {
      return res.status(404).json({ error: "Saved timetable not found" });
    }

    res.json(savedTimetable);
  } catch (error) {
    console.error("Error fetching saved timetable:", error);
    res.status(500).json({
      error: "Failed to fetch saved timetable",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Create a new saved timetable
export const createSavedTimetable = async (req: Request, res: Response) => {
  try {
    const { name, semester, department, section, entries, gridSettings } =
      req.body;
    const userId = (req as any).user?.user_id;

    if (!name || !entries) {
      return res.status(400).json({ error: "Name and entries are required" });
    }

    const savedTimetable = await SavedTimetable.create({
      name,
      semester: semester || "all",
      department: department || "all",
      section: section || "all",
      entries,
      gridSettings: gridSettings || {},
      createdBy: userId,
    });

    res.status(201).json({
      message: "Timetable saved successfully",
      timetable: savedTimetable,
    });
  } catch (error) {
    console.error("Error creating saved timetable:", error);
    res.status(500).json({
      error: "Failed to save timetable",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update a saved timetable
export const updateSavedTimetable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, semester, department, section, entries, gridSettings } =
      req.body;

    const savedTimetable = await SavedTimetable.findByPk(id);
    if (!savedTimetable) {
      return res.status(404).json({ error: "Saved timetable not found" });
    }

    await savedTimetable.update({
      name: name || savedTimetable.name,
      semester: semester !== undefined ? semester : savedTimetable.semester,
      department:
        department !== undefined ? department : savedTimetable.department,
      section: section !== undefined ? section : savedTimetable.section,
      entries: entries || savedTimetable.entries,
      gridSettings: gridSettings || savedTimetable.gridSettings,
    });

    res.json({
      message: "Timetable updated successfully",
      timetable: savedTimetable,
    });
  } catch (error) {
    console.error("Error updating saved timetable:", error);
    res.status(500).json({
      error: "Failed to update timetable",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete a saved timetable
export const deleteSavedTimetable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const savedTimetable = await SavedTimetable.findByPk(id);
    if (!savedTimetable) {
      return res.status(404).json({ error: "Saved timetable not found" });
    }

    await savedTimetable.destroy();

    res.json({ message: "Timetable deleted successfully" });
  } catch (error) {
    console.error("Error deleting saved timetable:", error);
    res.status(500).json({
      error: "Failed to delete timetable",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
