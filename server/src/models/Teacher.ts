import { Model, DataTypes, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface TeacherAttributes {
  teacher_id: number;
  user_id: number;
  name: string;
  department_id: number;
  created_at?: Date;
  updated_at?: Date;
}

interface TeacherCreationAttributes
  extends Optional<
    TeacherAttributes,
    "teacher_id" | "created_at" | "updated_at"
  > {}

class Teacher
  extends Model<TeacherAttributes, TeacherCreationAttributes>
  implements TeacherAttributes
{
  public teacher_id!: number;
  public user_id!: number;
  public name!: string;
  public department_id!: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association helpers
  static associate(models: any) {
    Teacher.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });

    Teacher.belongsTo(models.Department, {
      foreignKey: "department_id",
      as: "department",
    });

    Teacher.hasMany(models.Timetable, {
      foreignKey: "teacher_id",
      as: "timetables",
    });

    // Many-to-many with courses through teacher_courses junction table
    Teacher.belongsToMany(models.Course, {
      through: "teacher_courses",
      foreignKey: "teacher_id",
      otherKey: "course_id",
      as: "courses",
    });
  }
}

Teacher.init(
  {
    teacher_id: {
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
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "departments",
        key: "department_id",
      },
    },
  },
  {
    sequelize,
    tableName: "teachers",
    underscored: true,
  }
);

export default Teacher;
