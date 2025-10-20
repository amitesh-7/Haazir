import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface AttendanceAttributes {
  attendance_id: number;
  schedule_id: number;
  student_id: number;
  date: Date;
  status: 'present' | 'absent';
  created_at?: Date;
  updated_at?: Date;
}

interface AttendanceCreationAttributes extends Optional<AttendanceAttributes, 'attendance_id' | 'created_at' | 'updated_at'> {}

export class Attendance extends Model<AttendanceAttributes, AttendanceCreationAttributes> implements AttendanceAttributes {
    public attendance_id!: number;
    public schedule_id!: number;
    public student_id!: number;
    public date!: Date;
    public status!: 'present' | 'absent';

    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    // Association helpers
    static associate(models: any) {
      Attendance.belongsTo(models.Timetable, {
        foreignKey: 'schedule_id',
        as: 'timetable'
      });

      Attendance.belongsTo(models.Student, {
        foreignKey: 'student_id',
        as: 'student'
      });
    }
}

Attendance.init({
    attendance_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    schedule_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'timetable',
            key: 'schedule_id',
        },
        allowNull: false,
    },
    student_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'students',
            key: 'student_id',
        },
        allowNull: false,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('present', 'absent'),
        allowNull: false,
    },
}, {
    sequelize,
    tableName: 'attendance',
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['schedule_id', 'student_id', 'date']
        }
    ]
});

export default Attendance;