import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

// Attendance Session attributes
interface AttendanceSessionAttributes {
  session_id: string;
  schedule_id: number;
  teacher_id: number;
  location_lat?: number;
  location_lng?: number;
  qr_token: string;
  status: "active" | "expired" | "completed";
  expires_at: Date;
  created_at?: Date;
  completed_at?: Date;
}

interface AttendanceSessionCreationAttributes
  extends Optional<
    AttendanceSessionAttributes,
    "session_id" | "created_at" | "completed_at"
  > {}

class AttendanceSession
  extends Model<
    AttendanceSessionAttributes,
    AttendanceSessionCreationAttributes
  >
  implements AttendanceSessionAttributes
{
  public session_id!: string;
  public schedule_id!: number;
  public teacher_id!: number;
  public location_lat?: number;
  public location_lng?: number;
  public qr_token!: string;
  public status!: "active" | "expired" | "completed";
  public expires_at!: Date;
  public created_at?: Date;
  public completed_at?: Date;
}

AttendanceSession.init(
  {
    session_id: {
      type: DataTypes.STRING(100),
      primaryKey: true,
    },
    schedule_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    teacher_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    location_lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    location_lng: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    qr_token: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: "active",
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "attendance_sessions",
    timestamps: false,
  }
);

export default AttendanceSession;
