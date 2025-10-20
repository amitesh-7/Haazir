import React from "react";
import { useHistory } from "react-router-dom";
import FaceRegistration from "../components/student/FaceRegistration";
import { useAuth } from "../hooks/useAuth";

const StudentFaceEnrollment: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();

  // Get student ID from multiple possible locations in user object
  const studentId =
    user?.studentId ||
    (user as any)?.student_id ||
    (user as any)?.profile?.student_id ||
    user?.id;

  const handleComplete = () => {
    // Redirect to smart attendance scanner after enrollment
    history.push("/student/smart-attendance");
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            📸 Face Enrollment
          </h1>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <p className="text-blue-800 font-semibold mb-2">
              Before you can mark attendance using QR codes, you need to
              register your face.
            </p>
            <p className="text-blue-700 text-sm">
              This is a one-time process. We'll capture your face from 5
              different angles to ensure accurate verification during attendance
              marking.
            </p>
          </div>
        </div>

        <FaceRegistration studentId={studentId} onComplete={handleComplete} />
      </div>
    </div>
  );
};

export default StudentFaceEnrollment;
