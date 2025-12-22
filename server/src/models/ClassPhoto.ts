import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

/**
 * ClassPhoto model - stores class photos captured by teachers for dual verification
 */
interface ClassPhotoAttributes {
  id: string;
  session_id: string;
  teacher_id: number;
  image_url?: string;
  total_faces_detected: number;
  matched_faces: number;
  unmatched_faces: number;
  processing_time_ms?: number;
  created_at?: Date;
}

interface ClassPhotoCreationAttributes
  extends Optional<
    ClassPhotoAttributes,
    "id" | "image_url" | "processing_time_ms" | "created_at"
  > {}

class ClassPhoto
  extends Model<ClassPhotoAttributes, ClassPhotoCreationAttributes>
  implements ClassPhotoAttributes
{
  public id!: string;
  public session_id!: string;
  public teacher_id!: number;
  public image_url?: string;
  public total_faces_detected!: number;
  public matched_faces!: number;
  public unmatched_faces!: number;
  public processing_time_ms?: number;
  public created_at?: Date;
}

ClassPhoto.init(
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
    teacher_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    total_faces_detected: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    matched_faces: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    unmatched_faces: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    processing_time_ms: {
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
    tableName: "class_photos",
    timestamps: false,
  }
);

// Define associations
(ClassPhoto as any).associate = (models: any) => {
  ClassPhoto.belongsTo(models.AttendanceSession, {
    foreignKey: "session_id",
    as: "session",
  });
  ClassPhoto.belongsTo(models.User, {
    foreignKey: "teacher_id",
    as: "teacher",
  });
  ClassPhoto.hasMany(models.ClassPhotoFace, {
    foreignKey: "class_photo_id",
    as: "faces",
  });
};

export default ClassPhoto;
