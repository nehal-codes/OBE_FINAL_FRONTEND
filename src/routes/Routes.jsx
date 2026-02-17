import { Route, Routes, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import NotFound from "../pages/NotFound/NotFound";
import ProtectedRoute from "../components/ProtectedRoutes/ProtectedRoute";
import Layout from "../components/Layout";
import Dashboard from "../pages/HOD/Dashboard";
import CourseManagement from "../pages/HOD/CourseManagement";
import CLOList from "../pages/HOD/CLOSetup/CLOList";
import CLOCount from "../pages/HOD/CLOSetup/CLOCount";
import CLOForm from "../pages/HOD/CLOSetup/CLOForm";
import CLOMapping from "../pages/HOD/CLOSetup/CLOMapping";
import AssignFaculty from "../pages/HOD/AssignFaculty/AssignFaculty";
import AssignmentsDashboard from "../pages/HOD/AssignmentsDashboard";
import ProgramReports from "../pages/HOD/ProgramReports";
import CourseDetails from "../pages/FACULTY/CourseDetails";
import FacultyDashboard from "../pages/FACULTY/Dashboard";
import FacultyAssignments from "../pages/FACULTY/FacultyAssignments";
import AssessmentDashboard from "../pages/FACULTY/Assessmentdashboard";

export const AppRoutes = () => {
  console.log("Routes loaded");
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/login" element={<Login />} />

      {/* TEST ROUTE */}
      <Route path="/test" element={<h1>TEST ROUTE</h1>} />

      {/* PROTECTED HOD ROUTES */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={["HOD"]}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/faculty-assignment"
          element={
            <ProtectedRoute allowedRoles={["HOD"]}>
              <AssignmentsDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          index
          element={
            <ProtectedRoute allowedRoles={["HOD"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute allowedRoles={["HOD"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="hod/courses"
          element={
            <ProtectedRoute allowedRoles={["HOD"]}>
              <CourseManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="hod/courses/:courseId/assign-faculty"
          element={
            <ProtectedRoute allowedRoles={["HOD"]}>
              <AssignFaculty />
            </ProtectedRoute>
          }
        />
        <Route
          path="hod/courses/:courseId/clos"
          element={
            <ProtectedRoute allowedRoles={["HOD"]}>
              <CLOList />
            </ProtectedRoute>
          }
        />
        <Route
          path="hod/courses/:courseId/clo-count"
          element={
            <ProtectedRoute allowedRoles={["HOD"]}>
              <CLOCount />
            </ProtectedRoute>
          }
        />
        <Route
          path="hod/courses/:courseId/create-clos/:count"
          element={
            <ProtectedRoute allowedRoles={["HOD"]}>
              <CLOForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="hod/courses/:courseId/clo-mapping"
          element={
            <ProtectedRoute allowedRoles={["HOD"]}>
              <CLOMapping />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/reports/program"
          element={
            <ProtectedRoute allowedRoles={["HOD"]}>
              <ProgramReports />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* PROTECTED FACULTY ROUTES */}
      <Route
        path="/faculty"
        element={
          <ProtectedRoute allowedRoles={["FACULTY"]}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <ProtectedRoute allowedRoles={["FACULTY"]}>
              <Navigate to="dashboard" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute allowedRoles={["FACULTY"]}>
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="assignments"
          element={
            <ProtectedRoute allowedRoles={["FACULTY"]}>
              <FacultyAssignments />
            </ProtectedRoute>
          }
        />
        <Route
          path="courses/:courseId"
          element={
            <ProtectedRoute allowedRoles={["FACULTY"]}>
              <CourseDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="courses/:courseId/assessments"
          element={
            <ProtectedRoute allowedRoles={["FACULTY"]}>
              <AssessmentDashboard />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* UNAUTHORIZED PAGE */}
      <Route
        path="/unauthorized"
        element={
          <div className="text-center mt-20 text-red-600 text-xl">
            You are not authorized to access this page.
          </div>
        }
      />

      {/* 404 PAGE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
