import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import path from 'path';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { Department, Course, Section, Student, Teacher, User } from '../models';
import validationEngine from '../utils/validationEngine';

// Utility function to generate department code from name
const generateDepartmentCode = (departmentName: string): string => {
  const mapping: { [key: string]: string } = {
    'Computer Science and Engineering': 'CSE',
    'Computer Science': 'CSE',
    'Electrical Engineering': 'EE',
    'Electronics Engineering': 'EE',
    'Mechanical Engineering': 'ME',
    'Civil Engineering': 'CE',
    'Information Technology': 'IT',
    'Electronics and Communication Engineering': 'ECE',
    'Chemical Engineering': 'CHE',
    'Biotechnology': 'BT',
    'Mathematics': 'MATH',
    'Physics': 'PHY',
    'Chemistry': 'CHEM'
  };

  // Check for exact match first
  if (mapping[departmentName]) {
    return mapping[departmentName];
  }

  // Generate code from initials if no mapping found
  return departmentName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 4); // Limit to 4 characters
};

// Auto-generate roll number
const generateRollNumber = async (departmentId: number, year: number): Promise<string> => {
  const department = await Department.findByPk(departmentId);
  if (!department) throw new Error('Department not found');

  const deptCode = generateDepartmentCode(department.name);
  
  // Find the last roll number for this department and year
  const lastStudent = await Student.findOne({
    where: {
      department_id: departmentId,
      roll_number: {
        [Op.like]: `${year}${deptCode}%`
      }
    },
    order: [['roll_number', 'DESC']]
  });

  let nextNumber = 1;
  if (lastStudent) {
    const lastRollNumber = lastStudent.roll_number;
    const numberPart = lastRollNumber.replace(`${year}${deptCode}`, '');
    nextNumber = parseInt(numberPart) + 1;
  }

  return `${year}${deptCode}${nextNumber.toString().padStart(3, '0')}`;
};

// Auto-generate email
const generateEmail = (rollNumber: string, firstName: string): string => {
  const cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, '');
  return `${rollNumber}.${cleanFirstName}@hazir.com`;
};

interface ValidationRule {
  field: string;
  type: 'required' | 'unique' | 'enum' | 'pattern' | 'reference';
  value?: string | string[];
  message: string;
}

interface TemplateColumn {
  header: string;
  key: string;
  required: boolean;
  example: string;
  validation: ValidationRule[];
  width?: number;
}

interface ParsedData {
  row: number;
  data: any;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
  correctedData?: any;
  validationResult?: any;
}

interface ParseResult {
  success: boolean;
  data: ParsedData[];
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    warningRows: number;
    suggestionsCount: number;
    autoCorrectionsCount: number;
  };
  columnMapping: { [key: string]: string };
  detectedType: 'student' | 'teacher' | 'unknown';
  batchValidation: {
    hasBatchDuplicates: boolean;
    duplicateFields: string[];
  };
}

