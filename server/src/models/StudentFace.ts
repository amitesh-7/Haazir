import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

// Student Face attributes
interface StudentFaceAttributes {
  face_id: number;
  student_id: number;
  face_descriptor: string; // JSON string
  image_url?: string;
  registered_at?: Date;
  is_active: boolean;
  updated_at?: Date;
}

interface StudentFaceCreationAttributes
  extends Optional<
    StudentFaceAttributes,
    "face_id" | "registered_at" | "updated_at"
  > {}

class StudentFace
  extends Model<StudentFaceAttributes, StudentFaceCreationAttributes>
  implements StudentFaceAttributes
{
  public face_id!: number;
  public student_id!: number;
  public face_descriptor!: string;
  public image_url?: string;
  public registered_at?: Date;
  public is_active!: boolean;
  public updated_at?: Date;
}

StudentFace.init(
  {
    face_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    face_descriptor: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    registered_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "student_faces",
    timestamps: false,
  }
);

export default StudentFace;
