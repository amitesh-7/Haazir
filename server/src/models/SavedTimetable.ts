import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

interface SavedTimetableAttributes {
  id?: number;
  name: string;
  semester: string;
  department: string;
  section: string;
  entries: any[];
  gridSettings: any;
  createdBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

class SavedTimetable
  extends Model<SavedTimetableAttributes>
  implements SavedTimetableAttributes
{
  public id!: number;
  public name!: string;
  public semester!: string;
  public department!: string;
  public section!: string;
  public entries!: any[];
  public gridSettings!: any;
  public createdBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static associate(models: any) {
    SavedTimetable.belongsTo(models.User, {
      foreignKey: "createdBy",
      as: "creator",
    });
  }
}

SavedTimetable.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    semester: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "all",
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "all",
    },
    section: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "all",
    },
    entries: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    gridSettings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "user_id",
      },
    },
  },
  {
    sequelize,
    modelName: "SavedTimetable",
    tableName: "saved_timetables",
    timestamps: true,
    underscored: true,
  }
);

export default SavedTimetable;
