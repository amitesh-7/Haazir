import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface DepartmentAttributes {
  department_id: number;
  name: string;
  created_at?: Date;
  updated_at?: Date;
}

interface DepartmentCreationAttributes extends Optional<DepartmentAttributes, 'department_id' | 'created_at' | 'updated_at'> {}

class Department extends Model<DepartmentAttributes, DepartmentCreationAttributes> implements DepartmentAttributes {
  public department_id!: number;
  public name!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association helpers
  static associate(models: any) {
    Department.hasMany(models.Student, {
      foreignKey: 'department_id',
      as: 'students'
    });

    Department.hasMany(models.Teacher, {
      foreignKey: 'department_id',
      as: 'teachers'
    });

    Department.hasMany(models.Course, {
      foreignKey: 'department_id',
      as: 'courses'
    });
  }
}

Department.init({
  department_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
}, {
  sequelize,
  modelName: 'Department',
  tableName: 'departments',
  underscored: true,
});

export default Department;