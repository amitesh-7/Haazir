import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface NotificationAttributes {
  id: number;
  user_id: number;
  user_role: string;
  type: string;
  title: string;
  message: string;
  related_data?: any;
  is_read: boolean;
  priority: string;
  created_at?: Date;
  read_at?: Date;
}

interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'is_read' | 'created_at' | 'read_at' | 'related_data' | 'priority' | 'user_role'> {}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: number;
  public user_id!: number;
  public user_role!: string;
  public type!: string;
  public title!: string;
  public message!: string;
  public related_data?: any;
  public is_read!: boolean;
  public priority!: string;
  public readonly created_at!: Date;
  public read_at?: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    user_role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'student',
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    related_data: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    priority: {
      type: DataTypes.STRING(20),
      defaultValue: 'normal',
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    timestamps: false, // We're managing created_at manually
  }
);

export default Notification;
