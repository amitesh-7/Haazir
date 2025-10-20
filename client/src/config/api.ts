/**
 * API Configuration
 * Centralized API URL configuration using environment variables
 *
 * Default: http://localhost:5000/api (for most contributors)
 * Override: Create .env.local file with REACT_APP_API_URL=http://localhost:5001/api
 */

// Base API URL configuration based on environment
const getApiBaseUrl = () => {
  // Production: Use relative path (proxied by Vercel)
  if (process.env.NODE_ENV === "production") {
    return process.env.REACT_APP_API_URL || "/api";
  }
  // Development: Use local backend
  return process.env.REACT_APP_API_URL || "http://localhost:5000/api";
};

export const API_BASE_URL = getApiBaseUrl();

// Remove trailing /api if present to get base URL for direct fetch calls
export const API_URL = API_BASE_URL.replace(/\/api$/, "");

// Helper function to construct API endpoint
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;

  // If endpoint already starts with 'api/', use API_URL base
  if (cleanEndpoint.startsWith("api/")) {
    return `${API_URL}/${cleanEndpoint}`;
  }

  // Otherwise, use API_BASE_URL which includes /api
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Export individual endpoints for commonly used routes
export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: getApiUrl("api/auth/login"),
  AUTH_REGISTER: getApiUrl("api/auth/register"),

  // Smart Attendance
  SMART_ATTENDANCE: {
    PROCESS_PHOTO: getApiUrl("api/smart-attendance/process-class-photo"),
    GENERATE_QR: getApiUrl("api/smart-attendance/generate-qr"),
    VALIDATE_QR: getApiUrl("api/smart-attendance/validate-qr"),
    VERIFY_FACE: getApiUrl("api/smart-attendance/verify-face"),
    REGISTER_FACE: getApiUrl("api/smart-attendance/register-face"),
    FINALIZE: getApiUrl("api/smart-attendance/finalize"),
    studentFaces: (studentId: string) =>
      getApiUrl(`api/smart-attendance/student/${studentId}/faces`),
    sessionStatus: (sessionId: string) =>
      getApiUrl(`api/smart-attendance/session/${sessionId}/status`),
  },

  // Timetable
  TIMETABLE: {
    teacherSchedule: (teacherId: string) =>
      getApiUrl(`api/timetable/teacher/${teacherId}`),
  },

  // AI & Testing
  AI_GENERATE_TEST: getApiUrl("api/ai-generate-test"),
  AI_TEST: getApiUrl("api/ai-test"),

  // Stats
  STATS_LIVE: getApiUrl("api/stats/live"),

  // Smart Timetable
  SMART_TIMETABLE_GENERATE: getApiUrl("api/smart-timetable/ai/generate"),
};

export default API_BASE_URL;