class DataEntryController {
  // Generate Excel template for students
  async generateStudentTemplate(req: Request, res: Response) {
    try {
      console.log('🔄 Generating student template...');
      const { department_id, section_id, autoGenerate } = req.query;
      console.log('Query params:', { department_id, section_id, autoGenerate });

      const isAutoGenerate = autoGenerate === 'true';

      // Fetch departments and sections for reference
      console.log('📚 Fetching departments...');
      const departments = await Department.findAll();
      console.log('✅ Departments fetched:', departments.length);
      
      console.log('📋 Fetching sections...');
      const sections = await Section.findAll();
      console.log('✅ Sections fetched:', sections.length);

      // Define student template columns based on mode
      let columns: TemplateColumn[];
      
      if (isAutoGenerate) {
        // Simplified template for auto-generation mode
        console.log('🎯 Creating simplified template for auto-generation mode');
        columns = [
          {
            header: 'Name*',
            key: 'name',
            required: true,
            example: 'John Doe',
            validation: [
              { field: 'name', type: 'required', message: 'Name is required' },
              { field: 'name', type: 'pattern', value: '^[a-zA-Z\\s]{2,50}$', message: 'Name must be 2-50 characters, letters and spaces only' }
            ],
            width: 20
          },
          {
            header: 'Phone',
            key: 'phone',
            required: false,
            example: '+1234567890',
            validation: [
              { field: 'phone', type: 'pattern', value: '^\\+?[0-9]{10,15}$', message: 'Invalid phone format' }
            ],
            width: 18
          },
          {
            header: 'Semester',
            key: 'semester',
            required: false,
            example: '1',
            validation: [
              { field: 'semester', type: 'pattern', value: '^[1-8]$', message: 'Semester must be 1-8' }
            ],
            width: 12
          },
          {
            header: 'Parent Name',
            key: 'parent_name',
            required: false,
            example: 'Jane Doe',
            validation: [
              { field: 'parent_name', type: 'pattern', value: '^[a-zA-Z\\s]{2,50}$', message: 'Parent name must be 2-50 characters, letters and spaces only' }
            ],
            width: 20
          },
          {
            header: 'Parent Contact',
            key: 'parent_contact',
            required: false,
            example: '+0987654321',
            validation: [
              { field: 'parent_contact', type: 'pattern', value: '^\\+?[0-9]{10,15}$', message: 'Invalid parent contact format' }
            ],
            width: 18
          },
          {
            header: 'Address',
            key: 'address',
            required: false,
            example: '123 Main St, City, State',
            validation: [],
            width: 30
          }
        ];
      } else {
        // Original full template for manual mode
        columns = [
          {
            header: 'Name*',
            key: 'name',
            required: true,
            example: 'John Doe',
            validation: [
              { field: 'name', type: 'required', message: 'Name is required' },
              { field: 'name', type: 'pattern', value: '^[a-zA-Z\\s]{2,50}$', message: 'Name must be 2-50 characters, letters and spaces only' }
            ],
            width: 20
          },
          {
            header: 'Roll Number*',
            key: 'roll_number',
            required: true,
            example: '2024001',
            validation: [
              { field: 'roll_number', type: 'required', message: 'Roll number is required' },
              { field: 'roll_number', type: 'unique', message: 'Roll number must be unique' },
              { field: 'roll_number', type: 'pattern', value: '^[0-9A-Z]{4,15}$', message: 'Roll number must be 4-15 characters, alphanumeric' }
            ],
            width: 15
          },
          {
            header: 'Email*',
            key: 'email',
            required: true,
            example: 'john.doe@university.edu',
            validation: [
              { field: 'email', type: 'required', message: 'Email is required' },
              { field: 'email', type: 'unique', message: 'Email must be unique' },
              { field: 'email', type: 'pattern', value: '^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$', message: 'Invalid email format' }
            ],
            width: 25
          },
          {
            header: 'Department*',
            key: 'department',
            required: true,
            example: departments.length > 0 ? departments[0].name : 'Computer Science',
            validation: [
              { field: 'department', type: 'required', message: 'Department is required' },
              { field: 'department', type: 'enum', value: departments.map(d => d.name), message: 'Invalid department' }
            ],
            width: 20
          },
          {
            header: 'Section*',
            key: 'section',
            required: true,
            example: sections.length > 0 ? sections[0].section_name : 'A',
            validation: [
              { field: 'section', type: 'required', message: 'Section is required' },
              { field: 'section', type: 'enum', value: sections.map(s => s.section_name), message: 'Invalid section' }
            ],
            width: 15
          },
          {
            header: 'Semester*',
            key: 'semester',
            required: true,
            example: '1',
            validation: [
              { field: 'semester', type: 'required', message: 'Semester is required' },
              { field: 'semester', type: 'pattern', value: '^[1-8]$', message: 'Semester must be 1-8' }
            ],
            width: 12
          },
          {
            header: 'Phone',
            key: 'phone',
            required: false,
            example: '+1234567890',
            validation: [
              { field: 'phone', type: 'pattern', value: '^\\+?[0-9]{10,15}$', message: 'Invalid phone format' }
            ],
            width: 18
          },
          {
            header: 'Parent Name',
            key: 'parent_name',
            required: false,
            example: 'Jane Doe',
            validation: [
              { field: 'parent_name', type: 'pattern', value: '^[a-zA-Z\\s]{2,50}$', message: 'Parent name must be 2-50 characters, letters and spaces only' }
            ],
            width: 20
          },
          {
            header: 'Parent Contact',
            key: 'parent_contact',
            required: false,
            example: '+0987654321',
            validation: [
              { field: 'parent_contact', type: 'pattern', value: '^\\+?[0-9]{10,15}$', message: 'Invalid parent contact format' }
            ],
            width: 18
          },
          {
            header: 'Address',
            key: 'address',
            required: false,
            example: '123 Main St, City, State',
            validation: [],
            width: 30
          }
        ];
      }

      console.log('📊 Creating workbook...');
      const workbook = this.createWorkbook('Students', columns, departments, sections);
      console.log('✅ Workbook created successfully');
      
      // Set response headers for Excel download
      console.log('📤 Setting response headers...');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=student_template.xlsx');

      // Write workbook to response
      console.log('💾 Writing workbook to buffer...');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      console.log('✅ Buffer created, size:', buffer.length, 'bytes');
      
      console.log('📨 Sending response...');
      res.send(buffer);
      console.log('🎉 Student template generated successfully!');

    } catch (error) {
      console.error('❌ Error generating student template:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ 
        error: 'Failed to generate student template',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Generate Excel template for teachers
  async generateTeacherTemplate(req: Request, res: Response) {
    try {
      const departments = await Department.findAll();

      const columns: TemplateColumn[] = [
        {
          header: 'Name*',
          key: 'name',
          required: true,
          example: 'Dr. Jane Smith',
          validation: [
            { field: 'name', type: 'required', message: 'Teacher name is required' },
            { field: 'name', type: 'pattern', value: '^[a-zA-Z\\s\\.]{2,50}$', message: 'Name must be 2-50 characters, letters, spaces, and dots only' }
          ],
          width: 25
        },
        {
          header: 'Email*',
          key: 'email',
          required: true,
          example: 'jane.smith@university.edu',
          validation: [
            { field: 'email', type: 'required', message: 'Email is required' },
            { field: 'email', type: 'unique', message: 'Email must be unique' },
            { field: 'email', type: 'pattern', value: '^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$', message: 'Invalid email format' }
          ],
          width: 30
        },
        {
          header: 'Department*',
          key: 'department',
          required: true,
          example: departments.length > 0 ? departments[0].name : 'Computer Science',
          validation: [
            { field: 'department', type: 'required', message: 'Department is required' },
            { field: 'department', type: 'enum', value: departments.map(d => d.name), message: 'Invalid department' }
          ],
          width: 25
        },
        {
          header: 'Employee ID',
          key: 'employee_id',
          required: false,
          example: 'EMP001',
          validation: [
            { field: 'employee_id', type: 'unique', message: 'Employee ID must be unique' },
            { field: 'employee_id', type: 'pattern', value: '^[A-Z0-9]{3,10}$', message: 'Employee ID must be 3-10 characters, uppercase letters and numbers' }
          ],
          width: 15
        },
        {
          header: 'Qualification',
          key: 'qualification',
          required: false,
          example: 'Ph.D. Computer Science',
          validation: [],
          width: 25
        },
        {
          header: 'Specialization',
          key: 'specialization',
          required: false,
          example: 'Machine Learning, Data Science',
          validation: [],
          width: 30
        }
      ];

      const workbook = this.createWorkbook('Teachers', columns, departments);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=teacher_template.xlsx');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.send(buffer);

    } catch (error) {
      console.error('Error generating teacher template:', error);
      res.status(500).json({ error: 'Failed to generate teacher template' });
    }
  }

  // Create workbook with multiple sheets
  private createWorkbook(dataType: string, columns: TemplateColumn[], departments: any[], sections?: any[]): XLSX.WorkBook {
    const workbook = XLSX.utils.book_new();

    // Main data sheet
    const dataSheet = this.createDataSheet(columns);
    XLSX.utils.book_append_sheet(workbook, dataSheet, dataType);

    // Instructions sheet
    const instructionsSheet = this.createInstructionsSheet(dataType, columns);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    // Reference sheets
    const deptSheet = this.createReferenceSheet('Department', departments.map(d => d.name));
    XLSX.utils.book_append_sheet(workbook, deptSheet, 'Departments');

    if (sections) {
      const sectionSheet = this.createReferenceSheet('Section', sections.map(s => s.section_name));
      XLSX.utils.book_append_sheet(workbook, sectionSheet, 'Sections');
    }

    // Validation rules sheet
    const validationSheet = this.createValidationSheet(columns);
    XLSX.utils.book_append_sheet(workbook, validationSheet, 'Validation Rules');

    return workbook;
  }

  // Create main data entry sheet
  private createDataSheet(columns: TemplateColumn[]): XLSX.WorkSheet {
    const headers = columns.map(col => col.header);
    const examples = columns.map(col => col.example);

    const worksheet = XLSX.utils.aoa_to_sheet([
      headers,
      examples,
      [], // Empty row for user data
      [], // Additional empty rows
      []
    ]);

    // Set column widths
    const colWidths = columns.map(col => ({ width: col.width || 15 }));
    worksheet['!cols'] = colWidths;

    // Style header row
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4472C4' } },
        alignment: { horizontal: 'center' }
      };
    }

    // Style example row
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 1, c: col });
      if (!worksheet[cellAddress]) continue;
      
