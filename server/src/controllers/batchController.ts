import { Request, Response } from "express";
import Batch from "../models/Batch";
import Section from "../models/Section";

// Get all batches
export const getAllBatches = async (req: Request, res: Response) => {
  try {
    const batches = await Batch.findAll({
      include: [
        {
          model: Section,
          as: "section",
          attributes: ["section_id", "section_name", "semester"],
        },
      ],
      order: [
        ["section_id", "ASC"],
        ["batch_name", "ASC"],
      ],
    });

    res.json(batches);
  } catch (error: any) {
    console.error("Error fetching batches:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch batches", error: error.message });
  }
};

// Get batches by section
export const getBatchesBySection = async (req: Request, res: Response) => {
  try {
    const { sectionId } = req.params;
    // Coerce sectionId to a number to avoid strict type mismatches in SQL where clause
    const sectionIdNum = Number(sectionId);
    if (Number.isNaN(sectionIdNum)) {
      return res.status(400).json({ message: "Invalid sectionId" });
    }

    const batches = await Batch.findAll({
      where: { section_id: sectionIdNum },
      include: [
        {
          model: Section,
          as: "section",
          attributes: ["section_id", "section_name", "semester"],
        },
      ],
      order: [["batch_name", "ASC"]],
    });

    res.json(batches);
  } catch (error: any) {
    console.error("Error fetching batches for section:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch batches", error: error.message });
  }
};

// Create a new batch
export const createBatch = async (req: Request, res: Response) => {
  try {
    const { section_id, batch_name, batch_size, description } = req.body;

    // Validate required fields
    if (!section_id || !batch_name) {
      return res.status(400).json({
        message: "Section ID and batch name are required",
      });
    }

    // Check if batch name already exists for this section
    const existingBatch = await Batch.findOne({
      where: {
        section_id: section_id,
        batch_name: batch_name,
      },
    });

    if (existingBatch) {
      return res.status(409).json({
        message: "Batch name already exists for this section",
      });
    }

    const batch = await Batch.create({
      section_id,
      batch_name,
      batch_size: batch_size || 30,
      description: description || "",
    });

    // Fetch the created batch with section details
    const createdBatch = await Batch.findByPk(batch.batch_id, {
      include: [
        {
          model: Section,
          as: "section",
          attributes: ["section_id", "section_name", "semester"],
        },
      ],
    });

    res.status(201).json(createdBatch);
  } catch (error: any) {
    console.error("Error creating batch:", error);
    res
      .status(500)
      .json({ message: "Failed to create batch", error: error.message });
  }
};

// Update a batch
export const updateBatch = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const { batch_name, batch_size, description } = req.body;

    const batch = await Batch.findByPk(batchId);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    // Check if new batch name conflicts with existing batch in same section
    if (batch_name && batch_name !== batch.batch_name) {
      const existingBatch = await Batch.findOne({
        where: {
          section_id: batch.section_id,
          batch_name: batch_name,
          batch_id: { $ne: batchId }, // Exclude current batch
        },
      });

      if (existingBatch) {
        return res.status(409).json({
          message: "Batch name already exists for this section",
        });
      }
    }

    await batch.update({
      batch_name: batch_name || batch.batch_name,
      batch_size: batch_size !== undefined ? batch_size : batch.batch_size,
      description: description !== undefined ? description : batch.description,
      updated_at: new Date(),
    });

    // Fetch updated batch with section details
    const updatedBatch = await Batch.findByPk(batchId, {
      include: [
        {
          model: Section,
          as: "section",
          attributes: ["section_id", "section_name", "semester"],
        },
      ],
    });

    res.json(updatedBatch);
  } catch (error: any) {
    console.error("Error updating batch:", error);
    res
      .status(500)
      .json({ message: "Failed to update batch", error: error.message });
  }
};

// Delete a batch
export const deleteBatch = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;

    const batch = await Batch.findByPk(batchId);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    await batch.destroy();
    res.json({ message: "Batch deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting batch:", error);
    res
      .status(500)
      .json({ message: "Failed to delete batch", error: error.message });
  }
};
