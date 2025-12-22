import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

/**
 * VerificationLog model - audit trail for all verification actions
 */
interface VerificationLogAttributes {
  id: string;
  session_id: string;
  student_id?: number;
  action: string; // 'self_verify', 'class_verify', 'manual_override', 'retinaface_verify'
  old_status?: string;
  new_status?: string;
  match_score?: number;
  metadata?: Record<string, any>;
  performed_by?: number;
  created_at?: Date;
}

interface VerificationLogCreationAttributes
  extends Optional<
    VerificationLogAttributes,
    | "id"
    | "student_id"
    | "old_status"
    | "new_status"
    | "match_score"
    | "metadata"
    | "performed_by"
    | "created_at"
  > {}

class VerificationLog
  extends Model<VerificationLogAttributes, VerificationLogCreationAttributes>
  implements VerificationLogAttributes
{
  public id!: string;
  public session_id!: string;
  public student_id?: number;
  public action!: string;
  public old_status?: string;
  public new_status?: string;
  public match_score?: number;
  public metadata?: Record<string, any>;
  public performed_by?: number;
  public created_at?: Date;
}

VerificationLog.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    session_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    old_status: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    new_status: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    match_score: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    performed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "verification_logs",
    timestamps: false,
  }
);

// Define associations
(VerificationLog as any).associate = (models: any) => {
  VerificationLog.belongsTo(models.AttendanceSession, {
    foreignKey: "session_id",
    as: "session",
  });
  VerificationLog.belongsTo(models.Student, {
    foreignKey: "student_id",
    as: "student",
  });
  VerificationLog.belongsTo(models.User, {
    foreignKey: "performed_by",
    as: "performer",
  });
};

export default VerificationLog;
