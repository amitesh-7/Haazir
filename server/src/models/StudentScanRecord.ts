import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

// Student Scan Record attributes
interface StudentScanRecordAttributes {
  scan_id: number;
  session_id: string;
  student_id: number;
  scan_timestamp?: Date;
  scanned_at?: Date;
  face_image_url?: string;
  face_descriptor?: string;
  location_lat?: number;
  location_lng?: number;
  distance_from_class?: number;
  face_match_confidence?: number;
  face_match_score?: number;
  face_verified?: boolean;
  status: "pending" | "verified" | "rejected";
  verification_status?: string; // 'pending', 'self_verified', 'verified', 'suspicious'
  rejection_reason?: string;
  // Dual verification fields
  self_verification_embedding?: string;
  self_verification_confidence?: number;
  self_verification_bbox?: string;
  class_photo_match_score?: number;
  class_photo_face_index?: number;
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
  public scanned_at?: Date;
  public face_image_url?: string;
  public face_descriptor?: string;
  public location_lat?: number;
  public location_lng?: number;
  public distance_from_class?: number;
  public face_match_confidence?: number;
  public face_match_score?: number;
  public face_verified?: boolean;
  public status!: "pending" | "verified" | "rejected";
  public verification_status?: string;
  public rejection_reason?: string;
  // Dual verification fields
  public self_verification_embedding?: string;
  public self_verification_confidence?: number;
  public self_verification_bbox?: string;
  public class_photo_match_score?: number;
  public class_photo_face_index?: number;
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
    face_match_score: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    face_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    scanned_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: "pending",
    },
    verification_status: {
      type: DataTypes.STRING(20),
      defaultValue: "pending",
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Dual verification fields
    self_verification_embedding: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    self_verification_confidence: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    self_verification_bbox: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    class_photo_match_score: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    class_photo_face_index: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "student_scan_records",
    timestamps: false,
  }
);

// Define associations
(StudentScanRecord as any).associate = (models: any) => {
  StudentScanRecord.belongsTo(models.AttendanceSession, {
    foreignKey: "session_id",
    as: "session",
  });
  StudentScanRecord.belongsTo(models.Student, {
    foreignKey: "student_id",
    as: "student",
  });
};

export default StudentScanRecord;
