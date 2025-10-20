import { Model, DataTypes, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface StudentAttributes {
  student_id: number;
  user_id: number;
  name: string;
  roll_number: string;
  department_id: number;
  section_id?: number | null;
  batch_id?: number | null;
  semester: number;
  year: number; // Legacy field for backward compatibility
  contact_number?: string | null;
  parent_name?: string | null;
  parent_contact?: string | null;
  address?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

interface StudentCreationAttributes
  extends Optional<
    StudentAttributes,
    "student_id" | "created_at" | "updated_at"
  > {}

class Student
  extends Model<StudentAttributes, StudentCreationAttributes>
  implements StudentAttributes
{
  public student_id!: number;
  public user_id!: number;
  public name!: string;
  public roll_number!: string;
  public department_id!: number;
  public section_id!: number | null;
  public batch_id!: number | null;
  public semester!: number;
  public year!: number; // Legacy field for backward compatibility
  public contact_number!: string | null;
  public parent_name!: string | null;
  public parent_contact!: string | null;
  public address!: string | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association helpers
  static associate(models: any) {
    Student.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });

    Student.belongsTo(models.Department, {
      foreignKey: "department_id",
      as: "department",
    });

    Student.belongsTo(models.Section, {
      foreignKey: "section_id",
      as: "section",
    });

    Student.belongsTo(models.Batch, {
      foreignKey: "batch_id",
      as: "batch",
    });

    Student.hasMany(models.Attendance, {
      foreignKey: "student_id",
      as: "attendances",
    });

    // Many-to-many with courses through enrollments (if needed)
    Student.belongsToMany(models.Course, {
      through: "student_courses",
      foreignKey: "student_id",
      otherKey: "course_id",
      as: "courses",
    });
  }
}

Student.init(
  {
    student_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "user_id",
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },
    roll_number: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "departments",
        key: "department_id",
      },
    },
    section_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "sections",
        key: "section_id",
      },
    },
    batch_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "batches",
        key: "batch_id",
      },
    },
    semester: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 8,
      },
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false, // This matches the database constraint
      validate: {
        min: 1,
        max: 8,
      },
    },
    contact_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    parent_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    parent_contact: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "students",
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["roll_number"],
      },
    ],
  }
);

export default Student;
