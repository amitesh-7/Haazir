import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from "react-router-dom";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { ToastProvider } from "./components/common/Toast";
import { LenisProvider } from "./contexts/LenisContext";
import ScrollToTopOnRouteChange from "./components/common/ScrollToTopOnRouteChange";
import LandingPage from "./pages/LandingPage";
import LandingPageNew from "./pages/LandingPageNew";
import PricingPage from "./pages/PricingPage";
import FeaturesPage from "./pages/FeaturesPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import Login from "./pages/Login";
import EnhancedLogin from "./pages/EnhancedLogin";
import Layout from "./components/common/Layout";
import Dashboard from "./components/coordinator/Dashboard";
import CoordinatorDashboard from "./pages/CoordinatorDashboard";
import StudentManagement from "./components/coordinator/StudentManagement";
import EnhancedStudentManagement from "./components/coordinator/EnhancedStudentManagement";
import StudentProfileDashboard from "./components/coordinator/StudentProfileDashboard";
import TeacherManagement from "./components/coordinator/TeacherManagement";
import CourseManagement from "./components/coordinator/CourseManagement";
import TimetableManagement from "./components/coordinator/TimetableManagement";
import DepartmentManagement from "./components/coordinator/DepartmentManagement";
import AttendancePage from "./components/coordinator/AttendancePage";
import AnalyticsDashboard from "./components/coordinator/AnalyticsDashboard";
import StudentEnrollment from "./components/coordinator/StudentEnrollment";
import TeacherDashboard from "./pages/TeacherDashboard";
import EnhancedTeacherDashboard from "./pages/EnhancedTeacherDashboard";
import EnhancedTeacherTimetable from "./pages/EnhancedTeacherTimetable";
import EnhancedStudentDashboard from "./pages/EnhancedStudentDashboard";
import Profile from "./pages/Profile";
import StudentProfile from "./pages/StudentProfile";
import EnhancedStudentProfile from "./pages/EnhancedStudentProfile";
import MyTimetable from "./pages/MyTimetable";
import EnhancedMyTimetable from "./pages/EnhancedMyTimetable";
import NotificationCenter from "./pages/NotificationCenter";
import TakeAttendance from "./components/teacher/TakeAttendance";
import EnhancedStudentAttendance from "./pages/EnhancedStudentAttendance";
import EnhancedGradeTracker from "./components/student/EnhancedGradeTracker";
import StudentSmartAttendance from "./pages/StudentSmartAttendance";
import StudentFaceEnrollment from "./pages/StudentFaceEnrollment";
import EnhancedAnnouncementSystem from "./components/student/EnhancedAnnouncementSystem";
import EnhancedResultManagement from "./components/coordinator/EnhancedResultManagement";
import TeacherAttendanceDashboard from "./components/teacher/TeacherAttendanceDashboard";
import StudentCourseEnrollment from "./components/coordinator/StudentCourseEnrollment";
import AttendanceReportsDashboard from "./components/coordinator/AttendanceReportsDashboard";
import StudentAttendanceView from "./components/student/StudentAttendanceView";
import AttendanceHistoryCalendar from "./components/teacher/AttendanceHistoryCalendar";
import UnifiedAttendanceHistory from "./components/teacher/UnifiedAttendanceHistory";
import SmartAttendanceDashboard from "./components/teacher/SmartAttendanceDashboard";
import SmartDataEntryPage from "./pages/SmartDataEntryPage";
import SmartTimetableGenerator from "./pages/SmartTimetableGenerator";
import TimetableResults from "./pages/TimetableResultsClean";
import CourseDetailPage from "./pages/CourseDetailPage";
import EnhancedAttendanceStats from "./pages/EnhancedAttendanceStats";

const getRole = (): string | null => {
  try {
    const raw = localStorage.getItem("user");
    const u = raw ? JSON.parse(raw) : null;
    return u?.role || null;
  } catch {
    return null;
  }
};

const getToken = (): string | null => {
  return localStorage.getItem("token");
};

interface PrivateRouteProps {
  path: string;
  exact?: boolean;
  roles: string[];
  component?: React.ComponentType<any>;
  render?: () => React.ReactElement;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  roles,
  component: Component,
  render,
  ...rest
}) => (
  <Route
    {...rest}
    render={(props) => {
      console.log(
        "🔐 PrivateRoute checking:",
        props.location.pathname,
        "Required roles:",
        roles
      );
      const token = getToken();
      const role = getRole();
      console.log("👤 Current role:", role, "Has token:", !!token);

      if (!token || !role) {
        console.log("❌ No token/role - redirecting to login");
        return (
          <Redirect
            to={{ pathname: "/login", state: { from: props.location } }}
          />
        );
      }

      if (!roles.includes(role)) {
        console.log("❌ Role mismatch - user is", role, "but needs", roles);
        // Redirect to appropriate dashboard based on role
        const dashboardPaths = {
          coordinator: "/coordinator",
          teacher: "/teacher",
          student: "/student",
        };
        return (
          <Redirect
            to={dashboardPaths[role as keyof typeof dashboardPaths] || "/login"}
          />
        );
      }

      console.log("✅ Access granted to", props.location.pathname);
      if (render) return render();
      if (Component) return <Component {...props} />;
      return null;
    }}
  />
);

