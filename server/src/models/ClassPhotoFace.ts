import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

/**
 * ClassPhotoFace model - detected faces from class photos with embeddings for matching
 */
interface ClassPhotoFaceAttributes {
  id: string;
  class_photo_id: string;
  face_index: number;
  embedding: number[]; // 512D vector stored as JSON
  bbox: number[]; // [x1, y1, x2, y2]
  confidence: number;
  age?: number;
  gender?: number; // 0 = female, 1 = male
  matched_student_id?: number;
  match_score?: number;
  created_at?: Date;
}

interface ClassPhotoFaceCreationAttributes
  extends Optional<
    ClassPhotoFaceAttributes,
    | "id"
    | "age"
    | "gender"
    | "matched_student_id"
    | "match_score"
    | "created_at"
  > {}

class ClassPhotoFace
  extends Model<ClassPhotoFaceAttributes, ClassPhotoFaceCreationAttributes>
  implements ClassPhotoFaceAttributes
{
  public id!: string;
  public class_photo_id!: string;
  public face_index!: number;
  public embedding!: number[];
  public bbox!: number[];
  public confidence!: number;
  public age?: number;
  public gender?: number;
  public matched_student_id?: number;
  public match_score?: number;
  public created_at?: Date;
}

ClassPhotoFace.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    class_photo_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    face_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    embedding: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    bbox: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    confidence: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    gender: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    matched_student_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    match_score: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "class_photo_faces",
    timestamps: false,
  }
);

// Define associations
(ClassPhotoFace as any).associate = (models: any) => {
  ClassPhotoFace.belongsTo(models.ClassPhoto, {
    foreignKey: "class_photo_id",
    as: "classPhoto",
  });
  ClassPhotoFace.belongsTo(models.Student, {
    foreignKey: "matched_student_id",
    as: "student",
  });
};

export default ClassPhotoFace;
