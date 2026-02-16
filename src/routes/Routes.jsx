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
import AssignmentsDashboard from '../pages/HOD/AssignmentsDashboard';
import ProgramReports from "../pages/HOD/ProgramReports";
import CourseDetails from "../pages/FACULTY/CourseDetails";
import FacultyDashboard from "../pages/FACULTY/Dashboard";
import FacultyAssignments from "../pages/FACULTY/FacultyAssignments";
import AssessmentDashboard from "../pages/FACULTY/Assessmentdashboard";

export const AppRoutes = () => {
  console.log("✅ Routes loaded");
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
            <ProtectedRoute allowedRoles={['HOD']}>
              <AssignmentsDashboard />
            </ProtectedRoute>
          }
        />
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="hod/courses" element={<CourseManagement />} />
        <Route path="hod/courses/:courseId/assign-faculty" element={<AssignFaculty />} />
        <Route path="hod/courses/:courseId/clos" element={<CLOList />} />
        <Route path="hod/courses/:courseId/clo-count" element={<CLOCount />} />
        <Route
          path="hod/courses/:courseId/create-clos/:count"
          element={<CLOForm />}
        />
        {/* CLO mapping/review page */}
        <Route
          path="hod/courses/:courseId/clo-mapping"
          element={<CLOMapping />}
        />


        <Route
          path="/hod/reports/program"
          element={<ProgramReports />}
        />
      </Route>

      
      

        <Route path="hod/courses/:courseId/create-clos/:count" element={<CLOForm />} />
        <Route path="hod/courses/:courseId/clo-mapping" element={<CLOMapping />} />
        <Route path="hod/faculty-assignment" element={<AssignmentsDashboard />} />
        
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
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<FacultyDashboard />} />
        <Route path="assignments" element={<FacultyAssignments />} />
        <Route path="courses/:courseId" element={<CourseDetails />} />
        <Route path="courses/:courseId/assessments" element={<AssessmentDashboard />} />
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