      worksheet[cellAddress].s = {
        font: { italic: true, color: { rgb: '666666' } },
        fill: { fgColor: { rgb: 'F2F2F2' } }
      };
    }

    return worksheet;
  }

  // Create instructions sheet
  private createInstructionsSheet(dataType: string, columns: TemplateColumn[]): XLSX.WorkSheet {
    const instructions = [
      [`${dataType} Data Entry Template - Instructions`],
      [],
      ['General Guidelines:'],
      ['1. Fill data starting from row 3 (after the example row)'],
      ['2. Required fields are marked with * in the header'],
      ['3. Follow the format shown in the example row'],
      ['4. Do not modify the header row'],
      ['5. Check validation rules in the "Validation Rules" sheet'],
      [],
      ['Column Descriptions:'],
      []
    ];

    columns.forEach(col => {
      instructions.push([
        `${col.header}:`,
        col.required ? 'Required' : 'Optional',
        `Example: ${col.example}`
      ]);
    });

    instructions.push(
      [],
      ['Notes:'],
      ['• Use the reference sheets for valid department and section names'],
      ['• Ensure all required fields are filled'],
      ['• Email addresses must be unique'],
      ['• Contact numbers should include country code'],
      ['• Save the file before uploading for processing']
    );

    const worksheet = XLSX.utils.aoa_to_sheet(instructions);
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 30 },
      { width: 15 },
      { width: 40 }
    ];

    return worksheet;
  }

  // Create reference data sheet
  private createReferenceSheet(type: string, values: string[]): XLSX.WorkSheet {
    const data = [[type], ...values.map(val => [val])];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // Style header
    worksheet['A1'].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '70AD47' } },
      alignment: { horizontal: 'center' }
    };

    worksheet['!cols'] = [{ width: 25 }];
    return worksheet;
  }

  // Create validation rules sheet
  private createValidationSheet(columns: TemplateColumn[]): XLSX.WorkSheet {
    const validationData = [
      ['Field', 'Rule Type', 'Rule Value', 'Error Message'],
      []
    ];

    columns.forEach(col => {
      col.validation.forEach(rule => {
        validationData.push([
          col.header,
          rule.type,
          Array.isArray(rule.value) ? rule.value.join(', ') : (rule.value || ''),
          rule.message
        ]);
      });
    });

    const worksheet = XLSX.utils.aoa_to_sheet(validationData);
    
    // Style header row
    worksheet['A1'].s = worksheet['B1'].s = worksheet['C1'].s = worksheet['D1'].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: 'D9534F' } },
      alignment: { horizontal: 'center' }
    };

    worksheet['!cols'] = [
      { width: 20 },
      { width: 15 },
      { width: 30 },
      { width: 40 }
    ];

    return worksheet;
  }

  // Get validation rules for a specific template type
  async getValidationRules(req: Request, res: Response) {
    try {
      const { type } = req.params; // 'student' or 'teacher'

      let validationRules: any = {};

      if (type === 'student') {
        validationRules = {
          name: {
            required: true,
            pattern: '^[a-zA-Z\\s]{2,50}$',
            message: 'Name must be 2-50 characters, letters and spaces only'
          },
          roll_number: {
            required: true,
            unique: true,
            pattern: '^[0-9A-Z]{4,15}$',
            message: 'Roll number must be 4-15 characters, alphanumeric'
          },
          email: {
            required: true,
            unique: true,
            pattern: '^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$',
            message: 'Invalid email format'
          },
          department: {
            required: true,
            enum: (await Department.findAll()).map(d => d.name)
          },
          section: {
            required: true,
            enum: (await Section.findAll()).map(s => s.section_name)
          },
          semester: {
            required: true,
            enum: ['1', '2', '3', '4', '5', '6', '7', '8']
          }
        };
      } else if (type === 'teacher') {
        validationRules = {
          name: {
            required: true,
            pattern: '^[a-zA-Z\\s\\.]{2,50}$',
            message: 'Name must be 2-50 characters, letters, spaces, and dots only'
          },
          email: {
            required: true,
            unique: true,
            pattern: '^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$',
            message: 'Invalid email format'
          },
          department: {
            required: true,
            enum: (await Department.findAll()).map(d => d.name)
          }
        };
      }

      res.json({
        success: true,
        validationRules,
        referenceData: {
          departments: await Department.findAll(),
          sections: type === 'student' ? await Section.findAll() : []
        }
      });

    } catch (error) {
      console.error('Error fetching validation rules:', error);
      res.status(500).json({ error: 'Failed to fetch validation rules' });
    }
  }

  // Smart file parser - automatically detects file type and parses data
  async parseUploadedFile(req: Request, res: Response) {
    try {
      console.log('🔄 Starting file parsing...');
      
      if (!req.file) {
        console.log('❌ No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Extract auto-generation parameters from request
      const autoGenerate = req.body.autoGenerate === 'true';
      const departmentId = req.body.departmentId;
      
      console.log('🎯 Auto-generation mode:', autoGenerate);
      console.log('📍 Department ID:', departmentId);

      const file = req.file;
      console.log('📁 File details:', {
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      });
      
      const fileExtension = path.extname(file.originalname).toLowerCase();
      console.log('📝 File extension:', fileExtension);
      
      let rawData: any[][] = [];
      
      // Parse based on file type
      if (fileExtension === '.csv') {
        console.log('📊 Parsing CSV file...');
        rawData = await this.parseCSVFile(file.buffer);
      } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        console.log('📈 Parsing Excel file...');
        rawData = this.parseExcelFile(file.buffer);
      } else {
        console.log('❌ Unsupported file format:', fileExtension);
        return res.status(400).json({ error: 'Unsupported file format. Please use CSV or Excel files.' });
      }

      console.log('📋 Raw data rows:', rawData.length);
      if (rawData.length === 0) {
        console.log('❌ Empty file');
        return res.status(400).json({ error: 'File appears to be empty or invalid' });
      }

      console.log('🧠 Starting smart parsing...');
      // Smart parsing and validation with auto-generation context
      const parseResult = await this.smartParseData(rawData, autoGenerate, departmentId);
      console.log('✅ Smart parsing completed successfully');
      
      res.json({
        success: true,
        fileName: file.originalname,
        fileSize: file.size,
        parseResult
      });

    } catch (error) {
      console.error('❌ Error parsing uploaded file:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ 
        error: 'Failed to parse uploaded file',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Parse CSV file
  private async parseCSVFile(buffer: Buffer): Promise<any[][]> {
    return new Promise((resolve, reject) => {
      const results: any[][] = [];
      const csvData = buffer.toString('utf-8');
      const lines = csvData.split('\n');
      
      for (const line of lines) {
        if (line.trim()) {
          // Simple CSV parsing (can be enhanced with a proper CSV parser)
          const row = line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
          results.push(row);
        }
      }
      
      resolve(results);
    });
  }

  // Parse Excel file
  private parseExcelFile(buffer: Buffer): any[][] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to array of arrays
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    return rawData as any[][];
  }

  // Smart data parsing with automatic column detection
  private async smartParseData(rawData: any[][], autoGenerate: boolean = false, departmentId?: string): Promise<ParseResult> {
    try {
      console.log('🧠 Starting smart data parsing...');
      
      if (rawData.length < 2) {
        throw new Error('File must contain at least a header row and one data row');
      }

      console.log('📊 Processing headers...');
      const headers = rawData[0].map((h: any) => h.toString().toLowerCase().trim());
      const dataRows = rawData.slice(1);
      console.log('Headers found:', headers);
      console.log('Data rows to process:', dataRows.length);

      // Detect data type (student or teacher)
      console.log('🔍 Detecting data type...');
      const detectedType = this.detectDataType(headers);
      console.log('Detected type:', detectedType);
      
      // Get column mapping
      console.log('🗺️ Getting column mapping...');
      const columnMapping = this.getColumnMapping(headers, detectedType);
      console.log('Column mapping:', columnMapping);
      
      // Parse and validate each row
      const parsedData: ParsedData[] = [];
      let validRows = 0;
      let errorRows = 0;
      let warningRows = 0;
      let suggestionsCount = 0;
      let autoCorrectionsCount = 0;

      // Prepare data for batch validation
      console.log('📋 Preparing batch data...');
      const batchData: any[] = [];
      
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowNumber = i + 2; // +2 because we're 0-indexed and skipped header
        
        if (this.isEmptyRow(row)) continue;

        const mappedData = this.mapRowData(row, headers, columnMapping);
        batchData.push(mappedData);
      }
      console.log('Batch data prepared, records:', batchData.length);

      // Auto-generate missing data if in auto-generation mode
      if (autoGenerate && detectedType === 'student' && departmentId) {
        console.log('🚀 Auto-generating missing student data...');
        
        // Get department info for auto-generation
        const department = await Department.findByPk(departmentId);
        if (!department) {
          throw new Error('Department not found for auto-generation');
        }
        
        let rollCounter = 1;
        const currentYear = new Date().getFullYear();
        const departmentCode = this.generateDepartmentCode(department.name);
        
        for (const data of batchData) {
          // Auto-generate roll number if missing
          if (!data.roll_number) {
            data.roll_number = this.generateRollNumber(currentYear, departmentCode, rollCounter++);
          }
          
          // Auto-generate email if missing
          if (!data.email && data.name) {
            data.email = this.generateEmail(data.roll_number, data.name);
          }
          
          // Set department if missing
          if (!data.department) {
            data.department = department.name;
          }
        }
        
        console.log('✅ Auto-generation completed');
      }

      // Perform batch validation using the enhanced validation engine
      if (detectedType === 'unknown') {
        throw new Error('Unable to determine data type. Please ensure your file follows the template format.');
      }
      
      console.log('🔧 Starting batch validation...');
      const batchValidationResults = await validationEngine.validateBatch(batchData, detectedType);
      console.log('✅ Batch validation completed');
      
      // Process validation results
      console.log('📈 Processing validation results...');
    for (let i = 0; i < batchData.length; i++) {
      const data = batchData[i];
      const validationResult = batchValidationResults[i];
      const rowNumber = i + 2;

      const errors = validationResult.errors.map(e => e.message);
      const warnings = validationResult.warnings.map(w => w.message);
      const suggestions = validationResult.suggestions.map(s => s.message);

      parsedData.push({
        row: rowNumber,
        data,
        errors,
        warnings,
        suggestions,
        correctedData: validationResult.correctedData,
        validationResult
      });

      if (errors.length > 0) {
        errorRows++;
      } else if (warnings.length > 0) {
        warningRows++;
        validRows++;
      } else {
        validRows++;
      }

      suggestionsCount += suggestions.length;
      if (validationResult.correctedData) {
        autoCorrectionsCount++;
      }
    }

    // Check for batch-level duplicates
    const batchValidation = this.analyzeBatchDuplicates(batchValidationResults);

    return {
      success: errorRows === 0,
      data: parsedData,
      summary: {
        totalRows: parsedData.length,
        validRows,
        errorRows,
        warningRows,
        suggestionsCount,
        autoCorrectionsCount
      },
      columnMapping,
      detectedType,
      batchValidation
    };
    } catch (error) {
      console.error('❌ Error in smart data parsing:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  // Detect if the data is for students or teachers
  private detectDataType(headers: string[]): 'student' | 'teacher' | 'unknown' {
    const studentIndicators = ['roll_number', 'rollnumber', 'roll number', 'student_id', 'semester', 'section'];
    const teacherIndicators = ['employee_id', 'employeeid', 'employee id', 'qualification', 'specialization'];

    const studentScore = studentIndicators.reduce((score, indicator) => {
      return score + (headers.some(h => h.includes(indicator)) ? 1 : 0);
    }, 0);

    const teacherScore = teacherIndicators.reduce((score, indicator) => {
      return score + (headers.some(h => h.includes(indicator)) ? 1 : 0);
    }, 0);

    if (studentScore > teacherScore && studentScore > 0) return 'student';
    if (teacherScore > studentScore && teacherScore > 0) return 'teacher';
    
    // If unclear, check for required fields
    const hasName = headers.some(h => h.includes('name'));
    const hasEmail = headers.some(h => h.includes('email'));
    
    if (hasName && hasEmail) {
      // Default to student if we have basic fields but can't determine type
      return 'student';
    }
    
    return 'unknown';
  }

  // Map file columns to database fields
  private getColumnMapping(headers: string[], type: 'student' | 'teacher' | 'unknown'): { [key: string]: string } {
    const mapping: { [key: string]: string } = {};

    // Common mappings
    const commonMappings = {
      'name': ['name', 'full name', 'student name', 'teacher name'],
      'email': ['email', 'email address', 'e-mail'],
      'department': ['department', 'dept', 'department name'],
    };

    // Student-specific mappings
    const studentMappings = {
      'roll_number': ['roll number', 'roll_number', 'rollnumber', 'student_id', 'id'],
      'section': ['section', 'section name', 'class'],
      'semester': ['semester', 'sem', 'term'],
      'contact_number': ['contact', 'phone', 'mobile', 'contact number'],
      'parent_name': ['parent name', 'parent', 'guardian'],
      'parent_contact': ['parent contact', 'parent phone', 'guardian contact'],
      'address': ['address', 'home address', 'location']
    };

    // Teacher-specific mappings
    const teacherMappings = {
      'employee_id': ['employee id', 'employee_id', 'emp_id', 'staff_id'],
      'qualification': ['qualification', 'degree', 'education'],
      'specialization': ['specialization', 'expertise', 'subject area']
    };

    // Combine mappings based on type
    let allMappings = { ...commonMappings };
    if (type === 'student') {
      allMappings = { ...allMappings, ...studentMappings };
    } else if (type === 'teacher') {
      allMappings = { ...allMappings, ...teacherMappings };
    }

    // Find best match for each database field
    Object.keys(allMappings).forEach(dbField => {
      const possibleHeaders = allMappings[dbField];
      const matchedHeader = headers.find(h => 
        possibleHeaders.some(ph => h.includes(ph))
      );
      if (matchedHeader) {
        mapping[dbField] = matchedHeader;
      }
    });

    return mapping;
  }

  // Parse individual data row
  private async parseDataRow(
    row: any[], 
    headers: string[], 
    columnMapping: { [key: string]: string }, 
    type: 'student' | 'teacher' | 'unknown',
    rowNumber: number
  ): Promise<ParsedData> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const data: any = {};

    // Map row data to database fields
    Object.keys(columnMapping).forEach(dbField => {
      const headerName = columnMapping[dbField];
      const headerIndex = headers.indexOf(headerName);
      
      if (headerIndex !== -1 && headerIndex < row.length) {
        let value = row[headerIndex];
        
        // Clean and normalize the value
        if (typeof value === 'string') {
          value = value.trim();
        }
        
        data[dbField] = value || null;
      }
    });

    // Basic validation
    if (type === 'student') {
      await this.validateStudentData(data, errors, warnings);
    } else if (type === 'teacher') {
      await this.validateTeacherData(data, errors, warnings);
    }

    return {
      row: rowNumber,
      data,
      errors,
      warnings
    };
  }

  // Validate student data
  private async validateStudentData(data: any, errors: string[], warnings: string[], autoGenerate: boolean = false) {
    // Required fields
    if (!data.name) errors.push('Name is required');
    
    // Skip roll_number and email validation in auto-generation mode
    if (!autoGenerate) {
      if (!data.roll_number) errors.push('Roll number is required');
      if (!data.email) errors.push('Email is required');
      if (!data.department) errors.push('Department is required');
    }

    // Format validation
    if (data.name && !/^[a-zA-Z\s]{2,50}$/.test(data.name)) {
      errors.push('Name must be 2-50 characters, letters and spaces only');
    }

    // Only validate roll_number format if not in auto-generation mode
    if (!autoGenerate && data.roll_number && !/^[0-9A-Z]{4,15}$/.test(data.roll_number)) {
      errors.push('Roll number must be 4-15 characters, alphanumeric');
    }

    if (data.email && !/^[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}$/.test(data.email)) {
      errors.push('Invalid email format');
    }

    // Check for existing records
    if (data.roll_number) {
      const existingStudent = await Student.findOne({ where: { roll_number: data.roll_number } });
      if (existingStudent) {
        errors.push('Roll number already exists in database');
      }
    }

    if (data.email) {
      const existingUser = await User.findOne({ where: { email: data.email } });
      if (existingUser) {
        errors.push('Email already exists in database');
      }
    }

    // Reference validation
    if (data.department) {
      const dept = await Department.findOne({ where: { name: data.department } });
      if (!dept) {
        errors.push('Invalid department name');
      }
    }

    if (data.section) {
      const section = await Section.findOne({ where: { section_name: data.section } });
      if (!section) {
        warnings.push('Section not found, will be created if needed');
      }
    }
  }

  // Validate teacher data
  private async validateTeacherData(data: any, errors: string[], warnings: string[]) {
    // Required fields
    if (!data.name) errors.push('Name is required');
    if (!data.email) errors.push('Email is required');
    if (!data.department) errors.push('Department is required');

    // Format validation
    if (data.name && !/^[a-zA-Z\s\.]{2,50}$/.test(data.name)) {
      errors.push('Name must be 2-50 characters, letters, spaces, and dots only');
    }

    if (data.email && !/^[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}$/.test(data.email)) {
      errors.push('Invalid email format');
    }

    // Check for existing records
    if (data.email) {
      const existingUser = await User.findOne({ where: { email: data.email } });
      if (existingUser) {
        errors.push('Email already exists in database');
      }
    }

    // Reference validation
    if (data.department) {
      const dept = await Department.findOne({ where: { name: data.department } });
      if (!dept) {
        errors.push('Invalid department name');
      }
    }
  }

  // Check if row is empty
  private isEmptyRow(row: any[]): boolean {
    return row.every(cell => !cell || cell.toString().trim() === '');
  }

  // Map row data to database fields
  private mapRowData(row: any[], headers: string[], columnMapping: { [key: string]: string }): any {
    const data: any = {};
    
    Object.keys(columnMapping).forEach(dbField => {
      const headerName = columnMapping[dbField];
      const headerIndex = headers.indexOf(headerName);
      
      if (headerIndex !== -1 && headerIndex < row.length) {
        let value = row[headerIndex];
        
        // Clean and normalize the value
        if (typeof value === 'string') {
          value = value.trim();
        }
        
        data[dbField] = value || null;
      }
    });
    
    return data;
  }

  // Analyze batch duplicates
  private analyzeBatchDuplicates(validationResults: any[]): {
    hasBatchDuplicates: boolean;
    duplicateFields: string[];
  } {
    const duplicateFields = new Set<string>();
    let hasBatchDuplicates = false;
    
    validationResults.forEach(result => {
      result.errors.forEach((error: any) => {
        if (error.code && error.code.startsWith('BATCH_DUPLICATE_')) {
          hasBatchDuplicates = true;
          duplicateFields.add(error.field);
        }
      });
    });
    
    return {
      hasBatchDuplicates,
      duplicateFields: Array.from(duplicateFields)
    };
  }

  // Enhanced validation with suggestions endpoint
  async validateDataWithSuggestions(req: Request, res: Response) {
    try {
      const { data, type } = req.body;

      if (!data || !type) {
        return res.status(400).json({ error: 'Data and type are required' });
      }

      if (!['student', 'teacher'].includes(type)) {
        return res.status(400).json({ error: 'Type must be either "student" or "teacher"' });
      }

      const validationResult = await validationEngine.validateData(data, type);

      res.json({
        success: true,
        validation: validationResult,
        hasErrors: !validationResult.isValid,
        hasWarnings: validationResult.warnings.length > 0,
        hasSuggestions: validationResult.suggestions.length > 0,
        hasCorrections: !!validationResult.correctedData
      });

    } catch (error) {
      console.error('Error validating data:', error);
      res.status(500).json({ error: 'Failed to validate data' });
    }
  }

  // Batch validation endpoint
  async validateBatchWithSuggestions(req: Request, res: Response) {
    try {
      const { dataArray, type } = req.body;

      if (!dataArray || !Array.isArray(dataArray) || !type) {
        return res.status(400).json({ error: 'Data array and type are required' });
      }

      if (!['student', 'teacher'].includes(type)) {
        return res.status(400).json({ error: 'Type must be either "student" or "teacher"' });
      }

      const validationResults = await validationEngine.validateBatch(dataArray, type);

      // Calculate summary statistics
      const summary = {
        totalRecords: validationResults.length,
        validRecords: validationResults.filter(r => r.isValid).length,
        recordsWithErrors: validationResults.filter(r => r.errors.length > 0).length,
        recordsWithWarnings: validationResults.filter(r => r.warnings.length > 0).length,
        recordsWithSuggestions: validationResults.filter(r => r.suggestions.length > 0).length,
        recordsWithCorrections: validationResults.filter(r => r.correctedData).length
      };

      res.json({
        success: true,
        validationResults,
        summary,
        overallValid: summary.recordsWithErrors === 0
      });

    } catch (error) {
      console.error('Error validating batch data:', error);
      res.status(500).json({ error: 'Failed to validate batch data' });
    }
  }

  async bulkImportData(req: Request, res: Response): Promise<void> {
    try {
      console.log('=== BULK IMPORT DATA ===');
      const { validatedData, dataType, departmentId, autoGenerate } = req.body;

      if (!validatedData || !Array.isArray(validatedData)) {
        res.status(400).json({ error: 'Invalid validated data provided' });
        return;
      }

      if (!dataType || !['students', 'teachers'].includes(dataType)) {
        res.status(400).json({ error: 'Invalid data type. Must be students or teachers' });
        return;
      }

      console.log(`Importing ${validatedData.length} ${dataType} records`);
      console.log('📋 Sample record:', JSON.stringify(validatedData[0], null, 2));
      console.log('🎯 Auto-generate mode:', autoGenerate);
      console.log('🏢 Department ID:', departmentId);

      let imported = 0;
      let failed = 0;
      const errors: string[] = [];
      const currentYear = new Date().getFullYear();

      for (const record of validatedData) {
        try {
          if (dataType === 'students') {
            await this.importStudentRecord(record, autoGenerate, departmentId, currentYear);
          } else if (dataType === 'teachers') {
            await this.importTeacherRecord(record, autoGenerate, departmentId);
          }
          imported++;
        } catch (error) {
          failed++;
          const errorMsg = `Failed to import record ${record.name || record.full_name || 'Unknown'}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      res.json({
        success: true,
        imported,
        failed,
        errors,
        message: `Successfully imported ${imported} ${dataType}. ${failed} failed.`
      });
    } catch (error) {
      console.error('Bulk import error:', error);
      res.status(500).json({ error: 'Failed to import data' });
    }
  }

  private async importStudentRecord(record: any, autoGenerate: boolean = false, departmentId?: number, year?: number): Promise<void> {
    // Use provided department ID if auto-generate mode is enabled
    let finalDepartmentId = departmentId;
    
    if (!autoGenerate) {
      // Original logic for manual mode - lookup department from name
      finalDepartmentId = record.department_id;
      if (!finalDepartmentId && record.department) {
        console.log(`🔍 Looking up department: "${record.department}"`);
        
        // Try exact match first
        let department = await Department.findOne({ 
          where: { name: record.department } 
        });
        
        // If exact match fails, try case-insensitive search
        if (!department) {
          department = await Department.findOne({ 
            where: { 
              name: {
                [Op.iLike]: record.department
              }
            } 
          });
        }
        
        // If still not found, try partial match
        if (!department) {
          department = await Department.findOne({ 
            where: { 
              name: {
                [Op.iLike]: `%${record.department}%`
              }
            } 
          });
        }
        
        if (department) {
          finalDepartmentId = department.department_id;
          console.log(`✅ Found department ID: ${finalDepartmentId}`);
        } else {
          // List available departments for debugging
          const allDepartments = await Department.findAll({ attributes: ['name'] });
          console.log('❌ Available departments:', allDepartments.map(d => d.name));
          throw new Error(`Department "${record.department}" not found. Available departments: ${allDepartments.map(d => d.name).join(', ')}`);
        }
      }
    }

    if (!finalDepartmentId) {
      throw new Error('Department ID is required');
    }

    // Transform section name to section_id if needed
    let sectionId = record.section_id;
    if (!autoGenerate && !sectionId && record.section && finalDepartmentId) {
      const section = await Section.findOne({ 
        where: { 
          section_name: record.section,
          department_id: finalDepartmentId 
        } 
      });
      if (section) {
        sectionId = section.section_id;
      }
    }

    // Auto-generate roll number and email if in auto-generate mode
    let rollNumber = record.student_id || record.roll_number;
    let email = record.email;
    
    if (autoGenerate) {
      const currentYear = year || new Date().getFullYear();
      rollNumber = await generateRollNumber(finalDepartmentId, currentYear);
      
      const firstName = (record.full_name || record.name || '').split(' ')[0] || 'student';
      email = generateEmail(rollNumber, firstName);
      
      console.log(`🎯 Generated roll number: ${rollNumber}`);
      console.log(`📧 Generated email: ${email}`);
    }

    if (!rollNumber) {
      rollNumber = `STU${Date.now()}`; // Fallback
    }

    if (!email) {
      throw new Error('Email is required');
    }

    // First create a user record
    const defaultPassword = 'defaultPassword123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    
    const userData = {
      email: email,
      password_hash: passwordHash,
      role: 'student' as const
    };

    const user = await User.create(userData);

    // Then create the student record
    const studentData = {
      user_id: user.user_id,
      name: record.full_name || record.name,
      roll_number: rollNumber,
      department_id: finalDepartmentId,
      section_id: sectionId,
      semester: record.semester || 1,
      year: record.year || record.semester || 1, // Legacy field
      contact_number: record.phone,
      parent_name: record.parent_name,
      parent_contact: record.parent_contact,
      address: record.address
    };

    await Student.create(studentData);
  }

  private async importTeacherRecord(record: any, autoGenerate: boolean = false, departmentId?: number): Promise<void> {
    // Use provided department ID if auto-generate mode is enabled
    let finalDepartmentId = departmentId;
    
    if (!autoGenerate) {
      // Original logic for manual mode - lookup department from name
      finalDepartmentId = record.department_id;
      if (!finalDepartmentId && record.department) {
        console.log(`🔍 Looking up department: "${record.department}"`);
        
        // Try exact match first
        let department = await Department.findOne({ 
          where: { name: record.department } 
        });
        
        // If exact match fails, try case-insensitive search
        if (!department) {
          department = await Department.findOne({ 
            where: { 
              name: {
                [Op.iLike]: record.department
              }
            } 
          });
        }
        
        // If still not found, try partial match
        if (!department) {
          department = await Department.findOne({ 
            where: { 
              name: {
                [Op.iLike]: `%${record.department}%`
              }
            } 
          });
        }
        
        if (department) {
          finalDepartmentId = department.department_id;
          console.log(`✅ Found department ID: ${finalDepartmentId}`);
        } else {
          // List available departments for debugging
          const allDepartments = await Department.findAll({ attributes: ['name'] });
          console.log('❌ Available departments:', allDepartments.map(d => d.name));
          throw new Error(`Department "${record.department}" not found. Available departments: ${allDepartments.map(d => d.name).join(', ')}`);
        }
      }
    }

    if (!finalDepartmentId) {
      throw new Error('Department ID is required');
    }

    // Auto-generate email if in auto-generate mode and no email provided
    let email = record.email;
    if (autoGenerate && !email) {
      const firstName = (record.full_name || record.name || '').split(' ')[0] || 'teacher';
      const lastName = (record.full_name || record.name || '').split(' ').pop() || 'user';
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@hazir.com`;
      console.log(`📧 Generated teacher email: ${email}`);
    }

    if (!email) {
      throw new Error('Email is required for teacher');
    }

    // First create a user record
    const defaultPassword = 'defaultPassword123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    
    const userData = {
      email: email,
      password_hash: passwordHash,
      role: 'teacher' as const
    };

    const user = await User.create(userData);

    // Then create the teacher record
    const teacherData = {
      user_id: user.user_id,
      name: record.full_name || record.name,
      department_id: finalDepartmentId
    };

    await Teacher.create(teacherData);
  }

  // Auto-generation utility methods
  private generateDepartmentCode(departmentName: string): string {
    return generateDepartmentCode(departmentName);
  }

  private generateRollNumber(year: number, deptCode: string, counter: number): string {
    // For simplicity in preview, we'll use the counter. In actual import, this should check database
    return `${year}${deptCode}${counter.toString().padStart(3, '0')}`;
  }

  private generateEmail(rollNumber: string, firstName: string): string {
    return generateEmail(rollNumber, firstName);
  }
}

export default new DataEntryController();