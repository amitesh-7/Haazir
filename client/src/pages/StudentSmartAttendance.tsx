import React from "react";
import { useHistory } from "react-router-dom";
import SmartAttendanceScanner from "../components/student/SmartAttendanceScanner";
import { useAuth } from "../hooks/useAuth";

const StudentSmartAttendance: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();

  // Get student ID from multiple possible locations in user object
  const studentId =
    user?.studentId ||
    (user as any)?.student_id ||
    (user as any)?.profile?.student_id ||
    user?.id;

  const handleSuccess = () => {
    // Navigate to attendance view after successful scan and verification
    history.push("/student/attendance");
  };

  if (!studentId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">
            Student ID not found. Please log in again or contact support.
          </p>
          <button
            onClick={() => history.push("/student")}
            className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <SmartAttendanceScanner studentId={studentId} onSuccess={handleSuccess} />
  );
};

export default StudentSmartAttendance;
