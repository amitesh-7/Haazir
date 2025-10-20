import { Model, DataTypes, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface CourseAttributes {
  course_id: number;
  course_code: string;
  course_name: string;
  department_id: number;
  semester?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface CourseCreationAttributes
  extends Optional<
    CourseAttributes,
    "course_id" | "created_at" | "updated_at"
  > {}

class Course
  extends Model<CourseAttributes, CourseCreationAttributes>
  implements CourseAttributes
{
  public course_id!: number;
  public course_code!: string;
  public course_name!: string;
  public department_id!: number;
  public semester?: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association helpers
  static associate(models: any) {
    Course.belongsTo(models.Department, {
      foreignKey: "department_id",
      as: "department",
    });

    Course.hasMany(models.Timetable, {
      foreignKey: "course_id",
      as: "timetables",
    });

    // Many-to-many with students through enrollments
    Course.belongsToMany(models.Student, {
      through: "student_courses",
      foreignKey: "course_id",
      otherKey: "student_id",
      as: "students",
    });

    // Many-to-many with teachers through teacher_courses junction table
    Course.belongsToMany(models.Teacher, {
      through: "teacher_courses",
      foreignKey: "course_id",
      otherKey: "teacher_id",
      as: "teachers",
    });
  }
}

Course.init(
  {
    course_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    course_code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false, // Changed: Allow same course code in different departments
      validate: {
        notEmpty: true,
        len: [2, 20],
      },
    },
    course_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 200],
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
    semester: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 8,
      },
    },
  },
  {
    sequelize,
    tableName: "courses",
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["course_code", "department_id"], // Composite unique: Same course can exist in different departments
        name: "unique_course_per_department",
      },
    ],
  }
);

export default Course;
