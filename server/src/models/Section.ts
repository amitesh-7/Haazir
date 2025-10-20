import { Model, DataTypes, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface SectionAttributes {
  section_id: number;
  department_id: number;
  section_name: string;
  semester?: number | null;
  description?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

interface SectionCreationAttributes
  extends Optional<
    SectionAttributes,
    "section_id" | "created_at" | "updated_at"
  > {}

class Section
  extends Model<SectionAttributes, SectionCreationAttributes>
  implements SectionAttributes
{
  public section_id!: number;
  public department_id!: number;
  public section_name!: string;
  public semester!: number | null;
  public description!: string | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association helpers
  static associate(models: any) {
    Section.belongsTo(models.Department, {
      foreignKey: "department_id",
      as: "department",
    });

    Section.hasMany(models.Student, {
      foreignKey: "section_id",
      as: "students",
    });

    Section.hasMany(models.Batch, {
      foreignKey: "section_id",
      as: "batches",
    });
  }
}

Section.init(
  {
    section_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "departments",
        key: "department_id",
      },
    },
    section_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 50],
      },
    },
    semester: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 8,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "sections",
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["department_id", "section_name"],
      },
    ],
  }
);

export default Section;
