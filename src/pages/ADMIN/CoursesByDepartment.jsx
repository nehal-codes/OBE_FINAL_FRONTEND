import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { adminApi } from "../../apis/admin/adminApi";
import {
  FiBook,
  FiGrid,
  FiUsers,
  FiArrowLeft,
  FiLoader,
  FiChevronRight,
  FiHome,
  FiUser,
  FiClipboard,
  FiCheckCircle,
} from "react-icons/fi";

const CoursesByDepartment = () => {
  const { departmentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState("all");

  useEffect(() => {
    fetchCourses();
  }, [departmentId]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getCoursesByDepartment(departmentId);
      setData(response.data);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const getCourseTypeColor = (type) => {
    switch (type) {
      case "THEORY":
        return "bg-blue-100 text-blue-700";
      case "PRACTICAL":
        return "bg-emerald-100 text-emerald-700";
      case "BOTH":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FiLoader className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
        {error}
      </div>
    );
  }

  const semesters = data?.semesters || [];
  const filteredSemesters =
    selectedSemester === "all"
      ? semesters
      : semesters.filter((s) => s.semester === parseInt(selectedSemester));

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 flex-wrap">
        <Link
          to="/admin"
          className="hover:text-blue-600 flex items-center gap-1"
        >
          <FiHome /> Dashboard
        </Link>
        <FiChevronRight className="text-gray-400" />
        {data?.breadcrumb?.map((item, index) => (
          <React.Fragment key={index}>
            {item.path ? (
              <Link to={item.path} className="hover:text-blue-600">
                {item.level}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium">{item.level}</span>
            )}
            {index < data.breadcrumb.length - 1 && (
              <FiChevronRight className="text-gray-400" />
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft className="text-xl text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {data?.department?.name}
            </h1>
            <p className="text-gray-600 mt-1">
              {data?.department?.code} • {data?.department?.program?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Department Info & HOD */}
      {data?.department?.hod && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiUser className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Head of Department</p>
              <p className="font-semibold text-gray-900">
                {data.department.hod.name}
              </p>
              <p className="text-sm text-gray-600">
                {data.department.hod.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Courses</p>
          <p className="text-2xl font-bold text-gray-900">
            {data?.summary?.totalCourses}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Credits</p>
          <p className="text-2xl font-bold text-gray-900">
            {data?.summary?.totalCredits}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total CLOs</p>
          <p className="text-2xl font-bold text-gray-900">
            {data?.summary?.totalCLOs}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Assessments</p>
          <p className="text-2xl font-bold text-gray-900">
            {data?.summary?.totalAssessments}
          </p>
        </div>
      </div>

      {/* Semester Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedSemester("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
            ${
              selectedSemester === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
          All Semesters
        </button>
        {semesters.map((sem) => (
          <button
            key={sem.semester}
            onClick={() => setSelectedSemester(sem.semester)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
              ${
                selectedSemester === sem.semester.toString()
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            Semester {sem.semester}
          </button>
        ))}
      </div>

      {/* Courses by Semester */}
      <div className="space-y-8">
        {filteredSemesters.map((semester) => (
          <div
            key={semester.semester}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Semester {semester.semester}
                </h2>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">
                    <span className="font-medium">
                      {semester.courses.length}
                    </span>{" "}
                    Courses
                  </span>
                  <span className="text-gray-600">
                    <span className="font-medium">{semester.totalCredits}</span>{" "}
                    Credits
                  </span>
                  <span className="text-gray-600">
                    <span className="font-medium">{semester.totalCLOs}</span>{" "}
                    CLOs
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {semester.courses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => navigate(`/admin/course/${course.id}`)}
                    className="group border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-200 transition-all text-left"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                          {course.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {course.code}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getCourseTypeColor(course.type)}`}
                      >
                        {course.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm mb-3">
                      <span className="text-gray-600">
                        {course.credits} Credits
                      </span>
                      {course.category && (
                        <span className="text-gray-600">{course.category}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <FiClipboard className="text-gray-400" />
                        <span>{course._count.clos} CLOs</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiCheckCircle className="text-gray-400" />
                        <span>{course._count.assessments} Assessments</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiUsers className="text-gray-400" />
                        <span>{course._count.enrollments} Students</span>
                      </div>
                    </div>

                    {course.description && (
                      <p className="text-sm text-gray-600 mt-3 line-clamp-2 border-t border-gray-100 pt-3">
                        {course.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSemesters.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <FiBook className="text-4xl text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No courses found for this department</p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Add First Course
          </button>
        </div>
      )}
    </div>
  );
};

export default CoursesByDepartment;
