import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

// Detected Class Face attributes
interface DetectedClassFaceAttributes {
  detection_id: number;
  capture_id: number;
  face_descriptor?: string;
  face_bbox?: object; // {x, y, width, height}
  matched_student_id?: number;
  confidence?: number;
}

interface DetectedClassFaceCreationAttributes
  extends Optional<DetectedClassFaceAttributes, "detection_id"> {}

class DetectedClassFace
  extends Model<
    DetectedClassFaceAttributes,
    DetectedClassFaceCreationAttributes
  >
  implements DetectedClassFaceAttributes
{
  public detection_id!: number;
  public capture_id!: number;
  public face_descriptor?: string;
  public face_bbox?: object;
  public matched_student_id?: number;
  public confidence?: number;
}

DetectedClassFace.init(
  {
    detection_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    capture_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    face_descriptor: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    face_bbox: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    matched_student_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    confidence: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "detected_class_faces",
    timestamps: false,
  }
);

export default DetectedClassFace;
