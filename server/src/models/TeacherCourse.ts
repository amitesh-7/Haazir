import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/database";

interface TeacherCourseAttributes {
  teacher_id: number;
  course_id: number;
  created_at?: Date;
  updated_at?: Date;
}

class TeacherCourse
  extends Model<TeacherCourseAttributes>
  implements TeacherCourseAttributes
{
  public teacher_id!: number;
  public course_id!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

TeacherCourse.init(
  {
    teacher_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: "teachers",
        key: "teacher_id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: "courses",
        key: "course_id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
  },
  {
    sequelize,
    tableName: "teacher_courses",
    underscored: true,
    timestamps: true,
  }
);

export default TeacherCourse;