// Route configurations by role for better organization
const coordinatorRoutes = [
  { path: "/coordinator", component: CoordinatorDashboard, exact: true },
  { path: "/students", component: EnhancedStudentManagement, exact: false },
  { path: "/students/:id", component: StudentProfileDashboard, exact: false },
  { path: "/teachers", component: TeacherManagement, exact: false },
  { path: "/courses", component: CourseManagement, exact: false },
  { path: "/departments", component: DepartmentManagement, exact: false },
  {
    path: "/timetable/generate",
    component: SmartTimetableGenerator,
    exact: false,
  }, // More specific route first
  { path: "/timetable/results", component: TimetableResults, exact: false }, // Results page
  { path: "/timetable", component: TimetableManagement, exact: false },
  { path: "/attendance", component: AttendancePage, exact: true },
  {
    path: "/attendance/reports",
    component: AttendanceReportsDashboard,
    exact: false,
  },
  {
    path: "/students/enrollment",
    component: StudentCourseEnrollment,
    exact: false,
  },
  { path: "/analytics", component: AnalyticsDashboard, exact: false },
  { path: "/results", component: EnhancedResultManagement, exact: false },
  {
    path: "/coordinator/student-enrollment",
    component: StudentEnrollment,
    exact: false,
  },
  { path: "/smart-data-entry", component: SmartDataEntryPage, exact: false },
];

const teacherRoutes = [
  { path: "/teacher", component: EnhancedTeacherDashboard, exact: true },
  { path: "/teacher/dashboard", component: TeacherDashboard, exact: true },
  { path: "/my-timetable", component: EnhancedTeacherTimetable, exact: true },
  {
    path: "/teacher/timetable",
    component: EnhancedTeacherTimetable,
    exact: true,
  },
  { path: "/attendance/take", component: TakeAttendance, exact: false },
  {
    path: "/teacher/attendance",
    component: TeacherAttendanceDashboard,
    exact: false,
  },
  {
    path: "/teacher/attendance/history",
    component: UnifiedAttendanceHistory,
    exact: false,
  },
  {
    path: "/teacher/smart-attendance",
    component: SmartAttendanceDashboard,
    exact: false,
  },
];

const studentRoutes = [
  { path: "/student", component: EnhancedStudentDashboard, exact: true },
  {
    path: "/attendance/me",
    component: EnhancedStudentAttendance,
    exact: false,
  },
  {
    path: "/student/attendance",
    component: StudentAttendanceView,
    exact: false,
  },
  {
    path: "/student/attendance/stats",
    component: EnhancedAttendanceStats,
    exact: false,
  },
  {
    path: "/student/course/:courseId",
    component: CourseDetailPage,
    exact: false,
  },
  {
    path: "/student/face-enrollment",
    component: StudentFaceEnrollment,
    exact: false,
  },
  {
    path: "/student/smart-attendance",
    component: StudentSmartAttendance,
    exact: false,
  },
  { path: "/student/profile", component: EnhancedStudentProfile, exact: false },
  { path: "/student/grades", component: EnhancedGradeTracker, exact: false },
  {
    path: "/student/announcements",
    component: EnhancedAnnouncementSystem,
    exact: false,
  },
  {
    path: "/student/notifications",
    component: NotificationCenter,
    exact: false,
  },
];

const sharedRoutes = [
  {
    path: "/my-timetable",
    component: EnhancedMyTimetable,
    roles: ["teacher", "student"],
  },
  {
    path: "/profile",
    component: Profile,
    roles: ["coordinator", "teacher", "student"],
  },
];

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <LenisProvider
          options={{
            duration: 1.2,
            smoothWheel: true,
            smoothTouch: false, // Set to true for smooth touch scrolling on mobile
          }}
        >
          <Router>
            <ScrollToTopOnRouteChange />
            <Switch>
              {/* Public Routes */}
              <Route path="/" exact component={LandingPageNew} />
              <Route path="/landing" exact component={LandingPageNew} />
              <Route path="/landing-old" exact component={LandingPage} />
              <Route path="/pricing" exact component={PricingPage} />
              <Route path="/features" exact component={FeaturesPage} />
              <Route path="/about" exact component={AboutPage} />
              <Route path="/contact" exact component={ContactPage} />
              <Route path="/login" component={EnhancedLogin} />
              <Route path="/login-old" component={Login} />

              {/* Coordinator Routes */}
              {coordinatorRoutes.map(
                ({ path, component: Component, exact }) => (
                  <PrivateRoute
                    key={path}
                    path={path}
                    exact={exact}
                    roles={["coordinator"]}
                    render={() => (
                      <Layout>
                        <Component />
                      </Layout>
                    )}
                  />
                )
              )}

              {/* Teacher Routes */}
              {teacherRoutes.map(({ path, component: Component, exact }) => (
                <PrivateRoute
                  key={path}
                  path={path}
                  exact={exact}
                  roles={["teacher"]}
                  render={() => (
                    <Layout>
                      <Component />
                    </Layout>
                  )}
                />
              ))}

              {/* Student Routes */}
              {studentRoutes.map(({ path, component: Component, exact }) => (
                <PrivateRoute
                  key={path}
                  path={path}
                  exact={exact}
                  roles={["student"]}
                  render={() => (
                    <Layout>
                      <Component />
                    </Layout>
                  )}
                />
              ))}

              {/* Shared Routes */}
              {sharedRoutes.map(({ path, component: Component, roles }) => (
                <PrivateRoute
                  key={path}
                  path={path}
                  roles={roles}
                  render={() => (
                    <Layout>
                      <Component />
                    </Layout>
                  )}
                />
              ))}

              {/* 404 Route */}
              <Route
                path="*"
                render={() => {
                  const role = getRole();
                  const token = getToken();

                  if (!token || !role) {
                    return <Redirect to="/login" />;
                  }

                  // Redirect to appropriate dashboard for unknown routes
                  const dashboardPaths = {
                    coordinator: "/coordinator",
                    teacher: "/teacher",
                    student: "/student",
                  };

                  return (
                    <Redirect
                      to={
                        dashboardPaths[role as keyof typeof dashboardPaths] ||
                        "/login"
                      }
                    />
                  );
                }}
              />
            </Switch>
          </Router>
        </LenisProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
