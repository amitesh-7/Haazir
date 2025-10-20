import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

class Batch extends Model {
  public batch_id!: number;
  public section_id!: number;
  public batch_name!: string;
  public batch_size!: number;
  public description!: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Association methods
  static associate(models: any) {
    // Batch belongs to Section
    Batch.belongsTo(models.Section, {
      foreignKey: "section_id",
      as: "section",
    });
  }
}

Batch.init(
  {
    batch_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    section_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "sections",
        key: "section_id",
      },
    },
    batch_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    batch_size: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
    },
    description: {
      type: DataTypes.TEXT,
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
    tableName: "batches",
    timestamps: false, // We're handling timestamps manually
    indexes: [
      {
        unique: true,
        fields: ["section_id", "batch_name"],
      },
    ],
  }
);

export default Batch;
