import { Model, DataTypes, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface TimetableAttributes {
  schedule_id: number;
  course_id: number;
  teacher_id: number;
  section_id?: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  classroom?: string;
  // batch_id?: number;
  class_type: string;
  // target_audience?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface TimetableCreationAttributes
  extends Optional<
    TimetableAttributes,
    | "schedule_id"
    | "created_at"
    | "updated_at"
    | "section_id"
    | "classroom"
    // | "batch_id"
    // | "target_audience"
  > {}

class Timetable
  extends Model<TimetableAttributes, TimetableCreationAttributes>
  implements TimetableAttributes
{
  public schedule_id!: number;
  public course_id!: number;
  public teacher_id!: number;
  public section_id!: number;
  public day_of_week!: string;
  public start_time!: string;
  public end_time!: string;
  public classroom!: string;
  // public batch_id!: number;
  public class_type!: string;
  // public target_audience!: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association helpers
  static associate(models: any) {
    Timetable.belongsTo(models.Course, {
      foreignKey: "course_id",
      as: "course",
    });

    Timetable.belongsTo(models.Teacher, {
      foreignKey: "teacher_id",
      as: "teacher",
    });

    Timetable.belongsTo(models.Section, {
      foreignKey: "section_id",
      as: "section",
    });

    Timetable.belongsTo(models.Batch, {
      foreignKey: "batch_id",
      as: "batch",
    });

    Timetable.hasMany(models.Attendance, {
      foreignKey: "schedule_id",
      as: "attendances",
    });
  }
}

Timetable.init(
  {
    schedule_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "courses",
        key: "course_id",
      },
    },
    teacher_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "teachers",
        key: "teacher_id",
      },
    },
    day_of_week: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [
          [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
        ],
      },
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    classroom: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [1, 50],
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
    // batch_id: {
    //   type: DataTypes.INTEGER,
    //   allowNull: true,
    //   references: {
    //     model: "batches",
    //     key: "batch_id",
    //   },
    // },
    class_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "lecture",
      validate: {
        isIn: [["lecture", "lab", "tutorial", "Lecture", "Lab", "Tutorial"]],
      },
    },
    // target_audience: {
    //   type: DataTypes.STRING(20),
    //   allowNull: true,
    //   defaultValue: "Section",
    //   validate: {
    //     isIn: [["Section", "Batch"]],
    //   },
    // },
  },
  {
    sequelize,
    modelName: "Timetable",
    tableName: "timetable",
    underscored: true,
  }
);

export default Timetable;
