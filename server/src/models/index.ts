// Import database connection
import { sequelize } from '../config/database';

// Import all models
import User from './User';
import Department from './Department';
import Student from './Student';
import Teacher from './Teacher';
import Course from './Course';
import Section from './Section';
import Batch from './Batch';
import Timetable from './Timetable';
import Attendance from './Attendance';
import Notification from './Notification';
import SavedTimetable from './SavedTimetable';
import TeacherCourse from './TeacherCourse';
import AttendanceSession from './AttendanceSession';
import StudentFace from './StudentFace';
import StudentScanRecord from './StudentScanRecord';
import TeacherClassCapture from './TeacherClassCapture';
import DetectedClassFace from './DetectedClassFace';
import SmartAttendanceRecord from './SmartAttendanceRecord';
import SmartTimetableSolution from './SmartTimetableSolution';

// Initialize associations
const models = {
  User,
  Department,
  Student,
  Teacher,
  Course,
  Section,
  Batch,
  Timetable,
  Attendance,
  Notification,
  SavedTimetable,
  TeacherCourse,
  AttendanceSession,
  StudentFace,
  StudentScanRecord,
  TeacherClassCapture,
  DetectedClassFace,
  SmartAttendanceRecord,
  SmartTimetableSolution,
};

// Set up associations
Object.values(models).forEach((model: any) => {
  if (model.associate) {
    model.associate(models);
  }
});

// Export everything
export {
  sequelize,
  User,
  Department,
  Student,
  Teacher,
  Course,
  Section,
  Batch,
  Timetable,
  Attendance,
  Notification,
  SavedTimetable,
  TeacherCourse,
  AttendanceSession,
  StudentFace,
  StudentScanRecord,
  TeacherClassCapture,
  DetectedClassFace,
  SmartAttendanceRecord,
  SmartTimetableSolution,
};

export default models;