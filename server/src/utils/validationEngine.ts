import { Department, Section, Student, Teacher, User } from '../models';

interface ValidationError {
  field: string;
  value: any;
  message: string;
  suggestions?: string[];
  severity: 'error' | 'warning' | 'info';
  code: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions: ValidationError[];
  correctedData?: any;
}

interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'unique' | 'reference' | 'custom';
  rule: any;
  message: string;
  suggestions?: (value: any, context?: any) => string[];
}

class ValidationEngine {
  private departments: any[] = [];
  private sections: any[] = [];
  private existingEmails: Set<string> = new Set();
  private existingRollNumbers: Set<string> = new Set();

  // Initialize reference data for validation
  async initialize() {
    this.departments = await Department.findAll();
    this.sections = await Section.findAll();
    
    // Load existing emails and roll numbers for uniqueness checks
    const users = await User.findAll({ attributes: ['email'] });
    const students = await Student.findAll({ attributes: ['roll_number'] });
    
    this.existingEmails = new Set(users.map(u => u.email.toLowerCase()));
    this.existingRollNumbers = new Set(students.map(s => s.roll_number.toUpperCase()));
  }

  // Main validation method
  async validateData(data: any, type: 'student' | 'teacher'): Promise<ValidationResult> {
    await this.initialize();
    
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: ValidationError[] = [];
    const correctedData = { ...data };

    const rules = type === 'student' ? this.getStudentValidationRules() : this.getTeacherValidationRules();

    for (const rule of rules) {
      const fieldValue = data[rule.field];
      const validationResult = await this.validateField(rule, fieldValue, data, correctedData);
      
      validationResult.errors.forEach(e => errors.push(e));
      validationResult.warnings.forEach(w => warnings.push(w));
      validationResult.suggestions.forEach(s => suggestions.push(s));
    }

    // Cross-field validation
    const crossFieldResults = await this.performCrossFieldValidation(data, type);
    crossFieldResults.errors.forEach(e => errors.push(e));
    crossFieldResults.warnings.forEach(w => warnings.push(w));

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      correctedData: JSON.stringify(correctedData) !== JSON.stringify(data) ? correctedData : undefined
    };
  }

  // Validate individual field
  private async validateField(
    rule: ValidationRule, 
    value: any, 
    fullData: any, 
    correctedData: any
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: ValidationError[] = [];

    switch (rule.type) {
      case 'required':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors.push({
            field: rule.field,
            value,
            message: rule.message,
            severity: 'error',
            code: 'REQUIRED_FIELD_MISSING'
          });
        }
        break;

      case 'format':
        if (value && !this.validateFormat(rule.rule, value)) {
          const suggestion = this.generateFormatSuggestion(rule.field, value);
          errors.push({
            field: rule.field,
            value,
            message: rule.message,
            suggestions: suggestion ? [suggestion] : [],
            severity: 'error',
            code: 'INVALID_FORMAT'
          });
          
          // Auto-correct if possible
          const corrected = this.autoCorrectFormat(rule.field, value);
          if (corrected && corrected !== value) {
            correctedData[rule.field] = corrected;
            suggestions.push({
              field: rule.field,
              value: corrected,
              message: `Auto-corrected to: ${corrected}`,
              severity: 'info',
              code: 'AUTO_CORRECTION'
            });
          }
        }
        break;

      case 'unique':
        if (value && await this.checkUniqueness(rule.field, value)) {
          errors.push({
            field: rule.field,
            value,
            message: rule.message,
            severity: 'error',
            code: 'DUPLICATE_VALUE'
          });
        }
        break;

      case 'reference':
        if (value) {
          const referenceResult = await this.validateReference(rule.field, value);
          if (!referenceResult.isValid) {
            const fuzzyMatches = this.findFuzzyMatches(rule.field, value);
            errors.push({
              field: rule.field,
              value,
              message: rule.message,
              suggestions: fuzzyMatches,
              severity: 'error',
              code: 'INVALID_REFERENCE'
            });
          }
        }
        break;

      case 'custom':
        const customResult = await rule.rule(value, fullData);
        if (!customResult.isValid) {
          errors.push({
            field: rule.field,
            value,
            message: customResult.message,
            suggestions: rule.suggestions ? rule.suggestions(value, fullData) : [],
            severity: customResult.severity || 'error',
            code: customResult.code || 'CUSTOM_VALIDATION_FAILED'
          });
        }
        break;
    }

    return { isValid: errors.length === 0, errors, warnings, suggestions };
  }

  // Get validation rules for students
  private getStudentValidationRules(): ValidationRule[] {
    return [
      {
        field: 'name',
        type: 'required',
        rule: null,
        message: 'Student name is required'
      },
      {
        field: 'name',
        type: 'format',
        rule: /^[a-zA-Z\s\.]{2,50}$/,
        message: 'Name must be 2-50 characters, letters, spaces, and dots only'
      },
      {
        field: 'roll_number',
        type: 'required',
        rule: null,
        message: 'Roll number is required'
      },
      {
        field: 'roll_number',
        type: 'format',
        rule: /^[0-9A-Z]{4,15}$/,
        message: 'Roll number must be 4-15 characters, alphanumeric'
      },
      {
        field: 'roll_number',
        type: 'unique',
        rule: null,
        message: 'Roll number already exists'
      },
      {
        field: 'email',
        type: 'required',
        rule: null,
        message: 'Email is required'
      },
      {
        field: 'email',
        type: 'format',
        rule: /^[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}$/,
        message: 'Invalid email format'
      },
      {
        field: 'email',
        type: 'unique',
        rule: null,
        message: 'Email already exists'
      },
      {
        field: 'department',
        type: 'required',
        rule: null,
        message: 'Department is required'
      },
      {
        field: 'department',
        type: 'reference',
        rule: 'departments',
        message: 'Invalid department name'
      },
      {
        field: 'section',
        type: 'reference',
        rule: 'sections',
        message: 'Invalid section name'
      },
      {
        field: 'semester',
        type: 'custom',
        rule: (value: any) => ({
          isValid: !value || ['1', '2', '3', '4', '5', '6', '7', '8'].includes(value.toString()),
          message: 'Semester must be between 1-8'
        }),
        message: 'Invalid semester'
      },
      {
        field: 'contact_number',
        type: 'format',
        rule: /^\+?[0-9]{10,15}$/,
        message: 'Invalid contact number format'
      },
      {
        field: 'parent_contact',
        type: 'format',
        rule: /^\+?[0-9]{10,15}$/,
        message: 'Invalid parent contact format'
      }
    ];
  }

  // Get validation rules for teachers
  private getTeacherValidationRules(): ValidationRule[] {
    return [
      {
        field: 'name',
        type: 'required',
        rule: null,
        message: 'Teacher name is required'
      },
      {
        field: 'name',
        type: 'format',
        rule: /^[a-zA-Z\s\.]{2,50}$/,
        message: 'Name must be 2-50 characters, letters, spaces, and dots only'
      },
      {
        field: 'email',
        type: 'required',
        rule: null,
        message: 'Email is required'
      },
      {
        field: 'email',
        type: 'format',
        rule: /^[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}$/,
        message: 'Invalid email format'
      },
      {
        field: 'email',
        type: 'unique',
        rule: null,
        message: 'Email already exists'
      },
      {
        field: 'department',
        type: 'required',
        rule: null,
        message: 'Department is required'
      },
      {
        field: 'department',
        type: 'reference',
        rule: 'departments',
        message: 'Invalid department name'
      },
      {
        field: 'employee_id',
        type: 'format',
        rule: /^[A-Z0-9]{3,10}$/,
        message: 'Employee ID must be 3-10 characters, uppercase letters and numbers'
      }
    ];
  }

  // Validate format using regex
  private validateFormat(pattern: RegExp, value: any): boolean {
    if (!value) return true; // Allow empty for optional fields
    return pattern.test(value.toString());
  }

  // Generate format suggestions
  private generateFormatSuggestion(field: string, value: any): string | null {
    const val = value?.toString() || '';
    
    switch (field) {
      case 'email':
        if (!val.includes('@')) {
          return `${val}@university.edu`;
        }
        if (val.includes('@') && !val.includes('.')) {
          return `${val}.com`;
        }
        break;
      
      case 'roll_number':
        // Remove special characters and spaces
        const cleaned = val.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (cleaned.length >= 4 && cleaned.length <= 15) {
          return cleaned;
        }
        break;
      
      case 'contact_number':
      case 'parent_contact':
        // Remove all non-digits and add + if needed
        const digits = val.replace(/\D/g, '');
        if (digits.length >= 10) {
          return `+${digits}`;
        }
        break;
    }
    
    return null;
  }

  // Auto-correct format issues
  private autoCorrectFormat(field: string, value: any): string | null {
    const val = value?.toString() || '';
    
    switch (field) {
      case 'name':
        // Capitalize first letter of each word
        return val.replace(/\b\w/g, l => l.toUpperCase()).trim();
      
      case 'roll_number':
        return val.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      
      case 'email':
        return val.toLowerCase().trim();
      
      case 'department':
        // Capitalize first letter
        return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
      
      case 'contact_number':
      case 'parent_contact':
        const digits = val.replace(/\D/g, '');
        return digits.length >= 10 ? `+${digits}` : val;
    }
    
    return null;
  }

  // Check uniqueness
  private async checkUniqueness(field: string, value: any): Promise<boolean> {
    const val = value.toString().toLowerCase();
    
    switch (field) {
      case 'email':
        return this.existingEmails.has(val);
      case 'roll_number':
        return this.existingRollNumbers.has(val.toUpperCase());
      default:
        return false;
    }
  }

  // Validate reference data
  private async validateReference(field: string, value: any): Promise<{ isValid: boolean }> {
    const val = value.toString();
    
    switch (field) {
      case 'department':
        return {
          isValid: this.departments.some(d => 
            d.name.toLowerCase() === val.toLowerCase()
          )
        };
      case 'section':
        return {
          isValid: this.sections.some(s => 
            s.section_name.toLowerCase() === val.toLowerCase()
          )
        };
      default:
        return { isValid: true };
    }
  }

  // Find fuzzy matches for reference data
  private findFuzzyMatches(field: string, value: any): string[] {
    const val = value.toString().toLowerCase();
    let candidates: string[] = [];
    
    switch (field) {
      case 'department':
        candidates = this.departments.map(d => d.name);
        break;
      case 'section':
        candidates = this.sections.map(s => s.section_name);
        break;
    }
    
    // Simple fuzzy matching based on similarity
    return candidates
      .filter(candidate => {
        const similarity = this.calculateSimilarity(val, candidate.toLowerCase());
        return similarity > 0.6; // 60% similarity threshold
      })
      .slice(0, 3); // Return top 3 matches
  }

  // Calculate string similarity (Levenshtein distance based)
  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const maxLength = Math.max(len1, len2);
    return maxLength === 0 ? 1 : (maxLength - matrix[len2][len1]) / maxLength;
  }

  // Cross-field validation
  private async performCrossFieldValidation(data: any, type: 'student' | 'teacher'): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: ValidationError[] = [];

    if (type === 'student') {
      // Check email domain consistency with department
      if (data.email && data.department) {
        const emailDomain = data.email.split('@')[1]?.toLowerCase();
        if (emailDomain && !emailDomain.includes('university') && !emailDomain.includes('edu')) {
          warnings.push({
            field: 'email',
            value: data.email,
            message: 'Email domain might not be institutional',
            suggestions: [`${data.email.split('@')[0]}@university.edu`],
            severity: 'warning',
            code: 'SUSPICIOUS_EMAIL_DOMAIN'
          });
        }
      }

      // Check semester and department consistency
      if (data.semester && data.department) {
        const semester = parseInt(data.semester);
        if (semester > 8) {
          warnings.push({
            field: 'semester',
            value: data.semester,
            message: 'Semester value seems unusually high',
            severity: 'warning',
            code: 'SUSPICIOUS_SEMESTER'
          });
        }
      }

      // Check contact number format consistency
      if (data.contact_number && data.parent_contact) {
        const studentContact = data.contact_number.replace(/\D/g, '');
        const parentContact = data.parent_contact.replace(/\D/g, '');
        
        if (studentContact === parentContact) {
          warnings.push({
            field: 'parent_contact',
            value: data.parent_contact,
            message: 'Student and parent contact numbers are identical',
            severity: 'warning',
            code: 'IDENTICAL_CONTACTS'
          });
        }
      }
    }

    return { isValid: errors.length === 0, errors, warnings, suggestions };
  }

  // Batch validation for multiple records
  async validateBatch(records: any[], type: 'student' | 'teacher'): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    for (const record of records) {
      const result = await this.validateData(record, type);
      results.push(result);
    }
    
    // Additional batch-specific validations
    await this.performBatchValidation(records, results, type);
    
    return results;
  }

  // Batch-specific validation (duplicates within the batch)
  private async performBatchValidation(
    records: any[], 
    results: ValidationResult[], 
    type: 'student' | 'teacher'
  ): Promise<void> {
    const emailMap = new Map<string, number[]>();
    const rollNumberMap = new Map<string, number[]>();

    // Build maps of duplicate fields within the batch
    records.forEach((record, index) => {
      if (record.email) {
        const email = String(record.email).toLowerCase();
        if (!emailMap.has(email)) {
          emailMap.set(email, []);
        }
        emailMap.get(email)!.push(index);
      }

      if (record.roll_number) {
        const rollNumber = String(record.roll_number).toUpperCase();
        if (!rollNumberMap.has(rollNumber)) {
          rollNumberMap.set(rollNumber, []);
        }
        rollNumberMap.get(rollNumber)!.push(index);
      }
    });

    // Add duplicate errors
    emailMap.forEach((indices, email) => {
      if (indices.length > 1) {
        indices.forEach(index => {
          results[index].errors.push({
            field: 'email',
            value: email,
            message: `Duplicate email in batch (rows: ${indices.map(i => i + 1).join(', ')})`,
            severity: 'error',
            code: 'BATCH_DUPLICATE_EMAIL'
          });
        });
      }
    });

    if (type === 'student') {
      rollNumberMap.forEach((indices, rollNumber) => {
        if (indices.length > 1) {
          indices.forEach(index => {
            results[index].errors.push({
              field: 'roll_number',
              value: rollNumber,
              message: `Duplicate roll number in batch (rows: ${indices.map(i => i + 1).join(', ')})`,
              severity: 'error',
              code: 'BATCH_DUPLICATE_ROLL_NUMBER'
            });
          });
        }
      });
    }
  }
}

export default new ValidationEngine();