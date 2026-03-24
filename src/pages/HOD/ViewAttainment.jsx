import React, { useState, useEffect } from "react";
import {
  FiFilter,
  FiTrendingUp,
  FiBarChart2,
  FiUsers,
  FiTarget,
  FiChevronDown,
} from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import coursesAPI from "../../apis/HOD/courses.api";
import reportsAPI from "../../apis/HOD/reports.api";

const ViewAttainment = () => {
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [courses, setCourses] = useState([]);
  const [attainmentData, setAttainmentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { user } = useAuth();

  const semesters = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i,
  );

  // Fetch courses based on semester and year selection
  useEffect(() => {
    if (selectedSemester && selectedYear) {
      fetchCourses();
    }
  }, [selectedSemester, selectedYear]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const response = await coursesAPI.getCoursesByAcademicPeriod(
        selectedYear,
        selectedSemester,
        token,
      );

      setCourses(response.data || []);
      setSelectedCourse(""); // Reset course selection
      setAttainmentData(null);
    } catch (err) {
      setError("Failed to fetch courses. Please try again.");
      console.error(err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelect = async (courseId) => {
    setSelectedCourse(courseId);
    if (courseId) {
      fetchAttainmentData(courseId);
    }
  };

  const fetchAttainmentData = async (courseId) => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const response = await reportsAPI.getCourseAttainment(
        courseId,
        selectedYear,
        selectedSemester,
        token,
      );

      setAttainmentData(response.data);
    } catch (err) {
      setError("Failed to fetch attainment data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getAttainmentColor = (percentage) => {
    if (percentage >= 80) return "bg-green-100 text-green-800 border-green-300";
    if (percentage >= 70) return "bg-blue-100 text-blue-800 border-blue-300";
    if (percentage >= 60)
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  const getAttainmentBarColor = (percentage) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 70) return "bg-blue-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Course Attainment</h1>
        <p className="text-gray-600 mt-1">
          View student attainment of Course Learning Outcomes (CLOs)
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiFilter className="text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Select Course</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Year Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Academic Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select Year</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select Semester</option>
              {semesters.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
          </div>

          {/* Course Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => handleCourseSelect(e.target.value)}
              disabled={!selectedSemester || !selectedYear}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">
                {loading ? "Loading courses..." : "Select Course"}
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Attainment Overview - Only show when course is selected */}
      {attainmentData && (
        <>
          {/* Course Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {attainmentData.courseCode}: {attainmentData.courseName}
              </h3>
              <p className="text-gray-600 mt-1">
                {attainmentData.semester} {attainmentData.year} | Total
                Students:{" "}
                <span className="font-semibold">
                  {attainmentData.totalStudents}
                </span>
              </p>
            </div>
          </div>

          {/* Overall Attainment Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Overall Attainment */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Overall Attainment
                  </p>
                  <div className="mt-2">
                    <p className="text-3xl font-bold text-gray-900">
                      {attainmentData.overallAttainment}%
                    </p>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  <FiTrendingUp className="text-xl" />
                </div>
              </div>
            </div>

            {/* Excellent */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Excellent (90-100%)
                </p>
                <div className="mt-2 flex items-end justify-between">
                  <p className="text-3xl font-bold text-green-600">
                    {attainmentData.distribution.excellent}
                  </p>
                  <span className="text-xs text-gray-500">
                    {Math.round(
                      (attainmentData.distribution.excellent /
                        attainmentData.totalStudents) *
                        100,
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Good */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Good (75-89%)
                </p>
                <div className="mt-2 flex items-end justify-between">
                  <p className="text-3xl font-bold text-blue-600">
                    {attainmentData.distribution.good}
                  </p>
                  <span className="text-xs text-gray-500">
                    {Math.round(
                      (attainmentData.distribution.good /
                        attainmentData.totalStudents) *
                        100,
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Needs Improvement */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Needs Improvement
                </p>
                <div className="mt-2 flex items-end justify-between">
                  <p className="text-3xl font-bold text-red-600">
                    {attainmentData.distribution.needsImprovement}
                  </p>
                  <span className="text-xs text-gray-500">
                    {Math.round(
                      (attainmentData.distribution.needsImprovement /
                        attainmentData.totalStudents) *
                        100,
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CLO Attainment Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FiTarget className="text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  CLO Attainment Details
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left">
                      <span className="text-xs font-semibold text-gray-600 uppercase">
                        CLO Code
                      </span>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="text-xs font-semibold text-gray-600 uppercase">
                        Description
                      </span>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="text-xs font-semibold text-gray-600 uppercase">
                        Attainment
                      </span>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="text-xs font-semibold text-gray-600 uppercase">
                        Students Achieved
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attainmentData.clos.map((clo, index) => (
                    <tr
                      key={clo.id}
                      className={`border-b border-gray-200 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-blue-50 transition-colors`}
                    >
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">
                          {clo.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700">{clo.description}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getAttainmentBarColor(
                                clo.attainmentPercentage,
                              )}`}
                              style={{
                                width: `${clo.attainmentPercentage}%`,
                              }}
                            />
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full font-semibold text-sm border ${getAttainmentColor(
                              clo.attainmentPercentage,
                            )}`}
                          >
                            {clo.attainmentPercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FiUsers className="text-gray-400" />
                          <span className="text-gray-900">
                            {clo.studentCount}/{attainmentData.totalStudents}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Average CLO Attainment */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Avg CLO Attainment
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {Math.round(
                      attainmentData.clos.reduce(
                        (sum, clo) => sum + clo.attainmentPercentage,
                        0,
                      ) / attainmentData.clos.length,
                    )}
                    %
                  </p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                  <FiBarChart2 className="text-xl" />
                </div>
              </div>
            </div>

            {/* Highest Attained CLO */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Highest Attained CLO
                </p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {
                    attainmentData.clos.reduce((max, clo) =>
                      clo.attainmentPercentage > max.attainmentPercentage
                        ? clo
                        : max,
                    ).code
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.max(
                    ...attainmentData.clos.map((c) => c.attainmentPercentage),
                  )}
                  % attainment
                </p>
              </div>
            </div>

            {/* Lowest Attained CLO */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Lowest Attained CLO
                </p>
                <p className="text-2xl font-bold text-orange-600 mt-2">
                  {
                    attainmentData.clos.reduce((min, clo) =>
                      clo.attainmentPercentage < min.attainmentPercentage
                        ? clo
                        : min,
                    ).code
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.min(
                    ...attainmentData.clos.map((c) => c.attainmentPercentage),
                  )}
                  % attainment
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!attainmentData && selectedSemester && selectedYear && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FiBarChart2 className="text-5xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Select a Course
          </h3>
          <p className="text-gray-600">
            Choose a course from the list above to view attainment details
          </p>
        </div>
      )}
    </div>
  );
};

export default ViewAttainment;
