import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

// Teacher Class Capture attributes
interface TeacherClassCaptureAttributes {
  capture_id: number;
  session_id: string;
  capture_timestamp?: Date;
  image_url: string;
  detected_faces_count: number;
  processed: boolean;
  processed_at?: Date;
}

interface TeacherClassCaptureCreationAttributes
  extends Optional<
    TeacherClassCaptureAttributes,
    "capture_id" | "capture_timestamp" | "processed_at"
  > {}

class TeacherClassCapture
  extends Model<
    TeacherClassCaptureAttributes,
    TeacherClassCaptureCreationAttributes
  >
  implements TeacherClassCaptureAttributes
{
  public capture_id!: number;
  public session_id!: string;
  public capture_timestamp?: Date;
  public image_url!: string;
  public detected_faces_count!: number;
  public processed!: boolean;
  public processed_at?: Date;
}

TeacherClassCapture.init(
  {
    capture_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    session_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    capture_timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    detected_faces_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    processed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "teacher_class_captures",
    timestamps: false,
  }
);

export default TeacherClassCapture;
