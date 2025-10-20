import { Request, Response } from 'express';
import Department from '../models/Department';

// Get all departments
export const getAllDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await Department.findAll();
    res.status(200).json(departments);
  } catch (error: any) {
    console.error('Get departments error:', error);
    res.status(500).json({ message: 'Error retrieving departments', error: error.message });
  }
};

// Create department
export const createDepartment = async (req: Request, res: Response) => {
  const { name } = req.body;
  try {
    if (!name) return res.status(400).json({ message: 'name is required' });
    const dept = await Department.create({ name });
    res.status(201).json({ message: 'Department created successfully', department: dept });
  } catch (error: any) {
    console.error('Create department error:', error);
    res.status(500).json({ message: 'Error creating department', error: error.message });
  }
};

// Update department
export const updateDepartment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const dept = await Department.findByPk(id);
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    await dept.update({ name: name || dept.name });
    res.status(200).json({ message: 'Department updated successfully', department: dept });
  } catch (error: any) {
    console.error('Update department error:', error);
    res.status(500).json({ message: 'Error updating department', error: error.message });
  }
};

// Delete department
export const deleteDepartment = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const dept = await Department.findByPk(id);
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    await dept.destroy();
    res.status(200).json({ message: 'Department deleted successfully' });
  } catch (error: any) {
    console.error('Delete department error:', error);
    res.status(500).json({ message: 'Error deleting department', error: error.message });
  }
};
