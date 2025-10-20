import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

// Define the attributes interface
interface SmartTimetableSolutionAttributes {
  id: number;
  solutionId: string;
  institutionName: string;
  academicYear: string;
  description?: string;
  solutionName: string;
  optimizationType: "teacher-focused" | "student-focused" | "balanced";
  overallScore: number;
  conflicts: number;
  qualityMetrics: {
    overall_score: number;
    teacher_satisfaction: number;
    student_satisfaction: number;
    resource_utilization: number;
  };
  timetableEntries: any[];
  metadata: {
    total_classes?: number;
    teachers_involved?: number;
    rooms_used?: number;
    conflicts_resolved?: number;
  };
  departmentId?: number;
  semester?: number;
  createdBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define creation attributes (fields optional during creation)
interface SmartTimetableSolutionCreationAttributes
  extends Optional<
    SmartTimetableSolutionAttributes,
    | "id"
    | "description"
    | "conflicts"
    | "departmentId"
    | "semester"
    | "createdBy"
    | "createdAt"
    | "updatedAt"
  > {}

class SmartTimetableSolution
  extends Model<
    SmartTimetableSolutionAttributes,
    SmartTimetableSolutionCreationAttributes
  >
  implements SmartTimetableSolutionAttributes
{
  public id!: number;
  public solutionId!: string;
  public institutionName!: string;
  public academicYear!: string;
  public description!: string;
  public solutionName!: string;
  public optimizationType!: "teacher-focused" | "student-focused" | "balanced";
  public overallScore!: number;
  public conflicts!: number;
  public qualityMetrics!: {
    overall_score: number;
    teacher_satisfaction: number;
    student_satisfaction: number;
    resource_utilization: number;
  };
  public timetableEntries!: any[];
  public metadata!: {
    total_classes?: number;
    teachers_involved?: number;
    rooms_used?: number;
    conflicts_resolved?: number;
  };
  public departmentId!: number;
  public semester!: number;
  public createdBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association method
  static associate(models: any) {
    SmartTimetableSolution.belongsTo(models.User, {
      foreignKey: "createdBy",
      as: "creator",
    });
    SmartTimetableSolution.belongsTo(models.Department, {
      foreignKey: "departmentId",
      as: "department",
    });
  }
}

SmartTimetableSolution.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    solutionId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: "solution_id",
    },
    institutionName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "institution_name",
      validate: {
        notEmpty: true,
      },
    },
    academicYear: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "academic_year",
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    solutionName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "solution_name",
      validate: {
        notEmpty: true,
      },
    },
    optimizationType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "optimization_type",
      validate: {
        isIn: [["teacher-focused", "student-focused", "balanced"]],
      },
    },
    overallScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      field: "overall_score",
      validate: {
        min: 0,
        max: 100,
      },
    },
    conflicts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    qualityMetrics: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      field: "quality_metrics",
    },
    timetableEntries: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: "timetable_entries",
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "department_id",
      references: {
        model: "departments",
        key: "department_id",
      },
    },
    semester: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "created_by",
      references: {
        model: "users",
        key: "user_id",
      },
    },
  },
  {
    sequelize,
    modelName: "SmartTimetableSolution",
    tableName: "smart_timetable_solutions",
    timestamps: true,
    underscored: true,
  }
);

export default SmartTimetableSolution;
