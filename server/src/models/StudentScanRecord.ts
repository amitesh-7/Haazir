import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

// Student Scan Record attributes
interface StudentScanRecordAttributes {
  scan_id: number;
  session_id: string;
  student_id: number;
  scan_timestamp?: Date;
  face_image_url?: string;
  face_descriptor?: string;
  location_lat?: number;
  location_lng?: number;
  distance_from_class?: number;
  face_match_confidence?: number;
  status: "pending" | "verified" | "rejected";
  rejection_reason?: string;
}

interface StudentScanRecordCreationAttributes
  extends Optional<StudentScanRecordAttributes, "scan_id" | "scan_timestamp"> {}

class StudentScanRecord
  extends Model<
    StudentScanRecordAttributes,
    StudentScanRecordCreationAttributes
  >
  implements StudentScanRecordAttributes
{
  public scan_id!: number;
  public session_id!: string;
  public student_id!: number;
  public scan_timestamp?: Date;
  public face_image_url?: string;
  public face_descriptor?: string;
  public location_lat?: number;
  public location_lng?: number;
  public distance_from_class?: number;
  public face_match_confidence?: number;
  public status!: "pending" | "verified" | "rejected";
  public rejection_reason?: string;
}

StudentScanRecord.init(
  {
    scan_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    session_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    scan_timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    face_image_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    face_descriptor: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    location_lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    location_lng: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    distance_from_class: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    face_match_confidence: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: "pending",
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "student_scan_records",
    timestamps: false,
  }
);

export default StudentScanRecord;
