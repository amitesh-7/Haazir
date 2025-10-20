import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

// Smart Attendance Record attributes
interface SmartAttendanceRecordAttributes {
  record_id: number;
  session_id: string;
  student_id: number;
  schedule_id: number;
  date: Date;
  status: "present" | "absent";
  verified_by_scan: boolean;
  verified_by_class_photo: boolean;
  manually_marked: boolean;
  marked_by_teacher_id?: number;
  notification_sent: boolean;
  notification_sent_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface SmartAttendanceRecordCreationAttributes
  extends Optional<
    SmartAttendanceRecordAttributes,
    "record_id" | "created_at" | "updated_at"
  > {}

class SmartAttendanceRecord
  extends Model<
    SmartAttendanceRecordAttributes,
    SmartAttendanceRecordCreationAttributes
  >
  implements SmartAttendanceRecordAttributes
{
  public record_id!: number;
  public session_id!: string;
  public student_id!: number;
  public schedule_id!: number;
  public date!: Date;
  public status!: "present" | "absent";
  public verified_by_scan!: boolean;
  public verified_by_class_photo!: boolean;
  public manually_marked!: boolean;
  public marked_by_teacher_id?: number;
  public notification_sent!: boolean;
  public notification_sent_at?: Date;
  public created_at?: Date;
  public updated_at?: Date;
}

SmartAttendanceRecord.init(
  {
    record_id: {
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
    schedule_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: "present",
    },
    verified_by_scan: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verified_by_class_photo: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    manually_marked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    marked_by_teacher_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    notification_sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    notification_sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "smart_attendance_records",
    timestamps: false,
  }
);

export default SmartAttendanceRecord;
