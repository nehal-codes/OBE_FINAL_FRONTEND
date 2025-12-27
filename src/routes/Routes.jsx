import { Route, Routes } from "react-router-dom";
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

export const AppRoutes = () => {
  console.log("✅ Routes loaded");
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/login" element={<Login />} />

      {/*test routes*/}
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
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* COURSE MANAGEMENT MAIN PAGE */}
        <Route path="hod/courses" element={<CourseManagement />} />

        {/* CLO WORKFLOW */}
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
      </Route>

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
